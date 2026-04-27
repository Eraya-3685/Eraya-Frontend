import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Truck, DollarSign, Percent, ChevronRight, Mail, Phone, MapPin } from 'lucide-react';
import useSettingsStore from '../store/useSettingsStore';
import toast from 'react-hot-toast';
import useDocumentTitle from '../hooks/useDocumentTitle';

const AdminSettings = () => {
  useDocumentTitle('Store Settings | Admin');
  const { settings, fetchSettings, updateSettings, loading } = useSettingsStore();
  const [form, setForm] = useState({
    free_shipping_threshold: 1999,
    standard_delivery_fee: 85,
    tax_percentage: 5,
    store_email: '',
    store_phone: '',
    store_address: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings && typeof settings === 'object') {
      setForm({
        free_shipping_threshold: settings.free_shipping_threshold ?? 1999,
        standard_delivery_fee: settings.standard_delivery_fee ?? 85,
        tax_percentage: settings.tax_percentage ?? 5,
        store_email: settings.store_email || '',
        store_phone: settings.store_phone || '',
        store_address: settings.store_address || '',
        id: settings.id
      });
    }
  }, [settings]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const success = await updateSettings(form);
      if (success) {
        toast.success('Store settings updated successfully');
      } else {
        toast.error('Failed to update settings');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
           <div className="w-16 h-16 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-600/10 rounded-2xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-indigo-600" />
              </div>
              <h1 className="text-3xl font-[1000] text-slate-900 tracking-tight">Store Settings</h1>
            </div>
            <p className="text-sm font-bold text-slate-400">Manage delivery fees, tax rates, and official store contact information</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Shipping Threshold */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-indigo-600/30 transition-all"
          >
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
              <Truck className="w-7 h-7 text-amber-500" />
            </div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-1">Free Shipping Threshold</label>
            <div className="relative">
               <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black">৳</div>
               <input
                 type="number"
                 value={form.free_shipping_threshold || ''}
                 onChange={(e) => setForm({ ...form, free_shipping_threshold: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                 className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all"
               />
            </div>
          </motion.div>

          {/* Standard Delivery Fee */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-indigo-600/30 transition-all"
          >
            <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
              <DollarSign className="w-7 h-7 text-indigo-600" />
            </div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-1">Standard Delivery Fee</label>
            <div className="relative">
               <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black">৳</div>
               <input
                 type="number"
                 value={form.standard_delivery_fee || ''}
                 onChange={(e) => setForm({ ...form, standard_delivery_fee: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                 className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all"
               />
            </div>
          </motion.div>

          {/* Tax Percentage */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-indigo-600/30 transition-all"
          >
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
              <Percent className="w-7 h-7 text-emerald-500" />
            </div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-1">Estimated Tax (%)</label>
            <div className="relative">
               <input
                 type="number"
                 value={form.tax_percentage || ''}
                 onChange={(e) => setForm({ ...form, tax_percentage: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                 className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all"
               />
               <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-black">%</div>
            </div>
          </motion.div>

          {/* Store Email */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-indigo-600/30 transition-all"
          >
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
              <Mail className="w-7 h-7 text-blue-500" />
            </div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-1">Store Official Email</label>
            <input
              type="email"
              value={form.store_email}
              onChange={(e) => setForm({ ...form, store_email: e.target.value })}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all"
            />
          </motion.div>

          {/* Store Phone */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-indigo-600/30 transition-all"
          >
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
              <Phone className="w-7 h-7 text-rose-500" />
            </div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-1">Store Contact Phone</label>
            <input
              type="text"
              value={form.store_phone}
              onChange={(e) => setForm({ ...form, store_phone: e.target.value })}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all"
            />
          </motion.div>

          {/* Store Address */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-indigo-600/30 transition-all"
          >
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
              <MapPin className="w-7 h-7 text-slate-600" />
            </div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-1">Store Physical Address</label>
            <textarea
              rows={2}
              value={form.store_address}
              onChange={(e) => setForm({ ...form, store_address: e.target.value })}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all resize-none"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
