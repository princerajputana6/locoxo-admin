import React from 'react'
import {assets} from '../assets/assets'

const Navbar = ({setToken}) => {
  return (
    <div className='flex items-center py-3 px-[4%] justify-between bg-white border-b shadow-sm'>
        <div className='flex items-center gap-2'>
          <div className='w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center'>
            <span className='text-white font-bold text-xl'>L</span>
          </div>
          <div>
            <h1 className='text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent'>Locoxo</h1>
            <p className='text-xs text-gray-500'>Admin Panel</p>
          </div>
        </div>
        <button onClick={()=>setToken('')} className='bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg'>Logout</button>
    </div>
  )
}

export default Navbar