import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { backendUrl, currency } from '../../App'
import { toast } from 'react-toastify'
import { RefreshCw, UploadCloud, Plus, X, Pencil, Trash2, Save, Send, Ruler } from 'lucide-react'

const lbl = 'block text-sm font-semibold text-fg mb-1.5'
const req = <span className='text-danger'>*</span>
const inp = 'w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-line focus:border-accent outline-none'
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40', '41']
const FABRICS = ['Cotton', 'Linen', 'Polyester', 'Silk', 'Wool', 'Denim', 'Fleece']
const NECKS = ['Round', 'V-Neck', 'Collar', 'Polo', 'Hooded', 'Turtle']
const SLEEVES = ['Half', 'Full', 'Sleeveless', '3/4th']
const PATTERNS = ['Solid', 'Graphic', 'Printed', 'Striped', 'Checked']

// Add Product — colour-wise builder (image 8).
const AddProductNew = ({ token }) => {
  const navigate = useNavigate()
  const [codes, setCodes] = useState([])
  const [nextCode, setNextCode] = useState('')  // selected product code
  const [basic, setBasic] = useState({ name: '', category: '', subCategory: '', childCategory: '', fabric: '', neckType: '', sleeve: '', pattern: '', status: 'active' })
  const [sizeChart, setSizeChart] = useState(null)
  // current colour being edited
  const [cur, setCur] = useState({ color: '', colorCode: '#000000', sizes: [], mrp: '', sellingPrice: '', discount: '', description: '', images: [], videos: [] })
  const [colours, setColours] = useState([])
  const [busy, setBusy] = useState(false)

  // A product can only be built from a product code that HAS inventory (stock).
  useEffect(() => {
    axios.get(backendUrl + '/api/inventory/codes-with-stock', { headers: { token } })
      .then(({ data }) => data.success && setCodes((data.codes || []).map((c) => ({ _id: c.productCode, code: c.productCode, category: c.category, subCategory: c.subCategory, childCategory: c.childCategory, fabric: c.fabric, totalStock: c.totalStock }))))
      .catch(() => {})
  }, [])

  // Selecting a product code auto-fills its category chain + fabric.
  const pickCode = (code) => {
    setNextCode(code)
    const c = codes.find((x) => x.code === code)
    if (c) setBasic((b) => ({ ...b, category: c.category || b.category, subCategory: c.subCategory || '', childCategory: c.childCategory || '', fabric: c.fabric || b.fabric }))
  }

  const discountedPrice = useMemo(() => {
    const m = Number(cur.mrp), d = Number(cur.discount)
    if (m > 0 && d > 0) return Math.round(m - (m * d) / 100)
    return Number(cur.sellingPrice) || ''
  }, [cur.mrp, cur.discount, cur.sellingPrice])

  const setC = (f, v) => setCur((c) => ({ ...c, [f]: v }))
  // Auto discount detection: typing a Selling Price auto-computes the discount %
  // (and typing MRP recomputes it too), so the admin never has to do the maths.
  const setSelling = (v) => setCur((c) => {
    const m = Number(c.mrp), s = Number(v)
    const discount = m > 0 && s > 0 && s <= m ? String(Math.round(((m - s) / m) * 100)) : c.discount
    return { ...c, sellingPrice: v, discount }
  })
  const setMrp = (v) => setCur((c) => {
    const m = Number(v), s = Number(c.sellingPrice)
    const discount = m > 0 && s > 0 && s <= m ? String(Math.round(((m - s) / m) * 100)) : c.discount
    return { ...c, mrp: v, discount }
  })
  const toggleSize = (s) => setCur((c) => ({ ...c, sizes: c.sizes.includes(s) ? c.sizes.filter((x) => x !== s) : [...c.sizes, s] }))
  const onImages = (e) => { const files = [...e.target.files].filter((f) => f.type.startsWith('image/')); setCur((c) => ({ ...c, images: [...c.images, ...files].slice(0, 10) })); e.target.value = '' }
  const onVideos = (e) => { const files = [...e.target.files].filter((f) => f.type.startsWith('video/')); setCur((c) => ({ ...c, videos: [...c.videos, ...files].slice(0, 3) })); e.target.value = '' }

  const addColour = () => {
    if (!cur.color.trim()) return toast.error('Enter a colour name')
    if (cur.sizes.length === 0) return toast.error('Select at least one size')
    if (!cur.mrp) return toast.error('Enter MRP')
    setColours((cs) => [...cs, { ...cur, sellingPrice: cur.sellingPrice || discountedPrice }])
    setCur({ color: '', colorCode: '#000000', sizes: [], mrp: '', sellingPrice: '', discount: '', description: '', images: [], videos: [] })
    toast.success('Colour added')
  }
  const removeColour = (i) => setColours((cs) => cs.filter((_, idx) => idx !== i))

  const submit = async (asDraft = false) => {
    if (!basic.name.trim()) return toast.error('Product name is required')
    const all = cur.color.trim() && cur.sizes.length && cur.mrp ? [...colours, { ...cur, sellingPrice: cur.sellingPrice || discountedPrice }] : colours
    if (all.length === 0) return toast.error('Add at least one colour')
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('name', basic.name); fd.append('productCode', nextCode); fd.append('category', basic.category)
      fd.append('subCategory', basic.subCategory || 'General')
      fd.append('fabric', basic.fabric); fd.append('neckType', basic.neckType); fd.append('sleeve', basic.sleeve); fd.append('pattern', basic.pattern)
      fd.append('status', asDraft ? 'draft' : basic.status)
      fd.append('colours', JSON.stringify(all.map((c) => ({ color: c.color, colorCode: c.colorCode, sizes: c.sizes, mrp: c.mrp, sellingPrice: c.sellingPrice, discount: c.discount, description: c.description, stock: 0 }))))
      all.forEach((c, ci) => { c.images.forEach((f, ii) => fd.append(`c${ci}_img${ii}`, f)); c.videos.forEach((f, vi) => fd.append(`c${ci}_vid${vi}`, f)) })
      if (sizeChart) fd.append('sizeChart', sizeChart)
      const { data } = await axios.post(backendUrl + '/api/product/add-colourwise', fd, { headers: { token } })
      if (data.success) { toast.success(`${data.message} — ${data.productCode || ''}`); navigate('/products') }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || err.message) }
    finally { setBusy(false) }
  }

  const Num = ({ n, children }) => <h2 className='text-base font-heading font-bold text-fg mb-4'>{n}. {children}</h2>

  return (
    <div className='p-6'>
      <div className='flex items-start justify-between mb-5'>
        <div>
          <h1 className='text-2xl font-heading font-extrabold text-fg'>Add Product</h1>
          <p className='text-xs text-muted mt-1'>Dashboard <span className='text-faint'>›</span> Products <span className='text-faint'>›</span> Add Product</p>
        </div>
        <button onClick={() => window.location.reload()} className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg'><RefreshCw size={15} /> Refresh</button>
      </div>

      {/* 1. Basic Information */}
      <div className='glass rounded-2xl p-6 mb-5'>
        <div className='flex items-start justify-between'>
          <Num n={1}>Basic Information</Num>
          <label className='flex flex-col items-center gap-1 cursor-pointer'>
            <span className='text-xs font-semibold text-fg inline-flex items-center gap-1'><Ruler size={13} /> Size chart</span>
            <div className='w-16 h-14 rounded-lg border-2 border-dashed border-line grid place-items-center bg-surface-2 overflow-hidden'>{sizeChart ? <img src={URL.createObjectURL(sizeChart)} alt='' className='w-full h-full object-cover' /> : <UploadCloud size={16} className='text-faint' />}</div>
            <input type='file' accept='image/*' hidden onChange={(e) => setSizeChart(e.target.files?.[0] || null)} />
          </label>
        </div>
        <div className='grid md:grid-cols-2 gap-4'>
          <div>
            <label className={lbl}>Product Code {req}</label>
            <select value={nextCode} onChange={(e) => pickCode(e.target.value)} className={inp + ' font-mono font-bold'}>
              <option value=''>— Select product code —</option>
              {codes.map((c) => <option key={c._id} value={c.code}>{c.code} · {[c.category, c.subCategory, c.childCategory].filter(Boolean).join(' › ')} (stock: {c.totalStock})</option>)}
            </select>
            {codes.length === 0 && <p className='text-[11px] text-amber mt-1'>No product codes have inventory yet. Add stock in <b>Inventory → Add Inventory</b> first.</p>}
            {nextCode ? <p className='text-[11px] text-muted mt-1'>Category: <span className='text-fg font-semibold'>{[basic.category, basic.subCategory, basic.childCategory].filter(Boolean).join(' › ') || '—'}</span>{basic.fabric ? ` · Fabric: ${basic.fabric}` : ''}</p>
              : <p className='text-[11px] text-muted mt-1'>Pick a code created in Inventory → Create Product Code.</p>}
          </div>
          <div><label className={lbl}>Product Name {req}</label><input value={basic.name} onChange={(e) => setBasic({ ...basic, name: e.target.value })} className={inp} placeholder='Enter product name' /></div>
        </div>
      </div>

      {/* 2. Product Highlights */}
      <div className='glass rounded-2xl p-6 mb-5'>
        <Num n={2}>Product Highlights</Num>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div><label className={lbl}>Fabric {req}</label><input list='fabrics' value={basic.fabric} onChange={(e) => setBasic({ ...basic, fabric: e.target.value })} className={inp} placeholder='Manually' /><datalist id='fabrics'>{FABRICS.map((f) => <option key={f} value={f} />)}</datalist></div>
          <div><label className={lbl}>Neck Type {req}</label><input list='necks' value={basic.neckType} onChange={(e) => setBasic({ ...basic, neckType: e.target.value })} className={inp} placeholder='Manually' /><datalist id='necks'>{NECKS.map((f) => <option key={f} value={f} />)}</datalist></div>
          <div><label className={lbl}>Sleeve {req}</label><input list='sleeves' value={basic.sleeve} onChange={(e) => setBasic({ ...basic, sleeve: e.target.value })} className={inp} placeholder='Manually' /><datalist id='sleeves'>{SLEEVES.map((f) => <option key={f} value={f} />)}</datalist></div>
          <div><label className={lbl}>Pattern {req}</label><input list='patterns' value={basic.pattern} onChange={(e) => setBasic({ ...basic, pattern: e.target.value })} className={inp} placeholder='Manually' /><datalist id='patterns'>{PATTERNS.map((f) => <option key={f} value={f} />)}</datalist></div>
        </div>
      </div>

      {/* 3. Colour, Pricing & Description */}
      <div className='glass rounded-2xl p-6 mb-5'>
        <Num n={3}>Product Colour, Pricing &amp; Description</Num>
        <div className='grid md:grid-cols-2 gap-4'>
          <div>
            <label className={lbl}>Select Colour {req}</label>
            <div className='flex items-center gap-2'>
              {/* Picking a colour pre-fills its colour code (hex) into the field. */}
              <input type='color' value={cur.colorCode} onChange={(e) => setCur((c) => ({ ...c, colorCode: e.target.value, color: e.target.value.toUpperCase() }))} className='w-11 h-11 rounded-lg border border-line p-0.5 shrink-0' />
              <input value={cur.color} onChange={(e) => setC('color', e.target.value)} className={inp} placeholder='e.g. Navy Blue or #1E3A8A' />
            </div>
            <p className='text-[11px] text-muted mt-1'>Add product details, images and videos for each colour.</p>
          </div>
          <div><label className={lbl}>MRP ({currency}) {req}</label><input type='number' value={cur.mrp} onChange={(e) => setMrp(e.target.value)} className={inp} placeholder='Enter MRP' /></div>
          <div>
            <label className={lbl}>Size {req}</label>
            <div className='flex flex-wrap gap-1.5'>{SIZES.map((s) => <button key={s} type='button' onClick={() => toggleSize(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${cur.sizes.includes(s) ? 'bg-accent text-white border-accent' : 'bg-white border-line text-muted hover:border-accent/50'}`}>{s}</button>)}</div>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div><label className={lbl}>Selling Price ({currency}) {req}</label><input type='number' value={cur.sellingPrice} onChange={(e) => setSelling(e.target.value)} className={inp} placeholder='Enter selling price' /></div>
            <div><label className={lbl}>Discount (%) <span className='text-[10px] font-normal text-success'>auto</span></label><input type='number' value={cur.discount} onChange={(e) => setC('discount', e.target.value)} className={inp} placeholder='auto from MRP & selling price' /></div>
          </div>
          <div><label className={lbl}>Product Description {req}</label><textarea value={cur.description} onChange={(e) => setC('description', e.target.value)} className={inp + ' h-24 resize-none'} placeholder='Write product description…' /></div>
          <div className='rounded-xl bg-accent/5 border border-accent/20 p-3 self-end text-sm text-muted flex items-center gap-2'>🧮 Discounted price: <span className='font-bold text-accent'>{discountedPrice ? `${currency}${discountedPrice}` : '—'}</span> (calculated automatically)</div>
        </div>

        {/* 4. Images & Video */}
        <h3 className='text-base font-heading font-bold text-fg mt-6 mb-1'>4. Images &amp; Video (For Selected Colour)</h3>
        <p className='text-xs text-muted mb-3'>Upload multiple images and videos for this colour.</p>
        <div className='grid md:grid-cols-2 gap-4'>
          <div>
            <label className={lbl}>Product Images</label>
            <label className='flex flex-col items-center justify-center gap-1 h-24 rounded-xl border-2 border-dashed border-line bg-surface-2 cursor-pointer hover:border-accent/50'><UploadCloud size={20} className='text-faint' /><span className='text-sm text-muted'>Click to upload or drag and drop</span><span className='text-[10px] text-faint'>JPG, PNG, WEBP (Max. 5MB each)</span><input type='file' accept='image/*' multiple hidden onChange={onImages} /></label>
            {cur.images.length > 0 && <div className='flex flex-wrap gap-2 mt-2'>{cur.images.map((f, i) => <div key={i} className='relative w-14 h-14 rounded-lg overflow-hidden border border-line'><img src={URL.createObjectURL(f)} alt='' className='w-full h-full object-cover' /><button onClick={() => setC('images', cur.images.filter((_, idx) => idx !== i))} className='absolute top-0.5 right-0.5 w-4 h-4 grid place-items-center rounded-full bg-black/60 text-white'><X size={10} /></button></div>)}</div>}
            <p className='text-[11px] text-faint mt-1'>You can upload up to 10 images</p>
          </div>
          <div>
            <label className={lbl}>Product Videos (Optional)</label>
            <label className='flex flex-col items-center justify-center gap-1 h-24 rounded-xl border-2 border-dashed border-line bg-surface-2 cursor-pointer hover:border-accent/50'><UploadCloud size={20} className='text-faint' /><span className='text-sm text-muted'>Click to upload or drag and drop</span><span className='text-[10px] text-faint'>MP4, MOV (Max. 50MB each)</span><input type='file' accept='video/*' multiple hidden onChange={onVideos} /></label>
            {cur.videos.length > 0 && <div className='flex flex-wrap gap-2 mt-2'>{cur.videos.map((f, i) => <span key={i} className='inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-surface-2 border border-line'>{f.name.slice(0, 12)}<button onClick={() => setC('videos', cur.videos.filter((_, idx) => idx !== i))}><X size={11} /></button></span>)}</div>}
            <p className='text-[11px] text-faint mt-1'>You can upload up to 3 videos</p>
          </div>
        </div>
        <div className='flex justify-end mt-4'><button onClick={addColour} className='inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl border border-accent text-accent hover:bg-accent/5'><Plus size={15} /> Add Different Colour</button></div>
      </div>

      {/* All Colours Added */}
      <div className='glass rounded-2xl p-6 mb-5'>
        <h2 className='text-base font-heading font-bold text-fg mb-4'>All Colours Added</h2>
        <div className='overflow-x-auto rounded-xl border border-line'>
          <table className='w-full text-sm'>
            <thead><tr className='text-left text-[11px] font-semibold uppercase tracking-wider text-muted bg-surface-2 border-b border-line'>
              <th className='py-3 px-3'>#</th><th className='py-3 px-3'>Colour</th><th className='py-3 px-3'>Images</th><th className='py-3 px-3'>Videos</th><th className='py-3 px-3'>Size</th><th className='py-3 px-3'>MRP</th><th className='py-3 px-3'>Selling Price</th><th className='py-3 px-3'>Discount</th><th className='py-3 px-3'>Action</th>
            </tr></thead>
            <tbody>
              {colours.length === 0 ? <tr><td colSpan={9} className='py-6 text-center text-muted'>No colours added yet.</td></tr> :
                colours.map((c, i) => (
                  <tr key={i} className='border-b border-line/70 last:border-0'>
                    <td className='py-2.5 px-3 text-muted'>{i + 1}</td>
                    <td className='py-2.5 px-3'><span className='inline-flex items-center gap-2'><span className='w-4 h-4 rounded-full border border-line' style={{ background: c.colorCode }} /> {c.color}</span></td>
                    <td className='py-2.5 px-3'><div className='flex gap-1'>{c.images.slice(0, 3).map((f, k) => <img key={k} src={URL.createObjectURL(f)} alt='' className='w-7 h-7 rounded object-cover border border-line' />)}{c.images.length > 3 && <span className='text-xs text-muted'>+{c.images.length - 3}</span>}</div></td>
                    <td className='py-2.5 px-3 text-muted'>{c.videos.length}</td>
                    <td className='py-2.5 px-3 text-fg'>{c.sizes.join(', ')}</td>
                    <td className='py-2.5 px-3 text-fg'>{c.mrp}</td>
                    <td className='py-2.5 px-3 text-fg'>{c.sellingPrice}</td>
                    <td className='py-2.5 px-3 text-success font-semibold'>{c.discount ? `${c.discount}%` : '—'}</td>
                    <td className='py-2.5 px-3'><div className='flex gap-1'><button className='grid place-items-center w-8 h-8 rounded-lg border border-line text-accent'><Pencil size={13} /></button><button onClick={() => removeColour(i)} className='grid place-items-center w-8 h-8 rounded-lg border border-line text-danger'><Trash2 size={13} /></button></div></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className='flex items-center justify-between'>
        <button onClick={() => navigate('/products')} className='px-5 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg'>Cancel</button>
        <div className='flex items-center gap-2'>
          <button onClick={() => submit(true)} disabled={busy} className='inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-white border border-accent text-accent'><Save size={15} /> Save as Draft</button>
          <button onClick={() => submit(false)} disabled={busy} className='inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl bg-accent text-white hover:bg-accent-dark'><Send size={15} /> {busy ? 'Submitting…' : 'Submit for Approval'}</button>
        </div>
      </div>
    </div>
  )
}

export default AddProductNew
