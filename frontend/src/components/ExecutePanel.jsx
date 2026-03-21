import React, { useState } from 'react';
import { parseDropData } from '../utils/dragHelpers';
import { workflowAPI } from '../services/api';
import CollapsiblePanel from './CollapsiblePanel';

const ExecutePanel = ({ workflowId, onExecuted, showToast }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [running, setRunning]       = useState(false);
  const [last, setLast]             = useState(null);

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);

    // Accept any node type — all trigger full execution
    const node = parseDropData(e);
    if (!node) return;

    if (!workflowId) {
      showToast('Save the workflow first before executing', 'error');
      return;
    }

    setRunning(true);
    try {
      const res = await workflowAPI.execute(workflowId);
      const exec = res.data;
      setLast(exec);
      onExecuted?.();
      const steps  = exec.step_logs?.length ?? 0;
      const status = exec.status;
      showToast(
        `${status === 'success' ? '✓' : '✗'} Workflow executed: ${status} — ${steps} steps`,
        status === 'success' ? 'success' : 'error'
      );
    } catch (err) {
      showToast(`Execution failed: ${err.response?.data?.detail ?? err.message}`, 'error');
    } finally {
      setRunning(false);
    }
  };

  return (
    <CollapsiblePanel title="Execute Workflow" icon="⚡" defaultOpen={false}>
      <div
        className={`execute-drop-zone ${isDragOver ? 'drop-active-execute' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false); }}
        onDrop={handleDrop}
      >
        <div className="execute-hint">
          {running
            ? '⏳ Running workflow…'
            : isDragOver
              ? '↓ Release to execute'
              : 'Drop any node here to run the full workflow'}
        </div>
      </div>
      {last && (
        <div className={`exec-result exec-result-${last.status}`}>
          Last run: <strong>{last.status}</strong> · {last.step_logs?.length ?? 0} steps logged
        </div>
      )}
    </CollapsiblePanel>
  );
};

export default ExecutePanel;
