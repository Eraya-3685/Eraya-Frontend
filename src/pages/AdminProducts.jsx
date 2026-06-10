import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit, Trash2, Search, X, Package,
  Filter, List, Grid, MoreVertical, DollarSign, ShoppingBag, Users,
  Download, ArrowRight, Check, TrendingUp, RefreshCcw, Printer
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api, { getImageUrl } from '../api/axios';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import TakaIcon from '../components/TakaIcon';
import Pagination from '../components/Pagination';


const AdminProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => {
    return searchParams.get('search') || '';
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filterCategoryIds, setFilterCategoryIds] = useState(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      const catId = parseInt(categoryParam, 10);
      if (!isNaN(catId)) {
        return [catId];
      }
    }
    return [];
  });

  // Add/Edit Product states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [stockCount, setStockCount] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState(null);
  const [newCatImagePreview, setNewCatImagePreview] = useState(null);
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [creatingCat, setCreatingCat] = useState(false);
  const newCatFileInputRef = useRef(null);
  const [isActive, setIsActive] = useState(true);
  const [productImages, setProductImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0); // index across (existingImages + imagePreviews)
  const [saving, setSaving] = useState(false);
  const [colors, setColors] = useState('');
  const [sizes, setSizes] = useState('');
  const [variationStock, setVariationStock] = useState([]);

  // Delete confirm modal state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef(null);
  const fetchIdRef = useRef(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1200);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth <= 1200);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync filters from URL search params on mount & clear them to allow local overrides
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    const idParam = searchParams.get('id');

    if (categoryParam || searchParam || idParam) {
      if (categoryParam) {
        const catId = parseInt(categoryParam, 10);
        if (!isNaN(catId)) {
          setFilterCategoryIds([catId]);
        }
      }
      if (searchParam) {
        setSearch(searchParam);
      }
      if (idParam) {
        setSearch(idParam);
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    setPage(1);
  }, [search, filterStatus, filterCategoryIds]);

  useEffect(() => {
    fetchProducts();
  }, [search, filterStatus, filterCategoryIds, page, limit]);

  const sortedProducts = React.useMemo(() => {
    let sortableItems = [...products];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Fallback for special keys
        if (sortConfig.key === 'created_at') {
          aVal = new Date(a.created_at || 0).getTime();
          bVal = new Date(b.created_at || 0).getTime();
        } else if (sortConfig.key === 'discount_price') {
          aVal = a.discount_price || 0;
          bVal = b.discount_price || 0;
        } else if (sortConfig.key === 'base_price') {
          aVal = a.base_price || 0;
          bVal = b.base_price || 0;
        } else if (sortConfig.key === 'stock_count') {
          aVal = a.stock_count || 0;
          bVal = b.stock_count || 0;
        } else if (sortConfig.key === 'name') {
          aVal = (a.name || '').toLowerCase();
          bVal = (b.name || '').toLowerCase();
        }

        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [products, sortConfig]);

  const handleSortRequest = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch {
      toast.error('Failed to load categories');
    }
  };

  const fetchProducts = async () => {
    const currentFetchId = ++fetchIdRef.current;
    setLoading(true);
    try {
      let url = `/products?search=${search}&admin=true&page=${page}&limit=${limit}`;
      if (filterCategoryIds.length > 0) {
        filterCategoryIds.forEach(id => {
          url += `&category_id=${id}`;
        });
      }
      const res = await api.get(url);
      if (currentFetchId !== fetchIdRef.current) return;

      let data = res.data?.data || [];
      const pagination = res.data?.pagination;
      if (pagination) {
        setTotalPages(pagination.total_pages || 1);
        setTotalItems(pagination.total_items || 0);
      } else {
        setTotalPages(1);
        setTotalItems(data.length);
      }

      // Client-side status filter
      if (filterStatus === 'Active') data = data.filter(p => p.is_active && p.stock_count > 0);
      else if (filterStatus === 'Drafts') data = data.filter(p => !p.is_active);
      else if (filterStatus === 'Archived') data = data.filter(p => p.stock_count === 0);
      setProducts(data);

      // Auto-open specific product details if searched/navigated by ID
      const targetId = parseInt(search, 10);
      if (!isNaN(targetId)) {
        const matched = data.find(p => p.id === targetId);
        if (matched) {
          setSelectedProductDetails(matched);
          setActiveImageIndex(0);
        }
      }
    } catch {
      if (currentFetchId === fetchIdRef.current) {
        toast.error('Failed to load products');
      }
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
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
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.85rem', borderRadius: '1rem', background: style.bg, color: style.text, fontSize: '0.7rem', fontWeight: 800 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
        {style.label}
      </div>
    );
  };

  const handleCreateCategoryInline = async () => {
    if (!newCatName.trim()) return;
    setCreatingCat(true);
    try {
      let imageUrl = '';
      if (newCatImage) {
        const formData = new FormData();
        formData.append('image', newCatImage);
        const uploadRes = await api.post('/upload', formData);
        imageUrl = uploadRes.data.url;
      }

      const res = await api.post('/categories', { name: newCatName.trim(), image_url: imageUrl });
      const createdCategory = res.data;

      // Update local categories list
      setCategories(prev => [...prev, createdCategory]);

      // Auto select the newly created category
      setSelectedCategoryIds(prev => [...prev, createdCategory.id]);

      setNewCatName('');
      setNewCatImage(null);
      setNewCatImagePreview(null);
      setShowNewCatInput(false);
      toast.success(`Category "${createdCategory.name}" added and selected`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create category');
    } finally {
      setCreatingCat(false);
    }
	};

  const getCombinations = () => {
    const colorList = colors.split(',').map(c => c.trim()).filter(Boolean);
    const sizeList = sizes.split(',').map(s => s.trim()).filter(Boolean);
    
    if (colorList.length === 0 && sizeList.length === 0) return [];
    
    if (colorList.length > 0 && sizeList.length === 0) {
      return colorList.map(c => ({ color: c, size: 'one size' }));
    }
    if (colorList.length === 0 && sizeList.length > 0) {
      return sizeList.map(s => ({ color: 'one colour', size: s }));
    }
    
    const comb = [];
    colorList.forEach(c => {
      sizeList.forEach(s => {
        comb.push({ color: c, size: s });
      });
    });
    return comb;
  };

  const combinations = getCombinations();

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setBasePrice('');
    setDiscountPrice('');
    setStockCount('');
    setSelectedCategoryIds([]);
    setNewCatName('');
    setNewCatImage(null);
    setNewCatImagePreview(null);
    setShowNewCatInput(false);
    setIsActive(true);
    setProductImages([]);
    setImagePreviews([]);
    setExistingImages([]);
    setPrimaryImageIndex(0);
    setColors('');
    setSizes('');
    setVariationStock([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setName(product.name || '');
    setDescription(product.description || '');
    setBasePrice(product.base_price || '');
    setDiscountPrice(product.discount_price || '');
    setStockCount(product.stock_count || '');
    setSelectedCategoryIds(product.categories?.map(c => c.id) || (product.category_id ? [product.category_id] : []));
    setNewCatName('');
    setNewCatImage(null);
    setNewCatImagePreview(null);
    setShowNewCatInput(false);
    setIsActive(product.is_active !== undefined ? product.is_active : true);
    setProductImages([]);
    setImagePreviews([]);
    setExistingImages(product.images || []);
    setColors(product.colors ? product.colors.join(', ') : '');
    setSizes(product.sizes ? product.sizes.join(', ') : '');
    setVariationStock(product.variation_stock || []);
    // set primary index to the first image marked as primary (fallback: 0)
    const primIdx = (product.images || []).findIndex(img => img.is_primary);
    setPrimaryImageIndex(primIdx >= 0 ? primIdx : 0);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !basePrice || !stockCount) {
      toast.error('Please fill in name, base price, and stock count');
      return;
    }

    setSaving(true);
    try {
      if (editingProduct) {
        // Edit product flow (JSON PUT request)
        const newUploadedUrls = [];
        for (const file of productImages) {
          const uploadForm = new FormData();
          uploadForm.append('image', file);
          const uploadRes = await api.post('/upload', uploadForm);
          newUploadedUrls.push(uploadRes.data.url);
        }

        const finalImages = [
          ...existingImages.map((img, i) => ({ image_url: img.image_url, is_primary: i === primaryImageIndex })),
          ...newUploadedUrls.map((url, i) => ({ image_url: url, is_primary: (existingImages.length + i) === primaryImageIndex }))
        ];

        const data = {
          name,
          description: description || null,
          base_price: parseFloat(basePrice),
          discount_price: discountPrice ? parseFloat(discountPrice) : null,
          stock_count: parseInt(stockCount),
          category_ids: selectedCategoryIds.map(id => parseInt(id)),
          images: finalImages,
          is_active: isActive,
          colors: colors.split(',').map(c => c.trim()).filter(Boolean),
          sizes: sizes.split(',').map(s => s.trim()).filter(Boolean),
          variation_stock: variationStock
            .filter(v => combinations.some(c => c.color === v.color && c.size === v.size))
            .map(v => ({ color: v.color, size: v.size, stock: parseInt(v.stock) || 0 }))
        };

        await api.put(`/products/${editingProduct.id}`, data);
        toast.success('Product updated successfully');
      } else {
        // Create product flow (Multipart Form request)
        const formData = new FormData();
        formData.append('name', name);
        if (description) {
          formData.append('description', description);
        }
        formData.append('base_price', basePrice);
        if (discountPrice) {
          formData.append('discount_price', discountPrice);
        }
        formData.append('stock_count', stockCount);
        formData.append('is_active', isActive ? 'true' : 'false');
        formData.append('colors', colors.split(',').map(c => c.trim()).filter(Boolean).join(','));
        formData.append('sizes', sizes.split(',').map(s => s.trim()).filter(Boolean).join(','));
        formData.append('variation_stock', JSON.stringify(
          variationStock
            .filter(v => combinations.some(c => c.color === v.color && c.size === v.size))
            .map(v => ({ color: v.color, size: v.size, stock: parseInt(v.stock) || 0 }))
        ));

        selectedCategoryIds.forEach(id => {
          formData.append('category_id', String(id));
        });

        productImages.forEach(file => {
          formData.append('images', file);
        });
        // primary_image_index is relative to the full list; existing images come first
        formData.append('primary_image_index', String(primaryImageIndex));

        await api.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Product created successfully');
      }

      fetchProducts();
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    setDeleting(true);
    try {
      await api.delete(`/products/${confirmModal.id}`);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch {
      toast.error('Failed to delete product');
    } finally {
      setDeleting(false);
      setConfirmModal({ isOpen: false, id: null });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} products?`)) return;

    try {
      await api.post('/products/bulk-delete', { ids: selectedIds });
      toast.success('Selected products deleted successfully');
      setSelectedIds([]);
      fetchProducts();
    } catch {
      toast.error('Failed to delete selected products');
    }
  };

  const handlePrint = (targetProducts) => {
    if (!targetProducts || targetProducts.length === 0) {
      toast.error('No products available to print');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print the report');
      return;
    }

    const dateStr = new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const rowsHtml = targetProducts.map(p => {
      const productId = `#KMI${p.id}`;
      const name = p.name || '';
      const category = p.categories && p.categories.length > 0 ? p.categories.map(c => c.name).join(', ') : 'General';
      const basePrice = `৳${p.base_price.toLocaleString()}`;
      const discountPrice = p.discount_price ? `৳${p.discount_price.toLocaleString()}` : '-';
      const stockCount = p.stock_count.toLocaleString();

      let status = 'Draft';
      if (p.stock_count === 0) status = 'Out Stock';
      else if (!p.is_active) status = 'Inactive';
      else if (p.is_active) status = 'Published';

      const createdAt = p.created_at ? new Date(p.created_at).toLocaleDateString() : '-';

      return `
        <tr>
          <td><strong>${productId}</strong></td>
          <td>${name}</td>
          <td>${category}</td>
          <td>${basePrice}</td>
          <td>${discountPrice}</td>
          <td>${stockCount}</td>
          <td><span class="status-pill status-${status.toLowerCase().replace(' ', '-')}">${status}</span></td>
          <td>${createdAt}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Eraya Inventory Report</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 2rem;
            line-height: 1.5;
          }
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 1.5rem;
            margin-bottom: 2rem;
          }
          .logo-area h1 {
            margin: 0;
            font-size: 2rem;
            font-weight: 800;
            color: #e11d48;
            letter-spacing: -0.02em;
          }
          .logo-area p {
            margin: 0.25rem 0 0 0;
            color: #64748b;
            font-size: 0.85rem;
            font-weight: 600;
          }
          .meta-area {
            text-align: right;
            color: #64748b;
            font-size: 0.85rem;
            font-weight: 600;
          }
          .summary-strip {
            display: flex;
            gap: 2rem;
            background: #f8f9fc;
            padding: 1rem 1.5rem;
            border-radius: 1rem;
            margin-bottom: 2rem;
            border: 1px solid #f1f5f9;
          }
          .summary-item {
            font-size: 0.85rem;
            font-weight: 600;
            color: #475569;
          }
          .summary-item strong {
            color: #0f172a;
            font-size: 1rem;
            margin-left: 0.25rem;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.8rem;
          }
          th {
            background: #f8f9fc;
            color: #64748b;
            font-weight: 800;
            
            font-size: 0.65rem;
            letter-spacing: 0.05em;
            padding: 1rem;
            border-bottom: 2px solid #e2e8f0;
          }
          td {
            padding: 1rem;
            border-bottom: 1px solid #f1f5f9;
            color: #334155;
          }
          tr:nth-child(even) {
            background-color: #fafbfc;
          }
          .status-pill {
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.6rem;
            border-radius: 0.5rem;
            font-size: 0.65rem;
            font-weight: 800;
          }
          .status-published {
            background: #ecfdf5;
            color: #10b981;
          }
          .status-out-stock {
            background: #fff7ed;
            color: #f97316;
          }
          .status-inactive {
            background: #fef2f2;
            color: #ef4444;
          }
          .status-draft {
            background: #f1f5f9;
            color: #64748b;
          }
          @media print {
            body {
              padding: 0;
            }
            .summary-strip {
              background: #f8f9fc !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            th {
              background: #f8f9fc !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .status-published {
              background: #ecfdf5 !important;
              color: #10b981 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .status-out-stock {
              background: #fff7ed !important;
              color: #f97316 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .status-inactive {
              background: #fef2f2 !important;
              color: #ef4444 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .status-draft {
              background: #f1f5f9 !important;
              color: #64748b !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="logo-area">
            <h1>ERAYA</h1>
            <p>Inventory Control & Product Catalog Report</p>
          </div>
          <div class="meta-area">
            <div>Generated: ${dateStr}</div>
            <div>Source: Eraya Admin Dashboard</div>
          </div>
        </div>

        <div class="summary-strip">
          <div class="summary-item">Total Listed: <strong>${targetProducts.length}</strong></div>
          <div class="summary-item">Published: <strong>${targetProducts.filter(p => p.is_active && p.stock_count > 0).length}</strong></div>
          <div class="summary-item">Out of Stock: <strong>${targetProducts.filter(p => p.stock_count === 0).length}</strong></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Base Price</th>
              <th>Offer Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    toast.success('Print report generated successfully!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '10rem' }}>

      {/* Header Area */}
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>Inventory</h1>
        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', margin: '0.5rem 0 0' }}>Manage your product listings and availability</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.5rem' }}>
        {[
          { label: 'Total Products', value: products.length || 0, icon: Package, color: '#e11d48' },
          { label: 'Published Items', value: products.filter(p => p.is_active && p.stock_count > 0).length || 0, icon: Check, color: '#10b981' },
          { label: 'Out of Stock', value: products.filter(p => p.stock_count === 0).length || 0, icon: X, color: '#f59e0b' },
        ].map((card, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: '1.5rem', padding: '1.15rem 1.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', margin: '0 0 0.25rem' }}>{card.label}</p>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>{card.value}</h3>
              </div>
              <div style={{ width: 40, height: 40, background: `${card.color}10`, borderRadius: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                <card.icon style={{ width: 18, height: 18 }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Pills Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', background: '#fff', border: '1px solid #f1f5f9', padding: '0.85rem 1.25rem', borderRadius: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Filter size={12} /> Filter:
        </span>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div
            onClick={() => { setFilterCategoryIds([]); setSearch(''); }}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '0.75rem',
              fontSize: '0.7rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: filterCategoryIds.length === 0 ? '#0f172a' : '#f8f9fc',
              color: filterCategoryIds.length === 0 ? '#fff' : '#64748b',
              border: '1px solid transparent',
              userSelect: 'none'
            }}
          >
            All Categories
          </div>

          {categories.map(cat => {
            const isSelected = filterCategoryIds.includes(cat.id);
            return (
              <div
                key={cat.id}
                onClick={() => setFilterCategoryIds(prev => isSelected ? prev.filter(id => id !== cat.id) : [...prev, cat.id])}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: isSelected ? '#e11d48' : '#f8f9fc',
                  color: isSelected ? '#fff' : '#64748b',
                  border: '1px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  userSelect: 'none'
                }}
              >
                {cat.name}
                {isSelected && <span style={{ fontSize: 9 }}>×</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Search input and refresh button */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1, maxWidth: isMobile ? '100%' : 'none' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 350 }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
              name="search_products_input"
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
            onClick={() => { fetchProducts(); setSearch(''); }}
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

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          width: isMobile ? '100%' : 'auto'
        }}>
          <button onClick={() => handlePrint(products)} style={{ flex: isMobile ? 1 : 'none', background: '#fff', border: '1px solid #f1f5f9', padding: '0 1.25rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', height: 38, boxSizing: 'border-box' }}><Printer size={16} /> Print</button>
          <button onClick={handleOpenAddModal} style={{ flex: isMobile ? 1 : 'none', background: '#e11d48', border: 'none', padding: '0 1.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', height: 38, boxShadow: '0 10px 20px rgba(225, 29, 72, 0.15)', boxSizing: 'border-box' }}><Plus size={16} /> Add Product</button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '2.5rem', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8f9fc', borderBottom: '1px solid #f1f5f9' }}>
              <th style={{ width: '8%', padding: '1rem 1rem 1rem 2rem', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8' }}>ID</th>
              <th style={{ width: '22%', padding: '1rem 1rem', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8' }}>
                <div
                  onClick={() => handleSortRequest('name')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', userSelect: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#e11d48'}
                  onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                >
                  <span>Product Details</span>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 0.6, fontSize: 7, fontWeight: 900 }}>
                    <span style={{ color: sortConfig.key === 'name' && sortConfig.direction === 'asc' ? '#e11d48' : '#cbd5e1' }}>▲</span>
                    <span style={{ color: sortConfig.key === 'name' && sortConfig.direction === 'desc' ? '#e11d48' : '#cbd5e1' }}>▼</span>
                  </div>
                </div>
              </th>
              <th style={{ width: '10%', padding: '1rem 1rem', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8' }}>
                <div
                  onClick={() => handleSortRequest('base_price')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', userSelect: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#e11d48'}
                  onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                >
                  <span>Base Price</span>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 0.6, fontSize: 7, fontWeight: 900 }}>
                    <span style={{ color: sortConfig.key === 'base_price' && sortConfig.direction === 'asc' ? '#e11d48' : '#cbd5e1' }}>▲</span>
                    <span style={{ color: sortConfig.key === 'base_price' && sortConfig.direction === 'desc' ? '#e11d48' : '#cbd5e1' }}>▼</span>
                  </div>
                </div>
              </th>
              <th style={{ width: '10%', padding: '1rem 1rem', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8' }}>
                <div
                  onClick={() => handleSortRequest('discount_price')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', userSelect: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#e11d48'}
                  onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                >
                  <span>Offer Price</span>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 0.6, fontSize: 7, fontWeight: 900 }}>
                    <span style={{ color: sortConfig.key === 'discount_price' && sortConfig.direction === 'asc' ? '#e11d48' : '#cbd5e1' }}>▲</span>
                    <span style={{ color: sortConfig.key === 'discount_price' && sortConfig.direction === 'desc' ? '#e11d48' : '#cbd5e1' }}>▼</span>
                  </div>
                </div>
              </th>
              <th style={{ width: '6%', padding: '1rem 1rem', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8' }}>
                <div
                  onClick={() => handleSortRequest('stock_count')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', userSelect: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#e11d48'}
                  onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                >
                  <span>Stock</span>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 0.6, fontSize: 7, fontWeight: 900 }}>
                    <span style={{ color: sortConfig.key === 'stock_count' && sortConfig.direction === 'asc' ? '#e11d48' : '#cbd5e1' }}>▲</span>
                    <span style={{ color: sortConfig.key === 'stock_count' && sortConfig.direction === 'desc' ? '#e11d48' : '#cbd5e1' }}>▼</span>
                  </div>
                </div>
              </th>
              <th style={{ width: '12%', padding: '1rem 1rem', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8' }}>Colours</th>
              <th style={{ width: '12%', padding: '1rem 1rem', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8' }}>Sizes</th>
              <th style={{ width: '8%', padding: '1rem 1rem', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8' }}>Status</th>
              <th style={{ width: '8%', padding: '1rem 1rem', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8' }}>
                <div
                  onClick={() => handleSortRequest('created_at')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', userSelect: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#e11d48'}
                  onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                >
                  <span>Created At</span>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 0.6, fontSize: 7, fontWeight: 900 }}>
                    <span style={{ color: sortConfig.key === 'created_at' && sortConfig.direction === 'asc' ? '#e11d48' : '#cbd5e1' }}>▲</span>
                    <span style={{ color: sortConfig.key === 'created_at' && sortConfig.direction === 'desc' ? '#e11d48' : '#cbd5e1' }}>▼</span>
                  </div>
                </div>
              </th>
              <th style={{ width: '4%', padding: '1rem 2rem 1rem 1rem', fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ padding: '5rem 0', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: '#fff',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #f1f5f9'
                    }}>
                      <RefreshCcw style={{ width: 22, height: 22, color: '#e11d48', animation: 'spin 1s linear infinite' }} />
                    </div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', margin: 0, letterSpacing: '0.05em' }}>Synchronizing Catalog...</p>
                  </div>
                </td>
              </tr>
            ) : sortedProducts.map((p) => (
              <tr
                key={p.id}
                onClick={() => { setSelectedProductDetails(p); setActiveImageIndex(0); }}
                style={{ borderBottom: '1px solid #f8f9fc', transition: 'all 0.2s', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fcfdfe'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '0.75rem 1rem 0.75rem 2rem' }} title={`Product ID: #KMI${p.id}`}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a' }}>#KMI{p.id}</span>
                </td>
                <td style={{ padding: '0.75rem 1rem' }} title={p.name}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '0.75rem', background: '#f8f9fc', overflow: 'hidden', border: '1px solid #f1f5f9', flexShrink: 0 }}>
                      {p.images && p.images.length > 0 ? <img src={getImageUrl(p.images.find(img => img.is_primary)?.image_url || p.images[0].image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <Package style={{ width: '100%', height: '100%', padding: '0.6rem', color: '#cbd5e1' }} />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <p title={p.name} style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', margin: 0, transition: 'color 0.2s', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }} onMouseEnter={(e) => e.currentTarget.style.color = '#e11d48'} onMouseLeave={(e) => e.currentTarget.style.color = '#0f172a'}>{p.name}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                        {p.categories && p.categories.length > 0 ? (
                          p.categories.map(c => (
                            <span key={c.id} title={c.name} style={{ fontSize: '0.55rem', fontWeight: 900, color: '#64748b', background: '#f1f5f9', padding: '0.1rem 0.35rem', borderRadius: '0.35rem', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>
                              {c.name}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.55rem', fontWeight: 900, color: '#94a3b8', background: '#f8f9fc', padding: '0.1rem 0.35rem', borderRadius: '0.35rem', display: 'inline-block' }}>
                            General
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '0.75rem 1rem' }} title={`Base Price: ৳${p.base_price.toLocaleString()}`}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a' }}>৳{p.base_price.toLocaleString()}</span>
                </td>
                <td style={{ padding: '0.75rem 1rem' }} title={p.discount_price ? `Offer Price: ৳${p.discount_price.toLocaleString()}` : 'No offer price'}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: p.discount_price ? '#e11d48' : '#94a3b8' }}>
                    {p.discount_price ? `৳${p.discount_price.toLocaleString()}` : '-'}
                  </span>
                </td>
                <td style={{ padding: '0.75rem 1rem' }} title={`Stock Count: ${p.stock_count.toLocaleString()}`}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, color: p.stock_count < 10 ? '#f59e0b' : '#0f172a', margin: 0 }}>{p.stock_count.toLocaleString()}</p>
                </td>
                <td style={{ padding: '0.75rem 1rem', maxWidth: '140px' }} title={p.colors && p.colors.length > 0 ? p.colors.join(', ') : 'one colour'}>
                  <span title={p.colors && p.colors.length > 0 ? p.colors.join(', ') : 'one colour'} style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.colors && p.colors.length > 0 ? p.colors.join(', ') : 'one colour'}
                  </span>
                </td>
                <td style={{ padding: '0.75rem 1rem', maxWidth: '140px' }} title={p.sizes && p.sizes.length > 0 ? p.sizes.join(', ') : 'one size'}>
                  <span title={p.sizes && p.sizes.length > 0 ? p.sizes.join(', ') : 'one size'} style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.sizes && p.sizes.length > 0 ? p.sizes.join(', ') : 'one size'}
                  </span>
                </td>
                <td style={{ padding: '0.75rem 1rem' }} title={`Status: ${p.stock_count === 0 ? 'Out of Stock' : !p.is_active ? 'Inactive' : 'Published'}`}>
                  <StatusBadge product={p} />
                </td>
                <td style={{ padding: '0.75rem 1rem' }} title={`Created At: ${new Date(p.created_at).toLocaleString()}`}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>{new Date(p.created_at).toLocaleDateString()}</span>
                </td>
                <td style={{ padding: '0.75rem 2rem 0.75rem 1rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button onClick={(e) => { e.stopPropagation(); handleOpenEditModal(p); }} style={{ width: 32, height: 32, borderRadius: '0.75rem', border: '1px solid #f1f5f9', background: '#fff', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#e11d48'} onMouseLeave={e => e.currentTarget.style.borderColor = '#f1f5f9'}><Edit size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, id: p.id }); }} style={{ width: 32, height: 32, borderRadius: '0.75rem', border: 'none', background: '#fff1f2', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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



      {/* Product Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div onClick={() => setIsModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}>
            <motion.div onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ background: '#fff', borderRadius: '2rem', width: '100%', maxWidth: 500, padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={() => setIsModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
              </div>

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Product Name</label>
                  <input type="text" required placeholder="Enter product name" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', background: '#f8f9fc', border: '1px solid #f1f5f9', borderRadius: '1rem', padding: '0.85rem 1rem', fontSize: '0.85rem', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Description</label>
                  <textarea placeholder="Enter product description" value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%', background: '#f8f9fc', border: '1px solid #f1f5f9', borderRadius: '1rem', padding: '0.85rem 1rem', fontSize: '0.85rem', fontWeight: 700, outline: 'none', minHeight: 80, resize: 'vertical', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', margin: 0 }}>Categories (Select all that apply)</label>
                    <button
                      type="button"
                      onClick={() => setShowNewCatInput(!showNewCatInput)}
                      style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }}
                    >
                      {showNewCatInput ? 'Cancel' : '+ Add Category'}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showNewCatInput && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden', marginBottom: '0.75rem' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#f8f9fc', border: '1px solid #f1f5f9', borderRadius: '1rem', padding: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                              type="text"
                              placeholder="Enter category name"
                              value={newCatName}
                              onChange={(e) => setNewCatName(e.target.value)}
                              style={{ flex: 1, background: '#fff', border: '1px solid #cbd5e1', borderRadius: '0.75rem', padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                            />
                            <button
                              type="button"
                              disabled={creatingCat || !newCatName.trim()}
                              onClick={handleCreateCategoryInline}
                              style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '0.75rem', padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', opacity: (!newCatName.trim() || creatingCat) ? 0.6 : 1 }}
                            >
                              {creatingCat ? 'Adding...' : 'Add'}
                            </button>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <input
                              type="file"
                              ref={newCatFileInputRef}
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  setNewCatImage(file);
                                  setNewCatImagePreview(URL.createObjectURL(file));
                                }
                              }}
                              style={{ display: 'none' }}
                            />

                            <div
                              onClick={() => newCatFileInputRef.current?.click()}
                              style={{ width: 44, height: 44, borderRadius: '0.5rem', border: '2px dashed #cbd5e1', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}
                            >
                              {newCatImagePreview ? (
                                <img src={newCatImagePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                              ) : (
                                <Plus size={16} style={{ color: '#94a3b8' }} />
                              )}
                            </div>

                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 800, color: '#475569' }}>Category Image</p>
                              <p style={{ margin: 0, fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600 }}>{newCatImage ? 'Image selected' : 'Optional - Upload image'}</p>
                            </div>

                            {newCatImage && (
                              <button
                                type="button"
                                onClick={() => { setNewCatImage(null); setNewCatImagePreview(null); }}
                                style={{ border: 'none', background: 'none', color: '#e11d48', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', background: '#f8f9fc', border: '1px solid #f1f5f9', borderRadius: '1.25rem', padding: '0.85rem', boxSizing: 'border-box' }}>
                    {categories.length === 0 ? (
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>No categories available</span>
                    ) : categories.map(cat => {
                      const isSelected = selectedCategoryIds.includes(cat.id);
                      return (
                        <div
                          key={cat.id}
                          onClick={() => setSelectedCategoryIds(prev => isSelected ? prev.filter(id => id !== cat.id) : [...prev, cat.id])}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            background: isSelected ? '#10b981' : '#fff',
                            border: isSelected ? '1px solid #10b981' : '1px solid #e2e8f0',
                            color: isSelected ? '#fff' : '#475569',
                            boxShadow: isSelected ? '0 2px 8px rgba(16, 185, 129, 0.2)' : '0 1px 2px rgba(0,0,0,0.02)',
                            userSelect: 'none'
                          }}
                          onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; } }}
                          onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff'; } }}
                        >
                          {cat.name}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Stock Count</label>
                    <input 
                      type="number" 
                      required 
                      readOnly={combinations.length > 0}
                      placeholder={combinations.length > 0 ? "Calculated from variations" : "Enter stock count"} 
                      value={stockCount} 
                      onChange={(e) => setStockCount(e.target.value)} 
                      style={{ 
                        width: '100%', 
                        background: combinations.length > 0 ? '#e2e8f0' : '#f8f9fc', 
                        border: '1px solid #f1f5f9', 
                        borderRadius: '1rem', 
                        padding: '0.85rem 1rem', 
                        fontSize: '0.85rem', 
                        fontWeight: 700, 
                        outline: 'none', 
                        boxSizing: 'border-box',
                        color: combinations.length > 0 ? '#64748b' : '#0f172a'
                      }} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Base Price (BDT)</label>
                    <input type="number" required placeholder="Enter base price" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} style={{ width: '100%', background: '#f8f9fc', border: '1px solid #f1f5f9', borderRadius: '1rem', padding: '0.85rem 1rem', fontSize: '0.85rem', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Offer Price (BDT - Optional)</label>
                  <input type="number" placeholder="Enter offer price (optional)" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} style={{ width: '100%', background: '#f8f9fc', border: '1px solid #f1f5f9', borderRadius: '1rem', padding: '0.85rem 1rem', fontSize: '0.85rem', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Colours (Comma-separated)</label>
                    <input type="text" placeholder="e.g. Red, Blue, Green" value={colors} onChange={(e) => setColors(e.target.value)} style={{ width: '100%', background: '#f8f9fc', border: '1px solid #f1f5f9', borderRadius: '1rem', padding: '0.85rem 1rem', fontSize: '0.85rem', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.5rem', display: 'block' }}>Sizes (Comma-separated)</label>
                    <input type="text" placeholder="e.g. S, M, L, XL" value={sizes} onChange={(e) => setSizes(e.target.value)} style={{ width: '100%', background: '#f8f9fc', border: '1px solid #f1f5f9', borderRadius: '1rem', padding: '0.85rem 1rem', fontSize: '0.85rem', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>

                {combinations.length > 0 && (
                  <div style={{ background: '#f8f9fc', border: '1px solid #f1f5f9', borderRadius: '1rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>Variation Stock Levels</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {combinations.map((comb, idx) => {
                        const existing = variationStock.find(v => v.color === comb.color && v.size === comb.size);
                        const currentStock = existing ? existing.stock : '';
                        
                        return (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>{comb.color} / {comb.size}</span>
                            <input 
                              type="number" 
                              min="0"
                              placeholder="Stock"
                              value={currentStock} 
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : parseInt(e.target.value);
                                if (val !== '' && isNaN(val)) return;
                                const newStocks = [...variationStock];
                                const matchIdx = newStocks.findIndex(v => v.color === comb.color && v.size === comb.size);
                                if (matchIdx >= 0) {
                                  newStocks[matchIdx].stock = val;
                                } else {
                                  newStocks.push({ color: comb.color, size: comb.size, stock: val });
                                }
                                setVariationStock(newStocks);
                                
                                const total = newStocks.reduce((sum, v) => {
                                  const isCurrent = combinations.some(c => c.color === v.color && c.size === v.size);
                                  const num = parseInt(v.stock) || 0;
                                  return sum + (isCurrent ? num : 0);
                                }, 0);
                                setStockCount(total);
                              }} 
                              style={{ width: 100, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.4rem 0.75rem', fontSize: '0.78rem', fontWeight: 700, outline: 'none' }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>Product Images</label>
                    <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#94a3b8' }}>★ Click an image to set as cover photo</span>
                  </div>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      if (files.length > 0) {
                        setProductImages(prev => [...prev, ...files]);
                        setImagePreviews(prev => [...prev, ...files.map(file => URL.createObjectURL(file))]);
                      }
                    }}
                    style={{ display: 'none' }}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    {existingImages.map((img, i) => {
                      const isPrimary = i === primaryImageIndex;
                      return (
                        <div
                          key={`exist-${i}`}
                          style={{ width: '100%', height: 70, borderRadius: '0.75rem', overflow: 'hidden', border: isPrimary ? '2px solid #10b981' : '1px solid #f1f5f9', position: 'relative', cursor: 'pointer' }}
                          onClick={() => setPrimaryImageIndex(i)}
                        >
                          <img src={getImageUrl(img.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                          <div style={{ position: 'absolute', bottom: 3, left: 3, background: isPrimary ? '#10b981' : 'rgba(15,23,42,0.45)', borderRadius: '0.35rem', padding: '1px 5px', fontSize: 9, fontWeight: 900, color: '#fff', lineHeight: 1.6 }}>
                            {isPrimary ? '★ Cover' : '★'}
                          </div>
                          <div
                            onClick={(e) => { e.stopPropagation(); setExistingImages(prev => { const next = prev.filter((_, idx) => idx !== i); if (primaryImageIndex >= next.length) setPrimaryImageIndex(Math.max(0, next.length - 1)); return next; }); }}
                            style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: '50%', background: 'rgba(225, 29, 72, 0.9)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 10, fontWeight: 900 }}
                          >
                            ×
                          </div>
                        </div>
                      );
                    })}

                    {imagePreviews.map((preview, i) => {
                      const globalIdx = existingImages.length + i;
                      const isPrimary = globalIdx === primaryImageIndex;
                      return (
                        <div
                          key={`new-${i}`}
                          style={{ width: '100%', height: 70, borderRadius: '0.75rem', overflow: 'hidden', border: isPrimary ? '2px solid #10b981' : '1px solid #f1f5f9', position: 'relative', cursor: 'pointer' }}
                          onClick={() => setPrimaryImageIndex(globalIdx)}
                        >
                          <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                          <div style={{ position: 'absolute', bottom: 3, left: 3, background: isPrimary ? '#10b981' : 'rgba(15,23,42,0.45)', borderRadius: '0.35rem', padding: '1px 5px', fontSize: 9, fontWeight: 900, color: '#fff', lineHeight: 1.6 }}>
                            {isPrimary ? '★ Cover' : '★'}
                          </div>
                          <div
                            onClick={(e) => { e.stopPropagation(); setProductImages(prev => prev.filter((_, idx) => idx !== i)); setImagePreviews(prev => prev.filter((_, idx) => idx !== i)); if (isPrimary) setPrimaryImageIndex(0); }}
                            style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: '50%', background: 'rgba(225, 29, 72, 0.9)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 10, fontWeight: 900 }}
                          >
                            ×
                          </div>
                        </div>
                      );
                    })}

                    {(existingImages.length + imagePreviews.length) < 8 && (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{ width: '100%', height: 70, border: '2px dashed #cbd5e1', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#f8f9fc', color: '#94a3b8' }}
                      >
                        <Plus size={16} />
                        <span style={{ fontSize: '0.5rem', fontWeight: 800 }}>Upload</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Published / Unpublished toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8f9fc', border: '1px solid #f1f5f9', borderRadius: '1rem', padding: '0.85rem 1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Visibility Status</p>
                    <p style={{ fontSize: '0.7rem', fontWeight: 600, color: isActive ? '#10b981' : '#94a3b8', margin: '0.2rem 0 0' }}>
                      {isActive ? 'Published — visible to customers' : 'Unpublished — hidden from store'}
                    </p>
                  </div>
                  <div
                    onClick={() => setIsActive(prev => !prev)}
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 999,
                      background: isActive ? '#10b981' : '#cbd5e1',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background 0.25s',
                      flexShrink: 0
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: 3,
                      left: isActive ? 23 : 3,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#fff',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                      transition: 'left 0.25s'
                    }} />
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <button disabled={saving} style={{ width: '100%', background: '#e11d48', color: '#fff', border: 'none', padding: '1rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 20px rgba(225, 29, 72, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    {saving ? (
                      <>
                        <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        <span>Saving Product...</span>
                      </>
                    ) : (
                      <span>Save Product</span>
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
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={handleDeleteProduct}
        title="Delete Product"
        message="This action cannot be undone. Please enter your password to confirm deleting this product."
      />

      {/* Product Details Drawer */}
      <AnimatePresence>
        {selectedProductDetails && (
          <>
            <div
              onClick={() => { setSelectedProductDetails(null); setActiveImageIndex(0); }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 998 }}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: isMobile ? '100%' : 380, background: '#fff', boxShadow: '-10px 0 40px rgba(15,23,42,0.1)', zIndex: 999, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
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
                    <div style={{ marginTop: '0.1rem' }}>
                      <StatusBadge product={selectedProductDetails} />
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94a3b8', margin: '0 0 0.15rem', letterSpacing: '0.05em' }}>Colours</p>
                    <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {selectedProductDetails.colors && selectedProductDetails.colors.length > 0 ? selectedProductDetails.colors.join(', ') : 'one colour'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94a3b8', margin: '0 0 0.15rem', letterSpacing: '0.05em' }}>Sizes</p>
                    <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {selectedProductDetails.sizes && selectedProductDetails.sizes.length > 0 ? selectedProductDetails.sizes.join(', ') : 'one size'}
                    </p>
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
                <button onClick={() => { handleOpenEditModal(selectedProductDetails); setSelectedProductDetails(null); setActiveImageIndex(0); }} style={{ flex: 1, background: '#0f172a', color: '#fff', border: 'none', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><Edit size={14} /> Edit Product</button>
                <button onClick={() => { setConfirmModal({ isOpen: true, id: selectedProductDetails.id }); setSelectedProductDetails(null); setActiveImageIndex(0); }} style={{ background: '#fff1f2', color: '#e11d48', border: 'none', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} /></button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const Star = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
);

export default AdminProducts;
