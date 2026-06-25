import React from 'react'

// Tones map to status accents on the dark surface — each gets a soft corner glow.
const tones = {
  default: { icon: 'text-muted', chip: 'bg-white/5', glow: 'rgba(143,160,181,0.10)' },
  accent:  { icon: 'text-accent', chip: 'bg-accent/15', glow: 'rgba(245,154,35,0.16)' },
  brand:   { icon: 'text-info', chip: 'bg-info/15', glow: 'rgba(96,165,250,0.16)' },
  success: { icon: 'text-success', chip: 'bg-success/15', glow: 'rgba(52,211,153,0.16)' },
  amber:   { icon: 'text-amber', chip: 'bg-amber/15', glow: 'rgba(251,191,36,0.16)' },
  danger:  { icon: 'text-danger', chip: 'bg-danger/15', glow: 'rgba(248,113,113,0.16)' },
  violet:  { icon: 'text-violet', chip: 'bg-violet/15', glow: 'rgba(167,139,250,0.16)' },
}

const StatCard = ({ icon: Icon, label, value, sub, tone = 'default', onClick, delay = 0 }) => {
  const t = tones[tone] || tones.default
  const interactive = !!onClick
  return (
    <div
      onClick={onClick}
      style={{
        animationDelay: `${delay}ms`,
        backgroundImage: `radial-gradient(140px 140px at 100% 0%, ${t.glow}, transparent 70%)`,
      }}
      className={`glass card-hover animate-slide-up rounded-2xl p-4 relative overflow-hidden ${interactive ? 'cursor-pointer' : ''}`}
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-[10px] font-semibold uppercase tracking-widest text-faint mb-1.5'>{label}</p>
          <p className='text-2xl font-heading font-extrabold text-gloss truncate'>{value}</p>
          {sub && <p className='text-[11px] text-muted mt-1 truncate'>{sub}</p>}
        </div>
        {Icon && (
          <span className={`shrink-0 grid place-items-center w-10 h-10 rounded-xl ${t.chip} ${t.icon}`}>
            <Icon size={18} />
          </span>
        )}
      </div>
    </div>
  )
}

export default StatCard
