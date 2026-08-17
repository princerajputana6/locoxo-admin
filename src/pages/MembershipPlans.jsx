import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl, currency } from '../App'
import { Crown, Plus, Trash2, Users, UserX, Layers } from 'lucide-react'
import { PageHeader, Btn, StatCard, Card, EmptyState, Toggle } from '../components/ui'
import { Field } from '../components/ui/Input.jsx'

const empty = {
  name: '', description: '', price: 499, durationDays: 365,
  perks: { freeShipping: true, discountPercent: 10, earlyAccess: true, prioritySupport: false },
  badge: '', benefits: '', active: true,
}

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl bg-surface-2 border border-line text-fg placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all'

const MembershipPlans = ({ token }) => {
  const [plans, setPlans] = useState([])
  const [stats, setStats] = useState({ active: 0, cancelled: 0, subscribers: [] })
  const [form, setForm] = useState(empty)
  const [showForm, setShowForm] = useState(false)
  const headers = { headers: { token } }

  const load = async () => {
    try {
      const [p, s] = await Promise.all([
        axios.get(backendUrl + '/api/subscription/admin/plans', headers),
        axios.get(backendUrl + '/api/subscription/admin/subscribers', headers),
      ])
      if (p.data.success) setPlans(p.data.plans)
      if (s.data.success) setStats(s.data)
    } catch (err) { toast.error(err.message) }
  }
  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        durationDays: Number(form.durationDays),
        perks: { ...form.perks, discountPercent: Number(form.perks.discountPercent) },
        benefits: typeof form.benefits === 'string'
          ? form.benefits.split('\n').map(b => b.trim()).filter(Boolean)
          : form.benefits,
      }
      const { data } = await axios.post(backendUrl + '/api/subscription/admin/plans', payload, headers)
      if (data.success) { toast.success('Plan created'); setForm(empty); setShowForm(false); load() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.message) }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this plan?')) return
    try {
      const { data } = await axios.delete(backendUrl + '/api/subscription/admin/plans/' + id, headers)
      if (data.success) { toast.success('Deleted'); load() }
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div className='p-6'>
      <PageHeader
        icon={Crown}
        title='Premium Membership'
        subtitle='Manage subscription plans & members'
        actions={<Btn variant='primary' size='sm' icon={Plus} onClick={() => setShowForm(v => !v)}>New Plan</Btn>}
      />

      <div className='grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6'>
        <StatCard icon={Users} label='Active Members' value={stats.active} tone='success' delay={0} />
        <StatCard icon={UserX} label='Cancelled' value={stats.cancelled} tone='danger' delay={60} />
        <StatCard icon={Layers} label='Plans' value={plans.length} tone='accent' delay={120} />
      </div>

      {showForm && (
        <Card title='Create membership plan' icon={Crown} className='mb-6'>
          <form onSubmit={submit} className='grid gap-4 sm:grid-cols-2'>
            <Field label='Plan name'><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder='LOCOXO Premium' /></Field>
            <Field label='Badge (optional)'><input value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} className={inputCls} placeholder='Best Value' /></Field>
            <Field label='Price (₹)'><input required type='number' value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className={inputCls} /></Field>
            <Field label='Duration (days)'><input required type='number' value={form.durationDays} onChange={e => setForm({ ...form, durationDays: e.target.value })} className={inputCls} /></Field>
            <Field label='Description' full><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputCls} /></Field>
            <Field label='Extra discount %'><input type='number' value={form.perks.discountPercent} onChange={e => setForm({ ...form, perks: { ...form.perks, discountPercent: e.target.value } })} className={inputCls} /></Field>
            <div className='flex flex-wrap items-end gap-4'>
              <Toggle checked={form.perks.freeShipping} onChange={v => setForm({ ...form, perks: { ...form.perks, freeShipping: v } })} label='Free shipping' />
              <Toggle checked={form.perks.earlyAccess} onChange={v => setForm({ ...form, perks: { ...form.perks, earlyAccess: v } })} label='Early access' />
              <Toggle checked={form.perks.prioritySupport} onChange={v => setForm({ ...form, perks: { ...form.perks, prioritySupport: v } })} label='Priority support' />
            </div>
            <Field label='Benefits (one per line)' full><textarea value={form.benefits} onChange={e => setForm({ ...form, benefits: e.target.value })} className={inputCls + ' h-24'} placeholder={'Members-only drops\nBirthday reward'} /></Field>
            <div className='sm:col-span-2'><Btn variant='primary' size='md' icon={Plus} as='button'>Save Plan</Btn></div>
          </form>
        </Card>
      )}

      {plans.length === 0 ? (
        <Card><EmptyState icon={Crown} title='No plans yet' message='Create your first premium membership plan to show it on the storefront.' /></Card>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {plans.map((p, i) => (
            <div key={p._id} style={{ animationDelay: `${i * 60}ms` }} className='glass card-hover animate-slide-up rounded-2xl p-5 relative'>
              <button onClick={() => remove(p._id)} className='absolute top-4 right-4 text-faint hover:text-danger transition-colors'><Trash2 size={16} /></button>
              {p.badge && <span className='inline-block bg-accent-gradient text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-2'>{p.badge}</span>}
              <h3 className='font-heading font-bold text-lg text-fg'>{p.name}</h3>
              <p className='text-2xl font-heading font-extrabold text-accent my-2'>{currency}{p.price}<span className='text-sm text-faint font-normal'> / {p.durationDays}d</span></p>
              <p className='text-sm text-muted'>{p.description}</p>
              <div className='mt-3 text-xs text-muted space-y-1'>
                {p.perks?.freeShipping && <p>• Free shipping</p>}
                {p.perks?.discountPercent > 0 && <p>• {p.perks.discountPercent}% extra off</p>}
                {p.perks?.earlyAccess && <p>• Early access</p>}
                {p.perks?.prioritySupport && <p>• Priority support</p>}
              </div>
              <span className={`inline-block mt-3 text-[10px] px-2 py-0.5 rounded-full border ${p.active ? 'bg-success/15 text-success border-success/30' : 'bg-surface-2 text-muted border-line'}`}>{p.active ? 'Active' : 'Inactive'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MembershipPlans
