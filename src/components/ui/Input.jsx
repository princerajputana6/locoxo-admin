import React from 'react'

// Thin wrapper that gives inputs a consistent dark field look.
// Forwards every native prop; className is appended.
const Input = ({ className = '', ...rest }) => (
  <input
    {...rest}
    className={`w-full px-3.5 py-2.5 text-sm rounded-xl bg-surface-2 border border-line text-fg placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all ${className}`}
  />
)

export const Field = ({ label, hint, children, className = '', full }) => (
  <label className={`block ${full ? 'sm:col-span-2' : ''} ${className}`}>
    {label && <span className='block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1.5'>{label}</span>}
    {children}
    {hint && <span className='block text-[11px] text-faint mt-1'>{hint}</span>}
  </label>
)

export default Input
