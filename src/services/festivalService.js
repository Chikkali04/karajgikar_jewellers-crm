/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - FESTIVAL SERVICE LAYER (festivalService.js)
   Matches the exact schema and methods of the original CRM
   ========================================================================== */

import { getAllRecords, getRecord, putRecord, deleteRecord } from '../db/database.js';

// Default auspicious shopping festivals in Solapur
export const DEFAULT_FESTIVALS = [
  {
    id: 'FEST-0001',
    name: 'Gudi Padwa',
    festivalDate: '2026-03-19',
    description: 'Maharashtrian New Year. Highly auspicious for 916 Hallmark gold purchases in Solapur.'
  },
  {
    id: 'FEST-0002',
    name: 'Akshaya Tritiya',
    festivalDate: '2026-04-19',
    description: 'Auspicious day for buying gold and initiating new jewelry orders with assured prosperity.'
  },
  {
    id: 'FEST-0003',
    name: 'Ganesh Chaturthi',
    festivalDate: '2026-09-14',
    description: 'Arrival of Lord Ganesha. Popular for buying pure gold coins and antique jewellery.'
  },
  {
    id: 'FEST-0004',
    name: 'Dussehra / Vijayadashami',
    festivalDate: '2026-10-20',
    description: 'Celebration of victory. Peak day for delivery of pre-booked bridal jewelry.'
  },
  {
    id: 'FEST-0005',
    name: 'Dhanteras',
    festivalDate: '2026-11-06',
    description: 'Most auspicious day for gold purchase. Heavy walk-ins for Lakshmi gold & silver coins.'
  },
  {
    id: 'FEST-0006',
    name: 'Diwali / Laxmi Pujan',
    festivalDate: '2026-11-08',
    description: 'Festival of lights. Peak shopping for gold sets, diamond bangles, and family gifts.'
  }
];

export async function generateFestivalID() {
  try {
    let counterRecord = await getRecord('settings', 'festival_counter');
    if (!counterRecord) {
      counterRecord = { key: 'festival_counter', value: 0 };
    }
    counterRecord.value = (counterRecord.value || 0) + 1;
    await putRecord('settings', counterRecord);
    return `FEST-${String(counterRecord.value).padStart(4, '0')}`;
  } catch (err) {
    return `FEST-${Date.now().toString().slice(-5)}`;
  }
}

export async function seedDefaultFestivals() {
  const existing = await getAllRecords('festivals');
  if (existing && existing.length > 0) return existing;

  for (const fest of DEFAULT_FESTIVALS) {
    await putRecord('festivals', {
      ...fest,
      createdAt: new Date().toISOString()
    });
  }
  return DEFAULT_FESTIVALS;
}

export async function getAllFestivals() {
  const isSeeded = localStorage.getItem('crm_festivals_seeded');
  let list = await getAllRecords('festivals');
  
  if (!isSeeded && (!list || list.length === 0)) {
    localStorage.setItem('crm_festivals_seeded', 'true');
    list = await seedDefaultFestivals();
  }

  return (list || []).sort((a, b) => (a.festivalDate || a.date || '').localeCompare(b.festivalDate || b.date || ''));
}

export async function addFestival(festival) {
  if (!festival.name || !festival.name.trim()) {
    throw new Error('Festival Name is required.');
  }
  const dateVal = festival.festivalDate || festival.date;
  if (!dateVal) {
    throw new Error('Festival Date is required.');
  }

  const id = festival.id || await generateFestivalID();
  const now = new Date().toISOString();

  const record = {
    id: id,
    name: festival.name.trim(),
    festivalDate: dateVal,
    date: dateVal, // backwards compatibility
    description: (festival.description || festival.discountOffer || '').trim(),
    createdAt: festival.createdAt || now,
    updatedAt: now
  };

  await putRecord('festivals', record);
  return record;
}

export const saveFestival = addFestival;

export async function updateFestival(festival) {
  if (!festival.id) throw new Error('Festival ID is required.');
  return await addFestival(festival);
}

export async function deleteFestival(id) {
  if (!id) throw new Error('Festival ID is required.');
  return await deleteRecord('festivals', id);
}

export const removeFestival = deleteFestival;
