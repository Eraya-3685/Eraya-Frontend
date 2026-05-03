import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, CheckCircle, Trash2, ChevronDown, 
  Package, Truck, CheckCircle2, XCircle, 
  Clock, AlertCircle, ShoppingCart, ArrowRight,
  Filter, Phone, MapPin, CreditCard, Star, RefreshCcw,
  CalendarDays, Zap, AlertTriangle, Trash
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import OTPModal from '../components/OTPModal';
import useClickOutside from '../hooks/useClickOutside';
import useAuthStore from '../store/useAuthStore';
import ActionConfirmationModal from '../components/ActionConfirmationModal';
import AdminDropdown from '../components/AdminDropdown';

const BeautifulCalendar = ({ selectedDate, onSelect, onClose }) => {
  const [viewDate, setViewDate] = useState(new Date());
  
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const today = new Date();
  
  const days = [];
  // Adjusted for Monday start if desired, but keeping standard Sunday for simplicity
  const startOffset = firstDayOfMonth(year, month);
  
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let i = 1; i <= daysInMonth(year, month); i++) days.push(i);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className="absolute top-full left-0 right-0 mt-4 glass-card-light rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/[0.08] p-6 z-[310] overflow-hidden"
    >
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={(e) => { e.stopPropagation(); setViewDate(new Date(year, month - 1)); }}
          className="w-8 h-8 rounded-xl hover:glass-card-light flex items-center justify-center text-slate-400 transition-colors"
        >
          <ChevronDown className="w-4 h-4 rotate-90" />
        </button>
        <h4 className="text-xs font-black text-white uppercase tracking-widest">{months[month]} {year}</h4>
        <button 
          onClick={(e) => { e.stopPropagation(); setViewDate(new Date(year, month + 1)); }}
          className="w-8 h-8 rounded-xl hover:glass-card-light flex items-center justify-center text-slate-400 transition-colors"
        >
          <ChevronDown className="w-4 h-4 -rotate-90" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <div key={d} className="text-[8px] font-black text-slate-300 text-center uppercase tracking-widest py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
          const isSelected = selectedDate && new Date(selectedDate).getDate() === day && new Date(selectedDate).getMonth() === month && new Date(selectedDate).getFullYear() === year;

          return (
            <button
              key={day}
              onClick={(e) => {
                e.stopPropagation();
                const d = new Date(year, month, day);
                onSelect(d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
                onClose();
              }}
              className={`aspect-square rounded-xl text-[10px] font-black transition-all flex items-center justify-center relative group
                ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 
                  isToday ? 'text-indigo-400 bg-secondary/5' : 'text-slate-300 hover:glass-card-light hover:text-white'}
              `}
            >
              {day}
              {!isSelected && isToday && <div className="absolute bottom-1.5 w-1 h-1 bg-indigo-600 rounded-full" />}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

const StatusUpdateModal = ({ isOpen, onClose, onConfirm, status, currentStatus }) => {
  const [estimatedDate, setEstimatedDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);

  useClickOutside(calendarRef, () => setShowCalendar(false));
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative glass-card-light rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/[0.08]"
      >
        <div className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">Update Order Status</h3>
            <p className="text-sm text-slate-500">
              Moving order from <span className="font-bold text-white">{currentStatus}</span> to <span className="font-bold text-secondary">{status === 'Confirmed' ? 'Accepted' : status}</span>.
            </p>
          </div>

          {status !== 'Cancelled' && status !== 'Delivered' && (() => {
            const steps = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
            const currentIndex = steps.indexOf(status);
            const nextStep = steps[currentIndex + 1];
            const nextStepLabel = nextStep === 'Confirmed' ? 'Accepted' : nextStep;
            
            return (
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  Estimated {nextStepLabel} Date (Optional)
                </label>
                <div className="relative" ref={calendarRef}>
                  <div className="relative group">
                    <button 
                      onClick={() => setShowCalendar(!showCalendar)}
                      className={`absolute inset-y-0 left-0 pl-4 flex items-center transition-colors text-slate-400 hover:text-indigo-400 z-10 ${showCalendar ? 'text-indigo-400' : ''}`}
                      type="button"
                    >
                      <CalendarDays className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      placeholder={`e.g. 25 Apr 2024 or "Tomorrow"`}
                      value={estimatedDate}
                      onChange={(e) => setEstimatedDate(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 glass-card-light border-2 border-transparent rounded-2xl text-sm focus:glass-card-light focus:border-indigo-500 outline-none transition-all font-bold placeholder:font-normal placeholder:text-slate-300"
                    />
                  </div>
                  
                  <AnimatePresence>
                    {showCalendar && (
                      <BeautifulCalendar 
                        selectedDate={estimatedDate}
                        onSelect={setEstimatedDate}
                        onClose={() => setShowCalendar(false)}
                      />
                    )}
                  </AnimatePresence>
                </div>
                <p className="text-[10px] text-slate-400 px-1 italic text-center">Click icon for calendar or type manually</p>
              </div>
            );
          })()}

          <div className="flex gap-3 pt-2">
            <button 
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl glass-card-light text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => onConfirm(estimatedDate)}
              className="flex-[1.5] px-6 py-4 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-secondary/90 shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Confirm Update
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};


const statusConfigs = {
  Pending: { 
    color: 'bg-amber-50 text-amber-600 border-amber-200', 
    icon: Clock, 
    desc: 'Order placed, awaiting confirmation' 
  },
  Confirmed: { 
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200', 
    icon: Package, 
    desc: 'Order confirmed and packing' 
  },
  Processing: { 
    color: 'bg-blue-50 text-blue-600 border-blue-200', 
    icon: Zap, 
    desc: 'Order is being prepared' 
  },
  Shipped: { 
    color: 'bg-purple-50 text-purple-600 border-purple-200', 
    icon: Truck, 
    desc: 'Package is in transit' 
  },
  Delivered: { 
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200', 
    icon: CheckCircle2, 
    desc: 'Order successfully delivered' 
  },
  Cancelled: { 
    color: 'bg-red-50 text-red-500 border-red-200', 
    icon: XCircle, 
    desc: 'Order has been cancelled' 
  },
};

const paymentColors = {
  Pending: 'text-amber-600',
  Paid: 'text-emerald-600',
  Failed: 'text-red-500',
};

const StatusDropdown = ({ currentStatus, onUpdate, disabled }) => {
  const currentConfig = statusConfigs[currentStatus] || statusConfigs.Pending;
  const statusOrder = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  const currentIndex = statusOrder.indexOf(currentStatus);
  const options = statusOrder.filter((opt, idx) => {
    if (opt === 'Cancelled') return currentStatus !== 'Delivered' && currentStatus !== 'Cancelled';
    return idx > currentIndex;
  });

  const colorBase = currentConfig?.color?.split(' ')[1]?.split('-')[1] || 'slate';

  return (
    <AdminDropdown
      value={currentStatus}
      options={options}
      onChange={onUpdate}
      disabled={disabled || options.length === 0}
      className="min-w-[160px]"
      buttonClassName={`bg-${colorBase}-50 text-${colorBase}-600 border-${colorBase}-100 hover:bg-${colorBase}-100`}
      renderValue={(val) => {
        const config = statusConfigs[val] || statusConfigs.Pending;
        return (
          <div className="flex items-center gap-2">
            {React.createElement(config.icon, { className: "w-4 h-4" })}
            <span className="truncate">{val === 'Confirmed' ? 'Accepted' : val}</span>
          </div>
        );
      }}
      renderOption={(opt) => {
        const config = statusConfigs[opt];
        const Icon = config?.icon || AlertCircle;
        const colorBase = config?.color?.split(' ')[1]?.split('-')[1] || 'slate';

        return (
          <div className="flex items-center gap-3 w-full">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${colorBase}-50 text-${colorBase}-500 group-hover:bg-${colorBase}-500 group-hover:text-white transition-all`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 group-hover:text-white transition-colors">
                {opt === 'Confirmed' ? 'Accepted' : opt}
              </p>
              <p className="text-[9px] text-slate-400 font-medium leading-none truncate max-w-[120px]">
                {config?.desc}
              </p>
            </div>
          </div>
        );
      }}
    />
  );
};


const AdminOrders = () => {
  const { user: adminUser } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');
  const [deleteConfirm, setDeleteConfirm] = useState(null); 
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [updateModal, setUpdateModal] = useState({ isOpen: false, orderID: null, status: null, currentStatus: null });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/orders');
      setOrders(res.data || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusUpdate = async (orderID, status, estimatedDate = '') => {
    setUpdatingId(orderID);
    try {
      await api.put(`/admin/orders/${orderID}/status`, { status, estimated_date: estimatedDate });
      toast.success(`Order status updated to ${status === 'Confirmed' ? 'Accepted' : status}`);
      fetchOrders();
      setUpdateModal({ isOpen: false, orderID: null, status: null, currentStatus: null });
    } catch (err) {
      toast.error(err.response?.data || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async (orderID, otp) => {
    setIsDeleting(true);
    try {
      await api.delete(`/admin/orders/${orderID}`, { data: { otp } });
      toast.success(`Order #${orderID} deleted`);
      setOrders(prev => prev.filter(o => o.id !== orderID));
      setDeleteConfirm(null);
      setShowOtpModal(false);
    } catch (err) {
      toast.error(err.response?.data || 'Failed to delete order');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRequestDeleteOTP = async () => {
    try {
      await api.post('/admin/orders/request-delete-otp');
      toast.success('OTP sent to your email');
      setOtpSent(true);
    } catch (err) {
      toast.error('Failed to send OTP');
    }
  };

  const statusOptions = ['All', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  const filtered = orders.filter((o) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      String(o.id).includes(search) || 
      o.shipping_address?.toLowerCase().includes(searchLower) ||
      o.user?.full_name?.toLowerCase().includes(searchLower) ||
      o.user?.email?.toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === 'All' || o.order_status === statusFilter;
    const matchesPayment = paymentFilter === 'All' || 
      (paymentFilter === 'bKash' && (o.payment_method?.toLowerCase() === 'bkash' || o.payment_method?.toLowerCase() === 'nagad' || o.payment_method?.toLowerCase() === 'rocket')) ||
      (paymentFilter === 'COD' && (o.payment_method?.toLowerCase() === 'cod'));
    
    return matchesSearch && matchesStatus && matchesPayment;
  }).sort((a, b) => {
    if (sortBy === 'PriceLow') return a.total_price - b.total_price;
    if (sortBy === 'PriceHigh') return b.total_price - a.total_price;
    if (sortBy === 'Oldest') return new Date(a.created_at) - new Date(b.created_at);
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      <ActionConfirmationModal 
        isOpen={!!deleteConfirm && !showOtpModal}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          handleRequestDeleteOTP();
          setShowOtpModal(true);
        }}
        title={`Delete Order #${deleteConfirm}?`}
        description="Are you sure you want to permanently delete this order? This action cannot be undone and will remove all transaction history."
        confirmText="Continue to OTP"
        type="danger"
        icon={AlertTriangle}
      />

      <OTPModal 
        isOpen={showOtpModal}
        onClose={() => {
          setDeleteConfirm(null);
          setShowOtpModal(false);
          setOtpSent(false);
        }}
        onConfirm={(otp) => handleDeleteOrder(deleteConfirm, otp)}
        onResend={handleRequestDeleteOTP}
        email={adminUser?.email}
        loading={isDeleting}
        title={`Authorize Deletion #${deleteConfirm}`}
        description="Please enter the 6-digit verification code sent to your email to confirm this action."
      />

      <StatusUpdateModal 
        isOpen={updateModal.isOpen}
        onClose={() => setUpdateModal({ ...updateModal, isOpen: false })}
        onConfirm={(date) => handleStatusUpdate(updateModal.orderID, updateModal.status, date)}
        status={updateModal.status}
        currentStatus={updateModal.currentStatus}
      />
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-secondary" />
            Order Management
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Track and manage customer fulfillment across Eraya.</p>
        </div>
        
        <div className="flex items-center gap-4 glass-card-light p-1.5 rounded-2xl border border-white/[0.08] shadow-sm w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID or address..."
              className="w-full glass-card-light border-none rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
          <button onClick={fetchOrders} className="p-2.5 hover:glass-card-light rounded-xl transition-colors">
            <RefreshCcw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'].map(s => (
          <div key={s} className="glass-card-light p-4 rounded-3xl border border-white/[0.08] shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s}</p>
            <p className="text-xl font-black text-white">{orders.filter(o => o.order_status === s).length}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
        <div className="flex flex-wrap gap-2 glass-card-light/50 p-2 rounded-[2rem] border border-white/[0.08]/50 w-fit shadow-sm">
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all border ${
                statusFilter === s
                  ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200'
                  : 'bg-transparent text-slate-400 border-transparent hover:glass-card-light hover:text-slate-300'
              }`}
            >
              {s === 'Confirmed' ? 'Accepted' : s}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex glass-card-light rounded-2xl border border-white/[0.08] p-1 shadow-sm">
            {['All', 'bKash', 'COD'].map((p) => (
              <button
                key={p}
                onClick={() => setPaymentFilter(p)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  paymentFilter === p ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <AdminDropdown 
            value={sortBy}
            options={['Newest', 'Oldest', 'PriceLow', 'PriceHigh']}
            onChange={setSortBy}
            className="min-w-[180px]"
            renderValue={(val) => {
              const labels = {
                Newest: { label: 'Newest First', icon: Clock },
                Oldest: { label: 'Oldest First', icon: Clock },
                PriceLow: { label: 'Price: Low to High', icon: Zap },
                PriceHigh: { label: 'Price: High to Low', icon: Zap }
              };
              const config = labels[val] || labels.Newest;
              return (
                <div className="flex items-center gap-2">
                  <config.icon className="w-3.5 h-3.5 text-secondary" />
                  <span className="truncate">{config.label}</span>
                </div>
              );
            }}
            renderOption={(opt) => {
              const labels = {
                Newest: { label: 'Newest First', icon: Clock, desc: 'Latest orders first' },
                Oldest: { label: 'Oldest First', icon: Clock, desc: 'Earliest orders first' },
                PriceLow: { label: 'Price: Low to High', icon: Zap, desc: 'Cheapest to most expensive' },
                PriceHigh: { label: 'Price: High to Low', icon: Zap, desc: 'Most expensive to cheapest' }
              };
              const config = labels[opt] || labels.Newest;
              return (
                <div className="flex items-center gap-3 w-full">
                  <div className="w-8 h-8 rounded-lg glass-card-light flex items-center justify-center text-slate-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-all">
                    <config.icon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 group-hover:text-white transition-colors">
                      {config.label}
                    </p>
                    <p className="text-[9px] text-slate-300 font-medium leading-none">
                      {config.desc}
                    </p>
                  </div>
                </div>
              );
            }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
             <div className="w-12 h-12 border-4 border-white/[0.08] border-t-secondary rounded-full animate-spin" />
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Orders...</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-32 glass-card-light rounded-[3rem] border border-white/[0.08] shadow-sm"
          >
            <div className="w-20 h-20 glass-card-light rounded-[32px] flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-white">No orders found</h3>
            <p className="text-slate-400 text-sm">Try adjusting your filters or search query.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass-card-light rounded-[2.5rem] shadow-sm border border-white/[0.08] transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/40 ${expandedId === order.id ? 'ring-2 ring-indigo-500/10' : ''}`}
              >
                <div className="p-3 md:p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                      className={`mt-1 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${expandedId === order.id ? 'bg-indigo-500/10 text-secondary' : 'glass-card-light text-slate-400 hover:bg-slate-100'}`}
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${expandedId === order.id ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-base font-black text-white tracking-tight">Order #{order.id}</span>
                         <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${statusConfigs[order.order_status]?.color}`}>
                            {React.createElement(statusConfigs[order.order_status]?.icon || AlertCircle, { className: 'w-2.5 h-2.5' })}
                            {order.order_status === 'Confirmed' ? 'Accepted' : order.order_status}
                         </div>
                         <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg glass-card-light border border-white/[0.08]">
                           <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Pay</span>
                           <span className={`text-[8px] font-black uppercase tracking-wider ${paymentColors[order.payment_status] || 'text-slate-500'}`}>
                             {order.payment_status}
                           </span>
                         </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-300">
                        <span className="text-indigo-400">{order.user?.full_name}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span className="max-w-[120px] truncate">{order.user?.email}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50/50 rounded-lg border border-indigo-100/30">
                           <Package className="w-2.5 h-2.5 text-indigo-400" />
                           <span className="text-indigo-600 font-black">
                             {order.items?.length || 0} {order.items?.length === 1 ? 'Item' : 'Items'}: 
                             <span className="ml-1 opacity-70 font-bold">
                               {order.items?.map(i => i.product?.name).join(', ').substring(0, 40)}
                               {order.items?.map(i => i.product?.name).join(', ').length > 40 ? '...' : ''}
                             </span>
                           </span>
                        </div>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span>{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span className={`flex items-center gap-1 truncate px-2 py-0.5 rounded-md ${order.payment_method?.toLowerCase() === 'bkash' ? 'bg-[#D12053]/10 text-[#D12053]' : 'text-slate-300'}`}>
                           <CreditCard className="w-2.5 h-2.5" /> 
                           {order.payment_method?.toLowerCase() === 'cod' ? 'Cash on Delivery' : order.payment_method}
                        </span>
                      </div>
                      
                        {order.shipping_address && (
                          <p className="text-[11px] font-medium text-slate-400 mt-2 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" /> {order.shipping_address}
                          </p>
                        )}

                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-6 md:pt-0 border-slate-50">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Amount</p>
                      <p className="text-2xl font-black text-indigo-400 tracking-tighter">৳{order.total_price.toLocaleString()}</p>
                    </div>

                    {order.processing_at && order.order_status !== 'Delivered' && order.order_status !== 'Cancelled' && (
                      <div className="hidden lg:block text-right border-l border-white/[0.08] pl-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Estimated For Next Step</p>
                        <p className="text-xs font-black text-indigo-600">
                          {new Date(order.processing_at).toLocaleDateString(undefined, { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <StatusDropdown 
                        currentStatus={order.order_status} 
                        onUpdate={(newStatus) => setUpdateModal({ 
                          isOpen: true, 
                          orderID: order.id, 
                          status: newStatus,
                          currentStatus: order.order_status 
                        })} 
                        disabled={updatingId === order.id}
                      />

                      <button 
                        onClick={() => setDeleteConfirm(order.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Section: Order Items & Details */}
                <AnimatePresence>
                  {expandedId === order.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-50 overflow-hidden"
                    >
                      <div className="p-8 md:p-10 glass-card-light/30">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                           {/* Items List */}
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Line Items ({order.items?.length || 0})</p>
                              <div className="space-y-4">
                                {order.items?.map((item) => (
                                  <div key={item.id} className="flex items-center justify-between p-4 glass-card-light rounded-2xl border border-white/[0.08] shadow-sm">
                                    <div className="flex items-center gap-4">
                                       <div className="w-12 h-12 glass-card-light rounded-xl flex items-center justify-center font-black text-indigo-400 text-sm">
                                          {item.quantity}×
                                       </div>
                                       <div>
                                          <p className="text-sm font-bold text-white">{item.product?.name || `Product ID: ${item.product_id}`}</p>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Unit Price: ৳{item.price_at_purchase.toLocaleString()}</p>
                                       </div>
                                    </div>
                                    <p className="text-sm font-black text-white">৳{(item.price_at_purchase * item.quantity).toLocaleString()}</p>
                                  </div>
                                ))}
                              </div>
                           </div>

                           {/* Timeline / Additional Info */}
                           <div className="space-y-6">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Fulfillment Details</p>
                              <div className="glass-card-light p-6 rounded-[2rem] border border-white/[0.08] shadow-sm space-y-6">
                                 <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                                       <Truck className="w-5 h-5" />
                                    </div>
                                    <div>
                                       <p className="text-xs font-bold text-white">Delivery Information</p>
                                       <p className="text-[11px] font-medium text-slate-500 mt-1">Standard Shipping via Eraya Express.</p>
                                       {order.tracking_number && (
                                          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 glass-card-light rounded-lg text-[10px] font-black text-slate-500 border border-white/[0.08]">
                                             TRACKING: {order.tracking_number}
                                          </div>
                                       )}
                                    </div>
                                 </div>
                                 
                                 <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                                       <Star className="w-5 h-5" />
                                    </div>
                                    <div>
                                       <p className="text-xs font-bold text-white">Order Instructions</p>
                                       <p className="text-[11px] font-medium text-slate-500 mt-1">No special instructions provided by the buyer.</p>
                                    </div>
                                 </div>

                                 {order.payment_method?.toLowerCase() === 'bkash' && (
                                    <div className="mt-6 p-6 bg-[#D12053]/5 border-2 border-dashed border-[#D12053]/10 rounded-[2rem] space-y-4">
                                       <div className="flex items-center gap-3 mb-2">
                                          <div className="w-8 h-8 glass-card-light rounded-lg flex items-center justify-center shadow-sm">
                                             <img src="https://www.logo.wine/a/logo/BKash/BKash-bKash-Logo.wine.svg" className="w-6 h-6 object-contain" alt="bKash" />
                                          </div>
                                          <p className="text-xs font-black text-[#D12053] uppercase tracking-widest">bKash Payment Details</p>
                                       </div>
                                       
                                       <div className="grid grid-cols-2 gap-4">
                                          <div>
                                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Transaction ID</p>
                                             <p className="text-sm font-black text-white tracking-tight select-all cursor-copy">{order.trx_id || 'N/A'}</p>
                                          </div>
                                          <div>
                                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Sender Number</p>
                                             <p className="text-sm font-black text-white tracking-tight">{order.sender_number || 'N/A'}</p>
                                          </div>
                                          <div className="col-span-2 pt-2 border-t border-[#D12053]/5">
                                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Verified Amount</p>
                                             <p className="text-lg font-black text-indigo-400 tracking-tight">৳{order.paid_amount?.toLocaleString() || '0'}</p>
                                          </div>
                                       </div>
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrders;
