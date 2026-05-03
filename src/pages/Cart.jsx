import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Truck, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import api, { getImageUrl } from '../api/axios';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useSettingsStore from '../store/useSettingsStore';
import ConfirmModal from '../components/ConfirmModal';
import { RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const Cart = () => {
  useDocumentTitle('Your Shopping Cart');
  const { items, removeItem, updateQuantity, clearCart, syncItems } = useCartStore();
  const { user } = useAuthStore();
  const { settings, fetchSettings } = useSettingsStore();
  const navigate = useNavigate();
  const [itemToRemove, setItemToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchSettings();
    if (user?.role === 'admin') navigate('/');
    refreshCartStock();
  }, [user, navigate, fetchSettings]);

  const refreshCartStock = async () => {
    if (items.length === 0) return;
    setIsRefreshing(true);
    try {
      const updatedItems = await Promise.all(
        items.map(async (item) => {
          try {
            const res = await api.get(`/products/${item.slug}`);
            return { ...item, stock_count: res.data.stock_count };
          } catch { return item; }
        })
      );
      syncItems(updatedItems);
    } finally { setIsRefreshing(false); }
  };

  const subtotal = items.reduce((sum, item) => sum + item.base_price * item.quantity, 0);
  const shipping = subtotal >= settings.free_shipping_threshold ? 0 : settings.standard_delivery_fee;
  const total = subtotal + shipping;

  const confirmRemove = async () => {
    if (itemToRemove) {
      setIsRemoving(true);
      await new Promise(r => setTimeout(r, 800));
      removeItem(itemToRemove.id);
      setIsRemoving(false);
      setItemToRemove(null);
    }
  };

  const handleUpdateQuantity = (item, newQty) => {
    if (newQty > item.stock_count) { toast.error(`Only ${item.stock_count} units available`); return; }
    if (newQty <= 0) { setItemToRemove(item); return; }
    updateQuantity(item.id, newQty);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-40 pb-20 px-6 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-16 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-indigo-500/20">
            <ShoppingBag className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">Cart is Empty</h1>
          <p className="text-slate-400 mb-10 font-medium">You haven't added anything yet.</p>
          <Link to="/products" className="btn-primary inline-flex items-center gap-2">
            Start Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-16 px-4 md:px-6">
      {/* Ambient */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <p className="section-label mb-2">Review</p>
          <h1 className="text-4xl font-black text-white tracking-tight">Shopping Cart
            <span className="ml-3 text-lg font-bold text-slate-500">({items.length} items)</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Items */}
          <div className="lg:col-span-8 glass-card p-8">
            <div className="flex justify-between items-center mb-8 pb-5 border-b border-white/[0.06]">
              <h2 className="font-black text-white text-sm uppercase tracking-widest">Items</h2>
              <button onClick={() => setShowClearModal(true)}
                className="text-xs font-black text-rose-400 hover:text-rose-300 uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                <X className="w-3.5 h-3.5" /> Clear All
              </button>
            </div>

            <div className="space-y-6">
              <AnimatePresence>
                {items.map((item) => {
                  const img = item.image_url || item.images?.[0]?.image_url;
                  return (
                    <motion.div key={item.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                      className="flex items-center gap-5 pb-6 border-b border-white/[0.04] last:border-0 last:pb-0 group">
                      <div className="w-18 h-18 shrink-0 w-[72px] h-[72px] glass-card-light rounded-2xl overflow-hidden border border-white/[0.08] group-hover:border-indigo-500/30 transition-colors relative">
                        <img src={getImageUrl(img)} className="w-full h-full object-contain p-2" alt={item.name} />
                        {item.stock_count <= 0 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-[8px] font-black text-rose-300 uppercase -rotate-12">Out</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-grow flex items-center justify-between gap-4 min-w-0">
                        <div className="min-w-0">
                          <Link to={`/products/${item.slug}`}
                            className="text-sm font-black text-white hover:text-indigo-300 transition-colors line-clamp-1 mb-1 block">
                            {item.name}
                          </Link>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-indigo-300">৳{item.base_price.toLocaleString()}</span>
                            {item.stock_count <= 0
                              ? <span className="text-[10px] font-black text-rose-400 uppercase">Stock Out</span>
                              : <button onClick={() => setItemToRemove(item)}
                                  className="text-[10px] font-black text-slate-500 hover:text-rose-400 transition-colors uppercase tracking-widest">
                                  Remove
                                </button>}
                          </div>
                        </div>

                        <div className="flex items-center gap-5 shrink-0">
                          <div className="flex items-center glass-input border border-white/[0.10] rounded-xl overflow-hidden">
                            <button onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                              disabled={item.stock_count <= 0}
                              className="px-3 py-2.5 hover:glass-card-light/[0.08] transition-colors disabled:opacity-30 text-slate-400 hover:text-white">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center font-black text-xs text-white">{item.quantity}</span>
                            <button onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                              disabled={item.stock_count <= 0}
                              className="px-3 py-2.5 hover:glass-card-light/[0.08] transition-colors disabled:opacity-30 text-slate-400 hover:text-white">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-sm font-black text-white min-w-[70px] text-right">
                            ৳{(item.base_price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-4 space-y-5">
            <div className="glass-card p-7">
              <h3 className="font-black text-white text-sm uppercase tracking-widest mb-7 pb-5 border-b border-white/[0.06]">
                Order Summary
              </h3>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium text-sm">Subtotal</span>
                  <span className="font-black text-white text-sm">৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium text-sm">Shipping</span>
                  <span className={`font-black text-sm ${shipping === 0 ? 'text-emerald-400' : 'text-white'}`}>
                    {shipping === 0 ? 'FREE' : `৳${shipping}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-[10px] text-indigo-400 font-bold">
                    Add ৳{(settings.free_shipping_threshold - subtotal).toLocaleString()} more for free shipping
                  </p>
                )}
                <div className="glow-divider" />
                <div className="flex justify-between">
                  <span className="font-black text-white">Total</span>
                  <span className="text-2xl font-black text-white">৳{total.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={async () => {
                  if (items.some(i => i.stock_count <= 0)) { toast.error('Remove out of stock items first'); return; }
                  if (!user?.id) { toast.error('Please login first'); navigate('/login', { state: { from: '/checkout' } }); return; }
                  setIsNavigating(true);
                  await new Promise(r => setTimeout(r, 500));
                  navigate('/checkout');
                }}
                disabled={isNavigating || items.some(i => i.stock_count <= 0)}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none">
                {isNavigating ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <>Checkout Now <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>

            <div className="glass-card-light p-6 border border-indigo-500/20">
              <div className="flex items-center gap-3 mb-3">
                <Truck className="w-5 h-5 text-indigo-400" />
                <span className="font-black text-white text-sm">Fast Delivery</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Free express delivery on all orders above ৳{settings.free_shipping_threshold}. Securely packed and tracked.
              </p>
            </div>

            <div className="glass-card-light p-6 border border-emerald-500/20">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="font-black text-white text-sm">Secure Checkout</p>
                  <p className="text-xs text-slate-400">256-bit SSL encrypted</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal isOpen={!!itemToRemove} onClose={() => setItemToRemove(null)}
        onConfirm={confirmRemove} loading={isRemoving}
        title="Remove Item?" message={`Remove "${itemToRemove?.name}" from cart?`} />
      <ConfirmModal isOpen={showClearModal} onClose={() => setShowClearModal(false)}
        onConfirm={async () => { setIsClearing(true); await new Promise(r => setTimeout(r, 800)); clearCart(); setIsClearing(false); setShowClearModal(false); }}
        loading={isClearing} title="Clear Cart?" message="Remove all items from your cart?" />
    </div>
  );
};

export default Cart;
