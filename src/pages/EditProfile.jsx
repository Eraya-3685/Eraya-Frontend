import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Phone, MapPin, Save, ArrowLeft, ShieldCheck, 
  Mail, Lock, X, RefreshCcw, Eye, EyeOff, AlertCircle, Plus, Activity, Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import api, { getImageUrl } from '../api/axios';
import toast from 'react-hot-toast';
import OTPModal from '../components/OTPModal';
import ActionConfirmationModal from '../components/ActionConfirmationModal';
import ErrorMsg from '../components/ErrorMsg';
import useMediaQuery from '../hooks/useMediaQuery';

/* ── design tokens (consistent with Dashboard) ── */
const C = {
  t900: '#0d1117', t700: '#1f2937', t500: '#6b7280', t300: '#adb5bd',
  bSoft: 'rgba(0,0,0,0.07)', bMed: 'rgba(0,0,0,0.12)',
  bgCard: '#ffffff', bgPage: '#edf0f4', bgMuted: '#f3f5f8',
  lime: '#cbff00', blue: '#3b82f6', rose: '#f43f5e', amber: '#f59e0b',
  rSm: '0.85rem', rMd: '1.25rem', rLg: '1.5rem', r2xl: '2.5rem'
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
});

/* ── helper components (outside to prevent focus loss) ── */
const Label = ({ children }) => (
  <label style={{ fontSize: '0.62rem', fontWeight: 800, color: C.t300, letterSpacing: '0.05em', marginBottom: '0.4rem', display: 'block', marginLeft: '0.5rem' }}>
    {children}
  </label>
);

const Input = (props) => (
  <input {...props} style={{
    width: '100%', padding: '0.85rem 1.25rem', borderRadius: C.rMd,
    background: '#fff', border: `1px solid ${C.bSoft}`,
    fontSize: '0.8rem', fontWeight: 700, color: C.t900, outline: 'none',
    transition: 'all 0.2s', ...props.style
  }} onFocus={e => e.currentTarget.style.borderColor = C.t900} onBlur={e => e.currentTarget.style.borderColor = C.bSoft} />
);

const EditProfile = () => {
  const { isMobile } = useMediaQuery();
  const { user, updateProfile, requestOTP, secureUpdate, uploadAvatar, loading } = useAuthStore();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({ full_name: '', address: '' });
  const [sensitiveData, setSensitiveData] = useState({ email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [avatarLoading, setAvatarLoading] = useState(false);

  const [otpModal, setOtpModal] = useState({ isOpen: false, purpose: '', targetData: null });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, purpose: '', targetData: null });

  useEffect(() => {
    if (user) {
      setProfileData({ full_name: user.full_name || '', address: user.address || '' });
      setSensitiveData(prev => ({ ...prev, email: user.email || '', phone: user.phone || '' }));
    }
  }, [user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file || file.size > 2 * 1024 * 1024) return toast.error('Max 2MB allowed');
    setAvatarLoading(true);
    try {
      await uploadAvatar(file);
      toast.success('Photo updated');
    } catch { 
      toast.error('Upload failed'); 
    } finally { 
      setAvatarLoading(false); 
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!profileData.full_name?.trim() || profileData.full_name.length < 3) newErrors.full_name = 'Min 3 chars';
    if (!profileData.address?.trim() || profileData.address.length < 5) newErrors.address = 'Min 5 chars';
    if (Object.keys(newErrors).length > 0) return setErrors(newErrors);

    try {
      await updateProfile(profileData);
      toast.success('Changes saved');
      setErrors({});
    } catch (err) { toast.error(err.response?.data || 'Failed to update'); }
  };

  const startSecureUpdate = async (purpose) => {
    const newErrors = {};
    if (purpose === 'password') {
      if (sensitiveData.password.length < 6) newErrors.password = 'Min 6 chars';
      if (sensitiveData.password !== sensitiveData.confirmPassword) newErrors.confirmPassword = 'Mismatch';
    } else if (purpose === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sensitiveData.email)) {
      newErrors.email = 'Invalid email';
    } else if (purpose === 'phone' && !/^\d{11}$/.test(sensitiveData.phone)) {
      newErrors.phone = '11 digits required';
    }

    if (Object.keys(newErrors).length > 0) return setErrors(newErrors);

    const targetData = purpose === 'password' ? { password: sensitiveData.password } :
      purpose === 'email' ? { email: sensitiveData.email } : { phone: sensitiveData.phone };

    setConfirmModal({ isOpen: true, purpose, targetData });
    setErrors({});
  };

  const handleConfirmedSecureUpdate = async () => {
    const { purpose, targetData } = confirmModal;
    setConfirmModal({ isOpen: false, purpose: '', targetData: null });
    try {
      await requestOTP(purpose);
      setOtpModal({ isOpen: true, purpose, targetData });
    } catch (err) { toast.error(err.response?.data || 'OTP error'); }
  };

  const handleOTPVerify = async (code) => {
    try {
      await secureUpdate({ otp: code, purpose: otpModal.purpose, ...otpModal.targetData });
      toast.success('Security update successful');
      setOtpModal({ isOpen: false, purpose: '', targetData: null });
      if (otpModal.purpose === 'password') setSensitiveData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      setErrors({});
    } catch (err) {
      const msg = err.response?.data;
      if (typeof msg === 'string' && msg.includes('same')) {
        setErrors({ password: 'Use a different password' });
        setOtpModal({ isOpen: false, purpose: '', targetData: null });
      } else toast.error(msg || 'Failed');
    }
  };

  if (!user) return null;

  return (
    <div style={{ background: C.bgPage, minHeight: '100vh', padding: '5.2rem 1.5rem 4rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        
        <button onClick={() => navigate('/profile')} style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none',
          fontSize: '0.75rem', fontWeight: 800, color: C.t300, cursor: 'pointer', marginBottom: '2rem'
        }}>
          <ArrowLeft style={{ width: 16, height: 16 }} /> Back to Dashboard
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '22rem 1fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* SIDEBAR */}
          <motion.div {...fadeUp(0)} style={{
            background: C.bgCard, borderRadius: C.r2xl, padding: '2.5rem',
            border: `1px solid ${C.bSoft}`, textAlign: 'center', position: 'sticky', top: '7rem'
          }}>
            <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 1.5rem' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '4px solid #fff', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}>
                {user.avatar_url ? (
                  <img src={getImageUrl(user.avatar_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: C.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 900, color: C.t300 }}>
                    {user.full_name?.charAt(0)}
                  </div>
                )}
                {avatarLoading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><RefreshCcw className="animate-spin" /></div>}
              </div>
              <label style={{
                position: 'absolute', bottom: 5, right: 5, width: 32, height: 32,
                background: C.t900, color: '#fff', borderRadius: '50%', border: '3px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}>
                <Plus style={{ width: 16, height: 16 }} />
                <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
              </label>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: C.t900, margin: '0 0 0.5rem' }}>{user.full_name}</h2>
            <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '0.2rem 0.6rem', background: C.bgMuted, color: C.t500, borderRadius: 99 }}>{user.role} Member</span>

            <div style={{ marginTop: '2.5rem', padding: '1.25rem', background: C.bgMuted, borderRadius: C.rMd, textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ShieldCheck style={{ width: 18, height: 18, color: '#10b981' }} />
                <div>
                  <p style={{ fontSize: '0.62rem', fontWeight: 800, color: C.t300, margin: 0 }}>Security Status</p>
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, color: C.t700, margin: 0 }}>Fully Protected</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* FORM AREA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <motion.div {...fadeUp(0.05)} style={{ background: C.bgCard, borderRadius: C.r2xl, padding: '2.5rem', border: `1px solid ${C.bSoft}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ width: 42, height: 42, background: C.bgMuted, borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User style={{ width: 20, height: 20, color: C.t900 }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: C.t900, margin: 0 }}>Basic Identity</h3>
                  <p style={{ fontSize: '0.7rem', color: C.t300, fontWeight: 600, margin: 0 }}>Manage your primary profile information</p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <Label>Full Name</Label>
                    <Input value={profileData.full_name} onChange={e => setProfileData({...profileData, full_name: e.target.value})} />
                    <AnimatePresence>{errors.full_name && <ErrorMsg message={errors.full_name} />}</AnimatePresence>
                  </div>
                  <div>
                    <Label>Shipping Address</Label>
                    <Input value={profileData.address} onChange={e => setProfileData({...profileData, address: e.target.value})} />
                    <AnimatePresence>{errors.address && <ErrorMsg message={errors.address} />}</AnimatePresence>
                  </div>
                </div>
                <button type="submit" disabled={loading} style={{
                  padding: '1rem', background: C.t900, color: '#fff', border: 'none', borderRadius: C.rMd,
                  fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}>
                  {loading ? 'Saving...' : <><Save style={{ width: 14, height: 14 }} /> Save Identity Updates</>}
                </button>
              </form>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
              
              {/* CONTACT UPDATES */}
              <motion.div {...fadeUp(0.1)} style={{ background: C.bgCard, borderRadius: C.r2xl, padding: '2rem', border: `1px solid ${C.bSoft}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{ width: 34, height: 34, background: '#eff6ff', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mail style={{ width: 16, height: 16, color: C.blue }} />
                  </div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: C.t900, margin: 0 }}>Secure Contact</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Label>Email</Label>
                      <button onClick={() => startSecureUpdate('email')} style={{ background: 'none', border: 'none', color: C.blue, fontSize: '0.62rem', fontWeight: 800, cursor: 'pointer' }}>Change</button>
                    </div>
                    <Input value={sensitiveData.email} onChange={e => setSensitiveData({...sensitiveData, email: e.target.value})} />
                    {errors.email && <span style={{ fontSize: '0.65rem', color: C.rose, fontWeight: 700, marginTop: '0.25rem', display: 'block' }}>{errors.email}</span>}
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Label>Phone</Label>
                      <button onClick={() => startSecureUpdate('phone')} style={{ background: 'none', border: 'none', color: C.blue, fontSize: '0.62rem', fontWeight: 800, cursor: 'pointer' }}>Change</button>
                    </div>
                    <Input value={sensitiveData.phone} onChange={e => setSensitiveData({...sensitiveData, phone: e.target.value.replace(/\D/g, '')})} />
                    {errors.phone && <span style={{ fontSize: '0.65rem', color: C.rose, fontWeight: 700, marginTop: '0.25rem', display: 'block' }}>{errors.phone}</span>}
                  </div>
                </div>
              </motion.div>

              {/* PASSWORD UPDATES */}
              <motion.div {...fadeUp(0.15)} style={{ background: C.bgCard, borderRadius: C.r2xl, padding: '2rem', border: `1px solid ${C.bSoft}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{ width: 34, height: 34, background: '#fffbeb', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lock style={{ width: 16, height: 16, color: C.amber }} />
                  </div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: C.t900, margin: 0 }}>Update Password</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ position: 'relative' }}>
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="New Password" 
                      value={sensitiveData.password} 
                      onChange={e => setSensitiveData({...sensitiveData, password: e.target.value})} 
                      autoComplete="new-password"
                    />
                    <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.t300, cursor: 'pointer' }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <span style={{ fontSize: '0.65rem', color: C.rose, fontWeight: 700, marginLeft: '0.5rem' }}>{errors.password}</span>}
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Confirm New Password" 
                    value={sensitiveData.confirmPassword} 
                    onChange={e => setSensitiveData({...sensitiveData, confirmPassword: e.target.value})} 
                    autoComplete="new-password"
                  />
                  {errors.confirmPassword && <span style={{ fontSize: '0.65rem', color: C.rose, fontWeight: 700, marginLeft: '0.5rem' }}>{errors.confirmPassword}</span>}
                  <button onClick={() => startSecureUpdate('password')} disabled={!sensitiveData.password} style={{
                    padding: '0.85rem', background: C.amber, color: '#fff', border: 'none', borderRadius: C.rMd,
                    fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', opacity: !sensitiveData.password ? 0.3 : 1
                  }}>Set Secure Password</button>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </div>

      <ActionConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, purpose: '', targetData: null })}
        onConfirm={handleConfirmedSecureUpdate}
        title={`Update your ${confirmModal.purpose}?`}
        description={`We need to send a verification code to your email to confirm this change.`}
        confirmText="Send OTP"
        type="warning"
        icon={confirmModal.purpose === 'password' ? Lock : Mail}
      />

      <OTPModal
        isOpen={otpModal.isOpen}
        onClose={() => setOtpModal({ isOpen: false, purpose: '', targetData: null })}
        onConfirm={handleOTPVerify}
        onResend={() => requestOTP(otpModal.purpose)}
        email={user?.email}
        loading={loading}
        title="Verify Identity"
        description="A 6-digit code has been sent to your email."
      />
    </div>
  );
};

export default EditProfile;
