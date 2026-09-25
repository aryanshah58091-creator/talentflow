from django.urls import path
from .views import CompanyListCreateView, CompanyDetailView, MyRecruiterProfileView
urlpatterns=[path('',CompanyListCreateView.as_view()),path('<int:pk>/',CompanyDetailView.as_view()),path('me/',MyRecruiterProfileView.as_view())]
