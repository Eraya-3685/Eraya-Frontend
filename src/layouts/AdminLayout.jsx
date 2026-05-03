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

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const allNavItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true, roles: ['admin', 'moderator'], permission: 'dashboard' },
    { to: '/admin/chat', label: 'Messages', icon: MessageSquare, roles: ['admin', 'moderator'], permission: 'chat' },
    { to: '/admin/products', label: 'Products', icon: Package, roles: ['admin', 'moderator'], permission: 'products' },
    { to: '/admin/categories', label: 'Categories', icon: Tags, roles: ['admin', 'moderator'], permission: 'categories' },
    { to: '/admin/users', label: 'Users', icon: Users, roles: ['admin'], permission: 'users' },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingCart, roles: ['admin', 'moderator'], permission: 'orders' },
    { to: '/admin/reviews', label: 'Product Reviews', icon: Star, roles: ['admin', 'moderator'], permission: 'reviews' },
    { to: '/admin/profile', label: 'My Profile', icon: User, roles: ['admin', 'moderator'] },
    { to: '/admin/settings', label: 'Store Settings', icon: Settings, roles: ['admin', 'moderator'], permission: 'settings' },
  ];

  const navItems = allNavItems.filter(item => {
    const role = user?.role?.toLowerCase();
    const hasRole = item.roles.includes(role);
    if (!hasRole) return false;
    if (role === 'moderator' && item.permission) {
      return user.permissions?.includes(item.permission);
    }
    return true;
  });

  return (
    <div className="min-h-screen flex relative">
      {/* Background Orbs */}
      <div className="orb-container">
        <div className="orb orb-1 opacity-20" />
        <div className="orb orb-2 opacity-20" />
      </div>

      {/* Sidebar */}
      <aside className="w-64 glass-card rounded-none border-l-0 border-t-0 border-b-0 border-r border-white/[0.05] flex flex-col fixed h-full z-50 overflow-hidden">
        <div className="p-8 relative">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-widest text-white uppercase">ERAYA</h1>
              <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em] mt-1">Admin Pro</p>
            </div>
          </Link>
        </div>

        <nav className="flex-grow px-4 py-2 space-y-1.5 overflow-y-auto custom-scrollbar relative">
          <p className="section-label px-4 mt-4">Menu</p>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-[10px] transition-all relative group ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-300 border border-transparent hover:glass-card-light/[0.05] hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="tracking-wide uppercase tracking-widest">{label}</span>
              {location.pathname === to && (
                <motion.div layoutId="navDot" className="absolute right-4 w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_12px_#6366f1]" />
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-white/[0.05]">
          <button onClick={handleLogout} className="w-full btn-ghost py-3 flex items-center justify-center gap-2 group">
            <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow ml-64 min-h-screen flex flex-col relative z-10">
        <header className="h-20 nav-blur flex items-center justify-between px-10 sticky top-0 z-40">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_#6366f1]" />
             <h2 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">System Operational</h2>
          </div>

          <div className="flex items-center gap-6">
            {user && (
              <div className="flex items-center gap-4 py-1.5 px-3 glass-card-light rounded-2xl">
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/[0.1]">
                  {user.avatar_url ? (
                    <img src={getImageUrl(user.avatar_url)} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-xs font-black uppercase">
                      {user.full_name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="hidden sm:block">
                  <p className="text-[10px] font-black text-white uppercase tracking-tight leading-none mb-1">{user.full_name}</p>
                  <span className="badge-indigo py-0 px-2 text-[7px]">{user.role}</span>
                </div>
              </div>
            )}
            <Link to="/" className="w-10 h-10 glass-card-light flex items-center justify-center text-slate-300 hover:text-white transition-colors group" title="Storefront">
              <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </Link>
          </div>
        </header>

        <main className={`${location.pathname === '/admin/chat' ? '' : 'p-10'} flex-grow`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
