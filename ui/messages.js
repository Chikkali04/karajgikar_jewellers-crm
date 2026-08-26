/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - MESSAGE CENTER UI CONTROLLER (messages.js)
   ========================================================================== */

// 1. RENDER MESSAGE QUEUE LIST TABLE
async function loadMessagesList() {
  const tableBody = document.getElementById('messages-table-body');
  if (!tableBody) return;

  try {
    const messages = await window.CRM.db.getAll('messages');

    // 1. Apply Status Filter
    const statusVal = document.getElementById('msg-filter-status').value;
    let filtered = messages;
    if (statusVal) {
      filtered = filtered.filter(m => m.status === statusVal);
    }

    // 2. Apply Channel Filter
    const channelVal = document.getElementById('msg-filter-channel').value;
    if (channelVal) {
      filtered = filtered.filter(m => m.channel === channelVal);
    }

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="empty-state">
              <svg style="width: 36px; height: 36px;"><use href="#icon-messages"></use></svg>
              <h4>No Messages in Queue</h4>
              <p>Queue greetings for birthdays, anniversaries, or launch bulk campaigns to see them here.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    // Sort by created date descending (Newest first)
    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    tableBody.innerHTML = '';
    filtered.forEach(msg => {
      const isPending = msg.status === 'PENDING';
      
      let actionHTML = '';
      if (isPending) {
        actionHTML = `
          <button class="btn btn-primary btn-sm mock-send-btn" data-id="${msg.id}">Mock Send</button>
          <button class="btn btn-danger btn-sm delete-msg-btn" data-id="${msg.id}">Remove</button>
        `;
      } else {
        actionHTML = `
          <button class="btn btn-danger btn-sm delete-msg-btn" data-id="${msg.id}">Delete Log</button>
        `;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color: var(--color-gold);">${msg.id.substring(0, 10)}...</strong></td>
        <td><strong>${msg.customerName}</strong></td>
        <td>${msg.mobile}</td>
        <td><span class="status-badge regular" style="font-size:0.75rem;">${msg.channel}</span></td>
        <td style="max-width: 250px; font-size: 0.85rem;" title="${msg.message}">
          <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${msg.message}</div>
        </td>
        <td class="text-muted" style="font-size:0.8rem;">${formatDateTime(msg.createdAt)}</td>
        <td><span class="status-badge ${msg.status.toLowerCase()}">${msg.status}</span></td>
        <td>
          <div style="display:flex; gap:8px;">
            ${actionHTML}
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    // Bind Action clicks
    tableBody.querySelectorAll('.mock-send-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        triggerMockSend(id);
      });
    });

    tableBody.querySelectorAll('.delete-msg-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        triggerDeleteMessage(id);
      });
    });

  } catch (err) {
    console.error('Failed to load message queue:', err);
  }
}

// Helper: Format DateTime neatly
function formatDateTime(isoString) {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return `${d.toLocaleDateString('en-IN')} ${d.toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'})}`;
  } catch (e) {
    return isoString;
  }
}

// 2. MOCK MESSAGE SEND (Transition PENDING -> SENT)
async function triggerMockSend(id) {
  try {
    const db = window.CRM.db;
    const msg = await db.get('messages', id);
    if (msg) {
      msg.status = 'SENT';
      msg.sentAt = new Date().toISOString();
      await db.put('messages', msg);
      
      window.CRM.showToast(`Message successfully dispatched (Mock Send).`, 'success');
      loadMessagesList();
    }
  } catch (err) {
    console.error(err);
    window.CRM.showToast('Failed to mock-send message.', 'error');
  }
}

// 3. DELETE SINGLE MESSAGE
async function triggerDeleteMessage(id) {
  window.CRM.confirmModal(
    'Remove this message from the sending queue?',
    async () => {
      try {
        await window.CRM.db.delete('messages', id);
        window.CRM.showToast('Message removed from queue.', 'success');
        loadMessagesList();
      } catch (err) {
        console.error(err);
        window.CRM.showToast('Failed to delete message.', 'error');
      }
    },
    { title: "Delete Message Request", confirmText: "Yes, Remove", isDanger: true }
  );
}

// 4. CLEAR ALL SENT LOGS
async function clearSentLogs() {
  window.CRM.confirmModal(
    'Erase all Completed and Failed message logs? (Pending queue will remain untouched)',
    async () => {
      try {
        const db = window.CRM.db;
        const all = await db.getAll('messages');
        
        let deletedCount = 0;
        for (const m of all) {
          if (m.status === 'SENT' || m.status === 'FAILED') {
            await db.delete('messages', m.id);
            deletedCount++;
          }
        }
        
        window.CRM.showToast(`Cleared ${deletedCount} historical log entries.`, 'success');
        loadMessagesList();
      } catch (err) {
        console.error(err);
        window.CRM.showToast('Failed to clear logs.', 'error');
      }
    },
    { title: "Clear Sent Message Logs", confirmText: "Yes, Clear", isDanger: true }
  );
}

// 5. VIEW NAVIGATION BINDING
window.addEventListener('crm-navigate', (event) => {
  if (event.detail.route === 'messages') {
    loadMessagesList();
  }
});

// Setup click triggers on startup
function initMessagesUI() {
  const statusFilter = document.getElementById('msg-filter-status');
  const channelFilter = document.getElementById('msg-filter-channel');
  const clearBtn = document.getElementById('msg-clear-sent-btn');

  if (statusFilter) statusFilter.addEventListener('change', loadMessagesList);
  if (channelFilter) channelFilter.addEventListener('change', loadMessagesList);
  if (clearBtn) clearBtn.addEventListener('click', clearSentLogs);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMessagesUI);
} else {
  initMessagesUI();
}
