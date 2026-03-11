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
    <div className='p-6'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold'>Products</h1>
          <p className='text-sm text-gray-600 mt-1'>Manage your product inventory</p>
        </div>
        <div className='bg-black text-white px-6 py-3 font-semibold rounded-lg shadow-md'>
          {list.length} Products
        </div>
      </div>

      <div className='bg-white border border-gray-200 rounded-lg shadow-sm p-6'>

        <div className='flex flex-col gap-3'>
          {/* ------- List Table Title ---------- */}
          <div className='hidden md:grid grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center py-3 px-4 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg'>
            <span>Image</span>
            <span>Product Name</span>
            <span>Category</span>
            <span>Price</span>
            <span className='text-center'>Action</span>
          </div>

          {/* ------ Product List ------ */}
          {
            list.map((item, index) => (
              <div className='grid grid-cols-[1fr_3fr_1fr] md:grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center gap-4 py-4 px-4 border border-gray-200 rounded-lg hover:shadow-md text-sm transition-all bg-white' key={index}>
                <img className='w-14 h-14 object-cover rounded-lg' src={item.image[0]} alt="" />
                <p className='font-semibold'>{item.name}</p>
                <span className='px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full w-fit'>{item.category?.name || item.category}</span>
                <p className='font-bold'>{currency}{item.price}</p>
                <button onClick={() => removeProduct(item._id)} className='text-right md:text-center cursor-pointer bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors text-xs'>DELETE</button>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

export default List