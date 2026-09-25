from rest_framework import serializers
from .models import User, CandidateProfile, Resume

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User; fields = ['id','username','email','first_name','last_name','role','date_joined']

class CandidateProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = CandidateProfile; fields = '__all__'; read_only_fields = ['id','user','created_at','updated_at']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    class Meta:
        model = User; fields = ['username','email','password','first_name','last_name','role']
    def create(self, validated_data):
        role = validated_data.pop('role', User.Role.CANDIDATE)
        if role == User.Role.ADMIN:
            role = User.Role.CANDIDATE
        user = User.objects.create_user(role=role, **validated_data)
        if role == User.Role.CANDIDATE:
            CandidateProfile.objects.create(user=user)
        return user

class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume; fields = ['id','file','file_name','is_primary','uploaded_at']; read_only_fields = ['id','uploaded_at']
