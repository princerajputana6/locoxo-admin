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
const FILTERS = ['all', 'active', 'inactive']
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
    inactive: sections.filter((s) => s.status === 'inactive').length,
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
        <StatCard icon={EyeOff} label='Inactive' value={summary.inactive} tone='amber' />
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
  // Content type + layout/placement + category cards + combos
  const [contentType, setContentType] = useState(initial?.contentType || 'products')
  const [layout, setLayout] = useState(initial?.layout || 'grid')
  const [cardsDesktop, setCardsDesktop] = useState(initial?.cardsDesktop || 4)
  const [cardsTablet, setCardsTablet] = useState(initial?.cardsTablet || 3)
  const [cardsMobile, setCardsMobile] = useState(initial?.cardsMobile || 2)
  const [heroSlides, setHeroSlides] = useState((initial?.heroSlides || [3, 1, 2]).join(', '))
  const [allCats, setAllCats] = useState([])
  const [cardCats, setCardCats] = useState(initial?.categories || [])
  const [combos, setCombos] = useState((initial?.combos || []).map((c) => ({ ...c, products: (c.products || []).map((p) => (typeof p === 'string' ? p : p._id)) })))
  const [combo, setCombo] = useState({ name: '', image: '', price: '', mrp: '', products: [] })

  useEffect(() => {
    axios.get(backendUrl + '/api/product/list?limit=500&all=true').then(({ data }) => data.success && setProducts(data.products)).catch(() => {})
    axios.get(backendUrl + '/api/category/list?status=active').then(({ data }) => data.success && setAllCats(data.categories || [])).catch(() => {})
  }, [])

  // Category cards
  const addCatCard = (c) => setCardCats((list) => list.some((x) => x.name === c.name) ? list : [...list, { name: c.name, image: c.image || '', imageMobile: '', url: `/collection?category=${encodeURIComponent(c.name)}`, showName: true, showButton: true, buttonText: 'Shop Now' }])
  const updCatCard = (i, f, v) => setCardCats((list) => list.map((x, idx) => idx === i ? { ...x, [f]: v } : x))
  const rmCatCard = (i) => setCardCats((list) => list.filter((_, idx) => idx !== i))
  // Combos
  const comboToggle = (id) => setCombo((c) => ({ ...c, products: c.products.includes(id) ? c.products.filter((x) => x !== id) : [...c.products, id] }))
  const addCombo = () => { if (!combo.name.trim() || combo.products.length === 0) return toast.error('Combo needs a name and at least one product'); setCombos((l) => [...l, combo]); setCombo({ name: '', image: '', price: '', mrp: '', products: [] }) }
  const rmCombo = (i) => setCombos((l) => l.filter((_, idx) => idx !== i))
  const pName = (id) => products.find((p) => p._id === id)?.name || id

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
      fd.append('contentType', contentType); fd.append('layout', layout)
      fd.append('cardsDesktop', cardsDesktop); fd.append('cardsTablet', cardsTablet); fd.append('cardsMobile', cardsMobile)
      fd.append('categories', JSON.stringify(cardCats))
      fd.append('heroSlides', JSON.stringify(heroSlides.split(',').map((n) => Number(n.trim())).filter((n) => n > 0)))
      fd.append('combos', JSON.stringify(combos.map((c) => ({ name: c.name, image: c.image, price: Number(c.price) || undefined, mrp: Number(c.mrp) || undefined, products: c.products }))))
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

  const Pick = ({ label, file, existing, onPick, count, hint }) => (
    <div>
      <span className={lbl}>{label}</span>
      <div className='flex items-center gap-2 flex-wrap'>
        {existing && !file && <img src={existing} alt='' className='w-12 h-12 rounded-lg object-cover border border-line' />}
        {file && <span className='text-[11px] text-muted'>{count ? `${Array.isArray(file) ? file.length : 1} file(s)` : file.name?.slice(0, 16)}</span>}
        <label className='px-3 py-2 rounded-lg border border-dashed border-line hover:border-accent/60 bg-surface-2 cursor-pointer text-xs text-muted inline-flex items-center gap-1'>
          <ImagePlus size={13} />Upload
          <input type='file' accept={label.includes('Video') ? 'video/*' : 'image/*'} multiple={!!count} hidden onChange={(e) => onPick(count ? [...e.target.files] : e.target.files?.[0] || null)} />
        </label>
      </div>
      {hint && <p className='text-[10px] text-muted mt-1'>{hint}</p>}
    </div>
  )

  return (
    <Modal open onClose={onClose} icon={LayoutGrid} title={isEdit ? `Edit · ${initial.name}` : 'Add Section'} subtitle='Products / categories · images · layout · link' size='xl'
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
          <div><label className={lbl}>Status</label><select value={status} onChange={(e) => setStatus(e.target.value)} className={inp}><option value='active'>Active</option><option value='inactive'>Inactive</option></select></div>
        </div>

        <div className='grid sm:grid-cols-2 gap-3'>
          <Pick label='Desktop image' file={banners.length ? banners : null} existing={initial?.bannerImages?.[0]} count={banners.length || 1} onPick={setBanners} hint='Recommended 1920 × 800 px (landscape)' />
          <Pick label='Mobile image' file={mobile} existing={initial?.bannerMobile} onPick={setMobile} hint='Recommended 800 × 1000 px (portrait)' />
        </div>

        {/* Content type + layout + card placement */}
        <div className='rounded-xl border border-line p-3 bg-surface-2/40'>
          <div className='grid sm:grid-cols-4 gap-3'>
            <div><label className={lbl}>Section shows</label><select value={contentType} onChange={(e) => setContentType(e.target.value)} className={inp}><option value='products'>Products</option><option value='categories'>Categories</option></select></div>
            <div><label className={lbl}>Layout</label><select value={layout} onChange={(e) => setLayout(e.target.value)} className={inp}><option value='grid'>Grid</option><option value='slider'>Slider</option><option value='hero'>Hero (full-screen)</option></select></div>
            {layout === 'hero' && <div><label className={lbl}>Categories per hero slide</label><input value={heroSlides} onChange={(e) => setHeroSlides(e.target.value)} className={inp} placeholder='3, 1, 2' /><p className='text-[10px] text-muted mt-1'>e.g. 3, 1, 2 → slide 1 shows 3, slide 2 shows 1, slide 3 shows 2. Use content type “Categories”.</p></div>}
            <div><label className={lbl}>Cards / row</label>
              <div className='flex items-center gap-1'>
                <input type='number' min='1' max='8' value={cardsDesktop} onChange={(e) => setCardsDesktop(e.target.value)} className={inp + ' text-center'} title='Desktop' />
                <input type='number' min='1' max='6' value={cardsTablet} onChange={(e) => setCardsTablet(e.target.value)} className={inp + ' text-center'} title='Tablet' />
                <input type='number' min='1' max='4' value={cardsMobile} onChange={(e) => setCardsMobile(e.target.value)} className={inp + ' text-center'} title='Mobile' />
              </div>
              <p className='text-[10px] text-muted mt-1'>Desktop · Tablet · Mobile</p>
            </div>
            <div className='text-[11px] text-muted self-end pb-2'>{layout === 'slider' ? 'Cards scroll horizontally.' : 'Cards wrap in a grid.'}</div>
          </div>
        </div>

        {/* Category cards picker */}
        {contentType === 'categories' && (
          <div>
            <span className={lbl}>Category cards ({cardCats.length})</span>
            <div className='flex flex-wrap gap-1.5 mb-2'>
              {allCats.map((c) => <button type='button' key={c._id} onClick={() => addCatCard(c)} className='px-2.5 py-1 text-xs rounded-lg border border-line bg-surface-2 hover:border-accent/40 text-fg'>+ {c.name}</button>)}
            </div>
            <div className='space-y-2'>
              {cardCats.map((cc, i) => (
                <div key={i} className='rounded-lg border border-line p-2.5 space-y-2'>
                  <div className='flex items-center gap-2'>
                    <img src={cc.image || 'https://placehold.co/40'} alt='' className='w-9 h-9 rounded object-cover border border-line' />
                    <span className='font-semibold text-fg text-sm w-28 truncate'>{cc.name}</span>
                    <input value={cc.url} onChange={(e) => updCatCard(i, 'url', e.target.value)} placeholder='Link URL (where the card points)' className='flex-1 px-2 py-1.5 text-xs rounded-lg bg-surface-2 border border-line' />
                    <button type='button' onClick={() => rmCatCard(i)} className='text-danger px-2'>✕</button>
                  </div>
                  <div className='grid sm:grid-cols-2 gap-2'>
                    <input value={cc.image} onChange={(e) => updCatCard(i, 'image', e.target.value)} placeholder='Desktop image URL (1920×800)' className='px-2 py-1.5 text-xs rounded-lg bg-surface-2 border border-line' />
                    <input value={cc.imageMobile || ''} onChange={(e) => updCatCard(i, 'imageMobile', e.target.value)} placeholder='Mobile image URL (800×1000, optional)' className='px-2 py-1.5 text-xs rounded-lg bg-surface-2 border border-line' />
                  </div>
                  <div className='flex flex-wrap items-center gap-4'>
                    <label className='flex items-center gap-1.5 text-xs text-fg cursor-pointer'>
                      <input type='checkbox' checked={cc.showName !== false} onChange={(e) => updCatCard(i, 'showName', e.target.checked)} className='accent-accent' /> Show category name
                    </label>
                    <label className='flex items-center gap-1.5 text-xs text-fg cursor-pointer'>
                      <input type='checkbox' checked={cc.showButton !== false} onChange={(e) => updCatCard(i, 'showButton', e.target.checked)} className='accent-accent' /> Show button
                    </label>
                    {cc.showButton !== false && (
                      <input value={cc.buttonText ?? 'Shop Now'} onChange={(e) => updCatCard(i, 'buttonText', e.target.value)} placeholder='Button text' className='px-2 py-1.5 text-xs rounded-lg bg-surface-2 border border-line w-32' />
                    )}
                  </div>
                </div>
              ))}
              {cardCats.length === 0 && <p className='text-xs text-muted'>Click a category above to add it as a card.</p>}
            </div>
          </div>
        )}

        {/* Product picker */}
        {contentType === 'products' && (
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
        )}
      </form>
    </Modal>
  )
}

export default Merchandising
