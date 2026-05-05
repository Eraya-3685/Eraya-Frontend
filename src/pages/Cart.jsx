import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ArrowRight, ShieldCheck, Truck, Flame, Phone, RefreshCcw, X, Bookmark } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import api, { getImageUrl } from '../api/axios';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useSettingsStore from '../store/useSettingsStore';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';

const C = {
  t900:'#0d1117', t700:'#1f2937', t500:'#6b7280', t300:'#c4c9d4',
  bSoft:'rgba(0,0,0,0.07)', bLine:'#edf0f4',
  bgPage:'#f7f8fa', bgCard:'#fff', bgMuted:'#f3f5f8',
  lime:'#cbff00', blue:'#3b82f6', rose:'#f43f5e', green:'#22c55e', orange:'#f97316',
};

const Cart = () => {
  useDocumentTitle('Shopping Cart | Eraya');
  const { items, removeItem, updateQuantity, clearCart, syncItems } = useCartStore();
  const { user }                    = useAuthStore();
  const { settings, fetchSettings } = useSettingsStore();
  const navigate                    = useNavigate();
  const [itemToRemove, setItemToRemove]     = useState(null);
  const [isRemoving, setIsRemoving]         = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing]         = useState(false);
  const [isNavigating, setIsNavigating]     = useState(false);
  const [isRefreshing, setIsRefreshing]     = useState(false);

  useEffect(() => {
    fetchSettings();
    if (user?.role === 'admin') navigate('/');
    refreshStock();
  }, [user]);

  const refreshStock = async () => {
    if (!items.length) return;
    setIsRefreshing(true);
    try {
      const updated = await Promise.all(items.map(async item => {
        try { const r = await api.get(`/products/${item.slug}`); return { ...item, stock_count: r.data.stock_count }; }
        catch { return item; }
      }));
      syncItems(updated);
    } finally { setIsRefreshing(false); }
  };

  const subtotal   = items.reduce((s, i) => s + i.base_price * i.quantity, 0);
  const threshold  = settings.free_shipping_threshold || 1000;
  const shipping   = subtotal >= threshold ? 0 : settings.standard_delivery_fee || 60;
  const total      = subtotal + shipping;
  const progress   = Math.min((subtotal / threshold) * 100, 100);
  const freeLeft   = threshold - subtotal;
  const cashbackAt = threshold * 1.5; // fictional cashback milestone at 150% of free shipping
  const cashbackPct = Math.min((subtotal / cashbackAt) * 100, 100);

  const confirmRemove = async () => {
    if (!itemToRemove) return;
    setIsRemoving(true);
    await new Promise(r => setTimeout(r, 500));
    removeItem(itemToRemove.id);
    setIsRemoving(false);
    setItemToRemove(null);
  };

  const handleQty = (item, newQty) => {
    if (newQty > (item.stock_count ?? 99)) { toast.error(`Only ${item.stock_count} in stock`); return; }
    if (newQty <= 0) { setItemToRemove(item); return; }
    updateQuantity(item.id, newQty);
  };

  /* Delivery day estimate */
  const deliveryDay = () => {
    const d = new Date(); d.setDate(d.getDate() + 3);
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  };

  /* ── Empty State ── */
  if (items.length === 0) return (
    <div style={{ minHeight:'65vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1.5rem' }}>
      <div style={{ width:80, height:80, background:C.bgMuted, borderRadius:'1.75rem', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Bookmark style={{ width:36, height:36, color:C.t300 }} />
      </div>
      <div style={{ textAlign:'center' }}>
        <h1 style={{ fontSize:'1.75rem', fontWeight:800, color:C.t900, margin:'0 0 0.5rem', letterSpacing:'-0.04em' }}>Your cart is empty</h1>
        <p style={{ fontSize:'0.85rem', color:C.t500, margin:0 }}>Browse our collection and add items you love.</p>
      </div>
      <Link to="/products" className="btn-lime">
        Start Shopping
        <div className="icon-circle"><ArrowRight style={{ width:14, height:14, transform:'rotate(-45deg)' }} /></div>
      </Link>
    </div>
  );

  return (
    <div style={{ paddingBottom:'3rem' }}>

      {/* ── Top info bar ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.75rem', flexWrap:'wrap', gap:'0.75rem' }}>
        {/* Breadcrumb */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.35rem', fontSize:'0.72rem', fontWeight:600, color:C.t300 }}>
          <Link to="/" style={{ color:C.t500, textDecoration:'none', transition:'color .15s' }} onMouseEnter={e=>e.currentTarget.style.color=C.t900} onMouseLeave={e=>e.currentTarget.style.color=C.t500}>Home</Link>
          <span>/</span>
          <Link to="/products" style={{ color:C.t500, textDecoration:'none', transition:'color .15s' }} onMouseEnter={e=>e.currentTarget.style.color=C.t900} onMouseLeave={e=>e.currentTarget.style.color=C.t500}>Products</Link>
          <span>/</span>
          <span style={{ color:C.t900, fontWeight:700 }}>Cart</span>
        </div>
        {/* Urgency */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.75rem', fontWeight:700, color:C.orange }}>
          <Flame style={{ width:14, height:14 }} />
          Hurry up! Your items are reserved for 10 minutes
        </div>
        {/* Help */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.72rem', fontWeight:600, color:C.t500 }}>
          <Phone style={{ width:13, height:13 }} />
          Help line: 09678-ERAYA
        </div>
      </div>

      {/* ── Page title ── */}
      <h1 style={{ fontSize:'2rem', fontWeight:800, color:C.t900, margin:'0 0 1.75rem', letterSpacing:'-0.04em' }}>Shopping Cart</h1>

      {/* ── Progress bar ── */}
      <div style={{ background:C.bgCard, border:`1px solid ${C.bLine}`, borderRadius:'1.5rem', padding:'1.25rem 2rem', marginBottom:'1.5rem' }}>
        {subtotal < threshold ? (
          <p style={{ textAlign:'center', fontSize:'0.78rem', fontWeight:600, color:C.t500, margin:'0 0 1rem' }}>
            Great! You have been{' '}
            <strong style={{ color:C.green }}>FREE SHIPPING</strong>,{' '}
            Only <strong style={{ color:C.t900 }}>৳{freeLeft.toLocaleString()}</strong> away from getting{' '}
            <strong style={{ color:C.orange }}>3% EXTRA CASHBACK</strong>
          </p>
        ) : (
          <p style={{ textAlign:'center', fontSize:'0.78rem', fontWeight:700, color:C.green, margin:'0 0 1rem' }}>
            🎉 You've unlocked FREE SHIPPING!
          </p>
        )}
        {/* Bar */}
        <div style={{ position:'relative', height:8, background:C.bgMuted, borderRadius:999, overflow:'hidden' }}>
          <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${progress}%`, background:'linear-gradient(to right, #3b82f6, #6366f1)', borderRadius:999, transition:'width .6s ease' }} />
          {/* Thumb */}
          <div style={{ position:'absolute', left:`${progress}%`, top:'50%', transform:'translate(-50%,-50%)', width:16, height:16, background:C.blue, borderRadius:'50%', border:'3px solid #fff', boxShadow:'0 2px 6px rgba(59,130,246,0.4)', transition:'left .6s ease' }} />
        </div>
        {/* Labels */}
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.5rem' }}>
          <span style={{ fontSize:'0.65rem', fontWeight:700, color:C.t300 }}>৳0</span>
          <span style={{ fontSize:'0.65rem', fontWeight:800, color:C.blue, letterSpacing:'0.02em' }}>Free Shipping ৳{threshold.toLocaleString()}</span>
          <span style={{ fontSize:'0.65rem', fontWeight:800, color:C.orange, letterSpacing:'0.02em' }}>3% Cashback ৳{cashbackAt.toLocaleString()}</span>
        </div>
      </div>

      {/* ── Product count + delivery ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', flexWrap:'wrap', gap:'0.5rem' }}>
        <p style={{ fontSize:'0.78rem', fontWeight:600, color:C.t500, margin:0 }}>
          You have <strong style={{ color:C.t900 }}>{items.length} product{items.length!==1?'s':''}</strong> in your cart
        </p>
        <div style={{ display:'flex', alignItems:'center', gap:'1.5rem' }}>
          <button onClick={refreshStock} disabled={isRefreshing} style={{ display:'flex', alignItems:'center', gap:'0.35rem', fontSize:'0.65rem', fontWeight:700, color:C.t300, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', opacity:isRefreshing?0.5:1 }}>
            <RefreshCcw style={{ width:11, height:11, animation:isRefreshing?'spin 1s linear infinite':'none' }} /> Refresh
          </button>
          <p style={{ fontSize:'0.78rem', fontWeight:600, color:C.t500, margin:0 }}>
            Expected Delivery: <strong style={{ color:C.t900 }}>{deliveryDay()}</strong>
          </p>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ background:C.bgCard, border:`1px solid ${C.bLine}`, borderRadius:'1.5rem', overflow:'hidden', marginBottom:'1.5rem' }}>
        {/* Table head */}
        <div style={{ display:'grid', gridTemplateColumns:'3fr 0.85fr 1fr 1.1fr 0.9fr', gap:0, padding:'0.85rem 1.75rem', borderBottom:`1.5px solid ${C.bLine}`, background:C.bgMuted }}>
          {[
            { label:'Product',  align:'left'   },
            { label:'Status',   align:'left'   },
            { label:'Price',    align:'center' },
            { label:'Quantity', align:'center' },
            { label:'Total',    align:'right'  },
          ].map(({ label, align }) => (
            <span key={label} style={{ fontSize:'0.75rem', fontWeight:800, color:C.t700, textAlign:align, display:'block' }}>
              {label}
            </span>
          ))}
        </div>

        {/* Rows */}
        <AnimatePresence>
          {items.map((item, idx) => {
            const img = item.image_url || item.images?.[0]?.image_url;
            const outOfStock = item.stock_count <= 0;
            return (
              <motion.div key={item.id}
                initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, height:0 }}
                transition={{ duration:0.25, delay: idx*0.04 }}
                style={{ display:'grid', gridTemplateColumns:'3fr 0.85fr 1fr 1.1fr 0.9fr', gap:0, padding:'1.25rem 1.75rem', borderBottom: idx < items.length-1 ? `1px solid ${C.bLine}` : 'none', alignItems:'center' }}
              >
                {/* Product cell */}
                <div style={{ display:'flex', alignItems:'center', gap:'1rem', minWidth:0 }}>
                  {/* Bookmark / remove */}
                  <button onClick={() => setItemToRemove(item)} style={{ flexShrink:0, background:'none', border:'none', cursor:'pointer', padding:'0.25rem', color:C.t300, transition:'color .15s', display:'flex' }}
                    onMouseEnter={e=>e.currentTarget.style.color=C.rose}
                    onMouseLeave={e=>e.currentTarget.style.color=C.t300}>
                    <X style={{ width:14, height:14 }} />
                  </button>
                  {/* Image */}
                  <div style={{ width:72, height:72, borderRadius:'1rem', overflow:'hidden', background:C.bgMuted, border:`1px solid ${C.bLine}`, flexShrink:0, position:'relative' }}>
                    {img && <img src={getImageUrl(img)} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
                    {outOfStock && <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ fontSize:'0.5rem', fontWeight:900, color:'#fff', textTransform:'uppercase' }}>Out</span></div>}
                  </div>
                  {/* Name + meta */}
                  <div style={{ minWidth:0 }}>
                    <Link to={`/products/${item.slug}`} style={{ textDecoration:'none' }}>
                      <p style={{ fontSize:'0.85rem', fontWeight:800, color:C.t900, margin:'0 0 0.25rem', letterSpacing:'-0.01em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</p>
                    </Link>
                    {item.color && <p style={{ fontSize:'0.62rem', fontWeight:600, color:C.t500, margin:'0 0 0.1rem' }}>Color: <strong>{item.color}</strong></p>}
                    {item.size  && <p style={{ fontSize:'0.62rem', fontWeight:600, color:C.t500, margin:0 }}>Size: <strong>{item.size}</strong></p>}
                  </div>
                </div>

                {/* Stock status */}
                <div>
                  {outOfStock
                    ? <span style={{ display:'inline-flex', alignItems:'center', gap:'0.3rem', fontSize:'0.62rem', fontWeight:700, color:C.rose }}><span style={{ width:6, height:6, borderRadius:'50%', background:C.rose, display:'inline-block' }} />Out of Stock</span>
                    : <span style={{ display:'inline-flex', alignItems:'center', gap:'0.3rem', fontSize:'0.62rem', fontWeight:700, color:C.green }}><span style={{ width:6, height:6, borderRadius:'50%', background:C.green, display:'inline-block' }} />In Stock {item.stock_count ? `(${item.stock_count})` : ''}</span>
                  }
                </div>

                {/* Price */}
                <div style={{ textAlign:'center', paddingLeft:'0.5rem' }}>
                  <span style={{ fontSize:'0.88rem', fontWeight:700, color:C.t900, letterSpacing:'-0.02em' }}>৳{item.base_price?.toLocaleString()}</span>
                </div>

                {/* Qty stepper */}
                <div style={{ display:'flex', justifyContent:'center' }}>
                  <div style={{ display:'inline-flex', alignItems:'center', border:`1.5px solid ${C.bLine}`, borderRadius:9999, overflow:'hidden', background:'#fff', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
                    <button onClick={() => handleQty(item, item.quantity-1)} disabled={outOfStock}
                      style={{ width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', background:'none', border:'none', cursor:outOfStock?'not-allowed':'pointer', color:C.t500, transition:'background .12s' }}
                      onMouseEnter={e=>{ if(!outOfStock) e.currentTarget.style.background=C.bgMuted; }}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <Minus style={{ width:11, height:11 }} />
                    </button>
                    <span style={{ minWidth:24, textAlign:'center', fontSize:'0.82rem', fontWeight:800, color:C.t900, padding:'0 0.25rem' }}>{item.quantity}</span>
                    <button onClick={() => handleQty(item, item.quantity+1)} disabled={outOfStock}
                      style={{ width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', background:'none', border:'none', cursor:outOfStock?'not-allowed':'pointer', color:C.t500, transition:'background .12s' }}
                      onMouseEnter={e=>{ if(!outOfStock) e.currentTarget.style.background=C.bgMuted; }}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <Plus style={{ width:11, height:11 }} />
                    </button>
                  </div>
                </div>

                {/* Line total */}
                <div style={{ textAlign:'right', paddingRight:'0.25rem' }}>
                  <span style={{ fontSize:'0.88rem', fontWeight:800, color:C.t900, letterSpacing:'-0.02em' }}>৳{(item.base_price * item.quantity).toLocaleString()}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Bottom actions ── */}
      {/* Use same grid as table so Sub Total lines up with Total column */}
      <div style={{ background:C.bgCard, border:`1px solid ${C.bLine}`, borderRadius:'1.5rem', padding:'1.25rem 1.75rem', display:'grid', gridTemplateColumns:'3fr 0.85fr 1fr 1.1fr 0.9fr', gap:0, alignItems:'center' }}>

        {/* Left — info badges */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', gridColumn:'1 / 4' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', padding:'0.45rem 0.85rem', background:C.bgMuted, border:`1px solid ${C.bLine}`, borderRadius:9999 }}>
            <Truck style={{ width:13, height:13, color:C.blue }} />
            <span style={{ fontSize:'0.68rem', fontWeight:600, color:C.t500 }}>
              {shipping===0 ? <strong style={{ color:C.green }}>Free Shipping!</strong> : `৳${shipping} delivery`}
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', padding:'0.45rem 0.85rem', background:C.bgMuted, border:`1px solid ${C.bLine}`, borderRadius:9999 }}>
            <ShieldCheck style={{ width:13, height:13, color:C.green }} />
            <span style={{ fontSize:'0.68rem', fontWeight:600, color:C.t500 }}>SSL Secured</span>
          </div>
        </div>

        {/* Quantity column — blank spacer */}
        <div />

        {/* Sub Total — aligned under Total column */}
        <div style={{ textAlign:'right', paddingRight:'0.25rem' }}>
          <p style={{ fontSize:'0.75rem', fontWeight:800, color:C.t500, margin:'0 0 0.2rem' }}>Sub Total</p>
          <p style={{ fontSize:'1.1rem', fontWeight:800, color:C.t900, margin:'0 0 0.1rem', letterSpacing:'-0.03em', whiteSpace:'nowrap' }}>
            ৳{subtotal.toLocaleString()}
          </p>
          <p style={{ fontSize:'0.58rem', color:C.t300, fontWeight:500, margin:0, whiteSpace:'nowrap' }}>Excl. Tax &amp; Delivery</p>
        </div>
      </div>

      {/* Buttons row */}
      <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.75rem', marginTop:'1rem' }}>
        <Link to="/products"
          style={{ padding:'0.75rem 1.75rem', background:'transparent', border:`1.5px solid ${C.bLine}`, borderRadius:'0.875rem', fontSize:'0.8rem', fontWeight:800, color:C.t700, textDecoration:'none', transition:'border-color .2s, color .2s', display:'flex', alignItems:'center' }}
          onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.t900; e.currentTarget.style.color=C.t900; }}
          onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.bLine; e.currentTarget.style.color=C.t700; }}>
          Continue Shopping
        </Link>
        <button
          onClick={async () => {
            if (items.some(i => i.stock_count <= 0)) { toast.error('Remove out-of-stock items first'); return; }
            if (!user?.id) { toast.error('Please login first'); navigate('/login', { state:{ from:'/checkout' } }); return; }
            setIsNavigating(true);
            await new Promise(r => setTimeout(r, 400));
            navigate('/checkout');
          }}
          disabled={isNavigating || items.some(i => i.stock_count <= 0)}
          style={{ padding:'0.75rem 1.75rem', background:C.t900, color:'#fff', border:'none', borderRadius:'0.875rem', fontSize:'0.8rem', fontWeight:800, cursor:'pointer', fontFamily:'inherit', transition:'background .2s, opacity .2s', opacity: isNavigating || items.some(i=>i.stock_count<=0)?0.55:1, display:'flex', alignItems:'center', gap:'0.5rem' }}
          onMouseEnter={e=>{ if(!isNavigating) e.currentTarget.style.background='#1e293b'; }}
          onMouseLeave={e=>e.currentTarget.style.background=C.t900}>
          {isNavigating ? <><RefreshCcw style={{ width:14, height:14, animation:'spin 0.8s linear infinite' }} />Processing…</> : <>Go to Checkout <ArrowRight style={{ width:14, height:14 }} /></>}
        </button>
      </div>


      <ConfirmModal isOpen={!!itemToRemove} onClose={() => setItemToRemove(null)}
        onConfirm={confirmRemove} loading={isRemoving}
        title="Remove Item?" message={`Remove "${itemToRemove?.name}" from cart?`} />
      <ConfirmModal isOpen={showClearModal} onClose={() => setShowClearModal(false)}
        onConfirm={async () => { setIsClearing(true); await new Promise(r=>setTimeout(r,500)); clearCart(); setIsClearing(false); setShowClearModal(false); }}
        loading={isClearing} title="Clear Cart?" message="Remove all items from your cart?" />

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default Cart;
