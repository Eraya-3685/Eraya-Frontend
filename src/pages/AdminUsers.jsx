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
import OTPModal from '../components/OTPModal';

/* ── Secure Confirmation & OTP Modal ─────────────────── */
const SecureRoleModal = ({ isOpen, onClose, onConfirm, targetRole, targetIds, initialPermissions, loading }) => {
  const [step, setStep] = useState(1); // 1: Info/Permissions, 2: OTP, 3: Password
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [permissions, setPermissions] = useState(initialPermissions || []);
  const { requestOTP, user: currentUser } = useAuthStore();
  const [requestingOTP, setRequestingOTP] = useState(false);

  useEffect(() => {
    if (isOpen && initialPermissions) setPermissions(initialPermissions);
  }, [isOpen, initialPermissions]);

  const availableModules = [
    { id: 'dashboard', label: 'Dashboard', desc: 'View revenue and stats' },
    { id: 'chat', label: 'Messages', desc: 'Real-time customer support' },
    { id: 'products', label: 'Products', desc: 'Manage inventory & prices' },
    { id: 'categories', label: 'Categories', desc: 'Organize catalog' },
    { id: 'users', label: 'Users', desc: 'Manage user list' },
    { id: 'orders', label: 'Orders', desc: 'Process customer orders' },
    { id: 'reviews', label: 'Product Reviews', desc: 'Manage customer reviews' },
    { id: 'profile', label: 'My Profile', desc: 'View/edit own profile' },
    { id: 'settings', label: 'Store Settings', desc: 'System & store settings' },
  ];

  const togglePermission = (id) => {
    setPermissions(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleNextToOTP = async () => {
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
  };

  const handleOTPSubmit = (otpVal) => {
    setOtp(otpVal);
    setStep(3);
  };

  const resetAndClose = () => {
    setStep(1);
    setOtp('');
    setPassword('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        {step !== 2 && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-[#0d1117]/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-[#eaeef2]"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                    <ShieldAlert className="w-7 h-7 text-red-500" />
                  </div>
                  <button onClick={resetAndClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <X className="w-5 h-5 text-[#64748b]" />
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {step === 1 ? (
                    <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h2 className="text-2xl font-black text-[#0d1117] tracking-tight mb-2">Confirm Role Change</h2>
                      <p className="text-[#94a3b8] font-medium leading-relaxed">
                        Changing <span className="text-[#0d1117] font-bold">{targetIds?.length} user(s)</span> to
                        <span className="mx-1.5 px-2 py-0.5 rounded-lg text-xs font-black bg-emerald-50 text-emerald-600 uppercase tracking-wider">{targetRole}</span>
                      </p>

                      {targetRole === 'moderator' && (
                        <div className="mt-6">
                          <label className="block text-xs font-black text-[#64748b] uppercase tracking-widest mb-4 ml-1">Module Permissions</label>
                          <div className="grid grid-cols-2 gap-2">
                            {availableModules.map((module) => (
                              <button
                                key={module.id}
                                onClick={() => togglePermission(module.id)}
                                className={`flex items-center gap-2.5 p-2.5 rounded-2xl border-2 transition-all ${permissions.includes(module.id) ? 'bg-amber-50 border-amber-200' : 'bg-white border-[#eaeef2] opacity-60'
                                  }`}
                              >
                                <div className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center ${permissions.includes(module.id) ? 'bg-amber-500' : 'bg-slate-200'}`}>
                                  {permissions.includes(module.id) && <Check className="w-3 h-3 text-[#0d1117]" />}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-wider truncate">{module.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h2 className="text-2xl font-black text-[#0d1117] tracking-tight mb-2">Final Confirmation</h2>
                      <p className="text-[#94a3b8] font-medium mb-6 leading-relaxed">Security code verified. Please enter your admin password to complete the update.</p>
                      <div className="space-y-4">
                        <label className="block text-xs font-bold text-[#64748b] mb-2 ml-1 text-left uppercase tracking-widest">Admin Password</label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b] group-focus-within:text-primary transition-colors" />
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-white border-2 border-[#eaeef2] rounded-2xl py-3.5 pl-11 pr-5 text-sm font-bold text-[#0d1117] outline-none focus:border-primary transition-all"
                            autoComplete="new-password"
                            autoFocus
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-8/50 border-t border-[#eaeef2] flex gap-4">
                <button onClick={resetAndClose} className="flex-1 px-6 py-4 rounded-2xl text-sm font-bold text-[#64748b] hover:text-[#64748b] transition-all">Cancel</button>
                <button
                  onClick={step === 1 ? handleNextToOTP : () => onConfirm(otp, targetIds, password, permissions)}
                  disabled={requestingOTP || (step === 3 && !password) || (targetRole === 'moderator' && permissions.length === 0)}
                  className="flex-[1.5] px-6 py-4 rounded-2xl text-sm font-bold text-[#0d1117] bg-[#0d1117] hover:bg-primary transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {requestingOTP ? <RefreshCcw className="w-4 h-4 animate-spin" /> : (step === 1 ? 'Send Security Code' : 'Confirm & Update')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <OTPModal
        isOpen={step === 2}
        onClose={() => setStep(1)}
        onConfirm={handleOTPSubmit}
        onResend={handleNextToOTP}
        email={currentUser?.email}
        loading={false}
        title="Security Verification"
        description="We've sent a security code to your email. Please enter it below to proceed."
      />
    </>
  );
};

/* ── User Profile Detail Modal ───────────────────────── */
const UserProfileModal = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

  const DetailRow = ({ icon: Icon, label, value, color = "indigo" }) => (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#eaeef2] hover:border-indigo-100 transition-all group">
      <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 text-${color}-500`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-[#64748b] uppercase tracking-widest leading-none mb-1.5">{label}</p>
        <p className="text-sm font-bold text-[#0d1117] truncate">{value || 'Not provided'}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-[#0d1117]/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden border border-[#eaeef2] relative"
      >
        <button onClick={onClose} className="absolute right-6 top-6 p-2 hover:bg-slate-100 rounded-2xl transition-colors z-10">
          <X className="w-5 h-5 text-[#64748b]" />
        </button>

        <div className="h-32 bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
           <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_50%,_rgba(99,102,241,0.5),transparent_50%)]" />
        </div>

        <div className="px-8 pb-10">
          <div className="relative -mt-16 mb-6 flex flex-col items-center">
            <div className="w-32 h-32 rounded-[40px] border-8 border-white bg-white shadow-xl overflow-hidden mb-4">
              {user.avatar_url ? (
                <img src={getImageUrl(user.avatar_url)} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-500 font-black text-4xl">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h2 className="text-2xl font-black text-[#0d1117] tracking-tight">{user.full_name}</h2>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
              <CheckCircle2 className="w-3 h-3" />
              {user.role}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <DetailRow icon={Mail} label="Email Address" value={user.email} color="indigo" />
            <DetailRow icon={Phone} label="Phone Number" value={user.phone} color="emerald" />
            <DetailRow icon={Calendar} label="Member Since" value={new Date(user.created_at).toLocaleDateString()} color="amber" />
            <DetailRow icon={User} label="User ID" value={`#${user.id}`} color="rose" />
          </div>

          <div className="p-5 rounded-3xl bg-[#0d1117] text-[#0d1117] shadow-xl">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white rounded-xl">
                   <Lock className="w-4 h-4 text-[#6366f1]" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">Address Information</span>
             </div>
             <p className="text-sm font-medium text-[#64748b] leading-relaxed italic">
                "{user.address || 'No address provided in profile settings.'}"
             </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

import AdminDropdown from '../components/AdminDropdown';

/* ── Main AdminUsers Page ────────────────────────────── */
const AdminUsers = () => {
  const { listUsers, updateUserRole, bulkUpdateUserRole } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const [selectedUser, setSelectedUser] = useState(null);
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
            className="p-1.5 bg-slate-100 text-[#64748b] hover:bg-amber-100 hover:text-amber-600 rounded-lg transition-all"
            title="Edit Permissions"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  const roleOptions = [
    { value: 'admin', label: 'Admin', icon: ShieldCheck, color: 'red' },
    { value: 'moderator', label: 'Moderator', icon: Shield, color: 'amber' },
    { value: 'buyer', label: 'Buyer', icon: User, color: 'emerald' }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen pb-40">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-2xl font-black text-[#0d1117] tracking-tight flex items-center gap-2.5">
            <UserCog className="w-6 h-6 text-primary" />
            User Management
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5 font-medium">Configure roles and permissions across Eraya.</p>
        </div>

        <div className="relative group max-w-xs w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b] group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-white border border-[#eaeef2] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#0d1117] outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-[#eaeef2] shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-[#eaeef2]">
                <th className="px-6 py-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={filteredUsers.length > 0 && selectedIds.length === filteredUsers.length}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 rounded-lg border-2 border-[#eaeef2] text-primary focus:ring-4 focus:ring-primary/5 cursor-pointer transition-all"
                  />
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-[#64748b] uppercase tracking-[0.2em]">Profile</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#64748b] uppercase tracking-[0.2em]">Contact</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#64748b] uppercase tracking-[0.2em]">Role</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#64748b] uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode='popLayout'>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-5" colSpan={5}>
                        <div className="h-10 bg-white rounded-xl w-full" />
                      </td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center">
                          <AlertCircle className="w-10 h-10 text-[#4b5563]" />
                        </div>
                        <h3 className="text-xl font-bold text-[#0d1117]">No users found</h3>
                        <p className="text-[#64748b] font-medium">Try checking your spelling or clearing filters.</p>
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
                      className={`hover:bg-white transition-all duration-300 group ${selectedIds.includes(u.id) ? 'bg-primary/5' : ''}`}
                    >
                      <td className="px-6 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(u.id)}
                          onChange={() => toggleSelect(u.id)}
                          className="w-3.5 h-3.5 rounded-lg border-2 border-[#eaeef2] text-primary focus:ring-4 focus:ring-primary/5 cursor-pointer transition-all"
                        />
                      </td>
                      <td className="px-6 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-500">
                            {u.avatar_url ? (
                              <img src={getImageUrl(u.avatar_url)} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black text-sm">
                                {u.full_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-[#0d1117] text-[13px] tracking-tight leading-tight">{u.full_name}</p>
                            <div className="flex items-center gap-1 text-[8px] text-[#64748b] font-black uppercase tracking-widest mt-0.5 opacity-60">
                              <Calendar className="w-2.5 h-2.5" />
                              Joined {new Date(u.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-2.5">
                        <div className="space-y-0">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748b] group-hover:text-[#0d1117] transition-colors">
                            <Mail className="w-3 h-3 text-[#64748b]" />
                            {u.email}
                          </div>
                          {u.phone && (
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#64748b] group-hover:text-[#64748b] transition-colors">
                              <Phone className="w-2.5 h-2.5 text-[#4b5563]" />
                              {u.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-2.5">
                        <RoleBadge user={u} />
                      </td>
                      <td className="px-6 py-2.5">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="p-2 bg-white text-[#64748b] hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all"
                            title="View Profile"
                          >
                            <RefreshCcw className="w-3.5 h-3.5" /> 
                          </button>
                          <div className="w-32 opacity-60 group-hover:opacity-100 transition-all duration-300 scale-90 origin-left">
                            <AdminDropdown
                              value={u.role}
                              options={roleOptions}
                              disabled={updatingId === u.id}
                              onChange={(opt) => handleRoleChange(u.id, opt.value)}
                              renderValue={(val) => {
                                const role = roleOptions.find(r => r.value === val) || roleOptions[2];
                                return (
                                  <div className="flex items-center gap-2">
                                    <role.icon className={`w-3 h-3 text-${role.color}-500`} />
                                    <span>{role.label}</span>
                                  </div>
                                );
                              }}
                              renderOption={(role, isSelected) => (
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-6 h-6 rounded-lg bg-${role.color}-50 flex items-center justify-center`}>
                                      <role.icon className={`w-3 h-3 text-${role.color}-500`} />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? `text-${role.color}-600` : 'text-[#64748b]'}`}>{role.label}</span>
                                  </div>
                                  {isSelected && <Check className={`w-3.5 h-3.5 text-${role.color}-500`} />}
                                </div>
                              )}
                            />
                          </div>
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
            className="fixed bottom-6 left-1/2 bg-[#0d1117] text-[#0d1117] px-6 py-4 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] z-[999] flex items-center gap-8 border border-[#eaeef2] backdrop-blur-xl"
          >
            <div className="flex items-center gap-4 pr-8 border-r border-[#eaeef2]">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-black text-base animate-pulse">
                {selectedIds.length}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0d1117]/30">Selected</p>
                <p className="text-sm font-bold text-[#0d1117]">Users to modify</p>
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
                  className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${role === 'admin' ? 'bg-red-500 hover:bg-red-600' :
                      role === 'moderator' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'
                    }`}
                >
                  Make {role}
                </button>
              ))}
              <div className="w-px h-8 bg-white mx-2" />
              <button
                onClick={() => setSelectedIds([])}
                className="text-[10px] font-black uppercase tracking-widest text-[#0d1117]/40 hover:text-[#0d1117] transition-colors"
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

      <AnimatePresence>
        {selectedUser && (
          <UserProfileModal
            isOpen={!!selectedUser}
            onClose={() => setSelectedUser(null)}
            user={selectedUser}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;
