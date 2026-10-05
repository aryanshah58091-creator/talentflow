from rest_framework import generics, permissions

from .models import Job, Skill
from .serializers import JobSerializer, SkillSerializer


class JobListCreateView(generics.ListCreateAPIView):
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = (
            Job.objects
            .select_related("company", "recruiter")
            .prefetch_related("skills")
            .order_by("-created_at")
        )

        if getattr(self.request.user, 'role', '') in ['recruiter', 'admin'] or getattr(self.request.user, 'is_staff', False):
            return qs

        return qs.filter(status=Job.Status.PUBLISHED)

    def create(self, request, *args, **kwargs):
        if getattr(request.user, 'role', '') == 'candidate':
            from rest_framework import status
            from rest_framework.response import Response
            return Response(
                {'detail': 'Candidates cannot create jobs. Only recruiters and administrators are authorized.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):

        from companies.models import Company, RecruiterProfile

        company_name = self.request.data.get('company_name')
        profile = RecruiterProfile.objects.filter(user=self.request.user).first()

        if company_name and str(company_name).strip():
            company, _ = Company.objects.get_or_create(
                name=str(company_name).strip(),
                defaults={'location': self.request.data.get('location', '')}
            )
            if profile:
                profile.company = company
                profile.save(update_fields=['company'])
            else:
                profile = RecruiterProfile.objects.create(
                    user=self.request.user,
                    company=company,
                    position='Recruiter'
                )
        elif not profile:
            comp_name = f"{self.request.user.first_name or self.request.user.username}'s Org"
            company, _ = Company.objects.get_or_create(
                name=comp_name,
                defaults={'location': 'Remote / Global'}
            )
            profile = RecruiterProfile.objects.create(
                user=self.request.user,
                company=company,
                position='Recruiter'
            )
        else:
            company = profile.company

            profile.save(update_fields=['company'])

        serializer.save(
            recruiter=self.request.user,
            company=profile.company
        )


class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = (
        Job.objects
        .select_related("company", "recruiter")
        .prefetch_related("skills")
    )
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]


class SkillListView(generics.ListCreateAPIView):
    queryset = Skill.objects.all().order_by("name")
    serializer_class = SkillSerializer
    permission_classes = [permissions.IsAuthenticated]