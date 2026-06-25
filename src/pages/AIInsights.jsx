import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { backendUrl } from '../App'
import { Sparkles, AlertTriangle, RefreshCw, PackageX } from 'lucide-react'
import { PageHeader, Btn, Card, StatusPill, EmptyState, Skeleton } from '../components/ui'

const riskTone = { high: 'danger', medium: 'amber', low: 'success' }

const AIInsights = ({ token }) => {
  const [predictions, setPredictions] = useState([])
  const [source, setSource] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(backendUrl + '/api/ai/stock-prediction', { headers: { token } })
      if (data.success) { setPredictions(data.predictions || []); setSource(data.source) }
      else toast.error(data.message)
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const highRisk = predictions.filter(p => p.riskLevel === 'high').length

  return (
    <div className='p-6'>
      <PageHeader
        icon={Sparkles}
        title='AI Stock Prediction'
        subtitle={`Demand forecasting powered by ${source === 'ai' ? 'Claude AI' : 'sales-velocity analysis'}`}
        actions={<Btn variant='secondary' size='sm' icon={RefreshCw} onClick={load}>Refresh</Btn>}
      />

      {highRisk > 0 && (
        <div className='mb-5 px-4 py-3 rounded-xl bg-danger/10 border border-danger/30 flex items-center gap-3 animate-slide-down'>
          <AlertTriangle className='text-danger shrink-0' size={18} />
          <span className='text-sm text-fg font-medium'>{highRisk} product(s) at high risk of stockout — reorder soon.</span>
        </div>
      )}

      <Card title='Restock recommendations' icon={Sparkles} bodyClass='p-0'>
        {loading ? (
          <div className='p-5 space-y-3'>{[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className='h-12 rounded-xl' />)}</div>
        ) : predictions.length === 0 ? (
          <EmptyState icon={PackageX} title='No data available' message='Add products and sales to generate demand forecasts.' />
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-[10px] uppercase tracking-widest text-faint border-b border-line/70'>
                  <th className='text-left px-5 py-3 font-semibold'>Product</th>
                  <th className='text-left px-3 py-3 font-semibold'>Risk</th>
                  <th className='text-left px-3 py-3 font-semibold'>Days to stockout</th>
                  <th className='text-left px-3 py-3 font-semibold'>Reorder qty</th>
                  <th className='text-left px-5 py-3 font-semibold'>Insight</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p, i) => (
                  <tr key={p.productId || i} className='border-b border-line/40 hover:bg-surface-2/40 transition-colors'>
                    <td className='px-5 py-3 font-medium text-fg'>{p.name}</td>
                    <td className='px-3 py-3'><StatusPill status={p.riskLevel} tone={riskTone[p.riskLevel]} /></td>
                    <td className='px-3 py-3 text-fg'>{p.daysUntilStockout ?? '—'}</td>
                    <td className='px-3 py-3 font-bold text-accent'>{p.recommendedReorderQty || 0}</td>
                    <td className='px-5 py-3 text-muted'>{p.insight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export default AIInsights
