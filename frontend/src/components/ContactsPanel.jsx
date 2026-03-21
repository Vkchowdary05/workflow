import React, { useEffect, useState } from 'react';
import { contactsAPI } from '../services/api';
import { Users, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

const ContactsPanel = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tags, setTags] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editPhone, setEditPhone] = useState('');

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await contactsAPI.list();
      setContacts(res.data);
    } catch (err) {
      console.error("Error fetching contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContacts(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name || !email) return;
    try {
      await contactsAPI.create({ 
        name, 
        email, 
        phone, 
        tags: tags.split(',').map(t => t.trim()).filter(Boolean) 
      });
      fetchContacts();
      setName(''); setEmail(''); setPhone(''); setTags('');
    } catch (err) { alert("Failed to create contact"); }
  };

  const handleDelete = async (id) => {
    try {
      await contactsAPI.delete(id);
      fetchContacts();
    } catch (err) { alert("Failed to delete contact"); }
  };

  const startEdit = (contact) => {
    setEditingId(contact.id || contact._id);
    setEditPhone(contact.phone || '');
  };

  const saveEdit = async (id) => {
    try {
      await contactsAPI.update(id, { phone: editPhone });
      setEditingId(null);
      fetchContacts();
    } catch (err) { alert("Failed to update contact"); }
  };

  const handleAddTag = async (id) => {
    const newTag = prompt("Enter new tag for this contact:");
    if (!newTag) return;
    try {
      await contactsAPI.addTags(id, [newTag.trim()]);
      fetchContacts();
    } catch (err) { alert("Failed to add tag"); }
  };

  return (
    <div className="panel contacts-panel w-full">
      <div className="panel-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Users size={18} /> Contacts CRM
        </h2>
      </div>
      
      <form onSubmit={handleCreate} className="create-form" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} required className="input" />
        <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input" />
        <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} className="input" />
        <input placeholder="Tags (comma separated)" value={tags} onChange={e => setTags(e.target.value)} className="input" />
        <button type="submit" className="action-btn primary w-full mt-2" style={{ justifyContent: 'center' }}><Plus size={16}/> Add Contact</button>
      </form>

      <div className="list-container mt-4" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {loading ? <p>Loading...</p> : contacts.map(c => (
          <div key={c.id || c._id} className="list-item flex-col" style={{ padding: '12px', background: 'var(--bg-dark)', borderRadius: '6px' }}>
            <div className="flex-between">
              <div>
                <div style={{ fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.email}</div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button className="action-btn secondary small" onClick={() => startEdit(c)}><Edit2 size={12} /></button>
                <button className="action-btn danger small" onClick={() => handleDelete(c.id || c._id)}><Trash2 size={12} /></button>
              </div>
            </div>

            {editingId === (c.id || c._id) ? (
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                <input value={editPhone} onChange={e => setEditPhone(e.target.value)} className="input mini" placeholder="Phone" />
                <button className="action-btn success small" onClick={() => saveEdit(c.id || c._id)}><Check size={12} /></button>
                <button className="action-btn danger small" onClick={() => setEditingId(null)}><X size={12} /></button>
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Phone: {c.phone || 'N/A'}
              </div>
            )}

            <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {c.tags?.map(t => <span key={t} className="tag">{t}</span>)}
              <button className="action-btn secondary small" onClick={() => handleAddTag(c.id || c._id)} style={{ padding: '2px 6px', fontSize: '0.65rem' }}>+ Tag</button>
            </div>
          </div>
        ))}
        {!loading && contacts.length === 0 && <p className="text-secondary text-sm">No contacts found.</p>}
      </div>
    </div>
  );
};
export default ContactsPanel;
