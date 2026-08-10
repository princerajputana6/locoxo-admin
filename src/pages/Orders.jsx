import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import {
  ShoppingCart, Search, RefreshCw, ClipboardList, FileSpreadsheet, BarChart3,
  Download, Truck, StickyNote, ChevronDown, CreditCard,
} from 'lucide-react'
import {
  PageHeader, Btn, FilterTabs, EmptyState, StatusPill, Modal, ManualOrderModal,
} from '../components/ui'
import { useAdminOrderStream } from '../hooks/useOrderRealtime'

const WORKFLOW = ['Pending', 'Confirmed', 'Packed', 'Pickuped', 'Delivered', 'Cancelled', 'Returned']
const FILTERS = ['All', ...WORKFLOW]

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('All')
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [expanded, setExpanded] = useState({})
  const [showManual, setShowManual] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [report, setReport] = useState([])
  const [reportPeriod, setReportPeriod] = useState('daily')
  const [noteDraft, setNoteDraft] = useState({})

  const fetchOrders = async () => {
    if (!token) return
    setLoading(true)
    try {
      const { data } = await axios.post(backendUrl + '/api/order/list',
        { status, search, from, to }, { headers: { token } })
      if (data.success) setOrders(data.orders)
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load orders') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchOrders() }, [status, from, to])
  const onStream = useCallback(() => fetchOrders(), [status, from, to, search])
  useAdminOrderStream(onStream)

  const shown = useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return orders
    return orders.filter((o) => `${o.orderNumber} ${o.customerId || ''} ${o.address?.name || ''}`.toLowerCase().includes(s))
  }, [orders, search])

  const counts = useMemo(() => {
    const c = { All: orders.length }
    WORKFLOW.forEach((w) => { c[w] = orders.filter((o) => o.status === w).length })
    return c
  }, [orders])

  const changeStatus = async (orderId, newStatus) => {
    try {
      const { data } = await axios.post(backendUrl + '/api/order/status', { orderId, status: newStatus }, { headers: { token } })
      if (data.success) { toast.success(data.message); fetchOrders() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const addNote = async (orderId) => {
    const note = (noteDraft[orderId] || '').trim()
    if (!note) return
    try {
      const { data } = await axios.post(backendUrl + '/api/order/note', { orderId, note }, { headers: { token } })
      if (data.success) { toast.success('Note added'); setNoteDraft((d) => ({ ...d, [orderId]: '' })); fetchOrders() }
    } catch { toast.error('Failed to add note') }
  }

  const saveDelivery = async (orderId, d) => {
    try {
      const { data } = await axios.post(backendUrl + '/api/order/delivery', { orderId, ...d }, { headers: { token } })
      if (data.success) { toast.success('Dispatch saved'); fetchOrders() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const downloadInvoice = async (orderId, orderNumber) => {
    try {
      const res = await axios.get(`${backendUrl}/api/order/invoice/${orderId}`, { headers: { token }, responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href = url; a.download = `invoice-${orderNumber || orderId}.pdf`; a.click(); URL.revokeObjectURL(url)
    } catch { toast.error('Invoice download failed') }
  }

  const exportExcel = async () => {
    try {
      const params = new URLSearchParams({ status: status === 'All' ? 'All' : status, from, to }).toString()
      const res = await axios.get(`${backendUrl}/api/order/export?${params}`, { headers: { token }, responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href = url; a.download = `orders-${Date.now()}.xlsx`; a.click(); URL.revokeObjectURL(url)
      toast.success('Excel exported')
    } catch { toast.error('Export failed') }
  }

  const loadReport = async (period = reportPeriod) => {
    setReportPeriod(period); setShowReport(true)
    try {
      const { data } = await axios.get(`${backendUrl}/api/order/report?period=${period}`, { headers: { token } })
      if (data.success) setReport(data.rows)
    } catch { toast.error('Failed to load report') }
  }

  const paymentBadge = (o) => (o.paymentMethod || '').toUpperCase() === 'COD' ? 'COD' : 'PREPAID'

  return (
    <div className='p-6'>
      <PageHeader
        icon={ShoppingCart}
        title='Order Management'
        subtitle='Workflow · invoices · dispatch · reports'
        actions={
          <div className='flex flex-wrap items-center gap-2'>
            <Btn variant='secondary' size='sm' icon={BarChart3} onClick={() => loadReport('daily')}>Reports</Btn>
            <Btn variant='secondary' size='sm' icon={FileSpreadsheet} onClick={exportExcel}>Export Excel</Btn>
            <Btn variant='secondary' size='sm' icon={RefreshCw} onClick={fetchOrders}>Refresh</Btn>
            <Btn variant='primary' size='sm' icon={ClipboardList} onClick={() => setShowManual(true)}>Manual Order</Btn>
          </div>
        }
      />

      {/* Controls */}
      <div className='glass rounded-2xl p-3 mb-4 flex flex-wrap items-center gap-3'>
        <FilterTabs options={FILTERS} value={status} onChange={setStatus} />
        <div className='flex items-center gap-2 ml-auto'>
          <input type='date' value={from} onChange={(e) => setFrom(e.target.value)} className='px-2.5 py-2 text-sm rounded-xl bg-surface-2 border border-line text-fg focus:border-accent outline-none' />
          <span className='text-faint text-xs'>to</span>
          <input type='date' value={to} onChange={(e) => setTo(e.target.value)} className='px-2.5 py-2 text-sm rounded-xl bg-surface-2 border border-line text-fg focus:border-accent outline-none' />
        </div>
        <div className='relative min-w-[220px]'>
          <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none' />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Order # / customer id / name…'
            className='w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-surface-2 border border-line text-fg placeholder:text-faint focus:border-accent outline-none' />
        </div>
      </div>

      {loading ? (
        <div className='space-y-3'>{[0, 1, 2].map((i) => <div key={i} className='skeleton rounded-2xl h-40' />)}</div>
      ) : shown.length === 0 ? (
        <EmptyState icon={ShoppingCart} title='No orders' message='No orders match these filters.' />
      ) : (
        <div className='space-y-3'>
          {shown.map((o) => {
            const isOpen = expanded[o._id]
            const isReturn = o.status === 'Returned' || o.returnRequest?.requested
            return (
              <div key={o._id} className='glass rounded-2xl overflow-hidden'>
                {/* header row */}
                <div className='px-4 py-3 flex flex-wrap items-center gap-3'>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <span className='font-mono text-sm font-bold text-accent'>{o.orderNumber}</span>
                      <span className='text-xs text-muted'>· {o.customerId || o.userId?.name || o.address?.name}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${paymentBadge(o) === 'COD' ? 'bg-amber/15 text-amber' : 'bg-success/15 text-success'}`}>
                        <CreditCard size={10} className='inline mr-1' />{paymentBadge(o)}{o.payment ? ' · Paid' : ''}
                      </span>
                      {isReturn && <span className='px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-yellow-400/20 text-yellow-300'>Exchange / Return</span>}
                    </div>
                    <p className='text-xs text-muted mt-0.5'>{o.items.length} item(s) · {new Date(o.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <StatusPill status={o.status} />
                  <p className='font-heading font-bold text-fg'>{currency}{o.amount}</p>
                  <select value={WORKFLOW.includes(o.status) ? o.status : ''} onChange={(e) => changeStatus(o._id, e.target.value)}
                    className='px-3 py-2 text-sm rounded-lg bg-surface-2 border border-line text-fg focus:border-accent outline-none'>
                    {!WORKFLOW.includes(o.status) && <option value='' disabled>{o.status}</option>}
                    {WORKFLOW.map((w) => <option key={w} value={w}>{w}</option>)}
                  </select>
                  <button onClick={() => downloadInvoice(o._id, o.orderNumber)} title='Invoice' className='grid place-items-center w-9 h-9 rounded-lg bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25'><Download size={15} /></button>
                  <button onClick={() => setExpanded((x) => ({ ...x, [o._id]: !x[o._id] }))} className='inline-flex items-center gap-1 text-xs text-muted hover:text-fg'>
                    Details <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {isOpen && (
                  <div className='px-4 pb-4 pt-1 border-t border-line/60 grid md:grid-cols-3 gap-4 animate-fade-in'>
                    {/* Items + customer */}
                    <div>
                      <p className='text-[10px] uppercase tracking-widest text-faint mb-1'>Products</p>
                      {o.items.map((it, i) => (
                        <p key={i} className='text-sm text-fg'>{it.name} <span className='text-muted'>× {it.quantity}{it.size ? ` · ${it.size}` : ''}{it.color ? ` · ${it.color}` : ''}</span></p>
                      ))}
                      <p className='text-[10px] uppercase tracking-widest text-faint mt-3 mb-1'>Customer & delivery</p>
                      <p className='text-sm text-fg'>{o.address?.name} · {o.address?.phone}</p>
                      <p className='text-xs text-muted'>{[o.address?.addressLine1, o.address?.addressLine2, o.address?.city, o.address?.state, o.address?.pincode].filter(Boolean).join(', ')}</p>
                    </div>

                    {/* Dispatch */}
                    <DispatchPanel order={o} onSave={saveDelivery} />

                    {/* Notes */}
                    <div>
                      <p className='text-[10px] uppercase tracking-widest text-faint mb-1 inline-flex items-center gap-1'><StickyNote size={12} /> Order notes</p>
                      <div className='space-y-1 max-h-28 overflow-y-auto mb-2'>
                        {(o.orderNotes || []).length === 0 ? <p className='text-xs text-faint'>No notes.</p> :
                          o.orderNotes.map((n, i) => (
                            <div key={i} className='text-xs px-2 py-1.5 rounded-lg bg-surface-2 border border-line'>
                              <p className='text-fg'>{n.note}</p>
                              <p className='text-faint text-[10px]'>{n.by} · {new Date(n.at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          ))}
                      </div>
                      <div className='flex gap-2'>
                        <input value={noteDraft[o._id] || ''} onChange={(e) => setNoteDraft((d) => ({ ...d, [o._id]: e.target.value }))}
                          placeholder='Add a note…' className='flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-surface-2 border border-line text-fg focus:border-accent outline-none' />
                        <Btn variant='secondary' size='sm' onClick={() => addNote(o._id)}>Add</Btn>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ManualOrderModal open={showManual} onClose={() => setShowManual(false)} token={token} onDone={fetchOrders} />

      {/* Report modal */}
      <Modal open={showReport} onClose={() => setShowReport(false)} icon={BarChart3} title='Order Report' subtitle='Sales & fulfilment over time' size='lg'>
        <div className='flex gap-2 mb-3'>
          {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
            <button key={p} onClick={() => loadReport(p)} className={`px-3 py-1.5 text-xs uppercase tracking-widest font-semibold rounded-lg border ${reportPeriod === p ? 'bg-accent/20 text-accent border-accent/40' : 'bg-surface-2 text-muted border-line hover:border-accent/40'}`}>{p}</button>
          ))}
        </div>
        <div className='rounded-xl border border-line overflow-hidden'>
          <table className='w-full text-sm'>
            <thead className='bg-surface/40 text-[10px] uppercase tracking-widest text-faint'>
              <tr><th className='text-left px-3 py-2'>Period</th><th className='text-right px-3 py-2'>Orders</th><th className='text-right px-3 py-2'>Revenue</th><th className='text-right px-3 py-2'>Delivered</th><th className='text-right px-3 py-2'>Cancelled</th></tr>
            </thead>
            <tbody>
              {report.map((r) => (
                <tr key={r._id} className='border-t border-line/60'>
                  <td className='px-3 py-2 font-mono text-xs text-fg'>{r._id}</td>
                  <td className='px-3 py-2 text-right text-fg'>{r.orders}</td>
                  <td className='px-3 py-2 text-right text-accent font-semibold'>{currency}{Math.round(r.revenue).toLocaleString('en-IN')}</td>
                  <td className='px-3 py-2 text-right text-success'>{r.delivered}</td>
                  <td className='px-3 py-2 text-right text-danger'>{r.cancelled}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  )
}

// Pickup / dispatch capture (delivery partner, courier, AWB, weight, dimensions).
const DispatchPanel = ({ order, onSave }) => {
  const d = order.delivery || {}
  const [form, setForm] = useState({
    partnerName: d.partnerName || '', courierName: d.courierName || '',
    shipmentId: d.shipmentId || '', weight: d.weight || '', dimensions: d.dimensions || '',
  })
  const f = 'w-full px-2.5 py-1.5 text-xs rounded-lg bg-surface-2 border border-line text-fg placeholder:text-faint focus:border-accent outline-none'
  return (
    <div>
      <p className='text-[10px] uppercase tracking-widest text-faint mb-1 inline-flex items-center gap-1'><Truck size={12} /> Dispatch / pickup</p>
      <div className='grid grid-cols-2 gap-1.5'>
        <input value={form.partnerName} onChange={(e) => setForm({ ...form, partnerName: e.target.value })} placeholder='Delivery partner' className={f} />
        <input value={form.courierName} onChange={(e) => setForm({ ...form, courierName: e.target.value })} placeholder='Courier' className={f} />
        <input value={form.shipmentId} onChange={(e) => setForm({ ...form, shipmentId: e.target.value })} placeholder='Shipment / AWB id' className={f + ' col-span-2'} />
        <input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder='Weight' className={f} />
        <input value={form.dimensions} onChange={(e) => setForm({ ...form, dimensions: e.target.value })} placeholder='L×B×H' className={f} />
      </div>
      <div className='flex gap-2 mt-2'>
        <Btn variant='secondary' size='sm' onClick={() => onSave(order._id, form)}>Save</Btn>
        <Btn variant='primary' size='sm' onClick={() => onSave(order._id, { ...form, markPickuped: true })}>Save & mark Pickuped</Btn>
      </div>
    </div>
  )
}

export default Orders
