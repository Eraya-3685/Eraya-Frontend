import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, LogOut, MapPin, Phone, Mail, ArrowRight, 
  ShoppingBag, Edit, Camera, X, Save, Shield, 
  CreditCard, Bell, HelpCircle, ChevronRight, User as UserIcon, Command, Heart, Zap, Settings,
  Truck, Calendar, Star, ChevronDown, Clock, CheckCircle2, XCircle, ExternalLink
} from 'lucide-react';

import useAuthStore from '../store/useAuthStore';
import api, { getImageUrl } from '../api/axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import useDocumentTitle from '../hooks/useDocumentTitle';

/* ── design tokens (consistent with Home) ── */
const C = {
  t900: '#0d1117', t700: '#1f2937', t500: '#6b7280', t300: '#adb5bd',
  bSoft: 'rgba(0,0,0,0.07)', bMed: 'rgba(0,0,0,0.12)',
  bgCard: '#ffffff', bgPage: '#edf0f4', bgHero: '#f5f6f9', bgMuted: '#f3f5f8',
  lime: '#cbff00', blue: '#3b82f6', rose: '#f43f5e', amber: '#f59e0b',
  rSm: '0.85rem', rMd: '1.25rem', rLg: '1.5rem', r2xl: '2.5rem'
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
});

const statusMap = {
  Pending: { color: C.amber, icon: Clock, bg: '#fffbeb' },
  Confirmed: { color: '#6366f1', icon: Package, bg: '#eef2ff' },
  Processing: { color: C.blue, icon: Zap, bg: '#eff6ff' },
  Shipped: { color: '#a855f7', icon: Truck, bg: '#f5f3ff' },
  Delivered: { color: '#10b981', icon: CheckCircle2, bg: '#ecfdf5' },
  Cancelled: { color: C.rose, icon: XCircle, bg: '#fff1f2' },
};

const OrderTrackbar = ({ status }) => {
  const steps = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
  const currentIndex = steps.indexOf(status);
  const isCancelled = status === 'Cancelled';

  if (isCancelled) {
    return (
      <div style={{ padding: '1.5rem', background: '#fff1f2', borderRadius: C.rMd, border: `1px solid ${C.rose}20`, display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
        <XCircle style={{ width: 18, height: 18, color: C.rose }} />
        <p style={{ fontSize: '0.7rem', fontWeight: 800, color: C.rose, letterSpacing: '0.05em', margin: 0 }}>Order Cancelled</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem 0', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        {/* Background Line */}
        <div style={{ position: 'absolute', top: '15px', left: '5%', right: '5%', height: 2, background: '#e5e7eb', zIndex: -1 }} />
        {/* Active Line */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(currentIndex / (steps.length - 1)) * 90}%` }}
          style={{ position: 'absolute', top: '15px', left: '5%', height: 2, background: C.t900, zIndex: -1 }}
        />

        {steps.map((step, i) => {
          const isActive = i <= currentIndex;
          const isCurrent = i === currentIndex;
          const config = statusMap[step];
          return (
            <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ 
                width: 32, height: 32, borderRadius: '50%', 
                background: isActive ? C.t900 : '#fff', 
                border: `2px solid ${isActive ? C.t900 : '#e5e7eb'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isActive ? '#fff' : C.t300,
                transition: 'all 0.3s ease',
                boxShadow: isCurrent ? `0 0 0 4px ${C.t900}15` : 'none'
              }}>
                <config.icon style={{ width: 14, height: 14 }} strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: '0.55rem', fontWeight: 800, color: isActive ? C.t900 : C.t300, letterSpacing: '0.04em' }}>
                {step === 'Confirmed' ? 'Accepted' : step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Profile = () => {
  useDocumentTitle('Eraya — My Dashboard');
  const { user, token, logout, uploadAvatar, fetchProfile } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const fileInputRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();

  const isStaff = ['admin', 'moderator'].includes(user?.role?.toLowerCase());

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('payment') === 'success') {
      toast.success('Payment completed successfully!');
      window.history.replaceState({}, document.title, location.pathname);
    }
    if (!token) navigate('/login');
    else if (isStaff) navigate('/admin');
    else fetchOrders();
  }, [token, user, isStaff]);

  const fetchOrders = async () => {
    try {
      const r = await api.get('/orders');
      setOrders(r.data || []);
    } catch { } finally { setLoadingOrders(false); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 2 * 1024 * 1024) return toast.error('Max 2MB allowed');
    setAvatarUploading(true);
    try {
      await uploadAvatar(file);
      toast.success('Profile updated');
    } catch { toast.error('Update failed'); } finally { setAvatarUploading(false); }
  };

  if (!user) return null;

  return (
    <div style={{ background: C.bgPage, minHeight: '100vh', padding: '5.2rem 1.5rem 4rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        
        {/* ── HEADER CARD ── */}
        <motion.div {...fadeUp(0)} style={{
          background: C.bgCard, borderRadius: C.r2xl, padding: '2rem',
          border: `1px solid ${C.bSoft}`, marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '2rem',
          boxShadow: '0 4px 20px -4px rgba(0,0,0,0.05)'
        }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 90, height: 90, borderRadius: '50%', overflow: 'hidden', border: `3px solid #fff`, boxShadow: '0 8px 24px -6px rgba(0,0,0,0.12)' }}>
              {user.avatar_url ? (
                <img src={getImageUrl(user.avatar_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              ) : (
                <div style={{ width: '100%', height: '100%', background: C.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: C.t300 }}>
                  {user.full_name?.charAt(0)}
                </div>
              )}
            </div>
            <button onClick={() => fileInputRef.current.click()} style={{
              position: 'absolute', bottom: 0, right: 0, width: 30, height: 30,
              background: C.t900, color: '#fff', border: 'none', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}>
              <Camera style={{ width: 14, height: 14 }} />
            </button>
            <input ref={fileInputRef} type="file" hidden onChange={handleAvatarChange} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: C.t900, margin: 0, letterSpacing: '-0.02em' }}>{user.full_name}</h1>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '0.2rem 0.6rem', background: '#ecfdf5', color: '#10b981', borderRadius: 99, border: '1px solid #10b98120' }}>
                Verified Buyer
              </span>
            </div>
            <div style={{ display: 'flex', gap: '1.25rem', color: C.t500, fontSize: '0.72rem', fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Mail style={{ width: 13, height: 13 }} /> {user.email}</div>
              {user.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Phone style={{ width: 13, height: 13 }} /> {user.phone}</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Calendar style={{ width: 13, height: 13 }} /> Joined {new Date(user.created_at).getFullYear()}</div>
            </div>
          </div>

          <Link to="/profile/edit" style={{
            padding: '0.6rem 1.25rem', borderRadius: C.rMd, border: `1px solid ${C.bSoft}`,
            textDecoration: 'none', fontSize: '0.75rem', fontWeight: 800, color: C.t700,
            display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all .2s'
          }} onMouseEnter={e => e.currentTarget.style.background = C.bgMuted} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Settings style={{ width: 14, height: 14 }} /> Edit Profile
          </Link>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 18rem', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* ── LEFT: ORDERS ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <motion.div {...fadeUp(0.05)} style={{ background: C.bgCard, borderRadius: C.rLg, padding: '1.75rem', border: `1px solid ${C.bSoft}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: C.t900, margin: 0 }}>Recent Orders</h2>
                <Link to="/products" style={{ fontSize: '0.72rem', fontWeight: 800, color: C.t500, textDecoration: 'none' }}>Shop More →</Link>
              </div>

              {loadingOrders ? (
                <div style={{ padding: '3rem', textAlign: 'center' }}><div className="animate-spin" style={{ width: 24, height: 24, border: '3px solid #eee', borderTopColor: C.t900, borderRadius: '50%', margin: '0 auto' }} /></div>
              ) : orders.length === 0 ? (
                <div style={{ padding: '4rem 0', textAlign: 'center', color: C.t300 }}>
                  <ShoppingBag style={{ width: 40, height: 40, marginBottom: '1rem', opacity: 0.2 }} />
                  <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>No orders found yet</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {orders.map((order) => {
                    const cfg = statusMap[order.order_status] || statusMap.Pending;
                    const isExp = expandedOrderId === order.id;
                    return (
                      <div key={order.id} style={{ border: `1px solid ${C.bSoft}`, borderRadius: C.rMd, overflow: 'hidden' }}>
                        <button onClick={() => setExpandedOrderId(isExp ? null : order.id)} style={{
                          width: '100%', padding: '1rem 1.25rem', background: '#fff', border: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: 38, height: 38, borderRadius: '0.75rem', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color }}>
                              <cfg.icon style={{ width: 18, height: 18 }} />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                              <p style={{ fontSize: '0.8rem', fontWeight: 800, color: C.t900, margin: 0 }}>Order #{order.id}</p>
                              <p style={{ fontSize: '0.62rem', fontWeight: 700, color: C.t300, margin: '0.1rem 0 0' }}>
                                {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {order.payment_method}
                              </p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: '0.9rem', fontWeight: 900, color: C.t900, margin: 0 }}>৳{order.total_price.toLocaleString()}</p>
                              <span style={{ fontSize: '0.55rem', fontWeight: 800, color: cfg.color, letterSpacing: '0.04em' }}>{order.order_status}</span>
                            </div>
                            <ChevronDown style={{ width: 16, height: 16, color: C.t300, transform: isExp ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                          </div>
                        </button>

                        <AnimatePresence>
                          {isExp && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden', background: '#fafafa', borderTop: `1px solid ${C.bSoft}` }}>
                              <div style={{ padding: '1.5rem' }}>
                                <OrderTrackbar status={order.order_status} />
                                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {order.items?.map(item => (
                                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: '#fff', borderRadius: '0.75rem', border: `1px solid ${C.bSoft}` }}>
                                      <div style={{ width: 44, height: 44, borderRadius: '0.5rem', overflow: 'hidden', background: C.bgMuted }}>
                                        <img src={getImageUrl(item.product?.image_url)} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} alt="" />
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: C.t900, margin: 0 }}>{item.product?.name}</p>
                                        <p style={{ fontSize: '0.62rem', fontWeight: 600, color: C.t300, margin: 0 }}>{item.quantity} × ৳{item.price_at_purchase.toLocaleString()}</p>
                                      </div>
                                      <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 800, color: C.t900, margin: 0 }}>৳{(item.quantity * item.price_at_purchase).toLocaleString()}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div style={{ marginTop: '1.25rem', padding: '1rem', background: C.t900, borderRadius: C.rMd, color: '#fff' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '0.2rem', opacity: 0.6 }}>
                                    <span>Shipping Address</span>
                                    <span>Total Amount</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <p style={{ fontSize: '0.72rem', fontWeight: 500, margin: 0, maxWidth: '60%' }}>{order.shipping_address}</p>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>৳{order.total_price.toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* ── RIGHT: SIDEBAR ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <motion.div {...fadeUp(0.1)} style={{ background: C.bgCard, borderRadius: C.rLg, padding: '1.5rem', border: `1px solid ${C.bSoft}` }}>
              <h3 style={{ fontSize: '0.65rem', fontWeight: 800, color: C.t300, letterSpacing: '0.1em', marginBottom: '1.25rem' }}>Account Services</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { label: 'Saved Wishlist', icon: Heart, to: '/wishlist' },
                  { label: 'Payment Methods', icon: CreditCard, to: '#' },
                  { label: 'Shipping Center', icon: MapPin, to: '/profile/edit' },
                  { label: 'Security Settings', icon: Shield, to: '/profile/edit' },
                ].map((item, i) => (
                  <button key={i} onClick={() => item.to !== '#' && navigate(item.to)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem', background: 'transparent', border: 'none', borderRadius: '0.75rem',
                    cursor: 'pointer', transition: 'background .2s'
                  }} onMouseEnter={e => e.currentTarget.style.background = C.bgMuted} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <item.icon style={{ width: 15, height: 15, color: C.t500 }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: C.t700 }}>{item.label}</span>
                    </div>
                    <ChevronRight style={{ width: 14, height: 14, color: C.t300 }} />
                  </button>
                ))}
              </div>
              <div style={{ height: 1, background: C.bSoft, margin: '1rem 0' }} />
              <button onClick={logout} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem', background: 'transparent', border: 'none', borderRadius: '0.75rem',
                cursor: 'pointer', color: C.rose, transition: 'background .2s'
              }} onMouseEnter={e => e.currentTarget.style.background = '#fff1f2'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <LogOut style={{ width: 15, height: 15 }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>Sign Out</span>
              </button>
            </motion.div>

            <motion.div {...fadeUp(0.15)} style={{ 
              background: C.t900, borderRadius: C.rLg, padding: '1.5rem', color: '#fff',
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <Star style={{ width: 24, height: 24, color: C.lime, fill: C.lime, marginBottom: '0.75rem' }} />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 0.4rem' }}>Loyalty Member</h4>
                <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, margin: 0 }}>
                  You have {orders.filter(o => o.order_status === 'Delivered').length} successful deliveries. Unlock premium perks!
                </p>
              </div>
              <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: 80, height: 80, background: '#fff', opacity: 0.05, borderRadius: '50%', filter: 'blur(20px)' }} />
            </motion.div>
          </div>

        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal 
        isOpen={isReviewModalOpen} 
        onClose={() => setIsReviewModalOpen(false)}
        product={selectedProduct}
        onSubmit={fetchOrders}
      />
    </div>
  );
};

const ReviewModal = ({ isOpen, onClose, product, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.error('Select rating');
    setLoading(true);
    try {
      await api.post('/reviews', { product_id: product.id, rating, comment });
      toast.success('Review submitted');
      onSubmit(); onClose();
    } catch { toast.error('Failed to submit'); } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} style={{
        position: 'relative', background: '#fff', width: '100%', maxWidth: 420,
        borderRadius: C.r2xl, padding: '2.5rem', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.25)'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: C.t900, marginBottom: '0.25rem' }}>Share Experience</h2>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: C.t300, marginBottom: '1.5rem' }}>{product?.name}</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} 
                onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => setRating(s)}
                style={{ width: 32, height: 32, cursor: 'pointer', fill: (hover || rating) >= s ? C.amber : 'none', color: (hover || rating) >= s ? C.amber : C.t300, transition: 'all 0.2s' }} 
              />
            ))}
          </div>

          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="How was the product?" style={{
            width: '100%', height: 100, padding: '1rem', borderRadius: C.rMd, border: `1px solid ${C.bSoft}`,
            background: C.bgMuted, outline: 'none', fontSize: '0.8rem', fontFamily: 'inherit', resize: 'none'
          }} />

          <button type="submit" disabled={loading} style={{
            padding: '1rem', background: C.t900, color: '#fff', border: 'none', borderRadius: C.rMd,
            fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', transition: 'opacity 0.2s'
          }}>
            {loading ? 'Submitting...' : 'Post Review'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Profile;
