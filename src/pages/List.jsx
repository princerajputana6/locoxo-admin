import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import {
  Package, Search, PackagePlus, RefreshCw, FileSpreadsheet, CalendarDays,
  Eye, Heart, ShoppingBag, Copy, Pencil, Trash2, Layers,
} from 'lucide-react'
import {
  PageHeader, Btn, StatCard, FilterTabs, EmptyState, StatusPill, Modal, ExcelImportModal,
} from '../components/ui'
import ProductForm from '../components/ProductForm'

const STATUS_TABS = ['all', 'active', 'draft', 'hidden', 'coming_soon', 'inactive']
const STATUS_LABEL = { active: 'Active', draft: 'Draft', hidden: 'Hidden', coming_soon: 'Coming soon', inactive: 'Inactive', out_of_stock: 'Out of stock' }

const List = ({ token }) => {
  const [rows, setRows] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')

  const [showImport, setShowImport] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [report, setReport] = useState([])
  const [editId, setEditId] = useState(null)
  const [editInitial, setEditInitial] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(backendUrl + '/api/product/dashboard', { headers: { token } })
      if (data.success) { setRows(data.rows); setCounts(data.counts) }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load products') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchDashboard() }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false
      if (q && !(`${r.name} ${r.productCode || ''} ${r.category || ''}`.toLowerCase().includes(q))) return false
      return true
    })
  }, [rows, query, filter])

  const openEdit = async (id) => {
    try {
      const { data } = await axios.post(backendUrl + '/api/product/single', { productId: id })
      if (data.success) { setEditInitial(data.product); setEditId(id) }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load product') }
  }

  const duplicate = async (id) => {
    try {
      const { data } = await axios.post(backendUrl + `/api/product/duplicate/${id}`, {}, { headers: { token } })
      if (data.success) { toast.success(`Duplicated → ${data.productCode} (Draft)`); fetchDashboard() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Duplicate failed') }
  }

  const changeStatus = async (id, status) => {
    try {
      const { data } = await axios.put(backendUrl + `/api/product/status/${id}`, { status }, { headers: { token } })
      if (data.success) { toast.success(data.message); fetchDashboard() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this product permanently?')) return
    try {
      const { data } = await axios.post(backendUrl + '/api/product/remove', { id }, { headers: { token } })
      if (data.success) { toast.success('Product removed'); fetchDashboard() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed') }
  }

  const loadReport = async () => {
    setShowReport(true)
    try {
      const { data } = await axios.get(backendUrl + '/api/product/report/daily', { headers: { token } })
      if (data.success) setReport(data.rows)
    } catch { toast.error('Failed to load report') }
  }

  return (
    <div className='p-6'>
      <PageHeader
        icon={Package}
        title='Product Management'
        subtitle='Add, edit, duplicate, hide & track products'
        actions={
          <div className='flex flex-wrap items-center gap-2'>
            <Btn variant='secondary' size='sm' icon={CalendarDays} onClick={loadReport}>Daily report</Btn>
            <Btn variant='secondary' size='sm' icon={FileSpreadsheet} onClick={() => setShowImport(true)}>Import Excel</Btn>
            <Btn variant='secondary' size='sm' icon={RefreshCw} onClick={fetchDashboard}>Refresh</Btn>
            <Btn variant='primary' size='sm' icon={PackagePlus} onClick={() => setShowAdd(true)}>Add Product</Btn>
          </div>
        }
      />

      {/* Status tiles */}
      <div className='grid grid-cols-2 md:grid-cols-5 gap-3 mb-6'>
        <StatCard icon={Layers} label='Total' value={rows.length} delay={0} onClick={() => setFilter('all')} />
        <StatCard icon={Package} label='Active' value={counts.active || 0} tone='brand' delay={60} onClick={() => setFilter('active')} />
        <StatCard icon={Pencil} label='Draft' value={counts.draft || 0} tone='amber' delay={120} onClick={() => setFilter('draft')} />
        <StatCard icon={Eye} label='Hidden' value={counts.hidden || 0} tone='danger' delay={180} onClick={() => setFilter('hidden')} />
        <StatCard icon={ShoppingBag} label='Coming soon' value={counts.coming_soon || 0} tone='accent' delay={240} onClick={() => setFilter('coming_soon')} />
      </div>

      {/* Controls */}
      <div className='glass rounded-2xl p-3 mb-4 flex flex-wrap items-center gap-3'>
        <FilterTabs options={STATUS_TABS} value={filter} onChange={setFilter} />
        <div className='relative ml-auto min-w-[240px]'>
          <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none' />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder='Search name / code / category…'
            className='w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-surface-2 border border-line text-fg placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none' />
        </div>
      </div>

      {/* Table */}
      <div className='glass rounded-2xl overflow-hidden'>
        <div className='hidden md:grid grid-cols-[2.4fr_1fr_1.1fr_1.4fr_1.6fr] items-center px-4 py-2.5 border-b border-line/70 bg-surface/40 text-[10px] font-semibold uppercase tracking-widest text-faint'>
          <span>Product</span><span>Status</span><span>Pricing</span><span>Engagement</span><span className='text-right'>Actions</span>
        </div>

        {loading ? (
          <div className='p-6 space-y-3'>{[0, 1, 2, 3].map((i) => <div key={i} className='skeleton rounded-xl h-16' />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Package} title='No products match' message='Adjust filters or add a product.' />
        ) : filtered.map((r) => (
          <div key={r._id} className='grid grid-cols-1 md:grid-cols-[2.4fr_1fr_1.1fr_1.4fr_1.6fr] items-center gap-3 px-4 py-3 border-b border-line/60 last:border-0 hover:bg-surface-2/40 transition-colors'>
            <div className='flex items-center gap-3 min-w-0'>
              <img src={r.image} alt='' className='w-11 h-11 object-cover rounded-lg bg-surface-2 shrink-0' />
              <div className='min-w-0'>
                <p className='font-semibold text-sm text-fg truncate'>{r.name}</p>
                <p className='text-xs text-muted truncate'>
                  {r.productCode && <span className='font-mono text-accent/80'>{r.productCode}</span>} · {r.audience || r.category} · {r.variants} var · stock {r.totalStock}
                </p>
              </div>
            </div>
            <div><StatusPill status={STATUS_LABEL[r.status] || r.status} /></div>
            <div className='text-sm'>
              <p className='font-semibold text-fg'>{currency}{r.discountPrice || r.price}</p>
              {r.discountPrice ? <p className='text-xs text-muted'><span className='line-through'>{currency}{r.price}</span> <span className='text-accent'>−{r.discountPercent}%</span></p> : <p className='text-xs text-faint'>MRP</p>}
            </div>
            <div className='flex items-center gap-3 text-xs text-muted'>
              <span className='inline-flex items-center gap-1' title='Views'><Eye size={13} />{r.viewCount}</span>
              <span className='inline-flex items-center gap-1' title='Wishlist'><Heart size={13} />{r.wishlistCount}</span>
              <span className='inline-flex items-center gap-1' title='Purchases'><ShoppingBag size={13} />{r.purchaseCount}</span>
            </div>
            <div className='flex items-center justify-end gap-1.5 flex-wrap'>
              <select value={r.status} onChange={(e) => changeStatus(r._id, e.target.value)} title='Change status'
                className='text-[10px] uppercase tracking-widest font-semibold bg-surface-2 border border-line rounded-lg px-2 py-1.5 text-muted focus:border-accent outline-none'>
                {['active', 'draft', 'hidden', 'coming_soon', 'inactive'].map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
              <button onClick={() => openEdit(r._id)} title='Edit' className='grid place-items-center w-8 h-8 rounded-lg text-muted hover:text-accent hover:bg-accent/10'><Pencil size={14} /></button>
              <button onClick={() => duplicate(r._id)} title='Duplicate' className='grid place-items-center w-8 h-8 rounded-lg text-muted hover:text-accent hover:bg-accent/10'><Copy size={14} /></button>
              <button onClick={() => remove(r._id)} title='Delete' className='grid place-items-center w-8 h-8 rounded-lg text-muted hover:text-danger hover:bg-danger/10'><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} icon={PackagePlus} title='Add Product' subtitle='Code, SKU & barcode auto-generated' size='xl'>
        <ProductForm token={token} onCancel={() => setShowAdd(false)} onDone={() => { setShowAdd(false); fetchDashboard() }} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editId} onClose={() => { setEditId(null); setEditInitial(null) }} icon={Pencil}
        title={editInitial ? `Edit · ${editInitial.name}` : 'Edit product'} subtitle={editInitial?.productCode} size='xl'>
        {editInitial && <ProductForm token={token} initial={editInitial} onCancel={() => { setEditId(null); setEditInitial(null) }}
          onDone={() => { setEditId(null); setEditInitial(null); fetchDashboard() }} />}
      </Modal>

      {/* Daily report */}
      <Modal open={showReport} onClose={() => setShowReport(false)} icon={CalendarDays} title='Products added — daily' subtitle='Last 60 days' size='md'>
        {report.length === 0 ? <p className='text-sm text-faint'>No data.</p> : (
          <div className='space-y-1.5 max-h-[60vh] overflow-y-auto'>
            {report.map((d) => (
              <div key={d._id} className='flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-2 border border-line text-sm'>
                <span className='font-mono text-xs text-muted w-24'>{d._id}</span>
                <span className='font-semibold text-accent'>{d.count}</span>
                <span className='text-xs text-faint truncate flex-1'>{d.products.map(p => p.productCode || p.name).slice(0, 6).join(', ')}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ExcelImportModal open={showImport} onClose={() => setShowImport(false)} token={token} onDone={fetchDashboard} />
    </div>
  )
}

export default List
