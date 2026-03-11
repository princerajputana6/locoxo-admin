import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const Returns = ({ token }) => {
  const [returns, setReturns] = useState([])
  const [filter, setFilter] = useState('all')

  const fetchReturns = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/return/list', { headers: { token } })
      if (response.data.success) {
        setReturns(response.data.returns)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const updateReturnStatus = async (returnId, status) => {
    try {
      const response = await axios.put(
        backendUrl + `/api/return/status/${returnId}`,
        { status },
        { headers: { token } }
      )
      if (response.data.success) {
        toast.success('Return status updated')
        fetchReturns()
      }
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || error.message)
    }
  }

  const filteredReturns = filter === 'all' 
    ? returns 
    : returns.filter(r => r.status === filter)

  useEffect(() => {
    fetchReturns()
  }, [])

  return (
    <div className='p-6'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold'>Returns & Refunds</h1>
          <p className='text-sm text-gray-600 mt-1'>Manage product returns and refund requests</p>
        </div>
        <div className='flex gap-3'>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${filter === 'all' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${filter === 'pending' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${filter === 'approved' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${filter === 'rejected' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* Returns Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
        <div className='bg-white border border-gray-200 rounded-lg p-6 shadow-sm'>
          <h3 className='text-sm font-semibold text-gray-600 mb-2'>Total Returns</h3>
          <p className='text-3xl font-bold'>{returns.length}</p>
        </div>
        <div className='bg-white border border-gray-200 rounded-lg p-6 shadow-sm'>
          <h3 className='text-sm font-semibold text-gray-600 mb-2'>Pending</h3>
          <p className='text-3xl font-bold text-orange-600'>{returns.filter(r => r.status === 'pending').length}</p>
        </div>
        <div className='bg-white border border-gray-200 rounded-lg p-6 shadow-sm'>
          <h3 className='text-sm font-semibold text-gray-600 mb-2'>Approved</h3>
          <p className='text-3xl font-bold text-green-600'>{returns.filter(r => r.status === 'approved').length}</p>
        </div>
        <div className='bg-white border border-gray-200 rounded-lg p-6 shadow-sm'>
          <h3 className='text-sm font-semibold text-gray-600 mb-2'>Rejected</h3>
          <p className='text-3xl font-bold text-red-600'>{returns.filter(r => r.status === 'rejected').length}</p>
        </div>
      </div>

      {/* Returns List */}
      <div className='bg-white border border-gray-200 rounded-lg shadow-sm p-6'>
        <h2 className='text-xl font-bold mb-6'>Return Requests ({filteredReturns.length})</h2>
        <div className='space-y-4'>
          {filteredReturns.length > 0 ? (
            filteredReturns.map((returnItem, index) => (
              <div key={index} className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all'>
                <div className='flex items-start justify-between mb-3'>
                  <div>
                    <h3 className='font-bold text-lg'>Return #{returnItem._id?.slice(-6)}</h3>
                    <p className='text-sm text-gray-600'>Order: {returnItem.orderId?.slice(-6)}</p>
                    <p className='text-sm text-gray-600'>Customer: {returnItem.customerEmail}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    returnItem.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                    returnItem.status === 'approved' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {returnItem.status?.toUpperCase()}
                  </span>
                </div>
                <div className='mb-3'>
                  <p className='text-sm font-semibold'>Reason:</p>
                  <p className='text-sm text-gray-600'>{returnItem.reason}</p>
                </div>
                <div className='text-xs text-gray-500 mb-3'>
                  Requested: {new Date(returnItem.createdAt).toLocaleDateString()}
                </div>
                {returnItem.status === 'pending' && (
                  <div className='flex gap-2'>
                    <button
                      onClick={() => updateReturnStatus(returnItem._id, 'approved')}
                      className='px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm'
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateReturnStatus(returnItem._id, 'rejected')}
                      className='px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm'
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className='text-center text-gray-500 py-8'>
              {filter === 'all' ? 'No return requests yet' : `No ${filter} returns`}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Returns
