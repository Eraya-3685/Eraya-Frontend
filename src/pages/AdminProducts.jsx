import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Search, X, Upload, Star, ChevronDown, Filter, Tags, CheckCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api, { getImageUrl } from '../api/axios';
import toast from 'react-hot-toast';
import useClickOutside from '../hooks/useClickOutside';

/* ── Product Form Modal ─────────────────────────────── */
const ProductModal = ({ product, onClose, onSaved, onCategoryAdded }) => {
  const isEdit = !!product;
  const fileRef = useRef();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    base_price: product?.base_price || '',
    discount_price: product?.discount_price || '',
    stock_count: product?.stock_count || '',
    category_ids: product?.category_ids || [],
  });
  const [files, setFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState(null);
  const [newCategoryImagePreview, setNewCategoryImagePreview] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [existingImages, setExistingImages] = useState(product?.images || []);
  const dropdownRef = useRef();

  useClickOutside(dropdownRef, () => setIsDropdownOpen(false));

  const [errors, setErrors] = useState({});

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch {
      // toast error handled by parent if needed
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!form.name || form.name.trim().length < 3) newErrors.name = 'Name must be at least 3 characters';
    if (!form.base_price || parseFloat(form.base_price) <= 0) newErrors.base_price = 'Price must be greater than 0';
    if (form.discount_price && parseFloat(form.discount_price) >= parseFloat(form.base_price)) {
      newErrors.discount_price = 'Discount must be less than base price';
    }
    if (form.stock_count === '' || parseInt(form.stock_count) < 0) newErrors.stock_count = 'Stock cannot be negative';
    if (form.category_ids.length === 0) newErrors.category_ids = 'Select at least one category';
    if (!isEdit && files.length === 0) newErrors.images = 'Please upload at least one image';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    // Check if a category with the same name already exists (case-insensitive)
    const existing = categories.find(c =>
      c.name.toLowerCase() === newCategoryName.trim().toLowerCase()
    );
    if (existing) {
      // If it exists, just select it instead of creating a duplicate
      if (!form.category_ids.includes(existing.id)) {
        setForm({ ...form, category_ids: [...form.category_ids, existing.id] });
        toast.success(`"${existing.name}" already exists — selected it for you!`);
      } else {
        toast(`"${existing.name}" is already selected.`);
      }
      setNewCategoryName('');
      setShowAddCategory(false);
      return;
    }

    try {
      let imageUrl = '';
      if (newCategoryImage) {
        const formData = new FormData();
        formData.append('image', newCategoryImage);
        const uploadRes = await api.post('/upload', formData);
        imageUrl = uploadRes.data.url;
      }

      const res = await api.post('/categories', { 
        name: newCategoryName,
        image_url: imageUrl 
      });
      toast.success('Category added!');
      setCategories([...categories, res.data]);
      setForm({ ...form, category_ids: [...form.category_ids, res.data.id] });
      setNewCategoryName('');
      setNewCategoryImage(null);
      setNewCategoryImagePreview(null);
      setShowAddCategory(false);
      if (onCategoryAdded) onCategoryAdded();
    } catch {
      toast.error('Failed to add category');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      if (isEdit) {
        // Backend: PUT /products/{id}  (JSON body, no file upload for edit)
        await api.put(`/products/${product.id}`, {
          name: form.name,
          description: form.description || null,
          base_price: parseFloat(form.base_price),
          discount_price: form.discount_price ? parseFloat(form.discount_price) : null,
          stock_count: parseInt(form.stock_count),
          category_ids: form.category_ids,
          slug: form.name.toLowerCase().replace(/\s+/g, '-'),
          is_active: true,
          images: existingImages.map(img => ({
            id: img.id,
            product_id: img.product_id,
            image_url: img.image_url,
            is_primary: img.is_primary
          })),
        });
        toast.success('Product updated!');
      } else {
        // Backend: POST /products  (multipart/form-data)
        const data = new FormData();
        data.append('name', form.name);
        if (form.description) data.append('description', form.description);
        data.append('base_price', form.base_price);
        if (form.discount_price) data.append('discount_price', form.discount_price);
        data.append('stock_count', form.stock_count);
        form.category_ids.forEach(id => data.append('category_id', id));
        files.forEach((f) => data.append('images', f));
        data.append('primary_image_index', primaryImageIndex);

        await api.post('/products', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Product created!');
      }
      onSaved();
    } catch (error) {
      toast.error(error.response?.data || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-900">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Product Name *</label>
            <input
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className={`w-full border rounded-xl py-3 px-4 outline-none transition-all bg-slate-50 ${errors.name ? 'border-red-300 ring-2 ring-red-50' : 'border-slate-200 focus:ring-2 focus:ring-primary'}`}
              placeholder="e.g. Cashmere Overcoat"
            />
            {errors.name && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 ml-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary transition-all bg-slate-50 resize-none"
              placeholder="Product description..."
            />
          </div>

          {/* Price row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Base Price (৳) *</label>
              <input
                name="base_price"
                type="number"
                min="0"
                step="0.01"
                required
                value={form.base_price}
                onChange={handleChange}
                className={`w-full border rounded-xl py-3 px-4 outline-none transition-all bg-slate-50 ${errors.base_price ? 'border-red-300 ring-2 ring-red-50' : 'border-slate-200 focus:ring-2 focus:ring-primary'}`}
                placeholder="0.00"
              />
              {errors.base_price && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 ml-1">{errors.base_price}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Discount Price (৳)</label>
              <input
                name="discount_price"
                type="number"
                min="0"
                step="0.01"
                value={form.discount_price}
                onChange={handleChange}
                className={`w-full border rounded-xl py-3 px-4 outline-none transition-all bg-slate-50 ${errors.discount_price ? 'border-red-300 ring-2 ring-red-50' : 'border-slate-200 focus:ring-2 focus:ring-primary'}`}
                placeholder="Optional"
              />
              {errors.discount_price && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 ml-1">{errors.discount_price}</p>}
            </div>
          </div>

          {/* Stock + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Stock Count *</label>
              <input
                name="stock_count"
                type="number"
                min="0"
                required
                value={form.stock_count}
                onChange={handleChange}
                className={`w-full border rounded-xl py-3 px-4 outline-none transition-all bg-slate-50 ${errors.stock_count ? 'border-red-300 ring-2 ring-red-50' : 'border-slate-200 focus:ring-2 focus:ring-primary'}`}
                placeholder="0"
              />
              {errors.stock_count && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 ml-1">{errors.stock_count}</p>}
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-slate-700">Category</label>
                <button
                  type="button"
                  onClick={() => setShowAddCategory(!showAddCategory)}
                  className="text-[10px] text-secondary font-bold uppercase tracking-wider hover:underline"
                >
                  {showAddCategory ? 'Cancel' : '+ Add New'}
                </button>
              </div>

              {showAddCategory ? (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex gap-3">
                    {/* Category Image Quick Upload */}
                    <div 
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setNewCategoryImage(file);
                            const reader = new FileReader();
                            reader.onloadend = () => setNewCategoryImagePreview(reader.result);
                            reader.readAsDataURL(file);
                          }
                        };
                        input.click();
                      }}
                      className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-200 bg-white flex items-center justify-center cursor-pointer hover:border-primary transition-all overflow-hidden shrink-0"
                    >
                      {newCategoryImagePreview ? (
                        <img src={newCategoryImagePreview} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <Upload className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCategory();
                        }
                      }}
                      className="flex-grow border border-slate-200 rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-primary transition-all bg-white text-sm"
                      placeholder="New category name..."
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCategory(false);
                        setNewCategoryName('');
                        setNewCategoryImage(null);
                        setNewCategoryImagePreview(null);
                      }}
                      className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-200 rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="flex-1 bg-slate-900 text-white py-2 rounded-lg hover:bg-primary transition-all text-xs font-bold"
                    >
                      Save Category
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(!isDropdownOpen);
                      if (errors.category_ids) setErrors({ ...errors, category_ids: null });
                    }}
                    className={`w-full border rounded-xl py-2.5 px-4 outline-none transition-all bg-slate-50 flex flex-wrap gap-2 items-center text-sm min-h-[50px] ${errors.category_ids ? 'border-red-300 ring-2 ring-red-50' : 'border-slate-200 focus:ring-2 focus:ring-primary'}`}
                  >
                    {form.category_ids.length > 0 ? (
                      form.category_ids.map(id => {
                        const cat = categories.find(c => c.id === id);
                        return (
                          <span key={id} className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                            {cat?.name || 'Loading...'}
                            <X
                              className="w-3 h-3 cursor-pointer hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                setForm({ ...form, category_ids: form.category_ids.filter(cid => cid !== id) });
                              }}
                            />
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-slate-400">Select Categories</span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-slate-400 ml-auto transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {errors.category_ids && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1.5 ml-1">{errors.category_ids}</p>}

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute z-20 left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl overflow-hidden flex flex-col"
                      >
                        <div className="p-2 border-b border-slate-100">
                          <input
                            type="text"
                            autoFocus
                            placeholder="Search category..."
                            value={categorySearchTerm}
                            onChange={(e) => setCategorySearchTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="p-1 max-h-48 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setForm({ ...form, category_ids: [] });
                              setIsDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
                          >
                            Clear All Selections
                          </button>
                          {categories
                            .filter(c => c.name.toLowerCase().includes(categorySearchTerm.toLowerCase()))
                            .map((cat) => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  const exists = form.category_ids.includes(cat.id);
                                  if (exists) {
                                    setForm({ ...form, category_ids: form.category_ids.filter(id => id !== cat.id) });
                                  } else {
                                    setForm({ ...form, category_ids: [...form.category_ids, cat.id] });
                                  }
                                  setIsDropdownOpen(false);
                                  setCategorySearchTerm('');
                                }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between mt-1 ${form.category_ids.includes(cat.id)
                                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                  : 'text-slate-600 hover:bg-slate-100'
                                  }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span>{cat.name}</span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${form.category_ids.includes(cat.id) ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    {cat.product_count}
                                  </span>
                                </div>
                                {form.category_ids.includes(cat.id) && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                )}
                              </button>
                            ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* Existing Images — only for edit */}
          {isEdit && existingImages.length > 0 && (
            <div>
              <p className="block text-sm font-semibold text-slate-700 mb-2">Display Picture Selection</p>
              <p className="text-xs text-slate-500 mb-3">Click on an image to set it as the primary display picture.</p>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {existingImages.map((img, index) => (
                  <div
                    key={img.id}
                    onClick={() => {
                      const updated = existingImages.map((image, i) => ({
                        ...image,
                        is_primary: i === index
                      }));
                      setExistingImages(updated);
                    }}
                    className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${img.is_primary ? 'border-primary ring-2 ring-primary/20 shadow-lg scale-105 z-10' : 'border-slate-200 hover:border-slate-400'
                      }`}
                  >
                    <img
                      src={getImageUrl(img.image_url)}
                      alt={`Current ${index}`}
                      className="w-full h-full object-cover"
                    />
                    {img.is_primary && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center">
                        <Star className="w-3 h-3 fill-current" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Upload — only for create */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Product Images</label>
              <div
                onClick={() => fileRef.current.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-slate-50 transition-all"
              >
                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Click to upload images</p>
                <p className="text-slate-400 text-xs mt-1">PNG, JPG, WebP supported</p>
                {files.length > 0 && (
                  <p className="text-primary font-bold text-sm mt-2">{files.length} file(s) selected</p>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const selectedFiles = Array.from(e.target.files);
                  const oversizedFiles = selectedFiles.filter(f => f.size > 2 * 1024 * 1024);

                  if (oversizedFiles.length > 0) {
                    toast.error('Some files are larger than 2MB and will be ignored.');
                  }

                  const validFiles = selectedFiles.filter(f => f.size <= 2 * 1024 * 1024);
                  setFiles(validFiles);
                  setPrimaryImageIndex(0);
                }}
              />

              {/* Image Previews & Primary Selection */}
              {files.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Select Display Picture</p>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        onClick={() => setPrimaryImageIndex(index)}
                        className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${primaryImageIndex === index ? 'border-primary ring-2 ring-primary/20 shadow-lg scale-105 z-10' : 'border-transparent hover:border-slate-300'
                          }`}
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index}`}
                          className="w-full h-full object-cover"
                        />
                        {primaryImageIndex === index && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center">
                            <Star className="w-3 h-3 fill-current" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-container transition-all disabled:opacity-60"
            >
              {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

/* ── Main AdminProducts Page ─────────────────────────── */
const AdminProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const selectedCategories = useMemo(() =>
    searchParams.getAll('category').map(Number),
    [searchParams]
  );
  const [modal, setModal] = useState(null); // null | 'create' | product object (edit)
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [filterSearchTerm, setFilterSearchTerm] = useState('');
  const page = parseInt(searchParams.get('page')) || 1;
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const filterDropdownRef = useRef();
  useClickOutside(filterDropdownRef, () => setIsFilterDropdownOpen(false));

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch {
      toast.error('Failed to load categories');
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get(`/products?page=${page}&limit=${limit}&search=${search}`);
      setProducts(res.data?.data || []);
      setTotalProducts(res.data?.total_items || 0);
      setTotalPages(res.data?.total_pages || 1);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      // Backend: DELETE /products/{id} (admin only)
      await api.delete(`/products/${product.id}`);
      toast.success('Product deleted');
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (error) {
      toast.error(error.response?.data || 'Failed to delete');
    }
  };

  const getPrimaryImage = (images) => {
    if (!images?.length) return null;
    return (images.find((i) => i.is_primary) || images[0]).image_url;
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(p => p.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} products? This cannot be undone.`)) return;
    try {
      await api.post('/products/bulk-delete', { ids: selectedIds });
      toast.success(`${selectedIds.length} products deleted`);
      setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)));
      setSelectedIds([]);
    } catch {
      toast.error('Bulk delete failed');
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || (p.category_ids && p.category_ids.some(id => selectedCategories.includes(id)));
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="px-4 py-8 max-w-screen-2xl mx-auto min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-5xl font-black font-display text-slate-900 tracking-tight mb-2">
            Inventory
          </h1>
          <p className="text-slate-500 flex items-center gap-2 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
            Manage and monitor your product collection
          </p>
        </div>
        <button
          onClick={() => setModal('create')}
          className="group bg-slate-900 text-white px-10 py-4 rounded-[24px] font-bold flex items-center gap-4 hover:bg-primary transition-all shadow-2xl shadow-slate-900/10 hover:shadow-primary/20 active:scale-95"
        >
          <div className="p-1.5 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
            <Plus className="w-5 h-5" />
          </div>
          <span className="tracking-wide">Add New Product</span>
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-3">Inventory Status</p>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-5xl font-black text-slate-900 leading-none mb-1">{filtered.length}</h2>
              <p className="text-sm font-bold text-slate-400">
                {search || selectedCategories.length > 0 ? 'Results Found' : 'Total Active Products'}
              </p>
            </div>
            <div className={`p-4 rounded-2xl ${search || selectedCategories.length > 0 ? 'bg-blue-50 text-blue-500' : 'bg-primary/10 text-primary'}`}>
              <Tags className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-3">Bulk Actions</p>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-5xl font-black text-slate-900 leading-none mb-1">{selectedIds.length}</h2>
              <p className="text-sm font-bold text-slate-400">Products Selected</p>
            </div>
            <div className={`p-4 rounded-2xl ${selectedIds.length > 0 ? 'bg-amber-50 text-amber-500 animate-bounce' : 'bg-slate-50 text-slate-300'}`}>
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white/60 backdrop-blur-xl rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/50 mb-10 sticky top-8 z-30">
        <div className="p-6 flex flex-col lg:flex-row gap-6 justify-between items-center">
          <div className="relative flex-grow max-w-xl w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or slug..."
              className="w-full bg-white/80 border border-slate-200 rounded-[16px] py-3 pl-12 pr-6 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-inner"
            />
          </div>

          <div className="relative min-w-[300px] w-full lg:w-auto" ref={filterDropdownRef}>
            <button
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className={`w-full flex items-center justify-between bg-white border rounded-[16px] py-3 px-5 text-sm font-black transition-all active:scale-[0.98] shadow-sm ${selectedCategories.length > 0 ? 'border-primary text-primary ring-4 ring-primary/5' : 'border-slate-200 text-slate-700 hover:border-primary'
                }`}
            >
              <div className="flex items-center gap-4">
                <Filter className={`w-5 h-5 ${selectedCategories.length > 0 ? 'text-primary' : 'text-slate-300'}`} />
                <span className="truncate max-w-[150px] uppercase tracking-widest">
                  {selectedCategories.length === 0
                    ? 'All Categories'
                    : selectedCategories.length === 1
                      ? categories.find(c => c.id === selectedCategories[0])?.name
                      : `${selectedCategories.length} Selected`}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isFilterDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  className="absolute top-full right-0 w-full md:w-[360px] mt-4 bg-white rounded-[32px] shadow-[0_30px_100px_rgba(0,0,0,0.15)] border border-slate-100 z-[70] overflow-hidden"
                >
                  <div className="p-2 border-b border-slate-50 flex items-center gap-2 bg-slate-50/30">
                    <Search className="w-3 h-3 text-slate-300" />
                    <input
                      type="text"
                      placeholder="Search categories..."
                      value={filterSearchTerm}
                      onChange={(e) => setFilterSearchTerm(e.target.value)}
                      className="flex-1 bg-transparent border-none py-0.5 text-[10px] font-bold outline-none placeholder:text-slate-200"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="max-h-[400px] overflow-y-auto p-2 scrollbar-hide">
                    <button
                      onClick={() => {
                        searchParams.delete('category');
                        setSearchParams(searchParams);
                        setFilterSearchTerm('');
                      }}
                      className={`w-full text-left px-5 py-3.5 text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-between mb-2 ${selectedCategories.length === 0 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-slate-50'
                        }`}
                    >
                      <span>Clear All Filters</span>
                      {selectedCategories.length === 0 && <CheckCircle className="w-4 h-4" />}
                    </button>

                    <div className="h-px bg-slate-100 my-2 mx-4" />

                    {categories
                      .filter(c => c.name.toLowerCase().includes(filterSearchTerm.toLowerCase()))
                      .map(cat => {
                        const isSelected = selectedCategories.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            onClick={() => {
                              let newCats = isSelected
                                ? selectedCategories.filter(id => id !== cat.id)
                                : [...selectedCategories, cat.id];
                              searchParams.delete('category');
                              newCats.forEach(id => searchParams.append('category', id));
                              setSearchParams(searchParams);
                            }}
                            className={`w-full text-left px-5 py-4 text-xs font-bold rounded-2xl transition-all flex items-center justify-between mb-1 group ${isSelected ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                              }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-slate-200 group-hover:border-primary'
                                }`}>
                                {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                              </div>
                              <span className="uppercase tracking-wide">{cat.name}</span>
                            </div>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'
                              }`}>
                              {cat.product_count}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Filter Tags */}
        <AnimatePresence>
          {selectedCategories.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-8 pb-8 flex flex-wrap gap-3 overflow-hidden"
            >
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mr-2 border-r border-slate-100 pr-4">
                <Filter className="w-3 h-3" />
                Active
              </div>
              {selectedCategories.map(catId => {
                const cat = categories.find(c => c.id === catId);
                if (!cat) return null;
                return (
                  <motion.button
                    layout
                    key={cat.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={() => {
                      const newCats = selectedCategories.filter(id => id !== cat.id);
                      searchParams.delete('category');
                      newCats.forEach(id => searchParams.append('category', id));
                      setSearchParams(searchParams);
                    }}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all group shadow-xl shadow-slate-900/10"
                  >
                    {cat.name}
                    <X className="w-3 h-3 text-white/50 group-hover:text-white" />
                  </motion.button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6 bg-white">
            <div className="w-16 h-16 border-[6px] border-slate-100 border-t-primary rounded-full animate-spin" />
            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Loading Inventory...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 bg-slate-50/20">
            <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-50">
              <Search className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">No match found</h3>
            <p className="text-slate-400 font-medium mt-2">Try refined search terms or broad filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-6 w-10 text-center">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded-lg border-2 border-slate-200 text-primary focus:ring-4 focus:ring-primary/10 cursor-pointer transition-all"
                      checked={filtered.length > 0 && selectedIds.length === filtered.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Product</th>
                  <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Categories</th>
                  <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Price</th>
                  <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Stock</th>
                  <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Rating</th>
                  <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Status</th>
                  <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((product) => (
                  <tr
                    key={product.id}
                    className={`group transition-all duration-300 hover:bg-slate-50/80 ${selectedIds.includes(product.id) ? 'bg-primary/5' : ''}`}
                  >
                    <td className="px-4 py-8 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded-lg border-2 border-slate-200 text-primary focus:ring-4 focus:ring-primary/10 cursor-pointer transition-all"
                        checked={selectedIds.includes(product.id)}
                        onChange={() => toggleSelect(product.id)}
                      />
                    </td>
                    <td className="px-4 py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-[16px] bg-white border border-slate-100 overflow-hidden flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-700">
                          {getPrimaryImage(product.images) ? (
                            <img
                              src={getImageUrl(getPrimaryImage(product.images))}
                              className="w-full h-full object-cover"
                              alt={product.name}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-200"><Tags className="w-6 h-6" /></div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate text-sm tracking-tight mb-0.5">{product.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 truncate uppercase tracking-widest opacity-60">ID: {product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                        {product.categories && product.categories.length > 0 ? (
                          product.categories.map(cat => (
                            <span key={cat.id} className="bg-white border border-slate-100 text-slate-600 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-sm">
                              {cat.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-300 text-[10px] font-bold uppercase tracking-widest opacity-30 italic">Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-8">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-base tracking-tighter">৳{product.base_price}</span>
                        {product.discount_price && (
                          <span className="text-[9px] font-black text-red-400 line-through opacity-60 uppercase tracking-widest mt-0.5">PROMO: ৳{product.discount_price}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-8">
                      <div className="flex flex-col gap-2 min-w-[100px]">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`font-black text-base ${product.stock_count <= 5 ? 'text-red-500' : 'text-slate-900'}`}>
                            {product.stock_count}
                          </span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Units</span>
                        </div>
                        <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(product.stock_count * 5, 100)}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)] ${product.stock_count <= 5 ? 'bg-gradient-to-r from-red-400 to-red-600' : 'bg-gradient-to-r from-primary to-secondary'}`}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-8">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-xl border border-yellow-100">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-black tracking-tight">
                            {product.average_rating > 0 ? product.average_rating.toFixed(1) : 'NEW'}
                          </span>
                        </div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">({product.total_reviews})</span>
                      </div>
                    </td>
                    <td className="px-4 py-8">
                      <span className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] px-4 py-2 rounded-full border-2 ${product.is_active
                        ? 'bg-green-50 text-green-600 border-green-100'
                        : 'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${product.is_active ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                        {product.is_active ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-4 py-8 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <button
                          onClick={() => setModal(product)}
                          className="p-3 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-[12px] transition-all active:scale-90 shadow-sm"
                          title="Configuration"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-[12px] transition-all active:scale-90 shadow-sm"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Showing {products.length} of {totalProducts} items
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => {
                  searchParams.set('page', page - 1);
                  setSearchParams(searchParams);
                }}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 disabled:opacity-30 hover:border-primary hover:text-primary transition-all active:scale-95 shadow-sm"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => {
                      searchParams.set('page', i + 1);
                      setSearchParams(searchParams);
                    }}
                    className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all active:scale-90 shadow-sm ${page === i + 1
                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-primary'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                disabled={page === totalPages}
                onClick={() => {
                  searchParams.set('page', page + 1);
                  setSearchParams(searchParams);
                }}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 disabled:opacity-30 hover:border-primary hover:text-primary transition-all active:scale-95 shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
          )}
          </>
        )}
      </div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 150, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 150, opacity: 0, x: '-50%' }}
            className="fixed bottom-12 left-1/2 bg-slate-900 text-white px-10 py-6 rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.4)] z-[90] flex items-center gap-12 border border-white/10 backdrop-blur-3xl"
          >
            <div className="flex items-center gap-6 pr-12 border-r border-white/10">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-[20px] flex items-center justify-center text-lg font-black shadow-2xl shadow-primary/40 animate-pulse">
                {selectedIds.length}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">Selection</p>
                <p className="text-base font-bold text-white tracking-tight">Items Selected</p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <button
                onClick={() => setSelectedIds([])}
                className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-all hover:scale-110"
              >
                Reset
              </button>
              <button
                onClick={handleBulkDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-10 py-4 rounded-[20px] font-black text-sm uppercase tracking-widest transition-all flex items-center gap-4 shadow-2xl shadow-red-500/40 active:scale-95 group"
              >
                <Trash2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Delete Selected
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence mode="wait">
        {modal && (
          <ProductModal
            product={modal === 'create' ? null : modal}
            onClose={() => setModal(null)}
            onSaved={async () => {
              setModal(null);
              await Promise.all([fetchProducts(), fetchCategories()]);
            }}
            onCategoryAdded={fetchCategories}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProducts;
