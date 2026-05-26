import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X, Eye, EyeOff, RefreshCcw, Lock } from 'lucide-react';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Confirmation',
  message = 'This action cannot be undone. Please enter your password to confirm.',
  confirmText = 'Delete Permanently',
  cancelText = 'Cancel',
}) => {
  const { user } = useAuthStore();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');

  // Clear fields when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setError('');
      setShowPassword(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (validating) return;
    setPassword('');
    setError('');
    setShowPassword(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Password is required');
      return;
    }
    setValidating(true);
    setError('');
    try {
      // Validate by logging in with the current user's email
      await api.post('/users/login', {
        identifier: user?.email,
        password: password
      });

      // Password is correct, proceed with confirm
      await onConfirm();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Incorrect password. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: 'relative', zIndex: 1, background: '#fff', borderRadius: '2rem', border: '1px solid rgba(0, 0, 0, 0.05)', boxShadow: '0 30px 70px -10px rgba(15, 23, 42, 0.18)', width: '100%', maxWidth: 400, overflow: 'hidden' }}
          >
            {/* Form Wrapper */}
            <form onSubmit={handleSubmit}>
              {/* Body */}
              <div style={{ padding: '2rem' }}>
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '1rem', background: '#fff1f2', border: '1.5px solid #fecdd3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Trash2 style={{ width: 20, height: 20, color: '#f43f5e' }} />
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={validating}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: '#f8fafc', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', transition: 'background .15s', opacity: validating ? 0.4 : 1 }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                  >
                    <X style={{ width: 14, height: 14 }} />
                  </button>
                </div>

                {/* Info Text */}
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
                  {title}
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, margin: '0 0 1.5rem', lineHeight: 1.5 }}>
                  {message}
                </p>

                {/* Password Input Block */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Confirm Admin Password
                  </label>
                  
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock style={{ position: 'absolute', left: '1rem', width: 16, height: 16, color: '#94a3b8' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError('');
                      }}
                      disabled={validating}
                      required
                      placeholder="Enter your account password"
                      style={{
                        width: '100%',
                        background: '#f8f9fc',
                        border: error ? '1.5px solid #fecdd3' : '1px solid #f1f5f9',
                        borderRadius: '0.85rem',
                        padding: '0.8rem 2.75rem 0.8rem 2.5rem',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.15s ease'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={validating}
                      style={{ position: 'absolute', right: '0.85rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', padding: 4 }}
                    >
                      {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                    </button>
                  </div>

                  {/* Error Prompt */}
                  {error && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#e11d48', marginTop: '0.15rem' }}>
                      {error}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div style={{ padding: '1rem 1.5rem 1.5rem', display: 'flex', gap: '0.75rem', borderTop: '1px solid #f8fafc', background: '#f8fafc' }}>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={validating}
                  style={{ flex: 1, padding: '0.75rem 1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 800, color: '#475569', cursor: 'pointer', transition: 'all 0.15s', opacity: validating ? 0.5 : 1 }}
                >
                  {cancelText}
                </button>

                <button
                  type="submit"
                  disabled={validating}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    background: '#f43f5e',
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#fff',
                    cursor: validating ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                    opacity: validating ? 0.8 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 12px rgba(244, 63, 94, 0.15)'
                  }}
                >
                  {validating ? (
                    <>
                      <RefreshCcw style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />
                      Verifying...
                    </>
                  ) : (
                    confirmText
                  )}
                </button>
              </div>
            </form>
          </motion.div>

          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmModal;
