import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Package, Truck, CheckCircle2, XCircle, 
  Clock, ShoppingCart, RefreshCcw, MapPin, CreditCard, 
  ChevronDown, Zap
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const statusConfigs = {
  Pending: { color: 'bg-amber-50 text-amber-600 border-amber-200', icon: Clock },
  Confirmed: { color: 'bg-rose-50 text-[#e11d48] border-rose-200', icon: Package },
  Processing: { color: 'bg-blue-50 text-blue-600 border-blue-200', icon: Zap },
  Shipped: { color: 'bg-purple-50 text-purple-600 border-purple-200', icon: Truck },
  Delivered: { color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: CheckCircle2 },
  Cancelled: { color: 'bg-slate-50 text-slate-500 border-slate-200', icon: XCircle },
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

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

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusUpdate = async (orderID, status) => {
    try {
      await api.put(`/admin/orders/${orderID}/status`, { status });
      toast.success(`Status updated to ${status}`);
      fetchOrders();
    } catch {
      toast.error('Update failed');
    }
  };

  const filtered = orders.filter(o => {
    const matchesSearch = String(o.id).includes(search) || o.user?.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || o.order_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Orders</h1>
         <div style={{ background: '#fff', padding: '0.35rem', borderRadius: '1rem', border: '1px solid #f1f5f9', display: 'flex', gap: '0.2rem' }}>
            {['All', 'Pending', 'Delivered'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{ border: 'none', padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', background: statusFilter === s ? '#e11d48' : 'transparent', color: statusFilter === s ? '#fff' : '#64748b' }}>{s}</button>
            ))}
         </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
         {[
           { label: 'Pending', count: orders.filter(o => o.order_status === 'Pending').length, color: '#f59e0b', icon: Clock },
           { label: 'Accepted', count: orders.filter(o => o.order_status === 'Confirmed').length, color: '#e11d48', icon: Package },
           { label: 'Shipped', count: orders.filter(o => o.order_status === 'Shipped').length, color: '#6366f1', icon: Truck },
           { label: 'Completed', count: orders.filter(o => o.order_status === 'Delivered').length, color: '#10b981', icon: CheckCircle2 },
         ].map((stat, i) => (
           <div key={i} style={{ background: '#fff', padding: '1rem 1.25rem', borderRadius: '1.75rem', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 40, height: 40, background: `${stat.color}10`, borderRadius: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}><stat.icon size={18} /></div>
              <div>
                 <p style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', margin: '0 0 0.15rem' }}>{stat.label}</p>
                 <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{stat.count}</h2>
              </div>
           </div>
         ))}
      </div>

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: '1rem' }}>
         <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#94a3b8' }} />
            <input type="text" placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', background: '#fff', border: '1px solid #f1f5f9', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 700, outline: 'none' }} />
         </div>
         <button onClick={fetchOrders} style={{ width: 44, height: 44, borderRadius: '1rem', border: '1px solid #f1f5f9', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}><RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      {/* Orders List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
         {loading ? (
           <div style={{ height: '30vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 30, height: 30, border: '3px solid #f1f5f9', borderTopColor: '#e11d48', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>
         ) : filtered.map((order) => (
           <div key={order.id} style={{ background: '#fff', borderRadius: '2rem', border: '1px solid #f1f5f9', padding: '1rem 1.5rem', transition: 'all 0.3s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 44, height: 44, background: '#f8f9fc', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', fontWeight: 900, fontSize: '0.8rem' }}>#{order.id}</div>
                    <div>
                       <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.15rem' }}>{order.user?.full_name}</h4>
                       <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', margin: 0 }}>{new Date(order.created_at).toLocaleDateString()} • {order.items?.length || 0} items</p>
                    </div>
                 </div>

                 <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div style={{ textAlign: 'right' }}>
                       <p style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', margin: '0 0 0.15rem', textTransform: 'uppercase' }}>Total</p>
                       <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#e11d48', margin: 0 }}>৳{order.total_price.toLocaleString()}</h3>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                       <div style={{ padding: '0.4rem 1rem', borderRadius: '1rem', background: '#f8f9fc', color: '#64748b', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', border: '1px solid #f1f5f9' }}>{order.order_status}</div>
                       <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)} style={{ width: 36, height: 36, borderRadius: '0.85rem', border: '1px solid #f1f5f9', background: '#fff', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronDown size={16} style={{ transform: expandedId === order.id ? 'rotate(180deg)' : 'rotate(0)' }} /></button>
                    </div>
                 </div>
              </div>

              {expandedId === order.id && (
                <div style={{ paddingTop: '1.5rem', marginTop: '1.5rem', borderTop: '1px solid #f8f9fc', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                   <div>
                      <p style={{ fontSize: '0.7rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', marginBottom: '1rem' }}>Items</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                         {order.items?.map((item, i) => (
                           <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: '#f8f9fc', borderRadius: '1rem' }}>
                              <p style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{item.quantity}× {item.product?.name}</p>
                              <p style={{ fontSize: '0.8rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>৳{(item.price_at_purchase * item.quantity).toLocaleString()}</p>
                           </div>
                         ))}
                      </div>
                   </div>
                   <div style={{ background: '#f8f9fc', borderRadius: '1.5rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                         <p style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', margin: '0 0 0.35rem', textTransform: 'uppercase' }}>Shipping</p>
                         <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', margin: 0 }}><MapPin size={12} /> {order.shipping_address}</p>
                      </div>
                      <div style={{ marginTop: 'auto', display: 'flex', gap: '0.75rem' }}>
                         <button onClick={() => handleStatusUpdate(order.id, 'Confirmed')} style={{ flex: 1, background: '#e11d48', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '0.85rem', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>Accept</button>
                         <button onClick={() => handleStatusUpdate(order.id, 'Cancelled')} style={{ background: '#fff', color: '#e11d48', border: '1px solid #f1f5f9', padding: '0.75rem', borderRadius: '0.85rem', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                      </div>
                   </div>
                </div>
              )}
           </div>
         ))}
      </div>

      <style>{` @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } `}</style>
    </div>
  );
};

export default AdminOrders;
