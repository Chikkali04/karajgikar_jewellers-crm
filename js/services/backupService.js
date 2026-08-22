/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - OFFLINE BACKUP SERVICE (backupService.js)
   ========================================================================== */

(function () {
  const STORES = ['customers', 'purchases', 'followUps', 'settings', 'festivals', 'campaigns', 'messages'];

  // 1. EXPORT ALL STORES TO JSON FILE
  async function exportBackup() {
    if (!window.CRM || !window.CRM.db) {
      throw new Error('Database layer not loaded.');
    }

    try {
      const db = window.CRM.db;
      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          schemaVersion: 1,
          appName: "KarajgikarJewellersCRM"
        },
        data: {}
      };

      // Query all stores concurrently
      for (const storeName of STORES) {
        exportData.data[storeName] = await db.getAll(storeName);
      }

      // Convert to JSON and trigger file download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `karajgikar_crm_backup_${new Date().toISOString().substring(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Record backup time in settings store
      const lastBackupDateObj = {
        key: 'last_backup_date',
        value: new Date().toISOString()
      };
      await db.put('settings', lastBackupDateObj);

      // Update the UI warning status immediately
      await updateBackupStatusUI();

      return exportData;
    } catch (err) {
      console.error('Failed to export database backup:', err);
      throw err;
    }
  }

  // 2. VALIDATE AND RESTORE STORES FROM JSON FILE
  async function importBackup(file) {
    if (!window.CRM || !window.CRM.db) {
      throw new Error('Database layer not loaded.');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const importData = JSON.parse(event.target.result);

          // Validation Checklist
          if (!importData || typeof importData !== 'object') {
            throw new Error('Invalid JSON format.');
          }
          if (!importData.metadata || importData.metadata.appName !== 'KarajgikarJewellersCRM') {
            throw new Error('This file is not a valid Karajgikar Jewellers CRM backup.');
          }
          if (!importData.data || typeof importData.data !== 'object') {
            throw new Error('No database records found in the backup file.');
          }

          // Validate that the core stores are present (as arrays)
          for (const storeName of STORES) {
            if (importData.data[storeName] && !Array.isArray(importData.data[storeName])) {
              throw new Error(`Invalid data structure for store: ${storeName}`);
            }
          }

          const db = window.CRM.db;

          // Clear existing data from all object stores
          for (const storeName of STORES) {
            await db.clear(storeName);
          }

          // Restore data to each object store
          const counts = {};
          for (const storeName of STORES) {
            const records = importData.data[storeName] || [];
            counts[storeName] = records.length;
            for (const record of records) {
              await db.put(storeName, record);
            }
          }

          // Force a fresh seeding of default configs/festivals if they weren't in the backup
          const appConfig = await db.get('settings', 'app_config');
          if (!appConfig) {
            // Seed base configuration if backup settings were empty
            await db.put('settings', {
              key: 'app_config',
              businessName: 'Karajgikar Jewellers',
              address: '274, Purv Mangalwar Peth, Saraf Katta, Solapur',
              phone: '+91 9876543210',
              currency: 'INR',
              dateFormat: 'DD MMM YYYY',
              upcomingRangeDays: 7,
              updatedAt: new Date().toISOString()
            });
          }

          // Record restoration timestamp in settings
          await db.put('settings', {
            key: 'last_backup_date',
            value: new Date().toISOString()
          });

          // Refresh warning box
          await updateBackupStatusUI();

          resolve(counts);
        } catch (err) {
          console.error('Failed to import database backup:', err);
          reject(err);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read backup file.'));
      reader.readAsText(file);
    });
  }

  // 3. CHECK LAST BACKUP AND DISPLAY WARNING
  async function updateBackupStatusUI() {
    if (!window.CRM || !window.CRM.db) return;

    try {
      const db = window.CRM.db;
      const lastBackupRec = await db.get('settings', 'last_backup_date');
      const warningBox = document.getElementById('backup-warning-box');
      const successBox = document.getElementById('backup-success-box');

      if (!lastBackupRec || !lastBackupRec.value) {
        // No backup ever created! Show warning
        if (warningBox) {
          warningBox.innerHTML = `<strong>Attention Required:</strong> No database backup has ever been exported. Please download a backup to secure your customer records.`;
          warningBox.style.display = 'block';
        }
        if (successBox) successBox.style.display = 'none';
        return;
      }

      const lastBackupDate = new Date(lastBackupRec.value);
      const diffTime = Math.abs(new Date() - lastBackupDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 7) {
        // Last backup was more than 7 days ago! Show warning
        if (warningBox) {
          warningBox.innerHTML = `<strong>Attention Required:</strong> Your last data backup was exported ${diffDays} days ago! Please download a fresh backup file.`;
          warningBox.style.display = 'block';
        }
        if (successBox) successBox.style.display = 'none';
      } else {
        // Backup is fresh! Hide warning and show last backup timestamp
        if (warningBox) warningBox.style.display = 'none';
        if (successBox) {
          const formattedTime = new Date(lastBackupRec.value).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          successBox.innerHTML = `<strong>Success:</strong> Database backed up successfully.<br><span style="font-size: 0.75rem; opacity: 0.8;">Last Exported: ${formattedTime}</span>`;
          successBox.style.display = 'block';
        }
      }
    } catch (err) {
      console.error('Failed to calculate backup age status:', err);
    }
  }

  // Export service functions to global CRM namespace
  window.CRM.backupService = {
    exportBackup: exportBackup,
    importBackup: importBackup,
    updateBackupStatusUI: updateBackupStatusUI
  };
})();
