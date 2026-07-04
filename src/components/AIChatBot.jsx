import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Bot, User, RotateCcw, ShoppingBag, HelpCircle, TrendingUp } from 'lucide-react';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';

const AIChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    setError('');

    const userMsg = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: text.trim(),
        history: messages.slice(-18),
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Something went wrong. Please try again.';
      if (err.response?.status === 429) {
        setError('You\'re sending messages too fast. Please wait a moment. ⏳');
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: errMsg, isError: true }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickAction = (text) => {
    sendMessage(text);
  };

  const clearChat = () => {
    setMessages([]);
    setError('');
  };

  const formatMessage = (text) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:#f1f5f9;padding:1px 4px;border-radius:3px;font-size:0.8em">$1</code>')
      .replace(/^(\d+)\.\s/gm, '<span style="color:#e11d48;font-weight:800">$1.</span> ')
      .replace(/^[-•]\s/gm, '<span style="color:#e11d48">•</span> ')
      .replace(/৳(\d[\d,]*)/g, '<span style="color:#e11d48;font-weight:800">৳$1</span>')
      .replace(/\n/g, '<br/>');
  };

  const quickActions = [
    { icon: ShoppingBag, label: 'Product Suggestions', text: 'Show me your best selling products' },
    { icon: TrendingUp, label: 'Deals & Offers', text: 'Do you have any discounted products right now?' },
    { icon: HelpCircle, label: 'Help', text: 'How do I place an order and what are the payment options?' },
  ];

  const hasMainChat = user && user.role !== 'admin' && user.role !== 'moderator';
  const buttonBottom = hasMainChat ? 96 : 24;

  return (
    <>
      {/* Floating AI Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            style={{
              position: 'fixed',
              bottom: buttonBottom,
              right: 24,
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(15, 23, 42, 0.35), 0 0 0 3px rgba(225, 29, 72, 0.15)',
              zIndex: 998,
              color: '#fff',
            }}
            aria-label="Open AI Assistant"
          >
            <Sparkles size={22} style={{ filter: 'drop-shadow(0 0 6px rgba(225,29,72,0.4))' }} />
            <span style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#e11d48',
              border: '2px solid #fff',
              animation: 'aichat-pulse 2s ease-in-out infinite',
            }} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed',
              bottom: buttonBottom + (isOpen && !hasMainChat ? 0 : (isOpen ? -72 : 0)),
              right: 24,
              width: Math.min(400, window.innerWidth - 48),
              height: Math.min(600, window.innerHeight - 48),
              background: '#ffffff',
              borderRadius: '1.5rem',
              boxShadow: '0 25px 60px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              zIndex: 999,
            }}
          >
            {/* Header */}
            <div style={{
              padding: '1rem 1.25rem',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '0.75rem',
                  background: 'rgba(225, 29, 72, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(225, 29, 72, 0.25)',
                }}>
                  <Sparkles size={18} style={{ color: '#fb7185' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
                    Eraya AI
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 600, color: '#94a3b8' }}>
                    Shopping Assistant • Always Online
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    style={{
                      width: 32, height: 32, borderRadius: '0.65rem',
                      background: 'rgba(255,255,255,0.08)', border: 'none',
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: '#94a3b8',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#94a3b8'; }}
                    title="Clear chat"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    width: 32, height: 32, borderRadius: '0.65rem',
                    background: 'rgba(255,255,255,0.08)', border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: '#94a3b8',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#94a3b8'; }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                background: '#fafbfc',
                scrollbarWidth: 'thin',
                scrollbarColor: '#e2e8f0 transparent',
              }}
            >
              {messages.length === 0 && !loading && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1.25rem', padding: '1rem' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '1.25rem',
                    background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1.5px solid #fecdd3',
                  }}>
                    <Bot size={28} style={{ color: '#e11d48' }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                      Hi {user?.full_name?.split(' ')[0] || 'there'}! 👋
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', fontWeight: 600, lineHeight: 1.5 }}>
                      I can help you find products, track orders, and answer your questions about Eraya.
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                    {quickActions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickAction(action.text)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.6rem',
                          padding: '0.7rem 0.85rem', background: '#fff',
                          border: '1.5px solid #f1f5f9', borderRadius: '0.85rem',
                          cursor: 'pointer', transition: 'all 0.2s',
                          textAlign: 'left', width: '100%',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#e11d48'; e.currentTarget.style.background = '#fff8f8'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.background = '#fff'; }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: '0.6rem',
                          background: '#fff1f2', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <action.icon size={15} style={{ color: '#e11d48' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
                          {action.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    gap: '0.5rem',
                    alignItems: 'flex-end',
                  }}
                >
                  {msg.role === 'assistant' && (
                    <div style={{
                      width: 26, height: 26, borderRadius: '0.5rem',
                      background: '#0f172a', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Sparkles size={13} style={{ color: '#fb7185' }} />
                    </div>
                  )}
                  <div style={{
                    maxWidth: '80%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: msg.role === 'user' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
                      : msg.isError ? '#fff5f5' : '#ffffff',
                    color: msg.role === 'user' ? '#fff' : msg.isError ? '#e11d48' : '#1e293b',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    lineHeight: 1.6,
                    border: msg.role === 'user' ? 'none' : `1px solid ${msg.isError ? '#fecdd3' : '#f1f5f9'}`,
                    boxShadow: msg.role === 'user' ? '0 4px 12px rgba(15,23,42,0.15)' : '0 2px 8px rgba(0,0,0,0.03)',
                  }}
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                  />
                  {msg.role === 'user' && (
                    <div style={{
                      width: 26, height: 26, borderRadius: '0.5rem',
                      background: '#e11d48', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <User size={13} style={{ color: '#fff' }} />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: '0.5rem',
                    background: '#0f172a', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Sparkles size={13} style={{ color: '#fb7185' }} />
                  </div>
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '1rem 1rem 1rem 0.25rem',
                    background: '#fff',
                    border: '1px solid #f1f5f9',
                    display: 'flex', gap: '0.3rem', alignItems: 'center',
                  }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: '#cbd5e1',
                        animation: `aichat-bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
                        display: 'inline-block',
                      }} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Rate limit error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    padding: '0.6rem 0.85rem', borderRadius: '0.75rem',
                    background: '#fffbeb', border: '1px solid #fde68a',
                    fontSize: '0.72rem', fontWeight: 700, color: '#92400e',
                    textAlign: 'center',
                  }}
                >
                  {error}
                </motion.div>
              )}
            </div>

            {/* Input Area */}
            <form
              onSubmit={handleSubmit}
              style={{
                padding: '0.75rem 1rem',
                borderTop: '1px solid #f1f5f9',
                background: '#fff',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={loading}
                maxLength={1000}
                autoComplete="off"
                name="ai_chat_input"
                style={{
                  flex: 1,
                  padding: '0.7rem 1rem',
                  border: '1.5px solid #f1f5f9',
                  borderRadius: '0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  outline: 'none',
                  background: '#f8fafc',
                  transition: 'border-color 0.15s',
                  fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = '#e11d48'}
                onBlur={e => e.target.style.borderColor = '#f1f5f9'}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                style={{
                  width: 40, height: 40, borderRadius: '0.85rem',
                  background: input.trim() && !loading ? '#0f172a' : '#e2e8f0',
                  border: 'none',
                  cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: input.trim() && !loading ? '#fff' : '#94a3b8',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animations */}
      <style>{`
        @keyframes aichat-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        @keyframes aichat-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
      `}</style>
    </>
  );
};

export default AIChatBot;
