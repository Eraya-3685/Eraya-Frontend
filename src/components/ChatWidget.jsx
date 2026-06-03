import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Minus, ChevronLeft, Search, User, Trash2, ArrowDown, MoreVertical } from 'lucide-react';
import useChatStore from '../store/useChatStore';
import ConfirmModal from './ConfirmModal';
import useAuthStore from '../store/useAuthStore';
import api from '../api/axios';
import { format, isToday, isYesterday } from 'date-fns';
import ChatMessage, { DateSeparator } from './Chat/ChatMessage';
import ChatReplyPreview from './Chat/ChatReplyPreview';

const C = {
  t900: '#0d1117', t700: '#1f2937', t500: '#6b7280', t300: '#adb5bd',
  bSoft: 'rgba(0,0,0,0.07)', bMed: 'rgba(0,0,0,0.12)',
  bgCard: '#ffffff', bgPage: '#edf0f4', bgMuted: '#f3f5f8',
  lime: '#cbff00', blue: '#3b82f6', rose: '#f43f5e', amber: '#f59e0b',
  rSm: '0.85rem', rMd: '1.25rem', rLg: '1.5rem', r2xl: '2.5rem'
};

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(() => localStorage.getItem('chat_open') === 'true');
  const [input, setInput] = useState(() => localStorage.getItem('chat_input') || '');
  const [isAdminView, setIsAdminView] = useState(() => localStorage.getItem('chat_admin_view') !== 'false');
  const [selectedBuyer, setSelectedBuyer] = useState(() => {
    const saved = localStorage.getItem('chat_selected_buyer');
    return saved ? JSON.parse(saved) : null;
  });
  const [search, setSearch] = useState('');
  const [msgSearch, setMsgSearch] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [firstUnreadMsgId, setFirstUnreadMsgId] = useState(null);
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: () => { } });

  const {
    messages, connect, disconnect, sendMessage, setMessages, isConnected,
    currentWithID, socket, conversations, setConversations, deleteMessage,
    isTyping, sendTyping, editingMessage, setEditingMessage, editMessage,
    markAsRead, totalUnreadCount, fetchTotalUnread, setIsOpen: setIsOpenStore,
    isPartnerOnline
  } = useChatStore();
  
  const filteredMessages = msgSearch.trim()
    ? messages.filter(m => (m.message_text || '').toLowerCase().includes(msgSearch.toLowerCase()))
    : messages;
  const { user } = useAuthStore();
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 100);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (replyingTo && inputRef.current) { inputRef.current.focus(); }
  }, [replyingTo]);

  useEffect(() => {
    localStorage.setItem('chat_open', isOpen);
    setIsOpenStore(isOpen);
  }, [isOpen]);

  useEffect(() => { localStorage.setItem('chat_input', input); }, [input]);
  useEffect(() => { localStorage.setItem('chat_admin_view', isAdminView); }, [isAdminView]);
  useEffect(() => {
    if (selectedBuyer) { localStorage.setItem('chat_selected_buyer', JSON.stringify(selectedBuyer)); }
    else { localStorage.removeItem('chat_selected_buyer'); }
  }, [selectedBuyer]);

  const DEFAULT_ADMIN_ID = 0;
  const isStaff = user?.role === 'admin' || user?.role === 'moderator';

  useEffect(() => {
    if (user) {
      if (isStaff) {
        if (isOpen && selectedBuyer) { connect(selectedBuyer.buyer_id); }
      } else {
        if (!isConnected || currentWithID !== DEFAULT_ADMIN_ID) { connect(DEFAULT_ADMIN_ID); }
      }
    } else { disconnect(); }
  }, [user, isStaff, isConnected, isOpen, !!selectedBuyer, currentWithID]);

  useEffect(() => {
    if (isOpen && user) {
      if (isStaff) {
        if (selectedBuyer) { fetchMessages(selectedBuyer.buyer_id); }
        else { fetchConversations(); }
      } else {
        fetchMessages(DEFAULT_ADMIN_ID);
        api.get('/chat/conversations').then(res => {
          const buyerConv = (res.data || []).find(c => c.buyer_id === user.id);
          if (buyerConv) markAsRead(buyerConv.id);
        });
      }
    }
  }, [isOpen, user, isStaff, selectedBuyer?.buyer_id]);

  useEffect(() => {
    if (user && !isStaff) { fetchTotalUnread(); }
  }, [user, isStaff]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data || []);
    } catch (err) { console.error('Failed to fetch conversations', err); }
  };

  const fetchMessages = async (withID) => {
    try {
      const res = await api.get(`/chat/conversation/${withID}`);
      const msgs = res.data || [];
      setMessages(msgs);
      const firstUnread = msgs.find(m => !m.is_read && m.sender_id !== user?.id);
      setFirstUnreadMsgId(firstUnread ? firstUnread.id : null);
    } catch (err) { console.error('Failed to fetch messages', err); }
  };

  const handleSelectConversation = (conv) => {
    setSelectedBuyer(conv);
    fetchMessages(conv.buyer_id);
    connect(conv.buyer_id);
    markAsRead(conv.id);
    setIsAdminView(false);
  };

  useEffect(() => {
    const sb = () => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; };
    sb();
    const timer = setTimeout(sb, 100);
    return () => clearTimeout(timer);
  }, [messages, isOpen, isAdminView, showMsgSearch]);

  // Scroll to bottom when search is cleared
  useEffect(() => {
    if (!msgSearch.trim()) {
      const sb = () => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; };
      const timer = setTimeout(sb, 50);
      return () => clearTimeout(timer);
    }
  }, [msgSearch]);

  useEffect(() => {
    if (editingMessage) {
      setInput(editingMessage.message_text || '');
      inputRef.current?.focus();
    } else { setInput(''); }
  }, [editingMessage]);

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim()) {
      if (editingMessage) {
        editMessage(editingMessage.id, input);
        setEditingMessage(null);
        setInput('');
        setReplyingTo(null);
      } else {
        const success = sendMessage(input, replyingTo);
        if (success) { setInput(''); setReplyingTo(null); }
        else { alert('Connecting to chat server...'); }
      }
    }
  };

  if (!user || user.role === 'admin' || user.role === 'moderator') return null;

  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999, display: 'flex', alignItems: 'flex-end' }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{
              background: '#fff', width: 380, height: 580, borderRadius: C.r2xl,
              boxShadow: '0 25px 60px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column',
              overflow: 'hidden', border: `1px solid ${C.bSoft}`, marginBottom: '1rem', marginRight: '0.5rem'
            }}
          >
            {/* Header */}
            <div style={{ background: '#6366f1', padding: '1.5rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-50%', right: '-20%', width: '100%', height: '200%', background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%)', transform: 'rotate(15deg)' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ 
                    width: 40, height: 40, background: 'rgba(255,255,255,0.1)', borderRadius: '1rem', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>
                    <MessageCircle size={20} color="#fff" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>Eraya support</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.1rem' }}>
                      {isPartnerOnline ? (
                        <>
                          <div style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%' }} />
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Online now</span>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Offline</span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Header right actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', position: 'relative' }}>
                  <button onClick={() => setShowMsgSearch(v => !v)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.25rem' }} title="Search messages">
                    <Search size={16} />
                  </button>
                  <button onClick={() => setShowMenu(v => !v)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.25rem' }} title="More options">
                    <MoreVertical size={16} />
                  </button>
                  {showMenu && (
                    <div style={{ position: 'absolute', top: '2rem', right: '0', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 20, minWidth: 140, overflow: 'hidden' }}>
                      <button onClick={() => { setMessages([]); setShowMenu(false); }} style={{ background: 'none', border: 'none', padding: '0.6rem 1rem', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', color: '#374151' }}>Clear chat</button>
                      <button onClick={() => { setIsOpen(false); setShowMenu(false); }} style={{ background: 'none', border: 'none', padding: '0.6rem 1rem', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem', color: '#374151' }}>Close chat</button>
                    </div>
                  )}
                  <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '0.25rem' }}>
                    <Minus size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {/* Sticky search bar */}
              {showMsgSearch && (
                <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Search size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search messages..."
                    value={msgSearch}
                    onChange={e => setMsgSearch(e.target.value)}
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.8rem', fontWeight: 600, background: 'transparent', color: '#374151' }}
                  />
                  {msgSearch && (
                    <button onClick={() => setMsgSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }} title="Clear">
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}
              <div 
                ref={scrollRef} onScroll={handleScroll}
                style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                {filteredMessages.length === 0 ? (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                    <MessageCircle size={40} style={{ marginBottom: '1rem' }} />
                    <p style={{ fontSize: '0.75rem', fontWeight: 600 }}>Start a conversation</p>
                  </div>
                ) : (
                  filteredMessages.map((msg, i) => {
                    const isMe = msg.sender_id === user?.id;
                    const prevMsgDate = i > 0 ? new Date(filteredMessages[i - 1].created_at) : null;
                    const showDateSeparator = !prevMsgDate || new Date(msg.created_at).toDateString() !== prevMsgDate.toDateString();
                    return (
                      <React.Fragment key={msg.id || i}>
                        {showDateSeparator && <DateSeparator date={msg.created_at} />}
                        <ChatMessage 
                          msg={msg} isMe={isMe} onReply={setReplyingTo} 
                          isAdminView={isStaff} setConfirmModal={setConfirmModal} 
                          showName={!isMe}
                        />
                      </React.Fragment>
                    );
                  })
                )}
              </div>

              {/* Typing Indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ position: 'absolute', bottom: '5.5rem', left: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <span style={{ width: 4, height: 4, background: C.blue, borderRadius: '50%' }} />
                      <span style={{ width: 4, height: 4, background: C.blue, borderRadius: '50%' }} />
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: C.t500 }}>Typing...</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Scroll Bottom Button */}
              <AnimatePresence>
                {showScrollBottom && (
                  <motion.button
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    onClick={scrollToBottom}
                    style={{
                      position: 'absolute', bottom: '6rem', right: '1.5rem', width: 36, height: 36,
                      background: '#fff', border: `1px solid ${C.bSoft}`, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', cursor: 'pointer'
                    }}
                  >
                    <ArrowDown size={16} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Input */}
            <div style={{ padding: '1.25rem', borderTop: `1px solid ${C.bSoft}`, background: '#fff' }}>
              <ChatReplyPreview replyingTo={replyingTo} onClear={() => setReplyingTo(null)} isAdminView={false} />
              <form onSubmit={handleSend} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  ref={inputRef} type="text" value={input}
                  onChange={(e) => { setInput(e.target.value); sendTyping(e.target.value.length > 0); }}
                  onBlur={() => sendTyping(false)}
                  placeholder="Type a message..."
                  style={{
                    width: '100%', padding: '0.85rem 3rem 0.85rem 1.25rem', background: C.bgMuted,
                    border: 'none', borderRadius: '1.25rem', fontSize: '0.8rem', fontWeight: 600, outline: 'none'
                  }}
                />
                <button 
                  type="submit" disabled={!input.trim()}
                  style={{ 
                    position: 'absolute', right: '0.5rem', width: 32, height: 32, background: '#6366f1', 
                    borderRadius: '0.85rem', border: 'none', color: '#fff', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: !input.trim() ? 0.3 : 1,
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                  }}
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05, translateY: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 64, height: 64, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', borderRadius: '1.5rem',
          boxShadow: '0 20px 40px rgba(79, 70, 229, 0.3)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', border: 'none', position: 'relative'
        }}
      >
        <MessageCircle size={28} color="#fff" />
        <AnimatePresence>
          {!isOpen && totalUnreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              style={{
                position: 'absolute', top: -5, right: -5, minWidth: 22, height: 22,
                background: C.blue, color: '#fff', fontSize: '0.7rem', fontWeight: 900,
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '3px solid #fff', boxShadow: '0 5px 10px rgba(59,130,246,0.3)'
              }}
            >
              {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <ConfirmModal
        isOpen={confirmModal.show}
        onClose={() => setConfirmModal({ ...confirmModal, show: false })}
        onConfirm={() => { confirmModal.onConfirm(); setConfirmModal({ ...confirmModal, show: false }); }}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
};

export default ChatWidget;