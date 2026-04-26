import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, UserCog, Mail, Phone, Calendar, Shield, ShieldCheck, 
  User, RefreshCcw, AlertCircle, ChevronDown, Check, X, 
  CheckCircle2, Lock, ArrowRight, ShieldAlert, Settings
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { getImageUrl } from '../api/axios';
import toast from 'react-hot-toast';

/* ── Secure Confirmation & OTP Modal ─────────────────── */
const SecureRoleModal = ({ isOpen, onClose, onConfirm, targetRole, targetIds, initialPermissions, loading }) => {
  const [step, setStep] = useState(1); // 1: Confirm, 2: OTP
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [permissions, setPermissions] = useState(initialPermissions || []); // Default empty to force selection

  useEffect(() => {
    if (isOpen && initialPermissions) {
      setPermissions(initialPermissions);
    }
  }, [isOpen, initialPermissions]);
  const { requestOTP, user: currentUser } = useAuthStore();
  const [requestingOTP, setRequestingOTP] = useState(false);
  const [resending, setResending] = useState(false);

  const availableModules = [
    { id: 'dashboard', label: 'Dashboard', desc: 'View revenue and stats' },
    { id: 'products', label: 'Products', desc: 'Manage inventory & prices' },
    { id: 'categories', label: 'Categories', desc: 'Organize catalog' },
    { id: 'orders', label: 'Orders', desc: 'Process customer orders' },
    { id: 'users', label: 'Users', desc: 'View user list' },
  ];

  const togglePermission = (id) => {
    setPermissions(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const selectedCount = targetIds?.length || 0;
  const needsSecurity = true; // Always require security for all role changes

  const handleResendOTP = async () => {
    setResending(true);
    try {
      await requestOTP('role_change');
      toast.success('New security code sent!');
    } catch (err) {
      toast.error('Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  const handleNext = async () => {
    if (needsSecurity && step === 1) {
      setRequestingOTP(true);
      try {
        await requestOTP('role_change');
        toast.success('Security code sent to your email');
        setStep(2);
      } catch (err) {
        toast.error('Failed to send security code');
      } finally {
        setRequestingOTP(false);
      }
    } else {
      onConfirm(otp, targetIds, password, permissions);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setOtp('');
    setPassword('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${needsSecurity ? 'bg-red-50' : 'bg-primary/10'}`}>
              {needsSecurity ? <ShieldAlert className="w-7 h-7 text-red-500" /> : <ShieldCheck className="w-7 h-7 text-primary" />}
            </div>
            <button onClick={resetAndClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                  Confirm Role Change
                </h2>
                <p className="text-slate-500 font-medium leading-relaxed">
                  You are about to change the role of <span className="text-slate-900 font-bold">{selectedCount} user(s)</span> to 
                  <span className={`mx-1.5 px-2 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider ${
                    targetRole === 'admin' ? 'bg-red-50 text-red-600' : 
                    targetRole === 'moderator' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {targetRole}
                  </span>
                </p>

                {needsSecurity && (
                  <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                    <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 font-medium leading-relaxed">
                      This action requires security verification via <span className="font-bold underline decoration-amber-200">{currentUser?.email}</span>
                    </p>
                  </div>
                )}

                {targetRole === 'moderator' && (
                  <div className="mt-6">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">
                      Module Permissions
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableModules.map((module) => (
                        <button
                          key={module.id}
                          type="button"
                          onClick={() => togglePermission(module.id)}
                          className={`flex items-center gap-2.5 p-2.5 rounded-2xl border-2 transition-all ${
                            permissions.includes(module.id)
                              ? 'bg-amber-50 border-amber-200'
                              : 'bg-slate-50/50 border-slate-100 opacity-60 grayscale'
                          }`}
                        >
                          <div className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                            permissions.includes(module.id) ? 'bg-amber-500 shadow-lg shadow-amber-200' : 'bg-slate-200'
                          }`}>
                            {permissions.includes(module.id) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex flex-col items-start min-w-0">
                            <span className={`text-[10px] font-black uppercase tracking-wider truncate w-full ${permissions.includes(module.id) ? 'text-amber-700' : 'text-slate-600'}`}>
                              {module.label}
                            </span>
                            <span className="text-[8px] font-bold text-slate-400 truncate w-full">
                              {module.desc}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {permissions.length === 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100 flex gap-3"
                      >
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-800 font-bold leading-relaxed">
                          Please select at least one module permission to promote this user to Moderator.
                        </p>
                      </motion.div>
                    )}

                    {permissions.length === availableModules.length && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-100 flex gap-3"
                      >
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-800 font-bold leading-relaxed">
                          Note: You are granting full access to all modules. It is highly recommended to promote this user to a full <span className="underline decoration-red-200 uppercase tracking-wider">Admin</span> role instead.
                        </p>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                  Verify Action
                </h2>
                <p className="text-slate-500 font-medium mb-6 leading-relaxed">
                  A 6-digit security code has been sent to <span className="text-slate-900 font-bold underline decoration-slate-200">{currentUser?.email}</span>. 
                  Authorize this action with the code and your admin password.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 ml-1">Security Code</label>
                    <input
                      type="text"
                      name="otp"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="0 0 0 0 0 0"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 text-center text-2xl font-black tracking-[0.4em] text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 ml-1">Your Admin Password</label>
                    <input
                      type="password"
                      name="admin-password"
                      autoComplete="off"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-5 text-sm font-bold text-slate-900 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resending}
                  className="mt-6 text-sm font-bold text-primary hover:underline w-full text-center disabled:opacity-50"
                >
                  {resending ? 'Sending...' : "Didn't get the code? Resend"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
          <button
            onClick={resetAndClose}
            className="flex-1 px-6 py-4 rounded-2xl text-sm font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleNext}
            disabled={loading || requestingOTP || (step === 2 && (otp.length < 6 || !password)) || (targetRole === 'moderator' && permissions.length === 0)}
            className="flex-1 px-6 py-4 rounded-2xl text-sm font-bold text-white bg-slate-900 hover:bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading || requestingOTP ? (
              <RefreshCcw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {step === 1 ? (needsSecurity ? 'Next' : 'Confirm') : 'Verify & Update'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ── Individual Role Selector Component ──────────────── */
const RoleSelector = ({ currentRole, onRoleChange, isUpdating }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  const roles = [
    { value: 'admin', label: 'Admin', icon: ShieldCheck, color: 'text-red-500', bg: 'bg-red-50' },
    { value: 'moderator', label: 'Moderator', icon: Shield, color: 'text-amber-500', bg: 'bg-amber-50' },
    { value: 'buyer', label: 'Buyer', icon: User, color: 'text-emerald-500', bg: 'bg-emerald-50' }
  ];

  const activeRole = roles.find(r => r.value === currentRole) || roles[2];

  const updateCoords = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideTrigger = dropdownRef.current && !dropdownRef.current.contains(event.target);
      const isOutsideMenu = menuRef.current && !menuRef.current.contains(event.target);
      
      if (isOutsideTrigger && isOutsideMenu) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !isUpdating && setIsOpen(!isOpen)}
        disabled={isUpdating}
        className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 ${
          isOpen 
            ? 'bg-white border-primary shadow-lg shadow-primary/5 ring-4 ring-primary/5' 
            : 'bg-slate-50/50 border-slate-100 hover:border-slate-200 hover:bg-white'
        } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${activeRole.bg}`}>
            <activeRole.icon className={`w-3.5 h-3.5 ${activeRole.color}`} />
          </div>
          <span className="text-xs font-bold text-slate-700">{activeRole.label}</span>
        </div>
        {isUpdating ? (
          <RefreshCcw className="w-4 h-4 text-primary animate-spin" />
        ) : (
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </motion.div>
        )}
      </button>

      {isOpen && createPortal(
        <div 
          className="fixed z-[9999]" 
          style={{ 
            top: coords.top, 
            left: coords.left, 
            width: coords.width 
          }}
        >
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-slate-200/50 p-1.5 overflow-hidden"
          >
            {roles.map((role) => (
              <button
                key={role.value}
                onClick={() => {
                  // For moderators, always allow clicking to update permissions
                  if (role.value !== currentRole || role.value === 'moderator') {
                    onRoleChange(role.value);
                  }
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  currentRole === role.value 
                    ? 'bg-primary/5 text-primary' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${role.bg}`}>
                    <role.icon className={`w-4 h-4 ${role.color}`} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold">{role.label}</p>
                    <p className="text-[10px] opacity-60 font-medium">Set as {role.label}</p>
                  </div>
                </div>
                {currentRole === role.value && (
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
};

/* ── Main AdminUsers Page ────────────────────────────── */
const AdminUsers = () => {
  const { listUsers, updateUserRole, bulkUpdateUserRole } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Bulk / Modal state
  const [modalConfig, setModalConfig] = useState({ isOpen: false, targetIds: [], targetRole: null, initialPermissions: [] });
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (userId, newRole) => {
    const targetUser = users.find(u => u.id === userId);
    setModalConfig({
      isOpen: true,
      targetIds: [userId],
      targetRole: newRole,
      initialPermissions: (targetUser?.role === newRole && targetUser.permissions) 
        ? targetUser.permissions 
        : []
    });
  };

  const executeUpdate = async (otp, targetIds, password, permissions) => {
    setBulkLoading(true);
    const role = modalConfig.targetRole;
    try {
      await bulkUpdateUserRole(targetIds, role, permissions, otp, password);
      setUsers(users.map(u => targetIds.includes(u.id) ? { ...u, role: role, permissions: permissions } : u));
      toast.success(`Updated ${targetIds.length} user(s) to ${role}`);
      
      // Clear selections if we updated the selected ones
      setSelectedIds(prev => prev.filter(id => !targetIds.includes(id)));
      setModalConfig({ isOpen: false, targetIds: [], targetRole: null });
    } catch (err) {
      toast.error(err.response?.data || 'Update failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const filteredUsers = useMemo(() => 
    users.filter(u => 
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    ), [users, search]
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredUsers.map(u => u.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const RoleBadge = ({ user }) => {
    const role = user.role;
    const configs = {
      admin: { bg: 'bg-red-500/10', text: 'text-red-500', icon: ShieldCheck, label: 'Admin' },
      moderator: { bg: 'bg-amber-500/10', text: 'text-amber-500', icon: Shield, label: 'Moderator' },
      buyer: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', icon: User, label: 'Buyer' }
    };
    const config = configs[role] || configs.buyer;
    const Icon = config.icon;

    return (
      <div className="flex items-center gap-2">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${config.bg} ${config.text} text-[10px] font-bold uppercase tracking-wider border border-current/10`}>
          <Icon className="w-3 h-3" />
          {config.label}
        </div>
        
        {role === 'moderator' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRoleChange(user.id, 'moderator');
            }}
            className="p-1.5 bg-slate-100 text-slate-400 hover:bg-amber-100 hover:text-amber-600 rounded-lg transition-all"
            title="Edit Permissions"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen pb-40">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserCog className="w-6 h-6 text-primary" />
            User Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Configure roles and permissions across Eraya.</p>
        </div>

        <div className="relative group max-w-xs w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 w-12 text-center">
                  <input 
                    type="checkbox"
                    checked={filteredUsers.length > 0 && selectedIds.length === filteredUsers.length}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 rounded-lg border-2 border-slate-200 text-primary focus:ring-4 focus:ring-primary/5 cursor-pointer transition-all"
                  />
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Profile</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Role</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode='popLayout'>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-5" colSpan={5}>
                        <div className="h-10 bg-slate-50 rounded-xl w-full" />
                      </td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center">
                          <AlertCircle className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">No users found</h3>
                        <p className="text-slate-400 font-medium">Try checking your spelling or clearing filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={u.id} 
                      className={`hover:bg-slate-50/80 transition-all duration-300 group ${selectedIds.includes(u.id) ? 'bg-primary/5' : ''}`}
                    >
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="checkbox"
                          checked={selectedIds.includes(u.id)}
                          onChange={() => toggleSelect(u.id)}
                          className="w-4 h-4 rounded-lg border-2 border-slate-200 text-primary focus:ring-4 focus:ring-primary/5 cursor-pointer transition-all"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border-2 border-white shadow-lg group-hover:scale-105 transition-transform duration-500">
                            {u.avatar_url ? (
                              <img src={getImageUrl(u.avatar_url)} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black text-xl">
                                {u.full_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 tracking-tight">{u.full_name}</p>
                            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1 opacity-60">
                              <Calendar className="w-3 h-3" />
                              Joined {new Date(u.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 text-[12px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                            <Mail className="w-3.5 h-3.5 text-slate-300" />
                            {u.email}
                          </div>
                          {u.phone && (
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
                              <Phone className="w-3 h-3 text-slate-200" />
                              {u.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <RoleBadge user={u} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-32 translate-x-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                          <RoleSelector 
                            currentRole={u.role}
                            onRoleChange={(newRole) => handleRoleChange(u.id, newRole)}
                            isUpdating={updatingId === u.id}
                          />
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 100, opacity: 0, x: '-50%' }}
            className="fixed bottom-6 left-1/2 bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] z-[999] flex items-center gap-8 border border-white/10 backdrop-blur-xl"
          >
            <div className="flex items-center gap-4 pr-8 border-r border-white/10">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-black text-base animate-pulse">
                {selectedIds.length}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Selected</p>
                <p className="text-sm font-bold text-white">Users to modify</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {['admin', 'moderator', 'buyer'].map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    setModalConfig({
                      isOpen: true,
                      targetIds: selectedIds,
                      targetRole: role,
                      initialPermissions: []
                    });
                  }}
                  className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                    role === 'admin' ? 'bg-red-500 hover:bg-red-600' :
                    role === 'moderator' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'
                  }`}
                >
                  Make {role}
                </button>
              ))}
              <div className="w-px h-8 bg-white/10 mx-2" />
              <button
                onClick={() => setSelectedIds([])}
                className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalConfig.isOpen && (
          <SecureRoleModal
            isOpen={modalConfig.isOpen}
            onClose={() => setModalConfig({ isOpen: false, targetIds: [], targetRole: null, initialPermissions: [] })}
            onConfirm={executeUpdate}
            targetRole={modalConfig.targetRole}
            targetIds={modalConfig.targetIds}
            initialPermissions={modalConfig.initialPermissions}
            loading={bulkLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;
