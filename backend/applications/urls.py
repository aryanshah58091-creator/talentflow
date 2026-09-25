from django.urls import path
from .views import (
    ApplicationListCreateView, ApplicationDetailView, ApplicationAIScreenView, AutoShortlistView,
    InterviewListCreateView, InterviewFeedbackCreateView, OfferListCreateView,
    NotificationListView, NotificationReadView, SavedJobView
)
urlpatterns = [
    path('', ApplicationListCreateView.as_view()),
    path('auto-shortlist/', AutoShortlistView.as_view()),
    path('<int:pk>/', ApplicationDetailView.as_view()),
    path('<int:pk>/ai-screen/', ApplicationAIScreenView.as_view()),
    path('interviews/', InterviewListCreateView.as_view()),
    path('interviews/<int:pk>/feedback/', InterviewFeedbackCreateView.as_view()),
    path('offers/', OfferListCreateView.as_view()),
    path('notifications/', NotificationListView.as_view()),
    path('notifications/<int:pk>/read/', NotificationReadView.as_view()),
    path('saved-jobs/', SavedJobView.as_view()),
]
