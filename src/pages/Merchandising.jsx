import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import {
  LayoutGrid, Plus, Pencil, Copy, Trash2, Eye, EyeOff, GripVertical,
  ImagePlus, X, Layers, CheckCircle2, CalendarClock, Sparkles, RefreshCw, Search,
} from 'lucide-react'
import { PageHeader, Btn, StatCard, FilterTabs, EmptyState, StatusPill, Modal, Toggle } from '../components/ui'

const inp = 'w-full px-3 py-2 text-sm rounded-lg bg-surface-2 border border-line text-fg placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none'
const lbl = 'block text-[10px] font-semibold uppercase tracking-wider text-faint mb-1'
const FILTERS = ['all', 'active', 'inactive', 'scheduled', 'coming_soon']
const STATUS_LABEL = { active: 'Active', inactive: 'Inactive', scheduled: 'Scheduled', coming_soon: 'Coming soon' }
const PRESET_SECTIONS = ['Hero', 'Best Sellers', 'New Arrivals', 'Top Category', 'Featured', 'Trending', 'Match the Mood', 'Spotlight']

const Merchandising = ({ token }) => {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const [dragId, setDragId] = useState(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(backendUrl + '/api/merchandising/list', { headers: { token } })
      if (data.success) setSections(data.sections)
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load sections') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const shown = useMemo(() => filter === 'all' ? sections : sections.filter((s) => s.status === filter), [sections, filter])
  const summary = useMemo(() => ({
    total: sections.length,
    active: sections.filter((s) => s.status === 'active').length,
    scheduled: sections.filter((s) => s.status === 'scheduled').length,
    collections: sections.filter((s) => s.type === 'collection').length,
  }), [sections])

  const setStatus = async (id, status) => {
    try { const { data } = await axios.put(`${backendUrl}/api/merchandising/status/${id}`, { status }, { headers: { token } }); if (data.success) fetchAll() } catch { toast.error('Failed') }
  }
  const duplicate = async (id) => {
    try { const { data } = await axios.post(`${backendUrl}/api/merchandising/duplicate/${id}`, {}, { headers: { token } }); if (data.success) { toast.success('Duplicated'); fetchAll() } } catch { toast.error('Failed') }
  }
  const remove = async (id) => {
    if (!window.confirm('Delete this section?')) return
    try { const { data } = await axios.delete(`${backendUrl}/api/merchandising/remove/${id}`, { headers: { token } }); if (data.success) { toast.success('Deleted'); fetchAll() } } catch { toast.error('Failed') }
  }

  // Native HTML5 drag-and-drop reordering (no external library).
  const onDrop = async (targetId) => {
    if (!dragId || dragId === targetId) return
    const ids = shown.map((s) => s._id)
    const from = ids.indexOf(dragId), to = ids.indexOf(targetId)
    const next = [...ids]; next.splice(to, 0, next.splice(from, 1)[0])
    // Optimistic reorder in UI
    const map = Object.fromEntries(sections.map((s) => [s._id, s]))
    setSections(next.map((id) => map[id]).concat(sections.filter((s) => !next.includes(s._id))))
    setDragId(null)
    try { await axios.post(`${backendUrl}/api/merchandising/reorder`, { order: next }, { headers: { token } }); toast.success('Order saved') }
    catch { toast.error('Failed to save order'); fetchAll() }
  }

  return (
    <div className='p-6'>
      <PageHeader icon={LayoutGrid} title='Merchandising / Product Display' subtitle='Homepage sections · collections · drag-to-rank'
        actions={<div className='flex gap-2'><Btn variant='secondary' size='sm' icon={RefreshCw} onClick={fetchAll}>Refresh</Btn><Btn variant='primary' size='sm' icon={Plus} onClick={() => setEditing({})}>Add Section</Btn></div>}
      />

      <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mb-6'>
        <StatCard icon={Layers} label='Sections' value={summary.total} />
        <StatCard icon={CheckCircle2} label='Active' value={summary.active} tone='brand' />
        <StatCard icon={CalendarClock} label='Scheduled' value={summary.scheduled} tone='amber' />
        <StatCard icon={Sparkles} label='Collections' value={summary.collections} tone='accent' />
      </div>

      <div className='glass rounded-2xl p-3 mb-4'><FilterTabs options={FILTERS} value={filter} onChange={setFilter} /></div>

      <div className='glass rounded-2xl overflow-hidden'>
        {loading ? (
          <div className='p-6 space-y-3'>{[0, 1, 2].map((i) => <div key={i} className='skeleton rounded-xl h-16' />)}</div>
        ) : shown.length === 0 ? (
          <EmptyState icon={LayoutGrid} title='No sections' message='Add a homepage section or collection to control product display.' />
        ) : shown.map((s) => (
          <div key={s._id} draggable onDragStart={() => setDragId(s._id)} onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(s._id)}
            className={`flex flex-wrap items-center gap-3 px-4 py-3 border-b border-line/60 last:border-0 hover:bg-surface-2/40 transition-colors ${dragId === s._id ? 'opacity-50' : ''}`}>
            <GripVertical size={16} className='text-faint cursor-grab shrink-0' />
            {s.thumbnail || s.bannerImages?.[0] ? <img src={s.thumbnail || s.bannerImages[0]} alt='' className='w-14 h-10 rounded-lg object-cover bg-surface-2' /> : <span className='w-14 h-10 rounded-lg bg-surface-2 grid place-items-center text-faint'><LayoutGrid size={14} /></span>}
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-2 flex-wrap'>
                <p className='font-semibold text-sm text-fg truncate'>{s.name}</p>
                <span className='text-[9px] uppercase tracking-widest text-faint'>{s.type === 'collection' ? (s.collectionTag || 'collection') : 'section'}</span>
              </div>
              <p className='text-xs text-muted truncate'>{s.products?.length || 0} product(s){s.link ? ` · ${s.link}` : ''} · edited {new Date(s.updatedAt).toLocaleDateString('en-IN')}</p>
            </div>
            <StatusPill status={STATUS_LABEL[s.status] || s.status} />
            <button onClick={() => setStatus(s._id, s.status === 'active' ? 'inactive' : 'active')} title={s.status === 'active' ? 'Hide' : 'Activate'} className='grid place-items-center w-8 h-8 rounded-lg text-muted hover:text-accent hover:bg-accent/10'>{s.status === 'active' ? <EyeOff size={15} /> : <Eye size={15} />}</button>
            <button onClick={() => setEditing(s)} title='Edit' className='grid place-items-center w-8 h-8 rounded-lg text-muted hover:text-accent hover:bg-accent/10'><Pencil size={14} /></button>
            <button onClick={() => duplicate(s._id)} title='Duplicate' className='grid place-items-center w-8 h-8 rounded-lg text-muted hover:text-accent hover:bg-accent/10'><Copy size={14} /></button>
            <button onClick={() => remove(s._id)} title='Delete' className='grid place-items-center w-8 h-8 rounded-lg text-muted hover:text-danger hover:bg-danger/10'><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      {shown.length > 0 && <p className='text-[11px] text-faint mt-2'>Drag rows by the handle to change their display order on the storefront.</p>}

      {editing && <SectionForm token={token} initial={editing._id ? editing : null} onClose={() => setEditing(null)} onDone={() => { setEditing(null); fetchAll() }} />}
    </div>
  )
}

const SectionForm = ({ token, initial, onClose, onDone }) => {
  const isEdit = !!initial
  const [name, setName] = useState(initial?.name || '')
  const [type, setType] = useState(initial?.type || 'homepage_section')
  const [collectionTag, setCollectionTag] = useState(initial?.collectionTag || '')
  const [link, setLink] = useState(initial?.link || '')
  const [status, setStatus] = useState(initial?.status || 'active')
  const [scheduleStart, setScheduleStart] = useState(initial?.scheduleStart ? initial.scheduleStart.slice(0, 10) : '')
  const [scheduleEnd, setScheduleEnd] = useState(initial?.scheduleEnd ? initial.scheduleEnd.slice(0, 10) : '')
  const [selected, setSelected] = useState((initial?.products || []).map((p) => (typeof p === 'string' ? p : p._id)))
  const [banners, setBanners] = useState([]) // File[]
  const [mobile, setMobile] = useState(null)
  const [thumb, setThumb] = useState(null)
  const [video, setVideo] = useState(null)
  const [products, setProducts] = useState([])
  const [pquery, setPquery] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { axios.get(backendUrl + '/api/product/list?limit=500').then(({ data }) => data.success && setProducts(data.products)).catch(() => {}) }, [])

  const filteredProducts = useMemo(() => {
    const q = pquery.trim().toLowerCase()
    return products.filter((p) => !q || p.name.toLowerCase().includes(q)).slice(0, 60)
  }, [products, pquery])
  const toggleProduct = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('Section name is required')
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('name', name); fd.append('type', type); fd.append('collectionTag', collectionTag)
      fd.append('link', link); fd.append('status', status)
      fd.append('scheduleStart', scheduleStart); fd.append('scheduleEnd', scheduleEnd)
      fd.append('products', JSON.stringify(selected))
      banners.forEach((f) => fd.append('bannerImages', f))
      if (mobile) fd.append('bannerMobile', mobile)
      if (thumb) fd.append('thumbnail', thumb)
      if (video) fd.append('video', video)
      const url = isEdit ? `${backendUrl}/api/merchandising/update/${initial._id}` : `${backendUrl}/api/merchandising/add`
      const { data } = await axios[isEdit ? 'put' : 'post'](url, fd, { headers: { token } })
      if (data.success) { toast.success(isEdit ? 'Section updated' : 'Section created'); onDone() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || err.message) }
    finally { setBusy(false) }
  }

  const Pick = ({ label, file, existing, onPick, count }) => (
    <div>
      <span className={lbl}>{label}</span>
      <div className='flex items-center gap-2 flex-wrap'>
        {existing && !file && <img src={existing} alt='' className='w-12 h-12 rounded-lg object-cover border border-line' />}
        {file && <span className='text-[11px] text-muted'>{count ? `${count} file(s)` : file.name?.slice(0, 16)}</span>}
        <label className='px-3 py-2 rounded-lg border border-dashed border-line hover:border-accent/60 bg-surface-2 cursor-pointer text-xs text-muted inline-flex items-center gap-1'>
          <ImagePlus size={13} />Upload
          <input type='file' accept={label.includes('Video') ? 'video/*' : 'image/*'} multiple={!!count} hidden onChange={(e) => onPick(count ? [...e.target.files] : e.target.files?.[0] || null)} />
        </label>
      </div>
    </div>
  )

  return (
    <Modal open onClose={onClose} icon={LayoutGrid} title={isEdit ? `Edit · ${initial.name}` : 'Add Section'} subtitle='Products · banners · schedule · link' size='xl'
      footer={<><Btn variant='ghost' size='sm' onClick={onClose}>Cancel</Btn><Btn variant='primary' size='sm' loading={busy} onClick={submit}>{isEdit ? 'Save changes' : 'Create section'}</Btn></>}
    >
      <form onSubmit={submit} className='space-y-4'>
        <div className='grid sm:grid-cols-2 gap-3'>
          <div>
            <label className={lbl}>Section name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} list='preset-sections' className={inp} placeholder='e.g. Best Sellers' required />
            <datalist id='preset-sections'>{PRESET_SECTIONS.map((s) => <option key={s} value={s} />)}</datalist>
          </div>
          <div><label className={lbl}>Type</label><select value={type} onChange={(e) => setType(e.target.value)} className={inp}><option value='homepage_section'>Homepage section</option><option value='collection'>Collection</option></select></div>
          {type === 'collection' && <div><label className={lbl}>Collection tag</label><input value={collectionTag} onChange={(e) => setCollectionTag(e.target.value)} className={inp} placeholder='Summer / Winter / Festive' /></div>}
          <div><label className={lbl}>Link (category / CTA)</label><input value={link} onChange={(e) => setLink(e.target.value)} className={inp} placeholder='/collection?category=Men' /></div>
          <div><label className={lbl}>Status</label><select value={status} onChange={(e) => setStatus(e.target.value)} className={inp}><option value='active'>Active</option><option value='inactive'>Inactive</option><option value='scheduled'>Scheduled</option><option value='coming_soon'>Coming soon</option></select></div>
          {status === 'scheduled' && <>
            <div><label className={lbl}>Start date</label><input type='date' value={scheduleStart} onChange={(e) => setScheduleStart(e.target.value)} className={inp} /></div>
            <div><label className={lbl}>End date</label><input type='date' value={scheduleEnd} onChange={(e) => setScheduleEnd(e.target.value)} className={inp} /></div>
          </>}
        </div>

        <div className='grid sm:grid-cols-4 gap-3'>
          <Pick label='Banners (1–2)' file={banners.length ? banners : null} count={banners.length || 2} onPick={setBanners} />
          <Pick label='Mobile banner' file={mobile} existing={initial?.bannerMobile} onPick={setMobile} />
          <Pick label='Thumbnail' file={thumb} existing={initial?.thumbnail} onPick={setThumb} />
          <Pick label='Video' file={video} onPick={setVideo} />
        </div>

        {/* Product picker */}
        <div>
          <div className='flex items-center justify-between mb-2'>
            <span className={lbl + ' mb-0'}>Products ({selected.length} selected)</span>
            <div className='relative'>
              <Search size={13} className='absolute left-2.5 top-1/2 -translate-y-1/2 text-faint' />
              <input value={pquery} onChange={(e) => setPquery(e.target.value)} placeholder='Search products…' className='pl-8 pr-3 py-1.5 text-xs rounded-lg bg-surface-2 border border-line text-fg outline-none' />
            </div>
          </div>
          <div className='grid sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto p-1'>
            {filteredProducts.map((p) => (
              <label key={p._id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer text-sm ${selected.includes(p._id) ? 'border-accent/50 bg-accent/10' : 'border-line bg-surface-2 hover:border-accent/30'}`}>
                <input type='checkbox' checked={selected.includes(p._id)} onChange={() => toggleProduct(p._id)} className='accent-accent' />
                <img src={Array.isArray(p.image) ? p.image[0] : p.image} alt='' className='w-7 h-7 rounded object-cover' />
                <span className='truncate flex-1 text-fg'>{p.name}</span>
                <span className='text-xs text-muted'>{currency}{p.discountPrice || p.price}</span>
              </label>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default Merchandising
