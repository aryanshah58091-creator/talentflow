import React, { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, BriefcaseBusiness, Users, KanbanSquare, CalendarDays, Bell, LogOut, Plus, Search, ArrowUpRight, CheckCircle2, Building2, X, Clock, MapPin, DollarSign, Send, Sparkles, ChevronRight, Filter, Compass, FileText, Award, Brain, AlertTriangle, ShieldCheck, Check, RotateCcw, HelpCircle, Video, Calendar, Star, MessageSquare, ExternalLink, CalendarPlus, Copy, CheckCheck, BarChart3, TrendingUp, UploadCloud, Download } from 'lucide-react';
import { api, uploadResumeFile } from '../../api';

export default function RecruiterAssessmentModal({ application, onClose, onStatusChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    loadData();
  }, [application.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api(`/applications/${application.id}/assessment/`);
      setData(res);
    } catch (e) {
      alert(e.message || 'Failed to load assessment report.');
    } finally {
      setLoading(false);
    }
  };

  const attempt = data?.attempt;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard" style={{maxWidth:'640px'}} onClick={e => e.stopPropagation()}>
        <div className="modalHead" style={{background:'linear-gradient(135deg, #f8fafc 0%, #ede9fe 100%)'}}>
          <div>
            <span className="pill" style={{background:'#4f46e5',color:'#fff',borderColor:'transparent'}}>
              <Brain size={12}/> ONLINE APTITUDE EVALUATION REPORT
            </span>
            <h2 style={{marginTop:'8px',fontSize:'20px'}}>
              {application.candidate_name || 'Candidate'} — {application.job_title}
            </h2>
            <div className="muted" style={{fontSize:'12.5px',color:'#475569',marginTop:'2px'}}>
              Objective Quantitative, Logical, Verbal & Technical Screening
            </div>
          </div>
          <button className="icon closeBtn" onClick={onClose}>
            <X size={20}/>
          </button>
        </div>

        <div className="modalBody">
          {loading ? (
            <div style={{padding:'40px 0',textAlign:'center'}}>
              <span className="sparkleIcon">✦</span> Loading Evaluation Report...
            </div>
          ) : !attempt || attempt.status !== 'completed' ? (
            <div style={{padding:'30px 0',textAlign:'center'}}>
              <div style={{fontSize:'36px',marginBottom:'10px'}}>⏳</div>
              <h3 style={{fontSize:'17px',margin:'0 0 6px'}}>Assessment Pending</h3>
              <p className="muted" style={{fontSize:'13px',maxWidth:'400px',margin:'0 auto'}}>
                The candidate has been notified to complete the Online Aptitude Assessment. Score and category breakdown will automatically appear here once submitted.
              </p>
            </div>
          ) : (
            <div>
              <div style={{
                background: attempt.passed ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                color: '#fff',
                borderRadius: '14px',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <div>
                  <div style={{fontSize:'11.5px',letterSpacing:'0.8px',textTransform:'uppercase',fontWeight:700,opacity:0.9}}>
                    Online Assessment Result
                  </div>
                  <h3 style={{fontSize:'22px',margin:'4px 0 2px',color:'#fff'}}>
                    {attempt.passed ? 'Cutoff Exceeded (Passed)' : 'Cutoff Not Met (Review Needed)'}
                  </h3>
                  <small style={{opacity:0.9}}>
                    Passing Threshold: {data?.assessment?.passing_score || 70}%
                  </small>
                </div>
                <div style={{
                  fontSize:'36px',
                  fontWeight:800,
                  background:'rgba(255,255,255,0.2)',
                  padding:'8px 18px',
                  borderRadius:'12px'
                }}>
                  {attempt.score_percentage}%
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))',gap:'10px',marginBottom:'20px'}}>
                <div className="categoryCard" style={{textAlign:'center',padding:'12px'}}>
                  <span style={{fontSize:'11px',color:'#64748b'}}>Questions Correct</span>
                  <b style={{fontSize:'18px',color:'#0f172a',marginTop:'2px'}}>{attempt.correct_answers_count} / {attempt.total_questions}</b>
                </div>
                <div className="categoryCard" style={{textAlign:'center',padding:'12px'}}>
                  <span style={{fontSize:'11px',color:'#64748b'}}>Tab Violations</span>
                  <b style={{fontSize:'18px',color: attempt.violations_count > 0 ? '#d97706' : '#10b981',marginTop:'2px'}}>
                    {attempt.violations_count} warning{attempt.violations_count === 1 ? '' : 's'}
                  </b>
                </div>
                <div className="categoryCard" style={{textAlign:'center',padding:'12px'}}>
                  <span style={{fontSize:'11px',color:'#64748b'}}>Completed On</span>
                  <b style={{fontSize:'13px',color:'#0f172a',marginTop:'5px'}}>
                    {attempt.completed_at ? new Date(attempt.completed_at).toLocaleDateString() : 'Recent'}
                  </b>
                </div>
              </div>

              {attempt.category_scores && Object.keys(attempt.category_scores).length > 0 && (
                <div style={{marginBottom:'20px'}}>
                  <h4 style={{fontSize:'13.5px',margin:'0 0 10px',color:'#0f172a'}}>Category Breakdown</h4>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(2, 1fr)',gap:'10px'}}>
                    {Object.entries(attempt.category_scores).map(([cat, stats]) => (
                      <div className="categoryCard" key={cat} style={{padding:'10px 14px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px'}}>
                          <b>{cat}</b>
                          <span style={{fontWeight:700,color: stats.percentage >= 70 ? '#10b981' : '#f59e0b'}}>
                            {stats.percentage}%
                          </span>
                        </div>
                        <div className="categoryProgressBar" style={{marginTop:'4px'}}>
                          <div
                            className="categoryProgressFill"
                            style={{
                              width: `${stats.percentage}%`,
                              background: stats.percentage >= 70 ? '#10b981' : '#f59e0b'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="modalActions" style={{borderTop:'1px solid #e2e8f0',paddingTop:'16px',display:'flex',justifyContent:'space-between'}}>
            <button className="ghost" onClick={onClose}>
              Close Report
            </button>
            {attempt?.status === 'completed' && application.status === 'shortlisted' && (
              <button
                className="primary"
                style={{gap:'6px'}}
                disabled={advancing}
                onClick={async () => {
                  setAdvancing(true);
                  try {
                    await onStatusChange(application.id, 'interview');
                    onClose();
                  } catch (e) {
                    alert(e.message || 'Failed to advance candidate.');
                  } finally {
                    setAdvancing(false);
                  }
                }}
              >
                Advance to Interview Stage
                <ArrowUpRight size={14}/>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

