import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle, Trash2, ChevronDown } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const statusColors = {
  Pending: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  Confirmed: 'bg-blue-50 text-blue-600 border-blue-200',
  Shipped: 'bg-purple-50 text-purple-600 border-purple-200',
  Delivered: 'bg-green-50 text-green-600 border-green-200',
  Cancelled: 'bg-red-50 text-red-500 border-red-200',
};

const paymentColors = {
  Pending: 'text-yellow-600',
  Paid: 'text-green-600',
  Failed: 'text-red-500',
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Backend: GET /admin/orders → []domain.Order
      const res = await api.get('/admin/orders');
      setOrders(res.data || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (orderId) => {
    try {
      // Backend: POST /admin/orders/{id}/confirm
      await api.post(`/admin/orders/${orderId}/confirm`);
      toast.success(`Order #${orderId} confirmed & marked as Paid`);
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data || 'Failed to confirm order');
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm(`Delete Order #${orderId}? This cannot be undone.`)) return;
    try {
      // Backend: DELETE /admin/orders/{id}
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
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-slate-900">Orders</h1>
        <p className="text-slate-500 text-xs mt-0.5">{orders.length} total orders</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 mb-6 flex flex-col md:flex-row gap-3">
        <div className="relative flex-grow max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders..."
            className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2 pl-10 pr-4 text-xs outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${
                statusFilter === s
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 text-slate-400">
          No orders found.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
            >
              {/* Order Row */}
              <div className="p-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    className="mt-1 p-1 hover:bg-slate-100 rounded-lg transition-all"
                  >
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedId === order.id ? 'rotate-180' : ''}`} />
                  </button>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-slate-900">Order #{order.id}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${statusColors[order.order_status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {order.order_status}
                      </span>
                      <span className={`text-xs font-bold ${paymentColors[order.payment_status] || 'text-slate-500'}`}>
                        {order.payment_status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })} · {order.payment_method}
                    </p>
                    {order.shipping_address && (
                      <p className="text-xs text-slate-400 mt-1 truncate max-w-xs">📍 {order.shipping_address}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-8 md:ml-0">
                  <span className="text-lg font-black text-primary">৳{order.total_price}</span>
                  <div className="flex items-center gap-2">
                    {order.order_status === 'Pending' && (
                      <button
                        onClick={() => handleConfirm(order.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl text-xs font-bold transition-all border border-green-200"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirm
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded: Order Items */}
              {expandedId === order.id && (
                <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/50">
                  {order.items?.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Order Items</p>
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400 font-bold">{item.quantity}×</span>
                            <span className="text-slate-700 font-medium">
                              {item.product?.name || `Product #${item.product_id}`}
                            </span>
                          </div>
                          <span className="font-bold text-slate-700">
                            ৳{(item.price_at_purchase * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No item details available.</p>
                  )}
                  {order.tracking_number && (
                    <p className="text-xs text-slate-500 mt-3">🚚 Tracking: {order.tracking_number}</p>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
