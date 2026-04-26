import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, MapPin, ArrowRight, ShieldCheck, Command, Eye, EyeOff, AlertCircle, Plus, Phone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import SegmentedOTPInput from '../components/SegmentedOTPInput';
import ErrorMsg from '../components/ErrorMsg';
import Logo from '../components/Logo';
import toast from 'react-hot-toast';
import useDocumentTitle from '../hooks/useDocumentTitle';



const Signup = () => {
  useDocumentTitle('Create Account');
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
    address: '',
    avatar: null,
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // 1: Info, 2: OTP
  const [otp, setOtp] = useState('');

  const { signup, verifySignup, loading, user } = useAuthStore();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!form.full_name || form.full_name.trim().length < 3) {
      newErrors.full_name = 'Name must be at least 3 characters';
    }
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!form.password || form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (form.password !== form.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }
    if (!form.phone || !/^(?:\+88|88)?(01[3-9]\d{8})$/.test(form.phone)) {
      newErrors.phone = 'Please enter a valid BD phone number';
    }
    if (!form.address || form.address.trim().length < 5) {
      newErrors.address = 'Please enter a valid delivery address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const formData = new FormData();
    Object.keys(form).forEach(key => {
      if (form[key]) formData.append(key, form[key]);
    });

    try {
      await signup(formData);
      setStep(2); // Move to OTP step
      toast.success('Verification code sent! Please check your email.');
    } catch (error) {
      const serverMsg = error.response?.data?.error || error.response?.data || 'Signup failed';
      const msgLower = serverMsg.toLowerCase();

      if (msgLower.includes('full name') || msgLower.includes('name')) {
        setErrors({ full_name: serverMsg });
      } else if (msgLower.includes('email')) {
        setErrors({ email: serverMsg });
      } else if (msgLower.includes('password')) {
        setErrors({ password: serverMsg });
      } else if (msgLower.includes('phone')) {
        setErrors({ phone: serverMsg });
      } else if (msgLower.includes('address')) {
        setErrors({ address: serverMsg });
      } else {
        toast.error(serverMsg);
      }
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length < 6) {
      toast.error('Please enter 6-digit code');
      return;
    }

    try {
      const role = await verifySignup(user.id, otp);
      toast.success('Account verified successfully!');

      const roleLower = role?.toLowerCase()?.trim();
      if (roleLower === 'admin' || roleLower === 'moderator') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      const serverMsg = error.response?.data?.error || error.response?.data || 'Verification failed';
      toast.error(serverMsg);
    }
  };

return (
  <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center p-4 pt-12 md:pt-20 relative overflow-hidden font-inter">

    {/* Background Accents */}
    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary/5 blur-[120px] rounded-full" />
    <div className="absolute bottom-[-5%] right-[-5%] w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full" />

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-6xl z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
    >
      {/* Left Side: Brand & Welcome */}
      <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 px-4">
        <div className="w-64 h-64 rounded-full bg-white shadow-2xl shadow-slate-200/50 border-8 border-white flex items-center justify-center overflow-hidden group ring-1 ring-slate-200/50">
          <img 
            src="/assets/logo.png" 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
            alt="Eraya Brand" 
          />
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">
            Welcome to <span className="text-secondary">Eraya.</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm">
            Discover a curated collection of premium products designed for your lifestyle. Join us today and start your journey.
          </p>
        </div>

        <div className="hidden lg:flex items-center gap-4 pt-4">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="user" className="w-full h-full object-cover opacity-80" />
              </div>
            ))}
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Trusted by 10k+ users
          </p>
        </div>
      </div>

      {/* Right Side: Form Container */}
      <div className="lg:col-span-7">
        <div className="bg-white p-8 md:p-14 rounded-[45px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)] border border-slate-50 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="signup-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Account</h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                      <span className="w-4 h-[2px] bg-secondary rounded-full" />
                      Fill in your details below
                    </p>
                  </div>

                  {/* Avatar Upload */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-secondary/40 group-hover:bg-white shadow-inner">
                      {avatarPreview ? (
                        <img src={avatarPreview} className="w-full h-full object-cover" alt="Avatar Preview" />
                      ) : (
                        <div className="flex flex-col items-center text-slate-300">
                          <User className="w-8 h-8 mb-0.5" strokeWidth={1.5} />
                          <span className="text-[6px] font-black uppercase">Photo</span>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setForm({ ...form, avatar: file });
                          setAvatarPreview(URL.createObjectURL(file));
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="absolute bottom-0 right-0 w-7 h-7 bg-secondary text-white rounded-full shadow-lg flex items-center justify-center border-2 border-white">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-1.5 group/field">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within/field:text-secondary transition-colors">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within/field:text-secondary transition-colors" />
                        <input
                          type="text"
                          value={form.full_name}
                          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                          className="w-full bg-transparent border-b border-slate-100 py-3 pl-7 text-[14px] font-semibold text-slate-900 outline-none transition-all focus:border-secondary"
                          placeholder="Eraya"
                          required
                        />
                      </div>
                      {errors.full_name && <ErrorMsg message={errors.full_name} />}
                    </div>

                    <div className="space-y-1.5 group/field">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within/field:text-secondary transition-colors">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within/field:text-secondary transition-colors" />
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full bg-transparent border-b border-slate-100 py-3 pl-7 text-[14px] font-semibold text-slate-900 outline-none transition-all focus:border-secondary"
                          placeholder="eraya@gmail.com"
                          required
                        />
                      </div>
                      {errors.email && <ErrorMsg message={errors.email} />}
                    </div>

                    <div className="space-y-1.5 group/field">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within/field:text-secondary transition-colors">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within/field:text-secondary transition-colors" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          autoComplete="new-password"
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          className="w-full bg-transparent border-b border-slate-100 py-2.5 pl-7 pr-8 text-[13px] font-semibold text-slate-900 outline-none transition-all focus:border-secondary"
                          placeholder="••••••••"
                          required
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-300 hover:text-secondary">
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {errors.password && <ErrorMsg message={errors.password} />}
                    </div>

                    <div className="space-y-1.5 group/field">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within/field:text-secondary transition-colors">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within/field:text-secondary transition-colors" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={form.confirm_password}
                          onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                          className="w-full bg-transparent border-b border-slate-100 py-2.5 pl-7 text-[13px] font-semibold text-slate-900 outline-none transition-all focus:border-secondary"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                      {errors.confirm_password && <ErrorMsg message={errors.confirm_password} />}
                    </div>

                    <div className="space-y-1.5 group/field">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within/field:text-secondary transition-colors">Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within/field:text-secondary transition-colors" />
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="w-full bg-transparent border-b border-slate-100 py-2.5 pl-7 text-[13px] font-semibold text-slate-900 outline-none transition-all focus:border-secondary"
                          placeholder="01XXXXXXXXX"
                          required
                        />
                      </div>
                      {errors.phone && <ErrorMsg message={errors.phone} />}
                    </div>

                    <div className="space-y-1.5 group/field">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within/field:text-secondary transition-colors">Address (City, Area, Road)</label>
                      <div className="relative">
                        <MapPin className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within/field:text-secondary transition-colors" />
                        <input
                          value={form.address}
                          onChange={(e) => setForm({ ...form, address: e.target.value })}
                          className="w-full bg-transparent border-b border-slate-100 py-2.5 pl-7 text-[13px] font-semibold text-slate-900 outline-none transition-all focus:border-secondary"
                          placeholder="e.g. Rupatoli, Barishal"
                          required
                        />
                      </div>
                      {errors.address && <ErrorMsg message={errors.address} />}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6">
                    <p className="text-slate-400 text-[13px] font-bold">
                      Already joined? <Link to="/login" className="text-secondary hover:underline ml-1">Sign in</Link>
                    </p>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full md:w-[200px] py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-secondary transition-all shadow-xl active:scale-95 disabled:opacity-50"
                    >
                      {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Create Account <ArrowRight className="w-3.5 h-3.5" /></>}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 bg-secondary/5 rounded-[24px] flex items-center justify-center mx-auto mb-6 border border-secondary/10">
                  <Mail className="w-8 h-8 text-secondary" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Verify Email</h2>
                <p className="text-slate-500 text-xs mt-2 mb-10 leading-relaxed">
                  A 6-digit verification code has been sent to <span className="font-bold text-slate-900 underline decoration-slate-200">{form.email}</span>. 
                  Please enter it below to complete your registration.
                </p>

                <form onSubmit={handleVerifyOTP} className="space-y-8 max-w-[400px] mx-auto">
                  <SegmentedOTPInput
                    value={otp}
                    onChange={setOtp}
                    disabled={loading}
                  />

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full py-4 bg-secondary text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-secondary/90 transition-all shadow-xl disabled:opacity-50"
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Verify & Complete <ShieldCheck className="w-4 h-4" /></>}
                  </button>
                </form>

                <button onClick={() => toast.error('Resending...')} className="mt-8 text-secondary text-[10px] font-black uppercase tracking-widest hover:underline">
                  Resend Code
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>

    <div className="mt-12 text-slate-300 font-black text-[8px] uppercase tracking-[0.5em] flex items-center gap-2 opacity-50">
      <ShieldCheck className="w-3 h-3" /> Secure Eraya Portal
    </div>
  </div>
);
};

export default Signup;
