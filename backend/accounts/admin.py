from django.contrib import admin
from .models import User, CandidateProfile, Resume
admin.site.register(User); admin.site.register(CandidateProfile); admin.site.register(Resume)
