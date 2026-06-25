import React from 'react'

// Maps a free-form status string to a colored pill. Tries fuzzy keyword match.
const rules = [
  { test: /deliver|complete|success|active|resolved|sent|paid|approved|stock|paid/i, tone: 'success' },
  { test: /pend|packing|process|pending|review/i, tone: 'amber' },
  { test: /ship|transit|out|return|reject|cancel|fail|out_of_stock|inactive|closed|low/i, tone: 'danger' },
  { test: /order placed|open|new/i, tone: 'brand' },
]

const toneClasses = {
  default: 'bg-surface-2 text-muted border-line',
  accent:  'bg-accent/15 text-accent border-accent/30',
  brand:   'bg-info/15 text-info border-info/30',
  success: 'bg-success/15 text-success border-success/30',
  amber:   'bg-amber/15 text-amber border-amber/30',
  danger:  'bg-danger/15 text-danger border-danger/30',
  violet:  'bg-violet/15 text-violet border-violet/30',
}

const StatusPill = ({ status, tone, className = '' }) => {
  const resolved = tone || rules.find((r) => r.test.test(String(status || '')))?.tone || 'default'
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full border ${toneClasses[resolved]} ${className}`}>
      <span className='w-1.5 h-1.5 rounded-full bg-current opacity-70' />
      {status || '—'}
    </span>
  )
}

export default StatusPill
