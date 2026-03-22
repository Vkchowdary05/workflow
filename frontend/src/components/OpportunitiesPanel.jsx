import React, { useEffect, useState } from 'react';
import { opportunitiesAPI, contactsAPI, messagesAPI } from '../services/api';
import { parseDropData } from '../utils/dragHelpers';
import CollapsiblePanel from './CollapsiblePanel';

const OpportunitiesPanel = ({ showToast, compact }) => {
  const [opps, setOpps]               = useState([]);
  const [contacts, setContacts]       = useState([]);
  const [panelDragOver, setPanelOver]  = useState(false);
  const [cardDragOver, setCardOver]    = useState(null);
  const [showForm, setShowForm]        = useState(false);
  const [name, setName]                = useState('');
  const [contactId, setContactId]      = useState('');
  const [stage, setStage]              = useState('new');

  const fetchAll = async () => {
    try {
      const [oppRes, conRes] = await Promise.all([opportunitiesAPI.list(), contactsAPI.list()]);
      setOpps(oppRes.data ?? []);
      setContacts(conRes.data ?? []);
    } catch (err) {
      console.error('Error fetching data', err);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const [highlightId, setHighlightId] = useState(null);
  useEffect(() => {
    const handleExecuted = (e) => {
      const { entityType, entity } = e.detail;
      if (entityType === 'opportunity' && entity && entity.opportunity_id) {
        fetchAll().then(() => {
          setHighlightId(entity.opportunity_id);
          setTimeout(() => setHighlightId(null), 3000);
        });
      }
    };
    window.addEventListener('workflow-executed', handleExecuted);
    return () => window.removeEventListener('workflow-executed', handleExecuted);
  }, []);

  const getLinkedContact = (opp) =>
    contacts.find(c => (c.contact_id || c.id || c._id) === opp.contact_id) ?? null;

  // ── Drop handlers ──────────────────────────────────────────────
  const handlePanelDrop = async (e) => {
    e.preventDefault();
    setPanelOver(false);
    const node = parseDropData(e);
    if (!node) return;
    if (opps.length === 0) {
      showToast?.('No opportunities found — add one first', 'warning');
      return;
    }
    await applyToOpp(node, opps[0]);
  };

  const handleCardDrop = async (e, opp) => {
    e.preventDefault();
    e.stopPropagation();
    setCardOver(null);
    const node = parseDropData(e);
    if (!node) return;
    await applyToOpp(node, opp);
  };

  const applyToOpp = async (node, opp) => {
    const { actionType, config, label } = node;
    const oid = opp.opportunity_id || opp.id || opp._id;
    const linked = getLinkedContact(opp);

    try {
      switch (actionType) {
        case 'move_pipeline': {
          const st = config.target_stage;
          if (!st) { showToast?.('Step has no target_stage defined', 'warning'); return; }
          await opportunitiesAPI.move(oid, st);
          showToast?.(`⇢  "${opp.name}" moved to stage: ${st}`, 'success');
          fetchAll();
          break;
        }

        case 'update_contact': {
          if (!opp.contact_id) { showToast?.(`"${opp.name}" has no linked contact`, 'warning'); return; }
          const raw = config.field_updates ?? {};
          const clean = Object.fromEntries(
            Object.entries(raw).filter(([, v]) => typeof v !== 'string' || !v.includes('{{'))
          );
          if (!Object.keys(clean).length) {
            showToast?.('All update values are template variables — cannot resolve here', 'info');
            return;
          }
          await contactsAPI.update(opp.contact_id, clean);
          showToast?.(`✏  Contact linked to "${opp.name}" updated`, 'success');
          break;
        }

        case 'add_tag': {
          if (!opp.contact_id) { showToast?.(`"${opp.name}" has no linked contact`, 'warning'); return; }
          const tags = config.tags ?? [];
          if (!tags.length) { showToast?.('Step has no tags defined', 'warning'); return; }
          await contactsAPI.addTags(opp.contact_id, tags);
          showToast?.(`🏷  Tags [${tags.join(', ')}] added to linked contact`, 'success');
          break;
        }

        case 'send_email': {
          if (!linked?.email) {
            showToast?.(`No linked contact with email for "${opp.name}"`, 'warning');
            return;
          }
          await messagesAPI.sendEmail({
            to: linked.email,
            subject: config.subject ?? `Update on ${opp.name}`,
            contact_id: linked.contact_id || linked.id || linked._id,
          });
          showToast?.(`✉  Email sent to ${linked.name} (linked to "${opp.name}")`, 'success');
          break;
        }

        case 'send_sms': {
          if (!linked?.phone) {
            showToast?.(`No linked contact with phone for "${opp.name}"`, 'warning');
            return;
          }
          await messagesAPI.sendSms({
            to: linked.phone,
            body: config.body ?? '',
            contact_id: linked.contact_id || linked.id || linked._id,
          });
          showToast?.(`💬 SMS sent to ${linked.name} (linked to "${opp.name}")`, 'success');
          break;
        }

        case 'send_whatsapp': {
          if (!linked?.phone) {
            showToast?.(`No linked contact with phone for "${opp.name}"`, 'warning');
            return;
          }
          await messagesAPI.sendWhatsapp({
            to: linked.phone,
            body: config.body ?? '',
            contact_id: linked.contact_id || linked.id || linked._id,
          });
          showToast?.(`🟢 WhatsApp sent to ${linked.name} (linked to "${opp.name}")`, 'success');
          break;
        }

        case 'create_opportunity':
          showToast?.('"Create Opportunity" cannot be applied to an existing opportunity', 'warning');
          break;

        default:
          showToast?.(`"${label}" (${actionType ?? 'unknown'}) cannot be applied to an opportunity`, 'warning');
      }
    } catch (err) {
      showToast?.(`Failed: ${err.response?.data?.detail ?? err.message}`, 'error');
    }
  };

  // ── CRUD handlers ──────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name || !contactId) return;
    try {
      await opportunitiesAPI.create({ name, contact_id: contactId, stage });
      fetchAll();
      setName(''); setContactId(''); setShowForm(false);
    } catch { showToast?.('Failed to create opportunity', 'error'); }
  };

  const handleStageChange = async (id, newStage) => {
    try {
      await opportunitiesAPI.move(id, newStage);
      fetchAll();
    } catch { showToast?.('Failed to update stage', 'error'); }
  };

  return (
    <CollapsiblePanel title="Opportunities" icon="💼" defaultOpen>
      <div
        className={`opps-drop-zone ${panelDragOver ? 'drop-active-opp' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setPanelOver(true); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setPanelOver(false); }}
        onDrop={handlePanelDrop}
      >
        {panelDragOver && (
          <div className="drop-hint-strip">
            ↓ Drop here to apply to {opps[0]?.name ?? 'first opportunity'}
          </div>
        )}

        {opps.map(opp => {
          const oid = opp.opportunity_id || opp.id || opp._id;
          const linked = getLinkedContact(opp);
          return (
            <div
              key={oid}
              className={`opp-card ${cardDragOver === oid ? 'drop-active-opp' : ''} ${highlightId === oid ? 'highlight-new' : ''}`}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setCardOver(oid); }}
              onDragLeave={() => setCardOver(null)}
              onDrop={(e) => handleCardDrop(e, opp)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="opp-name">{opp.name}</div>
                <select
                  value={opp.stage}
                  onChange={(e) => handleStageChange(oid, e.target.value)}
                  style={{
                    fontSize: 11, padding: '2px 6px', borderRadius: 5,
                    border: '1px solid #e2e8f0', background: '#f8fafc',
                    color: '#475569', cursor: 'pointer', outline: 'none',
                  }}
                >
                  <option value="new">New</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="cold">Cold</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              {linked && (
                <div className="opp-contact">👤 {linked.name}</div>
              )}
              {!linked && opp.contact_id && (
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                  Contact: {String(opp.contact_id).slice(-6)}
                </div>
              )}
            </div>
          );
        })}

        {opps.length === 0 && (
          <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '12px 0' }}>
            No opportunities yet.
          </div>
        )}

        {/* Add opportunity form */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            style={{
              width: '100%', marginTop: 8, padding: '6px 0', fontSize: 12,
              background: '#f1f5f9', border: '1px solid #e2e8f0',
              borderRadius: 6, cursor: 'pointer', color: '#475569',
            }}
          >
            + Add Deal
          </button>
        ) : (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            <input placeholder="Deal Name" value={name} onChange={e => setName(e.target.value)} required className="input" style={{ fontSize: 12, padding: '5px 8px' }} />
            <select value={contactId} onChange={e => setContactId(e.target.value)} required className="input" style={{ fontSize: 12, padding: '5px 8px' }}>
              <option value="">Select Contact</option>
              {contacts.map(c => {
                const cid = c.contact_id || c.id || c._id;
                return <option key={cid} value={cid}>{c.name}</option>;
              })}
            </select>
            <select value={stage} onChange={e => setStage(e.target.value)} className="input" style={{ fontSize: 12, padding: '5px 8px' }}>
              <option value="new">New</option>
              <option value="qualified">Qualified</option>
              <option value="proposal">Proposal</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
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

export default OpportunitiesPanel;
