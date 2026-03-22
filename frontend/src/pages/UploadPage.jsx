import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractWorkflow, validateWorkflow } from '../utils/parser';
import { workflowAPI, templatesAPI } from '../services/api';
import { Upload, Database, LayoutTemplate, Plus } from 'lucide-react';

export default function UploadPage() {
  const navigate      = useNavigate();
  const [error, setError]       = useState(null);
  const [preview, setPreview]   = useState(null);
  const [rawJson, setRawJson]   = useState(null);
  const [dragOver, setDragOver] = useState(false);

  /* ── modals ── */
  const [showDbModal, setShowDbModal]   = useState(false);
  const [showTplModal, setShowTplModal] = useState(false);
  const [dbList, setDbList]             = useState([]);
  const [tplList, setTplList]           = useState([]);
  const [loadingDb, setLoadingDb]       = useState(false);
  const [loadingTpl, setLoadingTpl]     = useState(false);

  /* ── File processing ── */
  const processFile = useCallback((file) => {
    if (!file || !file.name.endsWith('.json')) { setError('Please upload a .json file.'); return; }
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed    = JSON.parse(evt.target.result);
        const extracted = extractWorkflow(parsed);
        const validation= validateWorkflow(extracted.trigger, extracted.steps);
        if (!validation.valid) { setError(validation.error); setPreview(null); setRawJson(null); return; }
        setError(null); setPreview(extracted); setRawJson(parsed);
      } catch (e) { setError(`Invalid JSON: ${e.message}`); setPreview(null); setRawJson(null); }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(e => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files[0]); }, [processFile]);
  const handleFileInput = useCallback(e => processFile(e.target.files[0]), [processFile]);
  const openBuilder = () => navigate('/builder', { state: { rawJson, extracted: preview } });

  /* ── Load from DB ── */
  const openDbModal = async () => {
    setShowDbModal(true); setLoadingDb(true);
    try { const res = await workflowAPI.list(); setDbList(res.data || []); } catch {} finally { setLoadingDb(false); }
  };
  const selectFromDb = async (id) => {
    try {
      const res = await workflowAPI.getById(id);
      const ext = extractWorkflow(res.data);
      navigate('/builder', { state: { rawJson: res.data, extracted: ext } });
    } catch {}
    setShowDbModal(false);
  };

  /* ── Templates ── */
  const openTplModal = async () => {
    setShowTplModal(true); setLoadingTpl(true);
    try { const res = await templatesAPI.list(); setTplList(res.data?.templates || []); } catch {} finally { setLoadingTpl(false); }
  };
  const cloneTemplate = async (tplId) => {
    try {
      const res = await templatesAPI.clone(tplId, {});
      const wfRes = await workflowAPI.getById(res.data.workflow_id);
      const ext = extractWorkflow(wfRes.data);
      navigate('/builder', { state: { rawJson: wfRes.data, extracted: ext } });
    } catch {}
    setShowTplModal(false);
  };

  /* ── Create blank ── */
  const createBlank = async () => {
    try {
      const res = await workflowAPI.create({
        name: 'Untitled Workflow',
        description: '',
        trigger: { type: 'contact_created', label: 'Contact Created', config: {} },
        steps: [],
        tags: [],
      });
      const id = res.data.workflow_id;
      const wfRes = await workflowAPI.getById(id);
      const ext = extractWorkflow(wfRes.data);
      navigate('/builder', { state: { rawJson: wfRes.data, extracted: ext } });
    } catch {}
  };

  const breakdown = (steps = []) => {
    let a=0,c=0,d=0;
    for (const s of steps) { if(s.type==='condition') c++; else if(s.type==='delay') d++; else a++; }
    return `${a} actions · ${c} conditions · ${d} delays`;
  };

  return (
    <div className="upload-page">
      <div style={{ textAlign:'center', marginBottom:32 }}>
        <h1 style={{ fontFamily:'var(--font-heading)', fontSize:24, fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>
          Quantixone Workflow Builder
        </h1>
        <p style={{ fontSize:13, color:'var(--text-muted)' }}>Create, import, or pick a template to get started</p>
      </div>

      {/* Action Row */}
      <div className="action-cards-grid">
        <ActionCard icon={<Database size={24}/>} title="Load from DB" desc="Open saved workflow" onClick={openDbModal} />
        <ActionCard icon={<LayoutTemplate size={24}/>} title="Templates" desc="Start from template" onClick={openTplModal} />
      </div>

      {/* Drop Zone */}
      <div
        className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
        style={{ width:'100%', maxWidth:520 }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
      >
        <div className="drop-zone-icon">📁</div>
        <div className="drop-zone-title">{dragOver ? 'Drop JSON file here' : 'Drag & drop JSON workflow'}</div>
        <div className="drop-zone-sub">or click to browse</div>
      </div>
      <input id="file-input" type="file" accept=".json" onChange={handleFileInput} style={{ display:'none' }} />

      {error && (
        <div style={{ marginTop:16, maxWidth:520, width:'100%', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'var(--radius-md)', padding:'10px 14px', color:'#991b1b', fontSize:13 }}>
          {error}
        </div>
      )}

      {preview && (
        <div className="card" style={{ marginTop:16, maxWidth:520, width:'100%' }}>
          <div className="card-body">
            <h3 style={{ fontSize:16, fontWeight:600, marginBottom:8 }}>{preview.name}</h3>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
              <span className="badge badge-info">{preview.steps.length} steps</span>
              <span className="badge badge-inactive">{breakdown(preview.steps)}</span>
            </div>
            <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }} onClick={openBuilder}>
              Open in Builder →
            </button>
          </div>
        </div>
      )}

      {/* DB Modal */}
      {showDbModal && (
        <div className="modal-overlay" onClick={() => setShowDbModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Load from Database</span><button onClick={() => setShowDbModal(false)} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:'var(--text-muted)'}}>×</button></div>
            <div className="modal-body">
              {loadingDb ? <p style={{color:'var(--text-muted)'}}>Loading…</p> : dbList.length === 0 ? <p style={{color:'var(--text-muted)'}}>No saved workflows found.</p> : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {dbList.map(wf => {
                    const id = wf.workflow_id || wf.id || wf._id;
                    return (
                      <div key={id} onClick={() => selectFromDb(id)} style={{
                        padding:'10px 14px', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', transition:'background 0.12s'
                      }} onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <div>
                          <div style={{ fontWeight:600, fontSize:13 }}>{wf.name || 'Untitled'}</div>
                          <div style={{ fontSize:11, color:'var(--text-muted)' }}>{wf.steps?.length ?? 0} steps</div>
                        </div>
                        <span className={`badge ${wf.status === 'active' ? 'badge-success' : 'badge-inactive'}`}>{wf.status || 'draft'}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTplModal && (
        <div className="modal-overlay" onClick={() => setShowTplModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Choose a Template</span><button onClick={() => setShowTplModal(false)} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:'var(--text-muted)'}}>×</button></div>
            <div className="modal-body">
              {loadingTpl ? <p style={{color:'var(--text-muted)'}}>Loading…</p> : tplList.length === 0 ? <p style={{color:'var(--text-muted)'}}>No templates available.</p> : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {tplList.map(tpl => (
                    <div key={tpl.template_id} onClick={() => cloneTemplate(tpl.template_id)} style={{
                      padding:'12px 14px', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', cursor:'pointer', transition:'background 0.12s'
                    }} onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <div style={{ fontWeight:600, fontSize:13, marginBottom:4 }}>{tpl.name}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>{tpl.description}</div>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:6 }}>
                        {(tpl.tags||[]).map(t => <span key={t} className="tag-pill">{t}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionCard({ icon, title, desc, onClick, accent }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 120, padding:'18px 12px', textAlign:'center', borderRadius:'var(--radius-lg)',
        border: accent ? '2px solid var(--accent-green)' : '1px solid var(--border)',
        background: accent ? '#f0fdf4' : 'var(--bg-card)',
        cursor:'pointer', transition:'all 0.15s', boxShadow:'var(--shadow-sm)',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shadow-md)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='var(--shadow-sm)'; }}
    >
      <div style={{ color: accent ? 'var(--accent-green)' : 'var(--accent-blue)', marginBottom:8, display:'flex', justifyContent:'center' }}>{icon}</div>
      <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', marginBottom:2 }}>{title}</div>
      <div style={{ fontSize:11, color:'var(--text-muted)' }}>{desc}</div>
    </div>
  );
}
