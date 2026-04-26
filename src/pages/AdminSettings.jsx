import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Shield, Store, Globe, DollarSign, Bell, Truck, Percent } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    store_name: 'Eraya Essential',
    store_email: 'contact@eraya.com',
    currency: 'BDT (৳)',
    vat_percentage: '5',
    delivery_charge: '60',
    maintenance_mode: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulating API call for now
    setTimeout(() => {
      toast.success('Store configuration updated!');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto min-h-screen bg-slate-50">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="p-1.5 bg-secondary/10 rounded-lg">
            <Store className="w-4 h-4 text-secondary" />
          </div>
          <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">Global Configuration</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 font-display tracking-tight">Store Settings</h1>
        <p className="text-slate-500 text-xs mt-0.5">Configure your shop-wide rules and branding</p>
      </header>

      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">General Settings</h3>
            <p className="text-white/50 text-xs mt-0.5">These settings affect the entire storefront.</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${form.maintenance_mode ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
             {form.maintenance_mode ? 'Maintenance Active' : 'Store Live'}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Store Name */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                <Store className="w-4 h-4 text-slate-400" /> Store Name
              </label>
              <input
                type="text"
                value={form.store_name}
                onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-900 font-medium outline-none focus:border-secondary/30 focus:bg-white focus:ring-4 focus:ring-secondary/5 transition-all"
              />
            </div>

            {/* Store Email */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-400" /> Support Email
              </label>
              <input
                type="email"
                value={form.store_email}
                onChange={(e) => setForm({ ...form, store_email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-900 font-medium outline-none focus:border-secondary/30 focus:bg-white focus:ring-4 focus:ring-secondary/5 transition-all"
              />
            </div>

            {/* Currency */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-slate-400" /> Default Currency
              </label>
              <select 
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-900 font-medium outline-none focus:border-secondary/30 focus:bg-white focus:ring-4 focus:ring-secondary/5 transition-all appearance-none"
              >
                <option>BDT (৳)</option>
                <option>USD ($)</option>
              </select>
            </div>

            {/* VAT */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                <Percent className="w-4 h-4 text-slate-400" /> VAT / Tax (%)
              </label>
              <input
                type="number"
                value={form.vat_percentage}
                onChange={(e) => setForm({ ...form, vat_percentage: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-900 font-medium outline-none focus:border-secondary/30 focus:bg-white focus:ring-4 focus:ring-secondary/5 transition-all"
              />
            </div>

            {/* Delivery Charge */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                <Truck className="w-4 h-4 text-slate-400" /> Standard Delivery Fee
              </label>
              <input
                type="number"
                value={form.delivery_charge}
                onChange={(e) => setForm({ ...form, delivery_charge: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-900 font-medium outline-none focus:border-secondary/30 focus:bg-white focus:ring-4 focus:ring-secondary/5 transition-all"
              />
            </div>

            {/* Maintenance Toggle */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-400" /> Maintenance Mode
              </label>
              <div 
                onClick={() => setForm({ ...form, maintenance_mode: !form.maintenance_mode })}
                className={`w-full h-11 rounded-xl flex items-center px-4 cursor-pointer transition-all ${form.maintenance_mode ? 'bg-orange-50 border border-orange-200' : 'bg-slate-50 border border-slate-200'}`}
              >
                <div className={`w-8 h-4 rounded-full relative transition-all ${form.maintenance_mode ? 'bg-orange-500' : 'bg-slate-300'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${form.maintenance_mode ? 'left-4.5' : 'left-0.5'}`} />
                </div>
                <span className={`ml-3 text-xs font-bold ${form.maintenance_mode ? 'text-orange-600' : 'text-slate-500'}`}>
                  {form.maintenance_mode ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-50 flex items-center justify-end gap-4">
             <button
              type="submit"
              disabled={loading}
              className="bg-secondary text-white px-8 py-2.5 rounded-xl font-bold hover:bg-secondary/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-secondary/20 disabled:opacity-50 text-sm"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
