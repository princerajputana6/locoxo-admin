import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const Inventory = ({ token }) => {
  const [products, setProducts] = useState([])
  const [summary, setSummary] = useState(null)
  const [filter, setFilter] = useState('all') // all | low | out | clearance | active
  const [query, setQuery] = useState('')
  const [labelQueue, setLabelQueue] = useState([])
  const [expanded, setExpanded] = useState({})

  const fetchAll = async () => {
    try {
      const [p, s] = await Promise.all([
        axios.get(backendUrl + '/api/product/list'),
        axios.get(backendUrl + '/api/inventory/summary', { headers: { token } })
      ])
      if (p.data.success) setProducts(p.data.products)
      if (s.data.success) setSummary(s.data.summary)
    } catch (err) {
      console.log(err)
      toast.error('Failed to load inventory')
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
        clearanceDiscountPct: p.clearanceDiscountPct || 20
      }, { headers: { token } })
      fetchAll()
      toast.success(p.onClearance ? 'Removed from clearance' : 'Added to clearance')
    } catch { toast.error('Failed') }
  }

  const setClearanceDiscount = async (p, val) => {
    try {
      await axios.put(backendUrl + '/api/inventory/clearance/' + p._id, {
        clearanceDiscountPct: Number(val) || 0
      }, { headers: { token } })
      fetchAll()
    } catch { toast.error('Failed') }
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

  const printLabels = () => {
    if (labelQueue.length === 0) return
    window.print()
  }

  return (
    <div className='p-6 inventory-page'>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .label-sheet, .label-sheet * { visibility: visible; }
          .label-sheet { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <div className='flex flex-wrap items-center justify-between gap-4 mb-6'>
        <div>
          <h1 className='text-2xl font-bold'>Inventory Management</h1>
          <p className='text-sm text-gray-500'>Stock, barcodes, low-stock alerts & clearance</p>
        </div>
        <div className='flex gap-2'>
          <button onClick={backfillSkus} className='px-3 py-2 text-xs font-semibold uppercase tracking-wide border border-gray-300 hover:border-black'>
            Backfill SKUs
          </button>
          {labelQueue.length > 0 && (
            <button onClick={printLabels} className='px-3 py-2 text-xs font-semibold uppercase tracking-wide bg-black text-white hover:bg-gray-800'>
              Print {labelQueue.length} label{labelQueue.length === 1 ? '' : 's'}
            </button>
          )}
        </div>
      </div>

      {summary && (
        <div className='grid grid-cols-2 md:grid-cols-5 gap-3 mb-6'>
          <Tile label='Products' value={summary.totalProducts} />
          <Tile label='Total SKUs' value={summary.totalSkus} />
          <Tile label='Low Stock' value={summary.lowStock} tone='amber' onClick={() => setFilter('low')} />
          <Tile label='Out of Stock' value={summary.outOfStock} tone='red' onClick={() => setFilter('out')} />
          <Tile label='On Clearance' value={summary.clearance} tone='blue' onClick={() => setFilter('clearance')} />
        </div>
      )}

      <div className='flex flex-wrap items-center gap-2 mb-4'>
        {['all', 'low', 'out', 'clearance', 'active'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide border ${filter === f ? 'bg-black text-white border-black' : 'bg-white border-gray-300 hover:border-gray-500'}`}
          >
            {f}
          </button>
        ))}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search by name / brand / category…'
          className='ml-auto px-3 py-1.5 text-sm border border-gray-300 focus:border-black outline-none min-w-[260px]'
        />
      </div>

      {labelQueue.length > 0 && (
        <div className='mb-4 p-3 bg-amber-50 border border-amber-200 text-xs'>
          <span className='font-semibold'>Label queue:</span>{' '}
          {labelQueue.map((l, i) => (
            <span key={i} className='inline-flex items-center gap-1 mr-2 px-2 py-0.5 bg-white border border-amber-300'>
              {l.sku}
              <button onClick={() => removeFromQueue(i)} className='text-amber-700'>×</button>
            </span>
          ))}
        </div>
      )}

      <div className='bg-white border border-gray-200'>
        {filtered.length === 0 ? (
          <div className='p-8 text-center text-sm text-gray-500'>No products match these filters.</div>
        ) : (
          filtered.map(({ p, variants, totalStock, threshold, status }) => {
            const isOpen = expanded[p._id]
            return (
              <div key={p._id} className='border-b border-gray-100 last:border-0'>
                <div className='px-4 py-3 flex flex-wrap items-center gap-4'>
                  <img src={Array.isArray(p.image) ? p.image[0] : p.image} alt='' className='w-12 h-12 object-cover bg-gray-100 flex-shrink-0' />
                  <div className='flex-1 min-w-0'>
                    <p className='font-semibold text-sm truncate'>{p.name}</p>
                    <p className='text-xs text-gray-500'>{p.category} · {variants.length} variants · ₹{p.price}</p>
                  </div>
                  <StatusBadge status={status} />
                  <div className='text-right'>
                    <p className='text-xs text-gray-500'>Total Stock</p>
                    <p className='font-semibold'>{totalStock}</p>
                  </div>
                  <div className='flex items-center gap-1'>
                    <label className='text-[10px] uppercase tracking-widest text-gray-500'>Low @</label>
                    <input
                      type='number'
                      defaultValue={threshold}
                      onBlur={(e) => {
                        const v = parseInt(e.target.value)
                        if (!isNaN(v) && v !== threshold) updateThreshold(p._id, v)
                      }}
                      className='w-14 px-2 py-1 border border-gray-300 text-sm'
                    />
                  </div>
                  <div className='flex items-center gap-2'>
                    <button
                      onClick={() => toggleClearance(p)}
                      className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-semibold border ${p.onClearance ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 hover:border-gray-500'}`}
                    >
                      {p.onClearance ? `Clearance −${p.clearanceDiscountPct || 0}%` : 'Mark Clearance'}
                    </button>
                    {p.onClearance && (
                      <input
                        type='number'
                        min='0' max='95'
                        defaultValue={p.clearanceDiscountPct || 0}
                        onBlur={(e) => setClearanceDiscount(p, e.target.value)}
                        className='w-14 px-2 py-1 border border-gray-300 text-sm'
                      />
                    )}
                  </div>
                  <button onClick={() => setExpanded((x) => ({ ...x, [p._id]: !x[p._id] }))} className='text-xs text-gray-500 hover:text-black underline'>
                    {isOpen ? 'Hide variants' : 'Variants'}
                  </button>
                </div>

                {isOpen && variants.length > 0 && (
                  <div className='bg-gray-50 px-4 py-3 border-t border-gray-100'>
                    <table className='w-full text-sm'>
                      <thead>
                        <tr className='text-[10px] uppercase tracking-widest text-gray-500'>
                          <th className='text-left py-1.5'>Size</th>
                          <th className='text-left py-1.5'>Color</th>
                          <th className='text-left py-1.5'>SKU / Barcode</th>
                          <th className='text-left py-1.5'>Stock</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map((v) => (
                          <tr key={v._id || v.sku} className='border-t border-gray-200'>
                            <td className='py-2'>{v.size}</td>
                            <td className='py-2'>
                              <span className='inline-flex items-center gap-2'>
                                <span className='w-4 h-4 inline-block border border-gray-300' style={{ background: v.colorCode || 'transparent' }}></span>
                                {v.color}
                              </span>
                            </td>
                            <td className='py-2'>
                              <p className='font-mono text-xs'>{v.sku || '—'}</p>
                              {v.sku && (
                                <img
                                  src={backendUrl + '/api/inventory/barcode/' + encodeURIComponent(v.sku)}
                                  alt={v.sku}
                                  className='h-8 mt-1'
                                />
                              )}
                            </td>
                            <td className='py-2'>
                              <span className={`font-semibold ${v.stock <= 0 ? 'text-red-600' : v.stock <= threshold ? 'text-amber-600' : ''}`}>
                                {v.stock}
                              </span>
                            </td>
                            <td className='py-2 text-right'>
                              <button
                                onClick={() => queueLabel(p, v)}
                                disabled={!v.sku}
                                className='text-[10px] uppercase tracking-widest font-semibold border border-gray-300 px-2 py-1 hover:border-black disabled:opacity-40'
                              >
                                Queue Label
                              </button>
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

      {labelQueue.length > 0 && (
        <div className='label-sheet hidden print:block p-4'>
          <div className='grid grid-cols-3 gap-3'>
            {labelQueue.map((l, i) => (
              <div key={i} className='border border-black p-2 text-center'>
                <p className='text-[10px] font-semibold uppercase tracking-widest'>LOCOXO</p>
                <p className='text-xs font-bold mt-1 truncate'>{l.name}</p>
                <p className='text-[10px]'>Size {l.size} · {l.color}</p>
                <img
                  src={backendUrl + '/api/inventory/barcode/' + encodeURIComponent(l.sku) + '?scale=3&h=18'}
                  alt={l.sku}
                  className='mx-auto my-2 h-12'
                />
                <p className='text-[10px]'>₹{l.price}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const Tile = ({ label, value, tone, onClick }) => {
  const tones = {
    amber: 'border-amber-200 bg-amber-50',
    red:   'border-red-200 bg-red-50',
    blue:  'border-blue-200 bg-blue-50',
  }
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`p-4 border text-left ${tones[tone] || 'border-gray-200 bg-white'} ${onClick ? 'hover:shadow-sm' : ''}`}
    >
      <p className='text-[10px] uppercase tracking-widest text-gray-500 mb-1'>{label}</p>
      <p className='text-2xl font-bold'>{value}</p>
    </button>
  )
}

const StatusBadge = ({ status }) => {
  const map = {
    ok:  ['bg-green-100 text-green-700', 'In stock'],
    low: ['bg-amber-100 text-amber-700', 'Low'],
    out: ['bg-red-100 text-red-700', 'Out'],
    unknown: ['bg-gray-100 text-gray-500', 'No variants'],
  }
  const [cls, label] = map[status] || map.unknown
  return <span className={`text-[10px] px-2 py-0.5 uppercase tracking-widest font-semibold ${cls}`}>{label}</span>
}

export default Inventory
