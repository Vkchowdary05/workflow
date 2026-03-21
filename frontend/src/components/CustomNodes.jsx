import React from 'react';
import { Handle, Position } from 'reactflow';

// ── Drag handler — identical for all node types ─────────────────────
function makeOnDragStart(data) {
  return (e) => {
    // DO NOT call e.stopPropagation() — it breaks the HTML5 drag session
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/quantixone-node', JSON.stringify({
        nodeKind:   data.nodeKind,
        actionType: data.actionType ?? null,
        label:      data.label       ?? '',
        config:     data.config      ?? {},
        stepId:     data.stepId      ?? 'trigger',
    }));
  };
}

// ── Config summary helpers — NO raw JSON allowed ────────────────────
function emailSummary(config) {
  const lines = [];
  if (config.to)      lines.push(`To: ${config.to}`);
  if (config.subject) lines.push(`Subject: ${config.subject.length > 45 ? config.subject.slice(0,45)+'…' : config.subject}`);
  return lines;
}

function smsSummary(config) {
  const lines = [];
  if (config.to)   lines.push(`To: ${config.to}`);
  if (config.body) lines.push(`"${config.body.length > 50 ? config.body.slice(0,50)+'…' : config.body}"`);
  return lines;
}

function movePipelineSummary(config) {
  const lines = [];
  if (config.target_stage) lines.push(`Move to stage: ${config.target_stage}`);
  if (config.note) lines.push(`Note: ${config.note.slice(0, 40)}${config.note.length > 40 ? '…' : ''}`);
  return lines;
}

function addTagSummary(config) {
  if (!config.tags?.length) return ['No tags defined'];
  return [`Tags: ${config.tags.join(', ')}`];
}

function updateContactSummary(config) {
  const fields = Object.keys(config.field_updates ?? {});
  if (!fields.length) return ['No field updates defined'];
  return [`Updates: ${fields.slice(0, 3).join(', ')}${fields.length > 3 ? ' …' : ''}`];
}

function createOpportunitySummary(config) {
  const lines = [];
  if (config.name)        lines.push(`Name: ${config.name}`);
  if (config.pipeline_id) lines.push(`Pipeline: ${config.pipeline_id}`);
  return lines.length ? lines : ['New opportunity'];
}

function whatsappSummary(config) {
  const lines = [];
  if (config.to)   lines.push(`To: ${config.to}`);
  if (config.body) lines.push(`"${config.body.slice(0, 50)}${config.body.length > 50 ? '…' : ''}"`);
  return lines;
}

function conditionRuleSummary(rules) {
  if (!rules?.length) return 'No rules defined';
  const r = rules[0];
  return `If "${r.field}" ${r.operator} ${JSON.stringify(r.value)}`;
}

const ACTION_META = {
  send_email:         { icon: '✉',  color: '#1d4ed8', label: 'Send Email',     summary: emailSummary },
  send_sms:           { icon: '💬', color: '#1d4ed8', label: 'Send SMS',       summary: smsSummary },
  send_whatsapp:      { icon: '🟢', color: '#15803d', label: 'Send WhatsApp',  summary: whatsappSummary },
  move_pipeline:      { icon: '⇢',  color: '#1d4ed8', label: 'Move Stage',     summary: movePipelineSummary },
  add_tag:            { icon: '🏷', color: '#1d4ed8', label: 'Add Tag',        summary: addTagSummary },
  update_contact:     { icon: '✏',  color: '#1d4ed8', label: 'Update Contact', summary: updateContactSummary },
  create_opportunity: { icon: '💼', color: '#1d4ed8', label: 'Create Opp.',    summary: createOpportunitySummary },
};


// ── Shared style helpers ────────────────────────────────────────────
const nodeStyle = (borderColor) => ({
  borderLeft: `3px solid ${borderColor}`,
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  padding: '12px 14px',
  minWidth: 200,
  maxWidth: 240,
  fontFamily: 'Inter, sans-serif',
  cursor: 'grab',
  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
});

const NodeType = ({ color, icon, label }) => (
  <div style={{ fontSize: 10, fontWeight: 600, color, textTransform: 'uppercase',
                letterSpacing: '0.5px', marginBottom: 4 }}>
    {icon} {label}
  </div>
);

const NodeTitle = ({ children }) => (
  <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', marginBottom: 2 }}>
    {children}
  </div>
);

const NodeBody = ({ children }) => (
  <div style={{ fontSize: 11, color: '#64748b', marginTop: 3, lineHeight: 1.4 }}>
    {children}
  </div>
);

const TagRow = ({ tags, color, textColor }) => (
  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 5 }}>
    {tags.map(t => (
      <span key={t} style={{ background: color, color: textColor, fontSize: 10,
                             padding: '1px 6px', borderRadius: 10 }}>
        {t}
      </span>
    ))}
  </div>
);

const HandleLabels = ({ left, right, leftColor, rightColor }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
    <span style={{ fontSize: 10, color: leftColor }}>{left}</span>
    <span style={{ fontSize: 10, color: rightColor }}>{right}</span>
  </div>
);


// ── Node Components ─────────────────────────────────────────────────

export const TriggerNode = ({ data }) => {
  const filters  = data.config?.filters ?? {};
  const sources  = filters.source ?? [];
  const incTags  = filters.tags_include_any ?? [];
  const excTags  = filters.tags_exclude_all ?? [];

  return (
    <div draggable={true} onDragStart={makeOnDragStart(data)} style={nodeStyle('#f59e0b')}>
      <Handle type="source" position={Position.Bottom} />
      <NodeType color="#b45309" icon="⚡" label="Trigger" />
      <NodeTitle>{data.label}</NodeTitle>
      {sources.length > 0 && <NodeBody>Source: {sources.join(', ')}</NodeBody>}
      {incTags.length > 0 && <TagRow tags={incTags} color="#fef3c7" textColor="#92400e" />}
      {excTags.length > 0 && <NodeBody>Exclude: {excTags.join(', ')}</NodeBody>}
    </div>
  );
};

export const ActionNode = ({ data }) => {
  const meta    = ACTION_META[data.actionType] ?? { icon: '⚙', color: '#1d4ed8', label: 'Action' };
  const summary = meta.summary ? meta.summary(data.config ?? {}) : [];

  return (
    <div draggable={true} onDragStart={makeOnDragStart(data)} style={nodeStyle('#3b82f6')}>
      <Handle type="target" position={Position.Top} />
      <NodeType color={meta.color} icon={meta.icon} label={meta.label} />
      <NodeTitle>{data.label}</NodeTitle>
      {summary.map((line, i) => <NodeBody key={i}>{line}</NodeBody>)}
      <HandleLabels left="● success" right="● failure" leftColor="#16a34a" rightColor="#dc2626" />
      <Handle type="source" position={Position.Bottom} id="success"
              style={{ left: '25%', background: '#16a34a', width: 8, height: 8 }} />
      <Handle type="source" position={Position.Bottom} id="failure"
              style={{ left: '75%', background: '#dc2626', width: 8, height: 8 }} />
    </div>
  );
};

export const ConditionNode = ({ data }) => (
  <div draggable={true} onDragStart={makeOnDragStart(data)} style={nodeStyle('#8b5cf6')}>
    <Handle type="target" position={Position.Top} />
    <NodeType color="#5b21b6" icon="⑂" label="Condition" />
    <NodeTitle>{data.label}</NodeTitle>
    <NodeBody>{conditionRuleSummary(data.rules)}</NodeBody>
    <HandleLabels left="✓ True" right="✗ False" leftColor="#16a34a" rightColor="#dc2626" />
    <Handle type="source" position={Position.Bottom} id="true"
            style={{ left: '25%', background: '#16a34a', width: 8, height: 8 }} />
    <Handle type="source" position={Position.Bottom} id="false"
            style={{ left: '75%', background: '#dc2626', width: 8, height: 8 }} />
  </div>
);

export const DelayNode = ({ data }) => (
  <div draggable={true} onDragStart={makeOnDragStart(data)} style={nodeStyle('#14b8a6')}>
    <Handle type="target" position={Position.Top} />
    <NodeType color="#0f6e56" icon="⏱" label="Delay" />
    <NodeTitle>{data.label}</NodeTitle>
    <NodeBody>Wait: {data.duration} {data.unit}</NodeBody>
    <Handle type="source" position={Position.Bottom} id="complete" />
  </div>
);

// ── Export node types map ────────────────────────────────────────────
export const nodeTypes = {
  triggerNode:   TriggerNode,
  actionNode:    ActionNode,
  conditionNode: ConditionNode,
  delayNode:     DelayNode,
};
