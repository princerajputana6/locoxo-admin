import React from 'react'

// Generic badge. `tone` picks a color; pass any children.
const tones = {
  default: 'bg-surface-2 text-muted border-line',
  accent:  'bg-accent/15 text-accent border-accent/30',
  brand:   'bg-info/15 text-info border-info/30',
  success: 'bg-success/15 text-success border-success/30',
  amber:   'bg-amber/15 text-amber border-amber/30',
  danger:  'bg-danger/15 text-danger border-danger/30',
  violet:  'bg-violet/15 text-violet border-violet/30',
}

const Badge = ({ tone = 'default', children, className = '' }) => (
  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${tones[tone] || tones.default} ${className}`}>
    {children}
  </span>
)

export default Badge
