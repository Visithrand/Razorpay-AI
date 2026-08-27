import { useState, useEffect, useMemo } from 'react'
import { AlertCircle, AlertTriangle, ArrowRight, Zap, RefreshCw, Search, Filter, RotateCcw } from 'lucide-react'
import InvestigationView from './InvestigationView'

const CATEGORY_STYLES = {
  MISSING_BANK_RECORD: { bg: '#FEE2E2', text: '#DC2626', label: 'MISSING BANK RECORD' },
  AMOUNT_MISMATCH: { bg: '#FEE2E2', text: '#EF4444', label: 'AMOUNT MISMATCH' },
  DUPLICATE: { bg: '#FCE7F3', text: '#DB2777', label: 'DUPLICATE' },
  SETTLEMENT_DELAY: { bg: '#E0F2FE', text: '#0284C7', label: 'SETTLEMENT DELAY' },
  FEE_DEDUCTION: { bg: '#FEF3C7', text: '#D97706', label: 'FEE DEDUCTION' },
  REFERENCE_MISMATCH: { bg: '#EDE9FE', text: '#7C3AED', label: 'REFERENCE MISMATCH' },
  AMBIGUOUS_MATCH: { bg: '#FEF3C7', text: '#B45309', label: 'AMBIGUOUS MATCH' },
}

const PRIORITY_STYLES = {
  CRITICAL: { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444', icon: '🚨' },
  HIGH: { bg: '#FFEDD5', text: '#C2410C', border: '#F97316', icon: '🔴' },
  MEDIUM: { bg: '#FEF3C7', text: '#D97706', border: '#F59E0B', icon: '🟡' },
  LOW: { bg: '#D1FAE5', text: '#059669', border: '#10B981', icon: '🟢' },
}

export default function ExceptionTable({ exceptions = [], loading = false }) {
  const [selectedInvestigateId, setSelectedInvestigateId] = useState(null)
  const [liveData, setLiveData] = useState([])
  const [isFetching, setIsFetching] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')

  // Fetch live exceptions from backend API if props are empty
  useEffect(() => {
    if (exceptions.length > 0) {
      setLiveData(exceptions)
    } else {
      fetchLiveExceptions()
    }
  }, [exceptions])

  const fetchLiveExceptions = async () => {
    setIsFetching(true)
    try {
      const res = await fetch('/api/exceptions')
      if (res.ok) {
        const data = await res.json()
        setLiveData(data.exceptions || [])
      }
    } catch (e) {
      console.error('Failed to fetch live exceptions', e)
    } finally {
      setIsFetching(false)
    }
  }

  const items = liveData.length > 0 ? liveData : (exceptions.length > 0 ? exceptions : FALLBACK_EXCEPTIONS)

  const filteredItems = useMemo(() => {
    return items.filter((row) => {
      // Text Search: ID, UTR, Description, Source
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().strip ? searchTerm.toLowerCase().strip() : searchTerm.toLowerCase()
        const idStr = `ex-${row.id}`.toLowerCase()
        const utr = String(row.utr || '').toLowerCase()
        const desc = String(row.description || '').toLowerCase()
        const src = String(row.source || '').toLowerCase()
        if (!idStr.includes(q) && !utr.includes(q) && !desc.includes(q) && !src.includes(q)) {
          return false
        }
      }

      // Priority Filter
      if (priorityFilter !== 'all' && (row.priority || 'MEDIUM').toUpperCase() !== priorityFilter.toUpperCase()) {
        return false
      }

      // Category Filter
      if (categoryFilter !== 'all' && (row.category || '').toUpperCase() !== categoryFilter.toUpperCase()) {
        return false
      }

      // Amount Filter
      const amt = Number(row.amount || 0)
      if (minAmount && amt < Number(minAmount)) return false
      if (maxAmount && amt > Number(maxAmount)) return false

      return true
    })
  }, [items, searchTerm, priorityFilter, categoryFilter, minAmount, maxAmount])

  const clearFilters = () => {
    setSearchTerm('')
    setPriorityFilter('all')
    setCategoryFilter('all')
    setMinAmount('')
    setMaxAmount('')
  }

  const hasActiveFilters = searchTerm || priorityFilter !== 'all' || categoryFilter !== 'all' || minAmount || maxAmount

  return (
    <div className="space-y-6">
      {selectedInvestigateId ? (
        <InvestigationView 
          exceptionId={selectedInvestigateId} 
          onClose={() => {
            setSelectedInvestigateId(null)
            fetchLiveExceptions()
          }} 
        />
      ) : (
        <div className="bg-white rounded-xl border border-[#DCE3ED] overflow-hidden shadow-sm flex flex-col">
          {/* Header & Filter Controls */}
          <div className="px-6 py-4 border-b border-[#DCE3ED] bg-[#EFF3F8]/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-[#0B192C] text-base">
                  Unmatched Exceptions ({filteredItems.length} of {items.length})
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">Filter by customer, transaction ID, priority level, or amount to resolve claims.</p>
              </div>

              <button 
                onClick={fetchLiveExceptions}
                className="px-3 py-1.5 bg-white border border-[#DCE3ED] hover:bg-gray-50 text-sm font-bold text-[#0B192C] rounded-lg transition-all flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
              >
                <RefreshCw size={13} className={isFetching ? 'animate-spin text-[#0065FF]' : ''} />
                Refresh Exceptions
              </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-2 border-t border-[#DCE3ED]">
              {/* Search Bar */}
              <div className="relative flex-1 w-full">
                <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by ID, UTR, merchant name, or reason..."
                  className="w-full bg-white border border-[#DCE3ED] rounded-lg pl-9 pr-3 py-1.5 text-sm text-[#0B192C] outline-none focus:border-[#0065FF] font-medium"
                />
              </div>

              {/* Priority & Classification Filters */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-white border border-[#DCE3ED] rounded-lg px-3 py-1.5 text-sm font-extrabold text-[#0B192C] outline-none focus:border-[#0065FF]"
                >
                  <option value="all">All Priorities</option>
                  <option value="CRITICAL">🚨 CRITICAL (&gt; ₹5L)</option>
                  <option value="HIGH">🔴 HIGH (&gt; ₹50K)</option>
                  <option value="MEDIUM">🟡 MEDIUM (&gt; ₹1K)</option>
                  <option value="LOW">🟢 LOW (≤ ₹1K)</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-white border border-[#DCE3ED] rounded-lg px-3 py-1.5 text-sm font-extrabold text-[#0B192C] outline-none focus:border-[#0065FF]"
                >
                  <option value="all">All Classifications</option>
                  <option value="AMOUNT_MISMATCH">AMOUNT MISMATCH</option>
                  <option value="SETTLEMENT_DELAY">SETTLEMENT DELAY</option>
                  <option value="FEE_DEDUCTION">FEE DEDUCTION</option>
                  <option value="MISSING_BANK_RECORD">MISSING BANK RECORD</option>
                  <option value="DUPLICATE">DUPLICATE</option>
                </select>
              </div>
            </div>

            {/* Amount Filters & Clear */}
            <div className="flex items-center justify-between gap-3 text-sm pt-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-bold uppercase text-xs">Amount Range:</span>
                <input
                  type="number"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="Min ₹"
                  className="w-20 bg-white border border-[#DCE3ED] rounded px-2 py-1 text-sm outline-none focus:border-[#0065FF]"
                />
                <span className="text-gray-400 font-bold">–</span>
                <input
                  type="number"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  placeholder="Max ₹"
                  className="w-20 bg-white border border-[#DCE3ED] rounded px-2 py-1 text-sm outline-none focus:border-[#0065FF]"
                />
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm font-extrabold text-[#EF4444] hover:underline flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded border border-red-200"
                >
                  <RotateCcw size={12} /> Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Exceptions Table */}
          <div className="overflow-x-auto">
            {filteredItems.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-sm">
                <p className="font-extrabold text-base text-[#0B192C]">No exception records match your filter criteria</p>
                <button onClick={clearFilters} className="btn-secondary text-sm mt-3">Reset Filters</button>
              </div>
            ) : (
              <table className="w-full text-left text-base">
                <thead>
                  <tr className="border-b border-[#DCE3ED] bg-[#EFF3F8]/60 text-sm font-extrabold uppercase text-gray-500">
                    <th className="px-6 py-3.5">Priority</th>
                    <th className="px-6 py-3.5">ID / Ref</th>
                    <th className="px-6 py-3.5">Source</th>
                    <th className="px-6 py-3.5">Classification Code</th>
                    <th className="px-6 py-3.5">Amount</th>
                    <th className="px-6 py-3.5">Why Unmatched Evidence</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((row) => {
                    const cat = CATEGORY_STYLES[row.category] || CATEGORY_STYLES.AMOUNT_MISMATCH
                    const prio = PRIORITY_STYLES[row.priority || 'MEDIUM'] || PRIORITY_STYLES.MEDIUM
                    return (
                      <tr key={row.id} className="border-b border-[#E8EEF5] hover:bg-[#E6F0FF]/30 transition-colors">
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-0.5 rounded text-[13px] font-extrabold flex items-center gap-1 w-fit border" style={{ background: prio.bg, color: prio.text, borderColor: prio.border }}>
                            <span>{prio.icon}</span> {row.priority || 'MEDIUM'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-[#0065FF] text-sm">EX-{row.id}</td>
                        <td className="px-6 py-4 font-bold text-sm uppercase text-gray-700">{row.source || 'Gateway'}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded text-[13px] font-mono font-extrabold tracking-tight" style={{ background: cat.bg, color: cat.text }}>
                            {cat.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-extrabold text-[#0B192C]">
                          ₹{Number(row.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-sm">
                          {row.description || 'Discrepancy detected across Bank credit & ERP statement'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded text-[13px] font-extrabold uppercase border ${
                            row.status === 'RESOLVED' ? 'bg-[#D1FAE5] text-[#059669] border-[#10B981]' :
                            row.status === 'REJECTED' ? 'bg-[#FEE2E2] text-[#DC2626] border-[#EF4444]' :
                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}>
                            {row.status || 'PENDING'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedInvestigateId(row.id)}
                            className="btn-primary py-1.5 px-3 text-sm bg-[#0065FF] shadow-sm hover:shadow"
                          >
                            <Zap size={13} /> Investigate
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const FALLBACK_EXCEPTIONS = [
  { id: 1, priority: 'CRITICAL', source: 'gateway', category: 'DUPLICATE', amount: 520000.00, description: 'Duplicate transaction record of ₹5.2 Lakhs detected in raw gateway log', utr: 'UTR98124910284' },
  { id: 2, priority: 'HIGH', source: 'gateway', category: 'AMOUNT_MISMATCH', amount: 12450.00, description: '₹50.00 ERP ledger data-entry discrepancy vs Bank credit (₹12,450 vs ₹12,400)', utr: 'UTR98124910284' },
  { id: 3, priority: 'MEDIUM', source: 'bank', category: 'SETTLEMENT_DELAY', amount: 20000.00, description: 'T+2 settlement delay between gateway capture and bank statement credit', utr: 'UTR81940182749' },
  { id: 4, priority: 'LOW', source: 'gateway', category: 'FEE_DEDUCTION', amount: 450.50, description: '₹450.50 MDR processing fee deduction not entered in ledger', utr: 'UTR77301928401' },
]
