import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, LogOut, MapPin, Phone, Mail, ArrowRight, 
  ShoppingBag, Edit, Camera, X, Save, Shield, 
  CreditCard, Bell, HelpCircle, ChevronRight, User as UserIcon, Command, Heart, Zap, Settings,
  Truck,
  Calendar,
  Star,
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';

import useAuthStore from '../store/useAuthStore';
import api, { getImageUrl } from '../api/axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import useDocumentTitle from '../hooks/useDocumentTitle';

const statusMap = {
  Pending: { color: 'amber', icon: Clock },
  Confirmed: { color: 'indigo', icon: Package },
  Processing: { color: 'blue', icon: Zap },
  Shipped: { color: 'purple', icon: Truck },
  Delivered: { color: 'emerald', icon: CheckCircle2 },
  Cancelled: { color: 'red', icon: XCircle },
};

const OrderTrackbar = ({ status }) => {
  const steps = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
  const currentIndex = steps.indexOf(status);
  const isCancelled = status === 'Cancelled';

  if (isCancelled) {
    const config = statusMap.Cancelled;
    const Icon = config.icon;
    return (
      <div className="py-8 px-4 bg-red-50 rounded-[2rem] border border-red-100 flex items-center justify-center gap-4">
        <Icon className="w-6 h-6 text-red-500" />
        <div>
          <p className="text-sm font-black text-red-900 uppercase tracking-widest">Order Cancelled</p>
          <p className="text-[10px] font-bold text-red-400 mt-0.5 uppercase tracking-widest">This transaction has been terminated.</p>
        </div>
      </div>
    );
  }

  // Determine current theme color based on status
  const currentThemeColor = statusMap[status]?.color || 'amber';

  return (
    <div className="py-8 px-2">
      <div className="relative flex justify-between">
        {/* Progress Line Background */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0 rounded-full" />
        
        {/* Active Progress Line */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          className={`absolute top-1/2 left-0 h-1 bg-${currentThemeColor}-500 -translate-y-1/2 z-0 rounded-full transition-colors duration-1000`}
        />

        {steps.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const config = statusMap[step];
          const color = config.color;
          const Icon = config.icon;

          return (
            <div key={step} className="relative z-10 flex flex-col items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border-4 transition-all duration-500 ${
                isActive 
                  ? `bg-${color}-500 border-white text-white shadow-lg shadow-${color}-200 scale-110` 
                  : 'glass-card-light border-slate-50 text-slate-200'
              }`}>
                <Icon className={`w-4 h-4 ${isCurrent ? 'animate-pulse' : ''}`} strokeWidth={2.5} />
              </div>
              <div className="text-center min-w-[80px]">
                <p className={`text-[9px] font-black uppercase tracking-widest ${isActive ? `text-${color}-600` : 'text-slate-300'}`}>
                  {step === 'Confirmed' ? 'Accepted' : step}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


const Profile = () => {
  useDocumentTitle('My Profile');
  const { user, token, logout, uploadAvatar, fetchProfile } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const fileInputRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();

  const isStaff = ['admin', 'moderator'].includes(user?.role?.toLowerCase());

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('payment');
    
    if (paymentStatus === 'success') {
      toast.success('Payment completed successfully!');
      // remove param without reloading
      window.history.replaceState({}, document.title, location.pathname);
    } else if (paymentStatus === 'failed') {
      toast.error('Payment failed or cancelled.');
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location]);

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

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  if (!user && token) {
    return (
      <div className="min-h-screen flex items-center justify-center glass-card-light">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white/[0.1] border-t-slate-900 rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-500 animate-pulse uppercase tracking-widest">Securing Session...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen pb-24 pt-28 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Profile Header */}
        <div className="glass-card-light rounded-[2rem] border border-white/[0.08] shadow-sm p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden relative group">
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
              className="absolute bottom-0 right-0 w-9 h-9 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-secondary transition-all active:scale-95 disabled:opacity-50"
            >
              {avatarUploading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Camera className="w-4 h-4" />}
            </button>
            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
          </div>

          <div className="text-center md:text-left flex-grow">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
              <h1 className="text-2xl font-black text-white tracking-tight">{user.full_name}</h1>
              {isStaff ? (
                <span className="w-fit mx-auto md:mx-0 px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-full">Official Staff</span>
              ) : (
                <span className="w-fit mx-auto md:mx-0 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">Verified Member</span>
              )}
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-slate-500 font-bold text-[11px] tracking-wider">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </div>
              {user.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" /> {user.phone}
                </div>
              )}
              {user.address && (
                <div className="flex items-center gap-2 max-w-[200px] md:max-w-xs truncate" title={user.address}>
                  <MapPin className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{user.address}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" /> {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() : ''}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Joined {new Date(user.created_at).getFullYear()}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
             <Link to="/profile/edit" className="px-5 py-2.5 border border-white/[0.08] rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-white hover:glass-card-light transition-all flex items-center gap-2">
                <Settings className="w-3.5 h-3.5" /> Edit Profile
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
                      className="px-8 py-4 bg-secondary text-white rounded-2xl font-bold flex items-center gap-3 hover:glass-card-light hover:text-white transition-all group-hover:scale-105"
                    >
                      Enter Admin Dashboard <ArrowRight className="w-5 h-5" />
                    </button>
                 </div>
                 <div className="absolute top-0 right-0 w-64 h-64 glass-card-light/5 rounded-full blur-3xl -mr-32 -mt-32" />
                 <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -ml-32 -mb-32" />
              </div>
            ) : (
              <div className="glass-card-light rounded-[2rem] border border-white/[0.08] shadow-sm p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-black text-white tracking-tight">Recent Orders</h2>
                  <Link 
                    to="/products" 
                    className="group flex items-center gap-2 px-4 py-2 glass-card-light hover:bg-secondary text-white hover:text-white rounded-full transition-all duration-500 border border-white/[0.08] shadow-sm"
                  >
                    <span className="text-[9px] font-black uppercase tracking-[0.15em]">Shop More</span>
                    <div className="w-5 h-5 rounded-full glass-card-light group-hover:glass-card-light/20 flex items-center justify-center transition-colors">
                      <ShoppingBag className="w-2.5 h-2.5 group-hover:scale-110 transition-transform" />
                    </div>
                  </Link>
                </div>

                {loadingOrders ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-24 glass-card-light animate-pulse rounded-2xl" />)}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-20 glass-card-light rounded-3xl border border-dashed border-white/[0.1]">
                    <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold text-sm">No orders found yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="divide-y divide-slate-50">
                      {orders.map((order) => {
                        const subtotal = order.items?.reduce((sum, item) => sum + (item.price_at_purchase * item.quantity), 0) || 0;
                        const shipping = order.total_price > subtotal ? order.total_price - subtotal : 0;
                        const orderConfig = statusMap[order.order_status] || statusMap.Pending;
                        const StatusIcon = orderConfig.icon;
                        const statusColor = orderConfig.color;
                        const isExpanded = expandedOrderId === order.id;

                        return (
                          <div key={order.id} className="overflow-hidden">
                            <button 
                              onClick={() => toggleOrderExpansion(order.id)}
                              className={`w-full p-4 md:p-5 flex flex-col md:flex-row justify-between items-center gap-4 transition-all group ${isExpanded ? 'glass-card-light/80' : 'hover:glass-card-light/50'}`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
                                  isExpanded 
                                    ? `bg-${statusColor}-500 text-white border-${statusColor}-500 shadow-lg shadow-${statusColor}-100` 
                                    : `bg-${statusColor}-50 border-${statusColor}-100 text-${statusColor}-500 group-hover:bg-${statusColor}-500 group-hover:text-white`
                                }`}>
                                  <StatusIcon className="w-5 h-5" strokeWidth={2.5} />
                                </div>
                                <div className="text-left">
                                  <p className="font-black text-white text-sm tracking-tight">Order #{order.id}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                    {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                    <span className="text-secondary/70">{order.payment_method === 'cod' || order.payment_method === 'COD' ? 'Cash on Delivery' : order.payment_method}</span>
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="text-right">
                                  <p className="text-lg font-black text-secondary tracking-tighter">৳{order.total_price.toLocaleString()}</p>
                                  <div className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border mt-1 flex items-center gap-1.5 justify-end ${
                                    order.order_status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                    order.order_status === 'Shipped' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                    order.order_status === 'Processing' ? 'bg-sky-50 text-sky-600 border-sky-100' :
                                    order.order_status === 'Confirmed' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                    order.order_status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                                    'bg-amber-50 text-amber-600 border-amber-100'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                       order.order_status === 'Delivered' ? 'bg-emerald-500' : 
                                       order.order_status === 'Shipped' ? 'bg-blue-500' :
                                       order.order_status === 'Processing' ? 'bg-sky-500' :
                                       order.order_status === 'Confirmed' ? 'bg-indigo-500' :
                                       order.order_status === 'Cancelled' ? 'bg-red-500' :
                                       'bg-amber-500 animate-pulse'
                                    }`} />
                                    {order.order_status === 'Confirmed' ? 'Accepted' : order.order_status}
                                  </div>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-500 ${isExpanded ? 'rotate-180 text-secondary' : 'group-hover:text-slate-500'}`} />
                              </div>
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-slate-50 glass-card-light"
                                >
                                  <div className="p-6 space-y-10">
                                    {/* Trackbar */}
                                    <div className="max-w-xl mx-auto">
                                       <OrderTrackbar status={order.order_status} />
                                    </div>

                                    {/* Items */}
                                    <div className="space-y-2">
                                      {order.items?.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between gap-3 p-3 glass-card-light/50 rounded-2xl border border-slate-50">
                                          <Link to={`/products/${item.product?.slug}`} className="flex items-center gap-4 flex-grow group/item">
                                            <div className="w-12 h-12 glass-card-light rounded-xl overflow-hidden border border-white/[0.08] shadow-sm group-hover/item:scale-105 transition-all">
                                              <img src={getImageUrl(item.product?.image_url)} className="w-full h-full object-contain p-1.5" alt={item.product?.name} />
                                            </div>
                                            <div className="min-w-0 text-left">
                                              <p className="text-xs font-bold text-slate-800 group-hover/item:text-secondary transition-colors truncate">{item.product?.name}</p>
                                              <p className="text-[9px] font-black text-slate-400 mt-0.5 uppercase tracking-widest">{item.quantity} × ৳{item.price_at_purchase.toLocaleString()}</p>
                                            </div>
                                          </Link>
                                          <div className="text-right shrink-0">
                                            <p className="text-xs font-black text-white">৳{(item.price_at_purchase * item.quantity).toLocaleString()}</p>
                                            {order.order_status === 'Delivered' && (
                                              <button onClick={() => openReviewModal(item.product)} className="text-[9px] font-black text-secondary uppercase tracking-widest hover:underline mt-0.5">Review</button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Summary & Shipping */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="bg-slate-900 text-white rounded-2xl p-5 relative overflow-hidden">
                                        <div className="relative z-10 space-y-2">
                                          <div className="flex justify-between items-center text-[10px]">
                                            <span className="font-bold text-white/40 uppercase tracking-widest">Subtotal</span>
                                            <span className="font-black">৳{subtotal.toLocaleString()}</span>
                                          </div>
                                          {shipping > 0 && (
                                            <div className="flex justify-between items-center text-[10px]">
                                              <span className="font-bold text-white/40 uppercase tracking-widest">Shipping</span>
                                              <span className="font-black text-secondary">+ ৳{shipping.toLocaleString()}</span>
                                            </div>
                                          )}
                                          <div className="pt-3 border-t border-white/10 flex justify-between items-end">
                                            <div>
                                              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest block">Total</span>
                                              <span className="text-[8px] font-bold text-white/40 block mt-0.5 italic uppercase">via {order.payment_method === 'cod' || order.payment_method === 'COD' ? 'Cash On Delivery' : order.payment_method}</span>
                                            </div>
                                            <span className="text-lg font-black text-white tracking-tighter">৳{order.total_price.toLocaleString()}</span>
                                          </div>
                                        </div>

                                        {/* bKash Payment Info for Buyer */}
                                        {(order.payment_method?.toLowerCase() === 'bkash' && (order.trx_id || order.sender_number)) && (
                                          <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
                                            <div className="flex items-center gap-2 mb-1">
                                              <div className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(255,51,102,0.5)]" />
                                              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">bKash Transaction Details</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                              {order.sender_number && (
                                                <div>
                                                  <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-0.5">Sender Number</p>
                                                  <p className="text-[11px] font-bold text-white/90">{order.sender_number}</p>
                                                </div>
                                              )}
                                              {order.paid_amount && (
                                                <div>
                                                  <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-0.5">Amount Sent</p>
                                                  <p className="text-[11px] font-bold text-secondary">৳{order.paid_amount.toLocaleString()}</p>
                                                </div>
                                              )}
                                              {order.trx_id && (
                                                <div className="col-span-2">
                                                  <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-0.5">Transaction ID</p>
                                                  <p className="text-[11px] font-bold text-white/90 tracking-wider font-mono">{order.trx_id}</p>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      <div className="glass-card-light rounded-2xl p-5 border border-white/[0.08]">
                                        <div className="flex items-center gap-2 mb-2">
                                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                          <h4 className="text-[9px] font-black text-white uppercase tracking-widest">Shipping</h4>
                                        </div>
                                        <p className="text-[10px] font-medium text-slate-500 leading-relaxed pl-5">{order.shipping_address}</p>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Actions */}
          <div className="lg:col-span-4 space-y-8">
            <div className="glass-card-light rounded-[2.5rem] border border-white/[0.08] shadow-sm p-8">
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
                      className="w-full flex items-center justify-between p-4 glass-card-light hover:glass-card-light border border-transparent hover:border-white/[0.08] hover:shadow-xl hover:shadow-slate-200/40 rounded-2xl transition-all group"
                    >
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 glass-card-light rounded-xl flex items-center justify-center border border-white/[0.08] shadow-sm group-hover:bg-secondary group-hover:text-white transition-all">
                             <link.icon className="w-5 h-5" />
                          </div>
                          <span className="font-bold text-sm text-slate-200">{link.label}</span>
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
               <div className="absolute top-0 right-0 w-32 h-32 glass-card-light/5 rounded-full blur-2xl -mr-16 -mt-16" />
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
            className="relative glass-card-light w-full max-w-lg rounded-[3rem] p-10 shadow-2xl border border-white/[0.08] overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight mb-2">Share Feedback</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{product?.name}</p>
                </div>
                <button onClick={onClose} className="p-2 hover:glass-card-light rounded-full transition-all">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="flex flex-col items-center gap-4 py-6 glass-card-light rounded-[2rem] border border-white/[0.08]">
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
                  <p className="text-xs font-bold text-white">
                    {rating === 5 ? 'Excellent' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : rating === 1 ? 'Poor' : 'Select Stars'}
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Your Experience (Optional)</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us what you loved about this product..."
                    className="w-full glass-card-light border border-white/[0.08] rounded-[2rem] p-6 text-sm font-medium outline-none focus:glass-card-light focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all min-h-[150px] resize-none"
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
