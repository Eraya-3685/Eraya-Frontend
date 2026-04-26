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

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {user?.role?.toLowerCase() === 'admin' ? 'Admin' : 'Moderator'} Dashboard
            </h1>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">Welcome back. Here's what's happening today.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-secondary hover:border-secondary transition-all">
                <Bell className="w-4 h-4" />
             </button>
             <button onClick={() => navigate('/admin/products')} className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-white rounded-xl font-bold text-xs hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/10">
                <Plus className="w-3.5 h-3.5" /> Add Product
             </button>
          </div>
        </header>

        {/* Stats Grid */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                 className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm group hover:shadow-md transition-all"
              >
                 <div className={`w-9 h-9 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
                    <stat.icon className="w-4 h-4" />
                 </div>
                 <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-1">{stat.name}</p>
                 <h3 className="text-xl font-bold text-slate-900">{stat.value}</h3>
              </motion.div>
            ))}
         </div>

        <div className={`grid grid-cols-1 ${isStaff ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-8`}>
           
           {/* Recent Orders Table */}
           {isStaff && (
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>
                  <Link to="/admin/orders" className="text-xs font-bold text-secondary hover:underline">View All</Link>
               </div>

               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-400 text-[9px] uppercase tracking-widest font-bold">
                       <tr>
                          <th className="px-6 py-3">Order ID</th>
                          <th className="px-6 py-3">Method</th>
                          <th className="px-6 py-3">Total</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3 text-right">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                        {orders.slice(0, 6).map((order) => (
                          <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                             <td className="px-6 py-4 font-bold text-slate-900 text-xs">#{order.id}</td>
                             <td className="px-6 py-4 text-slate-500 text-xs">{order.payment_method}</td>
                             <td className="px-6 py-4 font-bold text-slate-900 text-xs">৳{order.total_price}</td>
                             <td className="px-6 py-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                  order.order_status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                                }`}>
                                  {order.order_status}
                                </span>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <Link to="/admin/orders" className="p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-secondary group-hover:text-white transition-all inline-block">
                                   <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                             </td>
                          </tr>
                        ))}
                    </tbody>
                 </table>
                 {orders.length === 0 && (
                   <div className="p-20 text-center text-slate-400 font-medium">
                      No recent transactions found.
                   </div>
                 )}
               </div>
            </div>
           )}

           {/* Store Insights */}
           <div className={`space-y-6 ${!isStaff ? 'lg:col-span-2' : ''}`}>
               <div className="p-6 bg-slate-900 text-white rounded-2xl relative overflow-hidden">
                 <div className="relative z-10">
                   <TrendingUp className="w-8 h-8 text-secondary mb-4" />
                   <h3 className="text-lg font-bold mb-1.5">Store Insights</h3>
                   <p className="text-slate-400 text-xs leading-relaxed mb-4">Traffic has increased by 15% this week. Product engagement is at an all-time high.</p>
                   <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mb-2">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '75%' }}
                        className="bg-secondary h-full"
                      />
                   </div>
                   <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400">
                      <span>Goal: ৳50k</span>
                      <span className="text-white">75% Reached</span>
                   </div>
                 </div>
              </div>

               <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                 <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-3">
                    <Activity className="w-4 h-4 text-blue-500" /> Server Status
                 </h3>
                 <div className="space-y-5">
                    {[
                       { label: 'API Latency', val: '24ms', color: 'bg-emerald-500' },
                       { label: 'Storage Usage', val: '42%', color: 'bg-blue-500' },
                       { label: 'Security Firewall', val: 'Active', color: 'bg-emerald-500' },
                    ].map((item) => (
                       <div key={item.label} className="flex justify-between items-center">
                          <p className="text-sm text-slate-500 font-medium">{item.label}</p>
                          <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${item.color} animate-pulse`} />
                             <span className="text-xs font-bold text-slate-900">{item.val}</span>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
