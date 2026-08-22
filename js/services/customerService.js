/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - CUSTOMER SERVICE LAYER (customerService.js)
   ========================================================================== */

// 1. GENERATE SEQUENTIAL CUSTOMER ID
async function generateCustomerID() {
  const db = window.CRM.db;
  try {
    // Get the counter from the settings store
    let counterRecord = await db.get('settings', 'customer_counter');
    
    if (!counterRecord) {
      counterRecord = { key: 'customer_counter', value: 0 };
    }
    
    // Increment the value
    counterRecord.value += 1;
    
    // Save updated counter back to settings
    await db.put('settings', counterRecord);
    
    // Format the number as CUST-0001, CUST-0002, etc. (padded with 4 zeros)
    const formattedId = `CUST-${String(counterRecord.value).padStart(4, '0')}`;
    return formattedId;
  } catch (err) {
    console.error('Failed to generate Customer ID:', err);
    // Fallback based on timestamp if DB settings fail
    return `CUST-${Date.now()}`;
  }
}

// 2. DUPLICATE CUSTOMER CHECKER
async function checkDuplicateCustomer(name, mobile) {
  const db = window.CRM.db;
  try {
    const allCustomers = await db.getAll('customers');
    
    const formattedMobile = String(mobile).trim();
    const formattedName = String(name).trim().toLowerCase();
    
    let duplicateMobile = false;
    let duplicateName = false;
    let matchedCustomer = null;
    
    for (const cust of allCustomers) {
      // 1. Check phone match
      if (cust.mobile.trim() === formattedMobile) {
        duplicateMobile = true;
        matchedCustomer = cust;
        break; // Stop scanning if we find a phone match (high priority)
      }
      
      // 2. Check name match (case-insensitive)
      if (cust.name.trim().toLowerCase() === formattedName) {
        duplicateName = true;
        matchedCustomer = cust;
      }
    }
    
    return {
      isDuplicate: duplicateMobile || duplicateName,
      duplicateMobile: duplicateMobile,
      duplicateName: duplicateName,
      customer: matchedCustomer
    };
  } catch (err) {
    console.error('Duplicate check failed:', err);
    return { isDuplicate: false };
  }
}

// 3. DATABASE CRUD WRAPPERS

// Fetch all customers
async function getAllCustomers() {
  return await window.CRM.db.getAll('customers');
}

// Fetch single customer by ID
async function getCustomer(id) {
  return await window.CRM.db.get('customers', id);
}

// Save a new customer (creates ID and timestamps)
async function addCustomer(customer) {
  // Input validations
  if (!customer.name || !customer.name.trim()) {
    throw new Error('Customer Name is required.');
  }
  if (!customer.mobile || !customer.mobile.trim()) {
    throw new Error('Mobile Number is required.');
  }

  // Set sequential ID
  customer.id = await generateCustomerID();
  
  // Set Timestamps
  const timestamp = new Date().toISOString();
  customer.createdAt = timestamp;
  customer.updatedAt = timestamp;
  
  // Clean text values
  customer.name = customer.name.trim();
  customer.mobile = customer.mobile.trim();
  customer.whatsapp = (customer.whatsapp || customer.mobile).trim();
  
  await window.CRM.db.add('customers', customer);
  return customer;
}

// Update existing customer details
async function updateCustomer(customer) {
  if (!customer.id) {
    throw new Error('Customer ID is required for updates.');
  }
  if (!customer.name || !customer.name.trim()) {
    throw new Error('Customer Name is required.');
  }
  if (!customer.mobile || !customer.mobile.trim()) {
    throw new Error('Mobile Number is required.');
  }
  
  // Update timestamp
  customer.updatedAt = new Date().toISOString();
  customer.name = customer.name.trim();
  customer.mobile = customer.mobile.trim();
  
  await window.CRM.db.put('customers', customer);
  return customer;
}

// Delete customer record from DB
async function deleteCustomer(id) {
  if (!id) {
    throw new Error('Customer ID is required for deletion.');
  }
  return await window.CRM.db.delete('customers', id);
}

// Calculate VIP Loyalty Tier based on lifetime purchase value
function getCustomerTier(totalSpent = 0) {
  const amount = Number(totalSpent) || 0;
  if (amount >= 500000) {
    return {
      key: 'diamond',
      name: 'Diamond Royal VIP',
      nameMr: 'डायमंड रॉयल VIP',
      badgeClass: 'badge-diamond',
      icon: '💎',
      minSpend: 500000,
      nextTier: null,
      neededAmount: 0,
      progressPct: 100
    };
  } else if (amount >= 100000) {
    return {
      key: 'gold',
      name: 'Gold VIP',
      nameMr: 'गोल्ड VIP',
      badgeClass: 'badge-gold-vip',
      icon: '🥇',
      minSpend: 100000,
      nextTier: 'Diamond Royal VIP (₹5,00,000)',
      targetAmount: 500000,
      neededAmount: 500000 - amount,
      progressPct: Math.min(100, Math.round(((amount - 100000) / 400000) * 100))
    };
  } else {
    return {
      key: 'silver',
      name: 'Silver Member',
      nameMr: 'सिल्व्हर ग्राहक',
      badgeClass: 'badge-silver',
      icon: '🥈',
      minSpend: 0,
      nextTier: 'Gold VIP (₹1,00,000)',
      targetAmount: 100000,
      neededAmount: 100000 - amount,
      progressPct: Math.min(100, Math.round((amount / 100000) * 100))
    };
  }
}

// 4. EXPORT TO GLOBAL NAMESPACE
window.CRM = window.CRM || {};
window.CRM.customerService = {
  generateCustomerID: generateCustomerID,
  checkDuplicateCustomer: checkDuplicateCustomer,
  getAllCustomers: getAllCustomers,
  getCustomer: getCustomer,
  addCustomer: addCustomer,
  updateCustomer: updateCustomer,
  deleteCustomer: deleteCustomer,
  getCustomerTier: getCustomerTier
};
