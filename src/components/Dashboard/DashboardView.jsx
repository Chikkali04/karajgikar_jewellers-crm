/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - DASHBOARD VIEW (DashboardView.jsx)
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext.jsx';
import { getAllCustomers } from '../../services/customerService.js';
import { getAllPurchases } from '../../services/purchaseService.js';
import { getTodaysFollowUps, markFollowUpStatus } from '../../services/followUpService.js';
import { getUpcomingCelebrations, openWhatsAppWish } from '../../services/autoWishService.js';
import {
  Users,
  ShoppingBag,
  Clock,
  Cake,
  UserPlus,
  Receipt,
  CalendarPlus,
  CheckCircle,
  Phone,
  MessageCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function DashboardView() {
  const {
    t,
    refreshKey,
    triggerRefresh,
    setQuickAddCustomerOpen,
    openRecordPurchaseModal,
    setActiveView,
    setActiveCustomerProfileId,
    setActiveInvoicePurchase,
    showToast
  } = useCRM();

  const [stats, setStats] = useState({
    customersCount: 0,
    purchasesCount: 0,
    followUpsCount: 0,
    wishesCount: 0
  });

  const [todaysFollowUps, setTodaysFollowUps] = useState([]);
  const [upcomingCelebrations, setUpcomingCelebrations] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const customers = await getAllCustomers();
        const purchases = await getAllPurchases();
        const followUps = await getTodaysFollowUps();
        const celebrations = getUpcomingCelebrations(customers, 7);

        setStats({
          customersCount: customers.length,
          purchasesCount: purchases.length,
          followUpsCount: followUps.length,
          wishesCount: celebrations.length
        });

        setTodaysFollowUps(followUps);
        setUpcomingCelebrations(celebrations);
        setRecentPurchases(purchases.slice(0, 5));
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [refreshKey]);

  const handleCompleteFollowUp = async (id) => {
    await markFollowUpStatus(id, 'COMPLETED');
    showToast('Follow-up marked as completed!', 'success');
    triggerRefresh();
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{ marginBottom: '24px' }}>
        <h2 className="card-title" style={{ fontSize: '1.6rem', color: 'var(--color-cream)' }}>
          {t('dash_title')}
        </h2>
        <p className="card-subtitle" style={{ fontSize: '0.9rem' }}>
          {t('dash_subtitle')}
        </p>
      </div>

      {/* 4 Metric Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => setActiveView('customers')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">
            <Users size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">{t('stat_customers')}</span>
            <span className="stat-value">{stats.customersCount}</span>
            <span className="stat-sub">{t('stat_sub_customers')}</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => setActiveView('customers')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">
            <ShoppingBag size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">{t('stat_purchases')}</span>
            <span className="stat-value">{stats.purchasesCount}</span>
            <span className="stat-sub">{t('stat_sub_purchases')}</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => setActiveView('followups')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">
            <Clock size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">{t('stat_followups')}</span>
            <span className="stat-value">{stats.followUpsCount}</span>
            <span className="stat-sub">{t('stat_sub_followups')}</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => setActiveView('birthdays')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">
            <Cake size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">{t('stat_wishes')}</span>
            <span className="stat-value">{stats.wishesCount}</span>
            <span className="stat-sub">{t('stat_sub_wishes')}</span>
          </div>
        </div>
      </div>

      {/* Quick Relationship Actions */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="card-header" style={{ marginBottom: '16px' }}>
          <h3 className="card-title">
            <Sparkles size={18} color="var(--color-gold)" /> {t('dash_quick_actions')}
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => setQuickAddCustomerOpen(true)}>
            <UserPlus size={16} /> {t('action_add_customer')}
          </button>
          <button className="btn btn-secondary" onClick={() => openRecordPurchaseModal(null)}>
            <Receipt size={16} /> {t('action_add_purchase')}
          </button>
          <button className="btn btn-secondary" onClick={() => setActiveView('followups')}>
            <CalendarPlus size={16} /> {t('action_add_followup')}
          </button>
        </div>
      </div>

      {/* Grid: Today's Actions & Upcoming Wishes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        
        {/* Today's Follow-up Actions Table */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Clock size={18} color="var(--color-gold)" /> {t('todays_actions_title')}
              </h3>
              <p className="card-subtitle">{t('todays_actions_sub')}</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveView('followups')}>
              View All
            </button>
          </div>

          <div style={{ flex: 1 }}>
            {todaysFollowUps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                <CheckCircle size={36} color="var(--color-success)" style={{ margin: '0 auto 10px', display: 'block' }} />
                <strong>{t('no_actions_today')}</strong>
                <p style={{ fontSize: '0.82rem', marginTop: '4px' }}>{t('no_actions_sub')}</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Type / Purpose</th>
                      <th>Urgency</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todaysFollowUps.map(fu => (
                      <tr key={fu.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--color-gold)', cursor: 'pointer' }} onClick={() => fu.customerId && setActiveCustomerProfileId(fu.customerId)}>
                            {fu.customerName}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{fu.customerMobile}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.82rem' }}>{fu.purpose || fu.type}</span>
                        </td>
                        <td>
                          <span className={`badge ${fu.urgency === 'CRITICAL' || fu.urgency === 'HIGH' ? 'badge-danger' : 'badge-warning'}`}>
                            {fu.urgency}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {fu.customerMobile && (
                              <a href={`tel:${fu.customerMobile}`} className="btn btn-secondary btn-sm" title="Call">
                                <Phone size={13} />
                              </a>
                            )}
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleCompleteFollowUp(fu.id)}
                              title="Mark Completed"
                            >
                              <CheckCircle size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Celebrations Widget */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Cake size={18} color="var(--color-gold)" /> Upcoming Celebrations (7 Days)
              </h3>
              <p className="card-subtitle">Birthdays & Anniversaries due soon</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveView('birthdays')}>
              View All
            </button>
          </div>

          <div style={{ flex: 1 }}>
            {upcomingCelebrations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                <Sparkles size={36} color="var(--color-gold)" style={{ margin: '0 auto 10px', display: 'block' }} />
                <strong>No Celebrations In Next 7 Days</strong>
                <p style={{ fontSize: '0.82rem', marginTop: '4px' }}>All customer greetings are up to date.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {upcomingCelebrations.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 'var(--border-radius-sm)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {c.photoUrl ? (
                        <img src={c.photoUrl} alt={c.customerName} className="customer-avatar-sm" />
                      ) : (
                        <div className="customer-avatar-sm">
                          {c.customerName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {c.customerName}
                          <span className={`badge ${c.type === 'BIRTHDAY' ? 'badge-info' : 'badge-gold'}`} style={{ marginLeft: '8px' }}>
                            {c.type}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {c.isToday ? <strong style={{ color: 'var(--color-success)' }}>🎉 TODAY!</strong> : `In ${c.daysLeft} days (${c.eventDate})`}
                          {c.city && ` • ${c.city}`}
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => openWhatsAppWish(c)}
                      title="Send WhatsApp Greeting"
                    >
                      <MessageCircle size={14} /> Wish
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Recent Purchases Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <ShoppingBag size={18} color="var(--color-gold)" /> Recent Recorded Purchases
            </h3>
            <p className="card-subtitle">Latest customer purchases logged in the showroom</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setActiveView('customers')}>
            View Customer Directory <ArrowRight size={14} style={{ display: 'inline' }} />
          </button>
        </div>

        {recentPurchases.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
            No purchase records found yet. Click "+ Record Purchase" to log customer sales.
          </div>
        ) : (
          <div className="table-container">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Product / Description</th>
                  <th>Category</th>
                  <th>Amount (₹)</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentPurchases.map(p => {
                  const productTitle = p.productName || (p.items && p.items[0] ? p.items[0].name : '') || p.notes || 'Jewelry Purchase';
                  const categoryTitle = p.category || (p.items && p.items[0] ? p.items[0].category : 'Gold');
                  const amountVal = Number(p.amount || p.netTotal || p.totalAmount || 0);

                  return (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-gold)' }}>
                        {p.id}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {p.customerName || 'Customer'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {p.productImageUrl ? (
                            <img
                              src={p.productImageUrl}
                              alt={productTitle}
                              style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--color-gold)' }}
                            />
                          ) : null}
                          <span>{productTitle}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>
                          {categoryTitle}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--color-cream)', fontSize: '0.98rem' }}>
                        ₹{amountVal.toLocaleString('en-IN')}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{p.purchaseDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
