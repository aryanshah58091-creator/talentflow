import React, { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, BriefcaseBusiness, Users, KanbanSquare, CalendarDays, Bell, LogOut, Plus, Search, ArrowUpRight, CheckCircle2, Building2, X, Clock, MapPin, DollarSign, Send, Sparkles, ChevronRight, Filter, Compass, FileText, Award, Brain, AlertTriangle, ShieldCheck, Check, RotateCcw, HelpCircle, Video, Calendar, Star, MessageSquare, ExternalLink, CalendarPlus, Copy, CheckCheck, BarChart3, TrendingUp, UploadCloud, Download } from 'lucide-react';
import { api, uploadResumeFile } from '../../api';

export default function NotificationDrawer({ notifications, apps, onClose, onMarkRead, onMarkAllRead, onOpenAssessment }) {
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="notificationDrawer">
      <div className="notificationDrawerHeader">
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <b style={{fontSize:'14px',color:'#0f172a'}}>Notifications</b>
          {unreadCount > 0 && (
            <span className="pill" style={{background:'#fee2e2',color:'#ef4444',borderColor:'#fca5a5',fontSize:'11px',padding:'2px 7px'}}>
              {unreadCount} new
            </span>
          )}
        </div>
        <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
          {unreadCount > 0 && (
            <button
              type="button"
              className="ghost"
              style={{fontSize:'11.5px',padding:'3px 8px'}}
              onClick={onMarkAllRead}
            >
              Mark all read
            </button>
          )}
          <button type="button" className="ghost" style={{padding:'2px',color:'#64748b'}} onClick={onClose}>
            <X size={16}/>
          </button>
        </div>
      </div>

      <div className="notificationDrawerList">
        {notifications.length === 0 ? (
          <div style={{padding:'32px 20px',textAlign:'center',color:'#94a3b8',fontSize:'13px'}}>
            <Bell size={24} style={{margin:'0 auto 8px',opacity:0.4,display:'block'}}/>
            No notifications yet
          </div>
        ) : (
          notifications.map(n => {
            const isAptitude = n.title.toLowerCase().includes('aptitude') || n.title.toLowerCase().includes('shortlist');
            const matchedApp = apps.find(a => a.status === 'shortlisted' || (n.message && a.job_title && n.message.includes(a.job_title)));

            return (
              <div key={n.id} className={`notificationItem ${!n.is_read ? 'unread' : ''}`}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: isAptitude ? '#ede9fe' : '#f1f5f9',
                  color: isAptitude ? '#7c3aed' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {isAptitude ? <Brain size={16}/> : <Bell size={16}/>}
                </div>

                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                    <b style={{fontSize:'13px',color: isAptitude ? '#5b21b6' : '#1e293b'}}>
                      {n.title}
                    </b>
                    <span style={{fontSize:'10.5px',color:'#94a3b8',whiteSpace:'nowrap',marginLeft:'6px'}}>
                      {new Date(n.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                    </span>
                  </div>

                  <p style={{margin:'4px 0 6px',fontSize:'12.5px',lineHeight:'1.4',color:'#475569'}}>
                    {n.message}
                  </p>

                  <div style={{display:'flex',gap:'8px',alignItems:'center',marginTop:'6px'}}>
                    {isAptitude && matchedApp && (!matchedApp.assessment_info || matchedApp.assessment_info.status !== 'completed') && (
                      <button
                        type="button"
                        className="primary"
                        style={{
                          padding: '4px 10px',
                          fontSize: '11.5px',
                          borderRadius: '6px',
                          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontWeight: 700
                        }}
                        onClick={() => {
                          onOpenAssessment(matchedApp);
                          if (!n.is_read) onMarkRead(n.id);
                          onClose();
                        }}
                      >
                        <Brain size={12}/> Take Assessment Now
                      </button>
                    )}

                    {!n.is_read && (
                      <button
                        type="button"
                        className="ghost"
                        style={{fontSize:'11px',padding:'2px 6px',color:'#64748b'}}
                        onClick={() => onMarkRead(n.id)}
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

