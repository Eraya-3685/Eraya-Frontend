import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Truck, DollarSign, Percent, ChevronRight, Mail, Phone, MapPin, RefreshCcw, Camera, Upload } from 'lucide-react';
import useSettingsStore from '../store/useSettingsStore';
import toast from 'react-hot-toast';
import useDocumentTitle from '../hooks/useDocumentTitle';
import TakaIcon from '../components/TakaIcon';
import api, { getImageUrl } from '../api/axios';


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
    logo_url: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const logoInputRef = useRef(null);

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
        logo_url: settings.logo_url || '',
        id: settings.id
      });
    }
  }, [settings]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    if (form.logo_url) formData.append('old_url', form.logo_url);

    const uploadToast = toast.loading('Uploading logo...');
    try {
      const res = await api.post('/settings/logo', formData);
      if (res.data && res.data.url) {
        const newLogoUrl = res.data.url;
        // Update local form state
        setForm(prev => ({ ...prev, logo_url: newLogoUrl }));
        // Immediately save logo_url to DB using current settings
        const currentSettings = useSettingsStore.getState().settings;
        await updateSettings({
          ...currentSettings,
          logo_url: newLogoUrl,
          free_shipping_threshold: Number(currentSettings?.free_shipping_threshold ?? form.free_shipping_threshold),
          standard_delivery_fee: Number(currentSettings?.standard_delivery_fee ?? form.standard_delivery_fee),
          tax_percentage: Number(currentSettings?.tax_percentage ?? form.tax_percentage),
        });
        toast.success('Logo saved!', { id: uploadToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('Upload failed. Try again.', { id: uploadToast });
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    
    const payload = {
      ...form,
      free_shipping_threshold: Number(form.free_shipping_threshold),
      standard_delivery_fee: Number(form.standard_delivery_fee),
      tax_percentage: Number(form.tax_percentage),
    };

    const success = await updateSettings(payload);
    if (success) {
      toast.success('Settings Optimized');
    } else {
      toast.error('Update Failed');
    }
    setIsSaving(false);
  };

  if (loading) {
    return (
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem' }}>
         <div style={{ width: 50, height: 50, border: '4px solid #f1f5f9', borderTopColor: '#e11d48', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
         <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>Loading Configuration</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <div style={{ width: 28, height: 28, background: '#e11d4810', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48' }}><Settings style={{ width: 14, height: 14 }} /></div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#e11d48', letterSpacing: '0.05em' }}>System Core</span>
           </div>
           <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>Store Settings</h1>
        </div>
        <button onClick={handleSave} style={{ background: '#e11d48', color: '#fff', border: 'none', padding: '0 1.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', height: 38, boxShadow: '0 8px 20px rgba(225, 29, 72, 0.15)', transition: 'all 0.3s ease', boxSizing: 'border-box' }} disabled={isSaving}>
           {isSaving ? <RefreshCcw style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 16, height: 16 }} />}
           {isSaving ? 'Processing...' : 'Deploy Changes'}
        </button>
      </div>

      {/* Store Logo Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          background: '#fff', 
          borderRadius: '2rem', 
          border: '1px solid #f1f5f9', 
          padding: '2rem', 
          boxShadow: '0 4px 30px rgba(0,0,0,0.015)',
          display: 'flex',
          alignItems: 'center',
          gap: '2.5rem',
          background: 'linear-gradient(to right, #ffffff, #fcfdff)'
        }}
      >
        {/* Circular Logo Preview Frame with Edit Hover Overlay */}
        <div style={{ position: 'relative', width: 90, height: 90, borderRadius: '50%', flexShrink: 0, border: '3px solid #eff6ff', boxShadow: '0 10px 25px rgba(37, 99, 235, 0.08)', overflow: 'hidden', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {form.logo_url ? (
            <img src={getImageUrl(form.logo_url)} alt="Store Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '0.4rem' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '2rem', fontWeight: 900, background: '#f1f5f9' }}>E</div>
          )}
          <button 
            onClick={() => logoInputRef.current?.click()} 
            style={{ 
              position: 'absolute', 
              inset: 0, 
              background: 'rgba(15, 23, 42, 0.65)', 
              color: '#fff', 
              border: 'none', 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer',
              opacity: 0,
              transition: 'opacity 0.25s ease',
              gap: '0.25rem'
            }}
            className="logo-hover-btn"
            title="Change logo"
          >
            <Camera style={{ width: 18, height: 18 }} />
            <span style={{ fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.05em' }}>UPDATE</span>
          </button>
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.35rem 0' }}>Store Branding Identity</h3>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', margin: '0 0 1.25rem 0', lineHeight: 1.45 }}>
            Upload your official store logo to customize the branding across the entire site (admin sidebar, main store navigation, emails, and invoices).
          </p>
          <input 
            type="file" 
            ref={logoInputRef} 
            style={{ display: 'none' }} 
            accept="image/*" 
            onChange={handleLogoUpload} 
          />
          <button 
            onClick={() => logoInputRef.current?.click()} 
            className="logo-upload-btn"
          >
            <Upload style={{ width: 13, height: 13 }} />
            Upload New Logo
          </button>
        </div>
      </motion.div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
         {[
           { label: 'Free Shipping Threshold', value: form.free_shipping_threshold, key: 'free_shipping_threshold', icon: Truck, prefix: '৳', color: '#f59e0b' },
           { label: 'Standard Delivery Fee', value: form.standard_delivery_fee, key: 'standard_delivery_fee', icon: TakaIcon, prefix: '৳', color: '#e11d48' },
           { label: 'Estimated Tax Rate', value: form.tax_percentage, key: 'tax_percentage', icon: Percent, suffix: '%', color: '#10b981' },
           { label: 'Official Store Email', value: form.store_email, key: 'store_email', icon: Mail, type: 'email', color: '#6366f1' },
           { label: 'Customer Support Line', value: form.store_phone, key: 'store_phone', icon: Phone, color: '#f43f5e' },
           { label: 'Physical Store Address', value: form.store_address, key: 'store_address', icon: MapPin, color: '#64748b', isArea: true },
         ].map((item, i) => (
           <motion.div 
             key={i}
             initial={{ opacity: 0, y: 15 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.04 }}
             style={{ background: '#fff', borderRadius: '1.25rem', border: '1px solid #f1f5f9', padding: '1.15rem 1.25rem', boxShadow: '0 4px 20px rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column', gap: '1rem' }}
           >
              <div style={{ width: 38, height: 38, background: `${item.color}10`, borderRadius: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}><item.icon style={{ width: 16, height: 16 }} /></div>
              <div>
                 <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem', display: 'block', marginLeft: '0.25rem' }}>{item.label}</label>
                 <div style={{ position: 'relative' }}>
                    {item.prefix && <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', fontWeight: 900, color: '#0f172a' }}>{item.prefix}</span>}
                    {item.isArea ? (
                       <textarea rows={2} value={item.value} onChange={(e) => setForm({...form, [item.key]: e.target.value})} style={{ width: '100%', background: '#f8f9fc', border: '1px solid #f1f5f9', padding: '0.65rem 0.85rem', borderRadius: '0.85rem', fontSize: '0.8rem', fontWeight: 700, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                    ) : (
                       <input type={item.type || 'text'} value={item.value} onChange={(e) => setForm({...form, [item.key]: e.target.value})} style={{ width: '100%', background: '#f8f9fc', border: '1px solid #f1f5f9', padding: `0 ${item.suffix ? '2rem' : '0.85rem'} 0 ${item.prefix ? '2rem' : '0.85rem'}`, height: 38, boxSizing: 'border-box', borderRadius: '0.85rem', fontSize: '0.8rem', fontWeight: 700, outline: 'none' }} />
                    )}
                    {item.suffix && <span style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', fontWeight: 900, color: '#0f172a' }}>{item.suffix}</span>}
                 </div>
              </div>
           </motion.div>
         ))}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .logo-hover-btn:hover {
          opacity: 1 !important;
        }
        .logo-upload-btn {
          background: #f8fafc; 
          color: #0f172a; 
          border: 1px solid #e2e8f0; 
          padding: 0.5rem 1.25rem; 
          border-radius: 0.85rem;
          font-size: 0.72rem; 
          font-weight: 800; 
          cursor: pointer; 
          display: inline-flex; 
          align-items: center; 
          gap: 0.4rem; 
          transition: all 0.2s; 
        }
        .logo-upload-btn:hover {
          background: #eff6ff; 
          border-color: #3b82f6; 
          color: #2563eb;
        }
      `}</style>
    </div>
  );
};

export default AdminSettings;
