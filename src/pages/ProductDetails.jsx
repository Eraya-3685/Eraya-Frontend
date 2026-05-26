import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShoppingBag, Shield, Truck, RotateCcw, Plus, Minus, Heart, MapPin, Info, ChevronRight, X, Bookmark, Share2 } from 'lucide-react';
import api, { getImageUrl } from '../api/axios';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import useWishlistStore from '../store/useWishlistStore';
import toast from 'react-hot-toast';
import useSettingsStore from '../store/useSettingsStore';
import ProductCard from '../components/ProductCard';

const C = {
  t900:'#0d1117', t700:'#1f2937', t500:'#6b7280', t300:'#adb5bd',
  bSoft:'rgba(0,0,0,0.07)', bLine:'#edf0f4',
  bgPage:'#f7f8fa', bgCard:'#fff', bgMuted:'#f3f5f8',
  lime:'#cbff00', blue:'#3b82f6', rose:'#f43f5e', green:'#22c55e', orange:'#f97316',
};

const ProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [fetchingReviews, setFetchingReviews] = useState(false);
  
  const addItem = useCartStore((state) => state.addItem);
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { user } = useAuthStore();
  const isAdmin = ['admin', 'moderator'].includes(user?.role?.toLowerCase());

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/products/${slug}`);
      setProduct(response.data);
      if (response.data.images?.length > 0) {
        const primary = response.data.images.find((img) => img.is_primary) || response.data.images[0];
        setSelectedImage(primary.image_url);
      }
      
      // Fetch reviews
      setFetchingReviews(true);
      api.get(`/reviews/${response.data.id}`)
        .then(r => setReviews(r.data || []))
        .catch(e => console.error('Reviews fail', e))
        .finally(() => setFetchingReviews(false));

      // Fetch similar products
      const similarRes = await api.get(`/products?category_id=${response.data.categories?.[0]?.id || ''}&limit=6`);
      setSimilarProducts(similarRes.data.data?.filter(p => p.id !== response.data.id) || []);
    } catch (error) {
      console.error('Failed to fetch product', error);
      toast.error('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (product.stock_count <= 0) return;
    setAddingToCart(true);
    await new Promise(r => setTimeout(r, 600));
    addItem({ ...product, image_url: selectedImage || product.images?.[0]?.image_url }, quantity);
    setAddingToCart(false);
    toast.success('Added to cart');
  };

  const handleBuyNow = async () => {
    if (product.stock_count <= 0) return;
    setBuyingNow(true);
    await new Promise(r => setTimeout(r, 600));
    addItem({ ...product, image_url: selectedImage || product.images?.[0]?.image_url }, quantity);
    navigate('/checkout');
  };

  if (loading) return (
    <div style={{ height:'80vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
       <div style={{ width:40, height:40, border:`3px solid ${C.bSoft}`, borderTopColor:C.t900, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
       <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!product) return (
    <div style={{ height:'60vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1rem' }}>
      <h2 style={{ fontSize:'1.5rem', fontWeight:800, color:C.t900 }}>Product not found</h2>
      <Link to="/products" style={{ color:C.blue, fontWeight:700, textDecoration:'none' }}>← Back to Shop</Link>
    </div>
  );

  const outOfStock = product.stock_count <= 0;
  const avgRating = product.average_rating || 5.0;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.7rem', color: C.t300, marginBottom: '1.25rem', fontWeight: 600 }}>
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
        <span style={{ opacity: 0.5 }}>/</span>
        <Link to="/products" style={{ color: 'inherit', textDecoration: 'none' }}>Collection</Link>
        <span style={{ opacity: 0.5 }}>/</span>
        <span style={{ color: C.t900 }}>{product.name}</span>
      </div>

      {/* Main Container - Compact Card */}
      <div style={{ 
        background: '#fff', border: `1px solid ${C.bSoft}`, borderRadius: '2rem', 
        padding: '2rem', boxShadow: '0 8px 30px rgba(0,0,0,0.02)',
        marginBottom: '2.5rem', maxWidth: '1400px', margin: '0 auto 2.5rem'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: '3rem' }}>
          
          {/* Left: Gallery */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {/* Thumbnails */}
            {product.images?.length > 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: 50 }}>
                {product.images.map((img) => (
                  <div 
                    key={img.id}
                    onClick={() => setSelectedImage(img.image_url)}
                    style={{ 
                      aspectRatio: '1/1', 
                      borderRadius: '0.5rem', 
                      overflow: 'hidden', 
                      cursor: 'pointer',
                      border: `2px solid ${selectedImage === img.image_url ? C.t900 : 'transparent'}`,
                      transition: 'all 0.2s',
                      background: C.bgMuted
                    }}
                  >
                    <img src={getImageUrl(img.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  </div>
                ))}
              </div>
            )}
            {/* Main Image */}
            <div style={{ flex: 1, position: 'relative', borderRadius: '1.5rem', overflow: 'hidden', background: C.bgMuted, minHeight: 380, border: `1px solid ${C.bSoft}` }}>
              <img src={getImageUrl(selectedImage)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={product.name} />
              {outOfStock && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ background: C.t900, color: '#fff', padding: '0.4rem 1.25rem', borderRadius: 9999, fontWeight: 900, fontSize: '0.75rem' }}>Out of Stock</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingTop: '0.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                {[1,2,3,4,5].map(i => (
                  <Star key={i} style={{ width: 10, height: 10, fill: i <= Math.round(avgRating) ? '#fbbf24' : 'none', color: i <= Math.round(avgRating) ? '#fbbf24' : C.t300 }} />
                ))}
                <span style={{ fontSize: '0.7rem', fontWeight: 800, marginLeft: '0.4rem', color: C.t900 }}>{avgRating.toFixed(1)} / 5.0</span>
              </div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: C.t900, margin: '0 0 0.4rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{product.name}</h1>
              <p style={{ fontSize: '1.35rem', fontWeight: 900, color: C.t900, margin: 0 }}>৳{product.base_price?.toLocaleString()}</p>
            </div>

            <div style={{ height: 1, background: C.bSoft }} />

            {/* Description Preview */}
            <div>
              <p style={{ fontSize: '0.8rem', color: C.t700, lineHeight: 1.5, margin: 0 }}>
                {product.description || 'This premium collection features refined materials and minimalist design, offering both form and function at an exceptional point.'}
              </p>
            </div>

            {/* Quantity Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <p style={{ fontSize: '0.75rem', fontWeight: 900, color: C.t900, margin: 0 }}>Quantity</p>
               <div style={{ display: 'flex', alignItems: 'center', background: C.bgMuted, borderRadius: '9999px', padding: '0.2rem' }}>
                  <button onClick={() => setQuantity(q => Math.max(1, q-1))} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}><Minus style={{ width: 9 }} /></button>
                  <span style={{ width: 30, textAlign: 'center', fontWeight: 800, fontSize: '0.8rem' }}>{quantity}</span>
                  <button onClick={() => setQuantity(q => q+1)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}><Plus style={{ width: 9 }} /></button>
               </div>
            </div>

            {/* Action Buttons */}
            {!isAdmin && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button 
                  onClick={handleAddToCart}
                  disabled={outOfStock || addingToCart}
                  style={{ 
                    flex: 1, height: 36, border: 'none', background: C.t900, color: '#fff', 
                    borderRadius: '0.65rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                    transition: 'all 0.2s', opacity: outOfStock ? 0.5 : 1, whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={e => { if(!outOfStock) e.currentTarget.style.background = '#000'; }}
                  onMouseLeave={e => e.currentTarget.style.background = C.t900}
                >
                  {addingToCart ? '...' : 'Add to Cart'}
                </button>
                
                <button 
                  onClick={handleBuyNow}
                  disabled={outOfStock || buyingNow}
                  className="btn-lime"
                  style={{ 
                    flex: 1.2, height: 36, padding: '0 0.75rem', borderRadius: '0.65rem', fontSize: '0.75rem',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem',
                    opacity: outOfStock ? 0.5 : 1, whiteSpace: 'nowrap'
                  }}
                >
                  {buyingNow ? '...' : 'Checkout'}
                  <div className="icon-circle" style={{ width: '1.15rem', height: '1.15rem' }}><ChevronRight style={{ width: 11 }} /></div>
                </button>

                <button 
                  onClick={() => toggleWishlist(product)}
                  style={{ 
                    width: 36, height: 36, border: `1px solid ${C.bSoft}`, background: '#fff',
                    borderRadius: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    transition: 'all 0.2s', flexShrink: 0
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = C.bgMuted}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  <Heart style={{ width: 14, height: 14, color: isInWishlist(product.id) ? C.rose : C.t300, fill: isInWishlist(product.id) ? C.rose : 'none' }} />
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.15rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: C.t500, fontSize: '0.7rem', fontWeight: 700 }}>
                 <Truck style={{ width: 12, color: C.t900 }} /> Fast Shipping
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: C.t500, fontSize: '0.7rem', fontWeight: 700 }}>
                 <Shield style={{ width: 12, color: C.t900 }} /> 2 Year Warranty
               </div>
            </div>
          </div>
        </div>
      </div>
      {/* Reviews & Similar Section (Swapped Layout) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem' }}>
        
        {/* Reviews (Now on the Left) */}
        <div style={{ background: '#fff', border: `1px solid ${C.bSoft}`, borderRadius: '2rem', padding: '2.5rem', boxShadow: '0 8px 30px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>Customer Reviews</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.85rem', background: C.bgMuted, borderRadius: '9999px' }}>
              <Star style={{ width: 14, height: 14, fill: '#fbbf24', color: '#fbbf24' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 900 }}>4.8 / 5.0</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {fetchingReviews ? (
              <p style={{ fontSize: '0.8rem', color: C.t300 }}>Loading reviews...</p>
            ) : reviews.length > 0 ? reviews.map(rev => (
              <div key={rev.id} style={{ paddingBottom: '1.5rem', borderBottom: `1px solid ${C.bSoft}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: C.t300, fontSize: '0.65rem' }}>
                      {rev.user?.full_name?.[0] || 'U'}
                    </div>
                    <div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 900, color: C.t900, margin: 0 }}>{rev.user?.full_name}</p>
                      <div style={{ display: 'flex', gap: '0.1rem', marginTop: '0.1rem' }}>
                        {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 8, height: 8, fill: s <= rev.rating ? '#fbbf24' : 'none', color: s <= rev.rating ? '#fbbf24' : C.t300 }} />)}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: C.t300, fontWeight: 600 }}>{new Date(rev.created_at).toLocaleDateString()}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: C.t700, lineHeight: 1.6, margin: 0 }}>
                  {rev.comment}
                </p>
              </div>
            )) : (
              <div style={{ padding: '2rem 0', textAlign: 'center' }}>
                <p style={{ fontSize: '0.85rem', color: C.t300, margin: 0 }}>No reviews yet for this product.</p>
              </div>
            )}
          </div>
        </div>

        {/* Similar Items (Now on the Right) */}
        <div style={{ background: '#fff', border: `1px solid ${C.bSoft}`, borderRadius: '2rem', padding: '2.5rem', boxShadow: '0 8px 30px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: '2rem', letterSpacing: '-0.02em' }}>Similar items</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {similarProducts.length > 0 ? similarProducts.map(p => (
              <ProductCard 
                key={p.id} 
                product={p} 
                onCart={addItem} 
                onWishlist={toggleWishlist} 
                inWishlist={isInWishlist(p.id)} 
              />
            )) : (
              <p style={{ fontSize: '0.75rem', color: C.t300 }}>Exploring similar pieces...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
