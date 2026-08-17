import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { backendUrl, currency } from '../../App'
import { toast } from 'react-toastify'
import {
  Search, Calendar, Filter, Eye, X, Check, StickyNote, Printer, User, Phone, MapPin,
  Truck, Copy, ShieldCheck, ScanLine, RotateCcw, Repeat, CheckCircle2, XCircle, Clock,
} from 'lucide-react'
import { useAdminOrderStream } from '../../hooks/useOrderRealtime'

const TABS = ['All', 'Pending', 'Confirmed', 'Packed', 'Pickuped', 'Delivered', 'Cancelled', 'Returned', 'Exchange']
const PENDING_REASONS = ['Admin Pending Required', 'Address Verification', 'Payment Verification', 'Stock Check', 'Other']
const money = (n) => `${currency}${Number(n || 0).toLocaleString('en-IN')}`
const dt = (d) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const OrderManagementNew = ({ token }) => {
  const [searchParams] = useSearchParams()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(searchParams.get('tab') || 'All')
  useEffect(() => { const t = searchParams.get('tab'); if (t) setTab(t) }, [searchParams])
  const [search, setSearch] = useState('')
  const [payment, setPayment] = useState('All')
  const [from, setFrom] = useState(''); const [to, setTo] = useState('')

  const fetchOrders = async () => {
    if (!token) return
    setLoading(true)
    try {
      const { data } = await axios.post(backendUrl + '/api/order/list', { from, to }, { headers: { token } })
      if (data.success) setOrders(data.orders); else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load orders') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchOrders() }, [from, to])
  useAdminOrderStream(useCallback(() => fetchOrders(), [from, to]))

  const counts = useMemo(() => {
    const c = { All: orders.length }
    TABS.slice(1).forEach((t) => { c[t] = orders.filter((o) => o.status === t).length })
    return c
  }, [orders])

  const shown = useMemo(() => {
    const s = search.trim().toLowerCase()
    return orders.filter((o) => {
      if (tab !== 'All' && o.status !== tab) return false
      if (payment !== 'All' && (o.paymentMethod || '').toUpperCase() !== payment) return false
      if (s && !`${o.orderNumber} ${o.customerId || ''} ${o.address?.name || ''} ${o.address?.phone || ''}`.toLowerCase().includes(s)) return false
      return true
    })
  }, [orders, tab, payment, search])

  const act = async (url, body, ok) => {
    try { const { data } = await axios.post(backendUrl + url, body, { headers: { token } }); if (data.success) { toast.success(ok || data.message); fetchOrders() } else toast.error(data.message) }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }
  const changeStatus = (orderId, status) => act('/api/order/status', { orderId, status }, `Marked ${status}`)
  const printInvoice = async (o) => {
    try { const res = await axios.get(`${backendUrl}/api/order/invoice/${o._id}`, { headers: { token }, responseType: 'blob' }); const url = URL.createObjectURL(new Blob([res.data])); const a = document.createElement('a'); a.href = url; a.download = `invoice-${o.orderNumber}.pdf`; a.click(); URL.revokeObjectURL(url) } catch { toast.error('Invoice failed') }
  }

  const sel = 'px-3 py-2.5 text-sm rounded-xl bg-white border border-line text-fg focus:border-accent outline-none'

  return (
    <div className='p-6'>
      {/* Status tabs */}
      <div className='flex flex-wrap gap-2 mb-4'>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${tab === t ? 'bg-fg text-white border-fg' : 'bg-white border-line text-muted hover:text-fg'}`}>
            {t === 'Pickuped' ? 'Pickedup' : t} <span className={`px-1.5 rounded ${tab === t ? 'bg-white/20' : 'bg-surface-2 text-fg'}`}>{counts[t] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className='glass rounded-2xl p-4 mb-4'>
        <div className='grid grid-cols-1 lg:grid-cols-[1.4fr_repeat(4,1fr)_auto] gap-3 items-end'>
          <div className='relative'><Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-faint' /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Search by Order ID, Customer Name, Phone, Email, Product…' className='w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-white border border-line' /></div>
          <div><label className='block text-[11px] font-semibold text-muted mb-1'>Order Status</label><select value={tab} onChange={(e) => setTab(e.target.value)} className={sel + ' w-full'}>{TABS.map((t) => <option key={t}>{t}</option>)}</select></div>
          <div><label className='block text-[11px] font-semibold text-muted mb-1'>Payment Method</label><select value={payment} onChange={(e) => setPayment(e.target.value)} className={sel + ' w-full'}><option value='All'>All</option><option value='COD'>COD</option><option value='PREPAID'>Prepaid</option></select></div>
          <div><label className='block text-[11px] font-semibold text-muted mb-1'>Shipping Method</label><select className={sel + ' w-full'}><option>All</option><option>Delivery</option><option>Pickup</option></select></div>
          <div><label className='block text-[11px] font-semibold text-muted mb-1'>Date Range</label><div className='flex items-center gap-1'><input type='date' value={from} onChange={(e) => setFrom(e.target.value)} className={sel + ' w-full'} /><input type='date' value={to} onChange={(e) => setTo(e.target.value)} className={sel + ' w-full'} /></div></div>
          <button className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg h-[42px]'><Filter size={15} /> Filters</button>
        </div>
      </div>

      {/* Order cards */}
      {loading ? <div className='space-y-3'>{[0, 1, 2].map((i) => <div key={i} className='skeleton h-48 rounded-2xl' />)}</div> :
        shown.length === 0 ? <div className='glass rounded-2xl py-16 text-center text-muted'>No orders in “{tab}”.</div> :
          <div className='space-y-3'>
            {shown.map((o) => <OrderCard key={o._id} o={o} act={act} changeStatus={changeStatus} printInvoice={printInvoice} token={token} refresh={fetchOrders} />)}
          </div>}
    </div>
  )
}

const Money = ({ o }) => (
  <div>
    <p className='text-[11px] font-semibold text-muted uppercase tracking-wider mb-1'>Amount</p>
    <p className='text-xl font-heading font-extrabold text-fg'>{money(o.amount)}</p>
    <p className={`text-sm font-semibold mt-1 ${o.payment ? 'text-success' : 'text-amber'}`}>{o.payment ? 'Paid' : 'PENDING'}</p>
  </div>
)

const ItemBlock = ({ o }) => {
  const it = o.items?.[0] || {}
  return (
    <div>
      <div className='flex items-center gap-2 mb-2 flex-wrap'>
        <span className='font-mono font-bold text-accent'>#{o.orderNumber}</span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${(o.paymentMethod || '').toUpperCase() === 'COD' ? 'bg-amber/10 text-amber' : 'bg-success/10 text-success'}`}>{(o.paymentMethod || '').toUpperCase() === 'COD' ? 'COD' : 'PREPAID'}</span>
      </div>
      <p className='text-xs text-muted mb-3'>{dt(o.date)} · {o.items?.length || 1} Item{(o.items?.length || 1) > 1 ? 's' : ''}</p>
      <div className='flex gap-3'>
        <img src={it.image || 'https://placehold.co/80'} alt='' className='w-16 h-16 rounded-lg object-cover border border-line bg-surface-2' />
        <div><p className='font-semibold text-sm text-fg'>{it.name}</p><p className='text-xs text-muted'>{it.size ? `Size: ${it.size}` : ''} {it.quantity ? `· Qty: ${it.quantity}` : ''}</p><p className='font-bold text-fg mt-1'>{money(it.price)}</p>{o.items?.length > 1 && <span className='inline-block mt-1 text-[11px] px-2 py-0.5 rounded border border-line text-muted'>+{o.items.length - 1} more item</span>}</div>
      </div>
    </div>
  )
}

const CustomerBlock = ({ o }) => (
  <div>
    <p className='text-sm font-semibold text-fg mb-2'>Customer Details</p>
    <p className='text-sm text-fg flex items-center gap-2'><User size={14} className='text-muted' /> {o.address?.name}</p>
    <p className='text-sm text-fg flex items-center gap-2 mt-1'><Phone size={14} className='text-muted' /> {o.address?.phone}</p>
    {o.customerId && <span className='inline-block mt-1 text-[11px] px-2 py-0.5 rounded bg-accent/10 text-accent font-semibold'>{o.customerId}</span>}
    <p className='text-sm text-muted flex items-start gap-2 mt-2'><MapPin size={14} className='text-muted mt-0.5 shrink-0' /> {[o.address?.addressLine1, o.address?.city, o.address?.state, o.address?.pincode].filter(Boolean).join(', ')}</p>
  </div>
)

const OrderCard = ({ o, act, changeStatus, printInvoice, token, refresh }) => {
  const [note, setNote] = useState('')
  const addNote = () => { if (note.trim()) act('/api/order/note', { orderId: o._id, note }, 'Note added').then(() => setNote('')) }

  return (
    <div className='glass rounded-2xl p-5'>
      <div className='grid grid-cols-1 lg:grid-cols-[1.3fr_1fr_1.4fr_auto] gap-6'>
        <ItemBlock o={o} />
        <CustomerBlock o={o} />
        <StatusPanel o={o} act={act} changeStatus={changeStatus} token={token} />
        <div className='min-w-[190px]'>
          <p className='text-[11px] font-semibold text-muted uppercase tracking-wider mb-2'>Actions</p>
          <div className='space-y-2'>
            <button className='w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-white border border-line text-fg hover:bg-surface-2'><Eye size={15} /> View Details</button>
            {!['Cancelled', 'Delivered', 'Completed', 'Returned'].includes(o.status) && <button onClick={() => changeStatus(o._id, 'Cancelled')} className='w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border border-danger/40 text-danger hover:bg-danger/5'><X size={15} /> Cancel Order</button>}
            {o.status === 'Pending' && <button onClick={() => changeStatus(o._id, 'Confirmed')} className='w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border border-success/40 text-success hover:bg-success/5'><Check size={15} /> Confirm Order</button>}
            {o.status === 'Confirmed' && <button onClick={() => changeStatus(o._id, 'Packed')} className='w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border border-success/40 text-success hover:bg-success/5'><Check size={15} /> Confirm Order</button>}
            {o.status === 'Packed' && <button onClick={() => act('/api/order/delivery', { orderId: o._id, markPickuped: true }, 'Pickup confirmed')} className='w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border border-success/40 text-success hover:bg-success/5'><Check size={15} /> Confirm Pickup</button>}
            {['Confirmed', 'Packed', 'Pickuped', 'Delivered', 'Completed', 'Cancelled'].includes(o.status) && <button onClick={() => printInvoice(o)} className='w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-white border border-line text-fg hover:bg-surface-2'><Printer size={15} /> Print Invoice</button>}
            <div className='pt-1'>
              <p className='text-xs font-semibold text-fg flex items-center gap-1.5 mb-1.5'><StickyNote size={13} /> Order Notes</p>
              <div className='flex gap-1.5'><input value={note} onChange={(e) => setNote(e.target.value)} placeholder='Add Note' className='flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-white border border-line' /><button onClick={addNote} className='px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-line'>Add</button></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Per-status middle panel.
const StatusPanel = ({ o, act, changeStatus, token }) => {
  if (o.status === 'Pending') return <PendingPanel o={o} act={act} />
  if (o.status === 'Confirmed') return <ConfirmedPanel o={o} act={act} token={token} />
  if (o.status === 'Packed') return <PickupPanel o={o} act={act} />
  if (o.status === 'Pickuped') return <DeliveryInfoPanel o={o} label='Out for delivery' />
  if (o.status === 'Delivered') return <DeliveredPanel o={o} />
  if (o.status === 'Completed') return <CompletedPanel o={o} />
  if (o.status === 'Cancelled') return <CancelledPanel o={o} />
  if (o.status === 'Returned') return <ReturnExchangePanel o={o} act={act} type='Return' />
  if (o.status === 'Exchange') return <ReturnExchangePanel o={o} act={act} type='Exchange' />
  return <div className='text-sm text-muted'>Status: {o.status}</div>
}

const PendingPanel = ({ o, act }) => {
  const [reason, setReason] = useState(o.pendingReason || '')
  return (
    <div>
      <p className='text-sm font-semibold text-fg mb-2'>Pending Reason</p>
      <select value={reason} onChange={(e) => { setReason(e.target.value); act('/api/order/pending-reason', { orderId: o._id, pendingReason: e.target.value }) }} className='w-full px-3 py-2.5 text-sm rounded-xl bg-white border border-line mb-2'>
        <option value=''>PENDING REASON</option>
        {PENDING_REASONS.map((r) => <option key={r}>{r}</option>)}
      </select>
      <div className='rounded-lg bg-amber/5 border border-amber/20 px-3 py-2 text-xs text-amber flex items-center gap-2'><Clock size={13} /> {o.pendingNote || 'Awaiting confirmation'}</div>
      <p className='text-xs text-amber font-semibold mt-2'>Pending since {Math.max(1, Math.round((Date.now() - o.date) / 3.6e6))}h</p>
    </div>
  )
}

const ConfirmedPanel = ({ o, act, token }) => {
  const d = o.delivery || {}
  const [form, setForm] = useState({ courierName: d.courierName || '', partnerName: d.partnerName || '', shipmentId: d.shipmentId || '' })
  const [code, setCode] = useState(''); const [codeType, setCodeType] = useState('human')
  const verify = async () => { try { const { data } = await axios.post(`${backendUrl}/api/order/verify-barcode`, { orderId: o._id, codeType, code }, { headers: { token } }); if (data.success) toast.success('Verified'); else toast.error(data.message || 'Not matched') } catch { toast.error('Failed') } }
  const f = 'w-full px-2.5 py-1.5 text-xs rounded-lg bg-white border border-line'
  return (
    <div>
      <p className='text-sm font-semibold text-fg mb-2'>Delivery &amp; Barcode Verification</p>
      <div className='grid grid-cols-2 gap-1.5 mb-2'>
        <input value={form.courierName} onChange={(e) => setForm({ ...form, courierName: e.target.value })} onBlur={() => act('/api/order/delivery', { orderId: o._id, ...form })} placeholder='Courier partner' className={f} />
        <input value={form.partnerName} onChange={(e) => setForm({ ...form, partnerName: e.target.value })} onBlur={() => act('/api/order/delivery', { orderId: o._id, ...form })} placeholder='Delivery partner' className={f} />
        <input value={form.shipmentId} onChange={(e) => setForm({ ...form, shipmentId: e.target.value })} onBlur={() => act('/api/order/delivery', { orderId: o._id, ...form })} placeholder='AWB / Shipment ID' className={f + ' col-span-2'} />
      </div>
      <div className='rounded-lg border border-line p-2'>
        <div className='flex items-center gap-3 text-[11px] mb-1.5'>
          <label className='flex items-center gap-1'><input type='radio' checked={codeType === 'sku'} onChange={() => setCodeType('sku')} className='accent-accent' /> Product Code (SKU)</label>
          <label className='flex items-center gap-1'><input type='radio' checked={codeType === 'human'} onChange={() => setCodeType('human')} className='accent-accent' /> Human Readable</label>
        </div>
        <div className='flex gap-1.5'><input value={code} onChange={(e) => setCode(e.target.value)} placeholder='Enter / scan code' className={f} /><button onClick={verify} className='px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-accent text-white inline-flex items-center gap-1'><ScanLine size={12} /> Verify</button></div>
        {o.barcodeVerification?.verified && <p className='text-[11px] text-success font-semibold mt-1 flex items-center gap-1'><ShieldCheck size={12} /> {o.barcodeVerification.code} Verified</p>}
      </div>
    </div>
  )
}

const PickupPanel = ({ o, act }) => {
  const d = o.delivery || {}
  const [form, setForm] = useState({ weight: d.weight || '', dimensions: d.dimensions || '' })
  return (
    <div>
      <p className='text-sm font-semibold text-fg mb-2'>Shipment Details</p>
      <label className='block text-[11px] font-semibold text-muted mb-1'>Product Weight (kg) *</label>
      <input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} onBlur={() => act('/api/order/delivery', { orderId: o._id, ...form })} className='w-full px-3 py-2 text-sm rounded-lg bg-white border border-line mb-2' placeholder='0.50' />
      <label className='block text-[11px] font-semibold text-muted mb-1'>Packing Dimension (cm) *</label>
      <input value={form.dimensions} onChange={(e) => setForm({ ...form, dimensions: e.target.value })} onBlur={() => act('/api/order/delivery', { orderId: o._id, ...form })} className='w-full px-3 py-2 text-sm rounded-lg bg-white border border-line' placeholder='L × B × H' />
      <div className='rounded-lg bg-accent/5 border border-accent/20 px-3 py-2 text-xs text-muted mt-2'>Ensure weight &amp; dimensions are accurate for smooth handling.</div>
    </div>
  )
}

const DeliveryInfoPanel = ({ o, label }) => {
  const d = o.delivery || {}
  return (
    <div>
      <p className='text-sm font-semibold text-fg mb-2'>Delivery Details</p>
      <div className='text-xs text-muted space-y-1'>
        <p>Courier: <span className='text-fg'>{d.courierName || '—'}</span></p>
        <p>Partner: <span className='text-fg'>{d.partnerName || '—'}</span></p>
        <p>AWB: <span className='text-fg font-mono'>{d.shipmentId || o.trackingNumber || '—'}</span></p>
        <p>Status: <span className='px-2 py-0.5 rounded bg-accent/10 text-accent font-semibold'>{label}</span></p>
      </div>
    </div>
  )
}

const DeliveredPanel = ({ o }) => {
  const delivered = o.statusHistory?.find((h) => h.status === 'Delivered')?.at || o.updatedAt
  const daysLeft = Math.max(0, 7 - Math.floor((Date.now() - new Date(delivered)) / 864e5))
  return (
    <div>
      <p className='text-sm font-semibold text-fg mb-2'>Delivery Information</p>
      <p className='text-xs text-muted'>Delivered On <span className='text-fg font-semibold'>{dt(delivered)}</span></p>
      <p className='text-xs text-muted mt-1'>Delivered By <span className='text-fg font-semibold'>{o.delivery?.partnerName || 'Delivery partner'}</span></p>
      <div className='rounded-xl border border-line p-3 mt-2'>
        <p className='text-sm font-semibold text-fg'>Return / Exchange Available</p>
        <p className='text-xs text-muted mt-1'>Time Left <span className='px-2 py-0.5 rounded bg-success/10 text-success font-semibold'>{daysLeft} Days</span></p>
        <div className='flex gap-2 mt-2'><button className='flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-accent text-white'><RotateCcw size={13} /> Request Return</button><button className='flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-violet text-white'><Repeat size={13} /> Request Exchange</button></div>
      </div>
    </div>
  )
}

const CompletedPanel = ({ o }) => (
  <div className='text-center'>
    <CheckCircle2 size={36} className='mx-auto text-success mb-1' />
    <p className='font-heading font-bold text-success'>Completed Order</p>
    <p className='text-xs text-muted'>This order is completed.</p>
    <div className='rounded-xl bg-success/5 border border-success/20 p-3 mt-2 text-left text-xs space-y-1'>
      <p className='flex justify-between'><span className='text-muted'>Delivered On</span> <span className='text-fg'>{dt(o.updatedAt)}</span></p>
      <p className='flex justify-between'><span className='text-muted'>Delivered By</span> <span className='text-fg'>{o.delivery?.partnerName || '—'}</span></p>
    </div>
  </div>
)

const CancelledPanel = ({ o }) => {
  const steps = (o.statusHistory || [])
  return (
    <div className='text-center'>
      <XCircle size={34} className='mx-auto text-danger mb-1' />
      <p className='font-heading font-bold text-danger'>Cancelled Order</p>
      <p className='text-xs text-muted mb-2'>This order has been cancelled.</p>
      <div className='rounded-xl border border-line p-3 text-left text-xs space-y-2'>
        {steps.length === 0 ? <p className='text-muted'>No timeline.</p> : steps.map((s, i) => (
          <div key={i} className='flex items-center gap-2'><span className={`w-2 h-2 rounded-full ${s.status === 'Cancelled' ? 'bg-danger' : 'bg-success'}`} /><span className='text-fg font-semibold'>{s.status}</span><span className='text-muted ml-auto'>{dt(s.at)}</span></div>
        ))}
      </div>
    </div>
  )
}

const ReturnExchangePanel = ({ o, act, type }) => (
  <div>
    <p className='text-sm font-semibold text-fg mb-2'>{type} Order Status</p>
    <div className='rounded-xl border border-line p-3 text-xs space-y-1'>
      <p className='flex justify-between'><span className='text-muted'>Requested On</span><span className='text-fg'>{dt(o.updatedAt)}</span></p>
      <p className='flex justify-between'><span className='text-muted'>Reason</span><span className='text-fg'>{o.returnRequest?.reason || '—'}</span></p>
      <p className='flex justify-between'><span className='text-muted'>{type} Status</span><span className='px-2 py-0.5 rounded bg-amber/10 text-amber font-semibold'>Pending</span></p>
    </div>
    <div className='flex gap-2 mt-2'>
      <button onClick={() => changeApprove(o, act, type)} className='flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-success text-white'><Check size={13} /> Approve {type} Pickup</button>
      <button onClick={() => act('/api/order/status', { orderId: o._id, status: 'Delivered' }, `${type} rejected`)} className='flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-danger/40 text-danger'><X size={13} /> Reject</button>
    </div>
  </div>
)
const changeApprove = (o, act, type) => act('/api/order/status', { orderId: o._id, status: type === 'Return' ? 'Returned' : 'Exchange' }, `${type} approved`)

export default OrderManagementNew
