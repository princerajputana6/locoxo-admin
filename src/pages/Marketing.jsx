import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl, currency } from '../App'
import {
  TrendingUp, Users, ShoppingBag, Repeat, Crown, Gift, Send, Plus, Megaphone
} from 'lucide-react'
import { PageHeader, Btn, StatCard, Card, FilterTabs, EmptyState, StatusPill } from '../components/ui'

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl bg-surface-2 border border-line text-fg placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all'

const Marketing = ({ token }) => {
  const headers = { headers: { token } }
  const [a, setA] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [leaderboard, setLeaderboard] = useState(null)
  const [tab, setTab] = useState('analytics')
  const [form, setForm] = useState({ name: '', channel: 'email', segment: { type: 'all' }, subject: '', message: '' })
  const [audience, setAudience] = useState(null)

  const load = async () => {
    try {
      const [ov, cp, lb] = await Promise.all([
        axios.get(backendUrl + '/api/analytics/overview', headers),
        axios.get(backendUrl + '/api/campaign/list', headers),
        axios.get(backendUrl + '/api/referral/admin/leaderboard', headers),
      ])
      if (ov.data.success) setA(ov.data.analytics)
      if (cp.data.success) setCampaigns(cp.data.campaigns)
      if (lb.data.success) setLeaderboard(lb.data)
    } catch (err) { toast.error(err.message) }
  }
  useEffect(() => { load() }, [])

  const previewAudience = async () => {
    try {
      const { data } = await axios.post(backendUrl + '/api/campaign/preview', { segment: form.segment }, headers)
      if (data.success) setAudience(data.audienceSize)
    } catch (err) { toast.error(err.message) }
  }
  const createCampaign = async (e) => {
    e.preventDefault()
    try {
      const { data } = await axios.post(backendUrl + '/api/campaign/create', form, headers)
      if (data.success) { toast.success('Campaign created'); setForm({ name: '', channel: 'email', segment: { type: 'all' }, subject: '', message: '' }); setAudience(null); load() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.message) }
  }
  const send = async (id) => {
    try {
      const { data } = await axios.post(backendUrl + `/api/campaign/${id}/send`, {}, headers)
      if (data.success) { toast.success(data.message); load() } else toast.error(data.message)
    } catch (err) { toast.error(err.message) }
  }

  const maxRev = a ? Math.max(1, ...a.monthlySeries.map(m => m.revenue)) : 1
  const maxCust = a ? Math.max(1, ...a.customerGrowth.map(m => m.customers)) : 1

  return (
    <div className='p-6'>
      <PageHeader icon={Megaphone} title='Marketing Automation' subtitle='Analytics, segments, campaigns & referrals' />

      <FilterTabs options={['analytics', 'campaigns', 'referrals']} value={tab} onChange={setTab} className='mb-6' />

      {!a ? <Card><EmptyState icon={TrendingUp} title='Loading analytics…' /></Card> : tab === 'analytics' ? (
        <>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mb-4'>
            <StatCard icon={TrendingUp} label='Revenue' value={`${currency}${a.kpis.totalRevenue.toLocaleString()}`} tone='success' delay={0} />
            <StatCard icon={ShoppingBag} label='Orders' value={a.kpis.totalOrders} tone='brand' delay={50} />
            <StatCard icon={TrendingUp} label='Avg Order Value' value={`${currency}${a.kpis.aov}`} delay={100} />
            <StatCard icon={Users} label='Customers' value={a.kpis.totalCustomers} delay={150} />
            <StatCard icon={Repeat} label='Repeat Rate' value={`${a.kpis.repeatRate}%`} tone='violet' delay={200} />
            <StatCard icon={TrendingUp} label='Conversion' value={`${a.kpis.conversionRate}%`} delay={250} />
            <StatCard icon={Crown} label='Premium Members' value={a.kpis.activeSubscribers} tone='accent' delay={300} />
            <StatCard icon={Gift} label='Referred Users' value={a.kpis.referredCount} tone='amber' delay={350} />
          </div>

          <div className='grid lg:grid-cols-2 gap-4 mb-4'>
            <Card title='Revenue (last 12 months)'>
              <div className='flex items-end gap-1 h-44'>
                {a.monthlySeries.map(m => (
                  <div key={m.month} className='flex-1 flex flex-col items-center justify-end group'>
                    <div className='w-full rounded-t bg-info/70 group-hover:bg-accent transition-colors' style={{ height: `${(m.revenue / maxRev) * 100}%` }} title={`${currency}${m.revenue}`} />
                    <span className='text-[9px] text-faint mt-1'>{m.month.slice(5)}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card title='New customers (last 12 months)'>
              <div className='flex items-end gap-1 h-44'>
                {a.customerGrowth.map(m => (
                  <div key={m.month} className='flex-1 flex flex-col items-center justify-end'>
                    <div className='w-full rounded-t bg-accent-gradient' style={{ height: `${(m.customers / maxCust) * 100}%` }} title={m.customers} />
                    <span className='text-[9px] text-faint mt-1'>{m.month.slice(5)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className='grid lg:grid-cols-3 gap-4'>
            <Card title='Customer Segments'>{Object.entries(a.segments).map(([k, v]) => <Row key={k} label={segLabel(k)} value={v} />)}</Card>
            <Card title='Payment Methods'>{Object.entries(a.paymentSplit).map(([k, v]) => <Row key={k} label={k} value={v} />)}</Card>
            <Card title='Top Products'>{a.topProducts.slice(0, 6).map(p => <Row key={p.productId} label={p.name} value={`${currency}${Math.round(p.revenue)}`} />)}</Card>
          </div>
        </>
      ) : tab === 'campaigns' ? (
        <div className='grid lg:grid-cols-2 gap-4'>
          <Card title='Create Campaign' icon={Plus}>
            <form onSubmit={createCampaign} className='space-y-3'>
              <input required placeholder='Campaign name' className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <div className='grid grid-cols-2 gap-3'>
                <select className={inputCls} value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}>
                  <option value='email'>Email</option><option value='sms'>SMS</option><option value='push'>Push</option>
                </select>
                <select className={inputCls} value={form.segment.type} onChange={e => { setForm({ ...form, segment: { type: e.target.value } }); setAudience(null) }}>
                  <option value='all'>All customers</option>
                  <option value='subscribers'>Premium members</option>
                  <option value='non_subscribers'>Non-members</option>
                  <option value='high_value'>High value</option>
                  <option value='inactive'>Inactive</option>
                  <option value='new'>New (30d)</option>
                </select>
              </div>
              <input placeholder='Subject' className={inputCls} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
              <textarea placeholder='Message' className={inputCls + ' h-24'} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
              <div className='flex items-center gap-3'>
                <button type='button' onClick={previewAudience} className='text-sm text-accent hover:text-glow font-semibold'>Preview audience</button>
                {audience !== null && <span className='text-sm text-muted'>→ {audience} recipients</span>}
              </div>
              <Btn variant='primary' size='md' icon={Plus} as='button'>Create campaign</Btn>
            </form>
          </Card>

          <Card title={`Campaigns (${campaigns.length})`} icon={Send}>
            <div className='space-y-3'>
              {campaigns.length === 0 && <p className='text-sm text-muted'>No campaigns yet.</p>}
              {campaigns.map(c => (
                <div key={c._id} className='rounded-xl border border-line bg-surface-2 p-3'>
                  <div className='flex items-center justify-between gap-2'>
                    <div className='min-w-0'>
                      <p className='font-semibold text-fg truncate'>{c.name}</p>
                      <p className='text-xs text-muted'>{c.channel} · {c.segment?.type} · {c.metrics?.audienceSize || 0} recipients</p>
                    </div>
                    <div className='flex items-center gap-2 shrink-0'>
                      <StatusPill status={c.status} />
                      {c.status !== 'sent' && <Btn variant='secondary' size='sm' icon={Send} onClick={() => send(c._id)}>Send</Btn>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        <Card title='Referral Leaderboard' icon={Gift}>
          {leaderboard && (
            <>
              <div className='flex gap-6 mb-4 text-sm'>
                <span className='text-muted'>Total referred: <b className='text-fg'>{leaderboard.totalReferred}</b></span>
                <span className='text-muted'>Total paid out: <b className='text-fg'>{currency}{leaderboard.totalPaidOut}</b></span>
              </div>
              <table className='w-full text-sm'>
                <thead className='text-left text-faint text-[10px] uppercase tracking-widest'><tr><th className='py-2'>Member</th><th>Referrals</th><th>Earned</th></tr></thead>
                <tbody>
                  {leaderboard.leaderboard.map(u => (
                    <tr key={u._id} className='border-t border-line/40'><td className='py-2 font-medium text-fg'>{u.name}</td><td className='text-fg'>{u.referralCount}</td><td className='text-accent font-semibold'>{currency}{u.referralEarnings}</td></tr>
                  ))}
                  {leaderboard.leaderboard.length === 0 && <tr><td colSpan={3} className='py-4 text-muted'>No referrals yet.</td></tr>}
                </tbody>
              </table>
            </>
          )}
        </Card>
      )}
    </div>
  )
}

const segLabel = (k) => ({ oneTime: 'One-time buyers', repeat: 'Repeat buyers', highValue: 'High-value (₹5k+)', neverPurchased: 'Never purchased' }[k] || k)
const Row = ({ label, value }) => (
  <div className='flex items-center justify-between py-1.5 text-sm border-b border-line/40 last:border-0'>
    <span className='text-muted truncate pr-2'>{label}</span>
    <span className='font-semibold text-fg'>{value}</span>
  </div>
)

export default Marketing
