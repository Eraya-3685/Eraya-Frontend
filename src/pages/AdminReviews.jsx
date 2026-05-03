import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, CheckCircle, Trash2, Search, 
  Filter, AlertCircle, MessageSquare, User,
  Calendar, ShieldCheck, RefreshCcw
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // All, Pending, Approved
  const [search, setSearch] = useState('');
  const [approvingId, setApprovingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [reviewToDelete, setReviewToDelete] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

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
      toast.success('Review approved and published');
      setReviews(prev => prev.map(r => r.id === id ? { ...r, is_approved: true } : r));
    } catch (error) {
      toast.error(error.response?.data || 'Failed to approve review');
    } finally {
      setApprovingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!reviewToDelete) return;
    setDeletingId(reviewToDelete.id);
    try {
      await api.delete(`/reviews/${reviewToDelete.id}`);
      toast.success('Review deleted');
      setReviews(prev => prev.filter(r => r.id !== reviewToDelete.id));
      setReviewToDelete(null);
    } catch (error) {
      toast.error(error.response?.data || 'Failed to delete review');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = reviews.filter(r => {
    const matchesFilter = 
      filter === 'All' || 
      (filter === 'Pending' && !r.is_approved) || 
      (filter === 'Approved' && r.is_approved);
    
    const matchesSearch = 
      r.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.comment?.toLowerCase().includes(search.toLowerCase());
      
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-secondary" />
            Product Reviews
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Moderate customer feedback and verify product ratings.</p>
        </div>
        
        <div className="flex items-center gap-4 glass-card-light p-1.5 rounded-2xl border border-white/[0.08] shadow-sm w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reviewers or comments..."
              className="w-full glass-card-light border-none rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
          <button onClick={fetchReviews} className="p-2.5 hover:glass-card-light rounded-xl transition-colors">
            <RefreshCcw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8 glass-card-light/50 p-2 rounded-[2rem] border border-white/[0.08]/50 w-fit">
        {['All', 'Pending', 'Approved'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all border ${
              filter === s
                ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200'
                : 'bg-transparent text-slate-400 border-transparent hover:glass-card-light hover:text-slate-300'
            }`}
          >
            {s} {s === 'Pending' && reviews.filter(r => !r.is_approved).length > 0 && (
              <span className="ml-2 bg-indigo-600 text-white px-1.5 py-0.5 rounded-md text-[8px] animate-pulse">
                {reviews.filter(r => !r.is_approved).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <AnimatePresence mode="wait">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
             <div className="w-12 h-12 border-4 border-white/[0.08] border-t-secondary rounded-full animate-spin" />
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Feedback...</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-32 glass-card-light rounded-[3rem] border border-white/[0.08] shadow-sm"
          >
            <div className="w-20 h-20 glass-card-light rounded-[32px] flex items-center justify-center mx-auto mb-6">
              <Star className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-white">No reviews to show</h3>
            <p className="text-slate-400 text-sm">Customer feedback will appear here after approval.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((rev) => (
              <motion.div
                key={rev.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card-light rounded-[2.5rem] border border-white/[0.08] shadow-sm p-8 flex flex-col hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 glass-card-light rounded-2xl flex items-center justify-center border border-white/[0.08]">
                       <User className="w-6 h-6 text-slate-300" />
                    </div>
                    <div>
                       <h4 className="font-bold text-white">{rev.user?.full_name}</h4>
                       <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex">
                             {[...Array(5)].map((_, i) => (
                               <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                             ))}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">· {new Date(rev.created_at).toLocaleDateString()}</span>
                       </div>
                    </div>
                  </div>
                  
                  {rev.is_approved ? (
                    <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                       <CheckCircle className="w-3 h-3" /> Published
                    </div>
                  ) : (
                    <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                       <Clock className="w-3 h-3" /> Pending
                    </div>
                  )}
                </div>

                <div className="flex-grow">
                   <div className="p-5 glass-card-light/50 rounded-2xl border border-white/[0.08] italic text-slate-300 text-sm leading-relaxed mb-6">
                     "{rev.comment}"
                   </div>
                   
                   <div className="flex items-center gap-4 mb-8">
                      {rev.is_verified && (
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                           <ShieldCheck className="w-3.5 h-3.5" /> Verified Purchase
                        </div>
                      )}
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product ID: {rev.product_id}</p>
                   </div>
                </div>

                <div className="flex items-center gap-3 pt-6 border-t border-slate-50">
                   {!rev.is_approved && (
                     <button
                       onClick={() => handleApprove(rev.id)}
                       disabled={approvingId === rev.id}
                       className="flex-grow py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-2"
                     >
                       {approvingId === rev.id ? <RefreshCcw className="w-3 h-3 animate-spin" /> : 'Approve Review'}
                     </button>
                   )}
                   <button
                     onClick={() => setReviewToDelete(rev)}
                     disabled={deletingId === rev.id}
                     className={`py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center ${
                       rev.is_approved 
                         ? 'flex-grow border border-white/[0.08] text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50'
                         : 'px-6 border border-white/[0.08] text-slate-300 hover:text-red-500 hover:bg-red-50'
                     } disabled:opacity-50`}
                   >
                     {deletingId === rev.id ? (
                       <RefreshCcw className="w-3 h-3 animate-spin" />
                     ) : rev.is_approved ? (
                       'Delete Review'
                     ) : (
                       <Trash2 className="w-4 h-4" />
                     )}
                   </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={!!reviewToDelete}
        onClose={() => setReviewToDelete(null)}
        onConfirm={confirmDelete}
        loading={!!deletingId}
        title="Delete Review?"
        message="Are you sure you want to delete this review? This action cannot be undone."
      />
    </div>
  );
};

const Clock = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

export default AdminReviews;
