import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Truck, DollarSign, Percent, ChevronRight, Mail, Phone, MapPin, RefreshCcw } from 'lucide-react';
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

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

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
      await updateSettings(form);
      toast.success('Settings Optimized');
    } catch {
      toast.error('Update Failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem' }}>
         <div style={{ width: 50, height: 50, border: '4px solid #f1f5f9', borderTopColor: '#e11d48', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
         <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Loading Configuration</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', paddingBottom: '5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: 32, height: 32, background: '#e11d4810', borderRadius: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48' }}><Settings style={{ width: 18, height: 18 }} /></div>
              <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#e11d48', textTransform: 'uppercase', letterSpacing: '0.15em' }}>System Core</span>
           </div>
           <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>Store Settings</h1>
        </div>
        <button onClick={handleSave} style={{ background: '#e11d48', color: '#fff', border: 'none', padding: '1.25rem 2.5rem', borderRadius: '1.5rem', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', boxShadow: '0 15px 30px rgba(225, 29, 72, 0.25)', transition: 'all 0.3s ease' }} disabled={isSaving}>
           {isSaving ? <RefreshCcw style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 18, height: 18 }} />}
           {isSaving ? 'Processing...' : 'Deploy Changes'}
        </button>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
         {[
           { label: 'Free Shipping Threshold', value: form.free_shipping_threshold, key: 'free_shipping_threshold', icon: Truck, prefix: '৳', color: '#f59e0b' },
           { label: 'Standard Delivery Fee', value: form.standard_delivery_fee, key: 'standard_delivery_fee', icon: DollarSign, prefix: '৳', color: '#e11d48' },
           { label: 'Estimated Tax Rate', value: form.tax_percentage, key: 'tax_percentage', icon: Percent, suffix: '%', color: '#10b981' },
           { label: 'Official Store Email', value: form.store_email, key: 'store_email', icon: Mail, type: 'email', color: '#6366f1' },
           { label: 'Customer Support Line', value: form.store_phone, key: 'store_phone', icon: Phone, color: '#f43f5e' },
           { label: 'Physical Store Address', value: form.store_address, key: 'store_address', icon: MapPin, color: '#64748b', isArea: true },
         ].map((item, i) => (
           <motion.div 
             key={i}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.05 }}
             style={{ background: '#fff', borderRadius: '3rem', border: '1px solid #f1f5f9', padding: '2.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
           >
              <div style={{ width: 54, height: 54, background: `${item.color}10`, borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}><item.icon style={{ width: 24, height: 24 }} /></div>
              <div>
                 <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', display: 'block', marginLeft: '0.5rem' }}>{item.label}</label>
                 <div style={{ position: 'relative' }}>
                    {item.prefix && <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>{item.prefix}</span>}
                    {item.isArea ? (
                      <textarea rows={2} value={item.value} onChange={(e) => setForm({...form, [item.key]: e.target.value})} style={{ width: '100%', background: '#f8f9fc', border: '1px solid #f1f5f9', padding: '1.25rem', borderRadius: '1.5rem', fontSize: '0.9rem', fontWeight: 700, outline: 'none', resize: 'none' }} />
                    ) : (
                      <input type={item.type || 'text'} value={item.value} onChange={(e) => setForm({...form, [item.key]: e.target.value})} style={{ width: '100%', background: '#f8f9fc', border: '1px solid #f1f5f9', padding: `1.25rem 1.25rem 1.25rem ${item.prefix ? '2.5rem' : '1.25rem'}`, borderRadius: '1.5rem', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }} />
                    )}
                    {item.suffix && <span style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>{item.suffix}</span>}
                 </div>
              </div>
           </motion.div>
         ))}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AdminSettings;
