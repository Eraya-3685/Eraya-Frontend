import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, LogOut, ArrowLeft, Settings, ExternalLink, Tags } from 'lucide-react';
import { getImageUrl } from '../api/axios';
import useAuthStore from '../store/useAuthStore';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { to: '/', label: 'View Store', icon: ExternalLink },
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/products', label: 'Products', icon: Package },
    { to: '/admin/categories', label: 'Categories', icon: Tags },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-40">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <span className="text-xl font-bold tracking-tighter uppercase">Eraya Admin</span>
          <p className="text-white/40 text-xs mt-1 font-medium">Management Console</p>
        </div>

        {/* Nav */}
        <nav className="flex-grow p-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => {
            // Special handling for external link to store home
            if (to === '/') {
              return (
                <button
                  key={to}
                  onClick={() => navigate('/')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-white/50 hover:bg-secondary hover:text-white transition-all mb-4"
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              );
            }
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/50 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {label}
              </NavLink>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-white/10 space-y-3">
          {user && (
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10">
                {user.avatar_url ? (
                  <img 
                    src={getImageUrl(user.avatar_url)} 
                    className="w-full h-full object-cover" 
                    alt="Avatar" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                    {user.full_name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-bold truncate">{user.full_name}</p>
                <p className="text-white/40 text-xs truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-grow min-h-screen">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
