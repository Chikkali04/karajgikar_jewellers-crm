/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - BIRTHDAYS & ANNIVERSARIES VIEW (BirthdaysView.jsx)
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext.jsx';
import { getAllCustomers } from '../../services/customerService.js';
import { getUpcomingCelebrations, openWhatsAppWish, generateWishMessage } from '../../services/autoWishService.js';
import { queueMessage } from '../../services/campaignService.js';
import {
  Cake,
  Heart,
  MessageCircle,
  Sparkles,
  Calendar,
  Send,
  CheckCircle2,
  Copy
} from 'lucide-react';

export default function BirthdaysView() {
  const { refreshKey, setActiveCustomerProfileId, showToast } = useCRM();

  const [customers, setCustomers] = useState([]);
  const [celebrations7Days, setCelebrations7Days] = useState([]);
  const [celebrations30Days, setCelebrations30Days] = useState([]);
  const [activeRange, setActiveRange] = useState('7'); // 'today', '7', '30'
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const list = await getAllCustomers();
        setCustomers(list);
        setCelebrations7Days(getUpcomingCelebrations(list, 7));
        setCelebrations30Days(getUpcomingCelebrations(list, 30));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [refreshKey]);

  const activeCelebrations = activeRange === 'today'
    ? celebrations7Days.filter(c => c.isToday)
    : activeRange === '7'
    ? celebrations7Days
    : celebrations30Days;

  const handleQueueAllWishes = async () => {
    const todayWishes = celebrations7Days.filter(c => c.isToday);
    if (todayWishes.length === 0) {
      showToast('No birthday or anniversary celebrations today to queue', 'info');
      return;
    }

    let count = 0;
    for (const celeb of todayWishes) {
      if (celeb.mobile) {
        await queueMessage({
          customerId: celeb.customerId,
          customerName: celeb.customerName,
          mobile: celeb.mobile,
          channel: 'WHATSAPP',
          message: generateWishMessage(celeb),
          status: 'PENDING'
        });
        count++;
      }
    }
    showToast(`Queued ${count} celebration messages into Message Queue!`, 'success');
  };

  const copyMessage = (celeb) => {
    const text = generateWishMessage(celeb);
    navigator.clipboard.writeText(text);
    showToast('Personalized greeting message copied to clipboard!', 'info');
  };

  return (
    <div>
      {/* Header Banner */}
      <div className="card-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: '1.5rem' }}>
            <Cake size={22} color="var(--color-gold)" /> Customer Birthdays & Anniversaries
          </h2>
          <p className="card-subtitle">Strengthen customer relationships by sending timely personalized greetings & gold discount tokens.</p>
        </div>

        <button className="btn btn-primary" onClick={handleQueueAllWishes}>
          <Send size={15} /> Queue Today's Wishes to Gateway
        </button>
      </div>

      {/* Stats and Filter Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div
          className="card"
          style={{
            cursor: 'pointer',
            borderColor: activeRange === 'today' ? 'var(--color-gold)' : 'var(--border-color-subtle)',
            background: activeRange === 'today' ? 'var(--color-gold-dim)' : 'var(--bg-card)'
          }}
          onClick={() => setActiveRange('today')}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Celebrations Today</span>
          <h3 style={{ fontSize: '1.6rem', color: 'var(--color-gold)', margin: '4px 0' }}>
            {celebrations7Days.filter(c => c.isToday).length}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>Instant action required</span>
        </div>

        <div
          className="card"
          style={{
            cursor: 'pointer',
            borderColor: activeRange === '7' ? 'var(--color-gold)' : 'var(--border-color-subtle)',
            background: activeRange === '7' ? 'var(--color-gold-dim)' : 'var(--bg-card)'
          }}
          onClick={() => setActiveRange('7')}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Next 7 Days</span>
          <h3 style={{ fontSize: '1.6rem', color: 'var(--color-cream)', margin: '4px 0' }}>
            {celebrations7Days.length}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Upcoming greetings</span>
        </div>

        <div
          className="card"
          style={{
            cursor: 'pointer',
            borderColor: activeRange === '30' ? 'var(--color-gold)' : 'var(--border-color-subtle)',
            background: activeRange === '30' ? 'var(--color-gold-dim)' : 'var(--bg-card)'
          }}
          onClick={() => setActiveRange('30')}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Next 30 Days</span>
          <h3 style={{ fontSize: '1.6rem', color: 'var(--color-cream)', margin: '4px 0' }}>
            {celebrations30Days.length}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Monthly plan</span>
        </div>
      </div>

      {/* Celebrations Grid / List */}
      <div className="card" style={{ padding: '0' }}>
        <div className="table-container">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Event Type</th>
                <th>Event Date (DD/MM)</th>
                <th>Timeline</th>
                <th>Personalized Greeting Preview</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeCelebrations.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No celebrations found in this time range.
                  </td>
                </tr>
              ) : (
                activeCelebrations.map((c, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {c.photoUrl ? (
                          <img src={c.photoUrl} alt={c.customerName} className="customer-avatar-sm" />
                        ) : (
                          <div className="customer-avatar-sm">
                            {c.customerName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div
                            style={{ fontWeight: 600, color: 'var(--color-gold)', cursor: 'pointer' }}
                            onClick={() => setActiveCustomerProfileId(c.customerId)}
                          >
                            {c.customerName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {c.mobile || 'No Mobile'} {c.city ? `• ${c.city}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${c.type === 'BIRTHDAY' ? 'badge-info' : 'badge-gold'}`}>
                        {c.type === 'BIRTHDAY' ? '🎂 BIRTHDAY' : '💍 ANNIVERSARY'}
                      </span>
                    </td>

                    <td style={{ fontWeight: 600, color: 'var(--color-cream)' }}>
                      {c.eventDate}
                    </td>

                    <td>
                      {c.isToday ? (
                        <span className="badge badge-success" style={{ fontWeight: 700 }}>
                          🎉 TODAY
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>
                          In {c.daysLeft} days
                        </span>
                      )}
                    </td>

                    <td style={{ maxWidth: '300px' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {generateWishMessage(c)}
                      </p>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => copyMessage(c)}
                          title="Copy Message"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => openWhatsAppWish(c)}
                          title="Send Direct WhatsApp Greeting"
                        >
                          <MessageCircle size={14} /> Wish on WhatsApp
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
