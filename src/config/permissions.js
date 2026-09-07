// Modules a limited staff account can be granted access to. Keys match the
// sidebar sections and are stored on the staff record's `permissions` array.
export const PERMISSION_MODULES = [
  { key: 'products', label: 'Products' },
  { key: 'categories', label: 'Categories' },
  { key: 'merchandising', label: 'Merchandising' },
  { key: 'orders', label: 'Orders' },
  { key: 'customers', label: 'Customers' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'calculator', label: 'Calculator' },
  { key: 'coupons', label: 'Coupons / Promos' },
  { key: 'banners', label: 'Banners' },
  { key: 'returns', label: 'Returns & Refunds' },
  { key: 'influencers', label: 'Influencers' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'tickets', label: 'Tickets' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'membership', label: 'Membership' },
  { key: 'ai-insights', label: 'AI Insights' },
  { key: 'reports', label: 'Reports' },
]

// Current signed-in user's access, read from localStorage (set at login).
export const getAccess = () => {
  try {
    const role = localStorage.getItem('userRole')
    if (role === 'admin' || role === 'influencer') return { role, all: true, perms: [] }
    const data = JSON.parse(localStorage.getItem('userData') || 'null')
    if (data && (data.role === 'admin' || data.accessType === 'all')) return { role: data.role || 'staff', all: true, perms: [] }
    return { role: data?.role || 'staff', all: false, perms: data?.permissions || [] }
  } catch { return { role: 'admin', all: true, perms: [] } }
}

// Can the current user access a module? (unkeyed sections like Dashboard = always).
export const canAccess = (permKey) => {
  const a = getAccess()
  if (a.all) return true
  if (!permKey) return true
  return a.perms.includes(permKey)
}
