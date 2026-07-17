import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Star, ShoppingBag, ChevronRight,
  Zap, Truck, Shield, RotateCcw, Flame, Heart,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { getImageUrl } from '../api/axios';
import toast from 'react-hot-toast';
import useCartStore from '../store/useCartStore';
import useWishlistStore from '../store/useWishlistStore';
import useAuthStore from '../store/useAuthStore';
import useDocumentTitle from '../hooks/useDocumentTitle';
import ProductCard from '../components/ProductCard';
import { HomeSkeleton } from '../components/Skeleton';
import useMediaQuery from '../hooks/useMediaQuery';

/* ── tokens ── */
const C = {
  t900: '#0d1117', t700: '#1f2937', t500: '#6b7280', t300: '#adb5bd',
  bSoft: 'rgba(0,0,0,0.07)', bgCard: '#fff', bgPage: '#edf0f4', bgMuted: '#f3f5f8',
  lime: '#cbff00', blue: '#3b82f6', rose: '#f43f5e',
};

const primaryImg = (images) =>
  images?.find(i => i.is_primary)?.image_url ?? images?.[0]?.image_url ?? null;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.46, ease: [0.22, 1, 0.36, 1] },
});

export default function Home() {
  useDocumentTitle('Eraya — Curated Collection');
  const { isMobile, isTablet } = useMediaQuery();
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const { user } = useAuthStore();
  const addToCart = useCartStore(s => s.addItem);
  const { toggleWishlist, isInWishlist } = useWishlistStore();

  useEffect(() => {
    if (products.length > 0) {
      const t = setInterval(() => setHeroIndex(p => (p + 1) % Math.min(products.length, 5)), 4000);
      return () => clearInterval(t);
    }
  }, [products]);

  useEffect(() => {
    Promise.all([
      api.get('/products?page=1&limit=10'),
      api.get('/products?page=1&limit=24'),
      api.get('/categories'),
    ]).then(([heroRes, allRes, catRes]) => {
      setProducts(heroRes.data.data || []);
      setAllProducts(allRes.data.data || []);
      setTotalProducts(allRes.data.pagination?.total_items || heroRes.data.pagination?.total_items || 0);
      setCategories(catRes.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleCart = (p) => {
    const role = user?.role?.toLowerCase();
    if (role === 'admin' || role === 'moderator') { toast.error('Admin accounts cannot add to cart.'); return; }
    addToCart({ ...p, image_url: getImageUrl(primaryImg(p.images)) });
    toast.success(`${p.name} added to cart`);
  };

  const handleWishlist = (p) => {
    toggleWishlist(p);
    toast.success(isInWishlist(p.id) ? 'Removed from wishlist' : 'Saved to wishlist');
  };

  if (loading) return <HomeSkeleton />;

  const heroProducts = products.slice(0, 5);
  const activeHero = heroProducts[heroIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ══════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: '1.25rem', alignItems: 'stretch', minHeight: isMobile ? 'auto' : '360px' }}>

        {/* Hero Card */}
        <motion.div {...fadeUp(0)} style={{
          background: C.bgMuted,
          borderRadius: '2rem',
          border: `1px solid ${C.bSoft}`,
          overflow: 'hidden',
          position: 'relative',
          padding: isMobile ? '1.5rem 1.25rem 1.25rem' : '2.5rem 2.75rem 2rem',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: '-60px', right: '30%', width: 280, height: 280, borderRadius: '50%', background: `${C.lime}20`, filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', width: 200, height: 200, borderRadius: '50%', background: `${C.blue}12`, filter: 'blur(50px)', pointerEvents: 'none' }} />

          <AnimatePresence mode="wait">
            <motion.div
              key={heroIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.5rem' }}
            >
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'center' : 'flex-start', gap: isMobile ? '1rem' : 0 }}>
                {/* Left text */}
                <div style={{ maxWidth: isMobile ? '100%' : '52%', position: 'relative', zIndex: 2 }}>
                  {/* Badge */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    background: '#fff', border: `1px solid ${C.bSoft}`,
                    borderRadius: 9999, padding: '0.35rem 0.9rem 0.35rem 0.5rem',
                    marginBottom: '1.25rem',
                  }}>
                    <span style={{ width: 20, height: 20, background: C.lime, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Flame style={{ width: 10, height: 10, color: C.t900 }} />
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: C.t500 }}>New Arrival</span>
                  </div>

                  <h1 style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 'clamp(2.2rem, 4vw, 3.8rem)',
                    fontWeight: 900, lineHeight: 0.94,
                    letterSpacing: '-0.05em', color: C.t900,
                    margin: '0 0 1.25rem',
                  }}>
                    {activeHero?.name ?? 'Premium\nCollection'}
                  </h1>

                  {activeHero && (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                      {activeHero.discount_price && activeHero.discount_price > 0 ? (
                        <>
                          <span style={{ fontSize: '1.75rem', fontWeight: 900, color: C.rose, letterSpacing: '-0.04em' }}>
                            ৳{activeHero.discount_price.toLocaleString()}
                          </span>
                          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: C.t300, textDecoration: 'line-through', letterSpacing: '-0.02em' }}>
                            ৳{activeHero.base_price.toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '1.75rem', fontWeight: 900, color: C.t900, letterSpacing: '-0.04em' }}>
                          ৳{activeHero.base_price.toLocaleString()}
                        </span>
                      )}
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: C.t300 }}>BDT</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <Link to={`/products/${activeHero?.slug}`} className="btn-lime" style={{ height: 48, padding: '0 1.5rem', fontSize: '0.85rem', borderRadius: '1.25rem' }}>
                      Shop Now
                      <div className="icon-circle" style={{ width: '2rem', height: '2rem' }}>
                        <ArrowRight style={{ width: 14, height: 14, transform: 'rotate(-45deg)' }} />
                      </div>
                    </Link>
                    <Link to="/products" style={{ fontSize: '0.78rem', fontWeight: 700, color: C.t500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      onMouseEnter={e => e.currentTarget.style.color = C.t900}
                      onMouseLeave={e => e.currentTarget.style.color = C.t500}>
                      See all <ChevronRight style={{ width: 14, height: 14 }} />
                    </Link>
                  </div>
                </div>

                {/* Floating product image */}
                {activeHero && (
                  <div style={{ width: isMobile ? '100%' : '44%', height: isMobile ? 200 : 260, position: 'relative', zIndex: 2, flexShrink: 0 }}>
                    <img
                      src={getImageUrl(primaryImg(activeHero.images))}
                      alt={activeHero.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.12))' }}
                    />
                  </div>
                )}
              </div>

              {/* Bottom bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                {/* Dots */}
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {heroProducts.map((_, i) => (
                    <button key={i} onClick={() => setHeroIndex(i)} style={{
                      width: i === heroIndex ? 28 : 8, height: 8,
                      background: i === heroIndex ? C.t900 : '#d1d5db',
                      borderRadius: 9999, border: 'none', cursor: 'pointer',
                      transition: 'all 0.35s ease', padding: 0,
                    }} />
                  ))}
                </div>
                {/* Mini stats */}
                <div style={{ display: 'flex', gap: '2rem' }}>
                  {[
                    { v: `${totalProducts}+`, l: 'Products' },
                    { v: `${categories.length}+`, l: 'Categories' },
                  ].map(({ v, l }) => (
                    <div key={l} style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '1rem', fontWeight: 900, color: C.t900, margin: 0, letterSpacing: '-0.03em' }}>{v}</p>
                      <p style={{ fontSize: '0.65rem', fontWeight: 600, color: C.t300, margin: 0 }}>{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Right sidebar */}
        <div style={{ display: isMobile ? 'grid' : 'flex', gridTemplateColumns: isMobile ? '1fr 1fr' : undefined, flexDirection: isMobile ? undefined : 'column', gap: '1.25rem' }}>

          {/* Blue users card */}
          <motion.div {...fadeUp(0.05)} style={{
            background: C.blue, borderRadius: '1.75rem', padding: '1.5rem',
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
            position: 'relative', overflow: 'hidden', flex: '0 0 auto',
          }}>
            <div style={{ position: 'absolute', top: '-30%', right: '-15%', width: '70%', height: '70%', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
            <div style={{ display: 'flex', position: 'relative', zIndex: 1 }}>
              {[11, 22, 33, 44].map((u, i) => (
                <div key={u} style={{ width: 34, height: 34, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.4)', overflow: 'hidden', marginLeft: i === 0 ? 0 : -10, background: '#dbeafe' }}>
                  <img src={`https://i.pravatar.cc/80?u=${u}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.06em', lineHeight: 1 }}>{totalProducts}+</p>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', margin: '0.25rem 0 0' }}>Products available</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.15)', padding: '0.35rem 0.9rem', borderRadius: 9999, backdropFilter: 'blur(8px)', width: 'fit-content', position: 'relative', zIndex: 1 }}>
              <Star style={{ width: 11, height: 11, fill: '#fbbf24', color: '#fbbf24' }} />
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#fff' }}>Trusted by thousands</span>
            </div>
          </motion.div>

          {/* Featured product quick list */}
          <motion.div {...fadeUp(0.08)} style={{
            background: '#fff', borderRadius: '1.75rem', padding: '1.25rem',
            border: `1px solid ${C.bSoft}`, flex: 1,
            boxShadow: '0 2px 16px -4px rgba(0,0,0,0.06)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 800, color: C.t900, margin: 0 }}>Top Picks</p>
              <Link to="/products" style={{ fontSize: '0.68rem', fontWeight: 700, color: C.t300, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem', transition: 'color .2s' }}
                onMouseEnter={e => e.currentTarget.style.color = C.t900}
                onMouseLeave={e => e.currentTarget.style.color = C.t300}>
                See all <ChevronRight style={{ width: 12, height: 12 }} />
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: 1 }}>
              {products.slice(0, 3).map(p => p && (
                <Link key={p.id} to={`/products/${p.slug}`} style={{
                  display: 'flex', alignItems: 'center', gap: '0.85rem',
                  textDecoration: 'none', padding: '0.65rem 0.5rem',
                  borderRadius: '1.25rem', transition: 'background 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = C.bgMuted}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 56, height: 56, borderRadius: '1rem', background: C.bgMuted, overflow: 'hidden', flexShrink: 0, border: `1px solid ${C.bSoft}` }}>
                    {primaryImg(p.images) && <img src={getImageUrl(primaryImg(p.images))} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.88rem', fontWeight: 800, color: C.t900, margin: '0 0 0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                    {p.discount_price && p.discount_price > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: C.rose }}>৳{p.discount_price?.toLocaleString()}</span>
                        <span style={{ fontSize: '0.7rem', color: C.t300, textDecoration: 'line-through' }}>৳{p.base_price?.toLocaleString()}</span>
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.8rem', fontWeight: 700, color: C.t500, margin: 0 }}>৳{p.base_price?.toLocaleString()}</p>
                    )}
                  </div>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ChevronRight style={{ width: 13, height: 13, color: C.t300 }} />
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          PERKS STRIP
      ══════════════════════════════════════════════ */}
      <motion.div {...fadeUp(0.06)} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? '0.75rem' : '1rem' }}>
        {[
          { icon: Truck, label: 'Free Delivery', sub: 'On orders over ৳999' },
          { icon: Shield, label: 'Secure Payment', sub: 'SSL encrypted checkout' },
          { icon: Zap, label: 'Fast Dispatch', sub: 'Ships within 24 hours' },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div style={{ width: 40, height: 40, background: C.bgMuted, borderRadius: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon style={{ width: 17, height: 17, color: C.t900 }} />
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 800, color: C.t900, margin: 0 }}>{label}</p>
              <p style={{ fontSize: '0.68rem', color: C.t500, margin: '0.15rem 0 0', fontWeight: 500 }}>{sub}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ══════════════════════════════════════════════
          CATEGORIES
      ══════════════════════════════════════════════ */}
      {categories.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: C.t300, margin: '0 0 0.25rem' }}>Shop by</p>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: C.t900, margin: 0, letterSpacing: '-0.03em' }}>Categories</h2>
            </div>
            <Link to="/products" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 700, color: C.t500, textDecoration: 'none', transition: 'color .2s' }}
              onMouseEnter={e => e.currentTarget.style.color = C.t900}
              onMouseLeave={e => e.currentTarget.style.color = C.t500}>
              View all <ChevronRight style={{ width: 15, height: 15 }} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.85rem' }}>
            {categories.slice(0, 8).map((cat, i) => (
              <Link key={cat.id} to={`/products?category=${cat.id}`} style={{ textDecoration: 'none' }}>
                <motion.div
                  {...fadeUp(i * 0.04)}
                  className="card"
                  style={{ padding: '1.25rem 0.75rem', textAlign: 'center', cursor: 'pointer' }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <div style={{
                    width: 60, height: 60, background: C.bgMuted, borderRadius: '50%',
                    margin: '0 auto 0.75rem', overflow: 'hidden', border: `1px solid ${C.bSoft}`,
                  }}>
                    {cat.image_url ? (
                      <img src={getImageUrl(cat.image_url)} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📦</div>
                    )}
                  </div>
                  <p style={{ fontSize: '0.8rem', fontWeight: 800, color: C.t900, margin: 0, letterSpacing: '-0.01em' }}>{cat.name}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          FEATURED — Bento Grid (2 big + horizontal list)
      ══════════════════════════════════════════════ */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: C.t300, margin: '0 0 0.25rem' }}>Handpicked for you</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: C.t900, margin: 0, letterSpacing: '-0.03em' }}>Featured</h2>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr 300px', gap: '1rem', alignItems: 'stretch', minHeight: isMobile ? 'auto' : '280px' }}>
          {/* Big card 1 */}
          {products[0] && (
            <motion.div {...fadeUp(0.04)} style={{ position: 'relative', borderRadius: '1.75rem', overflow: 'hidden', background: C.bgMuted, border: `1px solid ${C.bSoft}` }}>
              <Link to={`/products/${products[0].slug}`} style={{ display: 'block', height: '100%', position: 'relative' }}>
                {primaryImg(products[0].images) && (
                  <img src={getImageUrl(primaryImg(products[0].images))} alt={products[0].name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 260, transition: 'transform 0.5s ease' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)' }} />
                <div style={{ position: 'absolute', bottom: '1.25rem', left: '1.25rem', right: '1.25rem' }}>
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', margin: '0 0 0.35rem' }}>{products[0].category?.name}</p>
                  <p style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', margin: '0 0 0.25rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{products[0].name}</p>
                  {products[0].discount_price && products[0].discount_price > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 900, color: C.rose }}>৳{products[0].discount_price?.toLocaleString()}</span>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'line-through' }}>৳{products[0].base_price?.toLocaleString()}</span>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.95rem', fontWeight: 900, color: C.lime, margin: 0 }}>৳{products[0].base_price?.toLocaleString()}</p>
                  )}
                </div>
              </Link>
            </motion.div>
          )}

          {/* Big card 2 */}
          {products[1] && (
            <motion.div {...fadeUp(0.07)} style={{ position: 'relative', borderRadius: '1.75rem', overflow: 'hidden', background: C.t900, border: `1px solid ${C.bSoft}` }}>
              <Link to={`/products/${products[1].slug}`} style={{ display: 'block', height: '100%', position: 'relative' }}>
                {primaryImg(products[1].images) && (
                  <img src={getImageUrl(primaryImg(products[1].images))} alt={products[1].name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 260, opacity: 0.75, transition: 'transform 0.5s ease' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)' }} />
                <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem' }}>
                  <div style={{ background: C.lime, borderRadius: 9999, padding: '0.3rem 0.75rem' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: C.t900 }}>New</span>
                  </div>
                </div>
                <div style={{ position: 'absolute', bottom: '1.25rem', left: '1.25rem', right: '1.25rem' }}>
                  <p style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', margin: '0 0 0.25rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{products[1].name}</p>
                  {products[1].discount_price && products[1].discount_price > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 900, color: C.rose }}>৳{products[1].discount_price?.toLocaleString()}</span>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'line-through' }}>৳{products[1].base_price?.toLocaleString()}</span>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.95rem', fontWeight: 900, color: C.lime, margin: 0 }}>৳{products[1].base_price?.toLocaleString()}</p>
                  )}
                </div>
              </Link>
            </motion.div>
          )}

          {/* Vertical product list */}
          <motion.div {...fadeUp(0.1)} style={{
            background: '#fff', borderRadius: '1.75rem', padding: '1.25rem',
            border: `1px solid ${C.bSoft}`, display: 'flex', flexDirection: 'column', gap: '0.5rem',
            boxShadow: '0 2px 16px -4px rgba(0,0,0,0.06)',
          }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 800, color: C.t900, margin: '0 0 0.5rem' }}>More Products</p>
            {products.slice(2, 6).map(p => p && (
              <Link key={p.id} to={`/products/${p.slug}`} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                textDecoration: 'none', padding: '0.55rem 0.4rem',
                borderRadius: '1rem', transition: 'background 0.2s',
                flex: 1,
              }}
                onMouseEnter={e => e.currentTarget.style.background = C.bgMuted}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 52, height: 52, borderRadius: '0.875rem', background: C.bgMuted, overflow: 'hidden', flexShrink: 0, border: `1px solid ${C.bSoft}` }}>
                  {primaryImg(p.images) && <img src={getImageUrl(primaryImg(p.images))} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.82rem', fontWeight: 800, color: C.t900, margin: '0 0 0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                  {p.discount_price && p.discount_price > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: C.rose }}>৳{p.discount_price?.toLocaleString()}</span>
                      <span style={{ fontSize: '0.65rem', color: C.t300, textDecoration: 'line-through' }}>৳{p.base_price?.toLocaleString()}</span>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: C.t500, margin: 0 }}>৳{p.base_price?.toLocaleString()}</p>
                  )}
                </div>
              </Link>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          ALL PRODUCTS GRID
      ══════════════════════════════════════════════ */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: C.t300, margin: '0 0 0.25rem' }}>Explore everything</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: C.t900, margin: 0, letterSpacing: '-0.03em' }}>All Products</h2>
          </div>
          <Link to="/products" className="btn-lime" style={{ fontSize: '0.78rem' }}>
            See All
            <div className="icon-circle" style={{ width: '2rem', height: '2rem' }}>
              <ArrowRight style={{ width: 13, height: 13, transform: 'rotate(-45deg)' }} />
            </div>
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: isMobile ? '0.6rem' : '1rem' }}>
          {allProducts.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              onCart={handleCart}
              onWishlist={handleWishlist}
              inWishlist={isInWishlist(p.id)}
            />
          ))}
        </div>

        <style>{`div:hover .hover-reveal-btn { transform: translateY(0) !important; opacity: 1 !important; }`}</style>
      </div>

      {/* ══════════════════════════════════════════════
          CTA NEWSLETTER
      ══════════════════════════════════════════════ */}
      <motion.div {...fadeUp(0.06)} style={{
        background: C.t900, borderRadius: isMobile ? '1.5rem' : '2rem',
        padding: isMobile ? '1.75rem 1.25rem' : '2.5rem 3rem',
        display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', gap: isMobile ? '1.5rem' : '2rem',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-50%', right: '20%', width: 300, height: 300, borderRadius: '50%', background: `${C.lime}08`, filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', margin: '0 0 0.5rem' }}>Stay in the loop</p>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
            Get exclusive drops &<br />early access deals.
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0, position: 'relative', zIndex: 1, flexDirection: isMobile ? 'column' : 'row' }}>
          <input
            type="email"
            placeholder="your@email.com"
            style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 9999, padding: '0.8rem 1.5rem', fontSize: '0.82rem',
              fontWeight: 500, color: '#fff', outline: 'none', width: isMobile ? '100%' : 260, fontFamily: 'inherit',
            }}
          />
          <button className="btn-lime" style={{ height: 48, fontSize: '0.82rem' }}>
            Subscribe
            <div className="icon-circle">
              <ArrowRight style={{ width: 14, height: 14, transform: 'rotate(-45deg)' }} />
            </div>
          </button>
        </div>
      </motion.div>

    </div>
  );
}
