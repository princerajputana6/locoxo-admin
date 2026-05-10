import axios from 'axios'
import React, { useState } from 'react'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const Login = ({setToken, setUserRole, setUserData}) => {

    const [email,setEmail] = useState('')
    const [password,setPassword] = useState('')

    const onSubmitHandler = async (e) => {
        try {
            e.preventDefault();
            
            // First try admin login
            try {
                const adminResponse = await axios.post(backendUrl + '/api/user/admin', {email, password})
                if (adminResponse.data.success) {
                    setToken(adminResponse.data.token)
                    setUserRole('admin')
                    setUserData({ email, role: 'admin' })
                    localStorage.setItem('userRole', 'admin')
                    localStorage.setItem('userData', JSON.stringify({ email, role: 'admin' }))
                    toast.success('Welcome Admin!')
                    return
                }
            } catch (adminError) {
                // Admin login failed, try influencer login
            }

            // Try influencer login
            const influencerResponse = await axios.post(backendUrl + '/api/influencer/login', {email, password})
            if (influencerResponse.data.success) {
                setToken(influencerResponse.data.token)
                setUserRole('influencer')
                setUserData(influencerResponse.data.influencer)
                localStorage.setItem('userRole', 'influencer')
                localStorage.setItem('userData', JSON.stringify(influencerResponse.data.influencer))
                toast.success(`Welcome ${influencerResponse.data.influencer.name}!`)
            } else {
                toast.error(influencerResponse.data.message || 'Invalid credentials')
            }
             
        } catch (error) {
            console.log(error);
            toast.error('Invalid credentials. Please try again.')
        }
    }

  return (
    <div className='min-h-screen flex items-center justify-center w-full bg-gray-50'>
        <div className='bg-white border border-gray-200 rounded-xl shadow-lg p-10 max-w-md w-full'>
            <div className='flex flex-col items-center mb-8'>
                <div className='bg-black rounded-xl px-6 py-3 mb-4'>
                    <img src={assets.logo_white} alt='Locoxo Logo' className='h-7 w-auto' />
                </div>
            </div>
            <form onSubmit={onSubmitHandler}>
                <div className='mb-4 min-w-72'>
                    <p className='text-sm font-bold text-black mb-2 uppercase tracking-wide'>Email Address</p>
                    <input onChange={(e)=>setEmail(e.target.value)} value={email} className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all' type="email" placeholder='admin@locoxo.com' required />
                </div>
                <div className='mb-6 min-w-72'>
                    <p className='text-sm font-bold text-black mb-2 uppercase tracking-wide'>Password</p>
                    <input onChange={(e)=>setPassword(e.target.value)} value={password} className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all' type="password" placeholder='Enter your password' required />
                </div>
                <button className='w-full py-3 px-4 text-white font-semibold bg-black hover:bg-gray-800 transition-colors rounded-lg shadow-md' type="submit">Login</button>
            </form>
        </div>
    </div>
  )
}

export default Login