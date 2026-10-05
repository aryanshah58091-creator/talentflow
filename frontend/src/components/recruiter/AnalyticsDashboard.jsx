import React, { useEffect, useState } from 'react';
import {
  BarChart3, TrendingUp, Clock, Users, Award, ShieldAlert,
  CheckCircle, ArrowRight, RefreshCw, Zap
} from 'lucide-react';
import { api } from '../../api';

export default function AnalyticsDashboard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api('/applications/analytics/');
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <RefreshCw size={28} className="spin" style={{ color: '#2563eb', marginBottom: '12px' }} />
        <p style={{ color: '#64748b' }}>Aggregating recruitment funnel and ATS performance metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '30px', textAlign: 'center', color: '#ef4444' }}>
        <p>{error || 'Unable to display analytics.'}</p>
        <button className="btn" onClick={loadMetrics} style={{ marginTop: '12px' }}>
          Retry
        </button>
      </div>
    );
  }

  const { overview, funnel, conversion_rates, ats_distribution, assessment_metrics, top_skills } = data;

  const funnelStages = [
    { key: 'applied', label: 'Applied', count: funnel.applied, color: '#3b82f6' },
    { key: 'screening', label: 'Screening', count: funnel.screening, color: '#8b5cf6' },
    { key: 'shortlisted', label: 'Shortlisted', count: funnel.shortlisted, color: '#06b6d4' },
    { key: 'interview', label: 'Interview', count: funnel.interview, color: '#f59e0b' },
    { key: 'offer', label: 'Offer', count: funnel.offer, color: '#10b981' },
    { key: 'hired', label: 'Hired', count: funnel.hired, color: '#16a34a' }
  ];

  return (
    <div style={{ padding: '8px 0', animation: 'fadeIn 0.3s ease' }}>
      {/* Top Banner */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '24px', flexWrap: 'wrap', gap: '16px'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={24} color="#2563eb" />
            Recruiter Analytics & Funnel Intelligence
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
            Real-time pipeline velocity, ATS candidate scoring distributions, and assessment outcomes.
          </p>
        </div>

        <button className="btn" onClick={loadMetrics} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats" style={{ marginBottom: '24px' }}>
        <div className="stat">
          <div className="statTop">
            <div className="statIcon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Users size={20} />
            </div>
            <span className="statBadge">Total Pool</span>
          </div>
          <small>Total Applications</small>
          <strong>{overview.total_applications}</strong>
        </div>

        <div className="stat">
          <div className="statTop">
            <div className="statIcon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Clock size={20} />
            </div>
            <span className="statBadge">Velocity</span>
          </div>
          <small>Avg. Time-to-Hire</small>
          <strong>{overview.avg_time_to_hire_days} <span style={{ fontSize: '14px', fontWeight: 500 }}>days</span></strong>
        </div>

        <div className="stat">
          <div className="statTop">
            <div className="statIcon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <Zap size={20} />
            </div>
            <span className="statBadge">ATS Match</span>
          </div>
          <small>Mean ATS Score</small>
          <strong>{ats_distribution.average_score}%</strong>
        </div>

        <div className="stat">
          <div className="statTop">
            <div className="statIcon" style={{ background: '#fdf2f8', color: '#db2777' }}>
              <Award size={20} />
            </div>
            <span className="statBadge">Test Pass</span>
          </div>
          <small>Assessment Pass Rate</small>
          <strong>{assessment_metrics.pass_rate}%</strong>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Recruitment Pipeline Funnel Card */}
        <div style={{
          background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="#2563eb" />
            Recruitment Funnel Breakdown
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {funnelStages.map((stage, idx) => {
              const maxCount = Math.max(overview.total_applications, 1);
              const pct = Math.round((stage.count / maxCount) * 100);
              return (
                <div key={stage.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{stage.label}</span>
                    <span style={{ color: '#64748b' }}>{stage.count} candidate{stage.count !== 1 ? 's' : ''} ({pct}%)</span>
                  </div>
                  <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.max(pct, stage.count > 0 ? 6 : 0)}%`,
                      height: '100%',
                      background: stage.color,
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Key conversion ratios */}
          <div style={{
            marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9',
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px'
          }}>
            <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Shortlist Rate</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#06b6d4' }}>
                {conversion_rates.screening_to_shortlist || 0}%
              </div>
            </div>
            <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Interview → Offer</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981' }}>
                {conversion_rates.interview_to_offer || 0}%
              </div>
            </div>
          </div>
        </div>

        {/* ATS Quality & AI Scoring Distribution */}
        <div style={{
          background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} color="#8b5cf6" />
            AI ATS Match Distribution
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <div style={{ textAlign: 'center', padding: '14px', background: '#ecfdf5', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#059669' }}>{ats_distribution.high_fit}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#065f46' }}>High Fit (≥80%)</div>
            </div>
            <div style={{ textAlign: 'center', padding: '14px', background: '#fef3c7', borderRadius: '12px', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#d97706' }}>{ats_distribution.moderate_fit}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#92400e' }}>Moderate (60-79%)</div>
            </div>
            <div style={{ textAlign: 'center', padding: '14px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#dc2626' }}>{ats_distribution.low_fit}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#991b1b' }}>Low Fit (&lt;60%)</div>
            </div>
          </div>

          <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '16px 0 8px', color: '#334155' }}>Top In-Demand Skills Required</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {top_skills && top_skills.length > 0 ? (
              top_skills.map((s, i) => (
                <span key={i} style={{
                  padding: '6px 12px', background: '#f1f5f9', borderRadius: '20px',
                  fontSize: '12px', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  {s.skill}
                  <span style={{ background: '#2563eb', color: '#fff', borderRadius: '10px', padding: '1px 6px', fontSize: '10px' }}>
                    {s.jobs_requiring}
                  </span>
                </span>
              ))
            ) : (
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>No skills configured yet.</span>
            )}
          </div>

          {/* Assessment Integrity Notice */}
          <div style={{
            marginTop: '20px', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px',
            border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <ShieldAlert size={18} color="#d97706" />
            <span style={{ fontSize: '12px', color: '#475569' }}>
              Proctoring integrity check: <strong>{assessment_metrics.avg_violations_per_candidate}</strong> avg tab switches per assessment.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
