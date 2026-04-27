import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, RefreshCcw, X, Mail } from 'lucide-react';

const maskEmail = (email) => {
  if (!email) return '';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user}***@${domain}`;
  return `${user.substring(0, 2)}***@${domain}`;
};

const OTPModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  email, 
  loading, 
  onResend, 
  title = "Verify Identity",
  description = "A 6-digit verification code has been sent to your email."
}) => {
  const [otp, setOtp] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setOtp('');
    }
  }, [isOpen]);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0 || !onResend) return;
    setResendLoading(true);
    try {
      await onResend();
      setResendCooldown(60);
    } finally {
      setResendLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
      >
        <div className="absolute top-6 right-6">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 pt-12 space-y-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-secondary/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-2 relative">
              <ShieldCheck className="w-10 h-10 text-secondary" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed px-4">{description}</p>
            </div>

            {email && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-black text-slate-600 tracking-wider font-mono">
                  {maskEmail(email)}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="relative group">
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-3xl text-center text-3xl font-black tracking-[0.5em] focus:bg-white focus:border-secondary outline-none transition-all placeholder:text-slate-200"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => onConfirm(otp)}
                disabled={loading || otp.length < 6}
                className="w-full py-5 rounded-3xl bg-secondary text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-secondary/90 shadow-xl shadow-secondary/20 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-3 hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : 'Verify & Proceed'}
              </button>
              
              {onResend && (
                <button 
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resendLoading}
                  className="text-xs font-black text-slate-400 hover:text-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2 py-2"
                >
                  {resendLoading ? (
                    <RefreshCcw className="w-3 h-3 animate-spin" />
                  ) : resendCooldown > 0 ? (
                    `Resend code in ${resendCooldown}s`
                  ) : (
                    "Didn't receive code? Resend"
                  )}
                </button>
              )}
            </div>
          </div>

          <p className="text-[10px] text-center text-slate-400 font-medium italic">
            Secure verification powered by Eraya Shield.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default OTPModal;
