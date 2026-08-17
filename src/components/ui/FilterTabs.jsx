import React from 'react'

// A row of pill toggle buttons. `options` = array of strings or {value,label,count}.
const FilterTabs = ({ options, value, onChange, className = '' }) => {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {options.map((opt) => {
        const val = typeof opt === 'string' ? opt : opt.value
        const label = typeof opt === 'string' ? opt : (opt.label || opt.value)
        const count = typeof opt === 'object' ? opt.count : undefined
        const active = value === val
        return (
          <button
            key={val}
            onClick={() => onChange(val)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all duration-200 border ${
              active
                ? 'bg-accent-gradient text-white border-transparent shadow-glow'
                : 'bg-surface-2 text-muted border-line hover:text-fg hover:border-accent/50'
            }`}
          >
            {label}
            {count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-brand-deep/20' : 'bg-surface-3 text-faint'}`}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default FilterTabs
