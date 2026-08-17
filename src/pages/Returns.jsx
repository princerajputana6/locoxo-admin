import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import {
  Undo2, Search, RefreshCw, BarChart3, FileSpreadsheet, Truck, ScanLine,
  XCircle, IndianRupee, CheckCircle2, StickyNote, Trash2,
} from 'lucide-react'
import { PageHeader, Btn, StatCard, FilterTabs, EmptyState, StatusPill, Modal } from '../components/ui'

const STATUSES = ['All', 'requested', 'pickup_requested', 'approved', 'rejected', 'refund_pending', 'refund_transferred']
const STATUS_LABEL = {
  requested: 'Requested', pickup_requested: 'Pickup requested', picked: 'Picked', approved: 'Approved',
  rejected: 'Rejected', refund_pending: 'Refund pending', refund_transferred: 'Refund transferred', pending: 'Requested',
}
const CONDITIONS = [
  { value: 'good', label: 'Good (restock)' }, { value: 'damaged', label: 'Damaged' },
  { value: 'different_product', label: 'Different product' }, { value: 'other', label: 'Other' },
]

const Returns = ({ token }) => {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('All')
  const [type, setType] = useState('All')
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [expanded, setExpanded] = useState({})
  const [showReport, setShowReport] = useState(false)
  const [report, setReport] = useState([])
  const [reportPeriod, setReportPeriod] = useState('daily')

  const fetchReturns = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status, type, from, to }).toString()
      const { data } = await axios.get(`${backendUrl}/api/return/list?${params}`, { headers: { token } })
      if (data.success) setReturns(data.returns)
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load returns') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchReturns() }, [status, type, from, to])

  const shown = useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return returns
    return returns.filter((r) => `${r.orderId?.orderNumber || ''} ${r.customerId || ''} ${r.productId?.name || ''}`.toLowerCase().includes(s))
  }, [returns, search])

  const counts = useMemo(() => ({
    total: returns.length,
    requested: returns.filter((r) => ['requested', 'pending'].includes(r.status)).length,
    refundPending: returns.filter((r) => r.status === 'refund_pending').length,
    refunded: returns.filter((r) => r.status === 'refund_transferred').length,
  }), [returns])

  const act = async (url, body, ok) => {
    try {
      const { data } = await axios.post(backendUrl + url, body, { headers: { token } })
      if (data.success) { toast.success(ok || data.message); fetchReturns() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const deleteNote = async (id, noteId) => {
    try { await axios.delete(backendUrl + '/api/return/note/' + id, { headers: { token }, data: { noteId } }); fetchReturns() }
    catch { toast.error('Failed') }
  }

  const exportExcel = async () => {
    try {
      const params = new URLSearchParams({ status: status === 'All' ? '' : status, from, to }).toString()
      const res = await axios.get(`${backendUrl}/api/return/export?${params}`, { headers: { token }, responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href = url; a.download = `returns-${Date.now()}.xlsx`; a.click(); URL.revokeObjectURL(url)
      toast.success('Excel exported')
    } catch { toast.error('Export failed') }
  }

  const loadReport = async (period = reportPeriod) => {
    setReportPeriod(period); setShowReport(true)
    try {
      const { data } = await axios.get(`${backendUrl}/api/return/report?period=${period}`, { headers: { token } })
      if (data.success) setReport(data.rows)
    } catch { toast.error('Failed to load report') }
  }

  return (
    <div className='p-6'>
      <PageHeader icon={Undo2} title='Return / Exchange / Refund' subtitle='Pickup · restock · refund workflow'
        actions={
          <div className='flex flex-wrap items-center gap-2'>
            <Btn variant='secondary' size='sm' icon={BarChart3} onClick={() => loadReport('daily')}>Reports</Btn>
            <Btn variant='secondary' size='sm' icon={FileSpreadsheet} onClick={exportExcel}>Export Excel</Btn>
            <Btn variant='secondary' size='sm' icon={RefreshCw} onClick={fetchReturns}>Refresh</Btn>
          </div>
        }
      />

      <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mb-6'>
        <StatCard icon={Undo2} label='Total' value={counts.total} />
        <StatCard icon={Truck} label='Requested' value={counts.requested} tone='amber' />
        <StatCard icon={IndianRupee} label='Refund pending' value={counts.refundPending} tone='accent' />
        <StatCard icon={CheckCircle2} label='Refunded' value={counts.refunded} tone='brand' />
      </div>

      <div className='glass rounded-2xl p-3 mb-4 flex flex-wrap items-center gap-3'>
        <FilterTabs options={STATUSES} value={status} onChange={setStatus} />
        <select value={type} onChange={(e) => setType(e.target.value)} className='px-2.5 py-2 text-sm rounded-xl bg-surface-2 border border-line text-fg focus:border-accent outline-none'>
          <option value='All'>All types</option><option value='return'>Return</option><option value='exchange'>Exchange</option>
        </select>
        <div className='flex items-center gap-2 ml-auto'>
          <input type='date' value={from} onChange={(e) => setFrom(e.target.value)} className='px-2.5 py-2 text-sm rounded-xl bg-surface-2 border border-line text-fg focus:border-accent outline-none' />
          <span className='text-faint text-xs'>to</span>
          <input type='date' value={to} onChange={(e) => setTo(e.target.value)} className='px-2.5 py-2 text-sm rounded-xl bg-surface-2 border border-line text-fg focus:border-accent outline-none' />
        </div>
        <div className='relative min-w-[220px]'>
          <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none' />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Order # / customer id / product…'
            className='w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-surface-2 border border-line text-fg placeholder:text-faint focus:border-accent outline-none' />
        </div>
      </div>

      {loading ? (
        <div className='space-y-3'>{[0, 1, 2].map((i) => <div key={i} className='skeleton rounded-2xl h-36' />)}</div>
      ) : shown.length === 0 ? (
        <EmptyState icon={Undo2} title='No returns' message='No return/exchange requests match these filters.' />
      ) : (
        <div className='space-y-3'>
          {shown.map((r) => (
            <ReturnCard key={r._id} r={r} expanded={!!expanded[r._id]}
              onToggle={() => setExpanded((x) => ({ ...x, [r._id]: !x[r._id] }))}
              act={act} token={token} onChanged={fetchReturns} onDeleteNote={deleteNote} />
          ))}
        </div>
      )}

      <Modal open={showReport} onClose={() => setShowReport(false)} icon={BarChart3} title='Returns Report' subtitle='Returns & refunds over time' size='lg'>
        <div className='flex gap-2 mb-3'>
          {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
            <button key={p} onClick={() => loadReport(p)} className={`px-3 py-1.5 text-xs uppercase tracking-widest font-semibold rounded-lg border ${reportPeriod === p ? 'bg-accent/20 text-accent border-accent/40' : 'bg-surface-2 text-muted border-line hover:border-accent/40'}`}>{p}</button>
          ))}
        </div>
        <div className='rounded-xl border border-line overflow-hidden'>
          <table className='w-full text-sm'>
            <thead className='bg-surface/40 text-[10px] uppercase tracking-widest text-faint'>
              <tr><th className='text-left px-3 py-2'>Period</th><th className='text-right px-3 py-2'>Total</th><th className='text-right px-3 py-2'>Refunded</th><th className='text-right px-3 py-2'>Rejected</th><th className='text-right px-3 py-2'>Refund ₹</th></tr>
            </thead>
            <tbody>
              {report.map((r) => (
                <tr key={r._id} className='border-t border-line/60'>
                  <td className='px-3 py-2 font-mono text-xs text-fg'>{r._id}</td>
                  <td className='px-3 py-2 text-right text-fg'>{r.total}</td>
                  <td className='px-3 py-2 text-right text-success'>{r.refunded}</td>
                  <td className='px-3 py-2 text-right text-danger'>{r.rejected}</td>
                  <td className='px-3 py-2 text-right text-accent font-semibold'>{currency}{Math.round(r.refundAmount).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  )
}

const ReturnCard = ({ r, expanded, onToggle, act, token, onChanged, onDeleteNote }) => {
  const [cond, setCond] = useState('good')
  const [condNote, setCondNote] = useState('')
  const [charges, setCharges] = useState(r.charges || 0)
  const [refund, setRefund] = useState(r.refundAmount ?? (r.orderId?.amount || ''))
  const [method, setMethod] = useState(r.refundMethod || 'UPI')
  const [refundRef, setRefundRef] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [note, setNote] = useState('')

  const addNote = async () => {
    if (!note.trim()) return
    try { await axios.post(backendUrl + '/api/return/note/' + r._id, { note }, { headers: { token } }); setNote(''); onChanged() }
    catch { toast.error('Failed') }
  }

  const isReturnStage = ['requested', 'pending'].includes(r.status)
  const netRefund = Math.max(0, (Number(refund) || 0) - (Number(charges) || 0))

  return (
    <div className='glass rounded-2xl overflow-hidden'>
      <div className='px-4 py-3 flex flex-wrap items-center gap-3'>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2 flex-wrap'>
            <span className='font-mono text-sm font-bold text-accent'>{r.orderId?.orderNumber || '—'}</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${r.type === 'exchange' ? 'bg-yellow-400/20 text-yellow-300' : 'bg-surface-2 text-muted border border-line'}`}>{r.type || 'return'}</span>
            <span className='text-xs text-muted'>· {r.customerId || r.userId?.name || '—'}</span>
          </div>
          <p className='text-xs text-muted mt-0.5'>{r.productId?.name} · {r.reason}{r.size ? ` · ${r.size}` : ''}{r.color ? ` · ${r.color}` : ''} · {new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
        </div>
        <StatusPill status={STATUS_LABEL[r.status] || r.status} />
        {r.refundAmount != null && <span className='text-sm text-fg'>Refund {currency}{r.refundAmount}{r.charges ? ` (−${currency}${r.charges})` : ''}</span>}
        <button onClick={onToggle} className='text-xs text-muted hover:text-fg'>{expanded ? 'Hide' : 'Manage'}</button>
      </div>

      {expanded && (
        <div className='px-4 pb-4 pt-1 border-t border-line/60 grid md:grid-cols-3 gap-4 animate-fade-in'>
          {/* Detail + workflow actions */}
          <div className='md:col-span-2 space-y-3'>
            <div className='text-xs text-muted'>
              {r.description && <p className='mb-1'>“{r.description}”</p>}
              <p>Customer: {r.orderId?.address?.name} · {r.orderId?.address?.phone}</p>
              <p>{[r.orderId?.address?.city, r.orderId?.address?.state, r.orderId?.address?.pincode].filter(Boolean).join(', ')}</p>
              {r.condition && <p className='mt-1'>Condition: <span className='text-fg'>{r.condition}</span>{r.conditionNote ? ` — ${r.conditionNote}` : ''}{r.inventoryRestocked ? ' · restocked ✓' : ''}</p>}
              {r.refundRef && <p className='mt-1 text-success'>Refund ref: {r.refundRef}</p>}
            </div>

            {/* stage 1: requested → pickup */}
            {isReturnStage && (
              <div className='flex flex-wrap gap-2'>
                <Btn variant='primary' size='sm' icon={Truck} onClick={() => act('/api/return/pickup/' + r._id, {}, 'Pickup requested')}>Create pickup request</Btn>
              </div>
            )}

            {/* stage 2: pickup_requested → picked/scan */}
            {r.status === 'pickup_requested' && (
              <div className='rounded-xl border border-line bg-surface-2 p-3 space-y-2'>
                <p className='text-[10px] uppercase tracking-widest text-faint inline-flex items-center gap-1'><ScanLine size={12} /> Scan & confirm pickup</p>
                <div className='flex flex-wrap items-center gap-2'>
                  <select value={cond} onChange={(e) => setCond(e.target.value)} className='px-2.5 py-1.5 text-xs rounded-lg bg-surface border border-line text-fg outline-none'>
                    {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <input value={condNote} onChange={(e) => setCondNote(e.target.value)} placeholder='Condition note (optional)' className='flex-1 min-w-[160px] px-2.5 py-1.5 text-xs rounded-lg bg-surface border border-line text-fg outline-none' />
                  <Btn variant='primary' size='sm' onClick={() => act('/api/return/picked/' + r._id, { condition: cond, conditionNote: condNote, restock: true }, 'Picked & approved')}>Confirm picked</Btn>
                </div>
                <p className='text-[10px] text-faint'>Good condition auto-restocks the item into inventory.</p>
              </div>
            )}

            {/* stage 3: approved → set refund */}
            {r.status === 'approved' && (
              <div className='rounded-xl border border-line bg-surface-2 p-3'>
                <p className='text-[10px] uppercase tracking-widest text-faint mb-2 inline-flex items-center gap-1'><IndianRupee size={12} /> Refund detail (after charges)</p>
                <div className='flex flex-wrap items-end gap-2'>
                  <div><label className='block text-[9px] uppercase text-faint'>Charges</label><input type='number' value={charges} onChange={(e) => setCharges(e.target.value)} className='w-24 px-2.5 py-1.5 text-xs rounded-lg bg-surface border border-line text-fg outline-none' /></div>
                  <div><label className='block text-[9px] uppercase text-faint'>Gross refund</label><input type='number' value={refund} onChange={(e) => setRefund(e.target.value)} className='w-28 px-2.5 py-1.5 text-xs rounded-lg bg-surface border border-line text-fg outline-none' /></div>
                  <div><label className='block text-[9px] uppercase text-faint'>Method</label><select value={method} onChange={(e) => setMethod(e.target.value)} className='px-2.5 py-1.5 text-xs rounded-lg bg-surface border border-line text-fg outline-none'><option>UPI</option><option>Bank</option><option>Wallet</option><option>Original</option></select></div>
                  <span className='text-xs text-muted'>Net: <span className='text-accent font-semibold'>{currency}{netRefund}</span></span>
                  <Btn variant='primary' size='sm' onClick={() => act('/api/return/refund/' + r._id, { charges: Number(charges), refundAmount: netRefund, refundMethod: method }, 'Refund detail saved')}>Save refund</Btn>
                </div>
              </div>
            )}

            {/* stage 4: refund_pending → transfer */}
            {r.status === 'refund_pending' && (
              <div className='rounded-xl border border-line bg-surface-2 p-3 flex flex-wrap items-end gap-2'>
                <div><label className='block text-[9px] uppercase text-faint'>Transaction ref</label><input value={refundRef} onChange={(e) => setRefundRef(e.target.value)} placeholder='UPI / bank ref' className='w-48 px-2.5 py-1.5 text-xs rounded-lg bg-surface border border-line text-fg outline-none' /></div>
                <Btn variant='primary' size='sm' icon={CheckCircle2} onClick={() => act('/api/return/refund-transfer/' + r._id, { refundRef }, 'Refund transferred')}>Mark refund transferred</Btn>
              </div>
            )}

            {/* reject (available until refunded) */}
            {!['rejected', 'refund_transferred'].includes(r.status) && (
              <div className='flex flex-wrap items-center gap-2'>
                <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder='Reject reason…' className='flex-1 min-w-[160px] px-2.5 py-1.5 text-xs rounded-lg bg-surface-2 border border-line text-fg outline-none' />
                <Btn variant='ghost' size='sm' icon={XCircle} onClick={() => act('/api/return/reject/' + r._id, { reason: rejectReason }, 'Return rejected')}>Reject</Btn>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <p className='text-[10px] uppercase tracking-widest text-faint mb-1 inline-flex items-center gap-1'><StickyNote size={12} /> Notes</p>
            <div className='space-y-1 max-h-32 overflow-y-auto mb-2'>
              {(r.notes || []).length === 0 ? <p className='text-xs text-faint'>No notes.</p> :
                r.notes.map((n) => (
                  <div key={n._id} className='text-xs px-2 py-1.5 rounded-lg bg-surface-2 border border-line flex items-start gap-2'>
                    <div className='flex-1'>
                      <p className='text-fg'>{n.note}</p>
                      <p className='text-faint text-[10px]'>{n.by} · {new Date(n.at).toLocaleDateString('en-IN')}</p>
                    </div>
                    <button onClick={() => onDeleteNote(r._id, n._id)} className='text-faint hover:text-danger'><Trash2 size={12} /></button>
                  </div>
                ))}
            </div>
            <div className='flex gap-2'>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder='Add note…' className='flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-surface-2 border border-line text-fg outline-none' />
              <Btn variant='secondary' size='sm' onClick={addNote}>Add</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Returns
