import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const Inventory = ({ token }) => {
  const [products, setProducts] = useState([])
  const [lowStockOnly, setLowStockOnly] = useState(false)

  const fetchProducts = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/product/list')
      if (response.data.success) {
        setProducts(response.data.products)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const updateStock = async (productId, newStock) => {
    try {
      const response = await axios.put(
        backendUrl + `/api/product/stock/${productId}`,
        { stock: newStock },
        { headers: { token } }
      )
      if (response.data.success) {
        toast.success('Stock updated successfully')
        fetchProducts()
      }
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || 'Failed to update stock')
    }
  }

  const filteredProducts = lowStockOnly
    ? products.filter(p => (p.stock || 0) < 10)
    : products

  useEffect(() => {
    fetchProducts()
  }, [])

  return (
    <div className='p-6'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold'>Inventory Management</h1>
          <p className='text-sm text-gray-600 mt-1'>Track and manage product stock levels</p>
        </div>
        <div className='flex gap-4'>
          <label className='flex items-center gap-2 cursor-pointer'>
            <input
              type='checkbox'
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className='w-4 h-4'
            />
            <span className='text-sm font-medium'>Low Stock Only</span>
          </label>
        </div>
      </div>

      {/* Inventory Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        <div className='bg-white border border-gray-200 rounded-lg p-6 shadow-sm'>
          <h3 className='text-sm font-semibold text-gray-600 mb-2'>Total Products</h3>
          <p className='text-3xl font-bold'>{products.length}</p>
        </div>
        <div className='bg-white border border-gray-200 rounded-lg p-6 shadow-sm'>
          <h3 className='text-sm font-semibold text-gray-600 mb-2'>Low Stock Items</h3>
          <p className='text-3xl font-bold text-red-600'>{products.filter(p => (p.stock || 0) < 10).length}</p>
        </div>
        <div className='bg-white border border-gray-200 rounded-lg p-6 shadow-sm'>
          <h3 className='text-sm font-semibold text-gray-600 mb-2'>Out of Stock</h3>
          <p className='text-3xl font-bold text-red-600'>{products.filter(p => (p.stock || 0) === 0).length}</p>
        </div>
      </div>

      {/* Inventory Table */}
      <div className='bg-white border border-gray-200 rounded-lg shadow-sm p-6'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-gray-200'>
                <th className='text-left py-3 px-4 font-semibold text-gray-700'>Product</th>
                <th className='text-left py-3 px-4 font-semibold text-gray-700'>Category</th>
                <th className='text-center py-3 px-4 font-semibold text-gray-700'>Current Stock</th>
                <th className='text-center py-3 px-4 font-semibold text-gray-700'>Status</th>
                <th className='text-center py-3 px-4 font-semibold text-gray-700'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => {
                  const stock = product.stock || 0
                  const stockStatus = stock === 0 ? 'Out of Stock' : stock < 10 ? 'Low Stock' : 'In Stock'
                  const statusColor = stock === 0 ? 'text-red-600' : stock < 10 ? 'text-orange-600' : 'text-green-600'

                  return (
                    <tr key={index} className='border-b border-gray-100 hover:bg-gray-50 transition-colors'>
                      <td className='py-4 px-4'>
                        <div className='flex items-center gap-3'>
                          <img src={product.image[0]} alt={product.name} className='w-12 h-12 object-cover rounded-lg' />
                          <span className='font-medium'>{product.name}</span>
                        </div>
                      </td>
                      <td className='py-4 px-4 text-gray-600'>
                        {typeof product.category === 'object' ? product.category?.name : product.category}
                      </td>
                      <td className='py-4 px-4 text-center font-bold'>{stock}</td>
                      <td className='py-4 px-4 text-center'>
                        <span className={`font-semibold ${statusColor}`}>{stockStatus}</span>
                      </td>
                      <td className='py-4 px-4 text-center'>
                        <div className='flex items-center justify-center gap-2'>
                          <input
                            type='number'
                            id={`stock-${product._id}`}
                            defaultValue={stock}
                            className='w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none'
                            min='0'
                          />
                          <button
                            onClick={() => {
                              const input = document.getElementById(`stock-${product._id}`)
                              const newStock = parseInt(input.value) || 0
                              if (newStock !== stock) {
                                updateStock(product._id, newStock)
                              }
                            }}
                            className='px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium'
                          >
                            Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan='5' className='text-center py-8 text-gray-500'>
                    {lowStockOnly ? 'No low stock items' : 'No products in inventory'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Inventory
