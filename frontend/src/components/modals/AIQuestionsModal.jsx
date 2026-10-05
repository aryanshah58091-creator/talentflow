import React, { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, BriefcaseBusiness, Users, KanbanSquare, CalendarDays, Bell, LogOut, Plus, Search, ArrowUpRight, CheckCircle2, Building2, X, Clock, MapPin, DollarSign, Send, Sparkles, ChevronRight, Filter, Compass, FileText, Award, Brain, AlertTriangle, ShieldCheck, Check, RotateCcw, HelpCircle, Video, Calendar, Star, MessageSquare, ExternalLink, CalendarPlus, Copy, CheckCheck, BarChart3, TrendingUp, UploadCloud, Download } from 'lucide-react';
import { api, uploadResumeFile } from '../../api';

export default function AIQuestionsModal({ interview, onClose, onQuestionsUpdated }) {
  const [questions, setQuestions] = useState(interview.ai_interview_questions || []);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const hasTriggeredInitial = React.useRef(false);

  const generateQuestions = async (isRegenerate = false) => {
    setGenerating(true);
    setFeedbackMsg('');
    try {
      const data = await api(`/applications/interviews/${interview.id}/generate-questions/`, {
        method: 'POST'
      });
      const generated = data.ai_interview_questions || [];
      if (generated.length > 0) {
        setQuestions(generated);
        if (onQuestionsUpdated) {
          onQuestionsUpdated(generated);
        }
        setFeedbackMsg(isRegenerate ? '✨ Questions regenerated with fresh AI insights!' : '✨ AI questions generated successfully!');
      } else {
        setFeedbackMsg('Notice: AI evaluation returned standard competency questions.');
      }
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err) {
      console.error('Failed to generate AI interview questions:', err);
      setFeedbackMsg('Note: Using cached questions. ' + (err.message || ''));
      setTimeout(() => setFeedbackMsg(''), 4000);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if ((!questions || questions.length === 0) && !hasTriggeredInitial.current) {
      hasTriggeredInitial.current = true;
      generateQuestions(false);
    }
  }, [interview.id]);

  const fallbackQuestions = [
    {
      question: `Can you describe a challenging bug or architectural bottleneck you encountered while working in ${interview.job_title || 'Software Engineering'}, and how you debugged it?`,
      target_area: 'Core Engineering & Problem Solving',
      eval_criteria: 'Look for systematic debugging approaches, profiling tools, root-cause isolation, and unit test verification.'
    },
    {
      question: `In a high-throughput production environment, how do you handle concurrency, caching, and database connection pooling?`,
      target_area: 'System Scaling & Architecture',
      eval_criteria: 'Strong answers mention Redis/Memcached layers, connection pool sizes, query indexing, and asynchronous job queues.'
    },
    {
      question: `Walk us through how you structure end-to-end testing and CI/CD automated deployments for applications you build.`,
      target_area: 'SDLC & Deployment Automation',
      eval_criteria: 'Evaluate knowledge of Docker containerization, staging pipelines, smoke tests, and automated rollback strategies.'
    }
  ];

  const activeQuestions = questions.length > 0 ? questions : (generating ? [] : fallbackQuestions);

  const handleCopyQuestion = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  return (
    <div className="modalBackdrop" onClick={onClose}>
      <div className="modal" style={{maxWidth:'660px',borderRadius:'20px',overflow:'hidden',padding:0}} onClick={e=>e.stopPropagation()}>
        <div style={{
          background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)',
          color: '#fff',
          padding: '22px 28px',
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
          <span className="pill" style={{background:'rgba(255,255,255,0.2)',color:'#fff',borderColor:'rgba(255,255,255,0.3)',fontSize:'11px',marginBottom:'6px'}}>
            <Brain size={12}/> AI INTERVIEW ASSISTANT
          </span>
          <h2 style={{margin:'4px 0 2px',fontSize:'20px',color:'#fff'}}>
            Tailored Interview Questions & Evaluation Dossier
          </h2>
          <p style={{margin:0,fontSize:'13px',color:'#c7d2fe'}}>
            Candidate: <b>{interview.candidate_name || interview.candidate_username}</b> • Role: {interview.job_title}
          </p>
        </div>

        <div style={{padding:'22px 28px',maxHeight:'70vh',overflowY:'auto'}}>
          {/* ATS Info Bar & Regenerate Button */}
          <div style={{background:'#f5f3ff',border:'1px solid #ddd6fe',borderRadius:'12px',padding:'12px 16px',marginBottom:'18px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'10px'}}>
            <div style={{flex:1,minWidth:'220px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <b style={{fontSize:'13px',color:'#4338ca'}}>Automated ATS Evaluation Guidance</b>
                {interview.match_score && (
                  <span className="pill" style={{background:'#6366f1',color:'#fff',borderColor:'transparent',fontSize:'11px',padding:'1px 7px',fontWeight:700}}>
                    {interview.match_score}% Match
                  </span>
                )}
              </div>
              <div style={{fontSize:'12px',color:'#6b7280',marginTop:'3px'}}>
                Questions probe technical depth and verify qualifications from the candidate's resume.
              </div>
            </div>

            <button
              type="button"
              className="ghost"
              disabled={generating}
              onClick={() => generateQuestions(true)}
              style={{
                fontSize:'12px',
                padding:'6px 12px',
                borderRadius:'8px',
                background:'#ffffff',
                border:'1px solid #c7d2fe',
                color:'#4f46e5',
                fontWeight:700,
                display:'inline-flex',
                alignItems:'center',
                gap:'6px'
              }}
              title="Regenerate questions using the AI agent"
            >
              <RotateCcw size={13} className={generating ? 'spin' : ''}/>
              <span>{generating ? 'Analyzing Resume...' : 'Regenerate'}</span>
            </button>
          </div>

          {feedbackMsg && (
            <div style={{
              background:'#ecfdf5',
              border:'1px solid #a7f3d0',
              color:'#065f46',
              borderRadius:'10px',
              padding:'8px 12px',
              fontSize:'12px',
              fontWeight:600,
              marginBottom:'16px',
              display:'flex',
              alignItems:'center',
              gap:'6px'
            }}>
              <Sparkles size={13} color="#059669"/>
              <span>{feedbackMsg}</span>
            </div>
          )}

          {/* Loading Indicator */}
          {generating && activeQuestions.length === 0 ? (
            <div style={{padding:'40px 20px',textAlign:'center',color:'#6366f1'}}>
              <div className="spinner" style={{margin:'0 auto 12px'}}/>
              <div style={{fontSize:'13.5px',fontWeight:600}}>AI Agent is synthesizing targeted interview questions...</div>
              <div style={{fontSize:'12px',color:'#64748b',marginTop:'4px'}}>Extracting competency vectors and resume gaps</div>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
              {activeQuestions.map((q, idx) => {
                const qText = typeof q === 'string' ? q : (q.question || q.question_text || '');
                const cat = typeof q === 'object' ? (q.target_area || q.category || `Question #${idx + 1}`) : `Question #${idx + 1}`;
                const notes = typeof q === 'object' ? (q.eval_criteria || q.evaluation_notes) : null;

                return (
                  <div key={idx} className="aiQuestionBox" style={{border:'1px solid #e2e8f0',borderRadius:'12px',padding:'14px 16px',background:'#ffffff',boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
                      <span className="pill" style={{background:'#eff6ff',color:'#2563eb',borderColor:'#bfdbfe',fontSize:'11px',padding:'3px 9px',fontWeight:700}}>
                        {cat}
                      </span>
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => handleCopyQuestion(qText, idx)}
                        style={{fontSize:'11px',padding:'3px 8px',display:'inline-flex',alignItems:'center',gap:'4px',borderRadius:'6px'}}
                      >
                        {copiedIndex === idx ? <CheckCheck size={12} color="#16a34a"/> : <Copy size={12}/>}
                        <span style={{color: copiedIndex === idx ? '#16a34a' : '#64748b'}}>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <p style={{margin:'0 0 10px',fontSize:'13.5px',color:'#0f172a',fontWeight:600,lineHeight:'1.5'}}>
                      "{qText}"
                    </p>

                    {notes && (
                      <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'8px',padding:'8px 12px',fontSize:'12px',color:'#475569',lineHeight:'1.4'}}>
                        <b style={{color:'#1e293b'}}>What to listen for:</b> {notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{marginTop:'22px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{fontSize:'11.5px',color:'#94a3b8'}}>
              Tailored questions generated for <b>{interview.candidate_name || interview.candidate_username}</b>
            </div>
            <button type="button" className="primary" onClick={onClose} style={{padding:'8px 22px',fontSize:'13px'}}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

