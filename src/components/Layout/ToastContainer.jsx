/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - TOAST CONTAINER (ToastContainer.jsx)
   ========================================================================== */

import React from 'react';
import { useCRM } from '../../context/CRMContext.jsx';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useCRM();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => {
        let Icon = CheckCircle2;
        let iconColor = 'var(--color-success)';

        if (toast.type === 'error') {
          Icon = AlertCircle;
          iconColor = 'var(--color-danger)';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          iconColor = 'var(--color-warning)';
        } else if (toast.type === 'info') {
          Icon = Info;
          iconColor = 'var(--color-gold)';
        }

        return (
          <div key={toast.id} className={`toast ${toast.type || 'success'}`}>
            <Icon size={18} color={iconColor} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
