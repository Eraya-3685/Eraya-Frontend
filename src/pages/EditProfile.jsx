import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, MapPin, Save, ArrowLeft, ShieldCheck, Mail, Lock, X, RefreshCcw, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import SegmentedOTPInput from '../components/SegmentedOTPInput';

const ErrorMsg = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
    exit={{ opacity: 0, height: 0 }}
    className="flex items-center gap-1 text-red-500 mt-1.5 ml-1"
  >
    <AlertCircle className="w-3 h-3" />
    <span className="text-[10px] font-bold uppercase tracking-wider">{message}</span>
  </motion.div>
);

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
  const { user, updateProfile, requestOTP, secureUpdate, loading } = useAuthStore();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({ full_name: '', address: '' });
  const [sensitiveData, setSensitiveData] = useState({ email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const [otpModal, setOtpModal] = useState({ isOpen: false, purpose: '', targetData: null });

  useEffect(() => {
    if (user) {
      setProfileData({ full_name: user.full_name || '', address: user.address || '' });
      setSensitiveData(prev => ({ ...prev, email: user.email || '', phone: user.phone || '' }));
    }
  }, [user]);

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
    <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate('/profile')} className="flex items-center gap-2 text-slate-500 font-bold text-sm mb-8 hover:text-secondary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </button>

        <div className="space-y-10">
          {/* General Information */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8 md:p-12">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Basic Info</h1>
            <p className="text-slate-500 text-sm mb-10">Your name and default delivery address.</p>

            <form onSubmit={handleProfileSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative group">
                  <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errors.full_name ? 'text-red-400' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => {
                      setProfileData({ ...profileData, full_name: e.target.value });
                      if (errors.full_name) setErrors({ ...errors, full_name: null });
                    }}
                    className={`w-full bg-slate-50 border rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-medium outline-none transition-all ${errors.full_name ? 'border-red-200 bg-red-50/30' : 'border-slate-200 focus:border-secondary focus:bg-white'}`}
                  />
                </div>
                <AnimatePresence>{errors.full_name && <ErrorMsg message={errors.full_name} />}</AnimatePresence>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Delivery Address</label>
                <div className="relative group">
                  <MapPin className={`absolute left-4 top-4 w-5 h-5 transition-colors ${errors.address ? 'text-red-400' : 'text-slate-400'}`} />
                  <textarea
                    value={profileData.address}
                    onChange={(e) => {
                      setProfileData({ ...profileData, address: e.target.value });
                      if (errors.address) setErrors({ ...errors, address: null });
                    }}
                    rows="3"
                    className={`w-full bg-slate-50 border rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-medium outline-none transition-all ${errors.address ? 'border-red-200 bg-red-50/30' : 'border-slate-200 focus:border-secondary focus:bg-white'}`}
                  />
                </div>
                <AnimatePresence>{errors.address && <ErrorMsg message={errors.address} />}</AnimatePresence>
              </div>

              <button type="submit" disabled={loading} className="w-full py-5 bg-secondary text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-secondary/90 transition-all shadow-xl shadow-secondary/20 disabled:opacity-50">
                {loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Profile</>}
              </button>
            </form>
          </motion.div>

          {/* Secure Updates */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8 md:p-12 border-l-4 border-l-primary">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Communication</h2>
            <p className="text-slate-500 text-sm mb-10">Sensitive changes require email verification.</p>

            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Email Address</label>
                <div className="flex gap-3">
                  <div className="relative group flex-grow">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errors.email ? 'text-red-400' : 'text-slate-400'}`} />
                    <input
                      type="email"
                      value={sensitiveData.email}
                      onChange={(e) => {
                        setSensitiveData({ ...sensitiveData, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: null });
                      }}
                      className={`w-full bg-slate-50 border rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-medium outline-none transition-all ${errors.email ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}
                    />
                  </div>
                  <button onClick={() => startSecureUpdate('email')} disabled={loading || sensitiveData.email === user.email} className="px-6 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-20">Update</button>
                </div>
                <AnimatePresence>{errors.email && <ErrorMsg message={errors.email} />}</AnimatePresence>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Phone Number</label>
                <div className="flex gap-3">
                  <div className="relative group flex-grow">
                    <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errors.phone ? 'text-red-400' : 'text-slate-400'}`} />
                    <input
                      type="tel"
                      value={sensitiveData.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                        setSensitiveData({ ...sensitiveData, phone: val });
                        if (errors.phone) setErrors({ ...errors, phone: null });
                      }}
                      className={`w-full bg-slate-50 border rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-medium outline-none transition-all ${errors.phone ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}
                      placeholder="01XXXXXXXXX"
                    />
                  </div>
                  <button onClick={() => startSecureUpdate('phone')} disabled={loading || sensitiveData.phone === user.phone} className="px-6 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-20">Update</button>
                </div>
                <AnimatePresence>{errors.phone && <ErrorMsg message={errors.phone} />}</AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Security */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8 md:p-12 border-l-4 border-l-amber-400">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Security</h2>
            <p className="text-slate-500 text-sm mb-10">Set or change your account password.</p>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">New Password</label>
                  <div className="relative group">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errors.password ? 'text-red-400' : 'text-slate-400'}`} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={sensitiveData.password}
                      onChange={(e) => {
                        setSensitiveData({ ...sensitiveData, password: e.target.value });
                        if (errors.password) setErrors({ ...errors, password: null });
                      }}
                      className={`w-full bg-slate-50 border rounded-2xl py-4 pl-12 pr-12 text-slate-900 font-medium outline-none transition-all ${errors.password ? 'border-red-200 bg-red-50/30' : 'border-slate-200 focus:border-amber-500'}`}
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <AnimatePresence>{errors.password && <ErrorMsg message={errors.password} />}</AnimatePresence>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Confirm</label>
                  <div className="relative group">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errors.confirmPassword ? 'text-red-400' : 'text-slate-400'}`} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={sensitiveData.confirmPassword}
                      onChange={(e) => {
                        setSensitiveData({ ...sensitiveData, confirmPassword: e.target.value });
                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                      }}
                      className={`w-full bg-slate-50 border rounded-2xl py-4 pl-12 pr-12 text-slate-900 font-medium outline-none transition-all ${errors.confirmPassword ? 'border-red-200 bg-red-50/30' : 'border-slate-200 focus:border-amber-500'}`}
                      placeholder="••••••••"
                    />
                  </div>
                  <AnimatePresence>{errors.confirmPassword && <ErrorMsg message={errors.confirmPassword} />}</AnimatePresence>
                </div>
              </div>
              <button onClick={() => startSecureUpdate('password')} disabled={loading || !sensitiveData.password} className="w-full py-5 bg-amber-500 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20 disabled:opacity-50">
                Update Password
              </button>
            </div>
          </motion.div>
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
