from rest_framework import generics
from .models import Company, RecruiterProfile
from .serializers import CompanySerializer, RecruiterProfileSerializer
class CompanyListCreateView(generics.ListCreateAPIView):
    queryset=Company.objects.all(); serializer_class=CompanySerializer
    def perform_create(self, serializer):
        company=serializer.save(); RecruiterProfile.objects.get_or_create(user=self.request.user, defaults={'company':company,'position':'Recruiter'})
class CompanyDetailView(generics.RetrieveUpdateDestroyAPIView): queryset=Company.objects.all(); serializer_class=CompanySerializer
class MyRecruiterProfileView(generics.RetrieveUpdateAPIView):
    serializer_class=RecruiterProfileSerializer
    def get_object(self): return RecruiterProfile.objects.get(user=self.request.user)
