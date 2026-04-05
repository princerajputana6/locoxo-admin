import React, { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import { Routes, Route } from 'react-router-dom'
import Add from './pages/Add'
import List from './pages/List'
import Orders from './pages/Orders'
import Dashboard from './pages/Dashboard'
import Categories from './pages/Categories'
import Customers from './pages/Customers'
import Inventory from './pages/Inventory'
import Coupons from './pages/Coupons'
import Banners from './pages/Banners'
import Returns from './pages/Returns'
import SalesReport from './pages/SalesReport'
import Analytics from './pages/Analytics'
import Influencers from './pages/Influencers'
import Login from './components/Login'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const backendUrl = import.meta.env.VITE_BACKEND_URL
export const currency = '₹'

const App = () => {

  const [token, setToken] = useState(localStorage.getItem('token')?localStorage.getItem('token'):'');

  useEffect(()=>{
    localStorage.setItem('token',token)
  },[token])

  return (
    <div className='bg-white min-h-screen'>
      <ToastContainer position="top-right" autoClose={3000} />
      {token === ""
        ? <Login setToken={setToken} />
        : <>
          <Navbar setToken={setToken} />
          <div className='flex w-full'>
            <Sidebar />
            <div className='flex-1 bg-gray-50'>
              <Routes>
                <Route path='/' element={<Dashboard token={token} />} />
                <Route path='/add' element={<Add token={token} />} />
                <Route path='/list' element={<List token={token} />} />
                <Route path='/products' element={<List token={token} />} />
                <Route path='/orders' element={<Orders token={token} />} />
                <Route path='/categories' element={<Categories token={token} />} />
                <Route path='/customers' element={<Customers token={token} />} />
                <Route path='/inventory' element={<Inventory token={token} />} />
                <Route path='/coupons' element={<Coupons token={token} />} />
                <Route path='/banners' element={<Banners token={token} />} />
                <Route path='/returns' element={<Returns token={token} />} />
                <Route path='/influencers' element={<Influencers token={token} />} />
                <Route path='/reports/sales' element={<SalesReport token={token} />} />
                <Route path='/reports/analytics' element={<Analytics token={token} />} />
              </Routes>
            </div>
          </div>
        </>
      }
    </div>
  )
}

export default App