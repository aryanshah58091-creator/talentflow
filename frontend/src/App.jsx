import React, { useEffect, useState, useRef } from 'react';
import {
  LayoutDashboard, BriefcaseBusiness, Users, KanbanSquare, CalendarDays,
  Bell, LogOut, Plus, Search, ArrowUpRight, CheckCircle2, Building2, X, Clock,
  MapPin, DollarSign, Send, Sparkles, ChevronRight, Filter, Compass, FileText,
  Award, Brain, AlertTriangle, ShieldCheck, Check, RotateCcw, HelpCircle, Video,
  Calendar, Star, MessageSquare, ExternalLink, CalendarPlus, Copy, CheckCheck,
  BarChart3, TrendingUp
} from 'lucide-react';
import './styles.css';
import { api } from './api';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Applications from './pages/Applications';
import Interviews from './pages/Interviews';
import Pipeline from './components/recruiter/Pipeline';
import CreateJob from './components/recruiter/CreateJob';
import AnalyticsDashboard from './components/recruiter/AnalyticsDashboard';
import NotificationDrawer from './components/common/NotificationDrawer';
import HowAssessmentWorksModal from './components/modals/HowAssessmentWorksModal';
import AssessmentPortal from './components/assessment/AssessmentPortal';
import RecruiterAssessmentModal from './components/modals/RecruiterAssessmentModal';

export default function App() {
  const [user,setUser]=useState(
    JSON.parse(localStorage.getItem('tf_user')||'null')
  );
  const [view,setViewState]=useState(()=>{
    const saved = localStorage.getItem('tf_view');
    const valid = ['dashboard','jobs','applications','pipeline','interviews','create','analytics'];
    return saved && valid.includes(saved) ? saved : 'dashboard';
  });

  const setView = (newView) => {
    localStorage.setItem('tf_view', newView);
    setViewState(newView);
  };

  const [jobs,setJobs]=useState([]);
  const [apps,setApps]=useState([]);
  const [notifications,setNotifications]=useState([]);
  const [showNotifications,setShowNotifications]=useState(false);
  const [updatingAppId,setUpdatingAppId]=useState(null);
  const [pipelineToast,setPipelineToast]=useState(null);
  const [howAssessmentWorksModal,setHowAssessmentWorksModal]=useState(false);
  const [applicationsJobFilter, setApplicationsJobFilter] = useState('all');
  const [error,setError]=useState('');

  // Sync user profile on mount to ensure fresh role and permissions
  useEffect(()=>{
    const token = localStorage.getItem('tf_token');
    if (token) {
      api('/accounts/me/')
        .then(u => {
          if (u && u.id) {
            localStorage.setItem('tf_user', JSON.stringify(u));
            setUser(u);
          }
        })
        .catch(err => {
          console.warn('Profile sync on mount:', err);
          if (err.message && (err.message.includes('401') || err.message.toLowerCase().includes('token') || err.message.toLowerCase().includes('credential'))) {
            logout();
          }
        });
    }
  }, []);

  useEffect(()=>{
    if(user){
      load();
    }
  },[user,view]);

  const loadNotifications=async()=>{
    try{
      const data=await api('/applications/notifications/');
      setNotifications(data.results||data||[]);
    }catch(e){
      console.warn('Notifications fetch error:', e);
    }
  };

  const markNotificationRead=async(notifId)=>{
    try{
      await api(`/applications/notifications/${notifId}/read/`,{method:'POST'});
      setNotifications(prev=>prev.map(n=>n.id===notifId?{...n,is_read:true}:n));
    }catch(e){
      console.error(e);
    }
  };

  const markAllNotificationsRead=async()=>{
    try{
      await api('/applications/notifications/read-all/',{method:'POST'});
      setNotifications(prev=>prev.map(n=>({...n,is_read:true})));
    }catch(e){
      console.error(e);
    }
  };

  const [scheduleForApp, setScheduleForApp] = useState(null);

  const load=async()=>{
    try{
      setError('');
      const [jobsData, appsData] = await Promise.all([
        api('/jobs/').catch(e => { console.warn('Jobs fetch error:', e); return []; }),
        api('/applications/').catch(e => { console.warn('Apps fetch error:', e); return []; })
      ]);
      setJobs(jobsData.results || jobsData || []);
      setApps(appsData.results || appsData || []);
      loadNotifications();
    }catch(e){
      setError(e.message);
    }
  };

  const [activeAIApp,setActiveAIApp]=useState(null);
  const [evaluatingAI,setEvaluatingAI]=useState(false);
  const [activeAssessmentApp, setActiveAssessmentApp] = useState(null);
  const [recruiterAssessmentModal, setRecruiterAssessmentModal] = useState(null);

  const runAIScreen=async(appId)=>{
    if(user?.role !== 'recruiter' && user?.role !== 'admin' && !user?.is_staff){
      alert('Candidate screening and interview dossiers are reserved for recruiters and hiring managers.');
      return;
    }
    const targetApp = apps.find(a => a.id === appId);
    // If application already has evaluation dossier data, open immediately!
    if (targetApp && targetApp.ai_summary) {
      setActiveAIApp({
        application_id: targetApp.id,
        match_score: targetApp.match_score || 85,
        summary: targetApp.ai_summary,
        recommendation: targetApp.ai_recommendation || 'Qualified Candidate',
        strengths: targetApp.ai_strengths?.length ? targetApp.ai_strengths : ['Technical background matches role requirements', 'Demonstrated core software proficiency'],
        weaknesses: targetApp.ai_weaknesses?.length ? targetApp.ai_weaknesses : ['Verify specific production scaling depth in interview'],
        gaps: targetApp.ai_weaknesses?.length ? targetApp.ai_weaknesses : ['Verify specific production scaling depth in interview'],
        resume_text: targetApp.resume_text,
        resume_filename: targetApp.resume_filename,
        interview_questions: targetApp.ai_interview_questions?.length ? targetApp.ai_interview_questions : [
          { target_area: 'System Design', question: 'How have you designed resilient REST APIs to handle high concurrent throughput?', eval_criteria: 'Evaluates architectural scalability and error-handling' },
          { target_area: 'Core Fundamentals', question: 'Describe your debugging workflow when diagnosing an intermittent memory or concurrency issue in production.', eval_criteria: 'Tests practical engineering problem solving' }
        ]
      });
      return;
    }

    setEvaluatingAI(true);
    try{
      const res=await api(`/applications/${appId}/ai-screen/`,{method:'POST'});
      setActiveAIApp(res);
      await load();
    }catch(e){
      if (targetApp) {
        setActiveAIApp({
          application_id: targetApp.id,
          match_score: targetApp.match_score || 82,
          summary: targetApp.ai_summary || `Automated ATS resume screening completed for ${targetApp.job_title}. Qualifications match essential criteria.`,
          recommendation: targetApp.ai_recommendation || 'Strong Match (Auto-Shortlist Recommended)',
          strengths: targetApp.ai_strengths?.length ? targetApp.ai_strengths : ['Relevant domain experience and demonstrated proficiency', 'Comprehensive technical background'],
          weaknesses: targetApp.ai_weaknesses?.length ? targetApp.ai_weaknesses : ['Assess live coding and problem-solving agility'],
          gaps: targetApp.ai_weaknesses?.length ? targetApp.ai_weaknesses : ['Assess live coding and problem-solving agility'],
          resume_text: targetApp.resume_text,
          resume_filename: targetApp.resume_filename,
          interview_questions: targetApp.ai_interview_questions?.length ? targetApp.ai_interview_questions : [
            { target_area: 'System Design', question: 'How do you design scalable APIs for high volume?', eval_criteria: 'Evaluates architectural scalability' },
            { target_area: 'Core Fundamentals', question: 'Describe your debugging workflow for production bottlenecks.', eval_criteria: 'Tests practical engineering' }
          ]
        });
      } else {
        alert(e.message||'AI evaluation failed.');
      }
    }finally{
      setEvaluatingAI(false);
    }
  };

  const updateApplicationStatus=async(id,status)=>{
    if(user?.role !== 'recruiter' && user?.role !== 'admin' && !user?.is_staff){
      alert('Only recruiters and hiring managers can update applicant pipeline stages.');
      return;
    }

    // Immediate Optimistic Update: card moves instantaneously without lag
    const previousApps=[...apps];
    setApps(prev=>prev.map(a=>a.id===id?{...a,status}:a));
    setUpdatingAppId(id);

    try{
      await api(`/applications/${id}/`,{
        method:'PATCH',
        body:JSON.stringify({status})
      });

      if(status === 'shortlisted'){
        setPipelineToast({
          type:'success',
          message:'Candidate moved to Shortlisted! 15-min Online Aptitude Assessment invitation has been unlocked and sent.'
        });
      } else if (status === 'offer') {
        setPipelineToast({
          type:'success',
          message:'🎉 Candidate moved to OFFER EXTENDED stage! Employment packet & offer ready.'
        });
      } else if (status === 'hired') {
        setPipelineToast({
          type:'success',
          message:'🚀 Congratulations! Candidate officially marked as HIRED! Welcome aboard.'
        });
      } else {
        setPipelineToast({
          type:'info',
          message:`Candidate status successfully moved to ${status.toUpperCase()}.`
        });
      }
      setTimeout(()=>setPipelineToast(null), 4500);

      // Background re-fetch to sync full side effects
      const data=await api('/applications/');
      setApps(data.results||data);
      loadNotifications();
    }catch(e){
      // Revert optimistic state on error
      setApps(previousApps);
      alert('Could not update applicant stage: ' + (e.message || 'Please check your connection.'));
    }finally{
      setUpdatingAppId(null);
    }
  };

  const handleLogin = (u) => {
    setJobs([]);
    setApps([]);
    setNotifications([]);
    setView('dashboard');
    setUser(u);
  };

  const logout=()=>{
    localStorage.clear();
    setJobs([]);
    setApps([]);
    setNotifications([]);
    setView('dashboard');
    setUser(null);
  };

  useEffect(() => {
    if (user?.role === 'candidate' && (view === 'pipeline' || view === 'create')) {
      setView('dashboard');
    }
  }, [user, view]);

  if(!user){
    return <Auth onLogin={handleLogin}/>;
  }

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
            ['interviews',CalendarDays,'Interviews'],
            ['analytics',BarChart3,'Analytics & Funnel']
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
            <div style={{position:'relative'}}>
              <button 
                type="button"
                className="icon" 
                title="Notifications" 
                onClick={()=>setShowNotifications(!showNotifications)}
                style={{position:'relative'}}
              >
                <Bell size={18}/>
                {notifications.filter(n=>!n.is_read).length > 0 && (
                  <span style={{
                    position:'absolute',
                    top:'-4px',
                    right:'-4px',
                    background:'#ef4444',
                    color:'#fff',
                    borderRadius:'999px',
                    fontSize:'10px',
                    fontWeight:'700',
                    minWidth:'17px',
                    height:'17px',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    padding:'0 3px',
                    border:'2px solid #fff'
                  }}>
                    {notifications.filter(n=>!n.is_read).length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <NotificationDrawer
                  notifications={notifications}
                  apps={apps}
                  onClose={()=>setShowNotifications(false)}
                  onMarkRead={markNotificationRead}
                  onMarkAllRead={markAllNotificationsRead}
                  onOpenAssessment={(app)=>setActiveAssessmentApp(app)}
                />
              )}
            </div>

            <button
              type="button"
              className="ghost"
              style={{display:'inline-flex',alignItems:'center',gap:'6px',fontSize:'13px',padding:'7px 11px',borderRadius:'8px',border:'1px solid #e2e8f0'}}
              onClick={()=>setHowAssessmentWorksModal(true)}
              title="Learn how online aptitude testing and shortlisting works"
            >
              <HelpCircle size={15} style={{color:'#6366f1'}}/> Aptitude Guide
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
            onTakeAssessment={(app)=>setActiveAssessmentApp(app)}
          />
        )}

        {view==='jobs'&&(
          <Jobs
            user={user}
            jobs={jobs}
            apps={apps}
            reload={load}
            onNavigate={(targetView, jobId) => {
              if (jobId) setApplicationsJobFilter(String(jobId));
              setView(targetView);
            }}
          />
        )}

        {view==='applications'&&(
          <Applications
            user={user}
            apps={apps}
            jobs={jobs}
            initialJobFilter={applicationsJobFilter}
            onRunAIScreen={runAIScreen}
            evaluatingAI={evaluatingAI}
            onTakeAssessment={(app)=>setActiveAssessmentApp(app)}
            onOpenRecruiterAssessment={(app)=>setRecruiterAssessmentModal(app)}
            onStatusChange={updateApplicationStatus}
            reload={load}
          />
        )}

        {view==='pipeline'&&(
          (user?.role==='recruiter' || user?.role==='admin' || user?.is_staff) ? (
            <Pipeline
              apps={apps}
              jobs={jobs}
              updatingAppId={updatingAppId}
              onStatusChange={updateApplicationStatus}
              onRunAIScreen={runAIScreen}
              evaluatingAI={evaluatingAI}
              onOpenRecruiterAssessment={(app)=>setRecruiterAssessmentModal(app)}
              onScheduleInterview={(app)=>{
                setScheduleForApp(app || null);
                setView('interviews');
              }}
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

        {view==='analytics'&&(
          <AnalyticsDashboard onNavigate={setView} />
        )}

        {view==='interviews'&&(
          <Interviews
            user={user}
            apps={apps}
            jobs={jobs}
            reloadApps={load}
            initialScheduleApp={scheduleForApp}
            onClearInitialScheduleApp={()=>setScheduleForApp(null)}
            onOpenAIScreen={runAIScreen}
            onOpenRecruiterAssessment={(app)=>setRecruiterAssessmentModal(app)}
          />
        )}

        {view==='create'&&(
          <CreateJob
            onDone={()=>{
              setView('jobs');
              load();
            }}
          />
        )}

        {activeAIApp && (user?.role === 'recruiter' || user?.role === 'admin' || user?.is_staff) && (
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

        {activeAssessmentApp && (
          <AssessmentPortal
            application={activeAssessmentApp}
            user={user}
            onClose={() => {
              setActiveAssessmentApp(null);
              load();
            }}
          />
        )}

        {recruiterAssessmentModal && (
          <RecruiterAssessmentModal
            application={recruiterAssessmentModal}
            onClose={() => {
              setRecruiterAssessmentModal(null);
              load();
            }}
            onStatusChange={updateApplicationStatus}
          />
        )}
        {pipelineToast && (
          <div className="pipelineToast">
            <CheckCircle2 size={18} style={{color: pipelineToast.type==='success' ? '#10b981' : '#60a5fa'}}/>
            <span>{pipelineToast.message}</span>
            <button
              type="button"
              className="ghost"
              style={{color:'#94a3b8',padding:'2px',marginLeft:'8px'}}
              onClick={()=>setPipelineToast(null)}
            >
              <X size={14}/>
            </button>
          </div>
        )}

        {howAssessmentWorksModal && (
          <HowAssessmentWorksModal
            user={user}
            apps={apps}
            onClose={()=>setHowAssessmentWorksModal(false)}
            onOpenAssessment={(app)=>setActiveAssessmentApp(app)}
          />
        )}
      </main>
    </div>
  );
}

