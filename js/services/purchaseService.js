/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - PURCHASE SERVICE LAYER (purchaseService.js)
   ========================================================================== */

// 1. GENERATE SEQUENTIAL PURCHASE ID
async function generatePurchaseID() {
  const db = window.CRM.db;
  try {
    let counterRecord = await db.get('settings', 'purchase_counter');
    
    if (!counterRecord) {
      counterRecord = { key: 'purchase_counter', value: 0 };
    }
    
    counterRecord.value += 1;
    await db.put('settings', counterRecord);
    
    const formattedId = `PUR-${String(counterRecord.value).padStart(4, '0')}`;
    return formattedId;
  } catch (err) {
    console.error('Failed to generate Purchase ID:', err);
    return `PUR-${Date.now()}`;
  }
}

// 2. DATABASE CRUD OPERATIONS

// Save a new purchase record
async function addPurchase(purchase) {
  // Field validations
  if (!purchase.customerId) {
    throw new Error('Customer ID is required.');
  }
  if (!purchase.productName || !purchase.productName.trim()) {
    throw new Error('Product Name is required.');
  }
  if (!purchase.category) {
    throw new Error('Category is required.');
  }
  if (!purchase.amount || Number(purchase.amount) <= 0) {
    throw new Error('Amount must be greater than zero.');
  }
  if (!purchase.purchaseDate) {
    throw new Error('Purchase Date is required.');
  }

  // Generate ID
  purchase.id = await generatePurchaseID();
  purchase.createdAt = new Date().toISOString();
  
  // Clean values
  purchase.productName = purchase.productName.trim();
  purchase.amount = Number(purchase.amount);
  purchase.notes = (purchase.notes || '').trim();

  await window.CRM.db.add('purchases', purchase);
  return purchase;
}

// Fetch all purchases (across all customers)
async function getAllPurchases() {
  return await window.CRM.db.getAll('purchases');
}

// Fetch purchases linked to a single customer ID
async function getPurchasesByCustomer(customerId) {
  return await window.CRM.db.getAllByIndex('purchases', 'customerId', customerId);
}

// Delete a purchase record
async function deletePurchase(id) {
  if (!id) {
    throw new Error('Purchase ID is required for deletion.');
  }
  return await window.CRM.db.delete('purchases', id);
}

// 3. EXPORT TO GLOBAL NAMESPACE
window.CRM = window.CRM || {};
window.CRM.purchaseService = {
  addPurchase: addPurchase,
  getAllPurchases: getAllPurchases,
  getPurchasesByCustomer: getPurchasesByCustomer,
  deletePurchase: deletePurchase
};
