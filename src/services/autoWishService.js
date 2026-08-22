/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - AUTOMATED BIRTHDAY & ANNIVERSARY WISHING SERVICE
   Synchronizes with SMS / WhatsApp Gateway (Target Store: 'messages')
   ========================================================================== */

import { getAllRecords, getRecord, putRecord } from '../db/database.js';
import { queueMessage } from './campaignService.js';

export function getUpcomingCelebrations(customers = [], daysAhead = 7) {
  const today = new Date();
  const celebrations = [];

  customers.forEach(cust => {
    // Check Birthday
    if (cust.dateOfBirth) {
      const parts = cust.dateOfBirth.split('-'); // YYYY-MM-DD
      if (parts.length >= 3) {
        const bMonth = parseInt(parts[1], 10);
        const bDay = parseInt(parts[2], 10);

        const diffDays = getDaysUntil(bMonth, bDay, today);
        if (diffDays >= 0 && diffDays <= daysAhead) {
          celebrations.push({
            customerId: cust.id,
            customerName: cust.name,
            mobile: cust.mobile,
            photoUrl: cust.photoUrl || '',
            city: cust.city,
            type: 'BIRTHDAY',
            eventDate: `${bDay.toString().padStart(2, '0')}/${bMonth.toString().padStart(2, '0')}`,
            daysLeft: diffDays,
            isToday: diffDays === 0
          });
        }
      }
    }

    // Check Anniversary
    if (cust.anniversaryDate) {
      const parts = cust.anniversaryDate.split('-');
      if (parts.length >= 3) {
        const aMonth = parseInt(parts[1], 10);
        const aDay = parseInt(parts[2], 10);

        const diffDays = getDaysUntil(aMonth, aDay, today);
        if (diffDays >= 0 && diffDays <= daysAhead) {
          celebrations.push({
            customerId: cust.id,
            customerName: cust.name,
            mobile: cust.mobile,
            photoUrl: cust.photoUrl || '',
            city: cust.city,
            type: 'ANNIVERSARY',
            eventDate: `${aDay.toString().padStart(2, '0')}/${aMonth.toString().padStart(2, '0')}`,
            daysLeft: diffDays,
            isToday: diffDays === 0
          });
        }
      }
    }
  });

  return celebrations.sort((a, b) => a.daysLeft - b.daysLeft);
}

function getDaysUntil(month, day, today) {
  const currentYear = today.getFullYear();
  let targetDate = new Date(currentYear, month - 1, day);

  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (targetDate < todayMidnight) {
    targetDate = new Date(currentYear + 1, month - 1, day);
  }

  const diffTime = targetDate - todayMidnight;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function generateWishMessage(celebration, shopName = 'Karajgikar Jewellers, Solapur') {
  if (celebration.type === 'BIRTHDAY') {
    return `आदरणीय ${celebration.customerName} जी, ${shopName} परिवाराकडून वाढदिवसाच्या हार्दिक शुभेच्छा! 🎂✨ आपल्यासाठी आजच्या खरेदीवर विशेष सुवर्ण सवलत उपलब्ध आहे. भेट द्या: 274, सराफ कट्टा, सोलापूर. फोन: 9822012345`;
  }
  return `आदरणीय ${celebration.customerName} जी, ${shopName} परिवाराकडून लग्नवर्धापनदिनाच्या मनःपूर्वक शुभेच्छा! 💍✨ आपले दांपत्य जीवन सदैव समृद्ध राहो. खास ऑफरसाठी भेट द्या: सराफ कट्टा, सोलापूर. फोन: 9822012345`;
}

export function openWhatsAppWish(celebration) {
  const text = encodeURIComponent(generateWishMessage(celebration));
  const cleanMobile = celebration.mobile.replace(/\D/g, '');
  const formattedMobile = cleanMobile.startsWith('91') ? cleanMobile : `91${cleanMobile}`;
  window.open(`https://wa.me/${formattedMobile}?text=${text}`, '_blank');
}

/**
 * AUTOMATED DAILY SMS QUEUE ENGINE
 * Automatically checks for today's celebrations and queues SMS messages
 * into IndexedDB ('messages' store) with status 'PENDING' for the external SMS gateway.
 */
export async function autoQueueTodaysCelebrationWishes(customers = [], force = false) {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Check if auto-wishes are enabled in settings
  const config = await getRecord('settings', 'auto_wishes_config');
  if (config && config.enabled === false && !force) {
    return { queuedCount: 0, reason: 'Disabled in settings' };
  }

  // Get existing messages from today to prevent duplicate queuing
  const allMessages = await getAllRecords('messages');
  const todaysMessages = allMessages.filter(m => (m.createdAt || '').startsWith(todayStr));
  const alreadyQueuedCustomerMap = new Set(todaysMessages.map(m => `${m.customerId}_${m.channel}`));

  const todayCelebrations = getUpcomingCelebrations(customers, 0).filter(c => c.isToday);

  let queuedCount = 0;
  for (const celeb of todayCelebrations) {
    if (!celeb.mobile) continue;

    const uniqueKey = `${celeb.customerId}_SMS`;
    if (!alreadyQueuedCustomerMap.has(uniqueKey) || force) {
      const wishText = generateWishMessage(celeb);

      await queueMessage({
        customerId: celeb.customerId,
        customerName: celeb.customerName,
        mobile: celeb.mobile,
        channel: 'SMS', // Default channel for automated gateway
        message: wishText,
        campaignId: `AUTO-WISH-${todayStr}`,
        status: 'PENDING'
      });

      alreadyQueuedCustomerMap.add(uniqueKey);
      queuedCount++;
    }
  }

  // Record timestamp of last automated scan
  await putRecord('settings', {
    key: 'last_auto_wish_scan',
    date: todayStr,
    timestamp: new Date().toISOString(),
    queuedCount: queuedCount
  });

  return { queuedCount, totalToday: todayCelebrations.length };
}
