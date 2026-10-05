from django.db import models
from accounts.models import User
from jobs.models import Job
class Application(models.Model):
    class Status(models.TextChoices):
        APPLIED = 'applied', 'Applied'
        SCREENING = 'screening', 'Screening'
        SHORTLISTED = 'shortlisted', 'Shortlisted'
        INTERVIEW = 'interview', 'Interview'
        OFFER = 'offer', 'Offer'
        HIRED = 'hired', 'Hired'
        REJECTED = 'rejected', 'Rejected'

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    candidate = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications')
    cover_letter = models.TextField(blank=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.APPLIED)
    match_score = models.PositiveSmallIntegerField(null=True, blank=True)
    ai_summary = models.TextField(blank=True)
    ai_strengths = models.JSONField(default=list, blank=True)
    ai_weaknesses = models.JSONField(default=list, blank=True)
    ai_recommendation = models.CharField(max_length=60, blank=True, default='')
    ai_interview_questions = models.JSONField(default=list, blank=True)
    resume_text = models.TextField(blank=True, default='')
    resume_filename = models.CharField(max_length=255, blank=True, default='')
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['job', 'candidate'], name='unique_job_candidate')]
        verbose_name = 'Application'
        verbose_name_plural = 'Applications'
        ordering = ['-applied_at']

    def __str__(self):
        candidate_name = self.candidate.get_full_name() or self.candidate.username
        return f"{candidate_name} -> {self.job.title} ({self.get_status_display()})"

class StatusHistory(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField(max_length=30, choices=Application.Status.choices)
    changed_by = models.ForeignKey(User, on_delete=models.PROTECT)
    notes = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Status History'
        verbose_name_plural = 'Status Histories'
        ordering = ['-changed_at']

    def __str__(self):
        candidate_name = self.application.candidate.get_full_name() or self.application.candidate.username
        return f"{candidate_name} ({self.application.job.title}) -> {self.get_status_display()}"


class Interview(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='interviews')
    round = models.CharField(max_length=80)
    interview_time = models.DateTimeField()
    mode = models.CharField(max_length=50, default='Online')
    meeting_link = models.URLField(blank=True)
    status = models.CharField(max_length=30, default='scheduled')
    feedback = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Interview'
        verbose_name_plural = 'Interviews'
        ordering = ['-interview_time']

    def __str__(self):
        candidate_name = self.application.candidate.get_full_name() or self.application.candidate.username
        return f"{self.round}: {candidate_name} ({self.status.capitalize()})"

class InterviewFeedback(models.Model):
    interview = models.ForeignKey(Interview, on_delete=models.CASCADE, related_name='feedback_entries')
    interviewer = models.ForeignKey(User, on_delete=models.PROTECT)
    rating = models.PositiveSmallIntegerField(default=0)
    comments = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Interview Feedback'
        verbose_name_plural = 'Interview Feedbacks'
        ordering = ['-created_at']

    def __str__(self):
        interviewer_name = self.interviewer.get_full_name() or self.interviewer.username
        return f"Feedback by {interviewer_name} for {self.interview.round} ({self.rating}/5)"

class Offer(models.Model):
    application = models.OneToOneField(Application, on_delete=models.CASCADE, related_name='offer')
    salary = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    joining_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=30, default='draft')
    offer_letter = models.FileField(upload_to='offers/', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Offer'
        verbose_name_plural = 'Offers'
        ordering = ['-created_at']

    def __str__(self):
        candidate_name = self.application.candidate.get_full_name() or self.application.candidate.username
        return f"Offer for {candidate_name}: {self.currency} {self.salary} ({self.status.capitalize()})"

class SavedJob(models.Model):
    candidate = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_jobs')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='saved_by')
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['candidate', 'job'], name='unique_saved_job')]
        verbose_name = 'Saved Job'
        verbose_name_plural = 'Saved Jobs'
        ordering = ['-saved_at']

    def __str__(self):
        candidate_name = self.candidate.get_full_name() or self.candidate.username
        return f"{candidate_name} saved {self.job.title}"

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=160)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']

    def __str__(self):
        user_name = self.user.get_full_name() or self.user.username
        status_label = "Read" if self.is_read else "New"
        return f"[{status_label}] {user_name}: {self.title}"


class Assessment(models.Model):
    job = models.OneToOneField(Job, on_delete=models.CASCADE, related_name='assessment', null=True, blank=True)
    title = models.CharField(max_length=200, default='Online Aptitude & Skills Assessment')
    description = models.TextField(blank=True, default='Standardized online assessment evaluating quantitative problem solving, logical reasoning, verbal comprehension, and role fundamentals.')
    duration_minutes = models.PositiveIntegerField(default=15)
    passing_score = models.PositiveIntegerField(default=70) # percentage
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Assessment'
        verbose_name_plural = 'Assessments'

    def __str__(self):
        return f"{self.title} - {self.job.title if self.job else 'General'}"

class AssessmentQuestion(models.Model):
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    category = models.CharField(max_length=50, default='Logical Reasoning') # Quantitative, Logical Reasoning, Verbal, Technical
    options = models.JSONField(default=list) # [{"id": "A", "text": "..."}, {"id": "B", "text": "..."}]
    correct_option = models.CharField(max_length=10) # e.g. "A"
    explanation = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']
        verbose_name = 'Assessment Question'
        verbose_name_plural = 'Assessment Questions'

    def __str__(self):
        return f"[{self.category}] {self.question_text[:50]}"

class AssessmentAttempt(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'

    application = models.OneToOneField(Application, on_delete=models.CASCADE, related_name='assessment_attempt')
    candidate = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assessment_attempts')
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='attempts')
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    score_percentage = models.FloatField(null=True, blank=True)
    total_questions = models.PositiveIntegerField(default=0)
    correct_answers_count = models.PositiveIntegerField(default=0)
    passed = models.BooleanField(default=False)
    violations_count = models.PositiveIntegerField(default=0) # proctoring tab switches
    answers = models.JSONField(default=dict) # { question_id: selected_option }
    category_scores = models.JSONField(default=dict) # { "Logical Reasoning": {"correct": 2, "total": 2, "percentage": 100}, ... }
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Assessment Attempt'
        verbose_name_plural = 'Assessment Attempts'
        ordering = ['-created_at']

    def __str__(self):
        cand_name = self.candidate.get_full_name() or self.candidate.username
        score = f"{self.score_percentage}%" if self.score_percentage is not None else "Pending"
        return f"{cand_name} - {self.assessment.title} ({score})"


