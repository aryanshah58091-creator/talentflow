from django.test import TestCase
from django.contrib.auth import get_user_model
from companies.models import Company, RecruiterProfile
from jobs.models import Job, Skill
from applications.models import Application, StatusHistory
from applications.analytics import compute_recruiter_analytics

User = get_user_model()

class AnalyticsComputationTests(TestCase):
    def setUp(self):
        self.company = Company.objects.create(name='Global Corp')
        self.recruiter = User.objects.create_user(
            username='analytics_recruiter', email='recruiter@global.com',
            password='Password123!', role='recruiter'
        )
        RecruiterProfile.objects.create(user=self.recruiter, company=self.company)

        self.candidate1 = User.objects.create_user(
            username='c1', email='c1@test.com', password='Password123!', role='candidate'
        )
        self.candidate2 = User.objects.create_user(
            username='c2', email='c2@test.com', password='Password123!', role='candidate'
        )

        self.job = Job.objects.create(
            company=self.company, recruiter=self.recruiter,
            title='Staff Engineer', description='Tech Leadership',
            status='published'
        )

        self.app1 = Application.objects.create(job=self.job, candidate=self.candidate1, status='hired', match_score=92)
        self.app2 = Application.objects.create(job=self.job, candidate=self.candidate2, status='screening', match_score=68)

    def test_analytics_funnel_and_ats_distribution(self):
        metrics = compute_recruiter_analytics(self.recruiter)
        
        self.assertEqual(metrics['overview']['total_applications'], 2)
        self.assertEqual(metrics['overview']['total_jobs'], 1)
        self.assertEqual(metrics['funnel']['hired'], 1)
        self.assertEqual(metrics['funnel']['screening'], 1)
        self.assertEqual(metrics['ats_distribution']['high_fit'], 1)
        self.assertEqual(metrics['ats_distribution']['moderate_fit'], 1)
        self.assertAlmostEqual(metrics['ats_distribution']['average_score'], 80.0, places=1)
