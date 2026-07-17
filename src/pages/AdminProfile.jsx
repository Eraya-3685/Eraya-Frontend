import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Camera, Save, Shield, UserCircle, Settings, Activity, Lock, Eye, EyeOff, RefreshCcw } from 'lucide-react';
import api, { getImageUrl } from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import useMediaQuery from '../hooks/useMediaQuery';

const AdminProfile = () => {
  const { isMobile } = useMediaQuery();
  const { user, updateProfile, uploadAvatar, fetchProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef();

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('account'); // 'account' | 'password'

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

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (user?.has_password && !pwdForm.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (!pwdForm.newPassword || pwdForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.post('/users/change-password', {
        current_password: pwdForm.currentPassword,
        new_password: pwdForm.newPassword
      });
      toast.success('Password updated successfully');
      setPwdForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      if (fetchProfile) {
        await fetchProfile();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', paddingBottom: '5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-end', gap: '1rem' }}>
           <h1 style={{ fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>My Profile</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '400px 1fr', gap: isMobile ? '1.5rem' : '2.5rem' }}>
         
         {/* Sidebar Profile Card */}
         <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ background: '#fff', borderRadius: isMobile ? '1.5rem' : '3rem', border: '1px solid #f1f5f9', padding: isMobile ? '1.5rem 1.25rem' : '3rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', textAlign: 'center' }}>
               <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto 1.5rem' }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '4rem', overflow: 'hidden', border: '8px solid #fff', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                     {user?.avatar_url ? <img src={getImageUrl(user.avatar_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <div style={{ width: '100%', height: '100%', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 900 }}>{user?.full_name?.charAt(0)}</div>}
                  </div>
                  <button onClick={() => fileInputRef.current?.click()} style={{ position: 'absolute', bottom: -5, right: -5, width: 48, height: 48, borderRadius: '1.25rem', background: '#e11d48', color: '#fff', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 10px 20px rgba(225, 29, 72, 0.3)' }} disabled={avatarUploading}>{avatarUploading ? <RefreshCcw style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} /> : <Camera style={{ width: 20, height: 20 }} />}</button>
                  <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleAvatarChange} />
               </div>
               <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem' }}>{user?.full_name}</h2>
               <div style={{ display: 'inline-flex', padding: '0.5rem 1rem', background: '#e11d4810', color: '#e11d48', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: 900, textTransform: 'capitalize' }}>{user?.role}</div>
               
               <div style={{ marginTop: '3rem', paddingTop: '3rem', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>Auth Status</span>
                     <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#10b981' }}>Verified</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>Member Since</span>
                     <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0f172a' }}>{new Date(user?.created_at).getFullYear()}</span>
                  </div>
               </div>
            </div>
         </div>

          {/* Form Section Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             
             {/* Tab Buttons */}
             <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.5rem', background: '#f8fafc', padding: '0.5rem', borderRadius: isMobile ? '1rem' : '1.5rem', border: '1px solid #f1f5f9', alignSelf: isMobile ? 'stretch' : 'flex-start' }}>
                <button
                   type="button"
                   onClick={() => setActiveTab('account')}
                   style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1.75rem', borderRadius: '1rem',
                      background: activeTab === 'account' ? '#e11d48' : 'transparent',
                      color: activeTab === 'account' ? '#fff' : '#64748b',
                      border: 'none', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer',
                      transition: 'all 0.25s ease'
                   }}
                >
                   <User size={16} />
                   <span>Account Information</span>
                </button>
                <button
                   type="button"
                   onClick={() => setActiveTab('password')}
                   style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1.75rem', borderRadius: '1rem',
                      background: activeTab === 'password' ? '#e11d48' : 'transparent',
                      color: activeTab === 'password' ? '#fff' : '#64748b',
                      border: 'none', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer',
                      transition: 'all 0.25s ease'
                   }}
                >
                   <Lock size={16} />
                   <span>Password & Security</span>
                </button>
             </div>

             {/* Account Information Tab Content */}
             {activeTab === 'account' && (
                <div style={{ background: '#fff', borderRadius: isMobile ? '1.5rem' : '3rem', border: '1px solid #f1f5f9', padding: isMobile ? '1.5rem 1.25rem' : '3.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                   <div style={{ marginBottom: '3rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem' }}>Account Information</h3>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', margin: 0 }}>Update your personal details and contact information</p>
                   </div>

                   <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '1rem' : '2rem' }}>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginLeft: '1rem' }}>Full Name</label>
                            <input type="text" value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})} style={{ width: '100%', background: '#f8f9fc', border: '1px solid #f1f5f9', padding: '1.25rem 1.75rem', borderRadius: '1.5rem', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }} />
                         </div>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginLeft: '1rem' }}>Phone Number</label>
                            <input type="text" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} style={{ width: '100%', background: '#f8f9fc', border: '1px solid #f1f5f9', padding: '1.25rem 1.75rem', borderRadius: '1.5rem', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }} />
                         </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                         <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginLeft: '1rem' }}>Email Address (Read Only)</label>
                         <input type="email" value={form.email} readOnly style={{ width: '100%', background: '#f8f9fc', border: '1px solid #f1f5f9', padding: '1.25rem 1.75rem', borderRadius: '1.5rem', fontSize: '0.9rem', fontWeight: 700, outline: 'none', color: '#94a3b8', cursor: 'not-allowed' }} />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                         <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginLeft: '1rem' }}>Address</label>
                         <textarea rows={4} value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} style={{ width: '100%', background: '#f8f9fc', border: '1px solid #f1f5f9', padding: '1.25rem 1.75rem', borderRadius: '1.5rem', fontSize: '0.9rem', fontWeight: 700, outline: 'none', resize: 'none' }} />
                      </div>

                      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                         <button type="submit" disabled={loading} style={{ background: '#e11d48', color: '#fff', border: 'none', padding: '1.25rem 3rem', borderRadius: '1.5rem', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 20px rgba(225, 29, 72, 0.2)', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>{loading ? 'Updating...' : 'Save Settings'}</button>
                      </div>
                   </form>
                </div>
             )}

             {/* Password Section Tab Content */}
             {activeTab === 'password' && (
                <div style={{ background: '#fff', borderRadius: isMobile ? '1.5rem' : '3rem', border: '1px solid #f1f5f9', padding: isMobile ? '1.5rem 1.25rem' : '3.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                   <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: 42, height: 42, background: '#fffbeb', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <Lock style={{ width: 20, height: 20, color: '#f59e0b' }} />
                      </div>
                      <div>
                         <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.25rem' }}>Update Password</h3>
                         <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', margin: 0 }}>
                            {user?.has_password ? 'Verify your identity and set a new password' : 'Create a secure password for your account'}
                         </p>
                      </div>
                   </div>

                   <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                      {user?.has_password && (
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginLeft: '1rem' }}>Current Password</label>
                            <div style={{ position: 'relative' }}>
                               <input
                                  type={showCurrentPassword ? "text" : "password"}
                                  value={pwdForm.currentPassword}
                                  onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                                  style={{ width: '100%', background: '#f8f9fc', border: '1px solid #f1f5f9', padding: '1.25rem 3.5rem 1.25rem 1.75rem', borderRadius: '1.5rem', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                                  placeholder="Enter current password"
                               />
                               <button
                                  type="button"
                                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                  style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                               >
                                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                               </button>
                            </div>
                         </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '1rem' : '2rem' }}>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginLeft: '1rem' }}>New Password</label>
                            <div style={{ position: 'relative' }}>
                               <input
                                  type={showNewPassword ? "text" : "password"}
                                  value={pwdForm.newPassword}
                                  onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                                  style={{ width: '100%', background: '#f8f9fc', border: '1px solid #f1f5f9', padding: '1.25rem 3.5rem 1.25rem 1.75rem', borderRadius: '1.5rem', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                                  placeholder="Min 6 characters"
                               />
                               <button
                                  type="button"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                  style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                               >
                                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                               </button>
                            </div>
                         </div>

                         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginLeft: '1rem' }}>Confirm New Password</label>
                            <input
                               type={showNewPassword ? "text" : "password"}
                               value={pwdForm.confirmPassword}
                               onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                               style={{ width: '100%', background: '#f8f9fc', border: '1px solid #f1f5f9', padding: '1.25rem 1.75rem', borderRadius: '1.5rem', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                               placeholder="Repeat new password"
                            />
                         </div>
                      </div>

                      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                         <button
                            type="submit"
                            disabled={passwordLoading}
                            style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '1.25rem 3rem', borderRadius: '1.5rem', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 20px rgba(245, 158, 11, 0.2)', transition: 'all 0.3s ease' }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                         >
                            {passwordLoading ? 'Saving...' : user?.has_password ? 'Update Password' : 'Set Password'}
                         </button>
                      </div>
                   </form>
                </div>
             )}
          </div>
       </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AdminProfile;
