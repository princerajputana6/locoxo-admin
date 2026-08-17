import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import {
  Users, Search, Eye, Ban, CheckCircle2, CreditCard, Trash2,
  ShoppingBag, Undo2, Heart, Wallet, MapPin,
} from 'lucide-react'
import { PageHeader, Btn, StatCard, EmptyState, StatusPill, Modal } from '../components/ui'

const Customers = ({ token }) => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(backendUrl + '/api/user/customers', { headers: { token } })
      if (data.success) setCustomers(data.customers)
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load customers') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchCustomers() }, [])

  const filtered = useMemo(() => customers.filter((c) =>
    `${c.name || ''} ${c.email || ''} ${c.phone || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  ), [customers, searchTerm])

  const openDetail = async (id) => {
    setDetailLoading(true); setDetail({ _id: id })
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/customer/${id}`, { headers: { token } })
      if (data.success) setDetail(data.customer)
      else { toast.error(data.message); setDetail(null) }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); setDetail(null) }
    finally { setDetailLoading(false) }
  }

  const block = async (id, blocked) => {
    try {
      const { data } = await axios.put(`${backendUrl}/api/user/customer/${id}/block`, { blocked }, { headers: { token } })
      if (data.success) { toast.success(data.message); fetchCustomers(); if (detail?._id === id) setDetail((d) => ({ ...d, status: data.status })) }
    } catch { toast.error('Failed') }
  }
  const toggleCod = async (id, codDisabled) => {
    try {
      const { data } = await axios.put(`${backendUrl}/api/user/customer/${id}/cod`, { codDisabled }, { headers: { token } })
      if (data.success) { toast.success(data.message); if (detail?._id === id) setDetail((d) => ({ ...d, codDisabled: data.codDisabled })) }
    } catch { toast.error('Failed') }
  }
  const remove = async (id) => {
    if (!window.confirm('Delete this customer account permanently?')) return
    try {
      const { data } = await axios.delete(`${backendUrl}/api/user/customer/${id}`, { headers: { token } })
      if (data.success) { toast.success('Customer removed'); setDetail(null); fetchCustomers() }
    } catch { toast.error('Failed') }
  }

  const custId = (c) => {
    const n = (c.name || 'CUS').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3).padEnd(3, 'X')
    const t = (c.phone || '').replace(/\D/g, '').slice(-5)
    return `${n}${t || (c._id || '').slice(-5)}`
  }

  return (
    <div className='p-6'>
      <PageHeader icon={Users} title='Customer Management' subtitle='Profiles · orders · block · COD control'
        actions={<div className='bg-surface-2 border border-line text-fg px-4 py-2 rounded-xl text-sm font-semibold'>{customers.length} customers</div>}
      />

      <div className='glass rounded-2xl p-3 mb-4'>
        <div className='relative max-w-md'>
          <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none' />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder='Search by name, email or phone…'
            className='w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-surface-2 border border-line text-fg placeholder:text-faint focus:border-accent outline-none' />
        </div>
      </div>

      <div className='glass rounded-2xl overflow-hidden'>
        <div className='hidden md:grid grid-cols-[1.6fr_1fr_1.4fr_1fr_1fr] items-center px-4 py-2.5 border-b border-line/70 bg-surface/40 text-[10px] font-semibold uppercase tracking-widest text-faint'>
          <span>Customer</span><span>Customer ID</span><span>Email</span><span>Joined</span><span className='text-right'>Actions</span>
        </div>
        {loading ? (
          <div className='p-6 space-y-3'>{[0, 1, 2, 3].map((i) => <div key={i} className='skeleton rounded-xl h-14' />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title='No customers' message={searchTerm ? 'None match your search.' : 'No customers yet.'} />
        ) : filtered.map((c) => (
          <div key={c._id} className='grid grid-cols-1 md:grid-cols-[1.6fr_1fr_1.4fr_1fr_1fr] items-center gap-3 px-4 py-3 border-b border-line/60 last:border-0 hover:bg-surface-2/40 transition-colors'>
            <div className='flex items-center gap-2 min-w-0'>
              <span className='w-9 h-9 rounded-full bg-accent/15 text-accent grid place-items-center font-bold text-sm shrink-0'>{(c.name || 'C')[0]?.toUpperCase()}</span>
              <div className='min-w-0'>
                <p className='font-semibold text-sm text-fg truncate'>{c.name || 'N/A'}</p>
                <p className='text-xs text-muted truncate'>{c.phone || '—'}</p>
              </div>
            </div>
            <span className='font-mono text-xs text-accent/80'>{custId(c)}</span>
            <span className='text-sm text-muted truncate'>{c.email}</span>
            <span className='text-xs text-muted'>{c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '—'}</span>
            <div className='flex items-center justify-end gap-1.5'>
              {c.status === 'blocked' && <StatusPill status='Blocked' />}
              <Btn variant='secondary' size='sm' icon={Eye} onClick={() => openDetail(c._id)}>View</Btn>
              <button onClick={() => remove(c._id)} title='Delete' className='grid place-items-center w-8 h-8 rounded-lg text-muted hover:text-danger hover:bg-danger/10'><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail drawer */}
      <Modal open={!!detail} onClose={() => setDetail(null)} icon={Users}
        title={detail?.name || 'Customer'} subtitle={detail?.customerId} size='lg'
        footer={detail && detail.email ? (
          <div className='flex items-center gap-2 w-full'>
            <Btn variant='ghost' size='sm' icon={detail.status === 'blocked' ? CheckCircle2 : Ban} onClick={() => block(detail._id, detail.status !== 'blocked')}>
              {detail.status === 'blocked' ? 'Unblock' : 'Block'}
            </Btn>
            <Btn variant='ghost' size='sm' icon={CreditCard} onClick={() => toggleCod(detail._id, !detail.codDisabled)}>
              {detail.codDisabled ? 'Enable COD' : 'Remove COD'}
            </Btn>
            <Btn variant='ghost' size='sm' icon={Trash2} onClick={() => remove(detail._id)} className='ml-auto text-danger'>Delete</Btn>
          </div>
        ) : null}
      >
        {detailLoading || !detail?.email ? (
          <div className='space-y-3'>{[0, 1, 2].map((i) => <div key={i} className='skeleton rounded-xl h-16' />)}</div>
        ) : (
          <div className='space-y-5'>
            {/* profile */}
            <div className='flex flex-wrap gap-x-6 gap-y-1 text-sm'>
              <span className='text-muted'>Email: <span className='text-fg'>{detail.email}</span></span>
              <span className='text-muted'>Phone: <span className='text-fg'>{detail.phone || '—'}</span></span>
              <span className='text-muted'>DOB: <span className='text-fg'>{detail.dob ? new Date(detail.dob).toLocaleDateString('en-IN') : '—'}</span></span>
              <span className='text-muted'>Status: <span className='text-fg'>{detail.status}{detail.codDisabled ? ' · COD off' : ''}</span></span>
            </div>

            {/* stat tiles */}
            <div className='grid grid-cols-3 sm:grid-cols-6 gap-2.5'>
              <MiniTile icon={ShoppingBag} label='Orders' value={detail.stats.orders} />
              <MiniTile icon={CheckCircle2} label='Delivered' value={detail.stats.delivered} />
              <MiniTile icon={Undo2} label='Returns' value={detail.stats.returns} />
              <MiniTile icon={Heart} label='Wishlist' value={detail.stats.wishlist} />
              <MiniTile icon={MapPin} label='Address' value={detail.stats.addresses} />
              <MiniTile icon={Wallet} label='Spend' value={`${currency}${Math.round(detail.stats.totalSpend).toLocaleString('en-IN')}`} />
            </div>

            {/* order history */}
            <div>
              <p className='text-[11px] font-semibold uppercase tracking-widest text-faint mb-2'>Order history</p>
              {detail.orders.length === 0 ? <p className='text-xs text-faint'>No orders.</p> : (
                <div className='space-y-1.5 max-h-52 overflow-y-auto'>
                  {detail.orders.map((o) => (
                    <div key={o._id} className='flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-2 border border-line text-xs'>
                      <span className='font-mono text-accent'>{o.orderNumber}</span>
                      <span className='text-muted'>{new Date(o.date).toLocaleDateString('en-IN')}</span>
                      <StatusPill status={o.status} />
                      <span className='ml-auto text-fg font-semibold'>{currency}{o.amount}</span>
                      <span className='text-faint'>{o.paymentMethod}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* addresses */}
            {detail.addresses?.length > 0 && (
              <div>
                <p className='text-[11px] font-semibold uppercase tracking-widest text-faint mb-2'>Addresses</p>
                <div className='space-y-1'>
                  {detail.addresses.map((a, i) => (
                    <p key={i} className='text-xs text-muted'>{[a.name, a.street, a.city, a.state, a.zipCode].filter(Boolean).join(', ')}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

const MiniTile = ({ icon: Icon, label, value }) => (
  <div className='rounded-xl bg-surface-2 border border-line p-2.5 text-center'>
    <Icon size={14} className='mx-auto text-accent mb-1' />
    <p className='text-base font-heading font-bold text-fg leading-none'>{value}</p>
    <p className='text-[9px] uppercase tracking-widest text-faint mt-1'>{label}</p>
  </div>
)

export default Customers
