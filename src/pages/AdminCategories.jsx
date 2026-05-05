import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Trash2, Edit2, X, Tags, 
  FolderPlus, Image as ImageIcon, ArrowRight
} from 'lucide-react';
import api, { getImageUrl } from '../api/axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryImage, setCategoryImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, data: null });
  const [deleting, setDeleting] = useState(false);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    setEditingCategory(category);
    setCategoryName(category ? category.name : '');
    setImagePreview(category ? getImageUrl(category.image_url) : null);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let imageUrl = editingCategory ? editingCategory.image_url : '';
      if (categoryImage) {
        const formData = new FormData();
        formData.append('image', categoryImage);
        const uploadRes = await api.post('/upload', formData);
        imageUrl = uploadRes.data.url;
      }
      const data = { name: categoryName, image_url: imageUrl };
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, data);
        toast.success('Updated');
      } else {
        await api.post('/categories', data);
        toast.success('Created');
      }
      fetchCategories();
      setIsModalOpen(false);
    } catch {
      toast.error('Failed');
    } finally {
      setSaving(false);
    }
  };

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Categories</h1>
        </div>
        <button onClick={() => handleOpenModal()} style={{ background: '#e11d48', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
           <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 400 }}>
         <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#94a3b8' }} />
         <input type="text" placeholder="Search categories..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', background: '#fff', border: '1px solid #f1f5f9', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 700, outline: 'none' }} />
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ height: '30vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <div style={{ width: 30, height: 30, border: '3px solid #f1f5f9', borderTopColor: '#e11d48', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
           {filteredCategories.map((cat) => (
             <motion.div 
               key={cat.id}
               style={{ background: '#fff', borderRadius: '2rem', border: '1px solid #f1f5f9', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column', gap: '1rem' }}
             >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                   <div style={{ width: 50, height: 50, borderRadius: '1rem', overflow: 'hidden', background: '#f8f9fc', border: '1px solid #f1f5f9' }}>
                      {cat.image_url ? <img src={getImageUrl(cat.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <Tags style={{ width: '100%', height: '100%', padding: '0.85rem', color: '#cbd5e1' }} />}
                   </div>
                   <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button onClick={() => handleOpenModal(cat)} style={{ width: 32, height: 32, borderRadius: '0.75rem', border: '1px solid #f1f5f9', background: '#fff', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Edit2 size={14} /></button>
                      <button onClick={() => setConfirmModal({ isOpen: true, data: cat.id })} style={{ width: 32, height: 32, borderRadius: '0.75rem', border: 'none', background: '#fff1f2', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={14} /></button>
                   </div>
                </div>

                <div>
                   <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.25rem' }}>{cat.name}</h3>
                   <button onClick={() => navigate(`/admin/products?category=${cat.id}`)} style={{ background: 'none', border: 'none', color: '#e11d48', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cat.product_count || 0} Products <ArrowRight size={10} /></button>
                </div>
             </motion.div>
           ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
         {isModalOpen && (
           <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#fff', borderRadius: '2rem', width: '100%', maxWidth: 400, padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                   <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>{editingCategory ? 'Edit Category' : 'New Category'}</h2>
                   <button onClick={() => setIsModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                   <div>
                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Name</label>
                      <input type="text" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} style={{ width: '100%', background: '#f8f9fc', border: '1px solid #f1f5f9', borderRadius: '1rem', padding: '0.85rem 1rem', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }} />
                   </div>
                   <div style={{ marginTop: '0.5rem' }}>
                      <button disabled={saving} style={{ width: '100%', background: '#e11d48', color: '#fff', border: 'none', padding: '1rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 20px rgba(225, 29, 72, 0.1)' }}>{saving ? 'Saving...' : 'Save Category'}</button>
                   </div>
                </form>
             </motion.div>
           </div>
         )}
      </AnimatePresence>

      <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false, type: null, data: null })} onConfirm={async () => { setDeleting(true); try { await api.delete(`/categories/${confirmModal.data}`); toast.success('Removed'); fetchCategories(); } catch { toast.error('Failed'); } setConfirmModal({ isOpen: false }); setDeleting(false); }} loading={deleting} />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AdminCategories;
