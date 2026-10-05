import React, { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, BriefcaseBusiness, Users, KanbanSquare, CalendarDays, Bell, LogOut, Plus, Search, ArrowUpRight, CheckCircle2, Building2, X, Clock, MapPin, DollarSign, Send, Sparkles, ChevronRight, Filter, Compass, FileText, Award, Brain, AlertTriangle, ShieldCheck, Check, RotateCcw, HelpCircle, Video, Calendar, Star, MessageSquare, ExternalLink, CalendarPlus, Copy, CheckCheck, BarChart3, TrendingUp, UploadCloud, Download } from 'lucide-react';
import { api, uploadResumeFile } from '../../api';

export default function ScheduleInterviewModal({ apps, initialAppId, onClose, onScheduled }) {
  const [modalApps, setModalApps] = useState(apps && apps.length > 0 ? apps : []);
  const [loadingApps, setLoadingApps] = useState(false);

  useEffect(() => {
    if ((!apps || apps.length === 0) && (!modalApps || modalApps.length === 0)) {
      setLoadingApps(true);
      api('/applications/')
        .then(data => {
          const list = data.results || data || [];
          setModalApps(list);
        })
        .catch(err => console.error("Could not load candidates for interview:", err))
        .finally(() => setLoadingApps(false));
    } else if (apps && apps.length > 0) {
      setModalApps(apps);
    }
  }, [apps]);

  const nonRejected = modalApps.filter(a => a.status !== 'rejected');
  const candidateOptions = nonRejected.length > 0 ? nonRejected : modalApps;

  const [selectedAppId, setSelectedAppId] = useState(() => {
    if (initialAppId) return String(initialAppId);
    return candidateOptions[0] ? String(candidateOptions[0].id) : '';
  });

  useEffect(() => {
    if ((!selectedAppId || !candidateOptions.some(a => String(a.id) === String(selectedAppId))) && candidateOptions.length > 0) {
      const initial = initialAppId ? String(initialAppId) : String(candidateOptions[0].id);
      setSelectedAppId(initial);
    }
  }, [candidateOptions, initialAppId, selectedAppId]);

  const [roundPreset, setRoundPreset] = useState('Technical Assessment & Live Coding');
  const [customRound, setCustomRound] = useState('');
  const [interviewTime, setInterviewTime] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(14, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [mode, setMode] = useState('Online Video (Google Meet)');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/tf-meet-' + Math.random().toString(36).substring(2, 6));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const presets = [
    'Initial HR Screening',
    'Technical Assessment & Live Coding',
    'System Architecture & Design',
    'Cultural & Team Fit',
    'Leadership & Final Round',
    'Custom Round'
  ];

  const generateNewMeetLink = () => {
    const p1 = Math.random().toString(36).substring(2, 5);
    const p2 = Math.random().toString(36).substring(2, 6);
    const p3 = Math.random().toString(36).substring(2, 5);
    setMeetingLink(`https://meet.google.com/${p1}-${p2}-${p3}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppId) {
      alert('Please select a candidate to schedule an interview.');
      return;
    }

    const roundName = roundPreset === 'Custom Round' ? (customRound || 'General Interview Round') : roundPreset;

    let cleanLink = (meetingLink || '').trim();
    if (cleanLink && !cleanLink.startsWith('http://') && !cleanLink.startsWith('https://')) {
      if (cleanLink.includes('.') && !cleanLink.includes(' ')) {
        cleanLink = 'https://' + cleanLink;
      } else {
        cleanLink = `https://talentflow.internal/room?name=${encodeURIComponent(cleanLink)}`;
      }
    }

    setSubmitting(true);
    try {
      await api('/applications/interviews/', {
        method: 'POST',
        body: JSON.stringify({
          application: parseInt(selectedAppId, 10),
          round: roundName,
          interview_time: new Date(interviewTime).toISOString(),
          mode: mode,
          meeting_link: cleanLink,
          status: 'scheduled',
          feedback: notes ? `[Schedule Notes]: ${notes}` : ''
        })
      });
      onScheduled();
    } catch (err) {
      alert('Scheduling failed: ' + (err.message || 'Please check input data.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modalBackdrop" onClick={onClose} style={{overflowY:'auto',padding:'24px 16px',alignItems:'flex-start'}}>
      <div className="modal" style={{maxWidth:'640px',borderRadius:'20px',overflow:'hidden',padding:0,maxHeight:'90vh',display:'flex',flexDirection:'column',margin:'auto'}} onClick={e=>e.stopPropagation()}>
        <div style={{
          background: 'linear-gradient(135deg, #312e81 0%, #4338ca 50%, #4f46e5 100%)',
          color: '#fff',
          padding: '22px 28px',
          position: 'relative',
          flexShrink: 0
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
            <CalendarPlus size={12}/> INTERVIEW ORCHESTRATION
          </span>
          <h2 style={{margin:'4px 0 4px',fontSize:'20px',color:'#fff'}}>Schedule Candidate Interview</h2>
          <p style={{margin:0,fontSize:'13px',color:'#c7d2fe'}}>
            Set round details, virtual meeting link, and notify the applicant automatically.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{padding:'24px 28px',overflowY:'auto',flex:1,minHeight:0}}>
          {/* Candidate Selection */}
          <div style={{marginBottom:'16px'}}>
            <label style={{display:'block',fontSize:'12.5px',fontWeight:700,color:'#334155',marginBottom:'6px'}}>
              Select Candidate & Job Opening *
            </label>
            <select
              value={selectedAppId}
              onChange={e => setSelectedAppId(e.target.value)}
              required
              style={{
                width:'100%',
                padding:'10px 12px',
                borderRadius:'10px',
                border:'1.5px solid #cbd5e1',
                fontSize:'13.5px',
                fontWeight:600,
                color:'#1e293b'
              }}
            >
              {loadingApps ? (
                <option value="">Loading applicants list...</option>
              ) : candidateOptions.length === 0 ? (
                <option value="">No applicants found in system</option>
              ) : (
                candidateOptions.map(app => (
                  <option key={app.id} value={app.id}>
                    {app.candidate_name || `Candidate #${app.id}`} — {app.job_title} ({app.status.toUpperCase()}{app.match_score ? ` • ${app.match_score}% Match` : ''})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Round Preset Buttons */}
          <div style={{marginBottom:'16px'}}>
            <label style={{display:'block',fontSize:'12.5px',fontWeight:700,color:'#334155',marginBottom:'6px'}}>
              Interview Round *
            </label>
            <div className="roundPresetGrid">
              {presets.map(p => (
                <button
                  type="button"
                  key={p}
                  className={`roundPresetBtn ${roundPreset === p ? 'active' : ''}`}
                  onClick={() => setRoundPreset(p)}
                >
                  {p}
                </button>
              ))}
            </div>

            {roundPreset === 'Custom Round' && (
              <input
                type="text"
                placeholder="Enter custom interview round name..."
                value={customRound}
                onChange={e => setCustomRound(e.target.value)}
                required
                style={{
                  width:'100%',
                  padding:'9px 12px',
                  borderRadius:'8px',
                  border:'1.5px solid #cbd5e1',
                  fontSize:'13px',
                  marginTop:'6px'
                }}
              />
            )}
          </div>

          {/* Date & Time Picker */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'16px'}}>
            <div>
              <label style={{display:'block',fontSize:'12.5px',fontWeight:700,color:'#334155',marginBottom:'6px'}}>
                Date & Time (Local) *
              </label>
              <input
                type="datetime-local"
                value={interviewTime}
                onChange={e => setInterviewTime(e.target.value)}
                required
                style={{
                  width:'100%',
                  padding:'9px 12px',
                  borderRadius:'8px',
                  border:'1.5px solid #cbd5e1',
                  fontSize:'13px'
                }}
              />
            </div>

            <div>
              <label style={{display:'block',fontSize:'12.5px',fontWeight:700,color:'#334155',marginBottom:'6px'}}>
                Interview Mode
              </label>
              <select
                value={mode}
                onChange={e => setMode(e.target.value)}
                style={{
                  width:'100%',
                  padding:'9px 12px',
                  borderRadius:'8px',
                  border:'1.5px solid #cbd5e1',
                  fontSize:'13px'
                }}
              >
                <option value="Online Video (Google Meet)">Online Video (Google Meet)</option>
                <option value="Online Video (Zoom)">Online Video (Zoom)</option>
                <option value="Phone Screening">Phone Screening</option>
                <option value="In-Person / Office">In-Person / Office</option>
              </select>
            </div>
          </div>

          {/* Meeting Link with generator */}
          <div style={{marginBottom:'16px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
              <label style={{fontSize:'12.5px',fontWeight:700,color:'#334155'}}>
                Virtual Meeting Link / Location
              </label>
              <button
                type="button"
                className="ghost"
                onClick={generateNewMeetLink}
                style={{fontSize:'11.5px',color:'#4f46e5',padding:'2px 6px',fontWeight:600}}
              >
                ✨ Generate Google Meet Link
              </button>
            </div>
            <input
              type="text"
              placeholder="https://meet.google.com/... or https://zoom.us/... or Room 302"
              value={meetingLink}
              onChange={e => setMeetingLink(e.target.value)}
              onBlur={() => {
                let link = (meetingLink || '').trim();
                if (link && !link.startsWith('http://') && !link.startsWith('https://') && link.includes('.')) {
                  setMeetingLink('https://' + link);
                }
              }}
              style={{
                width:'100%',
                padding:'9px 12px',
                borderRadius:'8px',
                border:'1.5px solid #cbd5e1',
                fontSize:'13px'
              }}
            />
          </div>

          {/* Notes / Agenda */}
          <div style={{marginBottom:'20px'}}>
            <label style={{display:'block',fontSize:'12.5px',fontWeight:700,color:'#334155',marginBottom:'6px'}}>
              Session Agenda / Instructions for Candidate (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Please be ready with your code editor open. We will review the system architecture problem..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{
                width:'100%',
                padding:'9px 12px',
                borderRadius:'8px',
                border:'1.5px solid #cbd5e1',
                fontSize:'13px',
                resize:'vertical'
              }}
            />
          </div>

          {/* Actions */}
          <div style={{
            display:'flex',
            justifyContent:'flex-end',
            gap:'10px',
            borderTop:'1px solid #e2e8f0',
            paddingTop:'16px',
            position:'sticky',
            bottom:0,
            background:'#fff',
            zIndex:10,
            marginTop:'16px'
          }}>
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
                display:'inline-flex',
                alignItems:'center',
                gap:'6px'
              }}
            >
              {submitting ? 'Scheduling...' : <><CalendarPlus size={16}/> Confirm & Dispatch Invite</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

