/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - DATABASE BACKUP & RESTORE SERVICE
   ========================================================================== */

import { getAllRecords, putRecord, clearStore } from '../db/database.js';

const STORES = ['customers', 'purchases', 'followUps', 'festivals', 'campaigns', 'messages', 'settings'];

export async function exportDatabaseBackup() {
  const backupData = {
    appName: 'KarajgikarJewellersCRM',
    version: '1.0',
    timestamp: new Date().toISOString(),
    stores: {}
  };

  for (const store of STORES) {
    backupData.stores[store] = await getAllRecords(store);
  }

  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Karajgikar_Jewellers_CRM_Backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return backupData;
}

export async function restoreDatabaseBackup(jsonContent) {
  let data;
  try {
    data = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
  } catch (err) {
    throw new Error('Invalid JSON format in backup file.');
  }

  if (!data.stores) {
    throw new Error('Unrecognized CRM backup file structure.');
  }

  for (const [storeName, records] of Object.entries(data.stores)) {
    if (STORES.includes(storeName) && Array.isArray(records)) {
      await clearStore(storeName);
      for (const record of records) {
        await putRecord(storeName, record);
      }
    }
  }

  return true;
}

export async function resetAllData() {
  for (const store of STORES) {
    await clearStore(store);
  }
  return true;
}
