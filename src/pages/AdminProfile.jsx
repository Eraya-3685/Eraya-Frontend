import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Camera, Save, Shield, UserCircle } from 'lucide-react';
import { getImageUrl } from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';

const AdminProfile = () => {
  const { user, updateProfile, uploadAvatar } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef();

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setAvatarUploading(true);
    try {
      await uploadAvatar(file);
      toast.success('Profile photo updated!');
    } catch (error) {
      toast.error(error.response?.data || 'Failed to upload photo');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        address: form.address || null,
      });
      toast.success('Account settings updated!');
    } catch (error) {
      toast.error(error.response?.data || 'Failed to update account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-secondary/10 rounded-lg">
            <User className="w-5 h-5 text-secondary" />
          </div>
          <span className="text-xs font-bold text-secondary uppercase tracking-[0.2em]">Personal Account</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-slate-500 mt-1">Manage your administrative profile and credentials</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
            <div className="relative w-32 h-32 mx-auto mb-6 group">
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-slate-50 shadow-inner bg-slate-100">
                {user?.avatar_url ? (
                  <img
                    src={getImageUrl(user.avatar_url)}
                    alt={user.full_name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary/5 text-secondary">
                    <UserCircle className="w-16 h-16 opacity-20" />
                  </div>
                )}
              </div>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute bottom-1 right-1 w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-secondary hover:scale-110 transition-all duration-300 disabled:opacity-50"
              >
                {avatarUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900 mb-1">{user?.full_name}</h2>
              <p className="text-slate-400 text-xs font-medium mb-6 capitalize">{user?.role} Account</p>
              
              <div className="space-y-3 pt-6 border-t border-slate-50 text-left">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Access Level</span>
                  <span className="text-emerald-500 font-black">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() : ''}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Status</span>
                  <span className="text-slate-900 font-black italic">ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form */}
        <div className="lg:col-span-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
          >
            <div className="bg-slate-900 p-8 text-white">
              <h3 className="text-lg font-bold">Edit Information</h3>
              <p className="text-white/50 text-xs mt-1">Update your personal details visible in the management panel.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative group">
                    <input
                      type="text"
                      required
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-bold text-sm outline-none focus:border-secondary/30 focus:bg-white transition-all"
                    />
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-secondary" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-bold text-sm outline-none focus:border-secondary/30 focus:bg-white transition-all"
                    />
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-secondary" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <input
                    type="email"
                    required
                    readOnly
                    value={form.email}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-400 font-bold text-sm outline-none cursor-not-allowed"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Residential Address</label>
                <div className="relative group">
                  <textarea
                    rows={3}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-bold text-sm outline-none focus:border-secondary/30 focus:bg-white transition-all resize-none"
                  />
                  <MapPin className="absolute left-4 top-5 text-slate-400 w-4 h-4 group-focus-within:text-secondary" />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  SECURED CONNECTION
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-secondary text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-secondary/90 hover:scale-105 transition-all flex items-center gap-2 shadow-xl shadow-secondary/20 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Update Account
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
