import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', icon: Icon, ...props }) => {
  return (
    <button className={`ds-btn ds-btn-${variant} ${className}`} {...props}>
      {Icon && <Icon className="icon-sm" />}
      {children}
    </button>
  );
};

export const IconButton = ({ children, variant = 'ghost', className = '', ...props }) => {
  return (
    <button className={`ds-btn ds-btn-${variant} ds-btn-icon ${className}`} {...props}>
      {children}
    </button>
  );
};
