import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { backendUrl, currency } from '../../App'
import { toast } from 'react-toastify'
import {
  Package, PackageCheck, AlertTriangle, PackageX, Wallet, Hash, Upload, Barcode,
  RefreshCw, PlusCircle, ArrowRight, Search,
} from 'lucide-react'

const Stat = ({ icon: Icon, label, value, sub, tone, onClick }) => {
  const tones = {
    blue: 'bg-accent/10 text-accent', green: 'bg-success/10 text-success',
    amber: 'bg-amber/10 text-amber', red: 'bg-danger/10 text-danger', violet: 'bg-violet/10 text-violet',
  }
  return (
    <div onClick={onClick} className={`glass rounded-2xl p-4 ${onClick ? 'cursor-pointer card-hover' : ''}`}>
      <div className='flex items-start justify-between'>
        <div>
          <p className='text-xs font-medium text-muted'>{label}</p>
          <p className='text-2xl font-heading font-extrabold text-fg mt-1'>{value}</p>
        </div>
        <span className={`grid place-items-center w-10 h-10 rounded-xl ${tones[tone]}`}><Icon size={18} /></span>
      </div>
      {sub && <p className='text-[11px] text-muted mt-1'>{sub}</p>}
    </div>
  )
}

const Panel = ({ title, tone, items, cta, onCta, action }) => (
  <div className='glass rounded-2xl overflow-hidden'>
    <div className={`flex items-center justify-between px-4 py-3 border-b border-line ${tone}`}>
      <p className='font-heading font-bold text-sm'>{title}</p>
      <button onClick={onCta} className='text-xs font-semibold text-accent inline-flex items-center gap-1 hover:underline'>{cta} <ArrowRight size={12} /></button>
    </div>
    <div className='divide-y divide-line/70'>
      {items.length === 0 ? <p className='px-4 py-6 text-center text-sm text-muted'>Nothing here.</p> :
        items.slice(0, 3).map((r) => (
          <div key={r._id} className='flex items-center justify-between px-4 py-3'>
            <div className='min-w-0'>
              <p className='text-sm font-semibold text-fg truncate'>{r.name}</p>
              <p className='text-[11px] text-muted'>SKU: {r.sku || '—'}</p>
            </div>
            {action ? <button className='px-3 py-1.5 text-xs font-semibold rounded-lg border border-success/40 text-success hover:bg-success/5'>Add Stock</button>
              : <span className={`px-2 py-1 rounded-md text-[11px] font-semibold ${r.status === 'Out of Stock' ? 'bg-danger/10 text-danger' : 'bg-amber/10 text-amber'}`}>{r.status === 'Out of Stock' ? 'Out of Stock' : `Stock: ${r.stockQty}`}</span>}
          </div>
        ))}
    </div>
  </div>
)

const InventoryOverview = ({ token }) => {
  const navigate = useNavigate()
  const [d, setD] = useState(null)
  const [q, setQ] = useState('')

  const load = async () => {
    try { const { data } = await axios.get(backendUrl + '/api/inventory/overview', { headers: { token } }); if (data.success) setD(data); else toast.error(data.message) }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to load overview') }
  }
  useEffect(() => { load() }, [])

  const s = d?.summary
  const rows = (d?.stockRows || []).filter((r) => !q || `${r.name} ${r.productCode} ${r.sku}`.toLowerCase().includes(q.toLowerCase()))

  const actionBtns = (
    <div className='flex items-center gap-2'>
      <button onClick={() => navigate('/inventory/stock-details')} className='px-3.5 py-2 text-sm font-semibold rounded-xl border-2 border-accent text-accent hover:bg-accent/5'>Stock Details</button>
      <button onClick={() => navigate('/inventory/product-code')} className='inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-accent text-white hover:bg-accent-dark'><PlusCircle size={15} /> Create Product Code</button>
      <button onClick={() => navigate('/inventory/bulk-add')} className='inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-white border border-line text-fg hover:bg-surface-2'><Upload size={15} /> Bulk Add</button>
      <button onClick={() => navigate('/inventory/barcode')} className='inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-white border border-line text-fg hover:bg-surface-2'><Barcode size={15} /> Barcode</button>
      <button onClick={load} className='inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl bg-white border border-line text-fg hover:bg-surface-2'><RefreshCw size={15} /> Refresh</button>
    </div>
  )

  return (
    <div className='p-6'>
      <div className='flex items-start justify-between mb-5 flex-wrap gap-3'>
        <div>
          <h1 className='text-2xl font-heading font-extrabold text-fg'>Inventory Overview</h1>
          <p className='text-xs text-muted mt-1'>Dashboard <span className='text-faint'>›</span> Inventory</p>
        </div>
        {actionBtns}
      </div>

      {/* Stat cards */}
      <div className='grid grid-cols-2 md:grid-cols-5 gap-3 mb-5'>
        <Stat icon={Package} label='Total Products' value={s?.totalProducts ?? '—'} sub='View all products →' tone='blue' onClick={() => navigate('/inventory/stock-details')} />
        <Stat icon={PackageCheck} label='In Stock' value={s?.inStock ?? '—'} sub={s ? `${s.inStockPct}% of total` : ''} tone='green' />
        <Stat icon={AlertTriangle} label='Low Stock' value={s?.lowStock ?? '—'} sub={s ? `${s.lowStockPct}% of total` : ''} tone='amber' />
        <Stat icon={PackageX} label='Out of Stock' value={s?.outOfStock ?? '—'} sub={s ? `${s.outStockPct}% of total` : ''} tone='red' />
        <Stat icon={Wallet} label='Total Stock Value' value={s ? `${currency}${(s.totalValue || 0).toLocaleString('en-IN')}` : '—'} sub='View details →' tone='violet' />
      </div>

      {/* Panels */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-3 mb-5'>
        <Panel title='Out-of-Stock Products' tone='bg-danger/5 text-danger' items={d?.outOfStock || []} cta='View all' onCta={() => navigate('/inventory/stock-details')} />
        <Panel title='Low-Stock Alerts' tone='bg-amber/5 text-amber' items={d?.lowStock || []} cta='View all' onCta={() => navigate('/inventory/stock-details')} />
        <Panel title='Restock Products' tone='bg-success/5 text-success' items={d?.outOfStock || []} cta='View all' onCta={() => navigate('/inventory/bulk-add')} action />
      </div>

      {/* Product-wise stock list + adjustment history */}
      <div className='grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-3'>
        <div className='glass rounded-2xl p-5'>
          <div className='flex items-center justify-between gap-3 mb-4'>
            <p className='font-heading font-bold text-fg'>Product Wise Stock List</p>
            <div className='relative w-64'>
              <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-faint' />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder='Search…' className='w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-line' />
            </div>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-left text-[11px] font-semibold uppercase tracking-wider text-muted border-b border-line'>
                  <th className='py-2.5 px-2'>#</th><th className='py-2.5 px-2'>Product Code</th><th className='py-2.5 px-2'>Product Name</th><th className='py-2.5 px-2'>SKU</th><th className='py-2.5 px-2'>Stock Qty</th><th className='py-2.5 px-2'>Available</th><th className='py-2.5 px-2'>Status</th><th className='py-2.5 px-2'>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? <tr><td colSpan={8} className='py-8 text-center text-muted'>No products.</td></tr> :
                  rows.slice(0, 8).map((r, i) => (
                    <tr key={r._id} className='border-b border-line/70'>
                      <td className='py-2.5 px-2 text-muted'>{i + 1}</td>
                      <td className='py-2.5 px-2 font-mono text-accent text-xs'>{r.productCode || '—'}</td>
                      <td className='py-2.5 px-2 text-fg'>{r.name}</td>
                      <td className='py-2.5 px-2 text-muted text-xs'>{r.sku || '—'}</td>
                      <td className='py-2.5 px-2 text-fg'>{r.stockQty}</td>
                      <td className='py-2.5 px-2 text-fg'>{r.available}</td>
                      <td className='py-2.5 px-2'><span className={`px-2 py-1 rounded-md text-[11px] font-semibold ${r.status === 'In Stock' ? 'bg-success/10 text-success' : r.status === 'Low Stock' ? 'bg-amber/10 text-amber' : 'bg-danger/10 text-danger'}`}>{r.status}</span></td>
                      <td className='py-2.5 px-2'><button className='px-2.5 py-1 text-xs font-semibold rounded-lg border border-success/40 text-success hover:bg-success/5'>Add Stock</button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className='glass rounded-2xl p-5'>
          <p className='font-heading font-bold text-fg mb-4'>Stock Adjustment History</p>
          <div className='space-y-4'>
            {(d?.recentAdjustments || []).length === 0 ? <p className='text-sm text-muted'>No adjustments yet.</p> :
              d.recentAdjustments.map((a) => (
                <div key={a._id} className='flex gap-3'>
                  <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${a.qtyChange >= 0 ? 'bg-success' : 'bg-danger'}`} />
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center justify-between gap-2'>
                      <p className='text-[11px] text-muted'>{new Date(a.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      <span className={`text-sm font-bold ${a.qtyChange >= 0 ? 'text-success' : 'text-danger'}`}>{a.qtyChange >= 0 ? '+' : ''}{a.qtyChange}</span>
                    </div>
                    <p className='text-sm font-semibold text-fg truncate'>{a.productName} {a.sku ? `(${a.sku})` : ''}</p>
                    <p className='text-xs text-muted'>Reason: {a.reason} · By: {a.admin}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default InventoryOverview
