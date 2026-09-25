from django.db import transaction, IntegrityError
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import serializers
from .models import Application, StatusHistory, Interview, InterviewFeedback, Offer, SavedJob, Notification
from .serializers import ApplicationSerializer, InterviewSerializer, FeedbackSerializer, OfferSerializer, NotificationSerializer

class ApplicationListCreateView(generics.ListCreateAPIView):
    serializer_class=ApplicationSerializer
    def get_queryset(self):
        qs=Application.objects.select_related('job','candidate').prefetch_related('status_history').order_by('-applied_at')
        if self.request.user.role == 'candidate': return qs.filter(candidate=self.request.user)
        if self.request.user.role == 'recruiter': return qs.filter(job__recruiter=self.request.user)
        return qs

    def create(self, request, *args, **kwargs):
        if getattr(request.user, 'role', '') == 'recruiter':
            return Response(
                {'detail': 'Recruiters cannot apply for jobs. Please log in with a candidate account.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        job_id = request.data.get('job')
        if not job_id:
            return Response({'detail': 'Job ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if Application.objects.filter(job_id=job_id, candidate=request.user).exists():
            return Response(
                {'detail': 'You have already applied for this job.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().create(request, *args, **kwargs)

    @transaction.atomic
    def perform_create(self, serializer):
        try:
            app=serializer.save(candidate=self.request.user)
        except IntegrityError:
            raise serializers.ValidationError({'detail': 'You have already applied for this job.'})
            
        # Automated ATS Resume Screening Pipeline
        try:
            from .ai_agent import evaluate_application_with_ai
            res = evaluate_application_with_ai(app)
            app.match_score = res.get('match_score')
            app.ai_summary = res.get('summary', '')
            app.ai_strengths = res.get('strengths', [])
            app.ai_weaknesses = res.get('weaknesses', []) or res.get('gaps', [])
            app.ai_recommendation = res.get('recommendation', '')
            app.ai_interview_questions = res.get('interview_questions', [])
            app.save(update_fields=['match_score', 'ai_summary', 'ai_strengths', 'ai_weaknesses', 'ai_recommendation', 'ai_interview_questions'])
        except Exception as e:
            print(f"[AutoATS] Evaluation error on submission: {e}")
            
        StatusHistory.objects.create(
            application=app,
            status=app.status,
            changed_by=self.request.user,
            notes='Application submitted with candidate resume.'
        )
        if app.job and app.job.recruiter:
            score_text = f" (ATS Score: {app.match_score}%)" if app.match_score else ""
            Notification.objects.create(
                user=app.job.recruiter,
                title='New Candidate Application',
                message=f'{self.request.user.get_full_name() or self.request.user.username} submitted an application for {app.job.title}{score_text}.'
            )

class ApplicationDetailView(generics.RetrieveUpdateAPIView):
    queryset=Application.objects.select_related('job','candidate').prefetch_related('status_history'); serializer_class=ApplicationSerializer
    def update(self, request,*args,**kwargs):
        instance=self.get_object(); old=instance.status
        data=request.data.copy()
        if request.user.role == 'candidate':
            data.pop('status', None); data.pop('match_score', None)
        serializer=self.get_serializer(instance, data=data, partial=kwargs.pop('partial', False))
        serializer.is_valid(raise_exception=True); self.perform_update(serializer)
        instance.refresh_from_db()
        if old != instance.status:
            StatusHistory.objects.create(application=instance,status=instance.status,changed_by=request.user)
            Notification.objects.create(user=instance.candidate,title='Application updated',message=f'Your application for {instance.job.title} moved to {instance.get_status_display()}.')
        return Response(self.get_serializer(instance).data)

class InterviewListCreateView(generics.ListCreateAPIView):
    serializer_class=InterviewSerializer
    def get_queryset(self):
        qs=Interview.objects.filter(application__job__recruiter=self.request.user) if self.request.user.role=='recruiter' else Interview.objects.filter(application__candidate=self.request.user)
        return qs.order_by('interview_time')
    def perform_create(self,serializer):
        interview=serializer.save(); Notification.objects.create(user=interview.application.candidate,title='Interview scheduled',message=f'{interview.round} for {interview.application.job.title}.')

class InterviewFeedbackCreateView(generics.CreateAPIView):
    serializer_class=FeedbackSerializer
    def perform_create(self,serializer): serializer.save(interviewer=self.request.user)

class OfferListCreateView(generics.ListCreateAPIView):
    serializer_class=OfferSerializer
    def get_queryset(self): return Offer.objects.filter(application__job__recruiter=self.request.user) if self.request.user.role=='recruiter' else Offer.objects.filter(application__candidate=self.request.user)

class NotificationListView(generics.ListAPIView):
    serializer_class=NotificationSerializer
    def get_queryset(self): return Notification.objects.filter(user=self.request.user).order_by('-created_at')
class NotificationReadView(APIView):
    def post(self,request,pk):
        n=Notification.objects.get(pk=pk,user=request.user); n.is_read=True; n.save(update_fields=['is_read']); return Response({'status':'read'})

class SavedJobView(APIView):
    def get(self,request): return Response([{'id':x.job_id,'title':x.job.title} for x in SavedJob.objects.filter(candidate=request.user).select_related('job')])
    def post(self,request):
        job_id=request.data.get('job_id'); obj,_=SavedJob.objects.get_or_create(candidate=request.user,job_id=job_id); return Response({'saved':True,'id':obj.job_id})
    def delete(self,request): SavedJob.objects.filter(candidate=request.user,job_id=request.data.get('job_id')).delete(); return Response(status=204)

from .ai_agent import evaluate_application_with_ai

class ApplicationAIScreenView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if getattr(request.user, 'role', '') != 'recruiter' and not request.user.is_staff:
            return Response(
                {'detail': 'Only recruiters can screen candidates and access interview evaluation dossiers.'},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            application = Application.objects.select_related('job', 'candidate').prefetch_related('job__skills').get(pk=pk)
        except Application.DoesNotExist:
            return Response({'detail': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Ensure recruiter owns the job if assigned
        if application.job and application.job.recruiter and application.job.recruiter != request.user and not request.user.is_staff:
            return Response(
                {'detail': 'You only have permission to screen candidates for your own job listings.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Run the Multi-Stage AI Agent Pipeline
        result = evaluate_application_with_ai(application)

        # Update and persist in database
        application.match_score = result.get('match_score')
        application.ai_summary = result.get('summary', '')
        application.ai_strengths = result.get('strengths', [])
        application.ai_weaknesses = result.get('weaknesses', []) or result.get('gaps', [])
        application.ai_recommendation = result.get('recommendation', '')
        application.ai_interview_questions = result.get('interview_questions', [])
        application.save(update_fields=['match_score', 'ai_summary', 'ai_strengths', 'ai_weaknesses', 'ai_recommendation', 'ai_interview_questions'])

        return Response({
            'status': 'success',
            'application_id': application.id,
            'match_score': application.match_score,
            'summary': application.ai_summary,
            'recommendation': application.ai_recommendation,
            'strengths': application.ai_strengths,
            'weaknesses': application.ai_weaknesses,
            'gaps': application.ai_weaknesses,
            'resume_text': application.resume_text,
            'resume_filename': application.resume_filename,
            'interview_questions': application.ai_interview_questions
        })


class AutoShortlistView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if getattr(request.user, 'role', '') != 'recruiter' and not request.user.is_staff:
            return Response(
                {'detail': 'Only recruiters can execute automated candidate shortlisting.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        job_id = request.data.get('job_id')
        threshold = int(request.data.get('threshold', 75))
        
        qs = Application.objects.select_related('job', 'candidate').filter(status__in=['applied', 'screening'])
        if job_id:
            qs = qs.filter(job_id=job_id)
            
        if not request.user.is_staff:
            qs = qs.filter(job__recruiter=request.user)
            
        qualified = qs.filter(match_score__gte=threshold)
        count = 0
        promoted = []
        
        for app in qualified:
            app.status = Application.Status.SHORTLISTED
            app.save(update_fields=['status'])
            StatusHistory.objects.create(
                application=app,
                status=Application.Status.SHORTLISTED,
                changed_by=request.user,
                notes=f'Auto-shortlisted by ATS Engine (Score: {app.match_score}% >= {threshold}% threshold)'
            )
            Notification.objects.create(
                user=app.candidate,
                title='Application Shortlisted!',
                message=f'Congratulations! Your application for {app.job.title} was shortlisted based on your ATS resume score ({app.match_score}%).'
            )
            count += 1
            promoted.append({
                'id': app.id,
                'candidate_name': app.candidate.get_full_name() or app.candidate.username,
                'job_title': app.job.title,
                'match_score': app.match_score
            })
            
        return Response({
            'status': 'success',
            'shortlisted_count': count,
            'threshold': threshold,
            'promoted_candidates': promoted,
            'message': f'Successfully auto-shortlisted {count} qualified candidate(s) with ATS score ≥ {threshold}%!'
        })
