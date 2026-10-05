import React, { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, BriefcaseBusiness, Users, KanbanSquare, CalendarDays, Bell, LogOut, Plus, Search, ArrowUpRight, CheckCircle2, Building2, X, Clock, MapPin, DollarSign, Send, Sparkles, ChevronRight, Filter, Compass, FileText, Award, Brain, AlertTriangle, ShieldCheck, Check, RotateCcw, HelpCircle, Video, Calendar, Star, MessageSquare, ExternalLink, CalendarPlus, Copy, CheckCheck, BarChart3, TrendingUp, UploadCloud, Download } from 'lucide-react';
import { api, uploadResumeFile } from '../../api';

export default function ScorecardModal({ interview, onClose, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [recommendation, setRecommendation] = useState('hire'); // strong-hire, hire, neutral, no-hire
  const [techRating, setTechRating] = useState(4);
  const [problemSolvingRating, setProblemSolvingRating] = useState(4);
  const [commRating, setCommRating] = useState(5);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comments.trim()) {
      alert('Please add qualitative interviewer comments before saving.');
      return;
    }

    setSubmitting(true);
    try {
      const summaryText = `[Recommendation: ${recommendation.toUpperCase().replace('-', ' ')} | Tech: ${techRating}/5 | Logic: ${problemSolvingRating}/5 | Comm: ${commRating}/5]\n\n${comments.trim()}`;
      await api(`/applications/interviews/${interview.id}/feedback/`, {
        method: 'POST',
        body: JSON.stringify({
          rating: rating,
          comments: summaryText
        })
      });
      onSubmitted();
    } catch (err) {
      alert('Failed to submit scorecard: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modalBackdrop" onClick={onClose}>
      <div className="modal" style={{maxWidth:'580px',borderRadius:'20px',overflow:'hidden',padding:0}} onClick={e=>e.stopPropagation()}>
        <div style={{
          background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
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
            <Star size={12}/> EVALUATION SCORECARD
          </span>
          <h2 style={{margin:'4px 0 2px',fontSize:'20px',color:'#fff'}}>
            {interview.round} Scorecard
          </h2>
          <p style={{margin:0,fontSize:'13px',color:'#a7f3d0'}}>
            Candidate: <b>{interview.candidate_name}</b> • {interview.job_title}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{padding:'24px 28px',maxHeight:'75vh',overflowY:'auto'}}>
          {/* Overall Star Rating */}
          <div style={{textAlign:'center',marginBottom:'18px',padding:'14px',background:'#f8fafc',borderRadius:'12px',border:'1px solid #e2e8f0'}}>
            <div style={{fontSize:'12px',fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.5px'}}>
              Overall Session Rating
            </div>
            <div className="starRatingInteractive" style={{justifyContent:'center'}}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button"
                  key={star}
                  className={`starBtn ${(hoverRating || rating) >= star ? 'active' : ''}`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
            <div style={{fontSize:'13px',fontWeight:700,color:'#0f172a'}}>
              {rating === 5 ? '5/5 — Exceptional Match' : rating === 4 ? '4/5 — Strong Candidate' : rating === 3 ? '3/5 — Adequate / Moderate' : rating === 2 ? '2/5 — Below Requirements' : '1/5 — Definite Pass'}
            </div>
          </div>

          {/* Recommendation Selector */}
          <div style={{marginBottom:'18px'}}>
            <label style={{display:'block',fontSize:'12.5px',fontWeight:700,color:'#334155',marginBottom:'6px'}}>
              Hiring Decision Recommendation *
            </label>
            <div className="recommendationSelector">
              {[
                ['strong-hire', 'Strong Hire'],
                ['hire', 'Hire'],
                ['neutral', 'Hold / Neutral'],
                ['no-hire', 'No Hire']
              ].map(([key, label]) => (
                <div
                  key={key}
                  className={`recOption ${key} ${recommendation === key ? 'selected' : ''}`}
                  onClick={() => setRecommendation(key)}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Competency Ratings */}
          <div style={{marginBottom:'18px'}}>
            <label style={{display:'block',fontSize:'12.5px',fontWeight:700,color:'#334155',marginBottom:'8px'}}>
              Core Competency Breakdown (1 - 5 Scale)
            </label>
            <div style={{display:'flex',flexDirection:'column',gap:'10px',background:'#f8fafc',padding:'12px 16px',borderRadius:'10px',border:'1px solid #e2e8f0'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:'12.5px',fontWeight:600,color:'#334155'}}>Technical Depth & Hands-on Coding:</span>
                <select
                  value={techRating}
                  onChange={e=>setTechRating(Number(e.target.value))}
                  style={{padding:'4px 8px',borderRadius:'6px',fontSize:'12px',fontWeight:600}}
                >
                  {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} / 5</option>)}
                </select>
              </div>

              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:'12.5px',fontWeight:600,color:'#334155'}}>Problem Solving & Analytical Logic:</span>
                <select
                  value={problemSolvingRating}
                  onChange={e=>setProblemSolvingRating(Number(e.target.value))}
                  style={{padding:'4px 8px',borderRadius:'6px',fontSize:'12px',fontWeight:600}}
                >
                  {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} / 5</option>)}
                </select>
              </div>

              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:'12.5px',fontWeight:600,color:'#334155'}}>Communication, Clarity & Team Culture:</span>
                <select
                  value={commRating}
                  onChange={e=>setCommRating(Number(e.target.value))}
                  style={{padding:'4px 8px',borderRadius:'6px',fontSize:'12px',fontWeight:600}}
                >
                  {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} / 5</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Qualitative Notes */}
          <div style={{marginBottom:'20px'}}>
            <label style={{display:'block',fontSize:'12.5px',fontWeight:700,color:'#334155',marginBottom:'6px'}}>
              Interviewer Qualitative Feedback & Justification *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Detail candidate's strengths, any technical gaps observed, response quality to architecture challenges, and next-round recommendations..."
              value={comments}
              onChange={e => setComments(e.target.value)}
              style={{
                width:'100%',
                padding:'10px 12px',
                borderRadius:'8px',
                border:'1.5px solid #cbd5e1',
                fontSize:'13px',
                resize:'vertical'
              }}
            />
          </div>

          {/* Actions */}
          <div style={{display:'flex',justifyContent:'flex-end',gap:'10px',borderTop:'1px solid #e2e8f0',paddingTop:'16px'}}>
            <button type="button" className="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="primary"
              disabled={submitting}
              style={{
                padding:'10px 22px',
                fontSize:'13.5px',
                fontWeight:700,
                background:'#059669',
                display:'inline-flex',
                alignItems:'center',
                gap:'6px'
              }}
            >
              {submitting ? 'Saving Scorecard...' : <><Check size={16}/> Record Evaluation</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

