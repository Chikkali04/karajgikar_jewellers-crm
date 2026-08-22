/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - FESTIVAL SERVICE LAYER (festivalService.js)
   ========================================================================== */

// 1. GENERATE SEQUENTIAL FESTIVAL ID
async function generateFestivalID() {
  const db = window.CRM.db;
  try {
    let counterRecord = await db.get('settings', 'festival_counter');
    
    if (!counterRecord) {
      counterRecord = { key: 'festival_counter', value: 0 };
    }
    
    counterRecord.value += 1;
    await db.put('settings', counterRecord);
    
    const formattedId = `FEST-${String(counterRecord.value).padStart(4, '0')}`;
    return formattedId;
  } catch (err) {
    console.error('Failed to generate Festival ID:', err);
    return `FEST-${Date.now()}`;
  }
}

// 2. SEED DEFAULT JEWELLERY SHOPPING FESTIVALS (SOLAPUR PREFERENCES)
async function seedDefaultFestivals() {
  const db = window.CRM.db;
  try {
    const existing = await db.getAll('festivals');
    if (existing.length > 0) {
      console.log('Festivals already exists. Skipping default seed.');
      return;
    }

    console.log('No festivals found. Seeding default auspicious dates...');

    // Base year relative dates for 2026/upcoming festivals
    const defaults = [
      {
        name: 'Dhanteras',
        festivalDate: '2026-11-06',
        description: 'Most auspicious day for gold purchase. Heavy walk-ins expected.'
      },
      {
        name: 'Diwali',
        festivalDate: '2026-11-08',
        description: 'Festival of lights. Peak shopping for Gold jewelry, coins, and gifts.'
      },
      {
        name: 'Akshaya Tritiya',
        festivalDate: '2026-05-18',
        description: 'Auspicious day for buying gold and initiating new jewelry orders.'
      },
      {
        name: 'Gudi Padwa',
        festivalDate: '2026-03-19',
        description: 'Maharashtrian New Year. Highly auspicious for gold purchases in Solapur.'
      },
      {
        name: 'Dussehra',
        festivalDate: '2026-10-20',
        description: 'Celebration of victory. Popular day for delivery of pre-booked jewelry.'
      }
    ];

    for (const fest of defaults) {
      const id = await generateFestivalID();
      await db.add('festivals', {
        id: id,
        name: fest.name,
        festivalDate: fest.festivalDate,
        description: fest.description,
        createdAt: new Date().toISOString()
      });
    }

    console.log('Default festivals successfully seeded into IndexedDB.');
  } catch (err) {
    console.error('Failed to seed default festivals:', err);
  }
}

// 3. DATABASE CRUD METHODS

// Fetch all festivals
async function getAllFestivals() {
  return await window.CRM.db.getAll('festivals');
}

// Save new festival record
async function addFestival(festival) {
  if (!festival.name || !festival.name.trim()) {
    throw new Error('Festival Name is required.');
  }
  if (!festival.festivalDate) {
    throw new Error('Festival Date is required.');
  }

  festival.id = await generateFestivalID();
  festival.name = festival.name.trim();
  festival.description = (festival.description || '').trim();
  festival.createdAt = new Date().toISOString();

  await window.CRM.db.add('festivals', festival);
  return festival;
}

// Update existing festival configuration
async function updateFestival(festival) {
  if (!festival.id) {
    throw new Error('Festival ID is required.');
  }
  if (!festival.name || !festival.name.trim()) {
    throw new Error('Festival Name is required.');
  }
  if (!festival.festivalDate) {
    throw new Error('Festival Date is required.');
  }

  festival.name = festival.name.trim();
  festival.description = (festival.description || '').trim();
  festival.updatedAt = new Date().toISOString();

  await window.CRM.db.put('festivals', festival);
  return festival;
}

// Delete festival configuration
async function deleteFestival(id) {
  if (!id) {
    throw new Error('Festival ID is required for deletion.');
  }
  return await window.CRM.db.delete('festivals', id);
}

// 4. EXPORT TO GLOBAL NAMESPACE
window.CRM = window.CRM || {};
window.CRM.festivalService = {
  seedDefaultFestivals: seedDefaultFestivals,
  getAllFestivals: getAllFestivals,
  addFestival: addFestival,
  updateFestival: updateFestival,
  deleteFestival: deleteFestival
};
