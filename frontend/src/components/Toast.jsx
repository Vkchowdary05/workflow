import React from 'react';

export const ToastContainer = ({ toasts }) => (
  <div className="toast-container">
    {toasts.map(t => (
      <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>
    ))}
  </div>
);

export default ToastContainer;
