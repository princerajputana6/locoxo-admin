import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import { Trash2, Edit, TrendingUp, Users, DollarSign, MousePointer } from 'lucide-react'

const Influencers = ({ token }) => {
  const [influencers, setInfluencers] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingInfluencer, setEditingInfluencer] = useState(null)
  const [products, setProducts] = useState([])
  
  // Form states
  const [image, setImage] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [instagramHandle, setInstagramHandle] = useState("")
  const [productId, setProductId] = useState("")
  const [commissionRate, setCommissionRate] = useState("10")

  const fetchInfluencers = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/influencer/list', { headers: { token } })
      if (response.data.success) {
        setInfluencers(response.data.influencers)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/product/list')
      if (response.data.success) {
        setProducts(response.data.products)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const deleteInfluencer = async (id) => {
    try {
      const response = await axios.delete(backendUrl + `/api/influencer/${id}`, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        await fetchInfluencers()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      const response = await axios.put(
        backendUrl + `/api/influencer/${id}`,
        { status: newStatus },
        { headers: { token } }
      )
      if (response.data.success) {
        toast.success('Status updated successfully')
        await fetchInfluencers()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const handleAddInfluencer = async (e) => {
    e.preventDefault()

    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('email', email)
      formData.append('password', password)
      formData.append('phone', phone)
      formData.append('instagramHandle', instagramHandle)
      formData.append('productId', productId)
      formData.append('commissionRate', commissionRate)
      if (image) formData.append('image', image)

      const response = await axios.post(backendUrl + '/api/influencer/add', formData, { headers: { token } })

      if (response.data.success) {
        toast.success('Influencer added successfully')
        resetForm()
        setShowAddForm(false)
        await fetchInfluencers()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const handleEditInfluencer = async (e) => {
    e.preventDefault()

    try {
      const response = await axios.put(
        backendUrl + `/api/influencer/${editingInfluencer._id}`,
        {
          name,
          email,
          phone,
          instagramHandle,
          productId,
          commissionRate
        },
        { headers: { token } }
      )

      if (response.data.success) {
        toast.success('Influencer updated successfully')
        resetForm()
        setShowEditForm(false)
        setEditingInfluencer(null)
        await fetchInfluencers()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const openEditForm = (influencer) => {
    setEditingInfluencer(influencer)
    setName(influencer.name)
    setEmail(influencer.email)
    setPhone(influencer.phone || '')
    setInstagramHandle(influencer.instagramHandle || '')
    setProductId(influencer.productId._id)
    setCommissionRate(influencer.commissionRate.toString())
    setShowEditForm(true)
  }

  const resetForm = () => {
    setImage(false)
    setName('')
    setEmail('')
    setPassword('')
    setPhone('')
    setInstagramHandle('')
    setProductId('')
    setCommissionRate('10')
  }

  useEffect(() => {
    fetchInfluencers()
    fetchProducts()
  }, [])

  return (
    <div className='p-4 sm:p-10 w-full'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold'>Influencer Management</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className='bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors'
        >
          {showAddForm ? 'Cancel' : '+ Add Influencer'}
        </button>
      </div>

      {/* Add Influencer Form */}
      {showAddForm && (
        <div className='bg-white p-6 rounded-lg shadow-md mb-6'>
          <h2 className='text-xl font-bold mb-4'>Add New Influencer</h2>
          <form onSubmit={handleAddInfluencer} className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium mb-2'>Influencer Photo *</label>
              <input
                onChange={(e) => setImage(e.target.files[0])}
                type='file'
                accept='image/*'
                required
                className='w-full border border-gray-300 px-3 py-2 rounded'
              />
            </div>

            <div>
              <label className='block text-sm font-medium mb-2'>Full Name *</label>
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                type='text'
                placeholder='John Doe'
                required
                className='w-full border border-gray-300 px-3 py-2 rounded'
              />
            </div>

            <div>
              <label className='block text-sm font-medium mb-2'>Email *</label>
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                type='email'
                placeholder='influencer@example.com'
                required
                className='w-full border border-gray-300 px-3 py-2 rounded'
              />
            </div>

            <div>
              <label className='block text-sm font-medium mb-2'>Password *</label>
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                type='password'
                placeholder='Enter password for influencer login'
                required
                className='w-full border border-gray-300 px-3 py-2 rounded'
              />
              <p className='text-xs text-gray-500 mt-1'>Influencer will use this to login</p>
            </div>

            <div>
              <label className='block text-sm font-medium mb-2'>Phone</label>
              <input
                onChange={(e) => setPhone(e.target.value)}
                value={phone}
                type='tel'
                placeholder='+91 9876543210'
                className='w-full border border-gray-300 px-3 py-2 rounded'
              />
            </div>

            <div>
              <label className='block text-sm font-medium mb-2'>Instagram Handle</label>
              <input
                onChange={(e) => setInstagramHandle(e.target.value)}
                value={instagramHandle}
                type='text'
                placeholder='@username'
                className='w-full border border-gray-300 px-3 py-2 rounded'
              />
            </div>

            <div>
              <label className='block text-sm font-medium mb-2'>Product *</label>
              <select
                onChange={(e) => setProductId(e.target.value)}
                value={productId}
                required
                className='w-full border border-gray-300 px-3 py-2 rounded'
              >
                <option value=''>Select Product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium mb-2'>Commission Rate (%)</label>
              <input
                onChange={(e) => setCommissionRate(e.target.value)}
                value={commissionRate}
                type='number'
                min='0'
                max='100'
                placeholder='10'
                className='w-full border border-gray-300 px-3 py-2 rounded'
              />
            </div>

            <div className='md:col-span-2'>
              <button
                type='submit'
                className='bg-black text-white px-8 py-2 rounded hover:bg-gray-800 transition-colors'
              >
                Add Influencer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Influencer Form */}
      {showEditForm && (
        <div className='bg-white p-6 rounded-lg shadow-md mb-6'>
          <h2 className='text-xl font-bold mb-4'>Edit Influencer</h2>
          <form onSubmit={handleEditInfluencer} className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium mb-2'>Full Name *</label>
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                type='text'
                required
                className='w-full border border-gray-300 px-3 py-2 rounded'
              />
            </div>

            <div>
              <label className='block text-sm font-medium mb-2'>Email *</label>
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                type='email'
                required
                className='w-full border border-gray-300 px-3 py-2 rounded'
              />
            </div>

            <div>
              <label className='block text-sm font-medium mb-2'>Phone</label>
              <input
                onChange={(e) => setPhone(e.target.value)}
                value={phone}
                type='tel'
                className='w-full border border-gray-300 px-3 py-2 rounded'
              />
            </div>

            <div>
              <label className='block text-sm font-medium mb-2'>Instagram Handle</label>
              <input
                onChange={(e) => setInstagramHandle(e.target.value)}
                value={instagramHandle}
                type='text'
                className='w-full border border-gray-300 px-3 py-2 rounded'
              />
            </div>

            <div>
              <label className='block text-sm font-medium mb-2'>Product *</label>
              <select
                onChange={(e) => setProductId(e.target.value)}
                value={productId}
                required
                className='w-full border border-gray-300 px-3 py-2 rounded'
              >
                <option value=''>Select Product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium mb-2'>Commission Rate (%)</label>
              <input
                onChange={(e) => setCommissionRate(e.target.value)}
                value={commissionRate}
                type='number'
                min='0'
                max='100'
                className='w-full border border-gray-300 px-3 py-2 rounded'
              />
            </div>

            <div className='md:col-span-2 flex gap-3'>
              <button
                type='submit'
                className='bg-black text-white px-8 py-2 rounded hover:bg-gray-800 transition-colors'
              >
                Update Influencer
              </button>
              <button
                type='button'
                onClick={() => {
                  setShowEditForm(false)
                  setEditingInfluencer(null)
                  resetForm()
                }}
                className='bg-gray-300 text-black px-8 py-2 rounded hover:bg-gray-400 transition-colors'
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Influencers List */}
      <div className='bg-white rounded-lg shadow-md overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50 border-b'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Image</th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Name</th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Instagram</th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Product</th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Stats</th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Commission</th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Status</th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {influencers.map((influencer) => (
                <tr key={influencer._id} className='hover:bg-gray-50'>
                  <td className='px-6 py-4'>
                    <img
                      src={influencer.image}
                      alt={influencer.name}
                      className='w-16 h-16 object-cover rounded-lg'
                    />
                  </td>
                  <td className='px-6 py-4'>
                    <div>
                      <p className='font-medium'>{influencer.name}</p>
                      <p className='text-sm text-gray-500'>{influencer.email}</p>
                    </div>
                  </td>
                  <td className='px-6 py-4 text-sm'>{influencer.instagramHandle || '-'}</td>
                  <td className='px-6 py-4'>
                    <div>
                      <p className='font-medium text-sm'>{influencer.productId?.name}</p>
                      <p className='text-xs text-gray-500'>{currency}{influencer.productId?.price}</p>
                    </div>
                  </td>
                  <td className='px-6 py-4'>
                    <div className='space-y-1 text-xs'>
                      <div className='flex items-center gap-1'>
                        <MousePointer size={12} className='text-blue-500' />
                        <span>{influencer.clicks} clicks</span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <Users size={12} className='text-green-500' />
                        <span>{influencer.conversions} sales</span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <DollarSign size={12} className='text-purple-500' />
                        <span>{currency}{influencer.totalEarnings.toFixed(2)}</span>
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 text-sm font-medium'>{influencer.commissionRate}%</td>
                  <td className='px-6 py-4'>
                    <button
                      onClick={() => toggleStatus(influencer._id, influencer.status)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        influencer.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {influencer.status}
                    </button>
                  </td>
                  <td className='px-6 py-4'>
                    <div className='flex gap-2'>
                      <button
                        onClick={() => openEditForm(influencer)}
                        className='p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors'
                        title='Edit'
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this influencer?')) {
                            deleteInfluencer(influencer._id)
                          }
                        }}
                        className='p-2 text-red-600 hover:bg-red-50 rounded transition-colors'
                        title='Delete'
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {influencers.length === 0 && (
          <div className='text-center py-12'>
            <TrendingUp size={48} className='mx-auto text-gray-300 mb-4' />
            <p className='text-gray-500 text-lg'>No influencers added yet</p>
            <p className='text-gray-400 text-sm mt-2'>Click "Add Influencer" to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Influencers
