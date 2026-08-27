import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { backendUrl, currency } from '../../App'
import { toast } from 'react-toastify'
import { ArrowLeft, RefreshCw, Search, Plus, Minus, Trash2, FileSpreadsheet } from 'lucide-react'
import { exportToCsv } from '../../utils/exportCsv'

// Stock management — keyed by PRODUCT CODE (inventory), not by product name.
const StockDetails = ({ token }) => {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${backendUrl}/api/inventory/items`, { params: { search: q }, headers: { token } })
      if (data.success) { setRows(data.rows || []); setSummary(data.summary) } else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load stock') }
    finally { setLoading(false) }
  }
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [q])

  const adjust = async (item, type) => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/inventory/items/adjust/${item._id}`, { type, qty: 1, reason: 'Quick adjust' }, { headers: { token } })
      if (data.success) { setRows((rs) => rs.map((r) => r._id === item._id ? { ...r, stock: data.after } : r)) } else toast.error(data.message)
    } catch { toast.error('Failed') }
  }
  const del = async (id) => { if (!window.confirm('Delete this inventory item?')) return; try { await axios.delete(`${backendUrl}/api/inventory/items/${id}`, { headers: { token } }); toast.success('Deleted'); load() } catch { toast.error('Failed') } }

  const stateOf = (it) => it.stock <= 0 ? 'Out of Stock' : it.stock <= (it.lowStockThreshold ?? 5) ? 'Low Stock' : 'In Stock'
  const pill = { 'In Stock': 'bg-success/10 text-success', 'Low Stock': 'bg-amber/10 text-amber', 'Out of Stock': 'bg-danger/10 text-danger' }
  const shown = useMemo(() => rows, [rows])
  const exportExcel = () => shown.length ? exportToCsv('stock', shown.map((r) => ({ 'Product Code': r.productCode, Category: [r.category, r.subCategory, r.childCategory].filter(Boolean).join(' › '), Name: r.name || '', Size: r.size, Colour: r.color, Stock: r.stock, 'Low Stock': r.lowStockThreshold, MRP: r.mrp, SKU: r.sku, Status: stateOf(r) }))) : toast.error('Nothing to export')

  return (
    <div className='p-6'>
      <div className='flex items-start justify-between mb-5 flex-wrap gap-3'>
        <div>
          <h1 className='text-2xl font-heading font-extrabold text-fg'>Stock Details</h1>
          <p className='text-xs text-muted mt-1'>Dashboard <span className='text-faint'>›</span> Inventory <span className='text-faint'>›</span> Stock — by product code</p>
        </div>
        <div className='flex items-center gap-2'>
          <button onClick={exportExcel} className='inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><FileSpreadsheet size={15} className='text-success' /> Export Excel</button>
          <button onClick={load} className='inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><RefreshCw size={15} /> Refresh</button>
          <button onClick={() => navigate('/inventory')} className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><ArrowLeft size={15} /> Back to Inventory</button>
        </div>
      </div>

      <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mb-5'>
        <div className='glass rounded-2xl p-4'><p className='text-xs text-muted'>Total Stock</p><p className='text-2xl font-heading font-extrabold text-fg'>{summary?.totalStock ?? '—'}</p></div>
        <div className='glass rounded-2xl p-4'><p className='text-xs text-muted'>Inventory Items</p><p className='text-2xl font-heading font-extrabold text-fg'>{summary?.items ?? '—'}</p></div>
        <div className='glass rounded-2xl p-4'><p className='text-xs text-muted'>Low Stock</p><p className='text-2xl font-heading font-extrabold text-amber'>{summary?.lowStock ?? '—'}</p></div>
        <div className='glass rounded-2xl p-4'><p className='text-xs text-muted'>Out of Stock</p><p className='text-2xl font-heading font-extrabold text-danger'>{summary?.outOfStock ?? '—'}</p></div>
      </div>

      <div className='glass rounded-2xl p-5'>
        <div className='relative max-w-sm mb-4'>
          <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-faint' />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder='Search by product code, category…' className='w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-line' />
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead><tr className='text-left text-[11px] font-semibold uppercase tracking-wider text-muted border-b border-line'>
              <th className='py-3 px-2'>Product Code</th><th className='py-3 px-2'>Category</th><th className='py-3 px-2'>Name</th><th className='py-3 px-2'>Size</th><th className='py-3 px-2'>Colour</th><th className='py-3 px-2'>Stock</th><th className='py-3 px-2'>MRP</th><th className='py-3 px-2'>Status</th><th className='py-3 px-2'>Action</th>
            </tr></thead>
            <tbody>
              {loading ? [0, 1, 2].map((i) => <tr key={i}><td colSpan={9} className='py-2'><div className='skeleton h-10 rounded-lg' /></td></tr>) :
                shown.length === 0 ? <tr><td colSpan={9} className='py-10 text-center text-muted'>No inventory yet.</td></tr> :
                  shown.map((r) => (
                    <tr key={r._id} className='border-b border-line/70 hover:bg-surface-2/40'>
                      <td className='py-2.5 px-2 font-mono font-semibold text-accent'>{r.productCode}</td>
                      <td className='py-2.5 px-2 text-xs text-muted'>{[r.category, r.subCategory, r.childCategory].filter(Boolean).join(' › ') || '—'}</td>
                      <td className='py-2.5 px-2 text-fg'>{r.name || '—'}</td>
                      <td className='py-2.5 px-2 text-fg'>{r.size}</td>
                      <td className='py-2.5 px-2 text-fg'>{r.color}</td>
                      <td className='py-2.5 px-2'><div className='inline-flex items-center gap-1.5'>
                        <button onClick={() => adjust(r, 'Decrease')} className='grid place-items-center w-6 h-6 rounded-md border border-line text-danger hover:bg-danger/5'><Minus size={12} /></button>
                        <span className='w-8 text-center font-semibold text-fg'>{r.stock}</span>
                        <button onClick={() => adjust(r, 'Increase')} className='grid place-items-center w-6 h-6 rounded-md border border-line text-success hover:bg-success/5'><Plus size={12} /></button>
                      </div></td>
                      <td className='py-2.5 px-2 text-fg'>{currency}{r.mrp}</td>
                      <td className='py-2.5 px-2'><span className={`px-2 py-1 rounded-md text-[11px] font-semibold ${pill[stateOf(r)]}`}>{stateOf(r)}</span></td>
                      <td className='py-2.5 px-2'><button onClick={() => del(r._id)} className='grid place-items-center w-7 h-7 rounded-lg border border-line text-danger hover:bg-danger/5'><Trash2 size={13} /></button></td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        <p className='text-xs text-muted mt-3'>Showing {shown.length} inventory item(s)</p>
      </div>
    </div>
  )
}

export default StockDetails
