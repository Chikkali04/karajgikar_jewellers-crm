/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - SIDEBAR NAVIGATION (Sidebar.jsx)
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext.jsx';
import { getAllMessages } from '../../services/campaignService.js';
import {
  LayoutDashboard,
  Users,
  Clock,
  Cake,
  Sparkles,
  UserX,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Sidebar() {
  const {
    activeView,
    setActiveView,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileMenuOpen,
    setMobileMenuOpen,
    refreshKey,
    t
  } = useCRM();

  const [pendingMsgCount, setPendingMsgCount] = useState(0);

  useEffect(() => {
    async function loadPending() {
      try {
        const msgs = await getAllMessages();
        const pending = (msgs || []).filter(m => m.status === 'PENDING').length;
        setPendingMsgCount(pending);
      } catch (e) {
        // ignore
      }
    }
    loadPending();
  }, [refreshKey]);

  const menuItems = [
    { id: 'dashboard', label: t('nav_dashboard'), icon: LayoutDashboard },
    { id: 'customers', label: t('nav_customers'), icon: Users },
    { id: 'followups', label: t('nav_followups'), icon: Clock },
    { id: 'birthdays', label: t('nav_birthdays'), icon: Cake },
    { id: 'festivals', label: t('nav_festivals'), icon: Sparkles },
    { id: 'inactive', label: t('nav_inactive'), icon: UserX },
    { id: 'messages', label: t('nav_messages'), icon: MessageSquare, badge: pendingMsgCount },
    { id: 'settings', label: t('nav_settings'), icon: Settings },
  ];

  const handleNavClick = (viewId) => {
    setActiveView(viewId);
    setMobileMenuOpen(false);
  };

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <img src="assets/logo.svg" alt="Karajgikar Jewellers" className="sidebar-logo-img" />
        {!sidebarCollapsed && (
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-title">{t('brand_name')}</span>
            <span className="sidebar-brand-sub">{t('brand_sub')}</span>
            <span className="sidebar-brand-tagline">{t('brand_tagline')}</span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <ul className="sidebar-menu">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <li
              key={item.id}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
              title={sidebarCollapsed ? item.label : undefined}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon size={20} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </div>
              {!sidebarCollapsed && item.badge > 0 && (
                <span
                  style={{
                    background: 'var(--color-gold)',
                    color: 'var(--text-dark)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '10px'
                  }}
                >
                  {item.badge}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {/* Sidebar Footer with Collapse Button */}
      <div className="sidebar-footer">
        <button
          className="sidebar-toggle-btn"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}
