import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Truck, Star, X, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import api, { getImageUrl } from '../api/axios';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useSettingsStore from '../store/useSettingsStore';

const Cart = () => {
  useDocumentTitle('Your Shopping Cart');
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const { settings, fetchSettings } = useSettingsStore();
  const navigate = useNavigate();
  const [itemToRemove, setItemToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    fetchSettings();
    if (user?.role === 'admin') {
      navigate('/');
    }
  }, [user, navigate, fetchSettings]);

  const subtotal = items.reduce((sum, item) => sum + item.base_price * item.quantity, 0);
  const shipping = subtotal >= settings.free_shipping_threshold ? 0 : settings.standard_delivery_fee;
  const total = subtotal + shipping;

  const confirmRemove = async () => {
    if (itemToRemove) {
      setIsRemoving(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      removeItem(itemToRemove.id);
      setIsRemoving(false);
      setItemToRemove(null);
    }
  };

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
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 md:px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left: Cart Items */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Shopping Cart ({items.length} items)</h1>
            <button
              onClick={() => setShowClearModal(true)}
              className="text-sm font-bold text-red-500 hover:underline flex items-center gap-2"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-6">
            <AnimatePresence>
              {items.map((item) => {
                const itemImageUrl = item.image_url || (item.images?.length > 0 ? (item.images.find(img => img.is_primary)?.image_url || item.images[0].image_url) : null);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-4 pb-4 border-b border-slate-50 group"
                  >
                    {/* Smaller compact image */}
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100 group-hover:scale-105 transition-transform">
                      <img src={getImageUrl(itemImageUrl)} className="w-full h-full object-contain p-2" alt={item.name} />
                    </div>

                    <div className="flex-grow flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-grow">
                        <Link to={`/products/${item.slug}`} className="text-sm font-black text-slate-900 hover:text-secondary transition-colors line-clamp-1 leading-tight mb-1 block">{item.name}</Link>
                        <div className="flex items-center gap-3">
                          <p className="text-xs font-black text-slate-900">৳{item.base_price.toLocaleString()}</p>
                          <div className="w-1 h-1 bg-slate-200 rounded-full" />
                          <button
                            onClick={() => setItemToRemove(item)}
                            className="text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Compact Quantity Control */}
                        <div className="flex items-center bg-slate-50 rounded-xl border border-slate-100 overflow-hidden h-9">
                          <button
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="px-2 hover:bg-slate-200 transition-colors"
                          >
                            <Minus className="w-3 h-3 text-slate-600" />
                          </button>
                          <span className="w-8 text-center font-black text-xs text-slate-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2 hover:bg-slate-200 transition-colors"
                          >
                            <Plus className="w-3 h-3 text-slate-600" />
                          </button>
                        </div>

                        <div className="text-right min-w-[80px]">
                          <p className="text-sm font-[1000] text-slate-900 tracking-tight">৳{(item.base_price * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-6 tracking-tight">Order Summary</h3>

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
              <div className="flex justify-between text-xl font-black text-slate-900 tracking-tighter">
                <span>Total</span>
                <span>৳{total.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-3 bg-secondary text-white rounded-xl font-bold text-base hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/10 flex items-center justify-center gap-2"
            >
              Checkout Now
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl text-white relative overflow-hidden">
            <div className="relative z-10">
              <Truck className="w-8 h-8 text-secondary mb-4" />
              <h3 className="text-lg font-bold mb-2">Fast Delivery</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">Free express delivery on all orders above ৳{settings.free_shipping_threshold}. Securely packed and tracked.</p>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl" />
          </div>
        </div>

      </div>

      {/* Remove Confirmation Modal */}
      <AnimatePresence>
        {itemToRemove && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setItemToRemove(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2rem] p-8 shadow-2xl border border-slate-100"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Remove Item?</h3>
              <p className="text-slate-500 text-center text-sm mb-8">
                Are you sure you want to remove <span className="font-bold text-slate-900">"{itemToRemove.name}"</span> from your shopping cart?
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setItemToRemove(null)}
                  className="py-3.5 px-6 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemove}
                  disabled={isRemoving}
                  className="py-3.5 px-6 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-200 flex items-center justify-center disabled:opacity-50"
                >
                  {isRemoving ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : 'Remove'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clear All Confirmation Modal */}
      <AnimatePresence>
        {showClearModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClearModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2rem] p-8 shadow-2xl border border-slate-100"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Clear Cart?</h3>
              <p className="text-slate-500 text-center text-sm mb-8">
                Are you sure you want to remove all items from your shopping cart? This action cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowClearModal(false)}
                  className="py-3.5 px-6 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setIsClearing(true);
                    await new Promise(resolve => setTimeout(resolve, 800));
                    clearCart();
                    setIsClearing(false);
                    setShowClearModal(false);
                  }}
                  disabled={isClearing}
                  className="py-3.5 px-6 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-200 flex items-center justify-center disabled:opacity-50"
                >
                  {isClearing ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : 'Yes, Clear'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Cart;
