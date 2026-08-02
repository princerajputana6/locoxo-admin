import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import { PackagePlus, ImagePlus, Plus, Trash2, X, Barcode } from 'lucide-react'
import { PageHeader, Btn, Toggle } from '../components/ui'

const SIZE_OPTIONS = ['Free', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38']
const MAX_IMAGES = 5
const blankVariant = () => ({ size: 'M', color: 'Black', colorCode: '#000000', stock: 0 })
const inp = 'w-full px-3 py-2 text-sm rounded-lg bg-surface-2 border border-line text-fg placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all'
const lbl = 'block text-[10px] font-semibold uppercase tracking-wider text-faint mb-1'

const Add = ({ token }) => {
  const [images, setImages] = useState([]) // File[]
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [discountPrice, setDiscountPrice] = useState('')
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('Topwear')
  const [brand, setBrand] = useState('LOCOXO')
  const [bestseller, setBestseller] = useState(false)
  const [featured, setFeatured] = useState(false)
  const [variants, setVariants] = useState([blankVariant()])
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
  }, [])

  const onPickImages = (e) => {
    const files = [...e.target.files]
    setImages(prev => [...prev, ...files].slice(0, MAX_IMAGES))
    e.target.value = ''
  }
  const removeImage = (i) => setImages(prev => prev.filter((_, idx) => idx !== i))

  const updateVariant = (i, f, val) => setVariants(v => v.map((r, idx) => idx === i ? { ...r, [f]: val } : r))
  const addVariant = () => setVariants(v => [...v, blankVariant()])
  const removeVariant = (i) => setVariants(v => v.filter((_, idx) => idx !== i))

  const validVariants = useMemo(() => variants.filter(v => v.size && v.color), [variants])
  const totalStock = validVariants.reduce((s, v) => s + (Number(v.stock) || 0), 0)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (images.length === 0) return toast.error('Add at least one product image')
    if (validVariants.length === 0) return toast.error('Add at least one variant (size + color) so the product has stock & a barcode')
    setBusy(true)
    try {
      const sizes = [...new Set(validVariants.map(v => v.size))]
      const cleanVariants = validVariants.map(v => ({ size: v.size, color: v.color, colorCode: v.colorCode, stock: Number(v.stock) || 0 }))
      const fd = new FormData()
      fd.append('name', name); fd.append('description', description); fd.append('price', price)
      if (discountPrice) fd.append('discountPrice', discountPrice)
      fd.append('category', category); fd.append('subCategory', subCategory); fd.append('brand', brand)
      fd.append('bestseller', bestseller); fd.append('featured', featured)
      fd.append('sizes', JSON.stringify(sizes)); fd.append('variants', JSON.stringify(cleanVariants))
      images.forEach((img, i) => fd.append(`image${i + 1}`, img))
      const { data } = await axios.post(backendUrl + '/api/product/add', fd, { headers: { token } })
      if (data.success) {
        toast.success(`${data.message} — ${cleanVariants.length} variant(s) with auto barcodes`)
        setName(''); setDescription(''); setPrice(''); setDiscountPrice('')
        setImages([]); setVariants([blankVariant()]); setBestseller(false); setFeatured(false)
      } else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || err.message) }
    finally { setBusy(false) }
  }

  return (
    <div className='p-6'>
      <PageHeader icon={PackagePlus} title='Add Product' subtitle='Compact form — variants get auto SKU + barcode' />

      <form onSubmit={onSubmit} className='space-y-4 max-w-5xl'>
        {/* Images — multi-upload up to 5 */}
        <div className='glass rounded-2xl p-4'>
          <div className='flex items-center justify-between mb-3'>
            <span className={lbl + ' mb-0'}>Images · {images.length}/{MAX_IMAGES}</span>
            <span className='text-[11px] text-faint'>First image = thumbnail</span>
          </div>
          <div className='flex flex-wrap gap-2'>
            {images.map((img, i) => (
              <div key={i} className='relative w-20 h-20 rounded-lg overflow-hidden border border-line group'>
                <img src={URL.createObjectURL(img)} alt='' className='w-full h-full object-cover' />
                <button type='button' onClick={() => removeImage(i)}
                  className='absolute top-0.5 right-0.5 w-5 h-5 grid place-items-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity'>
                  <X size={12} />
                </button>
                {i === 0 && <span className='absolute bottom-0 inset-x-0 text-[8px] text-center bg-accent text-brand-deep font-bold'>MAIN</span>}
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <label className='w-20 h-20 rounded-lg border-2 border-dashed border-line hover:border-accent/60 bg-surface-2 grid place-items-center cursor-pointer transition-colors'>
                <div className='flex flex-col items-center text-faint'>
                  <ImagePlus size={18} /><span className='text-[9px] mt-0.5'>Add</span>
                </div>
                <input type='file' accept='image/*' multiple hidden onChange={onPickImages} />
              </label>
            )}
          </div>
        </div>

        {/* Details — dense grid */}
        <div className='glass rounded-2xl p-4 grid gap-3 sm:grid-cols-12'>
          <div className='sm:col-span-6'><label className={lbl}>Product name</label><input required value={name} onChange={e => setName(e.target.value)} className={inp} placeholder='Oversized Graphic Tee' /></div>
          <div className='sm:col-span-3'><label className={lbl}>Price ({currency})</label><input required type='number' min='0' value={price} onChange={e => setPrice(e.target.value)} className={inp} placeholder='899' /></div>
          <div className='sm:col-span-3'><label className={lbl}>Discount ({currency})</label><input type='number' min='0' value={discountPrice} onChange={e => setDiscountPrice(e.target.value)} className={inp} placeholder='699' /></div>
          <div className='sm:col-span-4'><label className={lbl}>Category</label><select value={category} onChange={e => setCategory(e.target.value)} className={inp}>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div className='sm:col-span-4'><label className={lbl}>Sub-category</label><input value={subCategory} onChange={e => setSubCategory(e.target.value)} className={inp} placeholder='Topwear' /></div>
          <div className='sm:col-span-4'><label className={lbl}>Brand</label><input value={brand} onChange={e => setBrand(e.target.value)} className={inp} /></div>
          <div className='sm:col-span-12'><label className={lbl}>Description</label><textarea required value={description} onChange={e => setDescription(e.target.value)} className={inp + ' h-16 resize-none'} placeholder='Short description…' /></div>
          <div className='sm:col-span-12 flex flex-wrap gap-6 pt-1'>
            <Toggle checked={bestseller} onChange={setBestseller} label='Bestseller' />
            <Toggle checked={featured} onChange={setFeatured} label='Featured' />
          </div>
        </div>

        {/* Variants — compact rows */}
        <div className='glass rounded-2xl p-4'>
          <div className='flex items-center justify-between mb-3'>
            <span className='flex items-center gap-1.5 text-sm font-heading font-bold text-fg'><Barcode size={15} className='text-accent' /> Variants & Stock</span>
            <Btn variant='secondary' size='sm' icon={Plus} type='button' onClick={addVariant}>Add</Btn>
          </div>
          {/* column hints */}
          <div className='hidden sm:grid grid-cols-12 gap-2 px-1 mb-1 text-[9px] font-semibold uppercase tracking-widest text-faint'>
            <span className='col-span-3'>Size</span><span className='col-span-4'>Color</span><span className='col-span-3'>Code</span><span className='col-span-2'>Stock</span>
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
                <button type='button' onClick={() => removeVariant(i)} disabled={variants.length === 1}
                  className='col-span-1 grid place-items-center w-8 h-8 rounded-lg text-faint hover:text-danger hover:bg-danger/10 disabled:opacity-30 transition-colors'><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <div className='flex items-center justify-between mt-3 pt-2 border-t border-white/5 text-xs'>
            <span className='text-muted'>{validVariants.length} variant(s)</span>
            <span className='text-fg font-semibold'>Total stock: {totalStock}</span>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <Btn variant='primary' size='md' icon={PackagePlus} loading={busy} type='submit'>{busy ? 'Adding…' : 'Add Product'}</Btn>
          <span className='text-[11px] text-faint'>Many products? Use <span className='text-accent font-semibold'>Inventory → Bulk Add</span>.</span>
        </div>
      </form>
    </div>
  )
}

export default Add
