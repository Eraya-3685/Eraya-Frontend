import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Heart, Star, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getImageUrl } from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import LoginModal from './LoginModal';
import toast from 'react-hot-toast';

const C = {
  t900: '#0d1117',
  t700: '#1f2937',
  t500: '#6b7280',
  t300: '#adb5bd',
  bSoft: 'rgba(0,0,0,0.07)',
  bgMuted: '#f3f5f8',
  rose: '#f43f5e',
  teal: '#2a9d8f',
};

const ProductCard = ({
  product,
  onCart,
  onWishlist,
  inWishlist,
  loading = false,
  variant = 'default'
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = ['admin', 'moderator'].includes(user?.role?.toLowerCase());
  const img = product?.images?.find(i => i.is_primary)?.image_url ?? product?.images?.[0]?.image_url;
  const isNew = product?.created_at && new Date(product.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const outOfStock = (product?.stock_count ?? product?.stock ?? 1) <= 0;

  const [cartLoading, setCartLoading] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);
  const [loginModal, setLoginModal] = useState(false);

  if (!product) return null;

  const handleCartClick = async (e) => {
    e?.preventDefault?.(); e?.stopPropagation?.();
    if (cartLoading) return;

    const hasColors = product.colors && product.colors.length > 0;
    const hasSizes = product.sizes && product.sizes.length > 0;

    if (hasColors || hasSizes) {
      toast.error('Please select variation options first');
      navigate(`/products/${product.slug}`);
      return;
    }

    setCartLoading(true);
    await onCart?.(product);
    setCartLoading(false);
  };

  const handleWishClick = async (e) => {
    e?.preventDefault?.(); e?.stopPropagation?.();
    if (wishLoading) return;
    if (!user) { setLoginModal(true); return; }
    setWishLoading(true);
    await onWishlist?.(product);
    setTimeout(() => setWishLoading(false), 400);
  };

  // ─── VARIANT: OVERLAY ───
  if (variant === 'overlay') {
    return (
      <>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'relative', borderRadius: '1.25rem', overflow: 'hidden', height: '100%', minHeight: 160, border: `1px solid ${C.bSoft}` }}>
          <Link to={`/products/${product.slug}`} style={{ display: 'block', height: '100%' }}>
            {img && <img src={getImageUrl(img)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
            <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', margin: '0 0 0.1rem' }}>New Arrival</p>
                <p style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.01em', lineHeight: 1.1 }}>{product.name}</p>
              </div>
              {!isAdmin && (
                <button onClick={handleWishClick} style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', border: 'none', cursor: 'pointer' }}>
                  {wishLoading ? <Loader2 style={{ width: 11, height: 11, animation: 'spin .7s linear infinite' }} /> : <Heart style={{ width: 11, height: 11, fill: inWishlist ? C.rose : 'none', color: inWishlist ? C.rose : '#fff' }} />}
                </button>
              )}
            </div>
          </Link>
        </motion.div>
        <LoginModal open={loginModal} onClose={() => setLoginModal(false)} reason="wishlist" />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </>
    );
  }

  // ─── VARIANT: HORIZONTAL ───
  if (variant === 'horizontal') {
    return (
      <>
        <Link
          to={`/products/${product.slug}`}
          style={{
            display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none',
            padding: '0.75rem 0.75rem', borderRadius: '1.5rem', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            border: '1px solid transparent'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.borderColor = C.bSoft;
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.04)';
            e.currentTarget.style.transform = 'translateX(6px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          <div style={{
            width: 72, height: 72, borderRadius: '1.25rem', background: C.bgMuted,
            overflow: 'hidden', flexShrink: 0, border: `1px solid ${C.bSoft}`
          }}>
            {img && <img src={getImageUrl(img)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: '0.95rem', fontWeight: 800, color: C.t900, margin: '0 0 0.3rem',
              letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {product.name}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {product.discount_price && product.discount_price > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 900, color: C.rose }}>৳{product.discount_price?.toLocaleString()}</span>
                  <span style={{ fontSize: '0.75rem', color: C.t300, textDecoration: 'line-through' }}>৳{product.base_price?.toLocaleString()}</span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#166534', background: '#dcfce7', padding: '0.05rem 0.3rem', borderRadius: '0.35rem', whiteSpace: 'nowrap' }}>
                    {Math.round(((product.base_price - product.discount_price) / product.base_price) * 100)}% Off
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: '0.88rem', fontWeight: 900, color: C.t900 }}>৳{product.base_price?.toLocaleString()}</span>
              )}
              {product.category?.name && (
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: C.t300, background: C.bgMuted, padding: '0.15rem 0.5rem', borderRadius: '0.5rem' }}>
                  {product.category.name}
                </span>
              )}
            </div>
          </div>
        </Link>
        <LoginModal open={loginModal} onClose={() => setLoginModal(false)} reason="wishlist" />
      </>
    );
  }

  // ─── VARIANT: DEFAULT ───
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', position: 'relative' }}>

        {/* Image Container */}
        <div style={{ position: 'relative', borderRadius: '1.25rem', overflow: 'hidden', aspectRatio: '1/1.1', background: C.bgMuted, border: `1px solid ${C.bSoft}` }}>
          <Link to={`/products/${product.slug}`} style={{ display: 'block', height: '100%' }}>
            {img && <img src={getImageUrl(img)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />}
          </Link>

          {/* Badges */}
          <div style={{ position: 'absolute', top: '0.65rem', left: '0.65rem', display: 'flex', gap: '0.35rem' }}>
            {outOfStock ? (
              <div style={{ padding: '0.25rem 0.5rem', background: '#fff', borderRadius: '0.5rem', fontSize: '0.55rem', fontWeight: 800, color: C.t300, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>Sold out</div>
            ) : isNew ? (
              <div style={{ padding: '0.25rem 0.5rem', background: '#dcfce7', borderRadius: '0.5rem', fontSize: '0.55rem', fontWeight: 800, color: '#166534' }}>New in</div>
            ) : null}
          </div>

          {!isAdmin && (
            <>
              {/* Add to cart */}
              <button
                onClick={handleCartClick}
                style={{
                  position: 'absolute', bottom: '0.65rem', right: '0.65rem',
                  width: 34, height: 34,
                  background: loading || cartLoading ? C.t900 : 'rgba(255,255,255,0.95)',
                  borderRadius: '0.65rem', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: cartLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
                onMouseEnter={e => { if (!cartLoading) e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {cartLoading || loading
                  ? <Loader2 style={{ width: 13, height: 13, color: '#fff', animation: 'spin .7s linear infinite' }} />
                  : <ShoppingBag style={{ width: 13, height: 13, color: C.t900 }} />
                }
              </button>

              {/* Wishlist */}
              <button
                onClick={handleWishClick}
                style={{
                  position: 'absolute', top: '0.65rem', right: '0.65rem',
                  width: 34, height: 34,
                  background: inWishlist ? '#fff1f2' : 'rgba(255,255,255,0.95)',
                  borderRadius: '50%', border: `1px solid ${inWishlist ? '#fecdd3' : 'transparent'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: wishLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
                onMouseEnter={e => { if (!wishLoading) e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {wishLoading
                  ? <Loader2 style={{ width: 13, height: 13, color: C.rose, animation: 'spin .7s linear infinite' }} />
                  : <Heart style={{ width: 13, height: 13, color: inWishlist ? C.rose : C.t300, fill: inWishlist ? C.rose : 'none', transition: 'all .2s' }} />
                }
              </button>
            </>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '0 0.25rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: C.t900, margin: '0 0 0.25rem', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {product.discount_price && product.discount_price > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 900, color: C.rose }}>৳{product.discount_price?.toLocaleString()}</span>
                <span style={{ fontSize: '0.78rem', color: C.t300, textDecoration: 'line-through' }}>৳{product.base_price?.toLocaleString()}</span>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#166534', background: '#dcfce7', padding: '0.05rem 0.3rem', borderRadius: '0.35rem', whiteSpace: 'nowrap' }}>
                  {Math.round(((product.base_price - product.discount_price) / product.base_price) * 100)}% Off
                </span>
              </div>
            ) : (
              <p style={{ fontSize: '0.95rem', fontWeight: 900, color: C.t900, margin: 0 }}>৳{product.base_price?.toLocaleString()}</p>
            )}
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {['#f3f4f6', '#fbbf24', '#60a5fa'].map((c, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c, border: `1px solid ${C.bSoft}` }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <LoginModal open={loginModal} onClose={() => setLoginModal(false)} reason="wishlist" />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
};

export default ProductCard;
