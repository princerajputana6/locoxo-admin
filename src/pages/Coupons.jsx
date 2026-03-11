import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const Coupons = ({ token }) => {
  const [coupons, setCoupons] = useState([])
  const [code, setCode] = useState('')
  const [discount, setDiscount] = useState('')
  const [discountType, setDiscountType] = useState('percentage')
  const [expiryDate, setExpiryDate] = useState('')
  const [minPurchase, setMinPurchase] = useState('')
  const [maxDiscount, setMaxDiscount] = useState('')
  const [isActive, setIsActive] = useState(true)

  const fetchCoupons = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/coupon/list', { headers: { token } })
      if (response.data.success) {
        setCoupons(response.data.coupons)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    try {
      const data = {
        code: code.toUpperCase(),
        discount: Number(discount),
        discountType,
        expiryDate,
        minPurchase: Number(minPurchase) || 0,
        maxDiscount: Number(maxDiscount) || 0,
        isActive
      }

      const response = await axios.post(backendUrl + '/api/coupon/add', data, { headers: { token } })
      if (response.data.success) {
        toast.success('Coupon created successfully')
        resetForm()
        fetchCoupons()
      }
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || error.message)
    }
  }

  const deleteCoupon = async (id) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return

    try {
      const response = await axios.delete(backendUrl + `/api/coupon/remove/${id}`, { headers: { token } })
      if (response.data.success) {
        toast.success('Coupon deleted successfully')
        fetchCoupons()
      }
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || error.message)
    }
  }

  const toggleStatus = async (id, currentStatus) => {
    try {
      const response = await axios.put(
        backendUrl + `/api/coupon/toggle/${id}`,
        { isActive: !currentStatus },
        { headers: { token } }
      )
      if (response.data.success) {
        toast.success('Coupon status updated')
        fetchCoupons()
      }
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || error.message)
    }
  }

  const resetForm = () => {
    setCode('')
    setDiscount('')
    setDiscountType('percentage')
    setExpiryDate('')
    setMinPurchase('')
    setMaxDiscount('')
    setIsActive(true)
  }

  useEffect(() => {
    fetchCoupons()
  }, [])

  return (
    <div className='p-6'>
      <h1 className='text-3xl font-bold mb-8'>Coupons & Discounts</h1>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Add Coupon Form */}
        <div className='bg-white border border-gray-200 rounded-lg shadow-sm p-6'>
          <h2 className='text-xl font-bold mb-6'>Create New Coupon</h2>
          <form onSubmit={onSubmitHandler} className='space-y-4'>
            <div>
              <label className='block text-sm font-semibold mb-2'>Coupon Code</label>
              <input
                type='text'
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all uppercase'
                placeholder='e.g., SAVE20'
                required
              />
            </div>
            <div>
              <label className='block text-sm font-semibold mb-2'>Discount Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all'
              >
                <option value='percentage'>Percentage (%)</option>
                <option value='fixed'>Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label className='block text-sm font-semibold mb-2'>Discount Value</label>
              <input
                type='number'
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all'
                placeholder={discountType === 'percentage' ? 'e.g., 20' : 'e.g., 50'}
                required
              />
            </div>
            <div>
              <label className='block text-sm font-semibold mb-2'>Expiry Date</label>
              <input
                type='date'
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all'
                required
              />
            </div>
            <div>
              <label className='block text-sm font-semibold mb-2'>Min Purchase Amount ($)</label>
              <input
                type='number'
                value={minPurchase}
                onChange={(e) => setMinPurchase(e.target.value)}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all'
                placeholder='0'
              />
            </div>
            {discountType === 'percentage' && (
              <div>
                <label className='block text-sm font-semibold mb-2'>Max Discount Amount ($)</label>
                <input
                  type='number'
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value)}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all'
                  placeholder='0 (unlimited)'
                />
              </div>
            )}
            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className='w-4 h-4'
                id='isActive'
              />
              <label htmlFor='isActive' className='text-sm font-medium cursor-pointer'>Active</label>
            </div>
            <button
              type='submit'
              className='w-full bg-black text-white py-3 font-semibold rounded-lg hover:bg-gray-800 transition-colors'
            >
              Create Coupon
            </button>
          </form>
        </div>

        {/* Coupons List */}
        <div className='lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm p-6'>
          <h2 className='text-xl font-bold mb-6'>All Coupons ({coupons.length})</h2>
          <div className='space-y-3'>
            {coupons.length > 0 ? (
              coupons.map((coupon, index) => (
                <div key={index} className='flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-3 mb-2'>
                      <h3 className='font-bold text-lg'>{coupon.code}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className='text-sm text-gray-600'>
                      {coupon.discountType === 'percentage' ? `${coupon.discount}% off` : `$${coupon.discount} off`}
                      {coupon.minPurchase > 0 && ` • Min: $${coupon.minPurchase}`}
                      {coupon.maxDiscount > 0 && ` • Max: $${coupon.maxDiscount}`}
                    </p>
                    <p className='text-xs text-gray-500 mt-1'>
                      Expires: {new Date(coupon.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className='flex gap-2'>
                    <button
                      onClick={() => toggleStatus(coupon._id, coupon.isActive)}
                      className='px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm'
                    >
                      {coupon.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deleteCoupon(coupon._id)}
                      className='px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm'
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className='text-center text-gray-500 py-8'>No coupons yet. Create your first coupon!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Coupons
