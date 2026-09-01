import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import { exportToCsv } from '../utils/exportCsv'
import {
  Star, RefreshCw, FileSpreadsheet, Search, Filter, Eye, Trash2, MoreHorizontal,
  MessageSquare, ShieldCheck, ImageIcon, Flag, KeyRound, X,
} from 'lucide-react'

const Stars = ({ n, size = 14 }) => (
  <span className='inline-flex'>{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} className={i <= n ? 'fill-amber text-amber' : 'text-line'} />)}</span>
)

const Reviews = ({ token }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState(''); const [rating, setRating] = useState('All'); const [language, setLanguage] = useState('All')
  const [newKw, setNewKw] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ rating, language, search: q, limit: 10 }).toString()
      const { data: d } = await axios.get(`${backendUrl}/api/review/list?${params}`, { headers: { token } })
      if (d.success) setData(d); else toast.error(d.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load reviews') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [rating, language])
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [q])

  const setSetting = async (key, value) => {
    try { const { data: d } = await axios.put(`${backendUrl}/api/review/settings`, { [key]: value }, { headers: { token } }); if (d.success) setData((x) => ({ ...x, settings: d.settings })) } catch { toast.error('Failed') }
  }
  const keyword = async (kw, action) => {
    try { const { data: d } = await axios.post(`${backendUrl}/api/review/keyword`, { keyword: kw, action }, { headers: { token } }); if (d.success) { setData((x) => ({ ...x, settings: { ...x.settings, blockedKeywords: d.blockedKeywords } })); setNewKw('') } } catch { toast.error('Failed') }
  }
  const del = async (id) => { if (!window.confirm('Delete this review?')) return; try { await axios.delete(`${backendUrl}/api/review/delete/${id}`, { headers: { token } }); load() } catch { toast.error('Failed') } }

  const reviews = data?.reviews || []
  const exportExcel = () => reviews.length ? exportToCsv('reviews', reviews.map((r) => ({ Product: r.productName || r.product?.name || '', Rating: r.rating, Review: r.comment || r.review || '', Customer: r.userName || r.name || '', Date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '' }))) : toast.error('No reviews to export')
  const summary = data?.summary; const settings = data?.settings; const reportSummary = data?.reportSummary
  const sel = 'px-3 py-2 text-sm rounded-lg bg-white border border-line text-fg focus:border-accent outline-none'

  return (
    <div className='p-6'>
      <div className='flex items-start justify-between mb-5'>
        <div><h1 className='text-2xl font-heading font-extrabold text-fg'>Rating &amp; Review Management</h1><p className='text-xs text-muted mt-1'>Dashboard <span className='text-faint'>›</span> Reviews <span className='text-faint'>›</span> All Reviews</p></div>
        <div className='flex items-center gap-2'>
          <button onClick={load} className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><RefreshCw size={15} /> Refresh</button>
          <button onClick={exportExcel} className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><FileSpreadsheet size={15} className='text-success' /> Export Excel</button>
        </div>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5'>
        {/* Main */}
        <div>
          <div className='glass rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-3'>
            <div className='relative flex-1 min-w-[220px]'><Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-faint' /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder='Search by Customer ID, Name, Product…' className='w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-line' /></div>
            <select value={rating} onChange={(e) => setRating(e.target.value)} className={sel}><option value='All'>All Ratings</option>{[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} Star</option>)}</select>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className={sel}><option value='All'>All Languages</option><option>English</option><option>Hindi</option></select>
            <button className='inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-white border border-line text-fg'><Filter size={15} /> Filter</button>
          </div>

          <div className='glass rounded-2xl overflow-hidden'>
            <div className='px-5 py-3 border-b border-line'><p className='font-heading font-bold text-fg'>All Reviews ({summary?.total ?? 0})</p></div>
            {loading ? <div className='p-5 space-y-3'>{[0, 1, 2].map((i) => <div key={i} className='skeleton h-20 rounded-xl' />)}</div> :
              reviews.length === 0 ? <div className='py-14 text-center text-muted'>No reviews found.</div> :
                <div className='divide-y divide-line/70'>
                  {reviews.map((r) => (
                    <div key={r._id} className='px-5 py-4 grid grid-cols-1 lg:grid-cols-[1.4fr_1.6fr_1fr_auto_auto] gap-4 items-start'>
                      <div className='flex gap-2'>
                        <span className='w-9 h-9 rounded-full bg-accent/15 text-accent grid place-items-center font-bold text-sm shrink-0'>{(r.userId?.name || 'C')[0]}</span>
                        <div className='min-w-0'>
                          <p className='font-semibold text-sm text-fg'>{r.userId?.name || 'Customer'}</p>
                          <p className='text-[11px] text-muted'>{r.productId?.name}</p>
                        </div>
                      </div>
                      <div>
                        <Stars n={r.rating} /><p className='font-semibold text-sm text-fg mt-1'>{r.title || ''}</p>
                        <p className='text-xs text-muted line-clamp-2'>{r.comment}</p>
                      </div>
                      <div className='flex gap-1'>
                        {(r.images || []).slice(0, 3).map((s, k) => <img key={k} src={s} alt='' className='w-10 h-10 rounded object-cover border border-line' />)}
                        {(r.images || []).length > 3 && <span className='w-10 h-10 rounded border border-line grid place-items-center text-[11px] text-muted'>+{r.images.length - 3}</span>}
                        {(r.images || []).length === 0 && <span className='text-[11px] text-faint'>—</span>}
                      </div>
                      <div className='text-xs'>
                        {r.verifiedPurchase && <span className='px-2 py-1 rounded-md bg-success/10 text-success font-semibold'>Verified Purchase</span>}
                        <p className='text-muted mt-1'>{new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        <p className='text-faint'>{r.language}</p>
                      </div>
                      <div className='flex gap-1'>
                        <button className='grid place-items-center w-8 h-8 rounded-lg border border-line text-muted hover:text-accent'><Eye size={14} /></button>
                        <button onClick={() => del(r._id)} className='grid place-items-center w-8 h-8 rounded-lg border border-line text-danger'><Trash2 size={14} /></button>
                        <button className='grid place-items-center w-8 h-8 rounded-lg border border-line text-muted'><MoreHorizontal size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>}
          </div>

          {/* Bottom action legend */}
          <div className='glass rounded-2xl p-4 mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-center'>
            {[[MessageSquare, 'Reply to Review', 'Reply to customers'], [ShieldCheck, 'Mark as Verified', 'Mark verified purchase'], [ImageIcon, 'Manage Media', 'View/manage media'], [Flag, 'Report Review', 'Report fake/abusive'], [KeyRound, 'Keyword Settings', 'Block keywords']].map(([Icon, t, s], i) => (
              <div key={i}><Icon size={18} className='mx-auto text-accent mb-1' /><p className='text-xs font-semibold text-fg'>{t}</p><p className='text-[10px] text-muted'>{s}</p></div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className='space-y-4'>
          <div className='glass rounded-2xl p-5'>
            <p className='font-heading font-bold text-fg mb-2'>Rating Summary</p>
            <div className='flex items-center gap-2'><span className='text-3xl font-heading font-extrabold text-fg'>{summary?.avg ?? '0.0'}</span><Stars n={Math.round(summary?.avg || 0)} size={16} /></div>
            <p className='text-xs text-muted mb-3'>Based on {summary?.total ?? 0} reviews</p>
            <div className='space-y-1.5'>
              {(summary?.breakdown || []).map((b) => (
                <div key={b.star} className='flex items-center gap-2 text-xs'>
                  <span className='w-8 text-muted'>{b.star} ★</span>
                  <div className='flex-1 h-2 rounded-full bg-surface-2 overflow-hidden'><div className='h-full bg-amber' style={{ width: `${b.pct}%` }} /></div>
                  <span className='w-16 text-right text-muted'>{b.pct}% ({b.count})</span>
                </div>
              ))}
            </div>
          </div>

          <div className='glass rounded-2xl p-5'>
            <p className='font-heading font-bold text-fg mb-3'>Review Settings</p>
            {[['autoApprove', 'Auto Approve Reviews'], ['requireVerifiedPurchase', 'Require Verified Purchase'], ['allowMediaReviews', 'Allow Image/Video Reviews'], ['showOnProductPage', 'Show Reviews on Product Page']].map(([k, l]) => (
              <div key={k} className='flex items-center justify-between py-2 border-b border-line/60 last:border-0'>
                <span className='text-sm text-fg'>{l}</span>
                <button onClick={() => setSetting(k, !settings?.[k])} className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${settings?.[k] ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted'}`}>{settings?.[k] ? 'Enabled' : 'Disabled'}</button>
              </div>
            ))}
          </div>

          <div className='glass rounded-2xl p-5'>
            <p className='font-heading font-bold text-fg mb-3'>Review Keywords (Blocked)</p>
            <div className='flex gap-2 mb-3'><input value={newKw} onChange={(e) => setNewKw(e.target.value)} placeholder='Add keyword…' className='flex-1 px-3 py-2 text-sm rounded-lg bg-white border border-line' /><button onClick={() => keyword(newKw, 'add')} className='px-3 py-2 text-sm font-semibold rounded-lg bg-accent text-white'>Add</button></div>
            <div className='flex flex-wrap gap-1.5'>
              {(settings?.blockedKeywords || []).map((k) => (
                <span key={k} className='inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-danger/5 text-danger border border-danger/20'>{k}<button onClick={() => keyword(k, 'remove')}><X size={11} /></button></span>
              ))}
            </div>
          </div>

          <div className='glass rounded-2xl p-5'>
            <p className='font-heading font-bold text-fg mb-3'>Report Summary</p>
            <div className='space-y-2 text-sm'>
              <p className='flex justify-between'><span className='text-muted'>Total Reports</span><span className='font-bold text-fg'>{reportSummary?.total ?? 0}</span></p>
              <p className='flex justify-between'><span className='text-muted'>Resolved Reports</span><span className='font-bold text-success'>{reportSummary?.resolved ?? 0}</span></p>
              <p className='flex justify-between'><span className='text-muted'>Remaining Reports</span><span className='font-bold text-amber'>{reportSummary?.remaining ?? 0}</span></p>
            </div>
            <button className='w-full mt-3 py-2 text-sm font-semibold rounded-lg border border-accent text-accent hover:bg-accent/5'>View All Reports</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reviews
