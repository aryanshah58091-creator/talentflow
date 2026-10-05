import React, { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, BriefcaseBusiness, Users, KanbanSquare, CalendarDays, Bell, LogOut, Plus, Search, ArrowUpRight, CheckCircle2, Building2, X, Clock, MapPin, DollarSign, Send, Sparkles, ChevronRight, Filter, Compass, FileText, Award, Brain, AlertTriangle, ShieldCheck, Check, RotateCcw, HelpCircle, Video, Calendar, Star, MessageSquare, ExternalLink, CalendarPlus, Copy, CheckCheck, BarChart3, TrendingUp, UploadCloud, Download } from 'lucide-react';
import { api, uploadResumeFile } from '../api';
import Stat from '../components/common/Stat';
import Empty from '../components/common/Empty';

export default function Dashboard({user,jobs,apps,onTakeAssessment}){
  const isRecruiter = user.role==='recruiter';
  const pendingShortlistedApp = !isRecruiter && apps.find(a => a.status === 'shortlisted' && (!a.assessment_info || a.assessment_info.status !== 'completed'));

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

      {pendingShortlistedApp && (
        <div className="shortlistAptitudeBanner">
          <div>
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
              <span className="pill" style={{background:'rgba(255,255,255,0.2)',color:'#fff',borderColor:'rgba(255,255,255,0.3)',fontSize:'11.5px'}}>
                <Brain size={12}/> ACTION REQUIRED
              </span>
              <span style={{fontSize:'12.5px',fontWeight:600,color:'#e0e7ff'}}>Aptitude Assessment Unlocked</span>
            </div>
            <h3 style={{margin:'0 0 6px',fontSize:'19px',color:'#fff'}}>
              Congratulations! You are shortlisted for {pendingShortlistedApp.job_title}
            </h3>
            <p style={{margin:0,fontSize:'13px',color:'#c7d2fe',maxWidth:'650px'}}>
              Take the 15-minute Online Aptitude & Technical Skills Test to qualify for your interview rounds.
            </p>
          </div>
          <button
            type="button"
            className="primary"
            style={{background:'#fff',color:'#4f46e5',fontWeight:700,padding:'12px 22px',borderRadius:'12px',whiteSpace:'nowrap',boxShadow:'0 4px 14px rgba(0,0,0,0.15)',display:'inline-flex',alignItems:'center',gap:'8px'}}
            onClick={()=>onTakeAssessment && onTakeAssessment(pendingShortlistedApp)}
          >
            <Brain size={16}/> Start Assessment Now
          </button>
        </div>
      )}

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
            <h3>{isRecruiter ? 'Hiring Funnel Progression' : 'My Application Journey'}</h3>
            <span>{isRecruiter ? 'Recruitment Funnel' : 'Active Applications'}</span>
          </div>

          {isRecruiter ? (
            [
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
            })
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'10px',padding:'4px 0'}}>
              {apps.length === 0 ? (
                <div style={{padding:'36px 10px',textAlign:'center',color:'#64748b'}}>
                  <p style={{margin:0,fontSize:'13.5px',fontWeight:600}}>No active job applications</p>
                  <p style={{margin:'4px 0 0',fontSize:'12.5px',color:'#94a3b8'}}>Explore open positions and submit your resume in 1-click.</p>
                </div>
              ) : (
                apps.map(a => (
                  <div key={a.id} style={{padding:'12px 14px',borderRadius:'10px',background:'#f8fafc',border:'1px solid #e2e8f0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div>
                      <b style={{fontSize:'13.5px',color:'#0f172a',display:'block'}}>{a.job_title}</b>
                      <small style={{color:'#64748b'}}>Applied on {a.applied_at ? new Date(a.applied_at).toLocaleDateString() : 'recently'}</small>
                    </div>
                    <span className={`status ${a.status}`}>
                      {a.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="card">
          <div className="cardHead">
            <h3>{isRecruiter ? 'Recent Candidate Applicants' : 'Recent Submissions & Updates'}</h3>
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
            <Empty text={isRecruiter ? 'No candidate applications recorded yet.' : 'You have not submitted any applications yet.'}/>
          )}
        </div>
      </div>
    </>
  );
}

