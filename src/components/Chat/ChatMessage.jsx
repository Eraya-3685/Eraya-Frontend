import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Send, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useChatStore from '../../store/useChatStore';

const C = {
  t900: '#0d1117', t700: '#1f2937', t500: '#6b7280', t300: '#adb5bd',
  bSoft: 'rgba(0,0,0,0.07)', bMed: 'rgba(0,0,0,0.12)',
  bgCard: '#ffffff', bgPage: '#edf0f4', bgMuted: '#f3f5f8',
  lime: '#cbff00', blue: '#3b82f6', rose: '#f43f5e', amber: '#f59e0b',
  rSm: '0.85rem', rMd: '1.25rem', rLg: '1.5rem', r2xl: '2.5rem'
};

const ChatMessage = ({ msg, isMe, onReply, showName, isAdminView, setConfirmModal, isSelectionMode, isSelected, onSelect }) => {
  const { deleteMessage, setEditingMessage } = useChatStore();
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div 
      style={{ 
        display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', position: 'relative',
        padding: isSelectionMode ? '0.5rem 1rem' : '0.25rem 0',
        borderRadius: isSelectionMode ? C.rMd : 0,
        background: isSelectionMode && isSelected ? 'rgba(59,130,246,0.05)' : 'transparent',
        cursor: isSelectionMode ? 'pointer' : 'default'
      }}
      onClick={() => isSelectionMode && onSelect(msg.id)}
    >
      {isSelectionMode && (
        <div style={{ 
          width: 20, height: 20, borderRadius: '50%', border: `2px solid ${isSelected ? C.blue : C.bMed}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? C.blue : '#fff',
          flexShrink: 0
        }}>
          {isSelected && <div style={{ width: 6, height: 6, background: '#fff', borderRadius: '50%' }} />}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', flex: 1, minWidth: 0 }}>
        <div style={{ 
          display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', 
          maxWidth: isAdminView ? '75%' : '85%', minWidth: 0, position: 'relative' 
        }}>
          {/* Reply Icon */}
          {!isSelectionMode && (
            <button
              onClick={() => onReply(msg)}
              className="reply-btn"
              style={{
                position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                [isMe ? 'left' : 'right']: '-2.5rem', width: 30, height: 30, borderRadius: '50%',
                background: '#fff', border: `1px solid ${C.bSoft}`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: C.t500, cursor: 'pointer', opacity: 0, transition: '0.2s'
              }}
            >
              <Send size={12} style={{ transform: isMe ? 'rotate(180deg)' : 'none' }} />
            </button>
          )}

          {msg.reply_to_id && (
            <div style={{ 
              marginBottom: '0.25rem', padding: '0.4rem 0.75rem', borderRadius: C.rSm, 
              background: 'rgba(0,0,0,0.04)', borderLeft: `3px solid ${C.bMed}`, 
              fontSize: '0.65rem', color: C.t500, fontStyle: 'italic', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {msg.reply_to_text}
            </div>
          )}

          <div style={{ 
            padding: '0.85rem 1.25rem', borderRadius: C.rMd, fontSize: '0.8rem', fontWeight: 600,
            lineHeight: 1.5, position: 'relative',
            background: isMe ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : '#fff',
            color: isMe ? '#fff' : C.t700,
            border: isMe ? 'none' : `1px solid ${C.bSoft}`,
            borderBottomRightRadius: isMe ? '0.25rem' : C.rMd,
            borderBottomLeftRadius: isMe ? C.rMd : '0.25rem',
            boxShadow: isMe ? '0 10px 25px -5px rgba(79, 70, 229, 0.3)' : '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '0.75rem' }}>
              <span style={{ wordBreak: 'break-word', flex: 1 }}>{msg.message_text}</span>
              <span style={{ fontSize: '0.6rem', opacity: 0.5, fontWeight: 700, whiteSpace: 'nowrap', marginTop: '0.15rem' }}>
                {msg.status === 'sending' ? 'Sending...' : format(new Date(msg.created_at || new Date()), 'hh:mm a')}
              </span>
            </div>
          </div>

          {isAdminView && isMe && (
            <div style={{ position: 'absolute', top: 0, [isMe ? 'right' : 'left']: '100%', margin: '0 0.5rem', opacity: 0, transition: '0.2s' }} className="msg-controls">
              <button onClick={() => setShowMenu(!showMenu)} style={{ background: '#fff', border: `1px solid ${C.bSoft}`, borderRadius: '50%', padding: '0.4rem', cursor: 'pointer' }}>
                <MoreVertical size={14} color={C.t500} />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    style={{ position: 'absolute', top: 0, [isMe ? 'right' : 'left']: '100%', margin: '0 0.5rem', width: 120, background: '#fff', borderRadius: C.rSm, boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: `1px solid ${C.bSoft}`, overflow: 'hidden', zIndex: 10 }}>
                    <button onClick={() => { setEditingMessage(msg); setShowMenu(false); }} style={{ width: '100%', padding: '0.6rem 1rem', background: 'none', border: 'none', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <Pencil size={12} /> Edit
                    </button>
                    <button onClick={() => { setConfirmModal({ show: true, title: 'Delete?', message: 'Remove message?', onConfirm: () => deleteMessage(msg.id) }); setShowMenu(false); }} style={{ width: '100%', padding: '0.6rem 1rem', background: 'none', border: 'none', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: C.rose, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <Trash2 size={12} /> Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {showName && (
            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: C.t300, marginTop: '0.25rem' }}>
              {!isAdminView && !isMe ? 'Eraya Support' : msg.sender_name}
            </span>
          )}
        </div>
      </div>
      <style>{`
        .group/msg:hover .reply-btn { opacity: 1 !important; }
        .group/msg:hover .msg-controls { opacity: 1 !important; }
      `}</style>
    </div>
  );
};

export const DateSeparator = ({ date }) => {
  const msgDate = new Date(date);
  let label = isToday(msgDate) ? 'Today' : isYesterday(msgDate) ? 'Yesterday' : format(msgDate, 'MMMM d, yyyy');
  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '1.5rem 0' }}>
      <span style={{ padding: '0.35rem 0.75rem', background: C.bgMuted, color: C.t300, fontSize: '0.65rem', fontWeight: 800, borderRadius: '1rem' }}>
        {label}
      </span>
    </div>
  );
};

export default ChatMessage;
