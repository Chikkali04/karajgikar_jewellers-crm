/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - CAMPAIGN UI CONTROLLER (campaigns.js)
   ========================================================================== */

// 1. RENDER CAMPAIGNS LEDGER
async function loadCampaignsList() {
  const tableBody = document.getElementById('campaigns-table-body');
  if (!tableBody) return;

  try {
    const campaigns = await window.CRM.campaignService.getAllCampaigns();

    if (campaigns.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="empty-state">
              <svg style="width:36px;height:36px;"><use href="#icon-campaigns"></use></svg>
              <h4>No Campaigns Drafted</h4>
              <p>Click "Create Campaign" to plan bulk marketing broadcasts.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    // Sort by created date descending (Newest first)
    campaigns.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    tableBody.innerHTML = '';
    campaigns.forEach(camp => {
      const isDraft = camp.status === 'DRAFT';
      
      let actionBtnHTML = '';
      if (isDraft) {
        actionBtnHTML = `
          <button class="btn btn-primary btn-sm exec-camp-btn" data-id="${camp.id}">Launch</button>
          <button class="btn btn-danger btn-sm delete-camp-btn" data-id="${camp.id}">Delete</button>
        `;
      } else {
        actionBtnHTML = `
          <span style="font-size:0.8rem; color:var(--text-muted); padding: 5px 10px;">${camp.messageCount} Queued</span>
          <button class="btn btn-danger btn-sm delete-camp-btn" data-id="${camp.id}">Delete</button>
        `;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color:var(--color-gold);">${camp.id}</strong></td>
        <td><strong>${camp.name}</strong></td>
        <td>${camp.purpose}</td>
        <td><span class="status-badge regular" style="font-size:0.75rem;">${camp.channel}</span></td>
        <td><span class="status-badge ${camp.targetScope.toLowerCase()}" style="font-size:0.75rem;">${camp.targetScope}</span></td>
        <td>${formatDateString(camp.scheduledDate)}</td>
        <td><span class="status-badge ${camp.status.toLowerCase()}">${camp.status}</span></td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            ${actionBtnHTML}
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    // Bind Launch and Delete button clicks
    tableBody.querySelectorAll('.exec-camp-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        triggerLaunchCampaign(id);
      });
    });

    tableBody.querySelectorAll('.delete-camp-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        triggerDeleteCampaign(id);
      });
    });

  } catch (err) {
    console.error('Failed to load campaigns list:', err);
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

// 2. DELETE CAMPAIGN CONFIG
async function triggerDeleteCampaign(id) {
  window.CRM.confirmModal(
    `Are you sure you want to delete campaign configuration ${id}? This deletes the campaign logs.`,
    async () => {
      try {
        await window.CRM.campaignService.deleteCampaign(id);
        window.CRM.showToast('Campaign deleted successfully.', 'success');
        loadCampaignsList();
      } catch (err) {
        console.error(err);
        window.CRM.showToast('Failed to delete campaign.', 'error');
      }
    },
    { title: "Delete Campaign Draft", confirmText: "Yes, Delete", isDanger: true }
  );
}

// 3. EXECUTE BULK BROADCAST LAUNCH
async function triggerLaunchCampaign(id) {
  window.CRM.confirmModal(
    `Are you sure you want to LAUNCH Campaign ${id}? This will query your customer list and bulk queue personalized greetings inside the Message Queue.`,
    async () => {
      try {
        window.CRM.showToast('Launching broadcast campaign...', 'info');
        const count = await window.CRM.campaignService.launchCampaign(id);
        window.CRM.showToast(`Campaign launched! ${count} messages successfully queued.`, 'success');
        loadCampaignsList();
      } catch (err) {
        console.error(err);
        window.CRM.showToast(err.message || 'Failed to launch campaign.', 'error');
      }
    },
    { title: "Launch Broadcast Campaign", confirmText: "Yes, Launch", isDanger: false }
  );
}

// 4. OPEN CREATE CAMPAIGN FORM MODAL
async function openCreateCampaignModal(prefilledFestivalName = null) {
  try {
    // Fetch festivals list to populate select dropdown
    const festivals = await window.CRM.festivalService.getAllFestivals();
    
    let festivalOptions = `<option value="">-- General Promotion --</option>`;
    festivals.forEach(fest => {
      const isSelected = fest.name === prefilledFestivalName ? 'selected' : '';
      festivalOptions += `<option value="${fest.name}" ${isSelected}>${fest.name}</option>`;
    });

    const todayStr = window.CRM.getLocalDateStr();
    const title = "Create Broadcast Greeting Campaign";

    const bodyHTML = `
      <form id="campaign-form">
        <div class="form-grid">
          <div class="form-group">
            <label for="camp-form-name">Campaign Name *</label>
            <input type="text" id="camp-form-name" placeholder="e.g. Diwali Jewellery Discount 2026" required>
          </div>
          <div class="form-group">
            <label for="camp-form-purpose">Campaign Purpose *</label>
            <input type="text" id="camp-form-purpose" placeholder="e.g. Festive Greetings & Discount Offers" required>
          </div>
          <div class="form-group">
            <label for="camp-form-fest">Link to Festival Event</label>
            <select id="camp-form-fest">
              ${festivalOptions}
            </select>
          </div>
          <div class="form-group">
            <label for="camp-form-scope">Target Audience Scope *</label>
            <select id="camp-form-scope">
              <option value="ALL">All Customers</option>
              <option value="VIP">VIP Customers Only</option>
              <option value="Regular">Regular Customers Only</option>
              <option value="New">New Clients Only</option>
            </select>
          </div>
          <div class="form-group">
            <label for="camp-form-channel">Sending Channel *</label>
            <select id="camp-form-channel">
              <option value="WHATSAPP">WhatsApp Messaging</option>
              <option value="SMS">Standard SMS</option>
            </select>
          </div>
          <div class="form-group">
            <label for="camp-form-date">Scheduled Date *</label>
            <input type="date" id="camp-form-date" value="${todayStr}" required>
          </div>
          <div class="form-group full-width">
            <label for="camp-form-template">Personalized Greeting Template *</label>
            <span style="font-size:0.75rem; color:var(--text-muted); margin-bottom:5px; display:block;">
              Use the placeholder <strong>[Name]</strong> to dynamically insert the customer's name.
            </span>
            <textarea id="camp-form-template" style="height:120px;" required></textarea>
          </div>
        </div>
      </form>
    `;

    const footerHTML = `
      <button class="btn btn-secondary" onclick="window.CRM.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="camp-form-save-btn">Save Draft</button>
    `;

    window.CRM.openModal(title, bodyHTML, footerHTML);

    const templateInput = document.getElementById('camp-form-template');
    const festSelect = document.getElementById('camp-form-fest');
    const nameInput = document.getElementById('camp-form-name');
    const purposeInput = document.getElementById('camp-form-purpose');

    // Helper: Set default template text based on festival
    const updateTemplateText = () => {
      const selectedFest = festSelect.value;
      if (!selectedFest) {
        templateInput.value = "Dear [Name], greetings from Karajgikar Gold & Diamonds! Check out our new lightweight jewelry patterns. Regards, Karajgikar Jewellers, Solapur.";
        return;
      }

      // Prefill Name and Purpose fields based on selected festival
      nameInput.value = `${selectedFest} Greetings Campaign`;
      purposeInput.value = `${selectedFest} festival wishes and promotion.`;

      if (selectedFest === 'Diwali') {
        templateInput.value = "Dear [Name], Karajgikar Gold & Diamonds wishes you and your family a very Happy Diwali! Celebrate the festival of lights with 10% off making charges on gold necklaces. Visit our showroom at Saraf Katta, Solapur!";
      } else if (selectedFest === 'Dhanteras') {
        templateInput.value = "Dear [Name], make this Dhanteras auspicious with Karajgikar Gold & Diamonds! Get special gold coin gifts on purchase of jewelry. Pre-book today for hassle-free delivery on the festival day!";
      } else if (selectedFest === 'Akshaya Tritiya') {
        templateInput.value = "Dear [Name], wishing you a prosperous Akshaya Tritiya! Secure your wealth on this auspicious day with Karajgikar Jewellers. Special gold rate bookings are open. Visit us today!";
      } else {
        templateInput.value = `Dear [Name], wishing you a very happy and prosperous ${selectedFest}! May this festive season shine bright for you and your family. Regards, Karajgikar Gold & Diamonds, Solapur.`;
      }
    };

    // Run once on load and bind change listener
    updateTemplateText();
    festSelect.addEventListener('change', updateTemplateText);

    // Bind submit
    document.getElementById('camp-form-save-btn').addEventListener('click', handleSaveCampaign);

  } catch (err) {
    console.error(err);
    window.CRM.showToast('Failed to open campaign form.', 'error');
  }
}

// 5. SAVE CAMPAIGN
async function handleSaveCampaign(e) {
  e.preventDefault();

  const name = document.getElementById('camp-form-name').value.trim();
  const purpose = document.getElementById('camp-form-purpose').value.trim();
  const festivalLink = document.getElementById('camp-form-fest').value;
  const targetScope = document.getElementById('camp-form-scope').value;
  const channel = document.getElementById('camp-form-channel').value;
  const scheduledDate = document.getElementById('camp-form-date').value;
  const messageTemplate = document.getElementById('camp-form-template').value.trim();

  // Validations
  if (!name || !purpose || !messageTemplate) {
    window.CRM.showToast('Please fill in all required fields.', 'error');
    return;
  }
  if (messageTemplate.indexOf('[Name]') === -1) {
    window.CRM.showToast('Please include the [Name] placeholder in your template.', 'error');
    return;
  }

  const payload = { name, purpose, festivalLink, targetScope, channel, scheduledDate, messageTemplate };

  try {
    const saved = await window.CRM.campaignService.addCampaign(payload);
    window.CRM.showToast(`Campaign Draft ${saved.id} created.`, 'success');
    window.CRM.closeModal();
    loadCampaignsList();
  } catch (err) {
    console.error(err);
    window.CRM.showToast('Failed to save campaign.', 'error');
  }
}

// 6. ROUTER NAVIGATION BINDING
window.addEventListener('crm-navigate', (event) => {
  if (event.detail.route === 'campaigns') {
    loadCampaignsList();
    
    // Check for "festival" parameter to auto-open creation form
    const festivalParam = event.detail.params ? event.detail.params.festival : null;
    if (festivalParam) {
      // Auto open campaign modal prefilled
      setTimeout(() => {
        openCreateCampaignModal(festivalParam);
      }, 300);
    }
  }
});

// Setup click triggers on startup
function initCampaignsUI() {
  const addBtn = document.getElementById('campaign-add-btn');
  const dashCreateBtn = document.getElementById('dash-action-create-camp');
  if (addBtn) {
    addBtn.addEventListener('click', () => openCreateCampaignModal());
  }
  if (dashCreateBtn) {
    dashCreateBtn.addEventListener('click', () => openCreateCampaignModal());
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCampaignsUI);
} else {
  initCampaignsUI();
}
