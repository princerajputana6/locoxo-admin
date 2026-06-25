import React from 'react'

const EmptyState = ({ icon: Icon, title, message, action, className = '' }) => (
  <div className={`flex flex-col items-center justify-center text-center py-14 px-6 ${className}`}>
    {Icon && (
      <span className='grid place-items-center w-14 h-14 rounded-2xl bg-surface-2 text-faint mb-3 animate-float'>
        <Icon size={26} />
      </span>
    )}
    {title && <p className='font-heading font-semibold text-fg'>{title}</p>}
    {message && <p className='text-sm text-muted mt-1 max-w-sm'>{message}</p>}
    {action && <div className='mt-4'>{action}</div>}
  </div>
)

export default EmptyState
