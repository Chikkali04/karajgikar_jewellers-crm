/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - GOLD & SILVER RATE SERVICE (goldRateService.js)
   ========================================================================== */

(function () {
  'use strict';

  window.CRM = window.CRM || {};

  const DEFAULT_RATES = {
    key: 'gold_rates',
    gold24k: 7450,
    gold22k: 6850,
    gold18k: 5600,
    silver: 88,
    updatedAt: new Date().toISOString()
  };

  /**
   * Fetch current daily rates from IndexedDB or return defaults
   */
  async function getRates() {
    if (!window.CRM.db) return DEFAULT_RATES;
    try {
      const stored = await window.CRM.db.get('settings', 'gold_rates');
      if (stored) {
        return stored;
      }
      // Seed default rates
      await window.CRM.db.put('settings', DEFAULT_RATES);
      return DEFAULT_RATES;
    } catch (err) {
      console.error('[GoldRateService] Error fetching rates:', err);
      return DEFAULT_RATES;
    }
  }

  /**
   * Save updated rates into IndexedDB
   */
  async function saveRates(newRates) {
    if (!window.CRM.db) return;
    try {
      const record = {
        key: 'gold_rates',
        gold24k: Number(newRates.gold24k) || 7450,
        gold22k: Number(newRates.gold22k) || 6850,
        gold18k: Number(newRates.gold18k) || 5600,
        silver: Number(newRates.silver) || 88,
        updatedAt: new Date().toISOString()
      };
      await window.CRM.db.put('settings', record);
      renderTickerUI();
      if (window.showToast) {
        window.showToast('Today\'s Gold & Silver rates updated successfully!', 'success');
      }
      return record;
    } catch (err) {
      console.error('[GoldRateService] Error saving rates:', err);
      if (window.showToast) window.showToast('Failed to save rates.', 'error');
    }
  }

  /**
   * Render rates inside topbar ticker banner
   */
  async function renderTickerUI() {
    const rates = await getRates();
    
    const el22k = document.getElementById('ticker-rate-22k');
    const el24k = document.getElementById('ticker-rate-24k');
    const el18k = document.getElementById('ticker-rate-18k');
    const elSilver = document.getElementById('ticker-rate-silver');
    const elUpdated = document.getElementById('ticker-rate-time');

    if (el22k) el22k.textContent = `₹${rates.gold22k.toLocaleString('en-IN')}/g`;
    if (el24k) el24k.textContent = `₹${rates.gold24k.toLocaleString('en-IN')}/g`;
    if (el18k) el18k.textContent = `₹${rates.gold18k.toLocaleString('en-IN')}/g`;
    if (elSilver) elSilver.textContent = `₹${rates.silver.toLocaleString('en-IN')}/g`;
    
    if (elUpdated && rates.updatedAt) {
      const date = new Date(rates.updatedAt);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      elUpdated.textContent = `Updated: ${timeStr}`;
    }
  }

  /**
   * Open rate update modal
   */
  async function openRateUpdateModal() {
    const rates = await getRates();

    const bodyHTML = `
      <form id="gold-rate-update-form">
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 15px;">
          Enter today's showroom retail rates per gram. These rates are displayed in the top ticker and used for price estimation.
        </p>
        <div class="form-grid">
          <div class="form-group">
            <label for="rate-input-22k"><strong>22K Gold (916 Hallmarked) / gram *</strong></label>
            <div style="position: relative;">
              <input type="number" id="rate-input-22k" value="${rates.gold22k}" step="1" required style="font-size: 1.1rem; font-weight: bold; color: var(--color-gold);">
            </div>
          </div>
          <div class="form-group">
            <label for="rate-input-24k"><strong>24K Pure Gold / gram *</strong></label>
            <input type="number" id="rate-input-24k" value="${rates.gold24k}" step="1" required style="font-size: 1.1rem; font-weight: bold; color: var(--color-gold);">
          </div>
          <div class="form-group">
            <label for="rate-input-18k"><strong>18K Jewellery Gold / gram</strong></label>
            <input type="number" id="rate-input-18k" value="${rates.gold18k}" step="1" required style="font-size: 1.1rem; font-weight: bold;">
          </div>
          <div class="form-group">
            <label for="rate-input-silver"><strong>Fine Silver (999) / gram *</strong></label>
            <input type="number" id="rate-input-silver" value="${rates.silver}" step="0.5" required style="font-size: 1.1rem; font-weight: bold; color: #90CAF9;">
          </div>
        </div>
      </form>
    `;

    const footerHTML = `
      <button class="btn btn-secondary btn-sm" onclick="window.CRM.closeModal()">Cancel</button>
      <button class="btn btn-primary btn-sm" id="btn-save-rates">Update Today's Rates</button>
    `;

    window.CRM.openModal('Update Today\'s Gold & Silver Rates', bodyHTML, footerHTML);

    const saveBtn = document.getElementById('btn-save-rates');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const val22k = document.getElementById('rate-input-22k').value;
        const val24k = document.getElementById('rate-input-24k').value;
        const val18k = document.getElementById('rate-input-18k').value;
        const valSilver = document.getElementById('rate-input-silver').value;

        if (!val22k || !val24k || !valSilver) {
          if (window.showToast) window.showToast('Please fill all required rate fields.', 'error');
          return;
        }

        await saveRates({
          gold22k: val22k,
          gold24k: val24k,
          gold18k: val18k,
          silver: valSilver
        });

        window.CRM.closeModal();
      });
    }
  }

  /**
   * Calculate estimate based on metal type and weight
   */
  async function calculateEstimate(metalType, weightGrams) {
    if (!weightGrams || weightGrams <= 0) return 0;
    const rates = await getRates();
    let ratePerGram = rates.gold22k;

    const lowerMetal = (metalType || '').toLowerCase();
    if (lowerMetal.includes('24k') || lowerMetal.includes('pure')) {
      ratePerGram = rates.gold24k;
    } else if (lowerMetal.includes('18k')) {
      ratePerGram = rates.gold18k;
    } else if (lowerMetal.includes('silver') || lowerMetal.includes('चांदी')) {
      ratePerGram = rates.silver;
    } else {
      ratePerGram = rates.gold22k;
    }

    return Math.round(weightGrams * ratePerGram);
  }

  // Export to global CRM namespace
  window.CRM.goldRateService = {
    getRates,
    saveRates,
    renderTickerUI,
    openRateUpdateModal,
    calculateEstimate
  };

})();
