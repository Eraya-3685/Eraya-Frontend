import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowRight, Star, Truck, ShieldCheck, Globe, Tag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../api/axios';
import toast from 'react-hot-toast';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Logo from '../components/Logo';
import useSettingsStore from '../store/useSettingsStore';

const Home = () => {
  useDocumentTitle('Premium Lifestyle & Aesthetics');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const addToCart = useCartStore((state) => state.addItem);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { settings, fetchSettings } = useSettingsStore();

  const getPrimaryImage = (images) => {
    if (!images || images.length === 0) return null;
    const primary = images.find((img) => img.is_primary) || images[0];
    return primary.image_url;
  };

  useEffect(() => {
    fetchSettings();
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get('/products?page=1&limit=8'),
          api.get('/categories'),
        ]);
        setProducts(productsRes.data.data || []);
        setCategories(categoriesRes.data || []);
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fetchSettings]);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (products.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % Math.min(products.length, 5));
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [products]);

  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);

  useEffect(() => {
    if (categories.length > 0) {
      const timer = setInterval(() => {
        setCurrentCategoryIndex((prev) => (prev + 1) % Math.min(categories.length, 6));
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [categories]);

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    const role = user?.role?.toLowerCase();
    if (role === 'admin' || role === 'moderator') {
      toast.error('Management accounts cannot add items to cart');
      return;
    }
    
    // Normalize image_url for the cart
    const cartProduct = {
      ...product,
      image_url: getPrimaryImage(product.images)
    };
    
    addToCart(cartProduct);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="bg-transparent">
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden bg-[#fdfbf9]">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/5 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2" />

        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Side: Content */}
            <div className="lg:col-span-5 space-y-10">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm">
                  <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Arrivals 2026</span>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
                  Eraya <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-secondary/60">Aesthetics.</span>
                </h1>
                
                <p className="text-lg text-slate-500 leading-relaxed max-w-md">
                  Experience a new standard of premium lifestyle. Discover curated products that sparkle with confidence.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <button 
                    onClick={() => navigate('/products')}
                    className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-secondary transition-all flex items-center gap-3 group active:scale-95"
                  >
                    Shop Collection
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>

              {/* Stats/Social Trust */}
              <div className="flex items-center gap-8 pt-8 border-t border-slate-100">
                <div>
                  <p className="text-2xl font-black text-slate-900">12k+</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Buyers</p>
                </div>
                <div className="w-[1px] h-10 bg-slate-100" />
                <div>
                  <p className="text-2xl font-black text-slate-900">4.9/5</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">User Rating</p>
                </div>
              </div>
            </div>

            {/* Right Side: Aesthetic Slider */}
            <div className="lg:col-span-7 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[500px] aspect-[4/5]">
                {/* Decorative Frames */}
                <div className="absolute inset-4 border border-slate-200 rounded-[3rem] rotate-3 z-0" />
                <div className="absolute inset-4 border border-secondary/20 rounded-[3rem] -rotate-3 z-0" />
                
                <div className="relative w-full h-full bg-white rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.12)] border border-slate-50 overflow-hidden z-10 group">
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div 
                        key="loading-hero"
                        className="w-full h-full bg-[#fdfbf9] flex flex-col items-center justify-center gap-4"
                      >
                         <div className="relative">
                            <div className="w-12 h-12 border-4 border-secondary/10 border-t-secondary rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                                <span className="text-[6px] font-black text-secondary tracking-tighter">ERAYA</span>
                              </div>
                            </div>
                         </div>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Setting the stage...</p>
                      </motion.div>
                    ) : products.length > 0 ? (
                      <motion.div
                        key={products[currentSlide]?.id}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                        className="relative w-full h-full"
                      >
                        <img 
                          src={getImageUrl(getPrimaryImage(products[currentSlide]?.images))} 
                          className="w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-110" 
                          alt={products[currentSlide]?.name} 
                        />
                        {/* Slide Info Overlay */}
                        <div className="absolute bottom-10 left-10 right-10 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/50 shadow-xl">
                           <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Featured Item</p>
                           <h3 className="text-xl font-black text-slate-900 truncate">{products[currentSlide]?.name}</h3>
                           <p className="text-sm font-bold text-slate-500 mt-1">Starting from ৳{products[currentSlide]?.base_price}</p>
                        </div>
                      </motion.div>
                    ) : (
                      <img src="/assets/hero.png" className="w-full h-full object-cover" alt="Hero" />
                    )}
                  </AnimatePresence>

                  {/* Slider Dots */}
                  <div className="absolute top-1/2 -right-6 -translate-y-1/2 flex flex-col gap-3 z-20">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div 
                        key={i} 
                        className={`w-1.5 h-10 rounded-full transition-all duration-500 ${currentSlide === i ? 'bg-secondary h-16' : 'bg-slate-200'}`} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-10 border-y border-slate-100 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-secondary">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Fast Shipping</h4>
              <p className="text-sm text-slate-500">Free on orders over ৳{settings.free_shipping_threshold}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-secondary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Secure Payment</h4>
              <p className="text-sm text-slate-500">100% secure checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-secondary">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Global Delivery</h4>
              <p className="text-sm text-slate-500">We ship worldwide</p>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="py-12 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-1">Shop by Category</h2>
              <p className="text-slate-500">Browse our curated collections</p>
            </div>
            <Link to="/products" className="text-secondary font-bold flex items-center gap-2 hover:underline text-sm">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* All Products card with dynamic background slideshow */}
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="relative group aspect-[4/5] overflow-hidden rounded-[32px] bg-slate-900 shadow-lg shadow-slate-900/10"
            >
              <Link
                to="/products"
                className="block w-full h-full relative"
              >
                {/* Background Slideshow */}
                <div className="absolute inset-0 bg-slate-900 transition-transform duration-1000 group-hover:scale-110">
                   <AnimatePresence mode="wait">
                    {categories.length > 0 && categories[currentCategoryIndex]?.image_url ? (
                      <motion.img 
                        key={categories[currentCategoryIndex].id}
                        src={getImageUrl(categories[currentCategoryIndex].image_url)} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="w-full h-full object-cover" 
                        alt="All Products" 
                      />
                    ) : (
                       <div className="w-full h-full bg-slate-900" />
                    )}
                   </AnimatePresence>
                </div>
                
                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-xl">
                    <Tag className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-black text-xs tracking-[0.2em] text-white uppercase">All Products</p>
                </div>
              </Link>
            </motion.div>

            {loading
              ? [...Array(7)].map((_, i) => (
                  <div key={i} className="aspect-[4/5] bg-slate-100 rounded-3xl animate-pulse" />
                ))
              : categories.slice(0, 11).map((cat, i) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -6 }}
                    className="relative group aspect-[4/5] overflow-hidden rounded-[32px]"
                  >
                    <Link
                      to={`/products?category=${cat.id}`}
                      className="block w-full h-full relative"
                    >
                      {/* Category Image */}
                      <div className="absolute inset-0 bg-slate-100 transition-transform duration-1000 group-hover:scale-110">
                        {cat.image_url ? (
                          <img 
                            src={getImageUrl(cat.image_url)} 
                            className="w-full h-full object-cover" 
                            alt={cat.name} 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tag className="w-10 h-10 text-slate-200" />
                          </div>
                        )}
                      </div>
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                      
                      {/* Content */}
                      <div className="absolute inset-x-0 bottom-0 p-6 space-y-1">
                        <p className="text-[10px] font-black text-amber-200 uppercase tracking-[0.2em]">Collection</p>
                        <h3 className="text-white font-black text-lg leading-tight tracking-tight">{cat.name}</h3>
                        <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">{cat.product_count} Pieces</p>
                      </div>

                      {/* Hover Indicator */}
                      <div className="absolute top-6 right-6 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-y-4 group-hover:translate-y-0">
                         <ArrowRight className="w-5 h-5 text-white" />
                      </div>
                    </Link>
                  </motion.div>
                ))
            }
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Featured Products</h2>
              <p className="text-slate-500">Handpicked items just for you</p>
            </div>
            <Link to="/products" className="text-secondary font-bold flex items-center gap-2 hover:underline">
              View All Products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-10">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-square bg-slate-100 rounded-2xl animate-pulse" />
                  <div className="h-6 w-2/3 bg-slate-100 rounded animate-pulse" />
                  <div className="h-6 w-1/3 bg-slate-100 rounded animate-pulse" />
                </div>
              ))
            ) : (
              products.map((product) => (
                <Link 
                  key={product.id}
                  to={`/products/${product.slug}`}
                  className="group bg-white border border-slate-100 rounded-3xl p-4 hover:shadow-xl transition-all"
                >
                  <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden mb-6 relative">
                    <img 
                      src={getImageUrl(getPrimaryImage(product.images))} 
                      className="w-full h-full object-contain group-hover:scale-110 transition-all duration-500" 
                      alt={product.name}
                    />
                    {!['admin', 'moderator'].includes(user?.role?.toLowerCase()) && (
                      <button 
                        onClick={(e) => handleAddToCart(e, product)}
                        className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-slate-900 hover:bg-secondary hover:text-white transition-all transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                      >
                        <ShoppingBag className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1 group-hover:text-secondary transition-colors line-clamp-1">{product.name}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />)}
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold">4.8 (120+)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-slate-900">৳{product.base_price}</span>
                      <span className="text-xs text-secondary font-bold uppercase tracking-widest">In Stock</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 bg-slate-900 rounded-[3rem] mx-4 md:mx-6 mb-12 overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
           <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover" alt="Background" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Join our newsletter</h2>
          <p className="text-slate-400 text-base mb-8 max-w-xl mx-auto">
            Subscribe to receive updates, access to exclusive deals, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input 
              type="email"
              placeholder="eraya@gmail.com"
              className="flex-grow bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-white text-sm placeholder:text-white/40 outline-none focus:ring-2 focus:ring-secondary transition-all"
            />
            <button className="px-6 py-3 bg-secondary text-white rounded-xl font-bold hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 text-sm">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
