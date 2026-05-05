import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Lock, Truck, Wallet, 
  MapPin, ChevronRight, CheckCircle, ArrowLeft,
  ShoppingBag, User, Phone, Info, Plus, Minus, CreditCard, Edit2
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import api, { getImageUrl } from '../api/axios';
import toast from 'react-hot-toast';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useSettingsStore from '../store/useSettingsStore';

const C = {
  t900:'#0d1117', t700:'#1f2937', t500:'#6b7280', t300:'#adb5bd',
  bSoft:'rgba(0,0,0,0.07)', bLine:'#edf0f4',
  bgPage:'#f7f8fa', bgCard:'#fff', bgMuted:'#f3f5f8',
  lime:'#cbff00', blue:'#3b82f6', rose:'#f43f5e', green:'#22c55e', orange:'#f97316',
};

const Checkout = () => {
  useDocumentTitle('Checkout | Eraya');
  const { items, clearCart, updateQuantity, removeItem } = useCartStore();
  const { user } = useAuthStore();
  const { settings, fetchSettings } = useSettingsStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isBkashSuccess = searchParams.get('bkash_success') === 'true';
  const bkashTrxID = searchParams.get('trxID');
  const bkashAmount = searchParams.get('amount');
  const bkashSenderNumber = searchParams.get('senderNumber');
  const isBkashError = searchParams.get('bkash_error') === 'true';

  useEffect(() => {
    fetchSettings();
    if (!user) {
      toast.error('Please login to proceed');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    if (user && (!user.phone || !user.address)) {
      toast.error('Please complete your profile first');
      navigate('/complete-profile');
    }
  }, [user]);

  const [loading, setLoading] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Info, 2: Payment (internal tracking)
  
  const [form, setForm] = useState({
    first_name: user?.full_name?.split(' ')[0] || '',
    last_name: user?.full_name?.split(' ').slice(1).join(' ') || '',
    shipping_address: user?.address || '',
    payment_method: 'COD',
  });

  useEffect(() => {
    if (isBkashSuccess) {
      setForm(prev => ({ ...prev, payment_method: 'bKash' }));
    }
  }, [isBkashSuccess]);

  const subtotal = items.reduce((sum, item) => sum + item.base_price * item.quantity, 0);
  const shipping = subtotal >= (settings.free_shipping_threshold || 1000) ? 0 : (settings.standard_delivery_fee || 60);
  const tax = subtotal * ((settings.tax_percentage || 0) / 100);
  const total = subtotal + shipping + tax;

  const handlePlaceOrder = async () => {
    if (form.payment_method === 'bKash' && !isBkashSuccess) {
      setLoading(true);
      try {
        const res = await api.post('/orders/bkash/init', { amount: total });
        if (res.data.bkashURL) window.location.href = res.data.bkashURL;
      } catch (err) {
        toast.error('bKash initialization failed');
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: items.map(i => ({ product_id: i.id, quantity: i.quantity })),
        shipping_address: form.shipping_address,
        payment_method: form.payment_method,
      };

      if (isBkashSuccess) {
        orderData.trx_id = bkashTrxID;
        orderData.paid_amount = parseFloat(bkashAmount);
        orderData.sender_number = bkashSenderNumber;
      }

      await api.post('/orders/checkout', orderData);
      clearCart();
      toast.success('Order placed successfully!');
      setTimeout(() => navigate('/profile'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) return (
    <div style={{ height:'70vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1.5rem' }}>
       <ShoppingBag style={{ width:64, height:64, color:C.t300 }} />
       <h2 style={{ fontSize:'1.5rem', fontWeight:800, color:C.t900 }}>Your cart is empty</h2>
       <Link to="/products" className="btn-lime">Start Shopping</Link>
    </div>
  );

  return (
    <div style={{ paddingBottom:'5rem' }}>
      
      {/* ── Header Steps ── */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.75rem', fontWeight:600, color:C.t300, marginBottom:'2rem' }}>
        <Link to="/cart" style={{ color:C.t500, textDecoration:'none', display:'flex', alignItems:'center', gap:'0.4rem' }}>
          <ArrowLeft style={{ width:14, height:14 }} /> Home / Products
        </Link>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:'3rem', alignItems:'start' }}>
        
        {/* ── LEFT: Form ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'2.5rem' }}>
          
          {/* Step Indicators */}
          <div style={{ display:'flex', borderBottom:`1px solid ${C.bLine}`, paddingBottom:'1.5rem', gap:'3rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
               <div style={{ width:28, height:28, borderRadius:'50%', background:C.t900, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                 <CheckCircle style={{ width:16, height:16 }} />
               </div>
               <span style={{ fontSize:'0.9rem', fontWeight:800, color:C.t900 }}>Customer Information</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', opacity:0.4 }}>
               <div style={{ width:28, height:28, borderRadius:'50%', background:C.bgMuted, color:C.t500, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:800 }}>
                 2
               </div>
               <span style={{ fontSize:'0.9rem', fontWeight:800, color:C.t900 }}>Payment Details</span>
            </div>
          </div>

          <h2 style={{ fontSize:'1.75rem', fontWeight:800, color:C.t900, margin:0 }}>Check Out Your Items</h2>
          <p style={{ fontSize:'0.85rem', color:C.t500, margin:'-1.5rem 0 0' }}>For a better experience, check your item and choose your shipping before ordering.</p>

          {/* Name Row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
             <div style={{ position:'relative' }}>
                <label style={{ position:'absolute', top:'0.8rem', left:'1.25rem', fontSize:'0.65rem', fontWeight:700, color:C.t300 }}>First Name</label>
                <input 
                  type="text" 
                  value={form.first_name}
                  onChange={e => setForm({...form, first_name: e.target.value})}
                  style={{ width:'100%', padding:'1.75rem 1.25rem 0.75rem', borderRadius:'1rem', border:`1.5px solid ${C.t900}`, background:'#fff', fontSize:'0.9rem', fontWeight:700, color:C.t900, outline:'none' }} 
                />
                <User style={{ position:'absolute', top:'1.25rem', right:'1.25rem', width:16, height:16, color:C.t300 }} />
             </div>
             <div style={{ position:'relative' }}>
                <label style={{ position:'absolute', top:'0.8rem', left:'1.25rem', fontSize:'0.65rem', fontWeight:700, color:C.t300 }}>Last Name</label>
                <input 
                  type="text" 
                  value={form.last_name}
                  onChange={e => setForm({...form, last_name: e.target.value})}
                  style={{ width:'100%', padding:'1.75rem 1.25rem 0.75rem', borderRadius:'1rem', border:`1.5px solid ${C.bLine}`, background:'#fff', fontSize:'0.9rem', fontWeight:700, color:C.t900, outline:'none' }} 
                />
                <User style={{ position:'absolute', top:'1.25rem', right:'1.25rem', width:16, height:16, color:C.t300 }} />
             </div>
          </div>

          {/* Address Box */}
          <div style={{ position:'relative', padding:'1.5rem', background:'#fff', border:`1px solid ${C.bLine}`, borderRadius:'1.5rem' }}>
             <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.75rem' }}>
                <MapPin style={{ width:16, height:16, color:C.t300 }} />
                <span style={{ fontSize:'0.75rem', fontWeight:700, color:C.t300 }}>Delivery Address</span>
             </div>
             <p style={{ fontSize:'0.9rem', fontWeight:600, color:C.t900, margin:0, lineHeight:1.5 }}>{form.shipping_address}</p>
             <button onClick={() => navigate('/complete-profile')} style={{ position:'absolute', top:'1.5rem', right:'1.5rem', background:'none', border:'none', cursor:'pointer', color:C.t300 }}>
                <Edit2 style={{ width:18, height:18 }} />
             </button>
          </div>

          {/* Payment Method */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
             <h3 style={{ fontSize:'1.25rem', fontWeight:800, color:C.t900, margin:0 }}>Payment Method</h3>
             
             {isBkashSuccess ? (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 style={{ padding: '2rem', background: '#f0fdf4', borderRadius: '2rem', border: '2px solid #dcfce7', position: 'relative', overflow: 'hidden' }}
               >
                 <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                       <div style={{ width: 32, height: 32, background: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ShieldCheck style={{ width: 18, height: 18, color: '#fff' }} />
                       </div>
                       <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>bKash Payment Verified</span>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                       <div>
                          <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 800, color: '#166534/60', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transaction ID</p>
                          <p style={{ margin: '0.2rem 0 0', fontSize: '0.95rem', fontWeight: 900, color: '#0d1117', letterSpacing: '0.05em' }}>{bkashTrxID}</p>
                       </div>
                       <div>
                          <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 800, color: '#166534/60', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sender Number</p>
                          <p style={{ margin: '0.2rem 0 0', fontSize: '0.95rem', fontWeight: 900, color: '#0d1117' }}>{bkashSenderNumber}</p>
                       </div>
                    </div>

                    <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px dashed #dcfce7' }}>
                       <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>Amount Paid: <span style={{ fontWeight: 900 }}>৳{bkashAmount}</span></p>
                    </div>
                 </div>
                 {/* Decorative background circle */}
                 <div style={{ position: 'absolute', bottom: '-2rem', right: '-2rem', width: 120, height: 120, background: '#dcfce7', borderRadius: '50%', opacity: 0.5 }} />
               </motion.div>
             ) : (
               <>
                 <p style={{ fontSize:'0.8rem', color:C.t500, margin:'-1rem 0 0' }}>Select the bank for payment of your item</p>
                 <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                    {[
                      { id:'COD', label:'Cash on Delivery', icon: Wallet, color:C.t900 },
                      { id:'bKash', label:'Bkash Payment', icon: 'https://www.logo.wine/a/logo/BKash/BKash-bKash-Logo.wine.svg', color:'#D12053' },
                    ].map((m) => (
                      <button 
                        key={m.id}
                        onClick={() => setForm({...form, payment_method: m.id})}
                        style={{
                          display:'flex', alignItems:'center', justifyContent:'space-between',
                          padding:'1.25rem 1.5rem', borderRadius:'1.25rem',
                          background:'#fff', border:`1.5px solid ${form.payment_method === m.id ? C.t900 : C.bLine}`,
                          cursor:'pointer', transition:'all .2s'
                        }}
                      >
                        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                           {typeof m.icon === 'string' ? (
                             <img src={m.icon} style={{ width:24, height:24, objectFit:'contain' }} alt="" />
                           ) : <m.icon style={{ width:20, height:20, color:C.t500 }} />}
                           <span style={{ fontSize:'0.85rem', fontWeight:700, color:C.t900 }}>{m.label}</span>
                        </div>
                        <div style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${form.payment_method === m.id ? C.t900 : C.t300}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                           {form.payment_method === m.id && <div style={{ width:10, height:10, borderRadius:'50%', background:C.t900 }} />}
                        </div>
                      </button>
                    ))}
                 </div>
               </>
             )}
          </div>
        </div>

        {/* ── RIGHT: Summary ── */}
        <div style={{ background:'#fff', border:`1px solid ${C.bLine}`, borderRadius:'2.5rem', padding:'2.5rem', boxShadow:'0 12px 48px -12px rgba(0,0,0,0.06)' }}>
           <h3 style={{ fontSize:'1.25rem', fontWeight:800, color:C.t900, margin:'0 0 0.5rem' }}>Current Order</h3>
           <p style={{ fontSize:'0.75rem', color:C.t500, margin:'0 0 2rem' }}>The sum of all total payments for goods there</p>

           {/* Items List */}
           <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem', marginBottom:'2rem' }}>
              {items.map((item) => (
                <div key={item.id} style={{ display:'flex', gap:'1rem', paddingBottom:'1.25rem', borderBottom:`1px solid ${C.bgMuted}`, alignItems:'center' }}>
                   <div style={{ width:64, height:64, background:C.bgMuted, borderRadius:'1rem', overflow:'hidden', border:`1px solid ${C.bLine}`, flexShrink:0 }}>
                      <img src={getImageUrl(item.image_url || item.images?.[0]?.image_url)} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" />
                   </div>
                   <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:'0.8rem', fontWeight:800, color:C.t900, margin:'0 0 0.25rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</p>
                      <p style={{ fontSize:'0.7rem', fontWeight:600, color:C.t500, margin:0 }}>Quantity: {item.quantity}</p>
                      {/* Qty controls like in image */}
                      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginTop:'0.5rem' }}>
                         <div style={{ display:'flex', alignItems:'center', background:C.bgMuted, borderRadius:'0.5rem', padding:'0.15rem' }}>
                            <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} style={{ background:'none', border:'none', padding:'0.25rem', cursor:'pointer', display:'flex' }}><Minus style={{ width:12, height:12 }} /></button>
                            <span style={{ fontSize:'0.75rem', fontWeight:800, width:20, textAlign:'center' }}>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ background:'none', border:'none', padding:'0.25rem', cursor:'pointer', display:'flex' }}><Plus style={{ width:12, height:12 }} /></button>
                         </div>
                      </div>
                   </div>
                   <div style={{ textAlign:'right', flexShrink:0 }}>
                      <p style={{ fontSize:'0.85rem', fontWeight:800, color:C.t900, margin:0 }}>৳{(item.base_price * item.quantity).toLocaleString()}</p>
                   </div>
                </div>
              ))}
           </div>

           {/* Pricing Details */}
           <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                 <h4 style={{ fontSize:'1.1rem', fontWeight:800, color:C.t900, margin:0 }}>Subtotal</h4>
                 <span style={{ fontSize:'1.1rem', fontWeight:800, color:C.t900 }}>৳{subtotal.toLocaleString()}</span>
              </div>
              
              <div style={{ height:1, background:C.bgMuted, margin:'0.5rem 0' }} />

              <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                 <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem' }}>
                    <span style={{ fontWeight:600, color:C.t500 }}>Items</span>
                    <span style={{ fontWeight:700, color:C.t900 }}>{items.reduce((s,i)=>s+i.quantity,0)}x</span>
                 </div>
                 <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem' }}>
                    <span style={{ fontWeight:600, color:C.t500 }}>Code Promo</span>
                    <span style={{ fontWeight:700, color:C.rose }}>- ৳0.00</span>
                 </div>
                 <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem' }}>
                    <span style={{ fontWeight:600, color:C.t500 }}>Delivery Service</span>
                    <span style={{ fontWeight:700, color:C.t900 }}>৳{shipping.toLocaleString()}</span>
                 </div>
                 <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem' }}>
                    <span style={{ fontWeight:600, color:C.t500 }}>Vat (0%)</span>
                    <span style={{ fontWeight:700, color:C.t900 }}>৳0.00</span>
                 </div>
                 {isBkashSuccess && (
                   <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem', padding:'0.75rem', background:'#f0fdf4', borderRadius:'0.75rem', marginTop:'0.5rem' }}>
                      <span style={{ fontWeight:700, color:'#166534' }}>Already Paid via bKash</span>
                      <span style={{ fontWeight:800, color:'#166534' }}>- ৳{total.toLocaleString()}</span>
                   </div>
                 )}
              </div>

              {/* Confirm Button */}
              <div style={{ marginTop: '2rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 900, color: C.t900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isBkashSuccess ? 'Total Due' : 'Total Amount'}</span>
                    <span style={{ fontSize: '1.75rem', fontWeight: 900, color: C.t900, letterSpacing: '-0.02em' }}>৳{isBkashSuccess ? '0' : total.toLocaleString()}</span>
                 </div>
                 
                 <button
                   onClick={handlePlaceOrder}
                   disabled={loading}
                   style={{
                     width:'100%', height:64, background:C.t900, color:'#fff',
                     border:'none', borderRadius:'1.25rem',
                     fontSize:'1rem', fontWeight:800, cursor:'pointer',
                     transition:'opacity .2s', opacity: loading ? 0.7 : 1,
                     display:'flex', alignItems:'center', justifyContent:'center', gap:'0.75rem'
                   }}
                 >
                   {loading ? 'Processing...' : 
                    (form.payment_method === 'COD' || isBkashSuccess) ? 'Confirm Order' : `Pay with bKash ৳${total.toLocaleString()}`}
                 </button>
               </div>
           </div>
        </div>

      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default Checkout;
