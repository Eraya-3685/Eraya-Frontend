import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldCheck, Mail } from 'lucide-react';

const ActionConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  confirmText = "Proceed & Send OTP",
  icon: Icon = Mail,
  type = "info" 
}) => {
  if (!isOpen) return null;

  const colorClasses = {
    info: "bg-blue-50 text-blue-500",
    warning: "bg-amber-50 text-amber-500",
    danger: "bg-red-50 text-red-500",
    success: "bg-emerald-50 text-emerald-500"
  };

  const btnClasses = {
    info: "bg-slate-900 hover:bg-secondary",
    warning: "bg-amber-500 hover:bg-amber-600",
    danger: "bg-red-500 hover:bg-red-600",
    success: "bg-emerald-500 hover:bg-emerald-600"
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative glass-card-light rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/[0.08]"
      >
        <div className="p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className={`w-16 h-16 ${colorClasses[type]} rounded-3xl flex items-center justify-center mx-auto mb-4 transition-colors`}>
              <Icon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              {description}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl glass-card-light text-slate-300 text-xs font-black uppercase tracking-widest hover:glass-input transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              className={`flex-[1.8] px-6 py-4 rounded-2xl ${btnClasses[type]} text-white text-xs font-black uppercase tracking-widest shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2`}
            >
              <ShieldCheck className="w-4 h-4" /> {confirmText}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ActionConfirmationModal;
