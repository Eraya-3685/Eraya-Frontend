import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Phone, MapPin, Save, ArrowLeft, ShieldCheck, 
  Mail, Lock, X, RefreshCcw, Eye, EyeOff, AlertCircle, Plus, Activity 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import api from '../api/axios';
import { getImageUrl } from '../api/axios';
import toast from 'react-hot-toast';
import SegmentedOTPInput from '../components/SegmentedOTPInput';
import ErrorMsg from '../components/ErrorMsg';

const OTPModal = ({ isOpen, onClose, onVerify, purpose, loading }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleVerify = () => {
    if (otp.length < 6) {
      setError('Please enter 6-digit code');
      return;
    }
    onVerify(otp);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl"
        >
          <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Verify it's you</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              We've sent a code for <span className="font-bold text-slate-900 uppercase">{purpose}</span> update.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <SegmentedOTPInput
                value={otp}
                onChange={(val) => {
                  setOtp(val);
                  setError('');
                }}
                disabled={loading}
              />
              <AnimatePresence>{error && <ErrorMsg message={error} />}</AnimatePresence>
            </div>

            <button
              onClick={handleVerify}
              disabled={loading || otp.length !== 6}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : 'Verify & Update'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const EditProfile = () => {
  const { user, updateProfile, requestOTP, secureUpdate, uploadAvatar, loading } = useAuthStore();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({ full_name: '', address: '' });
  const [sensitiveData, setSensitiveData] = useState({ email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [avatarLoading, setAvatarLoading] = useState(false);

  const [otpModal, setOtpModal] = useState({ isOpen: false, purpose: '', targetData: null });

  useEffect(() => {
    if (user) {
      setProfileData({ full_name: user.full_name || '', address: user.address || '' });
      setSensitiveData(prev => ({ ...prev, email: user.email || '', phone: user.phone || '' }));
    }
  }, [user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await api.post('/upload', formData);
      await uploadAvatar(uploadRes.data.url);
      toast.success('Avatar updated!');
    } catch (error) {
      toast.error('Failed to update avatar');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!profileData.full_name || profileData.full_name.trim().length < 3) {
      newErrors.full_name = 'Name must be at least 3 characters';
    }
    if (!profileData.address || profileData.address.trim().length < 5) {
      newErrors.address = 'Please enter a valid address';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await updateProfile(profileData);
      toast.success('Profile updated');
      setErrors({});
    } catch (error) {
      toast.error(error.response?.data || 'Failed to update');
    }
  };

  const startSecureUpdate = async (purpose) => {
    const newErrors = {};
    if (purpose === 'password') {
      if (sensitiveData.password.length < 6) newErrors.password = 'Min 6 characters required';
      if (sensitiveData.password !== sensitiveData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    } else if (purpose === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sensitiveData.email)) {
        newErrors.email = 'Invalid email format';
      }
    } else if (purpose === 'phone') {
      if (!/^\d{11}$/.test(sensitiveData.phone)) {
        newErrors.phone = 'Phone must be exactly 11 digits';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await requestOTP(purpose);
      setOtpModal({
        isOpen: true,
        purpose: purpose,
        targetData: purpose === 'password' ? { password: sensitiveData.password } :
          purpose === 'email' ? { email: sensitiveData.email } :
            { phone: sensitiveData.phone }
      });
      setErrors({});
    } catch (error) {
      toast.error(error.response?.data || 'Failed to send OTP');
    }
  };

  const handleOTPVerify = async (code) => {
    try {
      await secureUpdate({ otp: code, purpose: otpModal.purpose, ...otpModal.targetData });
      toast.success('Updated successfully');
      setOtpModal({ isOpen: false, purpose: '', targetData: null });
      if (otpModal.purpose === 'password') setSensitiveData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      setErrors({});
    } catch (error) {
      const msg = error.response?.data;
      if (typeof msg === 'string' && msg.includes('same as the current')) {
        setErrors({ password: 'New password cannot be the same as your current one' });
        setOtpModal({ isOpen: false, purpose: '', targetData: null });
      } else {
        toast.error(msg || 'Verification failed');
      }
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate('/profile')} className="flex items-center gap-2 text-slate-500 font-bold text-sm mb-8 hover:text-secondary transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Profile
        </button>

        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Left Side: Avatar & Identity */}
          <aside className="w-full lg:w-1/3">
             <motion.div 
               initial={{ opacity: 0, x: -20 }} 
               animate={{ opacity: 1, x: 0 }}
               className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-10 text-center sticky top-32"
             >
                <div className="relative w-40 h-40 mx-auto mb-8 group">
                   <div className="w-full h-full rounded-full border-4 border-slate-50 overflow-hidden bg-slate-100 shadow-2xl transition-transform duration-500 group-hover:scale-105">
                      {user.avatar_url ? (
                        <img src={getImageUrl(user.avatar_url)} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-black text-slate-300">
                          {user.full_name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {avatarLoading && (
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
                          <RefreshCcw className="w-8 h-8 text-white animate-spin" />
                        </div>
                      )}
                   </div>
                   <label className="absolute bottom-1 right-1 w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center cursor-pointer hover:bg-primary hover:scale-110 transition-all shadow-lg border-2 border-white">
                      <Plus className="w-5 h-5" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={avatarLoading} />
                   </label>
                </div>

                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{user.full_name}</h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                   <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                      {user.role}
                   </span>
                </div>

                <div className="mt-10 pt-10 border-t border-slate-50 space-y-4">
                   <div className="flex items-center gap-4 text-left p-4 bg-slate-50 rounded-2xl">
                      <Activity className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Status</p>
                        <p className="text-sm font-bold text-slate-900">Verified & Active</p>
                      </div>
                   </div>
                </div>
             </motion.div>
          </aside>

          {/* Right Side: Settings Grid */}
          <div className="flex-grow space-y-8">
             
             {/* Section 1: Basic Info */}
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 md:p-10">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                      <User className="w-6 h-6" />
                   </div>
                   <div>
                      <h2 className="text-xl font-bold text-slate-900">Personal Details</h2>
                      <p className="text-slate-500 text-xs">Manage your primary account identity</p>
                   </div>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input
                            type="text"
                            value={profileData.full_name}
                            onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-secondary transition-all outline-none"
                          />
                        </div>
                        <AnimatePresence>{errors.full_name && <ErrorMsg message={errors.full_name} />}</AnimatePresence>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address Summary</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input
                            type="text"
                            value={profileData.address}
                            onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-secondary transition-all outline-none"
                          />
                        </div>
                        <AnimatePresence>{errors.address && <ErrorMsg message={errors.address} />}</AnimatePresence>
                      </div>
                   </div>

                   <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary transition-all shadow-lg disabled:opacity-50 mt-4">
                      {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : 'Save Personal Details'}
                   </button>
                </form>
             </motion.div>

             {/* Section 2: Contact & Security Split */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Contact Details */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                         <Mail className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-slate-900">Contact Details</h3>
                   </div>

                   <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                          <button onClick={() => startSecureUpdate('email')} className="text-[10px] font-black text-primary uppercase hover:underline">Change</button>
                        </div>
                        <input
                          type="email"
                          value={sensitiveData.email}
                          onChange={(e) => setSensitiveData({ ...sensitiveData, email: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</label>
                          <button onClick={() => startSecureUpdate('phone')} className="text-[10px] font-black text-primary uppercase hover:underline">Change</button>
                        </div>
                        <input
                          type="tel"
                          value={sensitiveData.phone}
                          onChange={(e) => setSensitiveData({ ...sensitiveData, phone: e.target.value.replace(/\D/g, '') })}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                        />
                      </div>
                   </div>
                </motion.div>

                {/* Password Management */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                         <Lock className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-slate-900">Password</h3>
                   </div>

                   <div className="space-y-4">
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="New Password"
                          value={sensitiveData.password}
                          onChange={(e) => setSensitiveData({ ...sensitiveData, password: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-4 pr-10 text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm Password"
                        value={sensitiveData.confirmPassword}
                        onChange={(e) => setSensitiveData({ ...sensitiveData, confirmPassword: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
                      />
                      <button onClick={() => startSecureUpdate('password')} disabled={!sensitiveData.password} className="w-full py-3 bg-amber-500 text-white rounded-xl font-bold text-xs hover:bg-amber-600 transition-all disabled:opacity-20 mt-2">
                        Set New Password
                      </button>
                   </div>
                </motion.div>

             </div>

          </div>
        </div>
      </div>

      <OTPModal
        isOpen={otpModal.isOpen}
        onClose={() => setOtpModal({ isOpen: false, purpose: '', targetData: null })}
        onVerify={handleOTPVerify}
        purpose={otpModal.purpose}
        loading={loading}
      />
    </div>
  );
};

export default EditProfile;
