import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Trash2, ShoppingBag, ArrowRight, Star, X, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import useWishlistStore from '../store/useWishlistStore';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import api, { getImageUrl } from '../api/axios';
import toast from 'react-hot-toast';
import useDocumentTitle from '../hooks/useDocumentTitle';
import ConfirmModal from '../components/ConfirmModal';
import ProductCard from '../components/ProductCard';
import useMediaQuery from '../hooks/useMediaQuery';

const C = {
  t900:'#0d1117', t700:'#1f2937', t500:'#6b7280', t300:'#adb5bd',
  bSoft:'rgba(0,0,0,0.07)', bLine:'#edf0f4',
  bgCard:'#fff', bgMuted:'#f3f5f8',
  lime:'#cbff00', rose:'#f43f5e', green:'#22c55e', blue:'#3b82f6',
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0  },
  exit:    { opacity: 0, scale: 0.95 },
  transition: { delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] },
});

export default function Wishlist() {
  const { isMobile } = useMediaQuery();
  useDocumentTitle('My Wishlist | Eraya');
  const { items, toggleWishlist, clearWishlist, syncWishlist } = useWishlistStore();
  const { user }    = useAuthStore();
  const addItem     = useCartStore(s => s.addItem);

  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing]         = useState(false);
  const [isRefreshing, setIsRefreshing]     = useState(false);

  useEffect(() => { refreshStock(); }, []);

  const refreshStock = async () => {
    if (!items.length) return;
    setIsRefreshing(true);
    try {
      const updated = await Promise.all(items.map(async item => {
        try { const r = await api.get(`/products/${item.slug}`); return { ...item, stock_count: r.data.stock_count }; }
        catch { return item; }
      }));
      if (syncWishlist) syncWishlist(updated);
    } finally { setIsRefreshing(false); }
  };

  const handleAddToCart = (product) => {
    const role = user?.role?.toLowerCase();
    if (role === 'admin' || role === 'moderator') { toast.error('Admin accounts cannot add to cart'); return; }
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  const primaryImg = (images) =>
    images?.find(i => i.is_primary)?.image_url ?? images?.[0]?.image_url ?? null;

  /* ── Empty State ── */
  if (items.length === 0) return (
    <div style={{ minHeight:'65vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1.5rem' }}>
      <div style={{ width:80, height:80, background:'#fff1f2', borderRadius:'1.75rem', display:'flex', alignItems:'center', justifyContent:'center', border:'1.5px solid #fecdd3' }}>
        <Heart style={{ width:36, height:36, color:C.rose }} />
      </div>
      <div style={{ textAlign:'center' }}>
        <h1 style={{ fontSize:'1.75rem', fontWeight:800, color:C.t900, margin:'0 0 0.5rem', letterSpacing:'-0.04em' }}>Wishlist is Empty</h1>
        <p style={{ fontSize:'0.85rem', color:C.t500, margin:0, lineHeight:1.6 }}>
          Browse our collection and save items you love.
        </p>
      </div>
      <Link to="/products" className="btn-lime">
        Explore Collection
        <div className="icon-circle"><ArrowRight style={{ width:14, height:14, transform:'rotate(-45deg)' }} /></div>
      </Link>
    </div>
  );

  return (
    <div style={{ paddingBottom:'3rem' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <p style={{ fontSize:'0.75rem', fontWeight:800, color:C.t300, margin:'0 0 0.3rem' }}>Your saved</p>
          <div style={{ display:'flex', alignItems:'center', gap:'0.85rem' }}>
            <h1 style={{ fontSize:'2rem', fontWeight:800, color:C.t900, margin:0, letterSpacing:'-0.04em' }}>Wishlist</h1>
            <span style={{ background:C.t900, color:'#fff', fontSize:'0.75rem', fontWeight:800, padding:'0.25rem 0.75rem', borderRadius:9999 }}>
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.65rem' }}>
          <button onClick={refreshStock} disabled={isRefreshing}
            style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.72rem', fontWeight:800, color:C.t700, background:'#fff', border:`1px solid ${C.bSoft}`, cursor:'pointer', fontFamily:'inherit', padding:'0.5rem 0.85rem', borderRadius:'0.875rem', transition:'all .15s', opacity:isRefreshing?0.5:1, boxShadow:'0 2px 6px rgba(0,0,0,0.02)' }}
            onMouseEnter={e => { e.currentTarget.style.background = C.bgMuted; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'none'; }}>
            <RefreshCcw style={{ width:12, height:12, animation:isRefreshing?'spin 1s linear infinite':'none' }} />
            Refresh
          </button>
          <button onClick={() => setShowClearModal(true)}
            style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.72rem', fontWeight:800, color:C.rose, background:'#fff', border:`1px solid ${C.bSoft}`, cursor:'pointer', fontFamily:'inherit', padding:'0.5rem 0.85rem', borderRadius:'0.875rem', transition:'all .15s', boxShadow:'0 2px 6px rgba(0,0,0,0.02)' }}
            onMouseEnter={e => { e.currentTarget.style.background='#fff1f2'; e.currentTarget.style.borderColor = '#fecdd3'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.borderColor = C.bSoft; e.currentTarget.style.transform = 'none'; }}>
            <X style={{ width:13, height:13 }} /> Clear All
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(220px, 1fr))', gap: isMobile ? '0.6rem' : '1.25rem' }}>
        <AnimatePresence mode="popLayout">
          {items.map((product, idx) => (
            <motion.div key={product.id} layout {...fadeUp(Math.min(idx, 7) * 0.05)}>
              <ProductCard 
                product={product}
                onCart={handleAddToCart}
                onWishlist={() => toggleWishlist(product, !!user)}
                inWishlist={true}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        loading={isDeletingItem}
        onConfirm={async () => {
          setIsDeletingItem(true);
          await new Promise(r => setTimeout(r, 600));
          toggleWishlist(itemToDelete, !!user);
          setIsDeletingItem(false);
          setItemToDelete(null);
        }}
        title="Remove from Wishlist?"
        message={`Remove "${itemToDelete?.name}" from your wishlist?`}
        confirmText="Remove"
      />

      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        loading={isClearing}
        onConfirm={async () => {
          setIsClearing(true);
          await new Promise(r => setTimeout(r, 600));
          clearWishlist();
          setIsClearing(false);
          setShowClearModal(false);
        }}
        title="Clear Wishlist?"
        message="Remove all saved items? This cannot be undone."
        confirmText="Clear All"
      />

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
