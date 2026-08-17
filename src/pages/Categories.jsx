import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import { RefreshCw, Plus, Search, Filter, Pencil, Trash2, Eye, Tag } from 'lucide-react'

const PLACEHOLDER = 'https://placehold.co/80x80/EEF3F9/94A3B8?text=IMG'

// Category Management list — one row per Category → Sub → Child path (image 2).
const Categories = ({ token }) => {
  const navigate = useNavigate()
  const [tree, setTree] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [fCat, setFCat] = useState('All')
  const [fSub, setFSub] = useState('All')
  const [fChild, setFChild] = useState('All')
  const [fStatus, setFStatus] = useState('All')
  const [page, setPage] = useState(1)
  const perPage = 8

  const fetchTree = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(backendUrl + '/api/category/tree', { headers: { token } })
      if (data.success) setTree(data.tree)
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load categories') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchTree() }, [])

  // Flatten into path rows: main → sub → child (leaf). Missing levels shown as —.
  const rows = useMemo(() => {
    const out = []
    tree.forEach((main) => {
      const subs = main.kids || []
      if (subs.length === 0) { out.push({ main, sub: null, child: null }); return }
      subs.forEach((sub) => {
        const children = sub.kids || []
        if (children.length === 0) out.push({ main, sub, child: null })
        else children.forEach((child) => out.push({ main, sub, child }))
      })
    })
    return out
  }, [tree])

  const opts = useMemo(() => {
    const cats = new Set(), subs = new Set(), children = new Set()
    rows.forEach((r) => { if (r.main) cats.add(r.main.name); if (r.sub) subs.add(r.sub.name); if (r.child) children.add(r.child.name) })
    return { cats: [...cats], subs: [...subs], children: [...children] }
  }, [rows])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (fCat !== 'All' && r.main?.name !== fCat) return false
      if (fSub !== 'All' && r.sub?.name !== fSub) return false
      if (fChild !== 'All' && r.child?.name !== fChild) return false
      const leaf = r.child || r.sub || r.main
      if (fStatus !== 'All' && (leaf?.status || 'active') !== fStatus) return false
      if (s && !`${r.main?.name} ${r.sub?.name || ''} ${r.child?.name || ''}`.toLowerCase().includes(s)) return false
      return true
    })
  }, [rows, q, fCat, fSub, fChild, fStatus])

  const pageRows = filtered.slice((page - 1) * perPage, page * perPage)
  const pages = Math.max(1, Math.ceil(filtered.length / perPage))

  const toggleStatus = async (node) => {
    try {
      await axios.put(`${backendUrl}/api/category/flag/${node._id}`, { field: 'status', value: node.status === 'active' ? 'inactive' : 'active' }, { headers: { token } })
      fetchTree()
    } catch { toast.error('Failed') }
  }
  const remove = async (node) => {
    if (!window.confirm(`Delete "${node.name}"?`)) return
    try { await axios.delete(`${backendUrl}/api/category/remove/${node._id}`, { headers: { token } }); toast.success('Deleted'); fetchTree() }
    catch { toast.error('Delete failed') }
  }

  const imagesFor = (r) => [r.child?.image, r.sub?.image, r.main?.image, r.main?.banner].filter(Boolean)
  const sel = 'px-3 py-2 text-sm rounded-lg bg-white border border-line text-fg focus:border-accent outline-none'

  return (
    <div className='p-6'>
      {/* Header */}
      <div className='flex items-start justify-between mb-5'>
        <div>
          <h1 className='text-2xl font-heading font-extrabold text-fg'>Category Management</h1>
          <p className='text-xs text-muted mt-1'>Dashboard <span className='text-faint'>›</span> Categories</p>
        </div>
        <div className='flex items-center gap-2'>
          <button onClick={fetchTree} className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg hover:bg-surface-2'><RefreshCw size={15} /> Refresh</button>
          <button onClick={() => navigate('/categories/add')} className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-fg text-white hover:bg-fg/90'><Plus size={15} /> Add Category</button>
        </div>
      </div>

      <div className='glass rounded-2xl p-4'>
        {/* Filters */}
        <div className='flex flex-wrap items-center gap-3 mb-4'>
          <div className='relative flex-1 min-w-[220px] max-w-sm'>
            <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-faint' />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder='Search category...' className='w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-line' />
          </div>
          <Select label='Category' value={fCat} onChange={setFCat} options={opts.cats} />
          <Select label='Sub Category' value={fSub} onChange={setFSub} options={opts.subs} />
          <Select label='Child Category' value={fChild} onChange={setFChild} options={opts.children} />
          <Select label='Status' value={fStatus} onChange={setFStatus} options={['active', 'inactive']} labels={{ active: 'Enabled', inactive: 'Disabled' }} />
          <button className='inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-white border border-line text-fg hover:bg-surface-2 ml-auto self-end'><Filter size={15} /> Filter</button>
        </div>

        {/* Table */}
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-left text-[11px] font-semibold uppercase tracking-wider text-muted border-b border-line'>
                <th className='py-3 px-3'>S No.</th>
                <th className='py-3 px-3'>Image</th>
                <th className='py-3 px-3'>Category Name</th>
                <th className='py-3 px-3'>Sub Category Name</th>
                <th className='py-3 px-3'>Child Category Name</th>
                <th className='py-3 px-3'>Status</th>
                <th className='py-3 px-3'>Actions</th>
                <th className='py-3 px-3 text-center'>View Detail</th>
              </tr>
            </thead>
            <tbody>
              {loading ? [0, 1, 2, 3].map((i) => <tr key={i}><td colSpan={8} className='py-2'><div className='skeleton h-12 rounded-lg' /></td></tr>) :
                pageRows.length === 0 ? <tr><td colSpan={8} className='py-10 text-center text-muted'>No categories found.</td></tr> :
                  pageRows.map((r, i) => {
                    const imgs = imagesFor(r); const leaf = r.child || r.sub || r.main
                    return (
                      <tr key={i} className='border-b border-line/70 hover:bg-surface-2/50'>
                        <td className='py-3 px-3 text-muted'>{(page - 1) * perPage + i + 1}</td>
                        <td className='py-3 px-3'>
                          <div className='flex items-center gap-1'>
                            {(imgs.length ? imgs : [PLACEHOLDER]).slice(0, 3).map((src, k) => <img key={k} src={src} alt='' className='w-9 h-9 rounded-lg object-cover border border-line' />)}
                            {imgs.length > 3 && <span className='ml-1 px-1.5 py-1 rounded-lg bg-fg text-white text-[10px] font-bold'>+{imgs.length - 3}</span>}
                          </div>
                        </td>
                        <td className='py-3 px-3'><p className='font-semibold text-fg'>{r.main?.name || '—'}</p><p className='text-[11px] text-muted'>( ID: {r.main?.code || '—'} )</p></td>
                        <td className='py-3 px-3'><p className='text-fg'>{r.sub?.name || '—'}</p>{r.sub && <p className='text-[11px] text-muted'>( ID: {r.sub.code} )</p>}</td>
                        <td className='py-3 px-3'><p className='text-fg'>{r.child?.name || '—'}</p>{r.child && <p className='text-[11px] text-muted'>( ID: {r.child.code} )</p>}</td>
                        <td className='py-3 px-3'>
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${(leaf?.status || 'active') === 'active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                            {(leaf?.status || 'active') === 'active' ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td className='py-3 px-3'>
                          <div className='flex items-center gap-1.5'>
                            <button onClick={() => navigate('/categories/add?edit=' + r.main._id)} className='grid place-items-center w-8 h-8 rounded-lg border border-line text-muted hover:text-accent hover:border-accent/50'><Pencil size={14} /></button>
                            <button onClick={() => remove(leaf)} className='grid place-items-center w-8 h-8 rounded-lg border border-line text-muted hover:text-danger hover:border-danger/50'><Trash2 size={14} /></button>
                            <button onClick={() => toggleStatus(leaf)} title='Toggle status' className={`relative w-10 h-5 rounded-full transition-colors ${(leaf?.status || 'active') === 'active' ? 'bg-fg' : 'bg-line'}`}>
                              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${(leaf?.status || 'active') === 'active' ? 'left-[22px]' : 'left-0.5'}`} />
                            </button>
                          </div>
                        </td>
                        <td className='py-3 px-3 text-center'>
                          <button className='grid place-items-center w-8 h-8 rounded-lg border border-line text-muted hover:text-accent hover:border-accent/50 mx-auto'><Eye size={14} /></button>
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className='flex items-center justify-between mt-4 text-sm'>
          <span className='text-muted'>Showing {filtered.length === 0 ? 0 : (page - 1) * perPage + 1} to {Math.min(page * perPage, filtered.length)} of {filtered.length} entries</span>
          <div className='flex items-center gap-1'>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className='w-8 h-8 rounded-lg border border-line text-muted disabled:opacity-40 hover:bg-surface-2'>←</button>
            {Array.from({ length: pages }, (_, i) => i + 1).slice(0, 4).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-semibold ${p === page ? 'bg-fg text-white' : 'border border-line text-muted hover:bg-surface-2'}`}>{p}</button>
            ))}
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className='w-8 h-8 rounded-lg border border-line text-muted disabled:opacity-40 hover:bg-surface-2'>→</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const Select = ({ label, value, onChange, options, labels }) => (
  <div>
    <label className='block text-[11px] font-semibold text-muted mb-1'>{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} className='px-3 py-2 text-sm rounded-lg bg-white border border-line text-fg focus:border-accent outline-none min-w-[130px]'>
      <option value='All'>All</option>
      {options.map((o) => <option key={o} value={o}>{labels?.[o] || o}</option>)}
    </select>
  </div>
)

export default Categories
