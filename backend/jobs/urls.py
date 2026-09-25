from django.urls import path

from .views import JobListCreateView, JobDetailView, SkillListView


urlpatterns = [
    path("", JobListCreateView.as_view()),
    path("skills/", SkillListView.as_view()),
    path("<int:pk>/", JobDetailView.as_view()),
]