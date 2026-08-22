/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - BIRTHDAYS & ANNIVERSARIES UI (birthdays.js)
   ========================================================================== */

// 1. CALCULATE DAYS REMAINING UNTIL BIRTHDAY / ANNIVERSARY
function getDaysUntilAnniversary(eventDateStr, rangeDays) {
  if (!eventDateStr) return null;
  const parts = eventDateStr.split('-');
  if (parts.length !== 3) return null;
  
  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10) - 1; // 0-indexed month
  const birthDay = parseInt(parts[2], 10);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Create event date for current year
  const eventThisYear = new Date(today.getFullYear(), birthMonth, birthDay);
  eventThisYear.setHours(0, 0, 0, 0);
  
  let targetEventDate = eventThisYear;
  let targetYear = today.getFullYear();
  
  // If the date has already passed in the current year, check next year
  if (targetEventDate < today) {
    targetYear = today.getFullYear() + 1;
    targetEventDate = new Date(targetYear, birthMonth, birthDay);
    targetEventDate.setHours(0, 0, 0, 0);
  }
  
  const diffTime = targetEventDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Return info if it falls in our check ahead range
  if (diffDays >= 0 && diffDays <= rangeDays) {
    return {
      daysRemaining: diffDays,
      targetDate: targetEventDate.toISOString().substring(0, 10),
      count: targetYear - birthYear // Turning X years old or celebrating Xth anniversary
    };
  }
  return null;
}

// Helper: Get ordinal string for anniversary years (e.g. 1st, 2nd, 3rd, 4th)
function getOrdinalSuffix(number) {
  if (number <= 0) return '';
  const j = number % 10;
  const k = number % 100;
  if (j == 1 && k != 11) {
    return number + "st";
  }
  if (j == 2 && k != 12) {
    return number + "nd";
  }
  if (j == 3 && k != 13) {
    return number + "rd";
  }
  return number + "th";
}

// 2. RENDER THE TABLES IN ALERTS VIEW
async function loadBirthdaysAndAnniversaries() {
  const bdayBody = document.getElementById('upcoming-birthdays-body');
  const annivBody = document.getElementById('upcoming-anniversaries-body');

  if (!bdayBody || !annivBody) return; // Guard clause if elements are not active in DOM

  try {
    // Fetch customers and configurations
    const [customers, appConfig] = await Promise.all([
      window.CRM.customerService.getAllCustomers(),
      window.CRM.db.get('settings', 'app_config')
    ]);

    const rangeDays = appConfig ? Number(appConfig.upcomingRangeDays) : 7;
    
    const upcomingBirthdays = [];
    const upcomingAnniversaries = [];

    customers.forEach(cust => {
      // 1. Process Birthdays
      if (cust.dateOfBirth) {
        const result = getDaysUntilAnniversary(cust.dateOfBirth, rangeDays);
        if (result !== null) {
          upcomingBirthdays.push({
            customer: cust,
            daysRemaining: result.daysRemaining,
            targetDate: result.targetDate,
            age: result.count
          });
        }
      }

      // 2. Process Anniversaries
      if (cust.anniversaryDate) {
        const result = getDaysUntilAnniversary(cust.anniversaryDate, rangeDays);
        if (result !== null) {
          upcomingAnniversaries.push({
            customer: cust,
            daysRemaining: result.daysRemaining,
            targetDate: result.targetDate,
            years: result.count
          });
        }
      }
    });

    // Sort by closest date first
    upcomingBirthdays.sort((a, b) => a.daysRemaining - b.daysRemaining);
    upcomingAnniversaries.sort((a, b) => a.daysRemaining - b.daysRemaining);

    // 3. Render Upcoming Birthdays table
    if (upcomingBirthdays.length === 0) {
      bdayBody.innerHTML = `
        <tr>
          <td colspan="4">
            <div class="empty-state" style="padding: 15px;">
              <p class="text-muted">No birthdays in the next ${rangeDays} days.</p>
            </div>
          </td>
        </tr>
      `;
    } else {
      bdayBody.innerHTML = '';
      upcomingBirthdays.forEach(item => {
        const cust = item.customer;
        const badgeClass = item.daysRemaining === 0 ? 'status-badge pending' : 'status-badge regular';
        const badgeText = item.daysRemaining === 0 ? 'Today' : `In ${item.daysRemaining} days`;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${formatEventDate(item.targetDate)}</strong> <span class="${badgeClass}" style="font-size:0.7rem; margin-left:5px;">${badgeText}</span></td>
          <td><strong><a href="#profile?id=${cust.id}" style="color:var(--color-cream); text-decoration:none;">${cust.name}</a></strong></td>
          <td class="text-muted">Turning ${item.age} years old</td>
          <td>
            <button class="btn btn-primary btn-sm queue-greet-btn" 
              data-cust-id="${cust.id}" 
              data-cust-name="${cust.name}" 
              data-cust-mobile="${cust.mobile}"
              data-event-type="Birthday"
              data-event-detail="Turning ${item.age}">
              Queue Greeting
            </button>
          </td>
        `;
        bdayBody.appendChild(tr);
      });
    }

    // 4. Render Upcoming Anniversaries table
    if (upcomingAnniversaries.length === 0) {
      annivBody.innerHTML = `
        <tr>
          <td colspan="4">
            <div class="empty-state" style="padding: 15px;">
              <p class="text-muted">No anniversaries in the next ${rangeDays} days.</p>
            </div>
          </td>
        </tr>
      `;
    } else {
      annivBody.innerHTML = '';
      upcomingAnniversaries.forEach(item => {
        const cust = item.customer;
        const badgeClass = item.daysRemaining === 0 ? 'status-badge pending' : 'status-badge regular';
        const badgeText = item.daysRemaining === 0 ? 'Today' : `In ${item.daysRemaining} days`;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${formatEventDate(item.targetDate)}</strong> <span class="${badgeClass}" style="font-size:0.7rem; margin-left:5px;">${badgeText}</span></td>
          <td><strong><a href="#profile?id=${cust.id}" style="color:var(--color-cream); text-decoration:none;">${cust.name}</a></strong></td>
          <td class="text-muted">${getOrdinalSuffix(item.years)} Anniversary</td>
          <td>
            <button class="btn btn-primary btn-sm queue-greet-btn" 
              data-cust-id="${cust.id}" 
              data-cust-name="${cust.name}" 
              data-cust-mobile="${cust.mobile}"
              data-event-type="Anniversary"
              data-event-detail="${getOrdinalSuffix(item.years)} Anniversary">
              Queue Greeting
            </button>
          </td>
        `;
        annivBody.appendChild(tr);
      });
    }

    // Bind click handlers to all "Queue Greeting" buttons
    const buttons = document.querySelectorAll('.queue-greet-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dataset = e.target.dataset;
        openQueueGreetingModal(dataset);
      });
    });

  } catch (err) {
    console.error('Failed to load birthdays panel:', err);
  }
}

// Helper: Format event dates nicely (e.g. 2026-08-16 -> 16 August)
function formatEventDate(dateStr) {
  if (!dateStr) return '';
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return `${day} ${months[monthIndex]}`;
  }
  return dateStr;
}

// 3. OPEN QUEUE GREETING FORM MODAL
function openQueueGreetingModal(dataset) {
  const custId = dataset.custId;
  const custName = dataset.custName;
  const custMobile = dataset.custMobile;
  const eventType = dataset.eventType; // Birthday / Anniversary
  const eventDetail = dataset.eventDetail;

  const defaultMsg = eventType === 'Birthday' 
    ? `Dear ${custName}, Karajgikar Jewellers wishes you a very Happy Birthday! May your year shine with health, prosperity, and joy. Regards, Karajgikar Jewellers, Solapur.`
    : `Dear ${custName}, Karajgikar Jewellers wishes you a very Happy Anniversary! May your beautiful bond sparkle brighter and stronger with every passing year. Regards, Karajgikar Jewellers, Solapur.`;

  const title = `Queue ${eventType} Greeting`;

  const bodyHTML = `
    <form id="greeting-queue-form">
      <div class="form-grid" style="grid-template-columns: 1fr;">
        <div style="display:flex; justify-content:space-between; margin-bottom:15px; background: rgba(212,175,55,0.05); padding:10px; border-radius:var(--border-radius); border: 1px dashed rgba(212,175,55,0.2);">
          <div>
            <strong style="color:var(--color-gold);">${custName}</strong>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">Phone: ${custMobile}</p>
          </div>
          <span class="status-badge regular" style="align-self:center;">${eventDetail}</span>
        </div>
        
        <div class="form-group">
          <label for="greet-form-channel">Select Sending Channel *</label>
          <select id="greet-form-channel">
            <option value="WHATSAPP">WhatsApp Message</option>
            <option value="SMS">Standard SMS</option>
          </select>
        </div>

        <div class="form-group">
          <label for="greet-form-message">Greeting Template Text (Edit as needed)</label>
          <textarea id="greet-form-message" style="height:120px;" required>${defaultMsg}</textarea>
        </div>
      </div>
    </form>
  `;

  const footerHTML = `
    <button class="btn btn-secondary" onclick="window.CRM.closeModal()">Cancel</button>
    <button class="btn btn-primary" id="greet-form-submit-btn">Queue Message</button>
  `;

  window.CRM.openModal(title, bodyHTML, footerHTML);

  document.getElementById('greet-form-submit-btn').addEventListener('click', async (e) => {
    e.preventDefault();
    const channel = document.getElementById('greet-form-channel').value;
    const message = document.getElementById('greet-form-message').value.trim();

    if (!message) {
      window.CRM.showToast('Please enter message text.', 'error');
      return;
    }

    try {
      const db = window.CRM.db;
      // Add a PENDING message to the message center store
      await db.add('messages', {
        id: `MSG-${Date.now()}`,
        customerId: custId,
        customerName: custName,
        mobile: custMobile,
        channel: channel,
        message: message,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      });

      window.CRM.showToast(`Greeting successfully queued for sending!`, 'success');
      window.CRM.closeModal();

    } catch (err) {
      console.error(err);
      window.CRM.showToast('Failed to queue message.', 'error');
    }
  });
}

// 4. VIEW ROUTER INITIALIZATION
window.addEventListener('crm-navigate', (event) => {
  if (event.detail.route === 'birthdays') {
    loadBirthdaysAndAnniversaries();
  }
});
