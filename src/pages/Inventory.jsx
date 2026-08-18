import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import {
  Boxes, Search, PackagePlus, Barcode, Printer, X, ChevronDown,
  Tag, RefreshCw, Layers, AlertTriangle, PackageX, Sparkles, Hash, Trash2,
} from 'lucide-react'
import {
  PageHeader, Btn, StatCard, FilterTabs, EmptyState, StatusPill,
  BulkAddModal, BarcodeExportModal, InventoryDetailModal, ProductCodeModal,
} from '../components/ui'

const Inventory = ({ token }) => {
  const [products, setProducts] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | low | out | clearance | active
  const [query, setQuery] = useState('')
  const [labelQueue, setLabelQueue] = useState([])
  const [expanded, setExpanded] = useState({})
  const [selected, setSelected] = useState({}) // productId -> bool

  const [showBulk, setShowBulk] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [detailId, setDetailId] = useState(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [p, s] = await Promise.all([
        axios.get(backendUrl + '/api/product/list?all=true'),
        axios.get(backendUrl + '/api/inventory/summary', { headers: { token } }),
      ])
      if (p.data.success) setProducts(p.data.products)
      if (s.data.success) setSummary(s.data.summary)
    } catch (err) {
      console.log(err)
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const rows = useMemo(() => {
    return products.map((p) => {
      const variants = p.variants || []
      const totalStock = variants.reduce((s, v) => s + (v.stock || 0), 0)
      const threshold = p.lowStockThreshold ?? 5
      const status =
        variants.length === 0
          ? 'unknown'
          : variants.every(v => v.stock <= 0)
            ? 'out'
            : variants.some(v => v.stock <= threshold)
              ? 'low'
              : 'ok'
      return { p, variants, totalStock, threshold, status }
    })
  }, [products])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter(({ p, status }) => {
      if (q && !(`${p.name} ${p.brand || ''} ${p.category || ''}`.toLowerCase().includes(q))) return false
      if (filter === 'low' && status !== 'low') return false
      if (filter === 'out' && status !== 'out') return false
      if (filter === 'clearance' && !p.onClearance) return false
      if (filter === 'active' && p.status !== 'active') return false
      return true
    })
  }, [rows, query, filter])

  const selectedIds = useMemo(() => Object.keys(selected).filter((id) => selected[id]), [selected])
  const allFilteredSelected = filtered.length > 0 && filtered.every(({ p }) => selected[p._id])

  const toggleAll = () => {
    setSelected((s) => {
      const next = { ...s }
      if (allFilteredSelected) filtered.forEach(({ p }) => { delete next[p._id] })
      else filtered.forEach(({ p }) => { next[p._id] = true })
      return next
    })
  }
  const toggleOne = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }))

  const updateThreshold = async (id, val) => {
    try {
      await axios.put(backendUrl + '/api/inventory/threshold/' + id, { lowStockThreshold: Number(val) || 0 }, { headers: { token } })
      fetchAll()
    } catch { toast.error('Failed to update threshold') }
  }

  const toggleClearance = async (p) => {
    try {
      await axios.put(backendUrl + '/api/inventory/clearance/' + p._id, {
        onClearance: !p.onClearance,
        clearanceDiscountPct: p.clearanceDiscountPct || 20,
      }, { headers: { token } })
      fetchAll()
      toast.success(p.onClearance ? 'Removed from clearance' : 'Added to clearance')
    } catch { toast.error('Failed') }
  }

  const setClearanceDiscount = async (p, val) => {
    try {
      await axios.put(backendUrl + '/api/inventory/clearance/' + p._id, {
        clearanceDiscountPct: Number(val) || 0,
      }, { headers: { token } })
      fetchAll()
    } catch { toast.error('Failed') }
  }

  const deleteProduct = async (p) => {
    if (!window.confirm(`Delete "${p.name}" and all its stock permanently?`)) return
    try {
      const { data } = await axios.post(backendUrl + '/api/product/remove', { id: p._id }, { headers: { token } })
      if (data.success) { toast.success('Product deleted'); fetchAll() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed') }
  }

  const backfillSkus = async () => {
    try {
      const { data } = await axios.post(backendUrl + '/api/inventory/backfill-skus', {}, { headers: { token } })
      if (data.success) { toast.success(data.message); fetchAll() }
    } catch { toast.error('Failed to backfill SKUs') }
  }

  const queueLabel = (p, v) => {
    setLabelQueue((q) => [...q, { sku: v.sku, name: p.name, size: v.size, color: v.color, price: p.price }])
  }
  const removeFromQueue = (idx) => setLabelQueue((q) => q.filter((_, i) => i !== idx))
  const printLabels = () => { if (labelQueue.length > 0) window.print() }

  // Labeled barcode image (Indian EAN-13 + product details baked in)
  const labelParams = (p, v) => new URLSearchParams({
    name: p.name || '', price: p.price ?? '', size: v.size || '', color: v.color || '', stock: v.stock ?? '',
    code: v.barcode || v.sku || '', human: v.humanBarcode || '',
  }).toString()
  const labelUrl = (p, v) => backendUrl + '/api/inventory/label/' + encodeURIComponent(v.sku) + '?' + labelParams(p, v)

  // Printable PDF label endpoint (opens/prints correctly everywhere)
  const labelPdfUrl = (p, v) => backendUrl + '/api/inventory/label-pdf/' + encodeURIComponent(v.sku) + '?' + labelParams(p, v)

  const downloadLabel = async (p, v) => {
    try {
      const res = await fetch(labelPdfUrl(p, v))
      if (!res.ok) throw new Error('bad response')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${v.sku}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Download failed') }
  }

  // Full legal apparel price tag (MRP, mfg details, EAN-13) as a printable PDF.
  const downloadPriceTag = async (v) => {
    try {
      const res = await fetch(backendUrl + '/api/inventory/pricetag/' + encodeURIComponent(v.sku))
      if (!res.ok) throw new Error('bad response')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `pricetag-${v.sku}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Price tag download failed') }
  }

  return (
    <div className='p-6'>
      <PageHeader
        icon={Boxes}
        title='Inventory'
        subtitle='Stock, barcodes, low-stock alerts & clearance'
        actions={
          <div className='flex flex-wrap items-center gap-2'>
            <Btn variant='secondary' size='sm' icon={Hash} onClick={() => setShowCode(true)}>Product Code</Btn>
            <Btn variant='secondary' size='sm' icon={RefreshCw} onClick={backfillSkus}>Backfill SKUs</Btn>
            <Btn variant='secondary' size='sm' icon={Barcode} onClick={() => setShowExport(true)}>Barcodes PDF</Btn>
            <Btn variant='primary' size='sm' icon={PackagePlus} onClick={() => setShowBulk(true)}>Bulk Add</Btn>
            {labelQueue.length > 0 && (
              <Btn variant='dark' size='sm' icon={Printer} onClick={printLabels}>
                Print {labelQueue.length} label{labelQueue.length === 1 ? '' : 's'}
              </Btn>
            )}
          </div>
        }
      />

      {/* Summary tiles */}
      {loading ? (
        <div className='grid grid-cols-2 md:grid-cols-5 gap-3 mb-6'>
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className='skeleton rounded-2xl h-24' />)}
        </div>
      ) : summary && (
        <div className='grid grid-cols-2 md:grid-cols-5 gap-3 mb-6'>
          <StatCard icon={Layers} label='Products' value={summary.totalProducts} delay={0} />
          <StatCard icon={Barcode} label='Total SKUs' value={summary.totalSkus} tone='brand' delay={60} />
          <StatCard icon={AlertTriangle} label='Low Stock' value={summary.lowStock} tone='amber' delay={120} onClick={() => setFilter('low')} />
          <StatCard icon={PackageX} label='Out of Stock' value={summary.outOfStock} tone='danger' delay={180} onClick={() => setFilter('out')} />
          <StatCard icon={Tag} label='On Clearance' value={summary.clearance} tone='accent' delay={240} onClick={() => setFilter('clearance')} />
        </div>
      )}

      {/* Controls */}
      <div className='glass rounded-2xl p-3 mb-4 flex flex-wrap items-center gap-3 animate-slide-up'>
        <FilterTabs
          options={['all', 'low', 'out', 'clearance', 'active']}
          value={filter}
          onChange={setFilter}
        />
        <div className='relative ml-auto min-w-[240px]'>
          <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none' />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search name / brand / category…'
            className='w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-surface-2 border border-line text-fg placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none'
          />
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className='mb-4 px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/30 text-sm flex items-center gap-3 animate-slide-down'>
          <span className='font-semibold text-accent'>{selectedIds.length} selected</span>
          <button onClick={() => setSelected({})} className='text-muted hover:text-fg text-xs underline'>Clear</button>
          <Btn variant='secondary' size='sm' icon={Barcode} className='ml-auto' onClick={() => setShowExport(true)}>
            Download selected barcodes
          </Btn>
        </div>
      )}

      {/* Label queue */}
      {labelQueue.length > 0 && (
        <div className='mb-4 p-3 rounded-xl bg-amber/10 border border-amber/30 text-xs flex flex-wrap items-center gap-2 animate-slide-down print:hidden'>
          <Printer size={14} className='text-amber' />
          <span className='font-semibold text-amber'>Label queue:</span>{' '}
          {labelQueue.map((l, i) => (
            <span key={i} className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-2 border border-line text-fg'>
              {l.sku}
              <button onClick={() => removeFromQueue(i)} className='text-muted hover:text-danger'><X size={12} /></button>
            </span>
          ))}
        </div>
      )}

      {/* Product list */}
      <div className='glass rounded-2xl overflow-hidden animate-slide-up'>
        {/* select-all header */}
        {filtered.length > 0 && (
          <div className='flex items-center gap-3 px-4 py-2.5 border-b border-line/70 bg-surface/40'>
            <input
              type='checkbox'
              checked={allFilteredSelected}
              onChange={toggleAll}
              className='w-4 h-4 accent-accent cursor-pointer'
            />
            <span className='text-[11px] font-semibold uppercase tracking-widest text-faint'>
              Select all ({filtered.length}) · {selectedIds.length} checked
            </span>
          </div>
        )}

        {loading ? (
          <div className='p-6 space-y-3'>
            {[0, 1, 2, 3].map((i) => <div key={i} className='skeleton rounded-xl h-16' />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Boxes} title='No products match these filters' message='Try adjusting your search or filters, or bulk-add new products.' />
        ) : (
          filtered.map(({ p, variants, totalStock, threshold, status }) => {
            const isOpen = expanded[p._id]
            const isSel = !!selected[p._id]
            return (
              <div key={p._id} className='border-b border-line/60 last:border-0'>
                <div className='px-4 py-3 flex flex-wrap items-center gap-3 hover:bg-surface-2/40 transition-colors'>
                  <input
                    type='checkbox'
                    checked={isSel}
                    onChange={() => toggleOne(p._id)}
                    className='w-4 h-4 accent-accent cursor-pointer shrink-0'
                  />
                  <img src={Array.isArray(p.image) ? p.image[0] : p.image} alt='' className='w-11 h-11 object-cover rounded-lg bg-surface-2 shrink-0' />
                  <button onClick={() => setDetailId(p._id)} className='flex-1 min-w-0 text-left group'>
                    <p className='font-semibold text-sm text-fg truncate group-hover:text-accent transition-colors'>{p.name}</p>
                    <p className='text-xs text-muted truncate'>
                      {p.productCode && <span className='font-mono text-accent/80'>{p.productCode}</span>}
                      {p.productCode ? ' · ' : ''}{p.audience || p.category} · {variants.length} variants · ₹{p.price}
                    </p>
                  </button>
                  <StatusPill status={status === 'ok' ? 'In stock' : status === 'unknown' ? 'No variants' : status === 'low' ? 'Low' : 'Out'} />
                  <div className='text-right'>
                    <p className='text-[10px] uppercase tracking-widest text-faint'>Total Stock</p>
                    <p className='font-heading font-bold text-fg'>{totalStock}</p>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <label className='text-[10px] uppercase tracking-widest text-faint'>Low @</label>
                    <input
                      type='number'
                      defaultValue={threshold}
                      onBlur={(e) => {
                        const v = parseInt(e.target.value)
                        if (!isNaN(v) && v !== threshold) updateThreshold(p._id, v)
                      }}
                      className='w-14 px-2 py-1 text-sm rounded-lg bg-surface-2 border border-line text-fg focus:border-accent outline-none'
                    />
                  </div>
                  <div className='flex items-center gap-2'>
                    <button
                      onClick={() => toggleClearance(p)}
                      className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-semibold rounded-lg border transition-all ${
                        p.onClearance
                          ? 'bg-accent/20 text-accent border-accent/40'
                          : 'bg-surface-2 text-muted border-line hover:border-accent/50'
                      }`}
                    >
                      {p.onClearance ? `Clearance −${p.clearanceDiscountPct || 0}%` : 'Mark Clearance'}
                    </button>
                    {p.onClearance && (
                      <input
                        type='number' min='0' max='95'
                        defaultValue={p.clearanceDiscountPct || 0}
                        onBlur={(e) => setClearanceDiscount(p, e.target.value)}
                        className='w-14 px-2 py-1 text-sm rounded-lg bg-surface-2 border border-line text-fg focus:border-accent outline-none'
                      />
                    )}
                  </div>
                  <button
                    onClick={() => setExpanded((x) => ({ ...x, [p._id]: !x[p._id] }))}
                    className='inline-flex items-center gap-1 text-xs text-muted hover:text-fg transition-colors'
                  >
                    {isOpen ? 'Hide' : 'Variants'}
                    <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <button
                    onClick={() => deleteProduct(p)}
                    title='Delete product'
                    className='grid place-items-center w-8 h-8 rounded-lg text-faint hover:text-danger hover:bg-danger/10 transition-colors'
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {isOpen && variants.length > 0 && (
                  <div className='bg-ink/40 px-4 py-3 border-t border-line/60 animate-fade-in'>
                    <table className='w-full text-sm'>
                      <thead>
                        <tr className='text-[10px] uppercase tracking-widest text-faint'>
                          <th className='text-left py-1.5 font-semibold'>Size</th>
                          <th className='text-left py-1.5 font-semibold'>Color</th>
                          <th className='text-left py-1.5 font-semibold'>SKU / Barcode</th>
                          <th className='text-left py-1.5 font-semibold'>Stock</th>
                          <th className='text-right py-1.5 font-semibold'></th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map((v) => (
                          <tr key={v._id || v.sku} className='border-t border-line/50'>
                            <td className='py-2 text-fg'>{v.size}</td>
                            <td className='py-2'>
                              <span className='inline-flex items-center gap-2 text-fg'>
                                <span className='w-4 h-4 inline-block rounded border border-line' style={{ background: v.colorCode || 'transparent' }}></span>
                                {v.color}
                              </span>
                            </td>
                            <td className='py-2'>
                              <p className='font-mono text-xs text-muted'>{v.sku || '—'}</p>
                              {v.humanBarcode && <p className='font-mono text-[10px] text-faint'>{v.humanBarcode}</p>}
                              {v.barcode && <p className='font-mono text-[10px] text-accent/70'>EAN {v.barcode}</p>}
                              {v.sku && (
                                <img
                                  src={labelUrl(p, v)}
                                  alt={v.sku}
                                  className='h-20 mt-1 rounded-lg bg-white shadow'
                                />
                              )}
                            </td>
                            <td className='py-2'>
                              <span className={`font-semibold ${v.stock <= 0 ? 'text-danger' : v.stock <= threshold ? 'text-amber' : 'text-fg'}`}>
                                {v.stock}
                              </span>
                            </td>
                            <td className='py-2 text-right'>
                              <div className='inline-flex flex-col gap-1 items-end'>
                                <button
                                  onClick={() => downloadLabel(p, v)}
                                  disabled={!v.sku}
                                  className='text-[10px] uppercase tracking-widest font-semibold bg-accent/15 text-accent border border-accent/30 rounded-lg px-2.5 py-1 hover:bg-accent/25 disabled:opacity-30 transition-all'
                                >
                                  Download
                                </button>
                                <button
                                  onClick={() => downloadPriceTag(v)}
                                  disabled={!v.sku}
                                  className='text-[10px] uppercase tracking-widest font-semibold border border-line rounded-lg px-2.5 py-1 text-muted hover:text-accent hover:border-accent/50 disabled:opacity-30 transition-all'
                                >
                                  Price Tag
                                </button>
                                <button
                                  onClick={() => queueLabel(p, v)}
                                  disabled={!v.sku}
                                  className='text-[10px] uppercase tracking-widest font-semibold border border-line rounded-lg px-2.5 py-1 text-muted hover:text-accent hover:border-accent/50 disabled:opacity-30 transition-all'
                                >
                                  Queue
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Print-only label sheet */}
      {labelQueue.length > 0 && (
        <div className='label-sheet hidden print:block p-4'>
          <div className='grid grid-cols-3 gap-3'>
            {labelQueue.map((l, i) => (
              <div key={i} className='border border-black p-2 text-center'>
                <p className='text-[10px] font-semibold uppercase tracking-widest text-black'>LOCOXO</p>
                <p className='text-xs font-bold mt-1 truncate text-black'>{l.name}</p>
                <p className='text-[10px] text-black'>Size {l.size} · {l.color}</p>
                <img
                  src={backendUrl + '/api/inventory/barcode/' + encodeURIComponent(l.sku) + '?scale=3&h=18'}
                  alt={l.sku}
                  className='mx-auto my-2 h-12'
                />
                <p className='text-[10px] text-black'>₹{l.price}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <BulkAddModal open={showBulk} onClose={() => setShowBulk(false)} token={token} onDone={fetchAll} />
      <BarcodeExportModal open={showExport} onClose={() => setShowExport(false)} token={token} selectedIds={selectedIds} defaultFilter={filter === 'all' ? 'all' : filter} />
      <ProductCodeModal open={showCode} onClose={() => setShowCode(false)} token={token} />
      <InventoryDetailModal open={!!detailId} onClose={() => setDetailId(null)} token={token} productId={detailId} onChanged={fetchAll} />
    </div>
  )
}

export default Inventory
