import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { FileSpreadsheet, Upload, CheckCircle2, AlertCircle } from 'lucide-react'
import { Modal, Btn } from './index.js'
import { backendUrl } from '../../App'

// Bulk-import products from an .xlsx / .csv file (Product Management → Import).
const ExcelImportModal = ({ open, onClose, token, onDone }) => {
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)

  const reset = () => { setFile(null); setResult(null) }
  const close = () => { reset(); onClose() }

  const submit = async () => {
    if (!file) return toast.error('Choose an .xlsx or .csv file')
    const fd = new FormData()
    fd.append('file', file)
    setBusy(true); setResult(null)
    try {
      const { data } = await axios.post(backendUrl + '/api/product/import-excel', fd, { headers: { token } })
      if (data.success) { setResult(data); toast.success(data.message); if (data.created?.length) onDone?.() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || err.message) }
    finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={close} icon={FileSpreadsheet} title='Import Products from Excel'
      subtitle='Upload an .xlsx / .csv — one product per row'
      size='md'
      footer={<>
        <Btn variant='ghost' size='sm' onClick={close}>Close</Btn>
        {!result
          ? <Btn variant='primary' size='sm' icon={Upload} loading={busy} onClick={submit} disabled={!file}>Import</Btn>
          : <Btn variant='primary' size='sm' onClick={reset}>Import another</Btn>}
      </>}
    >
      {result ? (
        <div className='space-y-4 animate-fade-in'>
          <div className='grid grid-cols-2 gap-3'>
            <div className='glass rounded-xl p-4 border border-success/30'>
              <CheckCircle2 className='text-success mb-1' size={20} />
              <p className='text-3xl font-heading font-extrabold text-success'>{result.created?.length || 0}</p>
              <p className='text-xs text-muted'>imported</p>
            </div>
            <div className={`glass rounded-xl p-4 ${result.errors?.length ? 'border border-danger/30' : 'border-line'}`}>
              <AlertCircle className={result.errors?.length ? 'text-danger' : 'text-muted'} size={20} />
              <p className={`text-3xl font-heading font-extrabold ${result.errors?.length ? 'text-danger' : 'text-muted'}`}>{result.errors?.length || 0}</p>
              <p className='text-xs text-muted'>failed</p>
            </div>
          </div>
          {result.errors?.length > 0 && (
            <div className='space-y-1.5 max-h-40 overflow-y-auto'>
              {result.errors.map((e, i) => (
                <div key={i} className='px-3 py-2 rounded-lg bg-danger/10 border border-danger/20 text-sm'>
                  <span className='text-fg font-medium'>Row {e.row}{e.name ? ` · ${e.name}` : ''}:</span> <span className='text-danger'>{e.error}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className='space-y-4'>
          <label className='block border-2 border-dashed border-line hover:border-accent/60 rounded-2xl p-8 text-center cursor-pointer bg-surface-2 transition-colors'>
            <FileSpreadsheet size={28} className='mx-auto text-accent mb-2' />
            <p className='text-sm text-fg font-semibold'>{file ? file.name : 'Click to choose a spreadsheet'}</p>
            <p className='text-[11px] text-faint mt-1'>.xlsx, .xls or .csv</p>
            <input type='file' accept='.xlsx,.xls,.csv' hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <div className='text-[11px] text-faint'>
            <p className='font-semibold text-muted mb-1'>Recognised columns (case-insensitive):</p>
            <p className='font-mono'>Name · MRP · SellingPrice · Category · Audience · Size · Color · Stock · Fabric · Description · Status</p>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default ExcelImportModal
