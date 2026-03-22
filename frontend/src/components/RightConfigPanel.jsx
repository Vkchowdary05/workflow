import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function RightConfigPanel({ selectedNode, open, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('config');
  const [config, setConfig]       = useState({});
  const [label, setLabel]         = useState('');

  useEffect(() => {
    if (selectedNode) {
      setConfig(selectedNode.data.config || {});
      setLabel(selectedNode.data.label || '');
      setActiveTab('config');
    }
  }, [selectedNode?.id]);

  if (!selectedNode) return null;

  const update = (newConfig) => {
    setConfig(newConfig);
    onUpdate(selectedNode.id, newConfig, label);
  };

  const updateLabel = (val) => {
    setLabel(val);
    onUpdate(selectedNode.id, config, val);
  };

  return (
    <div className={`right-panel ${open ? 'open' : ''}`}>
      <div className="right-panel-header">
        <input
          value={label}
          onChange={e => updateLabel(e.target.value)}
          style={{ fontWeight: 600, fontSize: 14, border: 'none', outline: 'none', background: 'transparent', flex: 1, color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
        />
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
          <X size={18} />
        </button>
      </div>

      <div className="right-panel-tabs">
        <button className={`right-panel-tab ${activeTab==='config'?'active':''}`} onClick={()=>setActiveTab('config')}>Configuration</button>
        <button className={`right-panel-tab ${activeTab==='info'?'active':''}`} onClick={()=>setActiveTab('info')}>Information</button>
      </div>

      <div className="right-panel-body">
        {activeTab === 'config' && <ConfigForm data={selectedNode.data} config={config} onUpdate={update} />}
        {activeTab === 'info'   && <InfoTab data={selectedNode.data} />}
      </div>

      <div className="right-panel-footer">
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

/* Toggle component */
function Toggle({ checked, onChange }) {
  return (
    <label className="toggle-switch">
      <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} />
      <span className="toggle-slider" />
    </label>
  );
}

/* Chip input component */
function ChipInput({ value = [], onChange, placeholder }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (!v) return;
    onChange([...value, v]);
    setInput('');
  };
  return (
    <div className="chip-input-wrapper">
      {value.map((t, i) => (
        <span key={i} className="chip">
          {t}
          <button className="chip-remove" onClick={() => onChange(value.filter((_, j) => j !== i))}>×</button>
        </span>
      ))}
      <input
        className="chip-input-field"
        value={input}
        placeholder={placeholder || 'Type then press Enter'}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === ',' || e.key === 'Enter') { e.preventDefault(); add(); } }}
        onBlur={add}
      />
    </div>
  );
}

/* Dynamic config form */
function ConfigForm({ data, config, onUpdate }) {
  const set = (key, val) => onUpdate({ ...config, [key]: val });
  const at = data.actionType;
  const nk = data.nodeKind;

  if (at === 'send_email') return (<>
    <div className="form-group"><label className="form-label">To</label><input className="form-input" value={config.to||''} onChange={e=>set('to',e.target.value)} placeholder="{{contact.email}}" /></div>
    <div className="form-group"><label className="form-label">Subject</label><input className="form-input" value={config.subject||''} onChange={e=>set('subject',e.target.value)} placeholder="Email subject" /></div>
    <div className="form-group"><label className="form-label">Template ID (optional)</label><input className="form-input" value={config.template_id||''} onChange={e=>set('template_id',e.target.value)} placeholder="tpl_001" /></div>
    <div className="form-toggle"><span className="form-toggle-label">Track Opens</span><Toggle checked={config.track_opens} onChange={v=>set('track_opens',v)} /></div>
    <div className="form-toggle"><span className="form-toggle-label">Track Clicks</span><Toggle checked={config.track_clicks} onChange={v=>set('track_clicks',v)} /></div>
  </>);

  if (at === 'send_sms') return (<>
    <div className="form-group"><label className="form-label">To</label><input className="form-input" value={config.to||''} onChange={e=>set('to',e.target.value)} placeholder="{{contact.phone}}" /></div>
    <div className="form-group"><label className="form-label">Message Body</label><textarea className="form-textarea" value={config.body||''} onChange={e=>set('body',e.target.value)} placeholder="Message text" /></div>
  </>);

  if (at === 'send_whatsapp') return (<>
    <div className="form-group"><label className="form-label">To</label><input className="form-input" value={config.to||''} onChange={e=>set('to',e.target.value)} placeholder="{{contact.phone}}" /></div>
    <div className="form-group"><label className="form-label">Message Body</label><textarea className="form-textarea" value={config.body||''} onChange={e=>set('body',e.target.value)} placeholder="WhatsApp message" /></div>
  </>);

  if (at === 'add_tag') return (<>
    <div className="form-group"><label className="form-label">Tags</label><ChipInput value={config.tags||[]} onChange={v=>set('tags',v)} placeholder="Type tag, press Enter" /></div>
  </>);

  if (at === 'move_pipeline') return (<>
    <div className="form-group"><label className="form-label">Target Stage</label>
      <select className="form-select" value={config.target_stage||'new'} onChange={e=>set('target_stage',e.target.value)}>
        {['new','qualified','proposal','cold','won','lost'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
      </select>
    </div>
    <div className="form-group"><label className="form-label">Pipeline ID</label><input className="form-input" value={config.pipeline_id||''} onChange={e=>set('pipeline_id',e.target.value)} placeholder="{{config.default_pipeline_id}}" /></div>
    <div className="form-group"><label className="form-label">Note</label><input className="form-input" value={config.note||''} onChange={e=>set('note',e.target.value)} placeholder="Optional note" /></div>
  </>);

  if (at === 'update_contact') {
    const fields = Object.entries(config.field_updates || {});
    return (<>
      <div className="form-group"><label className="form-label">Field Updates</label>
        {fields.map(([k,v],i) => (
          <div key={i} className="kv-row">
            <input className="form-input" value={k} placeholder="field name"
              onChange={e=>{ const u={...config.field_updates}; const val=u[k]; delete u[k]; u[e.target.value]=val; set('field_updates',u); }} />
            <input className="form-input" value={v} placeholder="value"
              onChange={e=>set('field_updates',{...config.field_updates,[k]:e.target.value})} />
            <button className="kv-remove" onClick={()=>{const u={...config.field_updates}; delete u[k]; set('field_updates',u);}}>×</button>
          </div>
        ))}
        <button className="btn btn-ghost btn-sm" style={{marginTop:6}} onClick={()=>set('field_updates',{...config.field_updates,'':''})}>+ Add Field</button>
      </div>
    </>);
  }

  if (at === 'create_opportunity') return (<>
    <div className="form-group"><label className="form-label">Opportunity Name</label><input className="form-input" value={config.name||''} onChange={e=>set('name',e.target.value)} placeholder="New Deal" /></div>
    <div className="form-group"><label className="form-label">Stage</label>
      <select className="form-select" value={config.stage||'new'} onChange={e=>set('stage',e.target.value)}>
        {['new','qualified','proposal','won','lost'].map(s=><option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  </>);

  if (nk === 'condition') {
    const rules = config.rules || [{ field: '', operator: 'equals', value: '' }];
    return (<>
      <div className="form-group"><label className="form-label">Match Operator</label>
        <select className="form-select" value={config.operator||'AND'} onChange={e=>onUpdate({...config,operator:e.target.value})}>
          <option value="AND">AND — all rules must match</option>
          <option value="OR">OR — any rule must match</option>
        </select>
      </div>
      <div className="form-group"><label className="form-label">Rules</label>
        {rules.map((r,i) => (
          <div key={i} style={{marginBottom:8,display:'flex',flexDirection:'column',gap:4,background:'var(--bg-page)',padding:8,borderRadius:'var(--radius-sm)',border:'1px solid var(--border)'}}>
            <input className="form-input" value={r.field} placeholder="Field (e.g. step_1.email_opened)"
              onChange={e=>{const nr=[...rules]; nr[i]={...r,field:e.target.value}; onUpdate({...config,rules:nr});}} />
            <select className="form-select" value={r.operator}
              onChange={e=>{const nr=[...rules]; nr[i]={...r,operator:e.target.value}; onUpdate({...config,rules:nr});}}>
              {['equals','not_equals','contains','greater_than','less_than'].map(op=><option key={op} value={op}>{op}</option>)}
            </select>
            <div style={{display:'flex',gap:6}}>
              <input className="form-input" value={r.value} placeholder="Value" style={{flex:1}}
                onChange={e=>{const nr=[...rules]; nr[i]={...r,value:e.target.value}; onUpdate({...config,rules:nr});}} />
              <button className="kv-remove" onClick={()=>onUpdate({...config,rules:rules.filter((_,j)=>j!==i)})}>×</button>
            </div>
          </div>
        ))}
        <button className="btn btn-ghost btn-sm" onClick={()=>onUpdate({...config,rules:[...rules,{field:'',operator:'equals',value:''}]})}>+ Add Rule</button>
      </div>
    </>);
  }

  if (nk === 'delay') return (<>
    <div className="form-group"><label className="form-label">Duration</label>
      <input className="form-input" type="number" min="1" value={config.duration||1} onChange={e=>set('duration',parseInt(e.target.value)||1)} />
    </div>
    <div className="form-group"><label className="form-label">Unit</label>
      <select className="form-select" value={config.unit||'hours'} onChange={e=>set('unit',e.target.value)}>
        {['seconds','minutes','hours','days'].map(u=><option key={u} value={u}>{u}</option>)}
      </select>
    </div>
    <div className="form-toggle"><span className="form-toggle-label">Skip Weekends</span>
      <Toggle checked={!!config.skip_weekends} onChange={v=>set('skip_weekends',v)} />
    </div>
  </>);

  if (nk === 'trigger') return (<>
    <div className="form-group"><label className="form-label">Trigger Type</label>
      <input className="form-input" value={data.triggerType||config.type||''} readOnly style={{background:'var(--bg-page)',color:'var(--text-muted)'}} />
    </div>
    <div className="form-group"><label className="form-label">Source Filter</label>
      <ChipInput value={config.filters?.source||[]} onChange={v=>set('filters',{...config.filters,source:v})} placeholder="web-form, manual, api" />
    </div>
    <div className="form-group"><label className="form-label">Tags — Include Any</label>
      <ChipInput value={config.filters?.tags_include_any||[]} onChange={v=>set('filters',{...config.filters,tags_include_any:v})} placeholder="lead, prospect" />
    </div>
    <div className="form-group"><label className="form-label">Tags — Exclude All</label>
      <ChipInput value={config.filters?.tags_exclude_all||[]} onChange={v=>set('filters',{...config.filters,tags_exclude_all:v})} placeholder="customer, unsubscribed" />
    </div>
  </>);

  return <p style={{color:'var(--text-muted)',fontSize:13}}>No configuration available for this node type.</p>;
}

function InfoTab({ data }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12,fontSize:13,color:'var(--text-secondary)'}}>
      <div><strong>Step ID:</strong> <code style={{fontSize:11,background:'var(--bg-page)',padding:'2px 6px',borderRadius:4}}>{data.stepId}</code></div>
      <div><strong>Node Kind:</strong> {data.nodeKind}</div>
      {data.actionType && <div><strong>Action Type:</strong> {data.actionType}</div>}
      {data.executionStatus && (
        <div><strong>Last Execution:</strong> <span className={`badge badge-${data.executionStatus==='success'?'success':'failed'}`}>{data.executionStatus}</span></div>
      )}
      <div style={{fontSize:12,color:'var(--text-muted)',marginTop:8,lineHeight:1.6}}>
        Click "Configuration" tab to edit this node's properties. Changes apply immediately to the canvas. Click Save in the topbar to persist to database.
      </div>
    </div>
  );
}
