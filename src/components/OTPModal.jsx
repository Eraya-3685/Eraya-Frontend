import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, RefreshCcw, X, Mail } from 'lucide-react';
import OTPInput from './OTPInput';

const C = {
  t900: '#0d1117', t700: '#1f2937', t500: '#6b7280', t300: '#adb5bd',
  bSoft: 'rgba(0,0,0,0.07)', bMed: 'rgba(0,0,0,0.12)',
  bgCard: '#ffffff', bgPage: '#edf0f4', bgMuted: '#f3f5f8',
  lime: '#cbff00', blue: '#3b82f6', rose: '#f43f5e', amber: '#f59e0b',
  rSm: '0.85rem', rMd: '1.25rem', rLg: '1.5rem', r2xl: '2.5rem'
};

const maskEmail = (email) => {
  if (!email) return '';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user}***@${domain}`;
  return `${user.substring(0, 2)}***@${domain}`;
};

const OTPModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  email, 
  loading, 
  onResend, 
  title = "Verify Identity",
  description = "A 6-digit verification code has been sent to your email."
}) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setDigits(['', '', '', '', '', '']);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0 || !onResend) return;
    setResendLoading(true);
    try {
      await onResend();
      setResendCooldown(60);
    } finally {
      setResendLoading(false);
    }
  };

  const otpValue = digits.join('');

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(13,17,23,0.6)', backdropFilter: 'blur(12px)' }}
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        style={{
          position: 'relative', background: '#fff', borderRadius: C.r2xl,
          boxShadow: '0 30px 60px -12px rgba(0,0,0,0.3)',
          width: '100%', maxWidth: 420, overflow: 'hidden', border: `1px solid ${C.bSoft}`
        }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: C.t300, cursor: 'pointer' }}>
          <X size={20} />
        </button>

        <div style={{ padding: '3rem 2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ 
              width: 80, height: 80, background: '#eff6ff', borderRadius: '1.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.blue, margin: '0 auto 1.5rem', position: 'relative'
            }}>
              <ShieldCheck size={40} />
              <div style={{ position: 'absolute', top: -5, right: -5, width: 20, height: 20, background: '#10b981', borderRadius: '50%', border: '4px solid #fff' }} />
            </div>
            
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: C.t900, margin: '0 0 0.5rem', letterSpacing: '-0.03em' }}>{title}</h3>
            <p style={{ fontSize: '0.85rem', color: C.t500, fontWeight: 500, lineHeight: 1.6, margin: '0 auto', maxWidth: 300 }}>{description}</p>

            {email && (
              <div style={{ 
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem', 
                padding: '0.5rem 1rem', background: C.bgMuted, borderRadius: '0.75rem', 
                marginTop: '1.5rem', border: `1px solid ${C.bSoft}` 
              }}>
                <Mail size={14} color={C.t300} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: C.t700, fontFamily: 'monospace' }}>
                  {maskEmail(email)}
                </span>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '2.5rem' }}>
            <OTPInput
              value={digits}
              onChange={setDigits}
              focusColor={C.t900}
              autoFocus={isOpen}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button 
              onClick={() => onConfirm(otpValue)}
              disabled={loading || otpValue.length < 6}
              style={{
                width: '100%', padding: '1.1rem', borderRadius: C.rMd,
                background: C.t900, color: '#fff', border: 'none',
                fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                opacity: (loading || otpValue.length < 6) ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
            >
              {loading ? <RefreshCcw size={18} className="animate-spin" /> : 'Verify & Proceed'}
            </button>
            
            {onResend && (
              <button 
                onClick={handleResend}
                disabled={resendCooldown > 0 || resendLoading}
                style={{
                  background: 'none', border: 'none', fontSize: '0.75rem', fontWeight: 700,
                  color: resendCooldown > 0 ? C.t300 : C.blue, cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                {resendLoading ? (
                  <RefreshCcw size={14} className="animate-spin" />
                ) : resendCooldown > 0 ? (
                  `Resend code in ${resendCooldown}s`
                ) : (
                  "Didn't receive code? Resend"
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OTPModal;
