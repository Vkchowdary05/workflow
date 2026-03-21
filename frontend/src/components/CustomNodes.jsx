import React from 'react';
import { Handle, Position } from 'reactflow';
import { Zap, Activity, Clock, SplitSquareHorizontal } from 'lucide-react';

const commonStyle = {
  padding: '12px 16px',
  borderRadius: '8px',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
  minWidth: '220px',
  boxShadow: 'var(--shadow-md)',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const Header = ({ icon: Icon, title, iconColor }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
    <Icon size={18} color={iconColor} />
    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{title}</span>
  </div>
);

export const TriggerNode = ({ data }) => {
  return (
    <div style={{ ...commonStyle, borderLeft: '4px solid #f59e0b' }}>
      <Header icon={Zap} title="Trigger Node" iconColor="#f59e0b" />
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        <strong>Label:</strong> {data.label} <br />
        <strong>Type:</strong> {data.details?.type}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export const ActionNode = ({ data }) => {
  return (
    <div style={{ ...commonStyle, borderLeft: '4px solid #3b82f6' }}>
      <Handle type="target" position={Position.Top} />
      <Header icon={Activity} title={`Action: ${data.action_type || 'Unknown'}`} iconColor="#3b82f6" />
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <strong>ID:</strong> {data.step_id} <br />
        {data.config && <span><strong>Config:</strong> <pre style={{margin:0, fontSize:'0.7rem', color:'#cbd5e1'}}>{JSON.stringify(data.config, null, 2)}</pre></span>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
        <span style={{ fontSize: '0.7rem', color: '#10b981' }}>Success ▾</span>
        <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>Failure ▾</span>
      </div>
      <Handle type="source" position={Position.Bottom} id="success" style={{ left: '25%', background: '#10b981', width: '8px', height: '8px' }} />
      <Handle type="source" position={Position.Bottom} id="failure" style={{ left: '75%', background: '#ef4444', width: '8px', height: '8px' }} />
    </div>
  );
};

export const ConditionNode = ({ data }) => {
  return (
    <div style={{ ...commonStyle, borderLeft: '4px solid #8b5cf6' }}>
      <Handle type="target" position={Position.Top} />
      <Header icon={SplitSquareHorizontal} title="Condition Node" iconColor="#8b5cf6" />
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <strong>ID:</strong> {data.step_id} <br />
        {data.config && <span><strong>Check:</strong> {JSON.stringify(data.config)}</span>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
        <span style={{ fontSize: '0.7rem', color: '#10b981' }}>True ▾</span>
        <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>False ▾</span>
      </div>
      <Handle type="source" position={Position.Bottom} id="true" style={{ left: '25%', background: '#10b981', width: '8px', height: '8px' }} />
      <Handle type="source" position={Position.Bottom} id="false" style={{ left: '75%', background: '#ef4444', width: '8px', height: '8px' }} />
    </div>
  );
};

export const DelayNode = ({ data }) => {
  return (
    <div style={{ ...commonStyle, borderLeft: '4px solid #14b8a6' }}>
      <Handle type="target" position={Position.Top} />
      <Header icon={Clock} title="Delay Node" iconColor="#14b8a6" />
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <strong>ID:</strong> {data.step_id} <br />
        {data.config && <span><strong>Delay:</strong> {data.config.duration} {data.config.unit}</span>}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export const nodeTypes = {
  triggerNode: TriggerNode,
  actionNode: ActionNode,
  conditionNode: ConditionNode,
  delayNode: DelayNode,
};
