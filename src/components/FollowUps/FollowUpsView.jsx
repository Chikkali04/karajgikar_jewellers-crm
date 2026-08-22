/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - FOLLOW-UPS VIEW (FollowUpsView.jsx)
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext.jsx';
import { getAllFollowUps, saveFollowUp, markFollowUpStatus, removeFollowUp } from '../../services/followUpService.js';
import { getAllCustomers } from '../../services/customerService.js';
import {
  Clock,
  Plus,
  CheckCircle,
  Phone,
  Trash2,
  Calendar,
  X,
  Check,
  RotateCcw,
  Search
} from 'lucide-react';

export default function FollowUpsView() {
  const {
    refreshKey,
    triggerRefresh,
    setActiveCustomerProfileId,
    openConfirm,
    showToast
  } = useCRM();

  const [followUps, setFollowUps] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterUrgency, setFilterUrgency] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Follow-up Form
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerMobile: '',
    type: 'INQUIRY',
    purpose: '',
    followUpDate: new Date().toISOString().slice(0, 10),
    urgency: 'MEDIUM',
    notes: ''
  });

  useEffect(() => {
    async function loadData() {
      const fList = await getAllFollowUps();
      const cList = await getAllCustomers();
      setFollowUps(fList);
      setCustomers(cList);
    }
    loadData();
  }, [refreshKey]);

  const handleCustomerSelect = (e) => {
    const custId = e.target.value;
    const found = customers.find(c => c.id === custId);
    if (found) {
      setFormData({
        ...formData,
        customerId: custId,
        customerName: found.name,
        customerMobile: found.mobile || ''
      });
    } else {
      setFormData({
        ...formData,
        customerId: '',
        customerName: '',
        customerMobile: ''
      });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.customerName.trim()) {
      showToast('Please specify customer name', 'warning');
      return;
    }

    await saveFollowUp(formData);
    showToast('Follow-up scheduled successfully', 'success');
    setIsAddModalOpen(false);
    setFormData({
      customerId: '',
      customerName: '',
      customerMobile: '',
      type: 'INQUIRY',
      purpose: '',
      followUpDate: new Date().toISOString().slice(0, 10),
      urgency: 'MEDIUM',
      notes: ''
    });
    triggerRefresh();
  };

  const handleStatusChange = async (id, status) => {
    await markFollowUpStatus(id, status);
    showToast(`Follow-up marked as ${status.toLowerCase()}`, 'success');
    triggerRefresh();
  };

  const handleDelete = (fu) => {
    openConfirm('Delete Follow-Up', 'Are you sure you want to delete this reminder?', async () => {
      await removeFollowUp(fu.id);
      showToast('Follow-up deleted', 'success');
      triggerRefresh();
    });
  };

  const filteredFollowUps = followUps.filter(f => {
    const matchesSearch =
      (f.customerName && f.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.purpose && f.purpose.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.customerMobile && f.customerMobile.includes(searchTerm));

    const matchesStatus = filterStatus === 'ALL' || f.status === filterStatus;
    const matchesUrgency = filterUrgency === 'ALL' || f.urgency === filterUrgency;

    return matchesSearch && matchesStatus && matchesUrgency;
  });

  return (
    <div>
      {/* Header Banner */}
      <div className="card-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: '1.5rem' }}>
            <Clock size={22} color="var(--color-gold)" /> Customer Follow-ups & Reminders
          </h2>
          <p className="card-subtitle">Never miss customer inquiry callbacks, custom design updates, or payment reminders.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={15} /> + Schedule Follow-up
        </button>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Search by customer, inquiry details, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '150px' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">⏳ Pending Only</option>
            <option value="COMPLETED">✅ Completed</option>
            <option value="RESCHEDULED">🔄 Rescheduled</option>
            <option value="CANCELLED">❌ Cancelled</option>
          </select>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '150px' }}
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
          >
            <option value="ALL">All Urgencies</option>
            <option value="CRITICAL">🔴 Critical</option>
            <option value="HIGH">🟠 High</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="LOW">🟢 Low</option>
          </select>
        </div>
      </div>

      {/* Follow-ups List */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Type / Purpose</th>
                <th>Due Date</th>
                <th>Urgency</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFollowUps.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No follow-ups matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredFollowUps.map(fu => {
                  const isOverdue = fu.status === 'PENDING' && fu.followUpDate < new Date().toISOString().slice(0, 10);
                  return (
                    <tr key={fu.id}>
                      <td>
                        <div
                          style={{ fontWeight: 600, color: 'var(--color-gold)', cursor: fu.customerId ? 'pointer' : 'default' }}
                          onClick={() => fu.customerId && setActiveCustomerProfileId(fu.customerId)}
                        >
                          {fu.customerName}
                        </div>
                        {fu.customerMobile && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{fu.customerMobile}</div>
                        )}
                      </td>

                      <td>
                        <div style={{ fontWeight: 500 }}>{fu.purpose || fu.type}</div>
                        {fu.notes && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {fu.notes}
                          </div>
                        )}
                      </td>

                      <td>
                        <span style={{ fontWeight: isOverdue ? 700 : 400, color: isOverdue ? 'var(--color-danger)' : 'var(--text-main)' }}>
                          {fu.followUpDate} {isOverdue && '(OVERDUE)'}
                        </span>
                      </td>

                      <td>
                        <span className={`badge ${fu.urgency === 'CRITICAL' ? 'badge-danger' : fu.urgency === 'HIGH' ? 'badge-warning' : fu.urgency === 'LOW' ? 'badge-info' : 'badge-gold'}`}>
                          {fu.urgency}
                        </span>
                      </td>

                      <td>
                        <span className={`badge ${fu.status === 'COMPLETED' ? 'badge-success' : fu.status === 'CANCELLED' ? 'badge-danger' : fu.status === 'RESCHEDULED' ? 'badge-warning' : 'badge-gold'}`}>
                          {fu.status}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {fu.customerMobile && (
                            <a href={`tel:${fu.customerMobile}`} className="btn btn-secondary btn-sm" title="Call Customer">
                              <Phone size={13} />
                            </a>
                          )}
                          {fu.status === 'PENDING' && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleStatusChange(fu.id, 'COMPLETED')}
                              title="Mark as Completed"
                            >
                              <CheckCircle size={13} /> Done
                            </button>
                          )}
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--color-danger)' }}
                            onClick={() => handleDelete(fu)}
                            title="Delete Follow-up"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Follow-Up Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} /> Schedule Customer Follow-up
              </h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setIsAddModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Registered Customer</label>
                  <select
                    className="form-select"
                    value={formData.customerId}
                    onChange={handleCustomerSelect}
                  >
                    <option value="">-- Or enter customer name below --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.mobile || 'No Mobile'})</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Customer Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={formData.customerMobile}
                      onChange={(e) => setFormData({ ...formData, customerMobile: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Follow-up Type</label>
                    <select
                      className="form-select"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="INQUIRY">Gold/Diamond Inquiry</option>
                      <option value="CUSTOM_DESIGN">Custom Design / Order Status</option>
                      <option value="PRICE_ALERT">Gold Rate Drop Alert</option>
                      <option value="PAYMENT_REMINDER">Balance Payment Reminder</option>
                      <option value="FESTIVAL_GREETING">Festival Invitation</option>
                      <option value="GENERAL">General Relationship Call</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Follow-up Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.followUpDate}
                      onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Urgency Priority</label>
                  <select
                    className="form-select"
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                  >
                    <option value="LOW">🟢 Low</option>
                    <option value="MEDIUM">🟡 Medium</option>
                    <option value="HIGH">🟠 High</option>
                    <option value="CRITICAL">🔴 Critical</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label required">Purpose / Task Description</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Call regarding bridal necklace design approval"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Additional Notes</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} /> Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
