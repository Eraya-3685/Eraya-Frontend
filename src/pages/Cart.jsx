import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Truck, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import api, { getImageUrl } from '../api/axios';
import useDocumentTitle from '../hooks/useDocumentTitle';

const Cart = () => {
  useDocumentTitle('Your Shopping Cart');
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const subtotal = items.reduce((sum, item) => sum + item.base_price * item.quantity, 0);
  const shipping = subtotal > 100 ? 0 : 15;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 pt-40 pb-20 px-6">
        <div className="max-w-xl mx-auto bg-white p-12 text-center rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <ShoppingBag className="w-10 h-10 text-slate-300" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Your cart is empty</h1>
          <p className="text-slate-500 mb-10">Looks like you haven't added anything to your cart yet.</p>
          <div className="flex flex-col gap-4">
            <Link to="/products" className="w-full py-4 bg-secondary text-white rounded-xl font-bold hover:bg-secondary/90 transition-all">Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-4 md:px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Cart Items */}
        <div className="lg:col-span-8 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
            <h1 className="text-2xl font-bold text-slate-900">Shopping Cart ({items.length} items)</h1>
            <button onClick={clearCart} className="text-sm font-bold text-red-500 hover:underline">Clear All</button>
          </div>

          <div className="space-y-6">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col md:flex-row gap-6 pb-6 border-b border-slate-50"
                >
                  <div className="w-full md:w-32 aspect-square bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100">
                    <img src={getImageUrl(item.image_url)} className="w-full h-full object-contain p-2" alt={item.name} />
                  </div>

                  <div className="flex-grow flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <Link to={`/products/${item.slug}`} className="text-lg font-bold text-slate-900 hover:text-secondary transition-colors line-clamp-1">{item.name}</Link>
                      <p className="text-xl font-bold text-slate-900">৳{(item.base_price * item.quantity).toLocaleString()}</p>
                    </div>
                    
                    <p className="text-xs font-bold text-emerald-600 mb-4 uppercase tracking-widest">In Stock</p>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                        <button 
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="p-2 hover:bg-slate-200 transition-colors"
                        >
                          <Minus className="w-4 h-4 text-slate-600" />
                        </button>
                        <span className="w-10 text-center font-bold text-sm text-slate-900">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2 hover:bg-slate-200 transition-colors"
                        >
                          <Plus className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>

                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-all uppercase tracking-widest"
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-8">Order Summary</h3>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Subtotal</span>
                 <span className="font-bold text-slate-900">৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Shipping</span>
                 <span className="font-bold text-emerald-600">{shipping === 0 ? 'FREE' : `৳${shipping}`}</span>
              </div>
              <div className="h-px bg-slate-100 my-4" />
              <div className="flex justify-between text-2xl font-bold text-slate-900">
                <span>Total</span>
                 <span>৳{total.toLocaleString()}</span>
              </div>
            </div>

            <button 
              onClick={() => navigate('/checkout')}
              className="w-full py-4 bg-secondary text-white rounded-xl font-bold text-lg hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/10 flex items-center justify-center gap-2"
            >
              Checkout Now
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden">
             <div className="relative z-10">
               <Truck className="w-8 h-8 text-secondary mb-4" />
               <h3 className="text-lg font-bold mb-2">Fast Delivery</h3>
               <p className="text-xs text-slate-400 leading-relaxed font-medium">Free express delivery on all orders above ৳500. Securely packed and tracked.</p>
             </div>
             <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Cart;
