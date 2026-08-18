import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { backendUrl, currency } from '../../App'
import { toast } from 'react-toastify'
import { RefreshCw, FileSpreadsheet, Search, SlidersHorizontal, Pencil, Trash2, ChevronDown } from 'lucide-react'

const STATUS_PILL = {
  active: 'bg-success/10 text-success', inactive: 'bg-danger/10 text-danger', draft: 'bg-accent/10 text-accent',
  saved: 'bg-violet/10 text-violet', archived: 'bg-muted/10 text-muted', hidden: 'bg-muted/10 text-muted',
  coming_soon: 'bg-violet/10 text-violet', not_available: 'bg-amber/10 text-amber', notify_me: 'bg-violet/10 text-violet',
}

const ProductDetailList = ({ token }) => {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState(''); const [fCat, setFCat] = useState('All'); const [fColour, setFColour] = useState('All'); const [fSize, setFSize] = useState('All')
  const [expanded, setExpanded] = useState({})

  const load = async () => {
    setLoading(true)
    try { const { data } = await axios.get(backendUrl + '/api/product/list?limit=500&all=true'); if (data.success) setProducts(data.products) }
    catch { toast.error('Failed to load products') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const counts = useMemo(() => ({
    all: products.length,
    draft: products.filter((p) => p.status === 'draft').length,
    saved: products.filter((p) => p.status === 'saved').length,
    archived: products.filter((p) => p.status === 'archived').length,
  }), [products])

  const cats = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean))], [products])
  const colours = useMemo(() => [...new Set(products.flatMap((p) => (p.variants || []).map((v) => v.color)).filter(Boolean))], [products])
  const sizes = useMemo(() => [...new Set(products.flatMap((p) => (p.variants || []).map((v) => v.size)).filter(Boolean))], [products])

  const filtered = useMemo(() => products.filter((p) => {
    if (tab !== 'all' && p.status !== tab) return false
    if (fCat !== 'All' && p.category !== fCat) return false
    if (fColour !== 'All' && !(p.variants || []).some((v) => v.color === fColour)) return false
    if (fSize !== 'All' && !(p.variants || []).some((v) => v.size === fSize)) return false
    if (q && !`${p.name} ${p.productCode || ''}`.toLowerCase().includes(q.toLowerCase())) return false
    return true
  }), [products, tab, fCat, fColour, fSize, q])

  const remove = async (id) => {
    if (!window.confirm('Delete this product?')) return
    try { await axios.post(backendUrl + '/api/product/remove', { id }, { headers: { token } }); toast.success('Deleted'); load() } catch { toast.error('Failed') }
  }
  const clear = () => { setQ(''); setFCat('All'); setFColour('All'); setFSize('All') }
  const sel = 'px-3 py-2 text-sm rounded-lg bg-white border border-line text-fg focus:border-accent outline-none'
  const tabs = [['all', 'All'], ['draft', 'Draft'], ['saved', 'Saved'], ['archived', 'Archived']]

  return (
    <div className='p-6'>
      <div className='flex items-start justify-between mb-5'>
        <div>
          <h1 className='text-2xl font-heading font-extrabold text-fg'>Product Detail</h1>
          <p className='text-xs text-muted mt-1'>Dashboard <span className='text-faint'>›</span> Products <span className='text-faint'>›</span> All Products <span className='text-faint'>›</span> Product Details</p>
        </div>
        <div className='flex items-center gap-2'>
          <button onClick={load} className='inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><RefreshCw size={15} /> Refresh</button>
          <button className='inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><FileSpreadsheet size={15} className='text-success' /> Import Data</button>
        </div>
      </div>

      <div className='glass rounded-2xl p-5'>
        {/* Tabs */}
        <div className='flex items-center gap-6 border-b border-line mb-4'>
          {tabs.map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} className={`pb-3 -mb-px text-sm font-semibold border-b-2 transition-colors inline-flex items-center gap-1.5 ${tab === v ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-fg'}`}>
              <span className={`w-2 h-2 rounded-full ${v === 'all' ? 'bg-accent' : v === 'draft' ? 'bg-violet' : v === 'saved' ? 'bg-accent' : 'bg-muted'}`} /> {l} ({counts[v]})
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className='flex flex-wrap items-center gap-3 mb-4'>
          <div className='relative flex-1 min-w-[220px] max-w-sm'>
            <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-faint' />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder='Search by product code or name…' className='w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-line' />
          </div>
          <select value={fCat} onChange={(e) => setFCat(e.target.value)} className={sel}><option value='All'>All Categories</option>{cats.map((c) => <option key={c}>{c}</option>)}</select>
          <select value={fColour} onChange={(e) => setFColour(e.target.value)} className={sel}><option value='All'>All Colours</option>{colours.map((c) => <option key={c}>{c}</option>)}</select>
          <select value={fSize} onChange={(e) => setFSize(e.target.value)} className={sel}><option value='All'>All Sizes</option>{sizes.map((s) => <option key={s}>{s}</option>)}</select>
          <button className='inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg bg-white border border-line text-fg'><SlidersHorizontal size={14} /> More Filters</button>
          <button onClick={clear} className='ml-auto px-3 py-2 text-sm font-semibold text-muted hover:text-fg'>Clear</button>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-left text-[11px] font-semibold uppercase tracking-wider text-muted border-b border-line'>
                <th className='py-3 px-2'>#</th><th className='py-3 px-2'>Product Code</th><th className='py-3 px-2'>Product Name</th><th className='py-3 px-2'>Colour</th><th className='py-3 px-2'>Size</th><th className='py-3 px-2'>MRP</th><th className='py-3 px-2'>Selling Price</th><th className='py-3 px-2'>Discount</th><th className='py-3 px-2'>Images</th><th className='py-3 px-2'>Status</th><th className='py-3 px-2'>Date</th><th className='py-3 px-2'>Action</th><th className='py-3 px-2'>Detail</th>
              </tr>
            </thead>
            <tbody>
              {loading ? [0, 1, 2].map((i) => <tr key={i}><td colSpan={13} className='py-2'><div className='skeleton h-12 rounded-lg' /></td></tr>) :
                filtered.length === 0 ? <tr><td colSpan={13} className='py-10 text-center text-muted'>No products.</td></tr> :
                  filtered.slice(0, 20).map((p, i) => {
                    const colour = (p.variants || [])[0]?.color || (p.colours || [])[0]?.color || '—'
                    const size = (p.variants || [])[0]?.size || '—'
                    const imgs = Array.isArray(p.image) ? p.image : [p.image]
                    return (
                      <React.Fragment key={p._id}>
                        <tr className='border-b border-line/70 hover:bg-surface-2/50'>
                          <td className='py-3 px-2 text-muted'>{i + 1}</td>
                          <td className='py-3 px-2 font-mono text-xs text-accent'>{p.productCode || '—'}</td>
                          <td className='py-3 px-2 font-semibold text-fg'>{p.name}</td>
                          <td className='py-3 px-2 text-fg'>{colour}</td>
                          <td className='py-3 px-2 text-fg'>{size}</td>
                          <td className='py-3 px-2 text-fg'>{currency}{p.price}</td>
                          <td className='py-3 px-2 text-fg'>{p.discountPrice ? `${currency}${p.discountPrice}` : '—'}</td>
                          <td className='py-3 px-2 text-success font-semibold'>{p.discountPercent ? `${p.discountPercent}%` : '—'}</td>
                          <td className='py-3 px-2'><div className='flex gap-1'>{imgs.slice(0, 3).map((s, k) => <img key={k} src={s} alt='' className='w-8 h-8 rounded object-cover border border-line' />)}</div></td>
                          <td className='py-3 px-2'><span className={`px-2 py-1 rounded-md text-[11px] font-semibold ${STATUS_PILL[p.status] || 'bg-muted/10 text-muted'}`}>{(p.status || 'active').replace('_', ' ')}</span></td>
                          <td className='py-3 px-2 text-muted text-xs'>{new Date(p.date || p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className='py-3 px-2'><div className='flex gap-1'><button onClick={() => navigate('/products/add?edit=' + p._id)} className='grid place-items-center w-8 h-8 rounded-lg border border-line text-accent'><Pencil size={14} /></button><button onClick={() => remove(p._id)} className='grid place-items-center w-8 h-8 rounded-lg border border-line text-danger'><Trash2 size={14} /></button></div></td>
                          <td className='py-3 px-2'><button onClick={() => setExpanded((x) => ({ ...x, [p._id]: !x[p._id] }))} className='grid place-items-center w-8 h-8 rounded-lg border border-line text-muted'><ChevronDown size={15} className={expanded[p._id] ? 'rotate-180 transition-transform' : 'transition-transform'} /></button></td>
                        </tr>
                        {expanded[p._id] && (
                          <tr className='bg-surface-2/40'><td colSpan={13} className='px-4 py-3 text-sm'>
                            <div className='grid md:grid-cols-2 gap-4'>
                              <div><p className='text-[11px] uppercase tracking-widest text-faint mb-1'>Description</p><p className='text-muted'>{p.description}</p>{p.fabric && <p className='text-muted mt-1'>Fabric: {p.fabric}</p>}</div>
                              <div><p className='text-[11px] uppercase tracking-widest text-faint mb-1'>Variants</p><p className='text-muted'>{(p.variants || []).map((v) => `${v.size}/${v.color} (${v.stock})`).join(', ') || '—'}</p></div>
                            </div>
                          </td></tr>
                        )}
                      </React.Fragment>
                    )
                  })}
            </tbody>
          </table>
        </div>
        <p className='text-xs text-muted mt-4 flex items-center gap-1.5'><ChevronDown size={13} /> Scroll down in “Detail” to view full product information including description, highlights, media, pricing &amp; more.</p>
      </div>
    </div>
  )
}

export default ProductDetailList
