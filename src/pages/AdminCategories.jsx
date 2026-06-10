import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Trash2, Edit2, X, Tags, 
  ArrowRight, Image as ImageIcon, Package
} from 'lucide-react';
import api, { getImageUrl } from '../api/axios';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Pagination from '../components/Pagination';

const AdminCategories = () => {
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  // Category Products Drawer States
  const [selectedCategoryProducts, setSelectedCategoryProducts] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Product Details Drawer State
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();



  // Fetch products inside clicked category when selectedCategoryProducts changes
  useEffect(() => {
    if (selectedCategoryProducts) {
      fetchCategoryProducts(selectedCategoryProducts.id);
    } else {
      setCategoryProducts([]);
      setSelectedProductDetails(null);
    }
  }, [selectedCategoryProducts]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/categories?page=${page}&limit=${limit}&search=${searchTerm}`);
      let data = [];
      if (res.data?.pagination) {
        data = res.data.data || [];
        setTotalPages(res.data.pagination.total_pages || 1);
      } else {
        data = res.data || [];
        setTotalPages(1);
      }
      setCategories(data);

      // Auto-open specific category products list drawer if ID parameter is present
      const catIdParam = searchParams.get('id');
      if (catIdParam) {
        const catId = parseInt(catIdParam, 10);
        const matched = data.find(c => c.id === catId);
        if (matched) {
          setSelectedCategoryProducts(matched);
        }
        setSearchParams({}, { replace: true });
      }
    } catch {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [page, limit, searchTerm]);

  const fetchCategoryProducts = async (catId) => {
    setLoadingProducts(true);
    try {
      const res = await api.get(`/products?category_id=${catId}&admin=true`);
      setCategoryProducts(res.data?.data || []);
    } catch {
      toast.error('Failed to load category products');
    } finally {
      setLoadingProducts(false);
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
    setImagePreview(null);
    setCategoryImage(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast.error('Category name is required');
      return;
    }
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
        toast.success('Category updated successfully');
      } else {
        await api.post('/categories', data);
        toast.success('Category created successfully');
      }
      fetchCategories();
      handleCloseModal();
    } catch {
      toast.error('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const paginatedCategories = categories;

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '5rem' }}>
      
      {/* Header */}
      <div>
         <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>Categories</h1>
      </div>

      {/* Search & Actions Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Search input */}
        <div style={{ position: 'relative', flex: 1, maxWidth: 350 }}>
          <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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

        {/* Add Category Button */}
        <button
          onClick={() => handleOpenModal()}
          style={{
            background: '#e11d48',
            color: '#fff',
            border: 'none',
            padding: '0 1.5rem',
            borderRadius: '1rem',
            fontSize: '0.75rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            height: 38,
            boxShadow: '0 10px 20px rgba(225, 29, 72, 0.15)',
            boxSizing: 'border-box'
          }}
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Grid - Smart, Compact, and Beautiful Horizontal Rows */}
      {loading ? (
        <div style={{ height: '30vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <div style={{ width: 30, height: 30, border: '3px solid #f1f5f9', borderTopColor: '#e11d48', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
           {paginatedCategories.map((cat) => (
              <motion.div 
                key={cat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedCategoryProducts(cat)}
                style={{ 
                  background: '#fff', 
                  borderRadius: '1.5rem', 
                  border: '1px solid #f1f5f9', 
                  padding: '1rem', 
                  boxShadow: '0 8px 24px rgba(0,0,0,0.02)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#e11d48'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(225,29,72,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.02)'; }}
              >
                 <div style={{ width: 50, height: 50, borderRadius: '0.75rem', overflow: 'hidden', background: '#f8f9fc', border: '1px solid #f1f5f9', flexShrink: 0 }}>
                    {cat.image_url ? <img src={getImageUrl(cat.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <Tags style={{ width: '100%', height: '100%', padding: '0.8rem', color: '#cbd5e1' }} />}
                 </div>
                 
                 <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.name}</h3>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        navigate(`/admin/products?category=${cat.id}`); 
                      }} 
                      style={{ background: 'none', border: 'none', color: '#e11d48', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', padding: 0 }}
                    >
                      {cat.product_count || 0} Products <ArrowRight size={10} />
                    </button>
                 </div>
                 
                 <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleOpenModal(cat); 
                      }} 
                      style={{ width: 32, height: 32, borderRadius: '0.65rem', border: '1px solid #f1f5f9', background: '#fff', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }} 
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#e11d48'} 
                      onMouseLeave={e => e.currentTarget.style.borderColor = '#f1f5f9'}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setConfirmModal({ isOpen: true, data: cat.id }); 
                      }} 
                      style={{ width: 32, height: 32, borderRadius: '0.65rem', border: 'none', background: '#fff1f2', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <Trash2 size={12} />
                    </button>
                 </div>
              </motion.div>
           ))}
        </div>
      )}

      {!loading && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
          limit={limit}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      )}

      {/* Category Products Right Side Drawer */}
      <AnimatePresence>
         {selectedCategoryProducts && (
           <>
             <div 
               onClick={() => { setSelectedCategoryProducts(null); setSelectedProductDetails(null); }} 
               style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 998 }} 
             />
             
             <motion.div 
               initial={{ x: '100%' }} 
               animate={{ x: selectedProductDetails ? (window.innerWidth <= 768 ? 0 : -390) : 0 }} 
               exit={{ x: '100%' }} 
               transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
               style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: window.innerWidth <= 768 ? '100%' : 380, background: '#fff', boxShadow: '-10px 0 40px rgba(15,23,42,0.1)', zIndex: 999, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
             >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '0.5rem', overflow: 'hidden', background: '#f8f9fc', border: '1px solid #f1f5f9', flexShrink: 0 }}>
                         {selectedCategoryProducts.image_url ? (
                           <img src={getImageUrl(selectedCategoryProducts.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                         ) : (
                           <Tags style={{ width: '100%', height: '100%', padding: '0.6rem', color: '#cbd5e1' }} />
                         )}
                      </div>
                      <div style={{ textAlign: 'left' }}>
                         <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{selectedCategoryProducts.name}</h2>
                         <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#e11d48', letterSpacing: '0.05em' }}>Category Products</span>
                      </div>
                   </div>
                   <button onClick={() => { setSelectedCategoryProducts(null); setSelectedProductDetails(null); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
                </div>
                
                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto' }}>
                   {loadingProducts ? (
                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', flex: 1 }}>
                        <div style={{ width: 28, height: 28, border: '2.5px solid #f1f5f9', borderTopColor: '#e11d48', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#cbd5e1', letterSpacing: '0.05em' }}>Loading Products...</span>
                     </div>
                   ) : categoryProducts.length === 0 ? (
                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.75rem', flex: 1, color: '#94a3b8', padding: '2rem 0' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f8f9fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Tags size={20} /></div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>No products listed under this category</span>
                     </div>
                   ) : (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {categoryProducts.map((p) => (
                           <div 
                             key={p.id}
                             onClick={() => {
                               setSelectedProductDetails(p);
                               setActiveImageIndex(0);
                             }}
                             style={{ 
                               display: 'flex', 
                               alignItems: 'center', 
                               gap: '0.75rem', 
                               padding: '0.75rem', 
                               borderRadius: '1rem', 
                               border: '1px solid #f1f5f9',
                               background: '#f8f9fc',
                               cursor: 'pointer',
                               transition: 'all 0.15s ease'
                             }}
                             onMouseEnter={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#fff'; }}
                             onMouseLeave={e => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.background = '#f8f9fc'; }}
                           >
                              <div style={{ width: 40, height: 40, borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#fff', flexShrink: 0 }}>
                                 {p.images && p.images.length > 0 ? (
                                   <img src={getImageUrl(p.images.find(img => img.is_primary)?.image_url || p.images[0].image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                 ) : (
                                   <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}><Tags size={16} /></div>
                                 )}
                              </div>
                              
                              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                                 <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</h4>
                                 <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', margin: '0.15rem 0 0' }}>Stock: {p.stock_count.toLocaleString()} Units</p>
                              </div>
                              
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                 <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', display: 'block' }}>
                                    ৳{p.discount_price ? p.discount_price.toLocaleString() : p.base_price.toLocaleString()}
                                 </span>
                                 {p.discount_price && (
                                   <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textDecoration: 'line-through' }}>
                                      ৳{p.base_price.toLocaleString()}
                                   </span>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                   )}
                </div>
                
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', background: '#f8f9fc' }}>
                   <button 
                     onClick={() => {
                       setSelectedCategoryProducts(null);
                       setSelectedProductDetails(null);
                       navigate(`/admin/products?category=${selectedCategoryProducts.id}`);
                     }}
                     style={{ 
                       width: '100%', 
                       background: '#0f172a', 
                       color: '#fff', 
                       border: 'none', 
                       padding: '0.75rem 1rem', 
                       borderRadius: '0.75rem', 
                       fontSize: '0.75rem', 
                       fontWeight: 800, 
                       cursor: 'pointer', 
                       display: 'flex', 
                       alignItems: 'center', 
                       justifyContent: 'center', 
                       gap: '0.5rem',
                       boxShadow: '0 4px 12px rgba(15, 23, 42, 0.1)'
                     }}
                   >
                      Manage Category Inventory <ArrowRight size={14} />
                   </button>
                </div>
             </motion.div>
           </>
         )}
      </AnimatePresence>

      {/* Product Details Drawer (slides on top with zIndex 1000) */}
      <AnimatePresence>
         {selectedProductDetails && (
              <motion.div 
                initial={{ x: '100%' }} 
                animate={{ x: 0 }} 
                exit={{ x: '100%' }} 
                transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
                style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: window.innerWidth <= 768 ? '100%' : 380, background: '#fff', boxShadow: '-10px 0 40px rgba(15,23,42,0.15)', zIndex: 1001, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                   <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>Product Details</span>
                   <button onClick={() => { setSelectedProductDetails(null); setActiveImageIndex(0); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
                </div>
                
                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ width: '100%', height: 185, borderRadius: '1rem', overflow: 'hidden', background: '#f8f9fc', border: '1px solid #f1f5f9' }}>
                         {selectedProductDetails.images && selectedProductDetails.images.length > 0 ? (
                           <img src={getImageUrl(selectedProductDetails.images[activeImageIndex]?.image_url || selectedProductDetails.images[0].image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                         ) : (
                           <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                              <Package size={36} />
                           </div>
                         )}
                      </div>
                      
                      {selectedProductDetails.images && selectedProductDetails.images.length > 1 && (
                        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                           {selectedProductDetails.images.map((img, i) => (
                             <div 
                               key={i} 
                               onClick={() => setActiveImageIndex(i)}
                               style={{ 
                                 width: 44, 
                                 height: 44, 
                                 borderRadius: '0.5rem', 
                                 overflow: 'hidden', 
                                 border: i === activeImageIndex ? '2px solid #e11d48' : '2px solid transparent',
                                 outline: i === activeImageIndex ? 'none' : '1px solid #f1f5f9',
                                 flexShrink: 0, 
                                 cursor: 'pointer',
                                 transition: 'border-color 0.15s ease',
                                 opacity: i === activeImageIndex ? 1 : 0.65
                               }}
                             >
                                <img src={getImageUrl(img.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                             </div>
                           ))}
                        </div>
                      )}
                   </div>
                   
                   <div>
                       <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.5rem' }}>
                          {selectedProductDetails.categories && selectedProductDetails.categories.length > 0 ? (
                            selectedProductDetails.categories.map(c => (
                              <span key={c.id} style={{ fontSize: '0.6rem', fontWeight: 800, color: '#e11d48', background: '#fff1f2', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', display: 'inline-block' }}>
                                 {c.name}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', display: 'inline-block' }}>
                               General
                            </span>
                          )}
                       </div>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.01em', lineHeight: 1.3 }}>{selectedProductDetails.name}</h2>
                      <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', margin: '0.15rem 0 0' }}>#KMI{selectedProductDetails.id}</p>
                   </div>
                   
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8f9fc', padding: '1rem', borderRadius: '1rem', border: '1px solid #f1f5f9' }}>
                      <div>
                         <p style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94a3b8', margin: '0 0 0.15rem', letterSpacing: '0.05em' }}>Base Price</p>
                         <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>৳{selectedProductDetails.base_price.toLocaleString()}</p>
                      </div>
                      <div>
                         <p style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94a3b8', margin: '0 0 0.15rem', letterSpacing: '0.05em' }}>Offer Price</p>
                         <p style={{ fontSize: '0.85rem', fontWeight: 800, color: selectedProductDetails.discount_price ? '#e11d48' : '#64748b', margin: 0 }}>
                            {selectedProductDetails.discount_price ? `৳${selectedProductDetails.discount_price.toLocaleString()}` : '-'}
                         </p>
                      </div>
                      <div>
                         <p style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94a3b8', margin: '0 0 0.15rem', letterSpacing: '0.05em' }}>Stock Available</p>
                         <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{selectedProductDetails.stock_count.toLocaleString()}</p>
                      </div>
                      <div>
                         <p style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94a3b8', margin: '0 0 0.15rem', letterSpacing: '0.05em' }}>Status</p>
                         <div style={{ marginTop: '0.1rem', fontSize: '0.65rem', fontWeight: 800 }}>
                            {selectedProductDetails.stock_count === 0 ? (
                              <span style={{ color: '#ef4444', background: '#fef2f2', padding: '0.25rem 0.5rem', borderRadius: '0.35rem' }}>Out Of Stock</span>
                            ) : selectedProductDetails.is_active ? (
                              <span style={{ color: '#10b981', background: '#ecfdf5', padding: '0.25rem 0.5rem', borderRadius: '0.35rem' }}>Published</span>
                            ) : (
                              <span style={{ color: '#64748b', background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '0.35rem' }}>Draft</span>
                            )}
                         </div>
                      </div>
                   </div>
                   
                   <div>
                      <h4 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', margin: '0 0 0.35rem', letterSpacing: '0.05em' }}>Product Description</h4>
                      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                         {selectedProductDetails.description || 'No description provided for this product.'}
                      </p>
                   </div>
                   
                   <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8' }}>
                      <span>Created At: {new Date(selectedProductDetails.created_at).toLocaleDateString()}</span>
                   </div>
                   
                </div>
                
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem', background: '#f8f9fc' }}>
                   <button 
                     onClick={() => {
                       const pid = selectedProductDetails.id;
                       setSelectedProductDetails(null);
                       setSelectedCategoryProducts(null);
                       navigate(`/admin/products?search=${pid}`);
                     }} 
                     style={{ flex: 1, background: '#0f172a', color: '#fff', border: 'none', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.1)' }}
                   >
                      <Edit2 size={14} /> Go to Inventory to Edit
                   </button>
                </div>
             </motion.div>
         )}
      </AnimatePresence>

      {/* Add/Edit Category Modal */}
      <AnimatePresence>
         {isModalOpen && (
           <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: '#fff', borderRadius: '2rem', width: '100%', maxWidth: 400, padding: '2rem', boxShadow: '0 20px 45px rgba(15, 23, 42, 0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                   <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
                   <button onClick={handleCloseModal} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
                </div>
                
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                   <div>
                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem', display: 'block', letterSpacing: '0.05em' }}>Category Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Enter category name"
                        value={categoryName} 
                        onChange={(e) => setCategoryName(e.target.value)} 
                        style={{ width: '100%', background: '#f8f9fc', border: '1px solid #f1f5f9', borderRadius: '1rem', padding: '0.85rem 1rem', fontSize: '0.85rem', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }} 
                      />
                   </div>

                   {/* Photo Uploader */}
                   <div>
                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem', display: 'block', letterSpacing: '0.05em' }}>Category Photo</label>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setCategoryImage(file);
                            setImagePreview(URL.createObjectURL(file));
                          }
                        }} 
                        style={{ display: 'none' }} 
                      />
                      
                      <div 
                        onClick={() => fileInputRef.current?.click()} 
                        style={{ 
                          width: '100%', 
                          height: 120, 
                          borderRadius: '1rem', 
                          border: '2px dashed #cbd5e1', 
                          background: '#f8f9fc', 
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          cursor: 'pointer', 
                          overflow: 'hidden', 
                          position: 'relative',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#e11d48'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                      >
                         {imagePreview ? (
                           <>
                             <img src={imagePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                             <button 
                               type="button" 
                               onClick={(e) => { 
                                 e.stopPropagation(); 
                                 setCategoryImage(null); 
                                 setImagePreview(null); 
                               }} 
                               style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', border: 'none', background: '#fff', color: '#e11d48', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                             >
                                <X size={14} />
                             </button>
                           </>
                         ) : (
                           <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', color: '#94a3b8' }}>
                              <ImageIcon size={26} />
                              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Upload Photo</span>
                              <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#cbd5e1' }}>Supports JPG, PNG</span>
                           </div>
                         )}
                      </div>
                   </div>

                   <div style={{ marginTop: '0.5rem' }}>
                      <button disabled={saving} style={{ width: '100%', background: '#e11d48', color: '#fff', border: 'none', padding: '1rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 20px rgba(225, 29, 72, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        {saving ? (
                          <>
                            <div style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            Saving Category...
                          </>
                        ) : (
                          'Save Category'
                        )}
                      </button>
                   </div>
                </form>
             </motion.div>
           </div>
         )}
      </AnimatePresence>

      <DeleteConfirmModal 
        isOpen={confirmModal.isOpen} 
        onClose={() => setConfirmModal({ isOpen: false, type: null, data: null })} 
        onConfirm={async () => { 
          setDeleting(true); 
          try { 
            await api.delete(`/categories/${confirmModal.data}`); 
            toast.success('Category removed successfully'); 
            fetchCategories(); 
          } catch { 
            toast.error('Failed to remove category'); 
          } 
          setConfirmModal({ isOpen: false }); 
          setDeleting(false); 
        }} 
        title="Delete Category"
        message="This action cannot be undone. All products under this category might become uncategorized. Please enter your password to confirm."
      />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AdminCategories;
