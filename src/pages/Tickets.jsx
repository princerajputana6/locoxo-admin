import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import {
  LifeBuoy, RefreshCw, FileSpreadsheet, Search, Filter, Eye, MoreVertical,
  Inbox, MessageSquare, Loader, CheckCircle2, XCircle, Send, X,
} from 'lucide-react'

const STATUS_LABEL = { open: 'Open', pending: 'In Progress', resolved: 'Resolved', closed: 'Closed' }
const STATUS_PILL = { open: 'bg-accent/10 text-accent', pending: 'bg-amber/10 text-amber', resolved: 'bg-success/10 text-success', closed: 'bg-muted/10 text-muted' }
const PRIO_PILL = { high: 'bg-danger/10 text-danger', medium: 'bg-amber/10 text-amber', low: 'bg-success/10 text-success' }

const StatCard = ({ icon: Icon, label, value, sub, tone }) => {
  const tones = { blue: 'bg-accent/10 text-accent', violet: 'bg-violet/10 text-violet', amber: 'bg-amber/10 text-amber', green: 'bg-success/10 text-success', red: 'bg-danger/10 text-danger' }
  return (
    <div className='glass rounded-2xl p-4 flex items-center gap-3'>
      <span className={`grid place-items-center w-12 h-12 rounded-xl ${tones[tone]}`}><Icon size={20} /></span>
      <div><p className='text-xs font-medium text-muted'>{label}</p><p className='text-2xl font-heading font-extrabold text-fg'>{value}</p><p className='text-[11px] text-faint'>{sub}</p></div>
    </div>
  )
}

const Tickets = ({ token }) => {
  const [tickets, setTickets] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState(''); const [fStatus, setFStatus] = useState('All'); const [fPrio, setFPrio] = useState('All'); const [fCat, setFCat] = useState('All')
  const [page, setPage] = useState(1); const perPage = 7
  const [openTicket, setOpenTicket] = useState(null)
  const [reply, setReply] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: fStatus, priority: fPrio, category: fCat, search: q }).toString()
      const { data } = await axios.get(`${backendUrl}/api/ticket/admin/all?${params}`, { headers: { token } })
      if (data.success) { setTickets(data.tickets); setStats(data.stats) } else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load tickets') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [fStatus, fPrio, fCat])
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [q])

  const cats = useMemo(() => [...new Set(tickets.map((t) => t.category).filter(Boolean))], [tickets])
  const pageRows = tickets.slice((page - 1) * perPage, page * perPage)
  const pages = Math.max(1, Math.ceil(tickets.length / perPage))

  const setStatus = async (id, status) => {
    try { const { data } = await axios.put(`${backendUrl}/api/ticket/admin/${id}/status`, { status }, { headers: { token } }); if (data.success) { toast.success('Updated'); load() } } catch { toast.error('Failed') }
  }
  const sendReply = async () => {
    if (!reply.trim()) return
    try { const { data } = await axios.post(`${backendUrl}/api/ticket/admin/${openTicket._id}/reply`, { message: reply, status: 'pending' }, { headers: { token } }); if (data.success) { setOpenTicket(data.ticket); setReply(''); load() } } catch { toast.error('Failed') }
  }
  const sel = 'px-3 py-2 text-sm rounded-lg bg-white border border-line text-fg focus:border-accent outline-none'

  return (
    <div className='p-6'>
      <div className='flex items-start justify-between mb-5'>
        <div><h1 className='text-2xl font-heading font-extrabold text-fg'>Raise Ticket Management</h1><p className='text-xs text-muted mt-1'>Dashboard <span className='text-faint'>›</span> Tickets</p></div>
        <div className='flex items-center gap-2'>
          <button onClick={load} className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><RefreshCw size={15} /> Refresh</button>
          <button className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><FileSpreadsheet size={15} className='text-success' /> Export Excel</button>
        </div>
      </div>

      <div className='grid grid-cols-2 md:grid-cols-5 gap-3 mb-5'>
        <StatCard icon={Inbox} label='Total Tickets' value={stats?.total ?? '—'} sub='All Time' tone='blue' />
        <StatCard icon={MessageSquare} label='Open Tickets' value={stats?.open ?? '—'} sub='Requires Attention' tone='violet' />
        <StatCard icon={Loader} label='In Progress' value={stats?.inProgress ?? '—'} sub='Being Handled' tone='amber' />
        <StatCard icon={CheckCircle2} label='Resolved Tickets' value={stats?.resolved ?? '—'} sub='This Month' tone='green' />
        <StatCard icon={XCircle} label='Closed Tickets' value={stats?.closed ?? '—'} sub='This Month' tone='red' />
      </div>

      <div className='glass rounded-2xl p-5'>
        <div className='flex flex-wrap items-center gap-3 mb-4'>
          <div className='relative flex-1 min-w-[240px] max-w-md'><Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-faint' /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder='Search by Ticket ID, Subject or Customer…' className='w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-line' /></div>
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={sel}><option value='All'>Status: All</option>{['open', 'pending', 'resolved', 'closed'].map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
          <select value={fPrio} onChange={(e) => setFPrio(e.target.value)} className={sel}><option value='All'>Priority: All</option>{['high', 'medium', 'low'].map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}</select>
          <select value={fCat} onChange={(e) => setFCat(e.target.value)} className={sel}><option value='All'>Category: All</option>{cats.map((c) => <option key={c}>{c}</option>)}</select>
          <button className='inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-white border border-line text-fg ml-auto'><Filter size={15} /> Filter</button>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead><tr className='text-left text-[11px] font-semibold uppercase tracking-wider text-muted border-b border-line'>
              <th className='py-3 px-2'>Ticket ID</th><th className='py-3 px-2'>Subject</th><th className='py-3 px-2'>Customer</th><th className='py-3 px-2'>Category</th><th className='py-3 px-2'>Priority</th><th className='py-3 px-2'>Status</th><th className='py-3 px-2'>Created On</th><th className='py-3 px-2'>Action</th>
            </tr></thead>
            <tbody>
              {loading ? [0, 1, 2].map((i) => <tr key={i}><td colSpan={8} className='py-2'><div className='skeleton h-12 rounded-lg' /></td></tr>) :
                pageRows.length === 0 ? <tr><td colSpan={8} className='py-10 text-center text-muted'>No tickets found.</td></tr> :
                  pageRows.map((t) => (
                    <tr key={t._id} className='border-b border-line/70 hover:bg-surface-2/50'>
                      <td className='py-3 px-2 font-semibold text-fg'>{t.ticketNumber}</td>
                      <td className='py-3 px-2 text-fg'>{t.subject}</td>
                      <td className='py-3 px-2'><p className='text-fg'>{t.userName || '—'}</p><p className='text-[11px] text-muted'>{t.userEmail}</p></td>
                      <td className='py-3 px-2 text-muted'>{t.category}</td>
                      <td className='py-3 px-2'><span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${PRIO_PILL[t.priority] || PRIO_PILL.medium}`}>{(t.priority || 'medium')[0].toUpperCase() + (t.priority || 'medium').slice(1)}</span></td>
                      <td className='py-3 px-2'>
                        <select value={t.status} onChange={(e) => setStatus(t._id, e.target.value)} className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border-0 outline-none ${STATUS_PILL[t.status]}`}>
                          {['open', 'pending', 'resolved', 'closed'].map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                        </select>
                      </td>
                      <td className='py-3 px-2 text-muted text-xs'>{new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}<br />{new Date(t.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className='py-3 px-2'><div className='flex items-center gap-1'><button onClick={() => setOpenTicket(t)} className='grid place-items-center w-8 h-8 rounded-lg border border-line text-muted hover:text-accent'><Eye size={14} /></button><button className='grid place-items-center w-8 h-8 rounded-lg border border-line text-muted'><MoreVertical size={14} /></button></div></td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        <div className='flex items-center justify-between mt-4 text-sm'>
          <span className='text-muted'>Showing {tickets.length === 0 ? 0 : (page - 1) * perPage + 1} to {Math.min(page * perPage, tickets.length)} of {tickets.length} tickets</span>
          <div className='flex items-center gap-1'>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className='w-8 h-8 rounded-lg border border-line text-muted disabled:opacity-40'>←</button>
            {Array.from({ length: pages }, (_, i) => i + 1).slice(0, 4).map((p) => <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-semibold ${p === page ? 'bg-accent text-white' : 'border border-line text-muted'}`}>{p}</button>)}
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className='w-8 h-8 rounded-lg border border-line text-muted disabled:opacity-40'>→</button>
          </div>
        </div>
      </div>

      {/* Detail drawer */}
      {openTicket && (
        <div className='fixed inset-0 z-50 flex justify-end'>
          <div className='fixed inset-0 bg-black/30' onClick={() => setOpenTicket(null)} />
          <div className='relative w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto animate-slide-down'>
            <div className='flex items-center justify-between mb-3'>
              <div><p className='font-heading font-bold text-fg'>{openTicket.ticketNumber}</p><p className='text-xs text-muted'>{openTicket.subject}</p></div>
              <button onClick={() => setOpenTicket(null)} className='grid place-items-center w-8 h-8 rounded-lg text-muted hover:bg-surface-2'><X size={16} /></button>
            </div>
            <div className='flex gap-2 mb-3'><span className={`px-2 py-1 rounded-md text-[11px] font-semibold ${STATUS_PILL[openTicket.status]}`}>{STATUS_LABEL[openTicket.status]}</span><span className={`px-2 py-1 rounded-md text-[11px] font-semibold ${PRIO_PILL[openTicket.priority] || PRIO_PILL.medium}`}>{openTicket.priority || 'medium'}</span><span className='px-2 py-1 rounded-md text-[11px] font-semibold bg-surface-2 text-muted'>{openTicket.category}</span></div>
            <p className='text-xs text-muted mb-3'>{openTicket.userName} · {openTicket.userEmail}</p>
            <div className='space-y-2 mb-3 max-h-[50vh] overflow-y-auto'>
              {(openTicket.messages || []).length === 0 ? <p className='text-sm text-faint'>No messages.</p> :
                openTicket.messages.map((m) => (
                  <div key={m._id} className={`rounded-xl px-3 py-2 text-sm ${m.sender === 'admin' ? 'bg-accent/10 ml-6' : 'bg-surface-2 mr-6'}`}><p className='text-fg'>{m.body}</p><p className='text-[10px] text-faint mt-1'>{m.senderName || m.sender} · {new Date(m.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p></div>
                ))}
            </div>
            <div className='flex gap-2'><input value={reply} onChange={(e) => setReply(e.target.value)} placeholder='Type a reply…' className='flex-1 px-3 py-2 text-sm rounded-lg bg-white border border-line' /><button onClick={sendReply} className='px-3 py-2 rounded-lg bg-accent text-white inline-flex items-center gap-1.5 text-sm font-semibold'><Send size={14} /> Reply</button></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tickets
