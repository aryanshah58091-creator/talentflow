from django.db import models
from accounts.models import User
from companies.models import Company
class Skill(models.Model):
    name=models.CharField(max_length=80,unique=True); category=models.CharField(max_length=80,blank=True); description=models.TextField(blank=True)
    def __str__(self): return self.name
class Job(models.Model):
    class Status(models.TextChoices): DRAFT='draft','Draft'; PUBLISHED='published','Published'; CLOSED='closed','Closed'
    class Employment(models.TextChoices): FULL_TIME='full_time','Full-time'; PART_TIME='part_time','Part-time'; CONTRACT='contract','Contract'; INTERNSHIP='internship','Internship'
    class Workplace(models.TextChoices): REMOTE='remote','Remote'; HYBRID='hybrid','Hybrid'; ONSITE='onsite','On-site'
    company=models.ForeignKey(Company,on_delete=models.CASCADE,related_name='jobs'); recruiter=models.ForeignKey(User,on_delete=models.PROTECT,related_name='jobs_created'); title=models.CharField(max_length=180); description=models.TextField(); requirements=models.TextField(blank=True); location=models.CharField(max_length=160,blank=True); employment_type=models.CharField(max_length=30,choices=Employment.choices,default=Employment.FULL_TIME); workplace=models.CharField(max_length=20,choices=Workplace.choices,default=Workplace.HYBRID); experience_level=models.CharField(max_length=80,blank=True); salary_min=models.DecimalField(max_digits=12,decimal_places=2,null=True,blank=True); salary_max=models.DecimalField(max_digits=12,decimal_places=2,null=True,blank=True); status=models.CharField(max_length=20,choices=Status.choices,default=Status.DRAFT); skills=models.ManyToManyField(Skill,through='JobSkill',related_name='jobs'); created_at=models.DateTimeField(auto_now_add=True); updated_at=models.DateTimeField(auto_now=True)
    def __str__(self): return self.title
class JobSkill(models.Model):
    job=models.ForeignKey(Job,on_delete=models.CASCADE); skill=models.ForeignKey(Skill,on_delete=models.CASCADE); is_required=models.BooleanField(default=True)
    class Meta: unique_together=('job','skill')
