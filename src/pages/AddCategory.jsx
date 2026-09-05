import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import { RefreshCw, ArrowLeft, Save, Send, Image as ImageLucide } from 'lucide-react'

const lbl = 'block text-sm font-semibold text-fg mb-1.5'
const req = <span className='text-danger'>*</span>
const inp = 'w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-line focus:border-accent outline-none'
const hint = 'text-[11px] text-muted mt-1'

const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

// Add / Edit a single (main) category. Sub- and child-categories are managed
// from the Category list (via the + buttons on each row), not from here.
const AddCategory = ({ token }) => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const editId = params.get('edit')

  const [main, setMain] = useState({
    name: '', slug: '', displayOrder: '', status: 'active', displayInMenu: 'Yes',
    startDate: '', endDate: '', metaTitle: '', metaDescription: '',
  })
  const [image, setImage] = useState(null)
  const [banner, setBanner] = useState(null)
  const [existingImage, setExistingImage] = useState('')
  const [existingBanner, setExistingBanner] = useState('')
  const [tree, setTree] = useState([])
  const [busy, setBusy] = useState(false)

  const setM = (f, v) => setMain((m) => ({ ...m, [f]: v }))

  // In edit mode, prefill the category and load the tree (to list its children).
  useEffect(() => {
    if (!editId) return
    axios.get(`${backendUrl}/api/category/${editId}`).then(({ data }) => {
      if (!data.success) return toast.error(data.message)
      const c = data.category
      setMain({
        name: c.name || '', slug: c.slug || '', displayOrder: c.displayOrder ?? '',
        status: c.status || 'active', displayInMenu: c.displayInMenu === false ? 'No' : 'Yes',
        startDate: c.startDate ? c.startDate.slice(0, 10) : '', endDate: c.endDate ? c.endDate.slice(0, 10) : '',
        metaTitle: c.metaTitle || '', metaDescription: c.metaDescription || '',
      })
      setExistingImage(c.image || ''); setExistingBanner(c.banner || '')
    }).catch(() => toast.error('Failed to load category'))
    axios.get(`${backendUrl}/api/category/tree`, { headers: { token } })
      .then(({ data }) => data.success && setTree(data.tree)).catch(() => {})
  }, [editId])

  // Find this category's node in the tree so we can show its sub/child list.
  const node = useMemo(() => {
    const find = (list) => { for (const n of list || []) { if (n._id === editId) return n; const f = find(n.kids); if (f) return f } return null }
    return find(tree)
  }, [tree, editId])

  const submit = async (asDraft = false) => {
    if (!main.name.trim()) return toast.error('Category name is required')
    if (!image && !existingImage) return toast.error('Category image is required')
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

      const url = editId ? `${backendUrl}/api/category/update/${editId}` : `${backendUrl}/api/category/add`
      const method = editId ? 'put' : 'post'
      const { data } = await axios[method](url, fd, { headers: { token } })
      if (data.success) { toast.success(editId ? 'Category updated' : 'Category created'); navigate('/categories') }
      else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || err.message) }
    finally { setBusy(false) }
  }

  const Upload = ({ file, existing, onPick }) => (
    <label className='flex flex-col items-center justify-center gap-1 h-32 rounded-xl border-2 border-dashed border-line bg-surface-2 cursor-pointer hover:border-accent/50 overflow-hidden'>
      {file ? <img src={URL.createObjectURL(file)} alt='' className='h-full w-full object-cover' />
        : existing ? <img src={existing} alt='' className='h-full w-full object-cover' />
        : (<><ImageLucide size={22} className='text-faint' /><span className='text-sm font-medium text-muted'>Upload Image</span><span className='text-[11px] text-faint'>JPG, PNG, WEBP (Max 2MB)</span></>)}
      <input type='file' accept='image/*' hidden onChange={(e) => onPick(e.target.files?.[0] || null)} />
    </label>
  )

  return (
    <div className='p-6'>
      {/* Header */}
      <div className='flex items-start justify-between mb-5'>
        <div>
          <h1 className='text-2xl font-heading font-extrabold text-fg'>{editId ? 'Edit Category' : 'Add Category'}</h1>
          <p className='text-xs text-muted mt-1'>Dashboard <span className='text-faint'>›</span> Categories <span className='text-faint'>›</span> {editId ? 'Edit' : 'Add'} Category</p>
        </div>
        <button onClick={() => navigate('/categories')} className='inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg hover:bg-surface-2'><ArrowLeft size={15} /> Back to Categories</button>
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
          <div><label className={lbl}>Category Image {req}</label><Upload file={image} existing={existingImage} onPick={setImage} /></div>
          <div><label className={lbl}>Banner Image (Optional)</label><Upload file={banner} existing={existingBanner} onPick={setBanner} /></div>
          <div>
            <label className={lbl}>Display In Menu {req}</label>
            <select value={main.displayInMenu} onChange={(e) => setM('displayInMenu', e.target.value)} className={inp}><option>Yes</option><option>No</option></select>
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

      {/* Existing sub / child categories (edit mode only, read-only overview) */}
      {editId && node && (
        <div className='glass rounded-2xl p-6 mb-5'>
          <h2 className='text-lg font-heading font-bold text-fg mb-1'>Sub &amp; Child Categories</h2>
          <p className='text-xs text-muted mb-4'>Add or manage these from the Category list using the <span className='font-semibold text-accent'>+</span> buttons on each row.</p>
          {(node.kids || []).length === 0 ? (
            <p className='text-sm text-muted'>No sub-categories yet.</p>
          ) : (
            <div className='space-y-3'>
              {node.kids.map((sub) => (
                <div key={sub._id} className='rounded-xl border border-line p-3'>
                  <div className='flex items-center gap-2'>
                    <span className='px-2 py-0.5 rounded-md bg-accent/10 text-accent text-[11px] font-bold'>SUB</span>
                    <span className='font-semibold text-fg'>{sub.name}</span>
                    <span className='text-[11px] text-muted'>( {sub.code} )</span>
                    <span className={`ml-auto px-2 py-0.5 rounded-full text-[11px] font-semibold ${(sub.status || 'active') === 'active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>{(sub.status || 'active') === 'active' ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  {(sub.kids || []).length > 0 && (
                    <div className='mt-2 ml-4 pl-3 border-l border-line space-y-1.5'>
                      {sub.kids.map((ch) => (
                        <div key={ch._id} className='flex items-center gap-2 text-sm'>
                          <span className='px-2 py-0.5 rounded-md bg-violet/10 text-violet text-[10px] font-bold'>CHILD</span>
                          <span className='text-fg'>{ch.name}</span>
                          <span className='text-[11px] text-muted'>( {ch.code} )</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className='flex items-center justify-between'>
        <button onClick={() => navigate('/categories')} className='inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg hover:bg-surface-2'><ArrowLeft size={15} /> Back</button>
        <div className='flex items-center gap-2'>
          {!editId && <button onClick={() => submit(true)} disabled={busy} className='inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-white border border-line text-fg hover:bg-surface-2'><Save size={15} /> Save as Draft</button>}
          <button onClick={() => submit(false)} disabled={busy} className='inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl bg-accent text-white hover:bg-accent-dark'><Send size={15} /> {busy ? 'Saving…' : editId ? 'Update' : 'Submit'}</button>
        </div>
      </div>
    </div>
  )
}

export default AddCategory
