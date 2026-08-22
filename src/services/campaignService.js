/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - CAMPAIGN & MESSAGE QUEUE SERVICE
   ========================================================================== */

import { getAllRecords, putRecord, getRecord, deleteRecord, clearStore } from '../db/database.js';

export async function getAllMessages() {
  const messages = await getAllRecords('messages');
  return messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function queueMessage(data) {
  const id = data.id || `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();

  const record = {
    id: id,
    customerId: data.customerId || '',
    customerName: data.customerName || 'Customer',
    mobile: data.mobile || '',
    channel: data.channel || 'WHATSAPP', // SMS or WHATSAPP
    message: data.message || '',
    status: data.status || 'PENDING', // PENDING, SENT, FAILED
    campaignId: data.campaignId || '',
    scheduledAt: data.scheduledAt || now,
    createdAt: now,
    sentAt: null
  };

  await putRecord('messages', record);
  return record;
}

export async function markMessageStatus(id, status, error = null) {
  const record = await getRecord('messages', id);
  if (!record) return null;

  record.status = status;
  if (status === 'SENT') {
    record.sentAt = new Date().toISOString();
  }
  if (error) {
    record.error = error;
  }

  await putRecord('messages', record);
  return record;
}

export async function removeMessage(id) {
  return await deleteRecord('messages', id);
}

export async function clearAllMessages() {
  return await clearStore('messages');
}

export async function broadcastCampaign({ title, messageTemplate, targetAudience, customers = [], channel = 'WHATSAPP' }) {
  const campaignId = `CAMP-${Date.now()}`;
  const now = new Date().toISOString();

  let targetCustomers = [...customers];

  if (targetAudience === 'VIP_DIAMOND') {
    targetCustomers = targetCustomers.filter(c => c.tier === 'DIAMOND');
  } else if (targetAudience === 'VIP_GOLD') {
    targetCustomers = targetCustomers.filter(c => c.tier === 'GOLD' || c.tier === 'DIAMOND');
  } else if (targetAudience === 'SOLAPUR_ONLY') {
    targetCustomers = targetCustomers.filter(c => (c.city || '').toLowerCase().includes('solapur'));
  }

  let queuedCount = 0;
  for (const cust of targetCustomers) {
    if (!cust.mobile) continue;

    // Personalize template
    const personalizedText = messageTemplate
      .replace(/{customer_name}/g, cust.name || 'Valued Customer')
      .replace(/{shop_name}/g, 'Karajgikar Jewellers')
      .replace(/{city}/g, cust.city || 'Solapur');

    await queueMessage({
      customerId: cust.id,
      customerName: cust.name,
      mobile: cust.mobile,
      channel: channel,
      message: personalizedText,
      campaignId: campaignId,
      status: 'PENDING'
    });
    queuedCount++;
  }

  // Save campaign record
  await putRecord('campaigns', {
    id: campaignId,
    title: title,
    targetAudience: targetAudience,
    channel: channel,
    recipientCount: queuedCount,
    status: 'QUEUED',
    createdAt: now
  });

  return { campaignId, queuedCount };
}

export async function getAllCampaigns() {
  const campaigns = await getAllRecords('campaigns');
  return (campaigns || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function deleteCampaign(id) {
  return await deleteRecord('campaigns', id);
}
