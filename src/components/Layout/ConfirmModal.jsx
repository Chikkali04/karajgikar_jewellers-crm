/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - REUSABLE CONFIRM MODAL (ConfirmModal.jsx)
   ========================================================================== */

import React from 'react';
import { useCRM } from '../../context/CRMContext.jsx';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal() {
  const { confirmDialogState, closeConfirm } = useCRM();
  const { isOpen, title, message, onConfirm } = confirmDialogState;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={closeConfirm}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-warning)' }}>
            <AlertTriangle size={20} /> {title || 'Confirm Action'}
          </h3>
        </div>

        <div className="modal-body">
          <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.6' }}>
            {message}
          </p>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={closeConfirm}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            Yes, Proceed
          </button>
        </div>
      </div>
    </div>
  );
}
