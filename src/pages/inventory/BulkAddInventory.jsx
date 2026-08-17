import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { backendUrl } from '../../App'
import { toast } from 'react-toastify'
import { ArrowLeft, Upload, RefreshCw, FileSpreadsheet, Search, Plus, Trash2, Pencil } from 'lucide-react'

const num = (n, tone = 'bg-accent') => <span className={`grid place-items-center w-5 h-5 rounded-full ${tone} text-white text-[11px] font-bold shrink-0`}>{n}</span>
const cfg = 'w-full px-3 py-2.5 text-sm rounded-xl bg-white border border-line focus:border-accent outline-none'
const AUDIENCES = ['Male', 'Female', 'Unisex', 'Child']
const SIZES = ['Free', 'XS', 'S', 'M', 'L', 'XL', 'XXL']
const blankRow = () => ({ name: '', audience: 'Male', size: 'M', color: 'Black', stock: '0', lowStock: '5', mrp: '', image: null })

const BulkAddInventory = ({ token }) => {
  const navigate = useNavigate()
  const [rows, setRows] = useState([blankRow()])
  const [nextCode, setNextCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [q, setQ] = useState('')

  useEffect(() => { axios.get(backendUrl + '/api/inventory/next-code', { headers: { token } }).then(({ data }) => data.success && setNextCode(data.productCode)).catch(() => {}) }, [])

  const upd = (i, f, v) => setRows((r) => r.map((row, idx) => idx === i ? { ...row, [f]: v } : row))
  const submit = async () => {
    const items = rows.filter((r) => r.name.trim() && r.mrp !== '').map((r) => ({
      product: { name: r.name, price: r.mrp, audience: r.audience, category: r.audience, lowStockThreshold: Number(r.lowStock) || 5, brand: 'LOCOXO', variants: [{ size: r.size, color: r.color, stock: Number(r.stock) || 0 }] },
      file: r.image,
    }))
    if (!items.length) return toast.error('Add at least one product with name and MRP')
    const fd = new FormData()
    fd.append('products', JSON.stringify(items.map((x) => x.product)))
    items.forEach((x, i) => { if (x.file) fd.append(`image_${i}`, x.file) })
    setBusy(true)
    try {
      const { data } = await axios.post(backendUrl + '/api/inventory/bulk-add', fd, { headers: { token } })
      if (data.success) { toast.success(data.message); setRows([blankRow()]); navigate('/inventory') }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || err.message) }
    finally { setBusy(false) }
  }

  const configs = [
    ['1', 'Upload Image (Single Image)'], ['2', 'Product Code'], ['3', 'Product Name'], ['4', 'Category'],
    ['5', 'Size'], ['6', 'Colour'], ['7', 'MRP (₹)'], ['8', 'Stock'], ['9', 'Low Stock Alert'], ['10', 'Re-stock the product'],
  ]

  return (
    <div className='p-6'>
      <div className='flex items-start justify-between mb-5'>
        <div>
          <h1 className='text-2xl font-heading font-extrabold text-fg'>Bulk Add Products</h1>
          <p className='text-xs text-muted mt-1'>Dashboard <span className='text-faint'>›</span> Inventory <span className='text-faint'>›</span> Products <span className='text-faint'>›</span> Bulk Add</p>
        </div>
        <button onClick={() => navigate('/inventory')} className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg hover:bg-surface-2'><ArrowLeft size={15} /> Back to Inventory</button>
      </div>

      {/* Config card */}
      <div className='glass rounded-2xl p-6 mb-5'>
        <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
          <div className='row-span-2'>
            <p className='flex items-center gap-2 text-sm font-bold text-fg mb-1'>{num(1)} Upload Image</p>
            <p className='text-[11px] text-muted mb-2'>Upload a single image for all products</p>
            <label className='flex flex-col items-center justify-center gap-1 h-28 rounded-xl border-2 border-dashed border-line bg-surface-2 cursor-pointer hover:border-accent/50'>
              <Upload size={20} className='text-faint' /><span className='text-sm font-medium text-muted'>Upload Image</span><span className='text-[10px] text-faint'>PNG, JPG or JPEG (Max. 2MB)</span>
              <input type='file' accept='image/*' hidden onChange={(e) => setRows((r) => r.map((row) => ({ ...row, image: e.target.files?.[0] || row.image })))} />
            </label>
          </div>
          {configs.slice(1).map(([n, label]) => (
            <div key={n}>
              <p className='flex items-center gap-2 text-sm font-bold text-fg mb-2'>{num(n)} {label}</p>
              <select className={cfg}><option>{n === '2' || n === '5' ? 'Automatic' : 'Manually'}</option><option>{n === '2' || n === '5' ? 'Manually' : 'Automatic'}</option></select>
            </div>
          ))}
        </div>
        <div className='flex items-center justify-end gap-2 mt-5'>
          <button onClick={() => setRows([blankRow()])} className='px-6 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg hover:bg-surface-2'>Cancel</button>
          <button onClick={submit} disabled={busy} className='px-8 py-2.5 text-sm font-semibold rounded-xl bg-accent text-white hover:bg-accent-dark'>{busy ? 'Saving…' : 'Submit'}</button>
        </div>
      </div>

      {/* Table card */}
      <div className='glass rounded-2xl p-5'>
        <div className='flex items-center justify-between gap-3 mb-4'>
          <div className='relative flex-1 max-w-sm'>
            <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-faint' />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder='Search by Product Name, SKU, Product Code…' className='w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-line' />
          </div>
          <div className='flex items-center gap-2'>
            <button className='inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg bg-white border border-line text-fg hover:bg-surface-2'><RefreshCw size={15} /> Refresh</button>
            <button className='inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg bg-white border border-line text-fg hover:bg-surface-2'><FileSpreadsheet size={15} className='text-success' /> Export Excel</button>
          </div>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-left text-[11px] font-semibold uppercase tracking-wider text-muted border-b border-line'>
                <th className='py-3 px-2'>Status</th><th className='py-3 px-2'>S.No</th><th className='py-3 px-2'>Images</th><th className='py-3 px-2'>Product Code</th><th className='py-3 px-2'>Product Name</th><th className='py-3 px-2'>Category</th><th className='py-3 px-2'>Size</th><th className='py-3 px-2'>Colour</th><th className='py-3 px-2'>Stock</th><th className='py-3 px-2'>Low Stock</th><th className='py-3 px-2'>MRP (₹)</th><th className='py-3 px-2'>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const outOfStock = Number(r.stock) <= 0
                const tc = 'px-2 py-1.5 text-sm rounded-lg bg-white border border-line focus:border-accent outline-none'
                return (
                  <tr key={i} className='border-b border-line/70'>
                    <td className='py-2.5 px-2'><span className={`px-2 py-1 rounded-md text-[11px] font-semibold ${outOfStock ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>{outOfStock ? 'Out of Stock' : 'In Stock'}</span></td>
                    <td className='py-2.5 px-2 text-muted'>{i + 1}</td>
                    <td className='py-2.5 px-2'>
                      <label className='grid place-items-center w-10 h-10 rounded-lg border border-line bg-surface-2 cursor-pointer overflow-hidden'>
                        {r.image ? <img src={URL.createObjectURL(r.image)} alt='' className='w-full h-full object-cover' /> : <Plus size={14} className='text-faint' />}
                        <input type='file' accept='image/*' hidden onChange={(e) => upd(i, 'image', e.target.files?.[0] || null)} />
                      </label>
                    </td>
                    <td className='py-2.5 px-2 font-mono text-accent text-xs'>{nextCode ? nextCode.replace(/\d+$/, (m) => String(Number(m) + i).padStart(2, '0')) : 'auto'}</td>
                    <td className='py-2.5 px-2'><input value={r.name} onChange={(e) => upd(i, 'name', e.target.value)} className={tc + ' w-32'} placeholder='Name' /></td>
                    <td className='py-2.5 px-2'><select value={r.audience} onChange={(e) => upd(i, 'audience', e.target.value)} className={tc}>{AUDIENCES.map((a) => <option key={a}>{a}</option>)}</select></td>
                    <td className='py-2.5 px-2'><select value={r.size} onChange={(e) => upd(i, 'size', e.target.value)} className={tc}>{SIZES.map((sz) => <option key={sz}>{sz}</option>)}</select></td>
                    <td className='py-2.5 px-2'><input value={r.color} onChange={(e) => upd(i, 'color', e.target.value)} className={tc + ' w-20'} /></td>
                    <td className='py-2.5 px-2'><input type='number' value={r.stock} onChange={(e) => upd(i, 'stock', e.target.value)} className={tc + ' w-16'} /></td>
                    <td className='py-2.5 px-2'><input type='number' value={r.lowStock} onChange={(e) => upd(i, 'lowStock', e.target.value)} className={tc + ' w-16'} /></td>
                    <td className='py-2.5 px-2'><input type='number' value={r.mrp} onChange={(e) => upd(i, 'mrp', e.target.value)} className={tc + ' w-20'} placeholder='499' /></td>
                    <td className='py-2.5 px-2'><div className='flex gap-1'>
                      <button className='grid place-items-center w-7 h-7 rounded-lg border border-line text-accent'><Pencil size={13} /></button>
                      <button onClick={() => setRows((rr) => rr.length > 1 ? rr.filter((_, idx) => idx !== i) : rr)} className='grid place-items-center w-7 h-7 rounded-lg border border-line text-danger'><Trash2 size={13} /></button>
                    </div></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <button onClick={() => setRows((r) => [...r, blankRow()])} className='mt-3 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border border-dashed border-accent/50 text-accent hover:bg-accent/5'><Plus size={15} /> Add Row</button>
        <p className='text-xs text-muted mt-3'>Showing 1 to {rows.length} of {rows.length} entries</p>
      </div>
    </div>
  )
}

export default BulkAddInventory
