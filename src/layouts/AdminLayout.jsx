import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Package, ShoppingCart, LogOut, 
  Settings, ExternalLink, Tags, Users, User, 
  Star, Mail, Phone, ShieldCheck, RefreshCcw
} from 'lucide-react';
import { getImageUrl } from '../api/axios';
import useAuthStore from '../store/useAuthStore';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const allNavItems = [
    { to: '/', label: 'View Store', icon: ExternalLink, roles: ['admin', 'moderator', 'buyer'] },
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true, roles: ['admin', 'moderator'], permission: 'dashboard' },
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

    // Moderators need explicit permission for specific modules
    if (role === 'moderator' && item.permission) {
      return user.permissions?.includes(item.permission);
    }

    return true;
  });

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      {/* Sidebar */}
      <aside className="w-64 bg-white text-slate-900 flex flex-col fixed h-full z-50 overflow-hidden shadow-[10px_0_40px_rgba(0,0,0,0.03)] border-r border-slate-200/50">
        {/* Subtle Decorative Elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50/50 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none" />
        
        {/* Logo Section */}
        <div className="p-6 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-[1.1rem] flex items-center justify-center shadow-xl shadow-slate-200 ring-1 ring-slate-100">
              <Package className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xs font-black tracking-widest leading-none text-slate-900 uppercase">ERAYA</h1>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_#6366f1]" />
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.25em]">Control Panel</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-grow px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar relative">
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 mt-2 px-4">Navigation Menu</p>
          {navItems.map(({ to, label, icon: Icon, end }) => {
            if (to === '/') {
              return (
                <Link
                  key={to}
                  to="/"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-[1.25rem] font-bold text-[10px] text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all group mb-4 border border-transparent hover:border-slate-100"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all text-slate-500 group-hover:text-slate-900">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {label}
                </Link>
              );
            }
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-[1.25rem] font-bold text-[10px] transition-all relative group border ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-100/50 shadow-sm shadow-indigo-100'
                      : 'text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 ${
                      isActive ? 'bg-white text-indigo-600 shadow-sm shadow-indigo-100' : 'bg-slate-50 group-hover:bg-white'
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="tracking-wide">{label}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="activeNavTab"
                        className="absolute right-3 w-0.5 h-3 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]"
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Minimal spacing at the bottom */}
          <div className="pb-10" />
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex-grow ml-64 min-h-screen flex flex-col relative">
        {/* Top Navbar */}
        <header className="h-20 bg-white/60 backdrop-blur-3xl border-b border-slate-200/50 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" />
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Admin Console</p>
            </div>
            <h2 className="text-[10px] font-bold text-slate-400/80 uppercase tracking-widest pl-3">Eraya Marketplace</h2>
          </div>

          <div className="flex items-center gap-8">
            {user && (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                <div className="relative flex items-center gap-4 py-1.5 px-2 pr-8 bg-white/40 backdrop-blur-md border border-slate-200/50 rounded-[2.5rem] shadow-sm group-hover:bg-white group-hover:shadow-md transition-all duration-500">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-[1.5rem] overflow-hidden ring-4 ring-slate-50/50 shadow-lg group-hover:scale-105 transition-transform duration-700">
                      {user.avatar_url ? (
                        <img 
                          src={getImageUrl(user.avatar_url)} 
                          className="w-full h-full object-cover" 
                          alt="Avatar" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-900 flex items-center justify-center text-white text-base font-black uppercase">
                          {user.full_name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-[3px] border-white rounded-full shadow-sm" />
                  </div>
                  
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-slate-900 text-sm font-black tracking-tight leading-none">
                        {user.full_name}
                      </h3>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-500 border border-indigo-100/50">
                         <ShieldCheck className="w-2.5 h-2.5" />
                         <span className="text-[8px] font-black uppercase tracking-widest">{user.role}</span>
                      </div>
                    </div>
                    <p className="text-slate-400 text-[9px] font-bold tracking-wide truncate max-w-[150px]">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="h-8 w-px bg-slate-200/50" />

            <button
              onClick={handleLogout}
              className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all shadow-sm border border-slate-100 active:scale-95 group relative"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 transition-transform group-hover:rotate-12" />
            </button>
          </div>
        </header>

        {/* Main Page Content */}
        <main className="p-12">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
