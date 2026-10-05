from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from companies.models import Company, RecruiterProfile
from jobs.models import Job, Skill
from applications.models import Application, StatusHistory

User = get_user_model()

class ApplicationWorkflowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.company = Company.objects.create(name='TalentFlow Inc')
        self.recruiter = User.objects.create_user(
            username='recruiter_rob', email='rob@talentflow.com',
            password='Password123!', role='recruiter'
        )
        RecruiterProfile.objects.create(user=self.recruiter, company=self.company)

        self.candidate = User.objects.create_user(
            username='candidate_carl', email='carl@gmail.com',
            password='Password123!', role='candidate'
        )

        self.job = Job.objects.create(
            company=self.company, recruiter=self.recruiter,
            title='Backend Architect', description='High-throughput APIs',
            status='published'
        )

    def test_candidate_can_apply_and_creates_status_history(self):
        self.client.force_authenticate(user=self.candidate)
        payload = {
            'job': self.job.id,
            'cover_letter': 'Experienced backend engineer with 5 years in Python.',
            'resume_text': 'Python, Django, PostgreSQL, Celery, Redis, Docker, AWS, System Design.'
        }
        res = self.client.post('/api/v1/applications/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Application.objects.count(), 1)
        
        app = Application.objects.first()
        self.assertEqual(app.candidate, self.candidate)
        self.assertEqual(app.job, self.job)
        self.assertTrue(StatusHistory.objects.filter(application=app, status='applied').exists())

    def test_duplicate_application_prevented(self):
        Application.objects.create(job=self.job, candidate=self.candidate, status='applied')
        self.client.force_authenticate(user=self.candidate)
        res = self.client.post('/api/v1/applications/', {'job': self.job.id}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Application.objects.count(), 1)

    def test_recruiter_cannot_apply_to_jobs(self):
        self.client.force_authenticate(user=self.recruiter)
        res = self.client.post('/api/v1/applications/', {'job': self.job.id}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
