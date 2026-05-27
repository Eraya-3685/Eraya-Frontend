import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Heart, User, Package, ArrowRight, LogOut, LayoutDashboard, X, Clock, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import useWishlistStore from '../store/useWishlistStore';
import api, { getImageUrl } from '../api/axios';

const RECENT_KEY = 'eraya_recent_searches';
const MAX_RECENT = 5;

function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function saveRecent(q) {
  const prev = getRecent().filter(r => r !== q);
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, MAX_RECENT)));
}
function removeRecent(q) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(getRecent().filter(r => r !== q)));
}

/* Highlight matching substring */
function Highlight({ text, query }) {
  if (!query || !text) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark style={{ background: '#cbff00', color: '#0d1117', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </span>
  );
}

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { items: cartItems } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [recent, setRecent] = useState(getRecent());

  const searchRef = useRef(null);
  const menuRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  /* Debounced search */
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsSearching(false);
      setActiveIdx(-1);
      return;
    }
    setIsSearching(true);
    const t = setTimeout(async () => {
      try {
        const r = await api.get(`/products?search=${encodeURIComponent(query)}&limit=6`);
        setResults(r.data.data || []);
        setActiveIdx(-1);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  /* Click outside */
  useEffect(() => {
    const h = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDrop(false);
        setFocused(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* Show dropdown */
  useEffect(() => {
    if (focused && (query.length >= 2 || recent.length > 0)) setShowDrop(true);
    else if (!focused) setShowDrop(false);
  }, [focused, query, recent]);

  /* Keyboard navigation */
  const handleKey = useCallback((e) => {
    if (!showDrop) return;
    const items = query.length >= 2 ? results : recent;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Escape') { setShowDrop(false); inputRef.current?.blur(); }
    else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      if (query.length >= 2 && results[activeIdx]) {
        const p = results[activeIdx];
        saveRecent(query.trim());
        setRecent(getRecent());
        navigate(`/products/${p.slug}`);
        closeDrop();
      } else if (query.length < 2 && recent[activeIdx]) {
        const r = recent[activeIdx];
        setQuery(r);
        inputRef.current?.focus();
      }
    }
  }, [showDrop, activeIdx, results, recent, query, navigate]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    saveRecent(q);
    setRecent(getRecent());
    navigate(`/products?search=${encodeURIComponent(q)}`);
    closeDrop();
  };

  const closeDrop = () => {
    setShowDrop(false);
    setQuery('');
    setResults([]);
    setActiveIdx(-1);
    inputRef.current?.blur();
  };

  const isAdmin = ['admin', 'moderator'].includes(user?.role?.toLowerCase());

  const C = {
    bg: '#ffffff', bgPage: '#edf0f4', bgInput: '#f5f6f9', bgMuted: '#f3f5f8',
    t900: '#0d1117', t500: '#6b7280', t300: '#adb5bd',
    bSoft: 'rgba(0,0,0,0.07)', bMed: 'rgba(0,0,0,0.10)',
    lime: '#cbff00',
  };

  const showRecent = focused && query.length < 2 && recent.length > 0;
  const showResults = focused && query.length >= 2;
  const dropVisible = showDrop && (showRecent || showResults);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.88)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      borderBottom: `1px solid ${C.bSoft}`,
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '0 1.5rem', height: '5rem',
        display: 'flex', alignItems: 'center', gap: '2rem',
      }}>

        {/* ── Logo ── */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: 40, height: 40, background: C.t900,
            borderRadius: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.18)',
          }}>
            <Package style={{ width: 19, height: 19, color: '#fff' }} />
          </div>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 900, fontSize: '1.5rem',
            letterSpacing: '0.12em', color: C.t900, lineHeight: 1,
          }}>Eraya</span>
        </Link>

        {/* ── Search ── */}
        <div style={{ flex: 2, maxWidth: 520, position: 'relative' }} ref={searchRef}>
          <form onSubmit={handleSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            {/* Search icon inside */}
            <div style={{ position: 'absolute', left: '1.1rem', zIndex: 1, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
              {isSearching ? (
                <div style={{ width: 15, height: 15, border: '2px solid #d1d5db', borderTopColor: C.t900, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              ) : (
                <Search style={{ width: 15, height: 15, color: focused ? C.t900 : C.t300, transition: 'color .2s' }} />
              )}
            </div>

            <input
              ref={inputRef}
              type="text"
              placeholder="Search products, categories..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => { setFocused(true); setRecent(getRecent()); }}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              onKeyDown={handleKey}
              style={{
                width: '100%',
                background: focused ? '#fff' : C.bgInput,
                border: `1.5px solid ${focused ? C.bMed : 'transparent'}`,
                borderRadius: 9999,
                padding: '0.75rem 3rem 0.75rem 2.85rem',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '0.85rem', fontWeight: 600,
                color: C.t900, outline: 'none',
                transition: 'all .22s ease',
                boxShadow: focused ? '0 0 0 4px rgba(13,17,23,0.04)' : 'none',
              }}
            />

            {/* Clear / Search button */}
            {query ? (
              <button
                type="button"
                onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
                style={{
                  position: 'absolute', right: '3.15rem',
                  width: 22, height: 22, borderRadius: '50%',
                  background: C.bgMuted, border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: C.t300, transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e5e7eb'; e.currentTarget.style.color = C.t900; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.bgMuted; e.currentTarget.style.color = C.t300; }}
              >
                <X style={{ width: 11, height: 11 }} />
              </button>
            ) : null}

            <button
              type="submit"
              style={{
                position: 'absolute', right: '0.4rem',
                width: 38, height: 38,
                background: C.t900, border: 'none', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff', transition: 'all .2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Search style={{ width: 15, height: 15 }} />
            </button>
          </form>

          {/* ── Dropdown ── */}
          <AnimatePresence>
            {dropVisible && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'absolute', top: 'calc(100% + 0.65rem)', left: 0, right: 0,
                  background: 'rgba(255,255,255,0.97)',
                  backdropFilter: 'blur(30px) saturate(200%)',
                  WebkitBackdropFilter: 'blur(30px) saturate(200%)',
                  border: `1px solid rgba(0,0,0,0.07)`,
                  borderRadius: '1.75rem',
                  boxShadow: '0 32px 80px -16px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.02)',
                  overflow: 'hidden', zIndex: 200, padding: '0.5rem',
                }}
              >
                {/* Header */}
                <div style={{ padding: '0.65rem 1rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {showRecent ? (
                      <Clock style={{ width: 12, height: 12, color: C.t300 }} />
                    ) : (
                      <TrendingUp style={{ width: 12, height: 12, color: C.t300 }} />
                    )}
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: C.t300 }}>
                      {showRecent ? 'Recent searches' : `Results for "${query}"`}
                    </span>
                  </div>
                  {showResults && (
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, color: C.t300 }}>
                      {isSearching ? 'searching…' : `${results.length} found`}
                    </span>
                  )}
                </div>

                {/* Recent searches */}
                {showRecent && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                    {recent.map((r, i) => (
                      <div
                        key={r}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.65rem 0.85rem', borderRadius: '1.25rem',
                          background: activeIdx === i ? C.bgMuted : 'transparent',
                          cursor: 'pointer', transition: 'background .15s',
                        }}
                        onMouseEnter={() => setActiveIdx(i)}
                        onMouseLeave={() => setActiveIdx(-1)}
                        onClick={() => { setQuery(r); inputRef.current?.focus(); }}
                      >
                        <Clock style={{ width: 14, height: 14, color: C.t300, flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, color: C.t700 }}>{r}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeRecent(r); setRecent(getRecent()); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t300, display: 'flex', padding: '2px' }}
                          onMouseEnter={e => e.currentTarget.style.color = C.t900}
                          onMouseLeave={e => e.currentTarget.style.color = C.t300}
                        >
                          <X style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search results */}
                {showResults && (
                  <>
                    {isSearching && results.length === 0 && (
                      <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <div style={{ width: 24, height: 24, border: '2.5px solid #e5e7eb', borderTopColor: C.t900, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 0.5rem' }} />
                        <p style={{ fontSize: '0.72rem', color: C.t300, margin: 0, fontWeight: 600 }}>Searching…</p>
                      </div>
                    )}
                    {!isSearching && results.length === 0 && (
                      <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.88rem', fontWeight: 800, color: C.t900, margin: '0 0 0.25rem' }}>No results</p>
                        <p style={{ fontSize: '0.72rem', color: C.t300, margin: 0 }}>Try different keywords</p>
                      </div>
                    )}
                    {results.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                        {results.map((p, i) => {
                          const img = p.images?.find(i => i.is_primary)?.image_url ?? p.images?.[0]?.image_url;
                          return (
                            <Link
                              key={p.id}
                              to={`/products/${p.slug}`}
                              onClick={() => { saveRecent(query.trim()); setRecent(getRecent()); closeDrop(); }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.85rem',
                                padding: '0.65rem 0.75rem', borderRadius: '1.25rem',
                                textDecoration: 'none',
                                background: activeIdx === i ? C.bgMuted : 'transparent',
                                transition: 'background .15s',
                              }}
                              onMouseEnter={() => setActiveIdx(i)}
                              onMouseLeave={() => setActiveIdx(-1)}
                            >
                              <div style={{
                                width: 52, height: 52, borderRadius: '0.875rem',
                                overflow: 'hidden', background: C.bgMuted, flexShrink: 0,
                                border: `1px solid ${C.bSoft}`,
                              }}>
                                {img && <img src={getImageUrl(img)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: C.t900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  <Highlight text={p.name} query={query} />
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                                  {p.discount_price && p.discount_price > 0 ? (
                                    <>
                                      <span style={{ fontSize: '0.82rem', fontWeight: 900, color: C.rose }}>৳{p.discount_price?.toLocaleString()}</span>
                                      <span style={{ fontSize: '0.72rem', color: C.t300, textDecoration: 'line-through' }}>৳{p.base_price?.toLocaleString()}</span>
                                    </>
                                  ) : (
                                    <span style={{ fontSize: '0.82rem', fontWeight: 900, color: C.t900 }}>৳{p.base_price?.toLocaleString()}</span>
                                  )}
                                  {p.category && (
                                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: C.t300, background: C.bgMuted, padding: '0.1rem 0.4rem', borderRadius: '0.4rem' }}>
                                      {p.category.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div style={{ width: 30, height: 30, borderRadius: '50%', background: activeIdx === i ? '#fff' : C.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s' }}>
                                <ArrowRight style={{ width: 13, height: 13, color: C.t900, transform: 'rotate(-45deg)' }} />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}

                    {/* See all */}
                    {results.length > 0 && (
                      <div style={{ padding: '0.4rem 0.25rem 0.25rem' }}>
                        <Link
                          to={`/products?search=${encodeURIComponent(query)}`}
                          onClick={() => { saveRecent(query.trim()); setRecent(getRecent()); closeDrop(); }}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            padding: '0.8rem', background: C.t900, color: '#fff',
                            borderRadius: '1.25rem', textDecoration: 'none',
                            fontSize: '0.78rem', fontWeight: 800, transition: 'all .2s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = C.t900; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                          See all results for "{query}"
                          <ArrowRight style={{ width: 13, height: 13 }} />
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
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
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'all .2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.bMed; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.bSoft; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: C.t900 }}>{user.full_name?.split(' ')[0]}</span>
                <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${C.bSoft}`, background: C.bgMuted }}>
                  {user.avatar_url
                    ? <img src={getImageUrl(user.avatar_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    : <div style={{ width: '100%', height: '100%', background: C.t900, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 800 }}>{user.full_name?.charAt(0)?.toUpperCase()}</div>
                  }
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
                      boxShadow: '0 20px 60px -12px rgba(0,0,0,0.14)', overflow: 'hidden', zIndex: 200, padding: '0.35rem',
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
