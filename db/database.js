/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - INDEXEDDB DATABASE LAYER (database.js)
   ========================================================================== */

const DB_NAME = 'KarajgikarJewellersCRM';
const DB_VERSION = 1;

let dbInstance = null;

// 1. OPEN DATABASE CONNECTION
function getDB() {
  return new Promise((resolve, reject) => {
    // If connection already exists, return it instantly
    if (dbInstance) {
      return resolve(dbInstance);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Triggered when database version changes or is created for the first time
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log('Database upgrade required. Creating object stores...');

      // 1. Customers Object Store
      if (!db.objectStoreNames.contains('customers')) {
        const store = db.createObjectStore('customers', { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('mobile', 'mobile', { unique: false });
        store.createIndex('dateOfBirth', 'dateOfBirth', { unique: false });
        store.createIndex('anniversaryDate', 'anniversaryDate', { unique: false });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        console.log('Created Store: customers');
      }

      // 2. Purchases Object Store
      if (!db.objectStoreNames.contains('purchases')) {
        const store = db.createObjectStore('purchases', { keyPath: 'id' });
        store.createIndex('customerId', 'customerId', { unique: false });
        store.createIndex('purchaseDate', 'purchaseDate', { unique: false });
        store.createIndex('category', 'category', { unique: false });
        console.log('Created Store: purchases');
      }

      // 3. Follow-ups Object Store
      if (!db.objectStoreNames.contains('followUps')) {
        const store = db.createObjectStore('followUps', { keyPath: 'id' });
        store.createIndex('customerId', 'customerId', { unique: false });
        store.createIndex('followUpDate', 'followUpDate', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        console.log('Created Store: followUps');
      }

      // 4. Festivals Object Store
      if (!db.objectStoreNames.contains('festivals')) {
        const store = db.createObjectStore('festivals', { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('date', 'date', { unique: false });
        console.log('Created Store: festivals');
      }

      // 5. Campaigns Object Store
      if (!db.objectStoreNames.contains('campaigns')) {
        const store = db.createObjectStore('campaigns', { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        console.log('Created Store: campaigns');
      }

      // 6. Messages Object Store
      if (!db.objectStoreNames.contains('messages')) {
        const store = db.createObjectStore('messages', { keyPath: 'id' });
        store.createIndex('customerId', 'customerId', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('scheduledAt', 'scheduledAt', { unique: false });
        console.log('Created Store: messages');
      }

      // 7. Settings Object Store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
        console.log('Created Store: settings');
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      console.log('IndexedDB connection opened successfully.');
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('Failed to open IndexedDB:', event.target.error);
      reject(event.target.error);
    };
  });
}

// 2. TRANSACTION OPERATIONS WRAPPERS (PROMISES)

// Read transaction on a store
function getStoreReadOnly(storeName, db) {
  const transaction = db.transaction(storeName, 'readonly');
  return transaction.objectStore(storeName);
}

// Read-Write transaction on a store
function getStoreReadWrite(storeName, db) {
  const transaction = db.transaction(storeName, 'readwrite');
  return transaction.objectStore(storeName);
}

// Add a new record
function add(storeName, data) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const store = getStoreReadWrite(storeName, db);
      const request = store.add(data);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Get a record by primary key
function get(storeName, key) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const store = getStoreReadOnly(storeName, db);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Put/Upsert a record (Insert if not exists, update if it does)
function put(storeName, data) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const store = getStoreReadWrite(storeName, db);
      const request = store.put(data);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Delete a record by primary key
function remove(storeName, key) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const store = getStoreReadWrite(storeName, db);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e.target.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Clear all records in a store
function clear(storeName) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const store = getStoreReadWrite(storeName, db);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e.target.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Get all records in a store
function getAll(storeName) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const store = getStoreReadOnly(storeName, db);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (e) => reject(e.target.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Get all records matching a specific index value (e.g. get all purchases where customerId = X)
function getAllByIndex(storeName, indexName, value) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const store = getStoreReadOnly(storeName, db);
      const index = store.index(indexName);
      const request = index.getAll(value);
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (e) => reject(e.target.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Count total records in a store
function count(storeName) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const store = getStoreReadOnly(storeName, db);
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    } catch (err) {
      reject(err);
    }
  });
}

// 3. EXPORT DB TO GLOBAL NAMESPACE
window.CRM = window.CRM || {};
window.CRM.db = {
  getDB: getDB,
  add: add,
  get: get,
  put: put,
  delete: remove,
  getAll: getAll,
  getAllByIndex: getAllByIndex,
  count: count,
  clear: clear
};
