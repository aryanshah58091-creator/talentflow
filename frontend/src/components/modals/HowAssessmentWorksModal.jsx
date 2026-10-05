import React, { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, BriefcaseBusiness, Users, KanbanSquare, CalendarDays, Bell, LogOut, Plus, Search, ArrowUpRight, CheckCircle2, Building2, X, Clock, MapPin, DollarSign, Send, Sparkles, ChevronRight, Filter, Compass, FileText, Award, Brain, AlertTriangle, ShieldCheck, Check, RotateCcw, HelpCircle, Video, Calendar, Star, MessageSquare, ExternalLink, CalendarPlus, Copy, CheckCheck, BarChart3, TrendingUp, UploadCloud, Download } from 'lucide-react';
import { api, uploadResumeFile } from '../../api';

export default function HowAssessmentWorksModal({ onClose, user, apps, onOpenAssessment }) {
  const pendingApp = apps?.find(a => a.status === 'shortlisted' && (!a.assessment_info || a.assessment_info.status !== 'completed'));

  return (
    <div className="modalBackdrop">
      <div className="modal" style={{maxWidth:'680px',padding:'0',overflow:'hidden',borderRadius:'20px'}}>
        <div style={{
          background: 'linear-gradient(135deg, #312e81 0%, #4338ca 50%, #6366f1 100%)',
          color: '#fff',
          padding: '24px 28px',
          position: 'relative'
        }}>
          <button
            type="button"
            className="ghost"
            style={{position:'absolute',top:'18px',right:'18px',color:'#fff',padding:'4px'}}
            onClick={onClose}
          >
            <X size={20}/>
          </button>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}}>
            <span className="pill" style={{background:'rgba(255,255,255,0.2)',color:'#fff',borderColor:'rgba(255,255,255,0.3)',fontSize:'11.5px'}}>
              <Brain size={13}/> STEP-BY-STEP RECRUITMENT GUIDE
            </span>
          </div>
          <h2 style={{margin:'0 0 6px',fontSize:'22px',color:'#fff'}}>
            How Online Aptitude Assessments Work
          </h2>
          <p style={{margin:0,fontSize:'13.5px',color:'#c7d2fe',maxWidth:'560px',lineHeight:'1.5'}}>
            Standardized, automated skills testing that bridges shortlisting and technical interviews.
          </p>
        </div>

        <div style={{padding:'24px 28px',maxHeight:'70vh',overflowY:'auto'}}>
          <div style={{display:'flex',flexDirection:'column',gap:'18px'}}>
            <div style={{display:'flex',gap:'14px',alignItems:'flex-start'}}>
              <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'#ede9fe',color:'#7c3aed',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'15px',flexShrink:0}}>
                1
              </div>
              <div>
                <b style={{fontSize:'15px',color:'#0f172a',display:'block',marginBottom:'3px'}}>
                  1. Shortlisting & Assessment Trigger
                </b>
                <p style={{margin:0,fontSize:'13px',color:'#475569',lineHeight:'1.5'}}>
                  When a candidate applies, their resume is scored by the AI ATS engine. Once the candidate is moved to the <b>Shortlisted</b> stage (either via recruiter Kanban dropdown or the 1-click ATS Auto-Shortlist button), the aptitude test is instantly generated and unlocked for them.
                </p>
              </div>
            </div>

            <div style={{display:'flex',gap:'14px',alignItems:'flex-start'}}>
              <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'#ede9fe',color:'#7c3aed',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'15px',flexShrink:0}}>
                2
              </div>
              <div>
                <b style={{fontSize:'15px',color:'#0f172a',display:'block',marginBottom:'3px'}}>
                  2. Candidate Notifications & Dashboard Alert
                </b>
                <p style={{margin:0,fontSize:'13px',color:'#475569',lineHeight:'1.5'}}>
                  Candidates are alerted in 3 clear ways:
                  <br/>• <b>Top Navbar Bell Icon:</b> A red badge appears with an "Aptitude Assessment Unlocked" notification and direct test link.
                  <br/>• <b>Dashboard Action Banner:</b> A prominent hero banner announces their shortlist and includes a <b>"Start Assessment Now"</b> button.
                  <br/>• <b>My Applications:</b> The application status row displays a highlighted <b>"Take Aptitude Test (15 min)"</b> button.
                </p>
              </div>
            </div>

            <div style={{display:'flex',gap:'14px',alignItems:'flex-start'}}>
              <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'#ede9fe',color:'#7c3aed',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'15px',flexShrink:0}}>
                3
              </div>
              <div>
                <b style={{fontSize:'15px',color:'#0f172a',display:'block',marginBottom:'3px'}}>
                  3. Online Assessment Environment
                </b>
                <p style={{margin:0,fontSize:'13px',color:'#475569',lineHeight:'1.5'}}>
                  The candidate completes a 15-minute timed exam with 10 questions covering:
                  <br/>• <b>Quantitative Problem Solving</b> (numerical analysis, proportions, percentages)
                  <br/>• <b>Logical Reasoning</b> (deductive logic, sequences, pattern analysis)
                  <br/>• <b>Role Fundamentals</b> (domain engineering, cloud, database, architecture concepts)
                  <br/>Built-in anti-cheat detection logs any background window switches.
                </p>
              </div>
            </div>

            <div style={{display:'flex',gap:'14px',alignItems:'flex-start'}}>
              <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'#ede9fe',color:'#7c3aed',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'15px',flexShrink:0}}>
                4
              </div>
              <div>
                <b style={{fontSize:'15px',color:'#0f172a',display:'block',marginBottom:'3px'}}>
                  4. Automated Scoring & Recruiter Review
                </b>
                <p style={{margin:0,fontSize:'13px',color:'#475569',lineHeight:'1.5'}}>
                  Upon submission, scores are calculated instantly. Passing score is <b>70%+</b>. Recruiters can click the <b>Aptitude: XX%</b> badge on the candidate card in Kanban to view full category breakdowns, question responses, and proctoring logs, then advance them to Interview with one click.
                </p>
              </div>
            </div>
          </div>

          <div style={{marginTop:'24px',padding:'16px 20px',borderRadius:'12px',background:'#f8fafc',border:'1px solid #e2e8f0',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px'}}>
            {user?.role === 'candidate' && pendingApp ? (
              <>
                <div>
                  <b style={{fontSize:'13.5px',color:'#1e293b'}}>You have 1 pending assessment</b>
                  <p style={{margin:0,fontSize:'12px',color:'#64748b'}}>{pendingApp.job_title}</p>
                </div>
                <button
                  type="button"
                  className="primary"
                  style={{padding:'9px 18px',fontSize:'13px',display:'inline-flex',alignItems:'center',gap:'6px'}}
                  onClick={() => {
                    onClose();
                    onOpenAssessment(pendingApp);
                  }}
                >
                  <Brain size={15}/> Start Your Test Now
                </button>
              </>
            ) : (
              <>
                <div>
                  <b style={{fontSize:'13.5px',color:'#1e293b'}}>Recruiter Quick Action</b>
                  <p style={{margin:0,fontSize:'12px',color:'#64748b'}}>Move any candidate to "Shortlisted" in Kanban or Applications to invite them.</p>
                </div>
                <button
                  type="button"
                  className="primary"
                  style={{padding:'9px 18px',fontSize:'13px'}}
                  onClick={onClose}
                >
                  Close Guide
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getGoogleCalendarUrl(interview) {
  try {
    const startDate = new Date(interview.interview_time);
    const endDate = new Date(startDate.getTime() + 45 * 60 * 1000);
    const formatGCal = (d) => d.toISOString().replace(/-|:|\.\d+/g, '');
    const startStr = formatGCal(startDate);
    const endStr = formatGCal(endDate);
    const title = `Interview: ${interview.round} (${interview.job_title || 'Role'})`;
    const details = `TalentFlow Interview Session\nCandidate: ${interview.candidate_name || 'Candidate'}\nRole: ${interview.job_title || 'Job Opening'}\nRound: ${interview.round}\nMeeting Link: ${interview.meeting_link || 'Online'}\nOrganized via TalentFlow ATS`;
    const location = interview.meeting_link || interview.mode || 'Online Video';
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
  } catch (e) {
    return '#';
  }
}

function downloadIcsFile(interview) {
  try {
    const startDate = new Date(interview.interview_time);
    const endDate = new Date(startDate.getTime() + 45 * 60 * 1000);
    const formatIcs = (d) => d.toISOString().replace(/-|:|\.\d+/g, '');
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TalentFlow//ATS Interview System//EN',
      'BEGIN:VEVENT',
      `UID:${interview.id}-${Date.now()}@talentflow.local`,
      `DTSTAMP:${formatIcs(new Date())}`,
      `DTSTART:${formatIcs(startDate)}`,
      `DTEND:${formatIcs(endDate)}`,
      `SUMMARY:Interview: ${interview.round} - ${interview.job_title || 'TalentFlow'}`,
      `DESCRIPTION:Interview with ${interview.candidate_name || 'Candidate'}\\nMeeting Link: ${interview.meeting_link || 'Online'}`,
      `LOCATION:${interview.meeting_link || interview.mode || 'Online'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `interview-${(interview.round || 'session').toLowerCase().replace(/[^a-z0-9]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    console.error('ICS export error:', e);
  }
}

function formatRelativeInterviewTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const isSameDay = date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear();

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isSameDay) {
    if (diffMs > 0) {
      const mins = Math.max(1, Math.round(diffMs / (1000 * 60)));
      return mins < 60 ? `Starts in ${mins}m (${timeStr})` : `Today at ${timeStr}`;
    }
    return `Today at ${timeStr}`;
  }
  if (isTomorrow) {
    return `Tomorrow at ${timeStr}`;
  }
  if (diffMs > 0 && diffDays <= 7) {
    const dayName = date.toLocaleDateString([], { weekday: 'short' });
    return `${dayName} at ${timeStr} (in ${diffDays}d)`;
  }
  if (diffMs < 0) {
    return `Past (${date.toLocaleDateString([], { month: 'short', day: 'numeric' })})`;
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + ` at ${timeStr}`;
}

