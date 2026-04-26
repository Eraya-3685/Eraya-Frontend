import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, LogOut, MapPin, Phone, Mail, ArrowRight, 
  ShoppingBag, Edit, Camera, X, Save, Shield, 
  CreditCard, Bell, HelpCircle, ChevronRight, User as UserIcon, Command, Heart, Zap, Settings,
  Truck,
  Calendar,
  Star
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import api, { getImageUrl } from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useDocumentTitle from '../hooks/useDocumentTitle';

const Profile = () => {
  useDocumentTitle('My Profile');
  const { user, token, logout, uploadAvatar, fetchProfile } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  const isStaff = ['admin', 'moderator'].includes(user?.role?.toLowerCase());

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    if (isStaff) {
      navigate('/admin');
      return;
    }
    
    fetchOrders();
  }, [token, user, isStaff]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data || []);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File is too large. Max 2MB allowed.');
      return;
    }

    setAvatarUploading(true);
    try {
      await uploadAvatar(file);
      toast.success('Profile photo updated!');
    } catch (error) {
      toast.error('Failed to update avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  const openReviewModal = (product) => {
    setSelectedProduct(product);
    setIsReviewModalOpen(true);
  };

  if (!user && token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-500 animate-pulse uppercase tracking-widest">Securing Session...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 pt-12 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Profile Header */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 md:p-12 mb-10 flex flex-col md:flex-row items-center gap-10">
          <div className="relative group">
            <div className="w-40 h-40 rounded-full bg-slate-100 border-4 border-white shadow-xl overflow-hidden relative group">
              {user.avatar_url ? (
                <img 
                  src={getImageUrl(user.avatar_url)} 
                  className="w-full h-full object-cover" 
                  alt="Avatar" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-secondary text-5xl font-bold">
                  {user.full_name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <button 
              onClick={() => fileInputRef.current.click()}
              disabled={avatarUploading}
              className="absolute bottom-0 right-0 w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-secondary transition-all active:scale-95 disabled:opacity-50"
            >
              {avatarUploading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : <Camera className="w-5 h-5" />}
            </button>
            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
          </div>

          <div className="text-center md:text-left flex-grow">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{user.full_name}</h1>
              {isStaff ? (
                <span className="w-fit mx-auto md:mx-0 px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full">Official Staff</span>
              ) : (
                <span className="w-fit mx-auto md:mx-0 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">Verified Member</span>
              )}
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-slate-500 font-medium text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> {user.email}
              </div>
              {user.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" /> {user.phone}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" /> {user.role?.toUpperCase()}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Joined {new Date(user.created_at).getFullYear()}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
             <Link to="/profile/edit" className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
                <Settings className="w-4 h-4" /> Edit Profile
             </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-10">
            {isStaff ? (
              <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 relative overflow-hidden group">
                 <div className="relative z-10">
                    <Command className="w-12 h-12 text-secondary mb-6" />
                    <h2 className="text-3xl font-black tracking-tighter mb-4">Management Console</h2>
                    <p className="text-white/60 mb-8 max-w-md leading-relaxed">
                      As a {user.role}, you have elevated permissions to manage products, categories, and store operations. Access your professional dashboard to monitor real-time stats.
                    </p>
                    <button 
                      onClick={() => navigate('/admin')}
                      className="px-8 py-4 bg-secondary text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-white hover:text-slate-900 transition-all group-hover:scale-105"
                    >
                      Enter Admin Dashboard <ArrowRight className="w-5 h-5" />
                    </button>
                 </div>
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
                 <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -ml-32 -mb-32" />
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 md:p-10">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-2xl font-bold text-slate-900">Recent Orders</h2>
                  <Link 
                    to="/products" 
                    className="group flex items-center gap-3 px-5 py-2.5 bg-slate-50 hover:bg-secondary text-slate-900 hover:text-white rounded-full transition-all duration-500 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-secondary/20"
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Continue Shopping</span>
                    <div className="w-6 h-6 rounded-full bg-white group-hover:bg-white/20 flex items-center justify-center transition-colors">
                      <ShoppingBag className="w-3 h-3 group-hover:scale-110 transition-transform" />
                    </div>
                  </Link>
                </div>

                {loadingOrders ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-slate-50 animate-pulse rounded-2xl" />)}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold text-sm">No orders found yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-white border border-slate-100 rounded-3xl overflow-hidden group hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500">
                        <div className="p-6 md:p-8 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-50">
                          <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 text-slate-400">
                              <Package className="w-7 h-7" />
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-xl tracking-tight">Order #{order.id}</p>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-8">
                            <div className="text-right">
                              <p className="text-2xl font-black text-secondary tracking-tighter">৳{order.total_price.toLocaleString()}</p>
                              <div className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border mt-1 flex items-center gap-1.5 justify-end ${
                                order.order_status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                order.order_status === 'Shipped' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                order.order_status === 'Confirmed' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                order.order_status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                                'bg-amber-50 text-amber-600 border-amber-100'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                   order.order_status === 'Delivered' ? 'bg-emerald-500' : 
                                   order.order_status === 'Shipped' ? 'bg-blue-500' :
                                   order.order_status === 'Confirmed' ? 'bg-indigo-500' :
                                   order.order_status === 'Cancelled' ? 'bg-red-500' :
                                   'bg-amber-500 animate-pulse'
                                }`} />
                                {order.order_status === 'Confirmed' ? 'Accepted' : order.order_status}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Order Items with Review Action */}
                        <div className="p-6 md:p-8 space-y-4">
                           {order.items?.map(item => (
                             <div key={item.id} className="flex items-center justify-between gap-4 p-4 bg-slate-50/30 rounded-2xl border border-slate-50">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100">
                                      {item.quantity}×
                                   </div>
                                   <p className="text-sm font-bold text-slate-700">{item.product?.name || `Product ID: ${item.product_id}`}</p>
                                </div>
                                {order.order_status === 'Delivered' && (
                                   <button 
                                     onClick={() => openReviewModal(item.product)}
                                     className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-secondary transition-all shadow-lg shadow-slate-200"
                                   >
                                      Review
                                   </button>
                                )}
                             </div>
                           ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Actions */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Account Services</h3>
               <div className="space-y-2">
                   {(isStaff ? [
                    { label: 'Product Inventory', icon: Package, to: '/admin/products' },
                    { label: 'Manage Categories', icon: Zap, to: '/admin/categories' },
                    { label: 'Order Processing', icon: Truck, to: '/admin/orders' },
                    { label: 'Account Security', icon: Shield, to: '/profile/edit' },
                  ] : [
                    { label: 'Shipping Addresses', icon: MapPin, to: '/profile/edit' },
                    { label: 'Payment Methods', icon: CreditCard, to: '#' },
                    { label: 'Wishlist Items', icon: Heart, to: '/wishlist' },
                    { label: 'Account Security', icon: Shield, to: '/profile/edit' },
                  ]).map((link) => (
                    <button 
                      key={link.label} 
                      onClick={() => link.to !== '#' && navigate(link.to)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/40 rounded-2xl transition-all group"
                    >
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 shadow-sm group-hover:bg-secondary group-hover:text-white transition-all">
                             <link.icon className="w-5 h-5" />
                          </div>
                          <span className="font-bold text-sm text-slate-700">{link.label}</span>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
               </div>

               <button 
                onClick={logout}
                className="w-full flex items-center gap-3 p-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-all mt-6 pt-6 border-t border-slate-50 group"
               >
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all">
                     <LogOut className="w-5 h-5" />
                  </div>
                  Sign Out
               </button>
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
               <div className="relative z-10">
                  <Star className="w-8 h-8 text-amber-400 fill-amber-400 mb-4" />
                  <h3 className="text-lg font-bold mb-2">Eraya Loyalty</h3>
                  <p className="text-white/40 text-xs leading-relaxed">You've completed {orders.filter(o => o.order_status === 'Delivered').length} orders. Keep shopping to unlock premium perks!</p>
               </div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16" />
            </div>
          </div>

        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal 
        isOpen={isReviewModalOpen} 
        onClose={() => setIsReviewModalOpen(false)}
        product={selectedProduct}
        onSubmit={fetchOrders}
      />
    </div>
  );
};

const ReviewModal = ({ isOpen, onClose, product, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    setLoading(true);
    try {
      await api.post('/reviews', {
        product_id: product.id,
        rating,
        comment,
      });
      toast.success('Thank you for your feedback!');
      onSubmit();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Share Feedback</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{product?.name}</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-all">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="flex flex-col items-center gap-4 py-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">How would you rate this piece?</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                        className="transition-all active:scale-90"
                      >
                        <Star 
                          className={`w-10 h-10 ${
                            (hover || rating) >= star 
                              ? 'fill-amber-400 text-amber-400' 
                              : 'text-slate-200'
                          } transition-colors duration-200`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs font-bold text-slate-900">
                    {rating === 5 ? 'Excellent' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : rating === 1 ? 'Poor' : 'Select Stars'}
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Your Experience (Optional)</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us what you loved about this product..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-6 text-sm font-medium outline-none focus:bg-white focus:ring-4 focus:ring-secondary/5 focus:border-secondary transition-all min-h-[150px] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || rating === 0}
                  className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-secondary transition-all shadow-xl shadow-slate-200 disabled:opacity-50 active:scale-95"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Submit Feedback'}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Profile;
