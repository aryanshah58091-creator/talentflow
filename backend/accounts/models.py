from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        CANDIDATE = 'candidate', 'Candidate'
        RECRUITER = 'recruiter', 'Recruiter'
        ADMIN = 'admin', 'Admin'
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CANDIDATE)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    REQUIRED_FIELDS = ['email']

    def __str__(self): return f'{self.username} ({self.role})'

class CandidateProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='candidate_profile')
    headline = models.CharField(max_length=160, blank=True)
    bio = models.TextField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    location = models.CharField(max_length=120, blank=True)
    linkedin_url = models.URLField(blank=True)
    portfolio_url = models.URLField(blank=True)
    skills = models.JSONField(default=list, blank=True)
    experience_years = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Resume(models.Model):
    candidate = models.ForeignKey(CandidateProfile, on_delete=models.CASCADE, related_name='resumes')
    file = models.FileField(upload_to='resumes/%Y/%m/')
    file_name = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)
