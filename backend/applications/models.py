from django.db import models
from accounts.models import User
from jobs.models import Job
class Application(models.Model):
    class Status(models.TextChoices): APPLIED='applied','Applied'; SCREENING='screening','Screening'; SHORTLISTED='shortlisted','Shortlisted'; INTERVIEW='interview','Interview'; OFFER='offer','Offer'; HIRED='hired','Hired'; REJECTED='rejected','Rejected'
    job=models.ForeignKey(Job,on_delete=models.CASCADE,related_name='applications'); candidate=models.ForeignKey(User,on_delete=models.CASCADE,related_name='applications'); cover_letter=models.TextField(blank=True); status=models.CharField(max_length=30,choices=Status.choices,default=Status.APPLIED); match_score=models.PositiveSmallIntegerField(null=True,blank=True); ai_summary=models.TextField(blank=True); ai_strengths=models.JSONField(default=list,blank=True); ai_weaknesses=models.JSONField(default=list,blank=True); ai_recommendation=models.CharField(max_length=60,blank=True,default=''); ai_interview_questions=models.JSONField(default=list,blank=True); resume_text=models.TextField(blank=True,default=''); resume_filename=models.CharField(max_length=255,blank=True,default=''); applied_at=models.DateTimeField(auto_now_add=True); updated_at=models.DateTimeField(auto_now=True)
    class Meta: constraints=[models.UniqueConstraint(fields=['job','candidate'],name='unique_job_candidate')]
class StatusHistory(models.Model):
    application=models.ForeignKey(Application,on_delete=models.CASCADE,related_name='status_history'); status=models.CharField(max_length=30,choices=Application.Status.choices); changed_by=models.ForeignKey(User,on_delete=models.PROTECT); notes=models.TextField(blank=True); changed_at=models.DateTimeField(auto_now_add=True)
class Interview(models.Model):
    application=models.ForeignKey(Application,on_delete=models.CASCADE,related_name='interviews'); round=models.CharField(max_length=80); interview_time=models.DateTimeField(); mode=models.CharField(max_length=50,default='Online'); meeting_link=models.URLField(blank=True); status=models.CharField(max_length=30,default='scheduled'); feedback=models.TextField(blank=True)
class InterviewFeedback(models.Model):
    interview=models.ForeignKey(Interview,on_delete=models.CASCADE,related_name='feedback_entries'); interviewer=models.ForeignKey(User,on_delete=models.PROTECT); rating=models.PositiveSmallIntegerField(default=0); comments=models.TextField(blank=True); created_at=models.DateTimeField(auto_now_add=True)
class Offer(models.Model):
    application=models.OneToOneField(Application,on_delete=models.CASCADE,related_name='offer'); salary=models.DecimalField(max_digits=12,decimal_places=2); currency=models.CharField(max_length=10,default='INR'); joining_date=models.DateField(null=True,blank=True); status=models.CharField(max_length=30,default='draft'); offer_letter=models.FileField(upload_to='offers/',blank=True); created_at=models.DateTimeField(auto_now_add=True)
class SavedJob(models.Model):
    candidate=models.ForeignKey(User,on_delete=models.CASCADE,related_name='saved_jobs'); job=models.ForeignKey(Job,on_delete=models.CASCADE,related_name='saved_by'); saved_at=models.DateTimeField(auto_now_add=True)
    class Meta: constraints=[models.UniqueConstraint(fields=['candidate','job'],name='unique_saved_job')]
class Notification(models.Model):
    user=models.ForeignKey(User,on_delete=models.CASCADE,related_name='notifications'); title=models.CharField(max_length=160); message=models.TextField(); is_read=models.BooleanField(default=False); created_at=models.DateTimeField(auto_now_add=True)
