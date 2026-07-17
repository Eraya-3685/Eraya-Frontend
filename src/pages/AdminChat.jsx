import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Search, Send, User, Clock, CheckCheck, Trash2, ArrowDown, X, MoreVertical, RefreshCcw, Activity, Pencil, Mail, Phone, MapPin, Calendar, ChevronLeft } from 'lucide-react';
import useChatStore from '../store/useChatStore';
import useAuthStore from '../store/useAuthStore';
import api, { getImageUrl } from '../api/axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ChatMessage, { DateSeparator } from '../components/Chat/ChatMessage';
import ChatReplyPreview from '../components/Chat/ChatReplyPreview';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import useMediaQuery from '../hooks/useMediaQuery';

const AdminChat = () => {
  const { isMobile } = useMediaQuery();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { messages, conversations, setConversations, setSelectedAdminConv, selectedAdminConv, connect, sendMessage, setMessages, sendTyping, isTyping, editingMessage, setEditingMessage, editMessage, deleteMessage, deleteConversation, isConnected, currentWithID, markAsRead, isPartnerOnline } = useChatStore();
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [msgSearch, setMsgSearch] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSearchingConv, setIsSearchingConv] = useState(false);
  const [isSearchingMsg, setIsSearchingMsg] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: () => { } });
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const searchBtnRef = useRef(null);
  const draftsRef = useRef({});

  useEffect(() => {
    if (editingMessage) {
      setInput(editingMessage.message_text || '');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Put cursor at the end of the text
          const len = inputRef.current.value.length;
          inputRef.current.setSelectionRange(len, len);
        }
      }, 50);
    } else {
      setInput(selectedAdminConv ? (draftsRef.current[selectedAdminConv.buyer_id] || '') : '');
    }
  }, [editingMessage, selectedAdminConv?.buyer_id]);

  // Auto-resize textarea height based on content
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    api.get('/chat/conversations').then((res) => setConversations(res.data || []));
    api.get('/users').then((res) => setAllUsers(res.data || []));
    connect(0);
  }, []);

  // Close menu/search when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target) &&
        searchBtnRef.current &&
        !searchBtnRef.current.contains(e.target)
      ) {
        setShowMsgSearch(false);
        setMsgSearch('');
      }

      // Close conversation 3-dot dropdown when clicking outside
      if (!e.target.closest('[data-dropdown="true"]')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedAdminConv) {
      setLoadingMessages(true);
      api.get(`/chat/conversation/${selectedAdminConv.buyer_id}`)
        .then((res) => {
          setMessages(res.data || []);
        })
        .finally(() => {
          setLoadingMessages(false);
        });
      if (currentWithID !== selectedAdminConv.buyer_id || !isConnected) connect(selectedAdminConv.buyer_id);
    }
  }, [selectedAdminConv?.buyer_id]);

  // Handle live search loading indicators for smart visual feedback
  useEffect(() => {
    if (search.trim()) {
      setIsSearchingConv(true);
      const timer = setTimeout(() => setIsSearchingConv(false), 250);
      return () => clearTimeout(timer);
    } else {
      setIsSearchingConv(false);
    }
  }, [search]);

  useEffect(() => {
    if (msgSearch.trim()) {
      setIsSearchingMsg(true);
      const timer = setTimeout(() => setIsSearchingMsg(false), 250);
      return () => clearTimeout(timer);
    } else {
      setIsSearchingMsg(false);
    }
  }, [msgSearch]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;

      const timer = setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [messages, showMsgSearch]);

  // Scroll to bottom when search is cleared
  useEffect(() => {
    if (!msgSearch.trim()) {
      const timer = setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [msgSearch]);

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim() && selectedAdminConv) {
      if (editingMessage) {
        editMessage(editingMessage.id, input);
        setEditingMessage(null);
        setInput('');
      } else {
        const success = sendMessage(input);
        if (success) {
          setInput('');
          if (selectedAdminConv) {
            delete draftsRef.current[selectedAdminConv.buyer_id];
          }
        }
      }
    }
  };

  const handleSelectConversation = (conv) => {
    if (selectedAdminConv) {
      draftsRef.current[selectedAdminConv.buyer_id] = input;
    }
    setSelectedAdminConv(conv);
    markAsRead(conv.id);
    setSearch('');
    setMsgSearch('');
    setShowMsgSearch(false);
    setEditingMessage(null);
    const nextDraft = draftsRef.current[conv.buyer_id] || '';
    setInput(nextDraft);
  };

  const handleCloseChat = () => {
    if (input.trim()) {
      setConfirmModal({
        show: true,
        title: 'Discard draft?',
        message: 'You have an unsent message draft. Are you sure you want to close this chat and discard your draft?',
        onConfirm: () => {
          if (selectedAdminConv) {
            delete draftsRef.current[selectedAdminConv.buyer_id];
          }
          setSelectedAdminConv(null);
          setShowMsgSearch(false);
          setMsgSearch('');
          setInput('');
          setEditingMessage(null);
        }
      });
    } else {
      setSelectedAdminConv(null);
      setShowMsgSearch(false);
      setMsgSearch('');
      setInput('');
      setEditingMessage(null);
    }
  };

  const refreshCurrentChat = async () => {
    if (!selectedAdminConv) return;
    setIsRefreshing(true);
    setShowMenu(false);
    setMsgSearch('');
    setShowMsgSearch(false);
    try {
      const [msgRes, convRes] = await Promise.all([
        api.get(`/chat/conversation/${selectedAdminConv.buyer_id}`),
        api.get('/chat/conversations')
      ]);
      setMessages(msgRes.data || []);
      setConversations(convRes.data || []);
    } catch (err) {
      console.error('Failed to refresh chat data', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };
  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredConvs = conversations.filter(c => {
    return (c.buyer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.last_message || '').toLowerCase().includes(search.toLowerCase());
  });
  // Find users matching search who do NOT have an active conversation, excluding ourselves
  const filteredUsers = search.trim() ? allUsers.filter(u => {
    if (u.id === user?.id) return false;
    const isSupportUserWithAccess = u.role === 'admin' || (u.role === 'moderator' && (u.permissions || []).includes('chat'));
    if (!isSupportUserWithAccess) return false;

    const hasActiveConv = conversations.some(c => String(c.buyer_id) === String(u.id));
    const matchesSearch = (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase());
    return !hasActiveConv && matchesSearch;
  }) : [];

  const filteredMessages = msgSearch.trim()
    ? messages.filter(m => (m.message_text || '').toLowerCase().includes(msgSearch.toLowerCase()))
    : messages;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', background: '#fff', borderRadius: isMobile ? '1.5rem' : '3rem', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.03)', position: 'relative' }}>
      {activeDropdown !== null && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 90,
            background: 'transparent',
            cursor: 'default'
          }}
          onClick={(e) => {
            e.stopPropagation();
            setActiveDropdown(null);
          }}
        />
      )}

      {/* Sidebar */}
      <div style={{ width: isMobile ? '100%' : 320, borderRight: '1px solid #f1f5f9', display: isMobile && selectedAdminConv ? 'none' : 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', marginBottom: '1.25rem' }}>Messages</h2>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            {isSearchingConv ? (
              <RefreshCcw style={{ position: 'absolute', left: '1rem', width: 14, height: 14, color: '#2563eb', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <Search style={{ position: 'absolute', left: '1rem', width: 16, height: 16, color: '#94a3b8' }} />
            )}
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearch('');
                }
              }}
              style={{
                width: '100%',
                background: '#f8f9fc',
                border: '1px solid #f1f5f9',
                padding: search ? '0.75rem 2.5rem 0.75rem 2.75rem' : '0.75rem 1rem 0.75rem 2.75rem',
                borderRadius: '1.25rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Clear search"
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem 1.5rem', position: 'relative' }}>
          {filteredConvs.map(conv => (
            <button key={conv.id} onClick={() => handleSelectConversation(conv)} className="sidebar-conv-btn" style={{ width: '100%', border: 'none', background: selectedAdminConv?.id === conv.id ? '#2563eb08' : 'transparent', padding: '0.85rem 1.5rem 0.85rem 1rem', borderRadius: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s ease', marginBottom: '0.5rem', border: selectedAdminConv?.id === conv.id ? '1px solid #2563eb10' : '1px solid transparent' }}>
              {conv.buyer_avatar && conv.buyer_avatar !== 'null' && conv.buyer_avatar !== '' ? (
                <img src={getImageUrl(conv.buyer_avatar)} alt={conv.buyer_name} style={{ width: 40, height: 40, borderRadius: '0.85rem', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: '0.85rem', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.95rem', flexShrink: 0 }}>{conv.buyer_name?.charAt(0)}</div>
              )}
              <div style={{ flex: 1, textAlign: 'left', minWidth: 0, paddingRight: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.buyer_name}</span>
                  {conv.unread_count > 0 && <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#2563eb', color: '#fff', fontSize: '0.55rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{conv.unread_count}</div>}
                </div>
                <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.last_message || 'Start a conversation...'}</p>
              </div>
              <div
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: 'calc(50% - 14px)',
                  zIndex: activeDropdown === conv.id ? 100 : 20
                }}
                data-dropdown="true"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className={`conv-menu-btn ${activeDropdown === conv.id ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdown(activeDropdown === conv.id ? null : conv.id);
                  }}
                  title="Conversation options"
                  data-dropdown="true"
                >
                  <MoreVertical style={{ width: 14, height: 14 }} />
                </button>

                {activeDropdown === conv.id && (
                  <div
                    className="conv-dropdown-menu"
                    data-dropdown="true"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      marginTop: '0.25rem',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.75rem',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                      zIndex: 100,
                      minWidth: '150px',
                      overflow: 'hidden',
                      animation: 'fadeIn 0.15s ease-out'
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(null);
                        setConfirmModal({
                          show: true,
                          title: 'Delete conversation',
                          message: `Are you sure you want to permanently delete conversation with ${conv.buyer_name}?`,
                          onConfirm: () => deleteConversation(conv.id)
                        });
                      }}
                      style={{
                        width: '100%',
                        border: 'none',
                        background: 'transparent',
                        padding: '0.65rem 0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#ef4444',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                      Delete Chat
                    </button>
                  </div>
                )}
              </div>
            </button>
          ))}

          {filteredUsers.length > 0 && (
            <>
              <div style={{ margin: '1.5rem 0.5rem 0.75rem', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>
                Start New Chat
              </div>
              {filteredUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => {
                    const mockConv = {
                      id: `new-${user.id}`,
                      buyer_id: user.id,
                      buyer_name: user.full_name,
                      buyer_avatar: user.avatar_url,
                      last_message: 'Start a new conversation...',
                      unread_count: 0
                    };
                    handleSelectConversation(mockConv);
                  }}
                  style={{ width: '100%', border: 'none', background: 'transparent', padding: '0.85rem 1rem', borderRadius: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s ease', marginBottom: '0.5rem', border: '1px solid transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#2563eb08'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {user.avatar_url && user.avatar_url !== 'null' && user.avatar_url !== '' && !user.avatar_url.endsWith('/uploads/') ? (
                    <img src={getImageUrl(user.avatar_url)} alt={user.full_name} style={{ width: 40, height: 40, borderRadius: '0.85rem', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: '0.85rem', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.95rem', flexShrink: 0 }}>{user.full_name?.charAt(0)?.toUpperCase()}</div>
                  )}
                  <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#0f172a', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.full_name}</span>
                    <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: isMobile && !selectedAdminConv ? 'none' : 'flex', flexDirection: 'column', background: '#f8f9fc' }}>
        {selectedAdminConv ? (
          <>
            <div style={{ padding: '1rem 1.5rem', background: '#fff', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {isMobile && (
                  <button
                    onClick={() => setSelectedAdminConv(null)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.5rem 0.5rem 0.5rem 0', color: '#64748b' }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                <div
                  onClick={() => setShowProfilePanel(prev => !prev)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                  title="Click to view member profile"
                >
                  {selectedAdminConv.buyer_avatar && selectedAdminConv.buyer_avatar !== 'null' && selectedAdminConv.buyer_avatar !== '' ? (
                    <img src={getImageUrl(selectedAdminConv.buyer_avatar)} alt={selectedAdminConv.buyer_name} style={{ width: 40, height: 40, borderRadius: '0.85rem', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: '0.85rem', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{selectedAdminConv.buyer_name?.charAt(0)}</div>
                  )}
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{selectedAdminConv.buyer_name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <p style={{ fontSize: '0.6rem', fontWeight: 800, color: isPartnerOnline ? '#10b981' : '#94a3b8', margin: 0, letterSpacing: '0.05em' }}>
                        {isPartnerOnline ? 'Active' : 'Offline'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                  <button
                    ref={searchBtnRef}
                    onClick={() => setShowMsgSearch(v => { if (v) setMsgSearch(''); return !v; })}
                    className={`chat-header-btn chat-header-btn-search ${showMsgSearch ? 'active' : ''}`}
                    title="Search messages"
                  >
                    <Search style={{ width: 15, height: 15 }} />
                  </button>
                  <button
                    onClick={refreshCurrentChat}
                    className="chat-header-btn chat-header-btn-refresh"
                    title="Refresh chat"
                  >
                    <RefreshCcw style={{ width: 14, height: 14, animation: isRefreshing ? 'spin 0.6s linear infinite' : 'none' }} />
                  </button>
                  <button
                    onClick={handleCloseChat}
                    className="chat-header-btn chat-header-btn-close"
                    title="Close chat"
                  >
                    <X style={{ width: 15, height: 15 }} />
                  </button>
                </div>
              </div>

              {/* Chat body */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                {(isRefreshing || loadingMessages) && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(248, 249, 252, 0.75)',
                    backdropFilter: 'blur(3px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 40,
                    borderRadius: '1.5rem',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: '#fff',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #f1f5f9'
                    }}>
                      <RefreshCcw style={{ width: 22, height: 22, color: '#2563eb', animation: 'spin 0.8s linear infinite' }} />
                    </div>
                  </div>
                )}
                {/* Sticky search bar */}
                {showMsgSearch && (
                  <div ref={searchRef} style={{ padding: '0.5rem 1.5rem', borderBottom: '1px solid #f1f5f9', background: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isSearchingMsg ? (
                      <RefreshCcw style={{ width: 12, height: 12, color: '#2563eb', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                    ) : (
                      <Search style={{ width: 14, height: 14, color: '#94a3b8', flexShrink: 0 }} />
                    )}
                    <input
                      type="text"
                      placeholder="Search messages..."
                      value={msgSearch}
                      onChange={e => setMsgSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setShowMsgSearch(false);
                          setMsgSearch('');
                        }
                      }}
                      autoFocus
                      style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.8rem', fontWeight: 600, background: 'transparent', color: '#374151' }}
                    />
                    <button
                      onClick={() => {
                        if (msgSearch) {
                          setMsgSearch('');
                        } else {
                          setShowMsgSearch(false);
                        }
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}
                      title={msgSearch ? "Clear search" : "Close search"}
                    >
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                )}
                <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {filteredMessages.map((msg, i) => {
                    const isMe = msg.sender_id === user?.id;
                    const senderUser = allUsers.find(u => u.id === msg.sender_id);
                    const senderRole = msg.sender_role || senderUser?.role || (isMe ? user?.role : '');
                    const isSupport = senderRole === 'admin' || senderRole === 'moderator' || isMe;
                    const senderName = msg.sender_name || senderUser?.full_name || (isMe ? user?.full_name : 'Support');

                    const prevMsgDate = i > 0 ? new Date(filteredMessages[i - 1].created_at) : null;
                    const showDateSeparator = !prevMsgDate || new Date(msg.created_at).toDateString() !== prevMsgDate.toDateString();
                    return (
                      <React.Fragment key={msg.id || i}>
                        {showDateSeparator && <DateSeparator date={msg.created_at} />}
                        <div className="admin-msg-group" style={{ alignSelf: isSupport ? 'flex-end' : 'flex-start', maxWidth: '70%', display: 'flex', flexDirection: 'column', margin: '0.1rem 0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: isSupport ? 'row-reverse' : 'row' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: isSupport ? 'flex-end' : 'flex-start' }}>
                              <div style={{
                                background: isSupport ? (isMe ? '#2563eb' : '#7c3aed') : '#fff',
                                color: isSupport ? '#fff' : '#0f172a',
                                padding: '0.85rem 1.25rem',
                                borderRadius: isSupport ? '1.25rem 1.25rem 0.35rem 1.25rem' : '1.25rem 1.25rem 1.25rem 0.35rem',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                                border: isSupport ? 'none' : '1px solid #f1f5f9',
                                wordBreak: 'break-word',
                                whiteSpace: 'pre-wrap'
                              }}>
                                <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, lineHeight: 1.45 }}>{msg.message_text}</p>
                              </div>
                              <p style={{ fontSize: '0.58rem', fontWeight: 700, color: '#94a3b8', margin: '0.35rem 0.25rem 0 0.25rem', textAlign: isSupport ? 'right' : 'left' }}>
                                {formatMessageTime(msg.created_at)} {isSupport && (isMe ? ' (You)' : ` (by ${senderName})`)}
                              </p>
                            </div>
                            {isMe && (
                              <div className="admin-msg-actions">
                                <button
                                  onClick={() => setEditingMessage(msg)}
                                  className="admin-action-btn"
                                  title="Edit message"
                                >
                                  <Pencil style={{ width: 12, height: 12 }} />
                                </button>
                                <button
                                  onClick={() => {
                                    setConfirmModal({
                                      show: true,
                                      title: 'Delete message',
                                      message: 'Are you sure you want to delete this message?',
                                      onConfirm: () => deleteMessage(msg.id)
                                    });
                                  }}
                                  className="admin-action-btn"
                                  style={{ color: '#ef4444' }}
                                  title="Delete message"
                                >
                                  <Trash2 style={{ width: 12, height: 12 }} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  {isTyping && <div style={{ alignSelf: 'flex-start', background: '#fff', padding: '0.75rem 1.25rem', borderRadius: '1rem', border: '1px solid #f1f5f9' }}><div className="typing-loader" /></div>}
                </div>
              </div>

              <div style={{ padding: '1rem 1.5rem', background: '#fff', borderTop: '1px solid #f1f5f9' }}>
                <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem', position: 'relative', alignItems: 'flex-end' }}>
                  <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        sendTyping(e.target.value.length > 0);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(e);
                        }
                      }}
                      placeholder="Write a message..."
                      rows={1}
                      style={{
                        width: '100%',
                        background: '#f8f9fc',
                        border: '1px solid #f1f5f9',
                        padding: editingMessage ? '0.85rem 3rem 0.85rem 1.25rem' : '0.85rem 1.25rem',
                        borderRadius: '1.5rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        outline: 'none',
                        resize: 'none',
                        fontFamily: 'inherit',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        lineHeight: '1.4',
                        boxSizing: 'border-box'
                      }}
                    />
                    {editingMessage && (
                      <button
                        type="button"
                        onClick={() => setEditingMessage(null)}
                        style={{
                          position: 'absolute',
                          right: '1rem',
                          background: '#fee2e2',
                          border: 'none',
                          color: '#ef4444',
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          zIndex: 10
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        title="Cancel edit"
                      >
                        <X style={{ width: 12, height: 12 }} />
                      </button>
                    )}
                  </div>
                  <button type="submit" disabled={!input.trim()} style={{ width: 44, height: 44, borderRadius: '1.25rem', background: '#2563eb', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.2)', transition: 'all 0.3s ease', flexShrink: 0 }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}><Send style={{ width: 16, height: 16 }} /></button>
                </form>
              </div>
            </>
            ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ width: 80, height: 80, background: '#fff', borderRadius: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}><MessageSquare style={{ width: 32, height: 32 }} /></div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Start Support Session</h3>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', margin: 0 }}>Select a buyer from the sidebar to begin</p>
            </div>
        )}
          </div>

        {showProfilePanel && selectedAdminConv && (() => {
          const activeUser = allUsers.find(u => u.id === selectedAdminConv?.buyer_id) || {};
          const name = activeUser.full_name || selectedAdminConv?.buyer_name || 'Buyer';
          const avatar = activeUser.avatar_url || selectedAdminConv?.buyer_avatar;
          const email = activeUser.email || 'No email provided';
          const phone = activeUser.phone || 'No phone number';
          const address = activeUser.address || 'No location address provided';
          const role = activeUser.role || 'buyer';
          const joinDate = activeUser.created_at ? new Date(activeUser.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown';

          return (
            <div
              style={{
                width: isMobile ? '100%' : 320,
                borderLeft: isMobile ? 'none' : '1px solid #f1f5f9',
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
                padding: '2rem 1.5rem',
                position: isMobile ? 'absolute' : 'relative',
                inset: isMobile ? 0 : 'auto',
                zIndex: isMobile ? 120 : 'auto',
                boxShadow: '-10px 0 30px rgba(0,0,0,0.015)',
                animation: 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                overflowY: 'auto'
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowProfilePanel(false)}
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  border: 'none',
                  background: '#f8f9fc',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f8f9fc'; e.currentTarget.style.color = '#64748b'; }}
                title="Close details"
              >
                <X style={{ width: 14, height: 14 }} />
              </button>

              <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', margin: '0 0 1.5rem 0', letterSpacing: '0.02em' }}>Member Profile</h3>

              {/* Centered Avatar and Name */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '2rem' }}>
                {avatar && avatar !== 'null' && avatar !== '' ? (
                  <img src={getImageUrl(avatar)} alt={name} style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: '3px solid #eff6ff', boxShadow: '0 10px 25px rgba(37, 99, 235, 0.08)' }} />
                ) : (
                  <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '2rem', border: '3px solid #eff6ff', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.08)' }}>{name.charAt(0).toUpperCase()}</div>
                )}

                <h4 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', margin: '1rem 0 0.35rem 0' }}>{name}</h4>

                {/* Role capsule badge */}
                <span
                  style={{
                    fontSize: '0.6rem',
                    fontWeight: 900,
                    letterSpacing: '0.05em',
                    textTransform: 'capitalize',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    background: role === 'admin' ? '#fee2e2' : role === 'moderator' ? '#e0f2fe' : '#f1f5f9',
                    color: role === 'admin' ? '#ef4444' : role === 'moderator' ? '#0284c7' : '#64748b'
                  }}
                >
                  {role}
                </span>
              </div>

              {/* Information Details List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '0.5rem', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail style={{ width: 14, height: 14 }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.02em', marginBottom: '0.15rem' }}>Email Address</span>
                    <a href={`mailto:${email}`} style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', textDecoration: 'none', wordBreak: 'break-all' }}>{email}</a>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '0.5rem', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Phone style={{ width: 14, height: 14 }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.02em', marginBottom: '0.15rem' }}>Phone Number</span>
                    <a href={`tel:${phone}`} style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', textDecoration: 'none' }}>{phone}</a>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '0.5rem', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin style={{ width: 14, height: 14 }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.02em', marginBottom: '0.15rem' }}>Location Address</span>
                    <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>{address}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '0.5rem', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Calendar style={{ width: 14, height: 14 }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.02em', marginBottom: '0.15rem' }}>Member Since</span>
                    <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{joinDate}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        <DeleteConfirmModal
          isOpen={confirmModal.show}
          onClose={() => setConfirmModal({ ...confirmModal, show: false })}
          onConfirm={() => { confirmModal.onConfirm(); setConfirmModal({ ...confirmModal, show: false }); }}
          title={confirmModal.title}
          message={confirmModal.message}
        />

        <style>{`
        .typing-loader { width: 40px; height: 10px; display: flex; gap: 4px; justify-content: center; }
        .typing-loader::before, .typing-loader::after, .typing-loader { content: ""; border-radius: 50%; background: #2563eb; width: 6px; height: 6px; animation: bounce 0.6s infinite alternate; }
        .typing-loader::before { animation-delay: 0.2s; }
        .typing-loader::after { animation-delay: 0.4s; }
        @keyframes bounce { to { transform: translateY(-5px); opacity: 0.5; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
        
        .admin-msg-group {
          position: relative;
        }
        .admin-msg-group:hover .admin-msg-actions {
          opacity: 1;
          visibility: visible;
        }
        .admin-msg-actions {
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s ease;
          display: flex;
          gap: 0.25rem;
          margin: 0 0.5rem;
        }
        .admin-action-btn {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          padding: 0;
        }
        .admin-action-btn:hover {
          background: #eff6ff;
          color: #2563eb;
          transform: scale(1.08);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        }
        
        .sidebar-conv-btn {
          position: relative;
        }
        .sidebar-conv-btn:hover .conv-menu-btn,
        .conv-menu-btn.active {
          opacity: 1;
          visibility: visible;
        }
        .conv-menu-btn {
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s ease;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          padding: 0;
        }
        .conv-menu-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
          transform: scale(1.05);
        }
        
        .chat-header-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
        }
        
        .chat-header-btn-search {
          background: #f1f5f9;
          color: #475569;
        }
        .chat-header-btn-search:hover {
          background: #e2e8f0;
          color: #1e293b;
          transform: scale(1.08) translateY(-1px);
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
        }
        .chat-header-btn-search.active {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: #ffffff;
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
        }
        .chat-header-btn-search.active:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: scale(1.08) translateY(-1px);
        }
        
        .chat-header-btn-refresh {
          background: #f1f5f9;
          color: #475569;
        }
        .chat-header-btn-refresh:hover {
          background: #e2e8f0;
          color: #2563eb;
          transform: scale(1.08) translateY(-1px) rotate(30deg);
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
        }
        
        .chat-header-btn-close {
          background: #fee2e2;
          color: #ef4444;
        }
        .chat-header-btn-close:hover {
          background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);
          color: #ffffff;
          transform: scale(1.08) translateY(-1px);
          box-shadow: 0 6px 16px rgba(225, 29, 72, 0.35);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      </div>
      );
};

      export default AdminChat;
