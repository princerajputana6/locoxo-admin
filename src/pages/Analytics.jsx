import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'

const Analytics = ({ token }) => {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        axios.post(backendUrl + '/api/order/list', {}, { headers: { token } }),
        axios.get(backendUrl + '/api/product/list?all=true')
      ])
      
      if (ordersRes.data.success) setOrders(ordersRes.data.orders)
      if (productsRes.data.success) setProducts(productsRes.data.products)
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0)
  const totalOrders = orders.length
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  
  const topProducts = products
    .sort((a, b) => (b.sold || 0) - (a.sold || 0))
    .slice(0, 5)

  const categoryBreakdown = products.reduce((acc, p) => {
    const cat = typeof p.category === 'object' ? p.category?.name : p.category
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className='p-6'>
      <h1 className='text-3xl font-bold mb-8'>Analytics Dashboard</h1>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        <div className='glass border border-white/10 rounded-lg p-6 shadow-sm'>
          <h3 className='text-sm font-semibold text-muted mb-2'>Total Revenue</h3>
          <p className='text-3xl font-bold'>{currency}{totalRevenue.toFixed(2)}</p>
        </div>
        <div className='glass border border-white/10 rounded-lg p-6 shadow-sm'>
          <h3 className='text-sm font-semibold text-muted mb-2'>Total Orders</h3>
          <p className='text-3xl font-bold'>{totalOrders}</p>
        </div>
        <div className='glass border border-white/10 rounded-lg p-6 shadow-sm'>
          <h3 className='text-sm font-semibold text-muted mb-2'>Avg Order Value</h3>
          <p className='text-3xl font-bold'>{currency}{avgOrderValue.toFixed(2)}</p>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='glass border border-white/10 rounded-lg p-6 shadow-sm'>
          <h2 className='text-xl font-bold mb-6'>Top Products</h2>
          <div className='space-y-3'>
            {topProducts.map((product, index) => (
              <div key={index} className='flex items-center justify-between p-3 bg-white/5 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <img src={product.image[0]} alt={product.name} className='w-12 h-12 object-cover rounded-lg' />
                  <span className='font-medium'>{product.name}</span>
                </div>
                <span className='font-bold'>{product.sold || 0} sold</span>
              </div>
            ))}
          </div>
        </div>

        <div className='glass border border-white/10 rounded-lg p-6 shadow-sm'>
          <h2 className='text-xl font-bold mb-6'>Category Breakdown</h2>
          <div className='space-y-3'>
            {Object.entries(categoryBreakdown).map(([cat, count], index) => (
              <div key={index} className='flex items-center justify-between p-3 bg-white/5 rounded-lg'>
                <span className='font-medium'>{cat}</span>
                <span className='font-bold'>{count} products</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
