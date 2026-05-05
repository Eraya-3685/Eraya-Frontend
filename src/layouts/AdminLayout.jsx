import React from 'react';
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Package, ShoppingCart, LogOut, 
  Settings, ExternalLink, Tags, Users, User, 
  Star, ShieldCheck, MessageSquare
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
  { to: '/admin/reviews',    label: 'Reviews',      icon: Star,                       roles: ['admin','moderator'], perm: 'reviews'  },
  { to: '/admin/profile',    label: 'Profile',      icon: User,                       roles: ['admin','moderator']                  },
  { to: '/admin/settings',   label: 'Settings',     icon: Settings,                   roles: ['admin','moderator'], perm: 'settings' },
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

  return (
    /* Admin also sits inside body's outer bg */
    <div style={{ minHeight: '100vh', display: 'flex', gap: '1.25rem' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 240,
        flexShrink: 0,
        background: '#fff',
        borderRadius: '2rem',
        padding: '1.75rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        boxShadow: '0 8px 32px -8px rgba(0,0,0,0.06)',
        border: '1px solid rgba(255,255,255,0.85)',
        position: 'sticky',
        top: '2rem',
        alignSelf: 'flex-start',
        maxHeight: 'calc(100vh - 4rem)',
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', marginBottom: '1.5rem', padding: '0 0.75rem' }}>
          <div style={{ width: 36, height: 36, background: '#0d1117', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package style={{ width: 16, height: 16, color: '#fff' }} />
          </div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.04em', color: '#0d1117' }}>eraya.</span>
        </Link>

        <p style={{ fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.3em', color: '#cbd5e1', padding: '0 0.75rem', marginBottom: '0.5rem' }}>Navigation</p>

        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem',
              borderRadius: '1rem',
              textDecoration: 'none',
              fontSize: '0.75rem',
              fontWeight: 700,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: 'all 0.2s',
              background: isActive ? '#f1f5f9' : 'transparent',
              color:      isActive ? '#0d1117'  : '#94a3b8',
            })}
          >
            {({ isActive }) => (
              <>
                <div style={{
                  width: 32, height: 32, borderRadius: '0.625rem',
                  background: isActive ? '#0d1117' : '#f8fafc',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}>
                  <Icon style={{ width: 14, height: 14, color: isActive ? '#fff' : '#94a3b8' }} />
                </div>
                {label}
              </>
            )}
          </NavLink>
        ))}

        {/* Logout */}
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
          <button
            onClick={() => { logout(); navigate('/'); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem', borderRadius: '1rem', border: 'none',
              background: 'transparent', cursor: 'pointer', transition: 'background 0.2s',
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.75rem', fontWeight: 700, color: '#f43f5e',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#fff1f2'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ width: 32, height: 32, borderRadius: '0.625rem', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogOut style={{ width: 14, height: 14, color: '#f43f5e' }} />
            </div>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Header */}
        <header style={{
          background: '#fff', borderRadius: '2rem', padding: '1.25rem 2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 8px 32px -8px rgba(0,0,0,0.06)',
          border: '1px solid rgba(255,255,255,0.85)',
          position: 'sticky', top: '2rem', zIndex: 40,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.2em', color: '#94a3b8' }}>System Operational</span>
          </div>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0d1117', margin: 0, letterSpacing: '-0.02em' }}>{user.full_name}</p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem', background: '#f1f5f9', borderRadius: 999, padding: '0.15rem 0.6rem' }}>
                  <ShieldCheck style={{ width: 10, height: 10, color: '#6366f1' }} />
                  <span style={{ fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.15em', color: '#6366f1' }}>{user.role}</span>
                </div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: '0.875rem', overflow: 'hidden', border: '2px solid #f1f5f9' }}>
                {user.avatar_url ? (
                  <img src={getImageUrl(user.avatar_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 800 }}>
                    {user.full_name?.charAt(0)}
                  </div>
                )}
              </div>
              <Link to="/" style={{ width: 36, height: 36, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#0d1117'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#94a3b8'; }}
              >
                <ExternalLink style={{ width: 14, height: 14 }} />
              </Link>
            </div>
          )}
        </header>

        {/* Page content */}
        <main style={{ flex: 1, paddingBottom: '2rem' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
