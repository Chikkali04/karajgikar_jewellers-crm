/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - CUSTOMERS UI CONTROLLER (customers.js)
   ========================================================================== */

// 1. STATE & ELEMENTS REFERENCES
const uiState = {
  currentEditId: null
};

// 2. LOAD & RENDER CUSTOMERS LIST
async function loadCustomerList() {
  const tableBody = document.getElementById('customer-table-body');
  if (!tableBody) return;

  try {
    // Fetch all customers from IndexedDB Service
    let customers = await window.CRM.customerService.getAllCustomers();

    // 1. Apply Search Filter
    const searchVal = document.getElementById('cust-search-input').value.trim().toLowerCase();
    if (searchVal) {
      customers = customers.filter(cust => 
        cust.id.toLowerCase().includes(searchVal) || 
        cust.name.toLowerCase().includes(searchVal) || 
        cust.mobile.includes(searchVal)
      );
    }

    // 2. Apply Category Status Filter
    const filterCat = document.getElementById('cust-filter-category').value;
    if (filterCat) {
      customers = customers.filter(cust => cust.category === filterCat);
    }

    // 3. Apply Sorting
    const sortBy = document.getElementById('cust-sort-by').value;
    customers.sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name);
      } else if (sortBy === 'id-desc') {
        return b.id.localeCompare(a.id); // Newest Counter ID first
      } else if (sortBy === 'id-asc') {
        return a.id.localeCompare(b.id); // Oldest first
      }
      return 0;
    });

    // 4. Compute customer spending map for VIP Tiers
    const allPurchases = await window.CRM.db.getAll('purchases');
    const spendingMap = {};
    allPurchases.forEach(p => {
      spendingMap[p.customerId] = (spendingMap[p.customerId] || 0) + Number(p.amount);
    });

    // 5. Render Table DOM
    if (customers.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <svg style="width: 36px; height: 36px;"><use href="#icon-customers"></use></svg>
              <h4>No Customers Found</h4>
              <p>Try clearing filters or click "Add Customer" to register a new client.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = '';
    customers.forEach(cust => {
      const totalSpent = spendingMap[cust.id] || 0;
      const tier = window.CRM.customerService.getCustomerTier(totalSpent);
      const isMr = window.CRM.i18n && window.CRM.i18n.getLanguage() === 'mr';
      const tierLabel = isMr ? tier.nameMr : tier.name;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color: var(--color-gold);">${cust.id}</strong></td>
        <td><strong>${cust.name}</strong></td>
        <td>${cust.mobile}</td>
        <td><span class="tier-badge ${tier.badgeClass}">${tier.icon} ${tierLabel}</span></td>
        <td><strong style="color: var(--color-gold);">₹${totalSpent.toLocaleString('en-IN')}</strong></td>
        <td class="text-muted" style="font-size:0.8rem;">${cust.address || cust.city || '-'}</td>
        <td>
          <div style="display: flex; gap: 8px;">
            <a href="#profile?id=${cust.id}" class="btn btn-secondary btn-sm">View Profile</a>
            <button class="btn btn-secondary btn-sm edit-cust-btn" data-id="${cust.id}">Edit</button>
            <button class="btn btn-danger btn-sm delete-cust-btn" data-id="${cust.id}">Delete</button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    // Attach click listeners to Edit and Delete buttons dynamically
    tableBody.querySelectorAll('.edit-cust-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        openCustomerModal(id);
      });
    });

    tableBody.querySelectorAll('.delete-cust-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        triggerDeleteCustomer(id);
      });
    });

  } catch (err) {
    console.error('Failed to load customers view:', err);
    window.CRM.showToast('Failed to load customers.', 'error');
  }
}

// 3. DELETE CUSTOMER EVENT HANDLER
async function triggerDeleteCustomer(id) {
  window.CRM.confirmModal(
    `Are you sure you want to permanently delete customer ${id}? This will erase all purchase history and follow-ups.`,
    async () => {
      try {
        await window.CRM.customerService.deleteCustomer(id);
        window.CRM.showToast('Customer record deleted successfully.', 'success');
        loadCustomerList();
      } catch (err) {
        console.error(err);
        window.CRM.showToast('Deletion failed.', 'error');
      }
    },
    { title: "Delete Customer Profile", confirmText: "Yes, Delete", isDanger: true }
  );
}

// 4. OPEN ADD/EDIT CUSTOMER MODAL VIEW
async function openCustomerModal(id = null) {
  uiState.currentEditId = id;
  const isEdit = id !== null;
  let clientData = {
    name: '', mobile: '', whatsapp: '', email: '',
    address: '', dateOfBirth: '', anniversaryDate: '',
    category: 'New', notes: ''
  };

  if (isEdit) {
    try {
      const res = await window.CRM.customerService.getCustomer(id);
      if (res) clientData = res;
    } catch (err) {
      console.error(err);
      window.CRM.showToast('Failed to load client details.', 'error');
      return;
    }
  }

  const modalTitle = isEdit ? `Edit Customer Details (${id})` : 'Register New Walk-in Customer';

  const bodyHTML = `
    <form id="cust-form">
      <div class="form-grid">
        <div class="form-group">
          <label for="cust-form-name">Full Name *</label>
          <input type="text" id="cust-form-name" value="${clientData.name}" placeholder="e.g. Rahul Sharma" required>
        </div>
        <div class="form-group">
          <label for="cust-form-mobile">Mobile Number *</label>
          <input type="tel" id="cust-form-mobile" value="${clientData.mobile}" placeholder="10-digit phone" required>
        </div>
        <div class="form-group">
          <label for="cust-form-whatsapp">WhatsApp Number</label>
          <input type="tel" id="cust-form-whatsapp" value="${clientData.whatsapp}" placeholder="Leave blank to match mobile">
        </div>
        <div class="form-group">
          <label>Customer Status Category *</label>
          <div style="display: flex; gap: 15px; margin-top: 8px; flex-wrap: wrap; align-items: center;">
            <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-weight: normal; font-size: 0.9rem;">
              <input type="radio" name="cust-category" value="New" ${clientData.category === 'New' ? 'checked' : ''}> New
            </label>
            <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-weight: normal; font-size: 0.9rem;">
              <input type="radio" name="cust-category" value="Regular" ${clientData.category === 'Regular' ? 'checked' : ''}> Regular
            </label>
            <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-weight: normal; font-size: 0.9rem;">
              <input type="radio" name="cust-category" value="VIP" ${clientData.category === 'VIP' ? 'checked' : ''}> VIP
            </label>
            <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-weight: normal; font-size: 0.9rem;">
              <input type="radio" name="cust-category" value="Inactive" ${clientData.category === 'Inactive' ? 'checked' : ''}> Inactive
            </label>
          </div>
        </div>
        <div class="form-group">
          <label for="cust-form-email">Email Address</label>
          <input type="email" id="cust-form-email" value="${clientData.email}" placeholder="optional">
        </div>
        <div class="form-group">
          <label for="cust-form-dob">Birth Date</label>
          <input type="date" id="cust-form-dob" value="${clientData.dateOfBirth}">
        </div>
        <div class="form-group">
          <label for="cust-form-anniversary">Anniversary Date</label>
          <input type="date" id="cust-form-anniversary" value="${clientData.anniversaryDate}">
        </div>
        <div class="form-group full-width">
          <label for="cust-form-address">Physical Address</label>
          <input type="text" id="cust-form-address" value="${clientData.address}" placeholder="Solapur address details">
        </div>
        <div class="form-group full-width">
          <label for="cust-form-notes">Relationship Notes / Preferences</label>
          <textarea id="cust-form-notes" placeholder="metal preference, sizes, diamond qualities, etc.">${clientData.notes}</textarea>
        </div>
      </div>
    </form>
  `;

  const footerHTML = `
    <button class="btn btn-secondary" onclick="window.CRM.closeModal()">Cancel</button>
    <button class="btn btn-primary" id="cust-form-save-btn">Save Record</button>
  `;

  window.CRM.openModal(modalTitle, bodyHTML, footerHTML);

  // Bind Form Save handler
  document.getElementById('cust-form-save-btn').addEventListener('click', handleSaveCustomerSubmit);
}

// 5. FORM SUBMIT & DUPLICATE PROMPT INTERACTION
async function handleSaveCustomerSubmit(event) {
  event.preventDefault();
  
  const name = document.getElementById('cust-form-name').value.trim();
  const mobile = document.getElementById('cust-form-mobile').value.trim();
  let whatsapp = document.getElementById('cust-form-whatsapp').value.trim();
  const email = document.getElementById('cust-form-email').value.trim();
  const category = document.querySelector('input[name="cust-category"]:checked').value;
  const dateOfBirth = document.getElementById('cust-form-dob').value;
  const anniversaryDate = document.getElementById('cust-form-anniversary').value;
  const address = document.getElementById('cust-form-address').value.trim();
  const notes = document.getElementById('cust-form-notes').value.trim();

  // 1. Validation Checks
  if (!name) {
    window.CRM.showToast('Please enter customer name.', 'error');
    return;
  }
  if (!mobile || mobile.length < 10) {
    window.CRM.showToast('Please enter a valid 10-digit mobile number.', 'error');
    return;
  }
  if (!whatsapp) {
    whatsapp = mobile; // Default to match mobile number
  }

  const payload = {
    name, mobile, whatsapp, email, category, dateOfBirth, anniversaryDate, address, notes
  };

  // 2. Handle Edit Save
  if (uiState.currentEditId) {
    payload.id = uiState.currentEditId;
    try {
      await window.CRM.customerService.updateCustomer(payload);
      window.CRM.showToast('Customer details updated successfully.', 'success');
      window.CRM.closeModal();
      loadCustomerList();
    } catch (err) {
      console.error(err);
      window.CRM.showToast('Failed to update details.', 'error');
    }
    return;
  }

  // 3. Handle Add New - Check Duplicates
  try {
    const dupResult = await window.CRM.customerService.checkDuplicateCustomer(name, mobile);
    
    if (dupResult.isDuplicate) {
      // Prompt duplicate warning
      showDuplicateWarning(dupResult, payload);
    } else {
      // Save directly
      await saveCustomerDirect(payload);
    }
  } catch (err) {
    console.error(err);
    window.CRM.showToast('Error verifying duplicate status.', 'error');
  }
}

// Helper to save data directly
async function saveCustomerDirect(payload) {
  try {
    const saved = await window.CRM.customerService.addCustomer(payload);
    window.CRM.showToast(`Saved customer ${saved.id} successfully.`, 'success');
    window.CRM.closeModal();
    loadCustomerList();
  } catch (err) {
    console.error(err);
    window.CRM.showToast('Failed to save customer.', 'error');
  }
}

// Display Duplicate Warning Prompt Modal
function showDuplicateWarning(dupResult, payload) {
  const matched = dupResult.customer;
  let reason = '';
  if (dupResult.duplicateMobile) {
    reason = `Another customer with this mobile number (${matched.mobile}) already exists: <strong>${matched.name}</strong> (${matched.id}).`;
  } else if (dupResult.duplicateName) {
    reason = `Another customer with a similar name already exists: <strong>${matched.name}</strong> (${matched.id}, Phone: ${matched.mobile}).`;
  }

  const title = "Possible Existing Customer Found";
  const bodyHTML = `
    <div style="padding: 10px; border-left: 4px solid var(--color-warning); background: rgba(239, 108, 0, 0.08); margin-bottom: 20px;">
      <p style="font-size: 0.9rem; color: var(--color-cream);">${reason}</p>
    </div>
    <p style="font-size: 0.85rem; color: var(--text-muted);">
      Do you want to check the existing customer's profile, or proceed with registering this customer anyway?
    </p>
  `;

  const footerHTML = `
    <button class="btn btn-secondary" id="dup-action-cancel">Cancel Registration</button>
    <a href="#profile?id=${matched.id}" class="btn btn-secondary" style="line-height: normal; display: inline-flex;" id="dup-action-view">View Existing Profile</a>
    <button class="btn btn-primary" id="dup-action-save">Create Anyway</button>
  `;

  window.CRM.openModal(title, bodyHTML, footerHTML);

  // Bind duplicate warning actions
  document.getElementById('dup-action-cancel').addEventListener('click', () => {
    window.CRM.closeModal();
  });
  document.getElementById('dup-action-view').addEventListener('click', () => {
    window.CRM.closeModal();
  });
  document.getElementById('dup-action-save').addEventListener('click', async () => {
    await saveCustomerDirect(payload);
  });
}

// 6. VIEW NAVIGATION HANDLER INIT
window.addEventListener('crm-navigate', (event) => {
  if (event.detail.route === 'customers') {
    loadCustomerList();
  }
});

// Setup event listeners on startup
function initCustomersUI() {
  const searchInput = document.getElementById('cust-search-input');
  const filterCat = document.getElementById('cust-filter-category');
  const sortBy = document.getElementById('cust-sort-by');
  const addBtn = document.getElementById('cust-add-btn');
  const dashAddBtn = document.getElementById('dash-action-add-cust');

  if (searchInput) searchInput.addEventListener('input', loadCustomerList);
  if (filterCat) filterCat.addEventListener('change', loadCustomerList);
  if (sortBy) sortBy.addEventListener('change', loadCustomerList);
  
  if (addBtn) addBtn.addEventListener('click', () => openCustomerModal());
  if (dashAddBtn) dashAddBtn.addEventListener('click', () => openCustomerModal());
}

// Initialize when DOM is parsed
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCustomersUI);
} else {
  initCustomersUI();
}
