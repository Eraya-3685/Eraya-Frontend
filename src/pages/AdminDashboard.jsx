import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package, ShoppingCart, TrendingUp, DollarSign,
  ArrowRight, Activity, AlertCircle, RefreshCcw,
  Users, Star, MessageSquare, MoreHorizontal,
  ChevronUp, ChevronDown, CheckCircle2, Clock, Zap
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import api, { getImageUrl } from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import TakaIcon from '../components/TakaIcon';

// Mock data for the charts (In a real app, this would come from the API)
const revenueData = [
  { name: 'Jan', value: 4000 }, { name: 'Feb', value: 3000 }, { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 4500 }, { name: 'May', value: 6000 }, { name: 'Jun', value: 5500 },
  { name: 'Jul', value: 7000 }, { name: 'Aug', value: 6500 }, { name: 'Sep', value: 8000 },
  { name: 'Oct', value: 7500 }, { name: 'Nov', value: 9000 }, { name: 'Dec', value: 10000 },
];

const visitorData = [
  { name: 'W1', this: 400, last: 300 }, { name: 'W2', this: 300, last: 400 },
  { name: 'W3', this: 500, last: 350 }, { name: 'W4', this: 450, last: 480 },
];

const sparkData = [
  { v: 40 }, { v: 30 }, { v: 50 }, { v: 45 }, { v: 60 }, { v: 55 }, { v: 70 }
];

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('Month');
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1200);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth <= 1200);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  useEffect(() => {
    const controller = new AbortController();
    fetchStats(timeframe, controller.signal);
    return () => controller.abort();
  }, [user, timeframe]);

  const fetchStats = async (selectedTimeframe, signal) => {
    try {
      const res = await api.get(`/admin/orders/stats?timeframe=${selectedTimeframe}`, { signal });
      setData(res.data);
    } catch (error) {
      if (error.name === 'CanceledError') return;
      console.error('Dashboard stats fetch failed', error);
    } finally {
      setLoading(false);
    }
  };

  // Listen for real-time admin order updates and refresh stats automatically
  useEffect(() => {
    const handler = () => {
      // Re-fetch using current timeframe
      fetchStats(timeframe);
    };
    window.addEventListener('admin-order-update', handler);
    return () => {
      window.removeEventListener('admin-order-update', handler);
    };
  }, [timeframe]);

  if (loading || !data) {
    return (
      <div style={{ height: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
        <div style={{ width: 48, height: 48, border: '4px solid #f1f5f9', borderTopColor: '#e11d48', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>Syncing Intelligence...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const statsCards = [
    { name: 'Total Revenue', value: `৳${data.total_revenue?.toLocaleString()}`, trend: 'Paid Orders', color: '#e11d48', icon: TakaIcon },
    { name: 'Net Profit (Est.)', value: `৳${(data.total_revenue * 0.30)?.toLocaleString()}`, trend: '30% Margin', color: '#10b981', icon: TrendingUp },
    { name: 'Total Orders', value: data.total_orders?.toLocaleString(), trend: 'All Placed', color: '#6366f1', icon: ShoppingCart },
    { name: 'Total Products', value: data.total_products?.toLocaleString(), trend: 'In Inventory', color: '#f59e0b', icon: Package },
  ];

  // Add estimated profit to the revenue chart data for multi-dimensional tracking
  const revenueChartData = data.revenue_chart?.map(item => ({
    ...item,
    profit: Math.round(item.value * 0.30)
  })) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ── Top Row: Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : (isTablet ? '1fr 1fr' : 'repeat(4, 1fr)'), gap: isMobile ? '1rem' : '1.5rem' }}>
        {statsCards.map((stat) => (
          <motion.div 
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ background: '#fff', borderRadius: '2.5rem', padding: '1.75rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', margin: '0 0 0.5rem' }}>{stat.name}</p>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.35rem', letterSpacing: '-0.02em' }}>{stat.value}</h3>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: stat.color, background: `${stat.color}10`, padding: '0.15rem 0.5rem', borderRadius: '0.5rem', display: 'inline-block' }}>{stat.trend}</span>
              </div>
              <div style={{ width: 44, height: 44, background: `${stat.color}10`, borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                <stat.icon style={{ width: 20, height: 20 }} />
              </div>
            </div>

          </motion.div>
        ))}
      </div>

      {/* Low Stock Alerts */}
      {data.low_stock_alerts && data.low_stock_alerts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: '#fff1f2', border: '1px solid #ffe4e6', borderRadius: '2rem', padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}
        >
          <AlertCircle style={{ width: 28, height: 28, color: '#e11d48', flexShrink: 0 }} />
          <div style={{ flex: 1, textAlign: 'left' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#9f1239', margin: '0 0 0.25rem' }}>Low Stock Alert</h4>
            <p style={{ fontSize: '0.72rem', color: '#be123c', margin: 0, fontWeight: 600 }}>
              The following products are running out of stock (less than 5 units left):{' '}
              {data.low_stock_alerts.map((p, idx) => (
                <span key={p.id}>
                  <Link to="/admin/products" style={{ color: '#be123c', fontWeight: 800, textDecoration: 'underline' }}>{p.name}</Link> ({p.stock_count} left)
                  {idx < data.low_stock_alerts.length - 1 ? ', ' : ''}
                </span>
              ))}
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Middle Row: Small Analytics ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : (isTablet ? '1fr 1fr' : '300px 1fr'), gap: isMobile ? '1rem' : '1.5rem', alignItems: 'stretch' }}>
        {/* Growth Widget */}
        <div style={{ minWidth: 0, background: '#fff', borderRadius: '2.5rem', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ width: 32, height: 32, background: '#0f172a', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity style={{ width: 16, height: 16, color: '#fff' }} /></div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Growth Overview</span>
           </div>
           <div style={{ position: 'relative', width: '100%', height: 60, marginBottom: '1.5rem' }}>
              <div style={{ position: 'absolute', inset: 0 }}>
                  {isMounted && (
                     <ResponsiveContainer width="99%" height="100%" debounce={50}>
                        <LineChart data={data.revenue_chart}>
                           <Line type="monotone" dataKey="value" stroke="#e11d48" strokeWidth={3} dot={false} />
                        </LineChart>
                     </ResponsiveContainer>
                  )}
              </div>
           </div>
           <div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.25rem' }}>৳{data.total_revenue?.toLocaleString()}</h4>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>Active <span style={{ color: '#94a3b8', fontWeight: 600 }}>Platform Revenue</span></p>
           </div>
        </div>

        {/* Order Analytics Status */}
        <div style={{ minWidth: 0, background: '#fff', borderRadius: '2.5rem', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 32, height: 32, background: '#f8f9fc', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShoppingCart style={{ width: 16, height: 16, color: '#94a3b8' }} /></div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Order Analytics</span>
              </div>
           </div>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
              {[
                { label: 'Pending', key: 'Pending', color: '#f59e0b', icon: Clock },
                { label: 'Confirmed', key: 'Confirmed', color: '#6366f1', icon: CheckCircle2 },
                { label: 'Processing', key: 'Processing', color: '#3b82f6', icon: Zap },
                { label: 'Delivered', key: 'Delivered', color: '#10b981', icon: Package },
              ].map(status => (
                <div key={status.label} style={{ background: '#f8f9fc', padding: '1rem 1.25rem', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid #f1f5f9' }}>
                   <div style={{ width: 36, height: 36, borderRadius: '1rem', background: `${status.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: status.color, flexShrink: 0 }}><status.icon style={{ width: 18, height: 18 }} /></div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>{status.label}</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>{data.order_status_stats?.[status.key] || 0}</span>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* ── Bottom Section: Charts & Feed ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile || isTablet ? '1fr' : '1fr 340px', gap: '2rem' }}>
        
        {/* Main Chart Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
           {/* Overview Chart */}
           <div style={{ background: '#fff', borderRadius: '3rem', padding: '2.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                 <h4 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Revenue Overview</h4>
                  <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: '1rem' }}>
                    {['Day', 'Week', 'Month', 'Year'].map(t => (
                      <button 
                        key={t} 
                        onClick={() => setTimeframe(t)}
                        style={{ 
                          padding: '0.5rem 1rem', 
                          border: 'none', 
                          background: t === timeframe ? '#e11d48' : 'transparent', 
                          color: t === timeframe ? '#fff' : '#64748b', 
                          borderRadius: '0.85rem', 
                          fontSize: '0.7rem', 
                          fontWeight: 800, 
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
              </div>
              <div style={{ position: 'relative', width: '100%', height: 300 }}>
                  <div style={{ position: 'absolute', inset: 0 }}>
                     {isMounted && (
                        <ResponsiveContainer width="99%" height="100%" debounce={50}>
                           <AreaChart data={revenueChartData}>
                              <defs>
                                 <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                                 </linearGradient>
                                 <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                 </linearGradient>
                              </defs>
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                              <Tooltip 
                                 contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '1rem', padding: '0.85rem 1.25rem', boxShadow: '0 10px 35px rgba(15,23,42,0.15)' }}
                                 itemStyle={{ color: '#fff', fontSize: '0.85rem', fontWeight: 900 }}
                                 labelStyle={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}
                                 cursor={{ stroke: '#cbd5e1', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                                 formatter={(value, name) => [
                                   `৳${value.toLocaleString()}`,
                                   name === 'value' ? 'Total Revenue' : 'Net Profit (Est. 30%)'
                                 ]}
                              />
                              <Area type="monotone" dataKey="value" stroke="#e11d48" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                              <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                           </AreaChart>
                        </ResponsiveContainer>
                     )}
                  </div>
              </div>
           </div>

           {/* Visitor Rate Chart */}
           <div style={{ background: '#fff', borderRadius: '2.5rem', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                 <h4 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Engagement Rate</h4>
                 <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>
                    {timeframe === 'Day' ? 'Hourly' : timeframe === 'Week' ? 'Daily' : timeframe === 'Month' ? 'Weekly' : 'Yearly'} <ChevronDown style={{ width: 14, height: 14 }} />
                 </span>
              </div>
              <div style={{ position: 'relative', width: '100%', height: 120 }}>
                 <div style={{ position: 'absolute', inset: 0 }}>
                    {isMounted && (
                       <ResponsiveContainer width="99%" height="100%" debounce={50}>
                          <LineChart data={data.visitor_chart}>
                             <Line type="monotone" dataKey="this" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} />
                             <Line type="monotone" dataKey="last" stroke="#e2e8f0" strokeWidth={2} dot={false} />
                          </LineChart>
                       </ResponsiveContainer>
                    )}
                 </div>
              </div>
           </div>
        </div>

        {/* Side Widgets: Messages & Contacts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           
           {/* Category Sales Pie Chart */}
           <div style={{ background: '#fff', borderRadius: '2.5rem', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                 <h4 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Category Sales</h4>
                 <TrendingUp style={{ width: 16, height: 16, color: '#10b981' }} />
              </div>
              {data.category_sales && data.category_sales.length > 0 ? (
                <>
                  <div style={{ position: 'relative', width: '100%', height: 180 }}>
                    <div style={{ position: 'absolute', inset: 0 }}>
                      {isMounted && (
                        <ResponsiveContainer width="99%" height="100%" debounce={50}>
                          <PieChart>
                            <Pie
                              data={data.category_sales}
                              dataKey="total_sales"
                              nameKey="category_name"
                              cx="50%"
                              cy="50%"
                              innerRadius={48}
                              outerRadius={72}
                              paddingAngle={3}
                            >
                              {data.category_sales.map((_, i) => (
                                <Cell
                                  key={`cell-${i}`}
                                  fill={['#e11d48', '#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'][i % 6]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '0.75rem', padding: '0.6rem 1rem' }}
                              itemStyle={{ color: '#fff', fontSize: '0.78rem', fontWeight: 800 }}
                              formatter={(value) => [`৳${value.toLocaleString()}`, 'Sales']}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {data.category_sales.slice(0, 4).map((cat, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: ['#e11d48', '#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'][i % 6], flexShrink: 0 }} />
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>{cat.category_name}</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0f172a' }}>৳{cat.total_sales.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>No category sales data yet</p>
              )}
           </div>

           {/* Messages Widget */}
           <div style={{ background: '#fff', borderRadius: '2.5rem', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                 <h4 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Messages</h4>
                 <Link to="/admin/chat" style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textDecoration: 'none' }}>View All</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                 {data.recent_messages?.length > 0 ? data.recent_messages.map((msg, i) => (
                   <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                       <div style={{ width: 44, height: 44, borderRadius: '1rem', background: '#f1f5f9', border: '1px solid #f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {msg.avatar_url && msg.avatar_url !== 'null' && msg.avatar_url !== '' && !msg.avatar_url.endsWith('/uploads/') ? (
                             <img src={getImageUrl(msg.avatar_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                          ) : (
                             <div style={{ width: '100%', height: '100%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.85rem', fontWeight: 800 }}>{msg.name.charAt(0)}</div>
                          )}
                       </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>{msg.name}</p>
                            <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#94a3b8' }}>{msg.time}</span>
                         </div>
                         <p style={{ margin: '0.1rem 0 0', fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.msg}</p>
                      </div>
                      {msg.unread > 0 && <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.6rem', fontWeight: 900 }}>{msg.unread}</div>}
                   </div>
                 )) : (
                   <p style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center' }}>No recent messages</p>
                 )}
              </div>
           </div>

           {/* Contacts Widget */}
           <div style={{ background: '#fff', borderRadius: '2.5rem', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                 <h4 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Recent Buyers</h4>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                     <Link to="/admin/users?role=recent" style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textDecoration: 'none' }}>View All</Link>
                  </div>
              </div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '1.5rem' }}>Showing your most recent active buyers</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                 {data.recent_contacts?.map(contact => (
                   <div key={contact.id} title={contact.full_name} style={{ width: 32, height: 32, borderRadius: '0.75rem', background: '#f1f5f9', border: '2px solid #fff', boxShadow: '0 4px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                      {contact.avatar_url && contact.avatar_url !== 'null' && contact.avatar_url !== '' && !contact.avatar_url.endsWith('/uploads/') ? <img src={getImageUrl(contact.avatar_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.6rem', fontWeight: 800 }}>{contact.full_name?.charAt(0)?.toUpperCase() || 'U'}</div>}
                   </div>
                 ))}
                 {data.recent_contacts?.length >= 10 && <div style={{ width: 32, height: 32, borderRadius: '0.75rem', background: '#f8f9fc', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8' }}>+...</div>}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const Plus = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

export default AdminDashboard;
