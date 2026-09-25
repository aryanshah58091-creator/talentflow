# TalentFlow Architecture v1.0

```text
React Frontend
      |
      | REST / JSON
      v
Django + Django REST Framework
      |
      v
PostgreSQL

Future async layer:
Redis <-> Celery

Production:
Docker -> Nginx -> Gunicorn -> Django
```

## Core domains

- accounts: users, roles, candidate profile, resumes
- companies: company and recruiter profile
- jobs: jobs, skills, job-skill relationships
- applications: applications, status history, interviews, feedback, offers, saved jobs, notifications

## Design principles

1. PostgreSQL is the source of truth for relational application data.
2. Resume and offer files use Django storage; object storage can be added later.
3. Candidate, recruiter and admin access is role-aware.
4. Core recruitment works without AI.
5. Redis/Celery are introduced for asynchronous workloads instead of making every request synchronous.
