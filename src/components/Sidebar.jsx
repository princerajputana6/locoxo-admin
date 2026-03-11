import React from 'react'
import { NavLink } from 'react-router-dom'
import { assets } from '../assets/assets'

const Sidebar = () => {
  return (
    <div className='w-[18%] min-h-screen bg-white border-r border-gray-200'>
        <div className='flex flex-col gap-2 pt-6 px-4 text-[15px]'>
            <NavLink className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`} to="/add">
                <img className='w-5 h-5' src={assets.add_icon} alt="" />
                <p className='hidden md:block font-medium'>Add Product</p>
            </NavLink>
            <NavLink className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`} to="/list">
                <img className='w-5 h-5' src={assets.order_icon} alt="" />
                <p className='hidden md:block font-medium'>Products</p>
            </NavLink>
            <NavLink className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`} to="/orders">
                <img className='w-5 h-5' src={assets.order_icon} alt="" />
                <p className='hidden md:block font-medium'>Orders</p>
            </NavLink>
        </div>
    </div>
  )
}

export default Sidebar