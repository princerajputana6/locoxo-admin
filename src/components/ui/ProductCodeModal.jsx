import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Hash, RefreshCw, Copy, Check } from 'lucide-react'
import { Modal, Btn } from './index.js'
import { backendUrl } from '../../App'

const AUDIENCES = ['Male', 'Female', 'Unisex', 'Child']
const inp = 'w-full px-3 py-2 text-sm rounded-lg bg-surface-2 border border-line text-fg placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none'
const lbl = 'block text-[10px] font-semibold uppercase tracking-wider text-faint mb-1'

// Product Code generator (spec item 1): preview the next LX2026<NO> code with a
// refresh button, alongside the manual category / fabric / short-description
// fields that describe it. The code is assigned for real when a product is saved.
const ProductCodeModal = ({ open, onClose, token }) => {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [audience, setAudience] = useState('Male')
  const [fabric, setFabric] = useState('')
  const [shortDesc, setShortDesc] = useState('')

  const refresh = async () => {
    setLoading(true); setCopied(false)
    try {
      const { data } = await axios.get(backendUrl + '/api/inventory/next-code', { headers: { token } })
      if (data.success) setCode(data.productCode)
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load code') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (open) refresh() }, [open])

  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500) }
    catch { toast.error('Copy failed') }
  }

  return (
    <Modal open={open} onClose={onClose} icon={Hash} title='Product Code'
      subtitle='LX2026 series — sequential product code generator'
      size='sm'
      footer={<Btn variant='ghost' size='sm' onClick={onClose}>Close</Btn>}
    >
      <div className='space-y-4'>
        {/* Code display */}
        <div className='rounded-2xl border border-accent/30 bg-accent/10 p-5 text-center'>
          <p className={lbl + ' text-center'}>Next product code</p>
          <p className='font-mono text-3xl font-extrabold text-accent tracking-wider'>{code || '—'}</p>
          <div className='flex items-center justify-center gap-2 mt-3'>
            <Btn variant='secondary' size='sm' icon={RefreshCw} loading={loading} onClick={refresh}>Refresh</Btn>
            <Btn variant='ghost' size='sm' icon={copied ? Check : Copy} onClick={copy} disabled={!code}>{copied ? 'Copied' : 'Copy'}</Btn>
          </div>
        </div>

        {/* Manual descriptors */}
        <div className='grid gap-3'>
          <div>
            <label className={lbl}>Category</label>
            <select value={audience} onChange={(e) => setAudience(e.target.value)} className={inp}>
              {AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Fabric</label>
            <input value={fabric} onChange={(e) => setFabric(e.target.value)} className={inp} placeholder='e.g. 100% Cotton' />
          </div>
          <div>
            <label className={lbl}>Short description</label>
            <input value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} className={inp} placeholder='e.g. Oversized graphic tee' />
          </div>
        </div>

        <p className='text-[11px] text-faint'>
          The code shown is the next in sequence. It is assigned automatically when you create a product
          (via <span className='text-accent font-semibold'>Bulk Add</span> or Product Management), so codes never clash.
        </p>
      </div>
    </Modal>
  )
}

export default ProductCodeModal
