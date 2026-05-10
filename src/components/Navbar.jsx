import React from 'react'
import {assets} from '../assets/assets'

const Navbar = ({setToken, userRole, userData}) => {
  return (
    <div className='flex items-center py-4 px-[4%] justify-between bg-black shadow-md'>
        <div className='flex items-center gap-3'>
          <img src={assets.logo_white} alt='Locoxo Logo' className='h-7 w-auto' />
          <p className='text-xs text-gray-400 uppercase tracking-wider'>
            {userRole === 'influencer' ? 'Influencer Portal' : 'Admin Panel'}
          </p>
        </div>
        <div className='flex items-center gap-4'>
          {userRole === 'influencer' && userData && (
            <div className='text-right'>
              <p className='text-white font-semibold'>{userData.name}</p>
              <p className='text-xs text-gray-400'>{userData.email}</p>
            </div>
          )}
          <button onClick={()=>setToken('')} className='bg-white text-black px-6 py-2.5 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors shadow-sm'>Logout</button>
        </div>
    </div>
  )
}

export default Navbar