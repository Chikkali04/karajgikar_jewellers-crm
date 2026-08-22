/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - PURCHASES LIST (PurchasesList.jsx)
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext.jsx';
import { getAllPurchases, removePurchase } from '../../services/purchaseService.js';
import {
  ShoppingBag,
  Search,
  Plus,
  Receipt,
  Trash2,
  Calendar,
  CreditCard,
  Eye
} from 'lucide-react';

export default function PurchasesList() {
  const {
    t,
    refreshKey,
    triggerRefresh,
    setQuickAddPurchaseOpen,
    setActiveInvoicePurchase,
    setActiveCustomerProfileId,
    openConfirm,
    showToast
  } = useCRM();

  const [purchases, setPurchases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPurchases() {
      try {
        setLoading(true);
        const data = await getAllPurchases();
        setPurchases(data);
      } catch (err) {
        console.error('Error fetching purchases:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPurchases();
  }, [refreshKey]);

  const filteredPurchases = purchases.filter(p => {
    const matchesSearch =
      (p.invoiceNo && p.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.customerName && p.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.items && p.items.some(i => (i.name || '').toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesMode = selectedPaymentMode === 'ALL' || p.paymentMode === selectedPaymentMode;
    return matchesSearch && matchesMode;
  });

  const handleDelete = (purchase) => {
    openConfirm(
      'Delete Purchase Bill',
      `Are you sure you want to delete invoice "${purchase.invoiceNo || purchase.id}"? This will also update customer lifetime spend statistics.`,
      async () => {
        await removePurchase(purchase.id);
        showToast('Purchase invoice deleted', 'success');
        triggerRefresh();
      }
    );
  };

  const totalRevenue = filteredPurchases.reduce((sum, p) => sum + Number(p.netTotal || 0), 0);

  return (
    <div>
      {/* Header Banner */}
      <div className="card-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: '1.5rem' }}>
            <ShoppingBag size={22} color="var(--color-gold)" /> Jewelry Purchase Records
          </h2>
          <p className="card-subtitle">Manage showroom sales invoices, billing, and tax calculations.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setQuickAddPurchaseOpen(true)}>
          <Plus size={15} /> + Record New Sale
        </button>
      </div>

      {/* Revenue Summary Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-md)',
          padding: '18px 24px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <div>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Filtered Sales Turnover</span>
          <h3 style={{ fontSize: '1.75rem', color: 'var(--color-gold)', fontFamily: 'var(--font-serif)', marginTop: '2px' }}>
            ₹{totalRevenue.toLocaleString('en-IN')}
          </h3>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Total Invoices: <strong style={{ color: 'var(--color-cream)' }}>{filteredPurchases.length}</strong>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Search by invoice no, customer name, jewelry item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '160px' }}
            value={selectedPaymentMode}
            onChange={(e) => setSelectedPaymentMode(e.target.value)}
          >
            <option value="ALL">All Payment Modes</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI (GooglePay / PhonePe)</option>
            <option value="CARD">Card (Debit/Credit)</option>
            <option value="CHEQUE">Cheque / RTGS</option>
            <option value="GOLD_EXCHANGE">Old Gold Exchange</option>
          </select>
        </div>
      </div>

      {/* Purchases Data Table */}
      <div className="card" style={{ padding: '0' }}>
        <div className="table-container">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Customer Name</th>
                <th>Date</th>
                <th>Jewelry Items</th>
                <th>Mode</th>
                <th>Taxable</th>
                <th>Net Total</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No purchase records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-gold)' }}>
                      {p.invoiceNo || p.id}
                    </td>

                    <td>
                      <div
                        style={{ fontWeight: 600, color: 'var(--text-main)', cursor: p.customerId ? 'pointer' : 'default' }}
                        onClick={() => p.customerId && setActiveCustomerProfileId(p.customerId)}
                      >
                        {p.customerName || 'Walk-in Customer'}
                      </div>
                      {p.customerMobile && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.customerMobile}</div>
                      )}
                    </td>

                    <td>{p.purchaseDate}</td>

                    <td>
                      {p.items && p.items.length > 0 ? (
                        <div style={{ fontSize: '0.84rem' }}>
                          {p.items.map((it, idx) => (
                            <span key={idx}>
                              {it.name || it.category} ({it.netWeight || it.grossWeight}g)
                              {idx < p.items.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>

                    <td>
                      <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>
                        {p.paymentMode || 'CASH'}
                      </span>
                    </td>

                    <td style={{ color: 'var(--text-secondary)' }}>
                      ₹{Number(p.taxableAmount || p.subtotal || 0).toLocaleString('en-IN')}
                    </td>

                    <td style={{ fontWeight: 700, color: 'var(--color-cream)', fontSize: '0.95rem' }}>
                      ₹{Number(p.netTotal || 0).toLocaleString('en-IN')}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setActiveInvoicePurchase(p)}
                          title="View / Print Tax Invoice"
                        >
                          <Receipt size={13} /> Bill
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--color-danger)' }}
                          onClick={() => handleDelete(p)}
                          title="Delete Bill"
                        >
                          <Trash2 size={13} />
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
