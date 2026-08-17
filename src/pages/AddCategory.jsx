import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import { RefreshCw, Plus, ArrowLeft, Save, Send, ImageIcon, Trash2, Pencil, Check, Image as ImageLucide } from 'lucide-react'

const lbl = 'block text-sm font-semibold text-fg mb-1.5'
const req = <span className='text-danger'>*</span>
const inp = 'w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-line focus:border-accent outline-none'
const hint = 'text-[11px] text-muted mt-1'

const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const blankSub = () => ({ name: '', slug: '', displayOrder: 1, status: 'active', image: null })
const blankChild = () => ({ subIndex: 0, name: '', slug: '', displayOrder: 1, status: 'active', image: null })

// Add Category — main category + sub-categories + child-categories in one submit
// (matches the client design; timer/countdown intentionally omitted).
const AddCategory = ({ token }) => {
  const navigate = useNavigate()
  const [main, setMain] = useState({
    name: '', slug: '', displayOrder: '', status: 'active', displayInMenu: 'Yes',
    startDate: '', endDate: '', metaTitle: '', metaDescription: '', parentCategory: '',
  })
  const [image, setImage] = useState(null)
  const [banner, setBanner] = useState(null)
  const [subs, setSubs] = useState([blankSub()])
  const [children, setChildren] = useState([])
  const [busy, setBusy] = useState(false)

  const setM = (f, v) => setMain((m) => ({ ...m, [f]: v }))
  const updSub = (i, f, v) => setSubs((s) => s.map((r, idx) => idx === i ? { ...r, [f]: v } : r))
  const updChild = (i, f, v) => setChildren((c) => c.map((r, idx) => idx === i ? { ...r, [f]: v } : r))

  const submit = async (asDraft = false) => {
    if (!main.name.trim()) return toast.error('Category name is required')
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('name', main.name)
      fd.append('slug', main.slug || slugify(main.name))
      fd.append('displayOrder', main.displayOrder || 0)
      fd.append('status', asDraft ? 'inactive' : main.status)
      fd.append('displayInMenu', main.displayInMenu === 'Yes')
      if (main.startDate) fd.append('startDate', main.startDate)
      if (main.endDate) fd.append('endDate', main.endDate)
      fd.append('metaTitle', main.metaTitle)
      fd.append('metaDescription', main.metaDescription)
      if (image) fd.append('image', image)
      if (banner) fd.append('banner', banner)

      const cleanSubs = subs.filter((s) => s.name.trim())
      const cleanChildren = children.filter((c) => c.name.trim())
      fd.append('subCategories', JSON.stringify(cleanSubs.map((s) => ({ name: s.name, slug: s.slug || slugify(s.name), displayOrder: s.displayOrder, status: s.status }))))
      fd.append('childCategories', JSON.stringify(cleanChildren.map((c) => ({ name: c.name, slug: c.slug || slugify(c.name), subIndex: Number(c.subIndex) || 0, displayOrder: c.displayOrder, status: c.status }))))
      subs.forEach((s, i) => { if (s.image) fd.append(`subImage_${i}`, s.image) })
      children.forEach((c, i) => { if (c.image) fd.append(`childImage_${i}`, c.image) })

      const { data } = await axios.post(backendUrl + '/api/category/tree', fd, { headers: { token } })
      if (data.success) { toast.success(asDraft ? 'Saved as draft' : 'Category created'); navigate('/categories') }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || err.message) }
    finally { setBusy(false) }
  }

  const Upload = ({ file, onPick }) => (
    <label className='flex flex-col items-center justify-center gap-1 h-32 rounded-xl border-2 border-dashed border-line bg-surface-2 cursor-pointer hover:border-accent/50 overflow-hidden'>
      {file ? <img src={URL.createObjectURL(file)} alt='' className='h-full w-full object-cover' /> : (
        <><ImageLucide size={22} className='text-faint' /><span className='text-sm font-medium text-muted'>Upload Image</span><span className='text-[11px] text-faint'>JPG, PNG, WEBP (Max 2MB)</span></>
      )}
      <input type='file' accept='image/*' hidden onChange={(e) => onPick(e.target.files?.[0] || null)} />
    </label>
  )

  return (
    <div className='p-6'>
      {/* Header */}
      <div className='flex items-start justify-between mb-5'>
        <div>
          <h1 className='text-2xl font-heading font-extrabold text-fg'>Add Category</h1>
          <p className='text-xs text-muted mt-1'>Dashboard <span className='text-faint'>›</span> Categories <span className='text-faint'>›</span> Add Category</p>
        </div>
        <div className='flex items-center gap-2'>
          <button onClick={() => window.location.reload()} className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg hover:bg-surface-2'><RefreshCw size={15} /> Refresh</button>
          <button onClick={() => navigate('/categories/add')} className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-fg text-white'><Plus size={15} /> Add Category</button>
        </div>
      </div>

      {/* Category Information */}
      <div className='glass rounded-2xl p-6 mb-5'>
        <h2 className='text-lg font-heading font-bold text-fg mb-5'>Category Information</h2>

        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-4'>
          <div><label className={lbl}>Category Name {req}</label><input value={main.name} onChange={(e) => setM('name', e.target.value)} className={inp} placeholder='Enter category name' /></div>
          <div><label className={lbl}>Slug {req}</label><input value={main.slug} onChange={(e) => setM('slug', e.target.value)} className={inp} placeholder='Enter slug' /><p className={hint}>URL friendly unique slug</p></div>
          <div><label className={lbl}>Display Order</label><input type='number' value={main.displayOrder} onChange={(e) => setM('displayOrder', e.target.value)} className={inp} placeholder='Enter display order' /><p className={hint}>Show in navigation order</p></div>
          <div><label className={lbl}>Status {req}</label><select value={main.status} onChange={(e) => setM('status', e.target.value)} className={inp}><option value='active'>Enabled</option><option value='inactive'>Disabled</option></select></div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-4'>
          <div><label className={lbl}>Category Image {req}</label><Upload file={image} onPick={setImage} /></div>
          <div><label className={lbl}>Banner Image (Optional)</label><Upload file={banner} onPick={setBanner} /></div>
          <div>
            <label className={lbl}>Display In Menu {req}</label>
            <select value={main.displayInMenu} onChange={(e) => setM('displayInMenu', e.target.value)} className={inp}><option>Yes</option><option>No</option></select>
            <label className={lbl + ' mt-4'}>Parent Category</label>
            <select value={main.parentCategory} onChange={(e) => setM('parentCategory', e.target.value)} className={inp}><option value=''>None (main category)</option></select>
            <p className={hint}>Select parent for this category</p>
          </div>
          <div>
            <label className={lbl}>Start Date (Display From)</label><input type='date' value={main.startDate} onChange={(e) => setM('startDate', e.target.value)} className={inp} />
            <label className={lbl + ' mt-4'}>End Date (Display To)</label><input type='date' value={main.endDate} onChange={(e) => setM('endDate', e.target.value)} className={inp} />
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div><label className={lbl}>Meta Title (SEO)</label><input value={main.metaTitle} onChange={(e) => setM('metaTitle', e.target.value)} className={inp} placeholder='Enter meta title' /></div>
          <div><label className={lbl}>Meta Description (SEO)</label><textarea value={main.metaDescription} onChange={(e) => setM('metaDescription', e.target.value)} className={inp + ' h-[46px] resize-none'} placeholder='Enter meta description' /></div>
        </div>
      </div>

      {/* Sub Category */}
      <div className='glass rounded-2xl p-6 mb-5'>
        <div className='flex items-center gap-3 mb-4'>
          <h2 className='text-lg font-heading font-bold text-fg'>Sub Category</h2>
          <button onClick={() => setSubs((s) => [...s, blankSub()])} className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-fg text-white'><Plus size={13} /> Add Sub Category</button>
        </div>
        <RowTable
          headers={['S. No.', 'Category', 'Sub Category Name *', 'Slug *', 'Image', 'Display Order', 'Status', 'Action', 'Done']}
          rows={subs} mainName={main.name || 'T-Shirts'}
          onUpd={updSub} onRemove={(i) => setSubs((s) => s.filter((_, idx) => idx !== i))}
        />
      </div>

      {/* Child Category */}
      <div className='glass rounded-2xl p-6 mb-5'>
        <div className='flex items-center gap-3 mb-4'>
          <h2 className='text-lg font-heading font-bold text-fg'>Child Category</h2>
          <button onClick={() => setChildren((c) => [...c, blankChild()])} className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-fg text-white'><Plus size={13} /> Add Child Category</button>
        </div>
        <RowTable
          headers={['S. No.', 'Category', 'Sub Category', 'Child Category Name *', 'Slug *', 'Image', 'Display Order', 'Status', 'Action', 'Done']}
          rows={children} mainName={main.name || 'T-Shirts'} isChild subs={subs}
          onUpd={updChild} onRemove={(i) => setChildren((c) => c.filter((_, idx) => idx !== i))}
        />
      </div>

      {/* Footer */}
      <div className='flex items-center justify-between'>
        <button onClick={() => navigate('/categories')} className='inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg hover:bg-surface-2'><ArrowLeft size={15} /> Back</button>
        <div className='flex items-center gap-2'>
          <button onClick={() => submit(true)} disabled={busy} className='inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg hover:bg-surface-2'><Save size={15} /> Save as Draft</button>
          <button onClick={() => submit(false)} disabled={busy} className='inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl bg-fg text-white hover:bg-fg/90'><Send size={15} /> {busy ? 'Submitting…' : 'Submit'}</button>
        </div>
      </div>
    </div>
  )
}

const RowTable = ({ headers, rows, onUpd, onRemove, mainName, isChild, subs }) => {
  const cell = 'px-3 py-2.5 text-sm rounded-lg bg-white border border-line focus:border-accent outline-none'
  return (
    <div className='overflow-x-auto rounded-xl border border-line'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='text-left text-[11px] font-semibold uppercase tracking-wider text-muted bg-surface-2 border-b border-line'>
            {headers.map((h) => <th key={h} className='py-3 px-3'>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? <tr><td colSpan={headers.length} className='py-6 text-center text-muted text-sm'>No rows — click “Add”.</td></tr> :
            rows.map((r, i) => (
              <tr key={i} className='border-b border-line/70 last:border-0'>
                <td className='py-2.5 px-3 text-muted'>{i + 1}</td>
                <td className='py-2.5 px-3 text-fg'>{mainName}</td>
                {isChild && (
                  <td className='py-2.5 px-3'>
                    <select value={r.subIndex} onChange={(e) => onUpd(i, 'subIndex', e.target.value)} className={cell}>
                      {(subs || []).filter((s) => s.name).map((s, si) => <option key={si} value={si}>{s.name}</option>)}
                    </select>
                  </td>
                )}
                <td className='py-2.5 px-3'><input value={r.name} onChange={(e) => onUpd(i, 'name', e.target.value)} className={cell} placeholder='Name' /></td>
                <td className='py-2.5 px-3'><input value={r.slug} onChange={(e) => onUpd(i, 'slug', e.target.value)} className={cell} placeholder='slug' /></td>
                <td className='py-2.5 px-3'>
                  <label className='grid place-items-center w-11 h-11 rounded-lg border border-line bg-surface-2 cursor-pointer overflow-hidden'>
                    {r.image ? <img src={URL.createObjectURL(r.image)} alt='' className='w-full h-full object-cover' /> : <ImageIcon size={15} className='text-faint' />}
                    <input type='file' accept='image/*' hidden onChange={(e) => onUpd(i, 'image', e.target.files?.[0] || null)} />
                  </label>
                </td>
                <td className='py-2.5 px-3'><input type='number' value={r.displayOrder} onChange={(e) => onUpd(i, 'displayOrder', e.target.value)} className={cell + ' w-20'} /></td>
                <td className='py-2.5 px-3'><select value={r.status} onChange={(e) => onUpd(i, 'status', e.target.value)} className={cell}><option value='active'>Enabled</option><option value='inactive'>Disabled</option></select></td>
                <td className='py-2.5 px-3'><div className='flex items-center gap-1'><button className='grid place-items-center w-8 h-8 rounded-lg border border-line text-muted hover:text-accent'><Pencil size={13} /></button><button onClick={() => onRemove(i)} className='grid place-items-center w-8 h-8 rounded-lg border border-line text-muted hover:text-danger'><Trash2 size={13} /></button></div></td>
                <td className='py-2.5 px-3'><span className='grid place-items-center w-8 h-8 rounded-full border border-success/40 text-success mx-auto'><Check size={14} /></span></td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}

export default AddCategory
