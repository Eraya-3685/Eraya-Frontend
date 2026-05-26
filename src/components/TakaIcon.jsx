import React from 'react';

const TakaIcon = ({ style, className, size = '1.25rem' }) => {
  return (
    <span 
      className={className}
      style={{ 
        fontSize: size, 
        fontWeight: '900', 
        lineHeight: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'inherit',
        ...style
      }}
    >
      ৳
    </span>
  );
};

export default TakaIcon;
