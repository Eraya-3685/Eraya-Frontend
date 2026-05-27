import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingBag, Heart, Check, ChevronDown,
  ArrowRight, X, SlidersHorizontal, LayoutGrid, List,
  Package, Sparkles,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../api/axios';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import useWishlistStore from '../store/useWishlistStore';
import toast from 'react-hot-toast';
import useDocumentTitle from '../hooks/useDocumentTitle';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';

const C = {
  t900: '#0d1117', t700: '#1f2937', t500: '#6b7280', t300: '#adb5bd',
  bSoft: 'rgba(0,0,0,0.07)', bMed: 'rgba(0,0,0,0.10)',
  bgCard: '#fff', bgMuted: '#f3f5f8', bgInput: '#f5f6f9', bgPage: '#edf0f4',
  lime: '#cbff00', blue: '#3b82f6', rose: '#f43f5e',
};

/* ── small pill dropdown ── */
function PillDropdown({ label, value, opts, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const cur = opts.find(o => o.value === value)?.label ?? label;
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button onClick={() => setOpen(v => !v)} style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.55rem 1rem', background: '#fff',
        border: `1px solid ${C.bSoft}`, borderRadius: 9999,
        fontSize: '0.75rem', fontWeight: 700, color: C.t500,
        cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'all .15s',
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = C.bMed}
        onMouseLeave={e => e.currentTarget.style.borderColor = C.bSoft}
      >
        <SlidersHorizontal style={{ width: 12, height: 12 }} />
        <span style={{ color: C.t300 }}>{label}:</span>
        <strong style={{ color: C.t900 }}>{cur}</strong>
        <ChevronDown style={{ width: 12, height: 12, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', right: 0, top: 'calc(100% + 0.5rem)',
              minWidth: 180, background: '#fff', border: `1px solid ${C.bSoft}`,
              borderRadius: '1.25rem', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.12)',
              overflow: 'hidden', zIndex: 60, padding: '0.35rem',
            }}
          >
            {opts.map(o => (
              <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.6rem 0.85rem', background: value === o.value ? C.bgMuted : 'transparent',
                  borderRadius: '0.875rem', border: 'none',
                  fontSize: '0.78rem', fontWeight: value === o.value ? 800 : 600,
                  color: value === o.value ? C.t900 : C.t500,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'background .12s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.bgMuted}
                onMouseLeave={e => e.currentTarget.style.background = value === o.value ? C.bgMuted : 'transparent'}
              >
                {o.label}
                {value === o.value && <Check style={{ width: 12, height: 12 }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



export default function Products() {
  useDocumentTitle('Collection | Eraya');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [loadingItemId, setLoadingItemId] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const limit = 16;
  const { search } = useLocation();
  const navigate = useNavigate();
  const addItem = useCartStore(s => s.addItem);
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { user } = useAuthStore();

  const searchParams = new URLSearchParams(search);
  const query = searchParams.get('search') || '';
  const activeCatIDs = useMemo(() => searchParams.getAll('category'), [search]);

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    let url = `/products?page=${page}&limit=${limit}&search=${query}&sort=${sortBy}`;
    activeCatIDs.forEach(id => { url += `&category_id=${id}`; });
    if (minPrice > 0) url += `&min_price=${minPrice}`;
    if (maxPrice < 5000) url += `&max_price=${maxPrice}`;
    api.get(url)
      .then(r => { setProducts(r.data.data || []); setTotal(r.data.total || r.data.pagination?.total_items || 0); })
      .catch(() => toast.error('Could not load products'))
      .finally(() => setLoading(false));
  }, [page, query, search, sortBy, minPrice, maxPrice]);

  const toggleCategory = id => {
    const p = new URLSearchParams(search);
    const cur = p.getAll('category');
    p.delete('category');
    if (cur.includes(String(id))) cur.filter(c => c !== String(id)).forEach(c => p.append('category', c));
    else { cur.forEach(c => p.append('category', c)); p.append('category', id); }
    p.set('page', '1'); navigate(`/products?${p.toString()}`); setPage(1);
  };

  const handleCart = async p => {
    const role = user?.role?.toLowerCase();
    if (role === 'admin' || role === 'moderator') { toast.error('Admin cannot add to cart'); return; }
    setLoadingItemId(p.id);
    await new Promise(r => setTimeout(r, 350));
    addItem(p); setLoadingItemId(null);
    toast.success(`${p.name} added!`);
  };

  const handleWishlist = p => {
    toggleWishlist(p);
  };

  const resetPrice = () => { setMinPrice(0); setMaxPrice(5000); };
  const resetCategories = () => { navigate('/products'); setPage(1); };
  const clearAll = () => { resetPrice(); navigate('/products'); setPage(1); };

  const totalPages = Math.ceil(total / limit);
  const hasFilters = activeCatIDs.length > 0 || minPrice > 0 || maxPrice < 5000 || query;

  const sortOpts = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_low', label: 'Price: Low → High' },
    { value: 'price_high', label: 'Price: High → Low' },
    { value: 'popular', label: 'Most Popular' },
  ];

  /* Sidebar component — reused for desktop + mobile */
  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SlidersHorizontal style={{ width: 14, height: 14, color: C.t900 }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 900, color: C.t900 }}>Filters</span>
        </div>
        {hasFilters && (
          <button onClick={clearAll} style={{
            border: 'none', background: 'none', cursor: 'pointer',
            fontSize: '0.72rem', fontWeight: 800, color: C.rose,
            display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'inherit',
          }}>
            <X style={{ width: 11, height: 11 }} /> Clear all
          </button>
        )}
      </div>

      <div style={{ height: 1, background: C.bSoft }} />

      {/* Categories */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <h4 style={{ fontSize: '0.78rem', fontWeight: 900, margin: 0, color: C.t900, letterSpacing: '-0.01em' }}>Category</h4>
          {activeCatIDs.length > 0 && (
            <button onClick={resetCategories} style={{ border: 'none', background: 'none', color: C.t300, fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              Reset
            </button>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {categories.map(cat => {
            const active = activeCatIDs.includes(String(cat.id));
            return (
              <button key={cat.id} onClick={() => toggleCategory(cat.id)} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.55rem 0.65rem', borderRadius: '0.875rem',
                background: active ? C.t900 : 'transparent',
                border: 'none', cursor: 'pointer', transition: 'all .15s',
                width: '100%', fontFamily: 'inherit', textAlign: 'left',
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.bgMuted; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: '0.35rem', flexShrink: 0,
                  border: `1.5px solid ${active ? '#fff' : C.bMed}`,
                  background: active ? '#fff' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {active && <Check style={{ width: 10, height: 10, color: C.t900 }} />}
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: active ? 800 : 600, color: active ? '#fff' : C.t700, flex: 1 }}>
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ height: 1, background: C.bSoft }} />

      {/* Price Range */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <h4 style={{ fontSize: '0.78rem', fontWeight: 900, margin: 0, color: C.t900 }}>Price Range</h4>
          {(minPrice > 0 || maxPrice < 5000) && (
            <button onClick={resetPrice} style={{ border: 'none', background: 'none', color: C.t300, fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              Reset
            </button>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: C.t900 }}>৳{minPrice.toLocaleString()}</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: C.t900 }}>৳{maxPrice.toLocaleString()}</span>
        </div>
        <input
          type="range" min="0" max="5000" step="50" value={maxPrice}
          onChange={e => setMaxPrice(parseInt(e.target.value))}
          style={{ width: '100%', accentColor: C.t900, cursor: 'pointer' }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.75rem' }}>
          {[500, 1000, 2000, 5000].map(v => (
            <button key={v} onClick={() => setMaxPrice(v)} style={{
              padding: '0.4rem', borderRadius: '0.65rem',
              border: `1.5px solid ${maxPrice === v ? C.t900 : C.bSoft}`,
              background: maxPrice === v ? C.t900 : 'transparent',
              fontSize: '0.68rem', fontWeight: 800,
              color: maxPrice === v ? '#fff' : C.t500,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
            }}>
              ৳{v >= 1000 ? `${v / 1000}k` : v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ paddingBottom: '4rem' }}>

      {/* ── PAGE HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: '1.5rem' }}
      >
        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.72rem', color: C.t300, marginBottom: '0.6rem', fontWeight: 600 }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none', transition: 'color .2s' }}
            onMouseEnter={e => e.currentTarget.style.color = C.t900}
            onMouseLeave={e => e.currentTarget.style.color = C.t300}>
            Home
          </Link>
          <span>/</span>
          <span style={{ color: C.t900 }}>Collection</span>
          {query && <><span>/</span><span style={{ color: C.t900 }}>"{query}"</span></>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, color: C.t900, margin: 0, letterSpacing: '-0.04em', lineHeight: 1 }}>
              {query ? `Results for "${query}"` : activeCatIDs.length > 0 ? 'Filtered Collection' : 'Our Collection'}
            </h1>
            <p style={{ fontSize: '0.78rem', color: C.t500, margin: '0.4rem 0 0', fontWeight: 600 }}>
              {loading ? 'Loading…' : `${total.toLocaleString()} products found`}
            </p>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {/* Active filter pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {activeCatIDs.map(id => {
                const cat = categories.find(c => String(c.id) === id);
                return cat && (
                  <div key={id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.35rem 0.75rem', background: C.t900,
                    borderRadius: 9999, fontSize: '0.68rem', fontWeight: 800, color: '#fff',
                  }}>
                    {cat.name}
                    <X style={{ width: 11, height: 11, cursor: 'pointer', opacity: 0.6 }} onClick={() => toggleCategory(id)} />
                  </div>
                );
              })}
              {(minPrice > 0 || maxPrice < 5000) && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.35rem 0.75rem', background: C.t900,
                  borderRadius: 9999, fontSize: '0.68rem', fontWeight: 800, color: '#fff',
                }}>
                  ৳{minPrice}–৳{maxPrice}
                  <X style={{ width: 11, height: 11, cursor: 'pointer', opacity: 0.6 }} onClick={resetPrice} />
                </div>
              )}
            </div>

            <PillDropdown label="Sort" value={sortBy} opts={sortOpts} onChange={v => { setSortBy(v); setPage(1); }} />

            {/* View toggle */}
            <div style={{ display: 'flex', background: '#fff', border: `1px solid ${C.bSoft}`, borderRadius: 9999, padding: '0.25rem', gap: '0.1rem' }}>
              {[
                { mode: 'grid', Icon: LayoutGrid },
                { mode: 'list', Icon: List },
              ].map(({ mode, Icon }) => (
                <button key={mode} onClick={() => setViewMode(mode)} style={{
                  width: 30, height: 30, borderRadius: 9999, border: 'none',
                  background: viewMode === mode ? C.t900 : 'transparent',
                  color: viewMode === mode ? '#fff' : C.t300,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all .15s',
                }}>
                  <Icon style={{ width: 13, height: 13 }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* ── SIDEBAR ── */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          style={{
            position: 'sticky', top: '6.5rem',
            background: '#fff', border: `1px solid ${C.bSoft}`,
            borderRadius: '1.5rem', padding: '1.25rem',
            boxShadow: '0 2px 16px -4px rgba(0,0,0,0.06)',
          }}
        >
          <SidebarContent />
        </motion.div>

        {/* ── PRODUCTS AREA ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.08 }}
        >
          {/* Loading skeletons */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'list' ? '1fr' : 'repeat(auto-fill, minmax(185px, 1fr))', gap: '1rem' }}>
              {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            /* Empty state */
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '5rem 2rem', background: '#fff', borderRadius: '1.75rem',
              border: `1px solid ${C.bSoft}`, textAlign: 'center',
              boxShadow: '0 2px 16px -4px rgba(0,0,0,0.06)',
            }}>
              <div style={{ width: 64, height: 64, background: C.bgMuted, borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Package style={{ width: 28, height: 28, color: C.t300 }} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: '0 0 0.5rem', color: C.t900 }}>No products found</h3>
              <p style={{ fontSize: '0.82rem', color: C.t500, margin: '0 0 1.5rem', maxWidth: 300 }}>
                {query ? `No results for "${query}". Try different keywords.` : 'Try clearing filters to see more products.'}
              </p>
              <button onClick={clearAll} className="btn-lime" style={{ fontSize: '0.78rem' }}>
                Clear filters <div className="icon-circle" style={{ width: '1.75rem', height: '1.75rem' }}><ArrowRight style={{ width: 12, height: 12 }} /></div>
              </button>
            </div>
          ) : viewMode === 'list' ? (
            /* List view */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {products.map((p, i) => {
                const img = p.images?.find(i => i.is_primary)?.image_url ?? p.images?.[0]?.image_url;
                const inWL = isInWishlist(p.id);
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      background: '#fff', borderRadius: '1.25rem', padding: '0.85rem',
                      border: `1px solid ${C.bSoft}`, transition: 'all .2s',
                      boxShadow: '0 1px 8px -2px rgba(0,0,0,0.04)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px -8px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 8px -2px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none'; }}
                  >
                    <Link to={`/products/${p.slug}`} style={{ width: 80, height: 80, borderRadius: '0.875rem', overflow: 'hidden', background: C.bgMuted, flexShrink: 0, border: `1px solid ${C.bSoft}`, textDecoration: 'none' }}>
                      {img && <img src={getImageUrl(img)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </Link>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link to={`/products/${p.slug}`} style={{ textDecoration: 'none' }}>
                        <p style={{ fontSize: '0.95rem', fontWeight: 800, color: C.t900, margin: '0 0 0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                      </Link>
                      {p.category && <span style={{ fontSize: '0.65rem', fontWeight: 700, color: C.t300, background: C.bgMuted, padding: '0.15rem 0.5rem', borderRadius: '0.5rem' }}>{p.category.name}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      {p.discount_price && p.discount_price > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: 900, color: C.rose }}>৳{p.discount_price?.toLocaleString()}</span>
                          <span style={{ fontSize: '0.8rem', color: C.t300, textDecoration: 'line-through' }}>৳{p.base_price?.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '1.05rem', fontWeight: 900, color: C.t900 }}>৳{p.base_price?.toLocaleString()}</span>
                      )}
                      {!['admin', 'moderator'].includes(user?.role?.toLowerCase()) && (
                        <>
                          <button onClick={() => handleWishlist(p)} style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${C.bSoft}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <Heart style={{ width: 14, height: 14, color: inWL ? C.rose : C.t300, fill: inWL ? C.rose : 'none' }} />
                          </button>
                          <button onClick={() => handleCart(p)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: C.t900, border: 'none', borderRadius: 9999, color: '#fff', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                            <ShoppingBag style={{ width: 13, height: 13 }} /> Add
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* Grid view */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: '1rem' }}>
              {products.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                  <ProductCard
                    product={p}
                    onCart={handleCart}
                    onWishlist={handleWishlist}
                    inWishlist={isInWishlist(p.id)}
                    loading={loadingItemId === p.id}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* ── PAGINATION ── */}
          {totalPages > 1 && !loading && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', marginTop: '2.5rem' }}>
              <button
                onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={page === 1}
                style={{
                  width: 38, height: 38, borderRadius: '50%',
                  border: `1px solid ${C.bSoft}`, background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  opacity: page === 1 ? 0.3 : 1, transition: 'all .2s',
                }}
              >
                <ArrowRight style={{ width: 14, height: 14, transform: 'rotate(180deg)' }} />
              </button>

              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button key={p} onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      style={{
                        width: 38, height: 38, borderRadius: '50%', border: 'none',
                        background: page === p ? C.t900 : 'transparent',
                        color: page === p ? '#fff' : C.t500,
                        fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer',
                        transition: 'all .15s', fontFamily: 'inherit',
                      }}
                      onMouseEnter={e => { if (page !== p) e.currentTarget.style.background = C.bgMuted; }}
                      onMouseLeave={e => { if (page !== p) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={page === totalPages}
                style={{
                  width: 38, height: 38, borderRadius: '50%',
                  border: `1px solid ${C.bSoft}`, background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  opacity: page === totalPages ? 0.3 : 1, transition: 'all .2s',
                }}
              >
                <ArrowRight style={{ width: 14, height: 14 }} />
              </button>
            </div>
          )}
        </motion.div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; }
        }
        div:hover .hover-reveal-btn { transform: translateY(0) !important; opacity: 1 !important; }
      `}</style>
    </div>
  );
}
