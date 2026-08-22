import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { backendUrl } from '../../App'
import { toast } from 'react-toastify'
import { ArrowLeft, Plus, RefreshCw, FileSpreadsheet, Search, Pencil, Trash2 } from 'lucide-react'

const inp = 'w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-line focus:border-accent outline-none'
const lbl = 'flex items-center gap-2 text-sm font-bold text-fg mb-2'
const req = <span className='text-danger'>*</span>

const CreateProductCode = ({ token }) => {
  const navigate = useNavigate()
  const [nextCode, setNextCode] = useState('')
  const [suggested, setSuggested] = useState('') // the auto next-code; used to detect a manual override
  const [tree, setTree] = useState([])
  const [cat, setCat] = useState(''); const [sub, setSub] = useState(''); const [child, setChild] = useState('')
  const [fabric, setFabric] = useState('')
  const [desc, setDesc] = useState('')
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)

  const loadNext = () => axios.get(backendUrl + '/api/inventory/next-code', { headers: { token } }).then(({ data }) => { if (data.success) { setNextCode(data.productCode); setSuggested(data.productCode) } }).catch(() => {})
  const loadRows = () => axios.get(backendUrl + '/api/inventory/product-code', { headers: { token } }).then(({ data }) => data.success && setRows(data.rows)).catch(() => {})
  const loadTree = () => axios.get(backendUrl + '/api/category/tree', { headers: { token } }).then(({ data }) => data.success && setTree(data.tree)).catch(() => {})
  useEffect(() => { loadNext(); loadRows(); loadTree() }, [])

  // Cascading options from the real category tree.
  const catNode = useMemo(() => tree.find((c) => c._id === cat), [tree, cat])
  const subs = catNode?.kids || []
  const subNode = useMemo(() => subs.find((s) => s._id === sub), [subs, sub])
  const children = subNode?.kids || []

  const submit = async () => {
    if (!cat) return toast.error('Select a category')
    setBusy(true)
    try {
      const payload = {
        // Blank or unchanged → let the server auto-assign & advance the sequence;
        // otherwise use the admin's own code (server rejects duplicates).
        code: (!nextCode.trim() || nextCode.trim() === suggested) ? 'Automatic' : nextCode.trim(), fabric, shortDescription: desc,
        category: catNode?.name, subCategory: subNode?.name, childCategory: children.find((c) => c._id === child)?.name,
        categoryId: cat || undefined, subCategoryId: sub || undefined, childCategoryId: child || undefined,
      }
      const { data } = await axios.post(backendUrl + '/api/inventory/product-code', payload, { headers: { token } })
      if (data.success) { toast.success(`Created ${data.productCode.code}`); setCat(''); setSub(''); setChild(''); setFabric(''); setDesc(''); loadNext(); loadRows() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || err.message) }
    finally { setBusy(false) }
  }
  const remove = async (id) => { if (!window.confirm('Delete this product code?')) return; try { await axios.delete(`${backendUrl}/api/inventory/product-code/${id}`, { headers: { token } }); loadRows() } catch { toast.error('Failed') } }
  const filtered = rows.filter((r) => !q || `${r.code} ${r.category} ${r.subCategory || ''} ${r.fabric} ${r.shortDescription}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className='p-6'>
      <div className='flex items-start justify-between mb-5'>
        <div>
          <h1 className='text-2xl font-heading font-extrabold text-fg'>Create Product Code</h1>
          <p className='text-xs text-muted mt-1'>Dashboard <span className='text-faint'>›</span> Inventory <span className='text-faint'>›</span> Products <span className='text-faint'>›</span> Create Product Code</p>
        </div>
        <button onClick={() => navigate('/inventory')} className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg hover:bg-surface-2'><ArrowLeft size={15} /> Back to Inventory</button>
      </div>

      {/* Form card */}
      <div className='glass rounded-2xl p-6 mb-5'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5'>
          <div>
            <label className={lbl}>Product Code {req}</label>
            <input value={nextCode} onChange={(e) => setNextCode(e.target.value)} className={inp + ' font-mono font-bold'} placeholder='Automatic Code' />
            <p className='text-[11px] text-muted mt-1'>Auto-filled with the next code — edit it to set your own sequence.</p>
          </div>
          <div>
            <label className={lbl}>Category {req}</label>
            <select value={cat} onChange={(e) => { setCat(e.target.value); setSub(''); setChild('') }} className={inp}>
              <option value=''>Select category</option>
              {tree.map((c) => <option key={c._id} value={c._id}>{c.name}{c.code ? ` (${c.code})` : ''}</option>)}
            </select>
            {/* Sub category — only when the chosen category has sub-categories */}
            {subs.length > 0 && (
              <div className='mt-3'>
                <label className='block text-xs font-semibold text-fg mb-1'>Sub Category</label>
                <select value={sub} onChange={(e) => { setSub(e.target.value); setChild('') }} className={inp}>
                  <option value=''>Select sub category</option>
                  {subs.map((s) => <option key={s._id} value={s._id}>{s.name}{s.code ? ` (${s.code})` : ''}</option>)}
                </select>
              </div>
            )}
            {/* Child category — only when the chosen sub-category has children */}
            {children.length > 0 && (
              <div className='mt-3'>
                <label className='block text-xs font-semibold text-fg mb-1'>Child Category</label>
                <select value={child} onChange={(e) => setChild(e.target.value)} className={inp}>
                  <option value=''>Select child category</option>
                  {children.map((c) => <option key={c._id} value={c._id}>{c.name}{c.code ? ` (${c.code})` : ''}</option>)}
                </select>
              </div>
            )}
          </div>
          <div>
            <label className={lbl}>Fabric {req}</label>
            <input value={fabric} onChange={(e) => setFabric(e.target.value)} className={inp} placeholder='e.g. 100% Cotton' />
          </div>
          <div>
            <label className={lbl}>Short Description {req}</label>
            <div className='relative'>
              <textarea value={desc} maxLength={200} onChange={(e) => setDesc(e.target.value)} className={inp + ' h-[70px] resize-none'} placeholder='Short description' />
              <span className='absolute bottom-2 right-3 text-[11px] text-faint'>{desc.length}/200</span>
            </div>
          </div>
        </div>
        <div className='flex items-center justify-end gap-2 mt-5'>
          <button onClick={() => { setCat(''); setSub(''); setChild(''); setFabric(''); setDesc('') }} className='px-6 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg hover:bg-surface-2'>Cancel</button>
          <button onClick={submit} disabled={busy} className='px-8 py-2.5 text-sm font-semibold rounded-xl bg-accent text-white hover:bg-accent-dark'>{busy ? 'Saving…' : 'Submit'}</button>
        </div>
      </div>

      {/* Table card */}
      <div className='glass rounded-2xl p-5'>
        <div className='flex items-center justify-between gap-3 mb-4'>
          <div className='relative flex-1 max-w-sm'>
            <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-faint' />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder='Search by Product Code, Category…' className='w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-line' />
          </div>
          <div className='flex items-center gap-2'>
            <button className='inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg bg-white border border-line text-fg hover:bg-surface-2'><FileSpreadsheet size={15} className='text-success' /> Export Excel</button>
            <button onClick={loadRows} className='inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg bg-white border border-line text-fg hover:bg-surface-2'><RefreshCw size={15} /> Refresh</button>
          </div>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-left text-[11px] font-semibold uppercase tracking-wider text-muted border-b border-line'>
                <th className='py-3 px-3'>S. No.</th><th className='py-3 px-3'>Product Code</th><th className='py-3 px-3'>Category</th><th className='py-3 px-3'>Fabric</th><th className='py-3 px-3'>Description</th><th className='py-3 px-3'>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={6} className='py-10 text-center text-muted'>No product codes yet.</td></tr> :
                filtered.map((r, i) => (
                  <tr key={r._id} className='border-b border-line/70 hover:bg-surface-2/50'>
                    <td className='py-3 px-3 text-muted'>{i + 1}</td>
                    <td className='py-3 px-3 font-mono font-semibold text-fg'>{r.code}</td>
                    <td className='py-3 px-3 text-fg'>{[r.category, r.subCategory, r.childCategory].filter(Boolean).join(' › ') || '—'}</td>
                    <td className='py-3 px-3 text-fg'>{r.fabric || '—'}</td>
                    <td className='py-3 px-3 text-muted'>{r.shortDescription || '—'}</td>
                    <td className='py-3 px-3'><div className='flex items-center gap-1.5'>
                      <button className='grid place-items-center w-8 h-8 rounded-lg border border-line text-accent hover:bg-accent/5'><Pencil size={14} /></button>
                      <button onClick={() => remove(r._id)} className='grid place-items-center w-8 h-8 rounded-lg border border-line text-danger hover:bg-danger/5'><Trash2 size={14} /></button>
                    </div></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <p className='text-xs text-muted mt-3'>Showing 1 to {filtered.length} of {filtered.length} entries</p>
      </div>
    </div>
  )
}

export default CreateProductCode
