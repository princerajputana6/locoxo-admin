import React from 'react'

const Card = ({ title, subtitle, icon: Icon, actions, children, className = '', bodyClass = '', delay = 0 }) => {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={`glass animate-slide-up rounded-2xl ${className}`}
    >
      {(title || actions) && (
        <div className='flex items-center justify-between gap-3 px-5 py-4 border-b border-white/5'>
          <div className='flex items-center gap-2.5 min-w-0'>
            {Icon && (
              <span className='grid place-items-center w-9 h-9 rounded-xl bg-accent/12 text-accent shrink-0'>
                <Icon size={16} />
              </span>
            )}
            <div className='min-w-0'>
              {title && <h3 className='font-heading font-bold text-fg text-sm truncate'>{title}</h3>}
              {subtitle && <p className='text-[11px] text-muted truncate'>{subtitle}</p>}
            </div>
          </div>
          {actions && <div className='flex items-center gap-2 shrink-0'>{actions}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClass}`}>{children}</div>
    </div>
  )
}

export default Card
