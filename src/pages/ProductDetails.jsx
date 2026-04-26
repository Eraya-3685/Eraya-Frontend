import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShoppingCart, Shield, Truck, RotateCcw, Plus, Minus } from 'lucide-react';
import api, { getImageUrl } from '../api/axios';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';

const ProductDetails = () => {
  // Backend route: GET /products/{slug}
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [reviewErrors, setReviewErrors] = useState({});
  const [submittingReview, setSubmittingReview] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      // Backend: GET /products/{slug} → domain.Product (with images[].image_url)
      const response = await api.get(`/products/${slug}`);
      setProduct(response.data);
      if (response.data.images?.length > 0) {
        const primary = response.data.images.find((img) => img.is_primary) || response.data.images[0];
        setSelectedImage(primary.image_url);
      }
      // Fetch reviews: GET /reviews/{productId}
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

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`${product.name} added to cart`);
  };

  const fallbackImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop';

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  if (!product) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <p className="text-slate-500 text-xl">Product not found</p>
      <Link to="/products" className="text-primary font-bold hover:underline">← Back to Collection</Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-primary transition-colors">Collection</Link>
        <span>/</span>
        <span className="text-primary-container font-medium">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
        {/* Image Gallery */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="aspect-square bg-slate-100 rounded-3xl overflow-hidden"
          >
            <img
              src={getImageUrl(selectedImage)}
              className="w-full h-full object-cover"
              alt={product.name}
            />
          </motion.div>
          {product.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.image_url)}
                  className={`aspect-square bg-slate-100 rounded-xl overflow-hidden transition-all ${
                    selectedImage === img.image_url ? 'ring-2 ring-primary' : 'hover:ring-1 ring-slate-300'
                  }`}
                >
                  <img src={getImageUrl(img.image_url)} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="mb-8">
            <span className="text-secondary font-bold uppercase tracking-widest text-xs mb-2 block">
              {product.category_id ? `Category #${product.category_id}` : 'Essential Edition'}
            </span>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mb-2">{product.name}</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-full">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span className="font-bold text-xs">
                  {product.average_rating > 0 ? product.average_rating.toFixed(1) : 'No ratings yet'}
                </span>
              </div>
              <span className="text-slate-400 text-xs">{product.total_reviews} reviews</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${product.stock_count > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                {product.stock_count > 0 ? `${product.stock_count} in stock` : 'Out of stock'}
              </span>
            </div>
          </div>
 
          <div className="mb-6">
            <div className="flex items-end gap-2.5 mb-2">
              <span className="text-2xl font-black text-slate-900 tracking-tighter">৳{product.base_price}</span>
              {product.discount_price && (
                <>
                  <span className="text-slate-400 line-through text-base">৳{product.discount_price}</span>
                  {product.discount_percentage && (
                    <span className="bg-red-50 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded">
                      -{product.discount_percentage}%
                    </span>
                  )}
                </>
              )}
            </div>
            {product.description && (
              <p className="text-slate-500 text-sm leading-relaxed">{product.description}</p>
            )}
          </div>
 
          <div className="space-y-4 mb-8">
            {!['admin', 'moderator'].includes(user?.role?.toLowerCase()) && (
              <>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1 w-fit border border-slate-100">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-9 h-9 flex items-center justify-center hover:bg-white rounded-lg transition-all"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold w-8 text-center text-sm">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock_count, q + 1))}
                      className="w-9 h-9 flex items-center justify-center hover:bg-white rounded-lg transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
 
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock_count === 0}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-container transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-primary/10 disabled:opacity-50 text-sm"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {product.stock_count > 0 ? 'Add to Bag' : 'Out of Stock'}
                </button>
              </>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-100">
            <div className="flex flex-col items-center text-center">
              <Truck className="w-6 h-6 text-slate-400 mb-2" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Free Shipping</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <RotateCcw className="w-6 h-6 text-slate-400 mb-2" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">30 Day Returns</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Shield className="w-6 h-6 text-slate-400 mb-2" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">2yr Warranty</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-100 mb-8">
        <div className="flex gap-12">
          {['description', 'reviews'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
                activeTab === tab ? 'text-primary' : 'text-slate-400'
              }`}
            >
              {tab === 'reviews' ? `Reviews (${product.total_reviews})` : tab}
              {activeTab === tab && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="min-h-[200px]"
        >
          {activeTab === 'description' && (
            <div className="max-w-3xl text-slate-500 leading-loose">
              {product.description || 'This product is part of our signature collection. Hand-finished and inspected for premium quality.'}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-12">
              {/* Write Review Form */}
              {user && user.role !== 'admin' && (
                <div className="bg-white border border-slate-100 p-8 rounded-3xl shadow-sm mb-12">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Write a Review</h3>
                  <p className="text-slate-400 text-sm mb-8">Share your experience with this product.</p>
                  
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const newErrors = {};
                    if (reviewForm.rating === 0) newErrors.rating = 'Please select a rating';
                    if (reviewForm.comment.trim().length < 5) newErrors.comment = 'Comment must be at least 5 characters';
                    
                    if (Object.keys(newErrors).length > 0) {
                      setReviewErrors(newErrors);
                      return;
                    }

                    try {
                      setSubmittingReview(true);
                      await api.post('/reviews', {
                        product_id: product.id,
                        rating: reviewForm.rating,
                        comment: reviewForm.comment
                      });
                      toast.success('Review submitted successfully!');
                      setReviewForm({ rating: 0, comment: '' });
                      setReviewErrors({});
                      // Refresh reviews
                      const res = await api.get(`/reviews/${product.id}`);
                      setReviews(res.data || []);
                    } catch (err) {
                      toast.error(err.response?.data || 'Failed to submit review');
                    } finally {
                      setSubmittingReview(false);
                    }
                  }} className="space-y-6">
                    {/* Stars Selection */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rating *</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setReviewForm({ ...reviewForm, rating: s });
                              if (reviewErrors.rating) setReviewErrors({ ...reviewErrors, rating: null });
                            }}
                            className="transition-transform active:scale-90"
                          >
                            <Star className={`w-8 h-8 ${s <= reviewForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-100 hover:text-slate-200'}`} />
                          </button>
                        ))}
                      </div>
                      <AnimatePresence>
                        {reviewErrors.rating && (
                          <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 ml-1">
                            {reviewErrors.rating}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Comment */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Experience *</label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) => {
                          setReviewForm({ ...reviewForm, comment: e.target.value });
                          if (reviewErrors.comment) setReviewErrors({ ...reviewErrors, comment: null });
                        }}
                        rows={3}
                        className={`w-full bg-slate-50 border rounded-2xl py-4 px-6 outline-none transition-all resize-none text-sm font-medium ${reviewErrors.comment ? 'border-red-200 ring-2 ring-red-50' : 'border-slate-100 focus:ring-2 focus:ring-primary'}`}
                        placeholder="What did you like or dislike?"
                      />
                      <AnimatePresence>
                        {reviewErrors.comment && (
                          <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 ml-1">
                            {reviewErrors.comment}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <button
                      disabled={submittingReview}
                      type="submit"
                      className="px-10 py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-primary transition-all disabled:opacity-50"
                    >
                      {submittingReview ? 'Submitting...' : 'Post Review'}
                    </button>
                  </form>
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 mb-8">Customer Reviews</h3>
                {reviews.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl">
                    <p className="text-slate-400">No reviews yet. Be the first to review!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-primary-container text-sm">{review.user_name || 'Customer'}</h4>
                            <div className="flex gap-0.5 mt-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                              ))}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-slate-500 leading-relaxed italic">"{review.comment}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ProductDetails;
