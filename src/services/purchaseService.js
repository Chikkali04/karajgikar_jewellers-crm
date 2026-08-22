/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - PURCHASE SERVICE LAYER (purchaseService.js)
   Matches the exact schema and workflow of the original CRM
   ========================================================================== */

import { getAllRecords, getRecord, putRecord, deleteRecord, getAllByIndex } from '../db/database.js';

// Generate sequential or unique Purchase ID (e.g. PUR-0001)
export async function generatePurchaseID() {
  try {
    let counterRecord = await getRecord('settings', 'purchase_counter');
    if (!counterRecord) {
      counterRecord = { key: 'purchase_counter', value: 0 };
    }
    counterRecord.value = (counterRecord.value || 0) + 1;
    await putRecord('settings', counterRecord);

    return `PUR-${String(counterRecord.value).padStart(4, '0')}`;
  } catch (err) {
    return `PUR-${Date.now().toString().slice(-5)}`;
  }
}

// Add / Save a new purchase record
export async function addPurchase(purchaseData) {
  if (!purchaseData.customerId) {
    throw new Error('Customer is required.');
  }
  if (!purchaseData.productName || !purchaseData.productName.trim()) {
    throw new Error('Product Name / Description is required.');
  }
  if (!purchaseData.category) {
    throw new Error('Metal Category is required.');
  }
  if (!purchaseData.amount || Number(purchaseData.amount) <= 0) {
    throw new Error('Amount must be greater than zero.');
  }
  if (!purchaseData.purchaseDate) {
    throw new Error('Purchase Date is required.');
  }

  const id = purchaseData.id || await generatePurchaseID();
  const now = new Date().toISOString();

  const record = {
    id: id,
    customerId: purchaseData.customerId,
    customerName: purchaseData.customerName || '',
    customerMobile: purchaseData.customerMobile || '',
    productName: purchaseData.productName.trim(),
    category: purchaseData.category, // Gold, Silver, Diamond, Platinum, Other
    amount: Number(purchaseData.amount),
    purchaseDate: purchaseData.purchaseDate,
    productImageUrl: purchaseData.productImageUrl || '',
    notes: (purchaseData.notes || '').trim(),
    createdAt: purchaseData.createdAt || now,
    updatedAt: now
  };

  await putRecord('purchases', record);
  return record;
}

// Backwards-compatible savePurchase alias
export const savePurchase = addPurchase;

// Fetch all purchases (across all customers)
export async function getAllPurchases() {
  const purchases = await getAllRecords('purchases');
  return purchases.sort((a, b) => (b.purchaseDate || '').localeCompare(a.purchaseDate || ''));
}

// Fetch purchases for a single customer
export async function getPurchasesByCustomer(customerId) {
  try {
    const list = await getAllByIndex('purchases', 'customerId', customerId);
    if (list && list.length > 0) {
      return list.sort((a, b) => (b.purchaseDate || '').localeCompare(a.purchaseDate || ''));
    }
  } catch (e) {
    // fallback
  }

  const all = await getAllRecords('purchases');
  return all
    .filter(p => p.customerId === customerId)
    .sort((a, b) => (b.purchaseDate || '').localeCompare(a.purchaseDate || ''));
}

// Delete a purchase record
export async function deletePurchase(id) {
  if (!id) throw new Error('Purchase ID is required.');
  return await deleteRecord('purchases', id);
}

export const removePurchase = deletePurchase;
