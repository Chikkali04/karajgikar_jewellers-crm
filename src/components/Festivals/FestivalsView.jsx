/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - FESTIVAL CONFIG & CAMPAIGNS (FestivalsView.jsx)
   Matches the exact Add/Edit Festival and Campaign Broadcaster of original CRM
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext.jsx';
import {
  getAllFestivals,
  addFestival,
  updateFestival,
  deleteFestival
} from '../../services/festivalService.js';
import { getAllCustomers } from '../../services/customerService.js';
import { broadcastCampaign, getAllCampaigns } from '../../services/campaignService.js';
import {
  Sparkles,
  Send,
  Calendar,
  Gift,
  Users,
  CheckCircle2,
  X,
  Plus,
  Edit2,
  Trash2,
  MessageSquare,
  ArrowRight,
  Clock
} from 'lucide-react';

export default function FestivalsView() {
  const { showToast, triggerRefresh, openConfirm, refreshKey, setActiveView } = useCRM();

  const [festivals, setFestivals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [campaignHistory, setCampaignHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Festival Add / Edit Modal State
  const [festivalModalOpen, setFestivalModalOpen] = useState(false);
  const [editingFestival, setEditingFestival] = useState(null);
  const [festName, setFestName] = useState('');
  const [festDate, setFestDate] = useState('');
  const [festDesc, setFestDesc] = useState('');
  const [festSaving, setFestSaving] = useState(false);

  // Campaign Composer State
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [selectedFestival, setSelectedFestival] = useState(null);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [targetAudience, setTargetAudience] = useState('ALL');
  const [channel, setChannel] = useState('WHATSAPP');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [campaignLoading, setCampaignLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [fList, cList, cHist] = await Promise.all([
          getAllFestivals(),
          getAllCustomers(),
          getAllCampaigns()
        ]);
        setFestivals(fList);
        setCustomers(cList);
        setCampaignHistory(cHist);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [refreshKey]);

  // Open Add / Edit Festival Modal
  const handleOpenAddFestival = () => {
    setEditingFestival(null);
    setFestName('');
    setFestDate(new Date().toISOString().slice(0, 10));
    setFestDesc('');
    setFestivalModalOpen(true);
  };

  const handleOpenEditFestival = (fest) => {
    setEditingFestival(fest);
    setFestName(fest.name || '');
    setFestDate(fest.festivalDate || fest.date || '');
    setFestDesc(fest.description || '');
    setFestivalModalOpen(true);
  };

  const handleSaveFestival = async (e) => {
    e.preventDefault();
    if (!festName.trim()) {
      showToast('Please enter festival name', 'warning');
      return;
    }
    if (!festDate) {
      showToast('Please select festival date', 'warning');
      return;
    }

    try {
      setFestSaving(true);
      const payload = {
        name: festName.trim(),
        festivalDate: festDate,
        description: festDesc.trim()
      };

      if (editingFestival) {
        payload.id = editingFestival.id;
        await updateFestival(payload);
        showToast('Festival config updated successfully!', 'success');
      } else {
        await addFestival(payload);
        showToast('Festival config added successfully! ✨', 'success');
      }

      setFestivalModalOpen(false);
      const updated = await getAllFestivals();
      setFestivals(updated);
      triggerRefresh();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to save festival configuration.', 'error');
    } finally {
      setFestSaving(false);
    }
  };

  const handleDeleteFestival = (fest) => {
    openConfirm(
      'Delete Festival Configuration',
      `Are you sure you want to delete "${fest.name}"? Bulk campaigns planned for this festival will no longer refer to it.`,
      async () => {
        try {
          await deleteFestival(fest.id);
          setFestivals(prev => prev.filter(f => f.id !== fest.id));
          showToast('Festival config deleted successfully.', 'success');
          triggerRefresh();
        } catch (err) {
          showToast('Deletion failed.', 'error');
        }
      }
    );
  };

  // Open Broadcast Campaign Composer
  const handleOpenBroadcast = (fest) => {
    setSelectedFestival(fest);
    setCampaignTitle(`${fest.name} Festive Jewellery Offer`);
    setMessageTemplate(
      `आदरणीय {customer_name} जी, Karajgikar Jewellers परिवाराकडून आपणास ${fest.name} सणाच्या मनःपूर्वक सुवर्ण शुभेच्छा! 🪙✨\n\nखास ऑफर: ${fest.description || 'अस्सल 916 हॉलमार्क सोन्याच्या दागिन्यांवर विशेष सवलत'}\n\nआजच भेट द्या: 274, पूर्व मंगळवार पेठ, सराफ कट्टा, सोलापूर. फोन: 9822012345`
    );
    setBroadcastModalOpen(true);
  };

  const handleSendCampaign = async (e) => {
    e.preventDefault();
    if (!messageTemplate.trim()) {
      showToast('Please enter a message template', 'warning');
      return;
    }

    try {
      setCampaignLoading(true);
      const res = await broadcastCampaign({
        title: campaignTitle,
        messageTemplate: messageTemplate,
        targetAudience: targetAudience,
        customers: customers,
        channel: channel
      });

      showToast(`Campaign launched! Queued ${res.queuedCount} greeting messages to Message Queue! 🚀`, 'success');
      setBroadcastModalOpen(false);
      triggerRefresh();

      // Automatically navigate to Message Queue so user can see all queued messages immediately!
      setTimeout(() => {
        setActiveView('messages');
      }, 400);
    } catch (err) {
      console.error(err);
      showToast('Failed to queue campaign messages', 'error');
    } finally {
      setCampaignLoading(false);
    }
  };

  function formatDateNeatly(dateStr) {
    if (!dateStr) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return `${day} ${months[monthIndex]} ${year}`;
    }
    return dateStr;
  }

  return (
    <div>
      {/* Header Banner */}
      <div className="card-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: '1.5rem' }}>
            <Sparkles size={22} color="var(--color-gold)" /> Shopping Festivals & Offer Campaigns
          </h2>
          <p className="card-subtitle">
            Manage Solapur jewellery shopping festivals (Akshaya Tritiya, Diwali, Gudi Padwa) and broadcast festive greetings.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAddFestival}>
          <Plus size={15} /> + Add Shopping Festival
        </button>
      </div>

      {/* Festivals Grid */}
      {festivals.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', marginBottom: '24px' }}>
          <Sparkles size={36} color="var(--color-gold)" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ color: 'var(--color-cream)', marginBottom: '6px' }}>No Festivals Configured</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
            Add custom festivals to plan your bulk marketing and SMS greeting campaigns.
          </p>
          <button className="btn btn-primary" onClick={handleOpenAddFestival}>
            <Plus size={15} /> Add First Shopping Festival
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          {festivals.map(fest => {
            const dateStr = fest.festivalDate || fest.date;
            return (
              <div key={fest.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--color-gold)', fontFamily: 'var(--font-serif)' }}>
                      {fest.name}
                    </h3>
                    <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>
                      <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {formatDateNeatly(dateStr)}
                    </span>
                  </div>

                  {fest.description && (
                    <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color-subtle)', marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>
                        <Gift size={12} color="var(--color-gold)" style={{ display: 'inline', marginRight: '4px' }} />
                        Target / Offer Notes:
                      </span>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-cream)', marginTop: '4px' }}>
                        {fest.description}
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => handleOpenBroadcast(fest)}
                  >
                    <Send size={13} /> Launch Campaign
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenEditFestival(fest)}
                    title="Edit Festival"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--color-danger)' }}
                    onClick={() => handleDeleteFestival(fest)}
                    title="Delete Festival"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RECENT CAMPAIGNS LAUNCH HISTORY */}
      <div className="card">
        <div className="card-header" style={{ marginBottom: '14px' }}>
          <div>
            <h3 className="card-title" style={{ fontSize: '1.15rem' }}>
              <Clock size={18} color="var(--color-gold)" /> Recent Launched Campaigns History
            </h3>
            <p className="card-subtitle">
              All promotional greeting and discount broadcast campaigns queued for customer delivery.
            </p>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={() => setActiveView('messages')}>
            <MessageSquare size={13} /> View Full Message Queue ({campaignHistory.reduce((s, c) => s + (c.recipientCount || 0), 0)} msgs)
          </button>
        </div>

        {campaignHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
            No campaign history found yet. Click <strong>"Launch Campaign"</strong> on any festival above to broadcast greetings.
          </div>
        ) : (
          <div className="table-container">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Campaign ID</th>
                  <th>Title / Festival</th>
                  <th>Audience Segment</th>
                  <th>Channel</th>
                  <th>Recipients</th>
                  <th>Date & Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {campaignHistory.map(camp => (
                  <tr key={camp.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--color-gold)' }}>
                      {camp.id}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {camp.title}
                    </td>
                    <td>
                      <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>
                        {camp.targetAudience === 'ALL' ? 'All Customers' : camp.targetAudience === 'VIP_DIAMOND' ? '💎 Diamond VIPs' : camp.targetAudience === 'VIP_GOLD' ? '🪙 Gold VIPs' : '📍 Solapur'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${camp.channel === 'WHATSAPP' ? 'badge-success' : 'badge-gold'}`} style={{ fontSize: '0.72rem' }}>
                        {camp.channel || 'WHATSAPP'}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--color-cream)' }}>{camp.recipientCount} customers</strong>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {camp.createdAt ? new Date(camp.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setActiveView('messages')}
                      >
                        Queue <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 1. ADD / EDIT FESTIVAL MODAL */}
      {festivalModalOpen && (
        <div className="modal-overlay" onClick={() => setFestivalModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} /> {editingFestival ? 'Edit Festival Details' : 'Add New Shopping Festival'}
              </h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setFestivalModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveFestival}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label required">Festival Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Diwali, Akshaya Tritiya, Gudi Padwa"
                    value={festName}
                    onChange={(e) => setFestName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label required">Festival Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={festDate}
                    onChange={(e) => setFestDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label">Description / Metal Target Notes</label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: '80px' }}
                    placeholder="e.g. Target gold purchases, coin distributions, auspicious buying day"
                    value={festDesc}
                    onChange={(e) => setFestDesc(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setFestivalModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={festSaving}>
                  <CheckCircle2 size={16} /> {editingFestival ? 'Update Festival' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. BROADCAST FESTIVAL CAMPAIGN MODAL */}
      {broadcastModalOpen && (
        <div className="modal-overlay" onClick={() => setBroadcastModalOpen(false)}>
          <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={20} /> Launch Festive Campaign ({selectedFestival?.name})
              </h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setBroadcastModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSendCampaign}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label required">Campaign Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={campaignTitle}
                    onChange={(e) => setCampaignTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Target Customer Segment</label>
                    <select
                      className="form-select"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                    >
                      <option value="ALL">All Registered Customers ({customers.length})</option>
                      <option value="VIP_DIAMOND">💎 Diamond Royal VIP Only (Spend ₹5L+)</option>
                      <option value="VIP_GOLD">🪙 Gold & Diamond VIPs (Spend ₹1.5L+)</option>
                      <option value="SOLAPUR_ONLY">📍 Solapur City Customers Only</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Delivery Channel</label>
                    <select
                      className="form-select"
                      value={channel}
                      onChange={(e) => setChannel(e.target.value)}
                    >
                      <option value="WHATSAPP">WhatsApp Message</option>
                      <option value="SMS">Standard SMS Gateway</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label required">
                    Message Template (supports <code>{`{customer_name}`}</code>, <code>{`{shop_name}`}</code>, <code>{`{city}`}</code>)
                  </label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: '120px' }}
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setBroadcastModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={campaignLoading}>
                  <CheckCircle2 size={16} /> Queue Messages for Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
