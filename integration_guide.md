# Karajgikar Jewellers CRM - SMS Gateway Integration Guide

This guide is designed for the developer integrating the automated SMS/WhatsApp gateway. It describes the database structure, query indexes, and message status lifecycle in the local IndexedDB database.

---

## 1. Database Specifications

* **Database Name**: `KarajgikarJewellersCRM`
* **Schema Version**: `1`
* **Target Object Store**: `messages`

### Message Record Schema
Each message queued in the `messages` store has the following structure:

```json
{
  "id": "MSG-1786684598527-432",   // String: Primary Key (keyPath)
  "customerId": "CUST-0001",       // String: Unique ID of the customer (Indexed)
  "customerName": "Rahul Sharma",  // String: Customer's display name
  "mobile": "9876543210",          // String: Recipient's phone number
  "channel": "SMS",                // String: "SMS" or "WHATSAPP"
  "message": "Dear Rahul Sharma...", // String: The fully personalized text
  "status": "PENDING",             // String: "PENDING", "SENT", or "FAILED" (Indexed)
  "campaignId": "CAMP-12345",      // String: Associated campaign ID (optional)
  "createdAt": "2026-08-14T10:45Z" // String: ISO Date timestamp
}
```

---

## 2. Querying Pending Messages

To automate sending, your gateway script needs to query messages that are currently marked as `PENDING`.

### JavaScript Query Example:
```javascript
function getPendingMessages() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('KarajgikarJewellersCRM', 1);

    request.onerror = (e) => reject('Failed to open IndexedDB');
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction('messages', 'readonly');
      const store = transaction.objectStore('messages');
      const index = store.index('status');
      
      // Query index for PENDING rows
      const query = index.getAll('PENDING');
      
      query.onsuccess = () => {
        resolve(query.result); // Returns Array of pending message objects
      };
      query.onerror = () => reject('Failed to query messages');
    };
  });
}
```

---

## 3. Updating Status After Sending

Once your SMS gateway successfully sends a text, you **must** update the record's status in the database to prevent duplicate sending.

### JavaScript Update Example:
```javascript
function markMessageAsSent(messageObject) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('KarajgikarJewellersCRM', 1);

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction('messages', 'readwrite');
      const store = transaction.objectStore('messages');
      
      // Modify properties
      messageObject.status = 'SENT';
      messageObject.sentAt = new Date().toISOString();
      
      const updateRequest = store.put(messageObject);
      updateRequest.onsuccess = () => resolve(true);
      updateRequest.onerror = (e) => reject(e.target.error);
    };
  });
}
```

---

## 4. Suggested Gateway Integration Methods

Since IndexedDB runs locally in the client browser, choose one of these three clean integration methods:

### Method A: Local Automation Agent (Simplest & Best)
If your client uses the CRM on a dedicated shop computer (Windows/macOS):
1. Write a small local program (Node.js or Python) that runs in the background.
2. The script can access the Chrome debugging port (`9222`) or connect via WebSockets to read the browser's IndexedDB.
3. It sends the messages via an attached mobile device (e.g. using ADB or an Android SMS gateway application) or a standard web gateway (like Twilio, Gupshup, or SMSHorizon).

### Method B: Chrome Extension Wrapper
1. Build a simple Chrome extension.
2. The extension can run a background script that has direct access to the CRM's origin storage (`localhost`).
3. Every 60 seconds, it queries `PENDING` messages, sends them using a simple HTTPS POST request to your custom SMS server gateway, and updates the IndexedDB statuses.

### Method C: Custom WebView Wrapper (For Android/iOS)
If they want to run the CRM inside a native app:
1. Load the PWA inside an Android app shell using a custom `WebView`.
2. Use a JavaScript Interface (`addJavascriptInterface`) to bridge Web JS to the phone's native SMS manager.
3. Every time a message is added to the queue, the web app triggers the native bridge to send the SMS directly from the phone's SIM card!
