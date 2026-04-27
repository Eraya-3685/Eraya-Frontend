import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Trash2, ShoppingCart, ArrowRight, ShoppingBag, AlertCircle, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import useWishlistStore from '../store/useWishlistStore';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import api, { getImageUrl } from '../api/axios';
import toast from 'react-hot-toast';
import useDocumentTitle from '../hooks/useDocumentTitle';
import ConfirmModal from '../components/ConfirmModal';



const Wishlist = () => {
  useDocumentTitle('My Wishlist');
  const { items, toggleWishlist, clearWishlist, syncWishlist } = useWishlistStore();
  const { user } = useAuthStore();
  const addItem = useCartStore((state) => state.addItem);
  
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    refreshWishlistStock();
  }, []);

  const refreshWishlistStock = async () => {
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
      if (syncWishlist) syncWishlist(updatedItems);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddToCart = (product) => {
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  const getPrimaryImage = (images) => {
    if (!images || images.length === 0) return null;
    const primary = images.find((img) => img.is_primary) || images[0];
    return primary.image_url;
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 pt-16 pb-20 px-6">
        <div className="max-w-xl mx-auto bg-white p-12 text-center rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <Star className="w-10 h-10 text-amber-200" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Your Wishlist is Empty</h1>
          <p className="text-slate-500 mb-10 text-sm font-medium leading-relaxed">
            Looks like you haven't saved any pieces yet. Browse our collection to find something you love.
          </p>
          <Link 
            to="/products" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-secondary transition-all shadow-xl shadow-slate-200"
          >
            Explore Collection <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-12 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-16 border-b border-slate-200/60 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                My Wishlist
              </h1>
              <span className="text-[10px] font-black bg-slate-900 text-white px-3 py-1 rounded-lg uppercase tracking-widest flex items-center gap-1.5">
                {items.length} <span className="opacity-60 font-bold">{items.length === 1 ? 'Item' : 'Items'}</span>
              </span>
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Your Curated Selection</p>
          </div>
          <button 
            onClick={() => setIsClearing(true)}
            className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] hover:text-red-600 transition-colors bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm"
          >
            Clear All Items
          </button>
        </div>

        {/* Dense Grid with Smaller Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
          <AnimatePresence mode="popLayout">
            {items.map((product) => (
              <motion.div
                layout
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group bg-white rounded-[2rem] border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 flex flex-col"
              >
                  <div className="relative aspect-square bg-slate-50/50 overflow-hidden">
                    <Link to={`/products/${product.slug}`}>
                      <img 
                        src={getImageUrl(getPrimaryImage(product.images))} 
                        className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-700"
                        alt={product.name} 
                      />
                    </Link>
                    {product.stock_count <= 0 && (
                      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-10 pointer-events-none">
                        <div className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-black/20 transform -rotate-12 border border-white/20">
                          Stock Out
                        </div>
                      </div>
                    )}
                    <button 
                      onClick={() => setItemToDelete(product)}
                      className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-md rounded-lg flex items-center justify-center text-red-500 shadow-sm hover:bg-white transition-all active:scale-90 z-20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                <div className="p-4 flex flex-col flex-grow">
                  <Link to={`/products/${product.slug}`}>
                    <h3 className="font-bold text-slate-900 text-xs mb-1 truncate group-hover:text-secondary transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-sm font-black text-slate-900 tracking-tighter mb-4">৳{product.base_price.toLocaleString()}</p>
                  
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock_count <= 0}
                      className="flex-grow py-2.5 bg-slate-900 text-white rounded-lg font-bold text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-secondary transition-all active:scale-95 shadow-lg shadow-slate-100 disabled:opacity-50"
                    >
                      <ShoppingBag className="w-2.5 h-2.5" /> {product.stock_count <= 0 ? 'Out of Stock' : 'Add'}
                    </button>
                    <Link
                      to={`/products/${product.slug}`}
                      className="w-9 h-9 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center hover:bg-white hover:text-slate-900 border border-slate-50 transition-all"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        loading={isDeletingItem}
        onConfirm={async () => {
          setIsDeletingItem(true);
          await new Promise(resolve => setTimeout(resolve, 800));
          toggleWishlist(itemToDelete, !!user);
          setIsDeletingItem(false);
          setItemToDelete(null);
        }}
        title="Remove Item?"
        message={`Are you sure you want to remove "${itemToDelete?.name}" from your wishlist?`}
      />

      <ConfirmModal
        isOpen={isClearing}
        onClose={() => setIsClearing(false)}
        loading={isClearingAll}
        onConfirm={async () => {
          setIsClearingAll(true);
          await new Promise(resolve => setTimeout(resolve, 800));
          clearWishlist();
          setIsClearingAll(false);
          setIsClearing(false);
        }}
        title="Clear All Items?"
        message="Are you sure you want to remove all items from your wishlist? This action cannot be undone."
      />
    </div>
  );
};

export default Wishlist;
