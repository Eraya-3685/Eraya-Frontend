import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Lock, Truck, Wallet, 
  MapPin, ChevronRight, CheckCircle, ArrowLeft,
  ShoppingBag
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import api, { getImageUrl } from '../api/axios';
import toast from 'react-hot-toast';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useSettingsStore from '../store/useSettingsStore';

const Checkout = () => {
  useDocumentTitle('Secure Checkout');
  const { items, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const { settings, fetchSettings } = useSettingsStore();
  const navigate = useNavigate();

  // Guard: Must have phone and address to checkout
  React.useEffect(() => {
    fetchSettings();
    if (user && (!user.phone || !user.address)) {
      toast.error('Please complete your profile before placing an order');
      navigate('/complete-profile');
    }
  }, [user, navigate, fetchSettings]);

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    shipping_address: localStorage.getItem('checkout_shipping_address') || user?.address || '',
    payment_method: 'COD',
  });

  // Persist address to localStorage as user types
  React.useEffect(() => {
    localStorage.setItem('checkout_shipping_address', form.shipping_address);
  }, [form.shipping_address]);

  const subtotal = items.reduce((sum, item) => sum + item.base_price * item.quantity, 0);
  const shipping = subtotal >= settings.free_shipping_threshold ? 0 : settings.standard_delivery_fee;
  const tax = subtotal * (settings.tax_percentage / 100);
  const total = subtotal + shipping + tax;

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const orderData = {
        items: items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
        shipping_address: form.shipping_address,
        payment_method: form.payment_method,
      };

      await api.post('/orders/checkout', orderData);
      toast.success('Order placed successfully!');
      localStorage.removeItem('checkout_shipping_address'); // Clear on success
      clearCart();
      
      // Artificial delay for premium feel
      await new Promise(resolve => setTimeout(resolve, 1200));
      navigate('/profile');
    } catch (error) {
      console.error('Order failed:', error);
      const errorMsg = typeof error.response?.data === 'string' 
        ? error.response.data 
        : error.response?.data?.error || 'Failed to place order. Please try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center mb-8">
           <ShoppingBag className="w-10 h-10 text-slate-200" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Your cart is empty</h2>
        <p className="text-slate-400 text-sm mb-8 font-bold">Looks like you haven't added anything yet</p>
        <Link to="/products" className="px-10 py-4 bg-secondary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-secondary/20 hover:scale-105 transition-all">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 py-6 px-6 sticky top-0 z-[100] shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
           <Link to="/" className="text-2xl font-[1000] tracking-[0.25em] text-slate-900 hover:text-secondary transition-all">ERAYA</Link>
           
           <div className="hidden md:flex items-center gap-8">
              {[
                { s: 1, label: 'Shipping' },
                { s: 2, label: 'Payment' },
                { s: 3, label: 'Review' }
              ].map((item) => (
                <div key={item.s} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-2xl flex items-center justify-center text-[10px] font-black transition-all border-2 ${
                    step >= item.s 
                      ? 'bg-secondary border-secondary text-white shadow-lg shadow-secondary/20' 
                      : 'bg-white border-slate-100 text-slate-300'
                  }`}>
                    {item.s}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${step >= item.s ? 'text-slate-900' : 'text-slate-300'}`}>
                    {item.label}
                  </span>
                  {item.s < 3 && <div className="w-8 h-[2px] bg-slate-100 mx-1" />}
                </div>
              ))}
           </div>

           <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-2xl border border-slate-100">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 hidden sm:inline">Encrypted Checkout</span>
           </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          {/* Shipping Section */}
          <section className={`bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all duration-500 ${step !== 1 ? 'opacity-40 scale-[0.98]' : ''}`}>
             <div className="flex justify-between items-center mb-10">
                <div>
                   <h3 className="text-xl font-black flex items-center gap-4 text-slate-900 tracking-tight">
                      <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center">
                         <MapPin className="w-6 h-6 text-secondary" />
                      </div>
                      1. Delivery Address
                   </h3>
                </div>
                {step > 1 && (
                  <button onClick={() => setStep(1)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-secondary hover:bg-secondary/10 transition-all border border-slate-100">
                     <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>
                )}
             </div>

             {step === 1 ? (
               <div className="space-y-8">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Shipping Details</label>
                    <textarea 
                      value={form.shipping_address}
                      onChange={(e) => {
                        setForm({...form, shipping_address: e.target.value});
                        if (errors.shipping_address) setErrors({...errors, shipping_address: null});
                      }}
                      className={`w-full bg-slate-50 border rounded-3xl p-6 text-sm font-bold outline-none transition-all resize-none ${errors.shipping_address ? 'border-red-200 ring-4 ring-red-50 text-red-900' : 'border-slate-100 focus:ring-4 focus:ring-secondary/10 focus:bg-white focus:border-secondary'}`}
                      rows={4}
                      placeholder="e.g. House 42, Road 7, Rupatoli, Barishal"
                    />
                    <AnimatePresence>
                      {errors.shipping_address && (
                        <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-3 flex items-center gap-2 px-1">
                          <Info className="w-3 h-3" /> {errors.shipping_address}
                        </motion.p>
                      )}
                    </AnimatePresence>
                 </div>
                 <button 
                   onClick={() => {
                     if (!form.shipping_address || form.shipping_address.trim().length < 5) {
                       setErrors({...errors, shipping_address: 'Please provide a valid delivery address'});
                       return;
                     }
                     setStep(2);
                   }} 
                   className="w-full sm:w-auto px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-secondary transition-all active:scale-95"
                 >
                   Continue to Payment
                 </button>
               </div>
             ) : (
               <div className="ml-16 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-slate-900 font-bold text-sm tracking-tight">{form.shipping_address}</p>
               </div>
             )}
          </section>

          {/* Payment Section */}
          <section className={`bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all duration-500 ${step < 2 ? 'opacity-30 pointer-events-none grayscale' : step > 2 ? 'opacity-40 scale-[0.98]' : ''}`}>
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-black flex items-center gap-4 text-slate-900 tracking-tight">
                   <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-secondary" />
                   </div>
                   2. Payment Method
                </h3>
                {step > 2 && (
                  <button onClick={() => setStep(2)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-secondary hover:bg-secondary/10 transition-all border border-slate-100">
                     <ChevronRight className="w-5 h-5 rotate-180" />
                  </button>
                )}
             </div>

             {step === 2 && (
               <div className="space-y-8">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <button 
                      onClick={() => setForm({...form, payment_method: 'bKash'})}
                      className={`relative p-8 border-2 rounded-[2rem] flex flex-col items-center gap-4 transition-all text-center group ${form.payment_method === 'bKash' ? 'border-[#D12053] bg-[#D12053]/5' : 'border-slate-50 bg-slate-50/50 hover:bg-slate-50'}`}
                    >
                       <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${form.payment_method === 'bKash' ? 'bg-white shadow-xl shadow-[#D12053]/20 scale-105' : 'bg-white text-slate-400 group-hover:text-[#D12053]'}`}>
                          <img src="https://www.logo.wine/a/logo/BKash/BKash-bKash-Logo.wine.svg" className="w-full h-full object-contain p-1" alt="bKash" />
                       </div>
                       <div>
                          <p className="font-black text-sm text-slate-900 mb-1">bKash Payment</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fast & Secure Mobile Pay</p>
                       </div>
                       {form.payment_method === 'bKash' && <div className="absolute top-4 right-4 w-4 h-4 bg-[#D12053] rounded-full border-2 border-white shadow-sm" />}
                    </button>
                    <button 
                      onClick={() => setForm({...form, payment_method: 'COD'})}
                      className={`relative p-8 border-2 rounded-[2rem] flex flex-col items-center gap-4 transition-all text-center group ${form.payment_method === 'COD' ? 'border-secondary bg-secondary/5' : 'border-slate-50 bg-slate-50/50 hover:bg-slate-50'}`}
                    >
                       <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${form.payment_method === 'COD' ? 'bg-secondary text-white shadow-xl shadow-secondary/20 scale-105' : 'bg-white text-slate-400 group-hover:text-slate-600'}`}>
                          <Truck className="w-8 h-8" />
                       </div>
                       <div>
                          <p className="font-black text-sm text-slate-900 mb-1">Cash on Delivery</p>
                          <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Pay at your doorstep</p>
                       </div>
                       {form.payment_method === 'COD' && <div className="absolute top-4 right-4 w-4 h-4 bg-secondary rounded-full border-2 border-white shadow-sm" />}
                    </button>
                 </div>
                 <button onClick={() => setStep(3)} className="w-full sm:w-auto px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-secondary transition-all active:scale-95">Continue to Review</button>
               </div>
             )}
             {step > 2 && (
               <div className="ml-16 flex items-center gap-4">
                  <div className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">{form.payment_method}</div>
                  <span className="text-slate-400 text-xs font-bold">Selected</span>
               </div>
             )}
          </section>

          {/* Review Section */}
          <section className={`bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all duration-500 ${step < 3 ? 'opacity-30' : ''}`}>
             <h3 className="text-xl font-black flex items-center gap-4 mb-10 text-slate-900 tracking-tight">
                <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center">
                   <CheckCircle className="w-6 h-6 text-secondary" />
                </div>
                3. Review Order
             </h3>
 
             {step === 3 && (
               <div className="space-y-8">
                 <div className="bg-slate-50 rounded-[2rem] border border-slate-100 overflow-hidden">
                     <div className="p-6 space-y-3">
                        {items.map((item) => {
                          const itemImageUrl = item.image_url || (item.images?.length > 0 ? (item.images.find(img => img.is_primary)?.image_url || item.images[0].image_url) : null);
                          return (
                            <Link 
                              key={item.id} 
                              to={`/products/${item.slug}`}
                              className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white transition-all border border-transparent hover:border-slate-100 group"
                            >
                               <div className="w-14 h-14 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 group-hover:scale-105 transition-transform">
                                  <img src={getImageUrl(itemImageUrl)} className="w-full h-full object-contain p-2" alt={item.name} />
                               </div>
                               <div className="flex-grow min-w-0">
                                  <p className="font-black text-[13px] text-slate-900 mb-0.5 leading-tight line-clamp-1">{item.name}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qty: {item.quantity}</p>
                               </div>
                               <div className="text-right flex flex-col items-end">
                                  <p className="text-sm font-black text-slate-900">৳{(item.base_price * item.quantity).toLocaleString()}</p>
                                  <p className="text-[9px] font-bold text-slate-400">৳{item.base_price.toLocaleString()} / item</p>
                               </div>
                            </Link>
                          );
                        })}
                    </div>
                 </div>
               </div>
             )}
          </section>
        </div>

        <aside className="lg:col-span-4">
          <div className="bg-white/80 backdrop-blur-2xl p-10 rounded-[3rem] border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] sticky top-32 overflow-hidden group">
             {/* Dynamic background element */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full -mr-32 -mt-32 blur-[100px] animate-pulse" />
             <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full -ml-24 -mb-24 blur-[80px]" />
             
             <div className="relative z-10">
               <div className="flex items-center justify-between mb-10">
                 <h4 className="font-black text-slate-900 uppercase tracking-[0.3em] text-[10px]">Order Summary</h4>
                 <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                    <ShoppingBag className="w-4 h-4 text-slate-400" />
                 </div>
               </div>
               
               {/* Item List Summary - Refined */}
               <div className="max-h-[180px] overflow-y-auto pr-2 mb-10 space-y-5 custom-scrollbar">
                  {items.map((item) => {
                    const itemImageUrl = item.image_url || (item.images?.length > 0 ? (item.images.find(img => img.is_primary)?.image_url || item.images[0].image_url) : null);
                    return (
                      <div key={item.id} className="flex items-center gap-5 group/mini transition-all hover:translate-x-1">
                        <div className="w-12 h-12 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 shadow-sm transition-all group-hover/mini:shadow-md">
                          <img src={getImageUrl(itemImageUrl)} className="w-full h-full object-contain p-1.5" alt={item.name} />
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="text-[11px] font-black text-slate-900 truncate leading-tight tracking-tight">{item.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                           <p className="text-xs font-black text-slate-900 tracking-tight">৳{(item.base_price * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
               </div>
               
               <div className="space-y-6 mb-10">
                  <div className="flex justify-between items-center group/price">
                     <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-slate-200 group-hover/price:bg-secondary transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Subtotal</span>
                     </div>
                     <span className="text-sm font-black text-slate-900 tracking-tight">৳{subtotal.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center group/price">
                     <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-slate-200 group-hover/price:bg-emerald-500 transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Shipping</span>
                     </div>
                     <span className={`text-[11px] font-black tracking-widest uppercase ${shipping === 0 ? 'text-emerald-500' : 'text-slate-900'}`}>
                        {shipping === 0 ? 'Complimentary' : `৳${shipping}`}
                     </span>
                  </div>

                  <div className="flex justify-between items-center group/price">
                     <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-slate-200 group-hover/price:bg-secondary transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Est. VAT</span>
                     </div>
                     <span className="text-sm font-black text-slate-900 tracking-tight">৳{tax.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>

                  <div className="pt-8 border-t border-slate-100 flex justify-between items-end">
                     <div className="space-y-1">
                        <span className="text-[10px] font-[1000] uppercase tracking-[0.3em] text-secondary">Total Amount</span>
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Awaiting Confirmation</span>
                        </div>
                     </div>
                     <div className="text-right">
                        <span className="text-4xl font-[1000] text-slate-900 tracking-tighter leading-none block">৳{total.toLocaleString()}</span>
                     </div>
                  </div>
               </div>

               <button 
                 disabled={step < 3 || loading}
                 onClick={handlePlaceOrder}
                 className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 shadow-2xl shadow-slate-900/20 hover:bg-secondary hover:shadow-secondary/30 hover:scale-[1.02] active:scale-95 transition-all duration-500 disabled:opacity-30 disabled:grayscale disabled:scale-100 group/btn overflow-hidden relative"
               >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="relative z-10">Confirm Purchase</span>
                      <ChevronRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-2 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-r from-secondary to-orange-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
                    </>
                  )}
               </button>

               <div className="mt-10 pt-8 border-t border-slate-50 flex flex-col items-center gap-6">
                  <div className="flex items-center gap-6">
                     <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Secure</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-slate-300" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Encrypted</span>
                     </div>
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold text-center leading-relaxed max-w-[200px]">By confirming purchase, you agree to the Eraya luxury commerce protocols.</p>
               </div>
             </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
