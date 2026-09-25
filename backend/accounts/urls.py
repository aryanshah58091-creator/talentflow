from django.urls import path
from .views import RegisterView, MeView, CandidateProfileView, ResumeListCreateView
urlpatterns = [
    path('register/', RegisterView.as_view()), path('me/', MeView.as_view()),
    path('profile/', CandidateProfileView.as_view()), path('resumes/', ResumeListCreateView.as_view()),
]
