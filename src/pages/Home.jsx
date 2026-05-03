import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowRight, Star, Truck, ShieldCheck, Globe, Tag, RefreshCcw, Zap, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../api/axios';
import toast from 'react-hot-toast';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useSettingsStore from '../store/useSettingsStore';

const Home = () => {
  useDocumentTitle('Premium Lifestyle & Aesthetics | Eraya');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingItemId, setLoadingItemId] = useState(null);
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
      }, 4000);
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

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    const role = user?.role?.toLowerCase();
    if (role === 'admin' || role === 'moderator') {
      toast.error('Management accounts cannot add items to cart');
      return;
    }
    setLoadingItemId(product.id);
    await new Promise(resolve => setTimeout(resolve, 600));
    const cartProduct = { ...product, image_url: getPrimaryImage(product.images) };
    addToCart(cartProduct);
    setLoadingItemId(null);
    toast.success(`${product.name} added to cart`);
  };

  const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' } }) };

  return (
    <div className="relative z-10">

      {/* ── Hero Section ──────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden pt-20">

        
        
        

        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 w-full py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left: Content */}
            <div className="lg:col-span-5 space-y-8">
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
                className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">New Arrivals 2026</span>
              </motion.div>

              <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
                className="text-5xl md:text-7xl font-black text-white drop-shadow-sm leading-[1.05] tracking-tight">
                Eraya<br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 animate-gradient">
                  Aesthetics.
                </span>
              </motion.h1>

              <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}
                className="text-lg text-slate-400 leading-relaxed max-w-md font-medium">
                Experience a new standard of premium lifestyle. Discover curated products that sparkle with confidence.
              </motion.p>

              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
                className="flex flex-wrap items-center gap-4">
                <button onClick={() => navigate('/products')}
                  className="btn-primary flex items-center gap-3 group">
                  Shop Collection
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => navigate('/products')}
                  className="btn-ghost flex items-center gap-3">
                  Explore Categories
                </button>
              </motion.div>

              {/* Stats */}
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}
                className="flex items-center gap-8 pt-8 border-t border-white/[0.06]">
                {[{ n: '12k+', l: 'Active Buyers' }, { n: '4.9/5', l: 'User Rating' }, { n: '500+', l: 'Products' }].map((stat, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <div className="w-px h-10 glass-card-light/10" />}
                    <div>
                      <p className="text-2xl font-black text-white drop-shadow-sm">{stat.n}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.l}</p>
                    </div>
                  </React.Fragment>
                ))}
              </motion.div>
            </div>

            {/* Right: Slider */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className="lg:col-span-7 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[520px] aspect-[4/5]">
                {/* Decorative rings */}
                <div className="absolute inset-2 border border-indigo-500/15 rounded-[3.5rem] rotate-2 z-0 animate-float" />
                <div className="absolute inset-2 border border-violet-500/10 rounded-[3.5rem] -rotate-2 z-0" style={{ animationDelay: '1s' }} />

                <div className="relative w-full h-full glass-card p-1 overflow-hidden z-10 group shadow-2xl shadow-indigo-500/10">
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div key="loading-hero"
                        className="w-full h-full flex flex-col items-center justify-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                        </div>
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">Setting the stage...</p>
                      </motion.div>
                    ) : products.length > 0 ? (
                      <motion.div key={products[currentSlide]?.id}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.7, ease: 'easeInOut' }}
                        className="relative w-full h-full">
                        <img
                          src={getImageUrl(getPrimaryImage(products[currentSlide]?.images))}
                          className="w-full h-full object-cover transition-transform duration-[4000ms] group-hover:scale-105"
                          alt={products[currentSlide]?.name}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent opacity-70" />
                        {products[currentSlide]?.stock_count <= 0 && (
                          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-10">
                            <div className="badge-rose text-sm px-6 py-3 -rotate-12 font-black">Stock Out</div>
                          </div>
                        )}
                        {/* Overlay info */}
                        <div className="absolute bottom-8 left-8 right-8 glass-card p-5">
                          <p className="section-label mb-1">Featured Item</p>
                          <h3 className="text-lg font-black text-white drop-shadow-sm truncate">{products[currentSlide]?.name}</h3>
                          <p className="text-sm font-bold text-slate-400 mt-1">Starting from ৳{products[currentSlide]?.base_price}</p>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  {/* Slide dots */}
                  <div className="absolute top-1/2 -right-5 -translate-y-1/2 flex flex-col gap-2.5 z-20">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <button key={i} onClick={() => setCurrentSlide(i)}
                        className={`rounded-full transition-all duration-500 ${currentSlide === i ? 'w-1.5 h-10 bg-indigo-400' : 'w-1.5 h-4 glass-card-light/20 hover:glass-card-light/40'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── Feature Strip ──────────────────────────────── */}
      <section className="py-10 border-y border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Truck, title: 'Fast Shipping', desc: `Free on orders over ৳${settings.free_shipping_threshold}`, color: 'text-indigo-400' },
            { icon: ShieldCheck, title: 'Secure Payment', desc: '100% secure checkout', color: 'text-violet-400' },
            { icon: Globe, title: 'Global Delivery', desc: 'We ship worldwide', color: 'text-purple-400' },
          ].map((feat, i) => (
            <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
              className="flex items-center gap-5 glass-card-light p-6">
              <div className={`w-12 h-12 rounded-2xl glass-card-light flex items-center justify-center ${feat.color}`}>
                <feat.icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-white drop-shadow-sm text-sm">{feat.title}</h4>
                <p className="text-slate-400 text-xs font-medium">{feat.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Categories ──────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="section-label mb-3">Collections</p>
              <h2 className="text-4xl font-black text-white drop-shadow-sm tracking-tight">Shop by Category</h2>
            </div>
            <Link to="/products" className="text-indigo-400 font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:text-indigo-300 transition-colors">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* All Products */}
            <motion.div whileHover={{ y: -6, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}
              className="relative group aspect-[4/5] overflow-hidden rounded-[28px] glass-card-light shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <Link to="/products" className="block w-full h-full relative">
                <div className="absolute inset-0">
                  <AnimatePresence mode="wait">
                    {categories.length > 0 && categories[currentCategoryIndex]?.image_url ? (
                      <motion.img key={categories[currentCategoryIndex].id}
                        src={getImageUrl(categories[currentCategoryIndex].image_url)}
                        initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="w-full h-full object-cover" alt="All Products" />
                    ) : null}
                  </AnimatePresence>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-950 via-indigo-900/40 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
                  <div className="w-12 h-12 bg-indigo-500/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-indigo-500/30">
                    <Tag className="w-6 h-6 text-indigo-300" />
                  </div>
                  <p className="font-black text-[10px] tracking-[0.2em] text-indigo-200 uppercase">All Products</p>
                </div>
              </Link>
            </motion.div>

            {loading
              ? [...Array(7)].map((_, i) => <div key={i} className="aspect-[4/5] skeleton rounded-[28px]" />)
              : categories.slice(0, 11).map((cat, i) => (
                <motion.div key={cat.id}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }} whileHover={{ y: -6 }}
                  className="relative group aspect-[4/5] overflow-hidden rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                  <Link to={`/products?category=${cat.id}`} className="block w-full h-full relative">
                    <div className="absolute inset-0 bg-slate-800 transition-transform duration-700 group-hover:scale-110">
                      {cat.image_url
                        ? <img src={getImageUrl(cat.image_url)} className="w-full h-full object-cover" alt={cat.name} />
                        : <div className="w-full h-full flex items-center justify-center"><Tag className="w-10 h-10 text-slate-400" /></div>}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/30 to-transparent opacity-90 group-hover:opacity-80 transition-opacity duration-500" />
                    <div className="absolute inset-x-0 bottom-0 p-5 space-y-1">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Collection</p>
                      <h3 className="text-white drop-shadow-sm font-black text-base leading-tight">{cat.name}</h3>
                      <p className="text-white drop-shadow-sm/40 text-[9px] font-bold uppercase tracking-widest">{cat.product_count} Pieces</p>
                    </div>
                    <div className="absolute top-4 right-4 w-9 h-9 glass-card-light/10 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-y-2 group-hover:translate-y-0 border border-white/20">
                      <ArrowRight className="w-4 h-4 text-white drop-shadow-sm" />
                    </div>
                  </Link>
                </motion.div>
              ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="section-label mb-3">Handpicked</p>
              <h2 className="text-4xl font-black text-white drop-shadow-sm tracking-tight">Featured Products</h2>
            </div>
            <Link to="/products" className="text-indigo-400 font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:text-indigo-300 transition-colors">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {loading
              ? [...Array(4)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-square skeleton rounded-[28px]" />
                  <div className="h-5 w-2/3 skeleton rounded-xl" />
                  <div className="h-5 w-1/3 skeleton rounded-xl" />
                </div>
              ))
              : products.map((product, i) => (
                <motion.div key={product.id}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}>
                  <Link to={`/products/${product.slug}`} className="product-card block p-4">
                    <div className="aspect-square glass-card-light p-2 overflow-hidden mb-5 relative">
                      <img
                        src={getImageUrl(getPrimaryImage(product.images))}
                        className="w-full h-full object-contain group-hover:scale-110 transition-all duration-500"
                        alt={product.name}
                      />
                      {product.stock_count <= 0 && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                          <span className="badge-rose -rotate-12 text-xs px-4 py-2">Stock Out</span>
                        </div>
                      )}
                      {!['admin', 'moderator'].includes(user?.role?.toLowerCase()) && (
                        <button
                          onClick={(e) => handleAddToCart(e, product)}
                          disabled={loadingItemId === product.id || product.stock_count <= 0}
                          className="absolute bottom-3 right-3 w-10 h-10 bg-indigo-600 rounded-xl shadow-lg flex items-center justify-center text-white drop-shadow-sm hover:bg-indigo-500 transition-all transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 disabled:opacity-50 shadow-[0_4px_20px_rgba(99,102,241,0.4)]">
                          {loadingItemId === product.id
                            ? <RefreshCcw className="w-4 h-4 animate-spin" />
                            : <ShoppingBag className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                    <div className="px-1">
                      <h3 className="font-black text-white drop-shadow-sm text-sm mb-2 line-clamp-1 group-hover:text-indigo-300 transition-colors">{product.name}</h3>
                      <div className="flex items-center gap-1.5 mb-3">
                        {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 text-amber-400 fill-current" />)}
                        <span className="text-[9px] text-slate-400 font-bold">4.8</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-white drop-shadow-sm">৳{product.base_price}</span>
                        <span className={`badge ${product.stock_count > 0 ? 'badge-emerald' : 'badge-rose'}`}>
                          {product.stock_count > 0 ? 'In Stock' : 'Out'}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ──────────────────────────────────── */}
      <section className="py-24 mx-4 md:mx-6 mb-12">
        <div className="relative rounded-[3rem] overflow-hidden glass-card border border-indigo-500/20 shadow-[0_40px_80px_-20px_rgba(99,102,241,0.2)]">
          {/* Background glow */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-violet-900/20 to-purple-900/40" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/15 rounded-full blur-[100px]" />
          </div>
          <div className="relative z-10 max-w-2xl mx-auto px-6 py-20 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 rounded-full border border-indigo-500/20 mb-6">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">Exclusive Access</span>
            </div>
            <h2 className="text-4xl font-black text-white drop-shadow-sm mb-4 tracking-tight">Stay in the Loop</h2>
            <p className="text-slate-400 mb-10 font-medium max-w-md mx-auto">
              Subscribe to receive updates, access to exclusive deals, and early access to new collections.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="glass-input flex-grow text-sm"
              />
              <button className="btn-primary whitespace-nowrap">Subscribe</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
