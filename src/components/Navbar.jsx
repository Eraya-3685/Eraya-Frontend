import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Search, Menu, X, Command, Star, ChevronDown, LogOut, UserCircle, LayoutDashboard } from 'lucide-react';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import api, { ASSETS_URL, getImageUrl } from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import useClickOutside from '../hooks/useClickOutside';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const cartItems = useCartStore((state) => state.items);
  const { token, user, logout } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  useClickOutside(searchRef, () => setShowSuggestions(false));
  useClickOutside(profileRef, () => setIsProfileOpen(false));

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu/suggestions on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setShowSuggestions(false);
    setSearchQuery('');
  }, [location]);


  // Real-time Search Logic
  useEffect(() => {
    if (searchQuery.trim().length < 1) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const res = await api.get(`/products?search=${searchQuery}&limit=5`);
        setSuggestions(res.data.data || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoadingSearch(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${searchQuery}`);
      setShowSuggestions(false);
    }
  };

  return (
    <header className={`fixed top-0 w-full z-[100] transition-all duration-500 ${
      isScrolled 
        ? 'bg-white/80 backdrop-blur-xl shadow-premium py-3' 
        : 'bg-white/50 backdrop-blur-md py-4'
    } border-b border-slate-200/50`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6">
        
        {/* Brand Logo */}
        <Link 
          to="/" 
          onClick={(e) => {
            if (location.pathname === '/') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="flex items-center gap-2 group shrink-0"
        >
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110 border border-slate-100 shadow-sm">
            <img src="/assets/logo.png" className="w-full h-full object-cover p-1" alt="Eraya Logo" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">ERAYA</span>
        </Link>

        {/* Desktop Search Input with Suggestions */}
        <div className="hidden md:block flex-grow max-w-md mx-8 relative" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="relative group">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${loadingSearch ? 'text-secondary animate-pulse' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowSuggestions(true)}
              placeholder="Search products..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-secondary/20 focus:bg-white focus:border-secondary/30 transition-all"
            />
            <button type="submit" className="hidden" />
          </form>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && (suggestions.length > 0 || searchQuery.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[110]"
              >
                {loadingSearch ? (
                   <div className="p-4 text-center text-slate-400 text-xs">Searching...</div>
                ) : suggestions.length > 0 ? (
                  <div className="py-2">
                    {suggestions.map((p) => (
                      <Link
                        key={p.id}
                        to={`/products/${p.slug}`}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors group"
                      >
                        <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                          <img 
                            src={getImageUrl(p.images?.[0]?.image_url)} 
                            className="w-full h-full object-cover" 
                            alt={p.name} 
                          />
                        </div>
                        <div className="min-w-0">
                           <p className="font-bold text-slate-800 truncate group-hover:text-secondary transition-colors">{p.name}</p>
                           <p className="text-xs text-slate-400">৳{p.base_price}</p>
                        </div>
                        <ArrowRight className="ml-auto w-4 h-4 text-slate-300 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                      </Link>
                    ))}
                    <Link to={`/products?search=${searchQuery}`} className="block p-4 text-center text-xs font-bold text-secondary bg-slate-50 hover:bg-slate-100">
                      View all results
                    </Link>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-sm font-bold">No products found</p>
                    <p className="text-xs">Try searching for something else</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 shrink-0">
          {[
            { label: 'Shop', to: '/products' },
            { label: 'Deals', to: '/products' },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="text-sm font-bold text-slate-600 hover:text-secondary transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Action Icons */}
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <div 
            className="relative" 
            ref={profileRef}
            onMouseEnter={() => setIsProfileOpen(true)}
            onMouseLeave={() => setIsProfileOpen(false)}
          >
            {token ? (
              <button
                className="flex items-center gap-3 p-1.5 pr-4 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-600 hover:text-secondary transition-all relative group border border-slate-100"
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-sm overflow-hidden border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                  {user?.avatar_url ? (
                    <img 
                      src={getImageUrl(user.avatar_url)} 
                      className="w-full h-full object-cover" 
                      alt={user.full_name} 
                    />
                  ) : (
                    <span>{user?.full_name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className="hidden sm:inline text-sm font-bold text-slate-700 group-hover:text-secondary transition-colors">
                  {user?.full_name?.split(' ')[0]}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                <span className="absolute top-1 right-3 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-3 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-600 hover:text-secondary transition-all border border-slate-100"
              >
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                  <User className="w-5 h-5" />
                </div>
              </Link>
            )}

            {/* Profile Dropdown */}
            <AnimatePresence>
              {token && isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden z-[120] py-3"
                >
                  <div className="px-6 py-4 border-b border-slate-50 mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Account</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{user?.full_name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                  
                  <div className="px-2 space-y-1">
                    {!isAdmin && (
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-secondary transition-all"
                      >
                        <UserCircle className="w-5 h-5" />
                        My Profile
                      </Link>
                    )}
                    {!isAdmin && (
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-secondary transition-all"
                      >
                        <ShoppingBag className="w-5 h-5" />
                        My Orders
                      </Link>
                    )}
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-secondary transition-all"
                      >
                        <LayoutDashboard className="w-5 h-5" />
                        Admin Dashboard
                      </Link>
                    )}
                    <div className="h-px bg-slate-50 mx-4 my-2" />
                    <button
                      onClick={async () => {
                        setIsProfileOpen(false);
                        await logout();
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!isAdmin && (
            <Link to="/cart" className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-white rounded-full hover:bg-secondary/90 transition-all shadow-md relative group">
              <ShoppingBag className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs">{cartItems.length}</span>
            </Link>
          )}

          <button
            className="lg:hidden p-2 text-slate-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Search - Simplified to just an icon for now or kept as is if requested */}
      
      {/* Simplified Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-2xl z-[120] p-6"
          >
            <div className="flex justify-between items-center mb-10">
              <span className="text-xl font-bold">Menu</span>
              <button onClick={() => setIsMenuOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="space-y-6">
              {['New Arrivals', 'Categories', 'Best Sellers', 'Deals'].map((label) => (
                <Link
                  key={label}
                  to="/products"
                  className="block text-lg font-semibold text-slate-700 hover:text-secondary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
              <div className="pt-6 border-t border-slate-100">
                <button 
                  onClick={async () => {
                    await logout();
                    setIsMenuOpen(false);
                    navigate('/');
                  }}
                  className="w-full py-3 text-red-500 font-bold border border-red-100 rounded-xl hover:bg-red-50"
                >
                  Sign Out
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

// Add missing icon
const ArrowRight = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
);

export default Navbar;
