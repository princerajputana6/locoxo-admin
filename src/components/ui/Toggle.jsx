import React from 'react'

// iOS-style dark toggle switch.
const Toggle = ({ checked, onChange, label, className = '' }) => (
  <label className={`inline-flex items-center gap-2.5 cursor-pointer select-none ${className}`}>
    <button
      type='button'
      role='switch'
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-accent-gradient' : 'bg-surface-3 border border-line'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`}
      />
    </button>
    {label && <span className='text-sm text-fg'>{label}</span>}
  </label>
)

export default Toggle
