import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package, ShoppingCart, TrendingUp, DollarSign,
  ArrowRight, Activity, AlertCircle, RefreshCcw
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isStaff = ['admin', 'moderator'].includes(user?.role?.toLowerCase());

  useEffect(() => {
    if (user?.role?.toLowerCase() === 'moderator' && !user.permissions?.includes('dashboard')) {
      const firstAllowed = user.permissions?.find(p => p !== 'dashboard');
      if (firstAllowed) navigate(`/admin/${firstAllowed === 'dashboard' ? '' : firstAllowed}`);
      else navigate('/');
      return;
    }
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [user]);

  const fetchData = async (signal) => {
    try {
      const requests = [api.get('/products?page=1&limit=100', { signal })];
      if (isStaff) requests.push(api.get('/admin/orders', { signal }));
      const results = await Promise.all(requests);
      setProducts(results[0].data?.data || []);
      if (isStaff) setOrders(results[1].data || []);
    } catch (error) {
      if (error.name === 'CanceledError') return;
      console.error('Dashboard fetch failed', error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = orders
    .filter((o) => o.payment_status === 'Paid')
    .reduce((sum, o) => sum + o.total_price, 0);

  const stats = [
    ...(isStaff ? [{ name: 'Total Revenue', value: `৳${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' }] : []),
    ...(isStaff ? [{ name: 'Total Orders', value: orders.length, icon: ShoppingCart, color: 'text-indigo-400', bg: 'bg-indigo-500/10' }] : []),
    { name: 'Inventory Items', value: products.length, icon: Package, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { name: 'Store Growth', value: '+12.5%', icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
        <div className="w-12 h-12 border-4 border-white/[0.05] border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Syncing Analytics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 glass-card flex items-center justify-center rounded-xl">
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Analytics Engine</h1>
          </div>
          <p className="text-slate-400 text-xs font-medium tracking-wide">Real-time performance metrics and store insights.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => fetchData(new AbortController().signal)} className="btn-ghost py-3 px-6 flex items-center gap-2">
            <RefreshCcw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div 
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, i) => (
          <motion.div
            key={stat.name}
            variants={{
              hidden: { opacity: 0, y: 20, scale: 0.95 },
              show: { opacity: 1, y: 0, scale: 1 }
            }}
            whileHover={{ y: -10, transition: { duration: 0.4, ease: "easeOut" } }}
            className="glass-card p-8 group hover:border-indigo-500/40 transition-all duration-500 relative overflow-hidden"
          >
            <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="section-label mb-1 opacity-60">{stat.name}</p>
            <h3 className="text-3xl font-black text-white tracking-tighter">{stat.value}</h3>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Recent Transactions */}
        {isStaff && (
          <div className="lg:col-span-8 glass-card overflow-hidden">
            <div className="p-8 border-b border-white/[0.05] flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-white tracking-tight">Recent Transactions</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Live order feed</p>
              </div>
              <Link to="/admin/orders" className="btn-ghost py-2.5 px-5 text-[9px]">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/[0.02] text-slate-500 text-[9px] uppercase tracking-[0.2em] font-black border-b border-white/[0.05]">
                  <tr>
                    <th className="px-8 py-5">Reference</th>
                    <th className="px-6 py-5">Method</th>
                    <th className="px-6 py-5">Amount</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-8 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6">
                        <span className="font-black text-white text-xs">#{order.id}</span>
                      </td>
                      <td className="px-6 py-6">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.payment_method}</span>
                      </td>
                      <td className="px-6 py-6 font-black text-white text-sm">৳{order.total_price.toLocaleString()}</td>
                      <td className="px-6 py-6">
                        <span className={`badge-indigo ${order.order_status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400' : ''}`}>
                          {order.order_status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Link to="/admin/orders" className="w-10 h-10 glass-card-light inline-flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all">
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && (
                <div className="p-20 text-center">
                  <AlertCircle className="w-10 h-10 text-white/[0.05] mx-auto mb-4" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No recent data available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Growth Analytics Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="glass-card p-8 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border-indigo-500/20">
            <div className="w-12 h-12 glass-card flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-black text-white mb-2 tracking-tight">Growth Insights</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-8">Weekly traffic has increased by <span className="text-indigo-400 font-bold">15.4%</span>. Your top category is trending up.</p>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                  <span>Sales Target</span>
                  <span className="text-indigo-400">75%</span>
                </div>
                <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-[75%] rounded-full shadow-[0_0_10px_#6366f1]" />
                </div>
              </div>
              <button className="btn-primary w-full py-4 text-[9px]">Full Intelligence Report</button>
            </div>
          </div>

          <div className="glass-card p-8 space-y-6">
            <h4 className="section-label">System Nodes</h4>
            <div className="space-y-5">
              {[
                { label: 'Cloud Gateway', status: 'Optimal', color: 'bg-emerald-500' },
                { label: 'Neural Shield', status: 'Encrypted', color: 'bg-indigo-500' },
                { label: 'Data Clusters', status: 'Syncing', color: 'bg-amber-500' },
              ].map((node) => (
                <div key={node.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-white tracking-tight">{node.label}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${node.color} shadow-sm`} />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{node.status}</span>
                    </div>
                  </div>
                  <div className="w-10 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className={`h-full ${node.color} w-2/3 rounded-full opacity-30`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
