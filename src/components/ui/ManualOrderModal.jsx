import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Plus, Trash2, ClipboardList } from 'lucide-react'
import { Modal, Btn } from './index.js'
import { backendUrl, currency } from '../../App'

const inp = 'w-full px-3 py-2 text-sm rounded-lg bg-surface-2 border border-line text-fg placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none'
const lbl = 'block text-[10px] font-semibold uppercase tracking-wider text-faint mb-1'
const SIZES = ['Free', 'XS', 'S', 'M', 'L', 'XL', 'XXL']

// Admin manual order creation. Items are picked from the live product catalogue
// so stock can be reduced when the order is packed.
const ManualOrderModal = ({ open, onClose, token, onDone }) => {
  const [products, setProducts] = useState([])
  const [rows, setRows] = useState([{ productId: '', name: '', price: '', quantity: 1, size: 'M', color: '' }])
  const [addr, setAddr] = useState({ name: '', phone: '', addressLine1: '', city: '', state: '', pincode: '' })
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    axios.get(backendUrl + '/api/product/list?all=true').then(({ data }) => data.success && setProducts(data.products)).catch(() => {})
  }, [open])

  const pickProduct = (i, pid) => {
    const p = products.find((x) => x._id === pid)
    setRows((r) => r.map((row, idx) => idx === i ? {
      ...row, productId: pid, name: p?.name || '', price: p?.discountPrice || p?.price || '',
      color: p?.variants?.[0]?.color || row.color, size: p?.variants?.[0]?.size || row.size,
    } : row))
  }
  const update = (i, f, v) => setRows((r) => r.map((row, idx) => idx === i ? { ...row, [f]: v } : row))
  const addRow = () => setRows((r) => [...r, { productId: '', name: '', price: '', quantity: 1, size: 'M', color: '' }])
  const removeRow = (i) => setRows((r) => r.filter((_, idx) => idx !== i))

  const total = rows.reduce((s, r) => s + (Number(r.price) || 0) * (Number(r.quantity) || 0), 0)

  const submit = async () => {
    const items = rows.filter((r) => r.name && r.price).map((r) => ({
      productId: r.productId || undefined, name: r.name, price: Number(r.price),
      quantity: Number(r.quantity) || 1, size: r.size, color: r.color,
    }))
    if (!items.length) return toast.error('Add at least one item')
    if (!addr.name || !addr.phone) return toast.error('Customer name and phone are required')
    setBusy(true)
    try {
      const { data } = await axios.post(backendUrl + '/api/order/manual', { items, address: addr, paymentMethod }, { headers: { token } })
      if (data.success) { toast.success(`Order created · ${data.orderNumber}`); onDone?.(); onClose() }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || err.message) }
    finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={onClose} icon={ClipboardList} title='Manual Order' subtitle='Create an order on behalf of a customer' size='xl'
      footer={<>
        <span className='text-xs text-muted mr-auto'>Total: <span className='text-fg font-semibold'>{currency}{total}</span></span>
        <Btn variant='ghost' size='sm' onClick={onClose}>Cancel</Btn>
        <Btn variant='primary' size='sm' loading={busy} onClick={submit}>Create order</Btn>
      </>}
    >
      <div className='space-y-4'>
        {/* Items */}
        <div>
          <p className={lbl}>Items</p>
          <div className='space-y-2'>
            {rows.map((r, i) => (
              <div key={i} className='grid grid-cols-12 gap-2 items-center'>
                <select value={r.productId} onChange={(e) => pickProduct(i, e.target.value)} className={inp + ' col-span-4'}>
                  <option value=''>— Product —</option>
                  {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
                <input value={r.price} onChange={(e) => update(i, 'price', e.target.value)} type='number' placeholder='Price' className={inp + ' col-span-2'} />
                <input value={r.quantity} onChange={(e) => update(i, 'quantity', e.target.value)} type='number' min='1' placeholder='Qty' className={inp + ' col-span-2'} />
                <select value={r.size} onChange={(e) => update(i, 'size', e.target.value)} className={inp + ' col-span-2'}>{SIZES.map(s => <option key={s} value={s}>{s}</option>)}</select>
                <input value={r.color} onChange={(e) => update(i, 'color', e.target.value)} placeholder='Colour' className={inp + ' col-span-1'} />
                <button onClick={() => removeRow(i)} disabled={rows.length === 1} className='col-span-1 grid place-items-center w-8 h-8 rounded-lg text-faint hover:text-danger hover:bg-danger/10 disabled:opacity-30'><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <Btn variant='secondary' size='sm' icon={Plus} onClick={addRow} className='mt-2'>Add item</Btn>
        </div>

        {/* Customer / address */}
        <div className='grid sm:grid-cols-2 gap-3'>
          <div><label className={lbl}>Customer name</label><input value={addr.name} onChange={(e) => setAddr({ ...addr, name: e.target.value })} className={inp} /></div>
          <div><label className={lbl}>Phone</label><input value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} className={inp} /></div>
          <div className='sm:col-span-2'><label className={lbl}>Address</label><input value={addr.addressLine1} onChange={(e) => setAddr({ ...addr, addressLine1: e.target.value })} className={inp} /></div>
          <div><label className={lbl}>City</label><input value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} className={inp} /></div>
          <div><label className={lbl}>State</label><input value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} className={inp} /></div>
          <div><label className={lbl}>Pincode</label><input value={addr.pincode} onChange={(e) => setAddr({ ...addr, pincode: e.target.value })} className={inp} /></div>
          <div><label className={lbl}>Payment</label><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inp}><option value='COD'>COD</option><option value='Prepaid'>Prepaid</option></select></div>
        </div>
      </div>
    </Modal>
  )
}

export default ManualOrderModal
