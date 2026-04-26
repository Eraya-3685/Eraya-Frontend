import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Star, Check, ChevronDown, Filter, X, ArrowRight, Heart } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import api, { getImageUrl } from '../api/axios';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import useWishlistStore from '../store/useWishlistStore';
import toast from 'react-hot-toast';
import { useDebounce } from '../hooks/useDebounce';
import useDocumentTitle from '../hooks/useDocumentTitle';

const SortDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = [
    { value: 'newest', label: 'Newest Arrivals' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
  ];

  const activeLabel = options.find(opt => opt.value === value)?.label;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-slate-400 transition-all shadow-sm min-w-[180px] justify-between"
      >
        <span>{activeLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden p-1.5"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
                  value === opt.value 
                    ? 'bg-slate-900 text-white' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {opt.label}
                {value === opt.value && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const debouncedMinPrice = useDebounce(minPrice, 500);
  const debouncedMaxPrice = useDebounce(maxPrice, 500);

  const limit = 12;
  const addItem = useCartStore((state) => state.addItem);
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  
  const query = searchParams.get('search') || '';
  const activeCategoryIDs = useMemo(() => searchParams.getAll('category'), [search]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, query, search, sortBy, debouncedMinPrice, debouncedMaxPrice]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error('Failed to fetch categories');
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `/products?page=${page}&limit=${limit}&search=${query}&sort=${sortBy}`;
      activeCategoryIDs.forEach(id => { url += `&category_id=${id}`; });
      if (debouncedMinPrice) url += `&min_price=${debouncedMinPrice}`;
      if (debouncedMaxPrice) url += `&max_price=${debouncedMaxPrice}`;
      
      const response = await api.get(url);
      setProducts(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch products', error);
      toast.error('Could not load products');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (id) => {
    const newParams = new URLSearchParams(search);
    const currentIDs = newParams.getAll('category');
    if (currentIDs.includes(String(id))) {
      const filtered = currentIDs.filter(cid => cid !== String(id));
      newParams.delete('category');
      filtered.forEach(cid => newParams.append('category', cid));
    } else {
      newParams.append('category', id);
    }
    newParams.set('page', '1');
    navigate(`/products?${newParams.toString()}`);
    setPage(1);
  };

  const clearAllFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    navigate('/products');
    setPage(1);
  };

  const handleAddToCart = (product) => {
    const role = user?.role?.toLowerCase();
    if (role === 'admin' || role === 'moderator') {
      toast.error('Management accounts cannot add items to cart');
      return;
    }
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  const getPrimaryImage = (images) => {
    if (!images || images.length === 0) return null;
    const primary = images.find((img) => img.is_primary) || images[0];
    return primary.image_url;
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="border-b border-slate-100 py-4 bg-slate-50/10">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Eraya Collection</h1>
              <p className="text-slate-400 text-[9px] font-black mt-0.5 uppercase tracking-widest">{total} pieces available</p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Vault Live</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar */}
        <aside className="hidden lg:block w-60 shrink-0 space-y-10 sticky top-24 h-fit">
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Browse By</h4>
            <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`group w-full flex items-center justify-between p-2.5 rounded-xl transition-all duration-300 ${
                    activeCategoryIDs.includes(String(cat.id))
                      ? 'bg-slate-900 text-white shadow-lg'
                      : 'hover:bg-slate-50 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span className="text-xs font-bold tracking-tight">{cat.name}</span>
                  {!activeCategoryIDs.includes(String(cat.id)) && (
                    <span className="text-[9px] font-black opacity-30">{cat.product_count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6 pt-8 border-t border-slate-100">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Price Range</h4>
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="number" 
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="MIN" 
                className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all" 
              />
              <input 
                type="number" 
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="MAX" 
                className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all" 
              />
            </div>
          </div>

          <button 
            onClick={clearAllFilters}
            className="w-full py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 border border-slate-100 rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
          >
            Clear Filters
          </button>
        </aside>

        {/* Product Grid */}
        <div className="flex-grow">
          <div className="flex justify-end mb-6">
            <SortDropdown value={sortBy} onChange={setSortBy} />
          </div>

          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center bg-[#fdfbf9] rounded-[48px] gap-6 border border-slate-100/50">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-secondary/10 border-t-secondary rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-[8px] font-black text-secondary tracking-tighter">ERAYA</span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Curating your collection...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-32 bg-slate-50/30 rounded-[48px] border-2 border-dashed border-slate-100">
              <h3 className="text-xl font-black text-slate-900 mb-2">No results found</h3>
              <p className="text-slate-400 text-xs font-bold mb-8">Try adjusting your filters.</p>
              <button onClick={clearAllFilters} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-primary transition-all">Reset All</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-x-5 gap-y-10">
              <AnimatePresence mode="popLayout">
                {products.map((product, i) => (
                  <motion.div
                    layout
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5, delay: i * 0.03 }}
                    className="group flex flex-col relative"
                  >
                    {/* Image Container - The Centerpiece */}
                    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-slate-50/50 mb-4 transition-all duration-700 group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] group-hover:-translate-y-1.5">
                      <Link to={`/products/${product.slug}`}>
                        <img
                          src={getImageUrl(getPrimaryImage(product.images))}
                          className="w-full h-full object-contain p-5 group-hover:scale-110 transition-transform duration-1000 ease-out"
                          alt={product.name}
                        />
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </Link>

                      {/* Top Badges */}
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                        {product.discount_price && product.base_price > product.discount_price ? (
                          <div className="bg-red-500 text-white px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20">
                            -{Math.round(((product.base_price - product.discount_price) / product.base_price) * 100)}%
                          </div>
                        ) : <div />}
                        
                        {!['admin', 'moderator'].includes(user?.role?.toLowerCase()) && (
                          <button 
                            onClick={async (e) => {
                              e.preventDefault();
                              if (!user) {
                                toast.error('Please login to add items to wishlist');
                                navigate('/login');
                                return;
                              }
                              const added = await toggleWishlist(product, !!user);
                              if (added) toast.success('Added to Wishlist');
                              else toast.success('Removed from Wishlist');
                            }}
                            className={`bg-white/80 backdrop-blur-md p-1.5 rounded-lg transition-all shadow-sm ${
                              isInWishlist(product.id) ? 'text-amber-500 scale-110' : 'text-slate-400 hover:text-amber-500'
                            }`}
                          >
                             <Star className={`w-3 h-3 ${isInWishlist(product.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                          </button>
                        )}
                      </div>

                      {/* Interaction Actions */}
                      <div className="absolute bottom-5 left-5 right-5 flex gap-2 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700">
                        {!['admin', 'moderator'].includes(user?.role?.toLowerCase()) && (
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="flex-grow bg-slate-900 text-white h-10 rounded-xl flex items-center justify-center gap-2 font-black text-[8px] uppercase tracking-widest hover:bg-primary transition-all shadow-xl active:scale-95"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            Add To Bag
                          </button>
                        )}
                        <Link
                          to={`/products/${product.slug}`}
                          className="w-10 h-10 bg-white text-slate-900 rounded-xl flex items-center justify-center shadow-xl hover:bg-primary hover:text-white transition-all"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    {/* Product Info - Minimalist & Balanced */}
                    <div className="px-1 space-y-1.5">
                      <div className="flex justify-between items-start gap-3">
                        <Link to={`/products/${product.slug}`} className="flex-grow">
                          <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors text-sm leading-snug tracking-tight line-clamp-2">
                            {product.name}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-1 shrink-0 pt-0.5">
                          <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-[9px] font-black text-slate-900">
                             {product.average_rating > 0 ? product.average_rating.toFixed(1) : '4.5'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-baseline gap-1.5">
                           <span className="text-base font-black text-slate-900 tracking-tighter">৳{product.base_price}</span>
                           {product.discount_price && (
                             <span className="text-slate-300 line-through text-[10px] font-bold opacity-60">৳{product.discount_price}</span>
                           )}
                        </div>
                        <div className="w-0.5 h-0.5 rounded-full bg-slate-100" />
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                           {product.categories?.[0]?.name || 'Essential'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Pagination */}
          {total > limit && (
            <div className="flex justify-center gap-3 mt-24">
              <button
                onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={page === 1}
                className="px-6 py-3 bg-white border border-slate-100 rounded-xl font-black text-[9px] uppercase tracking-widest text-slate-400 disabled:opacity-20 hover:border-slate-300 transition-all shadow-sm"
              >
                Prev
              </button>
              <div className="flex items-center gap-2">
                {[...Array(Math.ceil(total / limit))].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => { setPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`w-10 h-10 rounded-xl font-black text-[10px] transition-all ${
                      page === i + 1 ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'bg-white border border-slate-100 text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={page * limit >= total}
                className="px-6 py-3 bg-white border border-slate-100 rounded-xl font-black text-[9px] uppercase tracking-widest text-slate-400 disabled:opacity-20 hover:border-slate-300 transition-all shadow-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
      `}} />
    </div>
  );
};

export default Products;
