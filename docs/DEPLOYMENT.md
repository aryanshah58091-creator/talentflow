# TalentFlow Deployment Guide

This guide walks you through:
1. **Pushing the Code to GitHub**
2. **Deploying the Backend (Django + PostgreSQL on Render)**
3. **Deploying the Frontend (React + Vite on Vercel or Render)**

---

## 1. Push to GitHub

### Step 1: Create a New GitHub Repository
1. Log in to your GitHub account at [github.com/new](https://github.com/new).
2. Enter a repository name, e.g. `talentflow`.
3. Set visibility to **Public** (or **Private**).
4. **Do NOT** initialize with a README, .gitignore, or license (we already have them).
5. Click **Create repository**.
6. Copy the repository URL (e.g., `https://github.com/<your-username>/talentflow.git`).

### Step 2: Push your local code
Open your terminal in the project directory (`TalentFlow-master/TalentFlow-master`) and run:

```bash
# 1. Stage all project files
git add .

# 2. Create the first commit
git commit -m "feat: initial commit for TalentFlow platform"

# 3. Rename branch to main
git branch -M main

# 4. Link your remote GitHub repository (replace with your URL)
git remote add origin https://github.com/<your-username>/talentflow.git

# 5. Push code to GitHub
git push -u origin main
```

---

## 2. Deploying the Full Stack

### Option A: 1-Click / Blueprint Deployment on Render (Easiest)
Render supports `render.yaml` which automatically configures:
- PostgreSQL database
- Django Web Service
- React Frontend Web Service

1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Blueprint**.
3. Connect your `talentflow` GitHub repository.
4. Render will read `render.yaml` and provision:
   - `talentflow-db` (Postgres)
   - `talentflow-backend` (Django API)
   - `talentflow-frontend` (React UI)
5. Click **Apply**.

---

### Option B: Step-by-Step Manual Deployment

#### Step 1: Deploy Backend on Render
1. Go to [Render Dashboard](https://dashboard.render.com) and click **New +** -> **Web Service**.
2. Select your `talentflow` GitHub repository.
3. Configure the settings:
   - **Name**: `talentflow-api`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `bash build.sh`
   - **Start Command**: `gunicorn config.wsgi:application`
4. Add **Environment Variables**:
   - `DJANGO_SECRET_KEY`: `<generate-a-random-secret-string>`
   - `DJANGO_DEBUG`: `False`
   - `CORS_ALLOW_ALL_ORIGINS`: `True`
5. *(Optional Database)*: Create a free PostgreSQL on Render and set `DATABASE_URL` in the Backend Environment Variables. (If omitted, Django will use SQLite).
6. Click **Deploy Web Service**.
7. Note down your backend URL (e.g. `https://talentflow-api.onrender.com`).

#### Step 2: Deploy Frontend on Vercel
1. Go to [vercel.com](https://vercel.com) and click **Add New...** -> **Project**.
2. Import your `talentflow` GitHub repository.
3. Under **Root Directory**, click edit and select `frontend`.
4. Framework Preset: **Vite**.
5. Add **Environment Variable**:
   - `VITE_API_URL`: `https://talentflow-api.onrender.com/api/v1` (replace with your Render backend URL)
6. Click **Deploy**.

---

## 3. Seed Demo Data (Optional)
To pre-populate demo jobs, companies, candidates, and AI interview pipelines on your live deployment:
1. In Render, open your Backend Web Service.
2. Go to the **Shell** tab.
3. Run:
   ```bash
   python manage.py seed_demo
   ```
4. All initial data will be ready immediately!
