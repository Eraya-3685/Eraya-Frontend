import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ShieldAlert, ShieldCheck, User as UserIcon } from 'lucide-react';
import useClickOutside from '../hooks/useClickOutside';

const AdminDropdown = ({ 
  value, 
  options, 
  onChange, 
  placeholder = 'Select option',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  useClickOutside(dropdownRef, () => setIsOpen(false), menuRef);

  const updateCoords = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
    }
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [isOpen]);

  const handleSelect = (option) => {
    if (disabled) return;
    onChange(option);
    setIsOpen(false);
  };

  // Exquisite custom themes for each user role
  const roleThemes = {
    admin: { bg: '#fff1f2', text: '#e11d48', border: '#ffe4e6', ring: 'rgba(225,29,72,0.15)', dot: '#e11d48', label: 'Admin', icon: ShieldAlert },
    moderator: { bg: '#eff6ff', text: '#3b82f6', border: '#dbeafe', ring: 'rgba(59,130,246,0.15)', dot: '#3b82f6', label: 'Moderator', icon: ShieldCheck },
    buyer: { bg: '#f8f9fc', text: '#64748b', border: '#e2e8f0', ring: 'rgba(100,116,139,0.1)', dot: '#64748b', label: 'Buyer', icon: UserIcon },
    customer: { bg: '#f8f9fc', text: '#64748b', border: '#e2e8f0', ring: 'rgba(100,116,139,0.1)', dot: '#64748b', label: 'Buyer', icon: UserIcon },
  };

  const currentTheme = roleThemes[value?.toLowerCase()] || roleThemes.buyer;

  const dropdownMenu = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            top: coords.top + 6,
            left: coords.left,
            width: coords.width,
            zIndex: 9999
          }}
          className="absolute bg-white rounded-2xl shadow-[0_20px_40px_rgba(15,23,42,0.15)] border border-[#f1f5f9] p-1 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-0.5 p-0.5">
            {options.map((option, idx) => {
              const isSelected = value?.toLowerCase() === option?.toLowerCase();
              const theme = roleThemes[option?.toLowerCase()] || roleThemes.buyer;
              
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(option)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    background: isSelected ? '#f8f9fc' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = '#f8f9fc';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {/* Pulsing indicator dot */}
                    <div style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: theme.dot,
                      boxShadow: isSelected ? `0 0 0 4px ${theme.ring}` : 'none',
                      transition: 'all 0.2s'
                    }} />
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: isSelected ? 800 : 600,
                      color: isSelected ? '#0f172a' : '#64748b',
                      transition: 'all 0.2s'
                    }}>
                      {theme.label}
                    </span>
                  </div>

                  {/* Icon on the right */}
                  <theme.icon 
                    size={11} 
                    style={{ 
                      color: isSelected ? theme.text : '#cbd5e1',
                      transition: 'all 0.2s'
                    }} 
                  />

                  {/* Left Brand Glow Bar when selected */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: '25%',
                      bottom: '25%',
                      width: 3,
                      background: theme.dot,
                      borderRadius: '0 4px 4px 0'
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0.45rem 0.75rem',
          borderRadius: '9999px', // Gorgeous pill shape
          border: `1px solid ${isOpen ? currentTheme.text : currentTheme.border}`,
          background: currentTheme.bg,
          color: currentTheme.text,
          boxShadow: isOpen ? `0 0 0 3px ${currentTheme.ring}` : 'none',
          cursor: 'pointer',
          transition: 'all 0.25s ease',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = currentTheme.text;
            e.currentTarget.style.boxShadow = `0 2px 8px ${currentTheme.ring}`;
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = currentTheme.border;
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
          <currentTheme.icon size={11} style={{ shrink: 0 }} />
          <span style={{ 
            fontSize: '0.68rem', 
            fontWeight: 800, 
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {currentTheme.label}
          </span>
        </div>
        <ChevronDown 
          size={11} 
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'none', 
            transition: 'transform 0.3s ease',
            flexShrink: 0
          }} 
        />
      </button>

      {createPortal(dropdownMenu, document.body)}
    </div>
  );
};

export default AdminDropdown;
