import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Star, Truck, ShieldCheck, Globe, Tag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../api/axios';
import toast from 'react-hot-toast';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import useDocumentTitle from '../hooks/useDocumentTitle';

const Home = () => {
  useDocumentTitle('');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const addToCart = useCartStore((state) => state.addItem);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const getPrimaryImage = (images) => {
    if (!images || images.length === 0) return null;
    const primary = images.find((img) => img.is_primary) || images[0];
    return primary.image_url;
  };

  useEffect(() => {
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
  }, []);

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (user?.role === 'admin') {
      toast.error('Admins cannot add items to cart');
      return;
    }
    addToCart(product);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="bg-white">
      {/* Classic Hero Banner */}
      <section className="relative pt-16 pb-8 md:pt-24 md:pb-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <span className="inline-block px-4 py-1.5 bg-secondary/10 text-secondary rounded-full text-xs font-bold uppercase tracking-widest">
              Summer Collection 2026
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
              Elevate Your <br /> 
              <span className="text-secondary">Everyday Style.</span>
            </h1>
            <p className="text-base text-slate-600 max-w-lg leading-relaxed">
              Discover a curated selection of premium electronics, fashion, and accessories designed for the modern lifestyle.
            </p>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/products')}
                className="px-6 py-3 bg-secondary text-white rounded-xl font-bold shadow-lg shadow-secondary/20 hover:bg-secondary/90 transition-all flex items-center gap-2 group text-sm"
              >
                Shop Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-6 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all text-sm">
                Learn More
              </button>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-secondary/5 rounded-3xl blur-3xl" />
            <img 
              src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1280&auto=format&fit=crop" 
              className="relative w-full rounded-3xl shadow-2xl"
              alt="Premium Product"
            />
          </motion.div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-10 border-y border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-secondary">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Fast Shipping</h4>
              <p className="text-sm text-slate-500">Free on orders over ৳100</p>
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
      <section className="py-12 bg-white">
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
            {/* All Products card */}
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Link
                to="/products"
                className="flex flex-col items-center justify-center gap-3 bg-slate-900 text-white rounded-2xl p-6 text-center hover:bg-secondary transition-all duration-300 shadow-lg shadow-slate-900/10 group h-full"
              >
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <Tag className="w-6 h-6" />
                </div>
                <p className="font-bold text-sm tracking-wide">All Products</p>
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
                        <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Collection</p>
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
      <section className="py-16 bg-white">
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
                    {user?.role !== 'admin' && (
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
