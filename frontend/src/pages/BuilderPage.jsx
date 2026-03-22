import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNodesState, useEdgesState, addEdge } from 'reactflow';
import FlowCanvas from '../components/FlowCanvas';
import LeftSidebar from '../components/LeftSidebar';
import RightConfigPanel from '../components/RightConfigPanel';
import AddNodeModal from '../components/AddNodeModal';
import ToastContainer from '../components/Toast';
import { parseWorkflowToReactFlow, prepareForSave, extractWorkflow } from '../utils/parser';
import { workflowAPI } from '../services/api';
import { Save, Trash2, Play, Copy } from 'lucide-react';

export default function BuilderPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { rawJson, extracted } = location.state ?? {};
  const rfInstance = useRef(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowId, setWorkflowId]      = useState(null);
  const [workflowName, setWorkflowName]  = useState('Untitled Workflow');
  const [isActive, setIsActive]          = useState(false);
  const [toasts, setToasts]              = useState([]);
  const [saving, setSaving]              = useState(false);
  const [refreshLogs, setRefreshLogs]    = useState(0);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [addModal, setAddModal] = useState(null);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  const onConnect = useCallback(p => setEdges(eds => addEdge({ ...p, type:'smoothstep', style:{stroke:'#c5cdd6',strokeWidth:1.5} }, eds)), [setEdges]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  /* ── Mount ── */
  useEffect(() => {
    if (!extracted) {
      const savedId = sessionStorage.getItem('currentWorkflowId');
      if (savedId) {
        setWorkflowId(savedId);
        workflowAPI.getById(savedId).then(res => {
          if (!res.data) return;
          const ext = extractWorkflow(res.data);
          const { nodes: n, edges: e } = parseWorkflowToReactFlow(ext);
          setNodes(n); setEdges(e);
          setWorkflowName(ext.name || 'Untitled Workflow');
          setIsActive(ext.settings?.status === 'active');
        }).catch(() => {});
      }
      return;
    }
    const init = async () => {
      const existingId = rawJson?.workflow_id || rawJson?.id || rawJson?._id;
      if (existingId) {
        setWorkflowId(existingId);
        sessionStorage.setItem('currentWorkflowId', existingId);
      } else {
        try {
          const res = await workflowAPI.import(rawJson);
          const newId = res.data.workflow_id;
          setWorkflowId(newId);
          sessionStorage.setItem('currentWorkflowId', newId);
        } catch {}
      }
      const { nodes: n, edges: e } = parseWorkflowToReactFlow(extracted);
      setNodes(n); setEdges(e);
      setWorkflowName(extracted.name || 'Untitled Workflow');
      setIsActive(extracted.settings?.status === 'active');
    };
    init();
  }, []); // eslint-disable-line

  /* ── Event listeners ── */
  useEffect(() => {
    const handleAddBelow = (e) => {
      const { sourceNodeId } = e.detail;
      const sourceNode = nodes.find(n => n.data.stepId === sourceNodeId || n.id === sourceNodeId);
      setAddModal({
        sourceNodeId: sourceNode?.id || sourceNodeId,
        sourcePosition: sourceNode?.position || { x: 300, y: 200 },
      });
    };
    const handleRemove = (e) => {
      const { nodeId } = e.detail;
      setNodes(nds => nds.filter(n => n.id !== nodeId && n.data.stepId !== nodeId));
      setEdges(eds => eds.filter(ed => ed.source !== nodeId && ed.target !== nodeId));
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
      showToast('Node removed', 'info');
    };
    window.addEventListener('add-node-below', handleAddBelow);
    window.addEventListener('remove-node', handleRemove);
    return () => {
      window.removeEventListener('add-node-below', handleAddBelow);
      window.removeEventListener('remove-node', handleRemove);
    };
  }, [nodes, selectedNodeId, setNodes, setEdges, showToast]);

  /* ── Handlers ── */
  const handleSave = async () => {
    if (!workflowId) { showToast('No workflow ID — import first', 'error'); return; }
    setSaving(true);
    try {
      const payload = prepareForSave(nodes, edges, workflowName);
      await workflowAPI.update(workflowId, payload);
      showToast('Workflow saved', 'success');
    } catch (err) {
      showToast(`Save failed: ${err.response?.data?.detail ?? err.message}`, 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!workflowId || !window.confirm('Delete this workflow permanently?')) return;
    try {
      await workflowAPI.delete(workflowId);
      sessionStorage.removeItem('currentWorkflowId');
      showToast('Workflow deleted', 'success');
      navigate('/');
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  const handleExecute = async () => {
    if (!workflowId) { showToast('Save first before executing', 'error'); return; }
    try {
      const res = await workflowAPI.execute(workflowId);
      showToast(`Executed: ${res.data.status}`, res.data.status === 'success' ? 'success' : 'warning');
      setRefreshLogs(r => r + 1);
    } catch (err) {
      showToast(`Execution failed: ${err.response?.data?.detail ?? err.message}`, 'error');
    }
  };

  const handleActivate = async () => {
    if (!workflowId) return;
    try {
      if (isActive) { await workflowAPI.deactivate(workflowId); setIsActive(false); showToast('Deactivated', 'info'); }
      else          { await workflowAPI.activate(workflowId);   setIsActive(true);  showToast('Activated', 'success'); }
    } catch {}
  };

  const handleCopyUrl = () => {
    if (!workflowId) return;
    navigator.clipboard.writeText(`${window.location.origin}/builder?id=${workflowId}`);
    showToast('URL copied to clipboard', 'info');
  };

  const updateNodeConfig = (id, newConfig, newLabel) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, config: newConfig, label: newLabel ?? n.data.label } } : n));
  };

  /* ── Palette drop onto canvas ── */
  const onDrop = useCallback((event) => {
    event.preventDefault();
    const raw = event.dataTransfer.getData('application/quantixone-palette');
    if (!raw) return;
    const flowBounds = event.target.closest('.react-flow')?.getBoundingClientRect();
    if (!flowBounds) return;
    try {
      const payload = JSON.parse(raw);
      const position = {
        x: event.clientX - flowBounds.left,
        y: event.clientY - flowBounds.top,
      };
      const newId = `step_${Date.now()}`;
      const typeMap = { trigger: 'triggerNode', action: 'actionNode', condition: 'conditionNode', delay: 'delayNode' };
      const newNode = {
        id: newId,
        type: typeMap[payload.nodeKind] || 'actionNode',
        position,
        data: { ...payload, stepId: newId, config: { ...(payload.defaultConfig || {}) } },
      };
      setNodes(nds => nds.concat(newNode));
      showToast(`Added ${payload.label}`, 'success');
      setSelectedNodeId(newId);
    } catch {}
  }, [setNodes, showToast]);

  const onDragOver = useCallback(e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }, []);

  /* ── AddNodeModal handler ── */
  const handleAddFromModal = (newNode, newEdge) => {
    setNodes(nds => nds.concat(newNode));
    setEdges(eds => eds.concat(newEdge));
    showToast(`Added ${newNode.data.label}`, 'success');
    setSelectedNodeId(newNode.id);
  };

  /* ── Empty state ── */
  if (!extracted && !workflowId) {
    return (
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontFamily:'var(--font-body)' }}>
        <div style={{ fontSize:42, marginBottom:16 }}>📋</div>
        <h2 style={{ fontWeight:600, marginBottom:8, color:'var(--text-primary)' }}>No workflow loaded</h2>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>← Back to Home</button>
      </div>
    );
  }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* TOPBAR */}
      <div className="topbar">
        <div className="topbar-left">
          <input
            className="workflow-name-input"
            value={workflowName}
            onChange={e => setWorkflowName(e.target.value)}
          />
          <button className={`status-pill ${isActive ? 'active' : 'inactive'}`} onClick={handleActivate}>
            <span className="status-dot" /> {isActive ? 'Active' : 'Inactive'}
          </button>
        </div>
        <div className="topbar-right">
          <button className="btn btn-ghost btn-sm" onClick={handleCopyUrl} title="Copy URL"><Copy size={14} /></button>
          <button className="btn btn-secondary btn-sm" onClick={handleSave} disabled={saving}>
            <Save size={14} /> {saving ? 'Saving…' : 'Save'}
          </button>
          <button className="btn btn-danger btn-sm btn-icon" onClick={handleDelete} title="Delete"><Trash2 size={14} /></button>
        </div>
      </div>

      {/* BUILDER LAYOUT */}
      <div className="builder-layout">
        <LeftSidebar key={refreshLogs} showToast={showToast} workflowId={workflowId} />

        <div className="canvas-area" onDrop={onDrop} onDragOver={onDragOver}>
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onInit={instance => { rfInstance.current = instance; }}
          />
          <button className="canvas-fab" onClick={handleExecute} title="Run Test">
            <Play size={20} />
          </button>
        </div>

        <RightConfigPanel
          selectedNode={selectedNode}
          open={!!selectedNode}
          onClose={() => setSelectedNodeId(null)}
          onUpdate={updateNodeConfig}
        />
      </div>

      {addModal && (
        <AddNodeModal
          sourceNodeId={addModal.sourceNodeId}
          sourcePosition={addModal.sourcePosition}
          onAdd={handleAddFromModal}
          onClose={() => setAddModal(null)}
        />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}
