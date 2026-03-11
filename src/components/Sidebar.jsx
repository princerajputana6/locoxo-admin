import React from 'react'
import { NavLink } from 'react-router-dom'
import { assets } from '../assets/assets'

const Sidebar = () => {
  return (
    <div className='w-[18%] min-h-screen bg-white border-r border-gray-200 shadow-sm'>
        <div className='flex flex-col gap-1 pt-6 px-3 text-sm'>
            {/* Dashboard */}
            <NavLink className={({isActive}) => `flex items-center gap-3 px-4 py-3 font-medium transition-all rounded-lg ${isActive ? 'bg-black text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100 hover:shadow-sm'}`} to="/">
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' />
                </svg>
                <p className='hidden md:block text-xs'>Dashboard</p>
            </NavLink>

            {/* Management Section */}
            <div className='mt-6 mb-2 px-4'>
              <p className='text-xs font-bold text-gray-500 uppercase tracking-wider'>Management</p>
            </div>

            <NavLink className={({isActive}) => `flex items-center gap-3 px-4 py-3 font-medium transition-all rounded-lg ${isActive ? 'bg-black text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`} to="/products">
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' />
                </svg>
                <p className='hidden md:block text-xs'>Products</p>
            </NavLink>

            <NavLink className={({isActive}) => `flex items-center gap-3 px-4 py-3 font-medium transition-all rounded-lg ${isActive ? 'bg-black text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`} to="/add">
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                </svg>
                <p className='hidden md:block text-xs'>Add Product</p>
            </NavLink>

            <NavLink className={({isActive}) => `flex items-center gap-3 px-4 py-3 font-medium transition-all rounded-lg ${isActive ? 'bg-black text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`} to="/categories">
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' />
                </svg>
                <p className='hidden md:block text-xs'>Categories</p>
            </NavLink>

            <NavLink className={({isActive}) => `flex items-center gap-3 px-4 py-3 font-medium transition-all rounded-lg ${isActive ? 'bg-black text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`} to="/orders">
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' />
                </svg>
                <p className='hidden md:block text-xs'>Orders</p>
            </NavLink>

            <NavLink className={({isActive}) => `flex items-center gap-3 px-4 py-3 font-medium transition-all rounded-lg ${isActive ? 'bg-black text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`} to="/customers">
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' />
                </svg>
                <p className='hidden md:block text-xs'>Customers</p>
            </NavLink>

            <NavLink className={({isActive}) => `flex items-center gap-3 px-4 py-3 font-medium transition-all rounded-lg ${isActive ? 'bg-black text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`} to="/inventory">
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' />
                </svg>
                <p className='hidden md:block text-xs'>Inventory</p>
            </NavLink>

            <NavLink className={({isActive}) => `flex items-center gap-3 px-4 py-3 font-medium transition-all rounded-lg ${isActive ? 'bg-black text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`} to="/coupons">
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' />
                </svg>
                <p className='hidden md:block text-xs'>Coupons</p>
            </NavLink>

            <NavLink className={({isActive}) => `flex items-center gap-3 px-4 py-3 font-medium transition-all rounded-lg ${isActive ? 'bg-black text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`} to="/banners">
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' />
                </svg>
                <p className='hidden md:block text-xs'>Banners</p>
            </NavLink>

            <NavLink className={({isActive}) => `flex items-center gap-3 px-4 py-3 font-medium transition-all rounded-lg ${isActive ? 'bg-black text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`} to="/returns">
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6' />
                </svg>
                <p className='hidden md:block text-xs'>Returns</p>
            </NavLink>

            {/* Reports Section */}
            <div className='mt-6 mb-2 px-4'>
              <p className='text-xs font-bold text-gray-500 uppercase tracking-wider'>Reports</p>
            </div>

            <NavLink className={({isActive}) => `flex items-center gap-3 px-4 py-3 font-medium transition-all rounded-lg ${isActive ? 'bg-black text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`} to="/reports/sales">
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
                </svg>
                <p className='hidden md:block text-xs'>Sales</p>
            </NavLink>

            <NavLink className={({isActive}) => `flex items-center gap-3 px-4 py-3 font-medium transition-all rounded-lg ${isActive ? 'bg-black text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`} to="/reports/analytics">
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' />
                </svg>
                <p className='hidden md:block text-xs'>Analytics</p>
            </NavLink>
        </div>
    </div>
  )
}

export default Sidebar