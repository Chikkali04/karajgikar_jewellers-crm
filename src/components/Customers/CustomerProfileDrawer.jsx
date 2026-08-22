/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - 360° CUSTOMER PROFILE DRAWER (CustomerProfileDrawer.jsx)
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext.jsx';
import { getCustomerById } from '../../services/customerService.js';
import { getPurchasesByCustomer, removePurchase } from '../../services/purchaseService.js';
import { getFollowUpsByCustomer } from '../../services/followUpService.js';
import {
  User,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  Clock,
  MessageCircle,
  Tag,
  Receipt,
  FileText,
  Plus,
  Trash2
} from 'lucide-react';

export default function CustomerProfileDrawer({ customerId, onClose }) {
  const { openRecordPurchaseModal, triggerRefresh } = useCRM();
  const [customer, setCustomer] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [activeTab, setActiveTab] = useState('purchases'); // purchases, followups, details
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCustomerData() {
      if (!customerId) return;
      try {
        setLoading(true);
        const cust = await getCustomerById(customerId);
        const pList = await getPurchasesByCustomer(customerId);
        const fList = await getFollowUpsByCustomer(customerId);

        setCustomer(cust);
        setPurchases(pList);
        setFollowUps(fList);
      } catch (err) {
        console.error('Error fetching customer profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCustomerData();
  }, [customerId]);

  if (!customerId) return null;

  const totalSpent = purchases.reduce((sum, p) => sum + Number(p.amount || p.netTotal || p.totalAmount || 0), 0);

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {customer?.photoUrl ? (
              <img src={customer.photoUrl} alt={customer.name} className="customer-avatar-lg" style={{ width: '52px', height: '52px' }} />
            ) : (
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'var(--color-gold-dim)',
                  color: 'var(--color-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-color)',
                  flexShrink: 0
                }}
              >
                <User size={26} />
              </div>
            )}
            <div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--color-cream)', lineHeight: '1.2' }}>
                {customer?.name || 'Customer Profile'}
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {customer?.id} • Registered {customer?.createdAt?.slice(0, 10) || '-'}
              </span>
            </div>
          </div>

          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Loading customer 360° profile...
            </div>
          ) : !customer ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-danger)' }}>
              Customer record not found.
            </div>
          ) : (
            <>
              {/* Quick Profile Summary Bar */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '16px',
                  marginBottom: '20px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  textAlign: 'center'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>VIP Status</span>
                  <strong style={{ color: 'var(--color-gold)', fontSize: '0.9rem' }}>
                    {totalSpent >= 500000 ? '💎 DIAMOND' : totalSpent >= 150000 ? '🪙 GOLD VIP' : '🥈 SILVER'}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Lifetime Spend</span>
                  <strong style={{ color: 'var(--color-cream)', fontSize: '1.05rem' }}>
                    ₹{totalSpent.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Purchases</span>
                  <strong style={{ color: 'var(--text-main)', fontSize: '1.05rem' }}>
                    {purchases.length} Bills
                  </strong>
                </div>
              </div>

              {/* Direct Actions */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {customer.mobile && (
                  <>
                    <a
                      href={`https://wa.me/91${customer.mobile.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-success"
                      style={{ flex: 1 }}
                    >
                      <MessageCircle size={15} /> WhatsApp
                    </a>
                    <a
                      href={`tel:${customer.mobile}`}
                      className="btn btn-secondary"
                      style={{ flex: 1 }}
                    >
                      <Phone size={15} /> Direct Call
                    </a>
                  </>
                )}
              </div>

              {/* Contact Information & Metadata */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '16px',
                  marginBottom: '20px',
                  border: '1px solid var(--border-color-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  fontSize: '0.86rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={14} color="var(--color-gold)" />
                  <span style={{ color: 'var(--text-muted)' }}>Mobile:</span>
                  <strong>{customer.mobile || '-'}</strong>
                </div>

                {customer.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={14} color="var(--color-gold)" />
                    <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                    <span>{customer.email}</span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={14} color="var(--color-gold)" />
                  <span style={{ color: 'var(--text-muted)' }}>Location:</span>
                  <span>{customer.city || 'Solapur'}{customer.village ? ` (Village: ${customer.village})` : ''}</span>
                </div>

                {customer.dateOfBirth && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={14} color="var(--color-gold)" />
                    <span style={{ color: 'var(--text-muted)' }}>Birthday:</span>
                    <span>{customer.dateOfBirth}</span>
                  </div>
                )}

                {customer.anniversaryDate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={14} color="var(--color-gold)" />
                    <span style={{ color: 'var(--text-muted)' }}>Anniversary:</span>
                    <span>{customer.anniversaryDate}</span>
                  </div>
                )}

                {customer.tags && customer.tags.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <Tag size={14} color="var(--color-gold)" />
                    <span style={{ color: 'var(--text-muted)' }}>Tags:</span>
                    {customer.tags.map((tag, i) => (
                      <span key={i} className="badge badge-gold" style={{ fontSize: '0.7rem' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {customer.notes && (
                  <div style={{ marginTop: '6px', padding: '10px', background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-sm)', borderLeft: '3px solid var(--color-gold)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Staff Notes:</span>
                    <p style={{ fontSize: '0.84rem', marginTop: '2px' }}>{customer.notes}</p>
                  </div>
                )}
              </div>

              {/* Tabs Navigation */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color-subtle)', marginBottom: '16px' }}>
                <button
                  className="btn"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'purchases' ? '2px solid var(--color-gold)' : 'none',
                    color: activeTab === 'purchases' ? 'var(--color-gold)' : 'var(--text-muted)',
                    borderRadius: 0,
                    padding: '8px 16px',
                    fontWeight: 600
                  }}
                  onClick={() => setActiveTab('purchases')}
                >
                  <ShoppingBag size={14} /> Purchases ({purchases.length})
                </button>

                <button
                  className="btn"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'followups' ? '2px solid var(--color-gold)' : 'none',
                    color: activeTab === 'followups' ? 'var(--color-gold)' : 'var(--text-muted)',
                    borderRadius: 0,
                    padding: '8px 16px',
                    fontWeight: 600
                  }}
                  onClick={() => setActiveTab('followups')}
                >
                  <Clock size={14} /> Follow-ups ({followUps.length})
                </button>
              </div>

              {/* Tab: Purchases History */}
              {activeTab === 'purchases' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                      Total Spend: <strong style={{ color: 'var(--color-gold)' }}>₹{totalSpent.toLocaleString('en-IN')}</strong> ({purchases.length} records)
                    </span>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => openRecordPurchaseModal(customer.id)}
                    >
                      <Plus size={13} /> + Record Purchase
                    </button>
                  </div>

                  {purchases.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: 'var(--border-radius-sm)', border: '1px dashed var(--border-color-subtle)' }}>
                      No purchase records found for this customer yet.<br />
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ marginTop: '10px' }}
                        onClick={() => openRecordPurchaseModal(customer.id)}
                      >
                        <Plus size={12} /> Record First Purchase
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {purchases.map(p => {
                        const productTitle = p.productName || (p.items && p.items[0] ? p.items[0].name : '') || p.notes || 'Jewelry Purchase';
                        const categoryTitle = p.category || (p.items && p.items[0] ? p.items[0].category : '');
                        const amountVal = Number(p.amount || p.netTotal || p.totalAmount || 0);

                        return (
                          <div
                            key={p.id}
                            style={{
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-color-subtle)',
                              borderRadius: 'var(--border-radius-sm)',
                              padding: '12px 14px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '12px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                              {p.productImageUrl ? (
                                <img
                                  src={p.productImageUrl}
                                  alt={productTitle}
                                  style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: 'var(--border-radius-sm)',
                                    objectFit: 'cover',
                                    border: '1px solid var(--color-gold)',
                                    flexShrink: 0
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: 'var(--border-radius-sm)',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color-subtle)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--color-gold)',
                                    fontSize: '1rem',
                                    flexShrink: 0
                                  }}
                                >
                                  💍
                                </div>
                              )}

                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-gold)', marginRight: '6px', fontSize: '0.8rem' }}>
                                    {p.id}
                                  </span>
                                  {productTitle}
                                  {categoryTitle && (
                                    <span className="badge badge-gold" style={{ marginLeft: '8px', fontSize: '0.7rem' }}>
                                      {categoryTitle}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                                  📅 {p.purchaseDate} {p.notes ? `• ${p.notes}` : ''}
                                </div>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <strong style={{ color: 'var(--color-gold)', fontSize: '1.05rem', fontFamily: 'var(--font-serif)' }}>
                                ₹{amountVal.toLocaleString('en-IN')}
                              </strong>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '4px 6px', color: 'var(--color-danger)' }}
                                title="Delete Purchase Record"
                                onClick={async () => {
                                  if (window.confirm(`Delete purchase record ${p.id}? This will decrease the customer's total spending.`)) {
                                    await removePurchase(p.id);
                                    setPurchases(prev => prev.filter(item => item.id !== p.id));
                                    triggerRefresh();
                                  }
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Follow-ups */}
              {activeTab === 'followups' && (
                <div>
                  {followUps.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No follow-up history found.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {followUps.map(f => (
                        <div
                          key={f.id}
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color-subtle)',
                            borderRadius: 'var(--border-radius-sm)',
                            padding: '12px 14px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <strong style={{ color: 'var(--text-main)', fontSize: '0.88rem' }}>{f.purpose || f.type}</strong>
                            <span className={`badge ${f.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                              {f.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Date: {f.followUpDate} • Urgency: {f.urgency}
                          </div>
                          {f.notes && (
                            <p style={{ fontSize: '0.8rem', marginTop: '6px', color: 'var(--text-secondary)' }}>
                              {f.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
