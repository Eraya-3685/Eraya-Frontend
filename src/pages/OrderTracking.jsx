import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Truck, CheckCircle2, Clock, Zap, XCircle, 
  ChevronLeft, MapPin, CreditCard, ShoppingBag, 
  ArrowRight, Calendar, AlertCircle
} from 'lucide-react';
import api, { getImageUrl } from '../api/axios';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { Toaster } from 'react-hot-toast';
import useMediaQuery from '../hooks/useMediaQuery';

const statusMap = {
  Pending: { color: '#f59e0b', bg: '#fef3c7', icon: Clock, label: 'Order received', desc: 'We have received your order and it is awaiting confirmation.' },
  Confirmed: { color: '#6366f1', bg: '#e0e7ff', icon: Package, label: 'Order accepted', desc: 'Good news! Your order has been accepted and is being prepared.' },
  Processing: { color: '#3b82f6', bg: '#dbeafe', icon: Zap, label: 'Processing', desc: 'Your order is currently being carefully packed for shipment.' },
  Shipped: { color: '#a855f7', bg: '#f3e8ff', icon: Truck, label: 'In transit', desc: 'Great news! Your package is on its way to your destination.' },
  Delivered: { color: '#10b981', bg: '#d1fae5', icon: CheckCircle2, label: 'Delivered', desc: 'Excellent! Your order has been successfully delivered.' },
  Cancelled: { color: '#ef4444', bg: '#fee2e2', icon: XCircle, label: 'Cancelled', desc: 'This order has been cancelled and will not be fulfilled.' },
};

const OrderTrackbar = ({ status }) => {
  const steps = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
  const currentIndex = steps.indexOf(status);
  const isCancelled = status === 'Cancelled';

  if (isCancelled) {
    return (
      <div style={{ padding: '2.5rem', background: '#fef2f2', borderRadius: '2rem', border: '1px solid #fee2e2', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
        <XCircle style={{ width: 48, height: 48, color: '#ef4444' }} />
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#991b1b' }}>Order cancelled</h3>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f87171', marginTop: '0.4rem', maxWidth: 280 }}>This transaction has been terminated. If this was a mistake, please contact support.</p>
        </div>
      </div>
    );
  }

  const currentTheme = statusMap[status] || statusMap.Pending;

  return (
    <div style={{ padding: '2rem 0' }}>
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Progress Line */}
        <div style={{ position: 'absolute', top: 28, left: 0, right: 0, height: 4, background: '#f1f5f9', borderRadius: 99 }}>
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
             style={{ height: '100%', background: currentTheme.color, borderRadius: 99, transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
           />
        </div>

        {steps.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const config = statusMap[step];
          const Icon = config.icon;

          return (
            <div key={step} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                width: 56, height: 56, borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isActive ? config.color : '#fff',
                color: isActive ? '#fff' : '#cbd5e1',
                border: `4px solid ${isActive ? '#fff' : '#f8fafc'}`,
                boxShadow: isActive ? `0 10px 25px -5px ${config.color}44` : 'none',
                transition: 'all 0.5s ease',
                transform: isCurrent ? 'scale(1.15)' : 'scale(1)'
              }}>
                <Icon style={{ width: 24, height: 24 }} strokeWidth={2.5} />
              </div>
              <div style={{ textAlign: 'center', maxWidth: 80 }}>
                <p style={{ fontSize: '0.68rem', fontWeight: 800, margin: 0, color: isActive ? '#0d1117' : '#94a3b8' }}>
                  {step === 'Confirmed' ? 'Accepted' : step}
                </p>
                {isCurrent && (
                   <motion.div 
                     initial={{ opacity: 0, scale: 0 }}
                     animate={{ opacity: 1, scale: 1 }}
                     style={{ width: 6, height: 6, background: config.color, borderRadius: '50%', margin: '0.4rem auto 0' }}
                   />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const OrderTracking = () => {
  useDocumentTitle('Track your order');
  const { isMobile } = useMediaQuery();
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${id}`);
      setOrder(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Order not found.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fcfcfe' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 48, height: 48, margin: '0 auto 1.25rem' }}>
            <div style={{ position: 'absolute', inset: 0, border: '3px solid #f3f5f8', borderTopColor: '#0d1117', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ position: 'absolute', inset: '30%', background: '#0d1117', borderRadius: '0.25rem' }} />
          </div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>Locating your package…</p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fcfcfe', padding: '1.5rem' }}>
        <div style={{ maxWidth: 400, width: '100%', background: '#fff', borderRadius: '2.5rem', boxShadow: '0 30px 60px rgba(0,0,0,0.08)', padding: '3rem', textAlign: 'center', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ width: 72, height: 72, background: '#fef2f2', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
            <AlertCircle style={{ width: 36, height: 36, color: '#ef4444' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0d1117', marginBottom: '1rem' }}>Tracking issue</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, marginBottom: '2.5rem' }}>{error}</p>
          <button onClick={() => navigate('/profile')} style={{ width: '100%', padding: '1rem', background: '#0d1117', color: '#fff', borderRadius: '1.25rem', border: 'none', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}>Back to orders</button>
        </div>
      </div>
    );
  }

  const currentStatus = order.order_status;
  const config = statusMap[currentStatus] || statusMap.Pending;

  return (
    <div style={{ minHeight: '100vh', background: '#fcfcfe', padding: isMobile ? '1rem 0.5rem 4rem' : '2rem 1rem 6rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        
        <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: isMobile ? '1.5rem' : '3rem', padding: 0 }}>
          <div style={{ width: 40, height: 40, background: '#fff', border: '1px solid #f1f5f9', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <ChevronLeft style={{ width: 18, height: 18, color: '#0d1117' }} />
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>Back to account</span>
        </button>

        {/* Header Section */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', gap: isMobile ? '1rem' : '2rem', marginBottom: isMobile ? '1.5rem' : '3rem' }}>
          <div style={{ flex: '1 1 300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
               <span style={{ background: config.bg, color: config.color, padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.72rem', fontWeight: 800 }}>Live update</span>
               <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>ID: #{order.id}</span>
            </div>
            <h1 style={{ fontSize: isMobile ? '1.75rem' : '3rem', fontWeight: 900, color: '#0d1117', margin: 0, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
              Your order is <span style={{ color: config.color }}>{config.label}</span>
            </h1>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginTop: '0.5rem', maxWidth: 450 }}>{config.desc}</p>
          </div>
          <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.25rem' }}>Order placed</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0d1117', margin: 0 }}>{new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Trackbar */}
        <div style={{ background: '#fff', borderRadius: isMobile ? '1.5rem' : '3rem', border: '1px solid #f1f5f9', padding: isMobile ? '1.5rem 1rem' : '3rem', marginBottom: isMobile ? '1.5rem' : '3rem', boxShadow: '0 20px 50px rgba(0,0,0,0.03)', overflowX: 'auto' }}>
           <div style={{ minWidth: 600 }}>
             <OrderTrackbar status={currentStatus} />
           </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: isMobile ? '1.5rem' : '2.5rem' }}>
           {/* Left: Summary */}
           <div style={{ background: '#fff', borderRadius: '2.5rem', border: '1px solid #f1f5f9', padding: isMobile ? '1.5rem 1.25rem' : '2.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
                 <div style={{ width: 36, height: 36, background: '#f8fafc', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingBag style={{ width: 16, height: 16, color: '#0d1117' }} />
                 </div>
                 <h2 style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0d1117', margin: 0 }}>Package contents</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                 {order.items?.map((item) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '1.5rem', background: '#fcfcfe', border: '1px solid transparent', transition: 'all 0.2s' }}>
                       <div style={{ width: 64, height: 64, borderRadius: '1rem', overflow: 'hidden', background: '#fff', border: '1px solid #f1f5f9', flexShrink: 0 }}>
                          <img src={getImageUrl(item.product?.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                       </div>
                       <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#0d1117', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product?.name}</p>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8' }}>Qty: {item.quantity}</p>
                          {(item.selected_color || item.selected_size) && (
                             <p style={{ margin: '0.15rem 0 0', fontSize: '0.68rem', fontWeight: 600, color: '#64748b' }}>
                                {item.selected_color ? `Color: ${item.selected_color}` : ''}
                                {item.selected_color && item.selected_size ? ' | ' : ''}
                                {item.selected_size ? `Size: ${item.selected_size}` : ''}
                             </p>
                          )}
                       </div>
                       <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 900, color: '#0d1117' }}>৳{(item.price_at_purchase * item.quantity).toLocaleString()}</p>
                       </div>
                    </div>
                 ))}
              </div>

              <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px dashed #f1f5f9' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>Subtotal</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0d1117' }}>৳{order.items?.reduce((sum, i) => sum + (i.price_at_purchase * i.quantity), 0).toLocaleString()}</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>Shipping</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981' }}>Free</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0d1117' }}>Total paid</span>
                    <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0d1117', letterSpacing: '-0.02em' }}>৳{order.total_price.toLocaleString()}</span>
                 </div>
              </div>
           </div>

           {/* Right: Info Cards */}
           <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1.5rem' : '2.5rem' }}>
              <div style={{ background: '#0d1117', borderRadius: '2.5rem', padding: isMobile ? '1.5rem 1.25rem' : '2.5rem', color: '#fff', position: 'relative', overflow: 'hidden' }}>
                 <h2 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', marginBottom: '2rem' }}>Fulfillment details</h2>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ display: 'flex', gap: '1.25rem' }}>
                       <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.08)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <MapPin style={{ width: 18, height: 18, color: '#fff' }} />
                       </div>
                       <div>
                          <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: '0.4rem' }}>Delivery address</p>
                          <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>{order.shipping_address}</p>
                       </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.25rem' }}>
                       <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.08)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <CreditCard style={{ width: 18, height: 18, color: '#fff' }} />
                       </div>
                       <div>
                          <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: '0.4rem' }}>Payment method</p>
                          <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: '#fff' }}>{order.payment_method === 'cod' ? 'Cash on delivery' : order.payment_method}</p>
                       </div>
                    </div>
                 </div>
                 <div style={{ position: 'absolute', bottom: '-2rem', right: '-2rem', width: 140, height: 140, background: 'linear-gradient(135deg, rgba(255,255,255,0.05), transparent)', borderRadius: '50%' }} />
              </div>

              <div style={{ background: '#fff', borderRadius: '2.5rem', border: '1px solid #f1f5f9', padding: isMobile ? '1.5rem 1.25rem' : '2.5rem', textAlign: 'center' }}>
                 <div style={{ width: 56, height: 56, background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <AlertCircle style={{ width: 24, height: 24, color: '#0d1117' }} />
                 </div>
                 <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0d1117', marginBottom: '0.75rem' }}>Need assistance?</h3>
                 <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6, marginBottom: '2rem' }}>Our support team is ready to help with any shipping inquiries.</p>
                 <button style={{ width: '100%', padding: '0.85rem', background: '#fff', border: '1.5px solid #0d1117', borderRadius: '1rem', color: '#0d1117', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>Live support</button>
              </div>
           </div>
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default OrderTracking;
