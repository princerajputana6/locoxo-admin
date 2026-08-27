import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { backendUrl } from '../../App'
import { toast } from 'react-toastify'
import { ArrowLeft, Upload, RefreshCw, FileSpreadsheet, Search, Plus, Trash2 } from 'lucide-react'

const cfg = 'w-full px-3 py-2.5 text-sm rounded-xl bg-white border border-line focus:border-accent outline-none'
const lbl = 'block text-sm font-bold text-fg mb-1.5'
const SIZES = ['Free', 'XS', 'S', 'M', 'L', 'XL', 'XXL']
const blankForm = () => ({ code: '', category: '', subCategory: '', childCategory: '', fabric: '', name: '', size: 'M', color: 'Black', stock: '0', lowStock: '5', mrp: '', image: null })

// Bulk Add — fill one product in the top form, click "Add to List"; the added
// products collect in the list below, then Submit saves them all at once.
const BulkAddInventory = ({ token }) => {
  const navigate = useNavigate()
  const [form, setForm] = useState(blankForm())
  const [items, setItems] = useState([])
  const [codes, setCodes] = useState([])
  const [busy, setBusy] = useState(false)
  const [q, setQ] = useState('')

  // Offer only product codes not yet used by a product.
  const loadCodes = () => axios.get(backendUrl + '/api/inventory/product-code', { headers: { token } }).then(({ data }) => data.success && setCodes(data.rows.filter((r) => !r.used))).catch(() => {})
  useEffect(() => { loadCodes() }, [])

  const set = (f, v) => setForm((r) => ({ ...r, [f]: v }))
  // Picking a code fills the category chain + fabric.
  const pickCode = (code) => {
    const c = codes.find((x) => x.code === code)
    setForm((r) => ({ ...r, code, category: c?.category || '', subCategory: c?.subCategory || '', childCategory: c?.childCategory || '', fabric: c?.fabric || '' }))
  }
  const chain = (r) => [r.category, r.subCategory, r.childCategory].filter(Boolean).join(' › ')

  const addToList = () => {
    if (!form.code) return toast.error('Select a product code')
    if (form.mrp === '') return toast.error('Enter the MRP')
    setItems((list) => [...list, form])
    setForm(blankForm())
  }
  const removeItem = (i) => setItems((list) => list.filter((_, idx) => idx !== i))

  const submitAll = async () => {
    if (!items.length) return toast.error('Add at least one inventory item to the list')
    // Writes INVENTORY (stock by product code) — kept separate from products.
    const payload = items.map((r) => ({ productCode: r.code, name: r.name || undefined, category: r.category || undefined, subCategory: r.subCategory || undefined, childCategory: r.childCategory || undefined, fabric: r.fabric || undefined, size: r.size, color: r.color, stock: Number(r.stock) || 0, mrp: Number(r.mrp) || 0, lowStockThreshold: Number(r.lowStock) || 5 }))
    const fd = new FormData()
    fd.append('items', JSON.stringify(payload))
    items.forEach((r, i) => { if (r.image) fd.append(`image_${i}`, r.image) })
    setBusy(true)
    try {
      const { data } = await axios.post(backendUrl + '/api/inventory/items/bulk-add', fd, { headers: { token } })
      if (data.success) { toast.success(data.message); setItems([]); setForm(blankForm()); loadCodes() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || err.message) }
    finally { setBusy(false) }
  }

  const shown = items.filter((r) => !q || `${r.name} ${r.code}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className='p-6'>
      <div className='flex items-start justify-between mb-5'>
        <div>
          <h1 className='text-2xl font-heading font-extrabold text-fg'>Bulk Add Inventory</h1>
          <p className='text-xs text-muted mt-1'>Dashboard <span className='text-faint'>›</span> Inventory <span className='text-faint'>›</span> Bulk Add</p>
        </div>
        <button onClick={() => navigate('/inventory')} className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg hover:bg-surface-2'><ArrowLeft size={15} /> Back to Inventory</button>
      </div>

      {/* Entry form — all product fields */}
      <div className='glass rounded-2xl p-6 mb-5'>
        <h2 className='text-lg font-heading font-bold text-fg mb-5'>Inventory Item Details</h2>
        <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4'>
          <div>
            <label className={lbl}>Product Code</label>
            <select value={form.code} onChange={(e) => pickCode(e.target.value)} className={cfg + ' font-mono'}>
              <option value=''>— select code —</option>
              {codes.map((c) => <option key={c._id} value={c.code}>{c.code}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Category</label>
            <input value={chain(form) || ''} readOnly placeholder='Auto from code' className={cfg + ' bg-surface-2 text-muted'} />
          </div>
          <div><label className={lbl}>Product Name</label><input value={form.name} onChange={(e) => set('name', e.target.value)} className={cfg} placeholder='e.g. Oversized Tee' /></div>
          <div><label className={lbl}>Size</label><select value={form.size} onChange={(e) => set('size', e.target.value)} className={cfg}>{SIZES.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><label className={lbl}>Colour</label><input value={form.color} onChange={(e) => set('color', e.target.value)} className={cfg} placeholder='e.g. Black' /></div>
          <div><label className={lbl}>MRP (₹)</label><input type='number' value={form.mrp} onChange={(e) => set('mrp', e.target.value)} className={cfg} placeholder='499' /></div>
          <div><label className={lbl}>Stock</label><input type='number' value={form.stock} onChange={(e) => set('stock', e.target.value)} className={cfg} placeholder='0' /></div>
          <div><label className={lbl}>Low Stock Alert</label><input type='number' value={form.lowStock} onChange={(e) => set('lowStock', e.target.value)} className={cfg} placeholder='5' /></div>
          <div>
            <label className={lbl}>Product Image</label>
            <label className='flex items-center gap-3 h-[42px] px-3 rounded-xl border-2 border-dashed border-line bg-surface-2 cursor-pointer hover:border-accent/50 overflow-hidden'>
              {form.image ? <img src={URL.createObjectURL(form.image)} alt='' className='h-8 w-8 rounded object-cover' /> : <Upload size={16} className='text-faint' />}
              <span className='text-xs text-muted truncate'>{form.image ? form.image.name : 'Upload image'}</span>
              <input type='file' accept='image/*' hidden onChange={(e) => set('image', e.target.files?.[0] || null)} />
            </label>
          </div>
        </div>
        <div className='flex items-center justify-end gap-2 mt-5'>
          <button onClick={() => setForm(blankForm())} className='px-6 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg hover:bg-surface-2'>Clear</button>
          <button onClick={addToList} className='inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl bg-accent text-white hover:bg-accent-dark'><Plus size={15} /> Add to List</button>
        </div>
      </div>

      {/* Added items list */}
      <div className='glass rounded-2xl p-5'>
        <div className='flex items-center justify-between gap-3 mb-4'>
          <div className='relative flex-1 max-w-sm'>
            <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-faint' />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder='Search by Product Name or Code…' className='w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-line' />
          </div>
          <div className='flex items-center gap-2'>
            <button onClick={loadCodes} className='inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg bg-white border border-line text-fg hover:bg-surface-2'><RefreshCw size={15} /> Refresh</button>
            <button className='inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg bg-white border border-line text-fg hover:bg-surface-2'><FileSpreadsheet size={15} className='text-success' /> Export Excel</button>
            <button onClick={submitAll} disabled={busy || !items.length} className='px-6 py-2 text-sm font-semibold rounded-lg bg-accent text-white hover:bg-accent-dark disabled:opacity-50'>{busy ? 'Saving…' : `Submit ${items.length || ''}`}</button>
          </div>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-left text-[11px] font-semibold uppercase tracking-wider text-muted border-b border-line'>
                <th className='py-3 px-2'>S.No</th><th className='py-3 px-2'>Image</th><th className='py-3 px-2'>Product Code</th><th className='py-3 px-2'>Product Name</th><th className='py-3 px-2'>Category</th><th className='py-3 px-2'>Size</th><th className='py-3 px-2'>Colour</th><th className='py-3 px-2'>Stock</th><th className='py-3 px-2'>Low Stock</th><th className='py-3 px-2'>MRP (₹)</th><th className='py-3 px-2'>Action</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 ? <tr><td colSpan={11} className='py-10 text-center text-muted'>No inventory items added yet — fill the form above and click “Add to List”.</td></tr> :
                shown.map((r, i) => (
                  <tr key={i} className='border-b border-line/70'>
                    <td className='py-2.5 px-2 text-muted'>{i + 1}</td>
                    <td className='py-2.5 px-2'>{r.image ? <img src={URL.createObjectURL(r.image)} alt='' className='w-10 h-10 rounded-lg object-cover border border-line' /> : <span className='grid place-items-center w-10 h-10 rounded-lg border border-line bg-surface-2 text-faint text-[10px]'>—</span>}</td>
                    <td className='py-2.5 px-2 font-mono text-xs text-accent'>{r.code}</td>
                    <td className='py-2.5 px-2 font-semibold text-fg'>{r.name}</td>
                    <td className='py-2.5 px-2 text-xs text-muted'>{chain(r) || '—'}</td>
                    <td className='py-2.5 px-2 text-fg'>{r.size}</td>
                    <td className='py-2.5 px-2 text-fg'>{r.color}</td>
                    <td className='py-2.5 px-2 text-fg'>{r.stock}</td>
                    <td className='py-2.5 px-2 text-fg'>{r.lowStock}</td>
                    <td className='py-2.5 px-2 text-fg'>₹{r.mrp}</td>
                    <td className='py-2.5 px-2'><button onClick={() => removeItem(i)} className='grid place-items-center w-7 h-7 rounded-lg border border-line text-danger hover:bg-danger/5'><Trash2 size={13} /></button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <p className='text-xs text-muted mt-3'>Showing {shown.length} of {items.length} inventory items</p>
      </div>
    </div>
  )
}

export default BulkAddInventory
