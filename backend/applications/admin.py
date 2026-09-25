from django.contrib import admin
from .models import Application, StatusHistory, Interview, InterviewFeedback, Offer, SavedJob, Notification
for m in [Application,StatusHistory,Interview,InterviewFeedback,Offer,SavedJob,Notification]: admin.site.register(m)
