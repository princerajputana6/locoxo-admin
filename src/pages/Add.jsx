import React from 'react'
import { PackagePlus } from 'lucide-react'
import { PageHeader } from '../components/ui'
import ProductForm from '../components/ProductForm'

// Add Product — full form (code, highlights, MRP/selling/auto-discount, size chart,
// images + video, status). Variants get an auto LX code, SKU & EAN-13 barcode.
const Add = ({ token }) => {
  return (
    <div className='p-6'>
      <PageHeader icon={PackagePlus} title='Add Product' subtitle='Highlights · pricing · media · variants — code, SKU & barcode auto-generated' />
      <div className='max-w-5xl'>
        <ProductForm token={token} onDone={() => { /* stays on page; toast confirms */ }} />
      </div>
    </div>
  )
}

export default Add
