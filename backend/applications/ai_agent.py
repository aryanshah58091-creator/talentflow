import os
import json
import urllib.request
import urllib.error

def evaluate_application_with_ai(application):
    """
    Automated Multi-Stage ATS & Agentic Evaluation Pipeline for TalentFlow:
    Stage 1: ATS Resume Parser & Keyword Evaluator (Skill matching, experience vector, compatibility score)
    Stage 2: Strengths & Weaknesses Extraction (Superpowers vs missing competencies)
    Stage 3: Decision Engine (Hiring Recommendation: Strong Match, Qualified, Moderate, Low Fit)
    Stage 4: Technical Interview Co-Pilot (Targeted interview questions based on candidate gaps)
    """
    job = application.job
    candidate = application.candidate
    
    # Gather candidate profile information
    profile = getattr(candidate, 'candidate_profile', None)
    candidate_skills = profile.skills if profile and profile.skills else []
    experience_years = str(profile.experience_years) if profile else "1+"
    headline = profile.headline if profile else "Software Developer"
    cover_letter = application.cover_letter or "I am interested in this role."
    resume_text = application.resume_text or ""
    
    # Gather job specifications
    job_title = job.title
    job_description = job.description or ""
    job_requirements = job.requirements or ""
    required_skills = [s.name for s in job.skills.all()]
    
    gemini_key = os.getenv('GEMINI_API_KEY')
    
    # 1. Try Live LLM Agent if GEMINI_API_KEY is configured
    if gemini_key:
        try:
            return _run_gemini_agent(
                gemini_key,
                candidate_name=candidate.get_full_name() or candidate.username,
                headline=headline,
                experience_years=experience_years,
                candidate_skills=candidate_skills,
                cover_letter=cover_letter,
                resume_text=resume_text,
                job_title=job_title,
                job_description=job_description,
                job_requirements=job_requirements,
                required_skills=required_skills
            )
        except Exception as e:
            print(f"[AIAgent] Gemini API call error: {e}. Falling back to internal heuristic ATS agent.")
            
    # 2. Intelligent Deterministic ATS Agent Engine (Guaranteed 100% offline & lightning fast)
    return _run_heuristic_agent(
        candidate_name=candidate.get_full_name() or candidate.username,
        headline=headline,
        experience_years=experience_years,
        candidate_skills=candidate_skills,
        cover_letter=cover_letter,
        resume_text=resume_text,
        job_title=job_title,
        job_description=job_description,
        job_requirements=job_requirements,
        required_skills=required_skills
    )


def _run_gemini_agent(gemini_key, **ctx):
    """Calls Gemini 1.5 Flash in JSON mode using standard Python urllib."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
    
    prompt = f"""
You are the Lead Technical Recruiter & ATS Architect AI for TalentFlow.
Conduct a rigorous ATS resume evaluation for this candidate against the job specifications.

JOB SPECIFICATIONS:
- Role: {ctx['job_title']}
- Description: {ctx['job_description']}
- Key Requirements: {ctx['job_requirements']}
- Required Skills: {', '.join(ctx['required_skills'])}

CANDIDATE DOSSIER & RESUME:
- Name: {ctx['candidate_name']}
- Headline: {ctx['headline']}
- Years of Experience: {ctx['experience_years']}
- Listed Profile Skills: {', '.join(ctx['candidate_skills']) if ctx['candidate_skills'] else 'Not explicitly specified'}
- Application Note: {ctx['cover_letter']}
- Resume Content:
\"\"\"
{ctx['resume_text'][:4000] if ctx['resume_text'] else 'No resume text provided.'}
\"\"\"

Evaluate the candidate's actual resume against the job requirements.
Identify specific verified technical strengths and explicit skill weaknesses/gaps.

Return a VALID JSON object with this exact structure:
{{
  "match_score": <integer between 40 and 98>,
  "recommendation": "<Strong Match (Auto-Shortlist Recommended) | Qualified Candidate | Moderate Match | Low Fit>",
  "summary": "<2-3 sentence executive assessment of resume fit>",
  "strengths": ["<strength 1 with resume evidence>", "<strength 2 with resume evidence>"],
  "weaknesses": ["<critical gap or missing skill 1>", "<gap 2>"],
  "gaps": ["<same as weaknesses>"],
  "interview_questions": [
    {{
      "question": "<precise technical question to probe identified gap or past experience>",
      "target_area": "<technology or architecture concept>",
      "eval_criteria": "<what strong candidate answers should include>"
    }},
    {{
      "question": "<second technical question>",
      "target_area": "<technology or concept>",
      "eval_criteria": "<evaluation guidance>"
    }},
    {{
      "question": "<third system design / practical question>",
      "target_area": "<concept>",
      "eval_criteria": "<evaluation guidance>"
    }}
  ]
}}
Respond ONLY with the JSON object. Do not include markdown code fences or backticks.
"""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json"
        }
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    
    with urllib.request.urlopen(req, timeout=12) as response:
        res = json.loads(response.read().decode('utf-8'))
        raw_text = res['candidates'][0]['content']['parts'][0]['text']
        cleaned_text = raw_text.strip().removeprefix('```json').removeprefix('```').removesuffix('```').strip()
        data = json.loads(cleaned_text)
        if 'weaknesses' in data and 'gaps' not in data:
            data['gaps'] = data['weaknesses']
        if 'gaps' in data and 'weaknesses' not in data:
            data['weaknesses'] = data['gaps']
        return data


def _run_heuristic_agent(**ctx):
    """
    Intelligent Deterministic ATS Engine: Evaluates resume text against job skill taxonomy,
    computes ATS compatibility score, extracts strengths & weaknesses, and generates interview questions.
    """
    req_skills = ctx['required_skills'] or []
    req_skills_lower = [s.lower() for s in req_skills]
    cand_skills_lower = [str(s).lower() for s in ctx.get('candidate_skills', [])]
    cover_lower = (ctx.get('cover_letter') or '').lower()
    resume_lower = (ctx.get('resume_text') or '').lower()
    combined_cand_text = f"{resume_lower} {cover_lower} {' '.join(cand_skills_lower)}"
    
    matched_skills = []
    missing_skills = []
    
    for skill in req_skills:
        s_lower = skill.lower()
        if s_lower in combined_cand_text:
            matched_skills.append(skill)
        else:
            missing_skills.append(skill)
            
    # Calculate skill match ratio
    total_req = len(req_skills) if req_skills else 1
    match_ratio = len(matched_skills) / total_req
    
    # Calculate resume depth factor
    resume_length = len(ctx.get('resume_text') or '')
    depth_bonus = 8 if resume_length > 300 else (4 if resume_length > 100 else 0)
    
    # Calculate score
    if req_skills:
        raw_score = int(45 + (match_ratio * 45) + depth_bonus)
    else:
        raw_score = int(70 + depth_bonus)
        
    score = max(42, min(97, raw_score))
    
    # Determine recommendation
    if score >= 80:
        recommendation = "Strong Match (Auto-Shortlist Recommended)"
    elif score >= 65:
        recommendation = "Qualified Candidate"
    elif score >= 50:
        recommendation = "Moderate Match (Manual Review)"
    else:
        recommendation = "Low Fit"
        
    strengths = []
    if matched_skills:
        strengths.append(f"Resume validates required proficiency in {', '.join(matched_skills[:4])}.")
    if resume_length > 250:
        strengths.append("Provided detailed practical work history and architectural project descriptions.")
    strengths.append(f"Relevant background in {ctx.get('headline', 'Software Development')} with {ctx.get('experience_years', '1+')} years experience.")
    
    weaknesses = []
    if missing_skills:
        weaknesses.append(f"Missing direct evidence for required competency in: {', '.join(missing_skills)}.")
    if resume_length < 150:
        weaknesses.append("Resume description is relatively brief; requires technical verification of project scale.")
    if not weaknesses:
        weaknesses.append("Evaluate production scale, high availability, and concurrency handling in practical interview.")
        
    summary = (
        f"ATS analysis calculated {score}% resume compatibility for {ctx['job_title']}. "
        f"Verified key alignment in {', '.join(matched_skills) if matched_skills else 'general engineering'}. "
        f"Status: {recommendation}."
    )
    
    primary_tech = req_skills[0] if req_skills else "Backend Architecture"
    secondary_tech = req_skills[1] if len(req_skills) > 1 else "Database Optimization"
    
    questions = [
        {
            "question": f"Can you describe a challenging bug or architectural bottleneck you encountered while working with {primary_tech}, and how you debugged it?",
            "target_area": f"{primary_tech} Core Engineering",
            "eval_criteria": "Look for systematic debugging approaches, profiling tools, root-cause isolation, and unit test verification."
        },
        {
            "question": f"In a high-throughput production environment, how do you handle concurrency, caching, and database connection pooling using {secondary_tech}?",
            "target_area": "System Scaling & Performance",
            "eval_criteria": "Strong answers mention Redis/Memcached layers, connection pool sizes, query indexing, and asynchronous job queues."
        },
        {
            "question": f"Walk us through how you structure end-to-end testing and CI/CD automated deployments for applications built around {ctx['job_title']}.",
            "target_area": "SDLC & Deployment Automation",
            "eval_criteria": "Evaluate knowledge of Docker containerization, staging pipelines, smoke tests, and automated rollback strategies."
        }
    ]
    
    return {
        "match_score": score,
        "recommendation": recommendation,
        "summary": summary,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "gaps": weaknesses,
        "interview_questions": questions
    }
