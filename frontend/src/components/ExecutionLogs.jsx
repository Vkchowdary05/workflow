import React, { useEffect, useState } from 'react';
import { workflowAPI } from '../services/api';
import { ScrollText, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react';

const ExecutionLogs = ({ currentWorkflowId }) => {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedExec, setSelectedExec] = useState(null);
  const [details, setDetails] = useState(null);

  const fetchExecutions = async () => {
    if (!currentWorkflowId) return;
    setLoading(true);
    try {
      const res = await workflowAPI.listExecutions(currentWorkflowId);
      // Sort to show newest first
      setExecutions((res.data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (err) {
      console.error("Error fetching executions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
    setSelectedExec(null);
    setDetails(null);
  }, [currentWorkflowId]);

  const loadDetails = async (execId) => {
    try {
      setSelectedExec(execId);
      setDetails(null);
      const res = await workflowAPI.getExecution(currentWorkflowId, execId);
      setDetails(res.data);
    } catch (err) {
      console.error("Error details", err);
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'completed' || status === 'success') return <CheckCircle2 size={16} color="var(--success)" />;
    if (status === 'failed') return <XCircle size={16} color="var(--danger)" />;
    return <Clock size={16} color="var(--warning)" />;
  };

  if (!currentWorkflowId) {
    return (
      <div className="panel executions-panel flex-center w-full" style={{ height: '300px' }}>
        <div className="text-secondary text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <ScrollText size={32} style={{ opacity: 0.5 }} />
          <p>Save or load a workflow to view execution logs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel executions-panel w-full" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '300px' }}>
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <ScrollText size={18} /> Execution Logs
        </h2>
        <button onClick={fetchExecutions} className="action-btn icon-only secondary" title="Refresh">
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flex: 1, minHeight: 0 }}>
        {/* Left: List of executions */}
        <div className="list-container" style={{ flex: 1, borderRight: '1px solid var(--border)', paddingRight: '12px', overflowY: 'auto' }}>
          {executions.length === 0 ? (
            <p className="text-secondary text-sm">No executions found.</p>
          ) : (
            executions.map(ex => (
              <div 
                key={ex.id || ex._id} 
                className={`list-item clickable ${selectedExec === (ex.id || ex._id) ? 'active' : ''}`}
                onClick={() => loadDetails(ex.id || ex._id)}
                style={{ padding: '8px', marginBottom: '8px', borderRadius: '4px' }}
              >
                <div className="flex-between">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {getStatusIcon(ex.status)}
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      {new Date(ex.created_at || Date.now()).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', paddingLeft: '22px' }}>
                  ID: {String(ex.id || ex._id).substring(String(ex.id || ex._id).length - 6)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Details */}
        <div className="details-container" style={{ flex: 1.5, overflowY: 'auto', paddingLeft: '4px' }}>
          {!selectedExec ? (
            <p className="text-secondary text-sm flex-center h-full">Select a run.</p>
          ) : !details ? (
            <p className="text-secondary text-sm flex-center h-full">Loading details...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="flex-between">
                <strong style={{ fontSize: '0.9rem' }}>Status:</strong>
                <span className={`tag ${details.status || 'pending'}`}>{details.status || 'Pending'}</span>
              </div>
              
              <div>
                <strong style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Execution Trace:</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(details.trace || []).map((t, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-hover)', padding: '10px', borderRadius: '6px' }}>
                      <div className="flex-between">
                        <span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.85rem' }}>{t.step_id}</span>
                        {getStatusIcon(t.status)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : 'Unknown time'}
                      </div>
                    </div>
                  ))}
                  {(!details.trace || details.trace.length === 0) && <p className="text-secondary text-xs">No trace events yet.</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecutionLogs;
