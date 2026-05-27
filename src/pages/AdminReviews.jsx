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
    const matchesSearch = (r.user?.full_name || '').toLowerCase().includes(search.toLowerCase()) || (r.comment || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>Reviews</h1>
         <div style={{ background: '#fff', padding: '0.35rem', borderRadius: '1.25rem', border: '1px solid #f1f5f9', display: 'flex', gap: '0.2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
            {['All', 'Pending', 'Approved'].map(s => (
               <button key={s} onClick={() => setFilter(s)} style={{ border: 'none', padding: '0.5rem 1.25rem', borderRadius: '0.85rem', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', background: filter === s ? '#e11d48' : 'transparent', color: filter === s ? '#fff' : '#64748b', transition: 'all 0.2s' }}>{s}</button>
            ))}
         </div>
      </div>

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
         <div style={{ position: 'relative', flex: 1, maxWidth: 350 }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search reviews..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              style={{ 
                width: '100%', 
                background: '#fff', 
                border: '1px solid #f1f5f9', 
                padding: '0 1rem 0 2.75rem', 
                height: 38,
                boxSizing: 'border-box',
                borderRadius: '1rem', 
                fontSize: '0.8rem', 
                fontWeight: 600, 
                outline: 'none', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.01)' 
              }} 
            />
         </div>
         <button 
           onClick={fetchReviews} 
           style={{ 
             width: 38, 
             height: 38, 
             borderRadius: '1rem', 
             border: '1px solid #f1f5f9', 
             background: '#fff', 
             display: 'flex', 
             alignItems: 'center', 
             justifyContent: 'center', 
             color: '#64748b', 
             cursor: 'pointer', 
             boxSizing: 'border-box', 
             transition: 'all 0.2s' 
           }} 
           onMouseEnter={e => e.currentTarget.style.borderColor = '#e11d48'} 
           onMouseLeave={e => e.currentTarget.style.borderColor = '#f1f5f9'}
         >
           <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
         </button>
      </div>

      {/* Reviews Grid */}
      {loading ? (
        <div style={{ height: '30vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 30, height: 30, border: '3px solid #f1f5f9', borderTopColor: '#e11d48', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
           {filtered.map((rev) => (
              <motion.div 
                key={rev.id}
                style={{ background: '#fff', borderRadius: '2.5rem', border: '1px solid #f1f5f9', padding: '1.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                       <div style={{ width: 44, height: 44, borderRadius: '1rem', background: '#f8f9fc', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', fontWeight: 900, fontSize: '0.95rem', flexShrink: 0 }}>{rev.user?.full_name?.charAt(0)}</div>
                       <div style={{ textAlign: 'left' }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{rev.user?.full_name}</h4>
                          <div style={{ display: 'flex', gap: '0.15rem', marginTop: '0.15rem' }}>
                             {[...Array(5)].map((_, i) => (
                               <Star key={i} style={{ width: 10, height: 10, color: i < rev.rating ? '#f59e0b' : '#cbd5e1', fill: i < rev.rating ? '#f59e0b' : 'none' }} />
                             ))}
                          </div>
                       </div>
                    </div>
                    <div style={{ padding: '0.4rem 0.85rem', borderRadius: '0.85rem', background: rev.is_approved ? '#ecfdf5' : '#fff7ed', color: rev.is_approved ? '#10b981' : '#f97316', fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.05em' }}>{rev.is_approved ? 'Live' : 'Pending'}</div>
                 </div>

                 <div style={{ background: '#f8f9fc', borderRadius: '1.5rem', padding: '1.25rem', textAlign: 'left' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>"{rev.comment}"</p>
                 </div>

                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', margin: 0 }}>{new Date(rev.created_at).toLocaleDateString()}</p>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                       {!rev.is_approved && <button onClick={() => handleApprove(rev.id)} style={{ padding: '0.5rem 1.25rem', background: '#e11d48', color: '#fff', border: 'none', borderRadius: '0.85rem', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 20px rgba(225, 29, 72, 0.1)' }}>Approve</button>}
                       <button onClick={() => setConfirmModal({ isOpen: true, data: rev.id })} style={{ width: 36, height: 36, borderRadius: '0.85rem', background: '#fff1f2', color: '#e11d48', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#ffe4e6'} onMouseLeave={e => e.currentTarget.style.background = '#fff1f2'}><Trash2 size={14} /></button>
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
