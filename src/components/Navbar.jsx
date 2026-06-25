import React from 'react'
import { assets } from '../assets/assets'
import { Bell, LogOut, Shield, User } from 'lucide-react'

const Navbar = ({ setToken, userRole, userData }) => {
  const isAdmin = userRole === 'admin'
  return (
    <header className='sticky top-0 z-30 h-16 flex items-center px-4 sm:px-[3%] justify-between bg-surface/80 backdrop-blur-xl border-b border-line'>
      {/* Left: brand + role */}
      <div className='flex items-center gap-3'>
        <img src={assets.logo_white} alt='Locoxo' className='h-7 w-auto' />
        <span className={`hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
          isAdmin
            ? 'bg-accent/15 text-accent border-accent/30'
            : 'bg-info/15 text-info border-info/30'
        }`}>
          {isAdmin ? <Shield size={11} /> : <User size={11} />}
          {isAdmin ? 'Admin Panel' : 'Influencer Portal'}
        </span>
      </div>

      {/* Right: notifications + user + logout */}
      <div className='flex items-center gap-2 sm:gap-3'>
        <button className='relative grid place-items-center w-9 h-9 rounded-xl text-muted hover:text-fg hover:bg-surface-2 transition-colors'>
          <Bell size={17} />
          <span className='absolute top-2 right-2.5 w-2 h-2 rounded-full bg-accent ring-2 ring-surface animate-pulse-glow' />
        </button>

        {userRole === 'influencer' && userData && (
          <div className='text-right hidden sm:block'>
            <p className='text-sm font-semibold text-fg leading-tight'>{userData.name}</p>
            <p className='text-[11px] text-muted leading-tight'>{userData.email}</p>
          </div>
        )}

        {(userRole === 'influencer' && userData) ? (
          <div className='grid place-items-center w-9 h-9 rounded-full bg-accent-gradient text-brand-deep font-bold text-sm shrink-0'>
            {userData.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        ) : (
          <div className='grid place-items-center w-9 h-9 rounded-full bg-surface-2 text-accent border border-line shrink-0'>
            <Shield size={16} />
          </div>
        )}

        <button
          onClick={() => setToken('')}
          className='inline-flex items-center gap-1.5 bg-surface-2 hover:bg-danger/20 text-fg hover:text-danger border border-line hover:border-danger/40 px-3 sm:px-4 py-2 text-sm font-semibold rounded-xl transition-all'
        >
          <LogOut size={15} />
          <span className='hidden sm:inline'>Logout</span>
        </button>
      </div>
    </header>
  )
}

export default Navbar
