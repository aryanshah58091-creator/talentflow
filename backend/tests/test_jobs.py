from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from companies.models import Company, RecruiterProfile
from jobs.models import Job, Skill

User = get_user_model()

class JobManagementTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.company = Company.objects.create(name='TechCorp', location='Bengaluru')
        
        self.recruiter = User.objects.create_user(
            username='recruiter_user', email='recruiter@techcorp.com',
            password='Password123!', role='recruiter'
        )
        RecruiterProfile.objects.create(user=self.recruiter, company=self.company, position='Lead Recruiter')

        self.candidate = User.objects.create_user(
            username='candidate_user', email='candidate@gmail.com',
            password='Password123!', role='candidate'
        )

        self.python_skill = Skill.objects.create(name='Python', category='Backend')
        self.django_skill = Skill.objects.create(name='Django', category='Backend')

    def test_recruiter_can_create_job(self):
        self.client.force_authenticate(user=self.recruiter)
        payload = {
            'title': 'Senior Python Engineer',
            'description': 'Building scalable microservices with Django and FastAPI.',
            'requirements': '3+ years experience with Python.',
            'location': 'Bengaluru / Remote',
            'employment_type': 'full_time',
            'workplace': 'hybrid',
            'status': 'published',
            'skill_ids': [self.python_skill.id, self.django_skill.id]
        }
        res = self.client.post('/api/v1/jobs/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Job.objects.count(), 1)
        job = Job.objects.first()
        self.assertEqual(job.title, 'Senior Python Engineer')
        self.assertEqual(job.skills.count(), 2)

    def test_candidate_cannot_create_job(self):
        self.client.force_authenticate(user=self.candidate)
        payload = {
            'title': 'Unauthorized Job Post',
            'description': 'Attempting to create job as candidate.',
            'employment_type': 'full_time'
        }
        res = self.client.post('/api/v1/jobs/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
