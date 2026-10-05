from django.db import models
from accounts.models import User

class Company(models.Model):
    name = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    website = models.URLField(blank=True)
    logo = models.ImageField(upload_to='company_logos/', blank=True)
    location = models.CharField(max_length=160, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Company'
        verbose_name_plural = 'Companies'

    def __str__(self):
        return self.name

class RecruiterProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='recruiter_profile')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='recruiters')
    position = models.CharField(max_length=120, blank=True)
    department = models.CharField(max_length=120, blank=True)

    class Meta:
        verbose_name = 'Recruiter Profile'
        verbose_name_plural = 'Recruiter Profiles'

    def __str__(self):
        name = self.user.get_full_name() or self.user.username
        pos = f" ({self.position})" if self.position else ""
        company_name = self.company.name if self.company else "Independent"
        return f"{name}{pos} @ {company_name}"

