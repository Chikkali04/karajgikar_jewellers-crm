/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - DASHBOARD UI CONTROLLER (dashboard.js)
   ========================================================================== */

// 1. RE-CALCULATE AND RENDER DASHBOARD STATISTICS
async function loadDashboardStats() {
  const totalCustVal = document.getElementById('dash-total-cust');
  const todayFuVal = document.getElementById('dash-today-fu');
  const overdueFuVal = document.getElementById('dash-overdue-fu');
  const upBirthVal = document.getElementById('dash-up-birth');
  const followupTableBody = document.getElementById('dash-followup-list');

  if (!totalCustVal) return; // Guard clause if dashboard DOM is not active

  try {
    // 1. Fetch all data in parallel
    const [customers, followUps, appConfig] = await Promise.all([
      window.CRM.customerService.getAllCustomers(),
      window.CRM.followUpService.getAllFollowUps(),
      window.CRM.db.get('settings', 'app_config')
    ]);

    // Local today string YYYY-MM-DD
    const todayStr = window.CRM.getLocalDateStr();
    const rangeDays = appConfig ? Number(appConfig.upcomingRangeDays) : 7;

    // 2. Map customers for fast name lookup
    const customerMap = {};
    customers.forEach(c => {
      customerMap[c.id] = c;
    });

    // 3. Count Customers
    totalCustVal.textContent = customers.length;

    // 4. Filter and Count Follow-ups
    const todayPending = followUps.filter(fu => 
      (fu.status === 'PENDING' || fu.status === 'RESCHEDULED') && 
      fu.followUpDate === todayStr
    );
    const overdue = followUps.filter(fu => 
      (fu.status === 'PENDING' || fu.status === 'RESCHEDULED') && 
      fu.followUpDate < todayStr
    );

    todayFuVal.textContent = todayPending.length;
    overdueFuVal.textContent = overdue.length;

    // 5. Count Upcoming Birthdays
    let upcomingBirthdaysCount = 0;
    customers.forEach(cust => {
      if (cust.dateOfBirth && checkBirthdayRange(cust.dateOfBirth, rangeDays)) {
        upcomingBirthdaysCount++;
      }
    });
    upBirthVal.textContent = upcomingBirthdaysCount;

    // 6. Render Today's Action Required Table
    renderTodayActionTable(todayPending, customerMap);

  } catch (err) {
    console.error('Failed to load dashboard data:', err);
  }
}

// Check if birthday falls in range
function checkBirthdayRange(birthDateStr, rangeDays) {
  if (!birthDateStr) return false;
  const parts = birthDateStr.split('-');
  if (parts.length !== 3) return false;

  const birthMonth = parseInt(parts[1], 10) - 1;
  const birthDay = parseInt(parts[2], 10);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bdayThisYear = new Date(today.getFullYear(), birthMonth, birthDay);
  bdayThisYear.setHours(0, 0, 0, 0);
  
  let targetBday = bdayThisYear;
  if (targetBday < today) {
    targetBday = new Date(today.getFullYear() + 1, birthMonth, birthDay);
  }

  const diffDays = Math.ceil((targetBday - today) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= rangeDays;
}

// Render Dashboard Follow-up Table
function renderTodayActionTable(todayPending, customerMap) {
  const tableBody = document.getElementById('dash-followup-list');
  if (!tableBody) return;

  if (todayPending.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4">
          <div class="empty-state" style="padding: 20px;">
            <svg style="width: 32px; height: 32px;"><use href="#icon-followups"></use></svg>
            <h4>No follow-ups for today</h4>
            <p>Relax, or search customers to create new callback events.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = '';
  todayPending.forEach(fu => {
    const cust = customerMap[fu.customerId];
    const customerName = cust ? cust.name : 'Unknown Client';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${customerName}</strong></td>
      <td>${fu.purpose}</td>
      <td><span class="status-badge pending">${fu.status}</span></td>
      <td>
        <div style="display:flex; gap:8px;">
          <a href="#profile?id=${fu.customerId}" class="btn btn-secondary btn-sm">Profile</a>
          <button class="btn btn-primary btn-sm dash-manage-fu-btn" data-id="${fu.id}">Manage</button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  // Bind Manage buttons on the dashboard
  tableBody.querySelectorAll('.dash-manage-fu-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      if (window.CRM.ui && window.CRM.ui.followUps) {
        window.CRM.ui.followUps.openManageFollowUpModal(id);
      }
    });
  });
}

// 2. VIEW NAVIGATION EVENT LISTENER
window.addEventListener('crm-navigate', (event) => {
  if (event.detail.route === 'dashboard') {
    loadDashboardStats();
  }
});

// Export refresh function globally
window.CRM = window.CRM || {};
window.CRM.runDashboardRefresh = loadDashboardStats;
