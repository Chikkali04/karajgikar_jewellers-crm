/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - FOLLOWUPS UI CONTROLLER (followUps.js)
   ========================================================================== */

// 1. STATE REFERENCE
const fuState = {
  activeTab: 'pending' // pending (today), upcoming, overdue, completed
};

// 2. RENDER BOARD LISTS
async function loadFollowUpsList() {
  const tableBody = document.getElementById('followup-table-body');
  if (!tableBody) return;

  try {
    // Fetch all follow-ups and customers in parallel
    const [followUps, customers] = await Promise.all([
      window.CRM.followUpService.getAllFollowUps(),
      window.CRM.customerService.getAllCustomers()
    ]);

    // Create lookup map
    const customerMap = {};
    customers.forEach(c => {
      customerMap[c.id] = c.name;
    });

    // Get today's date in local YYYY-MM-DD format
    const todayStr = window.CRM.getLocalDateStr();

    // Filter followups based on active tab selection
    let filtered = [];
    if (fuState.activeTab === 'pending') {
      // Today's due tasks
      filtered = followUps.filter(fu => 
        (fu.status === 'PENDING' || fu.status === 'RESCHEDULED') && 
        fu.followUpDate === todayStr
      );
      filtered.sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));
    } else if (fuState.activeTab === 'upcoming') {
      // Future tasks
      filtered = followUps.filter(fu => 
        (fu.status === 'PENDING' || fu.status === 'RESCHEDULED') && 
        fu.followUpDate > todayStr
      );
      filtered.sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));
    } else if (fuState.activeTab === 'overdue') {
      // Overdue tasks (due in past and still pending)
      filtered = followUps.filter(fu => 
        (fu.status === 'PENDING' || fu.status === 'RESCHEDULED') && 
        fu.followUpDate < todayStr
      );
      filtered.sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));
    } else if (fuState.activeTab === 'completed') {
      // Completed, Cancelled historical records
      filtered = followUps.filter(fu => 
        fu.status === 'COMPLETED' || fu.status === 'CANCELLED'
      );
      filtered.sort((a, b) => b.followUpDate.localeCompare(a.followUpDate)); // Newest finished first
    }

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state">
              <svg style="width: 36px; height: 36px;"><use href="#icon-followups"></use></svg>
              <h4>No Follow-up Tasks</h4>
              <p>Nothing in this section. Create a follow-up to remind you later!</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = '';
    filtered.forEach(fu => {
      const customerName = customerMap[fu.customerId] || 'Deleted Customer';
      
      // Determine Action button style
      let actionBtnHTML = '';
      if (fu.status === 'PENDING' || fu.status === 'RESCHEDULED') {
        actionBtnHTML = `<button class="btn btn-primary btn-sm manage-fu-btn" data-id="${fu.id}">Manage</button>`;
      } else {
        actionBtnHTML = `<button class="btn btn-danger btn-sm delete-fu-btn" data-id="${fu.id}">Delete Log</button>`;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${formatDateString(fu.followUpDate)}</strong></td>
        <td>${fu.customerId}</td>
        <td><strong>${customerName}</strong></td>
        <td><strong>${fu.purpose}</strong></td>
        <td><span class="status-badge ${fu.status.toLowerCase()}">${fu.status}</span></td>
        <td>
          <div style="display: flex; gap: 8px;">
            <a href="#profile?id=${fu.customerId}" class="btn btn-secondary btn-sm">Profile</a>
            ${actionBtnHTML}
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    // Bind event clicks
    tableBody.querySelectorAll('.manage-fu-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        openManageFollowUpModal(id);
      });
    });

    tableBody.querySelectorAll('.delete-fu-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        triggerDeleteFollowUp(id);
      });
    });

  } catch (err) {
    console.error('Failed to render follow-ups listing:', err);
    window.CRM.showToast('Error loading follow-ups list.', 'error');
  }
}

// Helper: Format date string
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

// Helper: Refresh whichever view is currently active (dashboard, list, or profile)
function refreshActiveFollowUpView() {
  if (window.CRM.state.activeView === 'followups') {
    loadFollowUpsList();
  } else if (window.CRM.state.activeView === 'dashboard') {
    if (window.CRM.runDashboardRefresh) window.CRM.runDashboardRefresh();
  } else if (window.CRM.state.activeView === 'profile') {
    const currentHash = window.location.hash;
    const parts = currentHash.split('?id=');
    if (parts[1]) window.CRM.runProfileRefresh(parts[1]);
  }
}

// 3. DELETE FOLLOW-UP LOGIC
async function triggerDeleteFollowUp(id) {
  window.CRM.confirmModal(
    `Are you sure you want to permanently delete follow-up log ${id}? This action is irreversible.`,
    async () => {
      try {
        await window.CRM.followUpService.deleteFollowUp(id);
        window.CRM.showToast('Follow-up record deleted.', 'success');
        refreshActiveFollowUpView();
      } catch (err) {
        console.error(err);
        window.CRM.showToast('Failed to delete.', 'error');
      }
    },
    { title: "Delete Follow-up Task", confirmText: "Yes, Delete", isDanger: true }
  );
}

// 4. OPEN CREATE FOLLOW-UP FORM MODAL
async function openAddFollowUpModal(prefilledCustomerId = null) {
  try {
    const customers = await window.CRM.customerService.getAllCustomers();
    if (customers.length === 0) {
      window.CRM.showToast('No customers registered. Add a customer first.', 'warning');
      window.location.hash = '#customers';
      return;
    }

    // Default scheduled date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = window.CRM.getLocalDateStr(tomorrow);

    let customerOptions = '';
    customers.forEach(c => {
      const isSelected = c.id === prefilledCustomerId ? 'selected' : '';
      customerOptions += `<option value="${c.id}" ${isSelected}>${c.name} (${c.id})</option>`;
    });

    const title = "Schedule Follow-up Call";

    const bodyHTML = `
      <form id="followup-form">
        <div class="form-grid">
          <div class="form-group full-width">
            <label for="fu-form-cust">Select Customer *</label>
            <select id="fu-form-cust" ${prefilledCustomerId ? 'disabled' : ''}>
              ${customerOptions}
            </select>
          </div>
          <div class="form-group">
            <label for="fu-form-date">Follow-up Date *</label>
            <input type="date" id="fu-form-date" value="${tomorrowStr}" required>
          </div>
          <div class="form-group">
            <label for="fu-form-purpose">Purpose / Enquiry details *</label>
            <input type="text" id="fu-form-purpose" placeholder="e.g. Gold ring design callback, Wedding order follow-up" required>
          </div>
          <div class="form-group full-width">
            <label for="fu-form-notes">Initial Enquiry Notes</label>
            <textarea id="fu-form-notes" placeholder="likes the 12g gold band design, wants to confirm size with family"></textarea>
          </div>
        </div>
      </form>
    `;

    const footerHTML = `
      <button class="btn btn-secondary" onclick="window.CRM.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="fu-form-save-btn">Save Schedule</button>
    `;

    window.CRM.openModal(title, bodyHTML, footerHTML);

    document.getElementById('fu-form-save-btn').addEventListener('click', () => {
      const customerId = document.getElementById('fu-form-cust').value;
      handleSaveFollowUp(customerId);
    });

  } catch (err) {
    console.error(err);
    window.CRM.showToast('Failed to open follow-up form.', 'error');
  }
}

// Save follow-up action
async function handleSaveFollowUp(customerId) {
  const followUpDate = document.getElementById('fu-form-date').value;
  const purpose = document.getElementById('fu-form-purpose').value.trim();
  const notes = document.getElementById('fu-form-notes').value.trim();

  // Validate
  if (!customerId) {
    window.CRM.showToast('Please select a customer.', 'error');
    return;
  }
  if (!followUpDate) {
    window.CRM.showToast('Please select a follow-up date.', 'error');
    return;
  }
  if (!purpose) {
    window.CRM.showToast('Please enter the follow-up purpose.', 'error');
    return;
  }

  const payload = { customerId, followUpDate, purpose, notes };

  try {
    const saved = await window.CRM.followUpService.addFollowUp(payload);
    window.CRM.showToast(`Follow-up ${saved.id} scheduled successfully.`, 'success');
    window.CRM.closeModal();

    // Refresh view
    refreshActiveFollowUpView();
  } catch (err) {
    console.error(err);
    window.CRM.showToast('Failed to save follow-up details.', 'error');
  }
}

// 5. OPEN MANAGE STATUS MODAL (COMPLETE / RESCHEDULE / CANCEL)
async function openManageFollowUpModal(id) {
  try {
    const db = window.CRM.db;
    const fu = await db.get('followUps', id);
    const cust = await db.get('customers', fu.customerId);
    
    if (!fu) return;

    const title = `Manage Follow-up Status (${id})`;

    const bodyHTML = `
      <div style="margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 15px;">
        <h4 style="color: var(--color-gold); font-size:1.1rem; margin-bottom:5px;">${cust ? cust.name : 'Unknown Customer'}</h4>
        <p style="font-size:0.9rem; margin-bottom:5px;"><strong>Enquiry details:</strong> ${fu.purpose}</p>
        <p style="font-size:0.85rem; color:var(--text-muted);"><strong>Target Date:</strong> ${formatDateString(fu.followUpDate)}</p>
      </div>

      <div class="form-group">
        <label for="fu-res-notes">Action Logging Notes (Optional)</label>
        <textarea id="fu-res-notes" placeholder="Type resolution details, reschedule reasons, or cancellation details here..."></textarea>
      </div>

      <!-- Hideable reschedule block -->
      <div id="reschedule-date-picker-block" class="form-group" style="display:none; margin-top:15px; border-top:1px dashed rgba(212,175,55,0.2); padding-top:15px;">
        <label for="fu-res-date">Select New Reschedule Date *</label>
        <input type="date" id="fu-res-date" value="${window.CRM.getLocalDateStr()}">
      </div>
    `;

    const footerHTML = `
      <button class="btn btn-secondary" onclick="window.CRM.closeModal()">Cancel</button>
      <button class="btn btn-danger btn-sm" id="fu-action-cancel-btn">Cancel Task</button>
      <button class="btn btn-secondary" id="fu-action-resched-btn">Reschedule</button>
      <button class="btn btn-primary" id="fu-action-complete-btn">Complete Task</button>
    `;

    window.CRM.openModal(title, bodyHTML, footerHTML);

    const notesInput = document.getElementById('fu-res-notes');
    const resDateBlock = document.getElementById('reschedule-date-picker-block');
    const resDateInput = document.getElementById('fu-res-date');

    // 1. Complete Task Trigger
    document.getElementById('fu-action-complete-btn').addEventListener('click', async () => {
      try {
        await window.CRM.followUpService.updateFollowUpStatus(id, 'COMPLETED', notesInput.value);
        window.CRM.showToast('Follow-up marked as COMPLETED.', 'success');
        window.CRM.closeModal();
        refreshActiveFollowUpView();
      } catch (err) {
        console.error(err);
        window.CRM.showToast('Failed to complete task.', 'error');
      }
    });

    // 2. Cancel Task Trigger
    document.getElementById('fu-action-cancel-btn').addEventListener('click', async () => {
      window.CRM.confirmModal(
        'Are you sure you want to CANCEL this follow-up task?',
        async () => {
          try {
            await window.CRM.followUpService.updateFollowUpStatus(id, 'CANCELLED', notesInput.value);
            window.CRM.showToast('Follow-up marked as CANCELLED.', 'success');
            window.CRM.closeModal();
            refreshActiveFollowUpView();
          } catch (err) {
            console.error(err);
            window.CRM.showToast('Failed to cancel task.', 'error');
          }
        },
        { title: "Cancel Follow-up Task", confirmText: "Yes, Cancel", isDanger: true }
      );
    });

    // 3. Reschedule Task Trigger (Two-step interaction)
    const rescheduleBtn = document.getElementById('fu-action-resched-btn');
    rescheduleBtn.addEventListener('click', async () => {
      // Toggle date picker display on first click
      if (resDateBlock.style.display === 'none') {
        resDateBlock.style.display = 'block';
        rescheduleBtn.textContent = 'Save Reschedule';
        rescheduleBtn.className = 'btn btn-primary';
        document.getElementById('fu-action-complete-btn').style.display = 'none';
        document.getElementById('fu-action-cancel-btn').style.display = 'none';
      } else {
        // Submit reschedule details on second click
        const newDate = resDateInput.value;
        if (!newDate) {
          window.CRM.showToast('Please select a new date.', 'error');
          return;
        }
        try {
          // Update status to RESCHEDULED and update the follow-up date
          const updated = await window.CRM.followUpService.updateFollowUpStatus(id, 'RESCHEDULED', notesInput.value);
          updated.followUpDate = newDate;
          await db.put('followUps', updated);

          window.CRM.showToast('Follow-up successfully rescheduled.', 'success');
          window.CRM.closeModal();
          refreshActiveFollowUpView();
        } catch (err) {
          console.error(err);
          window.CRM.showToast('Failed to reschedule task.', 'error');
        }
      }
    });

  } catch (err) {
    console.error(err);
    window.CRM.showToast('Failed to open manager dialog.', 'error');
  }
}

// 6. VIEW NAVIGATION & EVENT REGISTRATION
window.addEventListener('crm-navigate', (event) => {
  if (event.detail.route === 'followups') {
    loadFollowUpsList();
  }
});

// Setup tab hooks and click triggers
function initFollowUpsUI() {
  const globalAddBtn = document.getElementById('followup-add-btn');
  const dashAddBtn = document.getElementById('dash-action-add-fu');
  
  if (globalAddBtn) {
    globalAddBtn.addEventListener('click', () => openAddFollowUpModal());
  }
  if (dashAddBtn) {
    dashAddBtn.addEventListener('click', () => openAddFollowUpModal());
  }

  // Wire up Tab navigation buttons
  const tabButtons = document.querySelectorAll('#view-followups .tab-nav .tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      fuState.activeTab = btn.getAttribute('data-fu-tab');
      loadFollowUpsList();
    });
  });
}

// Export UI hooks globally under window.CRM.ui
window.CRM.ui = window.CRM.ui || {};
window.CRM.ui.followUps = {
  openAddFollowUpModal: openAddFollowUpModal,
  openManageFollowUpModal: openManageFollowUpModal
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFollowUpsUI);
} else {
  initFollowUpsUI();
}
