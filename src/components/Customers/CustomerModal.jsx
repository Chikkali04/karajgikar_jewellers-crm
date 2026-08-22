/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - COMPACT CUSTOMER ADD/EDIT MODAL
   (CustomerModal.jsx)
   ========================================================================== */

import React, { useState, useEffect, useRef } from 'react';
import { useCRM } from '../../context/CRMContext.jsx';
import { saveCustomer } from '../../services/customerService.js';
import {
  UserPlus,
  Camera,
  Upload,
  Trash2,
  X,
  Check,
  User,
  Phone,
  MapPin,
  Calendar,
  Tag,
  FileText
} from 'lucide-react';

export default function CustomerModal({ customerToEdit, isOpen, onClose }) {
  const { showToast, triggerRefresh } = useCRM();

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    mobile: '',
    email: '',
    city: 'Solapur',
    village: '',
    address: '',
    dateOfBirth: '',
    anniversaryDate: '',
    photoUrl: '',
    tags: '',
    notes: '',
    category: 'New'
  });

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [loading, setLoading] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (customerToEdit) {
      setFormData({
        ...customerToEdit,
        category: customerToEdit.category || 'New',
        tags: Array.isArray(customerToEdit.tags) ? customerToEdit.tags.join(', ') : (customerToEdit.tags || '')
      });
    } else {
      setFormData({
        id: '',
        name: '',
        mobile: '',
        email: '',
        city: 'Solapur',
        village: '',
        address: '',
        dateOfBirth: '',
        anniversaryDate: '',
        photoUrl: '',
        tags: '',
        notes: '',
        category: 'New'
      });
    }
    stopCamera();
  }, [customerToEdit, isOpen]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 480 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Camera access unavailable. You can upload a photo file below.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth, video.videoHeight) || 300;
    canvas.width = 300;
    canvas.height = 300;

    const ctx = canvas.getContext('2d');
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 300, 300);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    setFormData(prev => ({ ...prev, photoUrl: dataUrl }));
    stopCamera();
    showToast('Customer snapshot captured! 📸', 'success');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 300, 300);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setFormData(prev => ({ ...prev, photoUrl: dataUrl }));
        showToast('Photo uploaded successfully', 'success');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Please enter customer full name', 'warning');
      return;
    }
    if (!formData.mobile.trim()) {
      showToast('Please enter customer mobile number', 'warning');
      return;
    }

    try {
      setLoading(true);
      const tagArray = formData.tags
        ? (typeof formData.tags === 'string' ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : formData.tags)
        : [];

      await saveCustomer({
        ...formData,
        tags: tagArray
      });

      showToast(customerToEdit ? 'Customer profile updated successfully' : 'New customer registered successfully', 'success');
      triggerRefresh();
      handleClose();
    } catch (err) {
      console.error('Error saving customer:', err);
      showToast('Failed to save customer record. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Sticky Modal Header */}
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={20} /> {customerToEdit ? 'Edit Customer Profile' : 'Register New Customer'}
          </h3>
          <button className="btn btn-secondary btn-icon" onClick={handleClose} title="Close">
            <X size={16} />
          </button>
        </div>

        {/* Form with Scrollable Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            {/* Top Side-by-Side: Photo Capture + Core Info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 240px) 1fr', gap: '20px', marginBottom: '16px', alignItems: 'start' }}>
              
              {/* Photo & Camera Column */}
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '14px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-gold)' }}>
                  Customer Picture
                </span>

                {!isCameraActive ? (
                  <>
                    {formData.photoUrl ? (
                      <div className="photo-preview-box" style={{ width: '84px', height: '84px', margin: '4px auto' }}>
                        <img src={formData.photoUrl} alt="Preview" />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: '74px',
                          height: '74px',
                          borderRadius: '50%',
                          background: 'var(--color-gold-dim)',
                          border: '2px dashed var(--color-gold)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-gold)',
                          margin: '4px auto'
                        }}
                      >
                        <User size={32} />
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', marginTop: '4px' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                        onClick={startCamera}
                      >
                        <Camera size={13} /> Click Live Photo
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload size={13} /> Upload File
                      </button>

                      {formData.photoUrl && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--color-danger)', fontSize: '0.75rem', padding: '3px 6px' }}
                          onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ width: '100%' }}>
                    <div className="camera-box" style={{ maxWidth: '100%', height: '140px', margin: '0 0 8px' }}>
                      <video ref={videoRef} autoPlay playsInline muted />
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button type="button" className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={capturePhoto}>
                        <Camera size={12} /> Snap
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={stopCamera}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {cameraError && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-danger)', marginTop: '4px' }}>
                    {cameraError}
                  </span>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </div>

              {/* Core Contact Info Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label required">Full Customer Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Anand Shrikant Karajgikar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label required">Mobile Number (WhatsApp SMS)</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="10-digit mobile number"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    required
                  />
                </div>

                {/* Customer Category Radio Buttons */}
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label required">Customer Status Category *</label>
                  <div className="radio-pill-group">
                    {[
                      { id: 'New', label: '✨ New Walk-in' },
                      { id: 'Regular', label: '⭐ Regular' },
                      { id: 'VIP', label: '💎 VIP' },
                      { id: 'Inactive', label: '💤 Inactive' }
                    ].map((cat) => (
                      <label
                        key={cat.id}
                        className={`radio-pill ${formData.category === cat.id ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="customer-category-radio"
                          value={cat.id}
                          checked={formData.category === cat.id}
                          onChange={() => setFormData({ ...formData, category: cat.id })}
                        />
                        <span>{cat.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-row" style={{ gap: '10px' }}>
                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label">City / Town</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Solapur"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label">Village / Native Place</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Saraf Katta / Mohol"
                      value={formData.village}
                      onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Dates & Details */}
            <div className="form-row" style={{ marginBottom: '12px' }}>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label">Date of Birth (for automated wishes)</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label">Marriage Anniversary Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.anniversaryDate}
                  onChange={(e) => setFormData({ ...formData, anniversaryDate: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row" style={{ marginBottom: '12px' }}>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label">Email Address (Optional)</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="customer@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label">Customer Tags (comma separated)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. VIP, Bridal Gold, Regular"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">Postal / Residential Address</label>
              <input
                type="text"
                className="form-input"
                placeholder="Complete address in Solapur / district"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0' }}>
              <label className="form-label">Internal Showroom Notes</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: '65px' }}
                placeholder="Preferences (e.g. loves 22k Temple jewellery, preferred gold hallmark designs)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          {/* Sticky Modal Footer Actions */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Check size={16} /> {customerToEdit ? 'Update Customer Profile' : 'Save Customer Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
