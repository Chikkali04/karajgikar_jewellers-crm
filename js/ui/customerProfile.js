/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - CUSTOMER PROFILE CONTROLLER (customerProfile.js)
   ========================================================================== */

// 1. MODULE LOCAL STATE
const profileState = {
  currentCustomerId: null,
  activeCustomer: null
};

// 2. RENDER CUSTOMER PROFILE DATA
async function loadCustomerProfile(id) {
  profileState.currentCustomerId = id;
  
  try {
    // 1. Fetch customer details
    const customer = await window.CRM.customerService.getCustomer(id);
    if (!customer) {
      window.CRM.showToast('Customer not found in database.', 'error');
      window.location.hash = '#customers';
      return;
    }
    profileState.activeCustomer = customer;

    // 2. Render Profile Sidebar Details
    document.getElementById('prof-name').textContent = customer.name;
    document.getElementById('prof-id').textContent = customer.id;
    document.getElementById('prof-mobile').textContent = customer.mobile;
    document.getElementById('prof-whatsapp').textContent = customer.whatsapp || customer.mobile;
    document.getElementById('prof-email').textContent = customer.email || '-';
    document.getElementById('prof-address').textContent = customer.address || '-';
    document.getElementById('prof-dob').textContent = customer.dateOfBirth ? formatDateString(customer.dateOfBirth) : '-';
    document.getElementById('prof-anniversary').textContent = customer.anniversaryDate ? formatDateString(customer.anniversaryDate) : '-';
    
    // Set Category status pill
    const categorySpan = document.getElementById('prof-category');
    categorySpan.textContent = customer.category;
    categorySpan.className = `profile-meta-value status-badge ${customer.category.toLowerCase()}`;

    // Set Avatar initials (e.g. Rahul Sharma -> RS)
    const avatar = document.getElementById('prof-avatar');
    const initials = customer.name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
    avatar.textContent = initials;

    // Set notes text box
    document.getElementById('prof-notes-textarea').value = customer.notes || '';

    // 3. Query Linked Purchases & Follow-ups
    const purchases = await window.CRM.db.getAllByIndex('purchases', 'customerId', id);
    const followUps = await window.CRM.db.getAllByIndex('followUps', 'customerId', id);

    // 4. Calculate & Render Statistics & VIP Tier
    const totalSpending = purchases.reduce((sum, pur) => sum + Number(pur.amount), 0);
    const tier = window.CRM.customerService.getCustomerTier(totalSpending);
    const isMr = window.CRM.i18n && window.CRM.i18n.getLanguage() === 'mr';
    const tierLabel = isMr ? tier.nameMr : tier.name;

    categorySpan.innerHTML = `<span class="tier-badge ${tier.badgeClass}">${tier.icon} ${tierLabel}</span>`;

    document.getElementById('prof-stat-spending').textContent = `₹${totalSpending.toLocaleString('en-IN')}`;
    document.getElementById('prof-stat-purchase-count').textContent = purchases.length;
    document.getElementById('prof-stat-fu-count').textContent = followUps.length;

    // 5. Render History Lists
    renderPurchaseHistoryTable(purchases);
    renderFollowUpHistoryTable(followUps);
    renderOverviewTimeline(purchases, followUps);

  } catch (err) {
    console.error('Failed to load customer profile details:', err);
    window.CRM.showToast('Error loading profile details.', 'error');
  }
}

// Helper: Format date strings neatly (e.g., 2026-08-13 -> 13 Aug 2026)
function formatDateString(dateStr) {
  if (!dateStr) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return `${day} ${months[monthIndex]} ${year}`;
  }
  return dateStr;
}

// 3. TAB RENDERING UTILITIES

// Render Purchase History Tab Table
function renderPurchaseHistoryTable(purchases) {
  const tableBody = document.getElementById('prof-purchase-table-body');
  if (!tableBody) return;

  if (purchases.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state" style="padding: 20px;">
            <svg style="width:24px;height:24px;"><use href="#icon-purchases"></use></svg>
            <h4>No purchases recorded yet</h4>
            <p>Use the "Record Purchase" button to log jewellery sales.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  // Sort purchases by date descending (Newest first)
  purchases.sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate));

  tableBody.innerHTML = '';
  purchases.forEach(pur => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${formatDateString(pur.purchaseDate)}</strong></td>
      <td><strong>${pur.productName}</strong></td>
      <td><span class="status-badge regular">${pur.category}</span></td>
      <td><strong style="color: var(--color-gold);">₹${Number(pur.amount).toLocaleString('en-IN')}</strong></td>
      <td class="text-muted">${pur.notes || '-'}</td>
    `;
    tableBody.appendChild(tr);
  });
}

// Render Follow-up History Tab Table
function renderFollowUpHistoryTable(followUps) {
  const tableBody = document.getElementById('prof-followup-table-body');
  if (!tableBody) return;

  if (followUps.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state" style="padding: 20px;">
            <svg style="width:24px;height:24px;"><use href="#icon-followups"></use></svg>
            <h4>No follow-ups recorded yet</h4>
            <p>Use "Create Follow-up" to schedule callbacks.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  // Sort followups by date descending (Newest first)
  followUps.sort((a, b) => b.followUpDate.localeCompare(a.followUpDate));

  tableBody.innerHTML = '';
  followUps.forEach(fu => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${formatDateString(fu.followUpDate)}</strong></td>
      <td><strong>${fu.purpose}</strong></td>
      <td><span class="status-badge ${fu.status.toLowerCase()}">${fu.status}</span></td>
      <td class="text-muted">${fu.notes || '-'}</td>
      <td>
        <button class="btn btn-secondary btn-sm edit-profile-fu-btn" data-id="${fu.id}">Manage</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  // Bind click events to manage buttons
  tableBody.querySelectorAll('.edit-profile-fu-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      if (window.CRM.ui && window.CRM.ui.followUps) {
        window.CRM.ui.followUps.openManageFollowUpModal(id);
      }
    });
  });
}

// Render last purchase and next follow-up in the Overview tab
function renderOverviewTimeline(purchases, followUps) {
  const lastPurDiv = document.getElementById('prof-last-purchase-display');
  const nextFuDiv = document.getElementById('prof-next-followup-display');

  // 1. Last Purchase display
  if (purchases.length === 0) {
    lastPurDiv.innerHTML = `<p class="text-muted">No purchase records found.</p>`;
  } else {
    // Sort to get the latest
    purchases.sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate));
    const latest = purchases[0];
    lastPurDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong style="font-size: 1.1rem; color: var(--color-gold);">${latest.productName}</strong>
          <p class="text-muted" style="font-size:0.8rem;">Category: ${latest.category} | Date: ${formatDateString(latest.purchaseDate)}</p>
        </div>
        <strong style="font-size: 1.2rem; color: var(--color-gold);">₹${Number(latest.amount).toLocaleString('en-IN')}</strong>
      </div>
    `;
  }

  // 2. Next Active Follow-up display
  const activeFollowups = followUps.filter(fu => fu.status === 'PENDING' || fu.status === 'RESCHEDULED');
  if (activeFollowups.length === 0) {
    nextFuDiv.innerHTML = `<p class="text-muted">No active follow-ups scheduled.</p>`;
  } else {
    // Sort ascending to get the closest upcoming follow-up date
    activeFollowups.sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));
    const closest = activeFollowups[0];
    nextFuDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong style="font-size: 1.1rem; color: var(--color-gold);">${closest.purpose}</strong>
          <p class="text-muted" style="font-size:0.8rem;">Scheduled: ${formatDateString(closest.followUpDate)}</p>
        </div>
        <span class="status-badge pending">${closest.status}</span>
      </div>
    `;
  }
}

// 4. NOTES & TABS INTERACTION HANDLERS
async function saveRelationshipNotes() {
  const notesText = document.getElementById('prof-notes-textarea').value.trim();
  
  if (!profileState.activeCustomer) return;
  
  try {
    profileState.activeCustomer.notes = notesText;
    await window.CRM.customerService.updateCustomer(profileState.activeCustomer);
    window.CRM.showToast('Relationship notes saved successfully.', 'success');
  } catch (err) {
    console.error(err);
    window.CRM.showToast('Failed to save notes.', 'error');
  }
}

// Set up listeners for the profile view tabs
function initProfileTabNav() {
  const tabButtons = document.querySelectorAll('.profile-tabs-container .tab-nav .tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Deactivate other tabs
      tabButtons.forEach(b => b.classList.remove('active'));
      const contents = document.querySelectorAll('.profile-tabs-container .tab-content');
      contents.forEach(c => c.classList.remove('active'));

      // Activate clicked tab
      btn.classList.add('active');
      const tabName = btn.getAttribute('data-tab');
      document.getElementById(`tab-${tabName}`).classList.add('active');
    });
  });

  // Save Notes trigger
  const saveNotesBtn = document.getElementById('prof-notes-save-btn');
  if (saveNotesBtn) {
    saveNotesBtn.addEventListener('click', saveRelationshipNotes);
  }

  // Back Button Navigation
  const backBtn = document.getElementById('profile-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.hash = '#customers';
    });
  }

  // Edit details inside profile
  const editDetailsBtn = document.getElementById('profile-edit-btn');
  if (editDetailsBtn) {
    editDetailsBtn.addEventListener('click', () => {
      if (profileState.currentCustomerId) {
        // Triggers the edit modal built in customers.js
        window.CRM.ui.customers.openCustomerModal(profileState.currentCustomerId);
      }
    });
  }

  // Prefill and open purchase modal from customer profile page
  const addPurchaseBtn = document.getElementById('profile-add-purchase-btn');
  const addFuBtn = document.getElementById('profile-add-fu-btn');

  if (addPurchaseBtn) {
    addPurchaseBtn.addEventListener('click', () => {
      if (profileState.currentCustomerId) {
        window.CRM.ui.purchases.openAddPurchaseModal(profileState.currentCustomerId);
      }
    });
  }
  if (addFuBtn) {
    addFuBtn.addEventListener('click', () => {
      if (profileState.currentCustomerId) {
        window.CRM.ui.followUps.openAddFollowUpModal(profileState.currentCustomerId);
      }
    });
  }
}

// 5. VIEW NAVIGATION OBSERVER
window.addEventListener('crm-navigate', (event) => {
  if (event.detail.route === 'profile') {
    const customerId = event.detail.params.id;
    if (customerId) {
      loadCustomerProfile(customerId);
    } else {
      window.location.hash = '#customers';
    }
  }
});

// Initialize listeners
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProfileTabNav);
} else {
  initProfileTabNav();
}
