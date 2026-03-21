import React, { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNodesState, useEdgesState, addEdge } from 'reactflow';
import FlowCanvas from '../components/FlowCanvas';
import ExecutionLogs from '../components/ExecutionLogs';
import ContactsPanel from '../components/ContactsPanel';
import OpportunitiesPanel from '../components/OpportunitiesPanel';
import ExecutePanel from '../components/ExecutePanel';
import ToastContainer from '../components/Toast';
import { parseWorkflowToReactFlow, prepareForSave } from '../utils/parser';
import { workflowAPI } from '../services/api';

const BuilderPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { rawJson, extracted } = location.state ?? {};

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowId, setWorkflowId]      = useState(null);
  const [workflowName, setWorkflowName]  = useState('Untitled Workflow');
  const [isActive, setIsActive]          = useState(false);
  const [isLocked, setIsLocked]          = useState(false);
  const [toasts, setToasts]              = useState([]);
  const [saving, setSaving]              = useState(false);
  const [refreshLogs, setRefreshLogs]    = useState(0);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  // On mount: import workflow and set up canvas
  useEffect(() => {
    if (!extracted) return;

    const init = async () => {
      // Import workflow to backend
      try {
        const res = await workflowAPI.import(rawJson);
        setWorkflowId(res.data.workflow_id);
      } catch (err) {
        console.error('Import failed, trying as update', err);
        // If it's already imported (e.g., loaded from DB), use existing ID
        const id = rawJson?.workflow_id || rawJson?.id || rawJson?._id;
        if (id) setWorkflowId(id);
      }

      // Parse to ReactFlow
      const { nodes: n, edges: e } = parseWorkflowToReactFlow(extracted);
      setNodes(n);
      setEdges(e);
      setWorkflowName(extracted.name || 'Untitled Workflow');
      setIsActive(extracted.settings?.status === 'active');
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handlers
  const handleSave = async () => {
    if (!workflowId) { showToast('No workflow ID — import first', 'error'); return; }
    setSaving(true);
    try {
      const payload = prepareForSave(nodes, edges, workflowName);
      await workflowAPI.update(workflowId, payload);
      showToast('✓ Workflow saved', 'success');
    } catch (err) {
      showToast(`Save failed: ${err.response?.data?.detail ?? err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExecute = async () => {
    if (!workflowId) { showToast('Save first before executing', 'error'); return; }
    try {
      const res = await workflowAPI.execute(workflowId);
      showToast(`✓ Workflow executed: ${res.data.status}`, res.data.status === 'success' ? 'success' : 'warning');
      setRefreshLogs(r => r + 1);
    } catch (err) {
      showToast(`Execution failed: ${err.response?.data?.detail ?? err.message}`, 'error');
    }
  };

  const handleDelete = async () => {
    if (!workflowId) return;
    if (!confirm('Delete this workflow permanently?')) return;
    try {
      await workflowAPI.delete(workflowId);
      showToast('Workflow deleted', 'info');
      navigate('/');
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  const handleActivate = async () => {
    if (!workflowId) return;
    try {
      if (isActive) {
        await workflowAPI.deactivate(workflowId);
        setIsActive(false);
        showToast('Workflow deactivated', 'info');
      } else {
        await workflowAPI.activate(workflowId);
        setIsActive(true);
        showToast('Workflow activated', 'success');
      }
    } catch (err) {
      showToast(`Failed: ${err.message}`, 'error');
    }
  };

  // If no state, show empty view
  if (!extracted) {
    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        fontFamily: 'Inter, sans-serif', color: '#475569',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <h2 style={{ fontWeight: 600, marginBottom: 8 }}>No workflow loaded</h2>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '8px 20px', fontSize: 14, fontWeight: 500,
            color: '#4f46e5', background: '#eef2ff',
            border: '1px solid #c7d2fe', borderRadius: 8, cursor: 'pointer',
          }}
        >
          ← Back to Upload
        </button>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>
      {/* ── TOPBAR ───────────────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e2e8f0',
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6,
              padding: '5px 12px', fontSize: 13, cursor: 'pointer', color: '#475569',
            }}
          >
            ← Back
          </button>
          <input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            style={{
              background: 'transparent', border: 'none', fontSize: 16, fontWeight: 600,
              color: '#0f172a', fontFamily: 'Outfit, sans-serif', outline: 'none',
              borderBottom: '1px dashed transparent', width: 260,
            }}
            onFocus={(e) => { e.target.style.borderBottom = '1px dashed #a5b4fc'; }}
            onBlur={(e) => { e.target.style.borderBottom = '1px dashed transparent'; }}
          />
          <button
            onClick={handleActivate}
            style={{
              fontSize: 11, fontWeight: 600,
              padding: '3px 10px', borderRadius: 12, cursor: 'pointer',
              border: 'none',
              background: isActive ? 'rgba(22,163,74,0.12)' : 'rgba(148,163,184,0.15)',
              color: isActive ? '#16a34a' : '#94a3b8',
            }}
          >
            ● {isActive ? 'Active' : 'Inactive'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSave} disabled={saving} className="action-btn primary" style={{ padding: '6px 14px', fontSize: 13 }}>
            {saving ? '⏳ Saving…' : '💾 Save'}
          </button>
          <button onClick={handleExecute} className="action-btn success" style={{ padding: '6px 14px', fontSize: 13 }}>
            ▶ Execute
          </button>
          <button onClick={handleDelete} className="action-btn danger" style={{ padding: '6px 14px', fontSize: 13 }}>
            🗑 Delete
          </button>
        </div>
      </div>

      {/* ── MAIN LAYOUT ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Canvas — 65% */}
        <div style={{ flex: '0 0 65%', position: 'relative' }}>
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isLocked={isLocked}
            setIsLocked={setIsLocked}
          />
        </div>

        {/* Sidebar — 35% */}
        <div style={{
          flex: '0 0 35%',
          borderLeft: '1px solid #e2e8f0',
          overflowY: 'auto',
          padding: '12px',
          background: '#fafbfc',
        }}>
          <ExecutionLogs
            key={refreshLogs}
            currentWorkflowId={workflowId}
          />

          <ContactsPanel showToast={showToast} />

          <OpportunitiesPanel showToast={showToast} />

          <ExecutePanel
            workflowId={workflowId}
            onExecuted={() => setRefreshLogs(r => r + 1)}
            showToast={showToast}
          />
        </div>
      </div>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} />
    </div>
  );
};

export default BuilderPage;
