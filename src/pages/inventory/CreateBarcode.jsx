import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { backendUrl, currency } from '../../App'
import { toast } from 'react-toastify'
import { ArrowLeft, Download, RefreshCw, FileSpreadsheet, ChevronDown, Printer } from 'lucide-react'
import { exportToCsv } from '../../utils/exportCsv'

// Barcodes are generated per PRODUCT CODE from inventory (stock is separate from products).
const CreateBarcode = ({ token }) => {
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState({})

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${backendUrl}/api/inventory/items`, { params: { search: q }, headers: { token } })
      if (data.success) setGroups(data.groups || []); else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load inventory') }
    finally { setLoading(false) }
  }
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [q])
  const toggle = (code) => setOpen((o) => ({ ...o, [code]: !o[code] }))

  const dl = async (url, filename) => {
    try {
      const res = await fetch(url, { headers: { token } })
      if (!res.ok || (res.headers.get('content-type') || '').includes('application/json')) return toast.error('Nothing to download')
      const blob = await res.blob(); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); URL.revokeObjectURL(a.href)
    } catch { toast.error('Download failed') }
  }
  const downloadItem = (it) => dl(`${backendUrl}/api/inventory/items/label-pdf/${it._id}`, `${it.productCode}-${it.size}-${it.color}.pdf`)
  const downloadCode = (code) => dl(`${backendUrl}/api/inventory/items/barcodes/pdf?code=${encodeURIComponent(code)}`, `barcodes-${code}.pdf`)

  const allRows = useMemo(() => groups.flatMap((g) => g.items), [groups])
  const exportExcel = () => allRows.length ? exportToCsv('barcodes', allRows.map((r) => ({ 'Product Code': r.productCode, Size: r.size, Colour: r.color, SKU: r.sku, Barcode: r.barcode, 'Human Code': r.humanBarcode, MRP: r.mrp }))) : toast.error('No barcodes to export')

  return (
    <div className='p-6'>
      <div className='flex items-start justify-between mb-5'>
        <div>
          <h1 className='text-2xl font-heading font-extrabold text-fg'>Create Barcode</h1>
          <p className='text-xs text-muted mt-1'>Dashboard <span className='text-faint'>›</span> Inventory <span className='text-faint'>›</span> Barcodes — by product code</p>
        </div>
        <div className='flex items-center gap-2'>
          <button onClick={exportExcel} className='inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><FileSpreadsheet size={15} className='text-success' /> Export Excel</button>
          <button onClick={load} className='inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><RefreshCw size={15} /> Refresh</button>
          <button onClick={() => navigate('/inventory')} className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><ArrowLeft size={15} /> Back</button>
        </div>
      </div>

      <div className='glass rounded-2xl p-5'>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder='Search by product code, category…' className='w-full max-w-sm px-3 py-2 text-sm rounded-lg bg-white border border-line mb-4' />
        {loading ? <div className='space-y-3'>{[0, 1, 2].map((i) => <div key={i} className='skeleton h-14 rounded-xl' />)}</div> :
          groups.length === 0 ? <p className='py-12 text-center text-muted'>No inventory yet — add stock in <b>Inventory → Add Inventory</b> to generate barcodes.</p> :
            <div className='space-y-4'>
              {groups.map((g) => (
                <div key={g.productCode} className='rounded-xl border border-line overflow-hidden'>
                  <div className='flex items-center justify-between px-4 py-3 bg-surface-2'>
                    <button onClick={() => toggle(g.productCode)} className='flex items-center gap-3 min-w-0'>
                      <ChevronDown size={16} className={`text-muted transition-transform ${open[g.productCode] ? 'rotate-180' : ''}`} />
                      <span className='font-mono font-bold text-accent'>{g.productCode}</span>
                      <span className='text-xs text-muted truncate'>{[g.category, g.subCategory, g.childCategory].filter(Boolean).join(' › ') || '—'}</span>
                      <span className='text-xs font-semibold text-fg'>· {g.items.length} barcode(s)</span>
                    </button>
                    <button onClick={() => downloadCode(g.productCode)} className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-accent text-white hover:bg-accent-dark'><Printer size={13} /> Download all</button>
                  </div>
                  {open[g.productCode] && (
                    <table className='w-full text-sm'>
                      <thead><tr className='text-left text-[11px] font-semibold uppercase tracking-wider text-muted border-b border-line'>
                        <th className='py-2.5 px-3'>Size</th><th className='py-2.5 px-3'>Colour</th><th className='py-2.5 px-3'>Barcode Preview</th><th className='py-2.5 px-3'>Human Code</th><th className='py-2.5 px-3'>MRP</th><th className='py-2.5 px-3'>Download</th>
                      </tr></thead>
                      <tbody>
                        {g.items.map((it) => (
                          <tr key={it._id} className='border-b border-line/60 last:border-0'>
                            <td className='py-2.5 px-3 text-fg'>{it.size}</td>
                            <td className='py-2.5 px-3 text-fg'>{it.color}</td>
                            <td className='py-2.5 px-3'><img src={`${backendUrl}/api/inventory/barcode/${encodeURIComponent(it.barcode || it.sku)}?scale=2&h=14`} alt='' className='h-9' /></td>
                            <td className='py-2.5 px-3 font-mono text-[11px] text-muted'>{it.humanBarcode || '—'}</td>
                            <td className='py-2.5 px-3 text-fg'>{currency}{it.mrp}</td>
                            <td className='py-2.5 px-3'><button onClick={() => downloadItem(it)} className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-line text-fg hover:bg-surface-2'><Download size={13} /> Tag</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>}
      </div>
    </div>
  )
}

export default CreateBarcode
