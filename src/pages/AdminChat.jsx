import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Search, Send, User, Clock, CheckCheck, Trash2, ArrowDown, X } from 'lucide-react';
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
  const { 
    messages, 
    conversations, 
    setConversations,
    setSelectedAdminConv, 
    selectedAdminConv,
    connect,
    sendMessage,
    setMessages,
    sendTyping,
    isTyping,
    editingMessage,
    setEditingMessage,
    editMessage,
    isConnected,
    markAsRead,
    bulkDeleteMessages
  } = useChatStore();

  const [input, setInput] = useState('');
  const [selectedMsgIDs, setSelectedMsgIDs] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const toggleMessageSelection = (id) => {
    setSelectedMsgIDs(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    setConfirmModal({
      show: true,
      title: `Delete ${selectedMsgIDs.length} messages?`,
      message: 'This will permanently remove these messages for everyone. This action cannot be undone.',
      onConfirm: async () => {
        await bulkDeleteMessages(selectedMsgIDs);
        setSelectedMsgIDs([]);
        setIsSelectionMode(false);
      }
    });
  };

  // [NEW] Update input when editingMessage changes
  useEffect(() => {
    if (editingMessage) {
      setInput(editingMessage.message_text || '');
      inputRef.current?.focus();
    }
  }, [editingMessage]);
  const [search, setSearch] = useState('');
  const [globalUsers, setGlobalUsers] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [msgSearch, setMsgSearch] = useState('');
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Global user search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search.trim().length > 0) {
        setIsSearchingUsers(true);
        api.get(`/chat/users/search?q=${search}`)
          .then(res => {
            // Filter out users who are already in the conversations list to avoid duplication
            const filtered = (res.data || []).filter(u => 
              !conversations.some(c => c.buyer_id === u.id) && u.id !== user?.id
            );
            setGlobalUsers(filtered);
          })
          .finally(() => setIsSearchingUsers(false));
      } else {
        setGlobalUsers([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, conversations, user?.id]);
  const [confirmModal, setConfirmModal] = useState({ 
    show: false, 
    title: '', 
    message: '', 
    onConfirm: () => {} 
  });
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const buyerIdFromUrl = searchParams.get('buyer');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

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
    // Fetch all active conversations
    api.get('/chat/conversations').then((res) => {
      const convs = res.data || [];
      setConversations(convs);

      // If we have a buyer ID in URL, find the conversation object
      if (buyerIdFromUrl) {
        const target = convs.find(c => String(c.buyer_id) === String(buyerIdFromUrl));
        if (target) {
          setSelectedAdminConv(target);
        }
      }
    });

    // Default connect to support channel initially
    connect(0);
  }, [connect, buyerIdFromUrl, setConversations, setSelectedAdminConv]);

  useEffect(() => {
    if (selectedAdminConv) {
      // Fetch messages for this specific conversation
      api.get(`/chat/conversation/${selectedAdminConv.buyer_id}`).then((res) => {
        setMessages(res.data || []);
      });
      // Reconnect WebSocket to this buyer
      connect(selectedAdminConv.buyer_id);
    }
  }, [selectedAdminConv, connect, setMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (replyingTo) {
      inputRef.current?.focus();
    }
  }, [replyingTo]);

  const handleSelectConversation = (conv) => {
    setSelectedAdminConv(conv);
    setSearchParams({ buyer: conv.buyer_id }, { replace: true });
    markAsRead(conv.id);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim() && selectedAdminConv) {
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
          alert('Connecting to chat server, please wait a second and try again.');
        }
      }
    }
  };

  const filteredConvs = [...conversations]
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .filter(c => 
      (c.buyer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      String(c.buyer_id).includes(search)
    );

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-white overflow-hidden relative">
      {/* Sidebar */}
      <div className={`
        ${selectedAdminConv ? 'hidden md:flex' : 'flex'} 
        w-full md:w-[400px] border-r border-slate-100 flex flex-col h-full bg-slate-50/30
      `}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              Support <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            </h1>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text"
              placeholder="Search conversations..."
              className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-grow overflow-y-auto px-4 pb-8 space-y-2 custom-scrollbar">
          {/* Active Conversations */}
          <div className="mb-6">
            <h2 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Conversations</h2>
            {filteredConvs.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full flex items-center gap-4 p-5 rounded-3xl transition-all duration-300 relative group/conv mb-2 ${
                  selectedAdminConv?.id === conv.id 
                    ? 'bg-white shadow-xl shadow-indigo-600/5 ring-1 ring-slate-100' 
                    : 'hover:bg-white/60 text-slate-400 hover:text-slate-900'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xs shadow-inner shrink-0 overflow-hidden"
                  style={{
                    backgroundColor: `hsl(${(conv.buyer_id * 137.5) % 360}, 70%, 95%)`,
                    color: `hsl(${(conv.buyer_id * 137.5) % 360}, 70%, 35%)`
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
                <div className="flex-grow text-left min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-sm tracking-tight truncate pr-2 ${conv.unread_count > 0 ? 'font-black text-slate-900' : 'font-bold text-slate-600'}`}>
                      {conv.buyer_name || `Customer #${conv.buyer_id}`}
                    </span>
                    <div className="flex items-center gap-2">
                      {conv.unread_count > 0 && (
                        <div className="w-5 h-5 bg-indigo-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/20 animate-pulse">
                          {conv.unread_count}
                        </div>
                      )}
                      <span className="text-[8px] font-bold opacity-40">
                        {conv.updated_at && formatDistanceToNow(new Date(conv.updated_at))}
                      </span>
                    </div>
                  </div>
                  <p className={`text-[10px] truncate ${conv.unread_count > 0 ? 'font-bold text-indigo-600 opacity-100' : 'font-medium opacity-60'}`}>
                    {conv.last_message || 'New inquiry...'}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmModal({
                      show: true,
                      title: 'Delete conversation?',
                      message: 'This will remove the conversation for you. Messages will remain in the database.',
                      onConfirm: () => {
                        api.delete(`/chat/conversation/${conv.id}`).then(() => {
                          if (selectedAdminConv?.id === conv.id) setSelectedAdminConv(null);
                          api.get('/chat/conversations').then(res => setConversations(res.data || []));
                        });
                      }
                    });
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-rose-50 text-rose-500 opacity-0 group-hover/conv:opacity-100 transition-all hover:bg-rose-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </button>
            ))}
          </div>

          {/* Global Search Results */}
          {search.trim().length > 0 && (
            <div className="mt-8">
              <h2 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                Global Users {isSearchingUsers && <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />}
              </h2>
              {globalUsers.length > 0 ? (
                globalUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      // Start a new conversation by selecting this user
                      setSelectedAdminConv({
                        buyer_id: u.id,
                        buyer_name: u.full_name,
                        buyer_avatar: u.avatar_url,
                        id: 0 // Indicates a new conversation that doesn't exist yet in the list
                      });
                      setMessages([]); // Clear messages for a new conversation
                      setSearch(''); // Clear search
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-3xl hover:bg-white transition-all group/user mb-2"
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-[10px] shadow-sm shrink-0 overflow-hidden"
                      style={{
                        backgroundColor: `hsl(${(u.id * 137.5) % 360}, 70%, 95%)`,
                        color: `hsl(${(u.id * 137.5) % 360}, 70%, 35%)`
                      }}>
                      {u.avatar_url ? (
                        <img src={u.avatar_url.startsWith('http') ? u.avatar_url : `${import.meta.env.VITE_ASSETS_URL}/${u.avatar_url}`} className="w-full h-full object-cover" alt="" />
                      ) : u.full_name.substring(0,1).toUpperCase()}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate tracking-tight">{u.full_name}</p>
                      <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">{u.role}</p>
                    </div>
                  </button>
                ))
              ) : !isSearchingUsers && (
                <div className="px-4 py-4 text-center">
                  <p className="text-[10px] font-bold text-slate-300">No matching users found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>


      {/* Main Chat Area */}
      <div className={`
        ${selectedAdminConv ? 'flex' : 'hidden md:flex'} 
        flex-grow flex flex-col bg-slate-50/50 relative
      `}>
        {selectedAdminConv ? (
          <>
            {/* Header */}
            <div className="p-4 md:p-6 bg-white border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3 md:gap-4">
                {/* Back button for mobile */}
                <button 
                  onClick={() => setSelectedAdminConv(null)}
                  className="md:hidden p-2 -ml-2 rounded-xl text-slate-400 hover:bg-slate-50"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center font-bold text-xs md:text-sm shadow-sm overflow-hidden shrink-0"
                  style={{
                    backgroundColor: `hsl(${((selectedAdminConv?.buyer_id || 0) * 137.5) % 360}, 70%, 45%)`,
                    color: '#ffffff'
                  }}>
                  {selectedAdminConv?.buyer_avatar ? (
                    <img
                      src={selectedAdminConv.buyer_avatar.startsWith('http') ? selectedAdminConv.buyer_avatar : `${import.meta.env.VITE_ASSETS_URL}/${selectedAdminConv.buyer_avatar}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (selectedAdminConv?.buyer_name || selectedAdminConv?.buyer_id?.toString() || 'U').substring(0, 1).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                    {selectedAdminConv.buyer_name || `Customer #${selectedAdminConv.buyer_id}`}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isPartnerOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className="text-[9px] font-bold text-slate-400 ">
                      {isPartnerOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <AnimatePresence>
                  {showMsgSearch && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 200, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="relative overflow-hidden"
                    >
                      <input
                        type="text"
                        placeholder="Search messages..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-4 pr-4 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
                        value={msgSearch}
                        onChange={(e) => setMsgSearch(e.target.value)}
                        autoFocus
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  onClick={() => {
                    setShowMsgSearch(!showMsgSearch);
                    if (showMsgSearch) setMsgSearch('');
                  }}
                  className={`p-3 rounded-2xl transition-all shadow-sm ${showMsgSearch ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                  title="Search Messages"
                >
                  <Search className="w-4 h-4" />
                </button>

                <button 
                  onClick={() => {
                    setIsSelectionMode(!isSelectionMode);
                    if (isSelectionMode) setSelectedMsgIDs([]);
                  }}
                  className={`p-3 rounded-2xl transition-all shadow-sm ${isSelectionMode ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                  title="Select Messages"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setConfirmModal({
                      show: true,
                      title: 'Delete Entire Conversation?',
                      message: 'This will permanently remove all messages for both you and the buyer. This action cannot be reversed.',
                      onConfirm: () => {
                        api.delete(`/chat/conversation/${selectedAdminConv.id}`).then(() => {
                          setSelectedAdminConv(null);
                          setSearchParams({}, { replace: true });
                          api.get('/chat/conversations').then(res => setConversations(res.data || []));
                        });
                      }
                    });
                  }}
                  className="p-3 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all shadow-sm"
                  title="Delete Conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
               onScroll={handleScroll}
               className="flex-grow overflow-y-auto p-4 md:p-10 custom-scrollbar relative"
             >
               <div className="min-h-full flex flex-col justify-end space-y-6">
                 {messages
                   .filter(m => (m.message_text || '').toLowerCase().includes(msgSearch.toLowerCase()))
                   .map((msg, i, filtered) => {
                     const isMe = msg.sender_id === user.id;
                     const prevMsgDate = i > 0 ? new Date(filtered[i - 1].created_at || new Date()) : null;
                     const showDateSeparator = !prevMsgDate || new Date(msg.created_at).toDateString() !== prevMsgDate.toDateString();
 
                     return (
                       <React.Fragment key={msg.id || i}>
                         {showDateSeparator && <DateSeparator date={msg.created_at} />}
                         <ChatMessage
                           msg={msg}
                           isMe={isMe}
                           onReply={setReplyingTo}
                           isAdminView={true}
                           showName={!isMe && String(msg.sender_id) !== String(selectedAdminConv?.buyer_id)}
                           setConfirmModal={setConfirmModal}
                           isSelectionMode={isSelectionMode}
                           isSelected={selectedMsgIDs.includes(msg.id)}
                           onSelect={toggleMessageSelection}
                         />
                       </React.Fragment>
                     );
                   })}
                 {msgSearch && messages.filter(m => (m.message_text || '').toLowerCase().includes(msgSearch.toLowerCase())).length === 0 && (
                   <div className="py-20 text-center">
                     <p className="text-[10px] font-bold text-slate-300">No matching messages found</p>
                   </div>
                 )}
               </div>
 
               {/* Bulk Action Bar */}
               <AnimatePresence>
                 {isSelectionMode && (
                   <motion.div
                     initial={{ y: 50, opacity: 0 }}
                     animate={{ y: 0, opacity: 1 }}
                     exit={{ y: 50, opacity: 0 }}
                     className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-8 border border-white/10 backdrop-blur-xl"
                   >
                     <div className="flex flex-col">
                       <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Selected</span>
                       <span className="text-xl font-black">{selectedMsgIDs.length} Messages</span>
                     </div>
                     <div className="h-8 w-px bg-white/10" />
                     <div className="flex gap-4">
                       <button
                         onClick={handleBulkDelete}
                         disabled={selectedMsgIDs.length === 0}
                         className="px-8 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 transition-all text-xs font-bold flex items-center gap-2 disabled:opacity-50"
                       >
                         <Trash2 className="w-4 h-4" /> Delete Selected
                       </button>
                       <button
                         onClick={() => { setIsSelectionMode(false); setSelectedMsgIDs([]); }}
                         className="p-2 hover:bg-white/10 rounded-xl transition-all"
                       >
                         <X className="w-5 h-5" />
                       </button>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

            {/* Scroll to Bottom Button */}
            <AnimatePresence>
              {showScrollBottom && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: 20 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-32 right-12 w-14 h-14 bg-white text-slate-900 rounded-full shadow-2xl border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all z-[100] group"
                >
                  <div className="absolute inset-0 bg-indigo-500/10 rounded-full animate-ping" />
                  <ArrowDown className="w-6 h-6 group-hover:translate-y-0.5 transition-transform relative z-10" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Typing & Editing Indicator */}
            <div className="px-8 flex flex-col gap-1">
              <AnimatePresence>
                {editingMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="py-2 px-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-indigo-600 ">Editing Message:</span>
                      <span className="text-[10px] font-bold text-slate-600 truncate max-w-[200px]">"{editingMessage.message_text}"</span>
                    </div>
                    <button 
                      onClick={() => { setEditingMessage(null); setInput(''); }}
                      className="p-1 hover:bg-indigo-100 rounded-lg transition-all text-indigo-400"
                    >
                      <X className="w-3.5 h-3.5" />
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
                    className="py-2 flex items-center gap-2"
                  >
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 ">Buyer is typing...</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input */}
            <div className="p-4 md:p-8 bg-white border-t border-slate-100">
              <ChatReplyPreview
                replyingTo={replyingTo}
                onClear={() => setReplyingTo(null)}
                isAdminView={true}
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
                  placeholder="Type your reply..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] py-5 pl-8 pr-20 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:bg-white focus:border-slate-200 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="absolute right-3 w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-600 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-20"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-20">
            <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center mb-8">
              <MessageSquare className="w-10 h-10 text-slate-100" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Select a Conversation</h3>
            <p className="text-slate-400 text-xs font-bold  leading-loose max-w-[300px]">
              Click on a conversation in the sidebar to start chatting with buyers.
            </p>
          </div>
        )}
      </div>

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

export default AdminChat;
