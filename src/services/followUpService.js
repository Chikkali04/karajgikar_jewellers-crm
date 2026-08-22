/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - FOLLOW-UP SERVICE (followUpService.js)
   ========================================================================== */

import { getAllRecords, getRecord, putRecord, deleteRecord, getAllByIndex } from '../db/database.js';

export async function getAllFollowUps() {
  const followUps = await getAllRecords('followUps');
  return followUps.sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));
}

export async function getFollowUpsByCustomer(customerId) {
  try {
    return await getAllByIndex('followUps', 'customerId', customerId);
  } catch (e) {
    const all = await getAllRecords('followUps');
    return all.filter(f => f.customerId === customerId);
  }
}

export async function getTodaysFollowUps() {
  const all = await getAllFollowUps();
  const todayStr = new Date().toISOString().slice(0, 10);
  return all.filter(f => f.followUpDate <= todayStr && f.status === 'PENDING');
}

export async function saveFollowUp(data) {
  const id = data.id || `FU-${Date.now().toString().slice(-6)}`;
  const now = new Date().toISOString();

  const record = {
    ...data,
    id: id,
    customerId: data.customerId || '',
    customerName: data.customerName || 'Valued Customer',
    customerMobile: data.customerMobile || '',
    type: data.type || 'INQUIRY', // INQUIRY, CUSTOM_DESIGN, PAYMENT_REMINDER, FESTIVAL_GREETING, GENERAL
    purpose: data.purpose || '',
    followUpDate: data.followUpDate || now.slice(0, 10),
    urgency: data.urgency || 'MEDIUM', // LOW, MEDIUM, HIGH, CRITICAL
    status: data.status || 'PENDING', // PENDING, COMPLETED, RESCHEDULED, CANCELLED
    notes: data.notes || '',
    createdAt: data.createdAt || now,
    updatedAt: now
  };

  await putRecord('followUps', record);
  return record;
}

export async function markFollowUpStatus(id, newStatus, extraNotes = '') {
  const record = await getRecord('followUps', id);
  if (!record) return null;

  record.status = newStatus;
  record.updatedAt = new Date().toISOString();
  if (extraNotes) {
    record.notes = record.notes ? `${record.notes} | ${extraNotes}` : extraNotes;
  }

  await putRecord('followUps', record);
  return record;
}

export async function removeFollowUp(id) {
  return await deleteRecord('followUps', id);
}
