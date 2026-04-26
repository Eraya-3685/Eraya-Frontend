import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, CheckCircle, Trash2, ChevronDown, 
  Package, Truck, CheckCircle2, XCircle, 
  Clock, AlertCircle, ShoppingCart, ArrowRight,
  Filter
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const statusConfigs = {
  Pending: { 
    color: 'bg-amber-50 text-amber-600 border-amber-200', 
    icon: Clock, 
    desc: 'Order placed, awaiting confirmation' 
  },
  Confirmed: { 
    color: 'bg-blue-50 text-blue-600 border-blue-200', 
    icon: CheckCircle2, 
    desc: 'Order confirmed and paid' 
  },
  Shipped: { 
    color: 'bg-purple-50 text-purple-600 border-purple-200', 
    icon: Truck, 
    desc: 'Package is in transit' 
  },
  Delivered: { 
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200', 
    icon: Package, 
    desc: 'Order successfully delivered' 
  },
  Cancelled: { 
    color: 'bg-red-50 text-red-500 border-red-200', 
    icon: XCircle, 
    desc: 'Order has been cancelled' 
  },
};

const paymentColors = {
  Pending: 'text-amber-600',
  Paid: 'text-emerald-600',
  Failed: 'text-red-500',
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/orders');
      setOrders(res.data || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      // Backend: PUT /admin/orders/{id}/status { "status": "..." }
      await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order #${orderId} updated to ${newStatus}`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o));
    } catch (error) {
      toast.error(error.response?.data || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm(`Delete Order #${orderId}? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/orders/${orderId}`);
      toast.success('Order deleted');
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (error) {
      toast.error(error.response?.data || 'Failed to delete order');
    }
  };

  const statusOptions = ['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

  const filtered = orders.filter((o) => {
    const matchesSearch = String(o.id).includes(search) || o.shipping_address?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || o.order_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-slate-50/50">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-secondary" />
            Order Management
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Track and manage customer fulfillment across Eraya.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID or address..."
              className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
            />
          </div>
          <button onClick={fetchOrders} className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors">
            <RefreshCcw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Stats Summary (Optional Visual) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {['Pending', 'Confirmed', 'Shipped', 'Delivered'].map(s => (
          <div key={s} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s}</p>
            <p className="text-xl font-black text-slate-900">{orders.filter(o => o.order_status === s).length}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 bg-white/50 p-2 rounded-[2rem] border border-slate-100/50 w-fit">
        {statusOptions.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all border ${
              statusFilter === s
                ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200'
                : 'bg-transparent text-slate-400 border-transparent hover:bg-white hover:text-slate-600'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <AnimatePresence mode="wait">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
             <div className="w-12 h-12 border-4 border-slate-100 border-t-secondary rounded-full animate-spin" />
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Orders...</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-32 bg-white rounded-[3rem] border border-slate-100 shadow-sm"
          >
            <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No orders found</h3>
            <p className="text-slate-400 text-sm">Try adjusting your filters or search query.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/40 ${expandedId === order.id ? 'ring-2 ring-secondary/10' : ''}`}
              >
                {/* Order Row */}
                <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-start gap-6">
                    <button
                      onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                      className={`mt-1 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${expandedId === order.id ? 'bg-secondary/10 text-secondary' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      <ChevronDown className={`w-5 h-5 transition-transform duration-500 ${expandedId === order.id ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <div>
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <span className="text-lg font-black text-slate-900 tracking-tight">Order #{order.id}</span>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${statusConfigs[order.order_status]?.color}`}>
                           {React.createElement(statusConfigs[order.order_status]?.icon || AlertCircle, { className: 'w-3 h-3' })}
                           {order.order_status}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${paymentColors[order.payment_status] || 'text-slate-500'}`}>
                          {order.payment_status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                        <span className="text-secondary">{order.user?.full_name}</span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span>{order.user?.email}</span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span>{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span>{order.payment_method}</span>
                      </div>
                      
                      {order.shipping_address && (
                        <p className="text-[11px] font-medium text-slate-400 mt-2 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3" /> {order.shipping_address}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-6 md:pt-0 border-slate-50">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Amount</p>
                      <p className="text-2xl font-black text-secondary tracking-tighter">৳{order.total_price.toLocaleString()}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Quick Accept for Pending */}
                      {order.order_status === 'Pending' && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'Confirmed')}
                          disabled={updatingId === order.id}
                          className="px-6 py-3 bg-secondary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-secondary/20 disabled:opacity-50"
                        >
                          Accept Order
                        </button>
                      )}

                      {/* Status Dropdown */}
                      <div className="relative group">
                         <select
                           value={order.order_status}
                           onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                           disabled={updatingId === order.id}
                           className="appearance-none bg-slate-900 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest pr-10 cursor-pointer outline-none hover:bg-slate-800 transition-all disabled:opacity-50"
                         >
                           {statusOptions.filter(s => s !== 'All').map(s => (
                             <option key={s} value={s} className="bg-white text-slate-900">
                               {s === 'Confirmed' ? 'Accept / Confirm' : s}
                             </option>
                           ))}
                         </select>
                         <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                      </div>

                      <button
                        onClick={() => handleDelete(order.id)}
                        className="w-11 h-11 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Section: Order Items & Details */}
                <AnimatePresence>
                  {expandedId === order.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-50"
                    >
                      <div className="p-8 md:p-10 bg-slate-50/30">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                           {/* Items List */}
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Line Items ({order.items?.length || 0})</p>
                              <div className="space-y-4">
                                {order.items?.map((item) => (
                                  <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-4">
                                       <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center font-black text-secondary text-sm">
                                          {item.quantity}×
                                       </div>
                                       <div>
                                          <p className="text-sm font-bold text-slate-900">{item.product?.name || `Product ID: ${item.product_id}`}</p>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Unit Price: ৳{item.price_at_purchase.toLocaleString()}</p>
                                       </div>
                                    </div>
                                    <p className="text-sm font-black text-slate-900">৳{(item.price_at_purchase * item.quantity).toLocaleString()}</p>
                                  </div>
                                ))}
                              </div>
                           </div>

                           {/* Timeline / Additional Info */}
                           <div className="space-y-6">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Fulfillment Details</p>
                              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                                 <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                                       <Truck className="w-5 h-5" />
                                    </div>
                                    <div>
                                       <p className="text-xs font-bold text-slate-900">Delivery Information</p>
                                       <p className="text-[11px] font-medium text-slate-500 mt-1">Standard Shipping via Eraya Express.</p>
                                       {order.tracking_number && (
                                          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-[10px] font-black text-slate-500 border border-slate-100">
                                             TRACKING: {order.tracking_number}
                                          </div>
                                       )}
                                    </div>
                                 </div>
                                 
                                 <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                                       <Star className="w-5 h-5" />
                                    </div>
                                    <div>
                                       <p className="text-xs font-bold text-slate-900">Order Instructions</p>
                                       <p className="text-[11px] font-medium text-slate-500 mt-1">No special instructions provided by the buyer.</p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Re-using some icons from elsewhere or standard lucide
const MapPin = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
);

const RefreshCcw = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
);

export default AdminOrders;
