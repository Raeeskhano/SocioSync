import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-body font-medium transition-all duration-200 rounded-md px-4 py-2 text-sm';
  
  const variants = {
    primary: 'bg-gradient-to-r from-primary to-primary-dim text-on-primary-fixed hover:shadow-ambient hover:brightness-110',
    secondary: 'bg-transparent border border-ghost text-primary hover:bg-surface-bright',
    tertiary: 'bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-bright',
    surface: 'bg-surface-container-highest text-on-surface hover:bg-surface-bright border border-ghost',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
