import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Star, Check, ChevronDown, Filter, X, ArrowRight, Heart, RefreshCcw } from 'lucide-react';
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
        className="flex items-center gap-3 px-5 py-2.5 glass-card-light rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white hover:border-white/20 transition-all min-w-[180px] justify-between"
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
            className="absolute right-0 mt-2 w-56 bg-[#1e293b] border border-white/[0.10] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] z-50 overflow-hidden p-1.5"
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
                    ? 'bg-indigo-500/20 text-indigo-300' 
                    : 'text-slate-400 hover:glass-card-light/[0.08] hover:text-white'
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
  const [loadingItemId, setLoadingItemId] = useState(null); // stores productId for Cart/Wishlist async actions
  
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

  const handleAddToCart = async (product) => {
    const role = user?.role?.toLowerCase();
    if (role === 'admin' || role === 'moderator') {
      toast.error('Management accounts cannot add items to cart');
      return;
    }
    setLoadingItemId(product.id);
    await new Promise(resolve => setTimeout(resolve, 500));
    addItem(product);
    setLoadingItemId(null);
    toast.success(`${product.name} added to cart`);
  };

  const getPrimaryImage = (images) => {
    if (!images || images.length === 0) return null;
    const primary = images.find((img) => img.is_primary) || images[0];
    return primary.image_url;
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-white/[0.06] py-5 pt-28">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
          <div className="flex justify-between items-end">
            <div>
              <p className="section-label mb-1">Browse</p>
              <h1 className="text-2xl font-black text-white tracking-tight">Eraya Collection</h1>
              <p className="text-slate-500 text-[9px] font-black mt-1 uppercase tracking-widest">{total} pieces available</p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Vault Live</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar */}
        <aside className="hidden lg:block w-60 shrink-0 space-y-10 sticky top-24 h-fit">
          <div className="space-y-4">
            <h4 className="section-label">Browse By</h4>
            <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`group w-full flex items-center justify-between p-2.5 rounded-xl transition-all duration-300 ${
                    activeCategoryIDs.includes(String(cat.id))
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'hover:glass-input text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-bold tracking-tight">{cat.name}</span>
                  {!activeCategoryIDs.includes(String(cat.id)) && (
                    <span className="text-[9px] font-black opacity-40">{cat.product_count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-white/[0.06]">
            <h4 className="section-label">Price Range</h4>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="MIN"
                className="glass-input text-xs py-2.5 px-3" />
              <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="MAX"
                className="glass-input text-xs py-2.5 px-3" />
            </div>
          </div>

          <button onClick={clearAllFilters}
            className="w-full py-3 text-[9px] font-black uppercase tracking-widest text-slate-500 border border-white/[0.08] rounded-xl hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-all">
            Clear Filters
          </button>
        </aside>

        {/* Product Grid */}
        <div className="flex-grow">
          <div className="flex justify-end mb-6">
            <SortDropdown value={sortBy} onChange={setSortBy} />
          </div>

          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center glass-card-light rounded-[48px] gap-6">
              <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] animate-pulse">Curating your collection...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-32 glass-card-light rounded-[48px]">
              <h3 className="text-xl font-black text-white mb-2">No results found</h3>
              <p className="text-slate-400 text-xs font-bold mb-8">Try adjusting your filters.</p>
              <button onClick={clearAllFilters} className="btn-primary">Reset All</button>
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
                    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden glass-card-light border border-white/[0.06] mb-4 transition-all duration-500 group-hover:shadow-[0_20px_40px_-10px_rgba(99,102,241,0.2)] group-hover:-translate-y-2 group-hover:border-indigo-500/20">
                      <Link to={`/products/${product.slug}`}>
                        <img
                          src={getImageUrl(getPrimaryImage(product.images))}
                          className="w-full h-full object-contain p-5 group-hover:scale-110 transition-transform duration-1000 ease-out"
                          alt={product.name}
                        />
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        {/* Stock Out Overlay */}
                        {product.stock_count <= 0 && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10 pointer-events-none">
                            <div className="badge-rose px-5 py-2 -rotate-12 text-xs font-black">Stock Out</div>
                          </div>
                        )}
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
                              setLoadingItemId(`wishlist-${product.id}`);
                              const added = await toggleWishlist(product, !!user);
                              setLoadingItemId(null);
                              if (added) toast.success('Added to Wishlist');
                              else toast.success('Removed from Wishlist');
                            }}
                            disabled={loadingItemId === `wishlist-${product.id}`}
                            className={`glass-card-light/80 backdrop-blur-md p-1.5 rounded-lg transition-all shadow-sm flex items-center justify-center min-w-[28px] min-h-[28px] ${
                              isInWishlist(product.id) ? 'text-amber-500 scale-110' : 'text-slate-400 hover:text-amber-500'
                            }`}
                          >
                             {loadingItemId === `wishlist-${product.id}` ? (
                               <RefreshCcw className="w-2.5 h-2.5 animate-spin" />
                             ) : (
                               <Star className={`w-3 h-3 ${isInWishlist(product.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                             )}
                          </button>
                        )}
                      </div>

                      {/* Interaction Actions */}
                      <div className="absolute bottom-5 left-5 right-5 flex gap-2 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700">
                        {!['admin', 'moderator'].includes(user?.role?.toLowerCase()) && (
                          <button
                            onClick={() => handleAddToCart(product)}
                            disabled={loadingItemId === product.id}
                            className="flex-grow bg-indigo-600 text-white h-10 rounded-xl flex items-center justify-center gap-2 font-black text-[8px] uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-[0_4px_20px_rgba(99,102,241,0.4)] active:scale-95 disabled:opacity-50"
                          >
                            {loadingItemId === product.id ? (
                              <RefreshCcw className="w-3 h-3 animate-spin" />
                            ) : (
                              <ShoppingCart className="w-3.5 h-3.5" />
                            )}
                            {loadingItemId === product.id ? 'Adding...' : 'Add To Bag'}
                          </button>
                        )}
                        <Link
                          to={`/products/${product.slug}`}
                          className="w-10 h-10 glass-card-light/10 backdrop-blur-md text-white rounded-xl flex items-center justify-center border border-white/20 hover:bg-indigo-500 hover:border-indigo-400 transition-all"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                      <div className="px-1 space-y-1.5">
                        <div className="flex justify-between items-start gap-3">
                          <Link to={`/products/${product.slug}`} className="flex-grow">
                            <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors text-sm leading-snug tracking-tight line-clamp-2">
                              {product.name}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-1 shrink-0 pt-0.5">
                            <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                            <span className="text-[9px] font-black text-slate-300">
                               {product.average_rating > 0 ? product.average_rating.toFixed(1) : '4.5'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-baseline gap-1.5">
                             <span className="text-base font-black text-white tracking-tighter">৳{product.base_price}</span>
                             {product.discount_price && (
                               <span className="text-slate-500 line-through text-[10px] font-bold">৳{product.discount_price}</span>
                             )}
                          </div>
                          <div className="w-0.5 h-0.5 rounded-full glass-card-light/20" />
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                             {product.categories?.[0]?.name || 'Essential'}
                          </span>
                        </div>
                      </div>

                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {total > limit && (
            <div className="flex justify-center gap-3 mt-20">
              <button
                onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={page === 1}
                className="btn-ghost text-[9px] py-3 px-6 disabled:opacity-20">
                Prev
              </button>
              <div className="flex items-center gap-2">
                {[...Array(Math.ceil(total / limit))].map((_, i) => (
                  <button key={i + 1}
                    onClick={() => { setPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`w-10 h-10 rounded-xl font-black text-[10px] transition-all ${
                      page === i + 1 ? 'bg-indigo-600 text-white shadow-[0_4px_20px_rgba(99,102,241,0.4)]' : 'glass-card-light text-slate-400 hover:text-white'
                    }`}>
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={page * limit >= total}
                className="btn-ghost text-[9px] py-3 px-6 disabled:opacity-20">
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
