import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, MapPin, ArrowRight, ShieldCheck, Command } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import ErrorMsg from '../components/ErrorMsg';
import toast from 'react-hot-toast';

const CompleteProfile = () => {
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const { user, loading, updateProfile } = useAuthStore();
  const navigate = useNavigate();

  const [errors, setErrors] = useState({});

  // If user is already complete or not logged in, redirect away
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.phone && user.address) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!/^\d{11}$/.test(phone)) {
      newErrors.phone = 'Phone must be exactly 11 digits';
    }
    if (!address || address.trim().length < 5) {
      newErrors.address = 'Please enter a valid address';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await updateProfile({ 
        full_name: user.full_name, 
        phone, 
        address 
      });
      toast.success('Profile completed successfully');
      navigate('/');
    } catch (error) {
      const serverMsg = error.response?.data?.error || error.response?.data || 'Update failed';
      const msgLower = serverMsg.toLowerCase();
      
      if (msgLower.includes('phone')) {
        setErrors({ phone: serverMsg });
      } else if (msgLower.includes('address')) {
        setErrors({ address: serverMsg });
      } else {
        toast.error(serverMsg);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/5 blur-[100px] -translate-y-1/2 translate-x-1/2 rounded-full" />
      
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8 flex flex-col items-center gap-2 z-10"
      >
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-xl shadow-slate-200/50 border border-[#eaeef2] p-2 text-secondary">
          <Command className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0d1117]">ERAYA</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-white p-8 md:p-10 rounded-3xl border border-[#eaeef2] shadow-xl shadow-slate-200/50">
          <h2 className="text-2xl font-bold text-[#0d1117] mb-2">Almost there!</h2>
          <p className="text-[#94a3b8] text-sm mb-8">We just need a few more details to complete your registration.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#4b5563] uppercase tracking-widest ml-1">Phone Number</label>
              <div className="relative group">
                <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errors.phone ? 'text-red-400' : 'text-[#64748b] group-focus-within:text-secondary'}`} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                    setPhone(val);
                    if (errors.phone) setErrors({...errors, phone: null});
                  }}
                  className={`w-full bg-white border rounded-xl py-3.5 pl-12 pr-4 text-[#0d1117] font-medium outline-none transition-all ${errors.phone ? 'border-red-200 bg-red-50/30' : 'border-[#eaeef2] focus:border-indigo-500 focus:bg-white'}`}
                  placeholder="01XXXXXXXXX"
                />
              </div>
              {errors.phone && <ErrorMsg message={errors.phone} />}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#4b5563] uppercase tracking-widest ml-1">Delivery Address</label>
              <div className="relative group">
                <MapPin className={`absolute left-4 top-4 w-5 h-5 transition-colors ${errors.address ? 'text-red-400' : 'text-[#64748b] group-focus-within:text-secondary'}`} />
                <textarea
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address) setErrors({...errors, address: null});
                  }}
                  rows="3"
                  className={`w-full bg-white border rounded-xl py-3.5 pl-12 pr-4 text-[#0d1117] font-medium outline-none transition-all resize-none ${errors.address ? 'border-red-200 bg-red-50/30' : 'border-[#eaeef2] focus:border-indigo-500 focus:bg-white'}`}
                  placeholder="e.g. Rupatoli, Barishal"
                />
              </div>
              {errors.address && <ErrorMsg message={errors.address} />}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-secondary text-[#0d1117] rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-secondary/90 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {loading ? <div className="w-5 h-5 border-2 border-[#eaeef2] border-t-white rounded-full animate-spin" /> : (
                <>
                  Complete Registration
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
      
      <div className="absolute bottom-8 flex items-center gap-2 text-[#64748b] font-bold text-[10px] uppercase tracking-widest">
        <ShieldCheck className="w-4 h-4" />
        Secure SSL Encryption
      </div>
    </div>
  );
};

export default CompleteProfile;
