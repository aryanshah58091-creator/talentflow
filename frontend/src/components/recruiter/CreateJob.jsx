import React, { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, BriefcaseBusiness, Users, KanbanSquare, CalendarDays, Bell, LogOut, Plus, Search, ArrowUpRight, CheckCircle2, Building2, X, Clock, MapPin, DollarSign, Send, Sparkles, ChevronRight, Filter, Compass, FileText, Award, Brain, AlertTriangle, ShieldCheck, Check, RotateCcw, HelpCircle, Video, Calendar, Star, MessageSquare, ExternalLink, CalendarPlus, Copy, CheckCheck, BarChart3, TrendingUp, UploadCloud, Download } from 'lucide-react';
import { api, uploadResumeFile } from '../../api';

export default function CreateJob({onDone}){
  const [skills,setSkills]=useState([]);
  const [selectedSkills,setSelectedSkills]=useState([]);

  const [f,setF]=useState({
    title:'Senior Python Developer',
    company_name:'',
    description:'Build reliable backend services and APIs.',
    requirements:'Django, REST APIs, PostgreSQL, Git',
    location:'Chennai, India',
    employment_type:'full_time',
    workplace:'hybrid',
    experience_level:'2+ years',
    status:'published'
  });

  useEffect(()=>{
    api('/jobs/skills/')
      .then(data=>setSkills(data.results||data))
      .catch(e=>alert(e.message));
  },[]);

  const toggleSkill=(id)=>{
    setSelectedSkills(prev=>
      prev.includes(id)
        ?prev.filter(skillId=>skillId!==id)
        :[...prev,id]
    );
  };

  const submit=async e=>{
    e.preventDefault();

    try{
      await api('/jobs/',{
        method:'POST',
        body:JSON.stringify({
          ...f,
          skill_ids:selectedSkills
        })
      });

      onDone();
    }catch(e){
      alert(e.message);
    }
  };

  return (
    <div className="card formCard">
      <h3>Create a new role</h3>

      <form onSubmit={submit}>
        <div className="formRow">
          <input
            placeholder="Job title (e.g. Senior Backend Engineer)"
            value={f.title}
            onChange={e=>
              setF({...f,title:e.target.value})
            }
            required
            style={{flex:1.2}}
          />

          <input
            placeholder="Hiring Company (e.g. Acme Corp / Your Org)"
            value={f.company_name}
            onChange={e=>
              setF({...f,company_name:e.target.value})
            }
            style={{flex:1}}
          />
        </div>

        <textarea
          placeholder="Description"
          value={f.description}
          onChange={e=>
            setF({...f,description:e.target.value})
          }
        />

        <textarea
          placeholder="Requirements"
          value={f.requirements}
          onChange={e=>
            setF({...f,requirements:e.target.value})
          }
        />

        <div className="formRow">
          <input
            placeholder="Location"
            value={f.location}
            onChange={e=>
              setF({...f,location:e.target.value})
            }
          />

          <select
            value={f.workplace}
            onChange={e=>
              setF({...f,workplace:e.target.value})
            }
          >
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site</option>
          </select>
        </div>

        <div className="skillSection">
          <label>Skills</label>

          <div className="skillOptions">
            {skills.map(skill=>(
              <button
                type="button"
                key={skill.id}
                className={
                  selectedSkills.includes(skill.id)
                    ?'skill selected'
                    :'skill'
                }
                onClick={()=>toggleSkill(skill.id)}
              >
                {skill.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <button className="primary">
            Publish job
          </button>
        </div>
      </form>
    </div>
  );
}

