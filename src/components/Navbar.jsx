import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Search, Menu, X, Command, Star, ChevronDown, LogOut, UserCircle, LayoutDashboard, Settings, Heart, Truck, ArrowRight } from 'lucide-react';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import useWishlistStore from '../store/useWishlistStore';
import api, { ASSETS_URL, getImageUrl } from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import useClickOutside from '../hooks/useClickOutside';
import Logo from './Logo';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  
  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const cartItems = useCartStore((state) => state.items);
  const wishlistItems = useWishlistStore((state) => state.items);
  const { token, user, logout } = useAuthStore();
  const isStaff = ['admin', 'moderator'].includes(user?.role?.toLowerCase());

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
        ? 'bg-[#0f172a]/95 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] py-2'
        : 'bg-[#0f172a]/70 backdrop-blur-xl py-3'
    } border-b border-white/[0.06]`}>
      <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 md:px-10">

        {/* Brand Logo */}
        <Link
          to="/"
          onClick={(e) => {
            if (location.pathname === '/') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="flex items-center gap-3 group shrink-0 transition-transform duration-300 hover:-translate-y-0.5"
        >
          <div className="text-2xl font-[1000] tracking-[0.3em] text-white group-hover:text-indigo-300 transition-colors">ERAYA</div>
        </Link>
        
        {/* Desktop Search Input with Suggestions */}
        <div className="hidden md:block flex-grow max-w-2xl mx-12 relative" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="relative group">
            <Search className={`absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${loadingSearch ? 'text-secondary animate-pulse' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowSuggestions(true)}
              placeholder="Search in Eraya"
              className="w-full glass-card/[0.06] border border-white/[0.10] rounded-2xl py-3 pl-12 pr-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/20 focus:glass-card/[0.10] focus:border-indigo-500/40 transition-all placeholder:text-slate-500 text-white"
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
                className="absolute top-full left-0 right-0 mt-4 glass-card border border-white/[0.12] overflow-hidden z-[110] shadow-[0_30px_100px_rgba(0,0,0,0.6)]"
              >
                {loadingSearch ? (
                   <div className="p-8 flex flex-col items-center gap-3">
                      <div className="w-5 h-5 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Searching...</p>
                   </div>
                ) : suggestions.length > 0 ? (
                  <div className="py-2">
                    <p className="px-5 py-2 text-[8px] font-black text-indigo-400/60 uppercase tracking-[0.3em]">Quick Results</p>
                    {suggestions.map((p) => (
                      <Link
                        key={p.id}
                        to={`/products/${p.slug}`}
                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.05] transition-all duration-300 group"
                        onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                      >
                        <div className="w-14 h-14 rounded-xl glass-card-light overflow-hidden shrink-0 border border-white/[0.08] shadow-inner group-hover:scale-105 transition-transform duration-500">
                          <img 
                            src={getImageUrl(p.images?.[0]?.image_url)} 
                            className="w-full h-full object-cover" 
                            alt={p.name} 
                          />
                        </div>
                        <div className="min-w-0">
                           <p className="font-bold text-white text-sm truncate group-hover:text-indigo-300 transition-colors">{p.name}</p>
                           <p className="text-[10px] font-black text-slate-400 mt-0.5 tracking-wider">৳{p.base_price.toLocaleString()}</p>
                        </div>
                        <div className="ml-auto p-2 rounded-xl bg-white/[0.03] group-hover:bg-indigo-600 transition-colors">
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-all" />
                        </div>
                      </Link>
                    ))}
                    <Link 
                      to={`/products?search=${searchQuery}`} 
                      className="block p-5 text-center text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] bg-white/[0.02] hover:bg-white/[0.04] transition-colors border-t border-white/[0.05]"
                      onClick={() => setShowSearch(false)}
                    >
                      View all results
                    </Link>
                  </div>
                ) : (
                  <div className="p-10 text-center">
                    <div className="w-12 h-12 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-4 border border-white/[0.05]">
                      <Package className="w-5 h-5 text-slate-600" />
                    </div>
                    <p className="text-sm font-bold text-white mb-1">No products found</p>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Try a different search term</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-10 mx-8">
          <Link to="/products" className="text-xs font-black text-slate-400 hover:text-white hover:-translate-y-0.5 tracking-widest transition-all duration-300 relative group shrink-0 uppercase">
            Shop
            <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-indigo-400 transition-all group-hover:w-full" />
          </Link>
          <Link to="/products?category=Deals" className="text-xs font-black text-slate-400 hover:text-white hover:-translate-y-0.5 tracking-widest transition-all duration-300 relative group shrink-0 uppercase">
            Deals
            <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-indigo-400 transition-all group-hover:w-full" />
          </Link>
        </nav>

        {/* Action Icons */}
        <div className="flex items-center gap-5 shrink-0 ml-8">
          <div 
            className="relative" 
            ref={profileRef}
            onMouseEnter={() => setIsProfileOpen(true)}
            onMouseLeave={() => setIsProfileOpen(false)}
          >
            {token ? (
              <button
                className="flex items-center gap-2 p-1 glass-card/[0.06] hover:glass-card/[0.10] rounded-full text-slate-300 hover:text-white transition-all relative group border border-white/[0.10] hover:-translate-y-0.5 duration-300"
              >
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-xs overflow-hidden border-2 border-white shadow-sm transition-transform group-hover:scale-105">
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
                <span className="hidden sm:inline text-xs font-bold text-slate-200 group-hover:text-white transition-colors px-1">
                  {user?.full_name?.split(' ')[0]}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                <span className="absolute top-1 right-3.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-3 p-1 glass-card/[0.06] hover:glass-card/[0.10] rounded-full text-slate-400 hover:text-white transition-all border border-white/[0.10] hover:-translate-y-0.5 duration-300"
              >
                <div className="w-8 h-8 rounded-full glass-card/[0.10] flex items-center justify-center text-slate-300">
                  <User className="w-4 h-4" />
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
                  className="absolute top-full right-0 mt-2 w-64 glass-card p-2 border border-white/[0.08] overflow-hidden z-[120] py-3"
                >
                  <div className="px-6 py-4 border-b border-white/[0.06] mb-2">
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Account</p>
                    <p className="text-sm font-bold text-white truncate">{user?.full_name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                    <div className="px-2 space-y-1">
                      {/* Staff Specific Links */}
                      {isStaff && (
                        <>
                          <Link
                            to="/admin"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-300 hover:glass-card/[0.08] hover:text-white transition-all"
                          >
                            <LayoutDashboard className="w-5 h-5" />
                            {user?.role?.toLowerCase() === 'admin' ? 'Admin Dashboard' : 'Moderator Dashboard'}
                          </Link>
                          <Link
                            to="/admin/profile"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-300 hover:glass-card/[0.08] hover:text-white transition-all"
                          >
                            <Settings className="w-5 h-5" />
                            Account Settings
                          </Link>
                          <Link
                            to="/admin/store-settings"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-300 hover:glass-card/[0.08] hover:text-white transition-all"
                          >
                            <Truck className="w-5 h-5" />
                            Store Settings
                          </Link>
                        </>
                      )}

                      {/* Buyer Specific Links */}
                      {!isStaff && (
                        <>
                          <Link
                            to="/profile"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-300 hover:glass-card/[0.08] hover:text-white transition-all"
                          >
                            <UserCircle className="w-5 h-5" />
                            My Profile
                          </Link>
                          <Link
                            to="/profile"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-300 hover:glass-card/[0.08] hover:text-white transition-all"
                          >
                            <ShoppingBag className="w-5 h-5" />
                            My Orders
                          </Link>
                          <Link
                            to="/profile/edit"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-300 hover:glass-card/[0.08] hover:text-white transition-all"
                          >
                            <Settings className="w-5 h-5" />
                            Account Settings
                          </Link>
                        </>
                      )}
                    </div>
                    <div className="h-px glass-card/[0.06] mx-4 my-2" />
                    <div className="px-3 pb-1">
                      <button
                        onClick={async () => {
                          setLoggingOut(true);
                          await new Promise(resolve => setTimeout(resolve, 800));
                          setIsProfileOpen(false);
                          await logout();
                          setLoggingOut(false);
                          navigate('/');
                        }}
                        disabled={loggingOut}
                        className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-red-500 bg-red-50/50 hover:bg-red-50 transition-all border border-red-100/50"
                      >
                        {loggingOut ? (
                          <div className="w-3.5 h-3.5 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
                        ) : (
                          <LogOut className="w-4 h-4" />
                        )}
                        {loggingOut ? 'Signing Out...' : 'Sign Out'}
                      </button>
                    </div>
                  </motion.div>
              )}
            </AnimatePresence>
          </div>
 
          {!isStaff && (
            <div className="flex items-center gap-4">
              {token && (
                <Link to="/wishlist" className="relative group transition-transform duration-300 hover:-translate-y-0.5">
                  <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-400 border border-amber-500/20 transition-all group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                    <Star className={`w-4 h-4 transition-transform group-hover:scale-110 ${wishlistItems.length > 0 ? 'fill-current' : ''}`} />
                  </div>
                  <AnimatePresence>
                    {wishlistItems.length > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-[#0f172a] shadow-sm"
                      >
                        {wishlistItems.length}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              )}
              <Link to="/cart" className="relative group transition-transform duration-300 hover:-translate-y-0.5">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-[0_4px_20px_rgba(99,102,241,0.4)] transition-all group-hover:bg-indigo-500 group-hover:shadow-[0_4px_28px_rgba(99,102,241,0.6)]">
                  <ShoppingBag className="w-4 h-4 transition-transform group-hover:scale-110" />
                </div>
                <AnimatePresence>
                  {cartItems.length > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-[#0f172a] shadow-sm"
                    >
                      {cartItems.length}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </div>
          )}
 
          <button
            className="lg:hidden p-2 text-slate-300 hover:text-white transition-colors"
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
            className="fixed inset-y-0 right-0 w-full max-w-xs bg-[#1e293b] border-l border-white/[0.08] shadow-2xl z-[120] p-6"
          >
            <div className="flex justify-between items-center mb-10">
              <span className="text-xl font-bold text-white">Menu</span>
              <button onClick={() => setIsMenuOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="space-y-6">
              {['New Arrivals', 'Categories', 'Best Sellers', 'Deals'].map((label) => (
                <Link
                  key={label}
                  to="/products"
                  className="block text-lg font-semibold text-slate-300 hover:text-indigo-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
              <div className="pt-6 border-t border-white/[0.08]">
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

export default Navbar;
