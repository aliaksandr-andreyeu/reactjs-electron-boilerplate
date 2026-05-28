import React from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'icon' | 'ghost';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}) => {
  const classes = ['btn', `btn--${variant}`, className].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? '…' : children}
    </button>
  );
};
