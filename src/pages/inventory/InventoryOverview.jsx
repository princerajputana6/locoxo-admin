import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { backendUrl, currency } from '../../App'
import { toast } from 'react-toastify'
import {
  Package, Hash, Boxes, AlertTriangle, PackageX, Wallet,
  RefreshCw, PlusCircle, Barcode, Search, Pencil, Trash2, ArrowUpDown, X, FileSpreadsheet, ChevronDown,
} from 'lucide-react'
import { exportToCsv } from '../../utils/exportCsv'

const SIZES = ['Free', 'XS', 'S', 'M', 'L', 'XL', 'XXL']

const Stat = ({ icon: Icon, label, value, tone }) => {
  const tones = { blue: 'bg-accent/10 text-accent', green: 'bg-success/10 text-success', amber: 'bg-amber/10 text-amber', red: 'bg-danger/10 text-danger', violet: 'bg-violet/10 text-violet' }
  return (
    <div className='glass rounded-2xl p-4'>
      <div className='flex items-start justify-between'>
        <div><p className='text-xs font-medium text-muted'>{label}</p><p className='text-2xl font-heading font-extrabold text-fg mt-1'>{value}</p></div>
        <span className={`grid place-items-center w-10 h-10 rounded-xl ${tones[tone]}`}><Icon size={18} /></span>
      </div>
    </div>
  )
}

// Inventory = stock kept SEPARATE from products, listed BY PRODUCT CODE.
const InventoryOverview = ({ token }) => {
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [editItem, setEditItem] = useState(null)
  const [adjItem, setAdjItem] = useState(null)
  const [open, setOpen] = useState({})   // which product-code accordions are expanded
  const [sort, setSort] = useState('code-asc')
  const toggle = (code) => setOpen((o) => ({ ...o, [code]: !o[code] }))

  // Sort the product-code groups.
  const sortedGroups = useMemo(() => {
    const g = [...groups]
    const stock = (x) => x.items.reduce((s, it) => s + (it.stock || 0), 0)
    const cmp = {
      'code-asc': (a, b) => a.productCode.localeCompare(b.productCode),
      'code-desc': (a, b) => b.productCode.localeCompare(a.productCode),
      'stock-desc': (a, b) => stock(b) - stock(a),
      'stock-asc': (a, b) => stock(a) - stock(b),
      'variants-desc': (a, b) => b.items.length - a.items.length,
    }[sort]
    return g.sort(cmp)
  }, [groups, sort])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${backendUrl}/api/inventory/items`, { params: { search: q }, headers: { token } })
      if (data.success) { setGroups(data.groups || []); setSummary(data.summary) } else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load inventory') }
    finally { setLoading(false) }
  }
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [q])

  const del = async (id) => {
    if (!window.confirm('Delete this inventory item?')) return
    try { await axios.delete(`${backendUrl}/api/inventory/items/${id}`, { headers: { token } }); toast.success('Deleted'); load() } catch { toast.error('Failed') }
  }

  const allRows = useMemo(() => groups.flatMap((g) => g.items.map((it) => ({ ...it, groupChain: [g.category, g.subCategory, g.childCategory].filter(Boolean).join(' › ') }))), [groups])
  const exportExcel = () => {
    if (!allRows.length) return toast.error('No inventory to export')
    exportToCsv('inventory', allRows.map((r) => ({
      'Product Code': r.productCode, Category: r.groupChain, Name: r.name || '', Size: r.size, Colour: r.color,
      Stock: r.stock, 'Low Stock': r.lowStockThreshold, 'MRP': r.mrp, SKU: r.sku, Barcode: r.barcode,
    })))
  }

  const stateOf = (it) => it.stock <= 0 ? 'Out of Stock' : it.stock <= (it.lowStockThreshold ?? 5) ? 'Low Stock' : 'In Stock'
  const statePill = { 'In Stock': 'bg-success/10 text-success', 'Low Stock': 'bg-amber/10 text-amber', 'Out of Stock': 'bg-danger/10 text-danger' }

  return (
    <div className='p-6'>
      <div className='flex items-start justify-between mb-5 flex-wrap gap-3'>
        <div>
          <h1 className='text-2xl font-heading font-extrabold text-fg'>Inventory</h1>
          <p className='text-xs text-muted mt-1'>Dashboard <span className='text-faint'>›</span> Inventory — stock by product code (separate from products)</p>
        </div>
        <div className='flex items-center gap-2'>
          <button onClick={() => navigate('/inventory/product-code')} className='inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><Hash size={15} /> Product Codes</button>
          <button onClick={() => navigate('/inventory/bulk-add')} className='inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-accent text-white hover:bg-accent-dark'><PlusCircle size={15} /> Add Inventory</button>
          <button onClick={() => navigate('/inventory/barcode')} className='inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><Barcode size={15} /> Barcodes</button>
          <button onClick={exportExcel} className='inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><FileSpreadsheet size={15} className='text-success' /> Export Excel</button>
          <button onClick={load} className='inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><RefreshCw size={15} /> Refresh</button>
        </div>
      </div>

      <div className='grid grid-cols-2 md:grid-cols-6 gap-3 mb-5'>
        <Stat icon={Hash} label='Product Codes' value={summary?.codes ?? '—'} tone='blue' />
        <Stat icon={Boxes} label='Inventory Items' value={summary?.items ?? '—'} tone='violet' />
        <Stat icon={Package} label='Total Stock' value={summary?.totalStock ?? '—'} tone='green' />
        <Stat icon={AlertTriangle} label='Low Stock' value={summary?.lowStock ?? '—'} tone='amber' />
        <Stat icon={PackageX} label='Out of Stock' value={summary?.outOfStock ?? '—'} tone='red' />
        <Stat icon={Wallet} label='Stock Value' value={`${currency}${(summary?.value || 0).toLocaleString('en-IN')}`} tone='green' />
      </div>

      <div className='glass rounded-2xl p-5'>
        <div className='flex items-center justify-between gap-3 mb-4'>
          <div className='relative flex-1 max-w-sm'>
            <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-faint' />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder='Search by product code, category…' className='w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-line' />
          </div>
          {groups.length > 0 && (
            <div className='flex items-center gap-2'>
              <button onClick={() => setOpen(Object.fromEntries(groups.map((g) => [g.productCode, true])))} className='px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-line text-fg hover:bg-surface-2'>Expand all</button>
              <button onClick={() => setOpen({})} className='px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-line text-fg hover:bg-surface-2'>Collapse all</button>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className='px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-line text-fg outline-none'><option value='code-asc'>Code A→Z</option><option value='code-desc'>Code Z→A</option><option value='stock-desc'>Stock high→low</option><option value='stock-asc'>Stock low→high</option><option value='variants-desc'>Most variants</option></select>
            </div>
          )}
        </div>

        {loading ? <div className='space-y-3'>{[0, 1, 2].map((i) => <div key={i} className='skeleton h-16 rounded-xl' />)}</div> :
          (sortedGroups.length===0) ? <p className='py-12 text-center text-muted'>No inventory yet. Use <b>Add Inventory</b> to add stock against a product code.</p> :
            <div className='space-y-5'>
              {sortedGroups.map((g) => {
                const total = g.items.reduce((s, it) => s + (it.stock || 0), 0)
                return (
                  <div key={g.productCode} className='rounded-xl border border-line overflow-hidden'>
                    {/* Accordion header — click the product code to expand/collapse */}
                    <button onClick={() => toggle(g.productCode)} className={`w-full flex items-center justify-between px-4 py-3 bg-surface-2 hover:bg-surface-3 transition-colors ${open[g.productCode] ? 'border-b border-line' : ''}`}>
                      <div className='flex items-center gap-3 min-w-0'>
                        <ChevronDown size={16} className={`text-muted transition-transform shrink-0 ${open[g.productCode] ? 'rotate-180' : ''}`} />
                        <span className='font-mono font-bold text-accent'>{g.productCode}</span>
                        <span className='text-xs text-muted truncate'>{[g.category, g.subCategory, g.childCategory].filter(Boolean).join(' › ') || '—'}</span>
                        {g.fabric && <span className='text-[11px] text-faint'>· {g.fabric}</span>}
                      </div>
                      <span className='text-xs font-semibold text-fg shrink-0 ml-3'>{g.items.length} variant(s) · {total} in stock</span>
                    </button>
                    {open[g.productCode] && <table className='w-full text-sm'>
                      <thead><tr className='text-left text-[11px] font-semibold uppercase tracking-wider text-muted border-b border-line'>
                        <th className='py-2.5 px-3'>Name</th><th className='py-2.5 px-3'>Size</th><th className='py-2.5 px-3'>Colour</th><th className='py-2.5 px-3'>Stock</th><th className='py-2.5 px-3'>Low</th><th className='py-2.5 px-3'>MRP</th><th className='py-2.5 px-3'>SKU</th><th className='py-2.5 px-3'>Status</th><th className='py-2.5 px-3'>Action</th>
                      </tr></thead>
                      <tbody>
                        {g.items.map((it) => (
                          <tr key={it._id} className='border-b border-line/60 last:border-0 hover:bg-surface-2/40'>
                            <td className='py-2.5 px-3 text-fg'>{it.name || '—'}</td>
                            <td className='py-2.5 px-3 text-fg'>{it.size}</td>
                            <td className='py-2.5 px-3 text-fg'>{it.color}</td>
                            <td className='py-2.5 px-3 font-semibold text-fg'>{it.stock}</td>
                            <td className='py-2.5 px-3 text-muted'>{it.lowStockThreshold}</td>
                            <td className='py-2.5 px-3 text-fg'>{currency}{it.mrp}</td>
                            <td className='py-2.5 px-3 font-mono text-[11px] text-muted'>{it.sku}</td>
                            <td className='py-2.5 px-3'><span className={`px-2 py-1 rounded-md text-[11px] font-semibold ${statePill[stateOf(it)]}`}>{stateOf(it)}</span></td>
                            <td className='py-2.5 px-3'><div className='flex gap-1'>
                              <button onClick={() => setAdjItem(it)} title='Adjust stock' className='grid place-items-center w-7 h-7 rounded-lg border border-line text-success hover:bg-success/5'><ArrowUpDown size={13} /></button>
                              <button onClick={() => setEditItem(it)} title='Edit item' className='grid place-items-center w-7 h-7 rounded-lg border border-line text-accent hover:bg-accent/5'><Pencil size={13} /></button>
                              <button onClick={() => del(it._id)} title='Delete' className='grid place-items-center w-7 h-7 rounded-lg border border-line text-danger hover:bg-danger/5'><Trash2 size={13} /></button>
                            </div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>}
                  </div>
                )
              })}
            </div>}
      </div>

      {editItem && <EditModal token={token} item={editItem} onClose={() => setEditItem(null)} onSaved={() => { setEditItem(null); load() }} />}
      {adjItem && <AdjustModal token={token} item={adjItem} onClose={() => setAdjItem(null)} onSaved={() => { setAdjItem(null); load() }} />}
    </div>
  )
}

const inp = 'w-full px-3 py-2.5 text-sm rounded-xl bg-white border border-line focus:border-accent outline-none'
const field = 'block text-sm font-semibold text-fg mb-1.5'

const Shell = ({ title, subtitle, onClose, children, footer }) => (
  <div className='fixed inset-0 z-50 grid place-items-center p-4'>
    <div className='fixed inset-0 bg-black/40' onClick={onClose} />
    <div className='relative w-full max-w-md glass rounded-2xl p-6 bg-white shadow-2xl'>
      <div className='flex items-center justify-between mb-1'><h3 className='text-lg font-heading font-bold text-fg'>{title}</h3><button onClick={onClose} className='grid place-items-center w-8 h-8 rounded-lg text-muted hover:bg-surface-2'><X size={16} /></button></div>
      {subtitle && <p className='text-xs text-muted mb-4'>{subtitle}</p>}
      {children}
      <div className='flex items-center justify-end gap-2 mt-5'>{footer}</div>
    </div>
  </div>
)

const EditModal = ({ token, item, onClose, onSaved }) => {
  const [f, setF] = useState({ name: item.name || '', size: item.size, color: item.color, stock: item.stock, mrp: item.mrp, lowStockThreshold: item.lowStockThreshold })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const save = async () => {
    setBusy(true)
    try { const { data } = await axios.put(`${backendUrl}/api/inventory/items/${item._id}`, f, { headers: { token } }); if (data.success) { toast.success('Inventory updated'); onSaved() } else toast.error(data.message) }
    catch (err) { toast.error(err.response?.data?.message || err.message) } finally { setBusy(false) }
  }
  return (
    <Shell title='Edit Inventory Item' subtitle={`Code ${item.productCode}`} onClose={onClose}
      footer={<><button onClick={onClose} className='px-5 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg'>Cancel</button><button onClick={save} disabled={busy} className='px-6 py-2.5 text-sm font-semibold rounded-xl bg-accent text-white hover:bg-accent-dark'>{busy ? 'Saving…' : 'Update'}</button></>}>
      <div className='space-y-3'>
        <div><label className={field}>Name</label><input value={f.name} onChange={(e) => set('name', e.target.value)} className={inp} placeholder='Optional' /></div>
        <div className='grid grid-cols-2 gap-3'>
          <div><label className={field}>Size</label><select value={f.size} onChange={(e) => set('size', e.target.value)} className={inp}>{SIZES.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><label className={field}>Colour</label><input value={f.color} onChange={(e) => set('color', e.target.value)} className={inp} /></div>
        </div>
        <div className='grid grid-cols-3 gap-3'>
          <div><label className={field}>Stock</label><input type='number' value={f.stock} onChange={(e) => set('stock', e.target.value)} className={inp} /></div>
          <div><label className={field}>Low Stock</label><input type='number' value={f.lowStockThreshold} onChange={(e) => set('lowStockThreshold', e.target.value)} className={inp} /></div>
          <div><label className={field}>MRP</label><input type='number' value={f.mrp} onChange={(e) => set('mrp', e.target.value)} className={inp} /></div>
        </div>
      </div>
    </Shell>
  )
}

const AdjustModal = ({ token, item, onClose, onSaved }) => {
  const [type, setType] = useState('Increase'); const [qty, setQty] = useState(''); const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false)
  const save = async () => {
    if (!qty) return toast.error('Enter a quantity')
    setBusy(true)
    try { const { data } = await axios.post(`${backendUrl}/api/inventory/items/adjust/${item._id}`, { type, qty, reason }, { headers: { token } }); if (data.success) { toast.success(data.message); onSaved() } else toast.error(data.message) }
    catch (err) { toast.error(err.response?.data?.message || err.message) } finally { setBusy(false) }
  }
  return (
    <Shell title='Adjust Stock' subtitle={`${item.productCode} · ${item.size}/${item.color} · current ${item.stock}`} onClose={onClose}
      footer={<><button onClick={onClose} className='px-5 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg'>Cancel</button><button onClick={save} disabled={busy} className='px-6 py-2.5 text-sm font-semibold rounded-xl bg-accent text-white hover:bg-accent-dark'>{busy ? 'Saving…' : 'Apply'}</button></>}>
      <div className='space-y-3'>
        <div className='grid grid-cols-2 gap-3'>
          <div><label className={field}>Type</label><select value={type} onChange={(e) => setType(e.target.value)} className={inp}><option>Increase</option><option>Decrease</option></select></div>
          <div><label className={field}>Quantity</label><input type='number' value={qty} onChange={(e) => setQty(e.target.value)} className={inp} placeholder='0' /></div>
        </div>
        <div><label className={field}>Reason</label><input value={reason} onChange={(e) => setReason(e.target.value)} className={inp} placeholder='e.g. New stock arrival' /></div>
      </div>
    </Shell>
  )
}

export default InventoryOverview
