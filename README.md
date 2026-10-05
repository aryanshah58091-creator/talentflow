# TalentFlow

[![CI Pipeline](https://github.com/aryanshah58091-creator/talentflow/actions/workflows/ci.yml/badge.svg)](https://github.com/aryanshah58091-creator/talentflow/actions/workflows/ci.yml)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-6.1-092E20?logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Celery](https://img.shields.io/badge/Async%20Worker-Celery%20%2B%20Redis-37814A?logo=celery&logoColor=white)
![OpenAPI](https://img.shields.io/badge/Docs-Swagger%20%26%20OpenAPI%203.0-85EA2D?logo=swagger&logoColor=black)
![Tests](https://img.shields.io/badge/Automated%20Tests-11%20Passed%20(100%25)-brightgreen)

> An enterprise-grade, full-stack Applicant Tracking System (ATS) and talent pipeline platform powered by React, Django REST Framework, Celery, and Google Gemini AI.

TalentFlow handles the entire recruitment lifecycle: **Job Posting → In-Memory PDF Resume Parsing → Async AI ATS Screening → Shortlisting → Proctored Online Aptitude Assessments → Interview Rounds & Scorecards → Offer Letters → Recruiter Analytics**.

## Project Overview

TalentFlow empowers candidates to discover jobs, upload PDF resumes, and track applications with real-time feedback, while giving recruiters an advanced command center featuring an interactive Kanban pipeline, automated ATS screening, and recruitment funnel intelligence.

### Key Features

- 🔐 **Token-based Authentication & RBAC**: Role-aware access control strictly separating candidate and recruiter permissions
- 📄 **Automated PDF & Text Resume Parser**: In-memory document stream extraction using `pypdf`
- ⚡ **Asynchronous Task Architecture**: Celery worker queue + Redis message broker for non-blocking ATS evaluation
- 🤖 **Dual-Engine AI ATS Screener**: Google Gemini 1.5 Flash evaluation paired with an offline heuristic fallback scoring algorithm
- 📊 **Recruiter Funnel Intelligence Dashboard**: Real-time conversion rates, Time-to-Hire velocity, and ATS distribution metrics
- ⏱️ **Proctored Online Assessment Portal**: Timed aptitude testing with automated question generation and browser tab-switch violation tracking
- 🧭 **Interactive Kanban Pipeline**: Drag-and-drop candidate stage movement with immutable `StatusHistory` audit logs
- 📑 **Interactive OpenAPI 3.0 Documentation**: Live Swagger UI (`/api/docs/`) and Redoc (`/api/redoc/`) via `drf-spectacular`
- 🧪 **100% Automated Test Suite**: 11 unit & integration test cases validating auth, permissions, parser, and state transitions
- 🚀 **GitHub Actions CI/CD**: Automated testing and frontend bundle verification on push

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Modular Component Architecture, CSS |
| Backend | Python 3.12, Django 6.1, Django REST Framework |
| Task Queue & Cache | Celery 5.6, Redis |
| Document Extraction | `pypdf` (In-memory PDF parsing) |
| AI / LLM Engine | Google Gemini 1.5 Flash API + Deterministic Heuristic Engine |
| API Specifications | OpenAPI 3.0, `drf-spectacular` (Swagger UI & Redoc) |
| Database | PostgreSQL (Production) / SQLite (Local Dev) |
| Testing & CI/CD | Django TestCase, APIClient, GitHub Actions CI Pipeline |
| Containerization | Docker, Docker Compose, Gunicorn, Whitenoise |



---

# 1. Detailed Flowchart

![TalentFlow Detailed Flowchart](docs/images/detailed-flowchart.png)

The flowchart covers authentication, candidate journey, recruiter journey, application status, notifications and the final hiring flow.

[Open the detailed-flowchart PDF](docs/detailed-flowchart.pdf)

---

# 2. Project Showcase

## Current UI / Product Showcase

![TalentFlow Project Showcase](docs/images/project-showcase.png)

This showcase presents the complete TalentFlow desktop workflow in one clear view:

**Login / Register → Dashboard → Jobs Listing → Create Job → Job Skills → Applications → Pipeline → Status Management**

---

# 3. Blueprint

The blueprint defines the product vision, users, recruitment workflow, technology direction, security principles and progressive release strategy.

[Open the Blueprint PDF](docs/blueprint.pdf)

---

---

# 4. System Map

[Open the TalentFlow System Map / Feature Map](docs/system-map.pdf)

The system map documents the broader feature landscape and progressive development strategy.

---

# 5. System Architecture

```text
                    ┌──────────────────────┐
                    │   React + Vite UI    │
                    │  Browser / Frontend  │
                    └──────────┬───────────┘
                               │ JSON / REST
                               ▼
                    ┌──────────────────────┐
                    │ Django REST Framework│
                    │ Auth • Views • Logic  │
                    └──────────┬───────────┘
                               │ Django ORM
                               ▼
                    ┌──────────────────────┐
                    │      PostgreSQL      │
                    │     Primary Data     │
                    └──────────────────────┘
```

The current MVP follows a clear React → DRF → ORM → PostgreSQL request path.

[Open the detailed System Architecture PDF](docs/system-architecture.pdf)

---

# 6. User Roles

### Candidate

- Browse published jobs
- View job details and required skills
- Apply for jobs
- View submitted applications
- Track application status

### Recruiter

- Access recruiter dashboard
- Create jobs for their company
- Select required skills
- Review applications
- Move candidates through pipeline stages
- Manage recruitment status

### Admin / Future Platform Role

The broader blueprint includes an administrative role for platform oversight, moderation, analytics and audit activity. Advanced admin features are roadmap work rather than being presented as complete MVP functionality.

---



### Interactive API Documentation:
- **Swagger UI**: [http://127.0.0.1:8000/api/docs/](http://127.0.0.1:8000/api/docs/)
- **Redoc**: [http://127.0.0.1:8000/api/redoc/](http://127.0.0.1:8000/api/redoc/)
- **API Health Check**: [http://127.0.0.1:8000/api/v1/health/](http://127.0.0.1:8000/api/v1/health/)


---

# 7. User Manual

The complete user guide is available here:

[Open the TalentFlow User Manual](docs/user-manual.pdf)

### Quick Candidate Flow

```text
Login
  ↓
Dashboard
  ↓
Jobs
  ↓
View Job
  ↓
Apply
  ↓
Applications
  ↓
Track Status
```

### Quick Recruiter Flow

```text
Login
  ↓
Dashboard
  ↓
Create Job
  ↓
Select Skills
  ↓
Applications
  ↓
Pipeline
  ↓
Update Status
```

---

# 10. Project Deep Dive

[Open the Project Deep Dive](docs/project-deep-dive.pdf)

The deep dive explains:

- Product problem
- Domain model
- API structure
- Authentication and roles
- Database relationships
- Query optimization
- Skill relationship handling
- Application status updates
- Debugging decisions
- MVP boundaries
- Engineering approach

---



---

# 8. Lessons Learned

- Backend validation should remain the source of truth.
- Authentication and authorization are different concerns.
- Small reversible changes are easier to debug.
- A working CRUD feature still needs a useful workflow.
- UI polish and functional correctness are separate engineering tasks.
- Many-to-many relationships deserve explicit API design.
- `select_related` / `prefetch_related` matter when building list endpoints.
- Documentation should clearly separate implemented features from future architecture.

---

# 9. Project Links

- **GitHub:** Add the final repository URL here after the first push.
- **Live Demo:** Add the deployed application URL here after deployment.
- **Documentation:** See the `docs/` directory.

---



## Portfolio Note

TalentFlow is built as a practical full-stack portfolio project demonstrating API design, relational modelling, authentication, role-aware workflows, React UI development, debugging and documentation.

> **Build the workflow first. Add complexity only when it solves a real product problem.**
>>>>>>> dc45d21 (feat: enterprise ATS upgrades, Celery worker, pypdf parser, OpenAPI docs, test suite & frontend modularization)
