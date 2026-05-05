import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import useClickOutside from '../hooks/useClickOutside';

const AdminDropdown = ({ 
  value, 
  options, 
  onChange, 
  placeholder = 'Select option',
  renderOption,
  renderValue,
  className = '',
  buttonClassName = '',
  disabled = false,
  multiple = false,
  searchable = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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
    
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const isSelected = currentValues.includes(option);
      if (isSelected) {
        onChange(currentValues.filter(v => v !== option));
      } else {
        onChange([...currentValues, option]);
      }
    } else {
      onChange(option);
      setIsOpen(false);
    }
  };

  const filteredOptions = searchable 
    ? options.filter(opt => {
        const label = typeof opt === 'object' ? (opt.label || opt.name) : opt;
        return String(label).toLowerCase().includes(searchTerm.toLowerCase());
      })
    : options;

  const isSelected = (option) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(option);
    }
    return value === option;
  };

  const dropdownMenu = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          style={{
            position: 'absolute',
            top: coords.top,
            left: coords.left,
            width: coords.width,
            zIndex: 9999
          }}
          className="fixed mt-2 min-w-[200px] bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-[#eaeef2] p-2 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {searchable && (
            <div className="p-2 border-b border-slate-50 mb-1">
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-[#eaeef2] rounded-xl py-2 px-3 text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
              />
            </div>
          )}
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-1 p-1">
            {filteredOptions.length > 0 ? filteredOptions.map((option, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group text-left ${
                  isSelected(option) ? 'bg-secondary/10' : 'hover:bg-white'
                }`}
              >
                {renderOption ? renderOption(option, isSelected(option)) : (
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    isSelected(option) ? 'text-secondary' : 'text-[#64748b] group-hover:text-secondary'
                  }`}>
                    {typeof option === 'object' ? (option.label || option.name) : option}
                  </span>
                )}
              </button>
            )) : (
              <div className="p-4 text-center">
                <p className="text-[10px] font-black text-[#64748b] uppercase tracking-widest">No options found</p>
              </div>
            )}
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
        className={`w-full flex items-center justify-between gap-3 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm ${
          isOpen 
            ? 'bg-white border-indigo-500 text-[#6366f1] ring-4 ring-secondary/5' 
            : (buttonClassName || 'bg-white text-[#64748b] border-[#eaeef2] hover:border-[#eaeef2]')
        } ${disabled ? 'opacity-70 cursor-not-allowed grayscale-[0.2]' : ''}`}
      >
        <div className="flex items-center gap-2 truncate">
          {renderValue ? renderValue(value) : (
            <span className="truncate">
              {multiple 
                ? (Array.isArray(value) && value.length > 0 ? `${value.length} Selected` : placeholder)
                : (value || placeholder)
              }
            </span>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-500 shrink-0 ${isOpen ? 'rotate-180 text-secondary' : 'text-[#64748b]'}`} />
      </button>

      {createPortal(dropdownMenu, document.body)}
    </div>
  );
};

export default AdminDropdown;
