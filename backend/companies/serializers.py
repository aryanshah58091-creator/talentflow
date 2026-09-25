from rest_framework import serializers
from .models import Company, RecruiterProfile
class CompanySerializer(serializers.ModelSerializer):
    class Meta: model=Company; fields='__all__'; read_only_fields=['id','created_at','updated_at']
class RecruiterProfileSerializer(serializers.ModelSerializer):
    company=CompanySerializer(read_only=True)
    class Meta: model=RecruiterProfile; fields='__all__'; read_only_fields=['id','user','company']
