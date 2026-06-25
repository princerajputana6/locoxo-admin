import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import { TrendingUp, Users, DollarSign, MousePointer, Copy, CheckCircle } from 'lucide-react'

const InfluencerDashboard = ({ token, userData }) => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const fetchDashboardData = async () => {
    try {
      const response = await axios.post(
        backendUrl + '/api/influencer/dashboard',
        { influencerId: userData._id },
        { headers: { token } }
      )
      
      if (response.data.success) {
        setDashboardData(response.data.data)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userData && userData._id) {
      fetchDashboardData()
    }
  }, [userData])

  const copyReferralCode = () => {
    if (dashboardData?.profile?.referralCode) {
      navigator.clipboard.writeText(dashboardData.profile.referralCode)
      setCopied(true)
      toast.success('Referral code copied!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4'></div>
          <p className='text-muted'>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <p className='text-muted'>No data available</p>
      </div>
    )
  }

  const { profile, stats, product } = dashboardData

  return (
    <div className='p-4 sm:p-10 w-full max-w-7xl mx-auto'>
      {/* Welcome Header */}
      <div className='mb-8'>
        <h1 className='text-4xl font-bold mb-2'>Welcome, {profile.name}! 👋</h1>
        <p className='text-muted'>Here's your performance overview</p>
      </div>

      {/* Referral Code Card */}
      <div className='bg-gradient-to-r from-black to-gray-800 text-white rounded-xl p-6 mb-8 shadow-lg'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between'>
          <div className='mb-4 md:mb-0'>
            <p className='text-sm opacity-80 mb-1'>Your Referral Code</p>
            <p className='text-3xl font-bold tracking-wider'>{profile.referralCode}</p>
          </div>
          <button
            onClick={copyReferralCode}
            className='glass text-fg px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors flex items-center gap-2 w-fit'
          >
            {copied ? (
              <>
                <CheckCircle className='w-5 h-5' />
                Copied!
              </>
            ) : (
              <>
                <Copy className='w-5 h-5' />
                Copy Code
              </>
            )}
          </button>
        </div>
        <div className='mt-4 pt-4 border-t border-white/20'>
          <p className='text-sm opacity-80'>Commission Rate: <span className='font-bold text-lg'>{profile.commissionRate}%</span></p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        {/* Total Clicks */}
        <div className='glass border border-white/10 rounded-xl p-6 hover:shadow-lg transition-shadow'>
          <div className='flex items-center justify-between mb-4'>
            <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
              <MousePointer className='w-6 h-6 text-blue-600' />
            </div>
          </div>
          <p className='text-3xl font-bold mb-1'>{stats.totalClicks}</p>
          <p className='text-sm text-muted'>Total Clicks</p>
        </div>

        {/* Total Conversions */}
        <div className='glass border border-white/10 rounded-xl p-6 hover:shadow-lg transition-shadow'>
          <div className='flex items-center justify-between mb-4'>
            <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
              <Users className='w-6 h-6 text-green-600' />
            </div>
          </div>
          <p className='text-3xl font-bold mb-1'>{stats.totalConversions}</p>
          <p className='text-sm text-muted'>Conversions</p>
        </div>

        {/* Total Sales */}
        <div className='glass border border-white/10 rounded-xl p-6 hover:shadow-lg transition-shadow'>
          <div className='flex items-center justify-between mb-4'>
            <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center'>
              <TrendingUp className='w-6 h-6 text-purple-600' />
            </div>
          </div>
          <p className='text-3xl font-bold mb-1'>{currency}{stats.totalSales.toLocaleString()}</p>
          <p className='text-sm text-muted'>Total Sales</p>
        </div>

        {/* Total Earnings */}
        <div className='glass border border-white/10 rounded-xl p-6 hover:shadow-lg transition-shadow bg-gradient-to-br from-yellow-50 to-orange-50'>
          <div className='flex items-center justify-between mb-4'>
            <div className='w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center'>
              <DollarSign className='w-6 h-6 text-yellow-600' />
            </div>
          </div>
          <p className='text-3xl font-bold mb-1 text-yellow-700'>{currency}{stats.totalEarnings.toLocaleString()}</p>
          <p className='text-sm text-muted'>Your Earnings</p>
        </div>
      </div>

      {/* Conversion Rate */}
      <div className='glass border border-white/10 rounded-xl p-6 mb-8'>
        <h3 className='text-lg font-bold mb-4'>Performance Metrics</h3>
        <div className='flex items-center gap-4'>
          <div className='flex-1'>
            <p className='text-sm text-muted mb-2'>Conversion Rate</p>
            <div className='w-full bg-white/10 rounded-full h-4 overflow-hidden'>
              <div
                className='bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-500'
                style={{ width: `${Math.min(stats.conversionRate, 100)}%` }}
              ></div>
            </div>
          </div>
          <div className='text-right'>
            <p className='text-3xl font-bold text-green-600'>{stats.conversionRate}%</p>
          </div>
        </div>
      </div>

      {/* Assigned Product */}
      {product && (
        <div className='glass border border-white/10 rounded-xl p-6'>
          <h3 className='text-lg font-bold mb-4'>Your Assigned Product</h3>
          <div className='flex flex-col md:flex-row gap-6'>
            <div className='w-full md:w-48 h-48 bg-white/5 rounded-lg overflow-hidden flex-shrink-0'>
              <img
                src={product.image[0]}
                alt={product.name}
                className='w-full h-full object-cover'
              />
            </div>
            <div className='flex-1'>
              <h4 className='text-2xl font-bold mb-2'>{product.name}</h4>
              <p className='text-3xl font-bold text-fg mb-4'>{currency}{product.price}</p>
              <div className='bg-white/5 rounded-lg p-4'>
                <p className='text-sm text-muted mb-2'>Share this product with your referral code to earn commission!</p>
                <p className='text-sm font-semibold'>Your Commission: {currency}{(product.price * profile.commissionRate / 100).toFixed(2)} per sale</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Info */}
      <div className='glass border border-white/10 rounded-xl p-6 mt-8'>
        <h3 className='text-lg font-bold mb-4'>Profile Information</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <p className='text-sm text-muted'>Email</p>
            <p className='font-semibold'>{profile.email}</p>
          </div>
          {profile.phone && (
            <div>
              <p className='text-sm text-muted'>Phone</p>
              <p className='font-semibold'>{profile.phone}</p>
            </div>
          )}
          {profile.instagramHandle && (
            <div>
              <p className='text-sm text-muted'>Instagram</p>
              <p className='font-semibold'>{profile.instagramHandle}</p>
            </div>
          )}
          <div>
            <p className='text-sm text-muted'>Status</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              profile.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InfluencerDashboard
