/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - LUXURY TAX INVOICE PRINT VIEW (InvoiceModal.jsx)
   ========================================================================== */

import React from 'react';
import { X, Printer, Download } from 'lucide-react';

export default function InvoiceModal({ purchase, onClose }) {
  if (!purchase) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()} style={{ background: '#FFFFFF', color: '#1A1A1A' }}>
        <div className="modal-header no-print" style={{ background: '#F8F5EE', borderBottom: '1px solid #E5DFD0' }}>
          <h3 className="modal-title" style={{ color: '#9B7812' }}>
            Tax Invoice Preview ({purchase.invoiceNo || purchase.id})
          </h3>
          <button className="btn btn-secondary btn-icon" onClick={onClose} style={{ color: '#1A1A1A', borderColor: '#CCC' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ background: '#FFFFFF', color: '#1A1A1A', padding: '32px' }}>
          <div className="invoice-paper">
            {/* Header / Brand */}
            <div className="invoice-header">
              <div>
                <h1 className="invoice-title">KARAJGIKAR JEWELLERS</h1>
                <p style={{ fontSize: '0.8rem', letterSpacing: '2px', fontWeight: 600, color: '#777', textTransform: 'uppercase' }}>
                  ESTD. 1958 • SOLAPUR • 100% BIS HALLMARK
                </p>
                <p style={{ fontSize: '0.82rem', color: '#555', marginTop: '4px' }}>
                  274, Purv Mangalwar Peth, Saraf Katta, Solapur - 413002<br />
                  Ph: +91 98220 12345 • GSTIN: 27AAAAA0000A1Z5
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: '1.2rem', color: '#9B7812', fontFamily: '"Cinzel", serif', fontWeight: 700 }}>
                  TAX INVOICE
                </h2>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '4px' }}>
                  Invoice No: <span style={{ fontFamily: 'monospace' }}>{purchase.invoiceNo || purchase.id}</span>
                </p>
                <p style={{ fontSize: '0.82rem', color: '#666' }}>
                  Date: {purchase.purchaseDate || new Date().toISOString().slice(0, 10)}
                </p>
                <p style={{ fontSize: '0.82rem', color: '#666' }}>
                  Mode: <strong>{purchase.paymentMode || 'CASH'}</strong>
                </p>
              </div>
            </div>

            {/* Billed To Customer */}
            <div style={{ background: '#FAF8F3', border: '1px solid #EAE3D2', borderRadius: '6px', padding: '12px 16px', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>
                Billed To:
              </span>
              <strong style={{ fontSize: '1rem', color: '#1A1A1A' }}>
                {purchase.customerName || 'Valued Customer'}
              </strong>
              {purchase.customerMobile && (
                <div style={{ fontSize: '0.82rem', color: '#555', marginTop: '2px' }}>
                  Contact: +91 {purchase.customerMobile}
                </div>
              )}
            </div>

            {/* Itemized Table */}
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Description of Jewellery</th>
                  <th>Metal / Karat</th>
                  <th style={{ textAlign: 'right' }}>Net Wt (g)</th>
                  <th style={{ textAlign: 'right' }}>Rate (₹/g)</th>
                  <th style={{ textAlign: 'right' }}>Making (₹)</th>
                  <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {purchase.items && purchase.items.map((item, idx) => {
                  const itemTotal = item.itemTotal || ((Number(item.netWeight || 0) * Number(item.rate || 0)) + Number(item.makingCharges || 0));
                  return (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td><strong>{item.name || 'Jewelry Item'}</strong></td>
                      <td>{item.category || 'GOLD 916'}</td>
                      <td style={{ textAlign: 'right' }}>{Number(item.netWeight || 0).toFixed(3)}</td>
                      <td style={{ textAlign: 'right' }}>₹{Number(item.rate || 0).toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'right' }}>₹{Number(item.makingCharges || 0).toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{itemTotal.toLocaleString('en-IN')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Totals Breakdown */}
            <div className="invoice-totals">
              <div style={{ width: '280px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#555' }}>
                <span>Subtotal:</span>
                <span>₹{Number(purchase.subtotal || 0).toLocaleString('en-IN')}</span>
              </div>

              {Number(purchase.discount || 0) > 0 && (
                <div style={{ width: '280px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#15803D' }}>
                  <span>Discount:</span>
                  <span>-₹{Number(purchase.discount || 0).toLocaleString('en-IN')}</span>
                </div>
              )}

              <div style={{ width: '280px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#555' }}>
                <span>Taxable Amount:</span>
                <span>₹{Number(purchase.taxableAmount || purchase.subtotal || 0).toLocaleString('en-IN')}</span>
              </div>

              <div style={{ width: '280px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#9B7812' }}>
                <span>GST (3%):</span>
                <span>+₹{Number(purchase.gstAmount || 0).toLocaleString('en-IN')}</span>
              </div>

              <div
                style={{
                  width: '280px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: '#9B7812',
                  borderTop: '2px solid #9B7812',
                  paddingTop: '6px',
                  marginTop: '4px'
                }}
              >
                <span>Grand Total:</span>
                <span>₹{Number(purchase.netTotal || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Terms and Signatures */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '20px', borderTop: '1px dashed #DDD', fontSize: '0.78rem', color: '#777' }}>
              <div>
                <strong>Terms & Conditions:</strong>
                <ol style={{ paddingLeft: '16px', marginTop: '4px', lineHeight: '1.4' }}>
                  <li>All gold ornaments sold are guaranteed 916 (22K) Hallmark.</li>
                  <li>Exchange value calculated as per prevailing daily market metal rates.</li>
                  <li>Subject to Solapur jurisdiction only.</li>
                </ol>
              </div>

              <div style={{ textAlign: 'center', minWidth: '180px' }}>
                <div style={{ height: '45px' }}></div>
                <div style={{ borderTop: '1px solid #333', paddingTop: '4px', fontWeight: 600, color: '#222' }}>
                  Authorized Signatory<br />
                  <span style={{ fontSize: '0.7rem', color: '#888' }}>For Karajgikar Jewellers</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer no-print" style={{ background: '#F8F5EE', borderTop: '1px solid #E5DFD0' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ color: '#1A1A1A', borderColor: '#CCC' }}>
            Close Preview
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Print Official Invoice (Ctrl+P)
          </button>
        </div>
      </div>
    </div>
  );
}
