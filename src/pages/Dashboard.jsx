import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import {
  ShoppingBag, CreditCard, Package, Clock, Truck, RefreshCw, Bell, CalendarDays,
  IndianRupee, Users, Box, XCircle, Eye, TrendingUp, Ticket, ArrowRight, User,
} from 'lucide-react'

const StatCard = ({ icon: Icon, value, label, cta, onClick }) => (
  <div className='glass rounded-2xl p-4'>
    <div className='flex items-center gap-3'>
      <span className='grid place-items-center w-11 h-11 rounded-xl bg-fg text-white'><Icon size={20} /></span>
      <div><p className='text-2xl font-heading font-extrabold text-fg leading-none'>{value}</p><p className='text-xs text-muted mt-1'>{label}</p></div>
    </div>
    {cta && <button onClick={onClick} className='mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline'>{cta} <ArrowRight size={12} /></button>}
  </div>
)

const Panel = ({ title, cta, onCta, children, className = '' }) => (
  <div className={`glass rounded-2xl p-5 ${className}`}>
    <div className='flex items-center justify-between mb-3'><p className='font-heading font-bold text-fg'>{title}</p>{cta && <button onClick={onCta} className='text-xs font-semibold text-accent inline-flex items-center gap-1 hover:underline'>{cta} <ArrowRight size={12} /></button>}</div>
    {children}
  </div>
)

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`
  return `${Math.floor(s / 86400)}d ago`
}

const Dashboard = ({ token }) => {
  const navigate = useNavigate()
  const [d, setD] = useState(null)
  const load = async () => {
    try { const { data } = await axios.get(backendUrl + '/api/analytics/dashboard', { headers: { token } }); if (data.success) setD(data); else toast.error(data.message) }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to load dashboard') }
  }
  useEffect(() => { load() }, [])
  const c = d?.cards || {}
  const maxSold = Math.max(1, ...(d?.bestSellers || []).map((b) => b.sold))
  const compTotal = d?.complaints?.total || 1
  const donut = d?.complaints ? `conic-gradient(#16A34A 0 ${(d.complaints.resolved / compTotal) * 360}deg, #2563EB 0 ${((d.complaints.resolved + d.complaints.inProgress) / compTotal) * 360}deg, #CBD5E1 0 360deg)` : ''

  return (
    <div className='p-6'>
      <div className='flex items-start justify-between mb-5'>
        <div><h1 className='text-2xl font-heading font-extrabold text-fg'>Dashboard</h1><p className='text-sm text-muted'>Welcome back, Admin!</p></div>
        <div className='flex items-center gap-2'>
          <span className='inline-flex items-center gap-2 px-3 py-2 text-sm rounded-xl bg-white border border-line text-muted'><CalendarDays size={15} /> {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          <button onClick={load} className='grid place-items-center w-10 h-10 rounded-xl bg-white border border-line text-muted'><RefreshCw size={16} /></button>
        </div>
      </div>

      {/* Stat cards */}
      <div className='grid grid-cols-2 md:grid-cols-5 gap-3 mb-3'>
        <StatCard icon={ShoppingBag} value={c.recentOrders ?? '—'} label='Recent Orders' cta='View all orders' onClick={() => navigate('/orders')} />
        <StatCard icon={CreditCard} value={c.codOrders ?? '—'} label='COD Orders' cta='View details' onClick={() => navigate('/orders')} />
        <StatCard icon={Package} value={c.pickupOrders ?? '—'} label='Total Pickup Orders' cta='View details' onClick={() => navigate('/orders?tab=Pickuped')} />
        <StatCard icon={Clock} value={c.pendingOrders ?? '—'} label='Total Pending Orders' cta='View details' onClick={() => navigate('/orders?tab=Pending')} />
        <StatCard icon={Truck} value={c.dispatchedOrders ?? '—'} label='Total Dispatched Orders' cta='View details' onClick={() => navigate('/orders')} />
      </div>
      <div className='grid grid-cols-2 md:grid-cols-5 gap-3 mb-5'>
        <StatCard icon={RefreshCw} value={c.rtoExchangeReturn ?? '—'} label='RTO / Exchange / Return' cta='View details' onClick={() => navigate('/returns')} />
        <StatCard icon={Bell} value={c.stockAlerts ?? '—'} label='Stock Alerts' cta='View details' onClick={() => navigate('/inventory')} />
        <StatCard icon={CalendarDays} value={c.ordersToday ?? '—'} label='Total Orders Today' cta='View details' onClick={() => navigate('/orders')} />
        <StatCard icon={IndianRupee} value={`${currency}${(c.totalSales || 0).toLocaleString('en-IN')}`} label='Total Sales' cta='View details' onClick={() => navigate('/reports/sales')} />
        <StatCard icon={IndianRupee} value={`${currency}${(c.todayRevenue || 0).toLocaleString('en-IN')}`} label='Total Today Revenue' cta='View details' onClick={() => navigate('/reports/sales')} />
      </div>

      {/* Row: recent customers, logins, products, cancelled */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-3 mb-3'>
        <Panel title='Recent Customers' cta='View all' onCta={() => navigate('/customers')}>
          <div className='space-y-2'>
            {(d?.recentCustomers || []).length === 0 ? <p className='text-sm text-muted'>No customers.</p> :
              d.recentCustomers.map((u, i) => (
                <div key={i} className='flex items-center gap-2'><span className='w-8 h-8 rounded-full bg-accent/15 text-accent grid place-items-center'><User size={14} /></span><div className='min-w-0 flex-1'><p className='text-sm font-semibold text-fg truncate'>{u.name}</p><p className='text-[11px] text-muted truncate'>{u.email}</p></div><span className='text-[11px] text-faint'>{timeAgo(u.at)}</span></div>
              ))}
          </div>
        </Panel>
        <Panel title='Total Customer Login'><div className='flex items-center gap-3'><Users size={30} className='text-accent' /><div><p className='text-3xl font-heading font-extrabold text-fg'>{(d?.totalCustomers ?? 0).toLocaleString('en-IN')}</p><p className='text-xs text-muted'>Total Registered Customers</p></div></div></Panel>
        <Panel title='Total Products'><div className='flex items-center gap-3'><Box size={30} className='text-accent' /><p className='text-3xl font-heading font-extrabold text-fg'>{d?.totalProducts ?? 0}</p></div><button onClick={() => navigate('/products')} className='mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent'>View all products <ArrowRight size={12} /></button></Panel>
        <Panel title='Cancelled Order Requests' cta='View all' onCta={() => navigate('/orders?tab=Cancelled')}><div className='flex items-center gap-3'><XCircle size={30} className='text-danger' /><div><p className='text-3xl font-heading font-extrabold text-fg'>{d?.cancelledRequests ?? 0}</p><p className='text-xs text-muted'>Pending Requests</p></div></div></Panel>
      </div>

      {/* Row: product views, best sellers */}
      <div className='grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-3 mb-3'>
        <Panel title='Which Product View'>
          <div className='space-y-2'>
            {(d?.productViews || []).map((p, i) => (
              <div key={i} className='flex items-center gap-2 text-sm'><Eye size={14} className='text-muted' /><span className='flex-1 truncate text-fg'>{p.name}</span><span className='text-muted'>{p.views.toLocaleString('en-IN')} Views</span></div>
            ))}
            {(d?.productViews || []).length === 0 && <p className='text-sm text-muted'>No data.</p>}
          </div>
        </Panel>
        <Panel title='Best Selling Products' cta='View full report' onCta={() => navigate('/reports/analytics')}>
          <div className='space-y-2'>
            {(d?.bestSellers || []).map((b, i) => (
              <div key={i} className='flex items-center gap-3 text-sm'><span className='w-4 text-muted'>{i + 1}</span><span className='w-40 truncate text-fg'>{b.name}</span><div className='flex-1 h-2 rounded-full bg-surface-2 overflow-hidden'><div className='h-full bg-fg' style={{ width: `${(b.sold / maxSold) * 100}%` }} /></div><span className='w-16 text-right text-muted'>{b.sold} Sold</span></div>
            ))}
            {(d?.bestSellers || []).length === 0 && <p className='text-sm text-muted'>No sales yet.</p>}
          </div>
        </Panel>
      </div>

      {/* Row: daily tickets, complaints */}
      <div className='grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-3'>
        <Panel title='Total Daily Raise Ticket' cta='View all tickets' onCta={() => navigate('/tickets')}><div className='flex items-center gap-3'><Ticket size={30} className='text-accent' /><div><p className='text-3xl font-heading font-extrabold text-fg'>{d?.dailyTickets ?? 0}</p><p className='text-xs text-muted'>Tickets Raised Today</p></div></div></Panel>
        <Panel title='Total Complaint / Problem Requests' cta='View all requests' onCta={() => navigate('/returns')}>
          <div className='flex items-center gap-6'>
            <div className='w-24 h-24 rounded-full grid place-items-center' style={{ background: donut }}><div className='w-14 h-14 rounded-full bg-surface grid place-items-center text-sm font-bold text-fg'>{d?.complaints?.total ?? 0}</div></div>
            <div className='space-y-1.5 text-sm'>
              <p className='flex items-center gap-2'><span className='w-3 h-3 rounded-full bg-success' /> Resolved <span className='text-muted ml-auto'>{d?.complaints?.resolved ?? 0} ({compTotal ? Math.round((d?.complaints?.resolved || 0) / compTotal * 100) : 0}%)</span></p>
              <p className='flex items-center gap-2'><span className='w-3 h-3 rounded-full bg-accent' /> In Progress <span className='text-muted ml-auto'>{d?.complaints?.inProgress ?? 0} ({compTotal ? Math.round((d?.complaints?.inProgress || 0) / compTotal * 100) : 0}%)</span></p>
              <p className='flex items-center gap-2'><span className='w-3 h-3 rounded-full bg-line' /> Pending <span className='text-muted ml-auto'>{d?.complaints?.pending ?? 0} ({compTotal ? Math.round((d?.complaints?.pending || 0) / compTotal * 100) : 0}%)</span></p>
            </div>
            <div className='ml-auto text-right'><p className='text-3xl font-heading font-extrabold text-fg'>{d?.complaints?.total ?? 0}</p><p className='text-xs text-muted'>Total Requests</p></div>
          </div>
        </Panel>
      </div>

      <p className='text-center text-xs text-faint mt-6'>© {new Date().getFullYear()} LOCOXO. All rights reserved. · Version 1.0.0</p>
    </div>
  )
}

export default Dashboard
