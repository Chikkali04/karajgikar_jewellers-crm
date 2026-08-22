/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - MESSAGE QUEUE (MessageQueueView.jsx)
   Compatible with the local automated SMS / WhatsApp Gateway
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext.jsx';
import { getAllMessages, markMessageStatus, removeMessage, clearAllMessages, getAllCampaigns } from '../../services/campaignService.js';
import {
  MessageSquare,
  Send,
  Trash2,
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Filter,
  CheckCheck
} from 'lucide-react';

export default function MessageQueueView() {
  const { refreshKey, triggerRefresh, openConfirm, showToast, setActiveView } = useCRM();

  const [messages, setMessages] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterChannel, setFilterChannel] = useState('ALL');
  const [filterCampaign, setFilterCampaign] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMessages() {
      try {
        setLoading(true);
        const [msgData, campData] = await Promise.all([
          getAllMessages(),
          getAllCampaigns()
        ]);
        setMessages(msgData || []);
        setCampaigns(campData || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadMessages();
  }, [refreshKey]);

  const handleMarkSent = async (id) => {
    await markMessageStatus(id, 'SENT');
    showToast('Message marked as SENT', 'success');
    triggerRefresh();
  };

  const handleMarkAllPendingSent = async () => {
    const pendingList = messages.filter(m => m.status === 'PENDING');
    if (pendingList.length === 0) {
      showToast('No pending messages in queue', 'info');
      return;
    }

    openConfirm(
      'Mark All Pending as Delivered',
      `Mark all ${pendingList.length} pending SMS & WhatsApp messages as successfully delivered?`,
      async () => {
        for (const msg of pendingList) {
          await markMessageStatus(msg.id, 'SENT');
        }
        showToast(`Marked ${pendingList.length} messages as SENT!`, 'success');
        triggerRefresh();
      }
    );
  };

  const handleDelete = (msg) => {
    openConfirm('Delete Queued Message', 'Are you sure you want to delete this message record?', async () => {
      await removeMessage(msg.id);
      showToast('Message removed', 'success');
      triggerRefresh();
    });
  };

  const handleClearAll = () => {
    openConfirm('Clear All Messages', 'Are you sure you want to completely clear the entire message queue history?', async () => {
      await clearAllMessages();
      showToast('Message queue cleared', 'success');
      triggerRefresh();
    });
  };

  const handleSendViaWhatsApp = async (msg) => {
    const cleanMobile = (msg.mobile || '').replace(/\D/g, '');
    const phone = cleanMobile.startsWith('91') ? cleanMobile : `91${cleanMobile}`;
    const text = encodeURIComponent(msg.message || '');
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    await markMessageStatus(msg.id, 'SENT');
    triggerRefresh();
  };

  const copyMessage = (msg) => {
    navigator.clipboard.writeText(msg.message);
    showToast('Message copied to clipboard', 'info');
  };

  const filteredMessages = messages.filter(m => {
    const matchStatus = filterStatus === 'ALL' || m.status === filterStatus;
    const matchChannel = filterChannel === 'ALL' || m.channel === filterChannel;
    const matchCampaign = filterCampaign === 'ALL' || m.campaignId === filterCampaign;
    return matchStatus && matchChannel && matchCampaign;
  });

  const pendingCount = messages.filter(m => m.status === 'PENDING').length;
  const sentCount = messages.filter(m => m.status === 'SENT').length;

  return (
    <div>
      {/* Header Banner */}
      <div className="card-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: '1.5rem' }}>
            <MessageSquare size={22} color="var(--color-gold)" /> SMS & WhatsApp Message Queue
          </h2>
          <p className="card-subtitle">
            Gateway queue where outgoing customer campaign texts, birthday wishes, and festival greetings are synchronized.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setActiveView('festivals')}>
            <Sparkles size={14} /> Launch Campaign
          </button>
          <button className="btn btn-secondary" onClick={() => triggerRefresh()}>
            <RefreshCw size={14} /> Refresh
          </button>
          {pendingCount > 0 && (
            <button className="btn btn-primary" onClick={handleMarkAllPendingSent}>
              <CheckCheck size={14} /> Mark All Pending Sent ({pendingCount})
            </button>
          )}
          <button className="btn btn-secondary" onClick={handleClearAll} style={{ color: 'var(--color-danger)' }}>
            <Trash2 size={14} /> Clear All
          </button>
        </div>
      </div>

      {/* Gateway Live Status Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-md)',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-success)', boxShadow: '0 0 10px var(--color-success)' }}></div>
          <div>
            <strong style={{ color: 'var(--color-gold)', fontSize: '0.95rem' }}>
              SMS & WhatsApp Gateway Integration Active
            </strong>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Database: <code>KarajgikarJewellersCRM</code> &bull; Store: <code>messages</code> &bull; Query Index: <code>status = 'PENDING'</code>
            </p>
          </div>
        </div>

        <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Pending SMS Queue: <strong style={{ color: 'var(--color-warning)', fontSize: '1.1rem' }}>{pendingCount}</strong>
        </div>
      </div>

      {/* Queue Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div
          className="card"
          style={{
            cursor: 'pointer',
            borderColor: filterStatus === 'PENDING' ? 'var(--color-gold)' : 'var(--border-color-subtle)'
          }}
          onClick={() => setFilterStatus(filterStatus === 'PENDING' ? 'ALL' : 'PENDING')}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending Delivery</span>
          <h3 style={{ fontSize: '1.6rem', color: 'var(--color-warning)', margin: '4px 0' }}>
            {pendingCount}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Awaiting gateway processing</span>
        </div>

        <div
          className="card"
          style={{
            cursor: 'pointer',
            borderColor: filterStatus === 'SENT' ? 'var(--color-gold)' : 'var(--border-color-subtle)'
          }}
          onClick={() => setFilterStatus(filterStatus === 'SENT' ? 'ALL' : 'SENT')}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Successfully Sent</span>
          <h3 style={{ fontSize: '1.6rem', color: 'var(--color-success)', margin: '4px 0' }}>
            {sentCount}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Delivered to recipients</span>
        </div>

        <div
          className="card"
          style={{
            cursor: 'pointer',
            borderColor: filterStatus === 'ALL' ? 'var(--color-gold)' : 'var(--border-color-subtle)'
          }}
          onClick={() => setFilterStatus('ALL')}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Queued</span>
          <h3 style={{ fontSize: '1.6rem', color: 'var(--color-cream)', margin: '4px 0' }}>
            {messages.length}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>All historical records</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} /> Filter Queue:
          </span>

          {/* Status Filter */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '130px', padding: '6px 12px', fontSize: '0.82rem' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Statuses ({messages.length})</option>
            <option value="PENDING">⏳ Pending ({pendingCount})</option>
            <option value="SENT">✅ Sent ({sentCount})</option>
          </select>

          {/* Channel Filter */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '130px', padding: '6px 12px', fontSize: '0.82rem' }}
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
          >
            <option value="ALL">All Channels</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="SMS">SMS Gateway</option>
          </select>

          {/* Campaign Filter */}
          {campaigns.length > 0 && (
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '180px', padding: '6px 12px', fontSize: '0.82rem' }}
              value={filterCampaign}
              onChange={(e) => setFilterCampaign(e.target.value)}
            >
              <option value="ALL">All Broadcast Campaigns</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.recipientCount} msgs)
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Messages Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Msg ID</th>
                <th>Recipient</th>
                <th>Channel</th>
                <th>Message Content</th>
                <th>Queued At</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No messages in the queue matching the filter.
                  </td>
                </tr>
              ) : (
                filteredMessages.map(msg => (
                  <tr key={msg.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {msg.id}
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {msg.customerName || 'Customer'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-gold)' }}>
                        {msg.mobile || '-'}
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${msg.channel === 'WHATSAPP' ? 'badge-success' : 'badge-gold'}`}>
                        {msg.channel || 'WHATSAPP'}
                      </span>
                    </td>

                    <td style={{ maxWidth: '340px' }}>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        {msg.message}
                      </p>
                    </td>

                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                    </td>

                    <td>
                      <span className={`badge ${msg.status === 'SENT' ? 'badge-success' : msg.status === 'FAILED' ? 'badge-danger' : 'badge-warning'}`}>
                        {msg.status}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => copyMessage(msg)}
                          title="Copy Message Text"
                        >
                          <Copy size={13} />
                        </button>
                        {msg.channel === 'WHATSAPP' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleSendViaWhatsApp(msg)}
                            title="Launch WhatsApp Web"
                          >
                            <ExternalLink size={13} /> Send
                          </button>
                        )}
                        {msg.status === 'PENDING' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleMarkSent(msg.id)}
                            title="Mark as Sent"
                          >
                            <CheckCircle size={13} />
                          </button>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--color-danger)' }}
                          onClick={() => handleDelete(msg)}
                          title="Delete Message"
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
