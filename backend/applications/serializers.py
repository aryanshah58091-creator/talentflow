from rest_framework import serializers
from .models import (
    Application, StatusHistory, Interview, InterviewFeedback, Offer, SavedJob, Notification,
    Assessment, AssessmentQuestion, AssessmentAttempt
)

class StatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name=serializers.CharField(source='changed_by.get_full_name',read_only=True)
    class Meta: model=StatusHistory; fields='__all__'

class AssessmentQuestionCandidateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentQuestion
        fields = ['id', 'category', 'question_text', 'options', 'order']

class AssessmentQuestionFullSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentQuestion
        fields = ['id', 'category', 'question_text', 'options', 'correct_option', 'explanation', 'order']

class AssessmentSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job.title', read_only=True)
    questions_count = serializers.IntegerField(source='questions.count', read_only=True)

    class Meta:
        model = Assessment
        fields = ['id', 'job', 'job_title', 'title', 'description', 'duration_minutes', 'passing_score', 'questions_count', 'created_at']

class AssessmentAttemptSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(source='candidate.get_full_name', read_only=True)
    assessment_title = serializers.CharField(source='assessment.title', read_only=True)
    duration_minutes = serializers.IntegerField(source='assessment.duration_minutes', read_only=True)
    passing_score = serializers.IntegerField(source='assessment.passing_score', read_only=True)

    class Meta:
        model = AssessmentAttempt
        fields = [
            'id', 'application', 'candidate', 'candidate_name', 'assessment', 'assessment_title',
            'duration_minutes', 'passing_score', 'status', 'started_at', 'completed_at',
            'score_percentage', 'total_questions', 'correct_answers_count', 'passed',
            'violations_count', 'answers', 'category_scores', 'created_at'
        ]
        read_only_fields = ['id', 'candidate', 'created_at']

class ApplicationSerializer(serializers.ModelSerializer):
    job_title=serializers.CharField(source='job.title',read_only=True); candidate_name=serializers.CharField(source='candidate.get_full_name',read_only=True); history=StatusHistorySerializer(source='status_history',many=True,read_only=True)
    assessment_info = serializers.SerializerMethodField()

    class Meta:
        model=Application
        fields=[
            'id','job','job_title','candidate','candidate_name','cover_letter','resume_text',
            'resume_filename','status','match_score','ai_summary','ai_strengths','ai_weaknesses',
            'ai_recommendation','ai_interview_questions','assessment_info','applied_at','updated_at','history'
        ]
        read_only_fields=['id','candidate','applied_at','updated_at','history','assessment_info']

    def get_assessment_info(self, obj):
        attempt = getattr(obj, 'assessment_attempt', None)
        if attempt:
            return {
                'id': attempt.id,
                'status': attempt.status,
                'score_percentage': attempt.score_percentage,
                'total_questions': attempt.total_questions,
                'correct_answers_count': attempt.correct_answers_count,
                'passed': attempt.passed,
                'violations_count': attempt.violations_count,
                'category_scores': attempt.category_scores,
                'started_at': attempt.started_at,
                'completed_at': attempt.completed_at,
            }
        return None

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

class FeedbackSerializer(serializers.ModelSerializer):
    interviewer_name = serializers.SerializerMethodField()

    class Meta:
        model = InterviewFeedback
        fields = ['id', 'interview', 'interviewer', 'interviewer_name', 'rating', 'comments', 'created_at']
        read_only_fields = ['interview', 'interviewer', 'created_at']

    def get_interviewer_name(self, obj):
        return obj.interviewer.get_full_name() or obj.interviewer.username

class InterviewSerializer(serializers.ModelSerializer):
    candidate_name = serializers.SerializerMethodField()
    candidate_email = serializers.CharField(source='application.candidate.email', read_only=True)
    candidate_username = serializers.CharField(source='application.candidate.username', read_only=True)
    candidate_id = serializers.IntegerField(source='application.candidate.id', read_only=True)
    job_id = serializers.IntegerField(source='application.job.id', read_only=True)
    job_title = serializers.CharField(source='application.job.title', read_only=True)
    company_name = serializers.SerializerMethodField()
    match_score = serializers.IntegerField(source='application.match_score', read_only=True)
    ai_interview_questions = serializers.SerializerMethodField()
    assessment_score = serializers.SerializerMethodField()
    meeting_link = serializers.CharField(required=False, allow_blank=True, default='')
    feedback_entries = FeedbackSerializer(many=True, read_only=True)

    class Meta:
        model = Interview
        fields = [
            'id', 'application', 'round', 'interview_time', 'mode', 'meeting_link',
            'status', 'feedback', 'candidate_name', 'candidate_email', 'candidate_username',
            'candidate_id', 'job_id', 'job_title', 'company_name', 'match_score',
            'ai_interview_questions', 'assessment_score', 'feedback_entries'
        ]

    def validate_meeting_link(self, value):
        if not value:
            return ""
        val = value.strip()
        if not val:
            return ""
        if val.startswith('http://') or val.startswith('https://'):
            return val
        if '.' in val and ' ' not in val:
            return f"https://{val}"
        return f"https://talentflow.internal/meeting?room={val.replace(' ', '+')}"

    def get_candidate_name(self, obj):
        cand = obj.application.candidate
        return cand.get_full_name() or cand.username

    def get_company_name(self, obj):
        if obj.application.job and obj.application.job.company:
            return obj.application.job.company.name
        return "TalentFlow Partner"

    def get_ai_interview_questions(self, obj):
        request = self.context.get('request')
        # Candidates must never see interviewer's AI evaluation questions
        if request and getattr(request.user, 'role', '') == 'candidate':
            return []

        questions = obj.application.ai_interview_questions
        if questions and len(questions) > 0:
            return questions

        # If recruiter is viewing and questions are not yet populated, generate immediately
        try:
            from .ai_agent import evaluate_application_with_ai
            res = evaluate_application_with_ai(obj.application)
            questions = res.get('interview_questions', [])
            if questions:
                obj.application.ai_interview_questions = questions
                obj.application.save(update_fields=['ai_interview_questions'])
                return questions
        except Exception:
            pass

        return questions or []

    def get_assessment_score(self, obj):
        attempt = getattr(obj.application, 'assessment_attempt', None)
        if attempt and attempt.status == 'completed':
            return {
                'score_percentage': attempt.score_percentage,
                'passed': attempt.passed,
                'category_scores': attempt.category_scores
            }
        return None
class OfferSerializer(serializers.ModelSerializer):
    class Meta: model=Offer; fields='__all__'; read_only_fields=['created_at']
class NotificationSerializer(serializers.ModelSerializer):
    class Meta: model=Notification; fields='__all__'; read_only_fields=['user','created_at']

