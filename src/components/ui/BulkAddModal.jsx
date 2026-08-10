import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Plus, Trash2, PackagePlus, CheckCircle2, AlertCircle, ImagePlus, X, RefreshCw, Barcode } from 'lucide-react'
import { Modal, Btn } from './index.js'
import { backendUrl } from '../../App'

const AUDIENCES = ['Male', 'Female', 'Unisex', 'Child']
const SIZES = ['Free', 'XS', 'S', 'M', 'L', 'XL', 'XXL']
const blankRow = { name: '', mrp: '', audience: 'Male', size: 'M', color: 'Black', stock: '0', lowStock: '5', image: null, preview: '' }
const MAX_IMAGE_MB = 5 // keep in sync with backend middleware/multer.js

// Mirror the backend's human-readable barcode format for a live preview.
const clean = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]+/g, '')
const humanBarcode = ({ audience, name, size, color, stock }) => {
  const cat = clean(String(audience || '').split(/\s+/)[0]).slice(0, 6) || 'GEN'
  const nm = clean(String(name || '').trim().split(/\s+/).slice(0, 2).join('')).slice(0, 8) || 'PRD'
  const sz = clean(size).slice(0, 4) || 'FR'
  const col = clean(color).slice(0, 3) || 'CLR'
  return `${cat}-${nm}-${sz}-${col}-${Number(stock) || 0}`
}

const BulkAddModal = ({ open, onClose, token, onDone }) => {
  const [rows, setRows] = useState([{ ...blankRow }])
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [nextCode, setNextCode] = useState('')

  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  const loadNextCode = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/inventory/next-code', { headers: { token } })
      if (data.success) setNextCode(data.productCode)
    } catch { /* non-blocking preview */ }
  }
  useEffect(() => { if (open) loadNextCode() }, [open])

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
  const reset = () => { setRows([{ ...blankRow }]); setResult(null); loadNextCode() }
  const close = () => { reset(); onClose() }

  const submit = async () => {
    // Each row → one product with one variant. Product Code, SKU, EAN-13 barcode
    // and human-readable label are auto-generated server-side on save.
    const items = rows
      .map((r) => ({
        product: {
          name: r.name.trim(),
          price: r.mrp,                       // MRP
          audience: r.audience,               // Male/Female/Unisex/Child
          category: r.audience,               // seed merchandising category (refine in Product Mgmt)
          lowStockThreshold: Number(r.lowStock) || 5,
          brand: 'LOCOXO',
          variants: [{ size: r.size || 'Free', color: r.color || 'Default', stock: Number(r.stock) || 0 }],
        },
        file: r.image,
      }))
      .filter((x) => x.product.name && x.product.price !== '')

    if (items.length === 0) {
      toast.error('Add at least one product with a name and MRP')
      return
    }

    const fd = new FormData()
    fd.append('products', JSON.stringify(items.map((x) => x.product)))
    items.forEach((x, idx) => { if (x.file) fd.append(`image_${idx}`, x.file) })

    setBusy(true)
    setResult(null)
    try {
      const { data } = await axios.post(backendUrl + '/api/inventory/bulk-add', fd, { headers: { token } })
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

  const validCount = rows.filter((r) => r.name.trim() && r.mrp !== '').length
  const inp = 'px-3 py-2 text-sm rounded-lg bg-surface-2 border border-line text-fg placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none'

  return (
    <Modal
      open={open}
      onClose={close}
      icon={PackagePlus}
      title='Bulk Add Products'
      subtitle='Product code · SKU · EAN-13 barcode auto-generated per variant'
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
          {/* Batch meta: date + next product code */}
          <div className='flex flex-wrap items-center gap-3 text-xs'>
            <span className='px-2.5 py-1 rounded-lg bg-surface-2 border border-line text-muted'>
              Date: <span className='text-fg font-semibold'>{today}</span>
            </span>
            <span className='inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/30 text-accent font-mono font-semibold'>
              Next code: {nextCode || '—'}
              <button type='button' onClick={loadNextCode} title='Refresh' className='hover:text-fg'><RefreshCw size={12} /></button>
            </span>
            <span className='text-faint'>Codes are assigned sequentially on save.</span>
          </div>

          {/* column hints */}
          <div className='hidden lg:grid grid-cols-[1.5fr_0.9fr_0.7fr_0.6fr_0.9fr_0.55fr_0.6fr_44px_32px] gap-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-faint'>
            <span>Product name *</span><span>Category</span><span>MRP ₹ *</span><span>Size</span><span>Colour</span><span>Stock</span><span>Low @</span><span>Img</span><span /></div>

          <div className='space-y-3 max-h-[44vh] overflow-y-auto pr-1'>
            {rows.map((r, i) => (
              <div key={i} className='space-y-1 animate-fade-in'>
                <div className='grid grid-cols-2 lg:grid-cols-[1.5fr_0.9fr_0.7fr_0.6fr_0.9fr_0.55fr_0.6fr_44px_32px] gap-2 items-center'>
                  <input value={r.name} onChange={(e) => update(i, 'name', e.target.value)} placeholder='e.g. Cotton Tee' className={inp} />
                  <select value={r.audience} onChange={(e) => update(i, 'audience', e.target.value)} className={inp}>
                    {AUDIENCES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input type='number' min='0' value={r.mrp} onChange={(e) => update(i, 'mrp', e.target.value)} placeholder='499' className={inp} />
                  <select value={r.size} onChange={(e) => update(i, 'size', e.target.value)} className={inp}>
                    {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input value={r.color} onChange={(e) => update(i, 'color', e.target.value)} placeholder='Black' className={inp} />
                  <input type='number' min='0' value={r.stock} onChange={(e) => update(i, 'stock', e.target.value)} placeholder='0' className={inp} />
                  <input type='number' min='0' value={r.lowStock} onChange={(e) => update(i, 'lowStock', e.target.value)} placeholder='5' className={inp} />
                  <div className='relative w-11 h-11 shrink-0'>
                    <label title={r.image ? 'Change image' : 'Add image (optional)'}
                      className='grid place-items-center w-11 h-11 rounded-lg border border-line bg-surface-2 text-faint hover:text-accent hover:border-accent/50 cursor-pointer overflow-hidden transition-colors'>
                      {r.preview ? <img src={r.preview} alt='' className='w-full h-full object-cover' /> : <ImagePlus size={15} />}
                      <input type='file' accept='image/*' className='hidden' onChange={(e) => setImage(i, e.target.files?.[0] || null)} />
                    </label>
                    {r.image && (
                      <button type='button' onClick={() => setImage(i, null)} title='Remove image'
                        className='absolute -top-1.5 -right-1.5 grid place-items-center w-4 h-4 rounded-full bg-danger text-white shadow'><X size={10} /></button>
                    )}
                  </div>
                  <button onClick={() => removeRow(i)} disabled={rows.length === 1}
                    className='grid place-items-center w-9 h-9 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-30' title='Remove row'>
                    <Trash2 size={15} />
                  </button>
                </div>
                {/* live human-readable barcode preview */}
                {r.name.trim() && (
                  <div className='flex items-center gap-1.5 pl-1 text-[10px] text-faint'>
                    <Barcode size={12} className='text-accent/70' />
                    <span className='font-mono'>{humanBarcode(r)}</span>
                    <span className='text-line'>·</span>
                    <span>EAN-13 (890…) generated on save</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Btn variant='secondary' size='sm' icon={Plus} onClick={addRow}>Add row</Btn>

          <p className='text-[11px] text-faint'>
            Each row creates one product with one variant. Category is the audience group (Male / Female / Unisex / Child).
            The server assigns a sequential <span className='text-accent font-semibold'>LX product code</span>, a unique SKU,
            an Indian <span className='text-accent font-semibold'>EAN-13</span> scannable barcode and the human-readable label shown above.
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
              <span className='flex items-center gap-3 shrink-0'>
                {c.productCode && <span className='font-mono text-xs text-accent'>{c.productCode}</span>}
                <span className='text-xs text-muted'>{c.variants} variant(s)</span>
              </span>
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
