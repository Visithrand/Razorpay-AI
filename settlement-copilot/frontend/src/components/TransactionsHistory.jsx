import { useState, useMemo } from 'react'
import { Filter, Download, CreditCard, Smartphone, CheckCircle2, XCircle, Clock, Search, Calendar, ChevronRight, RotateCcw } from 'lucide-react'
import { exportToCSV } from '../api'
import TransactionModal from './TransactionModal'

const INITIAL_TXNS = [
  { id: 'pay_Nj8Qtty5Y2Jr8',  gateway_txn_ref: 'pay_Nj8Qtty5Y2Jr8', amount: 520000.00, gateway_amount: 520000.00, bank_amount: 520000.00, method: 'upi',  status: 'captured', gateway_date: '2024-01-24T14:45:00', date: 'Jan 24, 2:45 PM', cust: 'raj.kumar@example.com', gateway_utr: 'UTR984729104819' },
  { id: 'pay_Nj3Xgf9Q5rDoQ',  gateway_txn_ref: 'pay_Nj3Xgf9Q5rDoQ', amount: 12999.0, gateway_amount: 12999.0, bank_amount: 12999.0, method: 'card', status: 'refunded', gateway_date: '2024-01-24T13:12:00', date: 'Jan 24, 1:12 PM', cust: 'sneha.patel@gmail.com', gateway_utr: 'UTR819401827491' },
  { id: 'pay_Nj1LryE89FxX9',  gateway_txn_ref: 'pay_Nj1LryE89FxX9', amount: 5450.50,  gateway_amount: 5450.50,  bank_amount: 0.00,    method: 'upi',  status: 'failed',   gateway_date: '2024-01-24T11:30:00', date: 'Jan 24, 11:30 AM', cust: 'amit.singh@yahoo.com', gateway_utr: '—' },
  { id: 'pay_Ni9HfqcooTnj2',  gateway_txn_ref: 'pay_Ni9HfqcooTnj2', amount: 89000.00, gateway_amount: 89000.00, bank_amount: 89000.00, method: 'netbanking', status: 'captured', gateway_date: '2024-01-23T16:20:00', date: 'Jan 23, 4:20 PM', cust: 'corporate@techsolutions.in', gateway_utr: 'UTR773019284019' },
  { id: 'pay_Ni7SrcbplJd84',  gateway_txn_ref: 'pay_Ni7SrcbplJd84', amount: 150.00,  gateway_amount: 150.00,  bank_amount: 150.00,  method: 'upi',  status: 'captured', gateway_date: '2024-01-23T14:15:00', date: 'Jan 23, 2:15 PM', cust: 'priya.sharma@example.com', gateway_utr: 'UTR491029481029' },
  { id: 'pay_Ni4P0tvhhpBmy',  gateway_txn_ref: 'pay_Ni4P0tvhhpBmy', amount: 6799.00, gateway_amount: 6799.00, bank_amount: 6799.00, method: 'card', status: 'captured', gateway_date: '2024-01-23T09:05:00', date: 'Jan 23, 9:05 AM', cust: 'vikram.reddy@gmail.com', gateway_utr: 'UTR194029481920' },
  { id: 'pay_Nh8M291azHzkn',  gateway_txn_ref: 'pay_Nh8M291azHzkn', amount: 120.00,  gateway_amount: 120.00,  bank_amount: 120.00,  method: 'upi',  status: 'captured', gateway_date: '2024-01-22T18:30:00', date: 'Jan 22, 6:30 PM', cust: 'neha.gupta@example.com', gateway_utr: 'UTR918401928491' },
  { id: 'pay_Nh5Wvfgyw6Zbn',  gateway_txn_ref: 'pay_Nh5Wvfgyw6Zbn', amount: 5400.00, gateway_amount: 5400.00, bank_amount: 5400.00, method: 'card', status: 'captured', gateway_date: '2024-01-22T15:10:00', date: 'Jan 22, 3:10 PM', cust: 'rohit.verma@yahoo.com', gateway_utr: 'UTR294019284019' },
]

const STATUS_CFG = {
  captured: { icon: CheckCircle2, color: '#10B981', bg: '#D1FAE5' },
  refunded: { icon: Clock,        color: '#F59E0B', bg: '#FEF3C7' },
  failed:   { icon: XCircle,      color: '#EF4444', bg: '#FEE2E2' },
}

const METHOD_CFG = {
  upi:        { icon: Smartphone, label: 'UPI' },
  card:       { icon: CreditCard, label: 'Card' },
  netbanking: { icon: Clock,      label: 'Netbanking' },
}

export default function TransactionsHistory() {
  const [activeTab, setActiveTab] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTxn, setSelectedTxn] = useState(null)

  // Filter transactions dynamically
  const filteredTxns = useMemo(() => {
    return INITIAL_TXNS.filter(t => {
      // Status filter
      if (activeTab !== 'all' && t.status !== activeTab) return false
      // Method filter
      if (methodFilter !== 'all' && t.method !== methodFilter) return false
      
      // Amount Filter
      const amt = Number(t.amount || 0)
      if (minAmount && amt < Number(minAmount)) return false
      if (maxAmount && amt > Number(maxAmount)) return false

      // Priority Filter
      if (priorityFilter !== 'all') {
        let prio = 'LOW'
        if (amt >= 500000) prio = 'CRITICAL'
        else if (amt >= 50000) prio = 'HIGH'
        else if (amt >= 1000) prio = 'MEDIUM'

        if (priorityFilter.toUpperCase() !== prio) return false
      }

      // Text search filter (Name, Email, Txn ID, UTR)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchId = t.id.toLowerCase().includes(q)
        const matchCust = t.cust.toLowerCase().includes(q)
        const matchUtr = t.gateway_utr.toLowerCase().includes(q)
        if (!matchId && !matchCust && !matchUtr) return false
      }
      return true
    })
  }, [activeTab, methodFilter, priorityFilter, minAmount, maxAmount, searchQuery])

  const clearFilters = () => {
    setActiveTab('all')
    setMethodFilter('all')
    setPriorityFilter('all')
    setMinAmount('')
    setMaxAmount('')
    setSearchQuery('')
  }

  const hasActiveFilters = activeTab !== 'all' || methodFilter !== 'all' || priorityFilter !== 'all' || minAmount || maxAmount || searchQuery

  const handleExport = () => {
    exportToCSV('Razorpay_Transactions_Export', filteredTxns)
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B192C]">Transactions & Customer Claims</h1>
          <p className="text-[14px] text-[#4A5568] mt-0.5">Filter by customer name, payment ID, amount range, or priority level to investigate claims.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="btn-primary">
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#DCE3ED] overflow-hidden shadow-sm">
        {/* Top Control Bar: Status Tabs */}
        <div className="px-6 py-3 border-b border-[#DCE3ED] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#EFF3F8]/30">
          <div className="flex items-center gap-6 text-[14px] font-bold text-[#4A5568]">
            {[
              { id: 'all', label: `All (${INITIAL_TXNS.length})` },
              { id: 'captured', label: `Captured (${INITIAL_TXNS.filter(t => t.status === 'captured').length})` },
              { id: 'failed', label: `Failed (${INITIAL_TXNS.filter(t => t.status === 'failed').length})` },
              { id: 'refunded', label: `Refunded (${INITIAL_TXNS.filter(t => t.status === 'refunded').length})` },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`py-2 border-b-2 transition-all ${
                  activeTab === t.id ? 'border-[#0065FF] text-[#0065FF]' : 'border-transparent hover:text-[#0B192C]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 🔍 Rich Search & Filter Toolbar */}
        <div className="p-4 bg-gray-50 border-b border-[#DCE3ED] space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search size={15} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by customer name, email, payment ID, or UTR..."
                className="w-full bg-white border border-[#DCE3ED] rounded-lg pl-9 pr-3 py-2 text-xs text-[#0B192C] outline-none focus:border-[#0065FF] font-medium"
              />
            </div>

            {/* Priority & Method Dropdowns */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-white border border-[#DCE3ED] rounded-lg px-3 py-2 text-xs font-extrabold text-[#0B192C] outline-none focus:border-[#0065FF]"
              >
                <option value="all">All Priorities</option>
                <option value="CRITICAL">🚨 CRITICAL (&gt; ₹5L)</option>
                <option value="HIGH">🔴 HIGH (&gt; ₹50K)</option>
                <option value="MEDIUM">🟡 MEDIUM (&gt; ₹1K)</option>
                <option value="LOW">🟢 LOW (≤ ₹1K)</option>
              </select>

              <select
                value={methodFilter}
                onChange={e => setMethodFilter(e.target.value)}
                className="bg-white border border-[#DCE3ED] rounded-lg px-3 py-2 text-xs font-extrabold text-[#0B192C] outline-none focus:border-[#0065FF]"
              >
                <option value="all">All Methods</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="netbanking">Netbanking</option>
              </select>
            </div>
          </div>

          {/* Amount Range & Clear Row */}
          <div className="flex items-center justify-between gap-3 text-xs pt-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-bold uppercase text-[10px]">Amount Range:</span>
              <input
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                placeholder="Min ₹"
                className="w-24 bg-white border border-[#DCE3ED] rounded px-2 py-1 text-xs outline-none focus:border-[#0065FF]"
              />
              <span className="text-gray-400 font-bold">–</span>
              <input
                type="number"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                placeholder="Max ₹"
                className="w-24 bg-white border border-[#DCE3ED] rounded px-2 py-1 text-xs outline-none focus:border-[#0065FF]"
              />
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-extrabold text-[#EF4444] hover:underline flex items-center gap-1 bg-red-50 px-2.5 py-1 rounded border border-red-200"
              >
                <RotateCcw size={12} /> Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filteredTxns.length === 0 ? (
            <div className="p-12 text-center text-[#718096]">
              <p className="text-[15px] font-bold">No matching transactions found</p>
              <p className="text-[13px] mt-1">Try clearing your filters or search query.</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="btn-secondary text-xs mt-3">Reset All Filters</button>
              )}
            </div>
          ) : (
            <table className="w-full text-[14px] text-left">
              <thead>
                <tr className="border-b border-[#DCE3ED] bg-[#EFF3F8]/60">
                  <th className="px-6 py-3.5 text-[11px] font-extrabold uppercase tracking-wider text-[#718096]">Priority</th>
                  <th className="px-6 py-3.5 text-[11px] font-extrabold uppercase tracking-wider text-[#718096]">Payment ID</th>
                  <th className="px-6 py-3.5 text-[11px] font-extrabold uppercase tracking-wider text-[#718096]">Customer / Person</th>
                  <th className="px-6 py-3.5 text-[11px] font-extrabold uppercase tracking-wider text-[#718096]">Amount</th>
                  <th className="px-6 py-3.5 text-[11px] font-extrabold uppercase tracking-wider text-[#718096]">Status</th>
                  <th className="px-6 py-3.5 text-[11px] font-extrabold uppercase tracking-wider text-[#718096]">Method</th>
                  <th className="px-6 py-3.5 text-[11px] font-extrabold uppercase tracking-wider text-[#718096]">Created At</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxns.map((txn) => {
                  const status = STATUS_CFG[txn.status] || STATUS_CFG.captured
                  const StatusIcon = status.icon
                  const method = METHOD_CFG[txn.method] || METHOD_CFG.upi
                  const MethodIcon = method.icon

                  const amt = Number(txn.amount || 0)
                  let prioBadge = { label: 'LOW', icon: '🟢', bg: '#D1FAE5', text: '#059669' }
                  if (amt >= 500000) prioBadge = { label: 'CRITICAL', icon: '🚨', bg: '#FEE2E2', text: '#991B1B' }
                  else if (amt >= 50000) prioBadge = { label: 'HIGH', icon: '🔴', bg: '#FFEDD5', text: '#C2410C' }
                  else if (amt >= 1000) prioBadge = { label: 'MEDIUM', icon: '🟡', bg: '#FEF3C7', text: '#D97706' }

                  return (
                    <tr 
                      key={txn.id} 
                      onClick={() => setSelectedTxn(txn)}
                      className="border-b border-[#E8EEF5] hover:bg-[#E6F0FF]/30 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-1 w-fit" style={{ background: prioBadge.bg, color: prioBadge.text }}>
                          <span>{prioBadge.icon}</span> {prioBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-[13px] text-[#0065FF]">{txn.id}</span>
                      </td>
                      <td className="px-6 py-4 text-[13px] font-bold text-[#0B192C]">{txn.cust}</td>
                      <td className="px-6 py-4 font-extrabold text-[#0B192C]">
                        ₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-semibold" style={{ background: status.bg, color: status.color }}>
                          <StatusIcon size={13} />
                          <span className="capitalize">{txn.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-[#4A5568]">
                          <div className="w-6 h-6 rounded flex items-center justify-center bg-[#EFF3F8] border border-[#DCE3ED]">
                            <MethodIcon size={13} />
                          </div>
                          <span className="text-[13px] font-medium">{method.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[12px] text-[#718096]">{txn.date}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#DCE3ED] flex items-center justify-between text-[13px] text-[#718096]">
          <span className="font-semibold">Showing {filteredTxns.length} of {INITIAL_TXNS.length} entries</span>
        </div>
      </div>

      {selectedTxn && (
        <TransactionModal match={{ ...selectedTxn, confidence: 1.0, reason: 'Official payment record verified' }} onClose={() => setSelectedTxn(null)} />
      )}
    </div>
  )
}
