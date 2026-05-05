import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Trash2, X, RefreshCcw } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title      = 'Are you sure?',
  message    = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText  = 'Cancel',
  loading    = false,
  variant    = 'danger',
}) => {
  const isDanger = variant === 'danger';

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem' }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => !loading && onClose()}
            style={{ position:'absolute', inset:0, background:'rgba(13,17,23,0.45)', backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)' }}
          />

          {/* Modal card */}
          <motion.div
            initial={{ opacity:0, scale:0.94, y:16 }}
            animate={{ opacity:1, scale:1,    y:0  }}
            exit={{ opacity:0,   scale:0.94, y:16 }}
            transition={{ duration:0.2, ease:[0.22,1,0.36,1] }}
            style={{ position:'relative', zIndex:1, background:'#fff', borderRadius:'2rem', border:'1px solid rgba(0,0,0,0.07)', boxShadow:'0 32px 80px -16px rgba(0,0,0,0.18)', width:'100%', maxWidth:400, overflow:'hidden' }}
          >
            {/* Body */}
            <div style={{ padding:'2rem' }}>
              {/* Top row — icon + close */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem' }}>
                <div style={{
                  width:56, height:56, borderRadius:'1.25rem',
                  background: isDanger ? '#fff1f2' : '#f0f9ff',
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                  border: isDanger ? '1.5px solid #fecdd3' : '1.5px solid #bae6fd',
                }}>
                  {isDanger
                    ? <Trash2  style={{ width:24, height:24, color:'#f43f5e' }} />
                    : <AlertCircle style={{ width:24, height:24, color:'#3b82f6' }} />
                  }
                </div>
                <button
                  onClick={() => !loading && onClose()}
                  disabled={loading}
                  style={{ width:36, height:36, borderRadius:'50%', background:'#f3f5f8', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', transition:'background .15s', flexShrink:0, opacity:loading?0.4:1 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#eaeef2'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f3f5f8'}
                >
                  <X style={{ width:16, height:16 }} />
                </button>
              </div>

              {/* Title + message */}
              <h2 style={{ fontSize:'1.25rem', fontWeight:800, color:'#0d1117', margin:'0 0 0.5rem', letterSpacing:'-0.03em', lineHeight:1.2 }}>
                {title}
              </h2>
              <p style={{ fontSize:'0.85rem', color:'#6b7280', fontWeight:500, margin:0, lineHeight:1.65 }}>
                {message}
              </p>
            </div>

            {/* Footer */}
            <div style={{ padding:'1.25rem 2rem 2rem', display:'flex', gap:'0.75rem' }}>
              {/* Cancel */}
              <button
                onClick={() => !loading && onClose()}
                disabled={loading}
                style={{ flex:1, padding:'0.8rem 1rem', background:'#f3f5f8', border:'1.5px solid #edf0f4', borderRadius:'0.875rem', fontSize:'0.78rem', fontWeight:700, color:'#4b5563', cursor:'pointer', fontFamily:'inherit', transition:'all .15s', opacity:loading?0.5:1 }}
                onMouseEnter={e => { e.currentTarget.style.background='#eaeef2'; e.currentTarget.style.borderColor='#d1d5db'; }}
                onMouseLeave={e => { e.currentTarget.style.background='#f3f5f8'; e.currentTarget.style.borderColor='#edf0f4'; }}
              >
                {cancelText}
              </button>

              {/* Confirm */}
              <button
                onClick={onConfirm}
                disabled={loading}
                style={{
                  flex:1, padding:'0.8rem 1rem',
                  background: isDanger ? '#f43f5e' : '#0d1117',
                  border: 'none',
                  borderRadius:'0.875rem',
                  fontSize:'0.78rem', fontWeight:700,
                  color:'#fff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily:'inherit',
                  transition:'background .15s, opacity .15s',
                  opacity: loading ? 0.7 : 1,
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem',
                }}
                onMouseEnter={e => { if(!loading) e.currentTarget.style.background = isDanger ? '#e11d48' : '#1e293b'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isDanger ? '#f43f5e' : '#0d1117'; }}
              >
                {loading
                  ? <><RefreshCcw style={{ width:14, height:14, animation:'spin 0.8s linear infinite' }} /> Processing…</>
                  : confirmText
                }
              </button>
            </div>
          </motion.div>

          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
