import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const Banners = ({ token }) => {
  const [banners, setBanners] = useState([])
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [image, setImage] = useState(null)
  const [link, setLink] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [placement, setPlacement] = useState('after-hero')

  const placementOptions = [
    { value: 'after-hero', label: 'After Hero Section' },
    { value: 'after-instagram', label: 'After Instagram Section' },
    { value: 'after-match-mood', label: 'After Match the Mood' },
    { value: 'after-price-combo', label: 'After Price Combo' },
    { value: 'after-best-seller', label: 'After Best Seller' },
    { value: 'after-new-arrivals', label: 'After New Arrivals' },
    { value: 'after-video-intro', label: 'After Video Intro' },
    { value: 'after-favorites', label: 'After Your Favorites' },
    { value: 'after-stats', label: 'After Stats Section' }
  ]

  const fetchBanners = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/banner/list')
      if (response.data.success) {
        setBanners(response.data.banners)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('subtitle', subtitle)
      formData.append('link', link)
      formData.append('isActive', isActive)
      formData.append('placement', placement)
      if (image) formData.append('image', image)

      const response = await axios.post(backendUrl + '/api/banner/add', formData, { headers: { token } })
      if (response.data.success) {
        toast.success('Banner created successfully')
        resetForm()
        fetchBanners()
      }
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || error.message)
    }
  }

  const deleteBanner = async (id) => {
    if (!confirm('Are you sure you want to delete this banner?')) return

    try {
      const response = await axios.delete(backendUrl + `/api/banner/remove/${id}`, { headers: { token } })
      if (response.data.success) {
        toast.success('Banner deleted successfully')
        fetchBanners()
      }
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || error.message)
    }
  }

  const toggleStatus = async (id, currentStatus) => {
    try {
      const response = await axios.put(
        backendUrl + `/api/banner/toggle/${id}`,
        { isActive: !currentStatus },
        { headers: { token } }
      )
      if (response.data.success) {
        toast.success('Banner status updated')
        fetchBanners()
      }
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || error.message)
    }
  }

  const resetForm = () => {
    setTitle('')
    setSubtitle('')
    setImage(null)
    setLink('')
    setIsActive(true)
    setPlacement('after-hero')
  }

  useEffect(() => {
    fetchBanners()
  }, [])

  return (
    <div className='p-6'>
      <h1 className='text-3xl font-bold mb-8'>Banner Management</h1>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Add Banner Form */}
        <div className='glass border border-white/10 rounded-lg shadow-sm p-6'>
          <h2 className='text-xl font-bold mb-6'>Create New Banner</h2>
          <form onSubmit={onSubmitHandler} className='space-y-4'>
            <div>
              <label className='block text-sm font-semibold mb-2'>Banner Image</label>
              <input
                type='file'
                onChange={(e) => setImage(e.target.files[0])}
                accept='image/*'
                className='w-full px-4 py-3 border border-white/10 rounded-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all'
                required
              />
              {image && (
                <img src={URL.createObjectURL(image)} alt='Preview' className='mt-3 w-full h-32 object-cover rounded-lg' />
              )}
            </div>
            <div>
              <label className='block text-sm font-semibold mb-2'>Title</label>
              <input
                type='text'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className='w-full px-4 py-3 border border-white/10 rounded-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all'
                placeholder='Banner title'
                required
              />
            </div>
            <div>
              <label className='block text-sm font-semibold mb-2'>Subtitle</label>
              <input
                type='text'
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className='w-full px-4 py-3 border border-white/10 rounded-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all'
                placeholder='Banner subtitle'
              />
            </div>
            <div>
              <label className='block text-sm font-semibold mb-2'>Link URL</label>
              <input
                type='text'
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className='w-full px-4 py-3 border border-white/10 rounded-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all'
                placeholder='/collection?category=Men'
              />
            </div>
            <div>
              <label className='block text-sm font-semibold mb-2'>Placement on Home Page</label>
              <select
                value={placement}
                onChange={(e) => setPlacement(e.target.value)}
                className='w-full px-4 py-3 border border-white/10 rounded-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all'
              >
                {placementOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className='w-4 h-4'
                id='bannerActive'
              />
              <label htmlFor='bannerActive' className='text-sm font-medium cursor-pointer'>Active</label>
            </div>
            <button
              type='submit'
              className='w-full bg-accent-gradient text-white py-3 font-semibold rounded-lg hover:brightness-110 transition-colors'
            >
              Create Banner
            </button>
          </form>
        </div>

        {/* Banners List */}
        <div className='lg:col-span-2 glass border border-white/10 rounded-lg shadow-sm p-6'>
          <h2 className='text-xl font-bold mb-6'>All Banners ({banners.length})</h2>
          <div className='grid grid-cols-1 gap-4'>
            {banners.length > 0 ? (
              banners.map((banner, index) => (
                <div key={index} className='border border-white/10 rounded-lg overflow-hidden hover:shadow-md transition-all'>
                  <div className='flex flex-col md:flex-row'>
                    <img src={banner.image} alt={banner.title} className='w-full md:w-48 h-32 object-cover' />
                    <div className='flex-1 p-4'>
                      <div className='flex items-start justify-between mb-2'>
                        <div>
                          <h3 className='font-bold text-lg'>{banner.title}</h3>
                          {banner.subtitle && <p className='text-sm text-muted'>{banner.subtitle}</p>}
                          {banner.link && <p className='text-xs text-muted mt-1'>Link: {banner.link}</p>}
                          {banner.placement && (
                            <p className='text-xs text-blue-600 mt-1 font-medium'>
                              📍 {placementOptions.find(p => p.value === banner.placement)?.label || banner.placement}
                            </p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${banner.isActive ? 'bg-green-100 text-green-700' : 'bg-white/5 text-fg'}`}>
                          {banner.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className='flex gap-2 mt-3'>
                        <button
                          onClick={() => toggleStatus(banner._id, banner.isActive)}
                          className='px-4 py-2 bg-white/5 text-fg rounded-lg font-semibold hover:bg-white/10 transition-colors text-sm'
                        >
                          {banner.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => deleteBanner(banner._id)}
                          className='px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm'
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className='text-center text-muted py-8'>No banners yet. Create your first banner!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Banners
