import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workflowAPI } from '../services/api';
import { extractWorkflow } from '../utils/parser';
import { Plus, Search, Trash2, Copy, Power } from 'lucide-react';

export default function WorkflowsPage() {
  const navigate   = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');

  const fetch = async () => {
    try { const res = await workflowAPI.list(); setWorkflows(res.data || []); }
    catch {} finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const handleOpen = async (id) => {
    try {
      const res = await workflowAPI.getById(id);
      const ext = extractWorkflow(res.data);
      navigate('/builder', { state: { rawJson: res.data, extracted: ext } });
    } catch {}
  };

  const handleDuplicate = async (id) => {
    try { await workflowAPI.duplicate(id); fetch(); } catch {}
  };

  const handleToggle = async (wf) => {
    const id = wf.workflow_id || wf.id || wf._id;
    try {
      if (wf.status === 'active') await workflowAPI.deactivate(id);
      else await workflowAPI.activate(id);
      fetch();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this workflow?')) return;
    try { await workflowAPI.delete(id); fetch(); } catch {}
  };

  const filtered = workflows.filter(w => (w.name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Workflows</h1>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          <Plus size={16} /> New Workflow
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom:16, position:'relative', maxWidth:320 }}>
        <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
        <input className="input" placeholder="Search workflows…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft:32 }} />
      </div>

      {loading ? (
        <p style={{ color:'var(--text-muted)' }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="card card-body" style={{ textAlign:'center', padding:48, color:'var(--text-muted)' }}>
          {search ? 'No matching workflows.' : 'No workflows yet. Create your first one!'}
        </div>
      ) : (
        <div className="card">
          <table className="wf-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Steps</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign:'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(wf => {
                const id = wf.workflow_id || wf.id || wf._id;
                return (
                  <tr key={id}>
                    <td>
                      <span style={{ cursor:'pointer', fontWeight:500, color:'var(--accent-blue)' }} onClick={() => handleOpen(id)}>
                        {wf.name || 'Untitled'}
                      </span>
                    </td>
                    <td>{wf.steps?.length ?? 0}</td>
                    <td>
                      <span className={`badge ${wf.status === 'active' ? 'badge-success' : 'badge-inactive'}`}>
                        {wf.status === 'active' ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ fontSize:12, color:'var(--text-muted)' }}>
                      {wf.created_at ? new Date(wf.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ textAlign:'right' }}>
                      <div style={{ display:'flex', gap:4, justifyContent:'flex-end' }}>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Open" onClick={() => handleOpen(id)}>📂</button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Duplicate" onClick={() => handleDuplicate(id)}><Copy size={13}/></button>
                        <button className="btn btn-ghost btn-icon btn-sm" title={wf.status==='active'?'Deactivate':'Activate'} onClick={() => handleToggle(wf)}>
                          <Power size={13} style={{ color: wf.status==='active' ? 'var(--accent-green)' : 'var(--text-muted)' }} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Delete" onClick={() => handleDelete(id)}><Trash2 size={13} style={{color:'var(--accent-red)'}}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
