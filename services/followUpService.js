/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - FOLLOWUP SERVICE LAYER (followUpService.js)
   ========================================================================== */

// 1. GENERATE SEQUENTIAL FOLLOWUP ID
async function generateFollowUpID() {
  const db = window.CRM.db;
  try {
    let counterRecord = await db.get('settings', 'followup_counter');
    
    if (!counterRecord) {
      counterRecord = { key: 'followup_counter', value: 0 };
    }
    
    counterRecord.value += 1;
    await db.put('settings', counterRecord);
    
    const formattedId = `FU-${String(counterRecord.value).padStart(4, '0')}`;
    return formattedId;
  } catch (err) {
    console.error('Failed to generate Followup ID:', err);
    return `FU-${Date.now()}`;
  }
}

// 2. DATABASE CRUD OPERATIONS

// Save a new follow-up
async function addFollowUp(followUp) {
  // Input validations
  if (!followUp.customerId) {
    throw new Error('Customer ID is required.');
  }
  if (!followUp.followUpDate) {
    throw new Error('Follow-up Date is required.');
  }
  if (!followUp.purpose || !followUp.purpose.trim()) {
    throw new Error('Follow-up Purpose is required.');
  }

  // Generate ID
  followUp.id = await generateFollowUpID();
  followUp.status = 'PENDING'; // Default state on creation
  
  const timestamp = new Date().toISOString();
  followUp.createdAt = timestamp;
  followUp.updatedAt = timestamp;
  
  // Clean inputs
  followUp.purpose = followUp.purpose.trim();
  followUp.notes = (followUp.notes || '').trim();

  await window.CRM.db.add('followUps', followUp);
  return followUp;
}

// Update follow-up data
async function updateFollowUp(followUp) {
  if (!followUp.id) {
    throw new Error('Follow-up ID is required for updates.');
  }
  
  followUp.updatedAt = new Date().toISOString();
  followUp.purpose = followUp.purpose.trim();
  followUp.notes = (followUp.notes || '').trim();
  
  await window.CRM.db.put('followUps', followUp);
  return followUp;
}

// Update follow-up status (Complete, Reschedule, Cancel)
async function updateFollowUpStatus(id, newStatus, resolutionNotes = '') {
  if (!id) {
    throw new Error('Follow-up ID is required.');
  }
  
  const db = window.CRM.db;
  const followUp = await db.get('followUps', id);
  if (!followUp) {
    throw new Error(`Follow-up record ${id} not found.`);
  }

  followUp.status = newStatus;
  followUp.updatedAt = new Date().toISOString();

  // Append resolution details to notes if provided
  if (resolutionNotes.trim()) {
    const divider = followUp.notes ? '\n---\n' : '';
    followUp.notes += `${divider}[Status changed to ${newStatus} on ${new Date().toLocaleDateString('en-IN')}]\n${resolutionNotes.trim()}`;
  }

  await db.put('followUps', followUp);
  return followUp;
}

// Fetch all follow-ups (across all customers)
async function getAllFollowUps() {
  return await window.CRM.db.getAll('followUps');
}

// Fetch follow-ups linked to a single customer ID
async function getFollowUpsByCustomer(customerId) {
  return await window.CRM.db.getAllByIndex('followUps', 'customerId', customerId);
}

// Delete follow-up record
async function deleteFollowUp(id) {
  if (!id) {
    throw new Error('Follow-up ID is required for deletion.');
  }
  return await window.CRM.db.delete('followUps', id);
}

// 3. EXPORT TO GLOBAL NAMESPACE
window.CRM = window.CRM || {};
window.CRM.followUpService = {
  addFollowUp: addFollowUp,
  updateFollowUp: updateFollowUp,
  updateFollowUpStatus: updateFollowUpStatus,
  getAllFollowUps: getAllFollowUps,
  getFollowUpsByCustomer: getFollowUpsByCustomer,
  deleteFollowUp: deleteFollowUp
};
