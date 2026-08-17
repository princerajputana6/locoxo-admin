import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Barcode, Download, Loader2, FileWarning, Check } from 'lucide-react'
import { Modal, Btn } from './index.js'
import { backendUrl } from '../../App'

// `selectedIds` = array of product ids the admin has checked.
const BarcodeExportModal = ({ open, onClose, token, selectedIds = [], defaultFilter = 'all' }) => {
  const validModes = ['all', 'low', 'out']

  // Pick a guaranteed-valid starting option.
  const resolveDefault = () => {
    if (selectedIds.length > 0) return 'selected'
    if (validModes.includes(defaultFilter)) return defaultFilter
    return 'all'
  }

  const [mode, setMode] = useState(resolveDefault())
  const [busy, setBusy] = useState(false)

  // Always reset to a valid, selected option each time the modal opens.
  useEffect(() => {
    if (open) setMode(resolveDefault())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const selectedCount = selectedIds.length

  const buildQuery = () => {
    const q = new URLSearchParams()
    if (mode === 'selected' && selectedCount) q.set('ids', selectedIds.join(','))
    else if (mode === 'low' || mode === 'out') q.set('filter', mode)
    return q.toString()
  }

  const download = async () => {
    setBusy(true)
    try {
      const qs = buildQuery()
      const url = backendUrl + '/api/inventory/barcodes/pdf' + (qs ? `?${qs}` : '')
      const res = await axios.get(url, { headers: { token }, responseType: 'blob' })

      // Backend sends JSON (200) if no barcodes match; PDF otherwise.
      const ctype = res.headers['content-type'] || ''
      if (ctype.includes('application/json')) {
        const text = await res.data.text()
        const json = JSON.parse(text)
        toast.error(json.message || 'No barcodes match — try “Backfill SKUs” first')
        return
      }
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `locoxo-barcodes-${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(blobUrl)
      toast.success('Barcode sheet downloaded')
      onClose()
    } catch (err) {
      if (err?.response?.status === 404) {
        toast.error('Barcode endpoint not found — restart the backend server')
      } else {
        const msg = err.response?.data?.message || err.message
        toast.error(typeof msg === 'string' ? msg : 'Download failed')
      }
    } finally {
      setBusy(false)
    }
  }

  const options = [
    { value: 'all', label: 'All products', desc: 'Every variant barcode in one PDF' },
    { value: 'low', label: 'Low stock', desc: 'Only low-stock variant barcodes' },
    { value: 'out', label: 'Out of stock', desc: 'Only out-of-stock variant barcodes' },
    {
      value: 'selected',
      label: `Selected (${selectedCount})`,
      desc: selectedCount ? `Only the ${selectedCount} product(s) you checked` : 'Check products in the list first',
      disabled: selectedCount === 0,
    },
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={Barcode}
      title='Download Barcode Sheet'
      subtitle='One printable PDF with barcode + product details per variant'
      footer={
        <>
          <Btn variant='ghost' size='sm' onClick={onClose}>Cancel</Btn>
          <Btn variant='primary' size='sm' icon={busy ? Loader2 : Download} onClick={download} disabled={busy}>
            {busy ? 'Generating…' : 'Download PDF'}
          </Btn>
        </>
      }
    >
      <div className='space-y-2.5'>
        {options.map((o) => {
          const active = mode === o.value
          const disabled = !!o.disabled
          return (
            <button
              key={o.value}
              type='button'
              disabled={disabled}
              onClick={() => setMode(o.value)}
              className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200
                ${active
                  ? 'border-accent bg-accent/15 shadow-glow'
                  : 'border-transparent bg-surface-2 hover:bg-surface-3'}
                ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className={`grid place-items-center w-9 h-9 rounded-lg shrink-0 transition-colors ${active ? 'bg-accent-gradient text-white' : 'bg-surface-3 text-muted'}`}>
                {disabled ? <FileWarning size={16} /> : <Barcode size={16} />}
              </span>
              <span className='min-w-0'>
                <span className='block text-sm font-semibold text-fg'>{o.label}</span>
                <span className='block text-[11px] text-muted truncate'>{o.desc}</span>
              </span>
              {/* Radio indicator */}
              <span className={`ml-auto grid place-items-center w-5 h-5 rounded-full border-2 shrink-0 transition-all ${active ? 'border-accent bg-accent' : 'border-faint'}`}>
                {active && <Check size={12} className='text-white' strokeWidth={3.5} />}
              </span>
            </button>
          )
        })}

        <p className='text-[11px] text-faint pt-1'>
          The PDF prints 3 barcode cards per A4 page (name, size, color, price and the Code-128 barcode).
          If you get “no barcodes match”, run <span className='text-accent font-semibold'>Backfill SKUs</span> first.
        </p>
      </div>
    </Modal>
  )
}

export default BarcodeExportModal
