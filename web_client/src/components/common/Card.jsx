import React from 'react';

export const Card = ({ children, className = '', ...props }) => {
  return (
    <div className={`ds-card ${className}`} {...props}>
      {children}
    </div>
  );
};
