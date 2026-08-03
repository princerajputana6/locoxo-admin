import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Plus, Trash2, PackagePlus, CheckCircle2, AlertCircle, ImagePlus, X } from 'lucide-react'
import { Modal, Btn } from './index.js'
import { backendUrl } from '../../App'

const blankRow = { name: '', price: '', category: 'Men', size: 'M', color: 'Default', stock: '0', image: null, preview: '' }
const MAX_IMAGE_MB = 5 // keep in sync with backend middleware/multer.js

const BulkAddModal = ({ open, onClose, token, onDone }) => {
  const [rows, setRows] = useState([{ ...blankRow }])
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)

  const update = (i, field, value) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)))

  const setImage = (i, file) => {
    if (file) {
      if (!file.type.startsWith('image/')) return toast.error('Only image files are allowed')
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) return toast.error(`Image must be under ${MAX_IMAGE_MB}MB`)
    }
    setRows((r) => r.map((row, idx) => {
      if (idx !== i) return row
      if (row.preview) URL.revokeObjectURL(row.preview)
      return { ...row, image: file || null, preview: file ? URL.createObjectURL(file) : '' }
    }))
  }

  const addRow = () => setRows((r) => [...r, { ...blankRow }])
  const removeRow = (i) => setRows((r) => r.filter((_, idx) => idx !== i))

  const reset = () => { setRows([{ ...blankRow }]); setResult(null) }

  const close = () => { reset(); onClose() }

  const submit = async () => {
    // Build variants for each row. A row becomes one product with one variant.
    // Keep the file alongside so we can align image_<index> with the products array.
    const items = rows
      .map((r) => ({
        product: {
          name: r.name.trim(),
          price: r.price,
          category: r.category,
          brand: 'LOCOXO',
          variants: [{ size: r.size || 'Free', color: r.color || 'Default', stock: Number(r.stock) || 0 }],
        },
        file: r.image,
      }))
      .filter((x) => x.product.name && x.product.price !== '')

    if (items.length === 0) {
      toast.error('Add at least one product with a name and price')
      return
    }

    // Multipart: products JSON + optional per-row image files (image_<index>).
    const fd = new FormData()
    fd.append('products', JSON.stringify(items.map((x) => x.product)))
    items.forEach((x, idx) => { if (x.file) fd.append(`image_${idx}`, x.file) })

    setBusy(true)
    setResult(null)
    try {
      const { data } = await axios.post(
        backendUrl + '/api/inventory/bulk-add',
        fd,
        { headers: { token } }
      )
      if (data.success) {
        setResult(data)
        toast.success(data.message)
        if (data.created?.length && onDone) onDone()
      } else {
        toast.error(data.message || 'Bulk add failed')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setBusy(false)
    }
  }

  const validCount = rows.filter((r) => r.name.trim() && r.price !== '').length

  return (
    <Modal
      open={open}
      onClose={close}
      icon={PackagePlus}
      title='Bulk Add Products'
      subtitle='Enter products — SKU & barcode auto-generated per variant'
      size='xl'
      footer={
        <>
          <span className='text-xs text-muted mr-auto'>{validCount} valid row(s)</span>
          <Btn variant='ghost' size='sm' onClick={close}>Close</Btn>
          {!result ? (
            <Btn variant='primary' size='sm' icon={Plus} loading={busy} onClick={submit} disabled={validCount === 0}>
              {busy ? 'Creating…' : `Create ${validCount || ''} product(s)`}
            </Btn>
          ) : (
            <Btn variant='primary' size='sm' icon={Plus} onClick={reset}>Add more</Btn>
          )}
        </>
      }
    >
      {result ? (
        <ResultPanel result={result} />
      ) : (
        <div className='space-y-4'>
          {/* column hints */}
          <div className='hidden md:grid grid-cols-[1.6fr_0.7fr_0.9fr_0.6fr_0.9fr_0.6fr_44px_36px] gap-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-faint'>
            <span>Product name *</span><span>Price ₹ *</span><span>Category</span><span>Size</span><span>Color</span><span>Stock</span><span>Image</span><span /></div>

          <div className='space-y-2 max-h-[46vh] overflow-y-auto pr-1'>
            {rows.map((r, i) => (
              <div
                key={i}
                className='grid grid-cols-1 md:grid-cols-[1.6fr_0.7fr_0.9fr_0.6fr_0.9fr_0.6fr_44px_36px] gap-2 items-center animate-fade-in'
              >
                <input
                  value={r.name}
                  onChange={(e) => update(i, 'name', e.target.value)}
                  placeholder='e.g. Cotton Tee'
                  className='px-3 py-2 text-sm rounded-lg bg-surface-2 border border-line text-fg placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none'
                />
                <input
                  type='number'
                  value={r.price}
                  onChange={(e) => update(i, 'price', e.target.value)}
                  placeholder='499'
                  className='px-3 py-2 text-sm rounded-lg bg-surface-2 border border-line text-fg placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none'
                />
                <select
                  value={r.category}
                  onChange={(e) => update(i, 'category', e.target.value)}
                  className='px-3 py-2 text-sm rounded-lg bg-surface-2 border border-line text-fg focus:border-accent outline-none'
                >
                  {['Men', 'Women', 'Kids', 'Anime', 'Super Hero'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={r.size}
                  onChange={(e) => update(i, 'size', e.target.value)}
                  className='px-3 py-2 text-sm rounded-lg bg-surface-2 border border-line text-fg focus:border-accent outline-none'
                >
                  {['Free', 'XS', 'S', 'M', 'L', 'XL', 'XXL'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input
                  value={r.color}
                  onChange={(e) => update(i, 'color', e.target.value)}
                  placeholder='Black'
                  className='px-3 py-2 text-sm rounded-lg bg-surface-2 border border-line text-fg placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none'
                />
                <input
                  type='number'
                  value={r.stock}
                  onChange={(e) => update(i, 'stock', e.target.value)}
                  placeholder='0'
                  className='px-3 py-2 text-sm rounded-lg bg-surface-2 border border-line text-fg focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none'
                />
                {/* Image picker (optional) */}
                <div className='relative w-11 h-11 shrink-0'>
                  <label
                    title={r.image ? 'Change image' : 'Add image (optional)'}
                    className='grid place-items-center w-11 h-11 rounded-lg border border-line bg-surface-2 text-faint hover:text-accent hover:border-accent/50 cursor-pointer overflow-hidden transition-colors'
                  >
                    {r.preview
                      ? <img src={r.preview} alt='' className='w-full h-full object-cover' />
                      : <ImagePlus size={15} />}
                    <input
                      type='file'
                      accept='image/*'
                      className='hidden'
                      onChange={(e) => setImage(i, e.target.files?.[0] || null)}
                    />
                  </label>
                  {r.image && (
                    <button
                      type='button'
                      onClick={() => setImage(i, null)}
                      title='Remove image'
                      className='absolute -top-1.5 -right-1.5 grid place-items-center w-4 h-4 rounded-full bg-danger text-white shadow'
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => removeRow(i)}
                  disabled={rows.length === 1}
                  className='grid place-items-center w-9 h-9 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-30'
                  title='Remove row'
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <Btn variant='secondary' size='sm' icon={Plus} onClick={addRow}>Add row</Btn>

          <p className='text-[11px] text-faint'>
            Tip: each row creates one product with one variant. Add an image per row if you like (optional — a placeholder is used otherwise). The server auto-assigns a unique SKU and Code-128 barcode to every variant.
          </p>
        </div>
      )}
    </Modal>
  )
}

const ResultPanel = ({ result }) => (
  <div className='space-y-4 animate-fade-in'>
    <div className='grid grid-cols-2 gap-3'>
      <div className='glass rounded-xl p-4 border border-success/30'>
        <CheckCircle2 className='text-success mb-1' size={20} />
        <p className='text-3xl font-heading font-extrabold text-success'>{result.created?.length || 0}</p>
        <p className='text-xs text-muted'>products created</p>
      </div>
      <div className={`glass rounded-xl p-4 ${result.errors?.length ? 'border border-danger/30' : 'border-line'}`}>
        <AlertCircle className={result.errors?.length ? 'text-danger' : 'text-muted'} size={20} />
        <p className={`text-3xl font-heading font-extrabold ${result.errors?.length ? 'text-danger' : 'text-muted'}`}>{result.errors?.length || 0}</p>
        <p className='text-xs text-muted'>failed</p>
      </div>
    </div>

    {result.created?.length > 0 && (
      <div>
        <p className='text-[11px] font-semibold uppercase tracking-widest text-faint mb-2'>Created products</p>
        <div className='space-y-1.5 max-h-40 overflow-y-auto'>
          {result.created.map((c, i) => (
            <div key={i} className='flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-surface-2 border border-line text-sm'>
              <span className='truncate text-fg'>{c.name}</span>
              <span className='text-xs text-muted shrink-0'>{c.variants} variant(s)</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {result.errors?.length > 0 && (
      <div>
        <p className='text-[11px] font-semibold uppercase tracking-widest text-danger mb-2'>Errors</p>
        <div className='space-y-1.5 max-h-32 overflow-y-auto'>
          {result.errors.map((e, i) => (
            <div key={i} className='px-3 py-2 rounded-lg bg-danger/10 border border-danger/20 text-sm'>
              <span className='text-fg font-medium'>Row {e.row}{e.name ? ` · ${e.name}` : ''}:</span>{' '}
              <span className='text-danger'>{e.error}</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)

export default BulkAddModal
