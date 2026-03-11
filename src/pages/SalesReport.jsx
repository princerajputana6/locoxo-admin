import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'

const SalesReport = ({ token }) => {
  const [orders, setOrders] = useState([])
  const [dateRange, setDateRange] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchOrders = async () => {
    try {
      const response = await axios.post(backendUrl + '/api/order/list', {}, { headers: { token } })
      if (response.data.success) {
        setOrders(response.data.orders)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const filterOrdersByDate = () => {
    const now = new Date()
    let filtered = orders

    switch (dateRange) {
      case 'today':
        filtered = orders.filter(o => {
          const orderDate = new Date(o.date)
          return orderDate.toDateString() === now.toDateString()
        })
        break
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        filtered = orders.filter(o => new Date(o.date) >= weekAgo)
        break
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        filtered = orders.filter(o => new Date(o.date) >= monthAgo)
        break
      case 'custom':
        if (startDate && endDate) {
          filtered = orders.filter(o => {
            const orderDate = new Date(o.date)
            return orderDate >= new Date(startDate) && orderDate <= new Date(endDate)
          })
        }
        break
      default:
        filtered = orders
    }

    return filtered
  }

  const filteredOrders = filterOrdersByDate()
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.amount || 0), 0)
  const totalOrders = filteredOrders.length
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const paidOrders = filteredOrders.filter(o => o.payment).length

  useEffect(() => {
    fetchOrders()
  }, [])

  return (
    <div className='p-6'>
      <h1 className='text-3xl font-bold mb-8'>Sales Report</h1>

      {/* Date Range Filter */}
      <div className='bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6'>
        <h2 className='text-lg font-bold mb-4'>Filter by Date Range</h2>
        <div className='flex flex-wrap gap-3 mb-4'>
          <button
            onClick={() => setDateRange('all')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${dateRange === 'all' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            All Time
          </button>
          <button
            onClick={() => setDateRange('today')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${dateRange === 'today' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Today
          </button>
          <button
            onClick={() => setDateRange('week')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${dateRange === 'week' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${dateRange === 'month' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setDateRange('custom')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${dateRange === 'custom' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Custom Range
          </button>
        </div>
        {dateRange === 'custom' && (
          <div className='flex gap-3'>
            <input
              type='date'
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className='px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none'
            />
            <input
              type='date'
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className='px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none'
            />
          </div>
        )}
      </div>

      {/* Sales Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
        <div className='bg-white border border-gray-200 rounded-lg p-6 shadow-sm'>
          <h3 className='text-sm font-semibold text-gray-600 mb-2'>Total Revenue</h3>
          <p className='text-3xl font-bold'>{currency}{totalRevenue.toFixed(2)}</p>
        </div>
        <div className='bg-white border border-gray-200 rounded-lg p-6 shadow-sm'>
          <h3 className='text-sm font-semibold text-gray-600 mb-2'>Total Orders</h3>
          <p className='text-3xl font-bold'>{totalOrders}</p>
        </div>
        <div className='bg-white border border-gray-200 rounded-lg p-6 shadow-sm'>
          <h3 className='text-sm font-semibold text-gray-600 mb-2'>Avg Order Value</h3>
          <p className='text-3xl font-bold'>{currency}{avgOrderValue.toFixed(2)}</p>
        </div>
        <div className='bg-white border border-gray-200 rounded-lg p-6 shadow-sm'>
          <h3 className='text-sm font-semibold text-gray-600 mb-2'>Paid Orders</h3>
          <p className='text-3xl font-bold text-green-600'>{paidOrders}</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className='bg-white border border-gray-200 rounded-lg shadow-sm p-6'>
        <h2 className='text-xl font-bold mb-6'>Order Details</h2>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-gray-200'>
                <th className='text-left py-3 px-4 font-semibold text-gray-700'>Order ID</th>
                <th className='text-left py-3 px-4 font-semibold text-gray-700'>Date</th>
                <th className='text-left py-3 px-4 font-semibold text-gray-700'>Customer</th>
                <th className='text-center py-3 px-4 font-semibold text-gray-700'>Items</th>
                <th className='text-right py-3 px-4 font-semibold text-gray-700'>Amount</th>
                <th className='text-center py-3 px-4 font-semibold text-gray-700'>Payment</th>
                <th className='text-center py-3 px-4 font-semibold text-gray-700'>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order, index) => (
                  <tr key={index} className='border-b border-gray-100 hover:bg-gray-50 transition-colors'>
                    <td className='py-4 px-4 font-medium'>#{order._id?.slice(-6)}</td>
                    <td className='py-4 px-4 text-gray-600'>{new Date(order.date).toLocaleDateString()}</td>
                    <td className='py-4 px-4 text-gray-600'>{order.address?.firstName} {order.address?.lastName}</td>
                    <td className='py-4 px-4 text-center'>{order.items?.length || 0}</td>
                    <td className='py-4 px-4 text-right font-bold'>{currency}{order.amount}</td>
                    <td className='py-4 px-4 text-center'>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.payment ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {order.payment ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className='py-4 px-4 text-center text-sm text-gray-600'>{order.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan='7' className='text-center py-8 text-gray-500'>No orders found for selected date range</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SalesReport
