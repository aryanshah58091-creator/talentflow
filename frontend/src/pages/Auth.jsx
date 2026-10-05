import React, { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, BriefcaseBusiness, Users, KanbanSquare, CalendarDays, Bell, LogOut, Plus, Search, ArrowUpRight, CheckCircle2, Building2, X, Clock, MapPin, DollarSign, Send, Sparkles, ChevronRight, Filter, Compass, FileText, Award, Brain, AlertTriangle, ShieldCheck, Check, RotateCcw, HelpCircle, Video, Calendar, Star, MessageSquare, ExternalLink, CalendarPlus, Copy, CheckCheck, BarChart3, TrendingUp, UploadCloud, Download } from 'lucide-react';
import { api, uploadResumeFile } from '../api';

export default function Auth({onLogin}){
  const [mode,setMode]=useState('login');

  const [form,setForm]=useState({
    username:'demo_recruiter',
    email:'recruiter@talentflow.local',
    password:'DemoPass123!',
    first_name:'Alex',
    last_name:'Recruiter',
    role:'recruiter'
  });

  const [err,setErr]=useState('');
  const [loading,setLoading]=useState(false);

  const setDemoCredentials=(role)=>{
    if(role==='recruiter'){
      setForm({
        ...form,
        username:'demo_recruiter',
        email:'recruiter@talentflow.local',
        password:'DemoPass123!',
        role:'recruiter'
      });
    }else{
      setForm({
        ...form,
        username:'demo_candidate',
        email:'candidate@talentflow.local',
        password:'DemoPass123!',
        role:'candidate'
      });
    }
  };

  const submit=async e=>{
    e.preventDefault();
    setErr('');
    setLoading(true);

    try{
      let data;

      if(mode==='login'){
        data=await api('/auth/token/',{
          method:'POST',
          body:JSON.stringify({
            username:form.username,
            password:form.password
          })
        });
      }else{
        data=await api('/accounts/register/',{
          method:'POST',
          body:JSON.stringify(form)
        });
      }

      const authToken = data.token;
      localStorage.setItem('tf_token', authToken);

      let u = mode === 'login'
        ? await api('/accounts/me/', {
            headers: {
              Authorization: `Token ${authToken}`
            }
          })
        : data.user;

      localStorage.setItem('tf_user', JSON.stringify(u));
      onLogin(u);
    }catch(e){
      setErr(e.message);
    }finally{
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="authCard">
        <div className="brand big">
          <span className="sparkleIcon">✦</span>Talent<span className="accentText">Flow</span>
        </div>

        <p className="muted">
          Modern AI-assisted recruitment platform
        </p>

        <div style={{display:'flex',background:'#f1f5f9',padding:'4px',borderRadius:'12px',marginBottom:'20px'}}>
          <button
            type="button"
            style={{
              flex:1,
              border:0,
              padding:'8px',
              borderRadius:'9px',
              fontSize:'13px',
              fontWeight:600,
              cursor:'pointer',
              background:mode==='login'?'#fff':'transparent',
              color:mode==='login'?'#0f172a':'#64748b',
              boxShadow:mode==='login'?'0 2px 6px rgba(0,0,0,0.06)':'none',
              transition:'all 0.2s'
            }}
            onClick={()=>setMode('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            style={{
              flex:1,
              border:0,
              padding:'8px',
              borderRadius:'9px',
              fontSize:'13px',
              fontWeight:600,
              cursor:'pointer',
              background:mode==='register'?'#fff':'transparent',
              color:mode==='register'?'#0f172a':'#64748b',
              boxShadow:mode==='register'?'0 2px 6px rgba(0,0,0,0.06)':'none',
              transition:'all 0.2s'
            }}
            onClick={()=>setMode('register')}
          >
            Create Account
          </button>
        </div>

        {err&&<div className="alert alertError"><span>{err}</span></div>}

        <form onSubmit={submit}>
          {mode==='register'&&(
            <>
              <div className="formRow">
                <input
                  placeholder="First name"
                  value={form.first_name}
                  onChange={e=>
                    setForm({...form,first_name:e.target.value})
                  }
                  required
                />

                <input
                  placeholder="Last name"
                  value={form.last_name}
                  onChange={e=>
                    setForm({...form,last_name:e.target.value})
                  }
                  required
                />
              </div>

              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <label style={{fontSize:'12.5px',fontWeight:600,color:'#475569'}}>Account Role:</label>
                <select
                  value={form.role}
                  onChange={e=>
                    setForm({...form,role:e.target.value})
                  }
                >
                  <option value="candidate">Candidate (Job Seeker)</option>
                  <option value="recruiter">Recruiter (Hiring Manager)</option>
                </select>
              </div>
            </>
          )}

          <input
            placeholder="Username"
            value={form.username}
            onChange={e=>
              setForm({...form,username:e.target.value})
            }
            required
          />

          {mode==='register'&&(
            <input
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={e=>
                setForm({...form,email:e.target.value})
              }
              required
            />
          )}

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e=>
              setForm({...form,password:e.target.value})
            }
            required
          />

          <button className="primary wide" disabled={loading}>
            {loading?'Authenticating...':(mode==='login'?'Sign In to TalentFlow':'Create Account')}
            <ArrowUpRight size={15}/>
          </button>
        </form>

        <div className="demoBox">
          <span>⚡ Quick Demo Access</span>
          <div className="demoActions">
            <button
              type="button"
              className="demoBtn"
              onClick={()=>{
                setDemoCredentials('recruiter');
                setMode('login');
              }}
            >
              Demo Recruiter
            </button>
            <button
              type="button"
              className="demoBtn"
              onClick={()=>{
                setDemoCredentials('candidate');
                setMode('login');
              }}
            >
              Demo Candidate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

