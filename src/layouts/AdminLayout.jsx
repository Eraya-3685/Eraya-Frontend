import React, { useState } from 'react';
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Package, ShoppingCart, LogOut, 
  Settings, ExternalLink, Tags, Users, User, 
  Star, ShieldCheck, MessageSquare, Bell, Search, 
  ChevronDown, Phone, Mail, Command, Calendar, Edit2
} from 'lucide-react';
import { getImageUrl } from '../api/axios';
import useAuthStore from '../store/useAuthStore';

const NAV_ITEMS = [
  { to: '/admin',            label: 'Dashboard',    icon: LayoutDashboard, end: true, roles: ['admin','moderator'], perm: 'dashboard' },
  { to: '/admin/chat',       label: 'Messages',     icon: MessageSquare,              roles: ['admin','moderator'], perm: 'chat'      },
  { to: '/admin/products',   label: 'Products',     icon: Package,                    roles: ['admin','moderator'], perm: 'products'  },
  { to: '/admin/categories', label: 'Categories',   icon: Tags,                       roles: ['admin','moderator'], perm: 'categories'},
  { to: '/admin/users',      label: 'Users',        icon: Users,                      roles: ['admin']                               },
  { to: '/admin/orders',     label: 'Orders',       icon: ShoppingCart,               roles: ['admin','moderator'], perm: 'orders'   },
  { to: '/admin/reviews',    label: 'Reviews',      icon: Star,                       roles: ['admin','moderator'], perm: 'orders'   },
  { to: '/admin/settings',   label: 'Settings',     icon: Settings,                   roles: ['admin','moderator'], perm: 'dashboard'  },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate         = useNavigate();
  const location         = useLocation();

  const navItems = NAV_ITEMS.filter(item => {
    const role = user?.role?.toLowerCase();
    if (!item.roles.includes(role)) return false;
    if (role === 'moderator' && item.perm) return user.permissions?.includes(item.perm);
    return true;
  });

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div style={{ 
      minHeight: '100vh', display: 'flex', gap: '2rem', padding: '1.5rem',
      background: 'linear-gradient(135deg, #f8f9fc 0%, #eef2f7 100%)',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 250, flexShrink: 0, background: '#fff', borderRadius: '2.5rem',
        padding: '2rem 1.25rem', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0,0,0,0.03)',
        position: 'sticky', top: '1.5rem', alignSelf: 'flex-start',
        height: 'calc(100vh - 3rem)', overflowY: 'visible',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', padding: '0 0.5rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <div style={{ width: 38, height: 38, background: '#e11d48', borderRadius: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(225, 29, 72, 0.2)' }}>
              <span style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 900 }}>E.</span>
            </div>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Eraya.</h1>
              <p style={{ fontSize: '0.55rem', color: '#94a3b8', margin: 0, fontWeight: 600 }}>Admin Portal</p>
            </div>
          </Link>
          <Link to="/" target="_blank" title="Visit Store" style={{ width: 28, height: 28, borderRadius: '0.75rem', background: '#f8f9fc', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', transition: 'all 0.3s ease', textDecoration: 'none' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#e11d48'; e.currentTarget.style.color = '#fff'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#f8f9fc'; e.currentTarget.style.color = '#94a3b8'; }}>
            <ExternalLink style={{ width: 12, height: 12 }} />
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {navItems.map(({ to, label, icon: Icon, end }) => {
            const isActive = location.pathname === to || (to !== '/admin' && location.pathname.startsWith(to));
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.75rem 1rem',
                  borderRadius: '1rem', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: isActive ? '#fff1f2' : 'transparent',
                  color: isActive ? '#e11d48' : '#64748b',
                  boxShadow: isActive ? '0 4px 12px rgba(225, 29, 72, 0.05)' : 'none'
                }}
              >
                <Icon style={{ width: 16, height: 16, opacity: isActive ? 1 : 0.6 }} />
                {label}
                {isActive && <motion.div layoutId="active" style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: '#e11d48' }} />}
              </NavLink>
            );
          })}
        </div>

        {/* User Card at Bottom */}
        <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #f8f9fc 0%, #f1f5f9 100%)', borderRadius: '1.75rem', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '5%', right: '5%', width: 50, height: 50, background: '#e11d48', opacity: 0.03, borderRadius: '50%', filter: 'blur(15px)' }} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '1rem', overflow: 'hidden', border: '3px solid #fff', boxShadow: '0 8px 16px rgba(0,0,0,0.05)', flexShrink: 0 }}>
                {user?.avatar_url ? <img src={getImageUrl(user.avatar_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ background: '#0f172a', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>{user?.full_name?.charAt(0)}</div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name}</p>
                <p style={{ fontSize: '0.6rem', color: '#e11d48', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user?.role}</p>
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  navigate('/admin/profile');
                }} 
                title="Edit Profile" 
                style={{ width: 32, height: 32, borderRadius: '0.75rem', background: '#fff', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer', transition: 'all 0.3s ease' }} 
                onMouseEnter={(e) => { e.currentTarget.style.background = '#e11d48'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#64748b'; }}
              >
                <Edit2 style={{ width: 14, height: 14 }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: 24, height: 24, borderRadius: '0.6rem', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48', boxShadow: '0 4px 8px rgba(0,0,0,0.02)' }}><Phone style={{ width: 10, height: 10 }} /></div>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b' }}>{user?.phone || 'No phone set'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: 24, height: 24, borderRadius: '0.6rem', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48', boxShadow: '0 4px 8px rgba(0,0,0,0.02)' }}><Mail style={{ width: 10, height: 10 }} /></div>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</span>
              </div>
            </div>
          </div>

          <button onClick={logout} style={{ width: '100%', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem', borderRadius: '1rem', border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', fontSize: '0.8rem', fontWeight: 700 }} onMouseEnter={(e) => e.currentTarget.style.color = '#e11d48'}>
            <LogOut style={{ width: 16, height: 16 }} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
             <div style={{ background: '#fff', borderRadius: '1.5rem', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
                <div style={{ width: 32, height: 32, background: '#e11d48', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Settings style={{ width: 16, height: 16 }} /></div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#e11d48' }}>Check Balance</span>
             </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
             <div style={{ background: '#fff', borderRadius: '1.5rem', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
                <Calendar style={{ width: 18, height: 18, color: '#94a3b8' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>{dateStr}</span>
             </div>

             <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ width: 48, height: 48, background: '#fff', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', border: '1px solid #f1f5f9', cursor: 'pointer' }}><Search style={{ width: 20, height: 20 }} /></div>
                <div style={{ width: 48, height: 48, background: '#fff', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', border: '1px solid #f1f5f9', cursor: 'pointer', position: 'relative' }}>
                   <Bell style={{ width: 20, height: 20 }} />
                   <div style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, background: '#e11d48', borderRadius: '50%', border: '2px solid #fff' }} />
                </div>
                <div onClick={() => navigate('/admin/profile')} style={{ width: 48, height: 48, background: '#fff', borderRadius: '1.25rem', overflow: 'hidden', border: '1px solid #f1f5f9', cursor: 'pointer' }}>
                   {user?.avatar_url ? <img src={getImageUrl(user.avatar_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ background: '#0f172a', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{user?.full_name?.charAt(0)}</div>}
                </div>
             </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
