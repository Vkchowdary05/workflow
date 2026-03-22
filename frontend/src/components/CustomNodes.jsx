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

function AddBelowButton({ stepId }) {
  return (
    <div
      style={{
        position:  'absolute',
        bottom:    -13,
        left:      '50%',
        transform: 'translateX(-50%)',
        zIndex:    50,
      }}
      onMouseDown={e => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('add-node-below', {
          detail: { sourceNodeId: stepId },
        }));
      }}
    >
      <div className="add-edge-btn">+</div>
    </div>
  );
}

function NodeCard({ data, color, children, handles, showAddBtn = true }) {
  const dot = color || getNodeColor(data);
  const execClass = data.isAnimating
    ? 'exec-running'
    : data.executionStatus === 'success'
      ? 'exec-success'
      : data.executionStatus === 'failed'
        ? 'exec-failed'
        : '';

  return (
    <div className={`wf-node ${execClass}`} style={{ borderTopColor: dot }}>
      <div className="wf-node-header">
        <div className="wf-node-dot" style={{ background: dot }} />
        <div className="wf-node-info">
          <div className="wf-node-title">{data.label}</div>
          <div className="wf-node-subtitle">{getSubtitle(data)}</div>
        </div>
        <div className="wf-node-actions">
          <button
            className="wf-node-btn"
            title="Info"
            onClick={e => e.stopPropagation()}
          >ℹ</button>
          <button
            className="wf-node-btn"
            title="Remove node"
            style={{ color: '#e74c3c' }}
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(new CustomEvent('remove-node', {
                detail: { nodeId: data.stepId },
              }));
            }}
          >✕</button>
        </div>
      </div>

      {children}
      {handles}
      {showAddBtn && <AddBelowButton stepId={data.stepId} />}
    </div>
  );
}

/* Trigger Node */
export const TriggerNode = ({ data }) => (
  <NodeCard data={data} color={NODE_COLORS.trigger} showAddBtn={false}>
    <Handle type="source" position={Position.Bottom} />
    <div className="wf-node-desc">Workflow execution starts from this node</div>
    <div className="wf-node-handles">
      {['Incoming SMS', 'Incoming Call', 'API Request'].map(h => (
        <span key={h} className="wf-handle-label">
          <span className="wf-handle-square" />
          {h}
        </span>
      ))}
    </div>
  </NodeCard>
);

/* Action Node */
export const ActionNode = ({ data }) => (
  <NodeCard data={data}>
    <Handle type="target" position={Position.Top} />
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
  </NodeCard>
);

/* Condition Node */
export const ConditionNode = ({ data }) => {
  const rules = data.config?.rules || [];
  const summary = rules.length
    ? `If "${rules[0].field}" ${rules[0].operator} ${JSON.stringify(rules[0].value)}`
    : 'No rules defined';
  return (
    <NodeCard data={data} color={NODE_COLORS.condition}>
      <Handle type="target" position={Position.Top} />
      <div className="wf-node-desc">{summary}</div>
      <div className="wf-node-handles">
        <span className="wf-handle-label">
          <span className="wf-handle-square" style={{ borderColor: '#27ae60' }} />True
        </span>
        <span className="wf-handle-label">
          <span className="wf-handle-square" style={{ borderColor: '#e74c3c' }} />False
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} id="true"
        style={{ left: '30%', background: '#27ae60', width: 8, height: 8, borderRadius: 2 }} />
      <Handle type="source" position={Position.Bottom} id="false"
        style={{ left: '70%', background: '#e74c3c', width: 8, height: 8, borderRadius: 2 }} />
    </NodeCard>
  );
};

/* Delay Node */
export const DelayNode = ({ data }) => {
  const c = data.config || {};
  return (
    <NodeCard data={data} color={NODE_COLORS.delay}>
      <Handle type="target" position={Position.Top} />
      <div className="wf-node-desc">Wait {c.duration || '?'} {c.unit || 'seconds'}</div>
      <div className="wf-node-handles">
        <span className="wf-handle-label">
          <span className="wf-handle-square" />After delay
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} id="complete"
        style={{ background: '#8e44ad', width: 8, height: 8, borderRadius: 2 }} />
    </NodeCard>
  );
};

export const nodeTypes = {
  triggerNode:   TriggerNode,
  actionNode:    ActionNode,
  conditionNode: ConditionNode,
  delayNode:     DelayNode,
};
