import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Package, Truck, CheckCircle2, XCircle, 
  Clock, ShoppingCart, RefreshCcw, MapPin, CreditCard, 
  ChevronDown, Zap
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const getStatusDisplayName = (status) => {
  if (status === 'Confirmed') return 'Accepted';
  if (status === 'Delivered') return 'Completed';
  return status;
};

const statusColors = {
  Pending: { text: '#d97706', bg: '#fef3c7', border: '#fde68a', icon: Clock },
  Confirmed: { text: '#e11d48', bg: '#ffe4e6', border: '#fecdd3', icon: Package },
  Processing: { text: '#2563eb', bg: '#dbeafe', border: '#bfdbfe', icon: Zap },
  Shipped: { text: '#7c3aed', bg: '#f3e8ff', border: '#e9d5ff', icon: Truck },
  Delivered: { text: '#059669', bg: '#d1fae5', border: '#a7f3d0', icon: CheckCircle2 },
  Cancelled: { text: '#4b5563', bg: '#f3f4f6', border: '#e5e7eb', icon: XCircle }
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1200);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, orderID: null, status: null });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth <= 1200);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  useEffect(() => {
    const handler = () => {
      fetchOrders();
    };
    window.addEventListener('admin-order-update', handler);
    return () => {
      window.removeEventListener('admin-order-update', handler);
    };
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);

  const triggerStatusUpdateConfirm = (orderID, status) => {
    setConfirmModal({ isOpen: true, orderID, status });
  };

  const handleStatusUpdate = async () => {
    const { orderID, status } = confirmModal;
    if (!orderID || !status) return;
    try {
      await api.put(`/admin/orders/${orderID}/status`, { status });
      toast.success(`Status updated to ${getStatusDisplayName(status)}`);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
  };

  const handleSortRequest = (key) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filtered = orders.filter(o => {
    const matchesSearch = String(o.id).includes(search) || (o.user?.full_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || o.order_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedOrders = React.useMemo(() => {
    let sortableItems = [...filtered];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'buyer') {
          aVal = (a.user?.full_name || '').toLowerCase();
          bVal = (b.user?.full_name || '').toLowerCase();
        } else if (sortConfig.key === 'created_at') {
          aVal = new Date(a.created_at || 0).getTime();
          bVal = new Date(b.created_at || 0).getTime();
        } else if (sortConfig.key === 'total_price') {
          aVal = a.total_price || 0;
          bVal = b.total_price || 0;
        } else if (sortConfig.key === 'payment_method') {
          aVal = (a.payment_method || '').toLowerCase();
          bVal = (b.payment_method || '').toLowerCase();
        } else if (sortConfig.key === 'order_status') {
          aVal = (a.order_status || '').toLowerCase();
          bVal = (b.order_status || '').toLowerCase();
        }

        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filtered, sortConfig]);

  const tabs = [
    { id: 'All', label: 'All', count: orders.length },
    { id: 'Pending', label: 'Pending', count: orders.filter(o => o.order_status === 'Pending').length },
    { id: 'Confirmed', label: 'Accepted', count: orders.filter(o => o.order_status === 'Confirmed').length },
    { id: 'Processing', label: 'Processing', count: orders.filter(o => o.order_status === 'Processing').length },
    { id: 'Shipped', label: 'Shipped', count: orders.filter(o => o.order_status === 'Shipped').length },
    { id: 'Delivered', label: 'Completed', count: orders.filter(o => o.order_status === 'Delivered').length },
    { id: 'Cancelled', label: 'Cancelled', count: orders.filter(o => o.order_status === 'Cancelled').length },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Orders</h1>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : (isTablet ? '1fr 1fr' : 'repeat(4, 1fr)'), gap: '1rem' }}>
         {[
            { label: 'Pending', count: orders.filter(o => o.order_status === 'Pending').length, color: '#d97706', icon: Clock },
            { label: 'Accepted', count: orders.filter(o => o.order_status === 'Confirmed').length, color: '#e11d48', icon: Package },
            { label: 'Shipped', count: orders.filter(o => o.order_status === 'Shipped').length, color: '#6366f1', icon: Truck },
            { label: 'Completed', count: orders.filter(o => o.order_status === 'Delivered').length, color: '#059669', icon: CheckCircle2 },
         ].map((stat, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '1.25rem', padding: '1rem 1.25rem', boxShadow: '0 4px 20px rgba(0,0,0,0.01)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'transform 0.2s ease' }}>
               <div>
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', margin: '0 0 0.25rem' }}>{stat.label}</p>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>{stat.count}</h2>
               </div>
               <div style={{ width: 36, height: 36, background: `${stat.color}10`, borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, flexShrink: 0 }}><stat.icon size={16} /></div>
            </div>
         ))}
      </div>

      {/* Status Category Tabs (User Page Pill Design) */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid #f1f5f9',
        paddingBottom: '0.75rem',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none'
      }}>
        {tabs.map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setSortConfig({ key: 'created_at', direction: 'desc' });
              }}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.1rem',
                borderRadius: '0.85rem',
                border: 'none',
                background: isActive ? '#fff1f2' : 'transparent',
                color: isActive ? '#e11d48' : '#64748b',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#f8f9fc';
                  e.currentTarget.style.color = '#0f172a';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#64748b';
                }
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 900,
                padding: '0.15rem 0.45rem',
                borderRadius: '0.5rem',
                background: isActive ? '#e11d48' : '#f1f5f9',
                color: isActive ? '#fff' : '#64748b',
                transition: 'all 0.2s'
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
         <div style={{ position: 'relative', flex: 1, maxWidth: 350 }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search orders..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              style={{ 
                width: '100%', 
                background: '#fff', 
                border: '1px solid #f1f5f9', 
                padding: '0 1rem 0 2.75rem', 
                height: 38,
                boxSizing: 'border-box',
                borderRadius: '1rem', 
                fontSize: '0.8rem', 
                fontWeight: 600, 
                outline: 'none', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.01)' 
              }} 
            />
         </div>
         <button 
           onClick={fetchOrders} 
           style={{ 
             width: 38, 
             height: 38, 
             borderRadius: '1rem', 
             border: '1px solid #f1f5f9', 
             background: '#fff', 
             display: 'flex', 
             alignItems: 'center', 
             justifyContent: 'center', 
             color: '#64748b', 
             cursor: 'pointer', 
             boxSizing: 'border-box',
             transition: 'all 0.2s' 
           }} 
           onMouseEnter={e => e.currentTarget.style.borderColor = '#e11d48'} 
           onMouseLeave={e => e.currentTarget.style.borderColor = '#f1f5f9'}
         >
           <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
         </button>
      </div>

      {/* Orders Table Container */}
      <div style={{ background: '#fff', borderRadius: '1.25rem', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
         <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: isMobile ? '700px' : 'auto' }}>
               <thead>
                  <tr style={{ background: '#f8f9fc', borderBottom: '1px solid #f1f5f9' }}>
                     <th 
                       onClick={() => handleSortRequest('buyer')}
                       style={{ padding: '0.85rem 1.25rem', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none' }}
                     >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                           <span>Order & Buyer</span>
                           <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.5rem', lineHeight: '0.6', color: '#cbd5e1' }}>
                              <span style={{ color: sortConfig?.key === 'buyer' && sortConfig?.direction === 'asc' ? '#e11d48' : '#cbd5e1' }}>▲</span>
                              <span style={{ color: sortConfig?.key === 'buyer' && sortConfig?.direction === 'desc' ? '#e11d48' : '#cbd5e1' }}>▼</span>
                           </div>
                        </div>
                     </th>
                     <th 
                       onClick={() => handleSortRequest('total_price')}
                       style={{ padding: '0.85rem 1.25rem', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none' }}
                     >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                           <span>Total Price</span>
                           <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.5rem', lineHeight: '0.6', color: '#cbd5e1' }}>
                              <span style={{ color: sortConfig?.key === 'total_price' && sortConfig?.direction === 'asc' ? '#e11d48' : '#cbd5e1' }}>▲</span>
                              <span style={{ color: sortConfig?.key === 'total_price' && sortConfig?.direction === 'desc' ? '#e11d48' : '#cbd5e1' }}>▼</span>
                           </div>
                        </div>
                     </th>
                     <th 
                       onClick={() => handleSortRequest('payment_method')}
                       style={{ padding: '0.85rem 1.25rem', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none' }}
                     >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                           <span>Payment Method</span>
                           <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.5rem', lineHeight: '0.6', color: '#cbd5e1' }}>
                              <span style={{ color: sortConfig?.key === 'payment_method' && sortConfig?.direction === 'asc' ? '#e11d48' : '#cbd5e1' }}>▲</span>
                              <span style={{ color: sortConfig?.key === 'payment_method' && sortConfig?.direction === 'desc' ? '#e11d48' : '#cbd5e1' }}>▼</span>
                           </div>
                        </div>
                     </th>
                     <th 
                       onClick={() => handleSortRequest('order_status')}
                       style={{ padding: '0.85rem 1.25rem', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none' }}
                     >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                           <span>Order Status</span>
                           <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.5rem', lineHeight: '0.6', color: '#cbd5e1' }}>
                              <span style={{ color: sortConfig?.key === 'order_status' && sortConfig?.direction === 'asc' ? '#e11d48' : '#cbd5e1' }}>▲</span>
                              <span style={{ color: sortConfig?.key === 'order_status' && sortConfig?.direction === 'desc' ? '#e11d48' : '#cbd5e1' }}>▼</span>
                           </div>
                        </div>
                     </th>
                     <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                  </tr>
               </thead>
               <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} style={{ height: '30vh', textAlign: 'center', verticalAlign: 'middle' }}>
                         <div style={{ display: 'inline-block', width: 24, height: 24, border: '2.5px solid #f1f5f9', borderTopColor: '#e11d48', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8' }}>
                         No orders found
                      </td>
                    </tr>
                  ) : sortedOrders.map((order) => {
                     const status = order.order_status || 'Pending';
                     const cfg = statusColors[status] || statusColors.Pending;
                     const StatusIcon = cfg.icon;
                     const isExpanded = expandedId === order.id;

                     return (
                       <React.Fragment key={order.id}>
                         <tr 
                           style={{ borderBottom: '1px solid #f8f9fc', transition: 'all 0.2s ease', verticalAlign: 'middle' }}
                           onMouseEnter={e => e.currentTarget.style.background = '#fcfdfe'}
                           onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                         >
                           {/* Column 1: Order & Buyer */}
                           <td style={{ padding: '0.85rem 1.25rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left' }}>
                                 <div style={{ width: 38, height: 38, background: '#f8f9fc', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48', flexShrink: 0, border: '1px solid #f1f5f9' }}>
                                    <Package size={16} />
                                 </div>
                                 <div>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.15rem' }}>{order.user?.full_name}</h4>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', margin: 0 }}>Order #{order.id} • {new Date(order.created_at).toLocaleDateString()} • {order.items?.length || 0} items</p>
                                 </div>
                              </div>
                           </td>

                           {/* Column 2: Total Price */}
                           <td style={{ padding: '0.85rem 1.25rem' }}>
                              <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#e11d48', margin: 0 }}>৳{order.total_price.toLocaleString()}</h3>
                           </td>

                           {/* Column 3: Payment Method */}
                           <td style={{ padding: '0.85rem 1.25rem' }}>
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.35rem 0.65rem', 
                                borderRadius: '0.6rem', 
                                background: order.payment_method === 'bKash' ? '#fdf2f8' : '#f0fdf4', 
                                color: order.payment_method === 'bKash' ? '#db2777' : '#16a34a', 
                                fontSize: '0.6rem', 
                                fontWeight: 800, 
                                border: `1px solid ${order.payment_method === 'bKash' ? '#fbcfe8' : '#bbf7d0'}`, 
                                letterSpacing: '0.03em' 
                              }}>
                                <CreditCard size={11} />
                                <span>{order.payment_method === 'COD' ? 'Cash on Delivery' : (order.payment_method || 'COD')}</span>
                              </div>
                           </td>

                           {/* Column 4: Order Status */}
                           <td style={{ padding: '0.85rem 1.25rem' }}>
                              <div style={{ 
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0.35rem 0.75rem', 
                                borderRadius: '0.6rem', 
                                background: cfg.bg, 
                                color: cfg.text, 
                                fontSize: '0.6rem', 
                                fontWeight: 800, 
                                border: `1px solid ${cfg.border}`, 
                                letterSpacing: '0.03em' 
                              }}>
                                <StatusIcon size={11} />
                                <span>{getStatusDisplayName(status)}</span>
                              </div>
                           </td>

                           {/* Column 5: Actions */}
                           <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                 <button 
                                   onClick={() => setExpandedId(isExpanded ? null : order.id)} 
                                   style={{ 
                                     width: 32, 
                                     height: 32, 
                                     borderRadius: '0.75rem', 
                                     border: '1px solid #f1f5f9', 
                                     background: '#fff', 
                                     color: '#64748b', 
                                     cursor: 'pointer', 
                                     display: 'flex', 
                                     alignItems: 'center', 
                                     justifyContent: 'center', 
                                     transition: 'all 0.2s' 
                                   }} 
                                   onMouseEnter={e => e.currentTarget.style.borderColor = '#e11d48'} 
                                   onMouseLeave={e => e.currentTarget.style.borderColor = '#f1f5f9'}
                                 >
                                   <ChevronDown size={14} style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s ease' }} />
                                 </button>
                              </div>
                           </td>
                         </tr>

                         {/* Expanded details container inside Table tr */}
                         {isExpanded && (
                           <tr style={{ background: '#fcfdfe' }}>
                             <td colSpan={5} style={{ padding: '1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.25fr 1fr', gap: '1.25rem' }}>
                                   <div>
                                      <p style={{ fontSize: '0.7rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', textAlign: 'left' }}>Items</p>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                         {order.items?.map((item, i) => (
                                           <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', background: '#f8f9fc', borderRadius: '0.75rem' }}>
                                              <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', margin: 0, textAlign: 'left' }}>{item.quantity}× {item.product?.name}</p>
                                              <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>৳{(item.price_at_purchase * item.quantity).toLocaleString()}</p>
                                           </div>
                                         ))}
                                      </div>
                                   </div>
                                   <div style={{ background: '#f8f9fc', borderRadius: '1rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                      <div style={{ textAlign: 'left' }}>
                                         <p style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', margin: '0 0 0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shipping Address</p>
                                         <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.4 }}><MapPin size={11} style={{ display: 'inline', marginRight: '0.2rem', verticalAlign: 'text-bottom' }} /> {order.shipping_address}</p>
                                      </div>
                                      
                                      <div style={{ textAlign: 'left', borderTop: '1px dashed #e2e8f0', paddingTop: '0.75rem' }}>
                                         <p style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', margin: '0 0 0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Details</p>
                                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>
                                            <CreditCard size={12} style={{ color: '#64748b' }} />
                                            <span>Method: {order.payment_method === 'COD' ? 'Cash on Delivery (COD)' : 'Paid via bKash'}</span>
                                         </div>
                                         {order.payment_method === 'bKash' && (
                                           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.35rem', padding: '0.5rem 0.75rem', background: '#fff', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.65rem', color: '#475569' }}>
                                              <p style={{ margin: 0 }}><strong>TrxID:</strong> <span style={{ letterSpacing: '0.03em', fontFamily: 'monospace' }}>{order.trx_id || 'N/A'}</span></p>
                                              <p style={{ margin: 0 }}><strong>Sender:</strong> {order.sender_number || 'N/A'}</p>
                                              <p style={{ margin: 0 }}><strong>Paid Amount:</strong> ৳{(order.paid_amount || order.total_price).toLocaleString()}</p>
                                           </div>
                                         )}
                                      </div>

                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                                         <p style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', margin: 0, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Update Status</p>
                                         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                            {Object.keys(statusColors).map((st) => {
                                              const isCurrent = order.order_status === st;
                                              const sCfg = statusColors[st];
                                              return (
                                                <button
                                                  key={st}
                                                  onClick={() => triggerStatusUpdateConfirm(order.id, st)}
                                                  style={{
                                                    padding: '0.35rem 0.65rem',
                                                    borderRadius: '0.5rem',
                                                    fontSize: '0.6rem',
                                                    fontWeight: 800,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    background: isCurrent ? sCfg.bg : '#fff',
                                                    color: isCurrent ? sCfg.text : '#64748b',
                                                    border: `1px solid ${isCurrent ? sCfg.border : '#e2e8f0'}`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.2rem'
                                                  }}
                                                  onMouseEnter={e => {
                                                    if (!isCurrent) {
                                                      e.currentTarget.style.borderColor = sCfg.border;
                                                      e.currentTarget.style.color = sCfg.text;
                                                      e.currentTarget.style.background = sCfg.bg;
                                                    }
                                                  }}
                                                  onMouseLeave={e => {
                                                    if (!isCurrent) {
                                                      e.currentTarget.style.borderColor = '#e2e8f0';
                                                      e.currentTarget.style.color = '#64748b';
                                                      e.currentTarget.style.background = '#fff';
                                                    }
                                                  }}
                                                >
                                                  {getStatusDisplayName(st)}
                                                </button>
                                              );
                                            })}
                                         </div>
                                      </div>
                                   </div>
                                </div>
                             </td>
                           </tr>
                         )}
                       </React.Fragment>
                     );
                  })}
               </tbody>
            </table>
         </div>
      </div>

      <DeleteConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, orderID: null, status: null })}
        onConfirm={handleStatusUpdate}
        title="Confirm Authorization"
        message={`Are you sure you want to change order #${confirmModal.orderID} status to ${getStatusDisplayName(confirmModal.status)}? Please enter your admin password to authorize this action.`}
        confirmText="Authorize & Update"
      />

      <style>{` @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } `}</style>
    </div>
  );
};

export default AdminOrders;

