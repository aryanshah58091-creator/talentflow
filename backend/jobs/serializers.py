from rest_framework import serializers
from .models import Job, Skill, JobSkill
class SkillSerializer(serializers.ModelSerializer):
    class Meta: model=Skill; fields='__all__'
class JobSerializer(serializers.ModelSerializer):
    skills=SkillSerializer(many=True,read_only=True)
    skill_ids=serializers.ListField(child=serializers.IntegerField(),write_only=True,required=False)
    company_name=serializers.CharField(source='company.name',read_only=True)
    class Meta: model=Job; fields=[ 'id', 'company', 'company_name', 'recruiter', 'title', 'description', 'requirements', 'location', 'employment_type', 'workplace', 'experience_level', 'salary_min', 'salary_max', 'status', 'skills', 'skill_ids', 'created_at', 'updated_at', ]; read_only_fields=[ 'id', 'company', 'company_name', 'recruiter', 'created_at', 'updated_at', ]
    def create(self, validated_data):
        ids=validated_data.pop('skill_ids',[]); job=Job.objects.create(**validated_data)
        for sid in ids:
            skill=Skill.objects.get(id=sid); JobSkill.objects.create(job=job,skill=skill)
        return job
    def update(self, instance, validated_data):
        ids=validated_data.pop('skill_ids',None); instance=super().update(instance,validated_data)
        if ids is not None:
            JobSkill.objects.filter(job=instance).delete()
            for sid in ids: JobSkill.objects.create(job=instance,skill_id=sid)
        return instance
