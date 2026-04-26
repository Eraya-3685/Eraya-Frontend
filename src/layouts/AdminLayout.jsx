import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, LogOut, Settings, ExternalLink, Tags, Users, User } from 'lucide-react';
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
    { to: '/admin/profile', label: 'Account Settings', icon: User, roles: ['admin', 'moderator'] },
    { to: '/admin/settings', label: 'Store Settings', icon: Settings, roles: ['admin'], permission: 'settings' },
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
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 text-white flex flex-col fixed h-full z-40">
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <span className="text-lg font-black tracking-tight uppercase">
            Eraya {user?.role?.toLowerCase() === 'admin' ? 'Admin' : 'Moderator'}
          </span>
          <p className="text-white/40 text-[10px] mt-0.5 font-bold uppercase tracking-wider">Console</p>
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
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-xs text-white/50 hover:bg-secondary hover:text-white transition-all mb-4"
                >
                  <Icon className="w-4 h-4" />
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
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-xs transition-all ${
                    isActive
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-white/50 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-white/10 space-y-2">
          {user && (
            <div className="flex items-center gap-2.5 px-1">
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-white/10">
                {user.avatar_url ? (
                  <img 
                    src={getImageUrl(user.avatar_url)} 
                    className="w-full h-full object-cover" 
                    alt="Avatar" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-black">
                    {user.full_name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-bold truncate">{user.full_name}</p>
                <p className="text-white/40 text-[9px] truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-xs font-bold"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-60 flex-grow min-h-screen">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
