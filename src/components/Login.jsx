import axios from 'axios'
import React, { useState } from 'react'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const Login = ({setToken}) => {

    const [email,setEmail] = useState('')
    const [password,setPassword] = useState('')

    const onSubmitHandler = async (e) => {
        try {
            e.preventDefault();
            const response = await axios.post(backendUrl + '/api/user/admin',{email,password})
            if (response.data.success) {
                setToken(response.data.token)
            } else {
                toast.error(response.data.message)
            }
             
        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }
    }

  return (
    <div className='min-h-screen flex items-center justify-center w-full bg-gray-50'>
        <div className='bg-white border border-gray-200 rounded-xl shadow-lg p-10 max-w-md w-full'>
            <div className='flex flex-col items-center mb-8'>
                <div className='w-16 h-16 bg-black rounded-lg flex items-center justify-center mb-4 shadow-md'>
                    <span className='text-white font-bold text-3xl'>L</span>
                </div>
                <h1 className='text-3xl font-bold text-black mb-1 tracking-tight'>LOCOXO</h1>
                <p className='text-gray-600 text-sm uppercase tracking-wider'>Admin Panel</p>
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