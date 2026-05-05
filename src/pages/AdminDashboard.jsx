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
  Tooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';

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
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    fetchStats(controller.signal);
    return () => controller.abort();
  }, [user]);

  const fetchStats = async (signal) => {
    try {
      const res = await api.get('/admin/orders/stats', { signal });
      setData(res.data);
    } catch (error) {
      if (error.name === 'CanceledError') return;
      console.error('Dashboard stats fetch failed', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div style={{ height: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
        <div style={{ width: 48, height: 48, border: '4px solid #f1f5f9', borderTopColor: '#e11d48', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Syncing Intelligence...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const statsCards = [
    { name: 'Total Revenue', value: `৳${data.total_revenue?.toLocaleString()}`, trend: '+0.0%', color: '#e11d48', icon: DollarSign },
    { name: 'Total Order', value: data.total_orders?.toLocaleString(), trend: '+0.0%', color: '#6366f1', icon: ShoppingCart },
    { name: 'Total Sold', value: data.total_sold?.toLocaleString(), trend: '+0.0%', color: '#f59e0b', icon: TrendingUp },
    { name: 'Total Products', value: data.total_products?.toLocaleString(), trend: '+0.0%', color: '#10b981', icon: Package },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ── Top Row: Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
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
                <h3 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>{stat.value}</h3>
              </div>
              <div style={{ width: 44, height: 44, background: `${stat.color}10`, borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                <stat.icon style={{ width: 20, height: 20 }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981' }}>{stat.trend}</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#cbd5e1' }}>vs last month</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Middle Row: Small Analytics ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 300px', gap: '1.5rem', alignItems: 'stretch' }}>
        {/* Growth Widget */}
        <div style={{ background: '#fff', borderRadius: '2.5rem', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ width: 32, height: 32, background: '#0f172a', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity style={{ width: 16, height: 16, color: '#fff' }} /></div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Growth Overview</span>
           </div>
           <div style={{ height: 60, marginBottom: '1.5rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={data.revenue_chart}>
                    <Line type="monotone" dataKey="value" stroke="#e11d48" strokeWidth={3} dot={false} />
                 </LineChart>
              </ResponsiveContainer>
           </div>
           <div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.25rem' }}>৳{data.total_revenue?.toLocaleString()}</h4>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>+8.4% <span style={{ color: '#94a3b8', fontWeight: 600 }}>Total Growth</span></p>
           </div>
        </div>

        {/* Order Analytics Status */}
        <div style={{ background: '#fff', borderRadius: '2.5rem', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                 <div style={{ width: 32, height: 32, background: '#f8f9fc', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShoppingCart style={{ width: 16, height: 16, color: '#94a3b8' }} /></div>
                 <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Order Analytics</span>
              </div>
           </div>
           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              {[
                { label: 'Pending', key: 'Pending', color: '#f59e0b', icon: Clock },
                { label: 'Confirmed', key: 'Confirmed', color: '#6366f1', icon: CheckCircle2 },
                { label: 'Processing', key: 'Processing', color: '#3b82f6', icon: Zap },
                { label: 'Delivered', key: 'Delivered', color: '#10b981', icon: Package },
              ].map(status => (
                <div key={status.label} style={{ background: '#f8f9fc', padding: '0.75rem 1.25rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                   <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${status.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: status.color }}><status.icon style={{ width: 12, height: 12 }} /></div>
                   <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a' }}>{status.label}</span>
                   <span style={{ fontSize: '0.75rem', fontWeight: 900, color: status.color, background: '#fff', padding: '0.1rem 0.5rem', borderRadius: '0.5rem' }}>{data.order_status_stats?.[status.key] || 0}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Server Status Widget */}
        <div style={{ background: '#fff', borderRadius: '2.5rem', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Server Status</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8' }}>All Server <ChevronDown style={{ width: 12, height: 12 }} /></span>
           </div>
           <div style={{ height: 40, marginBottom: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={data.revenue_chart.slice(-7)}>
                    <Line type="monotone" dataKey="value" stroke="#e11d48" strokeWidth={2} dot={false} />
                 </LineChart>
              </ResponsiveContainer>
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                 <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', margin: '0 0 0.2rem' }}>Overall Performance</p>
                 <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', margin: 0 }}>Excellent</p>
              </div>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#e11d48' }}>99.9%</span>
           </div>
        </div>
      </div>

      {/* ── Bottom Section: Charts & Feed ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
        
        {/* Main Chart Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           {/* Overview Chart */}
           <div style={{ background: '#fff', borderRadius: '3rem', padding: '2.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                 <h4 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Revenue Overview</h4>
                 <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: '1rem' }}>
                    {['Day', 'Week', 'Month', 'Year'].map(t => (
                      <button key={t} style={{ padding: '0.5rem 1rem', border: 'none', background: t === 'Month' ? '#e11d48' : 'transparent', color: t === 'Month' ? '#fff' : '#64748b', borderRadius: '0.85rem', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>{t}</button>
                    ))}
                 </div>
              </div>
              <div style={{ height: 300 }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.revenue_chart}>
                       <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#e11d48" stopOpacity={0.2}/>
                             <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                       <Tooltip 
                          contentStyle={{ background: '#e11d48', border: 'none', borderRadius: '1rem', color: '#fff' }}
                          itemStyle={{ color: '#fff', fontWeight: 800 }}
                          cursor={{ stroke: '#e11d48', strokeWidth: 2, strokeDasharray: '5 5' }}
                       />
                       <Area type="monotone" dataKey="value" stroke="#e11d48" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Visitor Rate Chart */}
           <div style={{ background: '#fff', borderRadius: '2.5rem', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                 <h4 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Engagement Rate</h4>
                 <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>Weekly <ChevronDown style={{ width: 14, height: 14 }} /></span>
              </div>
              <div style={{ height: 120 }}>
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.visitor_chart}>
                       <Line type="monotone" dataKey="this" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} />
                       <Line type="monotone" dataKey="last" stroke="#e2e8f0" strokeWidth={2} dot={false} />
                    </LineChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>

        {/* Side Widgets: Messages & Contacts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           {/* Messages Widget */}
           <div style={{ background: '#fff', borderRadius: '2.5rem', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                 <h4 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Messages</h4>
                 <Link to="/admin/chat" style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textDecoration: 'none' }}>View All</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                 {data.recent_messages?.length > 0 ? data.recent_messages.map((msg, i) => (
                   <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '1rem', background: '#f1f5f9', overflow: 'hidden' }}>
                         <div style={{ width: '100%', height: '100%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.85rem', fontWeight: 800 }}>{msg.name.charAt(0)}</div>
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
                 <h4 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Recent Customers</h4>
                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to="/admin/users" style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textDecoration: 'none' }}>View All</Link>
                 </div>
              </div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '1.5rem' }}>You have {data.total_orders * 2} engagement points</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                 {data.recent_contacts?.map(contact => (
                   <div key={contact.id} title={contact.full_name} style={{ width: 32, height: 32, borderRadius: '0.75rem', background: '#f1f5f9', border: '2px solid #fff', boxShadow: '0 4px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                      {contact.avatar_url ? <img src={api.defaults.baseURL + '/uploads/' + contact.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.6rem', fontWeight: 800 }}>{contact.full_name.charAt(0)}</div>}
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
