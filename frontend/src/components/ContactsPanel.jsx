import React, { useEffect, useState } from 'react';
import { contactsAPI, opportunitiesAPI, messagesAPI } from '../services/api';
import { parseDropData } from '../utils/dragHelpers';
import CollapsiblePanel from './CollapsiblePanel';

const ContactsPanel = ({ showToast, compact }) => {
  const [contacts, setContacts]       = useState([]);
  const [panelDragOver, setPanelOver] = useState(false);
  const [cardDragOver, setCardOver]   = useState(null);
  const [showForm, setShowForm]       = useState(false);
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [phone, setPhone]             = useState('');
  const [tags, setTags]               = useState('');

  const fetchContacts = async () => {
    try {
      const res = await contactsAPI.list();
      setContacts(res.data ?? []);
    } catch (err) {
      console.error('Error fetching contacts', err);
    }
  };

  useEffect(() => { fetchContacts(); }, []);

  // ── Drop handlers ──────────────────────────────────────────────
  const handlePanelDrop = async (e) => {
    e.preventDefault();
    setPanelOver(false);
    const node = parseDropData(e);
    if (!node) return;
    if (contacts.length === 0) {
      showToast?.('No contacts found — add one first', 'warning');
      return;
    }
    await applyToContact(node, contacts[0]);
  };

  const handleCardDrop = async (e, contact) => {
    e.preventDefault();
    e.stopPropagation();
    setCardOver(null);
    const node = parseDropData(e);
    if (!node) return;
    await applyToContact(node, contact);
  };

  const applyToContact = async (node, contact) => {
    const { actionType, config, label } = node;
    const cid = contact.contact_id || contact.id || contact._id;

    try {
      switch (actionType) {
        case 'send_email':
          if (!contact.email) { showToast?.(`${contact.name} has no email`, 'warning'); return; }
          await messagesAPI.sendEmail({
            to: contact.email,
            subject: config.subject ?? `Message for ${contact.name}`,
            body: config.body ?? null,
            template_id: config.template_id ?? null,
            contact_id: cid,
          });
          showToast?.(`✉  Email sent to ${contact.name} (${contact.email})`, 'success');
          break;

        case 'send_sms':
          if (!contact.phone) { showToast?.(`${contact.name} has no phone number`, 'warning'); return; }
          await messagesAPI.sendSms({
            to: contact.phone,
            body: config.body ?? '',
            template_id: config.template_id ?? null,
            contact_id: cid,
          });
          showToast?.(`💬 SMS sent to ${contact.name} (${contact.phone})`, 'success');
          break;

        case 'send_whatsapp':
          if (!contact.phone) { showToast?.(`${contact.name} has no phone`, 'warning'); return; }
          await messagesAPI.sendWhatsapp({
            to: contact.phone,
            body: config.body ?? '',
            contact_id: cid,
          });
          showToast?.(`🟢 WhatsApp sent to ${contact.name}`, 'success');
          break;

        case 'add_tag': {
          const t = config.tags ?? [];
          if (!t.length) { showToast?.('Step has no tags defined', 'warning'); return; }
          await contactsAPI.addTags(cid, t);
          showToast?.(`🏷  Tags [${t.join(', ')}] added to ${contact.name}`, 'success');
          fetchContacts();
          break;
        }

        case 'update_contact': {
          const raw = config.field_updates ?? {};
          const clean = Object.fromEntries(
            Object.entries(raw).filter(([, v]) => typeof v !== 'string' || !v.includes('{{'))
          );
          if (!Object.keys(clean).length) {
            showToast?.('All update values are template variables — cannot resolve here', 'info');
            return;
          }
          await contactsAPI.update(cid, clean);
          showToast?.(`✏  ${contact.name} updated (${Object.keys(clean).join(', ')})`, 'success');
          fetchContacts();
          break;
        }

        case 'create_opportunity':
          await opportunitiesAPI.create({
            name: config.name ?? `Opportunity for ${contact.name}`,
            contact_id: cid,
            stage: config.stage ?? 'new',
          });
          showToast?.(`💼 Opportunity created for ${contact.name}`, 'success');
          break;

        case 'move_pipeline':
          showToast?.(`"Move Stage" applies to opportunities, not contacts`, 'warning');
          break;

        default:
          showToast?.(`"${label}" (${actionType ?? 'unknown'}) cannot be applied to a contact`, 'warning');
      }
    } catch (err) {
      showToast?.(`Failed: ${err.response?.data?.detail ?? err.message}`, 'error');
    }
  };

  // ── CRUD handlers ──────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name || !email) return;
    try {
      await contactsAPI.create({
        name, email, phone,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      fetchContacts();
      setName(''); setEmail(''); setPhone(''); setTags('');
      setShowForm(false);
    } catch { showToast?.('Failed to create contact', 'error'); }
  };

  const handleDelete = async (id) => {
    try {
      await contactsAPI.delete(id);
      fetchContacts();
    } catch { showToast?.('Failed to delete contact', 'error'); }
  };

  const handleAddTag = async (id) => {
    const newTag = prompt('Enter new tag:');
    if (!newTag) return;
    try {
      await contactsAPI.addTags(id, [newTag.trim()]);
      fetchContacts();
    } catch { showToast?.('Failed to add tag', 'error'); }
  };

  return (
    <CollapsiblePanel title="Contacts CRM" icon="👤" defaultOpen>
      <div
        className={`contacts-drop-zone ${panelDragOver ? 'drop-active-contact' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setPanelOver(true); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setPanelOver(false); }}
        onDrop={handlePanelDrop}
      >
        {panelDragOver && (
          <div className="drop-hint-strip">
            ↓ Drop here to apply to {contacts[0]?.name ?? 'first contact'}
          </div>
        )}

        {contacts.map(contact => {
          const cid = contact.contact_id || contact.id || contact._id;
          return (
            <div
              key={cid}
              className={`contact-card ${cardDragOver === cid ? 'drop-active-contact' : ''}`}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setCardOver(cid); }}
              onDragLeave={() => setCardOver(null)}
              onDrop={(e) => handleCardDrop(e, contact)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="contact-avatar">
                  {contact.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="contact-name">{contact.name}</div>
                  <div className="contact-email">{contact.email}</div>
                  {contact.phone && <div className="contact-phone">{contact.phone}</div>}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => handleAddTag(cid)} style={smallBtnStyle}>+🏷</button>
                  <button onClick={() => handleDelete(cid)} style={{ ...smallBtnStyle, color: '#dc2626' }}>🗑</button>
                </div>
              </div>
              {contact.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                  {contact.tags.map(t => <span key={t} className="tag-pill">{t}</span>)}
                </div>
              )}
            </div>
          );
        })}

        {contacts.length === 0 && (
          <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '12px 0' }}>
            No contacts yet. Add one below.
          </div>
        )}

        {/* Add contact form */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            style={{
              width: '100%', marginTop: 8, padding: '6px 0', fontSize: 12,
              background: '#f1f5f9', border: '1px solid #e2e8f0',
              borderRadius: 6, cursor: 'pointer', color: '#475569',
            }}
          >
            + Add Contact
          </button>
        ) : (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} required className="input" style={{ fontSize: 12, padding: '5px 8px' }} />
            <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input" style={{ fontSize: 12, padding: '5px 8px' }} />
            <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} className="input" style={{ fontSize: 12, padding: '5px 8px' }} />
            <input placeholder="Tags (comma separated)" value={tags} onChange={e => setTags(e.target.value)} className="input" style={{ fontSize: 12, padding: '5px 8px' }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="submit" className="action-btn primary" style={{ flex: 1, padding: '5px 0', fontSize: 12, justifyContent: 'center' }}>Create</button>
              <button type="button" onClick={() => setShowForm(false)} className="action-btn secondary" style={{ padding: '5px 10px', fontSize: 12 }}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </CollapsiblePanel>
  );
};

const smallBtnStyle = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 12, padding: '2px 4px', borderRadius: 4,
};

export default ContactsPanel;
