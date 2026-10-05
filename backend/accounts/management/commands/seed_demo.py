from django.core.management.base import BaseCommand
from accounts.models import User, CandidateProfile
from companies.models import Company, RecruiterProfile
from jobs.models import Job, Skill, JobSkill
from applications.models import Application, StatusHistory


class Command(BaseCommand):
    help = 'Create a complete local demo dataset for TalentFlow.'

    def handle(self, *args, **kwargs):

        # ---------------------------------------------------------
        # Recruiter
        # ---------------------------------------------------------
        recruiter, _ = User.objects.get_or_create(
            username='demo_recruiter',
            defaults={
                'email': 'recruiter@talentflow.local',
                'first_name': 'Alex',
                'last_name': 'Recruiter',
                'role': 'recruiter',
            }
        )

        recruiter.set_password('DemoPass123!')
        recruiter.role = 'recruiter'
        recruiter.save()

        # ---------------------------------------------------------
        # Company
        # ---------------------------------------------------------
        company, _ = Company.objects.get_or_create(
            name='TalentFlow Labs',
            defaults={
                'description': 'A modern product team building tools for better hiring.',
                'website': 'https://example.com',
                'location': 'Chennai, India',
            }
        )

        RecruiterProfile.objects.get_or_create(
            user=recruiter,
            defaults={
                'company': company,
                'position': 'Talent Acquisition Lead',
            }
        )

        # ---------------------------------------------------------
        # Skills
        # ---------------------------------------------------------
        skill_names = [
            'Python',
            'Django',
            'PostgreSQL',
            'REST API',
            'React',
            'JavaScript',
            'Git',
            'Docker',
        ]

        skills = {
            name: Skill.objects.get_or_create(name=name)[0]
            for name in skill_names
        }

        # ---------------------------------------------------------
        # Jobs
        # ---------------------------------------------------------
        jobs_data = [
            {
                'title': 'Senior Python Developer',
                'description': (
                    'Build reliable backend services and APIs using '
                    'Python, Django and PostgreSQL.'
                ),
                'requirements': 'Django, REST API, PostgreSQL, Git',
                'location': 'Chennai, India',
                'skills': ['Python', 'Django', 'PostgreSQL', 'REST API', 'Git'],
            },
            {
                'title': 'React Frontend Engineer',
                'description': (
                    'Create polished and responsive product experiences '
                    'for modern hiring teams.'
                ),
                'requirements': 'React, JavaScript, Git',
                'location': 'Remote',
                'skills': ['React', 'JavaScript', 'Git'],
            },
            {
                'title': 'Django Backend Developer',
                'description': (
                    'Build and maintain scalable backend services and REST '
                    'APIs using Django and Django REST Framework. Work with '
                    'PostgreSQL databases, implement secure authentication '
                    'and business logic, optimize API performance, and '
                    'collaborate with frontend developers to deliver '
                    'reliable web applications.'
                ),
                'requirements': 'Python, Django, PostgreSQL, REST API, Docker',
                'location': 'Chennai, India',
                'skills': ['Python', 'Django', 'PostgreSQL', 'REST API', 'Docker'],
            },
            {
                'title': 'Full Stack Developer',
                'description': (
                    'Develop end-to-end web applications across the frontend '
                    'and backend. Build responsive user interfaces with '
                    'React, create robust APIs using Django REST Framework, '
                    'integrate PostgreSQL databases, and work across the full '
                    'development lifecycle from feature implementation to '
                    'testing and deployment.'
                ),
                'requirements': 'React, JavaScript, Django, PostgreSQL, Git',
                'location': 'Remote',
                'skills': ['React', 'JavaScript', 'Django', 'PostgreSQL', 'Git'],
            },
        ]

        jobs = {}

        for data in jobs_data:
            job = Job.objects.filter(title=data['title'], company=company, recruiter=recruiter).first()
            if not job:
                job = Job.objects.create(
                    title=data['title'],
                    company=company,
                    recruiter=recruiter,
                    description=data['description'],
                    requirements=data['requirements'],
                    location=data['location'],
                    workplace='hybrid',
                    experience_level='2+ years',
                    status='published',
                )

            jobs[data['title']] = job

            for skill_name in data['skills']:
                JobSkill.objects.get_or_create(
                    job=job,
                    skill=skills[skill_name],
                    defaults={'is_required': True}
                )

        # ---------------------------------------------------------
        # Demo Candidates
        # ---------------------------------------------------------
        candidates_data = [
            {
                'username': 'demo_candidate',
                'email': 'candidate@talentflow.local',
                'first_name': 'Priya',
                'last_name': 'Candidate',
                'headline': 'Python Developer',
                'location': 'Chennai, India',
                'skills': ['Python', 'Django', 'PostgreSQL'],
                'experience_years': 2.5,
            },
            {
                'username': 'arjun_kumar',
                'email': 'arjun@talentflow.local',
                'first_name': 'Arjun',
                'last_name': 'Kumar',
                'headline': 'Backend Developer',
                'location': 'Bengaluru, India',
                'skills': ['Python', 'Django', 'REST API', 'PostgreSQL'],
                'experience_years': 3.5,
            },
            {
                'username': 'divya_sharma',
                'email': 'divya@talentflow.local',
                'first_name': 'Divya',
                'last_name': 'Sharma',
                'headline': 'Django Developer',
                'location': 'Coimbatore, India',
                'skills': ['Python', 'Django', 'PostgreSQL', 'Docker'],
                'experience_years': 3.0,
            },
            {
                'username': 'rahul_menon',
                'email': 'rahul@talentflow.local',
                'first_name': 'Rahul',
                'last_name': 'Menon',
                'headline': 'React Developer',
                'location': 'Kochi, India',
                'skills': ['React', 'JavaScript', 'Git'],
                'experience_years': 2.0,
            },
            {
                'username': 'ananya_iyer',
                'email': 'ananya@talentflow.local',
                'first_name': 'Ananya',
                'last_name': 'Iyer',
                'headline': 'Frontend Engineer',
                'location': 'Chennai, India',
                'skills': ['React', 'JavaScript', 'Git'],
                'experience_years': 2.8,
            },
            {
                'username': 'karthik_raj',
                'email': 'karthik@talentflow.local',
                'first_name': 'Karthik',
                'last_name': 'Raj',
                'headline': 'Django Backend Engineer',
                'location': 'Madurai, India',
                'skills': ['Python', 'Django', 'REST API', 'Docker'],
                'experience_years': 4.0,
            },
            {
                'username': 'sneha_nair',
                'email': 'sneha@talentflow.local',
                'first_name': 'Sneha',
                'last_name': 'Nair',
                'headline': 'Full Stack Developer',
                'location': 'Trivandrum, India',
                'skills': ['React', 'Django', 'PostgreSQL', 'JavaScript'],
                'experience_years': 3.2,
            },
            {
                'username': 'vikram_das',
                'email': 'vikram@talentflow.local',
                'first_name': 'Vikram',
                'last_name': 'Das',
                'headline': 'Full Stack Engineer',
                'location': 'Bengaluru, India',
                'skills': ['React', 'Django', 'PostgreSQL', 'Git'],
                'experience_years': 5.0,
            },
        ]

        candidates = {}

        for data in candidates_data:
            candidate, _ = User.objects.get_or_create(
                username=data['username'],
                defaults={
                    'email': data['email'],
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'role': 'candidate',
                }
            )

            candidate.role = 'candidate'
            candidate.set_password('DemoPass123!')
            candidate.save()

            profile, _ = CandidateProfile.objects.get_or_create(
                user=candidate,
                defaults={
                    'headline': data['headline'],
                    'location': data['location'],
                    'skills': data['skills'],
                    'experience_years': data['experience_years'],
                }
            )

            # Keep existing profiles populated as well.
            profile.headline = data['headline']
            profile.location = data['location']
            profile.skills = data['skills']
            profile.experience_years = data['experience_years']
            profile.save()

            candidates[data['username']] = candidate

        # ---------------------------------------------------------
        # Demo Applications
        # ---------------------------------------------------------
        applications_data = [
            {
                'candidate': 'demo_candidate',
                'job': 'Senior Python Developer',
                'status': 'shortlisted',
                'score': 87,
                'cover_letter': 'I would love to contribute to the backend team.',
            },
            {
                'candidate': 'arjun_kumar',
                'job': 'Senior Python Developer',
                'status': 'applied',
                'score': 82,
                'cover_letter': 'I am interested in contributing my backend experience.',
            },
            {
                'candidate': 'divya_sharma',
                'job': 'Senior Python Developer',
                'status': 'screening',
                'score': 90,
                'cover_letter': 'My Django and PostgreSQL experience aligns well with this role.',
            },
            {
                'candidate': 'rahul_menon',
                'job': 'React Frontend Engineer',
                'status': 'interview',
                'score': 88,
                'cover_letter': 'I enjoy building polished and user-friendly React applications.',
            },
            {
                'candidate': 'ananya_iyer',
                'job': 'React Frontend Engineer',
                'status': 'shortlisted',
                'score': 91,
                'cover_letter': 'I would be excited to build modern frontend experiences.',
            },
            {
                'candidate': 'karthik_raj',
                'job': 'Django Backend Developer',
                'status': 'applied',
                'score': 85,
                'cover_letter': 'I am excited about the opportunity to work on Django backend systems.',
            },
            {
                'candidate': 'sneha_nair',
                'job': 'Full Stack Developer',
                'status': 'screening',
                'score': 89,
                'cover_letter': 'My full stack experience matches the requirements of this role.',
            },
            {
                'candidate': 'vikram_das',
                'job': 'Full Stack Developer',
                'status': 'rejected',
                'score': 68,
                'cover_letter': 'I am interested in contributing across frontend and backend development.',
            },
        ]

        for data in applications_data:
            candidate = candidates[data['candidate']]
            job = jobs[data['job']]

            application = Application.objects.filter(job=job, candidate=candidate).first()
            if not application:
                application = Application.objects.create(
                    job=job,
                    candidate=candidate,
                    cover_letter=data['cover_letter'],
                    status=data['status'],
                    match_score=data['score'],
                )
            else:
                application.cover_letter = data['cover_letter']
                application.status = data['status']
                application.match_score = data['score']
                application.save()

            # Always make sure the application has a useful history.
            history_statuses = ['applied']

            if data['status'] in ['screening', 'shortlisted', 'interview', 'offer', 'hired', 'rejected']:
                history_statuses.append('screening')

            if data['status'] in ['shortlisted', 'interview', 'offer', 'hired']:
                history_statuses.append('shortlisted')

            if data['status'] in ['interview', 'offer', 'hired']:
                history_statuses.append('interview')

            if data['status'] in ['offer', 'hired']:
                history_statuses.append('offer')

            if data['status'] == 'hired':
                history_statuses.append('hired')

            if data['status'] == 'rejected':
                history_statuses.append('rejected')

            for status in history_statuses:
                changed_by = candidate if status == 'applied' else recruiter

                if not StatusHistory.objects.filter(application=application, status=status).exists():
                    StatusHistory.objects.create(
                        application=application,
                        status=status,
                        changed_by=changed_by,
                        notes='Demo recruitment activity',
                    )

        # ---------------------------------------------------------
        # Seed Online Aptitude Assessments
        # ---------------------------------------------------------
        from applications.views import get_or_create_job_assessment
        for job in Job.objects.all():
            get_or_create_job_assessment(job)

        # ---------------------------------------------------------
        # Seed Demo Interviews & Feedback
        # ---------------------------------------------------------
        from applications.models import Interview, InterviewFeedback
        from django.utils import timezone
        import datetime

        now = timezone.now()

        # 1. Technical Round for demo_candidate (tomorrow)
        demo_cand_app = Application.objects.filter(candidate__username='demo_candidate').first()
        if demo_cand_app:
            demo_cand_app.status = 'interview'
            demo_cand_app.save(update_fields=['status'])
            interview1 = Interview.objects.filter(application=demo_cand_app, round='Technical Assessment & Live Coding').first()
            if not interview1:
                interview1 = Interview.objects.create(
                    application=demo_cand_app,
                    round='Technical Assessment & Live Coding',
                    interview_time=now + datetime.timedelta(days=1, hours=2),
                    mode='Online Video (Google Meet)',
                    meeting_link='https://meet.google.com/abc-tfno-xyz',
                    status='scheduled',
                    feedback=''
                )

        # 2. System Architecture for rahul_menon (in 2 days)
        rahul_app = Application.objects.filter(candidate__username='rahul_menon').first()
        if rahul_app:
            interview2 = Interview.objects.filter(application=rahul_app, round='Frontend Architecture & Code Review').first()
            if not interview2:
                interview2 = Interview.objects.create(
                    application=rahul_app,
                    round='Frontend Architecture & Code Review',
                    interview_time=now + datetime.timedelta(days=2, hours=4),
                    mode='Online Video (Zoom)',
                    meeting_link='https://zoom.us/j/9876543210',
                    status='scheduled',
                    feedback=''
                )

        # 3. Completed Screening Round for divya_sharma (yesterday with rating & feedback)
        divya_app = Application.objects.filter(candidate__username='divya_sharma').first()
        if divya_app:
            interview3 = Interview.objects.filter(application=divya_app, round='Initial Technical & Culture Screen').first()
            if not interview3:
                interview3 = Interview.objects.create(
                    application=divya_app,
                    round='Initial Technical & Culture Screen',
                    interview_time=now - datetime.timedelta(days=1, hours=3),
                    mode='Online Video (Google Meet)',
                    meeting_link='https://meet.google.com/div-tech-meet',
                    status='completed',
                    feedback='[Demo Recruiter - Rating: 5/5]: Excellent grasp of Django ORM, query optimization, and REST API conventions. Strong communication skills and demonstrated production debugging capabilities.'
                )
            if not interview3.feedback_entries.exists():
                InterviewFeedback.objects.create(
                    interview=interview3,
                    interviewer=recruiter,
                    rating=5,
                    comments='Superb candidate. Demonstrated deep knowledge of Django transactions, celery task queues, and DB indexing. Recommended for immediate Technical Round 2.'
                )

        # ---------------------------------------------------------
        # Finished
        # ---------------------------------------------------------
        self.stdout.write(
            self.style.SUCCESS(
                'Demo data ready. '
                'Recruiter: demo_recruiter / DemoPass123! | '
                'Candidate: demo_candidate / DemoPass123!'
            )
        )