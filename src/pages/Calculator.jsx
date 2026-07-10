import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import {
  Calculator as CalcIcon, Delete, Percent, TrendingUp, Boxes,
  Receipt, Tag, RefreshCw, Equal,
} from 'lucide-react'
import { PageHeader, Btn, StatCard, FilterTabs, Card } from '../components/ui'

/* ------------------------------------------------------------------ *
 * Safe arithmetic evaluator (shunting-yard → RPN). No eval/Function.
 * Supports + - * / , % (modulo), ^ (power), unary minus, parentheses.
 * ------------------------------------------------------------------ */
const evaluateExpression = (raw) => {
  const expr = String(raw).replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, '')
  if (!expr) return null

  // Binary operators. Unary +/- are rewritten to 'u+'/'u-' (higher precedence,
  // right-associative) so that e.g. 2*-3 = -6 rather than 2*(0-3).
  const ops = {
    '+': { prec: 1, assoc: 'L', arity: 2, fn: (a, b) => a + b },
    '-': { prec: 1, assoc: 'L', arity: 2, fn: (a, b) => a - b },
    '*': { prec: 2, assoc: 'L', arity: 2, fn: (a, b) => a * b },
    '/': { prec: 2, assoc: 'L', arity: 2, fn: (a, b) => a / b },
    '%': { prec: 2, assoc: 'L', arity: 2, fn: (a, b) => a % b },
    'u+': { prec: 3, assoc: 'R', arity: 1, fn: (a) => a },
    'u-': { prec: 3, assoc: 'R', arity: 1, fn: (a) => -a },
    '^': { prec: 4, assoc: 'R', arity: 2, fn: (a, b) => Math.pow(a, b) },
  }

  const tokens = expr.match(/(\d+\.?\d*|\.\d+|[+\-*/%^()])/g)
  if (!tokens || tokens.join('') !== expr) throw new Error('Invalid characters')

  const output = []
  const stack = []
  let prev = null

  for (let tok of tokens) {
    if (/^(\d|\.)/.test(tok)) {
      output.push(parseFloat(tok))
    } else if (tok === '(') {
      stack.push(tok)
    } else if (tok === ')') {
      while (stack.length && stack[stack.length - 1] !== '(') output.push(stack.pop())
      if (!stack.length) throw new Error('Mismatched parentheses')
      stack.pop()
    } else {
      // Detect unary +/- (at start, or after another operator or an open paren)
      if ((tok === '-' || tok === '+') && (prev === null || prev === '(' || ops[prev])) {
        tok = tok === '-' ? 'u-' : 'u+'
      }
      const o1 = ops[tok]
      if (!o1) throw new Error('Invalid expression')
      while (
        stack.length &&
        ops[stack[stack.length - 1]] &&
        ((o1.assoc === 'L' && o1.prec <= ops[stack[stack.length - 1]].prec) ||
          (o1.assoc === 'R' && o1.prec < ops[stack[stack.length - 1]].prec))
      ) {
        output.push(stack.pop())
      }
      stack.push(tok)
    }
    prev = tok
  }
  while (stack.length) {
    const op = stack.pop()
    if (op === '(' || op === ')') throw new Error('Mismatched parentheses')
    output.push(op)
  }

  const rpn = []
  for (const t of output) {
    if (typeof t === 'number') {
      rpn.push(t)
    } else if (ops[t].arity === 1) {
      const a = rpn.pop()
      if (a === undefined) throw new Error('Malformed expression')
      rpn.push(ops[t].fn(a))
    } else {
      const b = rpn.pop()
      const a = rpn.pop()
      if (a === undefined || b === undefined) throw new Error('Malformed expression')
      rpn.push(ops[t].fn(a, b))
    }
  }
  if (rpn.length !== 1) throw new Error('Malformed expression')
  const result = rpn[0]
  if (!Number.isFinite(result)) throw new Error('Math error')
  return result
}

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100
const inr = (n) =>
  currency + (Number.isFinite(n) ? round2(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0')

/* ------------------------------------------------------------------ */
/* Expression / standard calculator                                    */
/* ------------------------------------------------------------------ */
const ExpressionCalc = () => {
  const [expr, setExpr] = useState('')
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')

  const live = useMemo(() => {
    if (!expr.trim()) return ''
    try {
      return round2(evaluateExpression(expr))
    } catch {
      return ''
    }
  }, [expr])

  const push = (val) => { setError(''); setExpr((e) => e + val) }
  const backspace = () => setExpr((e) => e.slice(0, -1))
  const clear = () => { setExpr(''); setError('') }

  const equals = () => {
    if (!expr.trim()) return
    try {
      const result = round2(evaluateExpression(expr))
      setHistory((h) => [{ expr, result }, ...h].slice(0, 8))
      setExpr(String(result))
      setError('')
    } catch (err) {
      setError(err.message || 'Invalid expression')
    }
  }

  const onKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); equals() }
    else if (e.key === 'Escape') clear()
  }

  const keys = [
    ['(', ')', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '^', '='],
  ]
  const opChars = new Set(['÷', '×', '-', '+', '^', '%'])

  return (
    <div className='grid lg:grid-cols-[1fr_320px] gap-5'>
      <Card title='Calculator' subtitle='Type an expression or use the keypad — Enter to evaluate' icon={CalcIcon}>
        <div className='rounded-2xl bg-surface-2 border border-line p-4 mb-4'>
          <input
            value={expr}
            onChange={(e) => { setError(''); setExpr(e.target.value) }}
            onKeyDown={onKey}
            placeholder='0'
            autoFocus
            spellCheck={false}
            className='w-full bg-transparent text-right text-3xl font-heading font-bold text-fg outline-none placeholder:text-faint'
          />
          <div className='text-right text-sm text-muted mt-1 h-5'>
            {error ? <span className='text-danger'>{error}</span> : (live !== '' && <span>= {live.toLocaleString('en-IN')}</span>)}
          </div>
        </div>

        <div className='grid grid-cols-4 gap-2'>
          <button onClick={clear}
            className='col-span-2 py-3.5 rounded-xl bg-danger/15 text-danger border border-danger/30 font-semibold hover:bg-danger/25 transition-all'>
            Clear
          </button>
          <button onClick={backspace}
            className='col-span-2 py-3.5 rounded-xl bg-surface-2 text-fg border border-line font-semibold hover:border-accent/60 transition-all inline-flex items-center justify-center gap-2'>
            <Delete size={16} /> Back
          </button>
          {keys.flat().map((k) => {
            if (k === '=') {
              return (
                <button key={k} onClick={equals}
                  className='py-3.5 rounded-xl bg-accent-gradient text-brand-deep font-bold shadow-glow hover:brightness-110 transition-all inline-flex items-center justify-center'>
                  <Equal size={18} />
                </button>
              )
            }
            const isOp = opChars.has(k)
            return (
              <button key={k} onClick={() => push(k)}
                className={`py-3.5 rounded-xl font-semibold text-lg transition-all ${
                  isOp
                    ? 'bg-accent/12 text-accent border border-accent/25 hover:bg-accent/20'
                    : 'bg-surface-2 text-fg border border-line hover:border-accent/60'
                }`}>
                {k}
              </button>
            )
          })}
        </div>
      </Card>

      <Card title='History' subtitle='Last 8 results' icon={RefreshCw}
        actions={history.length > 0 && <Btn size='sm' variant='ghost' onClick={() => setHistory([])}>Clear</Btn>}>
        {history.length === 0 ? (
          <p className='text-sm text-faint text-center py-8'>No calculations yet</p>
        ) : (
          <ul className='space-y-2'>
            {history.map((h, i) => (
              <li key={i}>
                <button onClick={() => setExpr(String(h.result))}
                  className='w-full text-left px-3 py-2 rounded-xl bg-surface-2 border border-line hover:border-accent/50 transition-all'>
                  <p className='text-[11px] text-faint truncate'>{h.expr}</p>
                  <p className='text-fg font-semibold'>= {h.result.toLocaleString('en-IN')}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

/* Small labelled number field used by the domain tools */
const NumField = ({ label, value, onChange, prefix, suffix, placeholder = '0', step = 'any' }) => (
  <label className='block'>
    <span className='block text-[11px] font-semibold uppercase tracking-wider text-muted mb-1.5'>{label}</span>
    <div className='relative'>
      {prefix && <span className='absolute left-3 top-1/2 -translate-y-1/2 text-faint text-sm'>{prefix}</span>}
      <input
        type='number' inputMode='decimal' step={step} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full py-2.5 text-sm rounded-xl bg-surface-2 border border-line text-fg placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none transition-all ${prefix ? 'pl-8' : 'pl-3.5'} ${suffix ? 'pr-9' : 'pr-3.5'}`}
      />
      {suffix && <span className='absolute right-3 top-1/2 -translate-y-1/2 text-faint text-sm'>{suffix}</span>}
    </div>
  </label>
)

const ResultRow = ({ label, value, strong }) => (
  <div className='flex items-center justify-between py-2 border-b border-white/5 last:border-0'>
    <span className={`text-sm ${strong ? 'text-fg font-semibold' : 'text-muted'}`}>{label}</span>
    <span className={`font-heading ${strong ? 'text-accent text-lg font-extrabold' : 'text-fg font-bold'}`}>{value}</span>
  </div>
)

/* ------------------------------------------------------------------ */
/* Inventory value — pulls live products + manual line calculator      */
/* ------------------------------------------------------------------ */
const InventoryCalc = ({ token }) => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const [qty, setQty] = useState('')
  const [unitCost, setUnitCost] = useState('')

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(backendUrl + '/api/product/list')
      if (data.success) setProducts(data.products || [])
    } catch (err) {
      console.log(err)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { fetchProducts() }, [])

  const stats = useMemo(() => {
    let units = 0, retailValue = 0, skuCount = 0, outOfStock = 0
    for (const p of products) {
      const variants = p.variants || []
      skuCount += variants.length
      const stock = variants.reduce((s, v) => s + (Number(v.stock) || 0), 0)
      units += stock
      retailValue += stock * (Number(p.discountPrice ?? p.price) || 0)
      if (variants.length && stock <= 0) outOfStock += 1
    }
    return { units, retailValue, skuCount, outOfStock, productCount: products.length }
  }, [products])

  const lineTotal = round2((Number(qty) || 0) * (Number(unitCost) || 0))

  return (
    <div className='space-y-5'>
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
        <StatCard icon={Boxes} tone='accent' label='Units in stock' value={loading ? '…' : stats.units.toLocaleString('en-IN')} sub={`${stats.skuCount} SKUs`} />
        <StatCard icon={TrendingUp} tone='success' label='Retail value' value={loading ? '…' : inr(stats.retailValue)} sub='At current selling price' />
        <StatCard icon={Tag} tone='brand' label='Products' value={loading ? '…' : stats.productCount} />
        <StatCard icon={CalcIcon} tone='danger' label='Out of stock' value={loading ? '…' : stats.outOfStock} sub='Products with 0 units' />
      </div>

      <div className='grid lg:grid-cols-2 gap-5'>
        <Card title='Live inventory valuation' subtitle='Computed from current catalogue stock' icon={Boxes}
          actions={<Btn size='sm' variant='secondary' icon={RefreshCw} onClick={fetchProducts}>Refresh</Btn>}>
          <div className='space-y-1'>
            <ResultRow label='Total units across all SKUs' value={stats.units.toLocaleString('en-IN')} />
            <ResultRow label='Distinct products' value={stats.productCount} />
            <ResultRow label='Distinct SKUs (variants)' value={stats.skuCount} />
            <ResultRow label='Estimated retail value' value={inr(stats.retailValue)} strong />
          </div>
          <p className='text-[11px] text-faint mt-3'>
            Retail value uses each product's discounted/selling price × units in stock. For cost-based valuation, use the line calculator.
          </p>
        </Card>

        <Card title='Line item calculator' subtitle='Quantity × unit cost' icon={CalcIcon}>
          <div className='grid grid-cols-2 gap-3 mb-4'>
            <NumField label='Quantity' value={qty} onChange={setQty} placeholder='0' />
            <NumField label='Unit cost' value={unitCost} onChange={setUnitCost} prefix={currency} placeholder='0.00' />
          </div>
          <div className='space-y-1'>
            <ResultRow label='Line total' value={inr(lineTotal)} strong />
            <ResultRow label='Per 10 units' value={inr((Number(unitCost) || 0) * 10)} />
            <ResultRow label='Per 100 units' value={inr((Number(unitCost) || 0) * 100)} />
          </div>
        </Card>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Margin / markup calculator                                          */
/* ------------------------------------------------------------------ */
const MarginCalc = () => {
  const [cost, setCost] = useState('')
  const [price, setPrice] = useState('')

  const c = Number(cost) || 0
  const p = Number(price) || 0
  const profit = round2(p - c)
  const margin = p > 0 ? round2((profit / p) * 100) : 0
  const markup = c > 0 ? round2((profit / c) * 100) : 0

  return (
    <div className='grid lg:grid-cols-2 gap-5'>
      <Card title='Margin & markup' subtitle='Enter cost and selling price' icon={TrendingUp}>
        <div className='grid grid-cols-2 gap-3'>
          <NumField label='Cost price' value={cost} onChange={setCost} prefix={currency} placeholder='0.00' />
          <NumField label='Selling price' value={price} onChange={setPrice} prefix={currency} placeholder='0.00' />
        </div>
      </Card>
      <Card title='Result' icon={Percent}>
        <div className='space-y-1'>
          <ResultRow label='Profit per unit' value={inr(profit)} strong />
          <ResultRow label='Profit margin' value={`${margin}%`} />
          <ResultRow label='Markup on cost' value={`${markup}%`} />
        </div>
        {p > 0 && p < c && (
          <p className='text-[11px] text-danger mt-3'>Selling below cost — this item is running at a loss.</p>
        )}
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* GST / tax calculator (India)                                        */
/* ------------------------------------------------------------------ */
const GstCalc = () => {
  const [amount, setAmount] = useState('')
  const [rate, setRate] = useState('18')
  const [mode, setMode] = useState('exclusive') // exclusive: add GST | inclusive: extract GST

  const amt = Number(amount) || 0
  const r = Number(rate) || 0

  let base, gst, total
  if (mode === 'exclusive') {
    base = amt
    gst = round2(amt * (r / 100))
    total = round2(amt + gst)
  } else {
    base = round2(amt / (1 + r / 100))
    gst = round2(amt - base)
    total = amt
  }
  const half = round2(gst / 2)

  return (
    <div className='grid lg:grid-cols-2 gap-5'>
      <Card title='GST calculator' subtitle='Add or extract GST' icon={Receipt}>
        <FilterTabs
          className='mb-4'
          value={mode}
          onChange={setMode}
          options={[{ value: 'exclusive', label: 'Add GST' }, { value: 'inclusive', label: 'Remove GST' }]}
        />
        <div className='grid grid-cols-2 gap-3 mb-4'>
          <NumField label={mode === 'exclusive' ? 'Base amount' : 'Gross amount'} value={amount} onChange={setAmount} prefix={currency} placeholder='0.00' />
          <NumField label='GST rate' value={rate} onChange={setRate} suffix='%' placeholder='18' />
        </div>
        <div className='flex flex-wrap gap-2'>
          {[0, 5, 12, 18, 28].map((rr) => (
            <button key={rr} onClick={() => setRate(String(rr))}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                Number(rate) === rr ? 'bg-accent-gradient text-brand-deep border-transparent shadow-glow' : 'bg-surface-2 text-muted border-line hover:text-fg'
              }`}>{rr}%</button>
          ))}
        </div>
      </Card>
      <Card title='Breakdown' icon={Percent}>
        <div className='space-y-1'>
          <ResultRow label='Base (taxable) amount' value={inr(base)} />
          <ResultRow label={`CGST (${round2(r / 2)}%)`} value={inr(half)} />
          <ResultRow label={`SGST (${round2(r / 2)}%)`} value={inr(half)} />
          <ResultRow label='Total GST' value={inr(gst)} />
          <ResultRow label='Total payable' value={inr(total)} strong />
        </div>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Discount calculator                                                 */
/* ------------------------------------------------------------------ */
const DiscountCalc = () => {
  const [price, setPrice] = useState('')
  const [discount, setDiscount] = useState('')

  const p = Number(price) || 0
  const d = Number(discount) || 0
  const saved = round2(p * (d / 100))
  const final = round2(p - saved)

  return (
    <div className='grid lg:grid-cols-2 gap-5'>
      <Card title='Discount calculator' subtitle='Apply a percentage off' icon={Tag}>
        <div className='grid grid-cols-2 gap-3 mb-4'>
          <NumField label='Original price' value={price} onChange={setPrice} prefix={currency} placeholder='0.00' />
          <NumField label='Discount' value={discount} onChange={setDiscount} suffix='%' placeholder='0' />
        </div>
        <div className='flex flex-wrap gap-2'>
          {[10, 15, 20, 25, 30, 50].map((dd) => (
            <button key={dd} onClick={() => setDiscount(String(dd))}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                Number(discount) === dd ? 'bg-accent-gradient text-brand-deep border-transparent shadow-glow' : 'bg-surface-2 text-muted border-line hover:text-fg'
              }`}>{dd}%</button>
          ))}
        </div>
      </Card>
      <Card title='Result' icon={Percent}>
        <div className='space-y-1'>
          <ResultRow label='You save' value={inr(saved)} />
          <ResultRow label='Final price' value={inr(final)} strong />
        </div>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */
const TABS = [
  { value: 'calc', label: 'Calculator' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'margin', label: 'Margin' },
  { value: 'gst', label: 'GST' },
  { value: 'discount', label: 'Discount' },
]

const Calculator = ({ token }) => {
  const [tab, setTab] = useState('calc')

  return (
    <div className='p-4 sm:p-6 max-w-6xl mx-auto'>
      <PageHeader
        icon={CalcIcon}
        title='Smart Calculator'
        subtitle='Quick math plus inventory, margin, GST and discount tools'
      />
      <FilterTabs className='mb-6' value={tab} onChange={setTab} options={TABS} />

      {tab === 'calc' && <ExpressionCalc />}
      {tab === 'inventory' && <InventoryCalc token={token} />}
      {tab === 'margin' && <MarginCalc />}
      {tab === 'gst' && <GstCalc />}
      {tab === 'discount' && <DiscountCalc />}
    </div>
  )
}

export default Calculator
