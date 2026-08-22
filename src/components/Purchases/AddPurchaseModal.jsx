/* ==========================================================================
   KARAJGIKAR JEWELLERS CRM - RECORD PURCHASE WITH PRODUCT IMAGE
   (AddPurchaseModal.jsx)
   ========================================================================== */

import React, { useState, useEffect, useRef } from 'react';
import { useCRM } from '../../context/CRMContext.jsx';
import { getAllCustomers } from '../../services/customerService.js';
import { addPurchase } from '../../services/purchaseService.js';
import { ShoppingBag, X, Check, Camera, Upload, Trash2, Image as ImageIcon } from 'lucide-react';

export default function AddPurchaseModal({ isOpen, onClose, defaultCustomerId = null }) {
  const { showToast, triggerRefresh, activeCustomerProfileId } = useCRM();
  const [customers, setCustomers] = useState([]);

  const targetCustId = defaultCustomerId || activeCustomerProfileId || '';

  const [customerId, setCustomerId] = useState('');
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Gold');
  const [amount, setAmount] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [productImageUrl, setProductImageUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Camera & Image Upload state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function load() {
      const data = await getAllCustomers();
      setCustomers(data);
      if (targetCustId) {
        setCustomerId(targetCustId);
      } else if (data.length > 0 && !customerId) {
        setCustomerId(data[0].id);
      }
    }
    if (isOpen) {
      load();
    }
  }, [isOpen, targetCustId]);

  // Reset fields on modal open
  useEffect(() => {
    if (isOpen) {
      setProductName('');
      setCategory('Gold');
      setAmount('');
      setPurchaseDate(new Date().toISOString().slice(0, 10));
      setProductImageUrl('');
      setNotes('');
      if (targetCustId) {
        setCustomerId(targetCustId);
      }
    }
    stopCamera();
  }, [isOpen, targetCustId]);

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
        video: { width: { ideal: 480 }, height: { ideal: 480 }, facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Camera unavailable. You can upload an image file instead.');
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
    setProductImageUrl(dataUrl);
    stopCamera();
    showToast('Product photo captured! 📸', 'success');
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
        setProductImageUrl(dataUrl);
        showToast('Product image uploaded', 'success');
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
    if (!customerId) {
      showToast('Please select a customer', 'warning');
      return;
    }
    if (!productName.trim()) {
      showToast('Please enter product description', 'warning');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      showToast('Please enter a valid purchase amount (₹)', 'warning');
      return;
    }
    if (!purchaseDate) {
      showToast('Please select a transaction date', 'warning');
      return;
    }

    try {
      setLoading(true);
      const selectedCust = customers.find(c => c.id === customerId);

      await addPurchase({
        customerId: customerId,
        customerName: selectedCust ? selectedCust.name : '',
        customerMobile: selectedCust ? selectedCust.mobile : '',
        productName: productName.trim(),
        category: category,
        amount: Number(amount),
        purchaseDate: purchaseDate,
        productImageUrl: productImageUrl || '',
        notes: notes.trim()
      });

      showToast('Purchase recorded successfully! ✨', 'success');
      triggerRefresh();
      handleClose();
    } catch (err) {
      console.error('Error saving purchase record:', err);
      showToast(err.message || 'Failed to record purchase.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} /> Record Jewellery Purchase
          </h3>
          <button className="btn btn-secondary btn-icon" onClick={handleClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            {/* Top Side-by-Side: Product Photo + Basic Info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(160px, 190px) 1fr', gap: '16px', marginBottom: '16px', alignItems: 'start' }}>
              
              {/* Product Photo Box */}
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '12px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--color-gold)' }}>
                  Product / Ornament Picture
                </span>

                {!isCameraActive ? (
                  <>
                    {productImageUrl ? (
                      <div className="photo-preview-box" style={{ width: '80px', height: '80px', margin: '2px auto' }}>
                        <img src={productImageUrl} alt="Product Preview" />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: '70px',
                          height: '70px',
                          borderRadius: 'var(--border-radius-sm)',
                          background: 'var(--color-gold-dim)',
                          border: '2px dashed var(--color-gold)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-gold)',
                          margin: '2px auto'
                        }}
                      >
                        <ImageIcon size={28} />
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%', marginTop: '2px' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        onClick={startCamera}
                      >
                        <Camera size={12} /> Click Photo
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload size={12} /> Upload File
                      </button>

                      {productImageUrl && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--color-danger)', fontSize: '0.72rem', padding: '2px 4px' }}
                          onClick={() => setProductImageUrl('')}
                        >
                          <Trash2 size={11} /> Remove
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ width: '100%' }}>
                    <div className="camera-box" style={{ maxWidth: '100%', height: '120px', margin: '0 0 6px' }}>
                      <video ref={videoRef} autoPlay playsInline muted />
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button type="button" className="btn btn-primary btn-sm" style={{ flex: 1, fontSize: '0.75rem' }} onClick={capturePhoto}>
                        <Camera size={11} /> Snap
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }} onClick={stopCamera}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {cameraError && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-danger)', marginTop: '2px' }}>
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

              {/* Core Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label required">Select Customer *</label>
                  <select
                    className="form-select"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    required
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.id}) {c.mobile ? `- ${c.mobile}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label required">Product Name / Description *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Gold Necklace, Diamond Ring, Gold Coins"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Metal Category & Amount Row */}
            <div className="form-row" style={{ marginBottom: '14px' }}>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label required">Metal Category *</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="Gold">Gold (22K / 24K / 18K)</option>
                  <option value="Silver">Silver (999 / Utensils)</option>
                  <option value="Diamond">Diamond Jewellery</option>
                  <option value="Platinum">Platinum</option>
                  <option value="Other">Other Antique / Gemstone</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label required">Amount (INR ₹) *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gold)', fontWeight: 700 }}>
                    ₹
                  </span>
                  <input
                    type="number"
                    className="form-input"
                    style={{ paddingLeft: '28px', fontWeight: 700, color: 'var(--color-gold)', fontSize: '1rem' }}
                    placeholder="e.g. 52000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Purchase Date */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label required">Purchase Date *</label>
              <input
                type="date"
                className="form-input"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
              />
            </div>

            {/* Purchase Notes */}
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label className="form-label">Purchase Notes (Optional)</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: '60px' }}
                placeholder="design details, custom order reference, weight, hallmark stamp"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Check size={16} /> Save Purchase
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
