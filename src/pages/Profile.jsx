import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, LogOut, MapPin, Phone, Mail, ArrowRight, 
  ShoppingBag, Edit, Camera, X, Save, Shield, 
  CreditCard, Bell, HelpCircle, ChevronRight, User as UserIcon, Command, Heart, Zap, Settings,
  Truck,
  Calendar
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import api, { getImageUrl } from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useDocumentTitle from '../hooks/useDocumentTitle';

const Profile = () => {
  useDocumentTitle('My Profile');
  const { user, token, logout, uploadAvatar, fetchProfile } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (user?.role === 'admin') {
      navigate('/admin');
      return;
    }
    if (user?.role !== 'admin') {
      fetchOrders();
    } else {
      setLoadingOrders(false);
    }
  }, [token, user]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data || []);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File is too large. Max 2MB allowed.');
      return;
    }

    setAvatarUploading(true);
    try {
      await uploadAvatar(file);
      toast.success('Profile photo updated!');
    } catch (error) {
      toast.error('Failed to update avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 pt-32 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Profile Header */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 md:p-12 mb-10 flex flex-col md:flex-row items-center gap-10">
          <div className="relative group">
            <div className="w-40 h-40 rounded-full bg-slate-100 border-4 border-white shadow-xl overflow-hidden relative group">
              {user.avatar_url ? (
                <img 
                  src={getImageUrl(user.avatar_url)} 
                  className="w-full h-full object-cover" 
                  alt="Avatar" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-secondary text-5xl font-bold">
                  {user.full_name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <button 
              onClick={() => fileInputRef.current.click()}
              disabled={avatarUploading}
              className="absolute bottom-0 right-0 w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-secondary transition-all active:scale-95 disabled:opacity-50"
            >
              {avatarUploading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : <Camera className="w-5 h-5" />}
            </button>
            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
          </div>

          <div className="text-center md:text-left flex-grow">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{user.full_name}</h1>
              <span className="w-fit mx-auto md:mx-0 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">Verified Member</span>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-slate-500 font-medium text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> {user.email}
              </div>
              {user.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" /> {user.phone}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Joined {new Date(user.created_at).getFullYear()}
              </div>
              {user.address && (
                <div className="flex items-center gap-2 md:w-full mt-1">
                  <MapPin className="w-4 h-4 shrink-0" /> <span className="truncate">{user.address}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
             <Link to="/profile/edit" className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
                <Settings className="w-4 h-4" /> Edit Profile
             </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Orders */}
          <div className="lg:col-span-8 space-y-10">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 md:p-10">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-bold text-slate-900">Recent Orders</h2>
                <Link to="/products" className="text-sm font-bold text-secondary hover:underline">Continue Shopping</Link>
              </div>

              {loadingOrders ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-slate-50 animate-pulse rounded-2xl" />)}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold text-sm">No orders found yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6 group hover:bg-white hover:shadow-lg transition-all">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center border border-slate-100 text-slate-300">
                          <Package className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-lg">Order #{order.id}</p>
                          <p className="text-xs text-slate-400 font-medium">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-slate-900">৳{order.total_price}</p>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${
                            order.order_status === 'Delivered' ? 'text-emerald-500' : 'text-orange-500'
                          }`}>
                            {order.order_status}
                          </span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-secondary transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Cards & Actions */}
          <div className="lg:col-span-4 space-y-8">

            {/* Quick Links */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
               <h3 className="text-lg font-bold text-slate-900 mb-6">Account Services</h3>
               <div className="space-y-3">
                   {[
                    { label: 'Shipping Addresses', icon: MapPin, to: '/profile/edit' },
                    { label: 'Payment Methods', icon: CreditCard, to: '#' },
                    { label: 'Wishlist Items', icon: Heart, to: '#' },
                    { label: 'Account Security', icon: Shield, to: '#' },
                  ].map((link) => (
                    <button 
                      key={link.label} 
                      onClick={() => link.to !== '#' && navigate(link.to)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all group"
                    >
                       <div className="flex items-center gap-3">
                          <link.icon className="w-5 h-5 text-slate-400 group-hover:text-secondary transition-colors" />
                          <span className="font-bold text-sm text-slate-700">{link.label}</span>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                  ))}
               </div>

               <button 
                onClick={logout}
                className="w-full flex items-center gap-3 p-4 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-all mt-6 pt-6 border-t border-slate-50"
               >
                  <LogOut className="w-5 h-5" /> Sign Out
               </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
