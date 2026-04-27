import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Truck, CheckCircle2, Clock, Zap, XCircle, 
  ChevronLeft, MapPin, CreditCard, ShoppingBag, 
  ArrowRight, Calendar, AlertCircle
} from 'lucide-react';
import api, { getImageUrl } from '../api/axios';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { Toaster } from 'react-hot-toast';

const statusMap = {
  Pending: { color: 'amber', icon: Clock, label: 'Order Received', desc: 'We have received your order and it is awaiting confirmation.' },
  Confirmed: { color: 'indigo', icon: Package, label: 'Order Accepted', desc: 'Good news! Your order has been accepted and is being prepared.' },
  Processing: { color: 'blue', icon: Zap, label: 'Processing', desc: 'Your order is currently being carefully packed for shipment.' },
  Shipped: { color: 'purple', icon: Truck, label: 'In Transit', desc: 'Great news! Your package is on its way to your destination.' },
  Delivered: { color: 'emerald', icon: CheckCircle2, label: 'Delivered', desc: 'Excellent! Your order has been successfully delivered.' },
  Cancelled: { color: 'red', icon: XCircle, label: 'Cancelled', desc: 'This order has been cancelled and will not be fulfilled.' },
};

const OrderTrackbar = ({ status }) => {
  const steps = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
  const currentIndex = steps.indexOf(status);
  const isCancelled = status === 'Cancelled';

  if (isCancelled) {
    return (
      <div className="py-10 px-6 bg-red-50 rounded-[2.5rem] border border-red-100 flex flex-col items-center text-center gap-4">
        <XCircle className="w-12 h-12 text-red-500" />
        <div>
          <h3 className="text-lg font-black text-red-900 uppercase tracking-widest">Order Cancelled</h3>
          <p className="text-xs font-medium text-red-400 mt-1 max-w-xs">This transaction has been terminated. If this was a mistake, please contact support.</p>
        </div>
      </div>
    );
  }

  const currentThemeColor = statusMap[status]?.color || 'amber';

  return (
    <div className="py-12">
      <div className="relative flex justify-between">
        <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-slate-100 -translate-y-1/2 z-0 rounded-full" />
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          className={`absolute top-1/2 left-0 h-1.5 bg-${currentThemeColor}-500 -translate-y-1/2 z-0 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(var(--color-rgb),0.3)]`}
        />

        {steps.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const config = statusMap[step];
          const color = config.color;
          const Icon = config.icon;

          return (
            <div key={step} className="relative z-10 flex flex-col items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-4 transition-all duration-700 ${
                isActive 
                  ? `bg-${color}-500 border-white text-white shadow-xl shadow-${color}-200 scale-110` 
                  : 'bg-white border-slate-50 text-slate-200'
              }`}>
                <Icon className={`w-6 h-6 ${isCurrent ? 'animate-pulse' : ''}`} strokeWidth={2.5} />
              </div>
              <div className="text-center">
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isActive ? `text-${color}-600` : 'text-slate-300'}`}>
                  {step === 'Confirmed' ? 'Accepted' : step}
                </p>
                {isCurrent && (
                   <motion.div 
                     initial={{ opacity: 0, y: 5 }}
                     animate={{ opacity: 1, y: 0 }}
                     className={`w-2 h-2 bg-${color}-500 rounded-full mx-auto`}
                   />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const OrderTracking = () => {
  useDocumentTitle('Track Your Order');
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${id}`);
      setOrder(response.data);
    } catch (err) {
      console.error('Failed to fetch order', err);
      setError(err.response?.data?.error || 'Order not found or unauthorized access.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-20 h-20">
             <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
             <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin" />
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing with Logistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-12 text-center border border-slate-100">
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-4">Tracking Error</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-10">{error}</p>
          <button 
            onClick={() => navigate('/profile')}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
          >
            Back to My Orders
          </button>
        </div>
      </div>
    );
  }

  const currentStatus = order.order_status;
  const config = statusMap[currentStatus] || statusMap.Pending;
  const statusColor = config.color;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 pt-12 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        
        <Link to="/profile" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest mb-10 transition-colors group">
          <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-all">
            <ChevronLeft className="w-4 h-4" />
          </div>
          Back to Profile
        </Link>

        {/* Header Information */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
               <div className={`px-4 py-1.5 bg-${statusColor}-50 text-${statusColor}-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-${statusColor}-100`}>
                 Live Tracking
               </div>
               <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Order ID: #{order.id}</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Your order is <span className={`text-${statusColor}-500`}>{config.label}</span></h1>
            <p className="text-slate-500 text-sm font-medium mt-2 max-w-md">{config.desc}</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Placed On</p>
            <p className="text-xl font-black text-slate-900">{new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
        </div>

        {/* The Trackbar */}
        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] p-10 mb-10 overflow-x-auto md:overflow-x-visible">
           <OrderTrackbar status={currentStatus} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
           {/* Details Column */}
           <div className="md:col-span-7 space-y-8">
              {/* Order Items */}
              <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-8">
                 <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-3">
                    <ShoppingBag className="w-4 h-4 text-indigo-500" />
                    Purchase Summary
                 </h2>
                 <div className="space-y-4">
                    {order.items?.map((item) => (
                       <div key={item.id} className="flex items-center justify-between gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-50 group hover:border-indigo-100 transition-colors">
                          <div className="flex items-center gap-4 flex-grow">
                             <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm p-2 flex items-center justify-center">
                                <img src={getImageUrl(item.product?.image_url)} className="w-full h-full object-contain" alt={item.product?.name} />
                             </div>
                             <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">{item.product?.name}</p>
                                <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">{item.quantity} × ৳{item.price_at_purchase.toLocaleString()}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-sm font-black text-slate-900">৳{(item.price_at_purchase * item.quantity).toLocaleString()}</p>
                          </div>
                       </div>
                    ))}
                 </div>

                 <div className="mt-10 pt-8 border-t border-dashed border-slate-200 space-y-3">
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-400">
                       <span className="uppercase tracking-widest">Subtotal</span>
                       <span className="text-slate-900">৳{order.items?.reduce((sum, i) => sum + (i.price_at_purchase * i.quantity), 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-400">
                       <span className="uppercase tracking-widest">Shipping Fee</span>
                       <span className="text-indigo-600">+ ৳{(order.total_price - order.items?.reduce((sum, i) => sum + (i.price_at_purchase * i.quantity), 0)).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4">
                       <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Total Amount Paid</span>
                       <span className="text-2xl font-black text-indigo-600 tracking-tighter">৳{order.total_price.toLocaleString()}</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Info Column */}
           <div className="md:col-span-5 space-y-8">
              {/* Delivery Details */}
              <div className="bg-slate-900 text-white rounded-[3rem] p-8 relative overflow-hidden">
                 <div className="relative z-10">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-8">Fulfillment Details</h2>
                    <div className="space-y-8">
                       <div className="flex gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-secondary border border-white/10">
                             <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Shipping Address</p>
                             <p className="text-xs font-bold text-white/90 leading-relaxed">{order.shipping_address}</p>
                          </div>
                       </div>

                       <div className="flex gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-indigo-400 border border-white/10">
                             <CreditCard className="w-5 h-5" />
                          </div>
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Payment Method</p>
                             <p className="text-xs font-bold text-white/90 uppercase tracking-wider">{order.payment_method === 'cod' || order.payment_method === 'COD' ? 'Cash on Delivery' : order.payment_method}</p>
                          </div>
                       </div>

                       {order.tracking_number && (
                         <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
                               <Truck className="w-5 h-5" />
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-secondary/50 mb-1">Courier Tracking ID</p>
                               <p className="text-sm font-black text-white tracking-widest uppercase">{order.tracking_number}</p>
                            </div>
                         </div>
                       )}
                    </div>
                 </div>
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
              </div>

              {/* Support Card */}
              <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 text-center">
                 <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Package className="w-8 h-8 text-indigo-600" />
                 </div>
                 <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">Need Assistance?</h3>
                 <p className="text-xs font-medium text-slate-400 leading-relaxed mb-8 px-4">Our artisan support team is available 24/7 for any questions regarding your package.</p>
                 <button className="w-full py-4 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 transition-all">
                    Contact Support
                 </button>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default OrderTracking;
