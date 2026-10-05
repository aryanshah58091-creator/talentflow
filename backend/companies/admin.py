from django.contrib import admin
from .models import Company, RecruiterProfile

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'location', 'website', 'created_at')
    search_fields = ('name', 'location', 'website', 'description')
    ordering = ('name',)

@admin.register(RecruiterProfile)
class RecruiterProfileAdmin(admin.ModelAdmin):
    list_display = ('recruiter_name', 'company', 'position', 'department')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'user__email', 'company__name', 'position')
    list_filter = ('company', 'department')
    ordering = ('company__name',)

    @admin.display(description='Recruiter Name')
    def recruiter_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

