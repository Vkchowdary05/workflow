import React, { useState, useCallback } from 'react';
import { useNodesState, useEdgesState, addEdge } from 'reactflow';
import WorkflowControls from './components/WorkflowControls';
import FlowCanvas from './components/FlowCanvas';
import ContactsPanel from './components/ContactsPanel';
import OpportunitiesPanel from './components/OpportunitiesPanel';
import ExecutionLogs from './components/ExecutionLogs';
import { parseWorkflowToReactFlow, parseReactFlowToWorkflow } from './utils/parser';
import { workflowAPI } from './services/api';

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowRecord, setWorkflowRecord] = useState(null);
  
  const [showWorkflowsModal, setShowWorkflowsModal] = useState(false);
  const [workflowsList, setWorkflowsList] = useState([]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const loadWorkflow = (workflowObj) => {
    const { nodes: parsedNodes, edges: parsedEdges } = parseWorkflowToReactFlow(workflowObj);
    setNodes(parsedNodes);
    setEdges(parsedEdges);
    setWorkflowRecord(workflowObj);
  };

  const handleFileUpload = (json) => {
    loadWorkflow(json);
  };

  const handleSave = async () => {
    let rawData = parseReactFlowToWorkflow(nodes, edges, workflowRecord);
    // The backend expects the schema directly, not wrapped in { workflow: {...} }
    let payload = rawData.workflow || rawData;
    
    // Ensure required fields like name are present
    if (!payload.name) {
      payload.name = 'Untitled Workflow';
    }

    if (!payload.trigger) {
      payload.trigger = {
        type: 'contact_created',
        label: 'Contact Created'
      };
    }

    console.log("Payload being sent:", payload);

    try {
      if (workflowRecord && (workflowRecord.id || workflowRecord._id)) {
        await workflowAPI.update(workflowRecord.id || workflowRecord._id, payload);
        alert('Workflow updated successfully!');
      } else {
        const res = await workflowAPI.create(payload);
        setWorkflowRecord({ ...payload, id: res.data.id || res.data._id });
        alert('Workflow created successfully!');
      }
    } catch (err) {
      console.error(err);
      // Log validation errors if 422
      if (err.response?.status === 422) {
        console.error("Validation Error Details:", err.response.data);
        alert(`Validation Error: ${JSON.stringify(err.response.data.detail)}`);
      } else {
        alert('Failed to save workflow.');
      }
    }
  };

  const handleExecute = async () => {
    const id = workflowRecord?.id || workflowRecord?._id;
    if (!id) return alert('Please save the workflow first before executing.');
    try {
      const res = await workflowAPI.execute(id);
      console.log("Execution response:", res);
      alert('Execution triggered!');
    } catch (err) {
      console.error(err);
      alert('Failed to execute workflow.');
    }
  };

  const handleDelete = async () => {
    const id = workflowRecord?.id || workflowRecord?._id;
    if (!id) return;
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await workflowAPI.delete(id);
      setNodes([]);
      setEdges([]);
      setWorkflowRecord(null);
      alert('Workflow deleted.');
    } catch (err) {
      alert('Failed to delete.');
    }
  };

  const fetchWorkflowsList = async () => {
    try {
      const res = await workflowAPI.list();
      setWorkflowsList(res.data || []);
      setShowWorkflowsModal(true);
    } catch (err) {
      alert('Failed to load workflows list.');
    }
  };

  const selectWorkflowFromList = async (id) => {
    try {
      const res = await workflowAPI.getById(id);
      loadWorkflow(res.data);
      setShowWorkflowsModal(false);
    } catch (err) {
      alert('Failed to load workflow data.');
    }
  };

  return (
    <div className="app-container">
      <header className="header-glass">
        <div className="brand">
          <div className="logo-pulse"></div>
          <h1>Automation Engine</h1>
        </div>
        <WorkflowControls 
          onUpload={handleFileUpload}
          onSave={handleSave}
          onExecute={handleExecute}
          onDelete={handleDelete}
          onLoadList={fetchWorkflowsList}
          currentWorkflowName={workflowRecord?.name}
          currentWorkflowId={workflowRecord?.id || workflowRecord?._id}
        />
      </header>

      <main className="main-content">
        <div className="canvas-wrapper panel" style={{ padding: 0 }}>
          <FlowCanvas 
            nodes={nodes} 
            edges={edges} 
            onNodesChange={onNodesChange} 
            onEdgesChange={onEdgesChange} 
            onConnect={onConnect} 
          />
        </div>

        <div className="side-panels">
          <div className="panel-scroll-group" style={{ flex: '1.2' }}>
            <ExecutionLogs currentWorkflowId={workflowRecord?.id || workflowRecord?._id} />
          </div>
          <div className="panel-scroll-group crm-panels" style={{ flex: '1.8' }}>
            <ContactsPanel />
            <OpportunitiesPanel />
          </div>
        </div>
      </main>

      {showWorkflowsModal && (
        <div className="modal-overlay" onClick={() => setShowWorkflowsModal(false)}>
          <div className="modal-content panel" onClick={e => e.stopPropagation()}>
            <div className="flex-between" style={{ marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h2 style={{ margin: 0 }}>Select Workflow</h2>
              <button className="action-btn icon-only secondary" onClick={() => setShowWorkflowsModal(false)}>✕</button>
            </div>
            <div className="workflows-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {workflowsList.map(wf => (
                <div key={wf.id || wf._id} className="list-item clickable flex-between" onClick={() => selectWorkflowFromList(wf.id || wf._id)}>
                  <strong>{wf.name || 'Unnamed Workflow'}</strong>
                  <span className="text-secondary text-sm">ID: {String(wf.id || wf._id).substring(String(wf.id || wf._id).length - 6)}</span>
                </div>
              ))}
              {workflowsList.length === 0 && <p className="text-secondary text-center" style={{ padding: '24px 0' }}>No workflows stored in DB.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
