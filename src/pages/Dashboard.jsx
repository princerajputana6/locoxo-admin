import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import {
  LayoutDashboard, TrendingUp, DollarSign, ShoppingCart, Package,
  Clock, CheckCircle2, AlertTriangle, ShoppingBag,
} from 'lucide-react'
import { PageHeader, StatCard, Card, EmptyState, StatusPill, Skeleton } from '../components/ui'

const Dashboard = ({ token }) => {
  const [stats, setStats] = useState({
    totalSales: 0, totalRevenue: 0, totalOrders: 0, totalProducts: 0,
    pendingOrders: 0, completedOrders: 0, lowStock: 0,
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const ordersResponse = await axios.post(backendUrl + '/api/order/list', {}, { headers: { token } })
      if (ordersResponse.data.success) {
        const orders = ordersResponse.data.orders
        const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0)
        setStats(prev => ({
          ...prev,
          totalRevenue,
          totalOrders: orders.length,
          pendingOrders: orders.filter(o => o.status === 'Order Placed' || o.status === 'Packing').length,
          completedOrders: orders.filter(o => o.status === 'Delivered').length,
          totalSales: orders.filter(o => o.payment).length,
        }))
        setRecentOrders(orders.slice(0, 5))
      }
      const productsResponse = await axios.get(backendUrl + '/api/product/list')
      if (productsResponse.data.success) {
        const products = productsResponse.data.products
        const lowStock = products.filter(p => {
          const total = (p.variants || []).reduce((s, v) => s + (v.stock || 0), 0)
          return total < (p.lowStockThreshold ?? 10)
        }).length
        setStats(prev => ({ ...prev, totalProducts: products.length, lowStock }))
        setTopProducts(products.slice(0, 5))
      }
    } catch (error) { console.log(error); toast.error(error.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchDashboardData() }, [token])

  return (
    <div className='p-6'>
      <PageHeader icon={LayoutDashboard} title='Dashboard' subtitle='Overview of your store performance' />

      {loading ? (
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6'>
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className='h-24 rounded-2xl' />)}
        </div>
      ) : (
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4'>
          <StatCard icon={TrendingUp} label='Paid Orders' value={stats.totalSales} tone='success' delay={0} />
          <StatCard icon={DollarSign} label='Total Revenue' value={`${currency}${stats.totalRevenue.toLocaleString()}`} tone='accent' delay={60} />
          <StatCard icon={ShoppingCart} label='Total Orders' value={stats.totalOrders} sub={`${stats.pendingOrders} pending`} tone='brand' delay={120} />
          <StatCard icon={Package} label='Total Products' value={stats.totalProducts} sub={`${stats.lowStock} low stock`} tone='violet' delay={180} />
        </div>
      )}

      <div className='grid grid-cols-1 md:grid-cols-3 gap-3 mb-6'>
        <MiniStat icon={Clock} label='Pending Orders' value={stats.pendingOrders} tone='amber' />
        <MiniStat icon={CheckCircle2} label='Completed Orders' value={stats.completedOrders} tone='success' />
        <MiniStat icon={AlertTriangle} label='Low Stock Items' value={stats.lowStock} tone='danger' />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        <Card title='Recent Orders' icon={ShoppingCart} bodyClass='p-3'>
          {recentOrders.length > 0 ? (
            <div className='space-y-2'>
              {recentOrders.map((order, i) => (
                <div key={i} className='flex items-center justify-between gap-3 surface-soft rounded-xl px-4 py-3'>
                  <div className='min-w-0'>
                    <p className='font-semibold text-fg'>Order #{order._id?.slice(-6)}</p>
                    <p className='text-xs text-muted truncate'>{order.address?.name || 'Customer'}</p>
                  </div>
                  <div className='text-right shrink-0'>
                    <p className='font-heading font-bold text-accent'>{currency}{order.amount}</p>
                    <StatusPill status={order.status} className='mt-1' />
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={ShoppingBag} title='No orders yet' />}
        </Card>

        <Card title='Top Products' icon={Package} bodyClass='p-3'>
          {topProducts.length > 0 ? (
            <div className='space-y-2'>
              {topProducts.map((product, i) => (
                <div key={i} className='flex items-center gap-3 surface-soft rounded-xl px-4 py-3'>
                  <img src={Array.isArray(product.image) ? product.image[0] : product.image} alt={product.name} className='w-11 h-11 object-cover rounded-lg bg-surface-2 shrink-0' />
                  <div className='flex-1 min-w-0'>
                    <p className='font-semibold text-fg truncate'>{product.name}</p>
                    <p className='text-xs text-muted'>{typeof product.category === 'object' ? product.category?.name : product.category}</p>
                  </div>
                  <p className='font-heading font-bold text-accent shrink-0'>{currency}{product.price}</p>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={Package} title='No products yet' />}
        </Card>
      </div>
    </div>
  )
}

const miniTones = {
  amber: 'text-amber bg-amber/15', success: 'text-success bg-success/15',
  danger: 'text-danger bg-danger/15', accent: 'text-accent bg-accent/15',
}
const MiniStat = ({ icon: Icon, label, value, tone }) => (
  <div className='glass card-hover rounded-2xl p-5 flex items-center gap-4'>
    <span className={`grid place-items-center w-12 h-12 rounded-xl ${miniTones[tone] || miniTones.accent}`}><Icon size={22} /></span>
    <div>
      <p className='text-[11px] font-semibold uppercase tracking-widest text-faint'>{label}</p>
      <p className='text-3xl font-heading font-extrabold text-gloss'>{value}</p>
    </div>
  </div>
)

export default Dashboard
