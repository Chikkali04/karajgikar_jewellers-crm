/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - CAMPAIGN SERVICE LAYER (campaignService.js)
   ========================================================================== */

// 1. GENERATE SEQUENTIAL CAMPAIGN ID
async function generateCampaignID() {
  const db = window.CRM.db;
  try {
    let counterRecord = await db.get('settings', 'campaign_counter');
    
    if (!counterRecord) {
      counterRecord = { key: 'campaign_counter', value: 0 };
    }
    
    counterRecord.value += 1;
    await db.put('settings', counterRecord);
    
    const formattedId = `CAMP-${String(counterRecord.value).padStart(4, '0')}`;
    return formattedId;
  } catch (err) {
    console.error('Failed to generate Campaign ID:', err);
    return `CAMP-${Date.now()}`;
  }
}

// 2. DATABASE CRUD & LAUNCH OPERATIONS

// Fetch all campaigns
async function getAllCampaigns() {
  return await window.CRM.db.getAll('campaigns');
}

// Save new campaign config in DRAFT status
async function addCampaign(campaign) {
  if (!campaign.name || !campaign.name.trim()) {
    throw new Error('Campaign Name is required.');
  }
  if (!campaign.purpose || !campaign.purpose.trim()) {
    throw new Error('Campaign Purpose is required.');
  }
  if (!campaign.targetScope) {
    throw new Error('Target Scope is required.');
  }
  if (!campaign.channel) {
    throw new Error('Sending Channel is required.');
  }
  if (!campaign.messageTemplate || !campaign.messageTemplate.trim()) {
    throw new Error('Message Template is required.');
  }

  campaign.id = await generateCampaignID();
  campaign.status = 'DRAFT';
  
  const timestamp = new Date().toISOString();
  campaign.createdAt = timestamp;
  campaign.scheduledDate = campaign.scheduledDate || timestamp.substring(0, 10);
  campaign.messageCount = 0;

  // Clean inputs
  campaign.name = campaign.name.trim();
  campaign.purpose = campaign.purpose.trim();
  campaign.messageTemplate = campaign.messageTemplate.trim();

  await window.CRM.db.add('campaigns', campaign);
  return campaign;
}

// Execute Campaign: filter targets, personalize templates, write to message queue
async function launchCampaign(campaignId) {
  const db = window.CRM.db;
  
  // 1. Get campaign config
  const campaign = await db.get('campaigns', campaignId);
  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found.`);
  }

  // 2. Fetch all customers to filter
  const customers = await window.CRM.customerService.getAllCustomers();
  
  // 3. Filter customers by target scope
  let targets = [];
  if (campaign.targetScope === 'ALL') {
    targets = customers;
  } else {
    targets = customers.filter(c => c.category === campaign.targetScope);
  }

  if (targets.length === 0) {
    throw new Error('No customers found in the target scope category.');
  }

  // 4. Personalize and write each message to message center
  let successCount = 0;
  for (const cust of targets) {
    // Replace [Name] placeholder with customer's real name
    const personalizedMsg = campaign.messageTemplate.replace(/\[Name\]/g, cust.name);

    try {
      await db.add('messages', {
        id: `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        customerId: cust.id,
        customerName: cust.name,
        mobile: cust.mobile,
        channel: campaign.channel,
        message: personalizedMsg,
        status: 'PENDING',
        campaignId: campaignId,
        createdAt: new Date().toISOString()
      });
      successCount++;
    } catch (msgErr) {
      console.error(`Failed to queue campaign message for ${cust.id}:`, msgErr);
    }
  }

  // 5. Update campaign status and count
  campaign.status = 'LAUNCHED';
  campaign.messageCount = successCount;
  campaign.updatedAt = new Date().toISOString();
  await db.put('campaigns', campaign);

  return successCount;
}

// Delete campaign configuration
async function deleteCampaign(id) {
  if (!id) {
    throw new Error('Campaign ID is required.');
  }
  return await window.CRM.db.delete('campaigns', id);
}

// 3. EXPORT TO GLOBAL NAMESPACE
window.CRM = window.CRM || {};
window.CRM.campaignService = {
  addCampaign: addCampaign,
  getAllCampaigns: getAllCampaigns,
  launchCampaign: launchCampaign,
  deleteCampaign: deleteCampaign
};
