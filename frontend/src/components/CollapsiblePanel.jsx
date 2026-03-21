import React, { useState } from 'react';

export const CollapsiblePanel = ({ title, icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 10,
      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          borderBottom: open ? '1px solid #f1f5f9' : 'none',
          userSelect: 'none',
          background: open ? '#fafbfc' : 'transparent',
          transition: 'background 0.15s',
        }}
      >
        <span style={{
          fontSize: 13,
          fontWeight: 500,
          color: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
        }}>
          {icon} {title}
        </span>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>{open ? '▾' : '▸'}</span>
      </div>
      {open && <div style={{ padding: '10px 14px' }}>{children}</div>}
    </div>
  );
};

export default CollapsiblePanel;
