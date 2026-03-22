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
  const canvasRef = useRef(null);

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

  const onConnect = useCallback(p => setEdges(eds => addEdge({
    ...p,
    type: 'customEdge',
    style: { stroke: '#c5cdd6', strokeWidth: 1.5, strokeDasharray: '6 4' },
    data: { source: p.source, target: p.target },
  }, eds)), [setEdges]);

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
    const handleAddOnEdge = (e) => {
      const { edgeId, sourceNodeId, targetNodeId, insertPosition } = e.detail;
      const sourceNode = nodes.find(n => n.data?.stepId === sourceNodeId || n.id === sourceNodeId);
      setAddModal({
        sourceNodeId,
        targetNodeId,
        edgeId,
        insertPosition: insertPosition || sourceNode?.position || { x: 300, y: 300 },
      });
    };
    const handleRemove = (e) => {
      const { nodeId } = e.detail;
      setNodes(nds => nds.filter(n => n.id !== nodeId && n.data.stepId !== nodeId));
      setEdges(eds => eds.filter(ed => ed.source !== nodeId && ed.target !== nodeId));
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
      showToast('Node removed', 'info');
    };
    window.addEventListener('add-node-on-edge', handleAddOnEdge);
    window.addEventListener('remove-node', handleRemove);
    return () => {
      window.removeEventListener('add-node-on-edge', handleAddOnEdge);
      window.removeEventListener('remove-node', handleRemove);
    };
  }, [nodes, selectedNodeId, setNodes, setEdges, showToast]);

  /* ── Handlers ── */
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = prepareForSave(nodes, edges, workflowName);
      if (workflowId) {
        await workflowAPI.update(workflowId, payload);
        showToast('Workflow saved', 'success');
      } else {
        const res = await workflowAPI.create(payload);
        const newId = res.data?.workflow_id || res.data?.id || res.data?._id;
        if (newId) {
          setWorkflowId(newId);
          sessionStorage.setItem('currentWorkflowId', newId);
        }
        showToast('Workflow created and saved', 'success');
      }
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

  const animateExecution = useCallback((stepLogs) => {
    if (!stepLogs || stepLogs.length === 0) return;

    setNodes(nds => nds.map(n => ({
      ...n, data: { ...n.data, executionStatus: null, isAnimating: false }
    })));
    setEdges(eds => eds.map(e => ({
      ...e,
      style: { stroke: '#c5cdd6', strokeWidth: 1.5, strokeDasharray: '6 4' },
      animated: false,
      data: { ...e.data, traversed: false }
    })));

    function _getUsedHandle(log, status) {
      if (!log) return 'success';
      if (log.step_type === 'condition') return status === 'success' ? 'true' : 'false';
      if (log.step_type === 'delay') return 'complete';
      return status === 'success' ? 'success' : 'failure';
    }

    const logMap = {};
    stepLogs.forEach(log => { logMap[log.step_id] = log; });
    const traversedNodeIds = stepLogs.map(log => log.step_id);

    traversedNodeIds.forEach((nodeId, index) => {
      const log = logMap[nodeId];
      setTimeout(() => {
        setNodes(nds => nds.map(n => {
          const match = n.id === nodeId || n.data?.stepId === nodeId;
          return match ? { ...n, data: { ...n.data, executionStatus: log.status, isAnimating: true } } : n;
        }));

        if (index > 0) {
          const prevNodeId = traversedNodeIds[index - 1];
          const prevLog = logMap[prevNodeId];
          const handle = _getUsedHandle(prevLog, prevLog?.status);
          
          setEdges(eds => eds.map(e => {
            const edgeMatches = e.source === prevNodeId && e.target === nodeId;
            if (!edgeMatches) return e;
            return {
              ...e, animated: true,
              style: { stroke: log.status === 'failed' ? '#e74c3c' : '#27ae60', strokeWidth: 2.5, strokeDasharray: 'none' },
              data: { ...e.data, traversed: true }
            };
          }));
        }

        setTimeout(() => {
          setNodes(nds => nds.map(n => {
            const match = n.id === nodeId || n.data?.stepId === nodeId;
            return match ? { ...n, data: { ...n.data, isAnimating: false } } : n;
          }));
        }, 800);
      }, index * 700);
    });

    setTimeout(() => {
      setEdges(eds => eds.map(e => e.data?.traversed ? { ...e, animated: false } : e));
    }, traversedNodeIds.length * 700 + 1000);

    setTimeout(() => {
      setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, executionStatus: null, isAnimating: false } })));
      setEdges(eds => eds.map(e => ({ ...e, style: { stroke: '#c5cdd6', strokeWidth: 1.5, strokeDasharray: '6 4' }, animated: false, data: { ...e.data, traversed: false } })));
    }, traversedNodeIds.length * 700 + 6000);
  }, [setNodes, setEdges]);

  const handleExecute = async () => {
    try {
      const payload = prepareForSave(nodes, edges, workflowName);
      let currentId = workflowId;
      
      if (currentId) {
        await workflowAPI.update(currentId, payload);
      } else {
        const res = await workflowAPI.create(payload);
        currentId = res.data?.workflow_id || res.data?.id || res.data?._id;
        if (currentId) {
          setWorkflowId(currentId);
          sessionStorage.setItem('currentWorkflowId', currentId);
        }
      }
      
      if (!currentId) {
        showToast('Save first before executing', 'error');
        return;
      }
      
      const res = await workflowAPI.execute(currentId);
      const exec = res.data;
      
      let msg = exec.status === 'success' ? `✓ Workflow executed successfully` : `✗ Execution failed`;
      let entityType = null;
      if (exec.created_entity) {
        if (exec.created_entity.contact_id) {
            msg = `New contact ${exec.created_entity.contact_name} created & workflow ran successfully`;
            entityType = 'contact';
        } else if (exec.created_entity.opportunity_id) {
            msg = `New deal ${exec.created_entity.opportunity_name} created & workflow ran successfully`;
            entityType = 'opportunity';
        }
      } else {
        msg += ` — ${exec.step_logs?.length || 0} steps`;
      }
      
      showToast(msg, exec.status === 'success' ? 'success' : 'error');
      if (exec.step_logs?.length) animateExecution(exec.step_logs);
      setRefreshLogs(r => r + 1);
      
      window.dispatchEvent(new CustomEvent('workflow-executed', {
        detail: { executionId: exec.execution_id, status: exec.status, entityType, entity: exec.created_entity }
      }));
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
    const flowBounds = canvasRef.current?.getBoundingClientRect();
    if (!flowBounds) return;
    try {
      const payload = JSON.parse(raw);
      let position = {
        x: event.clientX - flowBounds.left,
        y: event.clientY - flowBounds.top,
      };
      if (rfInstance.current?.project) {
        position = rfInstance.current.project(position);
      }
      const newId = `step_${Date.now()}`;
      const typeMap = { trigger: 'triggerNode', action: 'actionNode', condition: 'conditionNode', delay: 'delayNode' };
      const newNode = {
        id: newId,
        type: typeMap[payload.nodeKind] || 'actionNode',
        position,
        data: { ...payload, stepId: newId, config: { ...(payload.defaultConfig || {}) } },
      };
      setNodes(nds => nds.concat(newNode));
      showToast(`Added: ${payload.label}`, 'success');
      setSelectedNodeId(newId);
    } catch (err) {
      console.error('Drop parse error:', err);
    }
  }, [setNodes, showToast, rfInstance]);

  const onDragOver = useCallback(e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }, []);

  /* ── AddNodeModal handler ── */
  const handleAddFromModal = (newNode, newEdge) => {
    setNodes(nds => nds.concat(newNode));

    if (addModal?.edgeId && addModal?.targetNodeId) {
      setEdges(eds => {
        const withoutOld = eds.filter(e => e.id !== addModal.edgeId);
        const edgeToTarget = {
          id:     `e-${newNode.id}-${addModal.targetNodeId}`,
          source: newNode.id,
          target: addModal.targetNodeId,
          type:   'customEdge',
          sourceHandle: 'success',
          style:  { stroke: '#c5cdd6', strokeWidth: 1.5, strokeDasharray: '6 4' },
          data:   { source: newNode.id, target: addModal.targetNodeId },
        };
        return [...withoutOld, { ...newEdge, type: 'customEdge', data: { source: newEdge.source, target: newNode.id } }, edgeToTarget];
      });
    } else {
      setEdges(eds => eds.concat({ ...newEdge, type: 'customEdge', data: { source: newEdge.source, target: newEdge.target } }));
    }

    showToast(`Added: ${newNode.data.label}`, 'success');
    setSelectedNodeId(newNode.id);
    setAddModal(null);
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

        <div className="canvas-area" ref={canvasRef} onDrop={onDrop} onDragOver={onDragOver}>
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onInit={instance => { rfInstance.current = instance; }}
          />
          <button className="canvas-fab" onClick={handleExecute} title="Run Test" style={{ display: 'flex', alignItems: 'center', gap: 6, width: 'auto', padding: '0 16px', borderRadius: 24 }}>
            <Play size={16} /> <span style={{ fontSize: 13, fontWeight: 600 }}>Run Test</span>
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
          sourcePosition={addModal.insertPosition}
          onAdd={handleAddFromModal}
          onClose={() => setAddModal(null)}
        />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}
