import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit, Trash2, Search, X, Package, 
  Filter, List, Grid, MoreVertical, DollarSign, ShoppingBag, Users,
  Download, ArrowRight, Check, TrendingUp
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api, { getImageUrl } from '../api/axios';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const AdminProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [modal, setModal] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [stats, setStats] = useState({ total_products: 0, total_revenue: 0, total_orders: 0 });

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, [search, filterStatus]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products?search=${search}`);
      let data = res.data?.data || [];
      // Client-side status filter
      if (filterStatus === 'Active') data = data.filter(p => p.is_active && p.stock_count > 0);
      else if (filterStatus === 'Drafts') data = data.filter(p => !p.is_active);
      else if (filterStatus === 'Archived') data = data.filter(p => p.stock_count === 0);
      setProducts(data);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/orders/stats');
      setStats(res.data);
    } catch {}
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedIds.length === products.length && products.length > 0) setSelectedIds([]);
    else setSelectedIds(products.map(p => p.id));
  };

  const StatusBadge = ({ product }) => {
    let style = { bg: '#f1f5f9', text: '#64748b', label: 'Draft' };
    if (product.stock_count === 0) style = { bg: '#fff7ed', text: '#f97316', label: 'Out Stock' };
    else if (!product.is_active) style = { bg: '#fef2f2', text: '#ef4444', label: 'Inactive' };
    else if (product.is_active) style = { bg: '#ecfdf5', text: '#10b981', label: 'Published' };

    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.85rem', borderRadius: '1rem', background: style.bg, color: style.text, fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
         <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
         {style.label}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '10rem' }}>
      
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
         <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>Inventory</h1>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', margin: '0.5rem 0 0' }}>Manage your product listings and availability</p>
         </div>
         <div style={{ display: 'flex', gap: '1rem' }}>
            <button style={{ background: '#fff', border: '1px solid #f1f5f9', padding: '1rem 1.5rem', borderRadius: '1.25rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><Download size={16} /> Export</button>
            <button style={{ background: '#e11d48', border: 'none', padding: '1rem 1.75rem', borderRadius: '1.25rem', fontSize: '0.75rem', fontWeight: 800, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', boxShadow: '0 10px 20px rgba(225, 29, 72, 0.15)' }}><Plus size={16} /> Add Product</button>
         </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
         {[
           { label: 'Total Products', value: stats.total_products || 0, icon: Package, color: '#e11d48' },
           { label: 'Total Revenue', value: `৳${(stats.total_revenue || 0).toLocaleString()}`, icon: DollarSign, color: '#3b82f6' },
           { label: 'Total Orders', value: stats.total_orders || 0, icon: ShoppingBag, color: '#f59e0b' },
           { label: 'Total Sold', value: stats.total_sold || 0, icon: TrendingUp, color: '#8b5cf6' },
         ].map((card, i) => (
           <div key={i} style={{ background: '#fff', padding: '1.5rem', borderRadius: '2rem', border: '1px solid #f1f5f9', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                 <div style={{ width: 36, height: 36, borderRadius: '0.85rem', background: `${card.color}10`, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><card.icon size={18} /></div>
                 <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#10b981', background: '#ecfdf5', padding: '0.2rem 0.5rem', borderRadius: '0.5rem' }}>Live</div>
              </div>
              <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 0.4rem' }}>{card.label}</p>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{card.value}</h3>
           </div>
         ))}
      </div>

      {/* Control Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '1rem', borderRadius: '1.75rem', border: '1px solid #f1f5f9' }}>
         <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
            <Search style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
            <input type="text" placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', background: '#f8f9fc', border: '1px solid #f1f5f9', borderRadius: '1.25rem', padding: '0.85rem 1rem 0.85rem 3.5rem', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }} />
         </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '2.5rem', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
         <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
               <tr style={{ background: '#f8f9fc', borderBottom: '1px solid #f1f5f9' }}>
                  <th style={{ padding: '1rem 1rem 1rem 2rem', width: 40 }}><input type="checkbox" checked={selectedIds.length === products.length && products.length > 0} onChange={toggleAll} style={{ width: 16, height: 16, accentColor: '#e11d48' }} /></th>
                  <th style={{ padding: '1rem 1rem', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Product</th>
                  <th style={{ padding: '1rem 1rem', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ID & Created</th>
                  <th style={{ padding: '1rem 1rem', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Price Points</th>
                  <th style={{ padding: '1rem 1rem', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Inventory</th>
                  <th style={{ padding: '1rem 2rem 1rem 1rem', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status</th>
               </tr>
            </thead>
            <tbody>
               {loading ? (
                 <tr><td colSpan={6} style={{ padding: '4rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1' }}>Synchronizing Catalog...</td></tr>
               ) : products.map((p) => (
                 <tr key={p.id} style={{ borderBottom: '1px solid #f8f9fc', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#fcfdfe'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '0.75rem 1rem 0.75rem 2rem' }}><input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} style={{ width: 16, height: 16, accentColor: '#e11d48' }} /></td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div style={{ width: 40, height: 40, borderRadius: '0.75rem', background: '#f8f9fc', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                             {p.images?.[0] ? <img src={getImageUrl(p.images[0].image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package style={{ width: '100%', height: '100%', padding: '0.6rem', color: '#cbd5e1' }} />}
                          </div>
                          <div>
                             <p style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{p.name}</p>
                             <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', margin: '0.1rem 0 0', textTransform: 'uppercase' }}>{p.categories?.[0]?.name || 'General'}</p>
                          </div>
                       </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                       <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>#KMI{p.id}</p>
                       <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', margin: '0.1rem 0 0' }}>{new Date(p.created_at).toLocaleDateString()}</p>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                       <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>৳{p.base_price.toLocaleString()}</p>
                       {p.discount_price ? <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#e11d48', margin: '0.05rem 0 0' }}>Offer: ৳{p.discount_price.toLocaleString()}</p> : <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', margin: '0.05rem 0 0' }}>Full Price</p>}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                       <p style={{ fontSize: '0.75rem', fontWeight: 800, color: p.stock_count < 10 ? '#f59e0b' : '#0f172a', margin: 0 }}>{p.stock_count.toLocaleString()} <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Units</span></p>
                    </td>
                    <td style={{ padding: '0.75rem 2rem 0.75rem 1rem' }}>
                       <StatusBadge product={p} />
                    </td>
                 </tr>
               ))}
            </tbody>
         </table>
      </div>

      {/* Floating Action Bar */}
      <AnimatePresence>
         {selectedIds.length > 0 && (
           <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} style={{ position: 'fixed', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)', background: '#0f172a', padding: '0.75rem 1.5rem', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', zIndex: 1000 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '1.5rem' }}>{selectedIds.length} Products Selected</span>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                 <button style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '0.6rem 1.25rem', borderRadius: '0.85rem', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>Export</button>
                 <button style={{ background: '#e11d48', border: 'none', color: '#fff', padding: '0.6rem 1.25rem', borderRadius: '0.85rem', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>Delete Selected</button>
              </div>
              <X onClick={() => setSelectedIds([])} size={20} style={{ color: '#94a3b8', cursor: 'pointer', marginLeft: '0.5rem' }} />
           </motion.div>
         )}
      </AnimatePresence>

    </div>
  );
};

const Star = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
);

export default AdminProducts;
