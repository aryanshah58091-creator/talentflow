from django.contrib import admin
from .models import (
    Application, StatusHistory, Interview, InterviewFeedback,
    Offer, SavedJob, Notification, Assessment, AssessmentQuestion, AssessmentAttempt
)

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('candidate_name', 'job_title', 'company_name', 'status', 'match_score', 'applied_at')
    list_filter = ('status', 'applied_at', 'job__company')
    search_fields = (
        'candidate__username', 'candidate__first_name', 'candidate__last_name',
        'candidate__email', 'job__title', 'cover_letter'
    )
    ordering = ('-applied_at',)

    @admin.display(description='Candidate')
    def candidate_name(self, obj):
        return obj.candidate.get_full_name() or obj.candidate.username

    @admin.display(description='Job')
    def job_title(self, obj):
        return obj.job.title

    @admin.display(description='Company')
    def company_name(self, obj):
        return obj.job.company.name if obj.job and obj.job.company else '-'

@admin.register(StatusHistory)
class StatusHistoryAdmin(admin.ModelAdmin):
    list_display = ('candidate_name', 'job_title', 'status', 'changed_by_name', 'changed_at')
    list_filter = ('status', 'changed_at')
    search_fields = ('application__candidate__username', 'application__job__title', 'notes')
    ordering = ('-changed_at',)

    @admin.display(description='Candidate')
    def candidate_name(self, obj):
        return obj.application.candidate.get_full_name() or obj.application.candidate.username

    @admin.display(description='Job')
    def job_title(self, obj):
        return obj.application.job.title

    @admin.display(description='Changed By')
    def changed_by_name(self, obj):
        return obj.changed_by.get_full_name() or obj.changed_by.username

@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = ('candidate_name', 'job_title', 'round', 'interview_time', 'mode', 'status')
    list_filter = ('status', 'mode', 'interview_time')
    search_fields = ('application__candidate__username', 'application__job__title', 'round', 'feedback')
    ordering = ('-interview_time',)

    @admin.display(description='Candidate')
    def candidate_name(self, obj):
        return obj.application.candidate.get_full_name() or obj.application.candidate.username

    @admin.display(description='Job')
    def job_title(self, obj):
        return obj.application.job.title

@admin.register(InterviewFeedback)
class InterviewFeedbackAdmin(admin.ModelAdmin):
    list_display = ('interview', 'interviewer_name', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('interviewer__username', 'comments', 'interview__round')
    ordering = ('-created_at',)

    @admin.display(description='Interviewer')
    def interviewer_name(self, obj):
        return obj.interviewer.get_full_name() or obj.interviewer.username

@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    list_display = ('candidate_name', 'job_title', 'salary_formatted', 'status', 'joining_date', 'created_at')
    list_filter = ('status', 'currency', 'created_at')
    search_fields = ('application__candidate__username', 'application__job__title')
    ordering = ('-created_at',)

    @admin.display(description='Candidate')
    def candidate_name(self, obj):
        return obj.application.candidate.get_full_name() or obj.application.candidate.username

    @admin.display(description='Job')
    def job_title(self, obj):
        return obj.application.job.title

    @admin.display(description='Salary')
    def salary_formatted(self, obj):
        return f"{obj.currency} {obj.salary:,.2f}"

@admin.register(SavedJob)
class SavedJobAdmin(admin.ModelAdmin):
    list_display = ('candidate_name', 'job_title', 'saved_at')
    search_fields = ('candidate__username', 'candidate__first_name', 'candidate__last_name', 'job__title')
    ordering = ('-saved_at',)

    @admin.display(description='Candidate')
    def candidate_name(self, obj):
        return obj.candidate.get_full_name() or obj.candidate.username

    @admin.display(description='Job')
    def job_title(self, obj):
        return obj.job.title

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('recipient_name', 'title', 'is_read', 'created_at')
    list_filter = ('is_read', 'created_at')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'title', 'message')
    ordering = ('-created_at',)

    @admin.display(description='User')
    def recipient_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'job', 'duration_minutes', 'passing_score', 'created_at')
    search_fields = ('title', 'job__title')
    ordering = ('-created_at',)

@admin.register(AssessmentQuestion)
class AssessmentQuestionAdmin(admin.ModelAdmin):
    list_display = ('short_question', 'assessment', 'category', 'correct_option', 'order')
    list_filter = ('category', 'assessment')
    search_fields = ('question_text', 'assessment__title')
    ordering = ('assessment', 'order', 'id')

    @admin.display(description='Question')
    def short_question(self, obj):
        return obj.question_text[:60] + ('...' if len(obj.question_text) > 60 else '')

@admin.register(AssessmentAttempt)
class AssessmentAttemptAdmin(admin.ModelAdmin):
    list_display = ('candidate_name', 'assessment', 'status', 'score_percentage', 'passed', 'completed_at')
    list_filter = ('status', 'passed', 'created_at')
    search_fields = ('candidate__username', 'assessment__title')
    ordering = ('-created_at',)

    @admin.display(description='Candidate')
    def candidate_name(self, obj):
        return obj.candidate.get_full_name() or obj.candidate.username

