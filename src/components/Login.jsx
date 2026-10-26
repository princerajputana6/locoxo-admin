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
            
            // Remember the admin attempt's error so we can surface it if every
            // role fails (otherwise the influencer "not found" message masks the
            // real admin problem, e.g. wrong password or a missing JWT_SECRET).
            let adminMsg = ''

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
                adminMsg = adminResponse.data.message || ''
            } catch (adminError) {
                // Admin login failed, try staff then influencer.
                adminMsg = adminError.response?.data?.message || ''
            }

            // Try staff / sub-admin login
            try {
                const staffRes = await axios.post(backendUrl + '/api/admin-mgmt/staff-login', { email, password })
                if (staffRes.data.success) {
                    const s = staffRes.data.staff
                    setToken(staffRes.data.token)
                    setUserRole('staff')
                    setUserData(s)
                    localStorage.setItem('userRole', 'staff')
                    localStorage.setItem('userData', JSON.stringify(s))
                    toast.success(`Welcome ${s.name}!`)
                    return
                } else if (staffRes.data.message && !/no staff account/i.test(staffRes.data.message)) {
                    // A real staff error (inactive / wrong password) — surface it, don't fall through.
                    toast.error(staffRes.data.message)
                    return
                }
            } catch (staffError) {
                // fall through to influencer
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
                // None of admin/staff/influencer matched. If the admin endpoint
                // reported a server-side misconfiguration (e.g. missing
                // JWT_SECRET), surface that; otherwise show a clear generic
                // message instead of the misleading "Influencer not found".
                if (/secret|jwt|token/i.test(adminMsg)) {
                    toast.error('Server auth misconfigured — JWT secret missing. Check backend env.')
                } else {
                    toast.error('Invalid email or password.')
                }
            }
             
        } catch (error) {
            console.log(error);
            toast.error('Invalid credentials. Please try again.')
        }
    }

  return (
    <div className='min-h-screen flex items-center justify-center w-full px-4'>
        <div className='glass border border-line rounded-xl shadow-card p-10 max-w-md w-full'>
            <div className='flex flex-col items-center mb-8'>
                <img src={assets.logo} alt='Locoxo' className='h-10 w-auto mb-2' />
                <p className='text-sm text-muted'>Admin Panel</p>
            </div>
            <form onSubmit={onSubmitHandler}>
                <div className='mb-4 min-w-72'>
                    <p className='text-sm font-bold text-fg mb-2 uppercase tracking-wide'>Email Address</p>
                    <input onChange={(e)=>setEmail(e.target.value)} value={email} className='w-full px-4 py-3 border border-line rounded-lg outline-none transition-all' type="email" placeholder='admin@locoxo.com' required />
                </div>
                <div className='mb-6 min-w-72'>
                    <p className='text-sm font-bold text-fg mb-2 uppercase tracking-wide'>Password</p>
                    <input onChange={(e)=>setPassword(e.target.value)} value={password} className='w-full px-4 py-3 border border-line rounded-lg outline-none transition-all' type="password" placeholder='Enter your password' required />
                </div>
                <button className='w-full py-3 px-4 text-white font-semibold bg-accent hover:bg-accent-dark transition-colors rounded-lg shadow-md' type="submit">Login</button>
            </form>
        </div>
    </div>
  )
}

export default Login