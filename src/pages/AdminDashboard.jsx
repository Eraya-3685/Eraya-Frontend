import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, ShoppingCart, TrendingUp, DollarSign,
  ArrowRight, Users, Activity, Calendar,
  Search, Filter, Download, ChevronRight, AlertCircle, Plus, Command, Bell, Settings, RefreshCcw
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
    // Redirect moderators who don't have dashboard access to their first allowed module
    if (user?.role?.toLowerCase() === 'moderator' && !user.permissions?.includes('dashboard')) {
      const firstAllowed = user.permissions?.find(p => p !== 'dashboard');
      if (firstAllowed) {
        navigate(`/admin/${firstAllowed === 'dashboard' ? '' : firstAllowed}`);
      } else {
        navigate('/');
      }
      return;
    }

    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [user]);

  const fetchData = async (signal) => {
    try {
      const requests = [api.get('/products?page=1&limit=100', { signal })];
      if (isStaff) {
        requests.push(api.get('/admin/orders', { signal }));
      }

      const results = await Promise.all(requests);
      setProducts(results[0].data?.data || []);
      if (isStaff) {
        setOrders(results[1].data || []);
      }
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
    ...(isStaff ? [{ name: 'Total Revenue', value: `৳${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' }] : []),
    ...(isStaff ? [{ name: 'Total Orders', value: orders.length, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' }] : []),
    { name: 'Inventory Items', value: products.length, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'Store Growth', value: '+12.5%', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 gap-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-secondary rounded-full animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Management Console...</p>
      </div>
    );
  }

  return <div className="min-h-screen bg-[#f0f2f5] p-8 md:p-12">
    <div className="max-w-6xl mx-auto">

      {/* Page Title */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
          <Activity className="w-8 h-8 text-indigo-600" />
          Analytics Overview
        </h1>
        <p className="text-slate-700 text-xs font-medium mt-1">Monitor your store's real-time performance and metrics.</p>
      </div>

      {/* Stats Grid - High End Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="p-6 bg-white rounded-[2.5rem] border border-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] group hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-50/50 transition-colors duration-500" />

            <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 shadow-inner relative z-10 group-hover:scale-110 transition-transform duration-500`}>
              <stat.icon className="w-6 h-6" />
            </div>

            <div className="relative z-10">
              <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{stat.name}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                {i === 3 && <span className="text-[10px] font-black text-emerald-500">+12%</span>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className={`grid grid-cols-1 ${isStaff ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-10`}>

        {/* Recent Orders - Refined Table */}
        {isStaff && (
          <div className="lg:col-span-2 bg-white rounded-[3rem] border border-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Recent Transactions</h2>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">Live updates from your store</p>
              </div>
              <Link to="/admin/orders" className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">View All</Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white text-slate-600 text-[9px] uppercase tracking-[0.25em] font-black border-b border-slate-50">
                  <tr>
                    <th className="px-10 py-5">Order Reference</th>
                    <th className="px-6 py-5">Payment</th>
                    <th className="px-6 py-5">Total Amount</th>
                    <th className="px-6 py-5">Current Status</th>
                    <th className="px-10 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {orders.slice(0, 6).map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                          <span className="font-black text-slate-900 text-xs tracking-tight">#{order.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-slate-700 text-[11px] font-bold uppercase tracking-wider">{order.payment_method}</td>
                      <td className="px-6 py-6 font-black text-slate-900 text-sm">৳{order.total_price.toLocaleString()}</td>
                      <td className="px-6 py-6">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${order.order_status === 'Delivered'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                          {order.order_status}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <Link to="/admin/orders" className="w-9 h-9 bg-slate-50 rounded-xl text-slate-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm inline-flex">
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && (
                <div className="p-32 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No recent transactions</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Store Insights - Premium Cards */}
        <div className={`space-y-8 ${!isStaff ? 'lg:col-span-2' : ''}`}>
          <div className="p-10 bg-gradient-to-br from-[#0f1120] to-[#1e1b4b] text-white rounded-[3rem] relative overflow-hidden shadow-2xl group">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:bg-indigo-500/20 transition-all duration-1000" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-secondary/10 blur-[80px] rounded-full -ml-20 -mb-20" />

            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 mb-8">
                <TrendingUp className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-2xl font-black mb-3 tracking-tight">Growth Analytics</h3>
              <p className="text-white/40 text-xs leading-relaxed mb-8 font-medium">Your store traffic has increased by <span className="text-white font-bold">15%</span> this week. Focus on your top selling categories.</p>

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                    <span>Sales Target</span>
                    <span className="text-white">75%</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '75%' }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="bg-gradient-to-r from-indigo-500 to-secondary h-full rounded-full"
                    />
                  </div>
                </div>
                <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                  View Full Report
                </button>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white border border-white rounded-[3rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Node Status
              </h3>
              <RefreshCcw className="w-4 h-4 text-slate-300 hover:text-indigo-500 cursor-pointer transition-colors" />
            </div>

            <div className="space-y-6">
              {[
                { label: 'Cloud Gateway', val: '24ms', color: 'bg-emerald-500', desc: 'Active' },
                { label: 'Cluster Load', val: '42%', color: 'bg-blue-500', desc: 'Optimal' },
                { label: 'Neural Shield', val: 'Secure', color: 'bg-emerald-500', desc: 'Standard' },
              ].map((item) => (
                <div key={item.label} className="group">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider group-hover:text-slate-600 transition-colors">{item.label}</p>
                    <span className="text-[11px] font-black text-slate-900">{item.val}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
};

export default AdminDashboard;
