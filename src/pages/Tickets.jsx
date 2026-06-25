import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl } from '../App'

const STATUS_COLORS = {
  open:     'bg-blue-100 text-blue-700',
  pending:  'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  closed:   'bg-white/10 text-muted',
}

const Tickets = ({ token }) => {
  const [tickets, setTickets] = useState([])
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const load = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/ticket/admin/all' + (filter ? `?status=${filter}` : ''), {
        headers: { token }
      })
      if (data.success) setTickets(data.tickets)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter])

  const openTicket = async (id) => {
    try {
      const { data } = await axios.get(backendUrl + '/api/ticket/admin/' + id, { headers: { token } })
      if (data.success) setSelected(data.ticket)
    } catch (err) { console.error(err) }
  }

  const sendReply = async (e) => {
    e.preventDefault()
    if (!reply.trim()) return
    setSending(true)
    try {
      const { data } = await axios.post(
        backendUrl + '/api/ticket/admin/' + selected._id + '/reply',
        { message: reply, status: 'pending' },
        { headers: { token } }
      )
      if (data.success) {
        setSelected(data.ticket)
        setReply('')
        load()
        toast.success('Reply sent')
      } else toast.error(data.message)
    } catch { toast.error('Failed to send') }
    finally { setSending(false) }
  }

  const updateStatus = async (status) => {
    try {
      const { data } = await axios.put(
        backendUrl + '/api/ticket/admin/' + selected._id + '/status',
        { status },
        { headers: { token } }
      )
      if (data.success) {
        setSelected(data.ticket)
        load()
        toast.success('Status updated')
      }
    } catch { toast.error('Failed to update status') }
  }

  return (
    <div className='p-6'>
      <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold'>Support Tickets</h1>
          <p className='text-sm text-muted'>Respond to customer queries</p>
        </div>
        <div className='flex gap-2'>
          {['', 'open', 'pending', 'resolved', 'closed'].map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide border ${filter === s ? 'bg-accent-gradient text-brand-deep border-accent' : 'glass border-white/10 hover:border-gray-500'}`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6'>
        {/* List */}
        <div className='glass border border-white/10 max-h-[78vh] overflow-y-auto'>
          {loading ? (
            <div className='p-6 text-sm text-muted'>Loading…</div>
          ) : tickets.length === 0 ? (
            <div className='p-6 text-sm text-muted'>No tickets</div>
          ) : (
            tickets.map((t) => (
              <button
                key={t._id}
                onClick={() => openTicket(t._id)}
                className={`w-full text-left px-5 py-4 border-b border-white/5 hover:bg-white/5 ${selected?._id === t._id ? 'bg-white/5' : ''}`}
              >
                <div className='flex items-center gap-2 mb-1'>
                  <span className={`text-[10px] px-2 py-0.5 uppercase tracking-widest font-semibold ${STATUS_COLORS[t.status]}`}>{t.status}</span>
                  <span className='text-xs text-muted'>{t.category}</span>
                </div>
                <p className='font-semibold text-sm truncate'>{t.subject}</p>
                <p className='text-xs text-muted mt-0.5 truncate'>{t.userName} · {t.userEmail}</p>
                <p className='text-[11px] text-faint mt-1'>
                  {t.messages.length} msg · {new Date(t.updatedAt).toLocaleString()}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Thread */}
        <div className='glass border border-white/10 min-h-[78vh] flex flex-col'>
          {!selected ? (
            <div className='flex-1 flex items-center justify-center text-sm text-faint'>
              Select a ticket to view the conversation
            </div>
          ) : (
            <>
              <div className='border-b border-white/10 p-5'>
                <div className='flex flex-wrap items-center justify-between gap-3 mb-2'>
                  <div>
                    <h2 className='text-lg font-bold'>{selected.subject}</h2>
                    <p className='text-xs text-muted mt-0.5'>
                      {selected.userName} · {selected.userEmail} · {selected.category}
                    </p>
                  </div>
                  <div className='flex gap-2'>
                    {['open', 'pending', 'resolved', 'closed'].map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(s)}
                        className={`px-3 py-1 text-[10px] uppercase tracking-widest font-semibold border ${selected.status === s ? 'bg-accent-gradient text-brand-deep border-accent' : 'glass border-white/10 hover:border-gray-500'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className='flex-1 overflow-y-auto p-5 space-y-4 bg-white/5'>
                {selected.messages.map((m) => (
                  <div key={m._id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-4 border ${m.sender === 'admin' ? 'bg-accent-gradient text-brand-deep border-accent' : 'glass border-white/10'}`}>
                      <p className='text-[10px] uppercase tracking-widest opacity-70 mb-1'>
                        {m.sender === 'admin' ? 'You (Support)' : m.senderName || 'Customer'}
                      </p>
                      <p className='text-sm whitespace-pre-wrap'>{m.body}</p>
                      <p className='text-[10px] mt-2 opacity-60'>{new Date(m.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              {selected.status !== 'closed' && (
                <form onSubmit={sendReply} className='border-t border-white/10 p-4 flex gap-3'>
                  <textarea
                    rows={2}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder='Type your reply…'
                    className='flex-1 px-4 py-3 border border-white/10 focus:border-accent outline-none text-sm resize-none'
                  />
                  <button disabled={sending} className='bg-accent-gradient text-brand-deep px-6 py-3 text-sm font-semibold uppercase tracking-wide hover:brightness-110 disabled:bg-gray-400'>
                    {sending ? 'Sending…' : 'Send Reply'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Tickets
