import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Minus, ChevronLeft, Search, User, Trash2, ArrowDown } from 'lucide-react';
import useChatStore from '../store/useChatStore';
import ConfirmModal from './ConfirmModal';
import useAuthStore from '../store/useAuthStore';
import api from '../api/axios';
import { format, isToday, isYesterday } from 'date-fns';
import ChatMessage, { DateSeparator } from './Chat/ChatMessage';
import ChatReplyPreview from './Chat/ChatReplyPreview';

const ChatWidget = () => {
  // Load initial state from localStorage
  const [isOpen, setIsOpen] = useState(() => localStorage.getItem('chat_open') === 'true');
  const [input, setInput] = useState(() => localStorage.getItem('chat_input') || '');
  const [isAdminView, setIsAdminView] = useState(() => localStorage.getItem('chat_admin_view') !== 'false');
  const [selectedBuyer, setSelectedBuyer] = useState(() => {
    const saved = localStorage.getItem('chat_selected_buyer');
    return saved ? JSON.parse(saved) : null;
  });
  const [search, setSearch] = useState('');
  const [msgSearch, setMsgSearch] = useState('');
  const [firstUnreadMsgId, setFirstUnreadMsgId] = useState(null);
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: () => { } });

  const {
    messages,
    connect,
    disconnect,
    sendMessage,
    setMessages,
    isConnected,
    currentWithID,
    socket,
    conversations,
    setConversations,
    deleteMessage,
    isTyping,
    sendTyping,
    editingMessage,
    setEditingMessage,
    editMessage,
    markAsRead,
    totalUnreadCount,
    fetchTotalUnread,
    setIsOpen: setIsOpenStore
  } = useChatStore();
  const { user } = useAuthStore();
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 100);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('chat_open', isOpen);
    setIsOpenStore(isOpen); // Sync with store for real-time message filtering
  }, [isOpen]);

  useEffect(() => {
    localStorage.setItem('chat_input', input);
  }, [input]);

  useEffect(() => {
    localStorage.setItem('chat_admin_view', isAdminView);
  }, [isAdminView]);

  useEffect(() => {
    if (selectedBuyer) {
      localStorage.setItem('chat_selected_buyer', JSON.stringify(selectedBuyer));
    } else {
      localStorage.removeItem('chat_selected_buyer');
    }
  }, [selectedBuyer]);

  // Default Admin ID for buyer support (0 means unassigned/general support)
  const DEFAULT_ADMIN_ID = 0;

  const isStaff = user?.role === 'admin' || user?.role === 'moderator';

  // [NEW] Keep connected even when closed for real-time notifications
  useEffect(() => {
    if (user) {
      if (isStaff) {
        // Staff only connects when a buyer is selected
        if (isOpen && selectedBuyer) {
          connect(selectedBuyer.buyer_id);
        }
      } else {
        // Buyer always stays connected in background
        if (!isConnected || currentWithID !== DEFAULT_ADMIN_ID) {
          connect(DEFAULT_ADMIN_ID);
        }
      }
    } else {
      disconnect();
    }
  }, [user, isStaff, isConnected, isOpen, !!selectedBuyer, currentWithID]);

  // Fetch data when isOpen changes
  useEffect(() => {
    if (isOpen && user) {
      if (isStaff) {
        if (selectedBuyer) {
          fetchMessages(selectedBuyer.buyer_id);
        } else {
          fetchConversations();
        }
      } else {
        fetchMessages(DEFAULT_ADMIN_ID);
        // Mark as read when opening
        api.get('/chat/conversations').then(res => {
          const buyerConv = (res.data || []).find(c => c.buyer_id === user.id);
          if (buyerConv) markAsRead(buyerConv.id);
        });
      }
    }
  }, [isOpen, user, isStaff, selectedBuyer?.buyer_id]);

  // [NEW] Fetch initial count on mount and sync with isOpen
  useEffect(() => {
    if (user && !isStaff) {
      fetchTotalUnread();
    }
  }, [user, isStaff]);

  // We can remove the periodic fetch as we are now using real-time WebSocket
  /*
  useEffect(() => {
    if (!isOpen && user) {
      fetchTotalUnread();
      const interval = setInterval(fetchTotalUnread, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen, user]);
  */

const fetchConversations = async () => {
  try {
    const res = await api.get('/chat/conversations');
    setConversations(res.data || []);
  } catch (err) {
    console.error('Failed to fetch conversations', err);
  }
};

const fetchMessages = async (withID) => {
  try {
    const res = await api.get(`/chat/conversation/${withID}`);
    const msgs = res.data || [];
    setMessages(msgs);
    
    // Find the first unread message from the OTHER person
    const firstUnread = msgs.find(m => !m.is_read && m.sender_id !== user?.id);
    if (firstUnread) {
      setFirstUnreadMsgId(firstUnread.id);
    } else {
      setFirstUnreadMsgId(null);
    }
  } catch (err) {
    console.error('Failed to fetch messages', err);
  }
};

const handleSelectConversation = (conv) => {
  setSelectedBuyer(conv);
  fetchMessages(conv.buyer_id);
  connect(conv.buyer_id);
  markAsRead(conv.id);
  setIsAdminView(false);
};

useEffect(() => {
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  // Initial scroll
  scrollToBottom();
  // Delayed scroll for dynamic content/rendering
  const timer = setTimeout(scrollToBottom, 100);
  return () => clearTimeout(timer);
}, [messages, isOpen, isAdminView]);

// Update input when editingMessage changes
useEffect(() => {
  if (editingMessage) {
    setInput(editingMessage.message_text || '');
    inputRef.current?.focus();
  } else {
    setInput('');
  }
}, [editingMessage]);

const handleSend = (e) => {
  e.preventDefault();
  if (input.trim()) {
    if (editingMessage) {
      editMessage(editingMessage.id, input);
      setEditingMessage(null);
      setInput('');
      setReplyingTo(null);
      inputRef.current?.focus();
    } else {
      const success = sendMessage(input, replyingTo);
      if (success) {
        setInput('');
        setReplyingTo(null);
        inputRef.current?.focus();
      } else {
        // If WS is not connected, alert the user and don't clear the input
        alert('Connecting to chat server, please wait a second and try again.');
      }
    }
  }
};

if (!user || user.role === 'admin' || user.role === 'moderator') return null;

const filteredConvs = conversations.filter(c =>
  c.buyer_id.toString().includes(search)
);

return (
  <div className="fixed bottom-6 right-6 z-[9999] flex items-end">
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="glass-card-light w-[380px] h-[550px] rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.2)] flex flex-col overflow-x-hidden overflow-y-hidden border border-white/[0.08] mb-4 mr-2"
        >
          {/* Header */}
          <div className="bg-slate-900 p-6 text-white shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {!isStaff || isAdminView ? (
                  <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center font-bold text-sm">E</div>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setIsAdminView(true); setSelectedBuyer(null); }}
                      className="w-8 h-8 rounded-xl glass-card-light/10 flex items-center justify-center hover:glass-card-light/20 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden"
                      style={{
                        backgroundColor: `hsl(${((selectedBuyer?.buyer_id || 0) * 137.5) % 360}, 70%, 45%)`,
                        color: '#ffffff'
                      }}>
                      {selectedBuyer?.buyer_avatar ? (
                        <img
                          src={selectedBuyer.buyer_avatar.startsWith('http') ? selectedBuyer.buyer_avatar : `${import.meta.env.VITE_ASSETS_URL}/${selectedBuyer.buyer_avatar}`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (selectedBuyer?.buyer_name || selectedBuyer?.buyer_id?.toString() || 'U').substring(0, 1).toUpperCase()
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm tracking-tight">
                    {isStaff ? (isAdminView ? 'Admin messages' : (selectedBuyer?.buyer_name || `Customer #${selectedBuyer?.buyer_id}`)) : 'Eraya support'}
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[9px] text-slate-400 font-bold">
                      Live now
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isStaff && !isAdminView && (
                  <>
                    <AnimatePresence>
                      {showMsgSearch && (
                        <motion.div
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: 120, opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          className="relative overflow-hidden"
                        >
                          <input
                            type="text"
                            placeholder="Search..."
                            value={msgSearch}
                            onChange={(e) => setMsgSearch(e.target.value)}
                            className="w-full glass-card-light/10 border border-white/10 rounded-lg py-1.5 px-3 text-[9px] font-bold focus:outline-none focus:glass-card-light/20 transition-all text-white placeholder:text-slate-500"
                            autoFocus
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <button
                      onClick={() => { setShowMsgSearch(!showMsgSearch); if (showMsgSearch) setMsgSearch(''); }}
                      className={`p-2 rounded-xl transition-all ${showMsgSearch ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white hover:glass-card-light/10'}`}
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors p-2">
                  <Minus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {isStaff && isAdminView && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search buyer ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full glass-card-light/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-[10px] font-bold focus:outline-none focus:glass-card-light/10 transition-all"
                />
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-grow flex flex-col glass-card-light overflow-hidden relative">
            {isStaff && isAdminView ? (
              /* Admin Conversation List */
              <div className="flex-grow overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {filteredConvs.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className="w-full p-4 glass-card-light hover:glass-card-light rounded-2xl flex items-center gap-4 transition-all shadow-sm border border-white/[0.08] group/conv text-left relative"
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm transition-all overflow-hidden shrink-0"
                      style={{
                        backgroundColor: `hsl(${(conv.buyer_id * 137.5) % 360}, 70%, 45%)`,
                        color: '#ffffff'
                      }}>
                      {conv.buyer_avatar ? (
                        <img
                          src={conv.buyer_avatar.startsWith('http') ? conv.buyer_avatar : `${import.meta.env.VITE_ASSETS_URL}/${conv.buyer_avatar}`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (conv.buyer_name || conv.buyer_id.toString()).substring(0, 1).toUpperCase()
                      )}
                    </div>
                    <div className="flex-grow min-w-0 pr-6">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-[11px] text-white truncate pr-2">
                          {conv.buyer_name || `Customer #${conv.buyer_id}`}
                        </p>
                        <span className="text-[8px] font-bold text-slate-400 shrink-0">
                          {format(new Date(conv.updated_at), 'HH:mm')}
                        </span>
                      </div>
                      <p className={`text-[10px] line-clamp-1 ${conv.unread_count > 0 ? 'font-bold text-indigo-600' : 'font-bold text-slate-500'}`}>
                        {conv.last_message || 'Start chatting...'}
                      </p>
                    </div>

                    {conv.unread_count > 0 && (
                      <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center justify-center min-w-[18px] h-[18px] bg-indigo-500 text-white text-[8px] font-bold rounded-full shadow-sm animate-pulse">
                        {conv.unread_count}
                      </div>
                    )}

                    {/* Quick Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmModal({
                          show: true,
                          title: 'Delete Chat?',
                          message: 'This will permanently remove this conversation.',
                          onConfirm: () => {
                            api.delete(`/chat/conversation/${conv.id}`).then(() => {
                              fetchConversations();
                            });
                          }
                        });
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-rose-50 text-rose-500 opacity-0 group-hover/conv:opacity-100 transition-all hover:bg-rose-100 shadow-sm"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </button>
                ))}
                {filteredConvs.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 p-10">
                    <MessageCircle className="w-10 h-10 mb-4" />
                    <p className="text-[10px] font-bold">No active chats</p>
                  </div>
                )}
              </div>
            ) : (
              /* Chat Messages */
              <>
                <div
                  ref={scrollRef}
                  onScroll={handleScroll}
                  className="flex-grow overflow-y-auto overflow-x-hidden p-6 custom-scrollbar relative"
                >
                  <div className="min-h-full flex flex-col justify-end space-y-4">
                    {messages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-30">
                        <MessageCircle className="w-12 h-12 mb-4" />
                        <p className="text-[10px] ">Start a conversation</p>
                      </div>
                    )}
                    {messages
                      .filter(m => (m.message_text || '').toLowerCase().includes(msgSearch.toLowerCase()))
                      .map((msg, i, filtered) => {
                        const isMe = msg.sender_id === user?.id;
                        const prevMsgDate = i > 0 ? new Date(filtered[i - 1].created_at || new Date()) : null;
                        const showDateSeparator = !prevMsgDate || new Date(msg.created_at).toDateString() !== prevMsgDate.toDateString();

                          return (
                            <React.Fragment key={msg.id || i}>
                              {showDateSeparator && <DateSeparator date={msg.created_at} />}
                              {firstUnreadMsgId === msg.id && (
                                <div className="flex items-center gap-4 py-4">
                                  <div className="h-px flex-grow bg-indigo-100"></div>
                                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-50 px-3 py-1 rounded-full shadow-sm">
                                    Unread Messages
                                  </span>
                                  <div className="h-px flex-grow bg-indigo-100"></div>
                                </div>
                              )}
                              <ChatMessage
                                msg={msg}
                                isMe={isMe}
                                onReply={setReplyingTo}
                                isAdminView={isStaff}
                                setConfirmModal={setConfirmModal}
                              />
                            </React.Fragment>
                          );
                      })}
                    {msgSearch && messages.filter(m => (m.message_text || '').toLowerCase().includes(msgSearch.toLowerCase())).length === 0 && (
                      <div className="py-20 text-center">
                        <p className="text-[9px] font-bold text-slate-300 ">No results</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Scroll to Bottom Button */}
                <AnimatePresence>
                  {showScrollBottom && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.5, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5, y: 10 }}
                      onClick={scrollToBottom}
                      className="absolute bottom-24 right-6 w-11 h-11 glass-card-light text-white rounded-full shadow-2xl border border-white/[0.08] flex items-center justify-center hover:glass-card-light transition-all z-[100] group"
                    >
                      <div className="absolute inset-0 bg-indigo-500/5 rounded-full animate-ping" />
                      <ArrowDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform relative z-10" />
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Typing & Editing Indicator */}
                <div className="px-6 flex flex-col gap-1">
                  <AnimatePresence>
                    {editingMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="py-1 px-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between"
                      >
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="text-[7px] font-bold text-indigo-600  shrink-0">Editing:</span>
                          <span className="text-[7px] font-bold text-slate-300 truncate italic">"{editingMessage.message_text}"</span>
                        </div>
                        <button
                          onClick={() => {
                            setEditingMessage(null);
                            setInput('');
                          }}
                          className="p-1 hover:bg-indigo-100 rounded-lg transition-all text-indigo-400 shrink-0"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="py-1 flex items-center gap-2"
                      >
                        <div className="flex gap-1">
                          <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" />
                        </div>
                        <span className="text-[8px] font-bold text-slate-400 ">Typing...</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Input Area */}
                <div className="p-6 glass-card-light border-t border-white/[0.08]">
                  <ChatReplyPreview
                    replyingTo={replyingTo}
                    onClear={() => setReplyingTo(null)}
                    isAdminView={false}
                  />
                  <form onSubmit={handleSend} className="relative flex items-center">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        sendTyping(e.target.value.length > 0);
                      }}
                      onBlur={() => sendTyping(false)}
                      placeholder="Type a reply..."
                      className="w-full glass-card-light border border-white/[0.08] rounded-[1.25rem] py-4 pl-6 pr-14 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className="absolute right-2 w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-secondary transition-all disabled:opacity-20"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setIsOpen(!isOpen)}
      className="w-16 h-16 bg-slate-900 text-white rounded-[1.8rem] shadow-2xl shadow-slate-900/40 flex items-center justify-center hover:bg-secondary transition-all relative overflow-hidden group ml-auto"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 group-hover:scale-150 transition-transform duration-700" />
      <div className="relative">
        <MessageCircle className="w-7 h-7" />

        {/* Unread Count Badge */}
        <AnimatePresence>
          {!isOpen && totalUnreadCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-2 -right-2 min-w-[22px] h-[22px] bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg shadow-rose-500/40"
            >
              {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
            </motion.div>
          )}
        </AnimatePresence>

        {isStaff && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-slate-900" />
        )}
      </div>
    </motion.button>
    <ConfirmModal
      isOpen={confirmModal.show}
      onClose={() => setConfirmModal({ ...confirmModal, show: false })}
      onConfirm={() => {
        confirmModal.onConfirm();
        setConfirmModal({ ...confirmModal, show: false });
      }}
      title={confirmModal.title}
      message={confirmModal.message}
    />
  </div>
);
};

export default ChatWidget;
