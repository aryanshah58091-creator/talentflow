from rest_framework import generics, permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import User, CandidateProfile, Resume
from .serializers import RegisterSerializer, UserSerializer, CandidateProfileSerializer, ResumeSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all(); serializer_class = RegisterSerializer; permission_classes = [permissions.AllowAny]
    def create(self, request, *args, **kwargs):
        s=self.get_serializer(data=request.data); s.is_valid(raise_exception=True); user=s.save(); token,_=Token.objects.get_or_create(user=user)
        return Response({'token':token.key,'user':UserSerializer(user).data}, status=status.HTTP_201_CREATED)

class MeView(APIView):
    def get(self, request): return Response(UserSerializer(request.user).data)

class CandidateProfileView(generics.RetrieveUpdateAPIView):
    serializer_class=CandidateProfileSerializer
    def get_object(self):
        profile, _ = CandidateProfile.objects.get_or_create(user=self.request.user)
        return profile

class ResumeListCreateView(generics.ListCreateAPIView):
    serializer_class=ResumeSerializer
    def get_queryset(self): return Resume.objects.filter(candidate__user=self.request.user)
    def perform_create(self, serializer):
        profile, _ = CandidateProfile.objects.get_or_create(user=self.request.user)
        serializer.save(candidate=profile, file_name=self.request.FILES.get('file').name if self.request.FILES.get('file') else '')
