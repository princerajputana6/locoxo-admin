import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import { ImagePlus, Plus, Trash2, X, Barcode, Ruler, Film, Sparkles } from 'lucide-react'
import { Btn, Toggle } from './ui'

const SIZE_OPTIONS = ['Free', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38']
const AUDIENCES = ['Male', 'Female', 'Unisex', 'Child']
const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'coming_soon', label: 'Coming soon' },
  { value: 'inactive', label: 'Inactive' },
]
const HIGHLIGHT_PRESETS = ['Fabric', 'Neck', 'Sleeve', 'Pattern', 'Fit', 'Occasion', 'Wash Care']
const MAX_IMAGES = 7
const MAX_IMAGE_MB = 5
const MAX_VIDEO_MB = 60

const inp = 'w-full px-3 py-2 text-sm rounded-lg bg-surface-2 border border-line text-fg placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all'
const lbl = 'block text-[10px] font-semibold uppercase tracking-wider text-faint mb-1'
const blankVariant = () => ({ size: 'M', color: 'Black', colorCode: '#000000', stock: 0 })

// Shared create/edit product form. Pass `initial` (a product doc) for edit mode.
const ProductForm = ({ token, initial, onDone, onCancel }) => {
  const isEdit = !!initial?._id

  const [name, setName] = useState(initial?.name || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [shortDescription, setShortDescription] = useState(initial?.shortDescription || '')
  const [price, setPrice] = useState(initial?.price ?? '')                 // MRP
  const [discountPrice, setDiscountPrice] = useState(initial?.discountPrice ?? '') // selling
  const [category, setCategory] = useState(initial?.category || '')
  const [subCategory, setSubCategory] = useState(initial?.subCategory || 'Topwear')
  const [audience, setAudience] = useState(initial?.audience || 'Male')
  const [fabric, setFabric] = useState(initial?.fabric || '')
  const [status, setStatus] = useState(initial?.status || 'active')
  const [bestseller, setBestseller] = useState(!!initial?.bestseller)
  const [featured, setFeatured] = useState(!!initial?.featured)
  const [productCode, setProductCode] = useState(initial?.productCode || '')

  const [highlights, setHighlights] = useState(initial?.highlights?.length ? initial.highlights : [{ label: 'Fabric', value: '' }])
  const [variants, setVariants] = useState(initial?.variants?.length ? initial.variants.map(v => ({ size: v.size, color: v.color, colorCode: v.colorCode || '#000000', stock: v.stock })) : [blankVariant()])

  const [existingImages, setExistingImages] = useState(initial?.image || [])
  const [newImages, setNewImages] = useState([]) // File[]
  const [existingSizeChart, setExistingSizeChart] = useState(initial?.sizeChart || '')
  const [sizeChartFile, setSizeChartFile] = useState(null)
  const [existingVideos, setExistingVideos] = useState(initial?.video || [])
  const [videoFiles, setVideoFiles] = useState([]) // File[]

  const [categories, setCategories] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(backendUrl + '/api/category/list')
        const names = (data?.categories || []).map(c => c.name).filter(Boolean)
        const list = names.length ? names : ['Men', 'Women', 'Kids', 'Anime', 'Super Hero']
        setCategories(list); setCategory(p => p || list[0])
      } catch { const list = ['Men', 'Women', 'Kids', 'Anime', 'Super Hero']; setCategories(list); setCategory(p => p || list[0]) }
    })()
    if (!isEdit) {
      axios.get(backendUrl + '/api/inventory/next-code', { headers: { token } })
        .then(({ data }) => data.success && setProductCode(data.productCode)).catch(() => {})
    }
  }, [])

  const discountPercent = useMemo(() => {
    const m = Number(price), s = Number(discountPrice)
    if (m > 0 && s > 0 && s < m) return Math.round(((m - s) / m) * 100)
    return 0
  }, [price, discountPrice])

  // Images
  const totalImageCount = existingImages.length + newImages.length
  const onPickImages = (e) => {
    const picked = [...e.target.files]; const valid = []
    for (const f of picked) {
      if (!f.type.startsWith('image/')) { toast.error(`${f.name}: not an image`); continue }
      if (f.size > MAX_IMAGE_MB * 1024 * 1024) { toast.error(`${f.name}: over ${MAX_IMAGE_MB}MB`); continue }
      valid.push(f)
    }
    setNewImages(prev => [...prev, ...valid].slice(0, MAX_IMAGES - existingImages.length))
    e.target.value = ''
  }
  const removeExistingImage = (i) => setExistingImages(prev => prev.filter((_, idx) => idx !== i))
  const removeNewImage = (i) => setNewImages(prev => prev.filter((_, idx) => idx !== i))

  const onPickSizeChart = (e) => {
    const f = e.target.files?.[0]; e.target.value = ''
    if (!f) return
    if (!f.type.startsWith('image/')) return toast.error('Size chart must be an image')
    if (f.size > MAX_IMAGE_MB * 1024 * 1024) return toast.error(`Size chart over ${MAX_IMAGE_MB}MB`)
    setSizeChartFile(f)
  }
  const onPickVideos = (e) => {
    const picked = [...e.target.files]; const valid = []; e.target.value = ''
    for (const f of picked) {
      if (!f.type.startsWith('video/')) { toast.error(`${f.name}: not a video`); continue }
      if (f.size > MAX_VIDEO_MB * 1024 * 1024) { toast.error(`${f.name}: over ${MAX_VIDEO_MB}MB`); continue }
      valid.push(f)
    }
    setVideoFiles(prev => [...prev, ...valid].slice(0, 2))
  }

  // Highlights
  const updateHL = (i, f, v) => setHighlights(h => h.map((r, idx) => idx === i ? { ...r, [f]: v } : r))
  const addHL = (label = '') => setHighlights(h => [...h, { label, value: '' }])
  const removeHL = (i) => setHighlights(h => h.filter((_, idx) => idx !== i))

  // Variants
  const updateVariant = (i, f, v) => setVariants(vs => vs.map((r, idx) => idx === i ? { ...r, [f]: v } : r))
  const addVariant = () => setVariants(v => [...v, blankVariant()])
  const removeVariant = (i) => setVariants(v => v.filter((_, idx) => idx !== i))
  const validVariants = useMemo(() => variants.filter(v => v.size && v.color), [variants])
  const totalStock = validVariants.reduce((s, v) => s + (Number(v.stock) || 0), 0)

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('Product name is required')
    if (price === '' || Number(price) <= 0) return toast.error('Enter a valid MRP')
    if (!isEdit && totalImageCount === 0) return toast.error('Add at least one product image')
    if (validVariants.length === 0) return toast.error('Add at least one variant (size + color)')

    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('name', name)
      fd.append('description', description || shortDescription || name)
      fd.append('shortDescription', shortDescription)
      fd.append('price', price)
      if (discountPrice !== '') fd.append('discountPrice', discountPrice)
      fd.append('category', category)
      fd.append('subCategory', subCategory)
      fd.append('audience', audience)
      fd.append('fabric', fabric)
      fd.append('status', status)
      fd.append('bestseller', bestseller)
      fd.append('featured', featured)
      fd.append('sizes', JSON.stringify([...new Set(validVariants.map(v => v.size))]))
      fd.append('variants', JSON.stringify(validVariants.map(v => ({ size: v.size, color: v.color, colorCode: v.colorCode, stock: Number(v.stock) || 0 }))))
      fd.append('highlights', JSON.stringify(highlights.filter(h => h.label && h.value)))
      newImages.forEach((f) => fd.append('images', f))
      if (sizeChartFile) fd.append('sizeChart', sizeChartFile)
      videoFiles.forEach((f) => fd.append('video', f))
      if (isEdit) {
        fd.append('keepImages', JSON.stringify(existingImages))
        fd.append('videoUrls', JSON.stringify(existingVideos))
      }

      const url = isEdit ? `${backendUrl}/api/product/update/${initial._id}` : `${backendUrl}/api/product/add`
      const method = isEdit ? 'put' : 'post'
      const { data } = await axios[method](url, fd, { headers: { token } })
      if (data.success) {
        toast.success(isEdit ? 'Product updated' : `${data.message} — ${data.productCode || ''}`)
        onDone?.(data)
      } else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || err.message) }
    finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} className='space-y-4'>
      {/* Code + status header */}
      <div className='flex flex-wrap items-center gap-3'>
        <span className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-accent font-mono text-sm font-semibold'>
          <Barcode size={13} /> {productCode || 'LX…'}
        </span>
        <div className='ml-auto flex items-center gap-2'>
          <label className={lbl + ' mb-0'}>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className={inp + ' w-40'}>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Images */}
      <div className='glass rounded-2xl p-4'>
        <div className='flex items-center justify-between mb-3'>
          <span className={lbl + ' mb-0'}>Images · {totalImageCount}/{MAX_IMAGES}</span>
          <span className='text-[11px] text-faint'>First image = thumbnail · 4–7 recommended</span>
        </div>
        <div className='flex flex-wrap gap-2'>
          {existingImages.map((url, i) => (
            <div key={'e' + i} className='relative w-20 h-20 rounded-lg overflow-hidden border border-line group'>
              <img src={url} alt='' className='w-full h-full object-cover' />
              <button type='button' onClick={() => removeExistingImage(i)} className='absolute top-0.5 right-0.5 w-5 h-5 grid place-items-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100'><X size={12} /></button>
              {i === 0 && <span className='absolute bottom-0 inset-x-0 text-[8px] text-center bg-accent text-brand-deep font-bold'>MAIN</span>}
            </div>
          ))}
          {newImages.map((img, i) => (
            <div key={'n' + i} className='relative w-20 h-20 rounded-lg overflow-hidden border border-line group'>
              <img src={URL.createObjectURL(img)} alt='' className='w-full h-full object-cover' />
              <button type='button' onClick={() => removeNewImage(i)} className='absolute top-0.5 right-0.5 w-5 h-5 grid place-items-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100'><X size={12} /></button>
            </div>
          ))}
          {totalImageCount < MAX_IMAGES && (
            <label className='w-20 h-20 rounded-lg border-2 border-dashed border-line hover:border-accent/60 bg-surface-2 grid place-items-center cursor-pointer'>
              <div className='flex flex-col items-center text-faint'><ImagePlus size={18} /><span className='text-[9px] mt-0.5'>Add</span></div>
              <input type='file' accept='image/*' multiple hidden onChange={onPickImages} />
            </label>
          )}
        </div>

        {/* Size chart + video row */}
        <div className='grid sm:grid-cols-2 gap-3 mt-4'>
          <div>
            <span className={lbl}><Ruler size={11} className='inline mr-1' />Size chart image</span>
            <div className='flex items-center gap-2'>
              {(sizeChartFile || existingSizeChart) && (
                <div className='relative w-16 h-16 rounded-lg overflow-hidden border border-line'>
                  <img src={sizeChartFile ? URL.createObjectURL(sizeChartFile) : existingSizeChart} alt='' className='w-full h-full object-cover' />
                  <button type='button' onClick={() => { setSizeChartFile(null); setExistingSizeChart('') }} className='absolute top-0.5 right-0.5 w-4 h-4 grid place-items-center rounded-full bg-black/70 text-white'><X size={10} /></button>
                </div>
              )}
              <label className='px-3 py-2 rounded-lg border border-dashed border-line hover:border-accent/60 bg-surface-2 cursor-pointer text-xs text-muted'>
                {sizeChartFile || existingSizeChart ? 'Change' : 'Upload'} chart
                <input type='file' accept='image/*' hidden onChange={onPickSizeChart} />
              </label>
            </div>
          </div>
          <div>
            <span className={lbl}><Film size={11} className='inline mr-1' />Videos (360 / walk-through, ≤2)</span>
            <div className='flex flex-wrap items-center gap-2'>
              {existingVideos.map((url, i) => (
                <span key={'ev' + i} className='inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-surface-2 border border-line text-muted'>
                  video {i + 1}<button type='button' onClick={() => setExistingVideos(v => v.filter((_, idx) => idx !== i))} className='hover:text-danger'><X size={11} /></button>
                </span>
              ))}
              {videoFiles.map((f, i) => (
                <span key={'vf' + i} className='inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-surface-2 border border-line text-fg'>
                  {f.name.slice(0, 14)}<button type='button' onClick={() => setVideoFiles(v => v.filter((_, idx) => idx !== i))} className='hover:text-danger'><X size={11} /></button>
                </span>
              ))}
              {(existingVideos.length + videoFiles.length) < 2 && (
                <label className='px-3 py-1.5 rounded-lg border border-dashed border-line hover:border-accent/60 bg-surface-2 cursor-pointer text-xs text-muted'>
                  + Video<input type='file' accept='video/*' multiple hidden onChange={onPickVideos} />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className='glass rounded-2xl p-4 grid gap-3 sm:grid-cols-12'>
        <div className='sm:col-span-6'><label className={lbl}>Product name</label><input required value={name} onChange={e => setName(e.target.value)} className={inp} placeholder='Oversized Graphic Tee' /></div>
        <div className='sm:col-span-3'><label className={lbl}>MRP ({currency})</label><input required type='number' min='0' value={price} onChange={e => setPrice(e.target.value)} className={inp} placeholder='1299' /></div>
        <div className='sm:col-span-3'><label className={lbl}>Selling price ({currency})</label><input type='number' min='0' value={discountPrice} onChange={e => setDiscountPrice(e.target.value)} className={inp} placeholder='899' /></div>
        <div className='sm:col-span-3'><label className={lbl}>Auto discount</label><div className={inp + ' flex items-center font-semibold ' + (discountPercent ? 'text-accent' : 'text-faint')}>{discountPercent ? `−${discountPercent}%` : '—'}</div></div>
        <div className='sm:col-span-3'><label className={lbl}>Category</label><select value={category} onChange={e => setCategory(e.target.value)} className={inp}>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
        <div className='sm:col-span-3'><label className={lbl}>Sub-category</label><input value={subCategory} onChange={e => setSubCategory(e.target.value)} className={inp} placeholder='Topwear' /></div>
        <div className='sm:col-span-3'><label className={lbl}>Audience</label><select value={audience} onChange={e => setAudience(e.target.value)} className={inp}>{AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
        <div className='sm:col-span-6'><label className={lbl}>Fabric</label><input value={fabric} onChange={e => setFabric(e.target.value)} className={inp} placeholder='100% Cotton' /></div>
        <div className='sm:col-span-6'><label className={lbl}>Short description</label><input value={shortDescription} onChange={e => setShortDescription(e.target.value)} className={inp} placeholder='One-line summary' /></div>
        <div className='sm:col-span-12'><label className={lbl}>Description</label><textarea required value={description} onChange={e => setDescription(e.target.value)} className={inp + ' h-20 resize-none'} placeholder='Full description…' /></div>
        <div className='sm:col-span-12 flex flex-wrap gap-6 pt-1'>
          <Toggle checked={bestseller} onChange={setBestseller} label='Bestseller' />
          <Toggle checked={featured} onChange={setFeatured} label='Featured' />
        </div>
      </div>

      {/* Highlights */}
      <div className='glass rounded-2xl p-4'>
        <div className='flex items-center justify-between mb-3'>
          <span className='flex items-center gap-1.5 text-sm font-heading font-bold text-fg'><Sparkles size={15} className='text-accent' /> Product Highlights</span>
          <div className='flex flex-wrap gap-1.5'>
            {HIGHLIGHT_PRESETS.map(p => <button key={p} type='button' onClick={() => addHL(p)} className='text-[10px] uppercase tracking-widest font-semibold border border-line rounded-lg px-2 py-1 text-muted hover:text-accent hover:border-accent/50'>+ {p}</button>)}
          </div>
        </div>
        <div className='space-y-2'>
          {highlights.map((h, i) => (
            <div key={i} className='grid grid-cols-12 gap-2 items-center'>
              <input value={h.label} onChange={e => updateHL(i, 'label', e.target.value)} className={inp + ' col-span-4'} placeholder='Feature (e.g. Neck)' />
              <input value={h.value} onChange={e => updateHL(i, 'value', e.target.value)} className={inp + ' col-span-7'} placeholder='Value (e.g. Round neck)' />
              <button type='button' onClick={() => removeHL(i)} className='col-span-1 grid place-items-center w-8 h-8 rounded-lg text-faint hover:text-danger hover:bg-danger/10'><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <Btn variant='secondary' size='sm' icon={Plus} type='button' onClick={() => addHL('')} className='mt-2'>Add highlight</Btn>
      </div>

      {/* Variants */}
      <div className='glass rounded-2xl p-4'>
        <div className='flex items-center justify-between mb-3'>
          <span className='flex items-center gap-1.5 text-sm font-heading font-bold text-fg'><Barcode size={15} className='text-accent' /> Colours, Sizes & Stock</span>
          <Btn variant='secondary' size='sm' icon={Plus} type='button' onClick={addVariant}>Add</Btn>
        </div>
        <div className='hidden sm:grid grid-cols-12 gap-2 px-1 mb-1 text-[9px] font-semibold uppercase tracking-widest text-faint'>
          <span className='col-span-3'>Size</span><span className='col-span-4'>Colour</span><span className='col-span-3'>Code</span><span className='col-span-2'>Stock</span>
        </div>
        <div className='space-y-2'>
          {variants.map((v, i) => (
            <div key={i} className='grid grid-cols-12 gap-2 items-center'>
              <select value={v.size} onChange={e => updateVariant(i, 'size', e.target.value)} className={inp + ' col-span-6 sm:col-span-3'}>{SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select>
              <input value={v.color} onChange={e => updateVariant(i, 'color', e.target.value)} className={inp + ' col-span-6 sm:col-span-4'} placeholder='Black' />
              <div className='col-span-7 sm:col-span-3 flex items-center gap-1.5'>
                <input type='color' value={v.colorCode} onChange={e => updateVariant(i, 'colorCode', e.target.value)} className='w-9 h-9 shrink-0 rounded-lg bg-surface-2 border border-line cursor-pointer p-0.5' />
                <input value={v.colorCode} onChange={e => updateVariant(i, 'colorCode', e.target.value)} className={inp} />
              </div>
              <input type='number' min='0' value={v.stock} onChange={e => updateVariant(i, 'stock', e.target.value)} className={inp + ' col-span-4 sm:col-span-2'} />
              <button type='button' onClick={() => removeVariant(i)} disabled={variants.length === 1} className='col-span-1 grid place-items-center w-8 h-8 rounded-lg text-faint hover:text-danger hover:bg-danger/10 disabled:opacity-30'><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <div className='flex items-center justify-between mt-3 pt-2 border-t border-white/5 text-xs'>
          <span className='text-muted'>{validVariants.length} variant(s)</span>
          <span className='text-fg font-semibold'>Total stock: {totalStock}</span>
        </div>
      </div>

      <div className='flex items-center gap-3'>
        <Btn variant='primary' size='md' loading={busy} type='submit'>{busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add Product'}</Btn>
        {onCancel && <Btn variant='ghost' size='md' type='button' onClick={onCancel}>Cancel</Btn>}
      </div>
    </form>
  )
}

export default ProductForm
