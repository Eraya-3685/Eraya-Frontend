import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, Trash2, Search, MessageSquare, Calendar, ShieldCheck,
  RefreshCcw, X
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [approvingId, setApprovingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, data: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reviews');
      setReviews(res.data || []);
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setApprovingId(id);
    try {
      await api.post(`/admin/reviews/${id}/approve`);
      toast.success('Review published');
      fetchReviews();
    } catch {
      toast.error('Failed to approve');
    } finally {
      setApprovingId(null);
    }
  };

  const filtered = reviews.filter(r => {
    const matchesFilter = filter === 'All' || (filter === 'Pending' && !r.is_approved) || (filter === 'Approved' && r.is_approved);
    const matchesSearch = r.user?.full_name?.toLowerCase().includes(search.toLowerCase()) || r.comment?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Reviews</h1>
         <div style={{ background: '#fff', padding: '0.35rem', borderRadius: '1rem', border: '1px solid #f1f5f9', display: 'flex', gap: '0.2rem' }}>
            {['All', 'Pending', 'Approved'].map(s => (
              <button key={s} onClick={() => setFilter(s)} style={{ border: 'none', padding: '0.5rem 1.25rem', borderRadius: '0.75rem', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', background: filter === s ? '#e11d48' : 'transparent', color: filter === s ? '#fff' : '#64748b' }}>{s}</button>
            ))}
         </div>
      </div>

      {/* Control Bar */}
      <div style={{ display: 'flex', gap: '1rem' }}>
         <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#94a3b8' }} />
            <input type="text" placeholder="Search reviews..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', background: '#fff', border: '1px solid #f1f5f9', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 700, outline: 'none' }} />
         </div>
         <button onClick={fetchReviews} style={{ width: 44, height: 44, borderRadius: '1rem', border: '1px solid #f1f5f9', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}><RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      {/* Reviews Grid */}
      {loading ? (
        <div style={{ height: '30vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 30, height: 30, border: '3px solid #f1f5f9', borderTopColor: '#e11d48', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
           {filtered.map((rev) => (
             <motion.div 
               key={rev.id}
               style={{ background: '#fff', borderRadius: '2rem', border: '1px solid #f1f5f9', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
             >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                   <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '0.85rem', background: '#f8f9fc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', fontWeight: 900, fontSize: '0.9rem' }}>{rev.user?.full_name?.charAt(0)}</div>
                      <div>
                         <h4 style={{ fontSize: '0.85rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{rev.user?.full_name}</h4>
                         <div style={{ display: 'flex', gap: '0.15rem', marginTop: '0.15rem' }}>
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} style={{ width: 10, height: 10, color: i < rev.rating ? '#f59e0b' : '#cbd5e1', fill: i < rev.rating ? '#f59e0b' : 'none' }} />
                            ))}
                         </div>
                      </div>
                   </div>
                   <div style={{ padding: '0.35rem 0.65rem', borderRadius: '0.75rem', background: rev.is_approved ? '#ecfdf5' : '#fff7ed', color: rev.is_approved ? '#10b981' : '#f97316', fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase' }}>{rev.is_approved ? 'Live' : 'Pending'}</div>
                </div>

                <div style={{ background: '#f8f9fc', borderRadius: '1.25rem', padding: '1rem' }}>
                   <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>"{rev.comment}"</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', margin: 0 }}>{new Date(rev.created_at).toLocaleDateString()}</p>
                   <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {!rev.is_approved && <button onClick={() => handleApprove(rev.id)} style={{ padding: '0.4rem 1rem', background: '#e11d48', color: '#fff', border: 'none', borderRadius: '0.75rem', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}>Approve</button>}
                      <button onClick={() => setConfirmModal({ isOpen: true, data: rev.id })} style={{ width: 32, height: 32, borderRadius: '0.75rem', background: '#fff1f2', color: '#e11d48', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={14} /></button>
                   </div>
                </div>
             </motion.div>
           ))}
        </div>
      )}

      <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false, data: null })} onConfirm={async () => { setDeleting(true); try { await api.delete(`/reviews/${confirmModal.data}`); toast.success('Deleted'); fetchReviews(); } catch { toast.error('Failed'); } setConfirmModal({ isOpen: false }); setDeleting(false); }} loading={deleting} />

      <style>{` @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } `}</style>
    </div>
  );
};

export default AdminReviews;
