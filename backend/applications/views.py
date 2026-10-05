from django.db import transaction, IntegrityError, models
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import serializers
from .models import (
    Application, StatusHistory, Interview, InterviewFeedback, Offer, SavedJob, Notification,
    Assessment, AssessmentQuestion, AssessmentAttempt
)
from .serializers import (
    ApplicationSerializer, InterviewSerializer, FeedbackSerializer, OfferSerializer, NotificationSerializer,
    AssessmentSerializer, AssessmentQuestionCandidateSerializer, AssessmentQuestionFullSerializer, AssessmentAttemptSerializer
)
from .ai_agent import evaluate_application_with_ai, generate_assessment_questions
from jobs.models import Job


class ApplicationListCreateView(generics.ListCreateAPIView):
    serializer_class=ApplicationSerializer
    def get_queryset(self):
        qs=Application.objects.select_related('job','candidate').prefetch_related('status_history').order_by('-applied_at')
        if getattr(self.request.user, 'role', '') == 'candidate':
            return qs.filter(candidate=self.request.user)
        if getattr(self.request.user, 'role', '') in ['recruiter', 'admin'] or getattr(self.request.user, 'is_staff', False):
            return qs
        return qs

    def create(self, request, *args, **kwargs):
        if getattr(request.user, 'role', '') == 'recruiter':
            return Response(
                {'detail': 'Recruiters cannot apply for jobs. Please log in with a candidate account.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        job_id = request.data.get('job')
        if not job_id:
            return Response({'detail': 'Job ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if Application.objects.filter(job_id=job_id, candidate=request.user).exists():
            return Response(
                {'detail': 'You have already applied for this job.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().create(request, *args, **kwargs)

    @transaction.atomic
    def perform_create(self, serializer):
        try:
            app = serializer.save(candidate=self.request.user)
        except IntegrityError:
            raise serializers.ValidationError({'detail': 'You have already applied for this job.'})
            
        # Automated PDF/Text Resume Extraction if resume_text is empty
        if not app.resume_text:
            profile = getattr(self.request.user, 'candidate_profile', None)
            if profile:
                primary_resume = profile.resumes.filter(is_primary=True).first() or profile.resumes.first()
                if primary_resume and primary_resume.file:
                    try:
                        from .resume_parser import parse_uploaded_resume
                        parsed = parse_uploaded_resume(primary_resume.file)
                        if parsed.get('extracted_text'):
                            app.resume_text = parsed['extracted_text']
                            app.resume_filename = parsed['filename']
                            app.save(update_fields=['resume_text', 'resume_filename'])
                    except Exception as e:
                        print(f"[ResumeParser] Auto-extraction error on apply: {e}")

        # Dispatch Asynchronous ATS Resume Screening via Celery Worker Queue
        from .tasks import dispatch_resume_evaluation
        dispatch_resume_evaluation(app)
            
        StatusHistory.objects.create(
            application=app,
            status=app.status,
            changed_by=self.request.user,
            notes='Application submitted with candidate resume.'
        )
        if app.job and app.job.recruiter:
            Notification.objects.create(
                user=app.job.recruiter,
                title='New Candidate Application',
                message=f'{self.request.user.get_full_name() or self.request.user.username} submitted an application for {app.job.title}.'
            )


class ApplicationDetailView(generics.RetrieveUpdateAPIView):
    queryset=Application.objects.select_related('job','candidate').prefetch_related('status_history'); serializer_class=ApplicationSerializer
    def update(self, request,*args,**kwargs):
        instance=self.get_object(); old=instance.status
        data=request.data.copy()
        if request.user.role == 'candidate':
            data.pop('status', None); data.pop('match_score', None)
        serializer=self.get_serializer(instance, data=data, partial=kwargs.pop('partial', False))
        serializer.is_valid(raise_exception=True); self.perform_update(serializer)
        instance.refresh_from_db()
        if old != instance.status:
            StatusHistory.objects.create(application=instance,status=instance.status,changed_by=request.user)
            if instance.status == 'shortlisted':
                Notification.objects.create(
                    user=instance.candidate,
                    title='Aptitude Assessment Unlocked!',
                    message=f'Congratulations! You have been shortlisted for {instance.job.title}. Please complete your 15-minute Online Aptitude & Skills Assessment to qualify for interview scheduling.'
                )
            elif instance.status == 'offer':
                Notification.objects.create(
                    user=instance.candidate,
                    title='Job Offer Extended! 🎉',
                    message=f'Congratulations! You have received a formal employment offer for {instance.job.title}. The recruitment team will reach out with onboarding materials.'
                )
            elif instance.status == 'hired':
                Notification.objects.create(
                    user=instance.candidate,
                    title='Welcome Aboard! 🚀 You are Hired',
                    message=f'Congratulations! You have been officially hired for {instance.job.title}. Welcome to the organization!'
                )
            else:
                Notification.objects.create(user=instance.candidate,title='Application updated',message=f'Your application for {instance.job.title} moved to {instance.get_status_display()}.')
        return Response(self.get_serializer(instance).data)

class InterviewListCreateView(generics.ListCreateAPIView):
    serializer_class = InterviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Interview.objects.select_related(
            'application__candidate', 'application__job__company', 'application__job__recruiter'
        ).prefetch_related('feedback_entries__interviewer')
        if getattr(self.request.user, 'role', '') in ['recruiter', 'admin'] or getattr(self.request.user, 'is_staff', False):
            return qs.order_by('interview_time')
        else:
            return qs.filter(application__candidate=self.request.user).order_by('interview_time')

    @transaction.atomic
    def perform_create(self, serializer):
        interview = serializer.save()
        app = interview.application
        if app.status in ['applied', 'screening', 'shortlisted']:
            app.status = 'interview'
            app.save(update_fields=['status'])
            StatusHistory.objects.create(
                application=app,
                status='interview',
                changed_by=self.request.user,
                notes=f'Interview scheduled for {interview.round}'
            )

        meeting_info = f" Meeting link: {interview.meeting_link}" if interview.meeting_link else ""
        time_str = interview.interview_time.strftime("%b %d, %Y at %I:%M %p")
        Notification.objects.create(
            user=interview.application.candidate,
            title='Interview Scheduled!',
            message=f'{interview.round} for {interview.application.job.title} has been scheduled for {time_str}.{meeting_info}'
        )

class InterviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = InterviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Interview.objects.select_related(
            'application__candidate', 'application__job__company', 'application__job__recruiter'
        ).prefetch_related('feedback_entries__interviewer')
        if getattr(self.request.user, 'role', '') in ['recruiter', 'admin'] or getattr(self.request.user, 'is_staff', False):
            return qs
        return qs.filter(application__candidate=self.request.user)

    def perform_update(self, serializer):
        old_status = self.get_object().status
        instance = serializer.save()
        if instance.status != old_status:
            if instance.status == 'completed':
                Notification.objects.create(
                    user=instance.application.candidate,
                    title='Interview Completed',
                    message=f'Your {instance.round} interview for {instance.application.job.title} has been marked as completed. Evaluator scorecards are being finalized.'
                )
            elif instance.status == 'cancelled':
                Notification.objects.create(
                    user=instance.application.candidate,
                    title='Interview Cancelled',
                    message=f'Your {instance.round} interview scheduled for {instance.application.job.title} has been cancelled.'
                )

class InterviewGenerateQuestionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if getattr(request.user, 'role', '') != 'recruiter' and not request.user.is_staff:
            return Response({'detail': 'Only recruiters can generate AI interview questions.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            interview = Interview.objects.select_related('application__candidate', 'application__job').get(pk=pk)
        except Interview.DoesNotExist:
            return Response({'detail': 'Interview not found.'}, status=status.HTTP_404_NOT_FOUND)

        app = interview.application
        res = evaluate_application_with_ai(app)
        questions = res.get('interview_questions', [])
        if questions:
            app.ai_interview_questions = questions
            app.save(update_fields=['ai_interview_questions'])

        return Response({
            'interview_id': interview.id,
            'ai_interview_questions': questions,
            'message': 'AI interview questions generated successfully.'
        }, status=status.HTTP_200_OK)

class InterviewFeedbackCreateView(generics.CreateAPIView):
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        interview_id = self.kwargs.get('pk')
        try:
            interview = Interview.objects.get(pk=interview_id)
        except Interview.DoesNotExist:
            raise serializers.ValidationError({'detail': 'Interview not found.'})
            
        feedback = serializer.save(interviewer=self.request.user, interview=interview)
        
        if interview.status == 'scheduled':
            interview.status = 'completed'

        interviewer_title = self.request.user.get_full_name() or self.request.user.username
        entry_text = f"[{interviewer_title} - Rating: {feedback.rating}/5]: {feedback.comments}"
        if interview.feedback:
            interview.feedback += f"\n\n{entry_text}"
        else:
            interview.feedback = entry_text
        interview.save(update_fields=['status', 'feedback'])

        Notification.objects.create(
            user=interview.application.candidate,
            title='Interview Feedback Logged',
            message=f'Interview feedback has been recorded for your {interview.round} at {interview.application.job.title}.'
        )

class OfferListCreateView(generics.ListCreateAPIView):
    serializer_class = OfferSerializer
    def get_queryset(self):
        if getattr(self.request.user, 'role', '') in ['recruiter', 'admin'] or getattr(self.request.user, 'is_staff', False):
            return Offer.objects.select_related('application__candidate', 'application__job').all()
        return Offer.objects.filter(application__candidate=self.request.user)

class NotificationListView(generics.ListAPIView):
    serializer_class=NotificationSerializer
    def get_queryset(self): return Notification.objects.filter(user=self.request.user).order_by('-created_at')
class NotificationReadView(APIView):
    def post(self,request,pk):
        n=Notification.objects.get(pk=pk,user=request.user); n.is_read=True; n.save(update_fields=['is_read']); return Response({'status':'read'})
class NotificationReadAllView(APIView):
    def post(self,request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status':'all_read'})

class SavedJobView(APIView):
    def get(self,request): return Response([{'id':x.job_id,'title':x.job.title} for x in SavedJob.objects.filter(candidate=request.user).select_related('job')])
    def post(self,request):
        job_id=request.data.get('job_id'); obj,_=SavedJob.objects.get_or_create(candidate=request.user,job_id=job_id); return Response({'saved':True,'id':obj.job_id})
    def delete(self,request): SavedJob.objects.filter(candidate=request.user,job_id=request.data.get('job_id')).delete(); return Response(status=204)

from .ai_agent import evaluate_application_with_ai

class ApplicationAIScreenView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if getattr(request.user, 'role', '') not in ['recruiter', 'admin'] and not request.user.is_staff:
            return Response(
                {'detail': 'Only recruiters can screen candidates and access interview evaluation dossiers.'},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            application = Application.objects.select_related('job', 'candidate').prefetch_related('job__skills').get(pk=pk)
        except Application.DoesNotExist:
            return Response({'detail': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Run the Multi-Stage AI Agent Pipeline
        result = evaluate_application_with_ai(application)

        # Update and persist in database
        application.match_score = result.get('match_score')
        application.ai_summary = result.get('summary', '')
        application.ai_strengths = result.get('strengths', [])
        application.ai_weaknesses = result.get('weaknesses', []) or result.get('gaps', [])
        application.ai_recommendation = result.get('recommendation', '')
        application.ai_interview_questions = result.get('interview_questions', [])
        application.save(update_fields=['match_score', 'ai_summary', 'ai_strengths', 'ai_weaknesses', 'ai_recommendation', 'ai_interview_questions'])

        return Response({
            'status': 'success',
            'application_id': application.id,
            'match_score': application.match_score,
            'summary': application.ai_summary,
            'recommendation': application.ai_recommendation,
            'strengths': application.ai_strengths,
            'weaknesses': application.ai_weaknesses,
            'gaps': application.ai_weaknesses,
            'resume_text': application.resume_text,
            'resume_filename': application.resume_filename,
            'interview_questions': application.ai_interview_questions
        })


class AutoShortlistView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if getattr(request.user, 'role', '') not in ['recruiter', 'admin'] and not request.user.is_staff:
            return Response(
                {'detail': 'Only recruiters can execute automated candidate shortlisting.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        job_id = request.data.get('job_id')
        threshold = int(request.data.get('threshold', 75))
        
        qs = Application.objects.select_related('job', 'candidate').filter(status__in=['applied', 'screening'])
        if job_id:
            qs = qs.filter(job_id=job_id)
            
        qualified = qs.filter(match_score__gte=threshold)
        count = 0
        promoted = []
        
        for app in qualified:
            app.status = Application.Status.SHORTLISTED
            app.save(update_fields=['status'])
            StatusHistory.objects.create(
                application=app,
                status=Application.Status.SHORTLISTED,
                changed_by=request.user,
                notes=f'Auto-shortlisted by ATS Engine (Score: {app.match_score}% >= {threshold}% threshold)'
            )
            Notification.objects.create(
                user=app.candidate,
                title='Aptitude Assessment Unlocked!',
                message=f'Congratulations! Your application for {app.job.title} was shortlisted (ATS Score: {app.match_score}%). Your 15-minute Online Aptitude Assessment is now active on your dashboard.'
            )
            count += 1
            promoted.append({
                'id': app.id,
                'candidate_name': app.candidate.get_full_name() or app.candidate.username,
                'job_title': app.job.title,
                'match_score': app.match_score
            })
            
        return Response({
            'status': 'success',
            'shortlisted_count': count,
            'threshold': threshold,
            'promoted_candidates': promoted,
            'message': f'Successfully auto-shortlisted {count} qualified candidate(s) with ATS score ≥ {threshold}%!'
        })


def get_or_create_job_assessment(job):
    """Retrieves or creates a default balanced 10-question Aptitude assessment for a job."""
    assessment, created = Assessment.objects.get_or_create(
        job=job,
        defaults={
            'title': f"{job.title} Online Aptitude & Skills Assessment",
            'description': f"Standardized screening assessment evaluating quantitative problem solving, logical reasoning, verbal comprehension, and role fundamentals for {job.title}.",
            'duration_minutes': 15,
            'passing_score': 70,
        }
    )
    if created or assessment.questions.count() == 0:
        skills = [s.name for s in job.skills.all()]
        questions_data = generate_assessment_questions(
            job_title=job.title,
            skills=skills,
            description=job.description
        )
        for q in questions_data:
            AssessmentQuestion.objects.create(
                assessment=assessment,
                question_text=q['question_text'],
                category=q['category'],
                options=q['options'],
                correct_option=q['correct_option'],
                explanation=q.get('explanation', ''),
                order=q.get('order', 0)
            )
    return assessment


class JobAssessmentDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, job_id):
        try:
            job = Job.objects.prefetch_related('skills').get(pk=job_id)
        except Job.DoesNotExist:
            return Response({'detail': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

        assessment = get_or_create_job_assessment(job)
        data = AssessmentSerializer(assessment).data

        if request.user.role == 'recruiter' or request.user.is_staff:
            questions = assessment.questions.all().order_by('order', 'id')
            data['questions'] = AssessmentQuestionFullSerializer(questions, many=True).data
        return Response(data)


class ApplicationAssessmentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            application = Application.objects.select_related('job', 'candidate').get(pk=pk)
        except Application.DoesNotExist:
            return Response({'detail': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Candidate can only view their own; recruiter can view for their job
        if request.user.role == 'candidate' and application.candidate != request.user:
            return Response({'detail': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role == 'recruiter' and application.job.recruiter != request.user and not request.user.is_staff:
            return Response({'detail': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        assessment = get_or_create_job_assessment(application.job)
        attempt = AssessmentAttempt.objects.filter(application=application).first()

        is_eligible = application.status in ['shortlisted', 'interview', 'offer', 'hired']

        return Response({
            'application_id': application.id,
            'job_id': application.job.id,
            'job_title': application.job.title,
            'application_status': application.status,
            'is_eligible': is_eligible,
            'assessment': {
                'id': assessment.id,
                'title': assessment.title,
                'description': assessment.description,
                'duration_minutes': assessment.duration_minutes,
                'passing_score': assessment.passing_score,
                'total_questions': assessment.questions.count(),
            },
            'attempt': AssessmentAttemptSerializer(attempt).data if attempt else None
        })


class StartAssessmentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            application = Application.objects.select_related('job', 'candidate').get(pk=pk)
        except Application.DoesNotExist:
            return Response({'detail': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role == 'candidate' and application.candidate != request.user:
            return Response({'detail': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        if application.status not in ['shortlisted', 'interview', 'offer', 'hired'] and request.user.role == 'candidate':
            return Response({
                'detail': 'Online Aptitude Assessment is only available once your application is shortlisted.'
            }, status=status.HTTP_400_BAD_REQUEST)

        assessment = get_or_create_job_assessment(application.job)
        attempt, created = AssessmentAttempt.objects.get_or_create(
            application=application,
            defaults={
                'candidate': application.candidate,
                'assessment': assessment,
                'status': AssessmentAttempt.Status.IN_PROGRESS,
                'started_at': timezone.now(),
                'total_questions': assessment.questions.count(),
            }
        )

        if not created:
            if attempt.status == AssessmentAttempt.Status.COMPLETED:
                return Response({
                    'detail': 'Assessment has already been completed.',
                    'attempt': AssessmentAttemptSerializer(attempt).data
                }, status=status.HTTP_400_BAD_REQUEST)
            if not attempt.started_at:
                attempt.started_at = timezone.now()
                attempt.status = AssessmentAttempt.Status.IN_PROGRESS
                attempt.save(update_fields=['started_at', 'status'])

        questions = assessment.questions.all().order_by('order', 'id')
        questions_data = AssessmentQuestionCandidateSerializer(questions, many=True).data

        return Response({
            'status': 'started',
            'attempt_id': attempt.id,
            'started_at': attempt.started_at,
            'duration_minutes': assessment.duration_minutes,
            'passing_score': assessment.passing_score,
            'assessment_title': assessment.title,
            'questions': questions_data
        })


class SubmitAssessmentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            application = Application.objects.select_related('job', 'candidate').get(pk=pk)
        except Application.DoesNotExist:
            return Response({'detail': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role == 'candidate' and application.candidate != request.user:
            return Response({'detail': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        assessment = get_or_create_job_assessment(application.job)
        attempt = AssessmentAttempt.objects.filter(application=application).first()
        if not attempt:
            return Response({'detail': 'No active test attempt found.'}, status=status.HTTP_400_BAD_REQUEST)

        if attempt.status == AssessmentAttempt.Status.COMPLETED:
            return Response({
                'detail': 'Assessment already submitted.',
                'attempt': AssessmentAttemptSerializer(attempt).data
            })

        candidate_answers = request.data.get('answers', {})
        violations_count = int(request.data.get('violations_count', 0))

        questions = assessment.questions.all().order_by('order', 'id')
        total_questions = questions.count()
        correct_count = 0
        category_stats = {}
        graded_breakdown = []

        for q in questions:
            cat = q.category or 'General'
            if cat not in category_stats:
                category_stats[cat] = {'correct': 0, 'total': 0}
            category_stats[cat]['total'] += 1

            selected = candidate_answers.get(str(q.id)) or candidate_answers.get(q.id)
            is_correct = (str(selected).strip().upper() == str(q.correct_option).strip().upper())

            if is_correct:
                correct_count += 1
                category_stats[cat]['correct'] += 1

            graded_breakdown.append({
                'question_id': q.id,
                'category': q.category,
                'question_text': q.question_text,
                'selected_option': selected,
                'correct_option': q.correct_option,
                'is_correct': is_correct,
                'explanation': q.explanation
            })

        score_percentage = round((correct_count / total_questions) * 100, 1) if total_questions > 0 else 0
        passed = score_percentage >= assessment.passing_score

        category_scores = {}
        for cat, stats_item in category_stats.items():
            c_tot = stats_item['total']
            c_corr = stats_item['correct']
            category_scores[cat] = {
                'correct': c_corr,
                'total': c_tot,
                'percentage': round((c_corr / c_tot) * 100, 1) if c_tot > 0 else 0
            }

        attempt.status = AssessmentAttempt.Status.COMPLETED
        attempt.completed_at = timezone.now()
        attempt.score_percentage = score_percentage
        attempt.total_questions = total_questions
        attempt.correct_answers_count = correct_count
        attempt.passed = passed
        attempt.violations_count = violations_count
        attempt.answers = candidate_answers
        attempt.category_scores = category_scores
        attempt.save()

        verdict_str = "Passed" if passed else "Cutoff Not Met"
        StatusHistory.objects.create(
            application=application,
            status=application.status,
            changed_by=request.user,
            notes=f"Online Aptitude Test completed: {score_percentage}% ({verdict_str}) with {violations_count} integrity warnings."
        )

        cand_name = application.candidate.get_full_name() or application.candidate.username
        if application.job and application.job.recruiter:
            Notification.objects.create(
                user=application.job.recruiter,
                title=f"Aptitude Test: {cand_name} ({score_percentage}%)",
                message=f"{cand_name} completed the Online Aptitude Assessment for {application.job.title} scoring {score_percentage}% ({verdict_str})."
            )

        Notification.objects.create(
            user=application.candidate,
            title=f"Aptitude Assessment Result: {score_percentage}%",
            message=f"You completed the Aptitude Assessment for {application.job.title} with a score of {score_percentage}%. {'Congratulations on passing the cutoff!' if passed else 'Your submission is recorded for recruiter review.'}"
        )

        return Response({
            'status': 'completed',
            'score_percentage': score_percentage,
            'correct_answers_count': correct_count,
            'total_questions': total_questions,
            'passed': passed,
            'passing_score': assessment.passing_score,
            'violations_count': violations_count,
            'category_scores': category_scores,
            'graded_breakdown': graded_breakdown,
            'completed_at': attempt.completed_at
        })


class GenerateAIAssessmentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, job_id):
        if getattr(request.user, 'role', '') != 'recruiter' and not request.user.is_staff:
            return Response({'detail': 'Only recruiters can generate assessments.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            job = Job.objects.prefetch_related('skills').get(pk=job_id)
        except Job.DoesNotExist:
            return Response({'detail': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

        if job.recruiter and job.recruiter != request.user and not request.user.is_staff:
            return Response({'detail': 'You can only configure assessments for your own job listings.'}, status=status.HTTP_403_FORBIDDEN)

        assessment, _ = Assessment.objects.get_or_create(
            job=job,
            defaults={
                'title': f"{job.title} Aptitude & Domain Assessment",
                'description': f"Aptitude and skills assessment customized for {job.title}.",
                'duration_minutes': 15,
                'passing_score': 70,
            }
        )

        # Clear existing questions before regenerating
        assessment.questions.all().delete()

        skills = [s.name for s in job.skills.all()]
        questions_data = generate_assessment_questions(
            job_title=job.title,
            skills=skills,
            description=job.description
        )

        for q in questions_data:
            AssessmentQuestion.objects.create(
                assessment=assessment,
                question_text=q['question_text'],
                category=q['category'],
                options=q['options'],
                correct_option=q['correct_option'],
                explanation=q.get('explanation', ''),
                order=q.get('order', 0)
            )

        data = AssessmentSerializer(assessment).data
        data['questions'] = AssessmentQuestionFullSerializer(assessment.questions.all(), many=True).data
        data['message'] = f"Successfully generated {len(questions_data)} assessment questions for {job.title}!"
        return Response(data)


class RecruiterAnalyticsView(APIView):
    """
    Returns high-level funnel metrics, time-to-hire statistics,
    ATS score distributions, and assessment outcomes.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from .analytics import compute_recruiter_analytics
        data = compute_recruiter_analytics(request.user)
        return Response(data)


class ResumeParseUploadView(APIView):
    """
    Accepts an uploaded resume file (PDF or text) and extracts raw text
    and metadata for candidate application preview and automated ATS scoring.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from .resume_parser import parse_uploaded_resume
        file_obj = request.FILES.get('file') or request.FILES.get('resume')
        if not file_obj:
            return Response({'detail': 'No resume file provided in form-data (key: "file" or "resume").'}, status=status.HTTP_400_BAD_REQUEST)
        
        parsed = parse_uploaded_resume(file_obj)
        return Response(parsed)


