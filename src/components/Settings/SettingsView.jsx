/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - LUXURY TABBED SETTINGS (SettingsView.jsx)
   Permanent Client Brand Identity + Responsive PIN Security & SMS Gateway
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext.jsx';
import { getRecord, putRecord } from '../../db/database.js';
import { getAllCustomers } from '../../services/customerService.js';
import { autoQueueTodaysCelebrationWishes } from '../../services/autoWishService.js';
import { exportDatabaseBackup, restoreDatabaseBackup, resetAllData } from '../../services/backupService.js';
import {
  Settings,
  Store,
  Shield,
  Download,
  Upload,
  RotateCcw,
  Check,
  Send,
  Sparkles,
  Terminal,
  Lock,
  ShieldCheck,
  Building2,
  KeyRound,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';

export default function SettingsView() {
  const {
    t,
    openConfirm,
    showToast,
    triggerRefresh,
    setPinProtectionEnabled,
    lockApp
  } = useCRM();

  // Active Settings Tab: 'profile' | 'security' | 'sms' | 'backup'
  const [activeTab, setActiveTab] = useState('profile');

  // Store Profile State (Permanent Heritage Locked for Karajgikar Jewellers)
  const [storeProfile, setStoreProfile] = useState({
    shopName: 'Karajgikar Jewellers',
    tagline: 'ESTD. 1958 • SOLAPUR',
    address: '274, Purv Mangalwar Peth, Saraf Katta, Solapur - 413002, Maharashtra',
    phone: '9822012345',
    gstin: '27AAAAA0000A1Z5'
  });

  // Automated SMS Wishes Settings
  const [autoWishConfig, setAutoWishConfig] = useState({
    enabled: true,
    channel: 'SMS',
    birthdayTemplate: 'आदरणीय {customer_name} जी, Karajgikar Jewellers कडून वाढदिवसाच्या हार्दिक शुभेच्छा! 🎂✨ खास सुवर्ण सवलतीसाठी आजच भेट द्या: 274, सराफ कट्टा, सोलापूर. फोन: 9822012345',
    anniversaryTemplate: 'आदरणीय {customer_name} जी, Karajgikar Jewellers परिवाराकडून लग्नवर्धापनदिनाच्या मनःपूर्वक शुभेच्छा! 💍✨ आपले दांपत्य जीवन सदैव समृद्ध राहो. भेट द्या: सराफ कट्टा, सोलापूर. फोन: 9822012345'
  });

  const [lastAutoWishScan, setLastAutoWishScan] = useState(null);

  // PIN Security State
  const [pinEnabled, setPinEnabled] = useState(false);
  const [savedPinExists, setSavedPinExists] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [securitySuccessMsg, setSecuritySuccessMsg] = useState('');

  const [restoreFile, setRestoreFile] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const store = await getRecord('settings', 'store_profile');
        if (store && store.value) {
          setStoreProfile(prev => ({
            ...prev,
            phone: store.value.phone || prev.phone,
            gstin: store.value.gstin || prev.gstin
          }));
        }

        const wishCfg = await getRecord('settings', 'auto_wishes_config');
        if (wishCfg) {
          setAutoWishConfig(wishCfg);
        }

        const lastScan = await getRecord('settings', 'last_auto_wish_scan');
        if (lastScan) {
          setLastAutoWishScan(lastScan);
        }

        const sec = await getRecord('settings', 'pin_security');
        if (sec) {
          setPinEnabled(!!sec.enabled);
          setSavedPinExists(!!(sec.pin && sec.pin.length > 0));
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadSettings();
  }, []);

  const handleSaveStoreProfile = async (e) => {
    e.preventDefault();
    await putRecord('settings', { key: 'store_profile', value: storeProfile });
    showToast('Showroom contact details saved', 'success');
  };

  const handleSaveAutoWishConfig = async (e) => {
    e.preventDefault();
    await putRecord('settings', { key: 'auto_wishes_config', ...autoWishConfig });
    showToast('Automated SMS wish configurations saved', 'success');
  };

  const handleRunManualWishScan = async () => {
    try {
      setScanLoading(true);
      const customers = await getAllCustomers();
      const res = await autoQueueTodaysCelebrationWishes(customers, true);
      showToast(`Scan complete: Queued ${res.queuedCount} celebration wishes to SMS Gateway!`, 'success');
      const lastScan = await getRecord('settings', 'last_auto_wish_scan');
      setLastAutoWishScan(lastScan);
      triggerRefresh();
    } catch (e) {
      showToast('Scan failed', 'error');
    } finally {
      setScanLoading(false);
    }
  };

  const handleSaveSecurity = async (e) => {
    e.preventDefault();
    setSecuritySuccessMsg('');

    if (pinEnabled) {
      if (newPin) {
        if (newPin.length < 4) {
          showToast('Security PIN must be at least 4 digits', 'warning');
          return;
        }
        if (newPin !== confirmPin) {
          showToast('PIN entries do not match', 'warning');
          return;
        }
      }
    }

    const existingSec = await getRecord('settings', 'pin_security');
    const finalPin = newPin || (existingSec && existingSec.pin) || '1234';

    const payload = {
      key: 'pin_security',
      enabled: pinEnabled,
      pin: finalPin
    };

    await putRecord('settings', payload);
    setPinProtectionEnabled(pinEnabled);
    setSavedPinExists(pinEnabled);
    setNewPin('');
    setConfirmPin('');
    setSecuritySuccessMsg(pinEnabled ? '✅ PIN Security is active (Master PIN updated)' : 'PIN Protection Disabled');
    showToast(pinEnabled ? 'Security PIN successfully updated and active!' : 'Security PIN protection disabled.', 'success');
    triggerRefresh();
  };

  const handleExportBackup = async () => {
    try {
      await exportDatabaseBackup();
      showToast('Database backup downloaded successfully', 'success');
    } catch (err) {
      showToast('Backup export failed', 'error');
    }
  };

  const handleImportBackup = async (e) => {
    e.preventDefault();
    if (!restoreFile) {
      showToast('Please select a valid CRM JSON backup file', 'warning');
      return;
    }

    openConfirm(
      'Restore Database Backup',
      'Restoring a backup will merge and update existing CRM data. Do you wish to continue?',
      async () => {
        try {
          const text = await restoreFile.text();
          await restoreDatabaseBackup(text);
          showToast('Database successfully restored from backup file!', 'success');
          triggerRefresh();
        } catch (err) {
          showToast(`Restore failed: ${err.message}`, 'error');
        }
      }
    );
  };

  const handleReset = () => {
    openConfirm(
      'Factory Reset CRM Database',
      'WARNING: This will permanently erase ALL customers, bills, follow-ups, and messages from this browser. This cannot be undone!',
      async () => {
        await resetAllData();
        showToast('All CRM database stores have been reset.', 'info');
        triggerRefresh();
      }
    );
  };

  return (
    <div>
      {/* Header Banner */}
      <div className="card-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: '1.5rem' }}>
            <Settings size={22} color="var(--color-gold)" /> System Configurations & Settings
          </h2>
          <p className="card-subtitle">{t('settings_sub')}</p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={lockApp}
          style={{ borderColor: 'var(--color-gold)', color: 'var(--color-gold)' }}
          title="Lock Console Screen"
        >
          <Lock size={15} /> Lock System Console
        </button>
      </div>

      {/* Modern Luxury Tabs Navigation */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color-subtle)', paddingBottom: '12px' }}>
        <button
          className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('profile')}
        >
          <Building2 size={16} /> Showroom Profile & License
        </button>

        <button
          className={`btn ${activeTab === 'security' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('security')}
        >
          <ShieldCheck size={16} /> Master PIN & Security
        </button>

        <button
          className={`btn ${activeTab === 'sms' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('sms')}
        >
          <Sparkles size={16} /> Automated Daily SMS Gateway
        </button>

        <button
          className={`btn ${activeTab === 'backup' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('backup')}
        >
          <FileSpreadsheet size={16} /> Data Backup & Factory Reset
        </button>
      </div>

      {/* TAB 1: SHOWROOM PROFILE & LICENSE */}
      {activeTab === 'profile' && (
        <div style={{ maxWidth: '800px' }}>
          <div className="card" style={{ borderColor: 'var(--color-gold)' }}>
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <h3 className="card-title">
                <Store size={18} color="var(--color-gold)" /> Registered Business License
              </h3>
              <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>
                🔒 Verified & Protected
              </span>
            </div>

            <div style={{ background: 'var(--color-gold-dim)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: '14px 16px', marginBottom: '20px', fontSize: '0.85rem' }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-gold)', fontSize: '0.92rem', marginBottom: '4px' }}>
                <ShieldCheck size={18} /> Exclusive Client License: Karajgikar Jewellers, Solapur
              </strong>
              <p style={{ color: 'var(--color-cream)', fontSize: '0.82rem', lineHeight: '1.4' }}>
                This software installation is permanently licensed and custom-built for <strong>Karajgikar Jewellers</strong>. Core brand credentials and showroom location are permanently locked to ensure software authenticity.
              </p>
            </div>

            <form onSubmit={handleSaveStoreProfile}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={13} color="var(--color-gold)" /> Permanent Showroom Brand Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={storeProfile.shopName}
                  readOnly
                  disabled
                  style={{ background: 'var(--bg-secondary)', color: 'var(--color-gold)', fontWeight: 700, cursor: 'not-allowed', fontSize: '1rem' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={13} color="var(--color-gold)" /> Heritage Tagline
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={storeProfile.tagline}
                  readOnly
                  disabled
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={13} color="var(--color-gold)" /> Showroom Physical Address
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={storeProfile.address}
                  readOnly
                  disabled
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-row" style={{ marginBottom: '20px' }}>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label">Contact Phone / Support Mobile</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={storeProfile.phone}
                    onChange={(e) => setStoreProfile({ ...storeProfile, phone: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label">GSTIN Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={storeProfile.gstin}
                    onChange={(e) => setStoreProfile({ ...storeProfile, gstin: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ minWidth: '180px' }}>
                <Check size={16} /> Save Showroom Contact Details
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER PIN & SECURITY */}
      {activeTab === 'security' && (
        <div style={{ maxWidth: '700px' }}>
          <div className="card" style={{ borderColor: pinEnabled ? 'var(--color-gold)' : 'var(--border-color-subtle)' }}>
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <h3 className="card-title">
                <Shield size={18} color="var(--color-gold)" /> Console Security PIN Protection
              </h3>
              {pinEnabled && (
                <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                  <ShieldCheck size={13} style={{ display: 'inline', marginRight: '4px' }} /> Active Protection
                </span>
              )}
            </div>

            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: '1.5' }}>
              Protects the CRM with a master 4-digit PIN. When enabled, the terminal prompts for the PIN on startup or whenever clicking the <strong>Lock</strong> button.
            </p>

            <form onSubmit={handleSaveSecurity}>
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-sm)',
                  padding: '14px 16px',
                  marginBottom: '20px'
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={pinEnabled}
                    onChange={(e) => setPinEnabled(e.target.checked)}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--color-gold)' }}
                  />
                  <div>
                    <strong style={{ color: 'var(--color-cream)', fontSize: '0.95rem', display: 'block' }}>
                      Require Master Security PIN on Console Launch
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Prevents unauthorized staff or walk-ins from browsing customer contact ledgers.
                    </span>
                  </div>
                </label>
              </div>

              {pinEnabled && (
                <div style={{ background: 'var(--bg-card)', padding: '16px', border: '1px solid var(--border-color-subtle)', borderRadius: 'var(--border-radius-sm)', marginBottom: '18px' }}>
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label">
                      {savedPinExists ? 'Change / Update Master Security PIN' : 'Set Master Security PIN (4 digits)'}
                    </label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Enter 4-digit PIN (e.g. 1234)"
                      maxLength={10}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label">Confirm New PIN</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Confirm 4-digit PIN"
                      maxLength={10}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {securitySuccessMsg && (
                <div style={{ background: 'var(--color-success-bg)', border: '1px solid var(--color-success)', color: 'var(--color-success)', padding: '10px 14px', borderRadius: 'var(--border-radius-sm)', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 600 }}>
                  {securitySuccessMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} /> Save Security PIN Preferences
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={lockApp}
                >
                  <Lock size={15} /> Lock Terminal Screen Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: AUTOMATED DAILY SMS GATEWAY */}
      {activeTab === 'sms' && (
        <div style={{ maxWidth: '900px' }}>
          <div className="card" style={{ borderColor: 'var(--color-gold)' }}>
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <div>
                <h3 className="card-title" style={{ color: 'var(--color-gold)' }}>
                  <Sparkles size={18} /> Automated Daily Birthday & Anniversary SMS Gateway
                </h3>
                <p className="card-subtitle">
                  Automatically deposits daily greetings into IndexedDB (<code>KarajgikarJewellersCRM</code> &rarr; <code>messages</code> store with <code>status: 'PENDING'</code>) for your SMS gateway script.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleRunManualWishScan}
                disabled={scanLoading}
              >
                <Send size={14} /> {scanLoading ? 'Scanning...' : 'Scan & Queue Today\'s Wishes Now'}
              </button>
            </div>

            {lastAutoWishScan && (
              <div style={{ background: 'var(--color-gold-dim)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: '10px 14px', marginBottom: '18px', fontSize: '0.85rem', color: 'var(--color-gold)' }}>
                🕒 Last Automated Scan: <strong>{new Date(lastAutoWishScan.timestamp).toLocaleString()}</strong> • Queued <strong>{lastAutoWishScan.queuedCount || 0}</strong> messages.
              </div>
            )}

            <form onSubmit={handleSaveAutoWishConfig}>
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={autoWishConfig.enabled}
                    onChange={(e) => setAutoWishConfig({ ...autoWishConfig, enabled: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--color-gold)' }}
                  />
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Enable Automated Daily SMS Greeting Queue</span>
                </label>
              </div>

              <div className="form-row" style={{ marginBottom: '18px' }}>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label required">Automated Birthday SMS Template</label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: '95px' }}
                    value={autoWishConfig.birthdayTemplate}
                    onChange={(e) => setAutoWishConfig({ ...autoWishConfig, birthdayTemplate: e.target.value })}
                    required
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Tags: <code>{`{customer_name}`}</code>, <code>{`{shop_name}`}</code>
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label required">Automated Anniversary SMS Template</label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: '95px' }}
                    value={autoWishConfig.anniversaryTemplate}
                    onChange={(e) => setAutoWishConfig({ ...autoWishConfig, anniversaryTemplate: e.target.value })}
                    required
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Tags: <code>{`{customer_name}`}</code>, <code>{`{shop_name}`}</code>
                  </span>
                </div>
              </div>

              {/* Developer Gateway Integration Details Box for the friend */}
              <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color-subtle)', borderRadius: 'var(--border-radius-sm)', padding: '14px 16px', marginBottom: '18px', fontSize: '0.84rem' }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-gold)', marginBottom: '6px' }}>
                  <Terminal size={15} /> SMS Gateway Script Developer Reference:
                </strong>
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  Database: <strong style={{ color: 'var(--text-main)' }}>KarajgikarJewellersCRM</strong> &bull; Store: <strong style={{ color: 'var(--text-main)' }}>messages</strong> (Index: <code>status</code> &rarr; query <code>'PENDING'</code>)<br />
                  Lifecycle: Read PENDING &rarr; Send via SMS Gateway &rarr; Update record with <code>status: 'SENT'</code> and <code>sentAt: new Date().toISOString()</code>.
                </div>
              </div>

              <button type="submit" className="btn btn-primary">
                <Check size={16} /> Save Automated Wishes Configuration
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: DATA BACKUP & FACTORY RESET */}
      {activeTab === 'backup' && (
        <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Backup Card */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <h3 className="card-title">
                <Download size={18} color="var(--color-gold)" /> Full Data Backup & Restore
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                Download a complete offline JSON copy of all customer details, purchase ledgers, and templates to your local hard drive.
              </p>

              <div>
                <button className="btn btn-secondary" onClick={handleExportBackup}>
                  <Download size={16} /> Export Complete CRM Backup (.json)
                </button>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color-subtle)', paddingTop: '16px', marginTop: '4px' }}>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block', fontWeight: 600 }}>
                  Restore From Backup File:
                </label>
                <input
                  type="file"
                  accept=".json"
                  className="form-input"
                  onChange={(e) => setRestoreFile(e.target.files[0])}
                  style={{ padding: '6px', maxWidth: '380px' }}
                />

                <button
                  className="btn btn-secondary"
                  onClick={handleImportBackup}
                  style={{ marginTop: '12px' }}
                  disabled={!restoreFile}
                >
                  <Upload size={16} /> Import & Restore Data
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone: Factory Reset */}
          <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>
            <div className="card-header" style={{ marginBottom: '14px' }}>
              <h3 className="card-title" style={{ color: 'var(--color-danger)' }}>
                <AlertTriangle size={18} /> Danger Zone: Factory Reset
              </h3>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Erase all local IndexedDB records and reset the application to a clean slate.
            </p>

            <button className="btn btn-danger" onClick={handleReset} style={{ maxWidth: '240px' }}>
              <RotateCcw size={16} /> Reset All CRM Database
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
