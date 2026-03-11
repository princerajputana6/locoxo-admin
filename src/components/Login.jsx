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
    <div className='min-h-screen flex items-center justify-center w-full bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50'>
        <div className='bg-white shadow-2xl rounded-2xl px-10 py-8 max-w-md w-full'>
            <div className='flex flex-col items-center mb-8'>
                <div className='w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg'>
                    <span className='text-white font-bold text-3xl'>L</span>
                </div>
                <h1 className='text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-1'>Locoxo</h1>
                <p className='text-gray-500 text-sm'>Admin Panel</p>
            </div>
            <form onSubmit={onSubmitHandler}>
                <div className='mb-4 min-w-72'>
                    <p className='text-sm font-semibold text-gray-700 mb-2'>Email Address</p>
                    <input onChange={(e)=>setEmail(e.target.value)} value={email} className='rounded-lg w-full px-4 py-3 border-2 border-gray-200 focus:border-purple-500 outline-none transition-colors' type="email" placeholder='admin@locoxo.com' required />
                </div>
                <div className='mb-6 min-w-72'>
                    <p className='text-sm font-semibold text-gray-700 mb-2'>Password</p>
                    <input onChange={(e)=>setPassword(e.target.value)} value={password} className='rounded-lg w-full px-4 py-3 border-2 border-gray-200 focus:border-purple-500 outline-none transition-colors' type="password" placeholder='Enter your password' required />
                </div>
                <button className='w-full py-3 px-4 rounded-lg text-white font-semibold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5' type="submit">Login</button>
            </form>
        </div>
    </div>
  )
}

export default Login