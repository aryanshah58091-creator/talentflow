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

        if self.request.user.role == "recruiter":
            return qs.filter(recruiter=self.request.user)

        return qs.filter(status=Job.Status.PUBLISHED)

    def perform_create(self, serializer):
        from companies.models import RecruiterProfile

        profile = RecruiterProfile.objects.get(user=self.request.user)

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