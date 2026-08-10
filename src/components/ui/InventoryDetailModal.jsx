import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Boxes, PackageX, AlertTriangle, Layers, Tag, TrendingUp, Plus, Pencil, History, RefreshCw } from 'lucide-react'
import { Modal, Btn, StatusPill } from './index.js'
import { backendUrl, currency } from '../../App'

const TYPE_LABEL = {
  initial: 'Opening', restock: 'Restock', manual: 'Manual', correction: 'Correction', sale: 'Sale', return: 'Return',
}

// Product dashboard detail (spec item 9): code + name → stock by size/colour,
// out-of-stock / total-remaining counts, clearance, total sales — plus inline
// restock (item 6) and the stock adjustment history (item 8).
const InventoryDetailModal = ({ open, onClose, token, productId, onChanged }) => {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [editSku, setEditSku] = useState(null) // sku currently being restocked/adjusted
  const [mode, setMode] = useState('restock')  // 'restock' | 'adjust'
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!productId) return
    setLoading(true)
    try {
      const { data } = await axios.get(backendUrl + '/api/inventory/product/' + productId, { headers: { token } })
      if (data.success) setDetail(data.detail)
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load product') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (open && productId) { setEditSku(null); setQty(''); setReason(''); load() } }, [open, productId])

  const openEditor = (sku, m) => { setEditSku(sku); setMode(m); setQty(''); setReason('') }

  const submitStock = async () => {
    if (qty === '' || isNaN(Number(qty))) return toast.error('Enter a quantity')
    setSaving(true)
    try {
      const url = mode === 'restock'
        ? backendUrl + '/api/inventory/restock/' + productId
        : backendUrl + '/api/inventory/adjust/' + productId
      const body = mode === 'restock'
        ? { sku: editSku, qty: Number(qty), reason }
        : { sku: editSku, newStock: Number(qty), reason }
      const { data } = await axios.post(url, body, { headers: { token } })
      if (data.success) {
        toast.success(data.message)
        setEditSku(null); setQty(''); setReason('')
        await load()
        onChanged?.()
      } else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const d = detail

  return (
    <Modal open={open} onClose={onClose} icon={Boxes}
      title={d ? d.name : 'Product detail'}
      subtitle={d ? `${d.productCode || '—'} · ${d.audience || d.category || ''}` : 'Loading…'}
      size='lg'
      footer={<Btn variant='ghost' size='sm' onClick={onClose}>Close</Btn>}
    >
      {loading || !d ? (
        <div className='space-y-3'>{[0, 1, 2].map((i) => <div key={i} className='skeleton rounded-xl h-16' />)}</div>
      ) : (
        <div className='space-y-5'>
          {/* header row */}
          <div className='flex items-center gap-3'>
            <img src={d.image} alt='' className='w-16 h-16 rounded-xl object-cover bg-surface-2 shrink-0' />
            <div className='min-w-0'>
              <p className='font-mono text-xs text-accent'>{d.productCode}</p>
              <p className='font-heading font-bold text-fg truncate'>{d.name}</p>
              <p className='text-xs text-muted'>{d.fabric ? `${d.fabric} · ` : ''}{currency}{d.price}{d.onClearance ? ` · Clearance −${d.clearanceDiscountPct}%` : ''}</p>
            </div>
            <button onClick={load} className='ml-auto text-muted hover:text-fg' title='Refresh'><RefreshCw size={15} /></button>
          </div>

          {/* stat tiles */}
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-2.5'>
            <Tile icon={Layers} label='Total stock' value={d.totalStock} />
            <Tile icon={PackageX} label='Out of stock' value={d.outOfStock} tone='danger' />
            <Tile icon={AlertTriangle} label='Low stock' value={d.lowStock} tone='amber' />
            <Tile icon={TrendingUp} label='Units sold' value={d.totalSalesUnits} tone='accent' />
          </div>
          <div className='flex flex-wrap gap-2 text-xs'>
            <span className='px-2.5 py-1 rounded-lg bg-surface-2 border border-line text-muted'>Variants: <span className='text-fg font-semibold'>{d.variantCount}</span></span>
            <span className='px-2.5 py-1 rounded-lg bg-surface-2 border border-line text-muted'>Sales revenue: <span className='text-fg font-semibold'>{currency}{d.totalSalesRevenue?.toLocaleString('en-IN')}</span></span>
            {d.onClearance && <span className='px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/30 text-accent inline-flex items-center gap-1'><Tag size={12} /> On clearance</span>}
          </div>

          {/* stock by size & colour */}
          <div>
            <p className='text-[11px] font-semibold uppercase tracking-widest text-faint mb-2'>Stock by size & colour</p>
            <div className='rounded-xl border border-line overflow-hidden'>
              <table className='w-full text-sm'>
                <thead className='bg-surface/40 text-[10px] uppercase tracking-widest text-faint'>
                  <tr><th className='text-left px-3 py-2'>Size</th><th className='text-left px-3 py-2'>Colour</th><th className='text-left px-3 py-2'>Stock</th><th className='text-right px-3 py-2'>Actions</th></tr>
                </thead>
                <tbody>
                  {d.stockByVariant.map((v) => (
                    <React.Fragment key={v.sku}>
                      <tr className='border-t border-line/60'>
                        <td className='px-3 py-2 text-fg'>{v.size}</td>
                        <td className='px-3 py-2'>
                          <span className='inline-flex items-center gap-2 text-fg'>
                            <span className='w-3.5 h-3.5 rounded border border-line inline-block' style={{ background: v.colorCode || 'transparent' }} />
                            {v.color}
                          </span>
                        </td>
                        <td className='px-3 py-2'>
                          <span className='inline-flex items-center gap-2'>
                            <span className={`font-semibold ${v.state === 'out' ? 'text-danger' : v.state === 'low' ? 'text-amber' : 'text-fg'}`}>{v.stock}</span>
                            <StatusPill status={v.state === 'ok' ? 'In stock' : v.state === 'low' ? 'Low' : 'Out'} />
                          </span>
                        </td>
                        <td className='px-3 py-2 text-right'>
                          <div className='inline-flex gap-1.5'>
                            <button onClick={() => openEditor(v.sku, 'restock')} className='text-[10px] uppercase tracking-widest font-semibold bg-accent/15 text-accent border border-accent/30 rounded-lg px-2.5 py-1 hover:bg-accent/25 inline-flex items-center gap-1'><Plus size={11} /> Restock</button>
                            <button onClick={() => openEditor(v.sku, 'adjust')} className='text-[10px] uppercase tracking-widest font-semibold border border-line rounded-lg px-2.5 py-1 text-muted hover:text-accent hover:border-accent/50 inline-flex items-center gap-1'><Pencil size={11} /> Adjust</button>
                          </div>
                        </td>
                      </tr>
                      {editSku === v.sku && (
                        <tr className='bg-ink/40'>
                          <td colSpan={4} className='px-3 py-3'>
                            <div className='flex flex-wrap items-end gap-2 animate-fade-in'>
                              <div>
                                <label className='block text-[10px] uppercase tracking-widest text-faint mb-1'>{mode === 'restock' ? 'Add quantity' : 'Set stock to'}</label>
                                <input type='number' value={qty} onChange={(e) => setQty(e.target.value)} autoFocus
                                  className='w-28 px-3 py-1.5 text-sm rounded-lg bg-surface-2 border border-line text-fg focus:border-accent outline-none' placeholder={mode === 'restock' ? '+10' : '20'} />
                              </div>
                              <div className='flex-1 min-w-[160px]'>
                                <label className='block text-[10px] uppercase tracking-widest text-faint mb-1'>Reason (optional)</label>
                                <input value={reason} onChange={(e) => setReason(e.target.value)}
                                  className='w-full px-3 py-1.5 text-sm rounded-lg bg-surface-2 border border-line text-fg focus:border-accent outline-none' placeholder='e.g. New shipment, stock count' />
                              </div>
                              <Btn variant='primary' size='sm' loading={saving} onClick={submitStock}>Save</Btn>
                              <Btn variant='ghost' size='sm' onClick={() => setEditSku(null)}>Cancel</Btn>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* stock adjustment history */}
          <div>
            <p className='text-[11px] font-semibold uppercase tracking-widest text-faint mb-2 inline-flex items-center gap-1.5'><History size={13} /> Stock adjustment history</p>
            {d.recentHistory?.length ? (
              <div className='space-y-1.5 max-h-52 overflow-y-auto'>
                {d.recentHistory.map((h) => (
                  <div key={h._id} className='flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-2 border border-line text-xs'>
                    <span className={`px-1.5 py-0.5 rounded font-semibold ${h.qtyChange >= 0 ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
                      {h.qtyChange >= 0 ? '+' : ''}{h.qtyChange}
                    </span>
                    <span className='text-muted'>{TYPE_LABEL[h.type] || h.type}</span>
                    <span className='text-faint'>{h.size} · {h.color}</span>
                    <span className='text-faint'>→ {h.stockAfter}</span>
                    <span className='text-fg truncate flex-1'>{h.reason}</span>
                    <span className='text-faint shrink-0'>{new Date(h.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
              </div>
            ) : <p className='text-xs text-faint'>No stock changes recorded yet.</p>}
          </div>
        </div>
      )}
    </Modal>
  )
}

const Tile = ({ icon: Icon, label, value, tone }) => {
  const toneCls = tone === 'danger' ? 'text-danger' : tone === 'amber' ? 'text-amber' : tone === 'accent' ? 'text-accent' : 'text-fg'
  return (
    <div className='rounded-xl bg-surface-2 border border-line p-3'>
      <Icon size={15} className={`${toneCls} mb-1`} />
      <p className={`text-2xl font-heading font-extrabold ${toneCls}`}>{value}</p>
      <p className='text-[10px] uppercase tracking-widest text-faint'>{label}</p>
    </div>
  )
}

export default InventoryDetailModal
