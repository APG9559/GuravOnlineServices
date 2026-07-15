import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/api';
import styles from './ProfileModal.module.css';

interface ProfileModalProps {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [signature, setSignature] = useState(user?.signature || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isDrawing, setIsDrawing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'draw' | 'upload'>('draw');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Handle Profile Picture Upload
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG/JPG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Profile picture size must be less than 5 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAvatar(dataUrl);
      setError('');
    };
    reader.onerror = () => {
      setError('Failed to read profile picture');
    };
    reader.readAsDataURL(file);
  };

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

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
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
    return !buffer.some((color) => color !== 0);
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
        avatar: avatar,
      });
      // Update local context
      updateUser({
        name: res.data.name,
        signature: res.data.signature,
        avatar: res.data.avatar,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(errObj?.response?.data?.message || 'Failed to save profile details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={`card modal-card ${styles.modalCard}`}>
        {/* Close Button */}
        <button onClick={onClose} className={styles.closeBtn}>
          ✕
        </button>

        <h3 className={styles.title}>My Profile & Signature</h3>

        {success && (
          <div className={`alert-success ${styles.alert}`}>
            ✓ Profile and signature updated successfully!
          </div>
        )}

        {error && <div className={`alert-error ${styles.alert}`}>⚠ {error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Profile Picture */}
          <div className={styles.avatarSection}>
            <label className={styles.avatarLabel}>Profile Picture</label>
            <div
              className={styles.avatarWrapper}
              onClick={() => avatarInputRef.current?.click()}
              title="Click to change photo"
            >
              {avatar ? (
                <img src={avatar} alt="Avatar Preview" className={styles.avatarWrapperImg} />
              ) : (
                <div className={styles.avatarFallback}>
                  {name ? name[0].toUpperCase() : 'U'}
                </div>
              )}
            </div>
            <div className={styles.avatarButtons}>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className={styles.avatarBtn}
              >
                Change Photo
              </button>
              {avatar && (
                <button
                  type="button"
                  onClick={() => setAvatar('')}
                  className={styles.avatarRemoveBtn}
                >
                  Remove
                </button>
              )}
            </div>
            <input
              type="file"
              ref={avatarInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
              className={styles.fileInput}
            />
          </div>

          {/* User Details */}
          <div className={`form-group ${styles.formGroup}`}>
            <label className={styles.fieldLabel}>Display Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className={styles.input}
            />
          </div>

          <div className={`form-group ${styles.formGroupEmail}`}>
            <label className={styles.fieldLabel}>Email Address</label>
            <input value={user?.email} disabled className={styles.inputEmail} />
            <span className={styles.emailHint}>Email cannot be changed.</span>
          </div>

          {/* Signature Selection Tabs */}
          <div className={styles.signatureSection}>
            <label className={styles.signatureLabel}>Authorized Signature</label>

            <div className={styles.tabContainer}>
              <button
                type="button"
                onClick={() => setActiveTab('draw')}
                className={`${styles.tabBtn} ${styles.tabBtnFirst}`}
                style={{ background: activeTab === 'draw' ? '#ffdc58' : '#ffffff' }}
              >
                ✏ Draw Signature
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={styles.tabBtn}
                style={{ background: activeTab === 'upload' ? '#ffdc58' : '#ffffff' }}
              >
                📤 Upload PNG Image
              </button>
            </div>

            {/* Tab: Draw */}
            {activeTab === 'draw' && (
              <div>
                <div className={styles.canvasArea}>
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
                    className={styles.canvas}
                  />
                  <div className={styles.canvasToolbar}>
                    <button type="button" onClick={clearCanvas} className={styles.clearBtn}>
                      Clear Pad
                    </button>
                  </div>
                  {!signature && (
                    <div className={styles.canvasPlaceholder}>
                      Sign here using mouse or touch screen
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Upload */}
            {activeTab === 'upload' && (
              <div className={styles.uploadArea}>
                {signature ? (
                  <div className={styles.previewContainer}>
                    <div className={styles.previewBox}>
                      <img
                        src={signature}
                        alt="Uploaded Signature"
                        className={styles.previewImage}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setSignature('')}
                      className={styles.clearBtn}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className={styles.uploadCenter}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={styles.uploadBtn}
                    >
                      Select Signature Image
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className={styles.fileInput}
                    />
                    <p className={styles.uploadHint}>
                      Recommended: Transparent PNG or crisp white background.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className={styles.formActions}>
            <button type="submit" disabled={saving} className={styles.saveBtn}>
              {saving ? 'Saving...' : 'Save Profile & Signature'}
            </button>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
