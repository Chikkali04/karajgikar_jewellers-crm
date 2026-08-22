/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - CUSTOMER SERVICE (customerService.js)
   ========================================================================== */

import { getAllRecords, getRecord, putRecord, deleteRecord } from '../db/database.js';

export const SAMPLE_CUSTOMERS = [
  { id: 'CUST-00101', name: 'Rajesh Madhavrao Karajgikar', mobile: '9822011111', city: 'Solapur', village: 'Saraf Katta', dateOfBirth: '1985-04-12', anniversaryDate: '2010-12-05', tier: 'DIAMOND', category: 'VIP', tags: ['Bridal', 'Gold Investor'], notes: 'Prefers 22k Hallmark jewellery.' },
  { id: 'CUST-00102', name: 'Pooja Amit Shah', mobile: '9822022222', city: 'Solapur', village: 'Navi Peth', dateOfBirth: '1990-08-22', anniversaryDate: '2015-05-18', tier: 'GOLD', category: 'Regular', tags: ['Antique', 'Temple Jewellery'], notes: 'Prefers Antique necklaces.' },
  { id: 'CUST-00103', name: 'Suresh Babanrao Patil', mobile: '9822033333', city: 'Mohol', village: 'Mohol City', dateOfBirth: '1978-01-15', anniversaryDate: '2002-11-20', tier: 'GOLD', category: 'Regular', tags: ['Gold Chains', 'Coins'], notes: 'Buys gold coins on Dhanteras & Diwali.' },
  { id: 'CUST-00104', name: 'Sunita Ramesh Kulkarni', mobile: '9822044444', city: 'Solapur', village: 'Jule Solapur', dateOfBirth: '1992-06-30', anniversaryDate: '2018-02-14', tier: 'SILVER', category: 'New', tags: ['Daily Wear', 'Rings'], notes: 'Prefers lightweight diamond rings.' },
  { id: 'CUST-00105', name: 'Vijay Dattatray Deshmukh', mobile: '9822055555', city: 'Pandharpur', village: 'Station Road', dateOfBirth: '1982-11-09', anniversaryDate: '2008-04-25', tier: 'DIAMOND', category: 'VIP', tags: ['Bridal Sets', 'Bangles'], notes: 'Annual bridal jewellery purchaser.' },
  { id: 'CUST-00106', name: 'Snehal Vaibhav Joshi', mobile: '9822066666', city: 'Barshi', village: 'Barshi Town', dateOfBirth: '1995-03-14', anniversaryDate: '2020-11-28', tier: 'SILVER', category: 'Regular', tags: ['Silver Utensils', 'Pooja Items'], notes: 'Buys 999 pure silver articles for pooja.' }
];

export function calculateVIPTier(totalSpent) {
  const amount = Number(totalSpent) || 0;
  if (amount >= 500000) return 'DIAMOND';
  if (amount >= 150000) return 'GOLD';
  return 'SILVER';
}

export async function generateCustomerID() {
  try {
    let counterRecord = await getRecord('settings', 'customer_counter');
    if (!counterRecord) {
      const all = await getAllRecords('customers');
      let maxNum = 100;
      (all || []).forEach(c => {
        const match = (c.id || '').match(/(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      counterRecord = { key: 'customer_counter', value: maxNum };
    }

    counterRecord.value = (counterRecord.value || 100) + 1;
    await putRecord('settings', counterRecord);
    return `CUST-${String(counterRecord.value).padStart(5, '0')}`;
  } catch (err) {
    return `CUST-${Date.now().toString().slice(-5)}`;
  }
}

export async function checkDuplicateCustomer(name, mobile, excludeId = null) {
  try {
    const all = await getAllRecords('customers');
    const cleanMobile = String(mobile || '').replace(/\D/g, '');
    const cleanName = String(name || '').trim().toLowerCase();

    for (const c of all) {
      if (excludeId && c.id === excludeId) continue;
      const cMobile = String(c.mobile || '').replace(/\D/g, '');
      if (cleanMobile && cMobile === cleanMobile) {
        return { isDuplicate: true, duplicateField: 'mobile', customer: c };
      }
      if (cleanName && (c.name || '').trim().toLowerCase() === cleanName) {
        return { isDuplicate: true, duplicateField: 'name', customer: c };
      }
    }
    return { isDuplicate: false };
  } catch (e) {
    return { isDuplicate: false };
  }
}

export async function getAllCustomers() {
  const isSeeded = localStorage.getItem('crm_customers_seeded');
  let customers = await getAllRecords('customers');
  
  if (!isSeeded && (!customers || customers.length === 0)) {
    localStorage.setItem('crm_customers_seeded', 'true');
    for (const sc of SAMPLE_CUSTOMERS) {
      await putRecord('customers', sc);
    }
    customers = await getAllRecords('customers');
  }

  const purchases = await getAllRecords('purchases');

  // Compute live spend for each customer
  const spendMap = {};
  purchases.forEach((p) => {
    if (p.customerId) {
      spendMap[p.customerId] = (spendMap[p.customerId] || 0) + Number(p.amount || p.netTotal || p.totalAmount || 0);
    }
  });

  const mapped = customers.map((c) => {
    const totalSpent = spendMap[c.id] || Number(c.totalSpent || 0);
    return {
      ...c,
      name: c.name || 'Unknown',
      category: c.category || 'Regular',
      totalSpent: totalSpent,
      tier: calculateVIPTier(totalSpent)
    };
  });

  // Sort by Customer ID in Ascending Order (CUST-00101, CUST-00102...)
  return mapped.sort((a, b) => (a.id || '').localeCompare(b.id || '', undefined, { numeric: true }));
}

export async function getCustomerById(id) {
  return await getRecord('customers', id);
}

export async function saveCustomer(customerData) {
  const isEdit = !!(customerData.id && String(customerData.id).trim() !== '');
  const id = isEdit ? String(customerData.id).trim() : await generateCustomerID();
  const now = new Date().toISOString();

  const record = {
    id: id,
    name: customerData.name?.trim() || 'Unknown',
    mobile: customerData.mobile?.trim() || '',
    email: customerData.email?.trim() || '',
    city: customerData.city?.trim() || 'Solapur',
    village: customerData.village?.trim() || '',
    address: customerData.address?.trim() || '',
    dateOfBirth: customerData.dateOfBirth || '',
    anniversaryDate: customerData.anniversaryDate || '',
    photoUrl: customerData.photoUrl || '',
    tags: Array.isArray(customerData.tags) ? customerData.tags : (customerData.tags ? [customerData.tags] : []),
    notes: customerData.notes || '',
    category: customerData.category || 'Regular',
    createdAt: customerData.createdAt || now,
    updatedAt: now
  };

  await putRecord('customers', record);
  return record;
}

export async function removeCustomer(id) {
  return await deleteRecord('customers', id);
}

export function exportCustomersToCSV(customers) {
  if (!customers || !customers.length) return;

  const headers = ['Customer ID', 'Name', 'Mobile', 'Category', 'City', 'Village', 'Date of Birth', 'Anniversary', 'VIP Tier', 'Lifetime Spend (INR)', 'Tags'];
  const rows = customers.map(c => [
    `"${c.id}"`,
    `"${c.name.replace(/"/g, '""')}"`,
    `"${c.mobile || ''}"`,
    `"${c.category || 'Regular'}"`,
    `"${c.city || ''}"`,
    `"${c.village || ''}"`,
    `"${c.dateOfBirth || ''}"`,
    `"${c.anniversaryDate || ''}"`,
    `"${c.tier || 'SILVER'}"`,
    `"${c.totalSpent || 0}"`,
    `"${(Array.isArray(c.tags) ? c.tags.join(', ') : (c.tags || '')).replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Karajgikar_Jewellers_Customers_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
