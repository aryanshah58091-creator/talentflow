from celery import shared_task
from django.db import transaction

@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def evaluate_resume_task(self, application_id):
    """
    Asynchronous Celery task for background ATS Resume Screening.
    Decouples AI processing from the user HTTP request-response cycle.
    """
    from .models import Application, Notification
    from .ai_agent import evaluate_application_with_ai

    try:
        app = Application.objects.select_related('job', 'candidate', 'job__recruiter').get(id=application_id)
    except Application.DoesNotExist:
        return {'status': 'not_found', 'application_id': application_id}

    try:
        result = evaluate_application_with_ai(app)
        
        with transaction.atomic():
            app.match_score = result.get('match_score')
            app.ai_summary = result.get('summary', '')
            app.ai_strengths = result.get('strengths', [])
            app.ai_weaknesses = result.get('weaknesses', []) or result.get('gaps', [])
            app.ai_recommendation = result.get('recommendation', '')
            app.ai_interview_questions = result.get('interview_questions', [])
            app.save(update_fields=[
                'match_score', 'ai_summary', 'ai_strengths',
                'ai_weaknesses', 'ai_recommendation', 'ai_interview_questions'
            ])

            # Notify recruiter of completed ATS screening
            if app.job and app.job.recruiter:
                score_str = f" (ATS Score: {app.match_score}%)" if app.match_score else ""
                candidate_name = app.candidate.get_full_name() or app.candidate.username
                Notification.objects.create(
                    user=app.job.recruiter,
                    title='ATS Resume Screening Complete',
                    message=f'{candidate_name}\'s resume was evaluated for {app.job.title}{score_str}. Recommendation: {app.ai_recommendation or "Reviewed"}.'
                )

        return {
            'status': 'success',
            'application_id': app.id,
            'match_score': app.match_score,
            'recommendation': app.ai_recommendation
        }
    except Exception as exc:
        print(f"[CeleryTask] Error evaluating application {application_id}: {exc}")
        # Retry with exponential backoff if transient failure
        try:
            raise self.retry(exc=exc)
        except Exception:
            return {'status': 'failed', 'error': str(exc)}


def dispatch_resume_evaluation(application):
    """
    Safe dispatcher that triggers the Celery task asynchronously.
    Supports both Celery worker execution and fallback local execution.
    """
    try:
        evaluate_resume_task.delay(application.id)
    except Exception as e:
        print(f"[TaskDispatcher] Celery delay failed, executing inline: {e}")
        evaluate_resume_task(application.id)
