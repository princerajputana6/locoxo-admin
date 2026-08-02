import React from 'react'
import { Loader2 } from 'lucide-react'

const variants = {
  primary:
    'bg-accent-gradient text-brand-deep font-semibold shadow-glow hover:brightness-110 active:brightness-95',
  secondary:
    'bg-surface-2 text-fg border border-line hover:border-accent/60 hover:bg-surface-3',
  ghost:
    'bg-transparent text-muted hover:text-fg hover:bg-surface-2',
  danger:
    'bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25',
  dark:
    'bg-brand-gradient text-white hover:brightness-110',
  outline:
    'bg-transparent text-fg border border-line hover:border-accent/60 hover:bg-surface-2',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-sm gap-2',
}

const Btn = ({
  as = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  icon: Icon,
  loading = false,
  disabled = false,
  ...rest
}) => {
  const Tag = as
  // When loading, show a spinning loader in place of the icon and disable the button.
  const ShownIcon = loading ? Loader2 : Icon
  return (
    <Tag
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-xl transition-all duration-200 select-none disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
    >
      {ShownIcon && <ShownIcon size={size === 'sm' ? 14 : 16} className={`shrink-0 ${loading ? 'animate-spin' : ''}`} />}
      {children}
    </Tag>
  )
}

export default Btn
