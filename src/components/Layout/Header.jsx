import React from 'react';
import { useCRM } from '../../context/CRMContext.jsx';
import { Sun, Moon, Plus, Menu, Globe, ShoppingBag, Lock } from 'lucide-react';

export default function Header() {
  const {
    theme,
    toggleTheme,
    language,
    setLanguage,
    t,
    setMobileMenuOpen,
    setQuickAddCustomerOpen,
    openRecordPurchaseModal,
    lockApp,
    pinProtectionEnabled
  } = useCRM();

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="btn btn-secondary btn-icon mobile-menu-trigger"
          onClick={() => setMobileMenuOpen(prev => !prev)}
          style={{ display: 'none' }}
        >
          <Menu size={18} />
        </button>

        <div className="header-shop-info">
          <h1 className="header-shop-title">Karajgikar Jewellers</h1>
          <span className="header-shop-address">274, Purv Mangalwar Peth, Saraf Katta, Solapur</span>
        </div>
      </div>

      <div className="header-actions">
        {/* Multi-language Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Globe size={16} color="var(--color-gold)" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="form-select"
            style={{ padding: '6px 10px', fontSize: '0.82rem', width: 'auto', fontWeight: 600 }}
          >
            <option value="en">English</option>
            <option value="mr">मराठी</option>
            <option value="hi">हिंदी</option>
          </select>
        </div>

        {/* Theme Toggle Button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={toggleTheme}
          title="Toggle Light / Dark Mode"
        >
          {theme === 'dark' ? <Sun size={15} color="var(--color-gold)" /> : <Moon size={15} />}
          <span style={{ fontSize: '0.82rem' }}>
            {theme === 'dark' ? t('theme_light') : t('theme_dark')}
          </span>
        </button>

        {/* Lock Terminal Button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={lockApp}
          title="Lock Terminal & Protect Business Details"
          style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--text-main)' }}
        >
          <Lock size={14} color="var(--color-gold)" />
          <span style={{ fontSize: '0.82rem' }}>Lock</span>
        </button>

        {/* Quick Add Purchase */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => openRecordPurchaseModal(null)}
          style={{ borderColor: 'var(--color-gold)', color: 'var(--color-gold)' }}
          title="Record New Jewelry Purchase"
        >
          <ShoppingBag size={15} />
          <span>+ Purchase</span>
        </button>

        {/* Quick Add Customer */}
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setQuickAddCustomerOpen(true)}
        >
          <Plus size={15} />
          <span>{t('quick_add')}</span>
        </button>
      </div>
    </header>
  );
}
