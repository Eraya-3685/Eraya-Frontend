import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShoppingCart, Shield, Truck, RotateCcw, Plus, Minus, Heart, MapPin, Info, ChevronRight, HelpCircle, X } from 'lucide-react';
import api, { getImageUrl } from '../api/axios';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import useWishlistStore from '../store/useWishlistStore';
import toast from 'react-hot-toast';
import useClickOutside from '../hooks/useClickOutside';
import useSettingsStore from '../store/useSettingsStore';

const ProductDetails = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [reviews, setReviews] = useState([]);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { user } = useAuthStore();
  const { settings, fetchSettings } = useSettingsStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Delivery Address State
  const [deliveryAddress, setDeliveryAddress] = useState({
    city: 'Barishal',
    area: 'Rupatoli'
  });
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [tempAddress, setTempAddress] = useState(deliveryAddress);
  const [activeSelector, setActiveSelector] = useState(null); // 'city' or 'area' or null
  const cityDropdownRef = useRef(null);
  const areaDropdownRef = useRef(null);

  useClickOutside(cityDropdownRef, () => {
    if (activeSelector === 'city') setActiveSelector(null);
  });
  useClickOutside(areaDropdownRef, () => {
    if (activeSelector === 'area') setActiveSelector(null);
  });

  // Simple Mock Data for Bangladesh Address (Flattened to City > Area)
  const BD_DATA = {
    'Barishal': ['Rupatoli', 'Amtala', 'Natullabad', 'Sadary Road', 'Chowmatha'],
    'Dhaka - North': ['Gulshan 1', 'Gulshan 2', 'Banani', 'Uttara', 'Bashundhara R/A'],
    'Dhaka - South': ['Dhanmondi', 'Motijheel', 'Old Dhaka', 'Lalbagh', 'Mohammadpur'],
    'Chittagong': ['Panchlaish', 'Double Mooring', 'Agrabad', 'GEC Circle'],
    'Sylhet': ['Zindabazar', 'Ambarkhana', 'Shahjalal Uposhahar'],
    'Cox\'s Bazar': ['Teknaf', 'Ukhia', 'Laboni Beach Area'],
    'Gazipur': ['Sreepur', 'Kaliakair', 'Board Bazar'],
    'Narayanganj': ['Chashara', 'Fatullah'],
    'Rajshahi': ['Shaheb Bazar', 'Motihar'],
    'Khulna': ['Khalishpur', 'Daulatpur']
  };

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/products/${slug}`);
      setProduct(response.data);
      if (response.data.images?.length > 0) {
        const primary = response.data.images.find((img) => img.is_primary) || response.data.images[0];
        setSelectedImage(primary.image_url);
      }
      if (response.data.id) {
        const reviewsRes = await api.get(`/reviews/${response.data.id}`);
        setReviews(reviewsRes.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch product', error);
      toast.error('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    setAddingToCart(true);
    // Add a slight delay for premium feel
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Normalize image_url for the cart
    const cartProduct = {
      ...product,
      image_url: selectedImage || (product.images?.length > 0 ? product.images[0].image_url : null)
    };
    
    addItem(cartProduct, quantity);
    setAddingToCart(false);
    toast.success(`${product.name} added to cart`);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#fdfbf9] gap-6">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-secondary/10 border-t-secondary rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
            <span className="text-[10px] font-black text-secondary tracking-tighter">ERAYA</span>
          </div>
        </div>
      </div>
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Experience loading...</p>
    </div>
  );

  if (!product) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <p className="text-slate-500 text-xl font-bold uppercase tracking-widest">Product not found</p>
      <Link to="/products" className="text-secondary font-black hover:underline uppercase text-xs tracking-widest">← Back to Collection</Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <Link to="/" className="hover:text-secondary transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3 shrink-0" />
        <Link to="/products" className="hover:text-secondary transition-colors">Collection</Link>
        {product.categories && product.categories.length > 0 && (
          <>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <Link
              to={`/products?category=${product.categories[0].id}`}
              className="hover:text-secondary transition-colors"
            >
              {product.categories[0].name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3 h-3 shrink-0" />
        <span className="text-secondary font-black">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
        {/* Left Column: Image Gallery (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="aspect-square bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm relative"
          >
            <img
              src={getImageUrl(selectedImage)}
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
              alt={product.name}
            />
            {product.stock_count <= 0 && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-10 pointer-events-none">
                <div className="bg-slate-900 text-white px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-black/20 transform -rotate-12 border border-white/20">
                  Stock Out
                </div>
              </div>
            )}
          </motion.div>
          {product.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.image_url)}
                  className={`aspect-square bg-white rounded-2xl overflow-hidden transition-all border ${selectedImage === img.image_url ? 'border-secondary ring-4 ring-secondary/5' : 'border-slate-100 hover:border-slate-300'
                    }`}
                >
                  <img src={getImageUrl(img.image_url)} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center Column: Product Main Info (5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4 leading-tight">
              {product.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(product.average_rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                  ))}
                </div>
                <span className="text-[10px] font-black text-secondary uppercase tracking-widest">{product.total_reviews} Ratings</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand:</span>
                <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Eraya Official</span>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 relative overflow-hidden">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-4xl font-black text-slate-900 tracking-tighter">৳{product.base_price.toLocaleString()}</span>
                {product.discount_price && (
                  <span className="text-slate-400 line-through text-xl font-bold">৳{product.discount_price.toLocaleString()}</span>
                )}
              </div>
              {product.discount_percentage && (
                <div className="inline-flex items-center gap-1.5 bg-secondary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-secondary/20">
                  <ChevronRight className="w-3 h-3 rotate-180" /> {product.discount_percentage}% OFF
                </div>
              )}
            </div>
          </div>

          {/* Promotions */}
          <div className="mb-8 p-6 bg-amber-50/50 rounded-3xl border border-amber-100/30 flex items-center justify-between group cursor-pointer hover:bg-amber-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <Truck className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <div className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] mb-0.5">Promotions</div>
                <span className="text-xs font-bold text-slate-700">Free shipping on orders above ৳{settings.free_shipping_threshold.toLocaleString()}</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-amber-300 group-hover:text-amber-500 transition-colors" />
          </div>

          <div className="space-y-8 mb-10">
            {!['admin', 'moderator'].includes(user?.role?.toLowerCase()) && (
              <>
                <div className="flex items-center gap-10">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-16">Quantity</span>
                   <div className="flex items-center gap-5">
                     <div className={`flex items-center gap-3 bg-white rounded-2xl p-1.5 w-fit border border-slate-100 shadow-sm ${product.stock_count <= 0 ? 'opacity-30 pointer-events-none' : ''}`}>
                       <button
                         onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                         disabled={product.stock_count <= 0}
                         className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl transition-all"
                       >
                         <Minus className="w-4 h-4 text-slate-600" />
                       </button>
                       <span className="font-black w-8 text-center text-sm">{quantity}</span>
                       <button
                         onClick={() => setQuantity((q) => Math.min(product.stock_count, q + 1))}
                         disabled={product.stock_count <= 0}
                         className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl transition-all"
                       >
                         <Plus className="w-4 h-4 text-slate-600" />
                       </button>
                     </div>
                     {product.stock_count > 0 ? (
                       <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{product.stock_count} Available</span>
                     ) : (
                       <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Out of Stock</span>
                     )}
                   </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={async () => {
                      setBuyingNow(true);
                      await new Promise(resolve => setTimeout(resolve, 600));

                      // Save selected address for Checkout
                      const formattedAddress = `${deliveryAddress.area}, ${deliveryAddress.city}`;
                      localStorage.setItem('checkout_shipping_address', formattedAddress);

                      addItem(product, quantity);
                      navigate('/checkout');
                    }}
                    disabled={product.stock_count <= 0 || buyingNow}
                    className="flex-grow bg-secondary text-white py-5 rounded-2xl font-black hover:bg-secondary/90 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-secondary/20 disabled:opacity-50 text-[11px] uppercase tracking-[0.2em]"
                  >
                    {buyingNow ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : product.stock_count <= 0 ? 'Out of Stock' : 'Buy Now'}
                  </button>
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock_count <= 0 || addingToCart}
                    className="flex-grow bg-slate-900 text-white py-5 rounded-2xl font-black hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-slate-200 disabled:opacity-50 text-[11px] uppercase tracking-[0.2em]"
                  >
                    {addingToCart ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : product.stock_count <= 0 ? 'Sold Out' : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </>
                    )}
                  </button>
                  <button
                    onClick={async () => {
                      if (!user) {
                        toast.error('Please login to add items to wishlist');
                        return;
                      }
                      setAddingToWishlist(true);
                      await new Promise(resolve => setTimeout(resolve, 600));
                      const added = await toggleWishlist(product, !!user);
                      setAddingToWishlist(false);
                      if (added) toast.success('Added to Wishlist');
                      else toast.success('Removed from Wishlist');
                    }}
                    disabled={addingToWishlist}
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all shrink-0 ${isInWishlist(product.id)
                        ? 'bg-amber-50 border-amber-100 text-amber-500 shadow-inner'
                        : 'bg-white border-slate-100 text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                      }`}
                  >
                    {addingToWishlist ? (
                      <div className="w-4 h-4 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                    ) : (
                      <Heart className={`w-6 h-6 ${isInWishlist(product.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Delivery & Seller Info (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Delivery Options Box */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 space-y-8 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Delivery Options</h4>
              <HelpCircle className="w-4 h-4 text-slate-200" />
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs font-black text-slate-700 truncate tracking-tight">{deliveryAddress.city}</p>
                    {!['admin', 'moderator'].includes(user?.role?.toLowerCase()) && (
                      <button
                        onClick={() => {
                          setTempAddress(deliveryAddress);
                          setShowAddressModal(true);
                        }}
                        className="text-[10px] font-black text-secondary uppercase hover:underline shrink-0"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400">{deliveryAddress.area}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 pt-6 border-t border-slate-50">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-grow">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-black text-slate-700 tracking-widest">Standard Delivery</p>
                    <span className="text-xs font-black text-slate-900">৳{settings.standard_delivery_fee}</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 tracking-tight">Delivered in 2-5 days</p>
                </div>
              </div>

              <div className="flex items-start gap-4 pt-6 border-t border-slate-50">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                  <div className="text-[10px] font-black text-slate-400 italic">৳</div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-700 tracking-widest">Cash on Delivery</p>
                  <p className="text-[10px] font-bold text-green-500 tracking-tight mt-1">Available</p>
                </div>
              </div>
            </div>
          </div>

          {/* Service & Warranty Box */}
          <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100 space-y-8">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Service Guarantee</h4>
              <Shield className="w-4 h-4 text-slate-200" />
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <RotateCcw className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[11px] font-black text-slate-700 tracking-widest">7 Days Return</p>
                  <p className="text-[10px] font-bold text-slate-400 tracking-tight mt-1">Original Condition</p>
                </div>
              </div>
              <div className="flex items-start gap-4 pt-6 border-t border-slate-200/50">
                <Shield className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[11px] font-black text-slate-700 tracking-widest">Official Warranty</p>
                  <p className="text-[10px] font-bold text-slate-400 tracking-tight mt-1">Not Applicable</p>
                </div>
              </div>
            </div>
          </div>

          {/* Seller Info Box */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Verified Seller</p>
                <h5 className="font-black text-slate-900 text-sm tracking-tight">Eraya Official Store</h5>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center">
                <Info className="w-5 h-5 text-secondary" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xl font-black text-slate-900">92%</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Positive</p>
              </div>
              <div className="border-l border-slate-100 pl-6">
                <p className="text-xl font-black text-slate-900">100%</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">On Time</p>
              </div>
            </div>

            <button className="w-full mt-8 py-3 bg-slate-50 text-[10px] font-black text-secondary uppercase tracking-[0.2em] rounded-xl hover:bg-secondary hover:text-white transition-all">
              Visit Store
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-100 mb-12 flex items-center justify-center gap-16">
        {['description', 'reviews'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-6 text-xs font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === tab ? 'text-secondary' : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            {tab === 'reviews' ? `Customer Reviews (${product.total_reviews})` : tab}
            {activeTab === tab && (
              <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-[-20%] right-[-20%] h-1 bg-secondary rounded-full" />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="min-h-[300px] max-w-4xl mx-auto"
        >
          {activeTab === 'description' && (
            <div className="text-slate-500 text-base leading-relaxed space-y-6 text-center lg:text-left">
              {product.description || 'This product is part of our signature collection. Hand-finished and inspected for premium quality.'}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-16">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-slate-50 p-10 rounded-[3rem] border border-slate-100">
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Verified Feedback</h3>
                  <p className="text-slate-400 text-sm font-medium">Real experiences from our collectors.</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-5 h-5 ${s <= Math.round(product.average_rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                    ))}
                  </div>
                  <div className="w-px h-10 bg-slate-200" />
                  <span className="text-2xl font-black text-slate-900">{product.average_rating?.toFixed(1) || '0.0'}</span>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
                  <Star className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                  <p className="text-slate-400 font-black text-sm uppercase tracking-widest">No reviews yet for this piece.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {reviews.map((review) => (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      key={review.id}
                      className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-secondary/5 transition-all duration-500"
                    >
                      <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-secondary border border-slate-100 text-lg shadow-inner">
                            {review.user?.full_name?.charAt(0).toUpperCase() || 'C'}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 text-sm tracking-tight">{review.user?.full_name || 'Verified Collector'}</h4>
                            <div className="flex gap-0.5 mt-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-100'}`} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                          {new Date(review.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      {review.comment && (
                        <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-50 text-sm text-slate-600 leading-relaxed italic relative">
                          <span className="absolute top-2 left-3 text-4xl text-slate-200 font-serif">"</span>
                          {review.comment}
                        </div>
                      )}
                      {review.is_verified && (
                        <div className="mt-6 flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">
                          <Shield className="w-3.5 h-3.5" /> Authenticity Guaranteed
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Address Selection Side Drawer */}
      <AnimatePresence>
        {showAddressModal && (
          <div className="fixed inset-0 z-[200] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddressModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative bg-white w-full max-w-[400px] h-full shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Delivery Region</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Select your location</p>
                </div>
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 hover:text-secondary hover:shadow-lg transition-all border border-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {/* Minimal Location Card */}
                <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      <MapPin className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Current Region</p>
                      <p className="text-sm font-black text-slate-900 tracking-tight">{tempAddress.area}, {tempAddress.city}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Custom City Dropdown */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">01. Select City</label>
                    <div className="relative" ref={cityDropdownRef}>
                      <button
                        onClick={() => setActiveSelector(activeSelector === 'city' ? null : 'city')}
                        className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 flex items-center justify-between hover:border-secondary/30 transition-all shadow-sm"
                      >
                        {tempAddress.city}
                        <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${activeSelector === 'city' ? 'rotate-90 text-secondary' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {activeSelector === 'city' && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden z-10 p-2"
                          >
                            <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                              {Object.keys(BD_DATA).map((city) => (
                                <button
                                  key={city}
                                  onClick={() => {
                                    setTempAddress({ city: city, area: BD_DATA[city][0] });
                                    setActiveSelector(null);
                                  }}
                                  className={`w-full text-left px-5 py-3.5 rounded-xl text-xs font-bold transition-all ${tempAddress.city === city ? 'bg-secondary/10 text-secondary' : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                  {city}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Custom Area Dropdown */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">02. Select Area</label>
                    <div className="relative" ref={areaDropdownRef}>
                      <button
                        onClick={() => setActiveSelector(activeSelector === 'area' ? null : 'area')}
                        className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 flex items-center justify-between hover:border-secondary/30 transition-all shadow-sm"
                      >
                        {tempAddress.area}
                        <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${activeSelector === 'area' ? 'rotate-90 text-secondary' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {activeSelector === 'area' && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden z-10 p-2"
                          >
                            <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                              {BD_DATA[tempAddress.city].map((area) => (
                                <button
                                  key={area}
                                  onClick={() => {
                                    setTempAddress({ ...tempAddress, area: area });
                                    setActiveSelector(null);
                                  }}
                                  className={`w-full text-left px-5 py-3.5 rounded-xl text-xs font-bold transition-all ${tempAddress.area === area ? 'bg-secondary/10 text-secondary' : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                  {area}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/30">
                <button
                  onClick={() => {
                    setDeliveryAddress(tempAddress);
                    setShowAddressModal(false);
                    toast.success('Delivery location updated');
                  }}
                  className="w-full bg-secondary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Confirm Location
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetails;
