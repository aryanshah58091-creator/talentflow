from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, CandidateProfile, Resume

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'is_staff', 'created_at')
    list_filter = ('role', 'is_active', 'is_staff')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-created_at',)

@admin.register(CandidateProfile)
class CandidateProfileAdmin(admin.ModelAdmin):
    list_display = ('candidate_name', 'headline', 'experience_years', 'location', 'phone', 'created_at')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'user__email', 'headline', 'location')
    list_filter = ('experience_years', 'created_at')
    ordering = ('-created_at',)

    @admin.display(description='Candidate Name')
    def candidate_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ('file_name', 'candidate_name', 'is_primary', 'uploaded_at')
    search_fields = ('file_name', 'candidate__user__username', 'candidate__user__first_name', 'candidate__user__last_name')
    list_filter = ('is_primary', 'uploaded_at')
    ordering = ('-uploaded_at',)

    @admin.display(description='Candidate')
    def candidate_name(self, obj):
        return obj.candidate.user.get_full_name() or obj.candidate.user.username

