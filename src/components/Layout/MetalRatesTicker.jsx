/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - METAL RATES TICKER (MetalRatesTicker.jsx)
   ========================================================================== */

import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext.jsx';
import { Coins, Edit3, X, Check } from 'lucide-react';

export default function MetalRatesTicker() {
  const { metalRates, updateRates, t } = useCRM();
  const [isEditing, setIsEditing] = useState(false);
  const [formRates, setFormRates] = useState({ ...metalRates });

  const handleOpenEdit = () => {
    setFormRates({ ...metalRates });
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await updateRates(formRates);
    setIsEditing(false);
  };

  return (
    <>
      <div className="rates-ticker">
        <div className="rates-ticker-left">
          <div className="rates-ticker-title">
            <Coins size={16} color="var(--color-gold)" />
            <span>{t('rates_ticker_title')}</span>
          </div>

          <div className="rates-badges-group">
            <div className="rate-badge gold-22k">
              <span className="metal-label">22K Gold (916):</span>
              <span className="metal-value">₹{Number(metalRates.gold22k || 0).toLocaleString('en-IN')}/g</span>
            </div>

            <div className="rate-badge">
              <span className="metal-label">24K Pure:</span>
              <span className="metal-value">₹{Number(metalRates.gold24k || 0).toLocaleString('en-IN')}/g</span>
            </div>

            <div className="rate-badge">
              <span className="metal-label">18K Gold:</span>
              <span className="metal-value">₹{Number(metalRates.gold18k || 0).toLocaleString('en-IN')}/g</span>
            </div>

            <div className="rate-badge silver">
              <span className="metal-label">Silver (999):</span>
              <span className="metal-value">₹{Number(metalRates.silver || 0).toLocaleString('en-IN')}/g</span>
            </div>
          </div>
        </div>

        <div className="rates-ticker-right">
          <span className="ticker-timestamp">
            {metalRates.updatedAt ? `Updated ${new Date(metalRates.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Live Rates'}
          </span>
          <button className="btn-edit-rates" onClick={handleOpenEdit}>
            <Edit3 size={12} style={{ display: 'inline', marginRight: '4px' }} />
            {t('edit_rates')}
          </button>
        </div>
      </div>

      {/* Edit Rates Modal */}
      {isEditing && (
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coins size={20} /> Update Today's Metal Rates
              </h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setIsEditing(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">22K Gold Rate (₹ per gram)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formRates.gold22k}
                    onChange={(e) => setFormRates({ ...formRates, gold22k: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">24K Pure Gold Rate (₹ per gram)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formRates.gold24k}
                    onChange={(e) => setFormRates({ ...formRates, gold24k: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">18K Gold Rate (₹ per gram)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formRates.gold18k}
                    onChange={(e) => setFormRates({ ...formRates, gold18k: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Silver Rate (₹ per gram)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formRates.silver}
                    onChange={(e) => setFormRates({ ...formRates, silver: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} /> Save Daily Rates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
