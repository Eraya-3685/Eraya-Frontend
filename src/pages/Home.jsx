import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Heart, Star, ShoppingBag, Share2, Globe, Link2, ChevronRight, Zap, Truck, Shield, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { getImageUrl } from '../api/axios';
import toast from 'react-hot-toast';
import useCartStore from '../store/useCartStore';
import useWishlistStore from '../store/useWishlistStore';
import useAuthStore from '../store/useAuthStore';
import useDocumentTitle from '../hooks/useDocumentTitle';
import ProductCard from '../components/ProductCard';

/* ── design tokens ── */
const C = {
  t900: '#0d1117', t700: '#1f2937', t500: '#6b7280', t300: '#adb5bd',
  bSoft: 'rgba(0,0,0,0.07)', bgCard: '#fff', bgHero: '#f5f6f9', bgMuted: '#f3f5f8',
  lime: '#cbff00', blue: '#3b82f6', rose: '#f43f5e',
};

const primaryImg = (images) =>
  images?.find(i => i.is_primary)?.image_url ?? images?.[0]?.image_url ?? null;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.48, ease: [0.22, 1, 0.36, 1] },
});

export default function Home() {
  useDocumentTitle('Eraya — Curated Collection');
  const [products, setProducts]       = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const { user }                      = useAuthStore();
  const addToCart                     = useCartStore(s => s.addItem);
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const [heroIndex, setHeroIndex] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    if (products.length > 0) {
      const timer = setInterval(() => {
        setHeroIndex(prev => (prev + 1) % Math.min(products.length, 5));
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [products]);

  useEffect(() => {
    Promise.all([
      api.get('/products?page=1&limit=8'),
      api.get('/products?page=1&limit=24'),
      api.get('/categories'),
    ]).then(([heroRes, allRes, catRes]) => {
      setProducts(heroRes.data.data || []);
      setAllProducts(allRes.data.data || []);
      setTotalProducts(allRes.data.pagination?.total_items || heroRes.data.pagination?.total_items || 0);
      setCategories(catRes.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleCart = (e, p) => {
    e.preventDefault(); e.stopPropagation();
    const role = user?.role?.toLowerCase();
    if (role === 'admin' || role === 'moderator') { toast.error('Admin accounts cannot add to cart.'); return; }
    addToCart({ ...p, image_url: getImageUrl(primaryImg(p.images)) });
    toast.success(`${p.name} added to cart`);
  };

  const handleWishlist = (e, p) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast.error('Please login first'); return; }
    toggleWishlist(p);
    toast.success(isInWishlist(p.id) ? 'Removed from wishlist' : 'Saved to wishlist');
  };

  if (loading) return (
    <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: `4px solid #e5e7eb`, borderTopColor: C.t900, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const heroProducts = products.slice(0, 5);
  const activeProduct = heroProducts[heroIndex];
  const [p0, p1, p2, p3, p4, p5, p6, p7] = products;

  /* Arrow circle helpers */
  const ArrowCircleLight = ({ to, slug }) => (
    <Link to={to || `/products/${slug}`} style={{ width: 34, height: 34, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', flexShrink: 0, textDecoration: 'none' }}>
      <ArrowRight style={{ width: 14, height: 14, color: C.t900, transform: 'rotate(-45deg)' }} />
    </Link>
  );

  const ArrowCircleDark = () => (
    <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.t900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <ArrowRight style={{ width: 14, height: 14, color: '#fff', transform: 'rotate(-45deg)' }} />
    </div>
  );

  const imgOverlay = { position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,17,23,0.58) 0%, rgba(13,17,23,0.02) 55%)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* ═══ ROW 1 — Hero + Sidebar ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 18rem', gap: '1rem', alignItems: 'stretch' }}>

        {/* HERO CARD (Dynamic Carousel) */}
        <motion.div {...fadeUp(0)} className="hero-card" style={{
          minHeight: '18rem', padding: '2rem 2.5rem',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          position: 'relative', overflow: 'hidden',
        }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={heroIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              {/* Floating product */}
              {activeProduct && (
                <div style={{ position: 'absolute', right: '-5%', top: '50%', transform: 'translateY(-50%)', width: '55%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                  <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 50%, ${C.lime}15 0%, transparent 70%)`, filter: 'blur(40px)' }} />
                  <img 
                    src={getImageUrl(primaryImg(activeProduct.images))} 
                    alt="" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 35px 70px rgba(0,0,0,0.12))' }} 
                  />
                </div>
              )}

              {/* Content */}
              <div style={{ maxWidth: '55%', position: 'relative', zIndex: 2 }}>
                {/* Badge */}
                <div className="badge" style={{ marginBottom: '1.5rem', padding: '0.45rem 0.9rem', fontSize: '0.65rem' }}>
                  <span style={{ width: 6, height: 6, background: C.lime, borderRadius: 2, transform: 'rotate(45deg)', display: 'inline-block', flexShrink: 0 }} />
                  Curated Collection
                </div>

                {/* Heading */}
                <h1 style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 'clamp(2.5rem, 5vw, 4.2rem)',
                  fontWeight: 900, lineHeight: 0.95,
                  letterSpacing: '-0.05em', color: C.t900,
                  margin: '0 0 1.75rem',
                  width: '100%'
                }}>
                  {activeProduct?.name ?? 'Premium Aesthetics'}
                </h1>

                {/* description */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '2.5rem', width: '100%' }}>
                  <div style={{ width: 2, height: 60, background: C.lime, flexShrink: 0, borderRadius: 4 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: C.t500, lineHeight: 1.5, margin: 0 }}>
                      {activeProduct?.description?.slice(0, 140) ?? 'Elevating your everyday with curated products and precision engineering for the modern lifestyle.'}
                    </p>
                  </div>
                </div>

                <Link to={`/products/${activeProduct?.slug}`} className="btn-lime" style={{ height: 52, padding: '0 2rem', fontSize: '0.95rem', borderRadius: '1.25rem' }}>
                  Explore Collection
                  <div className="icon-circle" style={{ width: '2rem', height: '2rem' }}>
                    <ArrowRight style={{ width: 16, height: 16, transform: 'rotate(-45deg)' }} />
                  </div>
                </Link>
              </div>

              {/* Slider Controls / Indicators */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {heroProducts.map((_, i) => (
                    <div 
                      key={i}
                      onClick={() => setHeroIndex(i)}
                      style={{ 
                        width: i === heroIndex ? 24 : 8, 
                        height: 4, 
                        background: i === heroIndex ? C.t900 : '#d1d5db', 
                        borderRadius: 2, 
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {[Share2, Globe, Link2].map((Icon, i) => (
                    <a key={i} href="#" style={{ color: '#d1d5db', transition: 'color .18s' }}
                       onMouseEnter={e => e.currentTarget.style.color = C.t900}
                       onMouseLeave={e => e.currentTarget.style.color = '#d1d5db'}>
                      <Icon style={{ width: 12, height: 12 }} />
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '1.5rem', padding: '1.25rem', border: `1px solid ${C.bSoft}`, flex: 1 }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: C.t900, margin: '0 0 0.75rem' }}>Featured Picks</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {[p3, p4, p5].map((p, i) => p && (
                <ProductCard key={p.id} product={p} variant="horizontal" />
              ))}
            </div>
          </div>
          {p1 && <ProductCard product={p1} variant="overlay" />}
        </div>
      </div>

      {/* ═══ ROW 2 — Bottom 3 cards ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', alignItems: 'stretch' }}>

        {/* More Products */}
        <motion.div {...fadeUp(0.08)} className="card" style={{ 
          padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column',
          background: '#f8fafc', border: `1px solid ${C.bSoft}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: C.t900, margin: 0, letterSpacing: '-0.02em' }}>More Products</h4>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, color: C.t300, margin: '0.2rem 0 0' }}>{totalProducts}+ items available</p>
            </div>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <Heart style={{ width: 14, height: 14, color: C.rose, fill: C.rose }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, justifyContent: 'center' }}>
            {[p2, p3, p4].filter(Boolean).map(p => (
              <ProductCard key={p.id} product={p} variant="horizontal" />
            ))}
          </div>
        </motion.div>

        {/* Stats — Blue */}
        <motion.div {...fadeUp(0.12)} className="card" style={{
          padding: '1.25rem', background: C.blue, height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', gap: '0.6rem', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-30%', right: '-20%', width: '80%', height: '80%', background: 'rgba(255,255,255,0.07)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', position: 'relative', zIndex: 1 }}>
            {[11,22,33].map(u => (
              <div key={u} style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${C.blue}`, overflow: 'hidden', marginLeft: u===11?0:-8, background: '#dbeafe', boxShadow: '0 0 0 1.5px rgba(255,255,255,0.2)' }}>
                <img src={`https://i.pravatar.cc/80?u=${u}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.06em', lineHeight: 1 }}>5m+</p>
            <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,.45)', margin: '0.3rem 0 0' }}>Active Users</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,255,255,0.14)', padding: '0.3rem 0.75rem', borderRadius: 9999, backdropFilter: 'blur(8px)', position: 'relative', zIndex: 1 }}>
            <Star style={{ width: 10, height: 10, fill: '#fbbf24', color: '#fbbf24' }} />
            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#fff', letterSpacing: '0.04em' }}>4.6 reviews</span>
          </div>
        </motion.div>

        {/* Featured — Overlay variant */}
        <div style={{ height: '100%' }}>
          {p6 && (
            <ProductCard product={p6} variant="overlay" />
          )}
        </div>
      </div>

      {/* ═══ PERKS STRIP ═══ */}
      <motion.div {...fadeUp(0.1)} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '0.25rem' }}>
        {[
          { icon: Truck,    label: 'Free Delivery',   sub: 'On orders over ৳999' },
          { icon: Shield,   label: 'Secure Payment',  sub: 'SSL encrypted checkout' },
          { icon: Zap,      label: 'Fast Dispatch',   sub: 'Ships within 24 hours' },
          { icon: RotateCcw,label: 'Easy Returns',    sub: '7-day hassle-free policy' },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: 36, height: 36, background: C.bgMuted, borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon style={{ width: 16, height: 16, color: C.t900 }} />
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 800, color: C.t900, margin: 0, letterSpacing: '-0.01em' }}>{label}</p>
              <p style={{ fontSize: '0.6rem', color: C.t500, margin: '0.1rem 0 0', fontWeight: 500 }}>{sub}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ═══ CATEGORIES ═══ */}
      {categories.length > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 800, color: C.t300, margin: '0 0 0.3rem' }}>Browse by</p>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: C.t900, margin: 0, letterSpacing: '-0.03em' }}>Categories</h2>
            </div>
            <Link to="/products" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', fontWeight: 700, color: C.t500, textDecoration: 'none', transition: 'color .2s' }}
              onMouseEnter={e => e.currentTarget.style.color = C.t900}
              onMouseLeave={e => e.currentTarget.style.color = C.t500}>
              View all <ChevronRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.85rem' }}>
            {categories.slice(0, 8).map((cat, i) => (
              <Link key={cat.id} to={`/products?category=${cat.id}`} style={{ textDecoration: 'none' }}>
                <motion.div {...fadeUp(i * 0.04)} className="card"
                  style={{ padding: '1rem 0.75rem', textAlign: 'center', cursor: 'pointer' }}
                  whileHover={{ y: -3 }}
                >
                  <div style={{ 
                    width: 52, height: 52, background: C.bgMuted, borderRadius: '50%', 
                    margin: '0 auto 0.65rem', overflow: 'hidden', border: `1px solid ${C.bSoft}`
                  }}>
                    {cat.image_url ? (
                      <img src={getImageUrl(cat.image_url)} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>📦</div>
                    )}
                  </div>
                  <p style={{ fontSize: '0.68rem', fontWeight: 800, color: C.t900, margin: 0, letterSpacing: '-0.01em' }}>{cat.name}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ═══ ALL PRODUCTS GRID ═══ */}
      <div style={{ marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <p style={{ fontSize: '0.7rem', fontWeight: 800, color: C.t300, margin: '0 0 0.3rem' }}>Handpicked for you</p>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: C.t900, margin: 0, letterSpacing: '-0.03em' }}>All Products</h2>
          </div>
          <Link to="/products" className="btn-lime" style={{ fontSize: '0.62rem' }}>
            See All
            <div className="icon-circle" style={{ width: '1.75rem', height: '1.75rem' }}>
              <ArrowRight style={{ width: 12, height: 12, transform: 'rotate(-45deg)' }} />
            </div>
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
          {allProducts.map((p, i) => (
            <ProductCard 
              key={p.id} 
              product={p} 
              onCart={(p) => handleCart({ preventDefault: () => {}, stopPropagation: () => {} }, p)}
              onWishlist={(p) => handleWishlist({ preventDefault: () => {}, stopPropagation: () => {} }, p)}
              inWishlist={isInWishlist(p.id)}
            />
          ))}
        </div>
        
        {/* CSS for hover reveal */}
        <style>{`
          div:hover .hover-reveal-btn {
            transform: translateY(0) !important;
            opacity: 1 !important;
          }
        `}</style>
      </div>

      {/* ═══ CTA STRIP ═══ */}
      <motion.div {...fadeUp(0.1)} style={{ background: C.t900, borderRadius: '2rem', padding: '3rem 3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', marginTop: '0.5rem' }}>
        <div>
          <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', margin: '0 0 0.6rem' }}>Stay in the loop</p>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.04em', lineHeight: 1.1 }}>Get exclusive drops &<br />early access.</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
          <input type="email" placeholder="your@email.com" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9999, padding: '0.75rem 1.5rem', fontSize: '0.8rem', fontWeight: 500, color: '#fff', outline: 'none', width: 260, fontFamily: 'inherit' }} />
          <button className="btn-lime">Subscribe <div className="icon-circle"><ArrowRight style={{ width: 14, height: 14, transform: 'rotate(-45deg)' }} /></div></button>
        </div>
      </motion.div>

    </div>
  );
}
