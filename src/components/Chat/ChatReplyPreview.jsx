import React from 'react';
import { X } from 'lucide-react';

const C = {
  t900: '#0d1117', t700: '#1f2937', t500: '#6b7280', t300: '#adb5bd',
  bSoft: 'rgba(0,0,0,0.07)', bMed: 'rgba(0,0,0,0.12)',
  bgCard: '#ffffff', bgPage: '#edf0f4', bgMuted: '#f3f5f8',
  lime: '#cbff00', blue: '#3b82f6', rose: '#f43f5e', amber: '#f59e0b',
  rSm: '0.85rem', rMd: '1.25rem', rLg: '1.5rem', r2xl: '2.5rem'
};

const ChatReplyPreview = ({ replyingTo, onClear, isAdminView }) => {
  if (!replyingTo) return null;

  return (
    <div style={{
      marginBottom: '0.75rem', padding: '0.75rem', background: C.bgMuted, 
      borderRadius: C.rMd, display: 'flex', alignItems: 'center', 
      justifyContent: 'space-between', border: `1px solid ${C.bSoft}`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
        <div style={{ width: 3, height: 24, background: C.t900, borderRadius: '1rem', shrink: 0 }} />
        <div style={{ overflow: 'hidden' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 800, color: C.t300, margin: '0 0 0.1rem 0' }}>
            Replying to {!isAdminView && replyingTo.sender_id !== 0 ? 'Support' : replyingTo.sender_name}
          </p>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: C.t700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {replyingTo.message_text}
          </p>
        </div>
      </div>
      <button
        onClick={onClear}
        style={{ 
          background: 'none', border: 'none', color: C.t500, cursor: 'pointer', 
          padding: '0.25rem', display: 'flex', alignItems: 'center' 
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default ChatReplyPreview;
