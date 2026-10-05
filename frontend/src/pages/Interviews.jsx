import React, { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, BriefcaseBusiness, Users, KanbanSquare, CalendarDays, Bell, LogOut, Plus, Search, ArrowUpRight, CheckCircle2, Building2, X, Clock, MapPin, DollarSign, Send, Sparkles, ChevronRight, Filter, Compass, FileText, Award, Brain, AlertTriangle, ShieldCheck, Check, RotateCcw, HelpCircle, Video, Calendar, Star, MessageSquare, ExternalLink, CalendarPlus, Copy, CheckCheck, BarChart3, TrendingUp, UploadCloud, Download } from 'lucide-react';
import { api, uploadResumeFile } from '../api';
import ScheduleInterviewModal from '../components/modals/ScheduleInterviewModal';
import ScorecardModal from '../components/modals/ScorecardModal';
import AIQuestionsModal from '../components/modals/AIQuestionsModal';

export default function Interviews({ user, apps, jobs, reloadApps, initialScheduleApp, onClearInitialScheduleApp, onOpenAIScreen, onOpenRecruiterAssessment }) {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, upcoming, today, completed, cancelled
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleAppId, setScheduleAppId] = useState(null);
  const [activeFeedbackInterview, setActiveFeedbackInterview] = useState(null);
  const [activeAIQuestionsInterview, setActiveAIQuestionsInterview] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (initialScheduleApp) {
      setScheduleAppId(initialScheduleApp.id);
      setShowScheduleModal(true);
      if (onClearInitialScheduleApp) onClearInitialScheduleApp();
    }
  }, [initialScheduleApp]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadInterviews = async () => {
    setLoading(true);
    try {
      setError('');
      const data = await api('/applications/interviews/');
      setInterviews(data.results || data || []);
    } catch (e) {
      setError(e.message || 'Failed to load interviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, []);

  const handleUpdateStatus = async (interviewId, newStatus) => {
    try {
      await api(`/applications/interviews/${interviewId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      showToast(`Interview marked as ${newStatus.toUpperCase()}.`, 'success');
      loadInterviews();
      if (reloadApps) reloadApps();
    } catch (e) {
      alert('Status update failed: ' + e.message);
    }
  };

  const copyMeetingLink = (id, link) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filter & Search Logic
  const filteredInterviews = interviews.filter(item => {
    const q = search.toLowerCase();
    const matchesSearch = !q || (
      (item.candidate_name && item.candidate_name.toLowerCase().includes(q)) ||
      (item.job_title && item.job_title.toLowerCase().includes(q)) ||
      (item.round && item.round.toLowerCase().includes(q)) ||
      (item.company_name && item.company_name.toLowerCase().includes(q))
    );

    if (!matchesSearch) return false;

    const interviewDate = new Date(item.interview_time);
    const now = new Date();
    const isTodayDate = interviewDate.getDate() === now.getDate() &&
      interviewDate.getMonth() === now.getMonth() &&
      interviewDate.getFullYear() === now.getFullYear();

    if (filter === 'upcoming') {
      return item.status === 'scheduled' && interviewDate >= now;
    }
    if (filter === 'today') {
      return isTodayDate;
    }
    if (filter === 'completed') {
      return item.status === 'completed';
    }
    if (filter === 'cancelled') {
      return item.status === 'cancelled';
    }
    return true;
  });

  const now = new Date();
  const upcomingCount = interviews.filter(i => i.status === 'scheduled' && new Date(i.interview_time) >= now).length;
  const todayCount = interviews.filter(i => {
    const d = new Date(i.interview_time);
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const completedCount = interviews.filter(i => i.status === 'completed').length;
  const avgMatch = apps && apps.length > 0
    ? Math.round(apps.filter(a => a.match_score).reduce((acc, a) => acc + a.match_score, 0) / Math.max(1, apps.filter(a => a.match_score).length))
    : 84;

  return (
    <div style={{animation:'tfFadeIn 0.3s ease'}}>
      {toast && (
        <div className="pipelineToast">
          <Sparkles size={16} color="#38bdf8"/>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="interviewHubHeader">
        <div>
          <div className="eyebrow" style={{display:'inline-flex',alignItems:'center',gap:'6px',color:'#4f46e5',marginBottom:'6px'}}>
            <CalendarDays size={13}/>
            <span>{user?.role === 'recruiter' ? 'INTERVIEW ORCHESTRATOR & SCORECARDS' : 'MY SCHEDULED INTERVIEWS'}</span>
          </div>
          <h2 className="interviewHubTitle">
            {user?.role === 'recruiter' ? 'Interview Schedules & Candidate Evaluations' : 'Your Upcoming Interviews & Meeting Links'}
          </h2>
          <p className="muted" style={{margin:0,fontSize:'13.5px',color:'#64748b'}}>
            {user?.role === 'recruiter'
              ? 'Organize multi-round technical screens, track live scorecards, and review candidate AI dossiers.'
              : 'Join upcoming video meetings directly, synchronize with Google Calendar, and review round preparations.'}
          </p>
        </div>

        {user?.role === 'recruiter' && (
          <button
            type="button"
            className="primary"
            onClick={() => setShowScheduleModal(true)}
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
            <CalendarPlus size={16}/> Schedule New Interview
          </button>
        )}
      </div>

      {/* Summary Stats Grid */}
      <div className="interviewStatsGrid">
        <div className="interviewStatCard">
          <div className="interviewStatIcon" style={{background:'#ede9fe',color:'#7c3aed'}}>
            <CalendarDays size={22}/>
          </div>
          <div>
            <div style={{fontSize:'12px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.5px'}}>
              Total Scheduled
            </div>
            <div style={{fontSize:'22px',fontWeight:800,color:'#0f172a',marginTop:'2px'}}>
              {interviews.length}
            </div>
          </div>
        </div>

        <div className="interviewStatCard">
          <div className="interviewStatIcon" style={{background:'#dbeafe',color:'#2563eb'}}>
            <Clock size={22}/>
          </div>
          <div>
            <div style={{fontSize:'12px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.5px'}}>
              Upcoming Calls
            </div>
            <div style={{fontSize:'22px',fontWeight:800,color:'#0f172a',marginTop:'2px'}}>
              {upcomingCount}
            </div>
          </div>
        </div>

        <div className="interviewStatCard">
          <div className="interviewStatIcon" style={{background: todayCount > 0 ? '#fef3c7' : '#f1f5f9', color: todayCount > 0 ? '#d97706' : '#64748b'}}>
            <Video size={22}/>
          </div>
          <div>
            <div style={{fontSize:'12px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.5px'}}>
              Today's Sessions
            </div>
            <div style={{fontSize:'22px',fontWeight:800,color:'#0f172a',marginTop:'2px'}}>
              {todayCount}
            </div>
          </div>
        </div>

        <div className="interviewStatCard">
          <div className="interviewStatIcon" style={{background:'#dcfce7',color:'#16a34a'}}>
            <CheckCircle2 size={22}/>
          </div>
          <div>
            <div style={{fontSize:'12px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.5px'}}>
              {user?.role === 'recruiter' ? 'Completed & Scored' : 'Completed Rounds'}
            </div>
            <div style={{fontSize:'22px',fontWeight:800,color:'#0f172a',marginTop:'2px'}}>
              {completedCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="interviewFilterBar">
        <div className="interviewTabs">
          {(user?.role === 'recruiter' ? [
            ['all', `All (${interviews.length})`],
            ['upcoming', `Upcoming (${upcomingCount})`],
            ['today', `Today (${todayCount})`],
            ['completed', `Completed (${completedCount})`],
            ['cancelled', `Cancelled (${interviews.filter(i=>i.status==='cancelled').length})`]
          ] : [
            ['all', `All (${interviews.length})`],
            ['upcoming', `Upcoming (${upcomingCount})`],
            ['today', `Today (${todayCount})`],
            ['completed', `Completed (${completedCount})`]
          ]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`interviewTabBtn ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{display:'flex',alignItems:'center',gap:'8px',flex:1,maxWidth:'320px',minWidth:'220px'}}>
          <div style={{position:'relative',width:'100%'}}>
            <Search size={15} style={{position:'absolute',left:'11px',top:'50%',transform:'translateY(-50%)',color:'#94a3b8'}}/>
            <input
              type="text"
              placeholder={user?.role === 'recruiter' ? "Search candidate, role, or round..." : "Search role, company, or round..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width:'100%',
                padding:'8px 12px 8px 32px',
                borderRadius:'10px',
                border:'1.5px solid #cbd5e1',
                fontSize:'12.5px',
                outline:'none'
              }}
            />
            {search && (
              <button
                type="button"
                className="ghost"
                onClick={() => setSearch('')}
                style={{position:'absolute',right:'6px',top:'50%',transform:'translateY(-50%)',padding:'2px',color:'#94a3b8'}}
              >
                <X size={14}/>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div style={{background:'#fee2e2',color:'#b91c1c',padding:'14px 18px',borderRadius:'12px',marginBottom:'20px',fontSize:'13.5px'}}>
          <b>Error loading interviews:</b> {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{padding:'60px 20px',textAlign:'center',color:'#64748b'}}>
          <div className="spinner" style={{margin:'0 auto 16px'}}/>
          <div>Loading interview schedules...</div>
        </div>
      ) : filteredInterviews.length === 0 ? (
        /* Empty State */
        <div className="card emptyLarge" style={{maxWidth:'620px',margin:'40px auto',padding:'50px 32px',textAlign:'center'}}>
          <div className="statIcon" style={{width:'64px',height:'64px',margin:'0 auto 16px',borderRadius:'16px',background:'#eff6ff',color:'#3b82f6'}}>
            <CalendarDays size={32}/>
          </div>
          <h3 style={{fontSize:'20px',marginBottom:'6px',color:'#0f172a'}}>No interviews found</h3>
          <p style={{maxWidth:'420px',margin:'0 auto 20px',color:'#64748b',fontSize:'13.5px',lineHeight:'1.5'}}>
            {filter !== 'all'
              ? `There are no interviews matching the "${filter}" filter.`
              : user?.role === 'recruiter'
                ? 'No interviews have been scheduled yet. You can invite shortlisted candidates to a technical or HR round in seconds.'
                : 'You have no scheduled interviews at this time. Once a recruiter schedules a session, it will appear here with a direct video meeting link.'}
          </p>
          {user?.role === 'recruiter' && filter === 'all' && (
            <button
              type="button"
              className="primary"
              onClick={() => setShowScheduleModal(true)}
              style={{padding:'10px 22px',fontSize:'13.5px'}}
            >
              <CalendarPlus size={16}/> Schedule Your First Interview
            </button>
          )}
        </div>
      ) : (
        /* Interviews Grid */
        <div className="interviewGrid">
          {filteredInterviews.map(item => {
            const isCompleted = item.status === 'completed';
            const isCancelled = item.status === 'cancelled';
            const isScheduled = item.status === 'scheduled';
            const googleCalUrl = getGoogleCalendarUrl(item);
            const hasMeetingLink = Boolean(item.meeting_link && item.meeting_link.startsWith('http'));
            const relativeTime = formatRelativeInterviewTime(item.interview_time);
            const dateObj = new Date(item.interview_time);

            // Calculate feedback average rating
            const feedbackList = item.feedback_entries || [];
            const avgRating = feedbackList.length > 0
              ? Math.round(feedbackList.reduce((acc, f) => acc + (f.rating || 0), 0) / feedbackList.length)
              : 0;

            // Find matching application if available
            const matchedApp = apps?.find(a => a.id === item.application || (item.candidate_id && a.candidate === item.candidate_id));

            return (
              <div key={item.id} className={`interviewCard ${item.status}`}>
                {/* Top Row: Round Pill & Status */}
                <div>
                  <div className="interviewCardHeader">
                    <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                      <span className="interviewRoundPill">
                        <Sparkles size={11}/> {item.round}
                      </span>
                      <span className={`interviewStatusBadge ${item.status}`}>
                        {item.status}
                      </span>
                    </div>

                    <div style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: isCompleted ? '#059669' : isCancelled ? '#e11d48' : '#4f46e5',
                      background: isCompleted ? '#ecfdf5' : isCancelled ? '#fff1f2' : '#f5f3ff',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      whiteSpace: 'nowrap'
                    }}>
                      <Clock size={11} style={{display:'inline',marginRight:'4px',verticalAlign:'-1px'}}/>
                      {relativeTime}
                    </div>
                  </div>

                  {/* Candidate & Role Row */}
                  <div className="interviewCandidateRow" style={{marginTop:'14px'}}>
                    <div className="avatar" style={{
                      width:'44px',
                      height:'44px',
                      borderRadius:'12px',
                      background: user?.role === 'recruiter'
                        ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                        : 'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)',
                      color:'#fff',
                      fontSize:'17px',
                      fontWeight:800,
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center',
                      flexShrink: 0
                    }}>
                      {user?.role === 'recruiter'
                        ? (item.candidate_name || item.candidate_username || 'C')[0].toUpperCase()
                        : (item.company_name || item.job_title || 'T')[0].toUpperCase()}
                    </div>

                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'6px'}}>
                        <b style={{fontSize:'16px',color:'#0f172a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {user?.role === 'recruiter'
                            ? (item.candidate_name || item.candidate_username || 'Candidate')
                            : (item.job_title || 'Interview Round')}
                        </b>
                      </div>
                      <div style={{fontSize:'13px',color:'#475569',fontWeight:600,display:'flex',alignItems:'center',gap:'4px'}}>
                        <BriefcaseBusiness size={13} style={{color:'#64748b',flexShrink:0}}/>
                        <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {user?.role === 'recruiter'
                            ? `${item.job_title || 'Role'} • ${item.company_name || 'TalentFlow'}`
                            : `${item.company_name || 'TalentFlow'} • Round: ${item.round}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badges Bar: Match score, Aptitude, Mode */}
                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'12px',flexWrap:'wrap'}}>
                    {user?.role === 'recruiter' && item.match_score && (
                      <span className="pill" style={{background:'#eff6ff',color:'#1d4ed8',borderColor:'#bfdbfe',fontSize:'11px',padding:'2px 8px'}}>
                        <Sparkles size={11}/> {item.match_score}% ATS Resume Match
                      </span>
                    )}

                    {item.assessment_score && (
                      <span className="pill" style={{
                        background: item.assessment_score.passed ? '#ecfdf5' : '#fffbeb',
                        color: item.assessment_score.passed ? '#059669' : '#d97706',
                        borderColor: item.assessment_score.passed ? '#a7f3d0' : '#fde68a',
                        fontSize: '11px',
                        padding: '2px 8px'
                      }}>
                        <Award size={11}/> Aptitude: {item.assessment_score.score_percentage}% ({item.assessment_score.passed ? 'Passed' : 'Review'})
                      </span>
                    )}

                    <span className="pill" style={{background:'#f8fafc',color:'#475569',borderColor:'#e2e8f0',fontSize:'11px',padding:'2px 8px'}}>
                      <Video size={11}/> {item.mode || 'Online Video'}
                    </span>
                  </div>

                  {/* Scheduled Date/Time display */}
                  <div style={{
                    marginTop:'12px',
                    padding:'10px 14px',
                    background:'#f8fafc',
                    border:'1px solid #e2e8f0',
                    borderRadius:'10px',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'space-between',
                    fontSize:'12.5px',
                    color:'#334155'
                  }}>
                    <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                      <Calendar size={14} style={{color:'#6366f1'}}/>
                      <b>{dateObj.toLocaleDateString([], { weekday:'short', month:'short', day:'numeric', year:'numeric' })}</b>
                      <span style={{color:'#94a3b8'}}>•</span>
                      <span>{dateObj.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>
                    </div>

                    {/* Google Calendar Link */}
                    <a
                      href={googleCalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Add to Google Calendar"
                      style={{
                        color:'#4f46e5',
                        fontWeight:700,
                        fontSize:'11.5px',
                        display:'inline-flex',
                        alignItems:'center',
                        gap:'4px',
                        textDecoration:'none'
                      }}
                    >
                      <CalendarPlus size={13}/> + Google Cal
                    </a>
                  </div>

                  {/* Meeting link box */}
                  <div className="interviewMeetingBox" style={{marginTop:'10px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',flex:1,minWidth:0}}>
                      <div style={{width:'28px',height:'28px',borderRadius:'8px',background:hasMeetingLink?'#dbeafe':'#f1f5f9',color:hasMeetingLink?'#2563eb':'#94a3b8',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <Video size={15}/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:'10.5px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.4px'}}>
                          Meeting Coordinates
                        </div>
                        <div style={{fontSize:'12px',color:hasMeetingLink?'#1e293b':'#94a3b8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {hasMeetingLink ? item.meeting_link : 'No link provided yet (In-Person / Phone)'}
                        </div>
                      </div>
                    </div>

                    {hasMeetingLink && (
                      <button
                        type="button"
                        className="ghost"
                        style={{padding:'4px 8px',fontSize:'11px',display:'inline-flex',alignItems:'center',gap:'4px'}}
                        onClick={() => copyMeetingLink(item.id, item.meeting_link)}
                        title="Copy meeting link to clipboard"
                      >
                        {copiedId === item.id ? <CheckCheck size={12} color="#16a34a"/> : <Copy size={12}/>}
                        <span>{copiedId === item.id ? 'Copied!' : 'Copy'}</span>
                      </button>
                    )}
                  </div>

                  {/* Feedback preview if already scored (strictly for recruiter) */}
                  {user?.role === 'recruiter' && feedbackList.length > 0 && (
                    <div style={{
                      marginTop:'10px',
                      padding:'10px 14px',
                      background:'#ecfdf5',
                      border:'1px solid #a7f3d0',
                      borderRadius:'10px'
                    }}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px'}}>
                        <span style={{fontSize:'11.5px',fontWeight:700,color:'#065f46',display:'inline-flex',alignItems:'center',gap:'4px'}}>
                          <CheckCircle2 size={12}/> Evaluator Feedback Recorded
                        </span>
                        <span style={{color:'#f59e0b',fontSize:'13px',fontWeight:700}}>
                          {'★'.repeat(avgRating)}{'☆'.repeat(5 - avgRating)} ({avgRating}/5)
                        </span>
                      </div>
                      {feedbackList[0]?.comments && (
                        <p style={{margin:0,fontSize:'12px',color:'#047857',lineHeight:'1.4',fontStyle:'italic'}}>
                          "{feedbackList[0].comments.length > 120 ? feedbackList[0].comments.slice(0, 120) + '...' : feedbackList[0].comments}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Candidate preparation guidance */}
                  {user?.role === 'candidate' && isScheduled && (
                    <div style={{
                      marginTop:'10px',
                      padding:'8px 12px',
                      background:'#f0fdf4',
                      border:'1px solid #bbf7d0',
                      borderRadius:'8px',
                      fontSize:'12px',
                      color:'#166534',
                      display:'flex',
                      alignItems:'center',
                      gap:'8px'
                    }}>
                      <Sparkles size={13} style={{flexShrink:0,color:'#16a34a'}}/>
                      <span>Please test your microphone & camera 5 minutes prior to the scheduled start time.</span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions Bar */}
                <div className="interviewActionBar">
                  <div style={{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap'}}>
                    {/* 1-Click Join Call Button */}
                    <a
                      href={hasMeetingLink ? item.meeting_link : '#'}
                      target={hasMeetingLink ? '_blank' : '_self'}
                      rel="noopener noreferrer"
                      className="primary"
                      onClick={e => {
                        if (!hasMeetingLink) {
                          e.preventDefault();
                          alert('No video meeting link has been specified for this interview.');
                        }
                      }}
                      style={{
                        padding: '7px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        textDecoration: 'none',
                        background: hasMeetingLink ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' : '#94a3b8',
                        cursor: hasMeetingLink ? 'pointer' : 'not-allowed',
                        borderRadius: '8px'
                      }}
                    >
                      <Video size={14}/> Join Video Call
                    </a>

                    {/* Download .ics file */}
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => downloadIcsFile(item)}
                      title="Download .ics Calendar Invite"
                      style={{padding:'6px 10px',fontSize:'11.5px',borderRadius:'8px',border:'1px solid #cbd5e1'}}
                    >
                      <Calendar size={13}/> .ics
                    </button>
                  </div>

                  {/* Recruiter Controls: AI Questions, Scorecard & Status */}
                  {user?.role === 'recruiter' && (
                    <div style={{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap'}}>
                      {/* AI Questions Bank Button (Recruiter Only) */}
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => setActiveAIQuestionsInterview(item)}
                        title="View AI tailored interview questions for this candidate"
                        style={{
                          padding: '6px 11px',
                          fontSize: '11.5px',
                          borderRadius: '8px',
                          border: '1px solid #c7d2fe',
                          background: '#f5f3ff',
                          color: '#6366f1',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <Brain size={13}/> AI Questions
                      </button>
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => setActiveFeedbackInterview(item)}
                        style={{
                          padding: '6px 11px',
                          fontSize: '11.5px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          background: isCompleted ? '#f0fdf4' : '#fffbeb',
                          color: isCompleted ? '#15803d' : '#b45309',
                          border: `1px solid ${isCompleted ? '#bbf7d0' : '#fde68a'}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Star size={13}/> {feedbackList.length > 0 ? 'Edit Scorecard' : 'Fill Scorecard'}
                      </button>

                      <select
                        value={item.status}
                        onChange={e => handleUpdateStatus(item.id, e.target.value)}
                        style={{
                          padding: '5px 8px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#334155',
                          background: '#ffffff',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <ScheduleInterviewModal
          apps={apps}
          initialAppId={scheduleAppId}
          onClose={() => {
            setShowScheduleModal(false);
            setScheduleAppId(null);
          }}
          onScheduled={() => {
            setShowScheduleModal(false);
            setScheduleAppId(null);
            showToast('Interview scheduled successfully! Candidate has been notified.', 'success');
            loadInterviews();
            if (reloadApps) reloadApps();
          }}
        />
      )}

      {/* Recruiter Scorecard Modal */}
      {activeFeedbackInterview && (
        <ScorecardModal
          interview={activeFeedbackInterview}
          onClose={() => setActiveFeedbackInterview(null)}
          onSubmitted={() => {
            setActiveFeedbackInterview(null);
            showToast('Scorecard submitted and saved to interview history!', 'success');
            loadInterviews();
          }}
        />
      )}

      {/* AI Tailored Interview Questions Modal */}
      {activeAIQuestionsInterview && (
        <AIQuestionsModal
          interview={activeAIQuestionsInterview}
          onClose={() => setActiveAIQuestionsInterview(null)}
          onQuestionsUpdated={(updatedQuestions) => {
            setActiveAIQuestionsInterview(prev => prev ? { ...prev, ai_interview_questions: updatedQuestions } : null);
            setInterviews(prev => prev.map(inv => inv.id === activeAIQuestionsInterview.id ? { ...inv, ai_interview_questions: updatedQuestions } : inv));
          }}
        />
      )}
    </div>
  );
}


