import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/api';

interface ProfileModalProps {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [signature, setSignature] = useState(user?.signature || '');
  const [isDrawing, setIsDrawing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'draw' | 'upload'>('draw');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize canvas if user already has a signature and we are in 'draw' tab
  useEffect(() => {
    if (activeTab === 'draw' && signature && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Center and scale image inside canvas
          const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.9;
          const x = (canvas.width - img.width * scale) / 2;
          const y = (canvas.height - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        };
        img.src = signature;
      }
    }
  }, [activeTab, signature]);

  // Handle drawing events
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    // Check if touch event
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e3a8a'; // Premium dark blue ink color
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    // Export signature as base64 string
    saveCanvasToState();
  };

  const saveCanvasToState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Check if canvas is empty
    const isEmpty = isCanvasEmpty(canvas);
    if (!isEmpty) {
      const dataUrl = canvas.toDataURL('image/png');
      setSignature(dataUrl);
    } else {
      setSignature('');
    }
  };

  const isCanvasEmpty = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return true;
    const buffer = new Uint32Array(ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
    return !buffer.some(color => color !== 0);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignature('');
  };

  // Handle Image Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG/JPG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSignature(dataUrl);
      setError('');
    };
    reader.onerror = () => {
      setError('Failed to read signature file');
    };
    reader.readAsDataURL(file);
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const res = await authApi.updateProfile({
        name: name.trim(),
        signature: signature || undefined,
      });
      // Update local context
      updateUser({
        name: res.data.name,
        signature: res.data.signature,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save profile details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.4)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: '"Space Grotesk", sans-serif'
    }}>
      <div className="card modal-card" style={{
        width: '100%',
        maxWidth: 480,
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        padding: '1.75rem',
        border: '3px solid #000000',
        borderRadius: 12,
        boxShadow: '6px 6px 0px #000000',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer',
            color: '#1a1a18',
            fontWeight: 'bold',
          }}
        >
          ✕
        </button>

        <h3 style={{
          fontSize: 18,
          fontWeight: 800,
          marginBottom: '1.25rem',
          fontFamily: '"Outfit", sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
        }}>
          My Profile & Signature
        </h3>

        {success && (
          <div className="alert-success" style={{ marginBottom: '1.25rem' }}>
            ✓ Profile and signature updated successfully!
          </div>
        )}

        {error && (
          <div className="alert-error" style={{ marginBottom: '1.25rem' }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* User Details */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: 'block' }}>Display Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #000000',
                borderRadius: 6,
                fontWeight: 600,
                outline: 'none',
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: 'block' }}>Email Address</label>
            <input
              value={user?.email}
              disabled
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #cbd5e1',
                background: '#f8fafc',
                color: '#64748b',
                borderRadius: 6,
                fontWeight: 600,
                outline: 'none',
              }}
            />
            <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>Email cannot be changed.</span>
          </div>

          {/* Signature Selection Tabs */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, display: 'block' }}>Authorized Signature</label>
            
            <div style={{
              display: 'flex',
              border: '2px solid #000000',
              borderRadius: 6,
              overflow: 'hidden',
              marginBottom: 12
            }}>
              <button
                type="button"
                onClick={() => setActiveTab('draw')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: 'none',
                  background: activeTab === 'draw' ? '#ffdc58' : '#ffffff',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  borderRight: '2px solid #000000',
                  outline: 'none',
                }}
              >
                ✏ Draw Signature
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: 'none',
                  background: activeTab === 'upload' ? '#ffdc58' : '#ffffff',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                📤 Upload PNG Image
              </button>
            </div>

            {/* Tab: Draw */}
            {activeTab === 'draw' && (
              <div>
                <div style={{
                  border: '2.5px dashed #1a1a18',
                  borderRadius: 8,
                  background: '#fcfbf9',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={{
                      width: '100%',
                      height: 160,
                      display: 'block',
                      cursor: 'crosshair',
                      touchAction: 'none',
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 6,
                    right: 6,
                    display: 'flex',
                    gap: 6
                  }}>
                    <button
                      type="button"
                      onClick={clearCanvas}
                      style={{
                        padding: '4px 10px',
                        border: '2px solid #000000',
                        borderRadius: 4,
                        background: '#ffffff',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '2px 2px 0px #000000',
                      }}
                    >
                      Clear Pad
                    </button>
                  </div>
                  {!signature && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                      color: '#9ca3af',
                      fontSize: 13,
                      fontWeight: 500,
                    }}>
                      Sign here using mouse or touch screen
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Upload */}
            {activeTab === 'upload' && (
              <div style={{
                border: '2.5px dashed #1a1a18',
                borderRadius: 8,
                background: '#fcfbf9',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                minHeight: 160,
              }}>
                {signature ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      height: 60,
                      border: '1px solid #e2e8f0',
                      padding: 6,
                      background: '#ffffff',
                      borderRadius: 4
                    }}>
                      <img src={signature} alt="Uploaded Signature" style={{ height: '100%', objectFit: 'contain' }} />
                    </div>
                    <button
                      type="button"
                      onClick={() => setSignature('')}
                      style={{
                        padding: '4px 10px',
                        border: '2px solid #000000',
                        borderRadius: 4,
                        background: '#ffffff',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '2px 2px 0px #000000',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: '8px 16px',
                        border: '2px solid #000000',
                        borderRadius: 6,
                        background: '#ffdc58',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '3px 3px 0px #000000',
                        marginBottom: 8,
                      }}
                    >
                      Select Signature Image
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                      Recommended: Transparent PNG or crisp white background.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: '1.75rem' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                padding: '10px 16px',
                border: '2px solid #000000',
                borderRadius: 6,
                background: '#ff90e8', // Brutalist Pink
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: '3px 3px 0px #000000',
                outline: 'none',
              }}
            >
              {saving ? 'Saving...' : 'Save Profile & Signature'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px',
                border: '2px solid #000000',
                borderRadius: 6,
                background: '#ffffff',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: '3px 3px 0px #000000',
                outline: 'none',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
