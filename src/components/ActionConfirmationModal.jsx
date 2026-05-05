import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, AlertCircle, X } from 'lucide-react';

const C = {
  t900: '#0d1117', t700: '#1f2937', t500: '#6b7280', t300: '#adb5bd',
  bSoft: 'rgba(0,0,0,0.07)', bMed: 'rgba(0,0,0,0.12)',
  bgCard: '#ffffff', bgPage: '#edf0f4', bgMuted: '#f3f5f8',
  lime: '#cbff00', blue: '#3b82f6', rose: '#f43f5e', amber: '#f59e0b',
  rSm: '0.85rem', rMd: '1.25rem', rLg: '1.5rem', r2xl: '2.5rem'
};

const ActionConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  confirmText = "Proceed & Send OTP",
  icon: Icon = Mail,
  type = "info" 
}) => {
  if (!isOpen) return null;

  const themes = {
    info:    { color: C.blue,  bg: '#eff6ff' },
    warning: { color: C.amber, bg: '#fffbeb' },
    danger:  { color: C.rose,  bg: '#fff1f2' },
    success: { color: '#10b981', bg: '#ecfdf5' }
  };

  const theme = themes[type] || themes.info;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(13,17,23,0.4)', backdropFilter: 'blur(8px)' }}
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        style={{
          position: 'relative', background: '#fff', borderRadius: C.r2xl,
          boxShadow: '0 30px 60px -12px rgba(0,0,0,0.25)',
          width: '100%', maxWidth: 400, overflow: 'hidden', border: `1px solid ${C.bSoft}`
        }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: C.t300, cursor: 'pointer' }}>
          <X size={20} />
        </button>

        <div style={{ padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ 
              width: 64, height: 64, background: theme.bg, borderRadius: '1.25rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: theme.color, margin: '0 auto 1.5rem'
            }}>
              <Icon size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: C.t900, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>{title}</h3>
            <p style={{ fontSize: '0.85rem', color: C.t500, fontWeight: 500, lineHeight: 1.6, margin: 0 }}>
              {description}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '1rem', borderRadius: C.rMd, background: C.bgMuted,
              border: 'none', color: C.t700, fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer'
            }}>
              Cancel
            </button>
            <button onClick={onConfirm} style={{
              flex: 2, padding: '1rem', borderRadius: C.rMd, background: C.t900,
              border: 'none', color: '#fff', fontSize: '0.8rem', fontWeight: 800,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}>
              <ShieldCheck size={16} /> {confirmText}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ActionConfirmationModal;
