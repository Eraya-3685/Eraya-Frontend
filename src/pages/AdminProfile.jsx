import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Camera, Save, Shield, UserCircle, Settings, Activity } from 'lucide-react';
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
    setAvatarUploading(true);
    try {
      await uploadAvatar(file);
      toast.success('Avatar Updated');
    } catch {
      toast.error('Failed to upload');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(form);
      toast.success('Profile Updated');
    } catch {
      toast.error('Failed to update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', paddingBottom: '5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: 32, height: 32, background: '#e11d4810', borderRadius: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48' }}><User style={{ width: 18, height: 18 }} /></div>
              <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#e11d48', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Identity Management</span>
           </div>
           <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>My Profile</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '2.5rem' }}>
         
         {/* Sidebar Profile Card */}
         <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ background: '#fff', borderRadius: '3rem', border: '1px solid #f1f5f9', padding: '3rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', textAlign: 'center' }}>
               <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto 2rem' }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '4rem', overflow: 'hidden', border: '8px solid #fff', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                     {user?.avatar_url ? <img src={getImageUrl(user.avatar_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <div style={{ width: '100%', height: '100%', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 900 }}>{user?.full_name?.charAt(0)}</div>}
                  </div>
                  <button onClick={() => fileInputRef.current?.click()} style={{ position: 'absolute', bottom: -5, right: -5, width: 48, height: 48, borderRadius: '1.25rem', background: '#e11d48', color: '#fff', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 10px 20px rgba(225, 29, 72, 0.3)' }} disabled={avatarUploading}>{avatarUploading ? <RefreshCcw style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} /> : <Camera style={{ width: 20, height: 20 }} />}</button>
                  <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleAvatarChange} />
               </div>
               <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem' }}>{user?.full_name}</h2>
               <div style={{ display: 'inline-flex', padding: '0.5rem 1rem', background: '#e11d4810', color: '#e11d48', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{user?.role}</div>
               
               <div style={{ marginTop: '3rem', paddingTop: '3rem', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Auth Status</span>
                     <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#10b981' }}>Verified</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Member Since</span>
                     <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0f172a' }}>{new Date(user?.created_at).getFullYear()}</span>
                  </div>
               </div>
            </div>
         </div>

         {/* Form Section */}
         <div style={{ background: '#fff', borderRadius: '3rem', border: '1px solid #f1f5f9', padding: '3.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
            <div style={{ marginBottom: '3rem' }}>
               <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem' }}>Account Information</h3>
               <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', margin: 0 }}>Update your personal details and contact information</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                     <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: '1rem' }}>Full Name</label>
                     <input type="text" value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})} style={{ width: '100%', background: '#f8f9fc', border: '1px solid #f1f5f9', padding: '1.25rem 1.75rem', borderRadius: '1.5rem', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                     <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: '1rem' }}>Phone Number</label>
                     <input type="text" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} style={{ width: '100%', background: '#f8f9fc', border: '1px solid #f1f5f9', padding: '1.25rem 1.75rem', borderRadius: '1.5rem', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }} />
                  </div>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: '1rem' }}>Email Address (Read Only)</label>
                  <input type="email" value={form.email} readOnly style={{ width: '100%', background: '#f8f9fc', border: '1px solid #f1f5f9', padding: '1.25rem 1.75rem', borderRadius: '1.5rem', fontSize: '0.9rem', fontWeight: 700, outline: 'none', color: '#94a3b8', cursor: 'not-allowed' }} />
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: '1rem' }}>Address</label>
                  <textarea rows={4} value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} style={{ width: '100%', background: '#f8f9fc', border: '1px solid #f1f5f9', padding: '1.25rem 1.75rem', borderRadius: '1.5rem', fontSize: '0.9rem', fontWeight: 700, outline: 'none', resize: 'none' }} />
               </div>

               <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" disabled={loading} style={{ background: '#e11d48', color: '#fff', border: 'none', padding: '1.25rem 3rem', borderRadius: '1.5rem', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 20px rgba(225, 29, 72, 0.2)', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>{loading ? 'Updating...' : 'Save Settings'}</button>
               </div>
            </form>
         </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AdminProfile;
