import React from 'react';
import { Link } from 'react-router-dom';
import './Button.css';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  tertiary: 'btn-tertiary',
};

function Button({
  variant = 'primary',
  to,
  href,
  children,
  className = '',
  onClick,
  type = 'button',
  disabled,
  ...props
}) {
  const variantClass = variants[variant] || variants.primary;
  const classes = `btn ${variantClass} ${className}`.trim();

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }
  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
