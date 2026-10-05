from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

class AuthenticationAndRoleTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_candidate_registration_creates_profile(self):
        payload = {
            'username': 'john_candidate',
            'email': 'john@example.com',
            'password': 'SecurePassword123!',
            'role': 'candidate',
            'first_name': 'John',
            'last_name': 'Doe'
        }
        res = self.client.post('/api/v1/accounts/register/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', res.data)
        
        user = User.objects.get(username='john_candidate')
        self.assertEqual(user.role, 'candidate')
        self.assertTrue(hasattr(user, 'candidate_profile'))

    def test_recruiter_registration(self):
        payload = {
            'username': 'jane_recruiter',
            'email': 'jane@example.com',
            'password': 'SecurePassword123!',
            'role': 'recruiter',
            'first_name': 'Jane',
            'last_name': 'Smith'
        }
        res = self.client.post('/api/v1/accounts/register/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username='jane_recruiter')
        self.assertEqual(user.role, 'recruiter')

    def test_login_returns_token_and_role(self):
        user = User.objects.create_user(
            username='alex_dev', email='alex@example.com', password='MyPassword123!', role='candidate'
        )
        res = self.client.post('/api/v1/auth/token/', {
            'username': 'alex_dev',
            'password': 'MyPassword123!'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('token', res.data)

