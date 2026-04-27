import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Truck, Star, X, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import api, { getImageUrl } from '../api/axios';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useSettingsStore from '../store/useSettingsStore';
import ConfirmModal from '../components/ConfirmModal';
import { RefreshCcw } from 'lucide-react';

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
    if (user?.role === 'admin') {
      navigate('/');
    }
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
          } catch (err) {
            return item;
          }
        })
      );
      syncItems(updatedItems);
    } finally {
      setIsRefreshing(false);
    }
  };

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

  const handleUpdateQuantity = (item, newQty) => {
    if (newQty > item.stock_count) {
      toast.error(`Only ${item.stock_count} units available in stock`);
      return;
    }
    
    if (newQty <= 0) {
      setItemToRemove(item);
      return;
    }
    
    updateQuantity(item.id, newQty);
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
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100 group-hover:scale-105 transition-transform relative">
                      <img src={getImageUrl(itemImageUrl)} className="w-full h-full object-contain p-2" alt={item.name} />
                      {item.stock_count <= 0 && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 pointer-events-none">
                          <span className="bg-slate-900 text-white text-[6px] font-black uppercase px-2 py-1 rounded-full transform -rotate-12">Stock Out</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-grow flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-grow">
                        <Link to={`/products/${item.slug}`} className="text-sm font-black text-slate-900 hover:text-secondary transition-colors line-clamp-1 leading-tight mb-1 block">{item.name}</Link>
                        <div className="flex items-center gap-3">
                          <p className="text-xs font-black text-slate-900">৳{item.base_price.toLocaleString()}</p>
                          <div className="w-1 h-1 bg-slate-200 rounded-full" />
                          {item.stock_count <= 0 ? (
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Stock Out</span>
                          ) : (
                            <button
                              onClick={() => setItemToRemove(item)}
                              className="text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Compact Quantity Control */}
                        <div className="flex items-center bg-slate-50 rounded-xl border border-slate-100 overflow-hidden h-9">
                          <button
                            onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                            disabled={item.stock_count <= 0}
                            className="px-2 hover:bg-slate-200 transition-colors disabled:opacity-30"
                          >
                            <Minus className="w-3 h-3 text-slate-600" />
                          </button>
                          <span className="w-8 text-center font-black text-xs text-slate-900">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                            disabled={item.stock_count <= 0}
                            className="px-2 hover:bg-slate-200 transition-colors disabled:opacity-30"
                          >
                            <Plus className="w-3 h-3 text-slate-600" />
                          </button>
                        </div>
                        {item.stock_count <= 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black uppercase px-2 py-1 rounded-full shadow-lg border border-white z-10">
                            Out of Stock
                          </span>
                        )}

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
              onClick={async () => {
                const outOfStockItems = items.filter(item => item.stock_count <= 0);
                if (outOfStockItems.length > 0) {
                  toast.error('Please remove out of stock items before checkout');
                  return;
                }
                setIsNavigating(true);
                await new Promise(resolve => setTimeout(resolve, 500));
                navigate('/checkout');
              }}
              disabled={isNavigating || items.some(i => i.stock_count <= 0)}
              className="w-full py-3 bg-secondary text-white rounded-xl font-bold text-base hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/10 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isNavigating ? <RefreshCcw className="w-4 h-4 animate-spin" /> : 'Checkout Now'}
              {!isNavigating && <ArrowRight className="w-4 h-4" />}
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

      <ConfirmModal 
        isOpen={!!itemToRemove}
        onClose={() => setItemToRemove(null)}
        onConfirm={confirmRemove}
        loading={isRemoving}
        title="Remove Item?"
        message={`Are you sure you want to remove "${itemToRemove?.name}" from your shopping cart?`}
      />

      <ConfirmModal 
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={async () => {
          setIsClearing(true);
          await new Promise(resolve => setTimeout(resolve, 800));
          clearCart();
          setIsClearing(false);
          setShowClearModal(false);
        }}
        loading={isClearing}
        title="Clear Cart?"
        message="Are you sure you want to remove all items from your shopping cart? This action cannot be undone."
      />
    </div>
  );
};

export default Cart;
