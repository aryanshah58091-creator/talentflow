import React, { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, BriefcaseBusiness, Users, KanbanSquare, CalendarDays, Bell, LogOut, Plus, Search, ArrowUpRight, CheckCircle2, Building2, X, Clock, MapPin, DollarSign, Send, Sparkles, ChevronRight, Filter, Compass, FileText, Award, Brain, AlertTriangle, ShieldCheck, Check, RotateCcw, HelpCircle, Video, Calendar, Star, MessageSquare, ExternalLink, CalendarPlus, Copy, CheckCheck, BarChart3, TrendingUp, UploadCloud, Download } from 'lucide-react';
import { api, uploadResumeFile } from '../../api';
import Empty from '../common/Empty';

export default function Pipeline({apps,jobs=[],updatingAppId,onStatusChange,onRunAIScreen,evaluatingAI,onOpenRecruiterAssessment,onScheduleInterview}){
  const [selectedJob, setSelectedJobState] = useState(() => {
    return localStorage.getItem('tf_pipeline_job') || 'all';
  });
  const [draggedAppId, setDraggedAppId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  const setSelectedJob = (val) => {
    localStorage.setItem('tf_pipeline_job', val);
    setSelectedJobState(val);
  };

  const stages=[
    'applied',
    'screening',
    'shortlisted',
    'interview',
    'offer',
    'hired',
    'rejected'
  ];

  const stageLabels={
    applied:'Applied',
    screening:'Screening',
    shortlisted:'Shortlisted',
    interview:'Interview Scheduled',
    offer:'Offer Extended',
    hired:'Hired 🎉',
    rejected:'Rejected'
  };

  const scrollToStage = (stageName) => {
    const colElem = document.getElementById(`pipeline-col-${stageName}`);
    if (colElem) {
      colElem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      colElem.classList.add('highlightTarget');
      setTimeout(() => colElem.classList.remove('highlightTarget'), 2000);
    }
  };

  const handleStageMove = (appId, newStage) => {
    if (!appId || !newStage) return;
    onStatusChange(appId, newStage.toLowerCase());
    setTimeout(() => {
      scrollToStage(newStage.toLowerCase());
    }, 150);
  };

  const effectiveJob = (selectedJob === 'all' || jobs.some(j => String(j.id) === String(selectedJob)))
    ? selectedJob
    : 'all';

  const filteredApps = effectiveJob === 'all' 
    ? apps 
    : apps.filter(a => String(a.job) === String(effectiveJob) || a.job_title === effectiveJob);

  return (
    <div>
      <div className="pipelineFilterBar" style={{flexDirection:'column',alignItems:'stretch',gap:'10px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'10px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
            <Filter size={16} style={{color:'#6366f1'}}/>
            <b style={{fontSize:'13.5px',color:'#1e293b'}}>Filter by Job:</b>
            <select
              value={effectiveJob}
              onChange={e=>setSelectedJob(e.target.value)}
              style={{
                padding:'6px 12px',
                borderRadius:'8px',
                border:'1px solid #cbd5e1',
                fontSize:'13px',
                background:'#fff',
                cursor:'pointer',
                fontWeight: 500
              }}
            >
              <option value="all">All Jobs ({apps.length} Total Candidates)</option>
              {jobs.map(j=>(
                <option key={j.id} value={j.id}>
                  {j.title} ({apps.filter(a => String(a.job) === String(j.id)).length})
                </option>
              ))}
            </select>
          </div>

          <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'12.5px',color:'#64748b'}}>
            <span>💡 <b>Tip:</b> Drag candidate cards between columns, or use the stage dropdown / arrow controls!</span>
          </div>
        </div>

        <div className="pipelineStageJumps">
          <span style={{fontSize:'12px',fontWeight:700,color:'#64748b',marginRight:'4px'}}>Quick Jump:</span>
          {stages.map(s => {
            const count = filteredApps.filter(a => (a.status || 'applied').toLowerCase() === s).length;
            return (
              <button
                key={s}
                type="button"
                className={`stageJumpBtn stageJumpBtn-${s}`}
                onClick={() => scrollToStage(s)}
                title={`Jump to ${stageLabels[s]} column`}
              >
                <span className="stageDot" />
                <span>{stageLabels[s]}</span>
                <span className="stageJumpCount">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pipeline">
        {stages.map(s=>{
          const columnApps = filteredApps.filter(a=>(a.status || 'applied').toLowerCase()===s);
          const isOver = dragOverStage === s;

          return (
            <div
              className={`column col-${s} ${isOver ? 'highlightTarget' : ''}`}
              id={`pipeline-col-${s}`}
              key={s}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragOverStage(s);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget)) return;
                if (dragOverStage === s) setDragOverStage(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverStage(null);
                const rawId = e.dataTransfer.getData('text/plain') || draggedAppId;
                const droppedId = rawId ? parseInt(rawId, 10) : null;
                if (droppedId) {
                  handleStageMove(droppedId, s);
                  setDraggedAppId(null);
                }
              }}
              style={{
                transition: 'all 0.2s ease',
                borderWidth: isOver ? '2px' : undefined,
                borderStyle: isOver ? 'dashed' : undefined,
                borderColor: isOver ? '#6366f1' : undefined
              }}
            >
              <div className="colHead">
                <b>{stageLabels[s]}</b>
                <span>{columnApps.length}</span>
              </div>

              {columnApps.map(a=>{
                const normalizedStatus = (a.status || 'applied').toLowerCase();
                const currentIndex = stages.indexOf(normalizedStatus);
                const canMovePrev = currentIndex > 0 && normalizedStatus !== 'rejected';
                const canMoveNext = currentIndex >= 0 && currentIndex < stages.length - 2 && normalizedStatus !== 'rejected';
                const isUpdating = updatingAppId === a.id;
                const isBeingDragged = draggedAppId === a.id;

                return (
                  <div
                    className="candidateCard"
                    key={a.id}
                    draggable={!isUpdating}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', String(a.id));
                      e.dataTransfer.effectAllowed = 'move';
                      setDraggedAppId(a.id);
                    }}
                    onDragEnd={() => {
                      setDraggedAppId(null);
                      setDragOverStage(null);
                    }}
                    style={{
                      opacity: isBeingDragged ? 0.4 : isUpdating ? 0.7 : 1,
                      cursor: isUpdating ? 'wait' : 'grab',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                  >
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

                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'2px'}}>
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

                    {a.assessment_info?.status === 'completed' ? (
                      <button
                        type="button"
                        className="ghost"
                        style={{
                          background: a.assessment_info.passed ? '#ecfdf5' : '#fffbeb',
                          color: a.assessment_info.passed ? '#059669' : '#d97706',
                          border: `1px solid ${a.assessment_info.passed ? '#a7f3d0' : '#fde68a'}`,
                          fontSize: '11px',
                          padding: '3px 8px',
                          cursor: 'pointer',
                          alignSelf: 'flex-start',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          marginTop: '2px'
                        }}
                        onClick={() => onOpenRecruiterAssessment && onOpenRecruiterAssessment(a)}
                        title="Click to view Aptitude Assessment report"
                      >
                        <Award size={12}/> Aptitude: {a.assessment_info.score_percentage}% ({a.assessment_info.passed ? 'Pass' : 'Review'})
                      </button>
                    ) : normalizedStatus === 'shortlisted' ? (
                      <span
                        className="pill"
                        style={{
                          background: '#fef3c7',
                          color: '#b45309',
                          borderColor: '#fde68a',
                          fontSize: '10.5px',
                          padding: '2px 7px',
                          alignSelf: 'flex-start',
                          marginTop: '2px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 600
                        }}
                      >
                        <Clock size={10}/> Aptitude Pending
                      </span>
                    ) : null}

                    {normalizedStatus === 'interview' && (
                      <button
                        type="button"
                        className="ghost"
                        style={{
                          background: '#ede9fe',
                          color: '#6d28d9',
                          border: '1px solid #ddd6fe',
                          fontSize: '11px',
                          padding: '3px 8px',
                          cursor: 'pointer',
                          alignSelf: 'flex-start',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          marginTop: '2px'
                        }}
                        onClick={() => onScheduleInterview && onScheduleInterview(a)}
                        title="View or schedule interview for this candidate"
                      >
                        <CalendarDays size={12}/> Interviews & Scorecards
                      </button>
                    )}

                    <div style={{
                      marginTop:'6px',
                      paddingTop:'6px',
                      borderTop:'1px solid #f1f5f9',
                      display:'flex',
                      flexDirection:'column',
                      gap:'5px'
                    }}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <span style={{fontSize:'10.5px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.4px'}}>
                          Move Stage:
                        </span>
                        {isUpdating && (
                          <span style={{fontSize:'10.5px',color:'#7c3aed',fontWeight:600}}>
                            Updating...
                          </span>
                        )}
                      </div>

                      <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                        {canMovePrev && (
                          <button
                            type="button"
                            className="ghost"
                            disabled={isUpdating}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStageMove(a.id, stages[currentIndex - 1]);
                            }}
                            title={`Move back to ${stageLabels[stages[currentIndex - 1]]}`}
                            style={{
                              padding: '5px 7px',
                              fontSize: '11px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              background: '#f8fafc',
                              cursor: 'pointer'
                            }}
                          >
                            ←
                          </button>
                        )}

                        <select
                          id={`move-stage-${a.id}`}
                          value={normalizedStatus}
                          disabled={isUpdating}
                          onChange={(e) => {
                            e.stopPropagation();
                            const val = e.target.value;
                            if (val !== normalizedStatus) {
                              handleStageMove(a.id, val);
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: '5px 8px',
                            borderRadius: '6px',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '11.5px',
                            fontWeight: '600',
                            color: '#1e293b',
                            background: '#ffffff',
                            cursor: 'pointer',
                            outline: 'none',
                            minWidth: '85px'
                          }}
                        >
                          {stages.map(stage=>(
                            <option key={stage} value={stage}>
                              {stageLabels[stage]}
                            </option>
                          ))}
                        </select>

                        {canMoveNext && (
                          <button
                            type="button"
                            className="primary"
                            disabled={isUpdating}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStageMove(a.id, stages[currentIndex + 1]);
                            }}
                            title={`Advance to ${stageLabels[stages[currentIndex + 1]]}`}
                            style={{
                              padding: '5px 8px',
                              fontSize: '11px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              background: '#4f46e5',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                          >
                            <span>{stageLabels[stages[currentIndex + 1]]}</span> →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {!columnApps.length&&(
                <div style={{padding:'32px 10px',textAlign:'center',color:'#94a3b8',fontSize:'12.5px',fontStyle:'italic'}}>
                  No candidates in {stageLabels[s]}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

