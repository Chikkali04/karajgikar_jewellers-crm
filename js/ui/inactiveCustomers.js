/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - INACTIVE CUSTOMERS / WIN-BACK CONTROLLER (inactiveCustomers.js)
   Filter choices: 6 Months+, 1 Year+, 1.5 Years+, 2 Years or more
   ========================================================================== */

(function () {
  'use strict';

  window.CRM = window.CRM || {};

  /**
   * Load and render the Inactive Customers Win-Back view
   */
  async function loadInactiveCustomersList() {
    const tableBody = document.getElementById('inactive-cust-table-body');
    if (!tableBody) return;

    try {
      // 1. Fetch all customers and all purchases
      const [customers, purchases] = await Promise.all([
        window.CRM.customerService.getAllCustomers(),
        window.CRM.db.getAll('purchases')
      ]);

      // 2. Map customer spending and last purchase date
      const custDataMap = {};
      customers.forEach(c => {
        custDataMap[c.id] = {
          customer: c,
          totalSpent: 0,
          purchaseCount: 0,
          lastPurchaseDate: null,
          lastItem: null
        };
      });

      purchases.forEach(p => {
        const item = custDataMap[p.customerId];
        if (item) {
          item.totalSpent += Number(p.amount) || 0;
          item.purchaseCount += 1;
          const pDate = p.purchaseDate || p.createdAt;
          if (pDate) {
            if (!item.lastPurchaseDate || new Date(pDate) > new Date(item.lastPurchaseDate)) {
              item.lastPurchaseDate = pDate;
              item.lastItem = p.item || p.metalType || 'Jewellery Item';
            }
          }
        }
      });

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // 3. Compute inactivity days for each customer
      const inactiveRecords = [];
      customers.forEach(c => {
        const data = custDataMap[c.id];
        // Determine last activity date (last purchase or registration date)
        let lastDateStr = data.lastPurchaseDate || c.createdAt;
        if (!lastDateStr) lastDateStr = '2025-01-01'; // Fallback

        const lastDate = new Date(lastDateStr);
        lastDate.setHours(0, 0, 0, 0);

        const diffTime = now - lastDate;
        const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

        inactiveRecords.push({
          customer: c,
          totalSpent: data.totalSpent,
          purchaseCount: data.purchaseCount,
          lastPurchaseDate: data.lastPurchaseDate,
          lastItem: data.lastItem || 'Registered Client',
          daysInactive: diffDays,
          lastDateStr: lastDateStr
        });
      });

      // 4. Apply Inactivity Filter Threshold
      const periodSelect = document.getElementById('inactive-period-select');
      const customWrapper = document.getElementById('inactive-custom-days-wrapper');
      const customInput = document.getElementById('inactive-custom-days-input');

      let filterThreshold = 180;
      if (periodSelect && periodSelect.value === 'custom') {
        if (customWrapper) customWrapper.style.display = 'inline-flex';
        filterThreshold = Number(customInput ? customInput.value : 0) || 0;
      } else {
        if (customWrapper) customWrapper.style.display = 'none';
        filterThreshold = Number(periodSelect ? periodSelect.value : 180);
      }

      const searchVal = (document.getElementById('inactive-search-input') ? document.getElementById('inactive-search-input').value : '').toLowerCase().trim();
      const tierVal = document.getElementById('inactive-tier-select') ? document.getElementById('inactive-tier-select').value : '';

      let filtered = inactiveRecords.filter(item => item.daysInactive >= filterThreshold);

      // Search filter
      if (searchVal) {
        filtered = filtered.filter(item => 
          item.customer.name.toLowerCase().includes(searchVal) ||
          item.customer.mobile.includes(searchVal) ||
          (item.customer.address && item.customer.address.toLowerCase().includes(searchVal)) ||
          item.customer.id.toLowerCase().includes(searchVal)
        );
      }

      // Tier filter
      if (tierVal) {
        filtered = filtered.filter(item => {
          const tier = window.CRM.customerService.getCustomerTier(item.totalSpent);
          return tier.key === tierVal;
        });
      }

      // Sort by most inactive (longest time since last visit first)
      filtered.sort((a, b) => b.daysInactive - a.daysInactive);

      // 5. Update KPI Summary Cards
      const totalInactiveCountEl = document.getElementById('stat-inactive-count');
      const totalInactiveValueEl = document.getElementById('stat-inactive-value');
      const totalInactiveVipEl = document.getElementById('stat-inactive-vip');

      const totalLtv = filtered.reduce((sum, i) => sum + i.totalSpent, 0);
      const vipCount = filtered.filter(i => {
        const t = window.CRM.customerService.getCustomerTier(i.totalSpent);
        return t.key === 'diamond' || t.key === 'gold';
      }).length;

      if (totalInactiveCountEl) totalInactiveCountEl.textContent = filtered.length;
      if (totalInactiveValueEl) totalInactiveValueEl.textContent = `₹${totalLtv.toLocaleString('en-IN')}`;
      if (totalInactiveVipEl) totalInactiveVipEl.textContent = vipCount;

      // 6. Render Table DOM
      if (filtered.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="7">
              <div class="empty-state" style="padding: 40px 20px; text-align: center;">
                <svg style="width: 36px; height: 36px; color: var(--color-gold);"><use href="#icon-customers"></use></svg>
                <h4 style="margin-top: 10px; color: var(--color-cream);">No Lapsed Customers in this Range</h4>
                <p style="color: var(--text-muted); font-size: 0.85rem;">All your active customers have visited within the selected timeframe.</p>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      tableBody.innerHTML = '';
      filtered.forEach(item => {
        const cust = item.customer;
        const tier = window.CRM.customerService.getCustomerTier(item.totalSpent);
        const isMr = window.CRM.i18n && window.CRM.i18n.getLanguage() === 'mr';
        const tierLabel = isMr ? tier.nameMr : tier.name;

        // Human-friendly duration string
        let durationLabel = `${item.daysInactive} days`;
        let durationBadgeColor = '#FFA726'; // amber (6M)
        if (item.daysInactive >= 730) {
          durationLabel = `⚫ ${Math.floor(item.daysInactive / 365 * 10) / 10} Yrs (${item.daysInactive}d)`;
          durationBadgeColor = '#EF5350'; // red (2Y+)
        } else if (item.daysInactive >= 548) {
          durationLabel = `🔴 ~1.5 Yrs (${item.daysInactive}d)`;
          durationBadgeColor = '#FF7043'; // deep orange (1.5Y)
        } else if (item.daysInactive >= 365) {
          durationLabel = `🟠 1+ Year (${item.daysInactive}d)`;
          durationBadgeColor = '#FFA726'; // orange (1Y)
        } else {
          durationLabel = `🟡 ${Math.floor(item.daysInactive / 30)} Mos (${item.daysInactive}d)`;
          durationBadgeColor = '#FFD54F'; // yellow (6M)
        }

        const lastDateFormatted = item.lastPurchaseDate ? formatDateSimple(item.lastPurchaseDate) : 'No Purchases Yet';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <strong style="color: var(--color-gold);">${cust.id}</strong><br>
            <strong>${cust.name}</strong>
          </td>
          <td>
            <span>${cust.mobile}</span><br>
            <small class="text-muted">${cust.address || cust.city || 'Solapur'}</small>
          </td>
          <td>
            <span class="tier-badge ${tier.badgeClass}">${tier.icon} ${tierLabel}</span>
          </td>
          <td>
            <strong>${item.lastItem}</strong><br>
            <small class="text-muted">${lastDateFormatted}</small>
          </td>
          <td>
            <span style="display: inline-block; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 0.78rem; background: rgba(0,0,0,0.3); border: 1px solid ${durationBadgeColor}; color: ${durationBadgeColor};">
              ${durationLabel}
            </span>
          </td>
          <td>
            <strong style="color: var(--color-gold);">₹${item.totalSpent.toLocaleString('en-IN')}</strong>
          </td>
          <td>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              <button class="btn btn-primary btn-sm send-winback-btn" data-id="${cust.id}" data-name="${cust.name}" data-phone="${cust.mobile}" style="font-size: 0.75rem; padding: 4px 8px;">
                💬 Send Wish/Offer
              </button>
              <a href="#profile?id=${cust.id}" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 4px 8px;">Profile</a>
            </div>
          </td>
        `;
        tableBody.appendChild(tr);
      });

      // Bind Win-back message action buttons
      tableBody.querySelectorAll('.send-winback-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const custId = e.currentTarget.getAttribute('data-id');
          const custName = e.currentTarget.getAttribute('data-name');
          const custPhone = e.currentTarget.getAttribute('data-phone');
          openWinBackModal(custId, custName, custPhone);
        });
      });

    } catch (err) {
      console.error('[InactiveCustomers] Error loading list:', err);
    }
  }

  function formatDateSimple(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${parts[2].substring(0,2)} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
  }

  /**
   * Open 1-Click Win-back Invitation Modal
   */
  function openWinBackModal(customerId, customerName, customerPhone) {
    const defaultMsg = `Namaskar ${customerName}ji, Karajgikar Jewellers misses your visit! We have received an exquisite new bridal & festive jewellery collection at our Solapur showroom. Visit us this week for an exclusive preview and special making-charge offers. - Karajgikar Jewellers, Solapur`;

    const bodyHTML = `
      <div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px;">
          Send a warm re-engagement invitation message to bring <strong>${customerName}</strong> back to your showroom.
        </p>
        <div class="form-group">
          <label>Recipient Mobile:</label>
          <input type="text" value="${customerPhone}" readonly style="opacity: 0.85;">
        </div>
        <div class="form-group">
          <label>Message Content:</label>
          <textarea id="winback-msg-body" rows="4" style="font-size: 0.85rem;">${defaultMsg}</textarea>
        </div>
      </div>
    `;

    const footerHTML = `
      <button class="btn btn-secondary btn-sm" onclick="window.CRM.closeModal()">Cancel</button>
      <button class="btn btn-primary btn-sm" id="btn-queue-winback">Queue SMS Invitation</button>
    `;

    window.CRM.openModal(`Win-Back Invitation: ${customerName}`, bodyHTML, footerHTML);

    document.getElementById('btn-queue-winback').addEventListener('click', async () => {
      const msgText = document.getElementById('winback-msg-body').value.trim();
      if (!msgText) return;

      const newMsg = {
        id: `MSG-WINBACK-${customerId}-${Date.now()}`,
        customerId: customerId,
        customerName: customerName,
        mobile: customerPhone,
        channel: 'SMS',
        type: 'WINBACK',
        message: msgText,
        status: 'PENDING',
        autoGenerated: false,
        createdAt: new Date().toISOString()
      };

      await window.CRM.db.put('messages', newMsg);
      window.CRM.closeModal();
      if (window.showToast) {
        window.showToast(`Win-back invitation queued for ${customerName}!`, 'success');
      }
    });
  }

  // 4. EVENT LISTENERS
  window.addEventListener('crm-navigate', (event) => {
    if (event.detail && event.detail.route === 'inactive') {
      loadInactiveCustomersList();
    }
  });

  window.addEventListener('crm-language-changed', () => {
    const inactivePanel = document.getElementById('view-inactive');
    if (inactivePanel && inactivePanel.classList.contains('active')) {
      loadInactiveCustomersList();
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    const periodSelect = document.getElementById('inactive-period-select');
    const tierSelect = document.getElementById('inactive-tier-select');
    const searchInput = document.getElementById('inactive-search-input');
    const customInput = document.getElementById('inactive-custom-days-input');

    if (periodSelect) periodSelect.addEventListener('change', loadInactiveCustomersList);
    if (tierSelect) tierSelect.addEventListener('change', loadInactiveCustomersList);
    if (searchInput) searchInput.addEventListener('input', loadInactiveCustomersList);
    if (customInput) customInput.addEventListener('input', loadInactiveCustomersList);
  });

  // Export to global CRM namespace
  window.CRM.inactiveCustomers = {
    loadInactiveCustomersList,
    openWinBackModal
  };

})();
