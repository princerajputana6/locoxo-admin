import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import { exportToCsv } from '../utils/exportCsv'
import { RefreshCw, FileSpreadsheet, Search, Eye, ChevronDown, Truck, Check, X, IndianRupee, CheckCircle2 } from 'lucide-react'

const TYPE_PILL = { return: 'bg-accent/10 text-accent', refund: 'bg-amber/10 text-amber', exchange: 'bg-violet/10 text-violet' }
const STATUS_PILL = {
  requested: 'bg-accent/10 text-accent', pickup_requested: 'bg-accent/10 text-accent', approved: 'bg-success/10 text-success',
  rejected: 'bg-danger/10 text-danger', refund_pending: 'bg-amber/10 text-amber', refund_transferred: 'bg-success/10 text-success', pending: 'bg-amber/10 text-amber',
}
const STATUS_LABEL = { requested: 'Requested', pickup_requested: 'Pickup requested', approved: 'Approved', rejected: 'Rejected', refund_pending: 'Refund pending', refund_transferred: 'Refunded', pending: 'Requested' }
const dt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + '\n' + new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'

const Returns = ({ token }) => {
  const [searchParams] = useSearchParams()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState(''); const [fStatus, setFStatus] = useState('All'); const [fType, setFType] = useState(searchParams.get('type') || 'All')
  useEffect(() => { setFType(searchParams.get('type') || 'All') }, [searchParams])
  const [from, setFrom] = useState(''); const [to, setTo] = useState('')
  const [expanded, setExpanded] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: fStatus, type: fType, search: q, from, to }).toString()
      const { data } = await axios.get(`${backendUrl}/api/return/list?${params}`, { headers: { token } })
      if (data.success) setRows(data.returns); else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load requests') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [fStatus, fType, from, to])
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [q])

  const act = async (url, body, ok) => { try { const { data } = await axios.post(backendUrl + url, body, { headers: { token } }); if (data.success) { toast.success(ok || data.message); load() } else toast.error(data.message) } catch (e) { toast.error('Failed') } }
  const exportExcel = async () => { try { const res = await axios.get(`${backendUrl}/api/return/export`, { headers: { token }, responseType: 'blob' }); const u = URL.createObjectURL(new Blob([res.data])); const a = document.createElement('a'); a.href = u; a.download = `returns-${Date.now()}.xlsx`; a.click() } catch { toast.error('Export failed') } }
  const clear = () => { setQ(''); setFStatus('All'); setFType('All'); setFrom(''); setTo('') }
  const sel = 'px-3 py-2.5 text-sm rounded-xl bg-white border border-line text-fg focus:border-accent outline-none'

  return (
    <div className='p-6'>
      <div className='flex items-start justify-between mb-5'>
        <div><h1 className='text-2xl font-heading font-extrabold text-fg'>Return, Refund &amp; Exchange Management</h1><p className='text-xs text-muted mt-1'>Dashboard <span className='text-faint'>›</span> Returns &amp; Refunds <span className='text-faint'>›</span> All Requests</p></div>
        <div className='flex items-center gap-2'>
          <button onClick={load} className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><RefreshCw size={15} /> Refresh</button>
          <button onClick={exportExcel} className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><FileSpreadsheet size={15} className='text-success' /> Export Excel</button>
        </div>
      </div>

      <div className='glass rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-3'>
        <div className='relative flex-1 min-w-[240px]'><Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-faint' /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder='Search by Order ID, Return ID, Customer Name, SKU…' className='w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-white border border-line' /></div>
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={sel}><option value='All'>All Status</option>{Object.keys(STATUS_LABEL).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
        <select value={fType} onChange={(e) => setFType(e.target.value)} className={sel}><option value='All'>All Type</option><option value='return'>Return</option><option value='refund'>Refund</option><option value='exchange'>Exchange</option></select>
        <input type='date' value={from} onChange={(e) => setFrom(e.target.value)} className={sel} />
        <input type='date' value={to} onChange={(e) => setTo(e.target.value)} className={sel} />
        <button onClick={clear} className='px-3 py-2.5 text-sm font-semibold text-muted hover:text-fg'>Clear Filters</button>
      </div>

      <div className='glass rounded-2xl overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead><tr className='text-left text-[11px] font-semibold uppercase tracking-wider text-muted border-b border-line'>
              <th className='py-3 px-2'>S.No</th><th className='py-3 px-2'>Return / Order ID</th><th className='py-3 px-2'>Type</th><th className='py-3 px-2'>Product Details</th><th className='py-3 px-2'>Date &amp; Time</th><th className='py-3 px-2'>Images</th><th className='py-3 px-2'>Status</th><th className='py-3 px-2'>Rejected Reason</th><th className='py-3 px-2'>Barcode (Manual)</th><th className='py-3 px-2'>Refund/Exchange Date</th><th className='py-3 px-2'>Action</th>
            </tr></thead>
            <tbody>
              {loading ? [0, 1, 2].map((i) => <tr key={i}><td colSpan={11} className='py-2'><div className='skeleton h-12 rounded-lg' /></td></tr>) :
                rows.length === 0 ? <tr><td colSpan={11} className='py-10 text-center text-muted'>No requests found.</td></tr> :
                  rows.map((r, i) => (
                    <React.Fragment key={r._id}>
                      <tr className='border-b border-line/70 hover:bg-surface-2/50'>
                        <td className='py-3 px-2 text-muted'>{i + 1}</td>
                        <td className='py-3 px-2'><p className='font-semibold text-fg'>{r.returnNumber}</p><p className='text-[11px] text-muted'>{r.orderId?.orderNumber || '—'}</p></td>
                        <td className='py-3 px-2'><span className={`px-2 py-1 rounded-md text-[11px] font-semibold ${TYPE_PILL[r.type] || TYPE_PILL.return}`}>{(r.type || 'return')[0].toUpperCase() + (r.type || 'return').slice(1)}</span></td>
                        <td className='py-3 px-2'><div className='flex items-center gap-2'><img src={r.productId?.image?.[0] || r.productId?.image || 'https://placehold.co/40'} alt='' className='w-8 h-8 rounded object-cover border border-line' /><div><p className='text-fg text-xs font-semibold'>{r.productId?.name}</p><p className='text-[11px] text-muted'>{r.color} | {r.size} | Qty: {r.quantity}</p></div></div></td>
                        <td className='py-3 px-2 text-muted text-xs whitespace-pre-line'>{dt(r.createdAt)}</td>
                        <td className='py-3 px-2'><div className='flex gap-0.5'>{(r.images || []).slice(0, 2).map((s, k) => <img key={k} src={s} alt='' className='w-8 h-8 rounded object-cover border border-line' />)}{(r.images || []).length > 2 && <span className='w-8 h-8 rounded border border-line grid place-items-center text-[10px] text-muted'>+{r.images.length - 2}</span>}{(r.images || []).length === 0 && <span className='text-[11px] text-faint'>—</span>}</div></td>
                        <td className='py-3 px-2'><span className={`px-2 py-1 rounded-md text-[11px] font-semibold ${STATUS_PILL[r.status] || 'bg-muted/10 text-muted'}`}>{STATUS_LABEL[r.status] || r.status}</span></td>
                        <td className='py-3 px-2 text-muted text-xs'>{r.rejectedReason || (r.status === 'rejected' ? (r.notes?.slice(-1)[0]?.note || '—') : '–')}</td>
                        <td className='py-3 px-2 font-mono text-xs text-muted'>{r.manualBarcode || '—'}</td>
                        <td className='py-3 px-2 text-muted text-xs whitespace-pre-line'>{dt(r.refundTransferredAt || r.exchangeDate)}</td>
                        <td className='py-3 px-2'><div className='flex gap-1'><button className='grid place-items-center w-8 h-8 rounded-lg border border-line text-muted hover:text-accent'><Eye size={14} /></button><button onClick={() => setExpanded(expanded === r._id ? null : r._id)} className='grid place-items-center w-8 h-8 rounded-lg border border-line text-muted'><ChevronDown size={15} className={expanded === r._id ? 'rotate-180 transition-transform' : 'transition-transform'} /></button></div></td>
                      </tr>
                      {expanded === r._id && <tr><td colSpan={11} className='bg-surface-2/40 px-4 py-4'><DetailPanel r={r} token={token} act={act} reload={load} /></td></tr>}
                    </React.Fragment>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const DetailPanel = ({ r, token, act, reload }) => {
  const [tab, setTab] = useState('Request Details')
  const [barcode, setBarcode] = useState(r.manualBarcode || '')
  const tabs = ['Request Details', 'Exchange Details', 'Refund Details', 'History & Notes']
  const saveBarcode = async () => { try { await axios.post(`${backendUrl}/api/return/fields/${r._id}`, { manualBarcode: barcode }, { headers: { token } }); toast.success('Barcode saved'); reload() } catch { toast.error('Failed') } }
  const Field = ({ l, v }) => <p className='flex justify-between gap-3 text-xs py-0.5'><span className='text-muted'>{l}</span><span className='text-fg text-right'>{v || '—'}</span></p>

  return (
    <div className='rounded-xl bg-white border border-line p-4'>
      <div className='flex items-center gap-3 mb-3'><p className='font-heading font-bold text-fg'>Return ID: {r.returnNumber}</p><span className={`px-2 py-1 rounded-md text-[11px] font-semibold ${STATUS_PILL[r.status]}`}>{STATUS_LABEL[r.status] || r.status}</span><span className={`px-2 py-1 rounded-md text-[11px] font-semibold ${TYPE_PILL[r.type]}`}>{r.type}</span></div>
      <div className='flex items-center gap-5 border-b border-line mb-3'>{tabs.map((t) => <button key={t} onClick={() => setTab(t)} className={`pb-2 -mb-px text-sm font-semibold border-b-2 ${tab === t ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-fg'}`}>{t}</button>)}</div>

      {tab === 'Request Details' && (
        <div className='grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4'>
          <div><p className='text-[11px] uppercase tracking-widest text-faint mb-1'>Product Details</p><div className='flex gap-2'><img src={r.productId?.image?.[0] || r.productId?.image || 'https://placehold.co/48'} alt='' className='w-12 h-12 rounded object-cover border border-line' /><div className='text-xs'><p className='font-semibold text-fg'>{r.productId?.name}</p><p className='text-muted'>{r.color} | {r.size}</p><p className='text-muted'>Qty: {r.quantity}</p><p className='text-fg font-semibold'>{money(r.productId?.price)}</p></div></div><Field l='Order ID' v={r.orderId?.orderNumber} /><Field l='Payment' v={r.orderId?.paymentMethod} /></div>
          <div><p className='text-[11px] uppercase tracking-widest text-faint mb-1'>Customer Details</p><Field l='Name' v={r.orderId?.address?.name || r.userId?.name} /><Field l='Mobile' v={r.orderId?.address?.phone} /><Field l='Email' v={r.userId?.email} /><Field l='Address' v={[r.orderId?.address?.city, r.orderId?.address?.state].filter(Boolean).join(', ')} /></div>
          <div><p className='text-[11px] uppercase tracking-widest text-faint mb-1'>Request Information</p><Field l='Return ID' v={r.returnNumber} /><Field l='Type' v={r.type} /><Field l='Date' v={new Date(r.createdAt).toLocaleString('en-IN')} /><Field l='Reason' v={r.reason} /><Field l='Comments' v={r.description} /><Field l='Pickup Type' v={r.pickupType} /><Field l='Tracking' v={r.pickupTrackingId} /><Field l='Courier' v={r.returnCourier} /></div>
          <div><p className='text-[11px] uppercase tracking-widest text-faint mb-1'>Uploaded Images</p><div className='grid grid-cols-2 gap-1'>{(r.images || []).slice(0, 4).map((s, k) => <img key={k} src={s} alt='' className='w-full h-16 rounded object-cover border border-line' />)}{(r.images || []).length === 0 && <p className='text-xs text-faint'>None</p>}</div></div>
          <div><p className='text-[11px] uppercase tracking-widest text-faint mb-1'>Barcode (Manual Entry)</p><input value={barcode} onChange={(e) => setBarcode(e.target.value)} className='w-full px-3 py-2 text-sm rounded-lg bg-white border border-line mb-1' placeholder='Enter barcode' /><button onClick={saveBarcode} className='text-xs font-semibold text-accent'>Save</button><p className='text-[10px] text-faint mt-1'>Enter barcode manually if not scannable.</p></div>
          <div><p className='text-[11px] uppercase tracking-widest text-faint mb-1'>Status &amp; Action</p><Field l='Current Status' v={STATUS_LABEL[r.status] || r.status} /><Field l='Action By' v={r.statusHistory?.slice(-1)[0]?.by} /><Field l='Date' v={r.statusHistory?.slice(-1)[0]?.at && new Date(r.statusHistory.slice(-1)[0].at).toLocaleString('en-IN')} />
            <div className='flex gap-1.5 mt-2'>
              {['requested', 'pending'].includes(r.status) && <button onClick={() => act('/api/return/pickup/' + r._id, {}, 'Pickup requested')} className='flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded-lg bg-accent text-white'><Truck size={12} /> Pickup</button>}
              {r.status === 'pickup_requested' && <button onClick={() => act('/api/return/picked/' + r._id, { condition: 'good', restock: true }, 'Picked')} className='flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded-lg bg-success text-white'><Check size={12} /> Picked</button>}
              {r.status === 'approved' && <button onClick={() => act('/api/return/refund/' + r._id, { charges: 0, refundAmount: r.orderId?.amount }, 'Refund set')} className='flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded-lg bg-accent text-white'><IndianRupee size={12} /> Refund</button>}
              {r.status === 'refund_pending' && <button onClick={() => act('/api/return/refund-transfer/' + r._id, {}, 'Refund transferred')} className='flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded-lg bg-success text-white'><CheckCircle2 size={12} /> Transfer</button>}
              {!['rejected', 'refund_transferred'].includes(r.status) && <button onClick={() => act('/api/return/reject/' + r._id, { reason: 'Rejected by admin' }, 'Rejected')} className='px-2 py-1.5 text-[11px] font-semibold rounded-lg border border-danger/40 text-danger'><X size={12} /></button>}
            </div>
          </div>
        </div>
      )}
      {tab === 'Exchange Details' && <div className='grid md:grid-cols-3 gap-4'><div><Field l='Exchange Status' v={r.type === 'exchange' ? STATUS_LABEL[r.status] : 'N/A'} /><Field l='New Product' v={r.exchangeProduct} /><Field l='Exchange Date' v={r.exchangeDate && new Date(r.exchangeDate).toLocaleString('en-IN')} /><Field l='Tracking ID' v={r.pickupTrackingId} /></div></div>}
      {tab === 'Refund Details' && <div className='grid md:grid-cols-3 gap-4'><div><Field l='Charges' v={r.charges != null ? money(r.charges) : '—'} /><Field l='Refund Amount' v={r.refundAmount != null ? money(r.refundAmount) : '—'} /><Field l='Method' v={r.refundMethod} /><Field l='Reference' v={r.refundRef} /><Field l='Transferred' v={r.refundTransferredAt && new Date(r.refundTransferredAt).toLocaleString('en-IN')} /></div></div>}
      {tab === 'History & Notes' && <div className='space-y-1.5 max-h-40 overflow-y-auto'>{(r.statusHistory || []).length === 0 ? <p className='text-xs text-faint'>No history.</p> : r.statusHistory.map((h, i) => <div key={i} className='text-xs px-3 py-1.5 rounded-lg bg-surface-2 border border-line'><span className='font-semibold text-fg'>{STATUS_LABEL[h.status] || h.status}</span> <span className='text-muted'>· {h.by} · {new Date(h.at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>{h.note && <p className='text-muted'>{h.note}</p>}</div>)}</div>}
    </div>
  )
}
const money = (n) => `${currency}${Number(n || 0).toLocaleString('en-IN')}`

export default Returns
