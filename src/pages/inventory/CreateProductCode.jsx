import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { backendUrl } from '../../App'
import { toast } from 'react-toastify'
import { ArrowLeft, Plus, RefreshCw, FileSpreadsheet, Search, Pencil, Trash2 } from 'lucide-react'

const num = (n) => <span className='grid place-items-center w-6 h-6 rounded-full bg-accent text-white text-xs font-bold shrink-0'>{n}</span>
const inp = 'w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-line focus:border-accent outline-none'
const lbl = 'flex items-center gap-2 text-sm font-bold text-fg mb-2'
const req = <span className='text-danger'>*</span>

const CreateProductCode = ({ token }) => {
  const navigate = useNavigate()
  const [nextCode, setNextCode] = useState('')
  const [category, setCategory] = useState('')
  const [fabric, setFabric] = useState('')
  const [desc, setDesc] = useState('')
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)

  const loadNext = () => axios.get(backendUrl + '/api/inventory/next-code', { headers: { token } }).then(({ data }) => data.success && setNextCode(data.productCode)).catch(() => {})
  const loadRows = () => axios.get(backendUrl + '/api/inventory/product-code', { headers: { token } }).then(({ data }) => data.success && setRows(data.rows)).catch(() => {})
  useEffect(() => { loadNext(); loadRows() }, [])

  const submit = async () => {
    setBusy(true)
    try {
      const { data } = await axios.post(backendUrl + '/api/inventory/product-code', { code: 'Automatic', category, fabric, shortDescription: desc }, { headers: { token } })
      if (data.success) { toast.success(`Created ${data.productCode.code}`); setCategory(''); setFabric(''); setDesc(''); loadNext(); loadRows() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || err.message) }
    finally { setBusy(false) }
  }
  const remove = async (id) => {
    if (!window.confirm('Delete this product code?')) return
    try { await axios.delete(`${backendUrl}/api/inventory/product-code/${id}`, { headers: { token } }); loadRows() } catch { toast.error('Failed') }
  }
  const filtered = rows.filter((r) => !q || `${r.code} ${r.category} ${r.fabric} ${r.shortDescription}`.toLowerCase().includes(q.toLowerCase()))

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
            <label className={lbl}>{num(1)} Product Code {req}</label>
            <div className='flex items-center gap-2'>
              <input value={nextCode} readOnly className={inp + ' font-mono font-bold'} placeholder='Automatic Code' />
              <button onClick={loadNext} className='inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-xl border border-dashed border-accent/50 text-accent hover:bg-accent/5 shrink-0'><Plus size={14} /> Add Row</button>
            </div>
          </div>
          <div>
            <label className={lbl}>{num(2)} Category {req}</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} className={inp} placeholder='Manually' />
          </div>
          <div>
            <label className={lbl}>{num(3)} Fabric {req}</label>
            <input value={fabric} onChange={(e) => setFabric(e.target.value)} className={inp} placeholder='Manually' />
          </div>
          <div>
            <label className={lbl}>{num(4)} Short Description {req}</label>
            <div className='relative'>
              <textarea value={desc} maxLength={200} onChange={(e) => setDesc(e.target.value)} className={inp + ' h-[70px] resize-none'} placeholder='Manually' />
              <span className='absolute bottom-2 right-3 text-[11px] text-faint'>{desc.length}/200</span>
            </div>
          </div>
        </div>
        <div className='flex items-center justify-end gap-2 mt-5'>
          <button onClick={() => { setCategory(''); setFabric(''); setDesc('') }} className='px-6 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg hover:bg-surface-2'>Cancel</button>
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
                    <td className='py-3 px-3 text-fg'>{r.category || '—'}</td>
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
