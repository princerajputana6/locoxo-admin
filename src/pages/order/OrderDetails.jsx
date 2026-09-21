import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { backendUrl, currency } from '../../App'
import { toast } from 'react-toastify'
import {
  ArrowLeft, User, Package, CreditCard, Truck, Clock, MapPin, Phone, Mail,
  Edit3, XCircle, CheckCircle2, Printer, Loader2, RefreshCw, FileText, MapPinned, PackageCheck,
} from 'lucide-react'

const SHIP_LABEL = {
  created: 'Order created · awaiting courier', label_generated: 'Label generated', picked_up: 'Picked up',
  in_transit: 'In transit', out_for_delivery: 'Out for delivery', delivered: 'Delivered',
  failed: 'Delivery failed', returned: 'Returned', cancelled: 'Cancelled',
}

const money = (n) => `${currency}${Number(n || 0).toLocaleString('en-IN')}`
const dt = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const STATUS_BADGE = {
  Pending: 'bg-amber/10 text-amber', Confirmed: 'bg-accent/10 text-accent', Packed: 'bg-violet/10 text-violet',
  Pickuped: 'bg-accent/10 text-accent', Delivered: 'bg-success/10 text-success', Completed: 'bg-success/10 text-success',
  Cancelled: 'bg-danger/10 text-danger', Returned: 'bg-danger/10 text-danger', Exchange: 'bg-violet/10 text-violet',
}

const OrderDetails = ({ token }) => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [shipment, setShipment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const assignCourier = async () => {
    setAssigning(true)
    try {
      const { data } = await axios.post(`${backendUrl}/api/shipment/admin/assign`, { orderId }, { headers: { token } })
      if (data.success) { toast.success(data.message || 'Courier allocated'); setShipment(data.shipment); load() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setAssigning(false) }
  }
  const refreshTracking = async () => {
    setRefreshing(true)
    try {
      const { data } = await axios.post(`${backendUrl}/api/shipment/admin/refresh`, { orderId }, { headers: { token } })
      if (data.success) { setShipment(data.shipment); if (data.changed) toast.success('Tracking updated') } else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setRefreshing(false) }
  }

  const load = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/order/admin/${orderId}`, { headers: { token } })
      if (data.success) { setOrder(data.order); setShipment(data.shipment || null) }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load order') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [orderId])

  const act = async (status, ok) => {
    setBusy(true)
    try {
      const { data } = await axios.post(`${backendUrl}/api/order/status`, { orderId, status }, { headers: { token } })
      if (data.success) { toast.success(ok || data.message); load() } else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setBusy(false) }
  }
  const printInvoice = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/order/invoice/${orderId}`, { headers: { token }, responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data])); const a = document.createElement('a'); a.href = url; a.download = `invoice-${order?.orderNumber}.pdf`; a.click(); URL.revokeObjectURL(url)
    } catch { toast.error('Invoice failed') }
  }

  if (loading) return <div className='min-h-[60vh] grid place-items-center'><Loader2 className='animate-spin text-accent' size={32} /></div>
  if (!order) return <div className='p-8 text-center text-muted'>Order not found. <button onClick={() => navigate('/orders')} className='text-accent font-semibold'>Back to Orders</button></div>

  const u = order.userId || {}
  const addr = order.address || {}
  const nextAction = order.status === 'Pending' ? { label: 'Confirm Order', status: 'Confirmed' }
    : order.status === 'Confirmed' ? { label: 'Mark Packed', status: 'Packed' }
    : order.status === 'Packed' ? { label: 'Ship Order', status: 'Pickuped' } : null
  const canCancel = !['Cancelled', 'Delivered', 'Completed', 'Returned'].includes(order.status)
  const Card = ({ children, className = '' }) => <div className={`bg-surface rounded-2xl border border-line shadow-card p-5 ${className}`}>{children}</div>
  const Row = ({ label, value }) => <div className='flex justify-between gap-4 text-sm py-1'><span className='text-muted'>{label}</span><span className='text-fg font-medium text-right'>{value}</span></div>

  return (
    <div className='p-6'>
      {/* Breadcrumb / back */}
      <button onClick={() => navigate(-1)} className='inline-flex items-center gap-2 text-sm font-semibold text-accent mb-4'><ArrowLeft size={16} /> Back to Orders</button>

      {/* Header */}
      <Card className='mb-5'>
        <div className='grid grid-cols-1 lg:grid-cols-[auto_1fr_1fr_1fr_auto] gap-5 items-center'>
          <div className='flex items-center gap-3'>
            <h1 className='text-2xl font-heading font-extrabold text-fg'>#{order.orderNumber}</h1>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${STATUS_BADGE[order.status] || 'bg-surface-2 text-fg'}`}>{order.status}</span>
          </div>
          <div><p className='text-[11px] uppercase tracking-widest text-muted mb-0.5'>Order Date</p><p className='text-sm font-semibold text-fg'>{dt(order.date)}</p></div>
          <div><p className='text-[11px] uppercase tracking-widest text-muted mb-0.5'>Order Source</p><p className='text-sm font-semibold text-fg'>{order.isManual ? 'Manual (Admin)' : 'Website'}</p></div>
          <div><p className='text-[11px] uppercase tracking-widest text-muted mb-0.5'>Payment</p><p className='text-sm font-semibold text-fg'>{order.paymentMethod} · {order.payment ? 'Paid' : 'Pending'}</p></div>
          {order.status === 'Pending' && order.pendingReason && (
            <div className='rounded-xl border border-accent/30 bg-accent/5 px-3 py-2'>
              <p className='text-[11px] uppercase tracking-widest text-muted mb-0.5'>Pending Reason</p>
              <p className='text-sm font-bold text-accent'>{order.pendingReason}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Main grid */}
      <div className='grid grid-cols-1 lg:grid-cols-[1fr_1.5fr_1fr] gap-5'>
        {/* Customer */}
        <Card>
          <p className='text-sm font-bold text-fg mb-3 flex items-center gap-2'><User size={16} className='text-accent' /> Customer Details</p>
          {order.customerId && <span className='inline-block mb-3 text-[11px] px-2 py-0.5 rounded bg-accent/10 text-accent font-semibold'>{order.customerId}</span>}
          <Row label='Name' value={u.name || addr.name || '—'} />
          <Row label='Mobile' value={addr.phone || u.phone || order.manualContact || '—'} />
          <Row label='Email' value={order.billingEmail || u.email || '—'} />
          {u.createdAt && <Row label='Member Since' value={new Date(u.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} />}
          <div className='mt-3 pt-3 border-t border-line'>
            <p className='text-[11px] uppercase tracking-widest text-muted mb-1'>Address</p>
            <p className='text-sm text-fg flex items-start gap-2'><MapPin size={14} className='text-muted mt-0.5 shrink-0' /> {[addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}</p>
          </div>
        </Card>

        {/* Items + Delivery */}
        <div className='space-y-5'>
          <Card>
            <p className='text-sm font-bold text-fg mb-3 flex items-center gap-2'><Package size={16} className='text-accent' /> Order Items <span className='text-muted font-normal'>({order.items?.length || 0})</span></p>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='text-[11px] uppercase tracking-wider text-muted border-b border-line'>
                    <th className='text-left font-semibold py-2'>Product</th>
                    <th className='text-left font-semibold py-2'>Variant</th>
                    <th className='text-center font-semibold py-2'>Qty</th>
                    <th className='text-right font-semibold py-2'>Price</th>
                    <th className='text-right font-semibold py-2'>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((it, i) => (
                    <tr key={i} className='border-b border-line last:border-0'>
                      <td className='py-2'><div className='flex items-center gap-2'><img src={it.image || 'https://placehold.co/40'} alt='' className='w-9 h-9 rounded object-cover border border-line' /><span className='font-medium text-fg'>{it.name}</span></div></td>
                      <td className='py-2 text-muted'>{[it.size, it.color].filter(Boolean).join(' / ') || '—'}</td>
                      <td className='py-2 text-center'>{it.quantity}</td>
                      <td className='py-2 text-right'>{money(it.price)}</td>
                      <td className='py-2 text-right font-semibold'>{money(it.price * it.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className='flex justify-between text-xs text-muted mt-3'>
              <span>Total Items: {order.items?.length || 0}</span>
              <span>Total Quantity: {order.items?.reduce((s, i) => s + (i.quantity || 0), 0)}</span>
            </div>
          </Card>

          <Card>
            <p className='text-sm font-bold text-fg mb-3 flex items-center gap-2'><Truck size={16} className='text-accent' /> Delivery Details</p>
            <div className='grid grid-cols-2 gap-x-6'>
              <Row label='City' value={addr.city || '—'} />
              <Row label='Pincode' value={addr.pincode || '—'} />
              <Row label='State' value={addr.state || '—'} />
              <Row label='Country' value={addr.country || 'India'} />
            </div>
          </Card>

          {shipment && (
            <Card>
              <div className='flex items-center justify-between mb-3'>
                <p className='text-sm font-bold text-fg flex items-center gap-2'><PackageCheck size={16} className='text-accent' /> Shipment</p>
                {shipment.awb && <button onClick={refreshTracking} disabled={refreshing} className='inline-flex items-center gap-1 text-[11px] font-semibold text-accent disabled:opacity-40'>{refreshing ? <Loader2 size={12} className='animate-spin' /> : <RefreshCw size={12} />} Refresh</button>}
              </div>
              <Row label='Status' value={SHIP_LABEL[shipment.status] || shipment.status} />
              <Row label='Courier' value={shipment.courierName || '—'} />
              <Row label='AWB' value={shipment.awb || '—'} />
              {shipment.currentLocation && <Row label='Location' value={shipment.currentLocation} />}
              {shipment.providerOrderId && <Row label='Velocity Order' value={shipment.providerOrderId} />}

              <div className='flex flex-wrap gap-2 mt-3'>
                {!shipment.awb && shipment.status !== 'cancelled' && (
                  <button onClick={assignCourier} disabled={assigning} className='inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-accent text-white hover:opacity-90 disabled:opacity-50'>
                    {assigning ? <Loader2 size={15} className='animate-spin' /> : <Truck size={15} />} Assign Courier
                  </button>
                )}
                {shipment.labelUrl && <a href={shipment.labelUrl} target='_blank' rel='noreferrer' className='inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg bg-white border border-line text-fg hover:bg-surface-2'><FileText size={14} /> Label</a>}
                {shipment.carrierTrackUrl && <a href={shipment.carrierTrackUrl} target='_blank' rel='noreferrer' className='inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg bg-white border border-line text-fg hover:bg-surface-2'><MapPinned size={14} /> Track</a>}
              </div>
              {!shipment.awb && <p className='text-[11px] text-muted mt-2'>Order created at Velocity as a new order. Click <span className='font-semibold text-fg'>Assign Courier</span> to allocate a delivery partner — the AWB, label and live tracking will then appear here.</p>}
            </Card>
          )}
        </div>

        {/* Payment + Timeline */}
        <div className='space-y-5'>
          <Card>
            <p className='text-sm font-bold text-fg mb-3 flex items-center gap-2'><CreditCard size={16} className='text-accent' /> Payment Details</p>
            <Row label='Method' value={order.paymentMethod} />
            <Row label='Status' value={order.payment ? 'Paid' : 'Pending'} />
            <div className='mt-2 pt-2 border-t border-line'>
              <Row label='Subtotal' value={money(order.subtotal)} />
              {order.discount > 0 && <Row label='Discount' value={`- ${money(order.discount)}`} />}
              {order.couponDiscount > 0 && <Row label='Coupon' value={`- ${money(order.couponDiscount)}`} />}
              <Row label='Shipping' value={money(order.shippingCharge)} />
              <Row label='Tax' value={money(order.tax)} />
              <div className='flex justify-between mt-2 pt-2 border-t border-line'><span className='font-bold text-fg'>Grand Total</span><span className='font-extrabold text-fg text-lg'>{money(order.amount)}</span></div>
            </div>
          </Card>

          <Card>
            <p className='text-sm font-bold text-fg mb-3 flex items-center gap-2'><Clock size={16} className='text-accent' /> Order Timeline</p>
            <div className='space-y-3'>
              {(order.statusHistory?.length ? order.statusHistory : [{ status: 'Order Placed', at: order.date }]).map((h, i) => (
                <div key={i} className='flex gap-3'>
                  <div className='flex flex-col items-center'><span className='w-2.5 h-2.5 rounded-full bg-accent mt-1' /><span className='w-px flex-1 bg-line' /></div>
                  <div><p className='text-sm font-semibold text-fg'>{h.status}</p><p className='text-xs text-muted'>{dt(h.at)}{h.by ? ` · ${h.by}` : ''}</p>{h.note && <p className='text-xs text-muted italic'>{h.note}</p>}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Footer actions */}
      <div className='flex flex-wrap items-center justify-end gap-2 mt-6'>
        <button onClick={printInvoice} className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg hover:bg-surface-2'><Printer size={15} /> Print Invoice</button>
        {addr.phone && <a href={`tel:${addr.phone}`} className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg hover:bg-surface-2'><Phone size={15} /> Contact Customer</a>}
        {canCancel && <button disabled={busy} onClick={() => act('Cancelled', 'Order cancelled')} className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border border-danger/40 text-danger hover:bg-danger/5 disabled:opacity-50'><XCircle size={15} /> Cancel Order</button>}
        {nextAction && <button disabled={busy} onClick={() => act(nextAction.status, nextAction.label)} className='inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-accent text-white hover:opacity-90 disabled:opacity-50'>{busy ? <Loader2 size={15} className='animate-spin' /> : <CheckCircle2 size={15} />} {nextAction.label}</button>}
      </div>
    </div>
  )
}

export default OrderDetails
