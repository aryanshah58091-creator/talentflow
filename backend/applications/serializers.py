from rest_framework import serializers
from .models import Application, StatusHistory, Interview, InterviewFeedback, Offer, SavedJob, Notification
class StatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name=serializers.CharField(source='changed_by.get_full_name',read_only=True)
    class Meta: model=StatusHistory; fields='__all__'
class ApplicationSerializer(serializers.ModelSerializer):
    job_title=serializers.CharField(source='job.title',read_only=True); candidate_name=serializers.CharField(source='candidate.get_full_name',read_only=True); history=StatusHistorySerializer(source='status_history',many=True,read_only=True)
    class Meta:
        model=Application
        fields=['id','job','job_title','candidate','candidate_name','cover_letter','resume_text','resume_filename','status','match_score','ai_summary','ai_strengths','ai_weaknesses','ai_recommendation','ai_interview_questions','applied_at','updated_at','history']
        read_only_fields=['id','candidate','applied_at','updated_at','history']

    def validate(self, attrs):
        request = self.context.get('request')
        job = attrs.get('job')
        if request and request.user and job and not self.instance:
            if Application.objects.filter(job=job, candidate=request.user).exists():
                raise serializers.ValidationError({'detail': 'You have already applied for this job.'})
            resume_text = attrs.get('resume_text', '')
            if not resume_text or len(resume_text.strip()) < 20:
                raise serializers.ValidationError({'detail': 'Resume is mandatory to submit your application. Please upload a resume file or paste your resume content.'})
        return attrs
class InterviewSerializer(serializers.ModelSerializer):
    class Meta: model=Interview; fields='__all__'
class FeedbackSerializer(serializers.ModelSerializer):
    class Meta: model=InterviewFeedback; fields='__all__'; read_only_fields=['interviewer','created_at']
class OfferSerializer(serializers.ModelSerializer):
    class Meta: model=Offer; fields='__all__'; read_only_fields=['created_at']
class NotificationSerializer(serializers.ModelSerializer):
    class Meta: model=Notification; fields='__all__'; read_only_fields=['user','created_at']
