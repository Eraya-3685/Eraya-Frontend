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
import ConfirmModal from '../components/ConfirmModal';
import useMediaQuery from '../hooks/useMediaQuery';

const C = {
  t900:'#0d1117', t700:'#1f2937', t500:'#6b7280', t300:'#adb5bd',
  bSoft:'rgba(0,0,0,0.07)', bLine:'#edf0f4',
  bgPage:'#f7f8fa', bgCard:'#fff', bgMuted:'#f3f5f8',
  lime:'#cbff00', blue:'#3b82f6', rose:'#f43f5e', green:'#22c55e', orange:'#f97316',
};

const Checkout = () => {
  useDocumentTitle('Checkout | Eraya');
  const { isMobile } = useMediaQuery();
  const { items, clearCart, updateQuantity, removeItem } = useCartStore();
  const { user, updateProfile } = useAuthStore();
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
  }, [user]);

  const [loading, setLoading] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Info, 2: Payment (internal tracking)
  const [itemToRemove, setItemToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showConfirmOrderModal, setShowConfirmOrderModal] = useState(false);
  const [receiptItems, setReceiptItems] = useState([]);
  const [receiptOrder, setReceiptOrder] = useState(null);

  const confirmRemove = async () => {
    if (!itemToRemove) return;
    setIsRemoving(true);
    await new Promise(r => setTimeout(r, 400));
    removeItem(itemToRemove.id, itemToRemove.selected_color, itemToRemove.selected_size);
    setIsRemoving(false);
    setItemToRemove(null);
  };

  const handleQty = (item, newQty) => {
    if (newQty > (item.stock_count ?? 99)) { toast.error(`Only ${item.stock_count} in stock`); return; }
    if (newQty <= 0) { setItemToRemove(item); return; }
    updateQuantity(item.id, newQty, item.selected_color, item.selected_size);
  };
  
  const [form, setForm] = useState({
    first_name: user?.full_name?.split(' ')[0] || '',
    last_name: user?.full_name?.split(' ').slice(1).join(' ') || '',
    shipping_address: user?.address || '',
    phone: user?.phone || '',
    payment_method: 'COD',
  });

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        first_name: prev.first_name || user.full_name?.split(' ')[0] || '',
        last_name: prev.last_name || user.full_name?.split(' ').slice(1).join(' ') || '',
        shipping_address: prev.shipping_address || user.address || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    if (isBkashSuccess) {
      setForm(prev => ({ ...prev, payment_method: 'bKash' }));
    }
  }, [isBkashSuccess]);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    setApplyingCoupon(true);
    try {
      const res = await api.post('/coupons/apply', {
        code: couponCode.trim().toUpperCase(),
        cart_total: subtotal
      });
      setAppliedCoupon(res.data.coupon);
      setDiscount(res.data.discount_amount);
      toast.success(`Coupon applied! Saved ৳${res.data.discount_amount}`);
    } catch (err) {
      toast.error(err.response?.data || 'Failed to apply coupon');
      setAppliedCoupon(null);
      setDiscount(0);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode('');
    toast.success('Coupon removed');
  };

  const subtotal = items.reduce((sum, item) => {
    const price = item.discount_price && item.discount_price > 0 ? item.discount_price : item.base_price;
    return sum + price * item.quantity;
  }, 0);
  const shipping = subtotal >= (settings.free_shipping_threshold || 1000) ? 0 : (settings.standard_delivery_fee || 60);
  const tax = subtotal * ((settings.tax_percentage || 0) / 100);
  const total = Math.max(0, subtotal + shipping + tax - discount);

  const handlePlaceOrder = async () => {
    const firstName = form.first_name.trim();
    const lastName = form.last_name.trim();
    const phone = form.phone.trim();
    const address = form.shipping_address.trim();

    if (!firstName || !lastName) {
      toast.error('Please enter your full name');
      return;
    }
    if (!phone) {
      toast.error('Please enter your phone number');
      return;
    }
    if (!address) {
      toast.error('Please enter your delivery address');
      return;
    }

    setLoading(true);
    try {
      const combinedAddress = `Recipient: ${firstName} ${lastName} | Phone: ${phone} | Address: ${address}`;

      // Snapshot items in cart for printable receipt rendering
      setReceiptItems([...items]);

      if (form.payment_method === 'bKash' && !isBkashSuccess) {
        const res = await api.post('/orders/bkash/init', { amount: total });
        if (res.data.bkashURL) window.location.href = res.data.bkashURL;
        return;
      }

      const orderData = {
        items: items.map(i => ({
          product_id: i.id,
          quantity: i.quantity,
          selected_color: i.selected_color || '',
          selected_size: i.selected_size || ''
        })),
        shipping_address: combinedAddress,
        payment_method: form.payment_method,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
      };

      if (isBkashSuccess) {
        orderData.trx_id = bkashTrxID;
        orderData.paid_amount = parseFloat(bkashAmount);
        orderData.sender_number = bkashSenderNumber;
      }

      const res = await api.post('/orders/checkout', orderData);
      setReceiptOrder(res.data.order);
      clearCart();
      toast.success('Order placed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Order failed');
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

  if (receiptOrder) {
    const shippingInfo = receiptOrder.shipping_address || '';
    const parts = shippingInfo.split('|');
    const recipientName = parts[0]?.replace('Recipient:', '')?.trim() || user?.full_name || 'N/A';
    const recipientPhone = parts[1]?.replace('Phone:', '')?.trim() || 'N/A';
    const recipientAddr = parts[2]?.replace('Address:', '')?.trim() || shippingInfo;

    const handlePrint = () => {
      const logoHtml = settings?.logo_url ? `
        <img src="${getImageUrl(settings.logo_url)}" style="width: 36px; height: 36px; border-radius: 8px; object-fit: contain; margin-right: 8px;" alt="Logo" />
      ` : `
        <div class="logo-icon">E</div>
      `;
      const printWindow = window.open('', '_blank');
      const itemsHtml = receiptItems.map(item => `
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid #f1f5f9; text-align: left;">
            <span class="item-name">${item.name}</span>
            ${item.selected_color ? `<div style="font-size: 11px; color: #64748b; margin-top: 4px;">Color: ${item.selected_color}</div>` : ''}
            ${item.selected_size ? `<div style="font-size: 11px; color: #64748b;">Size: ${item.selected_size}</div>` : ''}
          </td>
          <td style="padding: 16px; border-bottom: 1px solid #f1f5f9; text-align: center;">${item.quantity}</td>
          <td style="padding: 16px; border-bottom: 1px solid #f1f5f9; text-align: right;">৳${(item.discount_price && item.discount_price > 0 ? item.discount_price : item.base_price).toLocaleString()}</td>
          <td style="padding: 16px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700; color: #0f172a;">৳${((item.discount_price && item.discount_price > 0 ? item.discount_price : item.base_price) * item.quantity).toLocaleString()}</td>
        </tr>
      `).join('');

      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - Eraya #${receiptOrder.id}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            <style>
              @media print {
                @page {
                  size: A4;
                  margin: 1.6cm 2cm;
                }
                body {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
              }
              body {
                font-family: 'Plus Jakarta Sans', sans-serif;
                color: #1e293b;
                margin: 0;
                padding: 0;
                background: #fff;
                line-height: 1.6;
              }
              .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 40px 30px;
                background: #fff;
                border-top: 8px solid #0d1117;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #0d1117;
                padding-bottom: 24px;
                margin-bottom: 35px;
              }
              .logo-container {
                display: flex;
                align-items: center;
                gap: 10px;
              }
              .logo-icon {
                width: 36px;
                height: 36px;
                background: #0d1117;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                font-weight: 800;
                font-size: 20px;
              }
              .logo-text {
                font-size: 26px;
                font-weight: 900;
                color: #0d1117;
                letter-spacing: 0.08em;
                text-transform: uppercase;
              }
              .invoice-title {
                font-size: 28px;
                font-weight: 900;
                color: #0d1117;
                margin: 0;
                letter-spacing: 0.05em;
                text-align: right;
              }
              .invoice-number {
                font-size: 13px;
                color: #64748b;
                font-weight: 700;
                text-align: right;
                margin-top: 4px;
                letter-spacing: 0.02em;
              }
              .meta-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin-bottom: 40px;
              }
              .meta-card {
                background: #f8fafc;
                border-radius: 12px;
                padding: 24px;
                border: 1px solid #e2e8f0;
              }
              .meta-title {
                font-size: 10px;
                font-weight: 800;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                margin-bottom: 12px;
              }
              .meta-value {
                font-size: 13.5px;
                font-weight: 600;
                color: #334155;
                line-height: 1.6;
              }
              .meta-value strong {
                color: #0d1117;
                font-size: 15px;
                font-weight: 800;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 35px;
              }
              th {
                background: #f8fafc;
                border-bottom: 2px solid #0d1117;
                padding: 14px 16px;
                font-size: 10px;
                font-weight: 800;
                color: #0d1117;
                text-transform: uppercase;
                letter-spacing: 0.08em;
              }
              td {
                padding: 16px;
                border-bottom: 1px solid #f1f5f9;
              }
              .item-name {
                font-weight: 800;
                color: #0d1117;
                font-size: 14.5px;
              }
              .totals-section {
                display: flex;
                justify-content: flex-end;
                margin-top: 25px;
              }
              .totals-table {
                width: 320px;
                margin-bottom: 0;
              }
              .totals-table td {
                padding: 8px 16px;
                border: none;
                font-size: 13.5px;
                font-weight: 600;
                color: #64748b;
              }
              .totals-table tr.grand-total td {
                border-top: 2px solid #0d1117;
                padding-top: 14px;
                font-size: 20px;
                font-weight: 900;
                color: #0d1117;
              }
              .footer {
                text-align: center;
                margin-top: 70px;
                padding-top: 30px;
                border-top: 1px dashed #e2e8f0;
                font-size: 11px;
                color: #94a3b8;
                font-weight: 700;
                letter-spacing: 0.02em;
              }
              .badge {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 6px;
                font-size: 9px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                background: #fffbeb;
                color: #d97706;
              }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              <div class="header">
                <div>
                  <div class="logo-container">
                    ${logoHtml}
                    <div class="logo-text">Eraya</div>
                  </div>
                  <div style="font-size: 11px; color: #94a3b8; font-weight: 700; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.05em;">Exclusive E-commerce Hub</div>
                </div>
                <div>
                  <h1 class="invoice-title">INVOICE</h1>
                  <div class="invoice-number">Order #${receiptOrder.id}</div>
                </div>
              </div>

              <div class="meta-grid">
                <div class="meta-card">
                  <div class="meta-title">Shipped To</div>
                  <div class="meta-value">
                    <strong>${recipientName}</strong><br/>
                    <span style="color: #64748b; font-size: 12px;">Phone:</span> ${recipientPhone}<br/>
                    <span style="color: #64748b; font-size: 12px;">Address:</span> ${recipientAddr}
                  </div>
                </div>
                <div class="meta-card">
                  <div class="meta-title">Invoice Details</div>
                  <div class="meta-value">
                    <span style="color: #64748b; font-size: 12px;">Date:</span> ${new Date(receiptOrder.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}<br/>
                    <span style="color: #64748b; font-size: 12px;">Payment:</span> ${receiptOrder.payment_method === 'COD' ? 'Cash on Delivery' : 'bKash Wallet'}<br/>
                    <span style="color: #64748b; font-size: 12px;">Status:</span> <span class="badge">Pending Review</span>
                  </div>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th style="text-align: left; width: 50%;">Item Description</th>
                    <th style="text-align: center; width: 10%;">Qty</th>
                    <th style="text-align: right; width: 20%;">Unit Price</th>
                    <th style="text-align: right; width: 20%;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <div class="totals-section">
                <table class="totals-table">
                  <tr>
                    <td style="text-align: left;">Subtotal</td>
                    <td style="text-align: right;">৳${subtotal.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="text-align: left;">Delivery Charge</td>
                    <td style="text-align: right;">৳${shipping.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="text-align: left;">VAT / Tax (${settings.tax_percentage || 0}%)</td>
                    <td style="text-align: right;">৳${tax.toLocaleString()}</td>
                  </tr>
                  <tr class="grand-total">
                    <td style="text-align: left;">Grand Total</td>
                    <td style="text-align: right;">৳${receiptOrder.total_price.toLocaleString()}</td>
                  </tr>
                </table>
              </div>

              <div class="footer">
                Thank you for shopping with Eraya! For support, contact 09678-ERAYA or email support@eraya.com
              </div>
            </div>

            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    };

    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: '#fff', border: `1px solid ${C.bLine}`, borderRadius: '2rem',
            padding: '2.5rem', maxWidth: '600px', width: '100%',
            boxShadow: '0 12px 48px rgba(0,0,0,0.05)', textAlign: 'center'
          }}
        >
          <div style={{ width: 64, height: 64, background: '#dcfce7', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#15803d', marginBottom: '1.5rem' }}>
             <CheckCircle style={{ width: 32, height: 32 }} />
          </div>
          
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: C.t900, margin: '0 0 0.5rem', letterSpacing: '-0.04em' }}>Order Placed Successfully!</h2>
          <p style={{ fontSize: '0.85rem', color: C.t500, margin: '0 0 2rem' }}>Your order #<strong>{receiptOrder.id}</strong> has been created. A receipt has been generated for your purchase.</p>

          <div style={{ background: C.bgMuted, borderRadius: '1.25rem', padding: '1.5rem', textAlign: 'left', marginBottom: '2rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: C.t700 }}>
                <span>Recipient Name:</span>
                <span style={{ color: C.t900 }}>{recipientName}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: C.t700 }}>
                <span>Phone:</span>
                <span style={{ color: C.t900 }}>{recipientPhone}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: C.t700 }}>
                <span>Address:</span>
                <span style={{ color: C.t900, maxWidth: '280px', textAlign: 'right' }}>{recipientAddr}</span>
             </div>
             <div style={{ height: '1px', background: C.bLine, margin: '1rem 0' }} />
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 900, color: C.t900 }}>
                <span>Total Amount:</span>
                <span>৳{receiptOrder.total_price.toLocaleString()}</span>
              </div>
           </div>

           <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={handlePrint}
                className="btn-lime"
                style={{ padding: '0.85rem 2rem', fontSize: '0.85rem', fontWeight: 800, minWidth: '160px', height: 'auto' }}
              >
                 Print Receipt
              </button>
              <button 
                onClick={() => navigate('/profile')}
                style={{
                  padding: '0.85rem 2rem', background: '#0d1117', color: '#fff',
                  border: 'none', borderRadius: '1.25rem', fontSize: '0.85rem',
                  fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', minWidth: '160px'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
                onMouseLeave={e => e.currentTarget.style.background = '#0d1117'}
              >
                 Go to Profile
              </button>
           </div>
         </motion.div>
       </div>
    );
  }

  return (
    <div style={{ paddingBottom: '5rem' }}>
      
      {/* ── Header Steps ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', fontWeight: 600, color: C.t300, marginBottom: '2rem' }}>
        <Link to="/cart" style={{ color: C.t500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'color .15s' }} onMouseEnter={e=>e.currentTarget.style.color=C.t900} onMouseLeave={e=>e.currentTarget.style.color=C.t500}>
          <ArrowLeft style={{ width: 14, height: 14 }} /> Back to Cart
        </Link>
      </div>

      <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: isMobile ? '1.5rem' : '3rem', alignItems: 'start' }}>
        
        {/* ── LEFT: Form ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Step Indicators */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#fff', padding: '1rem 1.5rem', borderRadius: '1.25rem', border: `1px solid ${C.bLine}`, gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: C.t900, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>1</div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: C.t900 }}>Customer Details</span>
            </div>
            <div style={{ height: '1px', flex: 1, minWidth: '10px', background: C.bLine }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: form.payment_method ? C.t900 : C.bgMuted, color: form.payment_method ? '#fff' : C.t500, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                {isBkashSuccess ? <CheckCircle style={{ width: 14, height: 14 }} /> : '2'}
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: form.payment_method ? 700 : 600, color: form.payment_method ? C.t900 : C.t500 }}>Payment Method</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
             <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: C.t900, margin: 0, letterSpacing: '-0.04em' }}>Complete Your Order</h2>
             <p style={{ fontSize: '0.82rem', color: C.t500, margin: 0 }}>Provide your shipping details and select your payment method below.</p>
          </div>

          {/* Premium Form Card */}
          <div style={{
            background: '#fff', border: `1px solid ${C.bLine}`, borderRadius: '2rem',
            padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.02)',
            display: 'flex', flexDirection: 'column', gap: '1.5rem'
          }}>
             {/* Name Row */}
             <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.25rem' }}>
                <div>
                   <label style={{ fontSize: '0.8rem', fontWeight: 700, color: C.t700, display: 'block', marginBottom: '0.4rem' }}>First Name</label>
                   <div style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        placeholder="First name"
                        value={form.first_name}
                        onChange={e => setForm({...form, first_name: e.target.value})}
                        className="premium-input"
                      />
                      <User style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: C.t500 }} />
                   </div>
                </div>
                <div>
                   <label style={{ fontSize: '0.8rem', fontWeight: 700, color: C.t700, display: 'block', marginBottom: '0.4rem' }}>Last Name</label>
                   <div style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        placeholder="Last name"
                        value={form.last_name}
                        onChange={e => setForm({...form, last_name: e.target.value})}
                        className="premium-input"
                      />
                      <User style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: C.t500 }} />
                   </div>
                </div>
             </div>

             {/* Phone Input */}
             <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: C.t700, display: 'block', marginBottom: '0.4rem' }}>Phone Number</label>
                <div style={{ position: 'relative' }}>
                   <input 
                     type="text" 
                     placeholder="e.g. 01712345678"
                     value={form.phone}
                     onChange={e => setForm({...form, phone: e.target.value})}
                     className="premium-input"
                   />
                   <Phone style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: C.t500 }} />
                </div>
             </div>

             {/* Address Input */}
             <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: C.t700, display: 'block', marginBottom: '0.4rem' }}>Delivery Address</label>
                <div style={{ position: 'relative' }}>
                   <textarea 
                     placeholder="Enter detailed delivery address..."
                     value={form.shipping_address}
                     onChange={e => setForm({...form, shipping_address: e.target.value})}
                     className="premium-input"
                     style={{ minHeight: '90px', resize: 'vertical', fontFamily: 'inherit', paddingLeft: '2.5rem' }}
                   />
                   <MapPin style={{ position: 'absolute', left: '0.9rem', top: '1rem', width: 15, height: 15, color: C.t500 }} />
                </div>
             </div>
          </div>

          {/* Payment Method */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
             <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: C.t900, margin: 0 }}>Payment Details</h3>
             
             {isBkashSuccess ? (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 style={{ padding: '1.75rem', background: '#f0fdf4', borderRadius: '1.5rem', border: '2px solid #dcfce7', position: 'relative', overflow: 'hidden' }}
               >
                 <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                       <div style={{ width: 28, height: 28, background: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ShieldCheck style={{ width: 16, height: 16, color: '#fff' }} />
                       </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#166534' }}>bKash Payment Verified</span>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                       <div>
                            <p style={{ margin: 0, fontSize: '0.62rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Transaction ID</p>
                          <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem', fontWeight: 900, color: C.t900, letterSpacing: '0.05em' }}>{bkashTrxID}</p>
                       </div>
                       <div>
                            <p style={{ margin: 0, fontSize: '0.62rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sender Number</p>
                          <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem', fontWeight: 900, color: C.t900 }}>{bkashSenderNumber}</p>
                       </div>
                    </div>

                    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed #dcfce7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#166534' }}>Amount Paid</span>
                       <span style={{ fontSize: '1rem', fontWeight: 900, color: '#166534' }}>৳{bkashAmount}</span>
                    </div>
                 </div>
                 {/* Decorative background circle */}
                 <div style={{ position: 'absolute', bottom: '-2rem', right: '-2rem', width: 120, height: 120, background: '#dcfce7', borderRadius: '50%', opacity: 0.5 }} />
               </motion.div>
             ) : (
               <>
                  <p style={{ fontSize: '0.8rem', color: C.t500, margin: '-0.75rem 0 0' }}>Select your preferred method for checkout payment.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                     {[
                       { id: 'COD', label: 'Cash on Delivery', sub: 'Pay with cash upon delivery', icon: Wallet, color: C.t900 },
                       { id: 'bKash', label: 'bKash Payment', sub: 'Instant payment via bKash personal wallet', icon: 'https://www.logo.wine/a/logo/BKash/BKash-bKash-Logo.wine.svg', color: '#e2127d' },
                     ].map((m) => {
                       const active = form.payment_method === m.id;
                       const isDisabled = m.id === 'bKash';
                       return (
                         <button 
                           key={m.id}
                           onClick={() => {
                             if (isDisabled) {
                               toast.error('bKash payment is temporarily offline. Please choose Cash on Delivery.');
                               return;
                             }
                             setForm({...form, payment_method: m.id});
                           }}
                           className={`payment-btn ${active ? 'active' : ''}`}
                           style={{
                             borderColor: active ? C.t900 : C.bLine,
                             boxShadow: active ? '0 6px 16px rgba(0,0,0,0.03)' : 'none',
                             cursor: isDisabled ? 'not-allowed' : 'pointer',
                             opacity: isDisabled ? 0.6 : 1,
                           }}
                         >
                           <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left' }}>
                              <div style={{ width: 44, height: 44, borderRadius: '0.75rem', background: C.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                                 {typeof m.icon === 'string' ? (
                                   <img src={m.icon} style={{ width: '80%', height: '80%', objectFit: 'contain', filter: isDisabled ? 'grayscale(80%)' : 'none' }} alt="" />
                                 ) : <m.icon style={{ width: 18, height: 18, color: active ? C.t900 : C.t500 }} />}
                              </div>
                              <div>
                                 <span style={{ fontSize: '0.85rem', fontWeight: 800, color: C.t900, display: 'flex', alignItems: 'center' }}>
                                   {m.label}
                                   {isDisabled && (
                                     <span style={{ fontSize: '0.6rem', color: '#ef4444', background: '#fee2e2', padding: '0.1rem 0.35rem', borderRadius: '0.35rem', marginLeft: '0.4rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                       Offline
                                     </span>
                                   )}
                                 </span>
                                 <span style={{ fontSize: '0.7rem', fontWeight: 500, color: C.t500 }}>{m.sub}</span>
                              </div>
                           </div>
                           <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${active ? C.t900 : C.t300}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.t900 }} />}
                           </div>
                         </button>
                       );
                     })}
                  </div>
               </>
             )}
          </div>
        </div>

        {/* ── RIGHT: Summary ── */}
        <div style={{
          background: '#fff', border: `1px solid ${C.bLine}`, borderRadius: '2rem',
          padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.02)', position: 'sticky', top: '100px'
        }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <ShoppingBag style={{ width: 18, height: 18, color: C.t900 }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: C.t900, margin: 0 }}>Order Summary</h3>
           </div>

           {/* Items List */}
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '320px', overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1.5rem' }} className="custom-scrollbar">
              {items.map((item) => (
                <div key={`${item.id}-${item.selected_color || ''}-${item.selected_size || ''}`} style={{ display: 'flex', gap: '0.75rem', paddingBottom: '1rem', borderBottom: `1px solid ${C.bgMuted}`, alignItems: 'center' }}>
                   <div style={{ width: 56, height: 56, background: C.bgMuted, borderRadius: '0.75rem', overflow: 'hidden', border: `1px solid ${C.bLine}`, flexShrink: 0 }}>
                      <img src={getImageUrl(item.image_url || item.images?.[0]?.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                   </div>
                   <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.78rem', fontWeight: 800, color: C.t900, margin: '0 0 0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                      <p style={{ fontSize: '0.68rem', fontWeight: 600, color: C.t500, margin: 0 }}>Qty: {item.quantity}</p>
                      {item.selected_color && <p style={{ fontSize: '0.62rem', fontWeight: 600, color: C.t500, margin: '0.15rem 0 0' }}>Color: {item.selected_color}</p>}
                      {item.selected_size && <p style={{ fontSize: '0.62rem', fontWeight: 600, color: C.t500, margin: '0.1rem 0 0' }}>Size: {item.selected_size}</p>}
                      {/* Interactive Qty stepper in check-out */}
                      <div style={{ display: 'flex', alignItems: 'center', background: C.bgMuted, borderRadius: '0.35rem', padding: '0.1rem', width: 'fit-content', marginTop: '0.3rem' }}>
                         <button onClick={() => handleQty(item, item.quantity - 1)} style={{ background: 'none', border: 'none', padding: '0.15rem', cursor: 'pointer', display: 'flex', color: C.t700 }}><Minus style={{ width: 10, height: 10 }} /></button>
                         <span style={{ fontSize: '0.7rem', fontWeight: 800, width: 18, textAlign: 'center', color: C.t900 }}>{item.quantity}</span>
                         <button onClick={() => handleQty(item, item.quantity + 1)} style={{ background: 'none', border: 'none', padding: '0.15rem', cursor: 'pointer', display: 'flex', color: C.t700 }}><Plus style={{ width: 10, height: 10 }} /></button>
                      </div>
                   </div>
                   <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {item.discount_price && item.discount_price > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.15rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: C.t900 }}>৳{(item.discount_price * item.quantity).toLocaleString()}</span>
                          <span style={{ fontSize: '0.68rem', color: C.t300, textDecoration: 'line-through' }}>৳{(item.base_price * item.quantity).toLocaleString()}</span>
                          <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#166534', background: '#dcfce7', padding: '0.05rem 0.25rem', borderRadius: '0.25rem', whiteSpace: 'nowrap' }}>
                            {Math.round(((item.base_price - item.discount_price) / item.base_price) * 100)}% Off
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: C.t900 }}>৳{(item.base_price * item.quantity).toLocaleString()}</span>
                      )}
                   </div>
                </div>
              ))}
           </div>

           {/* Coupon Code Section */}
           <div style={{ background: '#f8f9fc', border: `1px solid ${C.bSoft}`, borderRadius: '1.25rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
             <span style={{ fontSize: '0.75rem', fontWeight: 800, color: C.t900 }}>Promo Coupon</span>
             {appliedCoupon ? (
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.5rem 0.85rem', borderRadius: '0.75rem' }}>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                   <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#065f46' }}>{appliedCoupon.code} Applied</span>
                   <span style={{ fontSize: '0.62rem', color: '#047857', fontWeight: 600 }}>Discount of ৳{discount.toLocaleString()}</span>
                 </div>
                 <button onClick={handleRemoveCoupon} style={{ background: 'transparent', border: 'none', color: '#b91c1c', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}>Remove</button>
               </div>
             ) : (
               <div style={{ display: 'flex', gap: '0.5rem' }}>
                 <input 
                   type="text" 
                   placeholder="Enter Coupon Code" 
                   value={couponCode} 
                   onChange={e => setCouponCode(e.target.value)} 
                   style={{ flex: 1, padding: '0 0.85rem', height: 38, border: `1px solid ${C.bSoft}`, borderRadius: '0.75rem', fontSize: '0.78rem', fontWeight: 600, outline: 'none' }}
                 />
                 <button 
                   onClick={handleApplyCoupon} 
                   disabled={applyingCoupon}
                   style={{ padding: '0 1.25rem', background: C.t900, color: '#fff', border: 'none', borderRadius: '0.75rem', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', opacity: applyingCoupon ? 0.7 : 1 }}
                 >
                   Apply
                 </button>
               </div>
             )}
           </div>

           {/* Pricing Details */}
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: C.t500, fontWeight: 600 }}>
                 <span>Subtotal</span>
                 <span style={{ color: C.t900, fontWeight: 700 }}>৳{subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: C.t500, fontWeight: 600, alignItems: 'center' }}>
                 <span>Delivery Service</span>
                 {shipping === 0 ? (
                   <span style={{ color: '#166534', background: '#dcfce7', fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 9999 }}>Free</span>
                 ) : (
                   <span style={{ color: C.t900, fontWeight: 700 }}>৳{shipping.toLocaleString()}</span>
                 )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: C.t500, fontWeight: 600 }}>
                 <span>Vat (0%)</span>
                 <span style={{ color: C.t900, fontWeight: 700 }}>৳0.00</span>
              </div>
              
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#15803d', fontWeight: 700 }}>
                   <span>Coupon Discount</span>
                   <span>- ৳{discount.toLocaleString()}</span>
                </div>
              )}

              {isBkashSuccess && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '0.6rem 0.8rem', background: '#f0fdf4', borderRadius: '0.75rem', marginTop: '0.25rem', border: '1px solid #dcfce7' }}>
                   <span style={{ fontWeight: 700, color: '#166534' }}>Paid via bKash</span>
                   <span style={{ fontWeight: 800, color: '#166534' }}>- ৳{total.toLocaleString()}</span>
                </div>
              )}

              <div style={{ height: '1px', background: C.bLine, margin: '0.5rem 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
                 <span style={{ fontSize: '0.9rem', fontWeight: 900, color: C.t900 }}>{isBkashSuccess ? 'Total due' : 'Total amount'}</span>
                 <span style={{ fontSize: '1.5rem', fontWeight: 900, color: C.t900, letterSpacing: '-0.03em' }}>৳{isBkashSuccess ? '0' : total.toLocaleString()}</span>
              </div>

              <button
                onClick={() => {
                  const firstName = form.first_name.trim();
                  const lastName = form.last_name.trim();
                  const phone = form.phone.trim();
                  const address = form.shipping_address.trim();

                  if (!firstName || !lastName) { toast.error('Please enter your full name'); return; }
                  if (!phone) { toast.error('Please enter your phone number'); return; }
                  if (!address) { toast.error('Please enter your delivery address'); return; }

                  setShowConfirmOrderModal(true);
                }}
                disabled={loading}
                className="checkout-cta"
                style={{
                  width: '100%', height: 56, background: C.t900, color: '#fff',
                  border: 'none', borderRadius: '1.25rem',
                  fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer',
                  transition: 'all .25s ease', opacity: loading ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  boxShadow: '0 8px 24px rgba(13, 17, 23, 0.15)'
                }}
              >
                {loading ? (
                  <>
                     <svg style={{ animation: 'spin 1s linear infinite', width: 16, height: 16, color: '#fff' }} fill="none" viewBox="0 0 24 24">
                        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                     </svg>
                     <span>Processing...</span>
                  </>
                ) : (
                  <>
                     <Lock style={{ width: 14, height: 14 }} />
                     <span>{(form.payment_method === 'COD' || isBkashSuccess) ? 'Confirm Order' : `Pay with bKash ৳${total.toLocaleString()}`}</span>
                  </>
                )}
              </button>
           </div>
        </div>

      </div>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .premium-input {
          width: 100%;
          padding: 0.85rem 1rem 0.85rem 2.6rem;
          border-radius: 1rem;
          border: 1.5px solid #edf0f4;
          background: #fff;
          font-size: 0.9rem;
          font-weight: 600;
          color: #0d1117;
          outline: none;
          transition: all 0.2s ease;
        }
        .premium-input:focus {
          border-color: #0d1117;
          box-shadow: 0 4px 12px rgba(13, 17, 23, 0.05);
        }
        .payment-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-radius: 1.25rem;
          background: #fff;
          border: 1.5px solid #edf0f4;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
        }
        .payment-btn:hover {
          border-color: #0d1117;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }
        .payment-btn.active {
          border-color: #0d1117;
          background: #fafafc;
        }
        .checkout-cta:hover {
          background: #1e293b !important;
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(13, 17, 23, 0.25) !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #edf0f4;
          border-radius: 99px;
        }
        @media (max-width: 968px) {
          .checkout-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }
      `}</style>

      <ConfirmModal isOpen={!!itemToRemove} onClose={() => setItemToRemove(null)}
        onConfirm={confirmRemove} loading={isRemoving}
        title="Remove Item?" message={`Remove "${itemToRemove?.name}" from order?`} />

      <ConfirmModal isOpen={showConfirmOrderModal} onClose={() => setShowConfirmOrderModal(false)}
        onConfirm={async () => {
          setShowConfirmOrderModal(false);
          await handlePlaceOrder();
        }}
        loading={loading}
        title="Confirm Order" message="Are you sure you want to place this order?" />
    </div>
  );
};

export default Checkout;
