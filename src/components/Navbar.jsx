import React from 'react'
import {assets} from '../assets/assets'

const Navbar = ({setToken}) => {
  return (
    <div className='flex items-center py-4 px-[4%] justify-between bg-black shadow-md'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 bg-white flex items-center justify-center'>
            <span className='text-black font-bold text-xl'>L</span>
          </div>
          <div>
            <h1 className='text-2xl font-bold text-white tracking-tight'>LOCOXO</h1>
            <p className='text-xs text-gray-400 uppercase tracking-wider'>Admin Panel</p>
          </div>
        </div>
        <button onClick={()=>setToken('')} className='bg-white text-black px-6 py-2.5 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors shadow-sm'>Logout</button>
    </div>
  )
}

export default Navbar