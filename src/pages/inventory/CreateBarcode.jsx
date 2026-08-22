import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { backendUrl } from '../../App'
import { toast } from 'react-toastify'
import { ArrowLeft, Download, RefreshCw, FileSpreadsheet, Trash2 } from 'lucide-react'

const cfg = 'w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-line focus:border-accent outline-none'

// Human-readable code preview (mirrors the backend format).
const humanCode = (p, v) => {
  const clean = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  const cat = clean(p.category).slice(0, 3) || 'GEN'
  const nm = clean((p.name || '').split(/\s+/).map((w) => w[0]).join('')).slice(0, 3) || 'PRD'
  return `${(p.productCode || 'LX').slice(0, 6)} ${nm} ${clean(v.size).slice(0, 1)} ${clean(v.color).slice(0, 3)}`
}

const CreateBarcode = ({ token }) => {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [selected, setSelected] = useState('')
  const [labelSize, setLabelSize] = useState('50mm x 30mm')
  const [qty, setQty] = useState('All (Upto Stock)')
  const [recent, setRecent] = useState(() => { try { return JSON.parse(localStorage.getItem('recentBarcodes') || '[]') } catch { return [] } })

  useEffect(() => { axios.get(backendUrl + '/api/product/list?limit=500&all=true').then(({ data }) => data.success && setProducts(data.products)).catch(() => {}) }, [])

  // Flatten product+variant options.
  const options = useMemo(() => {
    const out = []
    products.forEach((p) => (p.variants || []).forEach((v) => out.push({ key: v.sku, p, v })))
    return out
  }, [products])
  const sel = options.find((o) => o.key === selected)

  const previewUrl = sel ? `${backendUrl}/api/inventory/barcode/${encodeURIComponent(sel.v.barcode || sel.v.sku)}?scale=3&h=20` : ''

  const download = async () => {
    if (!sel) return toast.error('Select a product')
    try {
      const url = `${backendUrl}/api/inventory/label-pdf/${encodeURIComponent(sel.v.sku)}?` + new URLSearchParams({ name: sel.p.name, price: sel.p.price, size: sel.v.size, color: sel.v.color, stock: sel.v.stock, code: sel.v.barcode || sel.v.sku, human: sel.v.humanBarcode || humanCode(sel.p, sel.v) }).toString()
      const res = await fetch(url); const blob = await res.blob()
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${sel.v.sku}.pdf`; a.click()
      const entry = { product: `${sel.p.name} (${sel.v.color}, ${sel.v.size})`, value: sel.p.productCode || sel.v.sku, code: sel.v.barcode || sel.v.sku, at: new Date().toISOString() }
      const next = [entry, ...recent].slice(0, 10); setRecent(next); localStorage.setItem('recentBarcodes', JSON.stringify(next))
      toast.success('Barcode generated')
    } catch { toast.error('Download failed') }
  }

  return (
    <div className='p-6'>
      <div className='flex items-start justify-between mb-5'>
        <div>
          <h1 className='text-2xl font-heading font-extrabold text-fg'>Create Barcode</h1>
          <p className='text-xs text-muted mt-1'>Dashboard <span className='text-faint'>›</span> Inventory <span className='text-faint'>›</span> Products <span className='text-faint'>›</span> Create Barcode</p>
        </div>
        <button onClick={() => navigate('/inventory')} className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg hover:bg-surface-2'><ArrowLeft size={15} /> Back to Inventory</button>
      </div>

      <div className='glass rounded-2xl p-6 mb-5'>
        {/* Select product */}
        <div className='mb-5'>
          <p className='flex items-center gap-2 text-sm font-bold text-fg mb-1'>Select Product</p>
          <p className='text-[11px] text-muted mb-2'>Choose a product to generate barcode</p>
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className={cfg}>
            <option value=''>— Select product —</option>
            {options.map((o) => <option key={o.key} value={o.key}>{o.p.productCode || ''} | {o.p.name} | {o.p.fabric || 'N/A'} | Size: {o.v.size} | Colour: {o.v.color} | MRP ₹{o.p.price}</option>)}
          </select>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div>
            <p className='flex items-center gap-2 text-sm font-bold text-fg mb-2'>Barcode Type</p>
            <label className='flex items-center gap-2 text-sm'><input type='radio' checked readOnly className='accent-accent w-4 h-4' /> <span><span className='font-semibold text-fg'>EAN-13</span><br /><span className='text-[11px] text-muted'>Standard product barcode</span></span></label>
            <p className='flex items-center gap-2 text-sm font-bold text-fg mt-4 mb-1'>Barcode Value (Human Readable Code)</p>
            <p className='text-[11px] text-muted'>product code No.+ Product name first letter + Category+ size+ colour first 3 + stock no.</p>
            <input readOnly value={sel ? (sel.v.humanBarcode || humanCode(sel.p, sel.v)) : ''} className={cfg + ' mt-1 font-mono'} placeholder='LX2601 AOT M M BLA 01' />
          </div>
          <div>
            <p className='flex items-center gap-2 text-sm font-bold text-fg mb-2'>Label Size</p>
            <select value={labelSize} onChange={(e) => setLabelSize(e.target.value)} className={cfg}><option>50mm x 30mm</option><option>40mm x 30mm</option><option>60mm x 40mm</option></select>
          </div>
          <div>
            <p className='flex items-center gap-2 text-sm font-bold text-fg mb-2'>Quantity / Copies</p>
            <p className='text-[11px] text-muted mb-1'>Number of barcode labels to generate</p>
            <select value={qty} onChange={(e) => setQty(e.target.value)} className={cfg}><option>All (Upto Stock)</option><option>1</option><option>5</option><option>10</option></select>
          </div>
        </div>

        {/* Preview */}
        <div className='mt-6'>
          <p className='font-heading font-bold text-fg'>Barcode Preview</p>
          <p className='text-[11px] text-muted mb-2'>Preview of your barcode</p>
          <div className='rounded-xl border border-line bg-white h-40 grid place-items-center'>
            {previewUrl ? <img src={previewUrl} alt='barcode' className='max-h-32' /> : <span className='text-sm text-muted'>Select a product to preview</span>}
          </div>
          <div className='flex items-center justify-end gap-2 mt-3'>
            <button onClick={() => setSelected('')} className='px-6 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg hover:bg-surface-2'>Reset</button>
            <button onClick={download} className='inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl bg-accent text-white hover:bg-accent-dark'><Download size={15} /> Generate &amp; Download</button>
          </div>
        </div>
      </div>

      {/* Recent barcodes */}
      <div className='glass rounded-2xl p-5'>
        <div className='flex items-center justify-between mb-4'>
          <p className='font-heading font-bold text-fg'>Recent Barcodes</p>
          <div className='flex items-center gap-2'>
            <button className='inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg bg-white border border-line text-fg'><RefreshCw size={15} /> Refresh</button>
            <button className='inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg bg-white border border-line text-fg'><FileSpreadsheet size={15} className='text-success' /> Export Excel</button>
          </div>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-left text-[11px] font-semibold uppercase tracking-wider text-muted border-b border-line'>
                <th className='py-3 px-3'>S.No</th><th className='py-3 px-3'>Product</th><th className='py-3 px-3'>Barcode Value</th><th className='py-3 px-3'>Barcode</th><th className='py-3 px-3'>Generated On</th><th className='py-3 px-3'>Action</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? <tr><td colSpan={6} className='py-8 text-center text-muted'>No barcodes generated yet.</td></tr> :
                recent.map((r, i) => (
                  <tr key={i} className='border-b border-line/70'>
                    <td className='py-3 px-3 text-muted'>{i + 1}</td>
                    <td className='py-3 px-3 text-fg'>{r.product}</td>
                    <td className='py-3 px-3 font-mono text-accent'>{r.value}</td>
                    <td className='py-3 px-3'><img src={`${backendUrl}/api/inventory/barcode/${encodeURIComponent(r.code)}?scale=2&h=14`} alt='' className='h-8' /></td>
                    <td className='py-3 px-3 text-muted'>{new Date(r.at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className='py-3 px-3'><button onClick={() => { const n = recent.filter((_, idx) => idx !== i); setRecent(n); localStorage.setItem('recentBarcodes', JSON.stringify(n)) }} className='grid place-items-center w-8 h-8 rounded-lg border border-line text-danger'><Trash2 size={14} /></button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default CreateBarcode
