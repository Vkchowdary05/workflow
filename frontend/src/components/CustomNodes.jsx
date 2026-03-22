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

const NodeCard = ({ data, color, children, handles }) => {
  return (
    <div className={`node-card`} style={{ '--node-color': color }}>
      {handles?.target && <Handle type="target" position={Position.Top} id={handles.target} className="node-handle" />}
      
      <div className="node-icon-header">
        <div className="node-icon">
          {data.icon === 'Zap' && <Zap size={16} />}
          {data.icon === 'Mail' && <Mail size={16} />}
          {data.icon === 'MessageSquare' && <MessageSquare size={16} />}
          {data.icon === 'Phone' && <Phone size={16} />}
          {data.icon === 'Tag' && <Tag size={16} />}
          {data.icon === 'User' && <User size={16} />}
          {data.icon === 'Briefcase' && <Briefcase size={16} />}
          {data.icon === 'GitBranch' && <GitBranch size={16} />}
          {data.icon === 'Clock' && <Clock size={16} />}
        </div>
        <div style={{ flex: 1 }}>
          <div className="node-title">{data.label}</div>
          <div className="node-subtitle">{data.nodeKind}</div>
        </div>
      </div>

      <div className="node-content">{children}</div>

      {handles?.source && (
        <Handle type="source" position={Position.Bottom} id={handles.source} className="node-handle" />
      )}
    </div>
  );
};

/* Trigger Node */
export function TriggerNode({ data, selected }) {
  return (
    <NodeCard data={data} color="var(--trigger-color)" handles={{ source: 'out' }}>
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
}

/* Action Node */
export function ActionNode({ data, selected }) {
  return (
    <NodeCard 
      data={data} 
      color={getNodeColor(data)}
      handles={{ target: 'in', source: 'success' }}
    >
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
      <Handle type="source" position={Position.Bottom} id="failure"
        style={{ left: '70%', background: '#e74c3c', width: 8, height: 8, borderRadius: 2 }} />
    </NodeCard>
  );
}

/* Condition Node */
export function ConditionNode({ data, selected }) {
  const rules = data.config?.rules || [];
  const summary = rules.length
    ? `If "${rules[0].field}" ${rules[0].operator} ${JSON.stringify(rules[0].value)}`
    : 'No rules defined';
  return (
    <NodeCard 
      data={data} 
      color="var(--condition-color)"
      handles={{ target: 'in' }}
    >
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
}

/* Delay Node */
export function DelayNode({ data, selected }) {
  const c = data.config || {};
  return (
    <NodeCard 
      data={data} 
      color="var(--delay-color)"
      handles={{ target: 'in', source: 'complete' }}
    >
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
