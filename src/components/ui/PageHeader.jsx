import React from 'react'

// Consistent page header: icon + title + subtitle on the left, actions on the right.
const PageHeader = ({ icon: Icon, title, subtitle, actions, className = '' }) => (
  <div className={`flex flex-wrap items-center justify-between gap-4 mb-6 animate-slide-down ${className}`}>
    <div className='flex items-center gap-3 min-w-0'>
      {Icon && (
        <span className='grid place-items-center w-11 h-11 rounded-2xl bg-accent/15 text-accent border border-accent/30 shrink-0'>
          <Icon size={20} />
        </span>
      )}
      <div className='min-w-0'>
        <h1 className='text-2xl font-heading font-extrabold text-fg leading-tight truncate'>{title}</h1>
        {subtitle && <p className='text-sm text-muted truncate'>{subtitle}</p>}
      </div>
    </div>
    {actions && <div className='flex items-center gap-2 shrink-0'>{actions}</div>}
  </div>
)

export default PageHeader
