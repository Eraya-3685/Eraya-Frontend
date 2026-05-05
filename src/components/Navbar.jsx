import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Heart, User, Package, ArrowRight, LogOut, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import useWishlistStore from '../store/useWishlistStore';
import api, { getImageUrl } from '../api/axios';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { items: cartItems } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const searchRef = useRef(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length < 2) { setResults([]); setShowDrop(false); return; }
    const t = setTimeout(async () => {
      try {
        const r = await api.get(`/products?search=${query}&limit=6`);
        setResults(r.data.data || []);
        setShowDrop(true);
      } catch { }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const h = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDrop(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const isAdmin = ['admin', 'moderator'].includes(user?.role?.toLowerCase());

  const C = {
    bg: '#ffffff',
    bgPage: '#edf0f4',
    bgInput: '#f5f6f9',
    bgMuted: '#f3f5f8',
    t900: '#0d1117',
    t500: '#6b7280',
    t300: '#adb5bd',
    bSoft: 'rgba(0,0,0,0.07)',
    bMed: 'rgba(0,0,0,0.10)',
  };

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.88)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      borderBottom: `1px solid ${C.bSoft}`,
    }}>
      <div style={{
        maxWidth: 1400, margin: '0 auto',
        padding: '0 2.5rem',
        height: '5rem',
        display: 'flex', alignItems: 'center', gap: '2rem',
      }}>

        {/* ── Logo ── */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: 40, height: 40,
            background: C.t900,
            borderRadius: '0.85rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.18)',
          }}>
            <Package style={{ width: 19, height: 19, color: '#fff' }} />
          </div>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 900, fontSize: '1.5rem',
            letterSpacing: '0.12em', color: C.t900,
            lineHeight: 1, textTransform: 'none'
          }}>Eraya</span>
        </Link>

        {/* ── Search pill ── */}
        <div style={{ flex: 2, maxWidth: 520, position: 'relative' }} ref={searchRef}>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) {
                navigate(`/products?search=${query.trim()}`);
                setShowDrop(false);
              }
            }}
            style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
          >
            <input
              type="text"
              placeholder="Search products..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={e => {
                if (query.length >= 2) setShowDrop(true);
                e.target.style.background = '#fff';
                e.target.style.borderColor = C.bMed;
                e.target.style.boxShadow = '0 0 0 5px rgba(13,17,23,0.04)';
              }}
              onBlur={e => { 
                e.target.style.background = C.bgInput; 
                e.target.style.borderColor = 'transparent'; 
                e.target.style.boxShadow = 'none';
              }}
              style={{
                width: '100%',
                background: C.bgInput,
                border: `1px solid transparent`,
                borderRadius: 9999,
                padding: '0.75rem 4rem 0.75rem 1.5rem',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '0.85rem', fontWeight: 600,
                color: C.t900, outline: 'none',
                transition: 'all .25s ease',
              }}
            />
            <button
              type="submit"
              style={{
                position: 'absolute', right: '0.45rem',
                width: 36, height: 36,
                background: C.t900,
                border: 'none', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff',
                transition: 'all .2s ease',
                flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Search style={{ width: 15, height: 15 }} />
            </button>
          </form>

          {/* Search dropdown */}
          <AnimatePresence>
            {showDrop && results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'absolute', top: 'calc(100% + 0.8rem)', left: 0, right: 0,
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(30px) saturate(200%)',
                  WebkitBackdropFilter: 'blur(30px) saturate(200%)',
                  border: `1px solid rgba(255,255,255,0.5)`,
                  borderRadius: '1.75rem',
                  boxShadow: '0 40px 100px -20px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.02)',
                  overflow: 'hidden', zIndex: 200,
                  padding: '0.6rem',
                }}
              >
                <div style={{ padding: '0.8rem 1.25rem 0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 4, height: 12, background: C.t900, borderRadius: 2 }} />
                    <span style={{ fontSize: '0.65rem', fontWeight: 900, color: C.t900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Suggestions
                    </span>
                  </div>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: C.t300 }}>
                    {results.length} found
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {results.map((p) => {
                    const img = p.images?.find(i => i.is_primary)?.image_url ?? p.images?.[0]?.image_url;
                    return (
                      <Link
                        key={p.id}
                        to={`/products/${p.slug}`}
                        onClick={() => { setShowDrop(false); setQuery(''); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '1rem',
                          padding: '0.75rem 0.85rem', borderRadius: '1.25rem',
                          textDecoration: 'none', transition: 'all .25s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#fff';
                          e.currentTarget.style.boxShadow = '0 8px 24px -8px rgba(0,0,0,0.08)';
                          e.currentTarget.style.transform = 'scale(1.01)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <div style={{ 
                          width: 56, height: 56, borderRadius: '0.85rem', 
                          overflow: 'hidden', background: C.bgMuted, flexShrink: 0, 
                          border: `1px solid ${C.bSoft}`,
                          boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
                        }}>
                          {img && <img src={getImageUrl(img)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: C.t900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.1rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 900, color: C.t900 }}>৳{p.base_price?.toLocaleString()}</span>
                            {p.category && (
                              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: C.t300, background: C.bgMuted, padding: '0.1rem 0.4rem', borderRadius: '0.4rem' }}>
                                {p.category.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.t900, opacity: 0.5 }}>
                          <ArrowRight style={{ width: 14, height: 14, transform: 'rotate(-45deg)' }} />
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <div style={{ padding: '0.5rem' }}>
                  <Link
                    to={`/products?search=${query}`}
                    onClick={() => { setShowDrop(false); setQuery(''); }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                      padding: '0.85rem', background: C.t900, color: '#fff',
                      borderRadius: '1.25rem', textDecoration: 'none',
                      fontSize: '0.75rem', fontWeight: 800, transition: 'all .3s ease',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#000';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = C.t900;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    Explore all results for "{query}"
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ flex: 1 }} />

        {/* ── Right actions ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          
          {!isAdmin && (
            <>
              <Link to="/cart" className="icon-btn" style={{ position: 'relative', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: C.bgMuted, color: C.t900, textDecoration: 'none' }}>
                <ShoppingBag style={{ width: 20, height: 20 }} />
                {cartItems.length > 0 && (
                  <span style={{ position: 'absolute', top: -2, right: -2, width: 18, height: 18, background: C.t900, color: '#fff', fontSize: '0.6rem', fontWeight: 900, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid #fff` }}>
                    {cartItems.length}
                  </span>
                )}
              </Link>

              <Link to="/wishlist" className="icon-btn" style={{ position: 'relative', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: C.bgMuted, color: C.t900, textDecoration: 'none' }}>
                <Heart style={{ width: 20, height: 20, ...(wishlistItems.length > 0 ? { fill: '#f43f5e', color: '#f43f5e' } : {}) }} />
                {wishlistItems.length > 0 && <span style={{ position: 'absolute', top: -2, right: -2, width: 18, height: 18, background: '#f43f5e', color: '#fff', fontSize: '0.6rem', fontWeight: 900, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid #fff` }}>{wishlistItems.length}</span>}
              </Link>
            </>
          )}

          <div style={{ width: 1, height: 20, background: C.bSoft, margin: '0 0.1rem' }} />

          {user ? (
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button
                onClick={() => setShowMenu(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.55rem',
                  padding: '0.3rem 0.3rem 0.3rem 1rem',
                  background: '#fff', border: `1px solid ${C.bSoft}`,
                  borderRadius: 9999, cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.bMed; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.bSoft; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: C.t900 }}>{user.full_name?.split(' ')[0]}</span>
                <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${C.bSoft}`, background: C.bgMuted }}>
                  {user.avatar_url ? <img src={getImageUrl(user.avatar_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <div style={{ width: '100%', height: '100%', background: C.t900, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 800 }}>{user.full_name?.charAt(0)?.toUpperCase()}</div>}
                </div>
              </button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 6 }}
                    style={{
                      position: 'absolute', top: 'calc(100% + 0.6rem)', right: 0, width: 200,
                      background: '#fff', border: `1px solid ${C.bSoft}`, borderRadius: '1.25rem',
                      boxShadow: '0 20px 60px -12px rgba(0,0,0,0.14)', overflow: 'hidden', zIndex: 200, padding: '0.35rem'
                    }}
                  >
                    <div style={{ padding: '0.75rem 0.85rem 0.6rem', borderBottom: `1px solid ${C.bSoft}`, marginBottom: '0.35rem' }}>
                      <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: C.t900 }}>{user.full_name}</p>
                      <p style={{ margin: '0.15rem 0 0', fontSize: '0.68rem', color: C.t500, fontWeight: 500 }}>{user.email}</p>
                    </div>
                    <Link to={isAdmin ? '/admin' : '/profile'} onClick={() => setShowMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.85rem', borderRadius: '0.875rem', textDecoration: 'none', color: C.t900, fontSize: '0.78rem', fontWeight: 600 }}>
                      <LayoutDashboard style={{ width: 14, height: 14, color: C.t500 }} /> {isAdmin ? 'Admin Panel' : 'My Profile'}
                    </Link>
                    <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.85rem', borderRadius: '0.875rem', border: 'none', background: 'transparent', cursor: 'pointer', color: '#f43f5e', fontSize: '0.78rem', fontWeight: 600 }}>
                      <LogOut style={{ width: 14, height: 14 }} /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link to="/login" style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: C.bgMuted, color: C.t900, textDecoration: 'none' }}>
              <User style={{ width: 16, height: 16 }} />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
