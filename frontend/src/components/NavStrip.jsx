import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, GitBranch, HelpCircle, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { icon: <LayoutGrid size={18} />, path: '/',          title: 'Home' },
  { icon: <GitBranch size={18} />, path: '/workflows',  title: 'Workflows' },
];

export default function NavStrip() {
  const navigate  = useNavigate();
  const location  = useLocation();
  return (
    <div className="nav-strip">
      <div className="nav-strip-logo" onClick={() => navigate('/')}>Q</div>
      {NAV_ITEMS.map(item => (
        <button
          key={item.path}
          className={`nav-strip-item ${location.pathname === item.path ? 'active' : ''}`}
          title={item.title}
          onClick={() => navigate(item.path)}
        >
          {item.icon}
        </button>
      ))}
      <div className="nav-strip-spacer" />
      <div className="nav-strip-divider" />
      <button className="nav-strip-item" title="Settings"><Settings size={18} /></button>
      <button className="nav-strip-item" title="Help"><HelpCircle size={18} /></button>
    </div>
  );
}
