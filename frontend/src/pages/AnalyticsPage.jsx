import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';

const AnalyticsPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getSummary().then(res => {
      setSummary(res.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ padding: '32px', background: '#f8fafc', minHeight: '100%', flex: 1, fontFamily: 'Inter, sans-serif', overflowY: 'auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', marginBottom: '24px', fontFamily: 'Outfit, sans-serif' }}>Global Analytics</h1>

      {loading ? (
        <div style={{ color: '#64748b' }}>Loading analytics...</div>
      ) : !summary ? (
        <div style={{ color: '#ef4444' }}>Failed to load analytics.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <StatCard title="Total Workflows" value={summary.total_workflows ?? 0} />
          <StatCard title="Total Executions" value={summary.total_executions ?? 0} />
          <StatCard title="Success Rate" value={`${summary.success_rate?.toFixed(1) ?? 0}%`} color="#16a34a" />
          <StatCard title="Failed Executions" value={summary.failed_executions ?? 0} color="#dc2626" />
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, color = '#0f172a' }) => (
  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, marginBottom: '8px' }}>{title}</div>
    <div style={{ fontSize: '28px', fontWeight: 700, color, fontFamily: 'Outfit, sans-serif' }}>{value}</div>
  </div>
);

export default AnalyticsPage;
