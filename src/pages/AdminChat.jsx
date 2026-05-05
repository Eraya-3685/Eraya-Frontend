import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Search, Send, User, Clock, CheckCheck, Trash2, ArrowDown, X, MoreVertical, RefreshCcw, Activity } from 'lucide-react';
import useChatStore from '../store/useChatStore';
import useAuthStore from '../store/useAuthStore';
import api from '../api/axios';
import { useSearchParams } from 'react-router-dom';
import ChatMessage, { DateSeparator } from '../components/Chat/ChatMessage';
import ChatReplyPreview from '../components/Chat/ChatReplyPreview';
import { formatDistanceToNow } from 'date-fns';
import ConfirmModal from '../components/ConfirmModal';

const AdminChat = () => {
  const { user } = useAuthStore();
  const { messages, conversations, setConversations, setSelectedAdminConv, selectedAdminConv, connect, sendMessage, setMessages, sendTyping, isTyping, editingMessage, setEditingMessage, editMessage, isConnected, currentWithID, markAsRead } = useChatStore();
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    api.get('/chat/conversations').then((res) => setConversations(res.data || []));
    connect(0);
  }, []);

  useEffect(() => {
    if (selectedAdminConv) {
      api.get(`/chat/conversation/${selectedAdminConv.buyer_id}`).then((res) => setMessages(res.data || []));
      if (currentWithID !== selectedAdminConv.buyer_id || !isConnected) connect(selectedAdminConv.buyer_id);
    }
  }, [selectedAdminConv?.buyer_id]);

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim() && selectedAdminConv) {
       sendMessage(input);
       setInput('');
    }
  };

  const filteredConvs = conversations.filter(c => (c.buyer_name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', background: '#fff', borderRadius: '3rem', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.03)' }}>
      
      {/* Sidebar */}
      <div style={{ width: 400, borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '2.5rem' }}>
           <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>Messages <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e11d48', animation: 'pulse 1.5s infinite' }} /></h2>
           <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#94a3b8' }} />
              <input type="text" placeholder="Search conversations..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', background: '#f8f9fc', border: '1px solid #f1f5f9', padding: '1rem 1rem 1rem 3.5rem', borderRadius: '1.25rem', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }} />
           </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.5rem 2.5rem' }}>
           {filteredConvs.map(conv => (
             <button key={conv.id} onClick={() => { setSelectedAdminConv(conv); markAsRead(conv.id); }} style={{ width: '100%', border: 'none', background: selectedAdminConv?.id === conv.id ? '#e11d4808' : 'transparent', padding: '1.25rem', borderRadius: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s ease', marginBottom: '0.5rem', border: selectedAdminConv?.id === conv.id ? '1px solid #e11d4810' : '1px solid transparent' }}>
                <div style={{ width: 54, height: 54, borderRadius: '1.25rem', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.1rem', shrink: 0 }}>{conv.buyer_name?.charAt(0)}</div>
                <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0f172a' }}>{conv.buyer_name}</span>
                      {conv.unread_count > 0 && <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#e11d48', color: '#fff', fontSize: '0.6rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{conv.unread_count}</div>}
                   </div>
                   <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.last_message || 'Start a conversation...'}</p>
                </div>
             </button>
           ))}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8f9fc' }}>
        {selectedAdminConv ? (
          <>
            <div style={{ padding: '1.5rem 2.5rem', background: '#fff', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '1rem', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{selectedAdminConv.buyer_name?.charAt(0)}</div>
                  <div>
                     <h4 style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{selectedAdminConv.buyer_name}</h4>
                     <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', margin: 0, letterSpacing: '0.05em' }}>Active Session</p>
                  </div>
               </div>
               <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button style={{ width: 44, height: 44, borderRadius: '1rem', border: '1px solid #f1f5f9', background: '#fff', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Search style={{ width: 18, height: 18 }} /></button>
                  <button style={{ width: 44, height: 44, borderRadius: '1rem', border: '1px solid #f1f5f9', background: '#fff', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><MoreVertical style={{ width: 18, height: 18 }} /></button>
               </div>
            </div>

            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               {messages.map((msg, i) => {
                 const isMe = msg.sender_id === user.id;
                 return (
                   <div key={i} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                      <div style={{ background: isMe ? '#e11d48' : '#fff', color: isMe ? '#fff' : '#0f172a', padding: '1.25rem 1.75rem', borderRadius: isMe ? '2rem 2rem 0.5rem 2rem' : '2rem 2rem 2rem 0.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: isMe ? 'none' : '1px solid #f1f5f9' }}>
                         <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.5 }}>{msg.message_text}</p>
                      </div>
                      <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', marginTop: '0.5rem', textAlign: isMe ? 'right' : 'left' }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                   </div>
                 );
               })}
               {isTyping && <div style={{ alignSelf: 'flex-start', background: '#fff', padding: '1rem 1.5rem', borderRadius: '1.5rem', border: '1px solid #f1f5f9' }}><div className="typing-loader" /></div>}
            </div>

            <div style={{ padding: '2rem 2.5rem', background: '#fff', borderTop: '1px solid #f1f5f9' }}>
               <form onSubmit={handleSend} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                  <input type="text" value={input} onChange={(e) => { setInput(e.target.value); sendTyping(e.target.value.length > 0); }} placeholder="Write a message to customer..." style={{ flex: 1, background: '#f8f9fc', border: '1px solid #f1f5f9', padding: '1.25rem 1.5rem', borderRadius: '1.5rem', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }} />
                  <button type="submit" disabled={!input.trim()} style={{ width: 56, height: 56, borderRadius: '1.5rem', background: '#e11d48', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 10px 20px rgba(225, 29, 72, 0.2)', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}><Send style={{ width: 20, height: 20 }} /></button>
               </form>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem' }}>
             <div style={{ width: 80, height: 80, background: '#fff', borderRadius: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}><MessageSquare style={{ width: 32, height: 32 }} /></div>
             <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Start Support Session</h3>
             <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', margin: 0 }}>Select a customer from the sidebar to begin</p>
          </div>
        )}
      </div>

      <style>{`
        .typing-loader { width: 40px; height: 10px; display: flex; gap: 4px; justify-content: center; }
        .typing-loader::before, .typing-loader::after, .typing-loader { content: ""; border-radius: 50%; background: #e11d48; width: 6px; height: 6px; animation: bounce 0.6s infinite alternate; }
        .typing-loader::before { animation-delay: 0.2s; }
        .typing-loader::after { animation-delay: 0.4s; }
        @keyframes bounce { to { transform: translateY(-5px); opacity: 0.5; } }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default AdminChat;
