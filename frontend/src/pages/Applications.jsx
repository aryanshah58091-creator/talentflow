import React, { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, BriefcaseBusiness, Users, KanbanSquare, CalendarDays, Bell, LogOut, Plus, Search, ArrowUpRight, CheckCircle2, Building2, X, Clock, MapPin, DollarSign, Send, Sparkles, ChevronRight, Filter, Compass, FileText, Award, Brain, AlertTriangle, ShieldCheck, Check, RotateCcw, HelpCircle, Video, Calendar, Star, MessageSquare, ExternalLink, CalendarPlus, Copy, CheckCheck, BarChart3, TrendingUp, UploadCloud, Download } from 'lucide-react';
import { api, uploadResumeFile } from '../api';
import Stat from '../components/common/Stat';
import Empty from '../components/common/Empty';

export default function Applications({user,apps,jobs=[],initialJobFilter='all',onRunAIScreen,evaluatingAI,onTakeAssessment,onOpenRecruiterAssessment,onStatusChange,reload}){
  const [filterJobId, setFilterJobId] = useState(initialJobFilter || 'all');
  const [filterStage, setFilterStage] = useState('all');

  useEffect(() => {
    if (initialJobFilter) setFilterJobId(initialJobFilter);
  }, [initialJobFilter]);
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
              <th>Online Aptitude</th>
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
                  <td>
                    {a.status === 'shortlisted' ? (
                      a.assessment_info?.status === 'completed' ? (
                        <button
                          type="button"
                          className="ghost"
                          style={{
                            padding:'5px 10px',
                            fontSize:'12px',
                            borderRadius:'8px',
                            background: a.assessment_info.passed ? '#ecfdf5' : '#fffbeb',
                            color: a.assessment_info.passed ? '#059669' : '#d97706',
                            border: `1px solid ${a.assessment_info.passed ? '#a7f3d0' : '#fde68a'}`,
                            display:'inline-flex',
                            alignItems:'center',
                            gap:'5px',
                            fontWeight:600,
                            cursor:'pointer'
                          }}
                          onClick={()=>onTakeAssessment && onTakeAssessment(a)}
                          title="View your assessment scorecard & solutions"
                        >
                          <Award size={13}/>
                          {a.assessment_info.score_percentage}% ({a.assessment_info.passed ? 'Passed' : 'Review'})
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="primary"
                          style={{
                            padding:'6px 14px',
                            fontSize:'12px',
                            borderRadius:'8px',
                            background:'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            display:'inline-flex',
                            alignItems:'center',
                            gap:'6px',
                            fontWeight:600,
                            boxShadow:'0 2px 8px rgba(79,70,229,0.25)'
                          }}
                          onClick={()=>onTakeAssessment && onTakeAssessment(a)}
                        >
                          <Brain size={13}/> Take Aptitude Test
                        </button>
                      )
                    ) : a.assessment_info?.status === 'completed' ? (
                      <button
                        type="button"
                        className="ghost"
                        style={{padding:'4px 8px',fontSize:'11.5px',borderRadius:'6px',display:'inline-flex',alignItems:'center',gap:'4px'}}
                        onClick={()=>onTakeAssessment && onTakeAssessment(a)}
                      >
                        <Award size={12}/> Score: {a.assessment_info.score_percentage}%
                      </button>
                    ) : (
                      <span style={{fontSize:'12px',color:'#94a3b8'}}>—</span>
                    )}
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
  const filteredApps = apps.filter(a => {
    const matchesJob = filterJobId === 'all' || String(a.job) === String(filterJobId);
    const matchesStage = filterStage === 'all' || a.status === filterStage;
    return matchesJob && matchesStage;
  });

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

          <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
            <label style={{fontSize:'12px',fontWeight:600,color:'#475569'}}>Stage:</label>
            <select
              value={filterStage}
              onChange={e=>{
                setFilterStage(e.target.value);
                setShortlistMsg(null);
              }}
              style={{padding:'6px 10px',fontSize:'12.5px',borderRadius:'8px',border:'1px solid #cbd5e1'}}
            >
              <option value="all">All Stages ({apps.length})</option>
              <option value="applied">Applied ({apps.filter(a=>a.status==='applied').length})</option>
              <option value="screening">Screening ({apps.filter(a=>a.status==='screening').length})</option>
              <option value="shortlisted">Shortlisted ({apps.filter(a=>a.status==='shortlisted').length})</option>
              <option value="interview">Interview ({apps.filter(a=>a.status==='interview').length})</option>
              <option value="offer">Offer Extended ({apps.filter(a=>a.status==='offer').length})</option>
              <option value="hired">Hired 🎉 ({apps.filter(a=>a.status==='hired').length})</option>
              <option value="rejected">Rejected ({apps.filter(a=>a.status==='rejected').length})</option>
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

      <div style={{overflowX:'auto',width:'100%'}}>
        <table>
          <thead>
            <tr>
              <th style={{minWidth:'170px'}}>Candidate</th>
              <th style={{minWidth:'150px'}}>Role Applied</th>
              <th style={{minWidth:'160px',width:'160px'}}>Stage</th>
              <th style={{minWidth:'180px'}}>ATS Score & Recommendation</th>
              <th style={{minWidth:'130px'}}>Online Aptitude</th>
              <th style={{minWidth:'110px'}}>Applied Date</th>
              <th style={{minWidth:'180px'}}>Recruiter ATS Screener</th>
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
                  <td style={{minWidth:'160px',width:'160px'}}>
                    <select
                      value={a.status}
                      onChange={(e) => onStatusChange && onStatusChange(a.id, e.target.value)}
                      style={{
                        width:'100%',
                        minWidth:'145px',
                        padding:'7px 11px',
                        borderRadius:'8px',
                        border: a.status === 'hired' ? '1.5px solid #86efac' : a.status === 'offer' ? '1.5px solid #a7f3d0' : '1.5px solid #cbd5e1',
                        background: a.status === 'hired' ? '#f0fdf4' : a.status === 'offer' ? '#ecfdf5' : '#fff',
                        color: a.status === 'hired' ? '#16a34a' : a.status === 'offer' ? '#059669' : '#1e293b',
                        fontSize:'12.5px',
                        fontWeight: 700,
                        cursor:'pointer',
                        outline:'none'
                      }}
                      title="Click to advance or move applicant stage"
                    >
                      <option value="applied">Applied</option>
                      <option value="screening">Screening</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="interview">Interview</option>
                      <option value="offer">Offer Extended</option>
                      <option value="hired">Hired 🎉</option>
                      <option value="rejected">Rejected</option>
                    </select>
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
                    {a.assessment_info?.status === 'completed' ? (
                      <button
                        type="button"
                        className="ghost"
                        style={{
                          padding: '5px 10px',
                          fontSize: '12px',
                          borderRadius: '8px',
                          background: a.assessment_info.passed ? '#ecfdf5' : '#fffbeb',
                          color: a.assessment_info.passed ? '#059669' : '#d97706',
                          border: `1px solid ${a.assessment_info.passed ? '#a7f3d0' : '#fde68a'}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        onClick={() => onOpenRecruiterAssessment && onOpenRecruiterAssessment(a)}
                        title="Click to view candidate aptitude report"
                      >
                        <Award size={13}/>
                        {a.assessment_info.score_percentage}% {a.assessment_info.passed ? '✓ Pass' : '⚠️ Review'}
                      </button>
                    ) : a.status === 'shortlisted' ? (
                      <span className="pill" style={{background:'#f8fafc',color:'#64748b',borderColor:'#e2e8f0',fontSize:'11.5px',display:'inline-flex',alignItems:'center',gap:'4px'}}>
                        <Clock size={11}/> Awaiting Test
                      </span>
                    ) : (
                      <span style={{fontSize:'12px',color:'#94a3b8'}}>—</span>
                    )}
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
                      style={{whiteSpace:'nowrap',display:'inline-flex',alignItems:'center',gap:'6px'}}
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
      </div>

      {!filteredApps.length&&(
        <Empty text="No applications found for the selected filter."/>
      )}
    </div>
  );
}

