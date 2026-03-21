import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractWorkflow, validateWorkflow } from '../utils/parser';
import { workflowAPI } from '../services/api';

const UploadPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [rawJson, setRawJson] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [workflowsList, setWorkflowsList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const processFile = useCallback((file) => {
    if (!file || !file.name.endsWith('.json')) {
      setError('Please upload a .json file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        const extracted = extractWorkflow(parsed);
        const validation = validateWorkflow(extracted.trigger, extracted.steps);

        if (!validation.valid) {
          setError(validation.error);
          setPreview(null);
          setRawJson(null);
          return;
        }

        setError(null);
        setPreview(extracted);
        setRawJson(parsed);
      } catch (e) {
        setError(`Invalid JSON: ${e.message}`);
        setPreview(null);
        setRawJson(null);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e) => {
    processFile(e.target.files[0]);
  }, [processFile]);

  const handleOpenBuilder = () => {
    navigate('/builder', { state: { rawJson, extracted: preview } });
  };

  const handleLoadFromDB = async () => {
    setLoadingList(true);
    try {
      const res = await workflowAPI.list();
      setWorkflowsList(res.data || []);
      setShowModal(true);
    } catch {
      setError('Failed to load workflows from database.');
    } finally {
      setLoadingList(false);
    }
  };

  const handleSelectWorkflow = async (id) => {
    try {
      const res = await workflowAPI.getById(id);
      const extracted = extractWorkflow(res.data);
      navigate('/builder', { state: { rawJson: res.data, extracted } });
    } catch {
      setError('Failed to load workflow.');
    }
  };

  // Step type breakdown
  const getBreakdown = (steps) => {
    let actions = 0, conditions = 0, delays = 0;
    for (const s of steps) {
      if (s.type === 'condition') conditions++;
      else if (s.type === 'delay') delays++;
      else actions++;
    }
    return { actions, conditions, delays };
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #e8ecf8 50%, #f5f3ff 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
      padding: '40px 20px',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 14, height: 14, borderRadius: '50%', background: '#6366f1',
            boxShadow: '0 0 0 0 rgba(99,102,241,0.5)', animation: 'pulse 2s infinite',
          }} />
          <h1 style={{
            fontSize: 28, fontWeight: 700, margin: 0, fontFamily: 'Outfit, sans-serif',
            background: 'linear-gradient(135deg, #1e1b4b, #4f46e5)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Quantixone Workflow Builder
          </h1>
        </div>
        <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
          Upload a workflow JSON file to visualize, edit, and execute
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
        style={{
          width: '100%',
          maxWidth: 520,
          border: `2px dashed ${isDragOver ? '#6366f1' : '#a5b4fc'}`,
          borderRadius: 14,
          padding: '48px 32px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragOver ? '#eef2ff' : '#ffffff',
          transition: 'all 0.2s ease',
          boxShadow: isDragOver ? '0 0 24px rgba(99,102,241,0.15)' : '0 4px 12px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ fontSize: 42, marginBottom: 12 }}>📁</div>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#1e1b4b', marginBottom: 6 }}>
          {isDragOver ? 'Drop your JSON file here' : 'Drag & drop your workflow JSON'}
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>
          or click to browse • .json files only
        </div>
        <input
          id="file-input"
          type="file"
          accept=".json"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
      </div>

      {/* Load from DB button */}
      <button
        onClick={handleLoadFromDB}
        disabled={loadingList}
        style={{
          marginTop: 14,
          padding: '8px 20px',
          fontSize: 13,
          fontWeight: 500,
          color: '#4f46e5',
          background: 'transparent',
          border: '1px solid #c7d2fe',
          borderRadius: 8,
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        {loadingList ? '⏳ Loading...' : '📂 Load from Database'}
      </button>

      {/* Error banner */}
      {error && (
        <div style={{
          marginTop: 20,
          maxWidth: 520,
          width: '100%',
          background: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: 10,
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 10,
        }}>
          <span style={{ fontSize: 13, color: '#dc2626', lineHeight: 1.5 }}>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none', border: 'none', color: '#dc2626', fontSize: 16,
              cursor: 'pointer', padding: 0, lineHeight: 1, flexShrink: 0,
            }}
          >✕</button>
        </div>
      )}

      {/* Preview card */}
      {preview && (
        <div style={{
          marginTop: 20,
          maxWidth: 520,
          width: '100%',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: '20px 24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', margin: '0 0 6px' }}>
            {preview.name}
          </h2>
          {preview.description && (
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>
              {preview.description.length > 120
                ? preview.description.slice(0, 120) + '…'
                : preview.description}
            </p>
          )}

          {/* Tags */}
          {preview.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {preview.tags.map(t => (
                <span key={t} style={{
                  background: '#eef2ff', color: '#4338ca', fontSize: 11,
                  padding: '2px 10px', borderRadius: 12, fontWeight: 500,
                }}>{t}</span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            <span style={badgeStyle('#f1f5f9', '#475569')}>
              {preview.steps.length} steps
            </span>
            {(() => {
              const { actions, conditions, delays } = getBreakdown(preview.steps);
              return (
                <span style={badgeStyle('#f1f5f9', '#475569')}>
                  {actions} actions · {conditions} conditions · {delays} delays
                </span>
              );
            })()}
            <span style={badgeStyle('#fef3c7', '#92400e')}>
              Trigger: {preview.trigger?.type}
            </span>
          </div>

          {/* Open in Builder button */}
          <button
            onClick={handleOpenBuilder}
            style={{
              width: '100%',
              padding: '10px 0',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.15s',
              boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
            }}
          >
            Open in Builder →
          </button>
        </div>
      )}

      {/* Database workflows modal */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 100,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 14, padding: '24px',
              width: '90%', maxWidth: 480, maxHeight: '70vh', overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Select Workflow</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#475569' }}
              >✕</button>
            </div>
            {workflowsList.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: '24px 0', fontSize: 13 }}>
                No workflows stored in database.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {workflowsList.map(wf => {
                  const id = wf.workflow_id || wf.id || wf._id;
                  return (
                    <div
                      key={id}
                      onClick={() => handleSelectWorkflow(id)}
                      style={{
                        padding: '12px 14px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        cursor: 'pointer',
                        transition: 'border-color 0.15s',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
                        {wf.name || 'Unnamed Workflow'}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                        {wf.steps?.length ?? '?'} steps · Created: {wf.created_at ? new Date(wf.created_at).toLocaleDateString() : 'Unknown'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const badgeStyle = (bg, color) => ({
  background: bg,
  color,
  fontSize: 11,
  padding: '2px 10px',
  borderRadius: 12,
  fontWeight: 500,
});

export default UploadPage;
