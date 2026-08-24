import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import { RefreshCw, FileSpreadsheet, Search, Filter, Pencil, Trash2 } from 'lucide-react'

const lbl = 'block text-sm font-semibold text-fg mb-1.5'
const req = <span className='text-danger'>*</span>
const inp = 'w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-line focus:border-accent outline-none'
const hint = 'text-[11px] text-muted mt-1'
const Toggle = ({ on, onClick }) => <button type='button' onClick={onClick} className={`relative w-11 h-6 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-line'}`}><span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} /></button>

const useCountdown = (until) => {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 })
  useEffect(() => {
    const tick = () => {
      const ms = Math.max(0, new Date(until) - Date.now())
      setT({ d: Math.floor(ms / 864e5), h: Math.floor(ms / 36e5) % 24, m: Math.floor(ms / 6e4) % 60, s: Math.floor(ms / 1e3) % 60 })
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [until])
  return t
}
const TimerBox = ({ v, l }) => <div className='text-center'><div className='px-3 py-1.5 rounded-lg bg-surface-2 border border-line font-heading font-bold text-fg'>{String(v).padStart(2, '0')}</div><p className='text-[10px] text-muted mt-1'>{l}</p></div>

const Coupons = ({ token }) => {
  const [coupons, setCoupons] = useState([])
  const [q, setQ] = useState('')
  const blank = { name: '', code: '', discountType: 'percentage', discountValue: '', discountAmount: '', validFrom: '', validUntil: '', showTimer: true, minPurchaseAmount: '', maxDiscountAmount: '', usageLimit: '', description: '', visible: true, exchangeNotAvailable: false, returnNotAvailable: false }
  const [f, setF] = useState(blank)
  const [editId, setEditId] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const startEdit = (c) => {
    setEditId(c._id)
    setF({ ...blank, ...c, validFrom: c.validFrom ? c.validFrom.slice(0, 16) : '', validUntil: c.validUntil ? c.validUntil.slice(0, 16) : '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const resetForm = () => { setF(blank); setEditId(null) }
  const timer = useCountdown(f.validUntil || Date.now())

  const load = async () => { try { const { data } = await axios.get(`${backendUrl}/api/coupon/list`, { headers: { token } }); if (data.success) setCoupons(data.coupons) } catch { toast.error('Failed to load coupons') } }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!f.name.trim() || !f.code.trim()) return toast.error('Name and code are required')
    if (!f.validFrom || !f.validUntil) return toast.error('Start and expiry dates are required')
    setBusy(true)
    try {
      const payload = { ...f, discountValue: Number(f.discountValue) || 0, discountAmount: Number(f.discountAmount) || undefined, minPurchaseAmount: Number(f.minPurchaseAmount) || 0, maxDiscountAmount: Number(f.maxDiscountAmount) || undefined, usageLimit: Number(f.usageLimit) || undefined, status: f.visible ? 'active' : 'inactive' }
      const { data } = editId
        ? await axios.put(`${backendUrl}/api/coupon/update/${editId}`, payload, { headers: { token } })
        : await axios.post(`${backendUrl}/api/coupon/add`, payload, { headers: { token } })
      if (data.success) { toast.success(editId ? 'Coupon updated' : 'Coupon saved'); resetForm(); load() } else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || err.message) } finally { setBusy(false) }
  }
  const toggleRow = async (c, field) => { try { await axios.put(`${backendUrl}/api/coupon/update/${c._id}`, { [field]: !c[field] }, { headers: { token } }); load() } catch { toast.error('Failed') } }
  const del = async (id) => { if (!window.confirm('Delete coupon?')) return; try { await axios.delete(`${backendUrl}/api/coupon/delete/${id}`, { headers: { token } }); load() } catch { toast.error('Failed') } }

  const rows = useMemo(() => coupons.filter((c) => !q || `${c.name || ''} ${c.code}`.toLowerCase().includes(q.toLowerCase())), [coupons, q])
  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'
  const RowToggle = ({ c, field }) => <button onClick={() => toggleRow(c, field)} className={`relative w-9 h-5 rounded-full ${c[field] ? 'bg-accent' : 'bg-line'}`}><span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${c[field] ? 'left-[18px]' : 'left-0.5'}`} /></button>
  const N = ({ n }) => <span className='text-accent font-bold mr-1'>{n}.</span>

  return (
    <div className='p-6'>
      <div className='flex items-start justify-between mb-5'>
        <div><h1 className='text-2xl font-heading font-extrabold text-fg'>Coupon / Promo Management</h1><p className='text-xs text-muted mt-1'>Dashboard <span className='text-faint'>›</span> Coupons / Promos <span className='text-faint'>›</span> Add Coupon</p></div>
        <div className='flex items-center gap-2'><button onClick={load} className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><RefreshCw size={15} /> Refresh</button><button className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><FileSpreadsheet size={15} className='text-success' /> Export Excel</button></div>
      </div>

      {/* Create form */}
      <div className='glass rounded-2xl p-6 mb-5'>
        <p className='font-heading font-bold text-fg mb-5'>Create Coupon / Promo Code</p>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4'>
          <div><label className={lbl}><N n={1} />Coupon / Discount Name {req}</label><input value={f.name} onChange={(e) => set('name', e.target.value)} className={inp} placeholder='Summer Sale 2025' /><p className={hint}>This name is only for internal reference.</p></div>
          <div><label className={lbl}><N n={2} />Sub Category (Coupon Code) {req}</label><input value={f.code} onChange={(e) => set('code', e.target.value.toUpperCase())} className={inp} placeholder='SUMMER20' /><p className={hint}>Customers will enter this code at checkout.</p></div>
          <div><label className={lbl}><N n={3} />Discount Type {req}</label><select value={f.discountType} onChange={(e) => set('discountType', e.target.value)} className={inp}><option value='percentage'>Percentage (%)</option><option value='fixed'>Fixed Amount (₹)</option></select></div>
          <div><label className={lbl}><N n={4} />Discount Value {req}</label><input type='number' value={f.discountValue} onChange={(e) => set('discountValue', e.target.value)} className={inp} placeholder='20' /><p className={hint}>Enter percentage value (e.g., 20 for 20%)</p></div>
          <div><label className={lbl}><N n={5} />Discount Amount (in {currency})</label><input type='number' value={f.discountAmount} onChange={(e) => set('discountAmount', e.target.value)} className={inp} placeholder='Enter amount' /><p className={hint}>Leave blank to use percentage discount</p></div>
          <div />
          <div><label className={lbl}><N n={6} />Start Date &amp; Time {req}</label><input type='datetime-local' value={f.validFrom} onChange={(e) => set('validFrom', e.target.value)} className={inp} /></div>
          <div><label className={lbl}><N n={7} />Expiry Date &amp; Time {req}</label><input type='datetime-local' value={f.validUntil} onChange={(e) => set('validUntil', e.target.value)} className={inp} /></div>
          <div>
            <div className='flex items-center gap-2 mb-1.5'><label className='text-sm font-semibold text-fg'><N n={8} />Timer (Countdown)</label><Toggle on={f.showTimer} onClick={() => set('showTimer', !f.showTimer)} /></div>
            {f.showTimer && <div className='flex items-center gap-1'><TimerBox v={timer.d} l='Days' /><span className='text-muted'>:</span><TimerBox v={timer.h} l='Hours' /><span className='text-muted'>:</span><TimerBox v={timer.m} l='Mins' /><span className='text-muted'>:</span><TimerBox v={timer.s} l='Secs' /></div>}
            <p className={hint}>Timer will show on coupon banner</p>
          </div>
          <div><label className={lbl}><N n={9} />Minimum Purchase ({currency})</label><input type='number' value={f.minPurchaseAmount} onChange={(e) => set('minPurchaseAmount', e.target.value)} className={inp} placeholder='999' /><p className={hint}>Minimum cart value to apply coupon</p></div>
          <div><label className={lbl}><N n={10} />Maximum Discount ({currency})</label><input type='number' value={f.maxDiscountAmount} onChange={(e) => set('maxDiscountAmount', e.target.value)} className={inp} placeholder='500' /><p className={hint}>Maximum discount value for this coupon</p></div>
          <div><label className={lbl}><N n={11} />Usage Limit</label><input type='number' value={f.usageLimit} onChange={(e) => set('usageLimit', e.target.value)} className={inp} placeholder='500' /><p className={hint}>Total number of times this coupon can be used</p></div>
          <div className='md:col-span-3'><label className={lbl}><N n={12} />Description (Optional)</label><textarea value={f.description} onChange={(e) => set('description', e.target.value)} className={inp + ' h-16 resize-none'} placeholder='Flat 20% OFF on all products. Limited time offer!' /><p className={hint}>This description will be visible to users.</p></div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 pt-4 border-t border-line'>
          <div><div className='flex items-center gap-2'><label className='text-sm font-semibold text-fg'><N n={13} />Status (Visible / Active) {req}</label><Toggle on={f.visible} onClick={() => set('visible', !f.visible)} /></div><p className={hint}>Coupon will be visible to customers</p></div>
          <div><div className='flex items-center gap-2'><label className='text-sm font-semibold text-fg'><N n={14} />Exchange Not Available</label><Toggle on={f.exchangeNotAvailable} onClick={() => set('exchangeNotAvailable', !f.exchangeNotAvailable)} /></div><p className={hint}>Customers cannot request exchange</p></div>
          <div><div className='flex items-center gap-2'><label className='text-sm font-semibold text-fg'><N n={15} />Return Not Available</label><Toggle on={f.returnNotAvailable} onClick={() => set('returnNotAvailable', !f.returnNotAvailable)} /></div><p className={hint}>Customers cannot request return</p></div>
        </div>
        <div className='flex items-center justify-end gap-2 mt-5'><button onClick={resetForm} className='px-6 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg'>Cancel</button><button onClick={save} disabled={busy} className='px-6 py-2.5 text-sm font-semibold rounded-xl bg-accent text-white'>{busy ? 'Saving…' : editId ? 'Update Coupon' : 'Save Coupon'}</button></div>
      </div>

      {/* Coupons table */}
      <div className='glass rounded-2xl p-5'>
        <div className='flex items-center justify-between mb-4'>
          <p className='font-heading font-bold text-fg'>All Coupons / Promo Codes</p>
          <div className='flex items-center gap-2'><div className='relative'><Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-faint' /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder='Search coupon name or code…' className='pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-line' /></div><button className='inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-white border border-line text-fg'><Filter size={15} /> Filter</button></div>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead><tr className='text-left text-[11px] uppercase tracking-wider text-muted border-b border-line'><th className='py-3 px-2'>S.No</th><th className='py-3 px-2'>Coupon Name</th><th className='py-3 px-2'>Code</th><th className='py-3 px-2'>Discount</th><th className='py-3 px-2'>Min. Purchase</th><th className='py-3 px-2'>Max. Discount</th><th className='py-3 px-2'>Validity</th><th className='py-3 px-2'>Usage Limit</th><th className='py-3 px-2'>Usage</th><th className='py-3 px-2'>Status</th><th className='py-3 px-2'>Visible</th><th className='py-3 px-2'>Exch. N/A</th><th className='py-3 px-2'>Return N/A</th><th className='py-3 px-2'>Action</th></tr></thead>
            <tbody>
              {rows.length === 0 ? <tr><td colSpan={14} className='py-10 text-center text-muted'>No coupons yet.</td></tr> :
                rows.map((c, i) => (
                  <tr key={c._id} className='border-b border-line/70 hover:bg-surface-2/50'>
                    <td className='py-3 px-2 text-muted'>{i + 1}</td>
                    <td className='py-3 px-2 font-semibold text-fg'>{c.name || '—'}</td>
                    <td className='py-3 px-2 font-mono text-accent'>{c.code}</td>
                    <td className='py-3 px-2 text-fg'>{c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `${currency}${c.discountValue} OFF`}</td>
                    <td className='py-3 px-2 text-muted'>{currency}{c.minPurchaseAmount || 0}</td>
                    <td className='py-3 px-2 text-muted'>{c.maxDiscountAmount ? `${currency}${c.maxDiscountAmount}` : '—'}</td>
                    <td className='py-3 px-2 text-muted text-xs'>{fmt(c.validFrom)} – {fmt(c.validUntil)}</td>
                    <td className='py-3 px-2 text-fg'>{c.usageLimit || 'Unlimited'}</td>
                    <td className='py-3 px-2 text-fg'>{c.usedCount || 0}</td>
                    <td className='py-3 px-2'><span className={`px-2 py-1 rounded-md text-[11px] font-semibold ${c.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted'}`}>{c.status === 'active' ? 'Active' : 'Inactive'}</span></td>
                    <td className='py-3 px-2'><RowToggle c={c} field='visible' /></td>
                    <td className='py-3 px-2'><RowToggle c={c} field='exchangeNotAvailable' /></td>
                    <td className='py-3 px-2'><RowToggle c={c} field='returnNotAvailable' /></td>
                    <td className='py-3 px-2'><div className='flex gap-1'><button onClick={() => startEdit(c)} className='grid place-items-center w-8 h-8 rounded-lg border border-line text-accent hover:bg-accent/5'><Pencil size={13} /></button><button onClick={() => del(c._id)} className='grid place-items-center w-8 h-8 rounded-lg border border-line text-danger'><Trash2 size={13} /></button></div></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className='mt-4 px-4 py-2.5 rounded-lg bg-accent/5 border border-accent/20 text-xs text-muted'>Note: When Exchange Not Available or Return Not Available is enabled, customers will not be able to raise exchange or return request for orders where this coupon is applied.</div>
      </div>
    </div>
  )
}

export default Coupons
