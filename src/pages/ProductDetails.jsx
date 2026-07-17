import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, ShoppingBag, Shield, Truck, RotateCcw,
  Plus, Minus, Heart, ChevronRight, ChevronLeft, Share2,
  Loader2, Check, Package, ArrowRight, ZoomIn, Flame,
} from 'lucide-react';
import api, { getImageUrl } from '../api/axios';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import useWishlistStore from '../store/useWishlistStore';
import toast from 'react-hot-toast';
import ProductCard from '../components/ProductCard';
import LoginModal from '../components/LoginModal';
import { ProductDetailsSkeleton, LoadingSpinner } from '../components/Skeleton';
import useMediaQuery from '../hooks/useMediaQuery';

const C = {
  t900: '#0d1117', t700: '#1f2937', t500: '#6b7280', t300: '#adb5bd',
  bSoft: 'rgba(0,0,0,0.07)', bMed: 'rgba(0,0,0,0.10)',
  bgPage: '#edf0f4', bgCard: '#fff', bgMuted: '#f3f5f8',
  lime: '#cbff00', blue: '#3b82f6', rose: '#f43f5e', green: '#22c55e',
};

/* ── Stars row ── */
const Stars = ({ rating, size = 12 }) => (
  <div style={{ display: 'flex', gap: 2 }}>
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} style={{
        width: size, height: size,
        fill: i <= Math.round(rating) ? '#fbbf24' : 'none',
        color: i <= Math.round(rating) ? '#fbbf24' : C.t300,
      }} />
    ))}
  </div>
);

const ProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isMobile } = useMediaQuery();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [fetchingReviews, setFetchingReviews] = useState(false);
  const [loginModal, setLoginModal] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  const addItem = useCartStore(s => s.addItem);
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { user } = useAuthStore();
  const isAdmin = ['admin', 'moderator'].includes(user?.role?.toLowerCase());

  useEffect(() => { fetchProduct(); }, [slug]);

  useEffect(() => {
    if (product) {
      document.title = `${product.name} | Eraya`;
      let descMeta = document.querySelector('meta[name="description"]');
      if (!descMeta) {
        descMeta = document.createElement('meta');
        descMeta.setAttribute('name', 'description');
        document.head.appendChild(descMeta);
      }
      descMeta.setAttribute('content', product.description || `Buy ${product.name} on Eraya.`);

      const setOGMeta = (property, content) => {
        let ogMeta = document.querySelector(`meta[property="${property}"]`);
        if (!ogMeta) {
          ogMeta = document.createElement('meta');
          ogMeta.setAttribute('property', property);
          document.head.appendChild(ogMeta);
        }
        ogMeta.setAttribute('content', content);
      };

      setOGMeta('og:title', product.name);
      setOGMeta('og:description', product.description || `Buy ${product.name} on Eraya.`);
      if (product.image_url || product.imageUrl) {
        setOGMeta('og:image', product.image_url || product.imageUrl);
      }

      const colors = product.colors || [];
      const sizes = product.sizes || [];
      if (colors.length === 0) {
        setSelectedColor('one colour');
      } else if (colors.length === 1) {
        setSelectedColor(colors[0]);
      } else {
        setSelectedColor('');
      }

      if (sizes.length === 0) {
        setSelectedSize('one size');
      } else if (sizes.length === 1) {
        setSelectedSize(sizes[0]);
      } else {
        setSelectedSize('');
      }
    } else {
      setSelectedColor('');
      setSelectedSize('');
    }
  }, [product]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products/${slug}`);
      setProduct(res.data);
      const primary = res.data.images?.find(i => i.is_primary) || res.data.images?.[0];
      if (primary) setSelectedImage(primary.image_url);
      setFetchingReviews(true);
      api.get(`/reviews/${res.data.id}`)
        .then(r => setReviews(r.data || []))
        .catch(() => {})
        .finally(() => setFetchingReviews(false));
      const simRes = await api.get(`/products?category_id=${res.data.categories?.[0]?.id || ''}&limit=6`);
      setSimilarProducts(simRes.data.data?.filter(p => p.id !== res.data.id) || []);
    } catch {
      toast.error('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    const hasColors = product.colors && product.colors.length > 0;
    const hasSizes = product.sizes && product.sizes.length > 0;

    if (hasColors && !selectedColor) {
      toast.error('Please select a colour');
      return;
    }
    if (hasSizes && !selectedSize) {
      toast.error('Please select a size');
      return;
    }

    if (outOfStock || addingToCart) return;
    setAddingToCart(true);
    await new Promise(r => setTimeout(r, 500));
    addItem({ ...product, image_url: getImageUrl(selectedImage || product.images?.[0]?.image_url) }, quantity, selectedColor || 'one colour', selectedSize || 'one size');
    setAddingToCart(false);
    setAddedToCart(true);
    toast.success('Added to cart!');
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const handleBuyNow = async () => {
    const hasColors = product.colors && product.colors.length > 0;
    const hasSizes = product.sizes && product.sizes.length > 0;

    if (hasColors && !selectedColor) {
      toast.error('Please select a colour');
      return;
    }
    if (hasSizes && !selectedSize) {
      toast.error('Please select a size');
      return;
    }

    if (outOfStock || buyingNow) return;
    setBuyingNow(true);
    await new Promise(r => setTimeout(r, 400));
    addItem({ ...product, image_url: getImageUrl(selectedImage || product.images?.[0]?.image_url) }, quantity, selectedColor || 'one colour', selectedSize || 'one size');
    navigate('/checkout');
  };

  const handleWishlist = async () => {
    if (!user) { setLoginModal(true); return; }
    setWishLoading(true);
    toggleWishlist(product);
    await new Promise(r => setTimeout(r, 400));
    setWishLoading(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrevImg = (e) => {
    e.stopPropagation();
    if (!product.images || product.images.length <= 1) return;
    const idx = product.images.findIndex(img => img.image_url === selectedImage);
    const prevIdx = (idx - 1 + product.images.length) % product.images.length;
    setSelectedImage(product.images[prevIdx].image_url);
  };

  const handleNextImg = (e) => {
    e.stopPropagation();
    if (!product.images || product.images.length <= 1) return;
    const idx = product.images.findIndex(img => img.image_url === selectedImage);
    const nextIdx = (idx + 1) % product.images.length;
    setSelectedImage(product.images[nextIdx].image_url);
  };

  /* ── Loading ── */
  if (loading) return <ProductDetailsSkeleton />;

  if (!product) return (
    <div style={{ height: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <Package style={{ width: 48, height: 48, color: C.t300 }} />
      <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: C.t900, margin: 0 }}>Product not found</h2>
      <Link to="/products" style={{ color: C.blue, fontWeight: 700, textDecoration: 'none', fontSize: '0.85rem' }}>← Back to Collection</Link>
    </div>
  );

  const getSelectedVariationStock = () => {
    if (!product) return 0;
    if (!product.variation_stock || product.variation_stock.length === 0) {
      return product.stock_count;
    }
    const hasColors = product.colors && product.colors.length > 0;
    const hasSizes = product.sizes && product.sizes.length > 0;

    if ((hasColors && !selectedColor) || (hasSizes && !selectedSize)) {
      return product.stock_count;
    }

    const colorKey = selectedColor || 'one colour';
    const sizeKey = selectedSize || 'one size';

    const match = product.variation_stock.find(
      v => v.color.toLowerCase() === colorKey.toLowerCase() && 
           v.size.toLowerCase() === sizeKey.toLowerCase()
    );

    return match ? match.stock : 0;
  };

  const isColorDisabled = (color) => {
    if (!product || !product.variation_stock || product.variation_stock.length === 0) return false;
    if (!selectedSize || selectedSize === 'one size') {
      const colorStock = product.variation_stock.filter(v => v.color.toLowerCase() === color.toLowerCase());
      if (colorStock.length > 0) {
        return colorStock.every(v => v.stock <= 0);
      }
      return false;
    }
    const match = product.variation_stock.find(
      v => v.color.toLowerCase() === color.toLowerCase() &&
           v.size.toLowerCase() === selectedSize.toLowerCase()
    );
    return match ? match.stock <= 0 : true;
  };

  const isSizeDisabled = (size) => {
    if (!product || !product.variation_stock || product.variation_stock.length === 0) return false;
    if (!selectedColor || selectedColor === 'one colour') {
      const sizeStock = product.variation_stock.filter(v => v.size.toLowerCase() === size.toLowerCase());
      if (sizeStock.length > 0) {
        return sizeStock.every(v => v.stock <= 0);
      }
      return false;
    }
    const match = product.variation_stock.find(
      v => v.color.toLowerCase() === selectedColor.toLowerCase() &&
           v.size.toLowerCase() === size.toLowerCase()
    );
    return match ? match.stock <= 0 : true;
  };

  const activeStock = getSelectedVariationStock();
  const isSelectionComplete = product ? (!((product.colors && product.colors.length > 0 && !selectedColor) || (product.sizes && product.sizes.length > 0 && !selectedSize))) : false;
  const outOfStock = product ? (isSelectionComplete ? activeStock <= 0 : product.stock_count <= 0) : true;
  const avgRating = (product.total_reviews && product.total_reviews > 0) ? product.average_rating : null;
  const inWL = isInWishlist(product.id);
  // Compute actual avg from loaded reviews
  const computedAvg = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length)
    : null;
  const displayRating = avgRating ?? computedAvg;
  const pct = product.discount_price && product.base_price ? Math.round(((product.base_price - product.discount_price) / product.base_price) * 100) : 0;

  return (
    <div style={{ paddingBottom: '4rem' }}>

      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ display: 'flex', gap: '0.4rem', fontSize: '0.72rem', color: C.t300, marginBottom: '1.25rem', fontWeight: 600, alignItems: 'center' }}
      >
        {[['Home', '/'], ['Collection', '/products']].map(([label, to]) => (
          <React.Fragment key={to}>
            <Link to={to} style={{ color: 'inherit', textDecoration: 'none', transition: 'color .15s' }}
              onMouseEnter={e => e.currentTarget.style.color = C.t900}
              onMouseLeave={e => e.currentTarget.style.color = C.t300}>{label}</Link>
            <ChevronRight style={{ width: 10, height: 10, opacity: 0.5 }} />
          </React.Fragment>
        ))}
        <span style={{ color: C.t900, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</span>
      </motion.div>

      {/* ══ MAIN CARD ══ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: '#fff', border: `1px solid ${C.bSoft}`, borderRadius: '2rem',
          padding: isMobile ? '1.25rem' : '2rem', boxShadow: '0 2px 24px -6px rgba(0,0,0,0.08)', marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '1.5rem' : '2.5rem' }}>

          {/* ── LEFT: Gallery ── */}
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', gap: '0.75rem' }}>
            {/* Thumbnails */}
            {product.images?.length > 1 && (
              <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '0.5rem', width: isMobile ? '100%' : 56, flexShrink: 0, overflowX: isMobile ? 'auto' : 'visible' }}>
                {product.images.map(img => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.image_url)}
                    style={{
                      aspectRatio: '1/1', borderRadius: '0.75rem', overflow: 'hidden',
                      border: `2px solid ${selectedImage === img.image_url ? C.t900 : 'transparent'}`,
                      background: C.bgMuted, cursor: 'pointer', padding: 0,
                      transition: 'all .2s', flexShrink: 0,
                    }}
                  >
                    <img src={getImageUrl(img.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div style={{ flex: 1, position: 'relative', borderRadius: '1.5rem', overflow: 'hidden', background: C.bgMuted, border: `1px solid ${C.bSoft}`, height: 340, cursor: 'zoom-in' }}
              onClick={() => setZoom(true)}>
              {pct > 0 && (
                <div style={{
                  position: 'absolute', top: '0.85rem', left: '0.85rem',
                  background: C.rose, color: '#fff', padding: '0.35rem 0.75rem',
                  borderRadius: 9999, fontWeight: 900, fontSize: '0.72rem',
                  boxShadow: '0 4px 12px rgba(244, 63, 94, 0.4)', letterSpacing: '0.02em',
                  zIndex: 10, display: 'flex', alignItems: 'center', gap: '0.2rem'
                }}>
                  <Flame style={{ width: 11, height: 11, fill: '#fff' }} />
                  {pct}% Off
                </div>
              )}

              {product.images?.length > 1 && (
                <>
                  {/* Left Arrow */}
                  <button onClick={handlePrevImg} style={{
                    position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', borderRadius: '50%',
                    width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${C.bSoft}`, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    cursor: 'pointer', zIndex: 15, transition: 'all .15s'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; e.currentTarget.style.transform = 'translateY(-50%)'; }}
                  >
                    <ChevronLeft style={{ width: 14, height: 14, color: C.t900 }} />
                  </button>

                  {/* Right Arrow */}
                  <button onClick={handleNextImg} style={{
                    position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', borderRadius: '50%',
                    width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${C.bSoft}`, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    cursor: 'pointer', zIndex: 15, transition: 'all .15s'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; e.currentTarget.style.transform = 'translateY(-50%)'; }}
                  >
                    <ChevronRight style={{ width: 14, height: 14, color: C.t900 }} />
                  </button>
                </>
              )}
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  src={getImageUrl(selectedImage)}
                  alt={product.name}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </AnimatePresence>
              {/* Zoom hint */}
              <div style={{ position: 'absolute', top: '0.85rem', right: '0.85rem', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <ZoomIn style={{ width: 14, height: 14, color: C.t700 }} />
              </div>
              {outOfStock && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ background: C.t900, color: '#fff', padding: '0.5rem 1.5rem', borderRadius: 9999, fontWeight: 900, fontSize: '0.78rem' }}>Out of Stock</span>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Details ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Top: rating + share */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {displayRating != null && (
                  <>
                    <Stars rating={displayRating} size={13} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: C.t900 }}>{displayRating.toFixed(1)}</span>
                  </>
                )}
                {reviews.length > 0 && (
                  <span style={{ fontSize: '0.65rem', color: C.t300, fontWeight: 600 }}>({reviews.length} reviews)</span>
                )}
              </div>
              <button onClick={handleShare} style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.35rem 0.85rem', background: copied ? '#f0fdf4' : C.bgMuted,
                border: `1px solid ${copied ? '#bbf7d0' : C.bSoft}`,
                borderRadius: 9999, cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700,
                color: copied ? '#16a34a' : C.t500, transition: 'all .2s', fontFamily: 'inherit',
              }}>
                {copied ? <Check style={{ width: 11, height: 11 }} /> : <Share2 style={{ width: 11, height: 11 }} />}
                {copied ? 'Copied!' : 'Share'}
              </button>
            </div>

            {/* Title + price */}
            <div>
              {product.category && (
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: C.t300, background: C.bgMuted, padding: '0.2rem 0.6rem', borderRadius: '0.5rem', display: 'inline-block', marginBottom: '0.5rem' }}>
                  {product.category?.name || product.categories?.[0]?.name}
                </span>
              )}
              <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: C.t900, margin: '0 0 0.75rem', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
                {product.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', flexWrap: 'wrap' }}>
                {product.discount_price && product.discount_price > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 900, color: C.rose, letterSpacing: '-0.04em' }}>
                      ৳{product.discount_price?.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: C.t300, textDecoration: 'line-through', letterSpacing: '-0.02em' }}>
                      ৳{product.base_price?.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#166534', background: '#dcfce7', padding: '0.15rem 0.5rem', borderRadius: '0.5rem', marginLeft: '0.25rem', verticalAlign: 'middle', height: 'fit-content' }}>
                      {Math.round(((product.base_price - product.discount_price) / product.base_price) * 100)}% Off
                    </span>
                  </div>
                ) : (
                  <span style={{ fontSize: '2rem', fontWeight: 900, color: C.t900, letterSpacing: '-0.04em' }}>
                    ৳{product.base_price?.toLocaleString()}
                  </span>
                )}
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: C.t300 }}>BDT</span>
                {activeStock > 0 && activeStock <= 10 && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: C.rose, background: '#fff1f2', padding: '0.2rem 0.6rem', borderRadius: '0.5rem' }}>
                    {isSelectionComplete ? `Only ${activeStock} left for this option!` : `Only ${activeStock} left!`}
                  </span>
                )}
              </div>
            </div>

            <div style={{ height: 1, background: C.bSoft }} />

            {/* Description */}
            <p style={{ fontSize: '0.82rem', color: C.t500, lineHeight: 1.65, margin: 0, fontWeight: 500 }}>
              {product.description || 'Premium craftsmanship with refined materials for the modern lifestyle.'}
            </p>

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: C.t900 }}>
                  Colour <span style={{ color: C.rose }}>*</span>
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {product.colors.map(color => {
                    const disabled = isColorDisabled(color);
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        disabled={disabled}
                        style={{
                          padding: '0.45rem 0.9rem',
                          borderRadius: '0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          border: `1.5px solid ${selectedColor === color ? C.t900 : C.bSoft}`,
                          background: selectedColor === color ? C.t900 : '#fff',
                          color: selectedColor === color ? '#fff' : C.t700,
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s',
                          opacity: disabled ? 0.4 : 1,
                          textDecoration: disabled ? 'line-through' : 'none'
                        }}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: C.t900 }}>Colour</span>
                <span style={{ fontSize: '0.78rem', color: C.t500, fontWeight: 600 }}>one colour</span>
              </div>
            )}

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: C.t900 }}>
                  Size <span style={{ color: C.rose }}>*</span>
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {product.sizes.map(size => {
                    const disabled = isSizeDisabled(size);
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        disabled={disabled}
                        style={{
                          padding: '0.45rem 0.9rem',
                          borderRadius: '0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          border: `1.5px solid ${selectedSize === size ? C.t900 : C.bSoft}`,
                          background: selectedSize === size ? C.t900 : '#fff',
                          color: selectedSize === size ? '#fff' : C.t700,
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s',
                          opacity: disabled ? 0.4 : 1,
                          textDecoration: disabled ? 'line-through' : 'none'
                        }}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: C.t900 }}>Size</span>
                <span style={{ fontSize: '0.78rem', color: C.t500, fontWeight: 600 }}>one size</span>
              </div>
            )}

            <div style={{ height: 1, background: C.bSoft }} />

            {/* Quantity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: C.t900 }}>Qty</span>
              <div style={{ display: 'flex', alignItems: 'center', background: C.bgMuted, borderRadius: 9999, padding: '0.25rem' }}>
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'all .15s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'}>
                  <Minus style={{ width: 10, height: 10 }} />
                </button>
                <span style={{ width: 38, textAlign: 'center', fontWeight: 900, fontSize: '0.9rem', color: C.t900 }}>{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'all .15s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'}>
                  <Plus style={{ width: 10, height: 10 }} />
                </button>
              </div>
              {activeStock > 0 ? (
                <span style={{ fontSize: '0.65rem', color: C.green, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, display: 'inline-block' }} />
                  In Stock ({activeStock})
                </span>
              ) : (
                <span style={{ fontSize: '0.65rem', color: C.rose, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.rose, display: 'inline-block' }} />
                  Out of Stock
                </span>
              )}
            </div>

            {/* CTAs */}
            {!isAdmin && (
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                {/* Add to cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={outOfStock || addingToCart}
                  style={{
                    flex: 1, height: 48, border: 'none',
                    background: addedToCart ? C.green : C.t900,
                    color: '#fff', borderRadius: '1.25rem',
                    fontSize: '0.85rem', fontWeight: 800, cursor: outOfStock ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', opacity: outOfStock ? 0.45 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    fontFamily: 'inherit',
                    boxShadow: addedToCart ? '0 8px 20px rgba(34, 197, 94, 0.3)' : '0 8px 24px rgba(13, 17, 23, 0.15)',
                  }}
                  onMouseEnter={e => { if (!outOfStock && !addingToCart) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(13, 17, 23, 0.25)'; } }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = addedToCart ? '0 8px 20px rgba(34, 197, 94, 0.3)' : '0 8px 24px rgba(13, 17, 23, 0.15)'; }}
                >
                  {addingToCart
                    ? <><Loader2 style={{ width: 15, height: 15, animation: 'spin .7s linear infinite' }} /> Adding…</>
                    : addedToCart
                    ? <><Check style={{ width: 15, height: 15 }} /> Added!</>
                    : <><ShoppingBag style={{ width: 15, height: 15 }} /> Add to Cart</>
                  }
                </button>

                {/* Buy Now */}
                <button
                  onClick={handleBuyNow}
                  disabled={outOfStock || buyingNow}
                  className="btn-lime"
                  style={{
                    flex: 1.1, height: 48, padding: '0 1rem', borderRadius: '1.25rem',
                    fontSize: '0.85rem', opacity: outOfStock ? 0.45 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    boxShadow: '0 8px 24px rgba(203, 255, 0, 0.35)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={e => { if (!outOfStock) { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(203, 255, 0, 0.5)'; } }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(203, 255, 0, 0.35)'; }}
                >
                  {buyingNow
                    ? <Loader2 style={{ width: 15, height: 15, animation: 'spin .7s linear infinite' }} />
                    : <>Buy Now <div className="icon-circle" style={{ width: '1.6rem', height: '1.6rem' }}><ArrowRight style={{ width: 12, height: 12, transform: 'rotate(-45deg)' }} /></div></>
                  }
                </button>

                {/* Wishlist */}
                <button
                  onClick={handleWishlist}
                  disabled={wishLoading}
                  style={{
                    width: 48, height: 48, flexShrink: 0,
                    border: `1.5px solid ${inWL ? '#fecdd3' : C.bSoft}`,
                    background: inWL ? '#fff1f2' : '#fff',
                    borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (!wishLoading) e.currentTarget.style.transform = 'scale(1.05)'; }}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  {wishLoading
                    ? <Loader2 style={{ width: 16, height: 16, color: C.rose, animation: 'spin .7s linear infinite' }} />
                    : <Heart style={{ width: 16, height: 16, color: inWL ? C.rose : C.t300, fill: inWL ? C.rose : 'none', transition: 'all .25s' }} />
                  }
                </button>
              </div>
            )}

            {/* Perks */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', width: '100%', marginTop: '0.5rem' }}>
              {[
                { icon: Truck, label: 'Fast Shipping' },
                { icon: Shield, label: '100% Genuine' },
                { icon: Check, label: 'SSL Secured' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 0.85rem', background: C.bgMuted, borderRadius: '1rem', border: `1px solid ${C.bSoft}`, transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = C.t900; }}
                  onMouseLeave={e => { e.currentTarget.style.background = C.bgMuted; e.currentTarget.style.borderColor = C.bSoft; }}>
                  <Icon style={{ width: 13, height: 13, color: C.t900, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: C.t900 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ══ REVIEWS + SIMILAR ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.1fr 1fr', gap: '1.25rem' }}>

        {/* Reviews */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: 0.1 }}
          style={{ background: '#fff', border: `1px solid ${C.bSoft}`, borderRadius: '2rem', padding: '1.75rem', boxShadow: '0 2px 24px -6px rgba(0,0,0,0.06)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: C.t900 }}>Reviews</h2>
            {displayRating != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.85rem', background: C.bgMuted, borderRadius: 9999 }}>
                <Star style={{ width: 12, height: 12, fill: '#fbbf24', color: '#fbbf24' }} />
                <span style={{ fontSize: '0.78rem', fontWeight: 900, color: C.t900 }}>{displayRating.toFixed(1)}</span>
                <span style={{ fontSize: '0.65rem', color: C.t300, fontWeight: 600 }}>/ 5.0</span>
              </div>
            )}
          </div>

          {fetchingReviews ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
              <LoadingSpinner size={32} label="Loading reviews…" />
            </div>
          ) : reviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.map((rev, i) => (
                <div key={rev.id}
                  style={{
                    padding: '1.15rem', background: C.bgMuted, borderRadius: '1.25rem',
                    border: `1px solid ${C.bSoft}`, transition: 'all 0.25s ease-in-out',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)'; e.currentTarget.style.background = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.02)'; e.currentTarget.style.background = C.bgMuted; }}
                >
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.t900, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 900, flexShrink: 0 }}>
                        {rev.user?.full_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p style={{ fontSize: '0.82rem', fontWeight: 800, color: C.t900, margin: 0 }}>{rev.user?.full_name || 'Anonymous'}</p>
                        <Stars rating={rev.rating} size={9} />
                      </div>
                    </div>
                    <span style={{ fontSize: '0.62rem', color: C.t300, fontWeight: 600 }}>
                      {new Date(rev.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: C.t700, lineHeight: 1.6, margin: rev.image_url ? '0 0 0.5rem 0' : 0 }}>{rev.comment}</p>
                  {rev.image_url && rev.image_url !== 'null' && rev.image_url !== '' && (
                    <img 
                      src={getImageUrl(rev.image_url)} 
                      style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: '0.75rem', border: `1px solid ${C.bSoft}`, cursor: 'pointer' }} 
                      alt="Review" 
                      onClick={() => window.open(getImageUrl(rev.image_url), '_blank')}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', background: C.bgMuted, borderRadius: '1.25rem' }}>
              <Star style={{ width: 28, height: 28, color: C.t300, marginBottom: '0.75rem' }} />
              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: C.t900, margin: '0 0 0.25rem' }}>No reviews yet</p>
              <p style={{ fontSize: '0.72rem', color: C.t300, margin: 0 }}>Be the first to review this product.</p>
            </div>
          )}
        </motion.div>

        {/* Similar Products */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: 0.14 }}
          style={{ background: '#fff', border: `1px solid ${C.bSoft}`, borderRadius: '2rem', padding: '1.75rem', boxShadow: '0 2px 24px -6px rgba(0,0,0,0.06)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: C.t900 }}>Similar Items</h2>
            <Link to="/products" style={{ fontSize: '0.68rem', fontWeight: 700, color: C.t300, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem', transition: 'color .2s' }}
              onMouseEnter={e => e.currentTarget.style.color = C.t900}
              onMouseLeave={e => e.currentTarget.style.color = C.t300}>
              See all <ChevronRight style={{ width: 11, height: 11 }} />
            </Link>
          </div>
          {similarProducts.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)', gap: '0.85rem' }}>
              {similarProducts.slice(0, 4).map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onCart={() => addItem(p)}
                  onWishlist={() => toggleWishlist(p)}
                  inWishlist={isInWishlist(p.id)}
                />
              ))}
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', background: C.bgMuted, borderRadius: '1.25rem' }}>
              <Package style={{ width: 28, height: 28, color: C.t300, marginBottom: '0.75rem' }} />
              <p style={{ fontSize: '0.78rem', color: C.t300, margin: 0, fontWeight: 600 }}>No similar products found</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* ══ IMAGE ZOOM MODAL ══ */}
      <AnimatePresence>
        {zoom && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setZoom(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', cursor: 'zoom-out' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => setZoom(false)}
              style={{ position: 'fixed', inset: '3%', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
            >
              <img
                src={getImageUrl(selectedImage)}
                alt={product.name}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '1.25rem', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}
                onClick={e => e.stopPropagation()}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <LoginModal open={loginModal} onClose={() => setLoginModal(false)} reason="wishlist" />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default ProductDetails;
