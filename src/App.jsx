import React, { useEffect, useState, Suspense, lazy } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { canAccess } from './config/permissions'

// Lightweight route-transition loader for lazy pages.
const PageLoader = () => (
  <div className='flex-1 grid place-items-center min-h-[60vh]'>
    <div className='w-10 h-10 border-4 border-line border-t-accent rounded-full animate-spin' />
  </div>
)

// Blocks a limited staff from opening (by URL) a section they weren't granted.
const pathPerm = (p) => {
  const map = [
    ['/products', 'products'], ['/categories', 'categories'], ['/merchandising', 'merchandising'],
    ['/orders', 'orders'], ['/customers', 'customers'], ['/inventory', 'inventory'],
    ['/calculator', 'calculator'], ['/coupons', 'coupons'], ['/banners', 'banners'],
    ['/returns', 'returns'], ['/influencers', 'influencers'], ['/reviews', 'reviews'],
    ['/tickets', 'tickets'], ['/marketing', 'marketing'], ['/membership', 'membership'],
    ['/ai-insights', 'ai-insights'], ['/admin-management', 'admin-management'], ['/reports', 'reports'],
  ]
  const hit = map.find(([prefix]) => p === prefix || p.startsWith(prefix + '/'))
  return hit ? hit[1] : null   // null = unguarded (Dashboard etc.)
}

const PermGuard = ({ children }) => {
  const { pathname } = useLocation()
  if (!canAccess(pathPerm(pathname))) return <Navigate to='/' replace />
  return children
}
// Pages are lazy-loaded so the admin first-load bundle stays small (faster boot).
const Add = lazy(() => import('./pages/Add'))
const List = lazy(() => import('./pages/List'))
const ProductManagement = lazy(() => import('./pages/product/ProductManagement'))
const ProductDetailList = lazy(() => import('./pages/product/ProductDetailList'))
const AddProductNew = lazy(() => import('./pages/product/AddProductNew'))
const Orders = lazy(() => import('./pages/Orders'))
const OrderManagementNew = lazy(() => import('./pages/order/OrderManagementNew'))
const OrderDetails = lazy(() => import('./pages/order/OrderDetails'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Categories = lazy(() => import('./pages/Categories'))
const AddCategory = lazy(() => import('./pages/AddCategory'))
const Customers = lazy(() => import('./pages/Customers'))
const Inventory = lazy(() => import('./pages/Inventory'))
const InventoryOverview = lazy(() => import('./pages/inventory/InventoryOverview'))
const StockDetails = lazy(() => import('./pages/inventory/StockDetails'))
const BulkAddInventory = lazy(() => import('./pages/inventory/BulkAddInventory'))
const CreateBarcode = lazy(() => import('./pages/inventory/CreateBarcode'))
const CreateProductCode = lazy(() => import('./pages/inventory/CreateProductCode'))
const Coupons = lazy(() => import('./pages/Coupons'))
const Banners = lazy(() => import('./pages/Banners'))
const Returns = lazy(() => import('./pages/Returns'))
const SalesReport = lazy(() => import('./pages/SalesReport'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Influencers = lazy(() => import('./pages/Influencers'))
const InfluencerDashboard = lazy(() => import('./pages/InfluencerDashboard'))
const Tickets = lazy(() => import('./pages/Tickets'))
const Reviews = lazy(() => import('./pages/Reviews'))
const AdminManagement = lazy(() => import('./pages/AdminManagement'))
const MembershipPlans = lazy(() => import('./pages/MembershipPlans'))
const Marketing = lazy(() => import('./pages/Marketing'))
const Merchandising = lazy(() => import('./pages/Merchandising'))
const AIInsights = lazy(() => import('./pages/AIInsights'))
const Calculator = lazy(() => import('./pages/Calculator'))
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
            {(userRole === 'admin' || userRole === 'staff') && <Sidebar />}
            <div className='flex-1 bg-ink min-h-screen flex flex-col'>
              <Navbar setToken={handleLogout} userRole={userRole} userData={userData} />
              {(userRole === 'admin' || userRole === 'staff') ? (
                <PermGuard>
                <Suspense fallback={<PageLoader />}>
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
                  <Route path='/orders/:orderId' element={<OrderDetails token={token} />} />
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
                </Suspense>
                </PermGuard>
              ) : (
                <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path='/' element={<InfluencerDashboard token={token} userData={userData} />} />
                  <Route path='*' element={<Navigate to='/' />} />
                </Routes>
                </Suspense>
              )}
            </div>
          </div>
        )
      }
    </div>
  )
}

export default App