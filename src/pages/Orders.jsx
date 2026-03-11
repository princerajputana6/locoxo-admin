import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const Orders = ({ token }) => {

  const [orders, setOrders] = useState([])

  const fetchAllOrders = async () => {

    if (!token) {
      return null;
    }

    try {

      const response = await axios.post(backendUrl + '/api/order/list', {}, { headers: { token } })
      if (response.data.success) {
        setOrders(response.data.orders.reverse())
      } else {
        toast.error(response.data.message)
      }

    } catch (error) {
      toast.error(error.message)
    }


  }

  const statusHandler = async ( event, orderId ) => {
    try {
      const response = await axios.post(backendUrl + '/api/order/status' , {orderId, status:event.target.value}, { headers: {token}})
      if (response.data.success) {
        await fetchAllOrders()
      }
    } catch (error) {
      console.log(error)
      toast.error(response.data.message)
    }
  }

  useEffect(() => {
    fetchAllOrders();
  }, [token])

  return (
    <div className='p-6'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold'>Orders Management</h1>
        <p className='text-sm text-gray-600 mt-1'>View and manage customer orders</p>
      </div>
      <div className='space-y-4'>
        {
          orders.map((order, index) => (
            <div className='bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-lg transition-all' key={index}>
              <div className='grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-6'>
              <div className='flex gap-4'>
                <div className='w-12 h-12 bg-black flex items-center justify-center flex-shrink-0'>
                  <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' />
                  </svg>
                </div>
                <div className='flex-1'>
                  <div className='mb-3'>
                    <p className='font-bold text-sm uppercase tracking-wide mb-2'>Order Items</p>
                    {order.items.map((item, index) => (
                      <p className='text-sm py-0.5' key={index}>
                        {item.name} x {item.quantity} <span className='text-gray-600'>({item.size})</span>
                      </p>
                    ))}
                  </div>
                  <div>
                    <p className='font-bold text-sm uppercase tracking-wide mb-1'>Customer</p>
                    <p className='font-semibold'>{order.address.firstName + " " + order.address.lastName}</p>
                    <p className='text-sm text-gray-600'>{order.address.street}</p>
                    <p className='text-sm text-gray-600'>{order.address.city + ", " + order.address.state + ", " + order.address.zipcode}</p>
                    <p className='text-sm text-gray-600'>{order.address.phone}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className='font-bold text-sm uppercase tracking-wide mb-2'>Order Info</p>
                <p className='text-sm mb-1'><span className='font-semibold'>Items:</span> {order.items.length}</p>
                <p className='text-sm mb-1'><span className='font-semibold'>Payment:</span> {order.paymentMethod}</p>
                <p className='text-sm mb-1'><span className='font-semibold'>Status:</span> { order.payment ? 'Paid' : 'Pending' }</p>
                <p className='text-sm'><span className='font-semibold'>Date:</span> {new Date(order.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className='font-bold text-sm uppercase tracking-wide mb-2'>Amount</p>
                <p className='text-2xl font-bold'>{currency}{order.amount}</p>
              </div>
              <div>
                <p className='font-bold text-sm uppercase tracking-wide mb-2'>Update Status</p>
                <select onChange={(event)=>statusHandler(event,order._id)} value={order.status} className='w-full px-4 py-3 border border-gray-300 rounded-lg bg-white font-semibold focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all'>
                  <option value="Order Placed">Order Placed</option>
                  <option value="Packing">Packing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Out for delivery">Out for delivery</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default Orders