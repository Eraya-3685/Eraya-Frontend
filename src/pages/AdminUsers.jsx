import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, UserCheck, UserPlus, Trash2, 
  Shield, Mail, Phone, MoreVertical, X, Check,
  User as UserIcon, ShieldAlert, ShieldCheck
} from 'lucide-react';
import api, { getImageUrl } from '../api/axios';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, user: null });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data || []);
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'moderator' : currentRole === 'moderator' ? 'buyer' : 'moderator';
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await api.delete(`/admin/users/${confirmModal.user.id}`);
      toast.success('User removed');
      fetchUsers();
      setConfirmModal({ isOpen: false, user: null });
    } catch {
      toast.error('Failed to remove user');
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const RoleBadge = ({ role }) => {
    const styles = {
      admin: { bg: '#fff1f2', text: '#e11d48', icon: ShieldAlert },
      moderator: { bg: '#eff6ff', text: '#3b82f6', icon: ShieldCheck },
      buyer: { bg: '#f8f9fc', text: '#64748b', icon: UserIcon },
    };
    const style = styles[role.toLowerCase()] || styles.buyer;
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.75rem', borderRadius: '1rem', background: style.bg, color: style.text, fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <style.icon size={10} />
        {role}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Users Control</h1>
      </div>

      {/* Control Bar */}
      <div style={{ position: 'relative', maxWidth: 400 }}>
         <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#94a3b8' }} />
         <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', background: '#fff', border: '1px solid #f1f5f9', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 700, outline: 'none' }} />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '2rem', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
         <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
               <tr style={{ background: '#f8f9fc', borderBottom: '1px solid #f1f5f9' }}>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Member</th>
                  <th style={{ padding: '1rem', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Role</th>
                  <th style={{ padding: '1rem', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Contact</th>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Actions</th>
               </tr>
            </thead>
            <tbody>
               {loading ? (
                 <tr><td colSpan={4} style={{ padding: '4rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1' }}>Syncing Database...</td></tr>
               ) : filteredUsers.map((u) => (
                 <tr key={u.id} style={{ borderBottom: '1px solid #f8f9fc' }} onMouseEnter={(e) => e.currentTarget.style.background = '#fcfdfe'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '0.75rem 1.5rem' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '0.75rem', overflow: 'hidden', background: '#f8f9fc', border: '1px solid #f1f5f9' }}>
                             {u.avatar_url ? <img src={getImageUrl(u.avatar_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 800 }}>{u.full_name?.charAt(0)}</div>}
                          </div>
                          <div>
                             <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{u.full_name}</p>
                             <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', margin: 0 }}>ID: #M-{u.id}</p>
                          </div>
                       </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}><RoleBadge role={u.role} /></td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                       <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{u.email}</p>
                       <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', margin: 0 }}>{u.phone || 'No phone'}</p>
                    </td>
                    <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>
                       <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleToggleRole(u.id, u.role)} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.65rem', border: '1px solid #f1f5f9', background: '#fff', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', cursor: 'pointer' }}>Change Role</button>
                          <button onClick={() => setConfirmModal({ isOpen: true, user: u })} style={{ width: 30, height: 30, borderRadius: '0.65rem', border: 'none', background: '#fff1f2', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={12} /></button>
                       </div>
                    </td>
                 </tr>
               ))}
            </tbody>
         </table>
      </div>

      <AnimatePresence>
         {confirmModal.isOpen && (
           <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#fff', borderRadius: '2rem', width: '100%', maxWidth: 400, padding: '2.5rem', textAlign: 'center' }}>
                 <div style={{ width: 60, height: 60, background: '#fff1f2', color: '#e11d48', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}><Trash2 size={28} /></div>
                 <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem' }}>Remove User?</h2>
                 <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 2rem' }}>Are you sure you want to remove <b>{confirmModal.user?.full_name}</b>? This action cannot be undone.</p>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button onClick={() => setConfirmModal({ isOpen: false, user: null })} style={{ background: '#f8f9fc', border: 'none', padding: '1rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleDeleteUser} style={{ background: '#e11d48', border: 'none', padding: '1rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#fff', cursor: 'pointer' }}>Remove User</button>
                 </div>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;
