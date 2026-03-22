import React, { useState } from 'react';
import { Search, Mail, MessageSquare, Phone, Tag, User, Briefcase, ArrowRight, GitBranch, Clock, Zap } from 'lucide-react';
import ContactsPanel from './ContactsPanel';
import OpportunitiesPanel from './OpportunitiesPanel';
import ExecutionLogs from './ExecutionLogs';

const PALETTE_SECTIONS = [
  {
    section: 'Messaging',
    items: [
      { icon: <Mail size={14}/>,          color: '#1b6ac9', label: 'Send Email',          actionType: 'send_email',         nodeKind: 'action',    defaultConfig: { to: '', subject: '', track_opens: true, track_clicks: true } },
      { icon: <MessageSquare size={14}/>, color: '#27ae60', label: 'Send SMS',            actionType: 'send_sms',           nodeKind: 'action',    defaultConfig: { to: '', body: '' } },
      { icon: <Phone size={14}/>,         color: '#25d366', label: 'Send WhatsApp',       actionType: 'send_whatsapp',      nodeKind: 'action',    defaultConfig: { to: '', body: '' } },
    ],
  },
  {
    section: 'CRM Actions',
    items: [
      { icon: <Tag size={14}/>,         color: '#e67e22', label: 'Add Tag',              actionType: 'add_tag',            nodeKind: 'action',    defaultConfig: { tags: [] } },
      { icon: <User size={14}/>,        color: '#e67e22', label: 'Update Contact',       actionType: 'update_contact',     nodeKind: 'action',    defaultConfig: { field_updates: {} } },
      { icon: <Briefcase size={14}/>,   color: '#e67e22', label: 'Create Opportunity',   actionType: 'create_opportunity', nodeKind: 'action',    defaultConfig: { name: 'New Deal', stage: 'new' } },
      { icon: <ArrowRight size={14}/>,  color: '#e67e22', label: 'Move Pipeline Stage',  actionType: 'move_pipeline',      nodeKind: 'action',    defaultConfig: { target_stage: 'qualified', note: '' } },
    ],
  },
  {
    section: 'Flow Control',
    items: [
      { icon: <GitBranch size={14}/>, color: '#f39c12', label: 'Condition (If/Else)', actionType: null, nodeKind: 'condition', defaultConfig: { operator: 'AND', rules: [{ field: '', operator: 'equals', value: '' }] } },
      { icon: <Clock size={14}/>,     color: '#8e44ad', label: 'Delay',              actionType: null, nodeKind: 'delay',     defaultConfig: { duration: 1, unit: 'hours', skip_weekends: false } },
    ],
  },
  {
    section: 'Triggers (reference)',
    items: [
      { icon: <Zap size={14}/>, color: '#6c63ff', label: 'Contact Created',      actionType: null, nodeKind: 'trigger', defaultConfig: {}, triggerType: 'contact_created',       draggable: false },
      { icon: <Zap size={14}/>, color: '#6c63ff', label: 'Pipeline Changed',     actionType: null, nodeKind: 'trigger', defaultConfig: {}, triggerType: 'pipeline_stage_changed', draggable: false },
      { icon: <Zap size={14}/>, color: '#6c63ff', label: 'Incoming Webhook',     actionType: null, nodeKind: 'trigger', defaultConfig: {}, triggerType: 'webhook',               draggable: false },
    ],
  },
];

function PaletteCard({ item }) {
  const isDraggable = item.draggable !== false;
  const handleDragStart = (e) => {
    if (!isDraggable) { e.preventDefault(); return; }
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/quantixone-palette', JSON.stringify({
      actionType:    item.actionType,
      nodeKind:      item.nodeKind,
      label:         item.label,
      defaultConfig: item.defaultConfig,
      triggerType:   item.triggerType || null,
    }));
  };
  return (
    <div
      className="palette-card"
      draggable={isDraggable}
      onDragStart={handleDragStart}
      style={{ opacity: isDraggable ? 1 : 0.5, cursor: isDraggable ? 'grab' : 'default' }}
    >
      <div className="palette-card-icon" style={{ background: item.color + '20', color: item.color }}>
        {item.icon}
      </div>
      <span className="palette-card-label">{item.label}</span>
    </div>
  );
}

export default function LeftSidebar({ showToast, workflowId }) {
  const [search, setSearch]       = useState('');
  const [activeTab, setActiveTab] = useState('contacts');

  const filtered = PALETTE_SECTIONS.map(s => ({
    ...s,
    items: s.items.filter(i => i.label.toLowerCase().includes(search.toLowerCase())),
  })).filter(s => s.items.length > 0);

  return (
    <div className="left-sidebar">
      {/* Search */}
      <div className="sidebar-search">
        <div className="sidebar-search-wrapper">
          <Search size={13} className="sidebar-search-icon" style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search Components"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Palette */}
      <div className="sidebar-scroll" style={{ maxHeight: '52%' }}>
        {filtered.map(section => (
          <div key={section.section}>
            <div className="sidebar-section-header">{section.section}</div>
            {section.items.map(item => <PaletteCard key={item.label} item={item} />)}
          </div>
        ))}
      </div>

      {/* Bottom tabs: Contacts / Deals / Logs */}
      <div className="sidebar-bottom">
        <div className="sidebar-tabs">
          <button className={`sidebar-tab-btn ${activeTab==='contacts'?'active':''}`} onClick={()=>setActiveTab('contacts')}>Contacts</button>
          <button className={`sidebar-tab-btn ${activeTab==='opps'?'active':''}`} onClick={()=>setActiveTab('opps')}>Deals</button>
          <button className={`sidebar-tab-btn ${activeTab==='logs'?'active':''}`} onClick={()=>setActiveTab('logs')}>Logs</button>
        </div>
        <div className="sidebar-tab-content">
          {activeTab === 'contacts' && <ContactsPanel showToast={showToast} compact />}
          {activeTab === 'opps'     && <OpportunitiesPanel showToast={showToast} compact />}
          {activeTab === 'logs'     && <ExecutionLogs currentWorkflowId={workflowId} compact />}
        </div>
      </div>
    </div>
  );
}
