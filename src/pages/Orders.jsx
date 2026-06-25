import React from 'react'
import { useEffect, useCallback } from 'react'
import { useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'
import { useAdminOrderStream } from '../hooks/useOrderRealtime'

const Orders = ({ token }) => {

  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState('All')
  const [downloadingAll, setDownloadingAll] = useState(false)

  const fetchAllOrders = async () => {

    if (!token) {
      return null;
    }

    try {

      const response = await axios.post(backendUrl + '/api/order/list', {}, { headers: { token } })
      if (response.data.success) {
        const reversedOrders = response.data.orders.reverse()
        setOrders(reversedOrders)
        setFilteredOrders(reversedOrders)
      } else {
        toast.error(response.data.message)
      }

    } catch (error) {
      toast.error(error.message)
    }


  }

  const createShipment = async (orderId) => {
    try {
      const { data } = await axios.post(backendUrl + '/api/shipment/admin/create', { orderId }, { headers: { token } })
      if (data.success) {
        toast.success('Shipment created · AWB ' + data.shipment.awb)
        await fetchAllOrders()
      } else toast.error(data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create shipment') }
  }

  const pushEvent = async (shipmentId, status) => {
    try {
      const { data } = await axios.post(backendUrl + '/api/shipment/admin/' + shipmentId + '/event', {
        status, description: `Marked ${status.replace(/_/g, ' ')} by admin`
      }, { headers: { token } })
      if (data.success) {
        toast.success('Status pushed')
        await fetchAllOrders()
      }
    } catch { toast.error('Failed') }
  }

  // Live updates from server
  const handleStream = useCallback(() => {
    fetchAllOrders()
  }, [])
  useAdminOrderStream(handleStream)

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

  const downloadInvoice = async (orderId, orderNumber) => {
    try {
      const response = await axios.get(backendUrl + `/api/order/invoice/${orderId}`, {
        headers: { token },
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${orderNumber || orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice. Please try again.');
    }
  }

  const downloadAllInvoices = async () => {
    setDownloadingAll(true)
    try {
      const ordersToDownload = filteredOrders.filter(order => order.orderNumber)
      
      if (ordersToDownload.length === 0) {
        toast.error('No invoices available to download')
        setDownloadingAll(false)
        return
      }

      toast.info(`Downloading ${ordersToDownload.length} invoices...`)
      
      for (let i = 0; i < ordersToDownload.length; i++) {
        const order = ordersToDownload[i]
        await downloadInvoice(order._id, order.orderNumber)
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      toast.success(`Successfully downloaded ${ordersToDownload.length} invoices!`)
    } catch (error) {
      console.error('Error downloading all invoices:', error)
      toast.error('Failed to download all invoices')
    } finally {
      setDownloadingAll(false)
    }
  }

  const handleFilterChange = (status) => {
    setStatusFilter(status)
    if (status === 'All') {
      setFilteredOrders(orders)
    } else {
      setFilteredOrders(orders.filter(order => order.status === status))
    }
  }

  useEffect(() => {
    fetchAllOrders();
  }, [token])

  useEffect(() => {
    handleFilterChange(statusFilter)
  }, [orders])

  return (
    <div className='p-6'>
      <div className='mb-8'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4'>
          <div>
            <h1 className='text-3xl font-bold'>Orders Management</h1>
            <p className='text-sm text-muted mt-1'>View and manage customer orders</p>
          </div>
          <button
            onClick={downloadAllInvoices}
            disabled={downloadingAll || filteredOrders.length === 0}
            className='bg-accent-gradient text-brand-deep px-6 py-3 rounded-lg font-semibold hover:brightness-110 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
            </svg>
            {downloadingAll ? 'Downloading...' : `Download All Invoices (${filteredOrders.filter(o => o.orderNumber).length})`}
          </button>
        </div>

        {/* Filter Buttons */}
        <div className='flex flex-wrap gap-2 mb-6'>
          <button
            onClick={() => handleFilterChange('All')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              statusFilter === 'All'
                ? 'bg-accent-gradient text-brand-deep'
                : 'bg-white/10 text-fg hover:bg-gray-300'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => handleFilterChange('Order Placed')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              statusFilter === 'Order Placed'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            Order Placed ({orders.filter(o => o.status === 'Order Placed').length})
          </button>
          <button
            onClick={() => handleFilterChange('Packing')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              statusFilter === 'Packing'
                ? 'bg-yellow-600 text-white'
                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
            }`}
          >
            Packing ({orders.filter(o => o.status === 'Packing').length})
          </button>
          <button
            onClick={() => handleFilterChange('Shipped')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              statusFilter === 'Shipped'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            Shipped ({orders.filter(o => o.status === 'Shipped').length})
          </button>
          <button
            onClick={() => handleFilterChange('Out for delivery')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              statusFilter === 'Out for delivery'
                ? 'bg-orange-600 text-white'
                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            }`}
          >
            Out for Delivery ({orders.filter(o => o.status === 'Out for delivery').length})
          </button>
          <button
            onClick={() => handleFilterChange('Delivered')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              statusFilter === 'Delivered'
                ? 'bg-green-600 text-white'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            Delivered ({orders.filter(o => o.status === 'Delivered').length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className='text-center py-20 glass rounded-lg border border-white/10'>
          <svg className='w-16 h-16 mx-auto mb-4 text-gray-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4' />
          </svg>
          <h3 className='text-xl font-semibold text-muted mb-2'>No orders found</h3>
          <p className='text-muted'>
            {statusFilter === 'All' 
              ? 'No orders have been placed yet' 
              : `No orders with status "${statusFilter}"`
            }
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {
            filteredOrders.map((order, index) => (
            <div className='glass border border-white/10 rounded-lg shadow-sm p-6 hover:shadow-lg transition-all' key={index}>
              <div className='grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-6'>
              <div className='flex gap-4'>
                <div className='w-12 h-12 bg-surface-3 flex items-center justify-center flex-shrink-0'>
                  <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' />
                  </svg>
                </div>
                <div className='flex-1'>
                  <div className='mb-3'>
                    <p className='font-bold text-sm uppercase tracking-wide mb-2'>Order Items</p>
                    {order.items.map((item, index) => (
                      <p className='text-sm py-0.5' key={index}>
                        {item.name} x {item.quantity} <span className='text-muted'>({item.size})</span>
                      </p>
                    ))}
                  </div>
                  <div>
                    <p className='font-bold text-sm uppercase tracking-wide mb-1'>Customer</p>
                    <p className='font-semibold'>{order.address.name || (order.address.firstName ? order.address.firstName + " " + (order.address.lastName || '') : 'Customer')}</p>
                    <p className='text-sm text-muted'>{order.address.addressLine1 || order.address.street}</p>
                    <p className='text-sm text-muted'>{order.address.city + ", " + order.address.state + ", " + (order.address.pincode || order.address.zipcode || '')}</p>
                    <p className='text-sm text-muted'>{order.address.phone}</p>
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
                <select onChange={(event)=>statusHandler(event,order._id)} value={order.status} className='w-full px-4 py-3 border border-white/10 rounded-lg glass font-semibold focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all mb-3'>
                  <option value="Order Placed">Order Placed</option>
                  <option value="Packing">Packing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Out for delivery">Out for delivery</option>
                  <option value="Delivered">Delivered</option>
                </select>
                {order.orderNumber && (
                  <button
                    onClick={() => downloadInvoice(order._id, order.orderNumber)}
                    className='w-full px-4 py-3 bg-accent-gradient text-brand-deep rounded-lg font-semibold hover:brightness-110 transition-colors flex items-center justify-center gap-2 mb-2'
                  >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                    </svg>
                    Download Invoice
                  </button>
                )}
                {order.trackingNumber ? (
                  <div className='mt-2 p-2 border border-white/10 text-xs'>
                    <p className='text-[10px] uppercase tracking-widest text-muted mb-1'>Shipment</p>
                    <p className='font-mono break-all mb-2'>{order.trackingNumber}</p>
                    <div className='flex flex-wrap gap-1'>
                      {['picked_up', 'in_transit', 'out_for_delivery', 'delivered'].map((s) => (
                        <button
                          key={s}
                          type='button'
                          onClick={async () => {
                            const { data } = await axios.get(backendUrl + '/api/shipment/admin/order/' + order._id, { headers: { token } })
                            if (data.success && data.shipment) pushEvent(data.shipment._id, s)
                          }}
                          className='text-[9px] uppercase tracking-widest px-1.5 py-1 border border-white/10 hover:border-accent'
                        >
                          {s.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => createShipment(order._id)}
                    className='w-full px-4 py-2 border border-accent text-sm font-semibold hover:brightness-110'
                  >
                    Create Shipment
                  </button>
                )}
              </div>
              </div>
            </div>
          ))
        }
        </div>
      )}
    </div>
  )
}

export default Orders