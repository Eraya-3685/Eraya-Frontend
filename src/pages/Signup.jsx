import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, MapPin, ArrowRight, ShieldCheck, Command, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import useDocumentTitle from '../hooks/useDocumentTitle';

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

const Signup = () => {
  useDocumentTitle('Create Account');
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    address: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { signup, loading } = useAuthStore();
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
    if (!form.address || form.address.trim().length < 5) {
      newErrors.address = 'Please enter a valid delivery address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await signup(form);
      toast.success('Account created successfully!');
      navigate('/login');
    } catch (error) {
      const serverMsg = error.response?.data || 'Signup failed';
      if (serverMsg.includes('email')) {
        setErrors({ email: 'Email already registered' });
      } else {
        toast.error(serverMsg);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      
      {/* Background Accents */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-secondary/5 blur-[100px] -translate-y-1/2 -translate-x-1/2 rounded-full" />

      {/* Brand */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8 flex flex-col items-center gap-2 z-10"
      >
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100 p-2">
          <img src="/assets/logo.png" className="w-full h-full object-contain" alt="Eraya Logo" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">ERAYA</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg z-10"
      >
        <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Create an account</h2>
          <p className="text-slate-500 text-sm mb-8">Join thousands of shoppers for a premium experience.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative group">
                  <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errors.full_name ? 'text-red-400' : 'text-slate-400 group-focus-within:text-secondary'}`} />
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => {
                      setForm({ ...form, full_name: e.target.value });
                      if (errors.full_name) setErrors({...errors, full_name: null});
                    }}
                    className={`w-full bg-slate-50 border rounded-xl py-3.5 pl-12 pr-4 text-slate-900 font-medium outline-none transition-all ${errors.full_name ? 'border-red-200 bg-red-50/30' : 'border-slate-200 focus:border-secondary focus:bg-white'}`}
                    placeholder="John Doe"
                  />
                </div>
                <AnimatePresence>
                  {errors.full_name && <ErrorMsg message={errors.full_name} />}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errors.email ? 'text-red-400' : 'text-slate-400 group-focus-within:text-secondary'}`} />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => {
                      setForm({ ...form, email: e.target.value });
                      if (errors.email) setErrors({...errors, email: null});
                    }}
                    className={`w-full bg-slate-50 border rounded-xl py-3.5 pl-12 pr-4 text-slate-900 font-medium outline-none transition-all ${errors.email ? 'border-red-200 bg-red-50/30' : 'border-slate-200 focus:border-secondary focus:bg-white'}`}
                    placeholder="john@example.com"
                  />
                </div>
                <AnimatePresence>
                  {errors.email && <ErrorMsg message={errors.email} />}
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errors.password ? 'text-red-400' : 'text-slate-400 group-focus-within:text-secondary'}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => {
                    setForm({ ...form, password: e.target.value });
                    if (errors.password) setErrors({...errors, password: null});
                  }}
                  className={`w-full bg-slate-50 border rounded-xl py-3.5 pl-12 pr-12 text-slate-900 font-medium outline-none transition-all ${errors.password ? 'border-red-200 bg-red-50/30' : 'border-slate-200 focus:border-secondary focus:bg-white'}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <AnimatePresence>
                {errors.password && <ErrorMsg message={errors.password} />}
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Delivery Address</label>
              <div className="relative group">
                <MapPin className={`absolute left-4 top-4 w-5 h-5 transition-colors ${errors.address ? 'text-red-400' : 'text-slate-400 group-focus-within:text-secondary'}`} />
                <textarea
                  value={form.address}
                  onChange={(e) => {
                    setForm({ ...form, address: e.target.value });
                    if (errors.address) setErrors({...errors, address: null});
                  }}
                  rows="2"
                  className={`w-full bg-slate-50 border rounded-xl py-3.5 pl-12 pr-4 text-slate-900 font-medium outline-none transition-all ${errors.address ? 'border-red-200 bg-red-50/30' : 'border-slate-200 focus:border-secondary focus:bg-white'}`}
                  placeholder="Street, City, Postcode"
                />
              </div>
              <AnimatePresence>
                {errors.address && <ErrorMsg message={errors.address} />}
              </AnimatePresence>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><ShieldCheck className="w-5 h-5" /></motion.div>
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-slate-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-secondary font-bold hover:underline transition-colors">Sign in</Link>
          </div>
        </div>
      </motion.div>

      <div className="mt-12 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
        <ShieldCheck className="w-4 h-4" /> Secure Onboarding System
      </div>
    </div>
  );
};

export default Signup;
