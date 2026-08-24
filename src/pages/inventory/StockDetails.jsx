import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { backendUrl } from '../../App'
import { toast } from 'react-toastify'
import {
  ArrowLeft, PlusCircle, Upload, Barcode, RefreshCw, PackageX, AlertTriangle,
  ShoppingCart, Filter, Columns3, Pencil, Trash2, Eye, ArrowRight,
} from 'lucide-react'

const inp = 'w-full px-3 py-2.5 text-sm rounded-xl bg-white border border-line focus:border-accent outline-none'
const lbl = 'block text-xs font-semibold text-muted mb-1.5'

const StockDetails = ({ token }) => {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [summary, setSummary] = useState(null)
  const [history, setHistory] = useState([])
  // adjustment form
  const [pid, setPid] = useState(''); const [size, setSize] = useState(''); const [color, setColor] = useState('')
  const [type, setType] = useState('Increase'); const [qty, setQty] = useState(''); const [reason, setReason] = useState('')
  const [reference, setReference] = useState(''); const [remarks, setRemarks] = useState(''); const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const [p, s, h] = await Promise.all([
        axios.get(backendUrl + '/api/product/list?limit=500&all=true'),
        axios.get(backendUrl + '/api/inventory/summary', { headers: { token } }),
        axios.get(backendUrl + '/api/inventory/history?limit=10', { headers: { token } }),
      ])
      if (p.data.success) setProducts(p.data.products)
      if (s.data.success) setSummary(s.data.summary)
      if (h.data.success) setHistory(h.data.rows)
    } catch (err) { toast.error('Failed to load stock details') }
  }
  useEffect(() => { load() }, [])

  const variantRows = useMemo(() => {
    const out = []
    products.forEach((p) => {
      const threshold = p.lowStockThreshold ?? 5
      ;(p.variants || []).forEach((v) => out.push({
        p, v, status: v.stock <= 0 ? 'Out of Stock' : v.stock <= threshold ? 'Low Stock' : 'In Stock', threshold,
      }))
    })
    return out
  }, [products])

  const selectedProduct = products.find((p) => p._id === pid)
  const delProduct = async (prod) => { if (!window.confirm(`Delete product "${prod.name}" and all its stock?`)) return; try { await axios.post(`${backendUrl}/api/product/remove`, { id: prod._id }, { headers: { token } }); toast.success('Deleted'); load() } catch { toast.error('Failed') } }

  const applyAdjustment = async () => {
    if (!pid || !size || !color) return toast.error('Select product, size and colour')
    if (!qty) return toast.error('Enter quantity')
    const delta = (type === 'Decrease' ? -1 : 1) * Math.abs(Number(qty))
    setBusy(true)
    try {
      const { data } = await axios.post(`${backendUrl}/api/inventory/restock/${pid}`, { size, color, qty: delta, reason: reason || remarks || 'Stock adjustment' }, { headers: { token } })
      if (data.success) { toast.success(data.message); setQty(''); setReason(''); setReference(''); setRemarks(''); load() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setBusy(false) }
  }

  const Card = ({ icon: Icon, tone, title, value, sub, cta, onCta }) => (
    <div className='glass rounded-2xl p-5'>
      <div className='flex items-center gap-3'>
        <span className={`grid place-items-center w-12 h-12 rounded-xl ${tone}`}><Icon size={22} /></span>
        <div><p className='text-sm font-semibold text-fg'>{title}</p>{value !== undefined && <p className='text-2xl font-heading font-extrabold text-fg'>{value}</p>}</div>
      </div>
      <p className='text-xs text-muted mt-2'>{sub}</p>
      {cta && <button onClick={onCta} className='mt-2 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline'>{cta} <ArrowRight size={13} /></button>}
    </div>
  )

  return (
    <div className='p-6'>
      <div className='flex items-start justify-between mb-5 flex-wrap gap-3'>
        <div>
          <h1 className='text-2xl font-heading font-extrabold text-fg'>Stock Details</h1>
          <p className='text-xs text-muted mt-1'>Dashboard <span className='text-faint'>›</span> Inventory <span className='text-faint'>›</span> Stock Details</p>
        </div>
        <div className='flex items-center gap-2'>
          <button onClick={() => navigate('/inventory/product-code')} className='inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-accent text-white'><PlusCircle size={15} /> Create Product Code</button>
          <button onClick={() => navigate('/inventory/bulk-add')} className='inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><Upload size={15} /> Bulk Add</button>
          <button onClick={() => navigate('/inventory/barcode')} className='inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><Barcode size={15} /> Barcode</button>
          <button onClick={load} className='inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><RefreshCw size={15} /> Refresh</button>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-3 mb-5'>
        <Card icon={PackageX} tone='bg-danger/10 text-danger' title='Out-of-Stock Products' value={summary?.outOfStock ?? 0} sub='Products with 0 stock quantity' cta='View All' onCta={() => { }} />
        <Card icon={AlertTriangle} tone='bg-amber/10 text-amber' title='Low-Stock Alerts' value={summary?.lowStock ?? 0} sub='Products with stock ≤ low stock volume' cta='View All' onCta={() => { }} />
        <Card icon={ShoppingCart} tone='bg-success/10 text-success' title='Re-stock Products' sub='Add out-of-stock or low-stock products again' cta='Go to Bulk Add' onCta={() => navigate('/inventory/bulk-add')} />
      </div>

      {/* Stock by size & colour */}
      <div className='glass rounded-2xl p-5 mb-5'>
        <div className='flex items-center justify-between mb-4'>
          <p className='font-heading font-bold text-fg'>Stock Quantity by Size and Colour</p>
          <div className='flex items-center gap-2'>
            <button className='inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg bg-white border border-line text-fg'><Filter size={14} /> Filter</button>
            <button className='inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg bg-white border border-line text-fg'><Columns3 size={14} /> Column</button>
          </div>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-left text-[11px] font-semibold uppercase tracking-wider text-muted border-b border-line'>
                <th className='py-3 px-2'>Status</th><th className='py-3 px-2'>S.No</th><th className='py-3 px-2'>Images</th><th className='py-3 px-2'>Product Code</th><th className='py-3 px-2'>Product Name</th><th className='py-3 px-2'>Category</th><th className='py-3 px-2'>Size</th><th className='py-3 px-2'>Colour</th><th className='py-3 px-2'>Total Stock</th><th className='py-3 px-2'>Low Stock Volume</th><th className='py-3 px-2'>Action</th>
              </tr>
            </thead>
            <tbody>
              {variantRows.length === 0 ? <tr><td colSpan={11} className='py-8 text-center text-muted'>No stock.</td></tr> :
                variantRows.slice(0, 12).map((r, i) => (
                  <tr key={i} className='border-b border-line/70'>
                    <td className='py-2.5 px-2'><span className={`px-2 py-1 rounded-md text-[11px] font-semibold ${r.status === 'In Stock' ? 'bg-success/10 text-success' : r.status === 'Low Stock' ? 'bg-amber/10 text-amber' : 'bg-danger/10 text-danger'}`}>{r.status}</span></td>
                    <td className='py-2.5 px-2 text-muted'>{i + 1}</td>
                    <td className='py-2.5 px-2'><img src={Array.isArray(r.p.image) ? r.p.image[0] : r.p.image} alt='' className='w-9 h-9 rounded-lg object-cover border border-line' /></td>
                    <td className='py-2.5 px-2 font-mono text-accent text-xs'>{r.p.productCode || '—'}</td>
                    <td className='py-2.5 px-2 text-fg'>{r.p.name}</td>
                    <td className='py-2.5 px-2 text-muted'>{r.p.audience || r.p.category}</td>
                    <td className='py-2.5 px-2 text-fg'>{r.v.size}</td>
                    <td className='py-2.5 px-2 text-fg'>{r.v.color}</td>
                    <td className='py-2.5 px-2 font-semibold text-fg'>{r.v.stock}</td>
                    <td className='py-2.5 px-2 text-muted'>{r.threshold}</td>
                    <td className='py-2.5 px-2'><div className='flex gap-1'><button onClick={() => { setPid(r.p._id); setSize(r.v.size); setColor(r.v.color); window.scrollTo({ top: 0, behavior: 'smooth' }) }} title='Adjust stock' className='grid place-items-center w-7 h-7 rounded-lg border border-line text-accent hover:bg-accent/5'><Pencil size={13} /></button><button onClick={() => delProduct(r.p)} title='Delete product' className='grid place-items-center w-7 h-7 rounded-lg border border-line text-danger hover:bg-danger/5'><Trash2 size={13} /></button></div></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjustment form + recent */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-3'>
        <div className='glass rounded-2xl p-5'>
          <p className='font-heading font-bold text-fg'>Stock Adjustment</p>
          <p className='text-xs text-muted mb-4'>Update stock quantity manually</p>
          <div className='grid grid-cols-3 gap-3 mb-3'>
            <div><label className={lbl}>Product</label><select value={pid} onChange={(e) => { setPid(e.target.value); setSize(''); setColor('') }} className={inp}><option value=''>Select Product</option>{products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}</select></div>
            <div><label className={lbl}>Size</label><select value={size} onChange={(e) => setSize(e.target.value)} className={inp}><option value=''>Select Size</option>{[...new Set((selectedProduct?.variants || []).map((v) => v.size))].map((s) => <option key={s}>{s}</option>)}</select></div>
            <div><label className={lbl}>Colour</label><select value={color} onChange={(e) => setColor(e.target.value)} className={inp}><option value=''>Select Colour</option>{[...new Set((selectedProduct?.variants || []).map((v) => v.color))].map((c) => <option key={c}>{c}</option>)}</select></div>
          </div>
          <div className='grid grid-cols-3 gap-3 mb-3'>
            <div><label className={lbl}>Adjustment Type</label><select value={type} onChange={(e) => setType(e.target.value)} className={inp}><option>Increase</option><option>Decrease</option></select></div>
            <div><label className={lbl}>Quantity</label><input type='number' value={qty} onChange={(e) => setQty(e.target.value)} className={inp} placeholder='Enter quantity' /></div>
            <div><label className={lbl}>Reason</label><select value={reason} onChange={(e) => setReason(e.target.value)} className={inp}><option value=''>Select Reason</option><option>Stock Added</option><option>Damaged Item</option><option>Restock</option><option>Return</option><option>New Stock</option></select></div>
          </div>
          <div className='grid grid-cols-2 gap-3 mb-4'>
            <div><label className={lbl}>Reference (Optional)</label><input value={reference} onChange={(e) => setReference(e.target.value)} className={inp} placeholder='Reference / Note' /></div>
            <div><label className={lbl}>Remarks (Optional)</label><input value={remarks} onChange={(e) => setRemarks(e.target.value)} className={inp} placeholder='Enter remarks' /></div>
          </div>
          <div className='flex items-center justify-end gap-2'>
            <button onClick={() => { setQty(''); setReason(''); setReference(''); setRemarks('') }} className='px-6 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg'>Reset</button>
            <button onClick={applyAdjustment} disabled={busy} className='px-6 py-2.5 text-sm font-semibold rounded-xl bg-accent text-white hover:bg-accent-dark'>{busy ? 'Applying…' : 'Apply Adjustments'}</button>
          </div>
        </div>

        <div className='glass rounded-2xl p-5'>
          <p className='font-heading font-bold text-fg mb-4'>Recent Stock Adjustments</p>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-left text-[11px] font-semibold uppercase tracking-wider text-muted border-b border-line'>
                  <th className='py-2.5 px-2'>S.No</th><th className='py-2.5 px-2'>Date &amp; Time</th><th className='py-2.5 px-2'>Product</th><th className='py-2.5 px-2'>Size</th><th className='py-2.5 px-2'>Type</th><th className='py-2.5 px-2'>Qty</th><th className='py-2.5 px-2'>Reason</th><th className='py-2.5 px-2'>Action</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? <tr><td colSpan={8} className='py-8 text-center text-muted'>No adjustments.</td></tr> :
                  history.map((a, i) => (
                    <tr key={a._id} className='border-b border-line/70'>
                      <td className='py-2.5 px-2 text-muted'>{i + 1}</td>
                      <td className='py-2.5 px-2 text-muted text-xs'>{new Date(a.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className='py-2.5 px-2 text-fg text-xs'>{a.productName}</td>
                      <td className='py-2.5 px-2 text-muted'>{a.size} · {a.color}</td>
                      <td className='py-2.5 px-2'><span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${a.qtyChange >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>{a.qtyChange >= 0 ? 'Increase' : 'Decrease'}</span></td>
                      <td className={`py-2.5 px-2 font-semibold ${a.qtyChange >= 0 ? 'text-success' : 'text-danger'}`}>{a.qtyChange >= 0 ? '+' : ''}{a.qtyChange}</td>
                      <td className='py-2.5 px-2 text-muted text-xs'>{a.reason}</td>
                      <td className='py-2.5 px-2'><button className='grid place-items-center w-7 h-7 rounded-lg border border-line text-muted'><Eye size={13} /></button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StockDetails
