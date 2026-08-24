import React, { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import { Routes, Route, Navigate } from 'react-router-dom'
import Add from './pages/Add'
import List from './pages/List'
import ProductManagement from './pages/product/ProductManagement'
import ProductDetailList from './pages/product/ProductDetailList'
import AddProductNew from './pages/product/AddProductNew'
import Orders from './pages/Orders'
import OrderManagementNew from './pages/order/OrderManagementNew'
import Dashboard from './pages/Dashboard'
import Categories from './pages/Categories'
import AddCategory from './pages/AddCategory'
import Customers from './pages/Customers'
import Inventory from './pages/Inventory'
import InventoryOverview from './pages/inventory/InventoryOverview'
import StockDetails from './pages/inventory/StockDetails'
import BulkAddInventory from './pages/inventory/BulkAddInventory'
import CreateBarcode from './pages/inventory/CreateBarcode'
import CreateProductCode from './pages/inventory/CreateProductCode'
import Coupons from './pages/Coupons'
import Banners from './pages/Banners'
import Returns from './pages/Returns'
import SalesReport from './pages/SalesReport'
import Analytics from './pages/Analytics'
import Influencers from './pages/Influencers'
import InfluencerDashboard from './pages/InfluencerDashboard'
import Tickets from './pages/Tickets'
import Reviews from './pages/Reviews'
import AdminManagement from './pages/AdminManagement'
import MembershipPlans from './pages/MembershipPlans'
import Marketing from './pages/Marketing'
import Merchandising from './pages/Merchandising'
import AIInsights from './pages/AIInsights'
import Calculator from './pages/Calculator'
import Login from './components/Login'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const backendUrl = import.meta.env.VITE_BACKEND_URL
export const currency = '₹'

const App = () => {

  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || '');
  const [userData, setUserData] = useState(
    localStorage.getItem('userData') ? JSON.parse(localStorage.getItem('userData')) : null
  );

  useEffect(() => {
    localStorage.setItem('token', token)
  }, [token])

  useEffect(() => {
    if (userRole) {
      localStorage.setItem('userRole', userRole)
    }
  }, [userRole])

  useEffect(() => {
    if (userData) {
      localStorage.setItem('userData', JSON.stringify(userData))
    }
  }, [userData])

  const handleLogout = () => {
    setToken('')
    setUserRole('')
    setUserData(null)
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userData')
  }

  return (
    <div className='bg-ink min-h-screen text-fg'>
      <ToastContainer position="top-right" autoClose={3000} />
      {token === ""
        ? <Login setToken={setToken} setUserRole={setUserRole} setUserData={setUserData} />
        : (
          <div className='flex w-full'>
            {userRole === 'admin' && <Sidebar />}
            <div className='flex-1 bg-ink min-h-screen flex flex-col'>
              <Navbar setToken={handleLogout} userRole={userRole} userData={userData} />
              {userRole === 'admin' ? (
                <Routes>
                  <Route path='/' element={<Dashboard token={token} />} />
                  <Route path='/add' element={<Add token={token} />} />
                  <Route path='/list' element={<List token={token} />} />
                  <Route path='/products' element={<ProductManagement token={token} />} />
                  <Route path='/products/add' element={<AddProductNew token={token} />} />
                  <Route path='/products/details' element={<ProductDetailList token={token} />} />
                  <Route path='/products/legacy' element={<List token={token} />} />
                  <Route path='/orders' element={<OrderManagementNew token={token} />} />
                  <Route path='/orders/legacy' element={<Orders token={token} />} />
                  <Route path='/categories' element={<Categories token={token} />} />
                  <Route path='/categories/add' element={<AddCategory token={token} />} />
                  <Route path='/merchandising' element={<Merchandising token={token} />} />
                  <Route path='/customers' element={<Customers token={token} />} />
                  <Route path='/inventory' element={<InventoryOverview token={token} />} />
                  <Route path='/inventory/stock-details' element={<StockDetails token={token} />} />
                  <Route path='/inventory/bulk-add' element={<BulkAddInventory token={token} />} />
                  <Route path='/inventory/barcode' element={<CreateBarcode token={token} />} />
                  <Route path='/inventory/product-code' element={<CreateProductCode token={token} />} />
                  <Route path='/inventory/legacy' element={<Inventory token={token} />} />
                  <Route path='/coupons' element={<Coupons token={token} />} />
                  <Route path='/banners' element={<Banners token={token} />} />
                  <Route path='/returns' element={<Returns token={token} />} />
                  <Route path='/influencers' element={<Influencers token={token} />} />
                  <Route path='/tickets' element={<Tickets token={token} />} />
                  <Route path='/reviews' element={<Reviews token={token} />} />
                  <Route path='/admin-management' element={<AdminManagement token={token} />} />
                  <Route path='/membership' element={<MembershipPlans token={token} />} />
                  <Route path='/marketing' element={<Marketing token={token} />} />
                  <Route path='/ai-insights' element={<AIInsights token={token} />} />
                  <Route path='/calculator' element={<Calculator token={token} />} />
                  <Route path='/reports/sales' element={<SalesReport token={token} />} />
                  <Route path='/reports/analytics' element={<Analytics token={token} />} />
                  <Route path='*' element={<Navigate to='/' />} />
                </Routes>
              ) : (
                <Routes>
                  <Route path='/' element={<InfluencerDashboard token={token} userData={userData} />} />
                  <Route path='*' element={<Navigate to='/' />} />
                </Routes>
              )}
            </div>
          </div>
        )
      }
    </div>
  )
}

export default App