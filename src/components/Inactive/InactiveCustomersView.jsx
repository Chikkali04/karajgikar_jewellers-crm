/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - INACTIVE CUSTOMERS WIN-BACK (InactiveCustomersView.jsx)
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext.jsx';
import { getAllCustomers } from '../../services/customerService.js';
import { getAllPurchases } from '../../services/purchaseService.js';
import { broadcastCampaign } from '../../services/campaignService.js';
import {
  UserX,
  MessageCircle,
  Calendar,
  Send,
  Sparkles,
  Phone,
  Eye,
  CheckCircle2,
  X
} from 'lucide-react';

export default function InactiveCustomersView() {
  const { setActiveCustomerProfileId, showToast, triggerRefresh, setActiveView } = useCRM();

  const [customers, setCustomers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [inactivityMonths, setInactivityMonths] = useState(6); // 6, 12, 18, 24
  const [loading, setLoading] = useState(true);
  const [winBackModalOpen, setWinBackModalOpen] = useState(false);
  const [winBackMessage, setWinBackMessage] = useState(
    'आदरणीय {customer_name} जी, Karajgikar Jewellers मध्ये आपण बऱ्याच दिवसांपासून भेट दिली नाही. आम्ही आपल्यासाठी खास ₹५०० चे गोल्ड मेकिंग डिस्काउंट व्हाउचर राखीव ठेवले आहे! 🪙✨ आजच भेट द्या: 274, सराफ कट्टा, सोलापूर.'
  );

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const cList = await getAllCustomers();
        const pList = await getAllPurchases();
        setCustomers(cList);
        setPurchases(pList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute last purchase date for each customer
  const lastPurchaseMap = {};
  purchases.forEach(p => {
    if (p.customerId) {
      const pDate = new Date(p.purchaseDate || p.createdAt);
      if (!lastPurchaseMap[p.customerId] || pDate > new Date(lastPurchaseMap[p.customerId])) {
        lastPurchaseMap[p.customerId] = p.purchaseDate || p.createdAt;
      }
    }
  });

  const now = new Date();
  const thresholdDate = new Date(now.getFullYear(), now.getMonth() - inactivityMonths, now.getDate());

  // Filter inactive customers
  const inactiveCustomers = customers.filter(cust => {
    const lastDateStr = lastPurchaseMap[cust.id] || cust.createdAt;
    if (!lastDateStr) return true;
    const lastDate = new Date(lastDateStr);
    return lastDate < thresholdDate;
  }).map(cust => {
    const lastDateStr = lastPurchaseMap[cust.id] || cust.createdAt;
    const lastDate = lastDateStr ? new Date(lastDateStr) : null;
    const diffMonths = lastDate ? Math.floor((now - lastDate) / (1000 * 60 * 60 * 24 * 30.4)) : 12;
    return {
      ...cust,
      lastPurchaseDate: lastDateStr ? lastDateStr.slice(0, 10) : 'Never',
      monthsInactive: diffMonths
    };
  }).sort((a, b) => b.monthsInactive - a.monthsInactive);

  const handleBroadcastWinBack = async (e) => {
    e.preventDefault();
    try {
      const res = await broadcastCampaign({
        title: `Win-Back Offer (${inactivityMonths}+ Months Inactive)`,
        messageTemplate: winBackMessage,
        targetAudience: 'ALL',
        customers: inactiveCustomers,
        channel: 'WHATSAPP'
      });

      showToast(`Win-back broadcast queued for ${res.queuedCount} customers! ✨`, 'success');
      setWinBackModalOpen(false);
      triggerRefresh();
      setTimeout(() => {
        setActiveView('messages');
      }, 400);
    } catch (err) {
      showToast('Failed to queue win-back broadcast', 'error');
    }
  };

  return (
    <div>
      {/* Header Banner */}
      <div className="card-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: '1.5rem' }}>
            <UserX size={22} color="var(--color-warning)" /> Inactive Customer Win-Back List
          </h2>
          <p className="card-subtitle">
            Identify valued customers who have not visited the showroom recently and re-engage them with exclusive comeback rewards.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setWinBackModalOpen(true)}>
          <Send size={15} /> Broadcast Win-Back Offer
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.86rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Inactivity Period:
          </span>

          <button
            className={`btn btn-sm ${inactivityMonths === 6 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setInactivityMonths(6)}
          >
            6+ Months Inactive
          </button>
          <button
            className={`btn btn-sm ${inactivityMonths === 12 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setInactivityMonths(12)}
          >
            1+ Year Inactive
          </button>
          <button
            className={`btn btn-sm ${inactivityMonths === 18 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setInactivityMonths(18)}
          >
            1.5+ Years Inactive
          </button>
          <button
            className={`btn btn-sm ${inactivityMonths === 24 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setInactivityMonths(24)}
          >
            2+ Years Inactive
          </button>

          <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--color-gold)', fontWeight: 600 }}>
            Found: {inactiveCustomers.length} Customers
          </span>
        </div>
      </div>

      {/* Inactive Customers Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Contact</th>
                <th>City / Village</th>
                <th>VIP Status</th>
                <th>Last Visit / Bill</th>
                <th>Inactivity Duration</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inactiveCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No customers found matching the {inactivityMonths}+ months inactivity filter.
                  </td>
                </tr>
              ) : (
                inactiveCustomers.map(cust => (
                  <tr key={cust.id}>
                    <td>
                      <div
                        style={{ fontWeight: 600, color: 'var(--color-gold)', cursor: 'pointer' }}
                        onClick={() => setActiveCustomerProfileId(cust.id)}
                      >
                        {cust.name}
                      </div>
                    </td>

                    <td>{cust.mobile || '-'}</td>
                    <td>{cust.city || 'Solapur'}</td>

                    <td>
                      <span className={`badge ${cust.tier === 'DIAMOND' ? 'tier-diamond' : cust.tier === 'GOLD' ? 'tier-gold' : 'tier-silver'}`}>
                        {cust.tier || 'SILVER'}
                      </span>
                    </td>

                    <td>{cust.lastPurchaseDate}</td>

                    <td>
                      <span className="badge badge-warning" style={{ fontWeight: 600 }}>
                        {cust.monthsInactive} Months
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {cust.mobile && (
                          <a
                            href={`https://wa.me/91${cust.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(winBackMessage.replace('{customer_name}', cust.name))}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-success btn-sm"
                            title="Send WhatsApp Win-back"
                          >
                            <MessageCircle size={13} /> Re-engage
                          </a>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setActiveCustomerProfileId(cust.id)}
                          title="View Profile"
                        >
                          <Eye size={13} />
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

      {/* Win-Back Modal */}
      {winBackModalOpen && (
        <div className="modal-overlay" onClick={() => setWinBackModalOpen(false)}>
          <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} /> Broadcast Win-Back Discount ({inactiveCustomers.length} Recipients)
              </h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setWinBackModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleBroadcastWinBack}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label required">Personalized Win-Back Offer Message</label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: '130px' }}
                    value={winBackMessage}
                    onChange={(e) => setWinBackMessage(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Use <code>{`{customer_name}`}</code> to automatically insert customer name.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setWinBackModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle2 size={16} /> Launch Win-Back Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
