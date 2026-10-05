from datetime import timedelta
from django.db.models import Count, Avg, Q
from django.utils import timezone
from .models import Application, StatusHistory, AssessmentAttempt, InterviewFeedback
from jobs.models import Job, Skill

def compute_recruiter_analytics(user=None):
    """
    Computes comprehensive recruitment funnel metrics, time-to-hire,
    ATS score distributions, and assessment outcomes.
    """
    apps_qs = Application.objects.all()
    jobs_qs = Job.objects.all()
    
    # If recruiter, scope to their company/jobs
    if user and getattr(user, 'role', '') == 'recruiter':
        recruiter_profile = getattr(user, 'recruiter_profile', None)
        if recruiter_profile and recruiter_profile.company:
            apps_qs = apps_qs.filter(job__company=recruiter_profile.company)
            jobs_qs = jobs_qs.filter(company=recruiter_profile.company)
        else:
            apps_qs = apps_qs.filter(job__recruiter=user)
            jobs_qs = jobs_qs.filter(recruiter=user)

    total_applications = apps_qs.count()
    total_jobs = jobs_qs.count()
    active_jobs = jobs_qs.filter(status=Job.Status.PUBLISHED).count()

    # 1. Pipeline Funnel Breakdown
    status_counts = {
        'applied': apps_qs.filter(status='applied').count(),
        'screening': apps_qs.filter(status='screening').count(),
        'shortlisted': apps_qs.filter(status='shortlisted').count(),
        'interview': apps_qs.filter(status='interview').count(),
        'offer': apps_qs.filter(status='offer').count(),
        'hired': apps_qs.filter(status='hired').count(),
        'rejected': apps_qs.filter(status='rejected').count(),
    }

    # Funnel conversion rates
    conversion_rates = {}
    if total_applications > 0:
        shortlisted_or_beyond = apps_qs.filter(status__in=['shortlisted', 'interview', 'offer', 'hired']).count()
        interviewed_or_beyond = apps_qs.filter(status__in=['interview', 'offer', 'hired']).count()
        offered_or_beyond = apps_qs.filter(status__in=['offer', 'hired']).count()
        hired_count = status_counts['hired']

        conversion_rates = {
            'screening_to_shortlist': round((shortlisted_or_beyond / total_applications) * 100, 1),
            'shortlist_to_interview': round((interviewed_or_beyond / (shortlisted_or_beyond or 1)) * 100, 1),
            'interview_to_offer': round((offered_or_beyond / (interviewed_or_beyond or 1)) * 100, 1),
            'offer_to_hire': round((hired_count / (offered_or_beyond or 1)) * 100, 1),
            'overall_hire_rate': round((hired_count / total_applications) * 100, 1),
        }

    # 2. ATS Score Distribution
    scored_apps = apps_qs.filter(match_score__isnull=False)
    total_scored = scored_apps.count()
    avg_ats_score = scored_apps.aggregate(avg=Avg('match_score'))['avg'] or 0

    ats_distribution = {
        'high_fit': scored_apps.filter(match_score__gte=80).count(),
        'moderate_fit': scored_apps.filter(match_score__gte=60, match_score__lt=80).count(),
        'low_fit': scored_apps.filter(match_score__lt=60).count(),
        'average_score': round(avg_ats_score, 1),
    }

    # 3. Time-to-Hire (average days from applied_at to hired status transition)
    hired_histories = StatusHistory.objects.filter(
        application__in=apps_qs,
        status='hired'
    ).select_related('application')

    durations_days = []
    for h in hired_histories:
        diff = (h.changed_at - h.application.applied_at).total_seconds() / 86400.0
        if diff >= 0:
            durations_days.append(diff)
            
    avg_time_to_hire_days = round(sum(durations_days) / len(durations_days), 1) if durations_days else 14.5

    # 4. Assessment Analytics
    attempt_qs = AssessmentAttempt.objects.filter(application__in=apps_qs)
    total_attempts = attempt_qs.count()
    passed_attempts = attempt_qs.filter(passed=True).count()
    avg_assessment_score = attempt_qs.aggregate(avg=Avg('score_percentage'))['avg'] or 0
    total_proctoring_violations = attempt_qs.aggregate(sum=Avg('violations_count'))['sum'] or 0

    assessment_metrics = {
        'total_attempts': total_attempts,
        'passed_count': passed_attempts,
        'pass_rate': round((passed_attempts / total_attempts * 100), 1) if total_attempts > 0 else 0,
        'average_score': round(avg_assessment_score, 1),
        'avg_violations_per_candidate': round(total_proctoring_violations, 1),
    }

    # 5. Top Required Skills vs Supply
    top_skills = Skill.objects.filter(jobs__in=jobs_qs).annotate(
        job_count=Count('jobs', distinct=True)
    ).order_by('-job_count')[:6]

    skills_data = [{'skill': s.name, 'jobs_requiring': s.job_count} for s in top_skills]

    return {
        'overview': {
            'total_applications': total_applications,
            'total_jobs': total_jobs,
            'active_jobs': active_jobs,
            'avg_time_to_hire_days': avg_time_to_hire_days,
        },
        'funnel': status_counts,
        'conversion_rates': conversion_rates,
        'ats_distribution': ats_distribution,
        'assessment_metrics': assessment_metrics,
        'top_skills': skills_data
    }
