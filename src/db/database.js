/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - BULLETPROOF DATABASE LAYER (database.js)
   IndexedDB with automatic LocalStorage backup & synchronization
   ========================================================================== */

const DB_NAME = 'KarajgikarJewellersCRM';
const DB_VERSION = 2;

let dbInstance = null;

export function getDB() {
  return new Promise((resolve) => {
    if (dbInstance) {
      return resolve(dbInstance);
    }

    if (typeof indexedDB === 'undefined') {
      console.warn('IndexedDB not supported, using LocalStorage.');
      return resolve(null);
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        const stores = [
          { name: 'customers', indexes: ['name', 'mobile', 'dateOfBirth', 'anniversaryDate', 'category', 'createdAt'] },
          { name: 'purchases', indexes: ['customerId', 'purchaseDate', 'category'] },
          { name: 'followUps', indexes: ['customerId', 'followUpDate', 'status'] },
          { name: 'festivals', indexes: ['name', 'date'] },
          { name: 'campaigns', indexes: ['status', 'createdAt'] },
          { name: 'messages', indexes: ['customerId', 'status', 'scheduledAt'] },
          { name: 'settings', keyPath: 'key' }
        ];

        stores.forEach(s => {
          if (!db.objectStoreNames.contains(s.name)) {
            const store = db.createObjectStore(s.name, { keyPath: s.keyPath || 'id' });
            if (s.indexes) {
              s.indexes.forEach(idx => store.createIndex(idx, idx, { unique: false }));
            }
          }
        });
      };

      request.onsuccess = (event) => {
        dbInstance = event.target.result;
        resolve(dbInstance);
      };

      request.onerror = (event) => {
        console.warn('IndexedDB open error:', event?.target?.error);
        resolve(null);
      };

      request.onblocked = () => {
        console.warn('IndexedDB blocked');
        resolve(null);
      };
    } catch (e) {
      console.warn('Failed to initialize IndexedDB:', e);
      resolve(null);
    }
  });
}

function getLS(storeName) {
  try {
    const raw = localStorage.getItem(`crm_${storeName}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function setLS(storeName, data) {
  try {
    localStorage.setItem(`crm_${storeName}`, JSON.stringify(data));
  } catch (e) {
    console.warn(`LocalStorage quota issue for ${storeName}`);
  }
}

export async function putRecord(storeName, data) {
  if (!data) return null;
  const keyField = storeName === 'settings' ? 'key' : 'id';

  // Update LocalStorage mirror
  const currentList = getLS(storeName);
  const idx = currentList.findIndex(item => String(item[keyField]) === String(data[keyField]));
  if (idx >= 0) {
    currentList[idx] = data;
  } else {
    currentList.push(data);
  }
  setLS(storeName, currentList);

  // Write to IndexedDB
  try {
    const db = await getDB();
    if (db && db.objectStoreNames.contains(storeName)) {
      await new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(data);
        req.onsuccess = () => resolve(data);
        req.onerror = () => resolve(data);
      });
    }
  } catch (e) {
    console.warn(`IndexedDB write error for ${storeName}:`, e);
  }

  return data;
}

export async function getRecord(storeName, key) {
  const keyField = storeName === 'settings' ? 'key' : 'id';

  try {
    const db = await getDB();
    if (db && db.objectStoreNames.contains(storeName)) {
      const record = await new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });
      if (record) return record;
    }
  } catch (e) {
    // fallback
  }

  const list = getLS(storeName);
  return list.find(item => String(item[keyField]) === String(key)) || null;
}

export async function getAllRecords(storeName) {
  let idbRecords = null;

  try {
    const db = await getDB();
    if (db && db.objectStoreNames.contains(storeName)) {
      idbRecords = await new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });
    }
  } catch (e) {
    idbRecords = null;
  }

  if (Array.isArray(idbRecords)) {
    // Mirror IndexedDB array directly to LocalStorage so both match
    setLS(storeName, idbRecords);
    return idbRecords;
  }

  return getLS(storeName);
}

export async function deleteRecord(storeName, key) {
  const keyField = storeName === 'settings' ? 'key' : 'id';

  // 1. Clean from LocalStorage
  const list = getLS(storeName).filter(item => String(item[keyField]) !== String(key));
  setLS(storeName, list);

  // 2. Clean from IndexedDB
  try {
    const db = await getDB();
    if (db && db.objectStoreNames.contains(storeName)) {
      await new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    }
  } catch (e) {
    console.warn(`IndexedDB delete error for ${storeName}:`, e);
  }
}

export async function clearStore(storeName) {
  setLS(storeName, []);
  try {
    const db = await getDB();
    if (db && db.objectStoreNames.contains(storeName)) {
      await new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    }
  } catch (e) {
    // done
  }
}

export async function getAllByIndex(storeName, indexName, value) {
  const all = await getAllRecords(storeName);
  return all.filter(item => item[indexName] === value);
}

export async function countRecords(storeName) {
  const all = await getAllRecords(storeName);
  return all.length;
}
