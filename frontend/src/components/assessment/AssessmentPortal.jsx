import React, { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, BriefcaseBusiness, Users, KanbanSquare, CalendarDays, Bell, LogOut, Plus, Search, ArrowUpRight, CheckCircle2, Building2, X, Clock, MapPin, DollarSign, Send, Sparkles, ChevronRight, Filter, Compass, FileText, Award, Brain, AlertTriangle, ShieldCheck, Check, RotateCcw, HelpCircle, Video, Calendar, Star, MessageSquare, ExternalLink, CalendarPlus, Copy, CheckCheck, BarChart3, TrendingUp, UploadCloud, Download } from 'lucide-react';
import { api, uploadResumeFile } from '../../api';

export default function AssessmentPortal({ application, user, onClose }) {
  const [stage, setStage] = useState('loading'); // 'loading', 'brief', 'testing', 'submitting', 'result', 'error'
  const [meta, setMeta] = useState(null);
  const [testSession, setTestSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [reviewed, setReviewed] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [violations, setViolations] = useState(0);
  const [violationToast, setViolationToast] = useState(null);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  useEffect(() => {
    fetchAssessmentInfo();
  }, [application.id]);

  const fetchAssessmentInfo = async () => {
    try {
      setStage('loading');
      const res = await api(`/applications/${application.id}/assessment/`);
      setMeta(res);
      if (res.attempt && res.attempt.status === 'completed') {
        setResult(res.attempt);
        setStage('result');
      } else {
        setStage('brief');
      }
    } catch (e) {
      setErrorMsg(e.message || 'Failed to load assessment.');
      setStage('error');
    }
  };

  const handleStartTest = async () => {
    try {
      setStage('loading');
      const res = await api(`/applications/${application.id}/assessment/start/`, { method: 'POST' });
      setTestSession(res);
      setTimeLeft((res.duration_minutes || 15) * 60);
      setAnswers({});
      setReviewed({});
      setCurrentIdx(0);
      setViolations(0);
      setStage('testing');
    } catch (e) {
      setErrorMsg(e.message || 'Failed to start test.');
      setStage('error');
    }
  };

  // Integrity tab-switch monitoring
  useEffect(() => {
    if (stage !== 'testing') return;
    const handleVisChange = () => {
      if (document.hidden) {
        setViolations(v => {
          const next = v + 1;
          setViolationToast(`Integrity Warning #${next}: Leaving the assessment window is recorded by proctoring.`);
          setTimeout(() => setViolationToast(null), 4000);
          return next;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisChange);
    return () => document.removeEventListener('visibilitychange', handleVisChange);
  }, [stage]);

  // Countdown timer
  useEffect(() => {
    if (stage !== 'testing') return;
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitTest(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [stage, timeLeft]);

  const handleSubmitTest = async (auto = false) => {
    setConfirmSubmit(false);
    setStage('submitting');
    try {
      const res = await api(`/applications/${application.id}/assessment/submit/`, {
        method: 'POST',
        body: JSON.stringify({
          answers,
          violations_count: violations
        })
      });
      setResult(res);
      setStage('result');
    } catch (e) {
      setErrorMsg(e.message || 'Failed to submit test.');
      setStage('error');
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const questions = testSession?.questions || [];
  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="modalOverlay" onClick={() => { if (stage !== 'testing') onClose(); }}>
      <div className="assessmentModalCard" onClick={e => e.stopPropagation()}>
        {violationToast && (
          <div className="violationToast">
            <AlertTriangle size={18}/>
            <span>{violationToast}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="assessmentTopBar">
          <div className="assessmentTitleWrap">
            <Brain size={22} style={{color:'#818cf8'}}/>
            <div>
              <b style={{fontSize:'15px',letterSpacing:'-0.2px'}}>
                {meta?.assessment?.title || 'Online Aptitude & Skills Assessment'}
              </b>
              <small style={{display:'block',color:'#94a3b8',fontSize:'11.5px'}}>
                {application.job_title} · App #{application.id}
              </small>
            </div>
          </div>

          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            {stage === 'testing' && (
              <>
                <div className={`proctorBadge ${violations > 0 ? 'violation' : ''}`}>
                  <ShieldCheck size={14}/>
                  <span>Proctor: {violations} warning{violations === 1 ? '' : 's'}</span>
                </div>
                <div className={`timerBadge ${timeLeft < 120 ? 'warning' : ''}`}>
                  <Clock size={15}/>
                  <span>{formatTimer(timeLeft)}</span>
                </div>
              </>
            )}

            {stage !== 'testing' && (
              <button className="icon closeBtn" style={{color:'#fff'}} onClick={onClose}>
                <X size={18}/>
              </button>
            )}
          </div>
        </div>

        {/* LOADING STAGE */}
        {stage === 'loading' && (
          <div style={{padding:'60px 20px',textAlign:'center',flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
            <div className="sparkleIcon" style={{fontSize:'32px',marginBottom:'16px'}}>✦</div>
            <h3 style={{margin:0,fontSize:'18px'}}>Preparing Assessment Session...</h3>
            <p className="muted" style={{fontSize:'13px',marginTop:'6px'}}>
              Configuring proctoring controls, randomized question sequence, and timers.
            </p>
          </div>
        )}

        {/* ERROR STAGE */}
        {stage === 'error' && (
          <div style={{padding:'60px 20px',textAlign:'center',flex:1}}>
            <div style={{fontSize:'36px',marginBottom:'12px'}}>⚠️</div>
            <h3>Unable to Load Assessment</h3>
            <p className="alert alertError" style={{maxWidth:'460px',margin:'12px auto 20px'}}>
              {errorMsg}
            </p>
            <button className="primary" onClick={onClose}>
              Back to Applications
            </button>
          </div>
        )}

        {/* BRIEFING STAGE */}
        {stage === 'brief' && (
          <div style={{padding:'36px 40px',overflowY:'auto',flex:1}}>
            <div style={{maxWidth:'680px',margin:'0 auto'}}>
              <span className="pill" style={{background:'#eef2ff',color:'#4f46e5',borderColor:'#c7d2fe',marginBottom:'12px'}}>
                <Brain size={13}/> CANDIDATE SHORTLIST ASSESSMENT
              </span>
              <h2 style={{fontSize:'26px',letterSpacing:'-0.5px',margin:'6px 0 10px',color:'#0f172a'}}>
                {meta?.assessment?.title}
              </h2>
              <p style={{fontSize:'14px',lineHeight:'1.6',color:'#475569',margin:'0 0 24px'}}>
                {meta?.assessment?.description}
              </p>

              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))',gap:'14px',marginBottom:'28px'}}>
                <div className="categoryCard" style={{textAlign:'center',padding:'16px'}}>
                  <span style={{fontSize:'11.5px',color:'#64748b',fontWeight:600}}>Total Questions</span>
                  <b style={{fontSize:'24px',color:'#0f172a',marginTop:'4px'}}>{meta?.assessment?.total_questions || 10}</b>
                  <small style={{color:'#64748b',fontSize:'11px'}}>Multiple Choice</small>
                </div>
                <div className="categoryCard" style={{textAlign:'center',padding:'16px'}}>
                  <span style={{fontSize:'11.5px',color:'#64748b',fontWeight:600}}>Time Limit</span>
                  <b style={{fontSize:'24px',color:'#2563eb',marginTop:'4px'}}>{meta?.assessment?.duration_minutes || 15} min</b>
                  <small style={{color:'#64748b',fontSize:'11px'}}>Countdown Timer</small>
                </div>
                <div className="categoryCard" style={{textAlign:'center',padding:'16px'}}>
                  <span style={{fontSize:'11.5px',color:'#64748b',fontWeight:600}}>Passing Cutoff</span>
                  <b style={{fontSize:'24px',color:'#10b981',marginTop:'4px'}}>{meta?.assessment?.passing_score || 70}%</b>
                  <small style={{color:'#64748b',fontSize:'11px'}}>Auto-Graded</small>
                </div>
                <div className="categoryCard" style={{textAlign:'center',padding:'16px'}}>
                  <span style={{fontSize:'11.5px',color:'#64748b',fontWeight:600}}>Integrity</span>
                  <b style={{fontSize:'24px',color:'#8b5cf6',marginTop:'4px'}}>Monitored</b>
                  <small style={{color:'#64748b',fontSize:'11px'}}>Tab Switches</small>
                </div>
              </div>

              <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'14px',padding:'20px 22px',marginBottom:'28px'}}>
                <h4 style={{margin:'0 0 10px',fontSize:'14.5px',display:'flex',alignItems:'center',gap:'8px'}}>
                  <ShieldCheck size={17} style={{color:'#4f46e5'}}/>
                  Assessment Rules & Instructions
                </h4>
                <ul style={{margin:0,paddingLeft:'20px',fontSize:'13px',color:'#475569',lineHeight:'1.65'}}>
                  <li><b>Sections Covered:</b> Quantitative Aptitude (3 Qs), Logical Reasoning (3 Qs), Verbal Ability (2 Qs), and Technical Fundamentals (2 Qs).</li>
                  <li><b>Navigation:</b> You can jump freely between questions using the Question Palette. Answers are saved instantly.</li>
                  <li><b>Review:</b> You can mark challenging questions for review and return before submitting.</li>
                  <li><b>Proctoring:</b> Switching browser tabs or minimizing the window triggers an automated integrity warning flag.</li>
                  <li><b>Submission:</b> The test automatically auto-submits when the timer reaches 00:00.</li>
                </ul>
              </div>

              <div style={{display:'flex',justifyContent:'flex-end',gap:'12px'}}>
                <button className="ghost" onClick={onClose}>
                  Cancel / Return Later
                </button>
                <button
                  className="primary"
                  style={{padding:'12px 28px',fontSize:'14.5px',background:'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',gap:'8px'}}
                  onClick={handleStartTest}
                >
                  <Brain size={16}/> Start Assessment Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE TESTING STAGE */}
        {stage === 'testing' && currentQ && (
          <div className="testContainer">
            {/* Left Question Area */}
            <div className="testMainContent">
              <div className="questionMeta">
                <span className="categoryTag">
                  {currentQ.category || 'Aptitude'}
                </span>
                <span style={{fontSize:'13px',fontWeight:600,color:'#64748b'}}>
                  Question {currentIdx + 1} of {questions.length}
                </span>
              </div>

              <div className="questionPrompt">
                {currentQ.question_text}
              </div>

              <div className="optionsList">
                {(currentQ.options || []).map(opt => {
                  const isSelected = answers[currentQ.id] === opt.id;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      className={`optionBtn ${isSelected ? 'selected' : ''}`}
                      onClick={() => setAnswers({ ...answers, [currentQ.id]: opt.id })}
                    >
                      <span className="optionKey">{opt.id}</span>
                      <span style={{flex:1}}>{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              <div className="testNavControls">
                <div style={{display:'flex',gap:'8px'}}>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                    disabled={currentIdx === 0}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    style={{
                      background: reviewed[currentQ.id] ? '#fef3c7' : '#fff',
                      color: reviewed[currentQ.id] ? '#b45309' : '#475569',
                      borderColor: reviewed[currentQ.id] ? '#fcd34d' : '#cbd5e1'
                    }}
                    onClick={() => setReviewed({ ...reviewed, [currentQ.id]: !reviewed[currentQ.id] })}
                  >
                    {reviewed[currentQ.id] ? '★ Marked for Review' : '☆ Mark for Review'}
                  </button>
                </div>

                <div style={{display:'flex',gap:'8px'}}>
                  {currentIdx < questions.length - 1 ? (
                    <button
                      type="button"
                      className="primary"
                      onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
                    >
                      Next Question
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="primary"
                      style={{background:'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}
                      onClick={() => setConfirmSubmit(true)}
                    >
                      Finish Assessment
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Question Palette Sidebar */}
            <div className="testSidebar">
              <div>
                <b style={{fontSize:'13px',color:'#0f172a',display:'block',marginBottom:'10px'}}>
                  Question Palette ({answeredCount}/{questions.length})
                </b>
                <div className="paletteGrid">
                  {questions.map((q, idx) => {
                    const isAnswered = !!answers[q.id];
                    const isRev = !!reviewed[q.id];
                    const isCurrent = idx === currentIdx;
                    let btnClass = 'paletteBtn';
                    if (isCurrent) btnClass += ' current';
                    else if (isRev) btnClass += ' review';
                    else if (isAnswered) btnClass += ' answered';

                    return (
                      <button
                        type="button"
                        key={q.id}
                        className={btnClass}
                        onClick={() => setCurrentIdx(idx)}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="paletteLegend">
                  <div className="paletteLegendItem">
                    <span className="legendDot" style={{background:'#4f46e5'}}/>
                    <span>Answered ({answeredCount})</span>
                  </div>
                  <div className="paletteLegendItem">
                    <span className="legendDot" style={{background:'#f59e0b'}}/>
                    <span>Marked for Review ({Object.values(reviewed).filter(Boolean).length})</span>
                  </div>
                  <div className="paletteLegendItem">
                    <span className="legendDot" style={{background:'#cbd5e1'}}/>
                    <span>Unanswered ({questions.length - answeredCount})</span>
                  </div>
                </div>
              </div>

              <div style={{marginTop:'auto',borderTop:'1px solid #e2e8f0',paddingTop:'16px'}}>
                <button
                  type="button"
                  className="primary"
                  style={{width:'100%',background:'linear-gradient(135deg, #10b981 0%, #059669 100%)',fontSize:'13px'}}
                  onClick={() => setConfirmSubmit(true)}
                >
                  Submit Final Test
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBMISSION CONFIRMATION MODAL */}
        {confirmSubmit && (
          <div className="modalOverlay" style={{zIndex:10000}} onClick={() => setConfirmSubmit(false)}>
            <div className="modalCard" style={{maxWidth:'440px',padding:'24px',textAlign:'center'}} onClick={e => e.stopPropagation()}>
              <h3 style={{fontSize:'19px',margin:'0 0 10px'}}>Ready to submit your assessment?</h3>
              <p style={{fontSize:'13.5px',color:'#475569',margin:'0 0 20px'}}>
                You have answered <b>{answeredCount}</b> of <b>{questions.length}</b> questions.
                {questions.length - answeredCount > 0 && ` (${questions.length - answeredCount} unanswered questions remain).`}
              </p>
              <div style={{display:'flex',justifyContent:'center',gap:'10px'}}>
                <button className="ghost" onClick={() => setConfirmSubmit(false)}>
                  Continue Test
                </button>
                <button
                  className="primary"
                  style={{background:'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}
                  onClick={() => handleSubmitTest(false)}
                >
                  Confirm & Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBMITTING STAGE */}
        {stage === 'submitting' && (
          <div style={{padding:'60px 20px',textAlign:'center',flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
            <div className="sparkleIcon" style={{fontSize:'32px',marginBottom:'16px'}}>✦</div>
            <h3 style={{margin:0,fontSize:'18px'}}>Evaluating Assessment & Grading...</h3>
            <p className="muted" style={{fontSize:'13px',marginTop:'6px'}}>
              Computing category breakdowns and updating recruitment pipeline records.
            </p>
          </div>
        )}

        {/* RESULT / REVIEW STAGE */}
        {stage === 'result' && result && (
          <div style={{overflowY:'auto',flex:1}}>
            <div className="resultHeader">
              <span className={`verdictBadge ${result.passed ? 'passed' : 'failed'}`}>
                {result.passed ? '✓ Passed — Cutoff Met' : '⚠️ Completed — Cutoff Not Met'}
              </span>
              <div className="scoreHero">
                {result.score_percentage}%
              </div>
              <p style={{margin:0,fontSize:'14px',color:'#cbd5e1'}}>
                Correct Answers: <b>{result.correct_answers_count}</b> / {result.total_questions}
                {result.passing_score ? ` (Passing Cutoff: ${result.passing_score}%)` : ''}
              </p>
              <div style={{display:'inline-flex',alignItems:'center',gap:'6px',fontSize:'12px',background:'rgba(255,255,255,0.1)',padding:'4px 12px',borderRadius:'999px',marginTop:'12px'}}>
                <ShieldCheck size={13}/>
                <span>Integrity Monitor: {result.violations_count || 0} Tab Switch Warning{(result.violations_count || 0) === 1 ? '' : 's'}</span>
              </div>
            </div>

            <div style={{padding:'28px 36px',maxWidth:'780px',margin:'0 auto'}}>
              {/* Category Breakdown */}
              {result.category_scores && Object.keys(result.category_scores).length > 0 && (
                <div style={{marginBottom:'32px'}}>
                  <h4 style={{fontSize:'15px',margin:'0 0 14px',color:'#0f172a'}}>
                    Category Performance Breakdown
                  </h4>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))',gap:'12px'}}>
                    {Object.entries(result.category_scores).map(([cat, stats]) => (
                      <div className="categoryCard" key={cat}>
                        <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px'}}>
                          <b style={{color:'#1e293b'}}>{cat}</b>
                          <span style={{fontWeight:700,color: stats.percentage >= 70 ? '#10b981' : '#f59e0b'}}>
                            {stats.percentage}%
                          </span>
                        </div>
                        <div className="categoryProgressBar">
                          <div
                            className="categoryProgressFill"
                            style={{
                              width: `${stats.percentage}%`,
                              background: stats.percentage >= 70 ? '#10b981' : '#f59e0b'
                            }}
                          />
                        </div>
                        <small style={{fontSize:'11px',color:'#64748b'}}>
                          {stats.correct} of {stats.total} correct
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Question Review */}
              {result.graded_breakdown && result.graded_breakdown.length > 0 && (
                <div>
                  <h4 style={{fontSize:'15px',margin:'0 0 14px',color:'#0f172a'}}>
                    Detailed Solution & Explanation Review
                  </h4>
                  {result.graded_breakdown.map((q, idx) => (
                    <div
                      key={q.question_id || idx}
                      className={`reviewQuestionCard ${q.is_correct ? 'correct' : 'incorrect'}`}
                    >
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                        <span className="categoryTag" style={{fontSize:'10.5px',padding:'2px 8px'}}>
                          {q.category} · Q{idx + 1}
                        </span>
                        <span style={{
                          fontSize:'12px',
                          fontWeight:700,
                          color: q.is_correct ? '#10b981' : '#ef4444'
                        }}>
                          {q.is_correct ? '✓ Correct (+10 pts)' : '✗ Incorrect (0 pts)'}
                        </span>
                      </div>
                      <p style={{fontSize:'13.5px',fontWeight:600,color:'#0f172a',margin:'0 0 10px'}}>
                        {q.question_text}
                      </p>
                      <div style={{display:'flex',gap:'16px',fontSize:'12.5px',marginBottom:'8px'}}>
                        <span>Your Answer: <b>{q.selected_option || 'None'}</b></span>
                        <span style={{color:'#10b981'}}>Correct Answer: <b>{q.correct_option}</b></span>
                      </div>
                      {q.explanation && (
                        <div style={{background:'#f8fafc',padding:'8px 12px',borderRadius:'6px',fontSize:'12px',color:'#475569',borderLeft:'3px solid #6366f1'}}>
                          <b>Explanation:</b> {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={{display:'flex',justifyContent:'flex-end',marginTop:'24px'}}>
                <button className="primary" onClick={onClose}>
                  Done & Return to Applications
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

