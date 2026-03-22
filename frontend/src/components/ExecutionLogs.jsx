import React, { useEffect, useState } from 'react';
import { workflowAPI } from '../services/api';
import CollapsiblePanel from './CollapsiblePanel';

const ExecutionLogs = ({ currentWorkflowId, compact }) => {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedExec, setSelectedExec] = useState(null);
  const [details, setDetails] = useState(null);

  const fetchExecutions = async () => {
    if (!currentWorkflowId) return;
    setLoading(true);
    try {
      const res = await workflowAPI.listExecutions(currentWorkflowId);
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

  useEffect(() => {
    const handleExecuted = async (e) => {
      const { executionId } = e.detail;
      if (currentWorkflowId) {
        await fetchExecutions();
        if (executionId) {
          loadDetails(executionId);
        }
      }
    };
    window.addEventListener('workflow-executed', handleExecuted);
    return () => window.removeEventListener('workflow-executed', handleExecuted);
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

  if (!currentWorkflowId) {
    return (
      <CollapsiblePanel title="Execution Logs" icon="📋" defaultOpen>
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 13 }}>
          Save or load a workflow to view execution logs.
        </div>
      </CollapsiblePanel>
    );
  }

  return (
    <CollapsiblePanel title="Execution Logs" icon="📋" defaultOpen>
      <div style={{ display: 'flex', gap: 12, minHeight: 0 }}>
        {/* Left: List of executions */}
        <div style={{ flex: 1, borderRight: '1px solid #f1f5f9', paddingRight: 10, maxHeight: 250, overflowY: 'auto' }}>
          {loading && <div style={{ fontSize: 12, color: '#94a3b8' }}>Loading...</div>}
          {!loading && executions.length === 0 && (
            <div style={{ fontSize: 12, color: '#94a3b8' }}>No executions found.</div>
          )}
          {executions.map(ex => {
            const id = ex.id || ex._id || ex.execution_id;
            return (
              <div
                key={id}
                onClick={() => loadDetails(id)}
                style={{
                  padding: '6px 8px',
                  marginBottom: 4,
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: selectedExec === id ? 'rgba(99,102,241,0.08)' : 'transparent',
                  border: selectedExec === id ? '1px solid #a5b4fc' : '1px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12 }}>
                    {ex.status === 'success' || ex.status === 'completed' ? '✅' : ex.status === 'failed' ? '❌' : '⏳'}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>
                    {new Date(ex.created_at || Date.now()).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', paddingLeft: 20 }}>
                  ID: {String(id).slice(-6)}
                </div>
              </div>
            );
          })}
          <button
            onClick={fetchExecutions}
            style={{
              marginTop: 6, width: '100%', padding: '4px 0', fontSize: 11,
              background: '#f1f5f9', border: '1px solid #e2e8f0',
              borderRadius: 5, cursor: 'pointer', color: '#475569',
            }}
          >
            ↻ Refresh
          </button>
        </div>

        {/* Right: Details — uses step_logs (NOT trace) */}
        <div style={{ flex: 1.5, maxHeight: 250, overflowY: 'auto' }}>
          {!selectedExec ? (
            <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', paddingTop: 30 }}>
              Select a run.
            </div>
          ) : !details ? (
            <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', paddingTop: 30 }}>
              Loading details...
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Status:</span>
                <span className={`tag ${details.status || 'pending'}`} style={{ fontSize: 10 }}>
                  {details.status || 'Pending'}
                </span>
              </div>

              {/* ── Step logs timeline (BUG FIX: was details.trace, now details.step_logs) ── */}
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Step Logs:</div>
              {(details.step_logs ?? []).map((log, i) => (
                <div key={i} className="log-row">
                  <div className={`log-dot log-${log.status}-dot`} />
                  <div className="log-body">
                    <div className="log-label">{log.label ?? log.step_id}</div>
                    <div className="log-message">{log.message}</div>
                    {log.entity && Object.keys(log.entity).length > 0 && (
                      <div style={{
                        marginTop: 4, fontSize: 10, color: 'var(--accent-blue)',
                        background: '#eff6ff', padding: '3px 7px', borderRadius: 4,
                        border: '1px solid #bfdbfe',
                      }}>
                        {log.entity.contact_name && `👤 ${log.entity.contact_name} (${log.entity.contact_email || ''})`}
                        {log.entity.opportunity_name && `💼 ${log.entity.opportunity_name}`}
                      </div>
                    )}
                  </div>
                  <span className={`log-badge log-badge-${log.status}`}>{log.status}</span>
                  <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
              {(!details.step_logs || details.step_logs.length === 0) && (
                <div style={{ fontSize: 11, color: '#94a3b8' }}>No step logs recorded.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </CollapsiblePanel>
  );
};

export default ExecutionLogs;
