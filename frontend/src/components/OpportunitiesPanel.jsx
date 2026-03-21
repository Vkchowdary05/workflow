import React, { useEffect, useState } from 'react';
import { opportunitiesAPI, contactsAPI } from '../services/api';
import { Briefcase, Plus } from 'lucide-react';

const OpportunitiesPanel = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [contacts, setContacts] = useState([]);
  
  const [name, setName] = useState('');
  const [contactId, setContactId] = useState('');
  const [stage, setStage] = useState('new');

  const fetchData = async () => {
    try {
      const oppRes = await opportunitiesAPI.list();
      setOpportunities(oppRes.data);
      const contRes = await contactsAPI.list();
      setContacts(contRes.data);
    } catch (err) {
      console.error("Error fetching opportunities", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name || !contactId) return;
    try {
      await opportunitiesAPI.create({ name, contact_id: contactId, stage });
      fetchData();
      setName('');
      setContactId('');
    } catch (err) {
      alert("Failed to create opportunity");
    }
  };

  const handleStageChange = async (id, newStage) => {
    try {
      await opportunitiesAPI.move(id, newStage);
      fetchData();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  return (
    <div className="panel opportunities-panel w-full">
      <div className="panel-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Briefcase size={18} /> Opportunities
        </h2>
      </div>

      <form onSubmit={handleCreate} className="create-form" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
        <input placeholder="Deal Name" value={name} onChange={e => setName(e.target.value)} required className="input" />
        <select value={contactId} onChange={e => setContactId(e.target.value)} required className="input dropdown">
          <option value="">Select Contact</option>
          {contacts.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
        </select>
        <select value={stage} onChange={e => setStage(e.target.value)} className="input dropdown">
          <option value="new">New</option>
          <option value="qualified">Qualified</option>
          <option value="proposal">Proposal</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
        <button type="submit" className="action-btn primary w-full mt-2" style={{ justifyContent: 'center' }}>
          <Plus size={16}/> Add Deal
        </button>
      </form>

      <div className="list-container mt-4" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {opportunities.map(o => (
          <div key={o.id || o._id} className="list-item" style={{ padding: '12px', background: 'var(--bg-dark)', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.95rem' }}>{o.name}</strong>
              <select 
                value={o.stage} 
                onChange={(e) => handleStageChange(o.id || o._id, e.target.value)}
                className="input mini dropdown"
                style={{ width: '100px', fontSize: '0.8rem', padding: '4px' }}
              >
                <option value="new">New</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Contact ID: {o.contact_id ? String(o.contact_id).substring(String(o.contact_id).length - 6) : 'Unknown'}
            </div>
          </div>
        ))}
        {opportunities.length === 0 && <p className="text-secondary" style={{ fontSize: '0.9rem' }}>No deals found.</p>}
      </div>
    </div>
  );
};

export default OpportunitiesPanel;
