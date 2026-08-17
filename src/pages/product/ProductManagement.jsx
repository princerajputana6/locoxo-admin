import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { backendUrl } from '../../App'
import { toast } from 'react-toastify'
import {
  Shirt, CheckCircle2, PackageX, AlertTriangle, CalendarPlus, FileText,
  Plus, FileSpreadsheet, RefreshCw, Search, Copy, Pencil, MoreVertical, Info,
} from 'lucide-react'

const STATUS_OPTS = [
  { v: 'active', l: 'Active', c: 'text-success' }, { v: 'inactive', l: 'Inactive', c: 'text-danger' },
  { v: 'coming_soon', l: 'Coming Soon', c: 'text-violet' }, { v: 'not_available', l: 'Not Available', c: 'text-amber' },
  { v: 'hidden', l: 'Hidden', c: 'text-muted' }, { v: 'draft', l: 'Draft', c: 'text-accent' },
  { v: 'notify_me', l: 'Notify Me', c: 'text-violet' },
]
const statusLabel = (v) => STATUS_OPTS.find((s) => s.v === v)?.l || v

const Stat = ({ icon: Icon, label, value, sub, tone }) => {
  const tones = { blue: 'bg-accent/10 text-accent', green: 'bg-success/10 text-success', amber: 'bg-amber/10 text-amber', red: 'bg-danger/10 text-danger', violet: 'bg-violet/10 text-violet' }
  return (
    <div className='glass rounded-2xl p-4'>
      <div className='flex items-start justify-between'>
        <div><p className='text-xs font-medium text-muted'>{label}</p><p className='text-2xl font-heading font-extrabold text-fg mt-1'>{value}</p></div>
        <span className={`grid place-items-center w-10 h-10 rounded-xl ${tones[tone]}`}><Icon size={18} /></span>
      </div>
      {sub && <p className='text-[11px] text-muted mt-1'>{sub}</p>}
    </div>
  )
}

const ProductManagement = ({ token }) => {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState(''); const [fCat, setFCat] = useState('All'); const [fStatus, setFStatus] = useState('All')

  const load = async () => {
    setLoading(true)
    try { const { data } = await axios.get(backendUrl + '/api/product/dashboard', { headers: { token } }); if (data.success) setRows(data.rows); else toast.error(data.message) }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to load products') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const stats = useMemo(() => {
    const now = Date.now(), month = 30 * 864e5
    return {
      total: rows.length,
      active: rows.filter((r) => r.status === 'active').length,
      out: rows.filter((r) => r.totalStock <= 0).length,
      low: rows.filter((r) => r.totalStock > 0 && r.totalStock <= 5).length,
      recent: rows.filter((r) => now - (r.date || 0) < month).length,
    }
  }, [rows])

  const cats = useMemo(() => [...new Set(rows.map((r) => r.category).filter(Boolean))], [rows])
  const filtered = useMemo(() => rows.filter((r) => {
    if (fCat !== 'All' && r.category !== fCat) return false
    if (fStatus !== 'All' && r.status !== fStatus) return false
    if (q && !`${r.name} ${r.productCode || ''} ${r.category || ''}`.toLowerCase().includes(q.toLowerCase())) return false
    return true
  }), [rows, q, fCat, fStatus])

  const changeStatus = async (id, status) => {
    try { const { data } = await axios.put(`${backendUrl}/api/product/status/${id}`, { status }, { headers: { token } }); if (data.success) { toast.success(data.message); load() } } catch { toast.error('Failed') }
  }
  const slug = (n) => '/product/' + String(n || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const sel = 'px-3 py-2 text-sm rounded-lg bg-white border border-line text-fg focus:border-accent outline-none'

  return (
    <div className='p-6'>
      <div className='flex items-start justify-between mb-5 flex-wrap gap-3'>
        <div>
          <h1 className='text-2xl font-heading font-extrabold text-fg'>Product Management</h1>
          <p className='text-xs text-muted mt-1'>Dashboard <span className='text-faint'>›</span> Products <span className='text-faint'>›</span> All Products</p>
        </div>
        <div className='flex items-center gap-2'>
          <button onClick={() => navigate('/products/details')} className='inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><FileText size={15} /> Product Details</button>
          <button onClick={() => navigate('/products/add')} className='inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-accent text-white hover:bg-accent-dark'><Plus size={15} /> Add / Edit Product</button>
          <button className='inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><FileSpreadsheet size={15} className='text-success' /> Export Excel</button>
          <button onClick={load} className='inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><RefreshCw size={15} /> Refresh</button>
        </div>
      </div>

      <div className='grid grid-cols-2 md:grid-cols-5 gap-3 mb-5'>
        <Stat icon={Shirt} label='Total Products' value={stats.total} sub='View all products →' tone='blue' />
        <Stat icon={CheckCircle2} label='Active Products' value={stats.active} sub={stats.total ? `${Math.round(stats.active / stats.total * 100)}% of total` : ''} tone='green' />
        <Stat icon={PackageX} label='Out of Stock' value={stats.out} tone='red' />
        <Stat icon={AlertTriangle} label='Low Stock' value={stats.low} tone='amber' />
        <Stat icon={CalendarPlus} label='Recently Added' value={stats.recent} sub='Last 30 days' tone='violet' />
      </div>

      <div className='glass rounded-2xl p-5'>
        <div className='flex flex-wrap items-center gap-3 mb-4'>
          <div className='relative flex-1 min-w-[220px] max-w-sm'>
            <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-faint' />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder='Search by product name, SKU, code…' className='w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-line' />
          </div>
          <select value={fCat} onChange={(e) => setFCat(e.target.value)} className={sel}><option value='All'>All Categories</option>{cats.map((c) => <option key={c}>{c}</option>)}</select>
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={sel}><option value='All'>All Status</option>{STATUS_OPTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}</select>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-left text-[11px] font-semibold uppercase tracking-wider text-muted border-b border-line'>
                <th className='py-3 px-2'><input type='checkbox' className='accent-accent' /></th><th className='py-3 px-2'>#</th><th className='py-3 px-2'>Image</th><th className='py-3 px-2'>Product Name</th><th className='py-3 px-2'>SKU</th><th className='py-3 px-2'>Category</th><th className='py-3 px-2'>Status</th><th className='py-3 px-2'>Added Date</th><th className='py-3 px-2'>Product Link</th><th className='py-3 px-2'>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? [0, 1, 2].map((i) => <tr key={i}><td colSpan={10} className='py-2'><div className='skeleton h-12 rounded-lg' /></td></tr>) :
                filtered.length === 0 ? <tr><td colSpan={10} className='py-10 text-center text-muted'>No products found.</td></tr> :
                  filtered.map((r, i) => (
                    <tr key={r._id} className='border-b border-line/70 hover:bg-surface-2/50'>
                      <td className='py-3 px-2'><input type='checkbox' className='accent-accent' /></td>
                      <td className='py-3 px-2 text-muted'>{i + 1}</td>
                      <td className='py-3 px-2'><img src={r.image} alt='' className='w-10 h-10 rounded-lg object-cover border border-line' /></td>
                      <td className='py-3 px-2'><p className='font-semibold text-fg'>{r.name}</p><p className='text-[11px] text-muted'>{r.audience || r.category}</p></td>
                      <td className='py-3 px-2 font-mono text-xs text-muted'>{r.productCode || '—'}</td>
                      <td className='py-3 px-2 text-fg'>{r.category}</td>
                      <td className='py-3 px-2'>
                        <select value={STATUS_OPTS.some((s) => s.v === r.status) ? r.status : ''} onChange={(e) => changeStatus(r._id, e.target.value)} className='px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-line focus:border-accent outline-none'>
                          {!STATUS_OPTS.some((s) => s.v === r.status) && <option value='' disabled>{statusLabel(r.status)}</option>}
                          {STATUS_OPTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
                        </select>
                      </td>
                      <td className='py-3 px-2 text-muted text-xs'>{r.date ? new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                      <td className='py-3 px-2'><span className='text-accent text-xs'>{slug(r.name)}</span></td>
                      <td className='py-3 px-2'><div className='flex items-center gap-1'>
                        <button onClick={() => { navigator.clipboard?.writeText(window.location.origin + slug(r.name)); toast.success('Link copied') }} className='grid place-items-center w-8 h-8 rounded-lg border border-line text-muted hover:text-accent'><Copy size={14} /></button>
                        <button onClick={() => navigate('/products/add?edit=' + r._id)} className='grid place-items-center w-8 h-8 rounded-lg border border-line text-accent'><Pencil size={14} /></button>
                        <button className='grid place-items-center w-8 h-8 rounded-lg border border-line text-muted'><MoreVertical size={14} /></button>
                      </div></td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        <div className='mt-4 px-4 py-2.5 rounded-lg bg-accent/5 border border-accent/20 text-xs text-muted flex items-center gap-2'>
          <Info size={14} className='text-accent' /> Products with “Coming Soon”, “Notify Me”, “Hidden” or “Draft” status will not be visible on the website.
        </div>
      </div>
    </div>
  )
}

export default ProductManagement
