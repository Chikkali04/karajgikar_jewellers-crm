/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - PURCHASES UI CONTROLLER (purchases.js)
   ========================================================================== */

// 1. RENDER GLOBAL PURCHASES LIST TABLE
async function loadPurchasesList() {
  const tableBody = document.getElementById('purchases-table-body');
  if (!tableBody) return;

  try {
    // Fetch all purchases and customers in parallel
    const [purchases, customers] = await Promise.all([
      window.CRM.purchaseService.getAllPurchases(),
      window.CRM.customerService.getAllCustomers()
    ]);

    // Create a fast ID-to-Name map for quick lookup
    const customerMap = {};
    customers.forEach(c => {
      customerMap[c.id] = c.name;
    });

    if (purchases.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="empty-state">
              <svg style="width: 36px; height: 36px;"><use href="#icon-purchases"></use></svg>
              <h4>No Purchase Records Found</h4>
              <p>Click "Record Purchase" to add jewelry sales transactions.</p>
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
      const customerName = customerMap[pur.customerId] || 'Deleted Customer';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color: var(--color-gold);">${pur.id}</strong></td>
        <td>${pur.customerId}</td>
        <td><strong>${customerName}</strong></td>
        <td><strong>${pur.productName}</strong></td>
        <td><span class="status-badge regular">${pur.category}</span></td>
        <td><strong style="color: var(--color-gold);">₹${Number(pur.amount).toLocaleString('en-IN')}</strong></td>
        <td>${formatDateString(pur.purchaseDate)}</td>
        <td>
          <button class="btn btn-danger btn-sm delete-pur-btn" data-id="${pur.id}">Delete</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    // Attach click events to delete buttons
    tableBody.querySelectorAll('.delete-pur-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        triggerDeletePurchase(id);
      });
    });

  } catch (err) {
    console.error('Failed to load purchases directory:', err);
    window.CRM.showToast('Error loading purchases.', 'error');
  }
}

// Helper: Format date neatly
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

// 2. DELETE PURCHASE LOGIC
async function triggerDeletePurchase(id) {
  window.CRM.confirmModal(
    `Are you sure you want to delete purchase record ${id}? This will decrease the customer's total spending stats.`,
    async () => {
      try {
        await window.CRM.purchaseService.deletePurchase(id);
        window.CRM.showToast('Purchase record deleted successfully.', 'success');
        
        // Reload current view
        if (window.CRM.state.activeView === 'profile') {
          // Refresh profile if we are viewing it
          const currentHash = window.location.hash;
          const parts = currentHash.split('?id=');
          if (parts[1]) window.CRM.runProfileRefresh(parts[1]);
        } else if (window.CRM.state.activeView === 'dashboard') {
          if (window.CRM.runDashboardRefresh) window.CRM.runDashboardRefresh();
        }
      } catch (err) {
        console.error(err);
        window.CRM.showToast('Deletion failed.', 'error');
      }
    },
    { title: "Delete Purchase Ledger Entry", confirmText: "Yes, Delete", isDanger: true }
  );
}

// 3. OPEN RECORD PURCHASE MODAL FORM
async function openAddPurchaseModal(prefilledCustomerId = null) {
  try {
    // Fetch all customers to populate dropdown
    const customers = await window.CRM.customerService.getAllCustomers();
    
    if (customers.length === 0) {
      window.CRM.showToast('No customers registered. Please add a customer first.', 'warning');
      window.location.hash = '#customers';
      return;
    }

    // Default purchase date to today (YYYY-MM-DD)
    const todayStr = window.CRM.getLocalDateStr();

    // Build Customer select option lists
    let customerOptions = '';
    customers.forEach(c => {
      const isSelected = c.id === prefilledCustomerId ? 'selected' : '';
      customerOptions += `<option value="${c.id}" ${isSelected}>${c.name} (${c.id})</option>`;
    });

    const title = "Record Jewellery Purchase";

    const bodyHTML = `
      <form id="purchase-form">
        <div class="form-grid">
          <div class="form-group full-width">
            <label for="pur-form-cust">Select Customer *</label>
            <select id="pur-form-cust" ${prefilledCustomerId ? 'disabled' : ''}>
              ${customerOptions}
            </select>
          </div>
          <div class="form-group">
            <label for="pur-form-product">Product Name / Description *</label>
            <input type="text" id="pur-form-product" placeholder="e.g. Gold Necklace, Diamond Ring" required>
          </div>
          <div class="form-group">
            <label for="pur-form-category">Metal Category *</label>
            <select id="pur-form-category">
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
              <option value="Diamond">Diamond</option>
              <option value="Platinum">Platinum</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label for="pur-form-amount">Amount (INR ₹) *</label>
            <input type="number" id="pur-form-amount" placeholder="e.g. 52000" min="1" required>
          </div>
          <div class="form-group">
            <label for="pur-form-date">Purchase Date *</label>
            <input type="date" id="pur-form-date" value="${todayStr}" required>
          </div>
          <div class="form-group full-width">
            <label for="pur-form-notes">Purchase Notes</label>
            <textarea id="pur-form-notes" placeholder="design details, custom order reference, size, weight details"></textarea>
          </div>
        </div>
      </form>
    `;

    const footerHTML = `
      <button class="btn btn-secondary" onclick="window.CRM.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="pur-form-save-btn">Save Purchase</button>
    `;

    window.CRM.openModal(title, bodyHTML, footerHTML);

    // Bind save click
    document.getElementById('pur-form-save-btn').addEventListener('click', () => {
      // If disabled, we still want the value from the select
      const customerId = document.getElementById('pur-form-cust').value;
      handleSavePurchase(customerId);
    });

  } catch (err) {
    console.error(err);
    window.CRM.showToast('Failed to open purchase form.', 'error');
  }
}

// 4. SAVE PURCHASE HANDLER
async function handleSavePurchase(customerId) {
  const productName = document.getElementById('pur-form-product').value.trim();
  const category = document.getElementById('pur-form-category').value;
  const amount = document.getElementById('pur-form-amount').value;
  const purchaseDate = document.getElementById('pur-form-date').value;
  const notes = document.getElementById('pur-form-notes').value.trim();

  // Validations
  if (!customerId) {
    window.CRM.showToast('Please select a customer.', 'error');
    return;
  }
  if (!productName) {
    window.CRM.showToast('Please enter a product description.', 'error');
    return;
  }
  if (!amount || Number(amount) <= 0) {
    window.CRM.showToast('Please enter a valid purchase amount.', 'error');
    return;
  }
  if (!purchaseDate) {
    window.CRM.showToast('Please select a transaction date.', 'error');
    return;
  }

  const payload = { customerId, productName, category, amount, purchaseDate, notes };

  try {
    const saved = await window.CRM.purchaseService.addPurchase(payload);
    window.CRM.showToast(`Purchase ${saved.id} recorded successfully.`, 'success');
    window.CRM.closeModal();

    // Reload active view state
    if (window.CRM.state.activeView === 'profile') {
      // Refresh current profile statistics and lists
      const currentHash = window.location.hash;
      const parts = currentHash.split('?id=');
      if (parts[1]) window.CRM.runProfileRefresh(parts[1]);
    } else if (window.CRM.state.activeView === 'dashboard') {
      if (window.CRM.runDashboardRefresh) window.CRM.runDashboardRefresh();
    }
  } catch (err) {
    console.error(err);
    window.CRM.showToast('Failed to save purchase details.', 'error');
  }
}

// 5. VIEW NAVIGATION NAVIGATION
window.addEventListener('crm-navigate', (event) => {
  if (event.detail.route === 'purchases') {
    loadPurchasesList();
  }
});

// Setup click triggers on startup
function initPurchasesUI() {
  const globalAddBtn = document.getElementById('purchase-add-btn');
  const dashAddBtn = document.getElementById('dash-action-add-pur');
  
  if (globalAddBtn) {
    globalAddBtn.addEventListener('click', () => openAddPurchaseModal());
  }
  if (dashAddBtn) {
    dashAddBtn.addEventListener('click', () => openAddPurchaseModal());
  }
}

// Global hook for refreshing profiles from other modules
window.CRM.runProfileRefresh = function(id) {
  // If there's a custom refresh binding in profile, trigger it
  const navigateEvent = new CustomEvent('crm-navigate', {
    detail: { route: 'profile', params: { id } }
  });
  window.dispatchEvent(navigateEvent);
};

// Export form function under CRM UI namespace
window.CRM.ui = window.CRM.ui || {};
window.CRM.ui.purchases = {
  openAddPurchaseModal: openAddPurchaseModal
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPurchasesUI);
} else {
  initPurchasesUI();
}
