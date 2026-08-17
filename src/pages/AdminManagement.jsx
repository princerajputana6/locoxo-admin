import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import {
  Shield, User, Users, UserCog, Plus, Lock, KeyRound, Smartphone, ShieldCheck,
  Search, Filter, Pencil, Trash2, X, ArrowRight,
} from 'lucide-react'

const StatCard = ({ icon: Icon, label, value, sub, tone }) => {
  const tones = { blue: 'bg-accent/10 text-accent', green: 'bg-success/10 text-success', violet: 'bg-violet/10 text-violet', amber: 'bg-amber/10 text-amber' }
  return <div className='glass rounded-2xl p-4 flex items-center gap-3'><span className={`grid place-items-center w-12 h-12 rounded-xl ${tones[tone]}`}><Icon size={20} /></span><div><p className='text-xs text-muted'>{label}</p><p className='text-2xl font-heading font-extrabold text-fg'>{value}</p><p className='text-[11px] text-faint'>{sub}</p></div></div>
}
const Toggle = ({ on, onClick }) => <button onClick={onClick} className={`relative w-11 h-6 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-line'}`}><span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} /></button>

const AdminManagement = ({ token }) => {
  const [d, setD] = useState(null)
  const [tab, setTab] = useState('Admin')
  const [perms, setPerms] = useState([])
  const [q, setQ] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', role: 'staff', accessType: 'limited', status: 'active' })

  const load = async () => {
    try { const { data } = await axios.get(backendUrl + '/api/admin-mgmt/overview', { headers: { token } }); if (data.success) { setD(data); setPerms(data.settings.staffPermissions || []) } else toast.error(data.message) }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to load') }
  }
  useEffect(() => { load() }, [])

  const security = (key, value) => axios.put(`${backendUrl}/api/admin-mgmt/security`, { [key]: value }, { headers: { token } }).then(({ data }) => data.success && setD((x) => ({ ...x, settings: data.settings }))).catch(() => toast.error('Failed'))
  const togglePerm = (i, col) => setPerms((p) => p.map((r, idx) => idx === i ? { ...r, [col]: !r[col] } : r))
  const savePerms = async () => { try { await axios.put(`${backendUrl}/api/admin-mgmt/permissions`, { permissions: perms }, { headers: { token } }); toast.success('Permissions saved') } catch { toast.error('Failed') } }
  const addUser = async () => {
    if (!form.name || !form.email) return toast.error('Name and email required')
    try { const { data } = await axios.post(`${backendUrl}/api/admin-mgmt/staff`, form, { headers: { token } }); if (data.success) { toast.success('User added'); setShowAdd(false); setForm({ name: '', email: '', mobile: '', password: '', role: 'staff', accessType: 'limited', status: 'active' }); load() } else toast.error(data.message) } catch (e) { toast.error('Failed') }
  }
  const delUser = async (id) => { if (!id || !window.confirm('Delete this user?')) return; try { await axios.delete(`${backendUrl}/api/admin-mgmt/staff/${id}`, { headers: { token } }); load() } catch { toast.error('Failed') } }

  const s = d?.stats; const settings = d?.settings
  const users = (d?.allUsers || []).filter((u) => !q || `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q.toLowerCase()))
  const fmt = (dd) => dd ? new Date(dd).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

  return (
    <div className='p-6'>
      <div className='flex items-start justify-between mb-5'>
        <div><h1 className='text-2xl font-heading font-extrabold text-fg'>Admin Management</h1><p className='text-sm text-muted'>Manage admins, staff, permissions and security</p></div>
        <button onClick={() => setShowAdd(true)} className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-accent text-white'><Plus size={15} /> Add User</button>
      </div>

      <div className='flex items-center gap-6 border-b border-line mb-4'>{['Admin', 'Staff', 'Influencer'].map((t) => <button key={t} onClick={() => setTab(t)} className={`pb-3 -mb-px text-sm font-semibold border-b-2 ${tab === t ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-fg'}`}>{t}</button>)}</div>

      <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mb-5'>
        <StatCard icon={User} label='Admins' value={s?.admins ?? '—'} sub='Total Admins' tone='blue' />
        <StatCard icon={Users} label='Staff' value={s?.staff ?? '—'} sub='Total Staff' tone='green' />
        <StatCard icon={UserCog} label='Influencers' value={s?.influencers ?? '—'} sub='Total Influencers' tone='violet' />
        <StatCard icon={ShieldCheck} label='Active Users' value={s?.activeUsers ?? '—'} sub='Active Users' tone='amber' />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-3 mb-5'>
        {/* Security */}
        <div className='glass rounded-2xl p-5'>
          <p className='font-heading font-bold text-fg mb-4'>Security Settings</p>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'><div className='flex items-center gap-2'><Lock size={16} className='text-muted' /><div><p className='text-sm font-semibold text-fg'>Change Password</p><p className='text-[11px] text-muted'>Update your account password</p></div></div><button className='px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-line'>Change</button></div>
            <div className='flex items-center justify-between'><div className='flex items-center gap-2'><KeyRound size={16} className='text-muted' /><div><p className='text-sm font-semibold text-fg'>OTP Verification</p><p className='text-[11px] text-muted'>OTP is required for login</p></div></div><Toggle on={settings?.otpRequired} onClick={() => security('otpRequired', !settings?.otpRequired)} /></div>
            <div className='flex items-center justify-between'><div className='flex items-center gap-2'><Smartphone size={16} className='text-muted' /><div><p className='text-sm font-semibold text-fg'>Mobile Number</p><p className='text-[11px] text-muted'>{settings?.adminMobile} {settings?.mobileVerified && <span className='text-success font-semibold'>Verified</span>}</p></div></div><button className='px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-line'>Edit</button></div>
            <div className='flex items-center justify-between'><div className='flex items-center gap-2'><ShieldCheck size={16} className='text-muted' /><div><p className='text-sm font-semibold text-fg'>Two Factor Authentication</p><p className='text-[11px] text-muted'>Add extra layer of security</p></div></div><Toggle on={settings?.twoFactor} onClick={() => security('twoFactor', !settings?.twoFactor)} /></div>
          </div>
        </div>

        {/* Permissions */}
        <div className='glass rounded-2xl p-5'>
          <p className='font-heading font-bold text-fg'>Staff Permissions</p>
          <p className='text-xs text-muted mb-3'>Select what staff can access</p>
          <table className='w-full text-sm'>
            <thead><tr className='text-[11px] uppercase tracking-wider text-muted border-b border-line'><th className='text-left py-2'>Module</th><th className='py-2'>View</th><th className='py-2'>Add</th><th className='py-2'>Edit</th><th className='py-2'>Delete</th></tr></thead>
            <tbody>
              {perms.map((p, i) => (
                <tr key={p.module} className='border-b border-line/60'>
                  <td className='py-2 text-fg'>{p.module}</td>
                  {['view', 'add', 'edit', 'delete'].map((col) => <td key={col} className='py-2 text-center'>{['view', 'add', 'edit', 'delete'].includes(col) && (p.module === 'Settings' && col !== 'view' ? <span className='text-faint'>–</span> : <input type='checkbox' checked={!!p[col]} onChange={() => togglePerm(i, col)} className='accent-accent w-4 h-4' />)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={savePerms} className='mt-3 px-4 py-2 text-sm font-semibold rounded-lg bg-accent text-white'>Save Permission</button>
        </div>

        {/* Last logins */}
        <div className='glass rounded-2xl p-5'>
          <p className='font-heading font-bold text-fg mb-3'>Last Login Details</p>
          <div className='space-y-3'>
            {(d?.lastLogins || []).length === 0 ? <p className='text-sm text-muted'>No login records.</p> :
              d.lastLogins.map((u, i) => (
                <div key={i} className='flex items-center gap-2'><span className='w-8 h-8 rounded-full bg-accent/15 text-accent grid place-items-center font-bold text-xs'>{u.name[0]}</span><div className='min-w-0 flex-1'><p className='text-sm font-semibold text-fg truncate'>{u.name}</p><p className='text-[11px] text-muted truncate'>{u.email}</p></div><div className='text-right'><p className='text-[11px] text-muted'>{fmt(u.at)}</p><span className={`text-[10px] px-1.5 py-0.5 rounded ${u.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted'}`}>{u.status === 'active' ? 'Active' : 'Inactive'}</span></div></div>
              ))}
          </div>
          <button className='mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent'>View All Login History <ArrowRight size={13} /></button>
        </div>
      </div>

      {/* All users */}
      <div className='glass rounded-2xl p-5'>
        <div className='flex items-center justify-between mb-4'>
          <p className='font-heading font-bold text-fg'>All Users</p>
          <div className='flex items-center gap-2'><div className='relative'><Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-faint' /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder='Search by name, email or role' className='pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-line' /></div><button className='inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-white border border-line text-fg'><Filter size={15} /> Filter</button></div>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead><tr className='text-left text-[11px] uppercase tracking-wider text-muted border-b border-line'><th className='py-3 px-2'>#</th><th className='py-3 px-2'>Name</th><th className='py-3 px-2'>Email / Mobile</th><th className='py-3 px-2'>Role</th><th className='py-3 px-2'>Access Type</th><th className='py-3 px-2'>Last Login</th><th className='py-3 px-2'>Status</th><th className='py-3 px-2'>Action</th></tr></thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i} className='border-b border-line/70'>
                  <td className='py-3 px-2 text-muted'>{i + 1}</td>
                  <td className='py-3 px-2 font-semibold text-fg'>{u.name}</td>
                  <td className='py-3 px-2 text-muted text-xs'>{u.email}<br />{u.mobile}</td>
                  <td className='py-3 px-2 text-fg'>{u.role}</td>
                  <td className='py-3 px-2 text-muted'>{u.accessType}</td>
                  <td className='py-3 px-2 text-muted text-xs'>{fmt(u.lastLogin)}</td>
                  <td className='py-3 px-2'><span className={`px-2 py-1 rounded-md text-[11px] font-semibold ${u.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted'}`}>{u.status === 'active' ? 'Active' : 'Inactive'}</span></td>
                  <td className='py-3 px-2'><div className='flex gap-1'><button className='inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-accent'><Pencil size={13} /> Edit</button>{u._id && <button onClick={() => delUser(u._id)} className='inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-danger'><Trash2 size={13} /> Delete</button>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className='text-xs text-muted mt-3'>Showing 1 to {users.length} of {users.length} users</p>
      </div>

      {showAdd && (
        <div className='fixed inset-0 z-50 grid place-items-center p-4'>
          <div className='fixed inset-0 bg-black/40' onClick={() => setShowAdd(false)} />
          <div className='relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6'>
            <div className='flex items-center justify-between mb-4'><p className='font-heading font-bold text-fg'>Add User</p><button onClick={() => setShowAdd(false)} className='grid place-items-center w-8 h-8 rounded-lg text-muted hover:bg-surface-2'><X size={16} /></button></div>
            <div className='space-y-3'>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder='Full name' className='w-full px-3 py-2 text-sm rounded-lg bg-white border border-line' />
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder='Email' className='w-full px-3 py-2 text-sm rounded-lg bg-white border border-line' />
              <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder='Mobile' className='w-full px-3 py-2 text-sm rounded-lg bg-white border border-line' />
              <input type='password' value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder='Password' className='w-full px-3 py-2 text-sm rounded-lg bg-white border border-line' />
              <div className='grid grid-cols-2 gap-2'>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className='px-3 py-2 text-sm rounded-lg bg-white border border-line'><option value='staff'>Staff</option><option value='admin'>Admin</option></select>
                <select value={form.accessType} onChange={(e) => setForm({ ...form, accessType: e.target.value })} className='px-3 py-2 text-sm rounded-lg bg-white border border-line'><option value='limited'>Limited Access</option><option value='all'>All Access</option></select>
              </div>
            </div>
            <div className='flex gap-2 mt-4'><button onClick={() => setShowAdd(false)} className='flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-white border border-line'>Cancel</button><button onClick={addUser} className='flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-accent text-white'>Save User</button></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminManagement
