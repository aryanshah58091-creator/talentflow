from django.urls import path
from .views import (
    ApplicationListCreateView, ApplicationDetailView, ApplicationAIScreenView, AutoShortlistView,
    InterviewListCreateView, InterviewDetailView, InterviewFeedbackCreateView, InterviewGenerateQuestionsView, OfferListCreateView,
    NotificationListView, NotificationReadView, NotificationReadAllView, SavedJobView,
    JobAssessmentDetailView, ApplicationAssessmentView, StartAssessmentView, SubmitAssessmentView, GenerateAIAssessmentView,
    RecruiterAnalyticsView, ResumeParseUploadView
)
urlpatterns = [
    path('', ApplicationListCreateView.as_view()),
    path('analytics/', RecruiterAnalyticsView.as_view()),
    path('parse-resume/', ResumeParseUploadView.as_view()),
    path('auto-shortlist/', AutoShortlistView.as_view()),
    path('<int:pk>/', ApplicationDetailView.as_view()),
    path('<int:pk>/ai-screen/', ApplicationAIScreenView.as_view()),
    path('<int:pk>/assessment/', ApplicationAssessmentView.as_view()),
    path('<int:pk>/assessment/start/', StartAssessmentView.as_view()),
    path('<int:pk>/assessment/submit/', SubmitAssessmentView.as_view()),
    path('jobs/<int:job_id>/assessment/', JobAssessmentDetailView.as_view()),
    path('jobs/<int:job_id>/generate-assessment/', GenerateAIAssessmentView.as_view()),
    path('interviews/', InterviewListCreateView.as_view()),
    path('interviews/<int:pk>/', InterviewDetailView.as_view()),
    path('interviews/<int:pk>/generate-questions/', InterviewGenerateQuestionsView.as_view()),
    path('interviews/<int:pk>/feedback/', InterviewFeedbackCreateView.as_view()),
    path('offers/', OfferListCreateView.as_view()),
    path('notifications/', NotificationListView.as_view()),
    path('notifications/read-all/', NotificationReadAllView.as_view()),
    path('notifications/<int:pk>/read/', NotificationReadView.as_view()),
    path('saved-jobs/', SavedJobView.as_view()),
]


