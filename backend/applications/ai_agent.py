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


def generate_assessment_questions(job_title="Software Engineer", skills=None, description=""):
    """
    Generates a balanced 10-question Aptitude & Technical Screening Test:
    - 3 Quantitative Aptitude questions
    - 3 Logical Reasoning questions
    - 2 Verbal Ability questions
    - 2 Technical / Domain-Specific questions tailored to the job's title and skills.
    """
    skills = skills or []
    skills_lower = [s.lower() for s in skills]
    title_lower = job_title.lower()

    # 1. Try Gemini if API key is present
    gemini_key = os.getenv('GEMINI_API_KEY')
    if gemini_key:
        try:
            return _generate_gemini_assessment_questions(gemini_key, job_title, skills, description)
        except Exception as e:
            print(f"[AIAgent] Gemini question generation error: {e}. Falling back to curated bank.")

    # 2. Rich Curated Aptitude & Technical Question Bank
    questions = []

    # Category 1: Quantitative Aptitude (3 questions)
    quant_bank = [
        {
            "category": "Quantitative Aptitude",
            "question_text": "A project team of 6 engineers completes a backend service in 12 days. If 2 engineers are moved to another project, how many days will the remaining 4 engineers take to complete a project of equal scope?",
            "options": [
                {"id": "A", "text": "15 days"},
                {"id": "B", "text": "18 days"},
                {"id": "C", "text": "20 days"},
                {"id": "D", "text": "24 days"}
            ],
            "correct_option": "B",
            "explanation": "Total man-days required = 6 * 12 = 72 man-days. With 4 engineers remaining, days required = 72 / 4 = 18 days."
        },
        {
            "category": "Quantitative Aptitude",
            "question_text": "An API server handled 25,000 requests per minute on Monday. Following a marketing campaign, throughput surged to 40,000 requests per minute on Tuesday. What was the percentage increase in traffic?",
            "options": [
                {"id": "A", "text": "50%"},
                {"id": "B", "text": "60%"},
                {"id": "C", "text": "62.5%"},
                {"id": "D", "text": "75%"}
            ],
            "correct_option": "B",
            "explanation": "Increase = 40,000 - 25,000 = 15,000. Percentage increase = (15,000 / 25,000) * 100% = 60%."
        },
        {
            "category": "Quantitative Aptitude",
            "question_text": "Two data pipelines, A and B, synchronize records from a legacy database. Pipeline A syncs the database in 6 hours, while Pipeline B syncs it in 3 hours. How long will they take if they run concurrently?",
            "options": [
                {"id": "A", "text": "2 hours"},
                {"id": "B", "text": "2.5 hours"},
                {"id": "C", "text": "4.5 hours"},
                {"id": "D", "text": "1.5 hours"}
            ],
            "correct_option": "A",
            "explanation": "Combined rate = 1/6 + 1/3 = 3/6 = 1/2 database per hour. Total time = 1 / (1/2) = 2 hours."
        }
    ]
    questions.extend(quant_bank)

    # Category 2: Logical Reasoning (3 questions)
    logical_bank = [
        {
            "category": "Logical Reasoning",
            "question_text": "Consider the number series: 4, 9, 19, 39, 79, ___. Which number logically completes the sequence?",
            "options": [
                {"id": "A", "text": "149"},
                {"id": "B", "text": "159"},
                {"id": "C", "text": "169"},
                {"id": "D", "text": "179"}
            ],
            "correct_option": "B",
            "explanation": "Each subsequent term follows the pattern: 2 * n + 1. (4*2+1=9, 9*2+1=19, 19*2+1=39, 39*2+1=79, 79*2+1=159)."
        },
        {
            "category": "Logical Reasoning",
            "question_text": "Statements: (1) All microservices use containers. (2) Some containers are orchestration-managed. Conclusions: I. Some microservices are orchestration-managed. II. All containers are microservices. Which conclusion(s) follow logically?",
            "options": [
                {"id": "A", "text": "Only conclusion I follows"},
                {"id": "B", "text": "Only conclusion II follows"},
                {"id": "C", "text": "Neither I nor II follows conclusively"},
                {"id": "D", "text": "Both I and II follow"}
            ],
            "correct_option": "C",
            "explanation": "Since only 'some' containers are orchestration-managed, we cannot definitively conclude that those containers host microservices. Furthermore, containers can host monoliths, so II does not follow."
        },
        {
            "category": "Logical Reasoning",
            "question_text": "In an agile development team, Priya deployed code after Rahul but before Sneha. Vikram deployed code before Rahul. Who was the first person to deploy?",
            "options": [
                {"id": "A", "text": "Rahul"},
                {"id": "B", "text": "Priya"},
                {"id": "C", "text": "Vikram"},
                {"id": "D", "text": "Sneha"}
            ],
            "correct_option": "C",
            "explanation": "Sequence of deployment: Vikram -> Rahul -> Priya -> Sneha. Vikram was first."
        }
    ]
    questions.extend(logical_bank)

    # Category 3: Verbal Ability (2 questions)
    verbal_bank = [
        {
            "category": "Verbal Ability",
            "question_text": "Select the word that best completes the sentence: 'The team decided to __________ the legacy monolithic codebase to eliminate redundant dependencies and improve maintainability.'",
            "options": [
                {"id": "A", "text": "refactor"},
                {"id": "B", "text": "replicate"},
                {"id": "C", "text": "confiscate"},
                {"id": "D", "text": "fabricate"}
            ],
            "correct_option": "A",
            "explanation": "'Refactor' is the precise term for restructuring existing computer code without changing its external behavior."
        },
        {
            "category": "Verbal Ability",
            "question_text": "Identify the grammatically correct sentence regarding error handling in software:",
            "options": [
                {"id": "A", "text": "Neither the database server nor the web workers was able to recover automatically."},
                {"id": "B", "text": "Neither the database server nor the web workers were able to recover automatically."},
                {"id": "C", "text": "Neither the database server or the web workers was able to recover automatically."},
                {"id": "D", "text": "Neither the database server or the web workers were able to recover automatically."}
            ],
            "correct_option": "B",
            "explanation": "In 'neither... nor...', the verb agrees with the closer subject ('web workers', plural -> 'were')."
        }
    ]
    questions.extend(verbal_bank)

    # Category 4: Technical & Role Specific (2 questions)
    tech_bank = []
    if any(k in title_lower or k in skills_lower for k in ['python', 'django', 'backend']):
        tech_bank = [
            {
                "category": "Technical",
                "question_text": "In Python / Django, what is the key difference between `select_related()` and `prefetch_related()` when querying related database objects?",
                "options": [
                    {"id": "A", "text": "`select_related` performs an SQL JOIN in a single query for single-valued relationships; `prefetch_related` executes separate queries for multi-valued relationships."},
                    {"id": "B", "text": "`select_related` is for ManyToMany relationships, while `prefetch_related` is only for ForeignKey relationships."},
                    {"id": "C", "text": "`prefetch_related` caches in Redis, while `select_related` writes to SQLite."},
                    {"id": "D", "text": "There is no performance difference; they are aliases of each other."}
                ],
                "correct_option": "A",
                "explanation": "`select_related` creates an SQL JOIN and includes the fields of the related object in the SELECT statement. `prefetch_related` does a separate lookup for each relationship and does the 'joining' in Python."
            },
            {
                "category": "Technical",
                "question_text": "Which HTTP status code is most appropriate for a REST API when a request is well-formed but cannot be processed due to semantic business validation errors?",
                "options": [
                    {"id": "A", "text": "400 Bad Request"},
                    {"id": "B", "text": "422 Unprocessable Entity"},
                    {"id": "C", "text": "403 Forbidden"},
                    {"id": "D", "text": "500 Internal Server Error"}
                ],
                "correct_option": "B",
                "explanation": "HTTP 422 Unprocessable Entity indicates that the server understands the content type and syntax of the request entity, but was unable to process the contained instructions."
            }
        ]
    elif any(k in title_lower or k in skills_lower for k in ['react', 'frontend', 'javascript']):
        tech_bank = [
            {
                "category": "Technical",
                "question_text": "In React 18+, when does the cleanup function of a `useEffect` hook execute?",
                "options": [
                    {"id": "A", "text": "Only when the browser window closes."},
                    {"id": "B", "text": "Before the component unmounts and before re-running the effect on subsequent renders when dependencies change."},
                    {"id": "C", "text": "Immediately before the JSX return statement renders."},
                    {"id": "D", "text": "Only when an uncaught runtime error is thrown."}
                ],
                "correct_option": "B",
                "explanation": "React runs the cleanup function when the component unmounts and before running the effect on next render if dependency values changed."
            },
            {
                "category": "Technical",
                "question_text": "In modern JavaScript, what is the output of `[1, 2, 3].reduce((acc, curr) => acc + curr, 10)`?",
                "options": [
                    {"id": "A", "text": "6"},
                    {"id": "B", "text": "16"},
                    {"id": "C", "text": "10"},
                    {"id": "D", "text": "[10, 1, 2, 3]"}
                ],
                "correct_option": "B",
                "explanation": "The accumulator begins at initial value 10, then adds 1, 2, and 3: 10 + 1 + 2 + 3 = 16."
            }
        ]
    else:
        tech_bank = [
            {
                "category": "Technical",
                "question_text": f"Which algorithmic time complexity provides the fastest lookup time on average for key-value retrieval in a hash-based data structure?",
                "options": [
                    {"id": "A", "text": "O(1)"},
                    {"id": "B", "text": "O(log n)"},
                    {"id": "C", "text": "O(n)"},
                    {"id": "D", "text": "O(n log n)"}
                ],
                "correct_option": "A",
                "explanation": "Hash tables provide average-case O(1) constant time complexity for insertions and lookups."
            },
            {
                "category": "Technical",
                "question_text": "What is the primary benefit of using database indexing on frequently queried columns in high-traffic applications?",
                "options": [
                    {"id": "A", "text": "Reduces disk storage by compressing table data"},
                    {"id": "B", "text": "Significantly speeds up data retrieval queries (SELECT) at the cost of slight overhead on write operations (INSERT/UPDATE)"},
                    {"id": "C", "text": "Prevents SQL injection vulnerabilities automatically"},
                    {"id": "D", "text": "Encrypts sensitive customer data at rest"}
                ],
                "correct_option": "B",
                "explanation": "Indexes create lookup trees (like B-trees) that minimize disk I/O for search queries, but require updating during write operations."
            }
        ]
    questions.extend(tech_bank)

    # Assign order indices
    for i, q in enumerate(questions):
        q["order"] = i + 1

    return questions


def _generate_gemini_assessment_questions(gemini_key, job_title, skills, description):
    """Uses Gemini API to generate customized questions."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
    prompt = f"""
Create a 10-question multiple choice online assessment for candidates applying to '{job_title}'.
Requirements/Skills: {', '.join(skills) if skills else 'General Software Engineering'}
Job Overview: {description[:300]}

Include:
- 3 Quantitative Aptitude questions
- 3 Logical Reasoning questions
- 2 Verbal Ability questions
- 2 Technical questions specifically tailored to {job_title} and {skills}

Format MUST be valid JSON with this exact array structure:
[
  {{
    "category": "<Quantitative Aptitude | Logical Reasoning | Verbal Ability | Technical>",
    "question_text": "<Clear question prompt>",
    "options": [
      {{"id": "A", "text": "<Option A>"}},
      {{"id": "B", "text": "<Option B>"}},
      {{"id": "C", "text": "<Option C>"}},
      {{"id": "D", "text": "<Option D>"}}
    ],
    "correct_option": "<A, B, C, or D>",
    "explanation": "<Short explanation why this option is correct>"
  }}
]
"""
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.4
        }
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req, timeout=12) as response:
        resp_data = json.loads(response.read().decode('utf-8'))
        raw_text = resp_data['candidates'][0]['content']['parts'][0]['text']
        data = json.loads(raw_text)
        if isinstance(data, list) and len(data) >= 5:
            for idx, item in enumerate(data):
                item['order'] = idx + 1
            return data
    raise ValueError("Gemini returned invalid question structure.")

