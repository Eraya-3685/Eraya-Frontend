import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, UserCheck, UserPlus, Trash2,
  Shield, Phone, MoreVertical, X, Check,
  User as UserIcon, ShieldAlert, ShieldCheck,
  Eye, EyeOff, Lock, ChevronDown, RefreshCcw
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../api/axios';
import toast from 'react-hot-toast';
import AdminDropdown from '../components/AdminDropdown';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import useAuthStore from '../store/useAuthStore';

const PERM_LABELS = {
  chat: 'Messages',
  products: 'Products',
  categories: 'Categories',
  orders: 'Orders',
  reviews: 'Reviews',
};

const AdminUsers = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, user: null });
  const [expandedPermissions, setExpandedPermissions] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'full_name', direction: 'asc' });
  const { user: currentUser } = useAuthStore();

  const [roleAuthModal, setRoleAuthModal] = useState({
    isOpen: false,
    targetUser: null,
    newRole: '',
    password: '',
    showPassword: false,
    submitting: false,
    selectedPermissions: [],
    otp: '',
    otpSent: false,
    sendingOtp: false
  });

  const activeRole = searchParams.get('role') || 'all';

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async (showSilently = false) => {
    if (!showSilently) setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data || []);
    } catch {
      toast.error('Failed to fetch users');
    }

    try {
      const ordersRes = await api.get('/admin/orders');
      setOrders(ordersRes.data || []);
    } catch (err) {
      console.warn('Failed to fetch orders:', err);
    } finally {
      if (!showSilently) setLoading(false);
    }
  };

  const handleSortRequest = (key) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const closeModal = () => {
    setRoleAuthModal({
      isOpen: false,
      targetUser: null,
      newRole: '',
      password: '',
      showPassword: false,
      submitting: false,
      selectedPermissions: [],
      otp: '',
      otpSent: false,
      sendingOtp: false
    });
  };

  const sendRoleChangeOTP = async () => {
    setRoleAuthModal(prev => ({ ...prev, sendingOtp: true }));
    try {
      await api.post('/users/otp/request', { purpose: 'admin_role_change' });
      toast.success('Security verification code sent to your email');
      setRoleAuthModal(prev => ({ ...prev, otpSent: true, sendingOtp: false }));
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data || 'Failed to send verification code');
      setRoleAuthModal(prev => ({ ...prev, sendingOtp: false }));
    }
  };

  const handleRoleChange = async (targetUser, newRole) => {
    if (targetUser.role === newRole && newRole !== 'moderator') return;

    let initialPerms = [];
    if (newRole === 'moderator') {
      if (targetUser.role === 'moderator') {
        initialPerms = (targetUser.permissions || []).filter(p => p !== 'users');
      } else {
        initialPerms = ['dashboard', 'chat', 'products', 'categories', 'orders', 'reviews', 'settings'];
      }
    }

    const needsOtp = newRole === 'admin' || targetUser.role === 'admin';

    setRoleAuthModal({
      isOpen: true,
      targetUser,
      newRole,
      password: '',
      showPassword: false,
      submitting: false,
      selectedPermissions: initialPerms,
      otp: '',
      otpSent: false,
      sendingOtp: false
    });

    if (needsOtp) {
      setTimeout(() => {
        sendRoleChangeOTP();
      }, 50);
    }
  };

  const submitRoleChange = async () => {
    if (!roleAuthModal.password) {
      toast.error('Please enter your password');
      return;
    }

    const needsOtp = roleAuthModal.newRole === 'admin' || roleAuthModal.targetUser?.role === 'admin';
    if (needsOtp && !roleAuthModal.otp) {
      toast.error('Please enter the verification code (OTP) sent to your email');
      return;
    }

    setRoleAuthModal(prev => ({ ...prev, submitting: true }));
    try {
      await api.post('/users/bulk-role', {
        ids: [roleAuthModal.targetUser.id],
        role: roleAuthModal.newRole,
        permissions: roleAuthModal.newRole === 'moderator' ? roleAuthModal.selectedPermissions : [],
        password: roleAuthModal.password,
        otp: needsOtp ? roleAuthModal.otp : ''
      });

      const successMessage = roleAuthModal.targetUser?.role === 'moderator' && roleAuthModal.newRole === 'moderator'
        ? 'Moderator permissions updated successfully'
        : `Role updated successfully to ${roleAuthModal.newRole}`;

      closeModal();
      toast.success(successMessage);
      await fetchUsers(true);
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data || 'Verification failed. Please check your credentials.');
    } finally {
      setRoleAuthModal(prev => ({ ...prev, submitting: false }));
    }
  };



  const handleDeleteUser = async () => {
    try {
      await api.delete(`/users/${confirmModal.user.id}`);
      toast.success('User removed');
      fetchUsers();
      setConfirmModal({ isOpen: false, user: null });
    } catch {
      toast.error('Failed to remove user');
    }
  };

  const confirmedStatuses = ['confirmed', 'processing', 'shipped', 'delivered'];
  const confirmedOrders = orders.filter(o => confirmedStatuses.includes(o.order_status?.toLowerCase()));

  // Sort by order's created_at descending (newest order first)
  const sortedConfirmedOrders = [...confirmedOrders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const recentConfirmedUserIds = [];
  const seenUserIds = new Set();
  for (const order of sortedConfirmedOrders) {
    if (!seenUserIds.has(order.user_id)) {
      seenUserIds.add(order.user_id);
      recentConfirmedUserIds.push(order.user_id);
    }
  }

  const visibleUsers = users.filter(u => u.id !== currentUser?.id);

  const activeRecentBuyers = recentConfirmedUserIds
    .map(id => visibleUsers.find(u => u.id === id))
    .filter(Boolean);

  const filteredUsers = visibleUsers.filter(u => {
    const matchesSearch = (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || '').toLowerCase().includes(search.toLowerCase());

    if (activeRole === 'recent') {
      const isRecent = activeRecentBuyers.some(rb => rb.id === u.id);
      return matchesSearch && isRecent;
    }

    const matchesRole = activeRole === 'all' || u.role?.toLowerCase() === activeRole.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const sortedUsers = React.useMemo(() => {
    let sortableItems = [...filteredUsers];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'full_name') {
          aVal = (a.full_name || '').toLowerCase();
          bVal = (b.full_name || '').toLowerCase();
        } else if (sortConfig.key === 'role') {
          aVal = (a.role || '').toLowerCase();
          bVal = (b.role || '').toLowerCase();
        } else if (sortConfig.key === 'email') {
          aVal = (a.email || '').toLowerCase();
          bVal = (b.email || '').toLowerCase();
        }

        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    if (activeRole === 'recent') {
      sortableItems.sort((a, b) => {
        const indexA = recentConfirmedUserIds.indexOf(a.id);
        const indexB = recentConfirmedUserIds.indexOf(b.id);
        return indexA - indexB;
      });
    }
    return sortableItems;
  }, [filteredUsers, sortConfig, activeRole, recentConfirmedUserIds]);

  const RoleBadge = ({ role = 'buyer', onClick, style: customStyle }) => {
    const styles = {
      admin: { bg: '#fff1f2', text: '#e11d48', icon: ShieldAlert },
      moderator: { bg: '#eff6ff', text: '#3b82f6', icon: ShieldCheck },
      buyer: { bg: '#f8f9fc', text: '#64748b', icon: UserIcon },
    };
    const safeRole = (role || 'buyer').toLowerCase();
    const style = styles[safeRole] || styles.buyer;
    const clickable = safeRole === 'moderator' && onClick;
    return (
      <div
        onClick={onClick}
        title={clickable ? "Click to toggle active permissions" : undefined}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.35rem 0.75rem',
          borderRadius: '1rem',
          background: style.bg,
          color: style.text,
          fontSize: '0.65rem',
          fontWeight: 900,
          textTransform: 'capitalize',
          letterSpacing: '0.05em',
          cursor: clickable ? 'pointer' : 'default',
          userSelect: 'none',
          transition: 'all 0.2s',
          border: clickable ? '1px solid #3b82f620' : '1px solid transparent',
          ...customStyle
        }}
        onMouseEnter={e => {
          if (clickable) {
            e.currentTarget.style.transform = 'scale(1.03)';
            e.currentTarget.style.borderColor = '#3b82f640';
          }
        }}
        onMouseLeave={e => {
          if (clickable) {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.borderColor = '#3b82f620';
          }
        }}
      >
        <style.icon size={10} />
        <span>{role || 'buyer'}</span>
        {clickable && (
          <ChevronDown
            size={10}
            style={{
              marginLeft: '0.15rem',
              color: '#3b82f680',
              transition: 'transform 0.2s',
              transform: customStyle?.transform?.includes('rotate') ? 'rotate(180deg)' : 'none'
            }}
          />
        )}
      </div>
    );
  };

  const tabs = [
    { id: 'all', label: 'All Members', count: visibleUsers.length },
    { id: 'recent', label: 'Recent Buyers', count: activeRecentBuyers.length },
    { id: 'admin', label: 'Admins', count: visibleUsers.filter(u => u.role?.toLowerCase() === 'admin').length },
    { id: 'moderator', label: 'Moderators', count: visibleUsers.filter(u => u.role?.toLowerCase() === 'moderator').length },
    { id: 'buyer', label: 'Buyers', count: visibleUsers.filter(u => u.role?.toLowerCase() === 'buyer').length },
  ];

  const handleTabClick = (tabId) => {
    if (tabId === 'all') {
      navigate('/admin/users');
    } else {
      navigate(`/admin/users?role=${tabId}`);
    }
  };

  const getHeaderTitle = () => {
    switch (activeRole.toLowerCase()) {
      case 'recent':
        return 'Recent Active Buyers';
      case 'admin':
        return 'Admins';
      case 'moderator':
        return 'Moderators';
      case 'buyer':
        return 'Buyers';
      default:
        return 'Users Control';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>
          {getHeaderTitle()}
        </h1>
      </div>

      {/* Category Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid #f1f5f9',
        paddingBottom: '0.75rem',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none'
      }}>
        {tabs.map((tab) => {
          const isActive = activeRole.toLowerCase() === tab.id.toLowerCase();
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.1rem',
                borderRadius: '0.85rem',
                border: 'none',
                background: isActive ? '#fff1f2' : 'transparent',
                color: isActive ? '#e11d48' : '#64748b',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#f8f9fc';
                  e.currentTarget.style.color = '#0f172a';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#64748b';
                }
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 900,
                padding: '0.15rem 0.45rem',
                borderRadius: '0.5rem',
                background: isActive ? '#e11d48' : '#f1f5f9',
                color: isActive ? '#fff' : '#64748b',
                transition: 'all 0.2s'
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
         <div style={{ position: 'relative', flex: 1, maxWidth: 350 }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              autoComplete="off"
              name="search_users_input"
              style={{ 
                width: '100%', 
                background: '#fff', 
                border: '1px solid #f1f5f9', 
                padding: '0 1rem 0 2.75rem', 
                height: 38,
                boxSizing: 'border-box',
                borderRadius: '1rem', 
                fontSize: '0.8rem', 
                fontWeight: 600, 
                outline: 'none', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.01)' 
              }} 
            />
         </div>
         <button 
           onClick={() => { fetchUsers(); setSearch(''); }} 
           style={{ 
             width: 38, 
             height: 38, 
             borderRadius: '1rem', 
             border: '1px solid #f1f5f9', 
             background: '#fff', 
             display: 'flex', 
             alignItems: 'center', 
             justifyContent: 'center', 
             color: '#64748b', 
             cursor: 'pointer', 
             boxSizing: 'border-box',
             transition: 'all 0.2s' 
           }} 
           onMouseEnter={e => e.currentTarget.style.borderColor = '#e11d48'} 
           onMouseLeave={e => e.currentTarget.style.borderColor = '#f1f5f9'}
         >
           <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
         </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '1.75rem', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8f9fc', borderBottom: '1px solid #f1f5f9' }}>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.72rem', fontWeight: 800, color: '#64748b' }}>
                <div
                  onClick={() => handleSortRequest('full_name')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', userSelect: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#e11d48'}
                  onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                >
                  <span>Member</span>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 0.6, fontSize: 7, fontWeight: 900 }}>
                    <span style={{ color: sortConfig?.key === 'full_name' && sortConfig?.direction === 'asc' ? '#e11d48' : '#cbd5e1' }}>▲</span>
                    <span style={{ color: sortConfig?.key === 'full_name' && sortConfig?.direction === 'desc' ? '#e11d48' : '#cbd5e1' }}>▼</span>
                  </div>
                </div>
              </th>
              <th style={{ padding: '1rem', fontSize: '0.72rem', fontWeight: 800, color: '#64748b' }}>
                <div
                  onClick={() => handleSortRequest('role')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', userSelect: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#e11d48'}
                  onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                >
                  <span>Role</span>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 0.6, fontSize: 7, fontWeight: 900 }}>
                    <span style={{ color: sortConfig?.key === 'role' && sortConfig?.direction === 'asc' ? '#e11d48' : '#cbd5e1' }}>▲</span>
                    <span style={{ color: sortConfig?.key === 'role' && sortConfig?.direction === 'desc' ? '#e11d48' : '#cbd5e1' }}>▼</span>
                  </div>
                </div>
              </th>
              <th style={{ padding: '1rem', fontSize: '0.72rem', fontWeight: 800, color: '#64748b' }}>
                <div
                  onClick={() => handleSortRequest('email')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', userSelect: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#e11d48'}
                  onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                >
                  <span>Contact</span>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 0.6, fontSize: 7, fontWeight: 900 }}>
                    <span style={{ color: sortConfig?.key === 'email' && sortConfig?.direction === 'asc' ? '#e11d48' : '#cbd5e1' }}>▲</span>
                    <span style={{ color: sortConfig?.key === 'email' && sortConfig?.direction === 'desc' ? '#e11d48' : '#cbd5e1' }}>▼</span>
                  </div>
                </div>
              </th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: '4rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1' }}>Syncing Database...</td></tr>
            ) : sortedUsers.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f8f9fc' }} onMouseEnter={(e) => e.currentTarget.style.background = '#fcfdfe'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '0.75rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '1rem', overflow: 'hidden', background: '#f8f9fc', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', fontWeight: 900, fontSize: '0.95rem', flexShrink: 0 }}>
                      {u.avatar_url && u.avatar_url !== 'null' && u.avatar_url !== '' && !u.avatar_url.endsWith('/uploads/') ? <img src={getImageUrl(u.avatar_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.95rem', fontWeight: 900 }}>{u.full_name?.charAt(0)?.toUpperCase() || 'U'}</div>}
                    </div>
                    <div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{u.full_name}</p>
                      <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', margin: 0 }}>ID: #M-{u.id}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <RoleBadge
                    role={u.role}
                    onClick={u.role?.toLowerCase() === 'moderator' ? () => {
                      setExpandedPermissions(prev => ({ ...prev, [u.id]: !prev[u.id] }));
                    } : undefined}
                    style={u.role?.toLowerCase() === 'moderator' ? {
                      transform: expandedPermissions[u.id] ? 'scale(1.02)' : 'none'
                    } : undefined}
                  />

                  <AnimatePresence initial={false}>
                    {u.role?.toLowerCase() === 'moderator' && expandedPermissions[u.id] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 6 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.2rem',
                          maxWidth: '180px',
                          overflow: 'hidden'
                        }}
                      >
                        {u.permissions && u.permissions.length > 0 ? (
                          u.permissions.map(p => (
                            <span
                              key={p}
                              style={{
                                fontSize: '0.52rem',
                                fontWeight: 800,
                                color: '#475569',
                                background: '#f1f5f9',
                                padding: '0.1rem 0.35rem',
                                borderRadius: '0.35rem',
                                textTransform: 'capitalize',
                                border: '1px solid #e2e8f0',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {PERM_LABELS[p] || p}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.52rem', fontWeight: 800, color: '#ef4444', background: '#fee2e2', padding: '0.1rem 0.35rem', borderRadius: '0.35rem', border: '1px solid #fecaca', whiteSpace: 'nowrap' }}>
                            No Access
                          </span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{u.email}</p>
                  <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', margin: 0 }}>{u.phone || 'No phone'}</p>
                </td>
                <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <AdminDropdown
                      value={u.role}
                      options={['buyer', 'moderator', 'admin']}
                      onChange={(newRole) => handleRoleChange(u, newRole)}
                      className="w-[140px]"
                    />
                    <button onClick={() => setConfirmModal({ isOpen: true, user: u })} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: '#fff1f2', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#ffe4e6'} onMouseLeave={e => e.currentTarget.style.background = '#fff1f2'}><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        <DeleteConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, user: null })}
          onConfirm={handleDeleteUser}
          title="Remove Member"
          message={`Are you sure you want to remove ${confirmModal.user?.full_name || 'this member'}? This action cannot be undone. Please enter your password to confirm.`}
          confirmText="Remove Member"
        />

        {roleAuthModal.isOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{
                background: '#fff',
                borderRadius: '2.5rem',
                width: '100%',
                maxWidth: 420,
                padding: '3rem 2.5rem',
                boxShadow: '0 30px 60px -12px rgba(0,0,0,0.3)',
                border: '1px solid rgba(0,0,0,0.07)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              <button onClick={closeModal} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: '#adb5bd', cursor: 'pointer' }}>
                <X size={20} />
              </button>

              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                  width: 72, height: 72, background: '#eff6ff', borderRadius: '1.5rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#3b82f6', margin: '0 auto 1.5rem', position: 'relative'
                }}>
                  <Shield size={36} />
                </div>

                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
                  {roleAuthModal.targetUser?.role === 'moderator' && roleAuthModal.newRole === 'moderator'
                    ? 'Moderator Access Control'
                    : 'Confirm Identity'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500, lineHeight: 1.5, margin: '0 auto' }}>
                  {roleAuthModal.targetUser?.role === 'moderator' && roleAuthModal.newRole === 'moderator' ? (
                    <>
                      Enter your password to authorize and update <strong>{roleAuthModal.targetUser?.full_name}</strong>'s moderator permissions.
                    </>
                  ) : (
                    <>
                      Please enter your password to confirm changing <strong>{roleAuthModal.targetUser?.full_name}</strong>'s role to <span style={{ textTransform: 'capitalize', color: '#e11d48', fontWeight: 800 }}>{roleAuthModal.newRole}</span>.
                    </>
                  )}
                </p>
              </div>

              {roleAuthModal.newRole === 'moderator' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b' }}>Set Moderator Permissions</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {[
                      { id: 'chat', title: 'Messages', desc: 'Buyer support chat' },
                      { id: 'products', title: 'Products', desc: 'Product inventory' },
                      { id: 'categories', title: 'Categories', desc: 'Department taxons' },
                      { id: 'orders', title: 'Orders', desc: 'Buyer checkouts' },
                      { id: 'reviews', title: 'Reviews', desc: 'Feedback & ratings' }
                    ].map(p => {
                      const isChecked = roleAuthModal.selectedPermissions.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.45rem 0.65rem',
                            borderRadius: '0.65rem',
                            background: isChecked ? '#eff6ff' : '#f8fafc',
                            border: isChecked ? '1px solid #2563eb30' : '1px solid #f1f5f9',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out',
                            userSelect: 'none'
                          }}
                          onMouseEnter={e => {
                            if (!isChecked) e.currentTarget.style.borderColor = '#cbd5e1';
                          }}
                          onMouseLeave={e => {
                            if (!isChecked) e.currentTarget.style.borderColor = '#f1f5f9';
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const updated = isChecked
                                ? roleAuthModal.selectedPermissions.filter(x => x !== p.id)
                                : [...roleAuthModal.selectedPermissions, p.id];
                              setRoleAuthModal(prev => ({ ...prev, selectedPermissions: updated }));
                            }}
                            style={{
                              cursor: 'pointer',
                              accentColor: '#2563eb',
                              flexShrink: 0
                            }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: isChecked ? '#2563eb' : '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.title}
                            </span>
                            <span style={{ fontSize: '0.52rem', color: isChecked ? '#2563eb80' : '#94a3b8', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.desc}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
                {(roleAuthModal.newRole === 'admin' || roleAuthModal.targetUser?.role === 'admin') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b' }}>Verification Code (OTP)</label>
                      <button
                        type="button"
                        disabled={roleAuthModal.sendingOtp}
                        onClick={sendRoleChangeOTP}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#e11d48',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        {roleAuthModal.sendingOtp ? 'Sending...' : 'Resend Code'}
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter 6-digit OTP"
                        value={roleAuthModal.otp || ''}
                        onChange={(e) => setRoleAuthModal(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '') }))}
                        style={{
                          width: '100%', padding: '0.9rem 1.25rem', background: '#f8fafc',
                          border: '2px solid transparent', borderRadius: '1rem',
                          fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', outline: 'none',
                          transition: 'all 0.2s',
                          letterSpacing: roleAuthModal.otp ? '6px' : 'normal',
                          textAlign: 'center'
                        }}
                        onFocus={e => e.currentTarget.style.borderColor = '#e11d48'}
                        onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
                      />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {/* Hidden inputs to satisfy browser autofill logic and prevent it from filling the search box */}
                  <input type="text" name="email" value={currentUser?.email || ''} readOnly style={{ display: 'none' }} autoComplete="username" />
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b' }}>Your Admin Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type={roleAuthModal.showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={roleAuthModal.password}
                      onChange={(e) => setRoleAuthModal(prev => ({ ...prev, password: e.target.value }))}
                      style={{
                        width: '100%', padding: '0.9rem 2.75rem', background: '#f8fafc',
                        border: '2px solid transparent', borderRadius: '1rem',
                        fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', outline: 'none',
                        transition: 'all 0.2s'
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = '#0f172a'}
                      onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
                    />
                    <button
                      type="button"
                      onClick={() => setRoleAuthModal(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                      style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    >
                      {roleAuthModal.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                  onClick={submitRoleChange}
                  disabled={
                    roleAuthModal.submitting || 
                    !roleAuthModal.password || 
                    ((roleAuthModal.newRole === 'admin' || roleAuthModal.targetUser?.role === 'admin') && !roleAuthModal.otp)
                  }
                  style={{
                    width: '100%', padding: '1.1rem', borderRadius: '1.25rem',
                    background: '#0f172a', color: '#fff', border: 'none',
                    fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                    opacity: (
                      roleAuthModal.submitting || 
                      !roleAuthModal.password || 
                      ((roleAuthModal.newRole === 'admin' || roleAuthModal.targetUser?.role === 'admin') && !roleAuthModal.otp)
                    ) ? 0.5 : 1,
                    transition: 'all 0.2s',
                    boxShadow: '0 10px 20px -5px rgba(15,23,42,0.3)'
                  }}
                >
                  {roleAuthModal.submitting ? (
                    <span>Updating...</span>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Authorize & Apply Role</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;
