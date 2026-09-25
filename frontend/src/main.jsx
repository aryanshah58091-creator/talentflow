import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {LayoutDashboard,BriefcaseBusiness,Users,KanbanSquare,CalendarDays,Bell,LogOut,Plus,Search,ArrowUpRight,CheckCircle2,Building2,X,Clock,MapPin,DollarSign,Send,Sparkles,ChevronRight,Filter,Compass,FileText} from 'lucide-react';
import './styles.css';

const API = (import.meta.env.VITE_API_URL || '').trim() || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000/api/v1'
    : 'https://talentflow-api-v6ce.onrender.com/api/v1'
);

const api=async(path,opts={})=>{
  const token=localStorage.getItem('tf_token');
  const headers={
    'Content-Type':'application/json',
    ...(opts.headers||{})
  };

  if(token) headers.Authorization=`Token ${token}`;

  const r=await fetch(API+path,{...opts,headers});

  if(!r.ok){
    let msg='Request failed';
    try{
      const err=await r.json();
      if(typeof err==='string'){
        msg=err;
      }else if(err.detail){
        msg=err.detail;
      }else if(err.error){
        msg=err.error;
      }else if(err.message){
        msg=err.message;
      }else if(err.non_field_errors){
        msg=Array.isArray(err.non_field_errors)?err.non_field_errors.join(' '):String(err.non_field_errors);
      }else{
        const keys=Object.keys(err);
        if(keys.length>0){
          const val=err[keys[0]];
          msg=Array.isArray(val)?`${keys[0]}: ${val.join(', ')}`:`${keys[0]}: ${val}`;
        }
      }
    }catch{
      msg=r.statusText||`Error ${r.status}`;
    }
    throw new Error(msg);
  }

  return r.status===204?null:r.json();
};

function App(){
  const [user,setUser]=useState(
    JSON.parse(localStorage.getItem('tf_user')||'null')
  );
  const [view,setView]=useState('dashboard');
  const [jobs,setJobs]=useState([]);
  const [apps,setApps]=useState([]);
  const [error,setError]=useState('');

  useEffect(()=>{
    if(user){
      load();
    }
  },[user,view]);

  const load=async()=>{
    try{
      setError('');

      if(view==='jobs'||view==='dashboard'){
        const data=await api('/jobs/');
        setJobs(data.results||data);
      }

      if(view==='jobs'||view==='applications'||view==='pipeline'||view==='dashboard'){
        const data=await api('/applications/');
        setApps(data.results||data);
      }
    }catch(e){
      setError(e.message);
    }
  };

  const [activeAIApp,setActiveAIApp]=useState(null);
  const [evaluatingAI,setEvaluatingAI]=useState(false);

  const runAIScreen=async(appId)=>{
    if(user?.role !== 'recruiter'){
      alert('Candidate screening and interview dossiers are reserved for recruiters and hiring managers.');
      return;
    }
    setEvaluatingAI(true);
    try{
      const res=await api(`/applications/${appId}/ai-screen/`,{method:'POST'});
      setActiveAIApp(res);
      await load();
    }catch(e){
      alert(e.message||'AI evaluation failed.');
    }finally{
      setEvaluatingAI(false);
    }
  };

  const updateApplicationStatus=async(id,status)=>{
    if(user?.role !== 'recruiter'){
      alert('Only recruiters can update applicant pipeline stages.');
      return;
    }
    try{
      await api(`/applications/${id}/`,{
        method:'PATCH',
        body:JSON.stringify({status})
      });

      await load();
    }catch(e){
      setError(e.message);
    }
  };

  if(!user){
    return <Auth onLogin={u=>setUser(u)}/>;
  }

  const logout=()=>{
    localStorage.clear();
    setUser(null);
  };

  return (
    <div className="shell">
      <aside>
        <div className="brand">
          <span className="sparkleIcon">✦</span>Talent<span className="accentText">Flow</span>
        </div>

        <div className="muted">Recruitment & Hiring Pipeline</div>

        <nav>
          {(user.role==='recruiter'?[
            ['dashboard',LayoutDashboard,'Dashboard'],
            ['jobs',BriefcaseBusiness,'Job Openings'],
            ['applications',Users,'Candidates & Screener'],
            ['pipeline',KanbanSquare,'Hiring Pipeline'],
            ['interviews',CalendarDays,'Interviews']
          ]:[
            ['dashboard',LayoutDashboard,'Dashboard'],
            ['jobs',BriefcaseBusiness,'Find Jobs'],
            ['applications',FileText,'My Applications'],
            ['interviews',CalendarDays,'My Interviews']
          ]).map(([id,I,label])=>(
            <button
              className={view===id?'active':''}
              onClick={()=>setView(id)}
              key={id}
            >
              <I size={18}/>
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebottom">
          <div className="userMini">
            <div className="avatar">
              {(user.first_name||user.username)[0].toUpperCase()}
            </div>

            <div>
              <b>{user.first_name||user.username}</b>
              <small>{user.role}</small>
            </div>
          </div>

          <button onClick={logout}>
            <LogOut size={17}/>
            Sign out
          </button>
        </div>
      </aside>

      <main>
        <header>
          <div>
            <div className="eyebrow">
              <Sparkles size={11}/> {user.role.toUpperCase()} WORKSPACE
            </div>

            <h1>
              {view==='dashboard'
                ?`Welcome, ${user.first_name||user.username}`
                :view==='jobs'?(user.role==='recruiter'?'Active Jobs & Openings':'Explore Opportunities')
                :view==='applications'?(user.role==='recruiter'?'Candidate Applications & AI Screening':'My Job Applications')
                :view==='pipeline'?'Hiring Pipeline'
                :view==='interviews'?(user.role==='recruiter'?'Interview Schedules':'My Interviews')
                :view[0].toUpperCase()+view.slice(1)}
            </h1>
          </div>

          <div className="headerActions">
            <button className="icon" title="Notifications" onClick={()=>alert('All notifications are up to date!')}>
              <Bell size={18}/>
            </button>

            {user.role==='recruiter'&&(
              <button
                className="primary"
                onClick={()=>setView('create')}
              >
                <Plus size={18}/>
                Post New Job
              </button>
            )}
          </div>
        </header>

        {error&&<div className="alert">{error}</div>}

        {view==='dashboard'&&(
          <Dashboard
            user={user}
            jobs={jobs}
            apps={apps}
          />
        )}

        {view==='jobs'&&(
          <Jobs
            user={user}
            jobs={jobs}
            apps={apps}
            reload={load}
          />
        )}

        {view==='applications'&&(
          <Applications
            user={user}
            apps={apps}
            jobs={jobs}
            onRunAIScreen={runAIScreen}
            evaluatingAI={evaluatingAI}
            reload={load}
          />
        )}

        {view==='pipeline'&&(
          user.role==='recruiter' ? (
            <Pipeline
              apps={apps}
              onStatusChange={updateApplicationStatus}
              onRunAIScreen={runAIScreen}
              evaluatingAI={evaluatingAI}
            />
          ) : (
            <div className="card" style={{padding:'48px 24px',textAlign:'center'}}>
              <div style={{fontSize:'36px',marginBottom:'12px'}}>🔒</div>
              <h3 style={{fontSize:'20px',marginBottom:'8px'}}>Recruiter Access Only</h3>
              <p className="muted" style={{maxWidth:'460px',margin:'0 auto 20px'}}>
                The candidate hiring pipeline and stage progression controls are restricted to recruiters and hiring managers.
              </p>
              <button className="primary" onClick={()=>setView('applications')}>
                Go to My Applications
              </button>
            </div>
          )
        )}

        {view==='interviews'&&(
          <Interviews/>
        )}

        {view==='create'&&(
          <CreateJob
            onDone={()=>{
              setView('jobs');
              load();
            }}
          />
        )}

        {activeAIApp&&user.role==='recruiter'&&(
          <div className="modalOverlay" onClick={()=>setActiveAIApp(null)}>
            <div className="modalCard aiDossierCard" onClick={e=>e.stopPropagation()}>
              <div className="modalHead" style={{background:'linear-gradient(135deg, #f8fafc 0%, #ede9fe 100%)'}}>
                <div>
                  <span className="pill" style={{background:'#6366f1',color:'#fff',borderColor:'transparent'}}>
                    <Sparkles size={12}/> ATS RESUME EVALUATION & CANDIDATE DOSSIER
                  </span>
                  <h2 style={{marginTop:'8px'}}>Resume Analysis, Strengths & Interview Plan</h2>
                  <div className="muted" style={{fontSize:'13px',color:'#475569',marginTop:'4px'}}>
                    Automated Multi-Stage ATS Parsing & Agentic Decision Engine
                  </div>
                </div>
                <button className="icon closeBtn" onClick={()=>setActiveAIApp(null)}>
                  <X size={20}/>
                </button>
              </div>

              <div className="modalBody">
                <div className="aiScoreBanner">
                  <div>
                    <div style={{fontSize:'12px',letterSpacing:'1px',fontWeight:700,color:'#93c5fd',textTransform:'uppercase'}}>
                      ATS Resume Compatibility Score
                    </div>
                    <h3 style={{fontSize:'22px',margin:'4px 0 2px',color:'#fff'}}>
                      {activeAIApp.recommendation || (activeAIApp.match_score>=80?'Strong Match (Auto-Shortlist Recommended)':activeAIApp.match_score>=65?'Qualified Candidate':'Moderate Match')}
                    </h3>
                    <p style={{margin:0,fontSize:'13px',color:'#cbd5e1'}}>
                      Automated keyword taxonomy matching, work experience depth, and requirement alignment
                    </p>
                  </div>
                  <div className="scoreCircle">
                    {activeAIApp.match_score}%
                  </div>
                </div>

                <div className="jobSection">
                  <h4>Executive Assessment & Recommendation</h4>
                  <p className="jobText" style={{background:'#f8fafc',padding:'14px 16px',borderRadius:'10px',border:'1px solid #e2e8f0'}}>
                    {activeAIApp.summary}
                  </p>
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
                  <div className="jobSection">
                    <h4 style={{color:'#15803d'}}>Key Strengths (Verified from Resume)</h4>
                    <ul style={{margin:'0',paddingLeft:'18px',fontSize:'13.5px',color:'#334155',lineHeight:'1.6'}}>
                      {(activeAIApp.strengths||[]).map((s,idx)=>(
                        <li key={idx} style={{marginBottom:'4px'}}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="jobSection">
                    <h4 style={{color:'#b91c1c'}}>Skill Gaps & Weaknesses</h4>
                    <ul style={{margin:'0',paddingLeft:'18px',fontSize:'13.5px',color:'#334155',lineHeight:'1.6'}}>
                      {((activeAIApp.weaknesses && activeAIApp.weaknesses.length ? activeAIApp.weaknesses : activeAIApp.gaps)||[]).map((g,idx)=>(
                        <li key={idx} style={{marginBottom:'4px'}}>{g}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {activeAIApp.resume_text&&(
                  <div className="jobSection">
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                      <h4>Submitted Candidate Resume</h4>
                      <span style={{fontSize:'12px',color:'#64748b',fontWeight:600}}>
                        {activeAIApp.resume_filename || 'Parsed Resume Content'}
                      </span>
                    </div>
                    <pre style={{
                      background:'#f8fafc',
                      padding:'14px',
                      borderRadius:'8px',
                      border:'1px solid #e2e8f0',
                      fontSize:'12px',
                      fontFamily:'monospace',
                      maxHeight:'160px',
                      overflowY:'auto',
                      whiteSpace:'pre-wrap',
                      color:'#334155',
                      margin:0
                    }}>
                      {activeAIApp.resume_text}
                    </pre>
                  </div>
                )}

                <div className="jobSection">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                    <h4>Tailored Technical Interview Questions</h4>
                    <span style={{fontSize:'12px',fontWeight:600,color:'#6366f1'}}>Co-Pilot Generated</span>
                  </div>

                  <div className="aiQuestionsList">
                    {(activeAIApp.interview_questions||[]).map((q,idx)=>(
                      <div className="aiQuestionBox" key={idx}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <span className="aiTargetPill">{q.target_area||`Question #${idx+1}`}</span>
                          <span style={{fontSize:'11px',fontWeight:600,color:'#64748b'}}>Round {idx+1}</span>
                        </div>
                        <p className="aiQuestionText">"{q.question}"</p>
                        {q.eval_criteria&&(
                          <div className="aiCriteriaTip">
                            <b>Interviewer Guidance:</b> {q.eval_criteria}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modalActions" style={{borderTop:'1px solid #e2e8f0',paddingTop:'16px'}}>
                  <button className="ghost" onClick={()=>setActiveAIApp(null)}>
                    Close Dossier
                  </button>
                  <button
                    className="primary"
                    onClick={async()=>{
                      await updateApplicationStatus(activeAIApp.application_id,'interview');
                      setActiveAIApp(null);
                    }}
                  >
                    Advance to Interview Stage
                    <ArrowUpRight size={15}/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Auth({onLogin}){
  const [mode,setMode]=useState('login');

  const [form,setForm]=useState({
    username:'demo_recruiter',
    email:'recruiter@talentflow.local',
    password:'DemoPass123!',
    first_name:'Alex',
    last_name:'Recruiter',
    role:'recruiter'
  });

  const [err,setErr]=useState('');
  const [loading,setLoading]=useState(false);

  const setDemoCredentials=(role)=>{
    if(role==='recruiter'){
      setForm({
        ...form,
        username:'demo_recruiter',
        email:'recruiter@talentflow.local',
        password:'DemoPass123!',
        role:'recruiter'
      });
    }else{
      setForm({
        ...form,
        username:'demo_candidate',
        email:'candidate@talentflow.local',
        password:'DemoPass123!',
        role:'candidate'
      });
    }
  };

  const submit=async e=>{
    e.preventDefault();
    setErr('');
    setLoading(true);

    try{
      let data;

      if(mode==='login'){
        data=await api('/auth/token/',{
          method:'POST',
          body:JSON.stringify({
            username:form.username,
            password:form.password
          })
        });
      }else{
        data=await api('/accounts/register/',{
          method:'POST',
          body:JSON.stringify(form)
        });
      }

      let u=mode==='login'
        ?await api('/accounts/me/',{
            headers:{
              Authorization:`Token ${data.token}`
            }
          })
        :data.user;

      localStorage.setItem('tf_token',data.token);
      localStorage.setItem('tf_user',JSON.stringify(u));

      onLogin(u);
    }catch(e){
      setErr(e.message);
    }finally{
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="authCard">
        <div className="brand big">
          <span className="sparkleIcon">✦</span>Talent<span className="accentText">Flow</span>
        </div>

        <p className="muted">
          Modern AI-assisted recruitment platform
        </p>

        <div style={{display:'flex',background:'#f1f5f9',padding:'4px',borderRadius:'12px',marginBottom:'20px'}}>
          <button
            type="button"
            style={{
              flex:1,
              border:0,
              padding:'8px',
              borderRadius:'9px',
              fontSize:'13px',
              fontWeight:600,
              cursor:'pointer',
              background:mode==='login'?'#fff':'transparent',
              color:mode==='login'?'#0f172a':'#64748b',
              boxShadow:mode==='login'?'0 2px 6px rgba(0,0,0,0.06)':'none',
              transition:'all 0.2s'
            }}
            onClick={()=>setMode('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            style={{
              flex:1,
              border:0,
              padding:'8px',
              borderRadius:'9px',
              fontSize:'13px',
              fontWeight:600,
              cursor:'pointer',
              background:mode==='register'?'#fff':'transparent',
              color:mode==='register'?'#0f172a':'#64748b',
              boxShadow:mode==='register'?'0 2px 6px rgba(0,0,0,0.06)':'none',
              transition:'all 0.2s'
            }}
            onClick={()=>setMode('register')}
          >
            Create Account
          </button>
        </div>

        {err&&<div className="alert alertError"><span>{err}</span></div>}

        <form onSubmit={submit}>
          {mode==='register'&&(
            <>
              <div className="formRow">
                <input
                  placeholder="First name"
                  value={form.first_name}
                  onChange={e=>
                    setForm({...form,first_name:e.target.value})
                  }
                  required
                />

                <input
                  placeholder="Last name"
                  value={form.last_name}
                  onChange={e=>
                    setForm({...form,last_name:e.target.value})
                  }
                  required
                />
              </div>

              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <label style={{fontSize:'12.5px',fontWeight:600,color:'#475569'}}>Account Role:</label>
                <select
                  value={form.role}
                  onChange={e=>
                    setForm({...form,role:e.target.value})
                  }
                >
                  <option value="candidate">Candidate (Job Seeker)</option>
                  <option value="recruiter">Recruiter (Hiring Manager)</option>
                </select>
              </div>
            </>
          )}

          <input
            placeholder="Username"
            value={form.username}
            onChange={e=>
              setForm({...form,username:e.target.value})
            }
            required
          />

          {mode==='register'&&(
            <input
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={e=>
                setForm({...form,email:e.target.value})
              }
              required
            />
          )}

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e=>
              setForm({...form,password:e.target.value})
            }
            required
          />

          <button className="primary wide" disabled={loading}>
            {loading?'Authenticating...':(mode==='login'?'Sign In to TalentFlow':'Create Account')}
            <ArrowUpRight size={15}/>
          </button>
        </form>

        <div className="demoBox">
          <span>⚡ Quick Demo Access</span>
          <div className="demoActions">
            <button
              type="button"
              className="demoBtn"
              onClick={()=>{
                setDemoCredentials('recruiter');
                setMode('login');
              }}
            >
              Demo Recruiter
            </button>
            <button
              type="button"
              className="demoBtn"
              onClick={()=>{
                setDemoCredentials('candidate');
                setMode('login');
              }}
            >
              Demo Candidate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard({user,jobs,apps}){
  const isRecruiter = user.role==='recruiter';
  const counts={
    jobs:jobs.length,
    apps:apps.length,
    interviews:apps.filter(a=>a.status==='interview').length,
    hiresOrOffers:apps.filter(a=>a.status==='offer'||a.status==='hired').length
  };

  return (
    <>
      <section className="hero">
        <div>
          <span className="pill">
            <Sparkles size={11}/> AI-POWERED HIRING PLATFORM
          </span>

          <h2>
            {isRecruiter
              ?`Welcome back, ${user.first_name||user.username}! Build your dream team.`
              :`Welcome back, ${user.first_name||user.username}! Explore your next role.`}
          </h2>

          <p>
            {isRecruiter
              ? 'Seamless recruitment operations: candidate screening, autonomous AI evaluation dossiers, and hiring pipelines.'
              : 'Discover exciting career openings, submit applications seamlessly, and track your review status in real time.'}
          </p>
        </div>

        <div className="heroMark">TF</div>
      </section>

      <div className="stats">
        <Stat
          label={isRecruiter?'Active Job Openings':'Available Positions'}
          value={counts.jobs}
          icon={BriefcaseBusiness}
          trend="Live"
        />

        <Stat
          label={isRecruiter?'Total Applicants':'Applications Submitted'}
          value={counts.apps}
          icon={Users}
          trend={isRecruiter ? 'Active' : 'Submitted'}
        />

        <Stat
          label={isRecruiter?'Interviews Scheduled':'Upcoming Interviews'}
          value={counts.interviews}
          icon={CalendarDays}
          trend="Pipeline"
        />

        <Stat
          label={isRecruiter?'Hires Completed':'Offers Received'}
          value={counts.hiresOrOffers}
          icon={CheckCircle2}
          trend={isRecruiter ? 'Target' : 'Offers'}
        />
      </div>

      <div className="grid2">
        <div className="card">
          <div className="cardHead">
            <h3>{isRecruiter ? 'Hiring Funnel Progression' : 'Application Stage Breakdown'}</h3>
            <span>Real-time</span>
          </div>

          {[
            'applied',
            'screening',
            'shortlisted',
            'interview',
            'offer',
            'hired'
          ].map((s)=>{
            const n=apps.filter(a=>a.status===s).length;

            return (
              <div className="funnel" key={s}>
                <span style={{textTransform:'capitalize'}}>{s}</span>

                <div>
                  <i
                    style={{
                      width:`${Math.max(
                        6,
                        (n/(apps.length||1))*100
                      )}%`
                    }}
                  />
                </div>

                <b>{n}</b>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="cardHead">
            <h3>{isRecruiter ? 'Recent Applicants' : 'Recent Submissions'}</h3>
            <span>Latest Updates</span>
          </div>

          {apps.slice(0,5).map(a=>(
            <div className="row" key={a.id}>
              <div className="avatar small" style={!isRecruiter ? {background:'#f1f5f9',color:'#475569'} : {}}>
                {isRecruiter ? (a.candidate_name||'C')[0] : <BriefcaseBusiness size={15}/>}
              </div>

              <div style={{flex:1,minWidth:0}}>
                <b style={{display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {isRecruiter ? (a.candidate_name||'Candidate') : a.job_title}
                </b>
                <small>
                  {isRecruiter ? a.job_title : (a.applied_at ? new Date(a.applied_at).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'}) : 'Recently applied')}
                </small>
              </div>

              <span className={`status ${a.status}`}>
                {a.status}
              </span>
            </div>
          ))}

          {!apps.length&&(
            <Empty text={isRecruiter ? 'No applications recorded yet.' : 'You have not submitted any applications yet.'}/>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({label,value,icon:I,trend='Live'}){
  return (
    <div className="stat">
      <div className="statTop">
        <div className="statIcon">
          <I size={20}/>
        </div>
        <span className="statBadge">{trend}</span>
      </div>

      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

function Jobs({user,jobs,apps=[],reload}){
  const [q,setQ]=useState('');
  const [filterType,setFilterType]=useState('all');
  const [selectedJob,setSelectedJob]=useState(null);
  const [applying,setApplying]=useState(false);
  const [coverLetter,setCoverLetter]=useState('');
  const [feedback,setFeedback]=useState(null);

  const appliedMap=new Map();
  apps.forEach(a=>{
    const jid=typeof a.job==='object'?a.job?.id:a.job;
    if(jid) appliedMap.set(jid,a);
  });

  const filtered=jobs.filter(j=>{
    const matchesQ = j.title.toLowerCase().includes(q.toLowerCase())||
      (j.company_name||'').toLowerCase().includes(q.toLowerCase());
    if(!matchesQ) return false;
    if(filterType==='remote') return j.workplace==='remote';
    if(filterType==='hybrid') return j.workplace==='hybrid';
    if(filterType==='full_time') return j.employment_type==='full_time';
    return true;
  });

  const [resumeText, setResumeText] = useState('');
  const [resumeFilename, setResumeFilename] = useState('');

  const handleOpenJob=(job)=>{
    setSelectedJob(job);
    setFeedback(null);
    setCoverLetter(`Hi, I am excited to apply for the ${job.title} role at ${job.company_name||'your company'}. Please find my attached resume outlining my background.`);
    setResumeText('');
    setResumeFilename('');
  };

  const handlePreFillResume = (job) => {
    const jobSkills = (job.skills || []).map(s => s.name).join(', ') || 'Python, React, PostgreSQL, Docker';
    const sample = `${user.first_name || 'Alex'} ${user.last_name || 'Candidate'} - Senior Technical Specialist
Email: ${user.email || 'candidate@talentflow.demo'} | Phone: +91 98765 43210 | Bengaluru, India
GitHub: github.com/${user.username || 'candidate'} | LinkedIn: linkedin.com/in/${user.username || 'candidate'}

PROFESSIONAL SUMMARY
Dynamic and results-driven Software Engineer with 4+ years of hands-on experience designing, developing, and deploying resilient software applications. Proven track record in ${jobSkills}. Skilled at translating business requirements into scalable architectures with clean, maintainable code.

CORE TECHNICAL SKILLS
- Primary Technologies: ${jobSkills}
- Backend & Frameworks: REST APIs, Microservices, Python / Django, Node.js
- Frontend: Modern React, State Management, Responsive UI/UX
- Databases & Storage: PostgreSQL, Redis Caching, Query Optimization
- Cloud & DevOps: Docker Containerization, CI/CD Automated Pipelines, Git Workflow

PROFESSIONAL WORK EXPERIENCE
Senior Software Engineer | CloudTech Solutions (2022 - Present)
- Engineered scalable distributed services handling over 150,000 daily requests with 99.9% uptime.
- Implemented high-performance caching layers and database indexes that reduced latency by 35%.
- Built automated unit and integration testing suites achieving 90%+ code coverage across releases.
- Spearheaded team migration to containerized Docker workflows, shortening deploy cycles from days to minutes.

Full Stack Developer | InnovateLabs (2020 - 2022)
- Collaborated across cross-functional product teams to deliver 6 major enterprise web features.
- Developed modular frontend interfaces with modern React, achieving responsive sub-second page loads.
- Designed secure authentication, role-based authorization, and third-party webhook integrations.

KEY TECHNICAL PROJECTS
- High-Throughput Pipeline Engine: Designed and implemented an event-driven queue processor utilizing ${job.skills?.[0]?.name || 'Python'} and Redis.
- Analytics Portal: Built interactive data visualization dashboard with ${job.skills?.[1]?.name || 'React'} and TailwindCSS.

EDUCATION & CERTIFICATIONS
Bachelor of Technology in Computer Science & Engineering (2016 - 2020)
Certified Cloud Solutions Associate`;
    setResumeText(sample);
    setResumeFilename(`${(user.first_name||'candidate').toLowerCase()}_resume.txt`);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if(!file) return;
    setResumeFilename(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setResumeText(content);
    };
    reader.readAsText(file);
  };

  const submitApplication=async(jobId)=>{
    if(user.role!=='candidate'){
      setFeedback({type:'error',message:'Only candidate accounts can apply for jobs.'});
      return;
    }
    if(!resumeText || resumeText.trim().length < 25){
      setFeedback({type:'error', message:'Resume is compulsory. Please upload a resume file or paste your resume content before submitting.'});
      return;
    }
    setApplying(true);
    setFeedback(null);
    try{
      await api('/applications/',{
        method:'POST',
        body:JSON.stringify({
          job:jobId,
          cover_letter:coverLetter,
          resume_text:resumeText,
          resume_filename:resumeFilename || 'candidate_resume.txt'
        })
      });
      setFeedback({type:'success',message:'Application and resume submitted successfully! Automated ATS screening complete.'});
      await reload();
    }catch(e){
      setFeedback({type:'error',message:e.message||'Failed to submit application.'});
    }finally{
      setApplying(false);
    }
  };

  return (
    <>
      <div className="toolbar" style={{flexWrap:'wrap'}}>
        <div className="search" style={{minWidth:'280px'}}>
          <Search size={18}/>

          <input
            placeholder="Search by job title or company name..."
            value={q}
            onChange={e=>setQ(e.target.value)}
          />
        </div>

        <div className="filterPills">
          {[
            ['all', 'All Jobs'],
            ['remote', 'Remote'],
            ['hybrid', 'Hybrid'],
            ['full_time', 'Full-time']
          ].map(([val, label]) => (
            <button
              key={val}
              type="button"
              className={`filterPill ${filterType === val ? 'active' : ''}`}
              onClick={() => setFilterType(val)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="jobGrid">
        {filtered.map(j=>{
          const applied=appliedMap.get(j.id);

          return (
            <div className="jobCard" key={j.id}>
              <div className="jobTop">
                <div className="companyLogo">
                  <Building2 size={20}/>
                </div>

                <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                  {applied&&(
                    <span className="appliedBadge">
                      <CheckCircle2 size={13}/> Applied
                    </span>
                  )}
                  <span className={`status ${j.status}`}>
                    {j.status}
                  </span>
                </div>
              </div>

              <h3>{j.title}</h3>

              <p>
                {j.company_name} · {j.location||'Flexible'} · {j.workplace}
              </p>

              <div className="tags">
                {j.skills?.slice(0,4).map(s=>(
                  <span key={s.id}>{s.name}</span>
                ))}
              </div>

              <div className="jobBottom">
                <span>
                  {j.experience_level||'Open level'}
                </span>

                {user.role==='candidate'?(
                  applied?(
                    <button
                      className="textBtn"
                      onClick={()=>handleOpenJob(j)}
                    >
                      View Details
                      <ArrowUpRight size={15}/>
                    </button>
                  ):(
                    <button
                      className="applyBtn"
                      onClick={()=>handleOpenJob(j)}
                    >
                      Apply Now
                      <ArrowUpRight size={15}/>
                    </button>
                  )
                ):(
                  <button
                    className="textBtn"
                    onClick={()=>handleOpenJob(j)}
                  >
                    View Details
                    <ArrowUpRight size={15}/>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {!filtered.length&&(
          <Empty text="No matching jobs."/>
        )}
      </div>

      {selectedJob&&(
        <div className="modalOverlay" onClick={()=>setSelectedJob(null)}>
          <div className="modalCard" onClick={e=>e.stopPropagation()}>
            <div className="modalHead">
              <div>
                <span className="companyTag">{selectedJob.company_name||'TalentFlow'}</span>
                <h2>{selectedJob.title}</h2>
                <div className="jobMetaRow">
                  <span><MapPin size={14}/> {selectedJob.location||'Flexible / Remote'}</span>
                  <span><Clock size={14}/> {selectedJob.employment_type||'Full-time'} · {selectedJob.workplace}</span>
                  {(selectedJob.salary_min||selectedJob.salary_max)&&(
                    <span><DollarSign size={14}/> {selectedJob.salary_min?`$${Number(selectedJob.salary_min).toLocaleString()}`:''} {selectedJob.salary_max?`- $${Number(selectedJob.salary_max).toLocaleString()}`:''}</span>
                  )}
                </div>
              </div>
              <button className="icon closeBtn" onClick={()=>setSelectedJob(null)}>
                <X size={20}/>
              </button>
            </div>

            <div className="modalBody">
              {feedback&&(
                <div className={`alert ${feedback.type==='success'?'alertSuccess':'alertError'}`}>
                  {feedback.type==='success'&&<CheckCircle2 size={16}/>}
                  <span>{feedback.message}</span>
                </div>
              )}

              {appliedMap.has(selectedJob.id)&&(
                <div className="alreadyAppliedBanner">
                  <CheckCircle2 size={20} className="appliedIcon"/>
                  <div>
                    <b>You have already applied for this job</b>
                    <p style={{margin:'2px 0 0',color:'#506077'}}>
                      Application Status: <span className={`status ${appliedMap.get(selectedJob.id).status}`}>{appliedMap.get(selectedJob.id).status}</span>
                      {appliedMap.get(selectedJob.id).applied_at&&` · Applied on ${new Date(appliedMap.get(selectedJob.id).applied_at).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
              )}

              <div className="jobSection">
                <h4>Job Description</h4>
                <p className="jobText">{selectedJob.description}</p>
              </div>

              {selectedJob.requirements&&(
                <div className="jobSection">
                  <h4>Key Requirements</h4>
                  <p className="jobText">{selectedJob.requirements}</p>
                </div>
              )}

              {selectedJob.skills&&selectedJob.skills.length>0&&(
                <div className="jobSection">
                  <h4>Required Skills</h4>
                  <div className="tags">
                    {selectedJob.skills.map(s=>(
                      <span key={s.id}>{s.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {user.role==='candidate'&&!appliedMap.has(selectedJob.id)&&(
                <div className="applySection">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                    <h4 style={{margin:0}}>Candidate Resume & Application</h4>
                    <span className="pill" style={{background:'#eff6ff',color:'#2563eb',border:'1px solid #bfdbfe',fontSize:'11.5px'}}>
                      <Sparkles size={11}/> Automated ATS Resume Scoring
                    </span>
                  </div>

                  <div style={{background:'#f8fafc',padding:'16px',borderRadius:'12px',border:'1px solid #e2e8f0',marginBottom:'14px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                      <label style={{fontSize:'13px',fontWeight:700,color:'#0f172a'}}>
                        Candidate Resume <span style={{color:'#ef4444'}}>* (Compulsory)</span>
                      </label>
                      <button
                        type="button"
                        style={{
                          background:'#ede9fe',
                          color:'#6366f1',
                          border:'1px solid #c7d2fe',
                          borderRadius:'6px',
                          padding:'4px 10px',
                          fontSize:'11.5px',
                          fontWeight:600,
                          cursor:'pointer'
                        }}
                        onClick={()=>handlePreFillResume(selectedJob)}
                      >
                        ⚡ Pre-fill Sample Tech Resume
                      </button>
                    </div>

                    <div style={{display:'flex',gap:'10px',alignItems:'center',marginBottom:'10px'}}>
                      <input
                        type="file"
                        id="resumeFileInput"
                        accept=".txt,.pdf,.doc,.docx"
                        style={{display:'none'}}
                        onChange={handleFileUpload}
                      />
                      <button
                        type="button"
                        onClick={()=>document.getElementById('resumeFileInput').click()}
                        style={{
                          background:'#fff',
                          border:'1px dashed #94a3b8',
                          padding:'8px 14px',
                          borderRadius:'8px',
                          fontSize:'12.5px',
                          cursor:'pointer',
                          display:'flex',
                          alignItems:'center',
                          gap:'6px',
                          color:'#334155'
                        }}
                      >
                        <FileText size={15}/> {resumeFilename ? `Uploaded: ${resumeFilename}` : 'Upload Resume File (.txt, .pdf, .docx)'}
                      </button>
                      {resumeFilename&&(
                        <span style={{fontSize:'12px',color:'#16a34a',fontWeight:600}}>
                          ✓ File Attached
                        </span>
                      )}
                    </div>

                    <label style={{display:'block',fontSize:'12px',color:'#64748b',marginBottom:'4px'}}>
                      Resume Content / Technical Skills & Work History:
                    </label>
                    <textarea
                      rows={6}
                      value={resumeText}
                      onChange={e=>setResumeText(e.target.value)}
                      placeholder="Paste or edit your professional work experience, technical projects, and skills here..."
                      style={{
                        fontFamily:'monospace',
                        fontSize:'12px',
                        background:'#fff',
                        lineHeight:'1.5',
                        borderColor: !resumeText && feedback?.type==='error' ? '#ef4444' : '#cbd5e1'
                      }}
                    />
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'11px',color:'#94a3b8',marginTop:'4px'}}>
                      <span>Evaluated automatically by the ATS screening engine</span>
                      <span>{resumeText.length} characters</span>
                    </div>
                  </div>

                  <label htmlFor="coverLetter" className="muted" style={{display:'block',marginBottom:'6px',fontSize:'12.5px',fontWeight:600}}>
                    Cover Letter / Introduction Note
                  </label>
                  <textarea
                    id="coverLetter"
                    rows={2}
                    value={coverLetter}
                    onChange={e=>setCoverLetter(e.target.value)}
                    placeholder="Brief intro for the hiring team..."
                  />

                  <div className="modalActions" style={{marginTop:'16px'}}>
                    <button className="ghost" onClick={()=>setSelectedJob(null)} type="button">
                      Cancel
                    </button>
                    <button
                      className="primary"
                      onClick={()=>submitApplication(selectedJob.id)}
                      disabled={applying}
                    >
                      {applying?'Screening Resume...':'Submit Application & Run ATS'}
                      <Send size={15}/>
                    </button>
                  </div>
                </div>
              )}

              {user.role==='recruiter'&&(
                <div className="recruiterNote">
                  <small className="muted">Recruiter preview: You created or manage this position.</small>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

async function apply(job,reload){
  try{
    await api('/applications/',{
      method:'POST',
      body:JSON.stringify({
        job,
        cover_letter:'I am interested in this opportunity.'
      })
    });

    alert('Application submitted!');
    await reload();
  }catch(e){
    alert(e.message);
  }
}

function Applications({user,apps,jobs=[],onRunAIScreen,evaluatingAI,reload}){
  const [filterJobId, setFilterJobId] = useState('all');
  const [autoShortlisting, setAutoShortlisting] = useState(false);
  const [shortlistMsg, setShortlistMsg] = useState(null);

  const handleAutoShortlist = async () => {
    setAutoShortlisting(true);
    setShortlistMsg(null);
    try {
      const res = await api('/applications/auto-shortlist/', {
        method: 'POST',
        body: JSON.stringify({
          job_id: filterJobId === 'all' ? null : Number(filterJobId),
          threshold: 75
        })
      });
      setShortlistMsg({ type: 'success', text: res.message || `Successfully auto-shortlisted ${res.shortlisted_count} candidate(s)!` });
      if(reload) await reload();
    } catch(e) {
      setShortlistMsg({ type: 'error', text: e.message || 'Auto-shortlisting failed.' });
    } finally {
      setAutoShortlisting(false);
    }
  };

  if(user?.role==='candidate'){
    const stageRank = {
      applied: 1,
      screening: 2,
      shortlisted: 3,
      interview: 4,
      offer: 5,
      hired: 6
    };

    const statusDetails = {
      applied: { label: 'Applied / In Review', note: 'Your application has been received and queued for recruiter review.' },
      screening: { label: 'Resume Screening', note: 'The hiring team is actively evaluating your resume and qualifications.' },
      shortlisted: { label: 'Shortlisted Candidate', note: 'Your profile has passed initial screening and is shortlisted for next rounds!' },
      interview: { label: 'Interview Stage', note: 'Interview requested or scheduled. Check the My Interviews tab for updates.' },
      offer: { label: 'Offer Extended 🎉', note: 'Congratulations! An employment offer has been extended by the hiring team.' },
      hired: { label: 'Hired & Joined 🚀', note: 'Welcome aboard! Hiring process has concluded successfully.' }
    };

    return (
      <div className="card tableCard">
        <div className="cardHead">
          <div>
            <h3>My Job Applications</h3>
            <p style={{margin:'2px 0 0',fontSize:'13px',color:'#64748b'}}>
              Track real-time hiring progress and status updates for your submitted applications
            </p>
          </div>
          <span style={{fontWeight:600}}>{apps.length} Submitted</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>Applied Role</th>
              <th>Applied Date</th>
              <th>Current Status</th>
              <th>Hiring Stage Progress</th>
              <th>Status Guidance</th>
            </tr>
          </thead>

          <tbody>
            {apps.map(a=>{
              const currentRank = stageRank[a.status] || 1;
              const details = statusDetails[a.status] || { label: a.status, note: 'Application is being processed by the hiring team.' };

              return (
                <tr key={a.id}>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <div className="avatar small" style={{background:'#f1f5f9',color:'#475569'}}>
                        <BriefcaseBusiness size={15}/>
                      </div>
                      <div>
                        <span style={{fontWeight:600,color:'#0f172a',display:'block'}}>{a.job_title}</span>
                        <small style={{color:'#64748b'}}>App ID #{a.id}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    {new Date(a.applied_at).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'})}
                  </td>
                  <td>
                    <span className={`status ${a.status}`}>
                      {details.label}
                    </span>
                  </td>
                  <td style={{minWidth:'180px'}}>
                    <div style={{display:'flex',gap:'4px',alignItems:'center'}}>
                      {[1,2,3,4,5].map(step=>(
                        <div
                          key={step}
                          style={{
                            height:'6px',
                            flex:1,
                            borderRadius:'999px',
                            background: step <= currentRank ? '#4f46e5' : '#e2e8f0',
                            transition:'background 0.3s'
                          }}
                          title={`Stage ${step}`}
                        />
                      ))}
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'10.5px',color:'#94a3b8',marginTop:'4px'}}>
                      <span>Applied</span>
                      <span>Review</span>
                      <span>Interview</span>
                      <span>Offer</span>
                    </div>
                  </td>
                  <td>
                    <span style={{fontSize:'12.5px',color:'#475569'}}>
                      {details.note}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!apps.length&&(
          <Empty text="You haven't applied to any job openings yet. Explore the 'Find Jobs' tab to get started!"/>
        )}
      </div>
    );
  }

  // Recruiter View
  const filteredApps = filterJobId === 'all'
    ? apps
    : apps.filter(a => String(a.job) === String(filterJobId));

  return (
    <div className="card tableCard">
      <div className="cardHead" style={{flexWrap:'wrap',gap:'12px'}}>
        <div>
          <h3>Candidate Applications & ATS Screening</h3>
          <p style={{margin:'2px 0 0',fontSize:'13px',color:'#64748b'}}>
            Evaluate applicant resumes, review verified strengths & weaknesses, and auto-shortlist top candidates
          </p>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
            <label style={{fontSize:'12px',fontWeight:600,color:'#475569'}}>Role:</label>
            <select
              value={filterJobId}
              onChange={e=>{
                setFilterJobId(e.target.value);
                setShortlistMsg(null);
              }}
              style={{padding:'6px 10px',fontSize:'12.5px',borderRadius:'8px',border:'1px solid #cbd5e1'}}
            >
              <option value="all">All Job Postings ({apps.length})</option>
              {jobs.map(j=>(
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="primary"
            style={{
              padding:'7px 14px',
              fontSize:'12.5px',
              background:'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              gap:'6px'
            }}
            onClick={handleAutoShortlist}
            disabled={autoShortlisting}
            title="Automatically move candidates with ATS score ≥ 75% to Shortlisted"
          >
            <Sparkles size={14}/>
            {autoShortlisting ? 'Processing...' : '⚡ Auto-Shortlist (ATS ≥ 75%)'}
          </button>
        </div>
      </div>

      {shortlistMsg&&(
        <div style={{
          margin:'0 24px 16px',
          padding:'10px 14px',
          borderRadius:'8px',
          fontSize:'13px',
          background: shortlistMsg.type==='success' ? '#f0fdf4' : '#fef2f2',
          color: shortlistMsg.type==='success' ? '#166534' : '#991b1b',
          border: `1px solid ${shortlistMsg.type==='success' ? '#bbf7d0' : '#fecaca'}`,
          display:'flex',
          justifyContent:'space-between',
          alignItems:'center'
        }}>
          <span>{shortlistMsg.text}</span>
          <button
            type="button"
            onClick={()=>setShortlistMsg(null)}
            style={{background:'none',border:'none',cursor:'pointer',color:'inherit',fontWeight:700}}
          >
            ✕
          </button>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>Candidate</th>
            <th>Role Applied</th>
            <th>Stage</th>
            <th>ATS Score & Recommendation</th>
            <th>Applied Date</th>
            <th>Recruiter ATS Screener</th>
          </tr>
        </thead>

        <tbody>
          {filteredApps.map(a=>{
            const score = a.match_score || 0;
            const fitLabel = a.ai_recommendation || (score >= 80 ? 'Strong Match' : score >= 65 ? 'Qualified' : score >= 50 ? 'Moderate Fit' : 'Low Match');
            const fitColor = score >= 80 ? '#15803d' : score >= 65 ? '#2563eb' : score >= 50 ? '#d97706' : '#dc2626';
            const fitBg = score >= 80 ? '#f0fdf4' : score >= 65 ? '#eff6ff' : score >= 50 ? '#fffbeb' : '#fef2f2';

            return (
              <tr key={a.id}>
                <td>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <div className="avatar small">
                      {(a.candidate_name||'C')[0]}
                    </div>
                    <div>
                      <span style={{fontWeight:600}}>{a.candidate_name||'Candidate'}</span>
                      {a.resume_filename&&(
                        <small style={{display:'block',color:'#64748b',fontSize:'11px'}}>
                          📄 {a.resume_filename}
                        </small>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <span style={{fontWeight:600,color:'#1e293b'}}>{a.job_title}</span>
                </td>
                <td>
                  <span className={`status ${a.status}`}>
                    {a.status}
                  </span>
                </td>
                <td>
                  <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                    <span className="matchScoreBadge" style={{alignSelf:'flex-start'}}>
                      <Sparkles size={11}/> {score ? `${score}% ATS Score` : 'Unscreened'}
                    </span>
                    {score > 0 && (
                      <span style={{
                        fontSize:'11px',
                        fontWeight:700,
                        color: fitColor,
                        background: fitBg,
                        padding:'2px 6px',
                        borderRadius:'4px',
                        alignSelf:'flex-start'
                      }}>
                        {fitLabel}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  {new Date(a.applied_at).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'})}
                </td>
                <td>
                  <button
                    type="button"
                    className="aiScreenBtn"
                    onClick={()=>onRunAIScreen(a.id)}
                    disabled={evaluatingAI}
                  >
                    <Sparkles size={13}/>
                    {a.ai_summary ? 'ATS Scorecard & Dossier' : 'Run ATS Evaluation'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {!filteredApps.length&&(
        <Empty text="No applications found for the selected filter."/>
      )}
    </div>
  );
}

function Pipeline({apps,onStatusChange,onRunAIScreen,evaluatingAI}){
  const stages=[
    'applied',
    'screening',
    'shortlisted',
    'interview',
    'offer',
    'hired'
  ];

  const stageLabels={
    applied:'Applied',
    screening:'Screening',
    shortlisted:'Shortlisted',
    interview:'Interview',
    offer:'Offer',
    hired:'Hired'
  };

  return (
    <div className="pipeline">
      {stages.map(s=>{
        const columnApps = apps.filter(a=>a.status===s);

        return (
          <div className="column" key={s}>
            <div className="colHead">
              <b>{stageLabels[s]}</b>
              <span>{columnApps.length}</span>
            </div>

            {columnApps.map(a=>(
              <div className="candidateCard" key={a.id}>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <div className="avatar small">
                    {(a.candidate_name||'C')[0]}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <b>{a.candidate_name||'Candidate'}</b>
                    <small style={{display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {a.job_title}
                    </small>
                  </div>
                </div>

                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'4px'}}>
                  <span className="matchScoreBadge">
                    <Sparkles size={11}/> {a.match_score ? `${a.match_score}% Match` : 'Unscreened'}
                  </span>
                  {a.applied_at&&(
                    <span style={{fontSize:'11px',color:'#64748b'}}>
                      {new Date(a.applied_at).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="aiReviewBtn"
                  onClick={()=>onRunAIScreen(a.id)}
                  disabled={evaluatingAI}
                >
                  <Sparkles size={12}/>
                  {a.ai_summary ? 'AI Dossier & Questions' : 'Run AI Screen'}
                </button>

                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'6px',marginTop:'4px'}}>
                  <span style={{fontSize:'11px',fontWeight:600,color:'#64748b'}}>Move:</span>
                  <select
                    value={a.status}
                    onChange={e=>onStatusChange(a.id,e.target.value)}
                  >
                    {stages.map(stage=>(
                      <option key={stage} value={stage}>
                        {stageLabels[stage]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}

            {!columnApps.length&&(
              <div style={{padding:'32px 10px',textAlign:'center',color:'#94a3b8',fontSize:'12.5px',fontStyle:'italic'}}>
                No candidates in {stageLabels[s]}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Interviews(){
  return (
    <div className="card emptyLarge" style={{maxWidth:'640px',margin:'30px auto',padding:'48px 32px'}}>
      <div className="statIcon" style={{width:'64px',height:'64px',margin:'0 auto 18px',borderRadius:'16px'}}>
        <CalendarDays size={32}/>
      </div>
      <h3 style={{fontSize:'22px',marginBottom:'8px'}}>Smart Interview Orchestrator</h3>
      <p style={{maxWidth:'480px',margin:'0 auto 24px',lineHeight:'1.6',color:'#64748b',fontSize:'14.5px'}}>
        Schedule technical screens, distribute meeting coordinates, and collect structured interviewer feedback automatically.
      </p>
      <div style={{display:'inline-flex',gap:'12px',background:'#f1f5f9',padding:'10px 20px',borderRadius:'12px',fontSize:'13px',color:'#334155',fontWeight:600}}>
        <span>✓ Calendar Integrations</span>
        <span>✓ Virtual Meeting Links</span>
        <span>✓ Candidate Scorecards</span>
      </div>
    </div>
  );
}

function CreateJob({onDone}){
  const [skills,setSkills]=useState([]);
  const [selectedSkills,setSelectedSkills]=useState([]);

  const [f,setF]=useState({
    title:'Senior Python Developer',
    description:'Build reliable backend services and APIs.',
    requirements:'Django, REST APIs, PostgreSQL, Git',
    location:'Chennai, India',
    employment_type:'full_time',
    workplace:'hybrid',
    experience_level:'2+ years',
    status:'published'
  });

  useEffect(()=>{
    api('/jobs/skills/')
      .then(data=>setSkills(data.results||data))
      .catch(e=>alert(e.message));
  },[]);

  const toggleSkill=(id)=>{
    setSelectedSkills(prev=>
      prev.includes(id)
        ?prev.filter(skillId=>skillId!==id)
        :[...prev,id]
    );
  };

  const submit=async e=>{
    e.preventDefault();

    try{
      await api('/jobs/',{
        method:'POST',
        body:JSON.stringify({
          ...f,
          skill_ids:selectedSkills
        })
      });

      onDone();
    }catch(e){
      alert(e.message);
    }
  };

  return (
    <div className="card formCard">
      <h3>Create a new role</h3>

      <form onSubmit={submit}>
        <input
          placeholder="Job title"
          value={f.title}
          onChange={e=>
            setF({...f,title:e.target.value})
          }
        />

        <textarea
          placeholder="Description"
          value={f.description}
          onChange={e=>
            setF({...f,description:e.target.value})
          }
        />

        <textarea
          placeholder="Requirements"
          value={f.requirements}
          onChange={e=>
            setF({...f,requirements:e.target.value})
          }
        />

        <div className="formRow">
          <input
            placeholder="Location"
            value={f.location}
            onChange={e=>
              setF({...f,location:e.target.value})
            }
          />

          <select
            value={f.workplace}
            onChange={e=>
              setF({...f,workplace:e.target.value})
            }
          >
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site</option>
          </select>
        </div>

        <div className="skillSection">
          <label>Skills</label>

          <div className="skillOptions">
            {skills.map(skill=>(
              <button
                type="button"
                key={skill.id}
                className={
                  selectedSkills.includes(skill.id)
                    ?'skill selected'
                    :'skill'
                }
                onClick={()=>toggleSkill(skill.id)}
              >
                {skill.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <button className="primary">
            Publish job
          </button>
        </div>
      </form>
    </div>
  );
}

function Empty({text}){
  return <div className="empty">{text}</div>;
}

createRoot(
  document.getElementById('root')
).render(<App/>);