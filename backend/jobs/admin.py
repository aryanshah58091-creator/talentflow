from django.contrib import admin
from .models import Job, Skill, JobSkill

class JobSkillInline(admin.TabularInline):
    model = JobSkill
    extra = 1

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'company', 'recruiter_name', 'employment_type', 'workplace', 'status', 'created_at')
    list_filter = ('status', 'employment_type', 'workplace', 'company')
    search_fields = ('title', 'company__name', 'location', 'description', 'requirements')
    inlines = [JobSkillInline]
    ordering = ('-created_at',)

    @admin.display(description='Recruiter')
    def recruiter_name(self, obj):
        return obj.recruiter.get_full_name() or obj.recruiter.username

@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'description')
    search_fields = ('name', 'category', 'description')
    list_filter = ('category',)
    ordering = ('name',)

@admin.register(JobSkill)
class JobSkillAdmin(admin.ModelAdmin):
    list_display = ('job', 'skill', 'is_required')
    list_filter = ('is_required', 'skill')
    search_fields = ('job__title', 'skill__name')
    ordering = ('job__title',)

