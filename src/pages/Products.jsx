import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, Heart, Star, Check, ChevronDown, ArrowRight, X, SlidersHorizontal, RefreshCcw } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../api/axios';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import useWishlistStore from '../store/useWishlistStore';
import toast from 'react-hot-toast';
import { useDebounce } from '../hooks/useDebounce';
import useDocumentTitle from '../hooks/useDocumentTitle';
import ProductCard from '../components/ProductCard';

const C = {
  t900:'#0d1117', t700:'#1f2937', t500:'#6b7280', t300:'#adb5bd',
  bSoft:'rgba(0,0,0,0.07)', bgCard:'#fff', bgMuted:'#f3f5f8', bgInput:'#f5f6f9',
  lime:'#cbff00', blue:'#3b82f6', rose:'#f43f5e',
};

/* ── Sort Dropdown ── */
const SortDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const opts = [
    { value:'newest',    label:'Newest' },
    { value:'price_low', label:'Price: Low → High' },
    { value:'price_high',label:'Price: High → Low' },
    { value:'popular',   label:'Most Popular' },
  ];
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div style={{ position:'relative' }} ref={ref}>
      <button onClick={() => setOpen(v=>!v)} style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.6rem 1rem', background:'#fff', border:`1px solid ${C.bSoft}`, borderRadius:9999, fontSize:'0.72rem', fontWeight:700, color:C.t500, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit' }}>
        <SlidersHorizontal style={{ width:13, height:13 }} />
        Sort by: <strong style={{ color:C.t900 }}>{opts.find(o=>o.value===value)?.label}</strong>
        <ChevronDown style={{ width:13, height:13, transform: open?'rotate(180deg)':'none', transition:'transform .2s' }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:6 }} transition={{ duration:0.15 }}
            style={{ position:'absolute', right:0, top:'calc(100% + 0.5rem)', width:200, background:'#fff', border:`1px solid ${C.bSoft}`, borderRadius:'1.25rem', boxShadow:'0 20px 50px -10px rgba(0,0,0,0.12)', overflow:'hidden', zIndex:50, padding:'0.35rem' }}>
            {opts.map(o => (
              <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.65rem 0.85rem', background: value===o.value ? C.bgMuted : 'transparent', borderRadius:'0.875rem', border:'none', fontSize:'0.75rem', fontWeight:value===o.value?700:500, color:value===o.value?C.t900:C.t500, cursor:'pointer', fontFamily:'inherit', transition:'background .12s' }}
                onMouseEnter={e=>e.currentTarget.style.background=C.bgMuted}
                onMouseLeave={e=>e.currentTarget.style.background=value===o.value?C.bgMuted:'transparent'}
              >
                {o.label}
                {value===o.value && <Check style={{ width:12, height:12 }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};



export default function Products() {
  useDocumentTitle('Collection | Eraya');
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const [sortBy, setSortBy]         = useState('relevance');
  const [minPrice, setMinPrice]     = useState(0);
  const [maxPrice, setMaxPrice]     = useState(2500);
  const [loadingItemId, setLoadingItemId] = useState(null);
  
  const limit = 12;
  const { search } = useLocation();
  const navigate   = useNavigate();
  const addItem    = useCartStore(s => s.addItem);
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { user }   = useAuthStore();

  const searchParams = new URLSearchParams(search);
  const query        = searchParams.get('search') || '';
  const activeCatIDs = useMemo(() => searchParams.getAll('category'), [search]);

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data || [])).catch(()=>{});
  }, []);

  useEffect(() => {
    setLoading(true);
    let url = `/products?page=${page}&limit=${limit}&search=${query}&sort=${sortBy}`;
    activeCatIDs.forEach(id => { url += `&category_id=${id}`; });
    if (minPrice > 0) url += `&min_price=${minPrice}`;
    if (maxPrice < 2500) url += `&max_price=${maxPrice}`;
    
    api.get(url)
      .then(r => { setProducts(r.data.data || []); setTotal(r.data.total || 0); })
      .catch(() => toast.error('Could not load products'))
      .finally(() => setLoading(false));
  }, [page, query, search, sortBy, minPrice, maxPrice]);

  const toggleCategory = id => {
    const p = new URLSearchParams(search);
    const cur = p.getAll('category');
    p.delete('category');
    if (cur.includes(String(id))) cur.filter(c=>c!==String(id)).forEach(c=>p.append('category',c));
    else { cur.forEach(c=>p.append('category',c)); p.append('category',id); }
    p.set('page','1'); navigate(`/products?${p.toString()}`); setPage(1);
  };

  const handleCart = async p => {
    const role = user?.role?.toLowerCase();
    if (role==='admin'||role==='moderator') { toast.error('Admin cannot add to cart'); return; }
    setLoadingItemId(p.id);
    await new Promise(r=>setTimeout(r,400));
    addItem(p); setLoadingItemId(null);
    toast.success(`${p.name} added to cart`);
  };

  const handleWishlist = p => {
    if (!user) { toast.error('Please login first'); navigate('/login'); return; }
    toggleWishlist(p);
  };

  const resetPrice = () => { setMinPrice(0); setMaxPrice(2500); };
  const resetCategories = () => { navigate('/products'); setPage(1); };
  const clearAll = () => { resetPrice(); navigate('/products'); setPage(1); };

  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const sortRef = useRef(null);
  const priceRef = useRef(null);

  const sortOptions = [
    { label: 'Relevance', value: 'relevance' },
    { label: 'Newest', value: 'newest' },
    { label: 'Price: Low to High', value: 'price_low' },
    { label: 'Price: High to Low', value: 'price_high' },
  ];

  const currentSortLabel = sortOptions.find(o => o.value === sortBy)?.label || 'Relevance';

  useEffect(() => {
    const handleClickOutside = (e) => { 
      if (sortRef.current && !sortRef.current.contains(e.target)) setIsSortOpen(false); 
      if (priceRef.current && !priceRef.current.contains(e.target)) setIsPriceOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalPages = Math.ceil(total / limit);
  const hasFilters = activeCatIDs.length > 0 || minPrice > 0 || maxPrice < 2500 || query;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '5rem' }}>
      
      {/* ── TOP BAR ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
           <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.75rem', color: C.t300, marginBottom: '0.5rem', fontWeight: 600 }}>
             <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
             <span style={{ opacity: 0.5 }}>/</span>
             <span style={{ color: C.t900 }}>Collection</span>
           </div>
           <h1 style={{ fontSize: '2rem', fontWeight: 900, color: C.t900, margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>Our Collection</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <p style={{ fontSize: '0.8rem', color: C.t500, fontWeight: 700, margin: '0 0.5rem 0 0' }}>
             Showing <span style={{ color: C.t900 }}>{products.length}</span> of <span style={{ color: C.t900 }}>{total}</span> Results
          </p>

          {/* Price Range Dropdown */}
          <div ref={priceRef} style={{ position: 'relative' }}>
            <div 
              onClick={() => setIsPriceOpen(!isPriceOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#fff', border: `1px solid ${C.bSoft}`, padding: '0.45rem 1rem', borderRadius: '9999px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', cursor: 'pointer', minWidth: 160, justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: C.t500 }}>Price:</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: C.t900 }}>৳{minPrice} - ৳{maxPrice}</span>
              </div>
              <ChevronDown style={{ width: 14, color: C.t300, transform: isPriceOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
            </div>

            <AnimatePresence>
              {isPriceOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  style={{ position: 'absolute', top: '115%', right: 0, zIndex: 100, background: '#fff', border: `1px solid ${C.bSoft}`, borderRadius: '1.25rem', padding: '1.25rem', boxShadow: '0 15px 40px rgba(0,0,0,0.08)', minWidth: 240 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                     <h4 style={{ fontSize: '0.85rem', fontWeight: 900, margin: 0 }}>Price Range</h4>
                     <button onClick={resetPrice} style={{ border: 'none', background: 'none', color: C.blue, fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}>Reset</button>
                  </div>
                  <input 
                    type="range" min="0" max="5000" value={maxPrice} 
                    onChange={e => setMaxPrice(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: C.t900, marginBottom: '1rem', cursor: 'pointer' }} 
                  />
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                     <div style={{ flex: 1, padding: '0.5rem', background: C.bgMuted, borderRadius: '0.65rem', fontSize: '0.75rem', fontWeight: 800, textAlign: 'center', border: `1px solid ${C.bSoft}` }}>৳{minPrice}</div>
                     <div style={{ flex: 1, padding: '0.5rem', background: C.bgMuted, borderRadius: '0.65rem', fontSize: '0.75rem', fontWeight: 800, textAlign: 'center', border: `1px solid ${C.bSoft}` }}>৳{maxPrice}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Custom Sort Dropdown */}
          <div ref={sortRef} style={{ position: 'relative' }}>
            <div 
              onClick={() => setIsSortOpen(!isSortOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#fff', border: `1px solid ${C.bSoft}`, padding: '0.45rem 1rem', borderRadius: '9999px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', cursor: 'pointer', minWidth: 170, justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: C.t500 }}>Sort By:</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: C.t900 }}>{currentSortLabel}</span>
              </div>
              <ChevronDown style={{ width: 14, color: C.t300, transform: isSortOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
            </div>

            <AnimatePresence>
              {isSortOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  style={{ position: 'absolute', top: '115%', right: 0, zIndex: 100, background: '#fff', border: `1px solid ${C.bSoft}`, borderRadius: '1.25rem', padding: '0.35rem', boxShadow: '0 15px 40px rgba(0,0,0,0.08)', minWidth: '100%' }}
                >
                  {sortOptions.map(opt => (
                    <div 
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value); setPage(1); setIsSortOpen(false); }}
                      style={{ padding: '0.5rem 0.75rem', borderRadius: '0.85rem', fontSize: '0.75rem', fontWeight: 700, color: sortBy === opt.value ? C.t900 : C.t700, cursor: 'pointer', background: sortBy === opt.value ? C.bgMuted : 'transparent', transition: 'all 0.2s' }}
                      onMouseEnter={e => { if(sortBy !== opt.value) e.currentTarget.style.background = C.bgMuted; }}
                      onMouseLeave={e => { if(sortBy !== opt.value) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {opt.label}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* ── SIDEBAR (STICKY CARD) ── */}
        <div style={{ 
          display: 'flex', flexDirection: 'column', gap: '1.5rem', 
          position: 'sticky', top: '7rem', 
          background: '#fff', border: `1px solid ${C.bSoft}`, 
          borderRadius: '1.25rem', padding: '1.25rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.02)'
        }}>
          
          {/* Availability */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
               <h4 style={{ fontSize: '0.85rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>Availability</h4>
               <button style={{ border: 'none', background: 'none', color: C.blue, fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}>Reset</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ width: 16, height: 16, accentColor: C.t900, borderRadius: '0.25rem' }} /> 
                In Stock
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: C.t300, cursor: 'pointer' }}>
                <input type="checkbox" style={{ width: 16, height: 16, accentColor: C.t900, borderRadius: '0.25rem' }} /> 
                Out Of Stock
              </label>
            </div>
          </div>

          <div style={{ height: 1, background: C.bSoft }} />

          {/* Product type */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
               <h4 style={{ fontSize: '0.85rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>Product type</h4>
               <button onClick={resetCategories} style={{ border: 'none', background: 'none', color: C.blue, fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}>Reset</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {categories.map(cat => (
                <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={activeCatIDs.includes(String(cat.id))}
                    onChange={() => toggleCategory(cat.id)}
                    style={{ width: 16, height: 16, accentColor: C.t900 }} 
                  /> 
                  {cat.name}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ── GRID CONTENT ── */}
        <div style={{ background: '#fff', borderRadius: '1.25rem', padding: '1.5rem', border: `1px solid ${C.bSoft}`, boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
          {/* Active Filter Tags Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem', minHeight: 32 }}>
            {activeCatIDs.map(id => {
              const cat = categories.find(c => String(c.id) === id);
              return cat && (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 1rem', background: C.bgMuted, border: `1px solid ${C.bSoft}`, borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>
                  {cat.name} <X style={{ width: 14, cursor: 'pointer', color: C.t300 }} onClick={() => toggleCategory(id)} />
                </div>
              );
            })}
            {(minPrice > 0 || maxPrice < 2500) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 1rem', background: C.bgMuted, border: `1px solid ${C.bSoft}`, borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>
                ৳{minPrice} - ৳{maxPrice} <X style={{ width: 14, cursor: 'pointer', color: C.t300 }} onClick={resetPrice} />
              </div>
            )}
            {query && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 1rem', background: C.bgMuted, border: `1px solid ${C.bSoft}`, borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>
                "{query}" <X style={{ width: 14, cursor: 'pointer', color: C.t300 }} onClick={() => navigate('/products')} />
              </div>
            )}
            {hasFilters && (
              <button onClick={clearAll} style={{ border: 'none', background: 'none', color: C.t900, textDecoration: 'underline', fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer', marginLeft: '0.25rem' }}>
                Clear all
              </button>
            )}
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
              {Array.from({ length: 8 }).map((_, i) => <div key={i} style={{ aspectRatio: '1/1.2', background: C.bgMuted, borderRadius: '1.25rem', animation: 'pulse 1.5s infinite' }} />)}
            </div>
          ) : products.length === 0 ? (
            <div style={{ padding: '5rem 0', textAlign: 'center', background: C.bgMuted, borderRadius: '1.25rem' }}>
               <Search style={{ width: 44, height: 44, color: C.t300, marginBottom: '1.5rem' }} />
               <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>No products match your criteria</h3>
               <p style={{ fontSize: '0.85rem', color: C.t500, marginTop: '0.5rem' }}>Try clearing some filters to see more results.</p>
               <button onClick={clearAll} style={{ marginTop: '1.5rem', background: C.t900, color: '#fff', border: 'none', padding: '0.75rem 2rem', borderRadius: '9999px', fontWeight: 800, cursor: 'pointer' }}>Clear all filters</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
              {products.map(p => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  onCart={handleCart} 
                  onWishlist={handleWishlist} 
                  inWishlist={isInWishlist(p.id)} 
                  loading={loadingItemId === p.id} 
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginTop: '4rem' }}>
              <button 
                onClick={() => { setPage(p => Math.max(1, p-1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={page === 1}
                style={{ width: 38, height: 38, borderRadius: '50%', border: `1px solid ${C.bSoft}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.3 : 1, transition: 'all 0.3s', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}
                onMouseEnter={e => { if(page!==1) e.currentTarget.style.background = C.bgMuted; }}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                <ArrowRight style={{ width: 14, transform: 'rotate(180deg)' }} />
              </button>
              
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', fontWeight: 900 }}>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <span 
                    key={i} 
                    onClick={() => { setPage(i+1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    style={{ cursor: 'pointer', color: page === i+1 ? C.t900 : C.t300, transition: 'color 0.3s', padding: '0.25rem' }}
                  >
                    {i+1}
                  </span>
                ))}
              </div>

              <button 
                onClick={() => { setPage(p => Math.min(totalPages, p+1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={page === totalPages}
                style={{ width: 38, height: 38, borderRadius: '50%', border: `1px solid ${C.bSoft}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.3 : 1, transition: 'all 0.3s', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}
                onMouseEnter={e => { if(page!==totalPages) e.currentTarget.style.background = C.bgMuted; }}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                <ArrowRight style={{ width: 14 }} />
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }`}</style>
    </div>
  );
}
