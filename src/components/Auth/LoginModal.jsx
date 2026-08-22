/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - LOGIN PIN UNLOCK SCREEN (LoginModal.jsx)
   ========================================================================== */

import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext.jsx';
import { Lock, KeyRound } from 'lucide-react';

export default function LoginModal() {
  const { unlockApp } = useCRM();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin) {
      setError('Please enter your security PIN');
      return;
    }
    setLoading(true);
    setError('');

    const success = await unlockApp(pin);
    setLoading(false);
    if (!success) {
      setError('Incorrect security PIN. Please try again.');
      setPin('');
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <Lock size={32} />
        </div>
        <h2 className="login-title">Karajgikar Jewellers</h2>
        <p className="login-sub">Relationship Management Console</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: 'left', marginBottom: '20px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <KeyRound size={15} color="var(--color-gold)" /> Security PIN
            </label>
            <input
              type="password"
              className="form-input"
              style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '4px' }}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              maxLength={10}
              autoFocus
            />
          </div>

          {error && (
            <div style={{ color: 'var(--color-danger)', fontSize: '0.82rem', marginBottom: '16px', fontWeight: 500 }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Unlocking...' : 'Unlock CRM Console'}
          </button>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '14px', textAlign: 'center' }}>
            🔒 Master PIN is configured in Settings (Default: <code>1234</code>)
          </p>
        </form>
      </div>
    </div>
  );
}
