/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - GLOBAL CRM CONTEXT (CRMContext.jsx)
   ========================================================================== */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, getTranslation } from '../services/i18nService.js';
import { getMetalRates, saveMetalRates } from '../services/goldRateService.js';
import { getRecord, putRecord } from '../db/database.js';
import { getAllCustomers } from '../services/customerService.js';
import { autoQueueTodaysCelebrationWishes } from '../services/autoWishService.js';

const CRMContext = createContext(null);

export function CRMProvider({ children }) {
  const [activeView, setActiveView] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('karajgikar_theme') || 'dark');
  const [language, setLanguage] = useState(() => localStorage.getItem('karajgikar_lang') || 'en');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [metalRates, setMetalRates] = useState({ gold22k: 6850, gold24k: 7450, gold18k: 5600, silver: 88, updatedAt: '' });
  const [toasts, setToasts] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Security Lock
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [pinProtectionEnabled, setPinProtectionEnabled] = useState(false);

  // Global Modals / Drawers State
  const [quickAddCustomerOpen, setQuickAddCustomerOpen] = useState(false);
  const [quickAddPurchaseOpen, setQuickAddPurchaseOpen] = useState(false);
  const [purchaseModalCustomerId, setPurchaseModalCustomerId] = useState(null);
  const [activeCustomerProfileId, setActiveCustomerProfileId] = useState(null);
  const [activeInvoicePurchase, setActiveInvoicePurchase] = useState(null);
  const [confirmDialogState, setConfirmDialogState] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const openRecordPurchaseModal = (targetCustId = null) => {
    setPurchaseModalCustomerId(targetCustId);
    setQuickAddPurchaseOpen(true);
  };

  const closeRecordPurchaseModal = () => {
    setQuickAddPurchaseOpen(false);
    setPurchaseModalCustomerId(null);
  };

  // Apply Theme to Document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('karajgikar_theme', theme);
  }, [theme]);

  // Load Metal Rates & Security Settings & Run Automated Daily Wishes Scan on mount
  useEffect(() => {
    async function init() {
      try {
        const rates = await getMetalRates();
        setMetalRates(rates);

        const pinSetting = await getRecord('settings', 'pin_security');
        if (pinSetting && pinSetting.enabled) {
          setPinProtectionEnabled(true);
          setIsUnlocked(false);
        }

        // Automated daily celebration wish queueing for SMS gateway
        const customers = await getAllCustomers();
        const autoWishRes = await autoQueueTodaysCelebrationWishes(customers);
        if (autoWishRes && autoWishRes.queuedCount > 0) {
          showToast(`Automated SMS Queue: Queued ${autoWishRes.queuedCount} celebration wishes for SMS gateway!`, 'info');
        }
      } catch (e) {
        console.error('Initialization error:', e);
      }
    }
    init();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('karajgikar_lang', newLang);
  };

  const t = (key) => {
    return getTranslation(language, key);
  };

  const updateRates = async (newRates) => {
    const updated = await saveMetalRates(newRates);
    setMetalRates(updated);
    showToast('Metal rates updated successfully!', 'success');
  };

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3800);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const triggerRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  const openConfirm = (title, message, onConfirm) => {
    setConfirmDialogState({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        setConfirmDialogState(prev => ({ ...prev, isOpen: false }));
        if (onConfirm) await onConfirm();
      }
    });
  };

  const closeConfirm = () => {
    setConfirmDialogState({ isOpen: false, title: '', message: '', onConfirm: null });
  };

  const unlockApp = async (pin) => {
    const pinSetting = await getRecord('settings', 'pin_security');
    const validPin = (pinSetting && pinSetting.pin) ? pinSetting.pin : '1234';
    if (pin === validPin) {
      setIsUnlocked(true);
      return true;
    }
    return false;
  };

  const lockApp = () => {
    setIsUnlocked(false);
    showToast('System locked for security 🔒', 'info');
  };

  return (
    <CRMContext.Provider value={{
      activeView,
      setActiveView,
      theme,
      toggleTheme,
      language,
      setLanguage: changeLanguage,
      t,
      sidebarCollapsed,
      setSidebarCollapsed,
      mobileMenuOpen,
      setMobileMenuOpen,
      metalRates,
      updateRates,
      toasts,
      showToast,
      removeToast,
      refreshKey,
      triggerRefresh,
      isUnlocked,
      unlockApp,
      lockApp,
      pinProtectionEnabled,
      setPinProtectionEnabled,
      quickAddCustomerOpen,
      setQuickAddCustomerOpen,
      quickAddPurchaseOpen,
      setQuickAddPurchaseOpen,
      purchaseModalCustomerId,
      openRecordPurchaseModal,
      closeRecordPurchaseModal,
      activeCustomerProfileId,
      setActiveCustomerProfileId,
      activeInvoicePurchase,
      setActiveInvoicePurchase,
      confirmDialogState,
      openConfirm,
      closeConfirm
    }}>
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
}
