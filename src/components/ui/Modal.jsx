import React, { useEffect } from 'react'
import { X } from 'lucide-react'

// Centered dark modal with backdrop blur + escape-to-close.
const Modal = ({ open, onClose, title, subtitle, icon: Icon, children, footer, size = 'md' }) => {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const sizes = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' }

  return (
    <div className='fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto'>
      {/* backdrop */}
      <div
        className='fixed inset-0 bg-black/70 backdrop-blur-sm animate-fade-in'
        onClick={onClose}
      />
      {/* panel */}
      <div className={`relative w-full ${sizes[size] || sizes.md} my-auto`}>
        <div className='glass rounded-2xl shadow-card-hover animate-scale-in overflow-hidden'>
          {(title || icon) && (
            <div className='flex items-center justify-between gap-3 px-5 py-4 border-b border-line/70'>
              <div className='flex items-center gap-3 min-w-0'>
                {Icon && (
                  <span className='grid place-items-center w-9 h-9 rounded-xl bg-accent/15 text-accent shrink-0'>
                    <Icon size={16} />
                  </span>
                )}
                <div className='min-w-0'>
                  {title && <h3 className='font-heading font-bold text-fg truncate'>{title}</h3>}
                  {subtitle && <p className='text-[11px] text-muted truncate'>{subtitle}</p>}
                </div>
              </div>
              <button
                onClick={onClose}
                className='grid place-items-center w-8 h-8 rounded-lg text-muted hover:text-fg hover:bg-surface-2 transition-colors shrink-0'
              >
                <X size={16} />
              </button>
            </div>
          )}
          <div className='p-5 max-h-[70vh] overflow-y-auto'>{children}</div>
          {footer && (
            <div className='flex items-center justify-end gap-2 px-5 py-4 border-t border-line/70 bg-surface/40'>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Modal
