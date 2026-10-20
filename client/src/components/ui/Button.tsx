import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { classNames } from '../../utils/format';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  block?: boolean;
  icon?: ReactNode;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  icon,
  loading = false,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classNames(
        'button',
        `button--${variant}`,
        size === 'sm' && 'button--sm',
        block && 'button--block',
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className="spinner" style={{ width: 14, height: 14 }} aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}
