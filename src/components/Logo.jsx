import React from 'react';

/**
 * A shared Logo component with configurable size.
 * Centralizes the brand identity.
 */
const Logo = ({ className = "w-20 h-20", variant = "black", showText = false, textClassName = "text-2xl", flexRow = false }) => {
  const logoSrc = variant === "white" ? "/assets/logo_white.png" : "/assets/logo_black.png";
  
  return (
    <div className={`flex ${flexRow ? 'flex-row' : 'flex-col'} items-center gap-2`}>
      <div className={`${className} overflow-hidden shrink-0`}>
        <img src={logoSrc} className="w-full h-full object-contain" alt="Eraya Logo" />
      </div>
      {showText && (
        <h1 className={`${textClassName} font-bold tracking-[0.2em] text-slate-900`}>ERAYA</h1>
      )}
    </div>
  );
};

export default Logo;
