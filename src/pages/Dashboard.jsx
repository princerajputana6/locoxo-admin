import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const Dashboard = ({ token }) => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalProducts: 0,
    lowStock: 0
  })

  const [recentOrders, setRecentOrders] = useState([])
  const [topProducts, setTopProducts] = useState([])

  const fetchDashboardData = async () => {
    try {
      // Fetch orders
      const ordersResponse = await axios.post(backendUrl + '/api/order/list', {}, { headers: { token } })
      if (ordersResponse.data.success) {
        const orders = ordersResponse.data.orders
        
        // Calculate metrics
        const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0)
        const totalOrders = orders.length
        const pendingOrders = orders.filter(o => o.status === 'Order Placed' || o.status === 'Packing').length
        const completedOrders = orders.filter(o => o.status === 'Delivered').length
        
        setStats(prev => ({
          ...prev,
          totalRevenue,
          totalOrders,
          pendingOrders,
          completedOrders,
          totalSales: orders.filter(o => o.payment).length
        }))
        
        setRecentOrders(orders.slice(0, 5))
      }

      // Fetch products
      const productsResponse = await axios.get(backendUrl + '/api/product/list')
      if (productsResponse.data.success) {
        const products = productsResponse.data.products
        setStats(prev => ({
          ...prev,
          totalProducts: products.length,
          lowStock: products.filter(p => (p.stock || 0) < 10).length
        }))
        
        setTopProducts(products.slice(0, 5))
      }

    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [token])

  return (
    <div className='p-6'>
      <h1 className='text-3xl font-bold mb-8'>Dashboard</h1>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        {/* Total Sales */}
        <div className='bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all hover:border-gray-400'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-sm font-bold uppercase tracking-wide text-gray-600'>Total Sales</h3>
            <svg className='w-8 h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
            </svg>
          </div>
          <p className='text-4xl font-bold'>{stats.totalSales}</p>
          <p className='text-sm text-gray-600 mt-2'>Paid orders</p>
        </div>

        {/* Total Revenue */}
        <div className='bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all hover:border-gray-400'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-sm font-bold uppercase tracking-wide text-gray-600'>Total Revenue</h3>
            <svg className='w-8 h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
          </div>
          <p className='text-4xl font-bold'>${stats.totalRevenue}</p>
          <p className='text-sm text-gray-600 mt-2'>Total earnings</p>
        </div>

        {/* Total Orders */}
        <div className='bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all hover:border-gray-400'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-sm font-bold uppercase tracking-wide text-gray-600'>Total Orders</h3>
            <svg className='w-8 h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' />
            </svg>
          </div>
          <p className='text-4xl font-bold'>{stats.totalOrders}</p>
          <p className='text-sm text-gray-600 mt-2'>{stats.pendingOrders} pending</p>
        </div>

        {/* Total Products */}
        <div className='bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all hover:border-gray-400'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-sm font-bold uppercase tracking-wide text-gray-600'>Total Products</h3>
            <svg className='w-8 h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' />
            </svg>
          </div>
          <p className='text-4xl font-bold'>{stats.totalProducts}</p>
          <p className='text-sm text-gray-600 mt-2'>{stats.lowStock} low stock</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        <div className='bg-black text-white rounded-lg p-6 shadow-md'>
          <h3 className='text-sm font-bold uppercase tracking-wide mb-2 opacity-80'>Pending Orders</h3>
          <p className='text-3xl font-bold'>{stats.pendingOrders}</p>
        </div>
        <div className='bg-black text-white rounded-lg p-6 shadow-md'>
          <h3 className='text-sm font-bold uppercase tracking-wide mb-2 opacity-80'>Completed Orders</h3>
          <p className='text-3xl font-bold'>{stats.completedOrders}</p>
        </div>
        <div className='bg-black text-white rounded-lg p-6 shadow-md'>
          <h3 className='text-sm font-bold uppercase tracking-wide mb-2 opacity-80'>Low Stock Items</h3>
          <p className='text-3xl font-bold'>{stats.lowStock}</p>
        </div>
      </div>

      {/* Recent Orders & Top Products */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Recent Orders */}
        <div className='bg-white border border-gray-200 rounded-lg p-6 shadow-sm'>
          <h2 className='text-xl font-bold mb-4'>Recent Orders</h2>
          <div className='space-y-3'>
            {recentOrders.length > 0 ? recentOrders.map((order, index) => (
              <div key={index} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'>
                <div>
                  <p className='font-semibold'>Order #{order._id?.slice(-6)}</p>
                  <p className='text-sm text-gray-600'>{order.address?.firstName} {order.address?.lastName}</p>
                </div>
                <div className='text-right'>
                  <p className='font-bold'>${order.amount}</p>
                  <p className='text-xs text-gray-600'>{order.status}</p>
                </div>
              </div>
            )) : (
              <p className='text-gray-500 text-center py-8'>No orders yet</p>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className='bg-white border border-gray-200 rounded-lg p-6 shadow-sm'>
          <h2 className='text-xl font-bold mb-4'>Top Products</h2>
          <div className='space-y-3'>
            {topProducts.length > 0 ? topProducts.map((product, index) => (
              <div key={index} className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'>
                <img src={product.image[0]} alt={product.name} className='w-12 h-12 object-cover bg-gray-100' />
                <div className='flex-1'>
                  <p className='font-semibold'>{product.name}</p>
                  <p className='text-sm text-gray-600'>{typeof product.category === 'object' ? product.category?.name : product.category}</p>
                </div>
                <p className='font-bold'>${product.price}</p>
              </div>
            )) : (
              <p className='text-gray-500 text-center py-8'>No products yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
