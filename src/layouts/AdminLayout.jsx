import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, LogOut,
  Settings, ExternalLink, Tags, Users, User,
  Star, ShieldCheck, MessageSquare, Bell, Search,
  ChevronDown, Phone, Mail, Command, Calendar, Edit2,
  Loader2, Menu, X, Tag
} from 'lucide-react';
import api, { getImageUrl } from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import ConfirmModal from '../components/ConfirmModal';
import useChatStore from '../store/useChatStore';
import useSettingsStore from '../store/useSettingsStore';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true, roles: ['admin', 'moderator'], perm: 'dashboard' },
  { to: '/admin/chat', label: 'Messages', icon: MessageSquare, roles: ['admin', 'moderator'], perm: 'chat' },
  { to: '/admin/products', label: 'Products', icon: Package, roles: ['admin', 'moderator'], perm: 'products' },
  { to: '/admin/categories', label: 'Categories', icon: Tags, roles: ['admin', 'moderator'], perm: 'categories' },
  { to: '/admin/users', label: 'Users', icon: Users, roles: ['admin', 'moderator'], perm: 'users' },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart, roles: ['admin', 'moderator'], perm: 'orders' },
  { to: '/admin/reviews', label: 'Reviews', icon: Star, roles: ['admin', 'moderator'], perm: 'reviews' },
  { to: '/admin/settings', label: 'Settings', icon: Settings, roles: ['admin', 'moderator'], perm: 'settings' },
  { to: '/admin/coupons', label: 'Coupons', icon: Tag, roles: ['admin', 'moderator'], perm: 'coupons' },
];

export default function AdminLayout({ children }) {
  const { user, logout, token } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { totalUnreadCount, fetchTotalUnread } = useChatStore();
  const { settings, fetchSettings } = useSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (token) {
      fetchTotalUnread();
      const interval = setInterval(fetchTotalUnread, 10000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [allItems, setAllItems] = useState({ users: [], orders: [], products: [], categories: [], reviews: [], conversations: [] });
  const [filteredResults, setFilteredResults] = useState({ users: [], orders: [], products: [], categories: [], reviews: [], conversations: [] });

  // Premium Notifications State
  const [notifications, setNotifications] = useState(() => {
    try {
      const currentUser = useAuthStore.getState().user;
      const key = currentUser?.id ? `admin_notifications_${currentUser.id}` : 'admin_notifications';
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load user-specific notifications to prevent race conditions during auth transitions
  useEffect(() => {
    if (!user?.id) return;
    try {
      const saved = localStorage.getItem(`admin_notifications_${user.id}`);
      if (saved) {
        setNotifications(JSON.parse(saved));
      } else {
        const generic = localStorage.getItem('admin_notifications');
        if (generic) {
          setNotifications(JSON.parse(generic));
          localStorage.setItem(`admin_notifications_${user.id}`, generic);
        } else {
          setNotifications([]);
        }
      }
    } catch {
      setNotifications([]);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    try {
      localStorage.setItem(`admin_notifications_${user.id}`, JSON.stringify(notifications));
    } catch (err) {
      console.error('Failed to save admin notifications to localStorage', err);
    }
  }, [notifications, user?.id]);

  const [notiOpen, setNotiOpen] = useState(false);
  const [signOutModalOpen, setSignOutModalOpen] = useState(false);

  // Map WebSocket Event Types to Gorgeous Styles
  const getNotificationStyles = (type) => {
    switch (type) {
      case 'NEW_ORDER':
        return {
          bg: '#eff6ff',
          color: '#3b82f6',
          icon: ShoppingCart
        };
      case 'ORDER_CONFIRMED':
        return {
          bg: '#ecfdf5',
          color: '#10b981',
          icon: ShieldCheck
        };
      case 'ORDER_STATUS_UPDATED':
        return {
          bg: '#fffbeb',
          color: '#f59e0b',
          icon: ShoppingCart
        };
      case 'ORDER_DELETED':
        return {
          bg: '#fef2f2',
          color: '#ef4444',
          icon: X
        };
      default:
        return {
          bg: '#fff1f2',
          color: '#e11d48',
          icon: Bell
        };
    }
  };

  // Lightweight, smooth relative time formatter
  const formatTime = (dateInput) => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const markAllAsRead = (e) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = (e) => {
    e.stopPropagation();
    setNotifications([]);
  };

  const toggleRead = (id, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleOpenSearch = async () => {
    setSearchOpen(true);
    setSearchQuery('');
    setSearchLoading(true);

    const role = user?.role?.toLowerCase();
    const hasPerm = (perm) => {
      if (role === 'admin') return true;
      if (role === 'moderator') return user?.permissions?.includes(perm);
      return false;
    };

    try {
      const [usersRes, ordersRes, productsRes, categoriesRes, reviewsRes, conversationsRes] = await Promise.all([
        hasPerm('users') ? api.get('/users').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        hasPerm('orders') ? api.get('/admin/orders').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        hasPerm('products') ? api.get('/products?admin=true').catch(() => ({ data: { data: [] } })) : Promise.resolve({ data: { data: [] } }),
        hasPerm('categories') ? api.get('/categories').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        hasPerm('reviews') ? api.get('/admin/reviews').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        hasPerm('chat') ? api.get('/chat/conversations').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ]);
      setAllItems({
        users: hasPerm('users') ? (usersRes.data || []) : [],
        orders: hasPerm('orders') ? (ordersRes.data || []) : [],
        products: hasPerm('products') ? (productsRes.data?.data || []) : [],
        categories: hasPerm('categories') ? (categoriesRes.data || []) : [],
        reviews: hasPerm('reviews') ? (reviewsRes.data || []) : [],
        conversations: hasPerm('chat') ? (conversationsRes.data || []) : [],
      });
      setFilteredResults({ users: [], orders: [], products: [], categories: [], reviews: [], conversations: [] });
    } catch (err) {
      console.error('Failed to load search data', err);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredResults({ users: [], orders: [], products: [], categories: [], reviews: [], conversations: [] });
      return;
    }

    const query = searchQuery.toLowerCase();

    const usersList = Array.isArray(allItems?.users) ? allItems.users : [];
    const ordersList = Array.isArray(allItems?.orders) ? allItems.orders : [];
    const productsList = Array.isArray(allItems?.products) ? allItems.products : [];
    const categoriesList = Array.isArray(allItems?.categories) ? allItems.categories : [];
    const reviewsList = Array.isArray(allItems?.reviews) ? allItems.reviews : [];
    const conversationsList = Array.isArray(allItems?.conversations) ? allItems.conversations : [];

    const matchedUsers = usersList.filter(u =>
      (u?.full_name || '').toLowerCase().includes(query) ||
      (u?.email || '').toLowerCase().includes(query) ||
      (u?.phone || '').toLowerCase().includes(query)
    ).slice(0, 4);

    const matchedOrders = ordersList.filter(o =>
      (o?.id !== undefined && o?.id !== null && String(o.id).toLowerCase().includes(query)) ||
      (o?.user?.full_name || '').toLowerCase().includes(query) ||
      (o?.order_status || '').toLowerCase().includes(query)
    ).slice(0, 4);

    const matchedProducts = productsList.filter(p =>
      (p?.name || '').toLowerCase().includes(query) ||
      (p?.description || '').toLowerCase().includes(query)
    ).slice(0, 4);

    const matchedCategories = categoriesList.filter(c =>
      (c?.name || '').toLowerCase().includes(query)
    ).slice(0, 4);

    const matchedReviews = reviewsList.filter(r =>
      (r?.comment || '').toLowerCase().includes(query) ||
      (r?.user?.full_name || '').toLowerCase().includes(query) ||
      (r?.product?.name || '').toLowerCase().includes(query)
    ).slice(0, 4);

    const matchedConversations = conversationsList.filter(c =>
      (c?.other_user?.full_name || '').toLowerCase().includes(query) ||
      (c?.last_message || '').toLowerCase().includes(query)
    ).slice(0, 4);

    setFilteredResults({
      users: matchedUsers,
      orders: matchedOrders,
      products: matchedProducts,
      categories: matchedCategories,
      reviews: matchedReviews,
      conversations: matchedConversations,
    });
  }, [searchQuery, allItems]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleOpenSearch();
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click-outside to close search
  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [searchOpen]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // WebSocket connection for admin real-time events
  const wsRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectDelay = 30000; // 30 seconds

  useEffect(() => {
    if (!token) return;
    
    const apiBase = import.meta.env.VITE_API_BASE_URL || `${window.location.origin}/api/v1`;
    let baseWsUrl = apiBase.replace(/^http/, 'ws');
    // Fallback to ws:// if running on non-secure HTTP local development
    if (window.location.protocol === 'http:' && baseWsUrl.startsWith('wss://')) {
      baseWsUrl = baseWsUrl.replace(/^wss:/, 'ws:');
    }
    const wsUrl = `${baseWsUrl}/admin/orders/ws?token=${token}`;

    const connect = () => {
      wsRef.current = new WebSocket(wsUrl);
      wsRef.current.onopen = () => {
        reconnectAttempts.current = 0;
        console.log('Admin WebSocket connected');
      };
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const type = data.type;
          const message = data.message || '';
          const orderId = data.order_id;

          // Show toast based on event type
          if (type === 'NEW_ORDER') {
            toast.success(`🔔 New order! ${message}`);
          } else if (type === 'ORDER_CONFIRMED') {
            toast.success(`✅ Order confirmed! ${message}`);
          } else if (type === 'ORDER_STATUS_UPDATED') {
            toast.success(`🔄 Order status updated! ${message}`);
          } else if (type === 'ORDER_DELETED') {
            toast.error(`🗑️ Order deleted! ${message}`);
          } else {
            toast(message);
          }

          // Generate a unique ID based on the order ID if available to prevent duplicates
          const notiId = (type === 'NEW_ORDER' && orderId)
            ? `pending-order-${orderId}`
            : `order-event-${type}-${orderId || Date.now() + Math.random().toString(36).substr(2, 9)}`;

          const newNoti = {
            id: notiId,
            type: type || 'SYSTEM',
            message: message,
            time: new Date(),
            read: false
          };

          setNotifications(prev => {
            const exists = prev.some(n => n.id === notiId);
            if (exists) {
              // Update the existing notification
              return prev.map(n => n.id === notiId ? { ...n, message, time: new Date(), read: false } : n);
            }
            return [newNoti, ...prev];
          });

          // Dispatch custom event for other components to refresh data
          window.dispatchEvent(new Event('admin-order-update'));
        } catch (e) {
          console.error('Error handling admin websocket message', e);
        }
      };
      wsRef.current.onclose = () => {
        // Reconnect with exponential backoff
        const delay = Math.min(1000 * 2 ** reconnectAttempts.current, maxReconnectDelay);
        setTimeout(() => {
          reconnectAttempts.current += 1;
          connect();
        }, delay);
      };
      wsRef.current.onerror = (err) => {
        console.error('Admin WebSocket error', err);
        wsRef.current?.close();
      };
    };
    connect();

    return () => {
      if (wsRef.current) {
        // Remove listeners to avoid unmounted callback execution & connection leaks
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
      }
    };
  }, [token]);

  // Auto-sync pending orders from database to keep notifications updated
  useEffect(() => {
    if (!token || !user) return;
    const role = user?.role?.toLowerCase();
    if (role !== 'admin' && role !== 'moderator') return;

    const syncPendingOrders = async () => {
      try {
        const res = await api.get('/admin/orders');
        const orders = res.data || [];
        const pendingOrders = orders.filter(o => o.order_status === 'Pending');

        setNotifications(prev => {
          let updated = [...prev];
          let changed = false;

          // 1. Inject pending orders as new unread notifications if not present
          pendingOrders.forEach(order => {
            const notiId = `pending-order-${order.id}`;
            const exists = updated.some(n => n.id === notiId);
            if (!exists) {
              const newNoti = {
                id: notiId,
                type: 'NEW_ORDER',
                message: `Order #${order.id} is pending review.`,
                time: new Date(order.created_at),
                read: false
              };
              updated.push(newNoti);
              changed = true;
            }
          });

          // 2. Automatically mark existing notifications as read if the order is no longer pending
          updated = updated.map(n => {
            if (n.id.startsWith('pending-order-')) {
              const orderId = parseInt(n.id.replace('pending-order-', ''), 10);
              const order = orders.find(o => o.id === orderId);
              if (order && order.order_status !== 'Pending' && !n.read) {
                changed = true;
                return { ...n, read: true };
              }
            }
            return n;
          });

          if (changed) {
            // Sort notifications: newest first
            updated.sort((a, b) => new Date(b.time) - new Date(a.time));
            return updated;
          }
          return prev;
        });
      } catch (err) {
        console.error('Failed to sync pending orders for notifications:', err);
      }
    };

    syncPendingOrders();

    // Listen to administrative updates to re-sync notifications
    const handleUpdate = () => {
      syncPendingOrders();
    };
    window.addEventListener('admin-order-update', handleUpdate);
    return () => {
      window.removeEventListener('admin-order-update', handleUpdate);
    };
  }, [token, user]);

  const navItems = NAV_ITEMS.filter(item => {
    const role = user?.role?.toLowerCase();
    if (!item.roles.includes(role)) return false;
    if (role === 'moderator' && item.perm) return user.permissions?.includes(item.perm);
    return true;
  });

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });

  const renderSidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', padding: '0 0.5rem' }}>
        <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          {settings?.logo_url ? (
            <img src={getImageUrl(settings.logo_url)} alt="Logo" style={{ width: 38, height: 38, borderRadius: '0.85rem', objectFit: 'contain' }} />
          ) : (
            <div style={{ width: 38, height: 38, background: '#e11d48', borderRadius: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(225, 29, 72, 0.2)' }}>
              <span style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 900 }}>E.</span>
            </div>
          )}
          <div>
            <h1 style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Eraya.</h1>
            <p style={{ fontSize: '0.55rem', color: '#94a3b8', margin: 0, fontWeight: 600 }}>Admin Portal</p>
          </div>
        </Link>
        <a href="/" target="_blank" rel="noopener noreferrer" title="Visit Store" style={{ width: 28, height: 28, borderRadius: '0.75rem', background: '#f8f9fc', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', transition: 'all 0.3s ease', textDecoration: 'none' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#e11d48'; e.currentTarget.style.color = '#fff'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#f8f9fc'; e.currentTarget.style.color = '#94a3b8'; }}>
          <ExternalLink style={{ width: 12, height: 12 }} />
        </a>
      </div>

      {/* Nav List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        {navItems.map(({ to, label, icon: Icon, end }) => {
          const isActive = location.pathname === to || (to !== '/admin' && location.pathname.startsWith(to));
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.6rem 0.85rem',
                borderRadius: '1rem', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: isActive ? '#fff1f2' : 'transparent',
                color: isActive ? '#e11d48' : '#64748b',
                boxShadow: isActive ? '0 4px 12px rgba(225, 29, 72, 0.05)' : 'none'
              }}
            >
              <Icon style={{ width: 16, height: 16, opacity: isActive ? 1 : 0.6 }} />
              {label}
              {label === 'Messages' && totalUnreadCount > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  marginRight: isActive ? '0.50rem' : '0',
                  background: '#e11d48',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  borderRadius: '0.50rem',
                  padding: '0.15rem 0.45rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {totalUnreadCount}
                </span>
              )}
              {isActive && <motion.div layoutId="active" style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: '#e11d48' }} />}
            </NavLink>
          );
        })}
      </div>

      {/* User Card & Sign Out at Bottom */}
      <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
        <div style={{
          background: 'linear-gradient(135deg, #f8f9fc 0%, #f1f5f9 100%)',
          borderRadius: '1.75rem',
          padding: '1rem 1.25rem',
          border: '1px solid #f1f5f9',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Accent decoration */}
          <div style={{ position: 'absolute', top: '5%', right: '5%', width: 50, height: 50, background: '#e11d48', opacity: 0.02, borderRadius: '50%', filter: 'blur(15px)', pointerEvents: 'none' }} />

          {/* User Info Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: '0.85rem', overflow: 'hidden', border: '2px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', flexShrink: 0 }}>
              {user?.avatar_url ? <img src={getImageUrl(user.avatar_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ background: '#0f172a', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.85rem', fontWeight: 800 }}>{user?.full_name?.charAt(0)}</div>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name}</p>
              <p style={{ fontSize: '0.55rem', color: '#e11d48', margin: 0, fontWeight: 700, textTransform: 'capitalize', letterSpacing: '0.05em' }}>{user?.role}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/profile')}
              title="Edit Profile"
              style={{ width: 28, height: 28, borderRadius: '0.65rem', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer', transition: 'all 0.3s ease', flexShrink: 0 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e11d48'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#64748b'; }}
            >
              <Edit2 style={{ width: 12, height: 12 }} />
            </button>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: '#e2e8f0', opacity: 0.6 }} />

          {/* Phone & Email Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 20, height: 20, borderRadius: '0.5rem', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', flexShrink: 0 }}><Phone style={{ width: 9, height: 9 }} /></div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.phone || 'No phone set'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 20, height: 20, borderRadius: '0.5rem', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', flexShrink: 0 }}><Mail style={{ width: 9, height: 9 }} /></div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 20, height: 20, borderRadius: '0.5rem', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', flexShrink: 0 }}><Mail style={{ width: 9, height: 9 }} /></div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.address}</span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: '#e2e8f0', opacity: 0.6 }} />

          {/* Sign Out Button inside Card */}
          <button
            onClick={() => setSignOutModalOpen(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.65rem',
              borderRadius: '1rem',
              border: 'none',
              background: '#fff1f2',
              cursor: 'pointer',
              color: '#e11d48',
              fontSize: '0.75rem',
              fontWeight: 800,
              boxShadow: '0 2px 6px rgba(225,29,72,0.05)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#ffe4e6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff1f2'; }}
          >
            <LogOut style={{ width: 12, height: 12 }} /> Sign Out
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '1rem' : '2rem',
      padding: isMobile ? '1rem' : '0.5rem 1.5rem 1.5rem 1.5rem',
      background: 'linear-gradient(135deg, #f8f9fc 0%, #eef2f7 100%)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      overflowX: 'hidden'
    }}>
      {/* ── Mobile Top Bar ── */}
      {isMobile && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff',
          padding: '0.75rem 1.25rem',
          borderRadius: '1.5rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
          border: '1px solid #f1f5f9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            >
              <Menu size={24} />
            </button>
            <div>
              <span style={{ fontWeight: 900, fontSize: '0.9rem', color: '#0f172a', display: 'block', lineHeight: 1.1 }}>Eraya.</span>
              <span style={{ fontSize: '0.55rem', color: '#e11d48', fontWeight: 700, letterSpacing: '0.05em' }}>Admin Portal</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div onClick={handleOpenSearch} style={{ width: 38, height: 38, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}><Search size={16} /></div>
            <div style={{ width: 38, height: 38, borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
              {user?.avatar_url ? <img src={getImageUrl(user.avatar_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ background: '#0f172a', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 800 }}>{user?.full_name?.charAt(0)}</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Drawer Sidebar Overlay ── */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1999, display: 'flex' }}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }}
            />

            {/* Sidebar Container */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              style={{
                position: 'relative', width: 280, height: '100%', background: '#fff',
                boxShadow: '20px 0 50px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column',
                padding: '2rem 1.5rem', overflowY: 'auto'
              }}
            >
              {/* Close button */}
              <button
                onClick={() => setSidebarOpen(false)}
                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={16} />
              </button>

              {/* Navigation List & Details */}
              {renderSidebarContent()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Desktop Sidebar ── */}
      {!isMobile && (
        <aside style={{
          width: 250, flexShrink: 0, background: '#fff', borderRadius: '2.5rem',
          padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0,0,0,0.03)',
          position: 'sticky', top: '0.5rem', alignSelf: 'flex-start',
          height: 'calc(100vh - 1rem)', overflowY: 'visible',
        }}>
          {renderSidebarContent()}
        </aside>
      )}

      {/* ── Main area ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Header */}
        <header style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'flex-end',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between', width: isMobile ? '100%' : 'auto', flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={{ background: '#fff', borderRadius: '1.5rem', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9', width: isMobile ? '100%' : 'auto', justifyContent: 'center', marginTop: '-4px' }}>
              <Calendar style={{ width: 18, height: 18, color: '#94a3b8' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>{dateStr}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'center' : 'flex-start' }}>
              {/* 1. Inline sliding search container */}
              <div
                ref={searchRef}
                onClick={(e) => {
                  if (!searchOpen) {
                    handleOpenSearch();
                  }
                }}
                style={{
                  width: searchOpen ? (isMobile ? '240px' : '360px') : '48px',
                  height: 48,
                  background: '#fff',
                  borderRadius: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  padding: searchOpen ? '0 1rem' : '0',
                  justifyContent: searchOpen ? 'flex-start' : 'center',
                  color: '#64748b',
                  border: searchOpen ? '1px solid #e11d48' : '1px solid #f1f5f9',
                  cursor: 'pointer',
                  position: 'relative',
                  flex: isMobile && !searchOpen ? 1 : 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: searchOpen ? '0 10px 30px rgba(225, 29, 72, 0.05)' : 'none'
                }}
                onMouseEnter={e => { if (!searchOpen) e.currentTarget.style.borderColor = '#e11d48'; }}
                onMouseLeave={e => { if (!searchOpen) e.currentTarget.style.borderColor = '#f1f5f9'; }}
              >
                <Search style={{ width: 20, height: 20, flexShrink: 0, color: searchOpen ? '#e11d48' : '#64748b' }} />
                {searchOpen && (
                  <input
                    type="text"
                    placeholder="Search products, orders, members..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{
                      width: '100%',
                      border: 'none',
                      outline: 'none',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      background: 'transparent',
                      marginLeft: '0.50rem',
                      paddingRight: '1.5rem'
                    }}
                    autoFocus
                  />
                )}
                {searchOpen && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#f1f5f9',
                      color: '#94a3b8',
                      transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.color = '#e11d48'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#94a3b8'; }}
                  >
                    <X size={12} />
                  </div>
                )}

                {/* Floating Search Results Dropdown Popover */}
                <AnimatePresence>
                  {searchOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 12px)',
                        right: 0,
                        width: isMobile ? '280px' : '480px',
                        background: 'rgba(255, 255, 255, 0.96)',
                        backdropFilter: 'blur(16px)',
                        borderRadius: '1.5rem',
                        border: '1px solid rgba(225, 29, 72, 0.08)',
                        boxShadow: '0 20px 40px rgba(15, 23, 42, 0.12)',
                        zIndex: 999,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'default',
                        maxHeight: '400px'
                      }}
                    >
                      {/* Popover Content */}
                      <div style={{ overflowY: 'auto', padding: '1.25rem 1.5rem', flex: 1 }}>
                        {searchLoading ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', height: 160 }}>
                            <Loader2 className="animate-spin" size={20} style={{ color: '#e11d48' }} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>Syncing search database...</span>
                          </div>
                        ) : !searchQuery.trim() ? (
                          /* Quick Actions */
                          <div>
                            <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', textAlign: 'left' }}>Quick Navigation Actions</p>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.5rem' }}>
                              {[
                                { label: 'Dashboard', to: '/admin', desc: 'Overview metrics & logs' },
                                { label: 'Orders List', to: '/admin/orders', desc: 'Manage order status' },
                                { label: 'Products', to: '/admin/products', desc: 'Modify product stock' },
                                { label: 'Members', to: '/admin/users', desc: 'User accounts & roles' },
                              ].map((action, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    setSearchOpen(false);
                                    setSearchQuery('');
                                    navigate(action.to);
                                  }}
                                  style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.75rem', cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.2s', textAlign: 'left' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.borderColor = 'rgba(225, 29, 72, 0.1)'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = 'transparent'; }}
                                >
                                  <h4 style={{ margin: '0 0 0.15rem 0', fontSize: '0.75rem', fontWeight: 800, color: '#0f172a' }}>{action.label}</h4>
                                  <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 600, color: '#94a3b8' }}>{action.desc}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          /* Filtered Results */
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* Members */}
                            {filteredResults.users.length > 0 && (
                              <div>
                                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em', textAlign: 'left' }}>Members ({filteredResults.users.length})</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                  {filteredResults.users.map(u => (
                                    <div
                                      key={u.id}
                                      onClick={() => {
                                        setSearchOpen(false);
                                        setSearchQuery('');
                                        navigate(`/admin/users?search=${encodeURIComponent(u.full_name)}`);
                                      }}
                                      style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem', borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
                                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.65rem', fontWeight: 800 }}>
                                        {u.avatar_url && u.avatar_url !== 'null' && u.avatar_url !== '' ? <img src={getImageUrl(u.avatar_url)} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : u.full_name?.charAt(0).toUpperCase()}
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.full_name}</p>
                                        <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email} • <span style={{ textTransform: 'capitalize' }}>{u.role}</span></p>
                                      </div>
                                      <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#e11d48', flexShrink: 0 }}>View →</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Orders */}
                            {filteredResults.orders.length > 0 && (
                              <div>
                                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em', textAlign: 'left' }}>Orders ({filteredResults.orders.length})</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                  {filteredResults.orders.map(o => (
                                    <div
                                      key={o.id}
                                      onClick={() => {
                                        setSearchOpen(false);
                                        setSearchQuery('');
                                        navigate(`/admin/orders`);
                                      }}
                                      style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem', borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
                                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                      <div style={{ width: 26, height: 26, borderRadius: '0.5rem', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', flexShrink: 0 }}>
                                        <ShoppingCart size={12} />
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, color: '#0f172a' }}>Order #{o.id}</p>
                                        <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Buyer: {o.user?.full_name || 'Guest'} • Total: ৳{o.total_price}</p>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                                        <span style={{ fontSize: '0.55rem', fontWeight: 800, padding: '0.15rem 0.35rem', borderRadius: '0.4rem', background: o.order_status === 'Pending' ? '#fffbeb' : '#ecfdf5', color: o.order_status === 'Pending' ? '#b45309' : '#047857', textTransform: 'capitalize' }}>{o.order_status}</span>
                                        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#e11d48' }}>Manage →</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                             {/* Products */}
                             {filteredResults.products.length > 0 && (
                               <div>
                                 <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em', textAlign: 'left' }}>Products ({filteredResults.products.length})</p>
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                   {filteredResults.products.map(p => (
                                     <div
                                       key={p.id}
                                       onClick={() => {
                                         setSearchOpen(false);
                                         setSearchQuery('');
                                         navigate(`/admin/products?id=${p.id}`);
                                       }}
                                       style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem', borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
                                       onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                       onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                     >
                                       <div style={{ width: 26, height: 26, borderRadius: '0.5rem', background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                         {p.images && p.images.length > 0 ? <img src={getImageUrl(p.images.find(img => img.is_primary)?.image_url || p.images[0].image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={12} style={{ color: '#64748b' }} />}
                                       </div>
                                       <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                                         <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                                         <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 600, color: '#94a3b8' }}>৳{p.base_price} • Stock: {p.stock_count}</p>
                                       </div>
                                       <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#e11d48', flexShrink: 0 }}>View →</span>
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             )}
 
                             {/* Categories */}
                             {filteredResults.categories.length > 0 && (
                               <div>
                                 <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em', textAlign: 'left' }}>Categories ({filteredResults.categories.length})</p>
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                   {filteredResults.categories.map(c => (
                                     <div
                                       key={c.id}
                                       onClick={() => {
                                         setSearchOpen(false);
                                         setSearchQuery('');
                                         navigate(`/admin/categories?id=${c.id}`);
                                       }}
                                       style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem', borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
                                       onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                       onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                     >
                                       <div style={{ width: 26, height: 26, borderRadius: '0.5rem', overflow: 'hidden', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                         {c.image_url ? <img src={getImageUrl(c.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Tag size={12} style={{ color: '#64748b' }} />}
                                       </div>
                                       <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                                         <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</p>
                                         <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 600, color: '#94a3b8' }}>{c.product_count ?? 0} products</p>
                                       </div>
                                       <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#e11d48', flexShrink: 0 }}>View →</span>
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             )}

                            {/* Reviews */}
                            {filteredResults.reviews.length > 0 && (
                              <div>
                                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em', textAlign: 'left' }}>Reviews ({filteredResults.reviews.length})</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                  {filteredResults.reviews.map(r => (
                                    <div
                                      key={r.id}
                                      onClick={() => { setSearchOpen(false); setSearchQuery(''); navigate('/admin/reviews'); }}
                                      style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem', borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
                                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Star size={12} style={{ color: '#d97706' }} />
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.user?.full_name || 'User'} on {r.product?.name || 'Product'}</p>
                                        <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)} • {r.comment?.slice(0, 40)}{r.comment?.length > 40 ? '...' : ''}</p>
                                      </div>
                                      <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#e11d48', flexShrink: 0 }}>View →</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Conversations */}
                            {filteredResults.conversations.length > 0 && (
                              <div>
                                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em', textAlign: 'left' }}>Conversations ({filteredResults.conversations.length})</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                  {filteredResults.conversations.map(c => (
                                    <div
                                      key={c.id}
                                      onClick={() => { setSearchOpen(false); setSearchQuery(''); navigate('/admin/support'); }}
                                      style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem', borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
                                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <MessageSquare size={12} style={{ color: '#16a34a' }} />
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.other_user?.full_name || 'Buyer'}</p>
                                        <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.last_message?.slice(0, 50) || 'No messages yet'}</p>
                                      </div>
                                      <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#e11d48', flexShrink: 0 }}>Open →</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {filteredResults.users.length === 0 && filteredResults.orders.length === 0 && filteredResults.products.length === 0 && filteredResults.categories.length === 0 && filteredResults.reviews.length === 0 && filteredResults.conversations.length === 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', height: 160, color: '#94a3b8' }}>
                                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800 }}>No results found for "{searchQuery}"</p>
                                <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 600 }}>Try matching names, order IDs, or product titles.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. Messages Shortcut Button */}
              <button
                type="button"
                onClick={() => navigate('/admin/chat')}
                style={{
                  width: 48,
                  height: 48,
                  background: '#fff',
                  borderRadius: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  border: '1px solid #f1f5f9',
                  cursor: 'pointer',
                  position: 'relative',
                  flex: isMobile && !searchOpen ? 1 : 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#e11d48'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#f1f5f9'}
                title="Messages"
              >
                <MessageSquare style={{ width: 20, height: 20 }} />
                {totalUnreadCount > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    minWidth: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#e11d48',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #fff',
                    boxShadow: '0 4px 10px rgba(225, 29, 72, 0.2)',
                    padding: '0 4px'
                  }}>
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </div>
                )}
              </button>

              {/* 2. Interactive Notifications Bell popover */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setNotiOpen(!notiOpen);
                }}
                style={{
                  width: 48,
                  height: 48,
                  background: '#fff',
                  borderRadius: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  border: '1px solid #f1f5f9',
                  cursor: 'pointer',
                  position: 'relative',
                  flex: isMobile && !searchOpen ? 1 : 'none',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#e11d48'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#f1f5f9'}
              >
                <Bell style={{ width: 20, height: 20 }} />
                {notifications.some(n => !n.read) && (
                  <div style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, background: '#e11d48', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 6px #e11d48' }} />
                )}

                {/* Transparent Backdrop Click-Outside handler */}
                {notiOpen && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setNotiOpen(false);
                    }}
                    style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'transparent', cursor: 'default' }}
                  />
                )}

                {/* Notification Dropdown Popover */}
                <AnimatePresence>
                  {notiOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 12px)',
                        right: isMobile ? '-40px' : '0',
                        width: isMobile ? '300px' : '380px',
                        background: 'rgba(255, 255, 255, 0.96)',
                        backdropFilter: 'blur(16px)',
                        borderRadius: '1.5rem',
                        border: '1px solid rgba(225, 29, 72, 0.08)',
                        boxShadow: '0 20px 40px rgba(15, 23, 42, 0.12)',
                        zIndex: 999,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'default'
                      }}
                    >
                      {/* Popover Header */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1.25rem 1.5rem',
                        borderBottom: '1px solid #f1f5f9'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Notifications</span>
                          {notifications.filter(n => !n.read).length > 0 && (
                            <span style={{
                              background: '#fff1f2',
                              color: '#e11d48',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '0.5rem',
                              fontSize: '0.65rem',
                              fontWeight: 800
                            }}>
                              {notifications.filter(n => !n.read).length} new
                            </span>
                          )}
                        </div>
                        {notifications.filter(n => !n.read).length > 0 && (
                          <button
                            onClick={markAllAsRead}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#e11d48',
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              padding: 0
                            }}
                            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      {/* Popover List */}
                      <div style={{ flex: 1, overflowY: 'auto', maxHeight: '320px', padding: '0.5rem 0' }}>
                        {notifications.length === 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem', color: '#cbd5e1' }}>
                              <Bell size={20} />
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>All Caught Up!</span>
                            <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>No new notifications at the moment.</span>
                          </div>
                        ) : (
                          notifications.map((noti) => {
                            const styles = getNotificationStyles(noti.type);
                            const Icon = styles.icon;
                            return (
                              <div
                                key={noti.id}
                                onClick={(e) => toggleRead(noti.id, e)}
                                style={{
                                  display: 'flex',
                                  gap: '0.85rem',
                                  padding: '0.85rem 1.25rem',
                                  borderBottom: '1px solid #f8fafc',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  background: noti.read ? 'transparent' : 'rgba(225, 29, 72, 0.02)',
                                  position: 'relative',
                                  alignItems: 'center'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(225, 29, 72, 0.04)'}
                                onMouseLeave={e => e.currentTarget.style.background = noti.read ? 'transparent' : 'rgba(225, 29, 72, 0.02)'}
                              >
                                <div style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '0.75rem',
                                  background: styles.bg,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: styles.color,
                                  flexShrink: 0
                                }}>
                                  <Icon size={14} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{
                                    margin: '0 0 0.25rem 0',
                                    fontSize: '0.75rem',
                                    fontWeight: noti.read ? 600 : 800,
                                    color: noti.read ? '#64748b' : '#0f172a',
                                    lineHeight: '1.2rem',
                                    wordBreak: 'break-word',
                                    textAlign: 'left'
                                  }}>
                                    {noti.message}
                                  </p>
                                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, display: 'block', textAlign: 'left' }}>
                                    {formatTime(noti.time)}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                  {!noti.read && (
                                    <div style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: '50%',
                                      background: '#e11d48',
                                      boxShadow: '0 0 8px #e11d48'
                                    }} />
                                  )}
                                  <button
                                    onClick={(e) => deleteNotification(noti.id, e)}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: '#94a3b8',
                                      cursor: 'pointer',
                                      padding: '0.2rem',
                                      opacity: 0.6,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'opacity 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                    onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Popover Footer */}
                      {notifications.length > 0 && (
                        <div style={{
                          padding: '1rem 1.5rem',
                          borderTop: '1px solid #f1f5f9',
                          display: 'flex',
                          justifyContent: 'center',
                          background: '#fafbfc'
                        }}>
                          <button
                            onClick={clearAll}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#64748b',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#e11d48'}
                            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                          >
                            Clear all notifications
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. User profile photo dropdown link inside a gorgeous box */}
              {!isMobile && (
                <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.5rem 0.95rem',
                  borderRadius: '0.75rem',
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
                  flexShrink: 0
                }}
              >
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', paddingLeft: '0.25rem' }}>
                    {user?.full_name}
                  </span>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    border: '2px solid #fff',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
                    flexShrink: 0,
                    background: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {user?.avatar_url ? (
                      <img src={getImageUrl(user.avatar_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{
                        background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '0.9rem'
                      }}>
                        {user?.full_name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        {/* Page content */}
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>

      <ConfirmModal
        isOpen={signOutModalOpen}
        onClose={() => setSignOutModalOpen(false)}
        onConfirm={logout}
        title="Sign Out of Portal?"
        message="Are you sure you want to end your active Eraya administration session?"
        confirmText="Sign Out"
        cancelText="Stay Connected"
        variant="danger"
      />
    </div>
  );
}
