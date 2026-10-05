import React, { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, BriefcaseBusiness, Users, KanbanSquare, CalendarDays, Bell, LogOut, Plus, Search, ArrowUpRight, CheckCircle2, Building2, X, Clock, MapPin, DollarSign, Send, Sparkles, ChevronRight, Filter, Compass, FileText, Award, Brain, AlertTriangle, ShieldCheck, Check, RotateCcw, HelpCircle, Video, Calendar, Star, MessageSquare, ExternalLink, CalendarPlus, Copy, CheckCheck, BarChart3, TrendingUp, UploadCloud, Download } from 'lucide-react';
import { api, uploadResumeFile } from '../api';
import Stat from '../components/common/Stat';
import Empty from '../components/common/Empty';

export default function Jobs({user,jobs,apps=[],reload,onNavigate}){
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

  // ==========================================
  // RECRUITER VIEW: Requisition & Talent Desk
  // ==========================================
  if (user?.role === 'recruiter') {
    const totalJobs = jobs.length;
    const totalApps = apps.length;
    const shortlistedApps = apps.filter(a => a.status === 'shortlisted').length;
    const interviewApps = apps.filter(a => a.status === 'interview').length;
    const hiredApps = apps.filter(a => a.status === 'offer' || a.status === 'hired').length;

    const recruiterFiltered = jobs.filter(j => {
      const matchesQ = j.title.toLowerCase().includes(q.toLowerCase()) ||
        (j.company_name || '').toLowerCase().includes(q.toLowerCase()) ||
        (j.location || '').toLowerCase().includes(q.toLowerCase());
      if (!matchesQ) return false;
      if (filterType === 'remote') return j.workplace === 'remote';
      if (filterType === 'hybrid') return j.workplace === 'hybrid';
      if (filterType === 'full_time') return j.employment_type === 'full_time';
      return true;
    });

    return (
      <div style={{animation:'tfFadeIn 0.3s ease'}}>
        {/* Recruiter Header */}
        <div className="interviewHubHeader">
          <div>
            <div className="eyebrow" style={{display:'inline-flex',alignItems:'center',gap:'6px',color:'#4f46e5',marginBottom:'6px'}}>
              <BriefcaseBusiness size={13}/>
              <span>REQUISITION DESK & TALENT PIPELINES</span>
            </div>
            <h2 className="interviewHubTitle">
              Job Postings & Candidate Pipeline Hub
            </h2>
            <p className="muted" style={{margin:0,fontSize:'13.5px',color:'#64748b'}}>
              Manage open requisitions, monitor live applicant volume across stages, and review candidate talent pools.
            </p>
          </div>

          <button
            type="button"
            className="primary"
            onClick={() => onNavigate && onNavigate('create')}
            style={{
              padding: '10px 20px',
              fontSize: '13.5px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '10px',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
            }}
          >
            <Plus size={16}/> Post New Position
          </button>
        </div>

        {/* Requisition Metrics Bar */}
        <div className="interviewStatsGrid" style={{marginBottom:'24px'}}>
          <div className="interviewStatCard">
            <div className="interviewStatIcon" style={{background:'#ede9fe',color:'#7c3aed'}}>
              <BriefcaseBusiness size={22}/>
            </div>
            <div>
              <div style={{fontSize:'12px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.5px'}}>
                Active Openings
              </div>
              <div style={{fontSize:'22px',fontWeight:800,color:'#0f172a',marginTop:'2px'}}>
                {totalJobs}
              </div>
            </div>
          </div>

          <div className="interviewStatCard">
            <div className="interviewStatIcon" style={{background:'#dbeafe',color:'#2563eb'}}>
              <Users size={22}/>
            </div>
            <div>
              <div style={{fontSize:'12px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.5px'}}>
                Candidate Pool
              </div>
              <div style={{fontSize:'22px',fontWeight:800,color:'#0f172a',marginTop:'2px'}}>
                {totalApps}
              </div>
            </div>
          </div>

          <div className="interviewStatCard">
            <div className="interviewStatIcon" style={{background:'#fef3c7',color:'#d97706'}}>
              <Brain size={22}/>
            </div>
            <div>
              <div style={{fontSize:'12px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.5px'}}>
                Shortlisted
              </div>
              <div style={{fontSize:'22px',fontWeight:800,color:'#0f172a',marginTop:'2px'}}>
                {shortlistedApps}
              </div>
            </div>
          </div>

          <div className="interviewStatCard">
            <div className="interviewStatIcon" style={{background:'#dcfce7',color:'#16a34a'}}>
              <CalendarDays size={22}/>
            </div>
            <div>
              <div style={{fontSize:'12px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.5px'}}>
                Interviewing / Offers
              </div>
              <div style={{fontSize:'22px',fontWeight:800,color:'#0f172a',marginTop:'2px'}}>
                {interviewApps + hiredApps}
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar" style={{flexWrap:'wrap',marginBottom:'20px'}}>
          <div className="search" style={{minWidth:'280px'}}>
            <Search size={18}/>
            <input
              placeholder="Search requisitions by title, location..."
              value={q}
              onChange={e=>setQ(e.target.value)}
            />
          </div>

          <div className="filterPills">
            {[
              ['all', `All Postings (${jobs.length})`],
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

        {/* Requisitions Grid */}
        <div className="jobGrid">
          {recruiterFiltered.map(j => {
            const jApps = apps.filter(a => {
              const jid = typeof a.job === 'object' ? a.job?.id : a.job;
              return Number(jid) === Number(j.id);
            });
            const jNew = jApps.filter(a => a.status === 'applied' || a.status === 'screening').length;
            const jShort = jApps.filter(a => a.status === 'shortlisted').length;
            const jInt = jApps.filter(a => a.status === 'interview').length;
            const jOffer = jApps.filter(a => a.status === 'offer' || a.status === 'hired').length;

            return (
              <div className="jobCard" key={j.id} style={{display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
                <div>
                  <div className="jobTop">
                    <div className="companyLogo" style={{background:'#ede9fe',color:'#6366f1'}}>
                      <Building2 size={20}/>
                    </div>
                    <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                      <span className={`status ${j.status}`}>
                        {j.status}
                      </span>
                      <span className="pill" style={{fontSize:'11px',background:'#f1f5f9',color:'#475569',border:'1px solid #e2e8f0'}}>
                        {j.workplace}
                      </span>
                    </div>
                  </div>

                  <h3 style={{fontSize:'18px',marginBottom:'4px'}}>{j.title}</h3>
                  <p style={{margin:'0 0 12px',fontSize:'13px',color:'#64748b'}}>
                    {j.company_name || 'TalentFlow'} · {j.location || 'Flexible'} · {j.employment_type || 'Full-time'}
                  </p>

                  {/* Applicant Funnel Breakdown */}
                  <div style={{background:'#f8fafc',padding:'12px',borderRadius:'10px',border:'1px solid #e2e8f0',marginBottom:'14px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                      <span style={{fontSize:'12px',fontWeight:700,color:'#334155',display:'inline-flex',alignItems:'center',gap:'4px'}}>
                        <Users size={13} style={{color:'#6366f1'}}/> Applicant Pipeline
                      </span>
                      <span style={{fontSize:'12px',fontWeight:800,color:'#0f172a'}}>
                        {jApps.length} Candidates
                      </span>
                    </div>

                    <div style={{display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:'4px',textAlign:'center'}}>
                      <div style={{background:'#fff',padding:'6px 2px',borderRadius:'6px',border:'1px solid #e2e8f0'}}>
                        <div style={{fontSize:'10px',fontWeight:600,color:'#64748b'}}>Review</div>
                        <div style={{fontSize:'13px',fontWeight:700,color:'#2563eb'}}>{jNew}</div>
                      </div>
                      <div style={{background:'#fff',padding:'6px 2px',borderRadius:'6px',border:'1px solid #e2e8f0'}}>
                        <div style={{fontSize:'10px',fontWeight:600,color:'#64748b'}}>Shortlist</div>
                        <div style={{fontSize:'13px',fontWeight:700,color:'#d97706'}}>{jShort}</div>
                      </div>
                      <div style={{background:'#fff',padding:'6px 2px',borderRadius:'6px',border:'1px solid #e2e8f0'}}>
                        <div style={{fontSize:'10px',fontWeight:600,color:'#64748b'}}>Interview</div>
                        <div style={{fontSize:'13px',fontWeight:700,color:'#7c3aed'}}>{jInt}</div>
                      </div>
                      <div style={{background:'#fff',padding:'6px 2px',borderRadius:'6px',border:'1px solid #e2e8f0'}}>
                        <div style={{fontSize:'10px',fontWeight:600,color:'#64748b'}}>Hired</div>
                        <div style={{fontSize:'13px',fontWeight:700,color:'#16a34a'}}>{jOffer}</div>
                      </div>
                    </div>
                  </div>

                  <div className="tags" style={{marginBottom:'16px'}}>
                    {j.skills?.slice(0, 4).map(s => (
                      <span key={s.id}>{s.name}</span>
                    ))}
                  </div>
                </div>

                {/* Recruiter Action Buttons */}
                <div style={{borderTop:'1px solid #f1f5f9',paddingTop:'14px',display:'flex',flexDirection:'column',gap:'8px'}}>
                  <div style={{display:'flex',gap:'8px'}}>
                    <button
                      type="button"
                      className="primary"
                      style={{flex:1,padding:'8px 12px',fontSize:'12.5px',fontWeight:700,display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'6px',borderRadius:'8px'}}
                      onClick={() => onNavigate && onNavigate('applications', j.id)}
                      title="Review candidates for this job posting"
                    >
                      <Users size={14}/> Candidates ({jApps.length})
                    </button>
                    <button
                      type="button"
                      className="ghost"
                      style={{padding:'8px 12px',fontSize:'12.5px',fontWeight:600,display:'inline-flex',alignItems:'center',gap:'4px',borderRadius:'8px',border:'1px solid #cbd5e1'}}
                      onClick={() => onNavigate && onNavigate('pipeline')}
                      title="Open Hiring Pipeline Kanban"
                    >
                      <KanbanSquare size={14}/> Pipeline
                    </button>
                  </div>
                  <button
                    type="button"
                    className="textBtn"
                    style={{width:'100%',justifyContent:'center',padding:'4px',fontSize:'12px',color:'#64748b'}}
                    onClick={() => handleOpenJob(j)}
                  >
                    View Requisition Details
                  </button>
                </div>
              </div>
            );
          })}

          {!recruiterFiltered.length && (
            <Empty text="No matching job requisitions found."/>
          )}
        </div>

        {/* Recruiter Requisition Details Modal (strictly WITHOUT apply/resume upload form) */}
        {selectedJob && (
          <div className="modalOverlay" onClick={() => setSelectedJob(null)}>
            <div className="modalCard" onClick={e => e.stopPropagation()}>
              <div className="modalHead">
                <div>
                  <span className="companyTag">{selectedJob.company_name || 'TalentFlow'}</span>
                  <h2>{selectedJob.title}</h2>
                  <div className="jobMetaRow">
                    <span><MapPin size={14}/> {selectedJob.location || 'Flexible / Remote'}</span>
                    <span><Clock size={14}/> {selectedJob.employment_type || 'Full-time'} · {selectedJob.workplace}</span>
                    {(selectedJob.salary_min || selectedJob.salary_max) && (
                      <span><DollarSign size={14}/> {selectedJob.salary_min ? `$${Number(selectedJob.salary_min).toLocaleString()}` : ''} {selectedJob.salary_max ? `- $${Number(selectedJob.salary_max).toLocaleString()}` : ''}</span>
                    )}
                  </div>
                </div>
                <button className="icon closeBtn" onClick={() => setSelectedJob(null)}>
                  <X size={20}/>
                </button>
              </div>

              <div className="modalBody">
                <div style={{background:'#f8fafc',padding:'12px 16px',borderRadius:'10px',border:'1px solid #e2e8f0',marginBottom:'16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <span style={{fontSize:'12px',color:'#64748b',fontWeight:600}}>Requisition Status</span>
                    <div style={{marginTop:'2px'}}><span className={`status ${selectedJob.status}`}>{selectedJob.status}</span></div>
                  </div>
                  <button
                    type="button"
                    className="primary"
                    style={{padding:'7px 14px',fontSize:'12.5px',borderRadius:'8px'}}
                    onClick={() => {
                      const jid = selectedJob.id;
                      setSelectedJob(null);
                      if (onNavigate) onNavigate('applications', jid);
                    }}
                  >
                    <Users size={14}/> View All Applicants
                  </button>
                </div>

                <div className="jobSection">
                  <h4>Job Description</h4>
                  <p className="jobText">{selectedJob.description}</p>
                </div>

                {selectedJob.requirements && (
                  <div className="jobSection">
                    <h4>Key Requirements & Responsibilities</h4>
                    <p className="jobText">{selectedJob.requirements}</p>
                  </div>
                )}

                {selectedJob.skills && selectedJob.skills.length > 0 && (
                  <div className="jobSection">
                    <h4>Target Skills for ATS Keyword Matching</h4>
                    <div className="tags">
                      {selectedJob.skills.map(s => (
                        <span key={s.id}>{s.name}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="modalActions" style={{marginTop:'20px'}}>
                  <button className="ghost" onClick={() => setSelectedJob(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // CANDIDATE VIEW: Job Explorer & Application
  // ==========================================
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

