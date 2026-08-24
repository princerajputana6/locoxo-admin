import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import {
  Users, UserCheck, UserX, IndianRupee, TrendingUp, FileSpreadsheet, Plus, Search,
  Filter, Copy, Eye, Pencil, Trash2, MoreVertical, X, Camera, Eye as EyeIcon, EyeOff,
} from 'lucide-react'

const TYPE_PILL = { barter: 'bg-success/10 text-success', unpaid: 'bg-accent/10 text-accent', paid: 'bg-violet/10 text-violet', collab: 'bg-amber/10 text-amber', other: 'bg-muted/10 text-muted' }
const STATUS_PILL = { active: 'bg-success/10 text-success', suspended: 'bg-danger/10 text-danger', deactivated: 'bg-muted/10 text-muted', inactive: 'bg-muted/10 text-muted' }

const StatCard = ({ icon: Icon, label, value, sub, tone }) => {
  const tones = { blue: 'bg-accent/10 text-accent', green: 'bg-success/10 text-success', red: 'bg-danger/10 text-danger', violet: 'bg-violet/10 text-violet', amber: 'bg-amber/10 text-amber' }
  return <div className='glass rounded-2xl p-4 flex items-center gap-3'><span className={`grid place-items-center w-12 h-12 rounded-xl ${tones[tone]}`}><Icon size={20} /></span><div><p className='text-xs text-muted'>{label}</p><p className='text-2xl font-heading font-extrabold text-fg'>{value}</p><p className='text-[11px] text-faint'>{sub}</p></div></div>
}

const Influencers = ({ token }) => {
  const [rows, setRows] = useState([]); const [summary, setSummary] = useState(null); const [loading, setLoading] = useState(true)
  const [q, setQ] = useState(''); const [fStatus, setFStatus] = useState('All'); const [fType, setFType] = useState('All')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = async () => {
    setLoading(true)
    try { const params = new URLSearchParams({ status: fStatus, type: fType, search: q }).toString(); const { data } = await axios.get(`${backendUrl}/api/influencer/list?${params}`, { headers: { token } }); if (data.success) { setRows(data.influencers); setSummary(data.summary) } else toast.error(data.message) }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to load influencers') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [fStatus, fType])
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [q])

  const setStatus = async (id, status) => { try { await axios.put(`${backendUrl}/api/influencer/${id}`, { status }, { headers: { token } }); load() } catch { toast.error('Failed') } }
  const del = async (id) => { if (!window.confirm('Delete this influencer?')) return; try { await axios.delete(`${backendUrl}/api/influencer/${id}`, { headers: { token } }); toast.success('Deleted'); load() } catch { toast.error('Failed') } }
  const sel = 'px-3 py-2.5 text-sm rounded-xl bg-white border border-line text-fg focus:border-accent outline-none'

  return (
    <div className='p-6'>
      <div className='flex items-start justify-between mb-5'>
        <div><h1 className='text-2xl font-heading font-extrabold text-fg'>Influencer Management</h1><p className='text-sm text-muted'>Manage influencers, commission, codes and performance.</p></div>
        <div className='flex items-center gap-2'>
          <button className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><FileSpreadsheet size={15} className='text-success' /> Export Excel</button>
          <button onClick={() => { setEditing(null); setShowAdd(true) }} className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-accent text-white'><Plus size={15} /> Add Influencer</button>
        </div>
      </div>

      <div className='grid grid-cols-2 md:grid-cols-5 gap-3 mb-5'>
        <StatCard icon={Users} label='Total Influencers' value={summary?.total ?? '—'} sub='all time' tone='blue' />
        <StatCard icon={UserCheck} label='Active Influencers' value={summary?.active ?? '—'} sub='active now' tone='green' />
        <StatCard icon={UserX} label='Deactivated' value={summary?.deactivated ?? '—'} sub='inactive' tone='red' />
        <StatCard icon={IndianRupee} label='Total Revenue' value={`${currency}${(summary?.totalRevenue || 0).toLocaleString('en-IN')}`} sub='From all influencers' tone='violet' />
        <StatCard icon={TrendingUp} label='Total Sales' value={summary?.totalSales ?? '—'} sub='From all influencers' tone='amber' />
      </div>

      <div className='glass rounded-2xl p-5'>
        <div className='flex flex-wrap items-center gap-3 mb-4'>
          <div className='relative flex-1 min-w-[220px]'><Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-faint' /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder='Search by name, email or code…' className='w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-line' /></div>
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={sel}><option value='All'>Status: All</option>{['active', 'suspended', 'deactivated'].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select>
          <select value={fType} onChange={(e) => setFType(e.target.value)} className={sel}><option value='All'>Type: All</option>{['barter', 'unpaid', 'paid', 'collab', 'other'].map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}</select>
          <button className='inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-white border border-line text-fg'><Filter size={15} /> Filter</button>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead><tr className='text-left text-[11px] font-semibold uppercase tracking-wider text-muted border-b border-line'>
              <th className='py-3 px-2'>Influencer</th><th className='py-3 px-2'>Code</th><th className='py-3 px-2'>Type</th><th className='py-3 px-2'>Commission</th><th className='py-3 px-2'>Sales</th><th className='py-3 px-2'>Link Clicks</th><th className='py-3 px-2'>Revenue</th><th className='py-3 px-2'>Joined On</th><th className='py-3 px-2'>Status</th><th className='py-3 px-2'>Action</th>
            </tr></thead>
            <tbody>
              {loading ? [0, 1, 2].map((i) => <tr key={i}><td colSpan={10} className='py-2'><div className='skeleton h-12 rounded-lg' /></td></tr>) :
                rows.length === 0 ? <tr><td colSpan={10} className='py-10 text-center text-muted'>No influencers found.</td></tr> :
                  rows.map((r) => (
                    <tr key={r._id} className='border-b border-line/70 hover:bg-surface-2/50'>
                      <td className='py-3 px-2'><div className='flex items-center gap-2'>{r.image ? <img src={r.image} alt='' className='w-9 h-9 rounded-full object-cover' /> : <span className='w-9 h-9 rounded-full bg-accent/15 text-accent grid place-items-center font-bold'>{r.name[0]}</span>}<div><p className='font-semibold text-fg'>{r.name}</p><p className='text-[11px] text-muted'>{r.email}</p><p className='text-[11px] text-faint'>{r.phone}</p></div></div></td>
                      <td className='py-3 px-2'><span className='inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-2 border border-line text-xs font-mono font-semibold text-fg'>{r.referralCode}<button onClick={() => { navigator.clipboard?.writeText(r.referralCode); toast.success('Copied') }}><Copy size={11} className='text-muted' /></button></span></td>
                      <td className='py-3 px-2'><span className={`px-2 py-1 rounded-md text-[11px] font-semibold ${TYPE_PILL[r.type] || TYPE_PILL.other}`}>{(r.type || 'other')[0].toUpperCase() + (r.type || 'other').slice(1)}</span></td>
                      <td className='py-3 px-2 text-xs'><p className='text-fg font-semibold'>{r.commissionType === 'amount' ? `${currency}${r.commissionAmount}` : `${r.commissionRate}%`}</p><p className='text-muted'>{r.commissionType === 'amount' ? 'per order' : `or ${currency}${r.commissionAmount || 0} per order`}</p></td>
                      <td className='py-3 px-2 text-fg'>{r.conversions || 0}</td>
                      <td className='py-3 px-2 text-fg'>{(r.clicks || 0).toLocaleString('en-IN')}</td>
                      <td className='py-3 px-2 text-fg'>{currency}{(r.totalEarnings || 0).toLocaleString('en-IN')}</td>
                      <td className='py-3 px-2 text-muted text-xs'>{new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className='py-3 px-2'><select value={r.status} onChange={(e) => setStatus(r._id, e.target.value)} className={`px-2 py-1 rounded-md text-[11px] font-semibold border-0 outline-none ${STATUS_PILL[r.status] || STATUS_PILL.inactive}`}>{['active', 'suspended', 'deactivated'].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select></td>
                      <td className='py-3 px-2'><div className='flex gap-1'><button className='grid place-items-center w-8 h-8 rounded-lg border border-line text-muted hover:text-accent'><Eye size={14} /></button><button onClick={() => { setEditing(r); setShowAdd(true) }} className='grid place-items-center w-8 h-8 rounded-lg border border-line text-accent hover:bg-accent/5'><Pencil size={14} /></button><button onClick={() => del(r._id)} className='grid place-items-center w-8 h-8 rounded-lg border border-line text-danger hover:bg-danger/5'><Trash2 size={14} /></button></div></td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && <AddDrawer token={token} initial={editing} onClose={() => { setShowAdd(false); setEditing(null) }} onDone={() => { setShowAdd(false); setEditing(null); load() }} />}
    </div>
  )
}

const AddDrawer = ({ token, initial, onClose, onDone }) => {
  const [f, setF] = useState({ name: initial?.name || '', email: initial?.email || '', phone: initial?.phone || '', dob: initial?.dob ? String(initial.dob).slice(0, 10) : '', instagramHandle: initial?.instagramHandle || '', code: initial?.code || '', type: initial?.type || '', password: '', sameCommissionForAll: initial?.sameCommissionForAll ?? true, commissionType: initial?.commissionType || 'percentage', commissionRate: initial?.commissionRate ?? '10', commissionAmount: initial?.commissionAmount ?? '', address: initial?.address || '', notes: initial?.notes || '', status: initial?.status || 'active' })
  const [photo, setPhoto] = useState(null); const [showPass, setShowPass] = useState(false); const [busy, setBusy] = useState(false)
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const lbl = 'block text-xs font-semibold text-fg mb-1'; const inp = 'w-full px-3 py-2 text-sm rounded-lg bg-white border border-line focus:border-accent outline-none'

  const genCode = () => set('code', (f.name || 'INF').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 5) + Math.floor(10 + Math.random() * 90))
  const submit = async () => {
    if (!f.name.trim() || !f.email.trim()) return toast.error('Name and email are required')
    setBusy(true)
    try {
      const fd = new FormData()
      Object.entries(f).forEach(([k, v]) => fd.append(k, v))
      if (photo) fd.append('image', photo)
      const { data } = initial?._id
        ? await axios.put(`${backendUrl}/api/influencer/${initial._id}`, fd, { headers: { token } })
        : await axios.post(`${backendUrl}/api/influencer/add`, fd, { headers: { token } })
      if (data.success) { toast.success(initial?._id ? 'Influencer updated' : 'Influencer added'); onDone() } else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || err.message) } finally { setBusy(false) }
  }

  return (
    <div className='fixed inset-0 z-50 flex justify-end'>
      <div className='fixed inset-0 bg-black/30' onClick={onClose} />
      <div className='relative w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto'>
        <div className='flex items-center justify-between px-5 py-4 border-b border-line sticky top-0 bg-white z-10'><p className='font-heading font-bold text-fg'>Add Influencer</p><button onClick={onClose} className='grid place-items-center w-8 h-8 rounded-lg text-muted hover:bg-surface-2'><X size={16} /></button></div>
        <div className='p-5 space-y-5'>
          <div>
            <p className='text-sm font-bold text-fg mb-3'>Personal Information</p>
            <div className='grid grid-cols-[auto_1fr] gap-3 items-start'>
              <label className='w-20 h-20 rounded-xl border-2 border-dashed border-line grid place-items-center cursor-pointer overflow-hidden bg-surface-2'>{photo ? <img src={URL.createObjectURL(photo)} alt='' className='w-full h-full object-cover' /> : <div className='text-center text-faint'><Camera size={18} className='mx-auto' /><span className='text-[9px]'>Upload</span></div>}<input type='file' accept='image/*' hidden onChange={(e) => setPhoto(e.target.files?.[0] || null)} /></label>
              <div className='space-y-2'><div><label className={lbl}>Full Name *</label><input value={f.name} onChange={(e) => set('name', e.target.value)} className={inp} placeholder='Enter full name' /></div><div><label className={lbl}>Email Address *</label><input value={f.email} onChange={(e) => set('email', e.target.value)} className={inp} placeholder='Enter email' /></div></div>
            </div>
            <div className='grid grid-cols-2 gap-2 mt-2'><div><label className={lbl}>Mobile Number *</label><input value={f.phone} onChange={(e) => set('phone', e.target.value)} className={inp} placeholder='+91…' /></div><div><label className={lbl}>Date of Birth *</label><input type='date' value={f.dob} onChange={(e) => set('dob', e.target.value)} className={inp} /></div></div>
            <div className='mt-2'><label className={lbl}>Instagram Handle *</label><input value={f.instagramHandle} onChange={(e) => set('instagramHandle', e.target.value)} className={inp} placeholder='@username' /></div>
          </div>

          <div>
            <p className='text-sm font-bold text-fg mb-3'>Influencer Details</p>
            <div className='grid grid-cols-2 gap-2'>
              <div><label className={lbl}>Influencer Code *</label><div className='flex gap-1'><input value={f.code} onChange={(e) => set('code', e.target.value)} className={inp} placeholder='Enter code' /><button onClick={genCode} className='px-2 py-1 text-[11px] font-semibold rounded-lg bg-accent text-white whitespace-nowrap'>Generate</button></div></div>
              <div><label className={lbl}>Type *</label><select value={f.type} onChange={(e) => set('type', e.target.value)} className={inp}><option value=''>Select type</option>{['barter', 'unpaid', 'paid', 'collab', 'other'].map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}</select></div>
            </div>
            <div className='mt-2'><label className={lbl}>Password *</label><div className='relative'><input type={showPass ? 'text' : 'password'} value={f.password} onChange={(e) => set('password', e.target.value)} className={inp} placeholder='Enter password' /><button onClick={() => setShowPass(!showPass)} className='absolute right-2 top-1/2 -translate-y-1/2 text-muted'>{showPass ? <EyeOff size={15} /> : <EyeIcon size={15} />}</button></div></div>
          </div>

          <div>
            <p className='text-sm font-bold text-fg mb-3'>Commission Settings</p>
            <div className='flex gap-3 text-xs mb-2'><label className='flex items-center gap-1'><input type='radio' checked={f.sameCommissionForAll} onChange={() => set('sameCommissionForAll', true)} className='accent-accent' /> Same for all</label><label className='flex items-center gap-1'><input type='radio' checked={!f.sameCommissionForAll} onChange={() => set('sameCommissionForAll', false)} className='accent-accent' /> Different per product</label></div>
            <div className='grid grid-cols-2 gap-2'><div><label className={lbl}>Commission Type *</label><select value={f.commissionType} onChange={(e) => set('commissionType', e.target.value)} className={inp}><option value='percentage'>Percentage (%)</option><option value='amount'>Flat Amount</option></select></div><div><label className={lbl}>Rate / Amount *</label><input value={f.commissionType === 'amount' ? f.commissionAmount : f.commissionRate} onChange={(e) => set(f.commissionType === 'amount' ? 'commissionAmount' : 'commissionRate', e.target.value)} className={inp} placeholder='Ex: 10 or 500' /></div></div>
          </div>

          <div>
            <p className='text-sm font-bold text-fg mb-3'>Other Information</p>
            <div><label className={lbl}>Address</label><input value={f.address} onChange={(e) => set('address', e.target.value)} className={inp} placeholder='Enter address' /></div>
            <div className='mt-2'><label className={lbl}>Notes (Optional)</label><textarea value={f.notes} onChange={(e) => set('notes', e.target.value)} className={inp + ' h-16 resize-none'} placeholder='Enter notes' /></div>
            <div className='mt-2 flex gap-3 text-xs'><label className='flex items-center gap-1'><input type='radio' checked={f.status === 'active'} onChange={() => set('status', 'active')} className='accent-accent' /> Active</label><label className='flex items-center gap-1'><input type='radio' checked={f.status === 'deactivated'} onChange={() => set('status', 'deactivated')} className='accent-accent' /> Deactivated</label></div>
          </div>
        </div>
        <div className='flex items-center gap-2 px-5 py-4 border-t border-line sticky bottom-0 bg-white'><button onClick={onClose} className='flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg'>Cancel</button><button onClick={submit} disabled={busy} className='flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-accent text-white'>{busy ? 'Saving…' : initial?._id ? 'Update Influencer' : 'Save Influencer'}</button></div>
      </div>
    </div>
  )
}

export default Influencers
