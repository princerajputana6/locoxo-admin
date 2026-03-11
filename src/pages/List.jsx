import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'

const List = ({ token }) => {

  const [list, setList] = useState([])

  const fetchList = async () => {
    try {

      const response = await axios.get(backendUrl + '/api/product/list')
      if (response.data.success) {
        setList(response.data.products.reverse());
      }
      else {
        toast.error(response.data.message)
      }

    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const removeProduct = async (id) => {
    try {

      const response = await axios.post(backendUrl + '/api/product/remove', { id }, { headers: { token } })

      if (response.data.success) {
        toast.success(response.data.message)
        await fetchList();
      } else {
        toast.error(response.data.message)
      }

    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchList()
  }, [])

  return (
    <div className='bg-white rounded-xl shadow-sm p-6'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h2 className='text-2xl font-bold text-gray-800'>Products</h2>
          <p className='text-sm text-gray-500 mt-1'>Manage your product inventory</p>
        </div>
        <div className='bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold'>
          {list.length} Products
        </div>
      </div>

      <div className='flex flex-col gap-3'>

        {/* ------- List Table Title ---------- */}

        <div className='hidden md:grid grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center py-3 px-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg text-sm font-semibold text-gray-700'>
          <span>Image</span>
          <span>Product Name</span>
          <span>Category</span>
          <span>Price</span>
          <span className='text-center'>Action</span>
        </div>

        {/* ------ Product List ------ */}

        {
          list.map((item, index) => (
            <div className='grid grid-cols-[1fr_3fr_1fr] md:grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center gap-4 py-3 px-4 border border-gray-200 hover:border-purple-300 rounded-lg text-sm transition-all hover:shadow-md bg-white' key={index}>
              <img className='w-14 h-14 object-cover rounded-lg shadow-sm' src={item.image[0]} alt="" />
              <p className='font-medium text-gray-800'>{item.name}</p>
              <span className='px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium w-fit'>{item.category?.name || item.category}</span>
              <p className='font-semibold text-gray-900'>{currency}{item.price}</p>
              <button onClick={()=>removeProduct(item._id)} className='text-right md:text-center cursor-pointer text-red-500 hover:text-red-700 font-bold text-lg transition-colors'>×</button>
            </div>
          ))
        }

      </div>
    </div>
  )
}

export default List