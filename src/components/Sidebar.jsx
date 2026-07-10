import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { assets } from '../assets/assets'
import {
  LayoutDashboard, Package, Tag, ShoppingCart, Users, Boxes,
  TicketPercent, Image, RotateCcw, Megaphone, Crown, Sparkles,
  BarChart3, TrendingUp, LifeBuoy, ChevronLeft, Calculator,
} from 'lucide-react'

const groups = [
  {
    label: null,
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Management',
    items: [
      { to: '/products', label: 'Products', icon: Package },
      { to: '/categories', label: 'Categories', icon: Tag },
      { to: '/orders', label: 'Orders', icon: ShoppingCart },
      { to: '/customers', label: 'Customers', icon: Users },
      { to: '/inventory', label: 'Inventory', icon: Boxes, accent: true },
      { to: '/calculator', label: 'Calculator', icon: Calculator },
      { to: '/coupons', label: 'Coupons', icon: TicketPercent },
      { to: '/banners', label: 'Banners', icon: Image },
      { to: '/returns', label: 'Returns', icon: RotateCcw },
      { to: '/influencers', label: 'Influencers', icon: TrendingUp },
      { to: '/tickets', label: 'Tickets', icon: LifeBuoy },
    ],
  },
  {
    label: 'Growth',
    items: [
      { to: '/marketing', label: 'Marketing', icon: Megaphone },
      { to: '/membership', label: 'Membership', icon: Crown },
      { to: '/ai-insights', label: 'AI Insights', icon: Sparkles },
    ],
  },
  {
    label: 'Reports',
    items: [
      { to: '/reports/sales', label: 'Sales', icon: BarChart3 },
      { to: '/reports/analytics', label: 'Analytics', icon: TrendingUp },
    ],
  },
]

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`hidden md:flex flex-col shrink-0 ${collapsed ? 'w-[72px]' : 'w-[230px]'} min-h-screen bg-surface border-r border-line transition-[width] duration-300 sticky top-0 h-screen`}>
      {/* Logo header */}
      <div className='flex items-center gap-2.5 px-4 h-16 border-b border-line/70 shrink-0'>
        <div className='grid place-items-center w-9 h-9 rounded-xl bg-accent-gradient shadow-glow shrink-0'>
          <span className='font-heading font-black text-brand-deep text-sm'>LX</span>
        </div>
        {!collapsed && (
          <div className='min-w-0 animate-fade-in'>
            <p className='font-heading font-extrabold text-fg leading-none'>LOCOXO</p>
            <p className='text-[10px] text-faint uppercase tracking-widest'>Admin</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={`ml-auto grid place-items-center w-7 h-7 rounded-lg text-faint hover:text-fg hover:bg-surface-2 transition-all ${collapsed ? 'rotate-180' : ''}`}
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className='flex-1 overflow-y-auto py-4 px-2.5 space-y-1'>
        {groups.map((g, gi) => (
          <div key={gi} className={gi > 0 ? 'pt-4' : ''}>
            {g.label && !collapsed && (
              <p className='px-3 mb-1.5 text-[10px] font-bold text-faint uppercase tracking-widest'>{g.label}</p>
            )}
            <div className='space-y-1'>
              {g.items.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end={it.end}
                  title={it.label}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-[13px] transition-all duration-200 ${
                      isActive
                        ? 'bg-accent/10 text-accent'
                        : 'text-muted hover:text-fg hover:bg-surface-2'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className='absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-accent-gradient animate-scale-in' />
                      )}
                      <it.icon size={18} className={`shrink-0 ${isActive ? 'text-accent' : 'text-faint group-hover:text-fg'} transition-colors`} />
                      {!collapsed && <span className='truncate'>{it.label}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className='p-3 shrink-0'>
          <div className='rounded-xl bg-brand-gradient p-3 text-white text-xs'>
            <p className='font-semibold flex items-center gap-1.5'><Sparkles size={13} className='text-glow' /> Pro tip</p>
            <p className='text-white/70 mt-1 leading-snug'>Use Inventory → Bulk Add to create products and auto-generate barcodes in one go.</p>
          </div>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
