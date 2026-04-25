import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Camera, Save, Lock, Shield, UserCircle } from 'lucide-react';
import { getImageUrl } from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';

const AdminSettings = () => {
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
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error(error.response?.data || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto min-h-screen bg-slate-50">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Security & Profile</span>
        </div>
        <h1 className="text-4xl font-bold text-slate-900 font-display tracking-tight">Admin Account Settings</h1>
        <p className="text-slate-500 mt-2">Manage your credentials and public information</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Profile Card */}
        <aside className="lg:col-span-4">
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sticky top-10">
            <div className="relative w-40 h-40 mx-auto mb-8 group">
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-slate-50 shadow-inner bg-slate-100">
                {user?.avatar_url ? (
                  <img
                    src={getImageUrl(user.avatar_url)}
                    alt={user.full_name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
                    <UserCircle className="w-20 h-20 opacity-20" />
                  </div>
                )}
              </div>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute bottom-2 right-2 w-11 h-11 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-primary hover:scale-110 transition-all duration-300 disabled:opacity-50"
              >
                {avatarUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">{user?.full_name}</h2>
              <p className="text-slate-400 text-sm font-medium mb-6">{user?.email}</p>
              
              <div className="space-y-4 pt-6 border-t border-slate-50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Account Role</span>
                  <span className="bg-primary/5 text-primary px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider">
                    {user?.role}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Joined</span>
                  <span className="text-slate-700 font-bold">
                    {new Date(user?.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Form Section */}
        <main className="lg:col-span-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
          >
            <div className="bg-slate-900 p-8 text-white">
              <h3 className="text-xl font-bold">General Information</h3>
              <p className="text-white/50 text-sm mt-1">Updates to your profile are reflected across the admin panel.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Full Name */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                  <div className="relative group">
                    <input
                      type="text"
                      required
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-medium outline-none focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                      placeholder="e.g. John Doe"
                    />
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 ml-1">Contact Number</label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-medium outline-none focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                      placeholder="+880 1XXX XXXXXX"
                    />
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                  </div>
                </div>
              </div>

              {/* Email (Immutable) */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 ml-1">Account Email</label>
                <div className="relative group">
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-medium outline-none focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 ml-1">Delivery Address</label>
                <div className="relative group">
                  <textarea
                    rows={3}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-medium outline-none focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all resize-none"
                    placeholder="Your primary address..."
                  />
                  <MapPin className="absolute left-4 top-5 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                  <Shield className="w-4 h-4 text-green-500" />
                  All data is encrypted and stored securely
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto bg-primary text-white px-10 py-4 rounded-2xl font-bold hover:bg-primary-container hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminSettings;
