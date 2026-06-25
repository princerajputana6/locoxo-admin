import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const Customers = ({ token }) => {
  const [customers, setCustomers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/user/customers', { headers: { token } })
      if (response.data.success) {
        setCustomers(response.data.customers)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    fetchCustomers()
  }, [])

  return (
    <div className='p-6'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold'>Customers</h1>
          <p className='text-sm text-muted mt-1'>Manage your customer database</p>
        </div>
        <div className='bg-accent-gradient text-brand-deep px-6 py-3 font-semibold rounded-lg shadow-md'>
          {customers.length} Customers
        </div>
      </div>

      {/* Search Bar */}
      <div className='mb-6'>
        <input
          type='text'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder='Search customers by name or email...'
          className='w-full max-w-md px-4 py-3 border border-white/10 rounded-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all'
        />
      </div>

      {/* Customers Table */}
      <div className='glass border border-white/10 rounded-lg shadow-sm p-6'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-white/10'>
                <th className='text-left py-3 px-4 font-semibold text-fg'>Name</th>
                <th className='text-left py-3 px-4 font-semibold text-fg'>Email</th>
                <th className='text-left py-3 px-4 font-semibold text-fg'>Joined Date</th>
                <th className='text-center py-3 px-4 font-semibold text-fg'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer, index) => (
                  <tr key={index} className='border-b border-white/5 hover:bg-white/5 transition-colors'>
                    <td className='py-4 px-4 font-medium'>{customer.name || 'N/A'}</td>
                    <td className='py-4 px-4 text-muted'>{customer.email}</td>
                    <td className='py-4 px-4 text-muted'>
                      {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className='py-4 px-4 text-center'>
                      <button className='px-4 py-2 bg-white/5 text-fg rounded-lg font-semibold hover:bg-white/10 transition-colors text-sm'>
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan='4' className='text-center py-8 text-muted'>
                    {searchTerm ? 'No customers found matching your search' : 'No customers yet'}
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

export default Customers
