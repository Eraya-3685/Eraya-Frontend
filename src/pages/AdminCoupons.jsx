import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag, Plus, Trash2, Copy, CheckCircle2, Clock, XCircle,
  Percent, DollarSign, AlertCircle, RefreshCcw, Search
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import useDocumentTitle from '../hooks/useDocumentTitle';

const STATUS_COLOR = {
  active: { bg: '#ecfdf5', color: '#059669' },
  expired: { bg: '#fef2f2', color: '#dc2626' },
  inactive: { bg: '#f1f5f9', color: '#64748b' },
};

const AdminCoupons = () => {
  useDocumentTitle('Eraya Admin — Coupons');
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_cart_value: '',
    expires_at: '',
  });

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/coupons');
      setCoupons(res.data || []);
    } catch {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discount_value || !form.expires_at) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/admin/coupons', {
        code: form.code.toUpperCase().trim(),
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        min_cart_value: parseFloat(form.min_cart_value) || 0,
        expires_at: new Date(form.expires_at).toISOString(),
      });
      toast.success('Coupon created successfully');
      setForm({ code: '', discount_type: 'percentage', discount_value: '', min_cart_value: '', expires_at: '' });
      setShowForm(false);
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data || 'Failed to create coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await api.delete(`/admin/coupons/${id}`);
      toast.success('Coupon deleted');
      setCoupons(prev => prev.filter(c => c.id !== id));
    } catch {
      toast.error('Failed to delete coupon');
    } finally {
      setDeleting(null);
    }
  };

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success('Code copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCouponStatus = (coupon) => {
    if (!coupon.is_active) return 'inactive';
    if (new Date(coupon.expires_at) < new Date()) return 'expired';
    return 'active';
  };

  const filtered = coupons.filter(c =>
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e2e8f0',
    borderRadius: '0.85rem', fontSize: '0.82rem', fontWeight: 600,
    color: '#0f172a', background: '#f8fafc', outline: 'none',
    fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'all 0.2s',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            Coupon Management
          </h1>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.3rem 0 0', fontWeight: 600 }}>
            Create and manage discount codes for your customers
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={fetchCoupons}
            style={{ padding: '0.65rem', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b' }}
          >
            <RefreshCcw style={{ width: 16, height: 16 }} />
          </button>
          <button
            id="create-coupon-btn"
            onClick={() => setShowForm(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.65rem 1.25rem', background: '#0f172a', color: '#fff',
              border: 'none', borderRadius: '0.85rem', fontSize: '0.8rem',
              fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
            onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}
          >
            <Plus style={{ width: 16, height: 16 }} />
            New Coupon
          </button>
        </div>
      </motion.div>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            style={{
              background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '1.5rem',
              padding: '2rem', boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1.5rem' }}>
              Create New Coupon
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                {/* Code */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em', display: 'block', marginBottom: '0.4rem' }}>
                    COUPON CODE *
                  </label>
                  <input
                    id="coupon-code-input"
                    style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '0.08em' }}
                    placeholder="e.g. SUMMER20"
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                    onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.background = '#fff'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                  />
                </div>

                {/* Discount Type */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em', display: 'block', marginBottom: '0.4rem' }}>
                    DISCOUNT TYPE *
                  </label>
                  <select
                    id="discount-type-select"
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    value={form.discount_type}
                    onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}
                    onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.background = '#fff'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (৳)</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em', display: 'block', marginBottom: '0.4rem' }}>
                    {form.discount_type === 'percentage' ? 'PERCENTAGE (%) *' : 'FLAT AMOUNT (৳) *'}
                  </label>
                  <input
                    id="discount-value-input"
                    type="number"
                    min="1"
                    max={form.discount_type === 'percentage' ? 100 : undefined}
                    style={inputStyle}
                    placeholder={form.discount_type === 'percentage' ? '20' : '200'}
                    value={form.discount_value}
                    onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
                    onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.background = '#fff'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                  />
                </div>

                {/* Min Cart Value */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em', display: 'block', marginBottom: '0.4rem' }}>
                    MIN. CART VALUE (৳)
                  </label>
                  <input
                    id="min-cart-value-input"
                    type="number"
                    min="0"
                    style={inputStyle}
                    placeholder="0 = no minimum"
                    value={form.min_cart_value}
                    onChange={e => setForm(f => ({ ...f, min_cart_value: e.target.value }))}
                    onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.background = '#fff'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                  />
                </div>

                {/* Expires At */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em', display: 'block', marginBottom: '0.4rem' }}>
                    EXPIRY DATE *
                  </label>
                  <input
                    id="expires-at-input"
                    type="datetime-local"
                    style={inputStyle}
                    value={form.expires_at}
                    onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)}
                    onFocus={e => { e.target.style.borderColor = '#0f172a'; e.target.style.background = '#fff'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                  />
                </div>
              </div>

              {/* Preview */}
              {form.code && form.discount_value && (
                <div style={{ background: '#f8fafc', border: '1.5px dashed #e2e8f0', borderRadius: '1rem', padding: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Tag style={{ width: 18, height: 18, color: '#6366f1' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>
                      Preview: <span style={{ letterSpacing: '0.08em', color: '#6366f1' }}>{form.code.toUpperCase()}</span>
                    </p>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                      {form.discount_type === 'percentage'
                        ? `${form.discount_value}% off`
                        : `৳${form.discount_value} off`}
                      {form.min_cart_value ? ` · min. cart ৳${form.min_cart_value}` : ' · no minimum'}
                      {form.expires_at ? ` · expires ${new Date(form.expires_at).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{ padding: '0.7rem 1.5rem', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '0.85rem', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-coupon-btn"
                  disabled={submitting}
                  style={{ padding: '0.7rem 1.5rem', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '0.85rem', fontSize: '0.8rem', fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1, fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {submitting ? <><RefreshCcw style={{ width: 14, height: 14, animation: 'spin 0.8s linear infinite' }} /> Creating...</> : <><Plus style={{ width: 14, height: 14 }} /> Create Coupon</>}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Coupons', value: coupons.length, color: '#6366f1', icon: Tag },
          { label: 'Active', value: coupons.filter(c => getCouponStatus(c) === 'active').length, color: '#10b981', icon: CheckCircle2 },
          { label: 'Expired', value: coupons.filter(c => getCouponStatus(c) === 'expired').length, color: '#f59e0b', icon: Clock },
          { label: 'Inactive', value: coupons.filter(c => getCouponStatus(c) === 'inactive').length, color: '#94a3b8', icon: XCircle },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '1.25rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}
          >
            <div style={{ width: 40, height: 40, borderRadius: '1rem', background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
              <stat.icon style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>{stat.value}</p>
              <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Coupon List */}
      <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
        {/* Table Head */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>All Coupons</h3>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#94a3b8' }} />
            <input
              placeholder="Search by code..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.25rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', border: '1.5px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '0.78rem', fontWeight: 600, outline: 'none', color: '#0f172a', background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 36, height: 36, border: '3px solid #f1f5f9', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <Tag style={{ width: 40, height: 40, color: '#e2e8f0', marginBottom: '1rem' }} />
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', margin: 0 }}>
              {searchTerm ? 'No coupons match your search' : 'No coupons yet. Create one above!'}
            </p>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr auto', gap: 0, padding: '0.75rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
              {['Code', 'Type', 'Discount', 'Min. Cart', 'Expires', 'Status', ''].map((h) => (
                <span key={h} style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</span>
              ))}
            </div>

            <AnimatePresence>
              {filtered.map((coupon, idx) => {
                const status = getCouponStatus(coupon);
                const statusCfg = STATUS_COLOR[status];
                const isExpired = status === 'expired';
                return (
                  <motion.div
                    key={coupon.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr auto',
                      gap: 0,
                      padding: '1rem 1.5rem',
                      borderBottom: idx < filtered.length - 1 ? '1px solid #f8fafc' : 'none',
                      alignItems: 'center',
                      opacity: isExpired ? 0.6 : 1,
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Code */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{
                        fontSize: '0.88rem', fontWeight: 900, color: '#0f172a',
                        letterSpacing: '0.06em', fontFamily: 'monospace',
                        background: '#f1f5f9', padding: '0.2rem 0.6rem',
                        borderRadius: '0.5rem',
                      }}>
                        {coupon.code}
                      </span>
                      <button
                        onClick={() => handleCopy(coupon.code, coupon.id)}
                        title="Copy code"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedId === coupon.id ? '#10b981' : '#94a3b8', transition: 'color 0.2s', padding: 0, display: 'flex' }}
                      >
                        {copiedId === coupon.id
                          ? <CheckCircle2 style={{ width: 14, height: 14 }} />
                          : <Copy style={{ width: 14, height: 14 }} />
                        }
                      </button>
                    </div>

                    {/* Type */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {coupon.discount_type === 'percentage'
                        ? <Percent style={{ width: 14, height: 14, color: '#6366f1' }} />
                        : <DollarSign style={{ width: 14, height: 14, color: '#f59e0b' }} />
                      }
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'capitalize' }}>
                        {coupon.discount_type}
                      </span>
                    </div>

                    {/* Discount */}
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#e11d48' }}>
                      {coupon.discount_type === 'percentage'
                        ? `${coupon.discount_value}%`
                        : `৳${coupon.discount_value}`}
                    </span>

                    {/* Min Cart */}
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>
                      {coupon.min_cart_value > 0 ? `৳${coupon.min_cart_value.toLocaleString()}` : '—'}
                    </span>

                    {/* Expires */}
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isExpired ? '#dc2626' : '#475569' }}>
                        {new Date(coupon.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Status */}
                    <span style={{
                      display: 'inline-block', fontSize: '0.62rem', fontWeight: 800,
                      padding: '0.25rem 0.6rem', borderRadius: 999,
                      background: statusCfg.bg, color: statusCfg.color,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      {status}
                    </span>

                    {/* Actions */}
                    <button
                      id={`delete-coupon-${coupon.id}`}
                      onClick={() => handleDelete(coupon.id)}
                      disabled={deleting === coupon.id}
                      title="Delete coupon"
                      style={{
                        width: 32, height: 32, borderRadius: '0.65rem',
                        background: deleting === coupon.id ? '#fef2f2' : 'transparent',
                        border: '1px solid transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: deleting === coupon.id ? 'not-allowed' : 'pointer',
                        color: '#e11d48', transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { if (deleting !== coupon.id) { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fecdd3'; } }}
                      onMouseLeave={e => { if (deleting !== coupon.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
                    >
                      {deleting === coupon.id
                        ? <RefreshCcw style={{ width: 14, height: 14, animation: 'spin 0.8s linear infinite' }} />
                        : <Trash2 style={{ width: 14, height: 14 }} />
                      }
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '1.25rem', padding: '1.25rem 1.5rem', display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}
      >
        <AlertCircle style={{ width: 18, height: 18, color: '#2563eb', flexShrink: 0, marginTop: '0.1rem' }} />
        <div>
          <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 800, color: '#1e40af' }}>How Coupons Work</p>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.72rem', color: '#3b82f6', fontWeight: 600, lineHeight: 1.5 }}>
            Buyers can apply coupon codes at checkout. <strong>Percentage</strong> coupons deduct a % from the cart total.
            <strong> Flat</strong> coupons deduct a fixed amount. Set a minimum cart value to restrict usage. 
            Coupons automatically expire on the set date.
          </p>
        </div>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AdminCoupons;
