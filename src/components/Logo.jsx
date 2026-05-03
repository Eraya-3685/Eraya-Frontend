import React from 'react';
import { Leaf, Flower2 } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * A shared Logo component with configurable size.
 * Centralizes the brand identity.
 */
const Logo = ({ 
  className = "w-20 h-20", 
  variant = "black", 
  showText = false, 
  textClassName = "text-2xl", 
  flexRow = false,
  showAccents = false,
  showImage = true
}) => {
  const logoSrc = variant === "white" ? "/assets/logo_white.png" : "/assets/logo_black.png";
  
  const LeafIcon = () => (
    <motion.svg 
      width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" 
      className="text-secondary/90 drop-shadow-[0_4px_10px_rgba(var(--secondary-rgb),0.2)]"
    >
      {/* Intricate Leaf Branch */}
      <path d="M16 30C16 30 16 22 16 16C16 10 20 6 24 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M16 24C16 24 10 20 5 21C2 21.5 1 24 1 24C1 24 2 18 6 17C10 16 16 18 16 18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 18C16 18 22 14 27 15C30 15.5 31 18 31 18C31 18 30 12 26 11C22 10 16 12 16 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 12C16 12 10 8 5 9C2 9.5 1 12 1 12C1 12 2 6 6 5C10 4 16 6 16 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="16" cy="15" r="1.5" fill="currentColor" opacity="0.3" />
    </motion.svg>
  );

  const RoseIcon = () => (
    <motion.svg 
      width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" 
      className="text-secondary/90 drop-shadow-[0_4px_10px_rgba(var(--secondary-rgb),0.2)]"
    >
      {/* Detailed Blooming Rose */}
      <path d="M16 30V24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M16 24C14 24 8 22 8 18C8 14 12 12 16 12C20 12 24 14 24 18C24 22 18 24 16 24Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 20C16 20 12 18 12 14C12 10 14 8 16 8C18 8 20 10 20 14C20 18 16 20 16 20Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 16C16 16 14 15 14 13C14 11 15 10 16 10C17 10 18 11 18 13C18 15 16 16 16 16Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 18C10 18 6 16 4 18C2 20 3 23 3 23C3 23 4 19 8 18.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
      <path d="M22 18C22 18 26 16 28 18C30 20 29 23 29 23C29 23 28 19 24 18.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    </motion.svg>
  );
  
  return (
    <div className={`flex ${flexRow ? 'flex-row' : 'flex-col'} items-center gap-4`}>
      {showImage && (
        <div className={`${className} ${variant === "black" ? 'glass-card-light' : ''} overflow-hidden shrink-0`}>
          <img src={logoSrc} className="w-full h-full object-contain p-1" alt="Eraya Logo" />
        </div>
      )}
      {showText && (
        <div className="flex items-center gap-4">
          {showAccents && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: -5 }}
              whileHover={{ rotate: 0, scale: 1.1 }}
              className="hidden sm:block"
            >
              <LeafIcon />
            </motion.div>
          )}
          <h1 className={`${textClassName} font-bold tracking-[0.25em] text-white drop-shadow-sm`}>ERAYA</h1>
          {showAccents && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: 20 }}
              animate={{ opacity: 1, scale: 1, rotate: 5 }}
              whileHover={{ rotate: 0, scale: 1.1 }}
              className="hidden sm:block"
            >
              <RoseIcon />
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
