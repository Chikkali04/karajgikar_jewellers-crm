/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - FESTIVAL CONFIG UI CONTROLLER (festivals.js)
   ========================================================================== */

// 1. STATE REFERENCES
const festState = {
  currentEditId: null
};

// 2. RENDER FESTIVALS TABLE LIST
async function loadFestivalsList() {
  const tableBody = document.getElementById('festival-table-body');
  if (!tableBody) return;

  try {
    const festivals = await window.CRM.festivalService.getAllFestivals();

    if (festivals.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4">
            <div class="empty-state">
              <svg style="width:36px;height:36px;"><use href="#icon-festivals"></use></svg>
              <h4>No Festivals Configured</h4>
              <p>Add custom festivals to plan your bulk marketing greeting campaigns.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    // Sort by Date ascending (Closest first)
    festivals.sort((a, b) => a.festivalDate.localeCompare(b.festivalDate));

    tableBody.innerHTML = '';
    festivals.forEach(fest => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color:var(--color-gold);">${fest.name}</strong></td>
        <td><strong>${formatDateString(fest.festivalDate)}</strong></td>
        <td class="text-muted" style="max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${fest.description || ''}">
          ${fest.description || '-'}
        </td>
        <td>
          <div style="display:flex; gap:8px;">
            <a href="#campaigns?festival=${encodeURIComponent(fest.name)}" class="btn btn-primary btn-sm">Launch Campaign</a>
            <button class="btn btn-secondary btn-sm edit-fest-btn" data-id="${fest.id}">Edit</button>
            <button class="btn btn-danger btn-sm delete-fest-btn" data-id="${fest.id}">Delete</button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    // Attach click listeners to Edit & Delete buttons
    tableBody.querySelectorAll('.edit-fest-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        openFestivalModal(id);
      });
    });

    tableBody.querySelectorAll('.delete-fest-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        triggerDeleteFestival(id);
      });
    });

  } catch (err) {
    console.error('Failed to load festivals grid:', err);
    window.CRM.showToast('Error loading festivals list.', 'error');
  }
}

// Helper: Format date
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

// 3. DELETE FESTIVAL CONFIG
async function triggerDeleteFestival(id) {
  window.CRM.confirmModal(
    `Are you sure you want to delete this festival configuration? Bulk greeting campaigns planned for this festival will no longer refer to it.`,
    async () => {
      try {
        await window.CRM.festivalService.deleteFestival(id);
        window.CRM.showToast('Festival config deleted successfully.', 'success');
        loadFestivalsList();
      } catch (err) {
        console.error(err);
        window.CRM.showToast('Deletion failed.', 'error');
      }
    },
    { title: "Delete Festival Config", confirmText: "Yes, Delete", isDanger: true }
  );
}

// 4. OPEN ADD/EDIT FESTIVAL MODAL VIEW
async function openFestivalModal(id = null) {
  festState.currentEditId = id;
  const isEdit = id !== null;
  let festData = { name: '', festivalDate: '', description: '' };

  if (isEdit) {
    try {
      const all = await window.CRM.festivalService.getAllFestivals();
      const match = all.find(f => f.id === id);
      if (match) festData = match;
    } catch (err) {
      console.error(err);
      window.CRM.showToast('Failed to load festival data.', 'error');
      return;
    }
  }

  const title = isEdit ? `Edit Festival Details` : 'Add New Shopping Festival';

  const bodyHTML = `
    <form id="fest-form">
      <div class="form-grid" style="grid-template-columns: 1fr;">
        <div class="form-group">
          <label for="fest-form-name">Festival Name *</label>
          <input type="text" id="fest-form-name" value="${festData.name}" placeholder="e.g. Diwali, Akshaya Tritiya" required>
        </div>
        <div class="form-group">
          <label for="fest-form-date">Festival Date *</label>
          <input type="date" id="fest-form-date" value="${festData.festivalDate}" required>
        </div>
        <div class="form-group">
          <label for="fest-form-desc">Description / Metal Target Notes</label>
          <textarea id="fest-form-desc" placeholder="e.g. Target gold purchases, coin distributions, auspicious buying day">${festData.description}</textarea>
        </div>
      </div>
    </form>
  `;

  const footerHTML = `
    <button class="btn btn-secondary" onclick="window.CRM.closeModal()">Cancel</button>
    <button class="btn btn-primary" id="fest-form-save-btn">Save Configuration</button>
  `;

  window.CRM.openModal(title, bodyHTML, footerHTML);

  document.getElementById('fest-form-save-btn').addEventListener('click', handleSaveFestivalSubmit);
}

// 5. SAVE FESTIVAL SUBMIT
async function handleSaveFestivalSubmit(e) {
  e.preventDefault();
  
  const name = document.getElementById('fest-form-name').value.trim();
  const festivalDate = document.getElementById('fest-form-date').value;
  const description = document.getElementById('fest-form-desc').value.trim();

  if (!name) {
    window.CRM.showToast('Please enter festival name.', 'error');
    return;
  }
  if (!festivalDate) {
    window.CRM.showToast('Please select festival date.', 'error');
    return;
  }

  const payload = { name, festivalDate, description };

  try {
    if (festState.currentEditId) {
      payload.id = festState.currentEditId;
      await window.CRM.festivalService.updateFestival(payload);
      window.CRM.showToast('Festival config updated successfully.', 'success');
    } else {
      await window.CRM.festivalService.addFestival(payload);
      window.CRM.showToast('Festival config created successfully.', 'success');
    }
    window.CRM.closeModal();
    loadFestivalsList();
  } catch (err) {
    console.error(err);
    window.CRM.showToast('Failed to save festival configuration.', 'error');
  }
}

// 6. ROUTER NAVIGATION BINDING
window.addEventListener('crm-navigate', (event) => {
  if (event.detail.route === 'festivals') {
    loadFestivalsList();
  }
});

// Setup click triggers on startup
function initFestivalsUI() {
  const addBtn = document.getElementById('festival-add-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => openFestivalModal());
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFestivalsUI);
} else {
  initFestivalsUI();
}
