import React from 'react';
import { Mail, MessageSquare, Phone, Tag, User, Briefcase, ArrowRight, GitBranch, Clock } from 'lucide-react';

const OPTIONS = [
  { section: 'Messaging', items: [
    { icon: <Mail size={15}/>,         color:'#1b6ac9', label:'Send Email',         actionType:'send_email',         nodeKind:'action',    defaultConfig:{to:'',subject:'',track_opens:true,track_clicks:true} },
    { icon: <MessageSquare size={15}/>,color:'#27ae60', label:'Send SMS',           actionType:'send_sms',           nodeKind:'action',    defaultConfig:{to:'',body:''} },
    { icon: <Phone size={15}/>,        color:'#25d366', label:'Send WhatsApp',      actionType:'send_whatsapp',      nodeKind:'action',    defaultConfig:{to:'',body:''} },
  ]},
  { section: 'CRM Actions', items: [
    { icon: <Tag size={15}/>,          color:'#e67e22', label:'Add Tag',            actionType:'add_tag',            nodeKind:'action',    defaultConfig:{tags:[]} },
    { icon: <User size={15}/>,         color:'#e67e22', label:'Update Contact',     actionType:'update_contact',     nodeKind:'action',    defaultConfig:{field_updates:{}} },
    { icon: <Briefcase size={15}/>,    color:'#e67e22', label:'Create Opportunity', actionType:'create_opportunity', nodeKind:'action',    defaultConfig:{name:'New Deal',stage:'new'} },
    { icon: <ArrowRight size={15}/>,   color:'#e67e22', label:'Move Pipeline Stage',actionType:'move_pipeline',      nodeKind:'action',    defaultConfig:{target_stage:'qualified',note:''} },
  ]},
  { section: 'Flow Control', items: [
    { icon: <GitBranch size={15}/>,    color:'#f39c12', label:'Condition (If/Else)',actionType:null,nodeKind:'condition',defaultConfig:{operator:'AND',rules:[{field:'',operator:'equals',value:''}]} },
    { icon: <Clock size={15}/>,        color:'#8e44ad', label:'Delay',              actionType:null,nodeKind:'delay',    defaultConfig:{duration:1,unit:'hours'} },
  ]},
];

export default function AddNodeModal({ sourceNodeId, sourcePosition, onAdd, onClose }) {
  const handleSelect = (item) => {
    const newId = `step_${Date.now()}`;
    const newNode = {
      id:       newId,
      type:     item.nodeKind === 'condition' ? 'conditionNode' : item.nodeKind === 'delay' ? 'delayNode' : 'actionNode',
      position: {
        x: (sourcePosition?.x ?? 300),
        y: (sourcePosition?.y ?? 200) + 220,
      },
      data: {
        nodeKind:   item.nodeKind,
        stepId:     newId,
        label:      item.label,
        actionType: item.actionType,
        config:     { ...item.defaultConfig },
      },
    };
    const newEdge = {
      id:           `e-${sourceNodeId}-${newId}`,
      source:       sourceNodeId,
      target:       newId,
      sourceHandle: 'success',
      type:         'smoothstep',
      style:        { stroke: '#c5cdd6', strokeWidth: 1.5 },
    };
    onAdd(newNode, newEdge);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Add Step</span>
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',fontSize:20,color:'var(--text-muted)' }}>×</button>
        </div>
        <div className="modal-body">
          {OPTIONS.map(section => (
            <div key={section.section} style={{ marginBottom: 18 }}>
              <div className="sidebar-section-header" style={{ marginBottom: 8 }}>{section.section}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {section.items.map(item => (
                  <div
                    key={item.label}
                    onClick={() => handleSelect(item)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      background: 'var(--bg-card)',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = item.color; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)';  e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    <div style={{ width:28,height:28,borderRadius:'var(--radius-sm)',background:item.color+'20',color:item.color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                      {item.icon}
                    </div>
                    <span style={{ fontSize:12,fontWeight:500,color:'var(--text-primary)' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
