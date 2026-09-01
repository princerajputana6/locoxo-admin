import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import { RefreshCw, Plus, Search, Filter, Pencil, Trash2, Eye, X, Image as ImageLucide } from 'lucide-react'

const PLACEHOLDER = 'https://placehold.co/80x80/EEF3F9/94A3B8?text=IMG'
const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

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
  const [modal, setModal] = useState(null)   // { parentId, parentName, kind: 'sub'|'child' }
  const [viewNode, setViewNode] = useState(null)

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

  // A small "+ add level" pill used inside the Sub / Child columns.
  const AddPill = ({ label, onClick }) => (
    <button onClick={onClick} className='inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-dashed border-accent/50 text-accent text-[11px] font-semibold hover:bg-accent/5'>
      <Plus size={12} /> {label}
    </button>
  )

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
          <button onClick={() => navigate('/categories/add')} className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-accent text-white hover:bg-accent-dark'><Plus size={15} /> Add Category</button>
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
                            {imgs.length > 3 && <span className='ml-1 px-1.5 py-1 rounded-lg bg-accent text-white text-[10px] font-bold'>+{imgs.length - 3}</span>}
                          </div>
                        </td>
                        <td className='py-3 px-3'><p className='font-semibold text-fg'>{r.main?.name || '—'}</p><p className='text-[11px] text-muted'>( ID: {r.main?.code || '—'} )</p></td>
                        {/* Sub Category — name (with edit) + a + to add a sub under this main */}
                        <td className='py-3 px-3'>
                          <div className='flex flex-col gap-1.5 items-start'>
                            <div className='flex items-center gap-1.5'>
                              <div><p className='text-fg'>{r.sub?.name || '—'}</p>{r.sub && <p className='text-[11px] text-muted'>( ID: {r.sub.code} )</p>}</div>
                              {r.sub && <button onClick={() => setModal({ kind: 'sub', editNode: r.sub, parentName: r.main.name })} title='Edit sub category' className='grid place-items-center w-6 h-6 rounded-md border border-line text-accent hover:bg-accent/5'><Pencil size={12} /></button>}
                              {r.sub && <button onClick={() => remove(r.sub)} title='Delete sub category' className='grid place-items-center w-6 h-6 rounded-md border border-line text-danger hover:bg-danger/5'><Trash2 size={12} /></button>}
                            </div>
                            <AddPill label='Sub' onClick={() => setModal({ parentId: r.main._id, parentName: r.main.name, kind: 'sub' })} />
                          </div>
                        </td>
                        {/* Child Category — name (with edit) + a + to add a child under this sub */}
                        <td className='py-3 px-3'>
                          <div className='flex flex-col gap-1.5 items-start'>
                            <div className='flex items-center gap-1.5'>
                              <div><p className='text-fg'>{r.child?.name || '—'}</p>{r.child && <p className='text-[11px] text-muted'>( ID: {r.child.code} )</p>}</div>
                              {r.child && <button onClick={() => setModal({ kind: 'child', editNode: r.child, parentName: r.sub?.name })} title='Edit child category' className='grid place-items-center w-6 h-6 rounded-md border border-line text-accent hover:bg-accent/5'><Pencil size={12} /></button>}
                              {r.child && <button onClick={() => remove(r.child)} title='Delete child category' className='grid place-items-center w-6 h-6 rounded-md border border-line text-danger hover:bg-danger/5'><Trash2 size={12} /></button>}
                            </div>
                            {r.sub && <AddPill label='Child' onClick={() => setModal({ parentId: r.sub._id, parentName: r.sub.name, kind: 'child' })} />}
                          </div>
                        </td>
                        <td className='py-3 px-3'>
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${(leaf?.status || 'active') === 'active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                            {(leaf?.status || 'active') === 'active' ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td className='py-3 px-3'>
                          <div className='flex items-center gap-1.5'>
                            <button onClick={() => navigate('/categories/add?edit=' + r.main._id)} title='Edit category' className='grid place-items-center w-8 h-8 rounded-lg border border-line text-muted hover:text-accent hover:border-accent/50'><Pencil size={14} /></button>
                            <button onClick={() => remove(leaf)} title='Delete' className='grid place-items-center w-8 h-8 rounded-lg border border-line text-muted hover:text-danger hover:border-danger/50'><Trash2 size={14} /></button>
                            <button onClick={() => toggleStatus(leaf)} title='Toggle status' className={`relative w-10 h-5 rounded-full transition-colors ${(leaf?.status || 'active') === 'active' ? 'bg-accent' : 'bg-line'}`}>
                              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${(leaf?.status || 'active') === 'active' ? 'left-[22px]' : 'left-0.5'}`} />
                            </button>
                          </div>
                        </td>
                        <td className='py-3 px-3 text-center'>
                          <button onClick={() => setViewNode(r.main)} title='View details' className='grid place-items-center w-8 h-8 rounded-lg border border-line text-muted hover:text-accent hover:border-accent/50 mx-auto'><Eye size={14} /></button>
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
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-semibold ${p === page ? 'bg-accent text-white' : 'border border-line text-muted hover:bg-surface-2'}`}>{p}</button>
            ))}
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className='w-8 h-8 rounded-lg border border-line text-muted disabled:opacity-40 hover:bg-surface-2'>→</button>
          </div>
        </div>
      </div>

      {modal && <AddSubModal token={token} info={modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchTree() }} />}
      {viewNode && <ViewModal node={viewNode} onClose={() => setViewNode(null)} />}
    </div>
  )
}

// Modal to add OR edit a sub- / child-category.
const AddSubModal = ({ token, info, onClose, onSaved }) => {
  const editing = info.editNode
  const kindLabel = info.kind === 'sub' ? 'Sub' : 'Child'
  const [name, setName] = useState(editing?.name || '')
  const [slug, setSlug] = useState(editing?.slug || '')
  const [order, setOrder] = useState(editing?.displayOrder ?? '')
  const [status, setStatus] = useState(editing?.status || 'active')
  const [image, setImage] = useState(null)
  const [busy, setBusy] = useState(false)
  const inp = 'w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-line focus:border-accent outline-none'

  const save = async () => {
    if (!name.trim()) return toast.error('Name is required')
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('name', name)
      fd.append('slug', slug || slugify(name))
      fd.append('displayOrder', order || 0)
      fd.append('status', status)
      if (image) fd.append('image', image)
      let data
      if (editing) {
        ({ data } = await axios.put(`${backendUrl}/api/category/update/${editing._id}`, fd, { headers: { token } }))
      } else {
        fd.append('parentCategory', info.parentId)
        ;({ data } = await axios.post(`${backendUrl}/api/category/add`, fd, { headers: { token } }))
      }
      if (data.success) { toast.success(`${kindLabel} category ${editing ? 'updated' : 'added'}`); onSaved() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || err.message) }
    finally { setBusy(false) }
  }

  return (
    <div className='fixed inset-0 z-50 grid place-items-center p-4'>
      <div className='fixed inset-0 bg-black/40' onClick={onClose} />
      <div className='relative w-full max-w-md glass rounded-2xl p-6 bg-white shadow-2xl'>
        <div className='flex items-center justify-between mb-1'>
          <h3 className='text-lg font-heading font-bold text-fg'>{editing ? 'Edit' : 'Add'} {kindLabel} Category</h3>
          <button onClick={onClose} className='grid place-items-center w-8 h-8 rounded-lg text-muted hover:bg-surface-2'><X size={16} /></button>
        </div>
        <p className='text-xs text-muted mb-4'>{editing ? 'Editing' : 'Under'} <span className='font-semibold text-fg'>{editing ? editing.name : info.parentName}</span></p>

        <div className='space-y-3'>
          <div><label className='block text-sm font-semibold text-fg mb-1.5'>Name <span className='text-danger'>*</span></label><input value={name} onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)) }} className={inp} placeholder='e.g. Oversized' /></div>
          <div><label className='block text-sm font-semibold text-fg mb-1.5'>Slug</label><input value={slug} onChange={(e) => setSlug(e.target.value)} className={inp} placeholder='auto from name' /></div>
          <div className='grid grid-cols-2 gap-3'>
            <div><label className='block text-sm font-semibold text-fg mb-1.5'>Display Order</label><input type='number' value={order} onChange={(e) => setOrder(e.target.value)} className={inp} placeholder='0' /></div>
            <div><label className='block text-sm font-semibold text-fg mb-1.5'>Status</label><select value={status} onChange={(e) => setStatus(e.target.value)} className={inp}><option value='active'>Enabled</option><option value='inactive'>Disabled</option></select></div>
          </div>
          <div>
            <label className='block text-sm font-semibold text-fg mb-1.5'>Image (optional)</label>
            <label className='flex items-center gap-3 h-16 px-3 rounded-xl border-2 border-dashed border-line bg-surface-2 cursor-pointer hover:border-accent/50 overflow-hidden'>
              {image ? <img src={URL.createObjectURL(image)} alt='' className='h-12 w-12 rounded object-cover' /> : <ImageLucide size={20} className='text-faint' />}
              <span className='text-sm text-muted'>{image ? image.name : 'Upload image'}</span>
              <input type='file' accept='image/*' hidden onChange={(e) => setImage(e.target.files?.[0] || null)} />
            </label>
          </div>
        </div>

        <div className='flex items-center justify-end gap-2 mt-5'>
          <button onClick={onClose} className='px-5 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg hover:bg-surface-2'>Cancel</button>
          <button onClick={save} disabled={busy} className='px-6 py-2.5 text-sm font-semibold rounded-xl bg-accent text-white hover:bg-accent-dark'>{busy ? 'Saving…' : editing ? 'Update' : 'Add'}</button>
        </div>
      </div>
    </div>
  )
}

// Read-only detail modal showing a category + its sub/child tree.
const ViewModal = ({ node, onClose }) => (
  <div className='fixed inset-0 z-50 grid place-items-center p-4'>
    <div className='fixed inset-0 bg-black/40' onClick={onClose} />
    <div className='relative w-full max-w-lg glass rounded-2xl p-6 bg-white shadow-2xl max-h-[85vh] overflow-y-auto'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-heading font-bold text-fg'>Category Detail</h3>
        <button onClick={onClose} className='grid place-items-center w-8 h-8 rounded-lg text-muted hover:bg-surface-2'><X size={16} /></button>
      </div>
      <div className='flex items-center gap-3 mb-4'>
        <img src={node.image || node.banner || PLACEHOLDER} alt='' className='w-16 h-16 rounded-xl object-cover border border-line' />
        <div>
          <p className='text-lg font-bold text-fg'>{node.name}</p>
          <p className='text-xs text-muted'>Code: {node.code || '—'} · Slug: {node.slug || '—'}</p>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${(node.status || 'active') === 'active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>{(node.status || 'active') === 'active' ? 'Enabled' : 'Disabled'}</span>
        </div>
      </div>
      <div className='grid grid-cols-2 gap-3 text-sm mb-4'>
        <div className='rounded-lg bg-surface-2 p-3'><p className='text-[11px] text-muted'>Display Order</p><p className='font-semibold text-fg'>{node.displayOrder ?? 0}</p></div>
        <div className='rounded-lg bg-surface-2 p-3'><p className='text-[11px] text-muted'>Sub Categories</p><p className='font-semibold text-fg'>{(node.kids || []).length}</p></div>
      </div>
      <h4 className='text-sm font-bold text-fg mb-2'>Sub &amp; Child Categories</h4>
      {(node.kids || []).length === 0 ? <p className='text-sm text-muted'>None yet.</p> : (
        <div className='space-y-2'>
          {node.kids.map((sub) => (
            <div key={sub._id} className='rounded-xl border border-line p-3'>
              <div className='flex items-center gap-2'><span className='px-2 py-0.5 rounded-md bg-accent/10 text-accent text-[11px] font-bold'>SUB</span><span className='font-semibold text-fg'>{sub.name}</span><span className='text-[11px] text-muted'>( {sub.code} )</span></div>
              {(sub.kids || []).length > 0 && (
                <div className='mt-2 ml-4 pl-3 border-l border-line space-y-1'>
                  {sub.kids.map((ch) => (
                    <div key={ch._id} className='flex items-center gap-2 text-sm'><span className='px-2 py-0.5 rounded-md bg-violet/10 text-violet text-[10px] font-bold'>CHILD</span><span className='text-fg'>{ch.name}</span><span className='text-[11px] text-muted'>( {ch.code} )</span></div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)

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
