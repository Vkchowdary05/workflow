import React from 'react';
import { Handle, Position } from 'reactflow';

const NODE_COLORS = {
  send_email:          '#1b6ac9',
  send_sms:            '#27ae60',
  send_whatsapp:       '#25d366',
  add_tag:             '#e67e22',
  update_contact:      '#e67e22',
  move_pipeline:       '#e67e22',
  create_opportunity:  '#e67e22',
  condition:           '#f39c12',
  delay:               '#8e44ad',
  trigger:             '#6c63ff',
  default:             '#9aa5b4',
};

function getNodeColor(data) {
  if (data.actionType && NODE_COLORS[data.actionType]) return NODE_COLORS[data.actionType];
  if (data.nodeKind && NODE_COLORS[data.nodeKind])  return NODE_COLORS[data.nodeKind];
  return NODE_COLORS.default;
}

function getSubtitle(data) {
  const c = data.config || {};
  switch (data.actionType) {
    case 'send_email':          return c.to      ? `To: ${c.to}`            : 'Configure recipient';
    case 'send_sms':            return c.to      ? `To: ${c.to}`            : 'Configure recipient';
    case 'send_whatsapp':       return c.to      ? `To: ${c.to}`            : 'Configure recipient';
    case 'add_tag':             return c.tags?.length ? `Tags: ${c.tags.join(', ')}` : 'No tags set';
    case 'move_pipeline':       return c.target_stage ? `→ Stage: ${c.target_stage}` : 'Set target stage';
    case 'update_contact':      return 'Update contact fields';
    case 'create_opportunity':  return c.name || 'New opportunity';
    default:                    return data.label || '';
  }
}

export function TriggerNode({ data, selected }) {
  return (
    <div className={`wf-node wf-node-trigger ${selected ? 'selected' : ''}`}>
      <Handle type="source" position={Position.Bottom} />
      <div className="wf-node-header">
        <div className="wf-node-dot" style={{ background: '#6c63ff' }} />
        <div className="wf-node-info">
          <div className="wf-node-title">{data.label}</div>
          <div className="wf-node-subtitle">
            {data.triggerType || 'Trigger'}
          </div>
        </div>
      </div>
      <div className="wf-node-desc">Workflow starts here</div>
    </div>
  );
}

export function ActionNode({ data, selected }) {
  const color = getNodeColor(data);
  const execClass = data.isAnimating
    ? 'exec-running'
    : data.executionStatus === 'success'
      ? 'exec-success'
      : data.executionStatus === 'failed'
        ? 'exec-failed'
        : '';

  return (
    <div
      className={`wf-node wf-node-action ${execClass} ${selected ? 'selected' : ''}`}
      style={{ borderTopColor: color }}
    >
      <Handle type="target" position={Position.Top} />
      <div className="wf-node-header">
        <div className="wf-node-dot" style={{ background: color }} />
        <div className="wf-node-info">
          <div className="wf-node-title">{data.label}</div>
          <div className="wf-node-subtitle">{getSubtitle(data)}</div>
        </div>
        <div className="wf-node-actions">
          <button className="wf-node-btn" title="Remove" style={{ color: '#e74c3c' }}
            onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('remove-node', { detail: { nodeId: data.stepId } })); }}>
            ✕
          </button>
        </div>
      </div>
      <div className="wf-node-handles">
        <span className="wf-handle-label">
          <span className="wf-handle-square" style={{ borderColor: '#27ae60' }} />
          Completed
        </span>
        <span className="wf-handle-label">
          <span className="wf-handle-square" style={{ borderColor: '#e74c3c' }} />
          Failed
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} id="success"
        style={{ left: '30%', background: '#27ae60', width: 8, height: 8, borderRadius: 2 }} />
      <Handle type="source" position={Position.Bottom} id="failure"
        style={{ left: '70%', background: '#e74c3c', width: 8, height: 8, borderRadius: 2 }} />
    </div>
  );
}

export function ConditionNode({ data, selected }) {
  const execClass = data.isAnimating
    ? 'exec-running'
    : data.executionStatus === 'success'
      ? 'exec-success'
      : data.executionStatus === 'failed'
        ? 'exec-failed'
        : '';

  const rules = data.config?.rules || [];
  const summary = rules.length
    ? `${rules[0].field} ${rules[0].operator} ${rules[0].value}`
    : 'No rules set';

  return (
    <div className={`wf-node-diamond-wrapper ${execClass} ${selected ? 'selected' : ''}`}>
      {/* ReactFlow handles must be OUTSIDE the rotated wrapper, positioned absolutely */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ top: -6, left: '50%', transform: 'translateX(-50%)', background: '#f39c12', width: 10, height: 10, borderRadius: 2, border: '2px solid white' }}
      />
      <div className="wf-node-diamond-inner">
        <div className="wf-node-diamond-icon">⬦</div>
        <div className="wf-node-diamond-label">{data.label}</div>
        <div className="wf-node-diamond-summary">{summary}</div>
        <div className="wf-node-diamond-branches">
          <span style={{ color: '#27ae60', fontSize: 10, fontWeight: 600 }}>T</span>
          <span style={{ color: '#e74c3c', fontSize: 10, fontWeight: 600 }}>F</span>
        </div>
      </div>
      <Handle
        type="source"
        id="true"
        position={Position.Left}
        style={{ left: -6, top: '50%', transform: 'translateY(-50%)', background: '#27ae60', width: 10, height: 10, borderRadius: 2, border: '2px solid white' }}
      />
      <Handle
        type="source"
        id="false"
        position={Position.Right}
        style={{ right: -6, left: 'auto', top: '50%', transform: 'translateY(-50%)', background: '#e74c3c', width: 10, height: 10, borderRadius: 2, border: '2px solid white' }}
      />
    </div>
  );
}

export function DelayNode({ data, selected }) {
  const execClass = data.isAnimating
    ? 'exec-running'
    : data.executionStatus === 'success'
      ? 'exec-success'
      : data.executionStatus === 'failed'
        ? 'exec-failed'
        : '';

  const c = data.config || {};

  return (
    <div className={`wf-node wf-node-delay ${execClass} ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="wf-node-header">
        <div className="wf-node-dot" style={{ background: '#8e44ad' }} />
        <div className="wf-node-info">
          <div className="wf-node-title">{data.label}</div>
          <div className="wf-node-subtitle">
            Wait {c.duration || '?'} {c.unit || 'seconds'}
          </div>
        </div>
        <div className="wf-node-actions">
          <button className="wf-node-btn" title="Remove" style={{ color: '#e74c3c' }}
            onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('remove-node', { detail: { nodeId: data.stepId } })); }}>
            ✕
          </button>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} id="complete"
        style={{ background: '#8e44ad', width: 8, height: 8, borderRadius: 2 }} />
    </div>
  );
}

export const nodeTypes = {
  triggerNode:   TriggerNode,
  actionNode:    ActionNode,
  conditionNode: ConditionNode,
  delayNode:     DelayNode,
};
