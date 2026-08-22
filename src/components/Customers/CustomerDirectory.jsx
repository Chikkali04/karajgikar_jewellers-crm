/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - CUSTOMER DIRECTORY (CustomerDirectory.jsx)
   Ascending Sequential Customer IDs, VIP Tracking & Direct WhatsApp CRM
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext.jsx';
import { getAllCustomers, removeCustomer, exportCustomersToCSV } from '../../services/customerService.js';
import {
  Users,
  Search,
  Plus,
  Download,
  Eye,
  Edit2,
  Trash2,
  Phone,
  MessageCircle,
  IndianRupee,
  Crown,
  ShoppingBag,
  Sparkles,
  ArrowUpDown,
  Filter
} from 'lucide-react';

export default function CustomerDirectory() {
  const {
    t,
    refreshKey,
    triggerRefresh,
    setQuickAddCustomerOpen,
    openRecordPurchaseModal,
    setActiveCustomerProfileId,
    openConfirm,
    showToast
  } = useCRM();

  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedTier, setSelectedTier] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('id-asc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCustomers() {
      try {
        setLoading(true);
        const data = await getAllCustomers();
        setCustomers(data);
      } catch (err) {
        console.error('Error fetching customers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCustomers();
  }, [refreshKey]);

  // Unique Cities list
  const cities = Array.from(new Set(customers.map(c => c.city).filter(Boolean)));

  // Calculate Total Purchases Till Now (Showroom Revenue from registered customers)
  const totalPurchasesTillNow = customers.reduce((sum, c) => sum + Number(c.totalSpent || 0), 0);
  const totalDiamondVIPs = customers.filter(c => c.tier === 'DIAMOND').length;
  const totalGoldVIPs = customers.filter(c => c.tier === 'GOLD').length;

  // Filtered and sorted customers
  const filteredCustomers = customers
    .filter(c => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        (c.name || '').toLowerCase().includes(q) ||
        (c.mobile && c.mobile.includes(q)) ||
        (c.id && c.id.toLowerCase().includes(q)) ||
        (c.city && (c.city || '').toLowerCase().includes(q)) ||
        (c.village && (c.village || '').toLowerCase().includes(q));

      const matchesCity = selectedCity === 'ALL' || c.city === selectedCity;
      const matchesTier = selectedTier === 'ALL' || c.tier === selectedTier;
      const matchesCategory = selectedCategory === 'ALL' || (c.category || 'Regular') === selectedCategory;

      return matchesSearch && matchesCity && matchesTier && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'id-asc') return (a.id || '').localeCompare(b.id || '', undefined, { numeric: true });
      if (sortBy === 'id-desc') return (b.id || '').localeCompare(a.id || '', undefined, { numeric: true });
      if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'spend-desc') return Number(b.totalSpent || 0) - Number(a.totalSpent || 0);
      return (a.id || '').localeCompare(b.id || '', undefined, { numeric: true });
    });

  const handleDelete = (customer) => {
    openConfirm(
      'Delete Customer Record',
      `Are you sure you want to permanently delete "${customer.name}"? This action cannot be undone.`,
      async () => {
        setCustomers(prev => prev.filter(c => c.id !== customer.id));
        await removeCustomer(customer.id);
        showToast('Customer record deleted permanently', 'success');
        triggerRefresh();
      }
    );
  };

  return (
    <div>
      {/* Header Banner */}
      <div className="card-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: '1.5rem' }}>
            <Users size={22} color="var(--color-gold)" /> {t('cust_title')}
          </h2>
          <p className="card-subtitle">{t('cust_sub')}</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => exportCustomersToCSV(filteredCustomers)}
            title="Download Customer List CSV"
          >
            <Download size={15} /> {t('export_csv')}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => openRecordPurchaseModal(null)}
            style={{ borderColor: 'var(--color-gold)', color: 'var(--color-gold)' }}
          >
            <ShoppingBag size={15} /> + Record Purchase
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setQuickAddCustomerOpen(true)}
          >
            <Plus size={15} /> {t('action_add_customer')}
          </button>
        </div>
      </div>

      {/* Top 3 KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gold)' }}>
            <Users size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Customers</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-cream)', marginTop: '2px' }}>
              {customers.length}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderColor: 'var(--color-gold)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(212, 175, 55, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gold)' }}>
            <IndianRupee size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Total Purchases Till Now</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-gold)', fontFamily: 'var(--font-serif)', marginTop: '2px' }}>
              ₹{totalPurchasesTillNow.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8' }}>
            <Crown size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>VIP Relationships</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-cream)', marginTop: '2px' }}>
              {totalDiamondVIPs} Diamond <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>• {totalGoldVIPs} Gold</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder={t('search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Sort By Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowUpDown size={14} color="var(--color-gold)" />
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '170px', fontSize: '0.84rem' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="id-asc">Customer ID (00101 &uarr;)</option>
              <option value="id-desc">Customer ID (Newest First)</option>
              <option value="name-asc">Customer Name (A-Z)</option>
              <option value="spend-desc">Purchases (High to Low)</option>
            </select>
          </div>

          {/* Category Filter */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '140px', fontSize: '0.84rem' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="New">✨ New Walk-ins</option>
            <option value="Regular">⭐ Regular</option>
            <option value="VIP">💎 VIP Clients</option>
            <option value="Inactive">💤 Inactive</option>
          </select>

          {/* City Filter */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '140px', fontSize: '0.84rem' }}
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            <option value="ALL">All Cities ({cities.length})</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          {/* VIP Tier Filter */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '140px', fontSize: '0.84rem' }}
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
          >
            <option value="ALL">All Tiers</option>
            <option value="DIAMOND">💎 Diamond (₹5L+)</option>
            <option value="GOLD">🪙 Gold (₹1.5L+)</option>
            <option value="SILVER">🥈 Silver Tier</option>
          </select>
        </div>
      </div>

      {/* Customer Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Name / Native</th>
                <th>Category</th>
                <th>Contact</th>
                <th>City</th>
                <th>VIP Status</th>
                <th>Total Purchases</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>
                    Loading customer records...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No matching customers found. Click "+ Register Customer" to add.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(cust => (
                  <tr key={cust.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--color-gold)', fontWeight: 600 }}>
                      {cust.id}
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {cust.photoUrl ? (
                          <img src={cust.photoUrl} alt={cust.name} className="customer-avatar-sm" />
                        ) : (
                          <div className="customer-avatar-sm">
                            {cust.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span
                            style={{ fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}
                            onClick={() => setActiveCustomerProfileId(cust.id)}
                          >
                            {cust.name}
                          </span>
                          {cust.village && (
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Native: {cust.village}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`badge ${cust.category === 'VIP' ? 'badge-gold' : cust.category === 'New' ? 'badge-info' : cust.category === 'Inactive' ? 'badge-danger' : 'badge-success'}`}
                        style={{ fontSize: '0.72rem' }}
                      >
                        {cust.category === 'VIP' ? '💎 VIP' : cust.category === 'New' ? '✨ New' : cust.category === 'Inactive' ? '💤 Inactive' : '⭐ Regular'}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontSize: '0.85rem' }}>{cust.mobile || '-'}</span>
                    </td>

                    <td>
                      <span style={{ fontSize: '0.85rem' }}>{cust.city || 'Solapur'}</span>
                    </td>

                    <td>
                      <span className={`badge ${cust.tier === 'DIAMOND' ? 'tier-diamond' : cust.tier === 'GOLD' ? 'tier-gold' : 'tier-silver'}`}>
                        {cust.tier === 'DIAMOND' && '💎 Diamond'}
                        {cust.tier === 'GOLD' && '🥇 Gold'}
                        {cust.tier === 'SILVER' && '🥈 Silver'}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--color-cream)', fontSize: '0.94rem' }}>
                        ₹{Number(cust.totalSpent || 0).toLocaleString('en-IN')}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {/* WhatsApp Action */}
                        {cust.mobile && (
                          <a
                            href={`https://wa.me/91${cust.mobile.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-success btn-sm btn-icon"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle size={14} />
                          </a>
                        )}

                        {/* + Record Purchase for this Customer */}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openRecordPurchaseModal(cust.id)}
                          title="Record Purchase for Customer"
                          style={{ borderColor: 'var(--color-gold)', color: 'var(--color-gold)', padding: '4px 8px', fontSize: '0.78rem' }}
                        >
                          <ShoppingBag size={13} /> + Purchase
                        </button>

                        {/* View 360° Profile */}
                        <button
                          className="btn btn-secondary btn-sm btn-icon"
                          onClick={() => setActiveCustomerProfileId(cust.id)}
                          title="View 360° Profile"
                        >
                          <Eye size={14} />
                        </button>

                        {/* Delete Customer */}
                        <button
                          className="btn btn-secondary btn-sm btn-icon"
                          style={{ color: 'var(--color-danger)' }}
                          onClick={() => handleDelete(cust)}
                          title="Delete Customer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
