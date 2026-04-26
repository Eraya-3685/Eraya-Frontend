import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Lock, Truck, CreditCard, 
  MapPin, ChevronRight, CheckCircle, ArrowLeft,
  ShoppingBag
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import api, { getImageUrl } from '../api/axios';
import toast from 'react-hot-toast';
import useDocumentTitle from '../hooks/useDocumentTitle';

const Checkout = () => {
  useDocumentTitle('Secure Checkout');
  const { items, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Guard: Must have phone and address to checkout
  React.useEffect(() => {
    if (user && (!user.phone || !user.address)) {
      toast.error('Please complete your profile before placing an order');
      navigate('/complete-profile');
    }
  }, [user, navigate]);

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    shipping_address: user?.address || '',
    payment_method: 'Credit Card',
  });

  const subtotal = items.reduce((sum, item) => sum + item.base_price * item.quantity, 0);
  const shipping = subtotal > 100 ? 0 : 15;
  const tax = subtotal * 0.05;
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

      await api.post('/orders', orderData);
      toast.success('Order placed successfully!');
      clearCart();
      navigate('/profile');
    } catch (error) {
      toast.error(error.response?.data || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <ShoppingBag className="w-16 h-16 text-slate-200 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Your cart is empty</h2>
        <Link to="/products" className="px-8 py-3 bg-secondary text-white rounded-xl font-bold">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 py-6 px-6 sticky top-0 z-[100] shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
           <Link to="/" className="text-2xl font-bold tracking-tighter text-slate-900">ERAYA</Link>
           
           <div className="hidden md:flex items-center gap-6">
              {[
                { s: 1, label: 'Shipping' },
                { s: 2, label: 'Payment' },
                { s: 3, label: 'Review' }
              ].map((item) => (
                <div key={item.s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step >= item.s ? 'bg-secondary text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {item.s}
                  </div>
                  <span className={`text-sm font-bold ${step >= item.s ? 'text-slate-900' : 'text-slate-400'}`}>
                    {item.label}
                  </span>
                  {item.s < 3 && <ChevronRight className="w-4 h-4 text-slate-300" />}
                </div>
              ))}
           </div>

           <div className="flex items-center gap-2 text-slate-400">
              <Lock className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Secure Checkout</span>
           </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-6">
          {/* Shipping Section */}
          <section className={`bg-white p-8 rounded-3xl border border-slate-100 shadow-sm transition-all ${step !== 1 ? 'opacity-50' : ''}`}>
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold flex items-center gap-3 text-slate-900">
                   <MapPin className="w-6 h-6 text-secondary" /> 1. Shipping Address
                </h3>
                {step > 1 && (
                  <button onClick={() => setStep(1)} className="text-xs font-bold text-secondary hover:underline uppercase tracking-widest">Edit</button>
                )}
             </div>

             {step === 1 ? (
               <div className="space-y-6">
                 <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="font-bold text-slate-700 text-sm mb-4">Full Delivery Address</p>
                    <textarea 
                      value={form.shipping_address}
                      onChange={(e) => {
                        setForm({...form, shipping_address: e.target.value});
                        if (errors.shipping_address) setErrors({...errors, shipping_address: null});
                      }}
                      className={`w-full bg-white border rounded-xl p-4 text-sm font-medium outline-none transition-all ${errors.shipping_address ? 'border-red-200 ring-2 ring-red-50' : 'border-slate-200 focus:ring-2 focus:ring-secondary'}`}
                      rows={3}
                      placeholder="e.g. Rupatoli, Barishal"
                    />
                    <AnimatePresence>
                      {errors.shipping_address && (
                        <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2 ml-1">
                          {errors.shipping_address}
                        </motion.p>
                      )}
                    </AnimatePresence>
                 </div>
                 <button 
                   onClick={() => {
                     if (!form.shipping_address || form.shipping_address.trim().length < 10) {
                       setErrors({...errors, shipping_address: 'Please enter a more detailed address (min 10 chars)'});
                       return;
                     }
                     setStep(2);
                   }} 
                   className="px-10 py-3 bg-secondary text-white rounded-xl font-bold text-sm shadow-lg shadow-secondary/10"
                 >
                   Continue to Payment
                 </button>
               </div>
             ) : (
               <p className="text-slate-600 font-medium ml-9">{form.shipping_address}</p>
             )}
          </section>

          {/* Payment Section */}
          <section className={`bg-white p-8 rounded-3xl border border-slate-100 shadow-sm transition-all ${step < 2 ? 'opacity-50 pointer-events-none' : step > 2 ? 'opacity-50' : ''}`}>
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold flex items-center gap-3 text-slate-900">
                   <CreditCard className="w-6 h-6 text-secondary" /> 2. Payment Method
                </h3>
                {step > 2 && (
                  <button onClick={() => setStep(2)} className="text-xs font-bold text-secondary hover:underline uppercase tracking-widest">Edit</button>
                )}
             </div>

             {step === 2 && (
               <div className="space-y-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={() => setForm({...form, payment_method: 'Credit Card'})}
                      className={`p-6 border-2 rounded-2xl flex items-center gap-3 transition-all ${form.payment_method === 'Credit Card' ? 'border-secondary bg-secondary/5' : 'border-slate-100'}`}
                    >
                       <CreditCard className={`w-8 h-8 ${form.payment_method === 'Credit Card' ? 'text-secondary' : 'text-slate-400'}`} />
                       <span className="font-bold text-sm">Credit / Debit Card</span>
                    </button>
                    <button 
                      onClick={() => setForm({...form, payment_method: 'COD'})}
                      className={`p-6 border-2 rounded-2xl flex flex-col items-center gap-3 transition-all ${form.payment_method === 'COD' ? 'border-secondary bg-secondary/5' : 'border-slate-100'}`}
                    >
                       <Truck className={`w-8 h-8 ${form.payment_method === 'COD' ? 'text-secondary' : 'text-slate-400'}`} />
                       <span className="font-bold text-sm">Cash on Delivery</span>
                    </button>
                 </div>
                 <button onClick={() => setStep(3)} className="px-10 py-3 bg-secondary text-white rounded-xl font-bold text-sm shadow-lg shadow-secondary/10">Continue to Review</button>
               </div>
             )}
             {step > 2 && (
               <p className="text-slate-600 font-medium ml-9">{form.payment_method}</p>
             )}
          </section>

          {/* Review Section */}
          <section className={`bg-white p-8 rounded-3xl border border-slate-100 shadow-sm transition-all ${step < 3 ? 'opacity-50' : ''}`}>
             <h3 className="text-xl font-bold flex items-center gap-3 mb-8 text-slate-900">
                <CheckCircle className="w-6 h-6 text-secondary" /> 3. Review & Place Order
             </h3>

             {step === 3 && (
               <div className="space-y-6">
                 <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                       <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Delivery by: {new Date(Date.now() + 3*24*60*60*1000).toLocaleDateString()}</p>
                       <Truck className="w-4 h-4 text-secondary" />
                    </div>
                    <div className="p-6 space-y-6">
                       {items.map((item) => (
                         <div key={item.id} className="flex gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100">
                               <img src={getImageUrl(item.image_url)} className="w-full h-full object-contain p-1" alt={item.name} />
                            </div>
                            <div className="flex-grow">
                               <p className="font-bold text-sm text-slate-900 line-clamp-1">{item.name}</p>
                               <p className="text-xs text-slate-500 mt-1">Quantity: {item.quantity}</p>
                               <p className="text-sm font-bold text-slate-900 mt-1">৳{item.base_price}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
               </div>
             )}
          </section>
        </div>

        <aside className="lg:col-span-4">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm sticky top-32">
             <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-widest text-xs">Order Summary</h4>
             <div className="space-y-4 text-sm font-medium mb-8">
                <div className="flex justify-between text-slate-500">
                   <span>Items ({items.length}):</span>
                   <span className="text-slate-900">৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                   <span>Shipping:</span>
                   <span className="text-emerald-600">{shipping === 0 ? 'FREE' : `৳${shipping}`}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                   <span>Estimated Tax:</span>
                   <span className="text-slate-900">৳{tax.toFixed(2)}</span>
                </div>
                <div className="h-px bg-slate-100 my-2" />
                <div className="flex justify-between text-2xl font-bold text-slate-900">
                   <span>Total:</span>
                   <span>৳{total.toLocaleString()}</span>
                </div>
             </div>

             <button 
               disabled={step < 3 || loading}
               onClick={handlePlaceOrder}
               className="w-full py-5 bg-secondary text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 group hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/10 disabled:opacity-50 disabled:grayscale"
             >
                {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : "Place Order"}
             </button>

             <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Secure Payment Guaranteed
             </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
