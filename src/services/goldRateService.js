/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - LIVE GOLD & SILVER RATE SERVICE
   ========================================================================== */

import { getRecord, putRecord } from '../db/database.js';

const STORAGE_KEY = 'karajgikar_gold_rates';

const DEFAULT_RATES = {
  gold22k: 6850,
  gold24k: 7450,
  gold18k: 5600,
  silver: 88,
  updatedAt: new Date().toISOString()
};

export async function getMetalRates() {
  try {
    const dbRate = await getRecord('settings', 'metal_rates');
    if (dbRate && dbRate.value) {
      return dbRate.value;
    }
  } catch (e) {
    console.warn('Could not read rates from IndexedDB, falling back to localStorage');
  }

  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      // fallback
    }
  }
  return DEFAULT_RATES;
}

export async function saveMetalRates(rates) {
  const payload = {
    ...rates,
    updatedAt: new Date().toISOString()
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

  try {
    await putRecord('settings', {
      key: 'metal_rates',
      value: payload
    });
  } catch (e) {
    console.error('Failed to save rates to IndexedDB:', e);
  }

  return payload;
}
