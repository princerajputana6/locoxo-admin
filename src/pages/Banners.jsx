import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import {
  Image as ImageIcon, RefreshCw, Plus, Search, Filter, Pencil, Trash2, X, UploadCloud,
  MonitorPlay, Tag, ShoppingBag, Snowflake, Play,
} from 'lucide-react'

const TABS = [
  { v: 'homepage_slider', l: 'Homepage Slider', icon: MonitorPlay },
  { v: 'promotional', l: 'Promotional Banners', icon: Tag },
  { v: 'collection', l: 'Collection Banners', icon: ShoppingBag },
  { v: 'seasonal', l: 'Seasonal Banners', icon: Snowflake },
]
const POS_LABEL = { homepage_slider: 'Homepage Slider', promotional: 'Promotional Banner', collection: 'Collection Banner', seasonal: 'Seasonal Banner' }

const Banners = ({ token }) => {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('homepage_slider')
  const [q, setQ] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const load = async () => {
    setLoading(true)
    try { const { data } = await axios.get(`${backendUrl}/api/banner/list?bannerType=${tab}`, { headers: { token } }); if (data.success) setBanners(data.banners); else toast.error(data.message) }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to load banners') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [tab])

  const rows = useMemo(() => banners.filter((b) => !q || `${b.title} ${b.subtitle || ''}`.toLowerCase().includes(q.toLowerCase())), [banners, q])
  const del = async (id) => { if (!window.confirm('Delete this banner?')) return; try { await axios.delete(`${backendUrl}/api/banner/remove/${id}`, { headers: { token } }); load() } catch { toast.error('Failed') } }
  const toggle = async (b) => { try { await axios.put(`${backendUrl}/api/banner/toggle/${b._id}`, { isActive: !b.isActive }, { headers: { token } }); load() } catch { toast.error('Failed') } }
  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  return (
    <div className='p-6'>
      <div className='flex items-start justify-between mb-5'>
        <div><h1 className='text-2xl font-heading font-extrabold text-fg'>Banner Management</h1><p className='text-sm text-muted'>Create, manage and organize banners for your store</p></div>
        <div className='flex items-center gap-2'><button onClick={load} className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><RefreshCw size={15} /> Refresh</button><button onClick={() => setShowAdd(true)} className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-accent text-white'><Plus size={15} /> Add New Banner</button></div>
      </div>

      <div className='flex flex-wrap items-center gap-2 border-b border-line mb-4'>
        {TABS.map((t) => <button key={t.v} onClick={() => setTab(t.v)} className={`inline-flex items-center gap-2 px-4 py-3 -mb-px text-sm font-semibold border-b-2 ${tab === t.v ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-fg'}`}><t.icon size={15} /> {t.l}</button>)}
      </div>

      <div className='glass rounded-2xl p-5'>
        <div className='flex items-center justify-end gap-2 mb-4'>
          <div className='relative'><Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-faint' /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder='Search banners…' className='pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-line' /></div>
          <button className='inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-white border border-line text-fg'><Filter size={15} /> Filter</button>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead><tr className='text-left text-[11px] uppercase tracking-wider text-muted border-b border-line'><th className='py-3 px-2'>#</th><th className='py-3 px-2'>Thumbnail</th><th className='py-3 px-2'>Banner Title</th><th className='py-3 px-2'>Position</th><th className='py-3 px-2'>Size Ratio</th><th className='py-3 px-2'>Order</th><th className='py-3 px-2'>Status</th><th className='py-3 px-2'>Start Date</th><th className='py-3 px-2'>End Date</th><th className='py-3 px-2'>Action</th></tr></thead>
            <tbody>
              {loading ? [0, 1, 2].map((i) => <tr key={i}><td colSpan={10} className='py-2'><div className='skeleton h-14 rounded-lg' /></td></tr>) :
                rows.length === 0 ? <tr><td colSpan={10} className='py-10 text-center text-muted'>No banners in this category.</td></tr> :
                  rows.map((b, i) => (
                    <tr key={b._id} className='border-b border-line/70 hover:bg-surface-2/50'>
                      <td className='py-3 px-2 text-muted'>{i + 1}</td>
                      <td className='py-3 px-2'><div className='relative w-20 h-12 rounded-lg overflow-hidden border border-line'><img src={b.image} alt='' className='w-full h-full object-cover' />{b.video && <span className='absolute inset-0 grid place-items-center bg-black/20'><Play size={16} className='text-white fill-white' /></span>}</div></td>
                      <td className='py-3 px-2'><p className='font-semibold text-fg'>{b.title}</p><p className='text-[11px] text-muted'>{b.subtitle}</p></td>
                      <td className='py-3 px-2 text-muted'>{POS_LABEL[b.bannerType] || b.position}</td>
                      <td className='py-3 px-2 text-muted text-xs'>{b.sizeRatio}</td>
                      <td className='py-3 px-2 text-fg'>{b.displayOrder}</td>
                      <td className='py-3 px-2'><button onClick={() => toggle(b)} className={`px-2 py-1 rounded-md text-[11px] font-semibold ${b.isActive ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted'}`}>{b.isActive ? 'Active' : 'Inactive'}</button></td>
                      <td className='py-3 px-2 text-muted text-xs'>{fmt(b.startDate)}</td>
                      <td className='py-3 px-2 text-muted text-xs'>{fmt(b.endDate)}</td>
                      <td className='py-3 px-2'><div className='flex gap-1'><button className='grid place-items-center w-8 h-8 rounded-lg border border-line text-accent'><Pencil size={14} /></button><button onClick={() => del(b._id)} className='grid place-items-center w-8 h-8 rounded-lg border border-line text-danger'><Trash2 size={14} /></button></div></td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        <p className='text-xs text-muted mt-3'>Showing 1 to {rows.length} of {rows.length} banners</p>
      </div>

      {showAdd && <AddDrawer token={token} defaultType={tab} onClose={() => setShowAdd(false)} onDone={() => { setShowAdd(false); load() }} />}
    </div>
  )
}

const AddDrawer = ({ token, defaultType, onClose, onDone }) => {
  const [f, setF] = useState({ bannerType: defaultType, sizeRatio: '16:9 (1920x1080)', title: '', subtitle: '', buttonText: 'Shop Now', buttonLink: '', position: 'Homepage Slider', displayOrder: '1', startDate: '', endDate: '', status: 'active' })
  const [image, setImage] = useState(null); const [links, setLinks] = useState([]); const [busy, setBusy] = useState(false)
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const lbl = 'block text-xs font-semibold text-fg mb-1'; const inp = 'w-full px-3 py-2 text-sm rounded-lg bg-white border border-line focus:border-accent outline-none'

  const submit = async () => {
    if (!f.title.trim()) return toast.error('Banner title is required')
    setBusy(true)
    try {
      const fd = new FormData()
      Object.entries(f).forEach(([k, v]) => fd.append(k, v))
      fd.append('links', JSON.stringify(links.filter((l) => l.label && l.url)))
      if (image) fd.append(image.type.startsWith('video/') ? 'video' : 'image', image)
      const { data } = await axios.post(`${backendUrl}/api/banner/add`, fd, { headers: { token } })
      if (data.success) { toast.success('Banner saved'); onDone() } else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || err.message) } finally { setBusy(false) }
  }

  return (
    <div className='fixed inset-0 z-50 flex justify-end'>
      <div className='fixed inset-0 bg-black/30' onClick={onClose} />
      <div className='relative w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto'>
        <div className='flex items-center justify-between px-5 py-4 border-b border-line sticky top-0 bg-white z-10'><p className='font-heading font-bold text-fg'>Add New Banner</p><button onClick={onClose} className='grid place-items-center w-8 h-8 rounded-lg text-muted hover:bg-surface-2'><X size={16} /></button></div>
        <div className='p-5 space-y-3'>
          <div><label className={lbl}>Banner Type</label><select value={f.bannerType} onChange={(e) => set('bannerType', e.target.value)} className={inp}>{TABS.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}</select></div>
          <div><label className={lbl}>Banner Thumbnail (Image / Video)</label><label className='flex flex-col items-center justify-center gap-1 h-24 rounded-xl border-2 border-dashed border-line bg-surface-2 cursor-pointer hover:border-accent/50 overflow-hidden'>{image ? (image.type.startsWith('video/') ? <span className='text-xs text-fg'>{image.name}</span> : <img src={URL.createObjectURL(image)} alt='' className='h-full object-cover' />) : <><UploadCloud size={20} className='text-faint' /><span className='text-sm text-muted'>Upload Image / Video</span><span className='text-[10px] text-faint'>Recommended: 1920 x 1080px</span></>}<input type='file' accept='image/*,video/*' hidden onChange={(e) => setImage(e.target.files?.[0] || null)} /></label></div>
          <div><label className={lbl}>Banner Size Ratio</label><select value={f.sizeRatio} onChange={(e) => set('sizeRatio', e.target.value)} className={inp}><option>16:9 (1920x1080)</option><option>4:3 (1200x900)</option><option>1:1 (1080x1080)</option><option>21:9 (2560x1080)</option></select></div>
          <div><label className={lbl}>Banner Title</label><input value={f.title} onChange={(e) => set('title', e.target.value)} className={inp} placeholder='Enter banner title' /></div>
          <div><label className={lbl}>Subtitle / Description</label><textarea value={f.subtitle} onChange={(e) => set('subtitle', e.target.value)} className={inp + ' h-16 resize-none'} placeholder='Enter subtitle or description' /></div>
          <div><label className={lbl}>Button Text</label><input value={f.buttonText} onChange={(e) => set('buttonText', e.target.value)} className={inp} /></div>
          <div>
            <div className='flex items-center justify-between mb-1'><label className={lbl + ' mb-0'}>Button Link (Go to)</label><button onClick={() => setLinks((l) => [...l, { label: '', url: '' }])} className='inline-flex items-center gap-1 text-[11px] font-semibold text-accent'><Plus size={12} /> Add Link</button></div>
            <input value={f.buttonLink} onChange={(e) => set('buttonLink', e.target.value)} className={inp} placeholder='Select page / URL' />
            {links.map((l, i) => (
              <div key={i} className='grid grid-cols-[1fr_1fr_auto] gap-1 mt-1'><input value={l.label} onChange={(e) => setLinks((ls) => ls.map((r, idx) => idx === i ? { ...r, label: e.target.value } : r))} placeholder='Label' className={inp} /><input value={l.url} onChange={(e) => setLinks((ls) => ls.map((r, idx) => idx === i ? { ...r, url: e.target.value } : r))} placeholder='URL' className={inp} /><button onClick={() => setLinks((ls) => ls.filter((_, idx) => idx !== i))} className='grid place-items-center w-8 rounded-lg text-danger'><X size={14} /></button></div>
            ))}
          </div>
          <div><label className={lbl}>Banner Position</label><select value={f.position} onChange={(e) => set('position', e.target.value)} className={inp}><option>Homepage Slider</option><option>Category Page</option><option>Product Page</option></select></div>
          <div><label className={lbl}>Display Order</label><input type='number' value={f.displayOrder} onChange={(e) => set('displayOrder', e.target.value)} className={inp} /></div>
          <div className='grid grid-cols-2 gap-2'><div><label className={lbl}>Start Date</label><input type='date' value={f.startDate} onChange={(e) => set('startDate', e.target.value)} className={inp} /></div><div><label className={lbl}>End Date</label><input type='date' value={f.endDate} onChange={(e) => set('endDate', e.target.value)} className={inp} /></div></div>
          <div><label className={lbl}>Status</label><select value={f.status} onChange={(e) => set('status', e.target.value)} className={inp}><option value='active'>Active</option><option value='inactive'>Inactive</option></select></div>
        </div>
        <div className='px-5 py-4 border-t border-line sticky bottom-0 bg-white'><button onClick={submit} disabled={busy} className='w-full px-4 py-2.5 text-sm font-semibold rounded-xl bg-accent text-white'>{busy ? 'Saving…' : 'Save Banner'}</button></div>
      </div>
    </div>
  )
}

export default Banners
