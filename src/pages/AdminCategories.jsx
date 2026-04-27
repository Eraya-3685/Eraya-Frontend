import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Trash2, 
  MoreVertical, 
  Edit2, 
  X, 
  Tags, 
  Check, 
  ChevronRight,
  FolderPlus,
  Image as ImageIcon,
  Upload,
  Cloud
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
  const [selectedIds, setSelectedIds] = useState([]);
  const [errors, setErrors] = useState({});
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, data: null });
  const [deleting, setDeleting] = useState(false);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch (err) {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    setEditingCategory(category);
    setCategoryName(category ? category.name : '');
    setImagePreview(category ? getImageUrl(category.image_url) : null);
    setCategoryImage(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setCategoryName('');
    setCategoryImage(null);
    setImagePreview(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCategoryImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!categoryName || categoryName.trim().length < 3) {
      newErrors.name = 'Category name must be at least 3 characters';
    }
    if (!editingCategory && !categoryImage) {
      newErrors.image = 'Category image is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setSaving(true);
    try {
      let imageUrl = editingCategory ? editingCategory.image_url : '';

      // Upload image if selected
      if (categoryImage) {
        const formData = new FormData();
        formData.append('image', categoryImage);
        const uploadRes = await api.post('/upload', formData);
        imageUrl = uploadRes.data.url;
      }

      const data = {
        name: categoryName,
        image_url: imageUrl
      };

      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, data);
        toast.success('Category updated');
      } else {
        await api.post('/categories', data);
        toast.success('Category created');
      }
      fetchCategories();
      handleCloseModal();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const id = confirmModal.data;
    setDeleting(true);
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Category removed');
      fetchCategories();
      setConfirmModal({ isOpen: false, type: null, data: null });
    } catch (err) {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      await api.post('/categories/bulk-delete', { ids: selectedIds });
      toast.success('Categories deleted');
      setSelectedIds([]);
      fetchCategories();
      setConfirmModal({ isOpen: false, type: null, data: null });
    } catch (err) {
      toast.error('Bulk deletion failed');
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 pb-32">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black font-display text-slate-900 tracking-tight mb-1">
            Categories
          </h1>
          <p className="text-slate-500 flex items-center gap-2 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
            Manage your store's structure
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex-shrink-0 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-slate-900/10 active:scale-95 flex items-center gap-2.5"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          Add Category
        </button>
      </div>

      {/* Global Search */}
      <div className="relative mb-8 group max-w-sm">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="w-3.5 h-3.5 text-slate-300 group-focus-within:text-primary transition-colors" />
        </div>
        <input 
          type="text" 
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-11 pr-5 outline-none focus:border-primary transition-all shadow-sm text-xs font-bold text-slate-900 placeholder:text-slate-300"
        />
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-6 bg-white rounded-[32px] border border-slate-50">
          <div className="w-12 h-12 border-[5px] border-slate-100 border-t-primary rounded-full animate-spin" />
          <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[9px] animate-pulse">Loading Categories...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[32px] border-2 border-dashed border-slate-100">
          <Tags className="w-12 h-12 text-slate-100 mx-auto mb-4" />
          <p className="text-slate-400 text-sm font-bold">No categories matched your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredCategories.map((cat) => (
              <motion.div
                layout
                key={cat.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative bg-white rounded-2xl p-5 border border-slate-100 hover:border-primary/20 transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] overflow-hidden"
              >

                {/* Selection Checkbox */}
                <div 
                  className="absolute top-5 left-5 z-10 cursor-pointer"
                  onClick={() => toggleSelect(cat.id)}
                >
                  <div className={`w-7 h-7 rounded-[10px] border-2 flex items-center justify-center transition-all ${
                    selectedIds.includes(cat.id) 
                      ? 'bg-slate-900 border-slate-900 text-white rotate-[15deg]' 
                      : 'bg-white/80 backdrop-blur-md border-slate-200 text-transparent hover:border-primary'
                  }`}>
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Icon & Menu */}
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div 
                    className="w-12 h-12 rounded-[16px] flex items-center justify-center overflow-hidden relative z-10"
                    onClick={() => navigate(`/products?category=${cat.id}`)}
                  >
                    {cat.image_url && (
                       <img src={getImageUrl(cat.image_url)} className="w-full h-full object-cover rounded-[16px]" alt="" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1.5 relative z-20">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenModal(cat); }}
                      className="p-2.5 bg-white/80 backdrop-blur-md text-slate-400 rounded-lg hover:bg-slate-900 hover:text-white transition-all active:scale-90 shadow-sm"
                      title="Edit"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setConfirmModal({ isOpen: true, type: 'single', data: cat.id });
                      }}
                      className="p-2.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all active:scale-90 shadow-sm"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Title & Stats */}
                <div 
                  className="cursor-pointer relative z-10"
                  onClick={() => navigate(`/products?category=${cat.id}`)}
                >
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1 group-hover:text-primary transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-full">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        {cat.product_count} Products
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-6 rounded-[32px] shadow-2xl flex items-center gap-12 z-[100] border border-white/10 backdrop-blur-xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center font-black text-primary">
                {selectedIds.length}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">Selection</p>
                <p className="text-base font-bold text-white tracking-tight">Active Categories</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedIds([])}
                className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-all hover:scale-110"
              >
                Clear
              </button>
              <button
                onClick={() => setConfirmModal({ isOpen: true, type: 'bulk', data: null })}
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl shadow-red-500/20 active:scale-95 group"
              >
                <Trash2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Delete Selected
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-8 bg-slate-50/50">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1.5">
                    {editingCategory ? 'Edit Category' : 'New Category'}
                  </h2>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Category Details</p>
                </div>
                <button 
                  onClick={handleCloseModal} 
                  className="p-3 bg-white text-slate-300 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-sm active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6">
                {/* Image Upload Area */}
                <div className="space-y-3">
                   <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">
                    Category Visual
                  </label>
                  <div 
                    onClick={() => {
                      fileInputRef.current?.click();
                      if (errors.image) setErrors({ ...errors, image: null });
                    }}
                    className={`relative group cursor-pointer aspect-video bg-slate-50 border-2 border-dashed rounded-[28px] flex flex-col items-center justify-center overflow-hidden transition-all ${errors.image ? 'border-red-300 bg-red-50/30' : 'border-slate-200 group-hover:border-primary/50'}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-[28px] blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      {imagePreview ? (
                        <>
                          <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                             <div className="bg-white/90 p-3 rounded-xl flex items-center gap-2 scale-90 group-hover:scale-100 transition-all">
                                <Cloud className="w-4 h-4 text-primary" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">Change Photo</span>
                             </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                           <div className={`w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center transition-all ${errors.image ? 'text-red-400' : 'text-slate-300 group-hover:text-primary'}`}>
                              <ImageIcon className="w-6 h-6" />
                           </div>
                           <div className="text-center">
                              <p className={`text-xs font-bold ${errors.image ? 'text-red-500' : 'text-slate-900'}`}>Upload Category Image</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">PNG, JPG up to 5MB</p>
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {errors.image && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2 ml-1">{errors.image}</p>}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">
                    Category Name
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-[20px] blur-xl opacity-0 group-focus-within:opacity-100 transition-all duration-700" />
                    <input
                      required
                      value={categoryName}
                      onChange={(e) => {
                        setCategoryName(e.target.value);
                        if (errors.name) setErrors({ ...errors, name: null });
                      }}
                      className={`relative w-full border-2 rounded-[24px] py-4 px-6 outline-none transition-all bg-white text-base font-black text-slate-900 placeholder:text-slate-200 shadow-inner ${errors.name ? 'border-red-200 focus:border-red-300' : 'border-slate-100 focus:border-primary'}`}
                      placeholder="e.g. Kinetic Sportswear"
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 ml-1">{errors.name}</p>}
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 bg-slate-50 py-4 rounded-[20px] font-black text-slate-400 hover:bg-slate-100 transition-all active:scale-95 text-[9px] uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-slate-900 text-white py-4 rounded-[20px] font-black hover:bg-primary transition-all disabled:opacity-60 shadow-xl shadow-slate-900/20 active:scale-95 text-[9px] uppercase tracking-widest"
                  >
                    {saving ? 'Processing...' : editingCategory ? 'Update Category' : 'Create Category'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: null, data: null })}
        onConfirm={confirmModal.type === 'bulk' ? handleBulkDelete : handleDelete}
        loading={deleting}
        title={confirmModal.type === 'bulk' ? `Delete ${selectedIds.length} Categories?` : "Delete Category?"}
        message={confirmModal.type === 'bulk' 
          ? "All selected categories and their product associations will be removed. This cannot be undone." 
          : "All product associations for this category will be removed. This action is permanent."
        }
      />
    </div>
  );
};

export default AdminCategories;
