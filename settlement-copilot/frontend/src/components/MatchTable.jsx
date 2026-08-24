import { useState, useMemo } from 'react'
import { Eye, Info, CheckCircle2, Zap, Layers, Search, Filter, RotateCcw, ArrowUpDown } from 'lucide-react'

const CONF_COLOR = (conf) => {
  if (conf >= 0.90) return { text: '#10B981', bg: '#D1FAE5', bar: '#10B981' }
  if (conf >= 0.75) return { text: '#0065FF', bg: '#E6F0FF', bar: '#0065FF' }
  if (conf >= 0.60) return { text: '#F59E0B', bg: '#FEF3C7', bar: '#F59E0B' }
  return { text: '#EF4444', bg: '#FEE2E2', bar: '#EF4444' }
}

const TYPE_BADGE = {
  exact: { bg: '#D1FAE5', text: '#10B981', icon: CheckCircle2 },
  fuzzy: { bg: '#E6F0FF', text: '#0065FF', icon: Zap },
  batch: { bg: '#F0EEFF', text: '#7C3AED', icon: Layers },
}

export default function MatchTable({ matches = [], onRowClick }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [matchTypeFilter, setMatchTypeFilter] = useState('all')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      // Text Search: Txn ID, UTR, Reason, Customer
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().strip ? searchTerm.toLowerCase().strip() : searchTerm.toLowerCase()
        const txnId = String(m.gateway_txn_ref || '').toLowerCase()
        const utr = String(m.gateway_utr || '').toLowerCase()
        const reason = String(m.reason || '').toLowerCase()
        const bankUtr = String(m.bank_utr || '').toLowerCase()
        const matchesQuery = txnId.includes(query) || utr.includes(query) || reason.includes(query) || bankUtr.includes(query)
        if (!matchesQuery) return false
      }

      // Match Type Filter
      if (matchTypeFilter !== 'all' && m.match_type !== matchTypeFilter) {
        return false
      }

      // Amount Filter
      const amt = Number(m.gateway_amount || m.bank_amount || 0)
      if (minAmount && amt < Number(minAmount)) return false
      if (maxAmount && amt > Number(maxAmount)) return false

      // Priority Filter
      if (priorityFilter !== 'all') {
        let prio = 'LOW'
        if (amt >= 500000) prio = 'CRITICAL'
        elif_high: if (amt >= 50000) prio = 'HIGH'
        else if (amt >= 1000) prio = 'MEDIUM'

        if (priorityFilter.toUpperCase() !== prio) return false
      }

      return true
    })
  }, [matches, searchTerm, matchTypeFilter, minAmount, maxAmount, priorityFilter])

  const clearFilters = () => {
    setSearchTerm('')
    setMatchTypeFilter('all')
    setMinAmount('')
    setMaxAmount('')
    setPriorityFilter('all')
  }

  const hasActiveFilters = searchTerm || matchTypeFilter !== 'all' || minAmount || maxAmount || priorityFilter !== 'all'

  return (
    <div className="flex flex-col h-full">
      {/* 🔍 Rich Search & Filter Toolbar */}
      <div className="p-4 bg-gray-50 border-b border-[#DCE3ED] space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Txn ID, UTR number, Customer reference, or Reason..."
              className="w-full bg-white border border-[#DCE3ED] rounded-lg pl-9 pr-3 py-2 text-xs text-[#0B192C] outline-none focus:border-[#0065FF] font-medium shadow-2xs"
            />
          </div>

          {/* Match Type Dropdown Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={matchTypeFilter}
              onChange={(e) => setMatchTypeFilter(e.target.value)}
              className="bg-white border border-[#DCE3ED] rounded-lg px-3 py-2 text-xs font-extrabold text-[#0B192C] outline-none focus:border-[#0065FF] shadow-2xs"
            >
              <option value="all">All Match Types</option>
              <option value="exact">Exact Match</option>
              <option value="fuzzy">Fuzzy Match</option>
              <option value="batch">Batch Unbundled</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-white border border-[#DCE3ED] rounded-lg px-3 py-2 text-xs font-extrabold text-[#0B192C] outline-none focus:border-[#0065FF] shadow-2xs"
            >
              <option value="all">All Priorities</option>
              <option value="CRITICAL">🚨 CRITICAL (&gt; ₹5L)</option>
              <option value="HIGH">🔴 HIGH (&gt; ₹50K)</option>
              <option value="MEDIUM">🟡 MEDIUM (&gt; ₹1K)</option>
              <option value="LOW">🟢 LOW (≤ ₹1K)</option>
            </select>
          </div>
        </div>

        {/* Amount Range & Results Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-extrabold uppercase text-[10px] tracking-wider">Amount Range:</span>
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

          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs font-bold text-gray-500">
              Showing <strong className="text-[#0065FF]">{filteredMatches.length}</strong> of {matches.length} matches
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-extrabold text-[#EF4444] hover:underline flex items-center gap-1 bg-red-50 px-2.5 py-1 rounded border border-red-200"
              >
                <RotateCcw size={12} /> Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto custom-scrollbar flex-1">
        {filteredMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-gray-400">
              <Info size={24} />
            </div>
            <h3 className="text-sm font-extrabold text-[#0B192C]">No matching records found</h3>
            <p className="text-xs text-gray-500 mt-0.5">Try clearing filters or adjusting your search keywords.</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn-secondary text-xs mt-3">
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-[#DCE3ED] bg-[#EFF3F8]/40 text-gray-500 font-extrabold uppercase text-[11px]">
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Transaction ID</th>
                <th className="px-4 py-3">Gateway UTR</th>
                <th className="px-4 py-3">Match Type</th>
                <th className="px-4 py-3">Gateway Amt</th>
                <th className="px-4 py-3">Bank Amt</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMatches.map((m) => {
                const colors = CONF_COLOR(m.confidence || 0)
                const confPct = ((m.confidence || 0) * 100).toFixed(0)
                const badge = TYPE_BADGE[m.match_type] || { bg: '#EFF3F8', text: '#718096', icon: Info }
                const BadgeIcon = badge.icon
                const hasUtr = m.gateway_utr && m.gateway_utr !== 'nan' && m.gateway_utr.trim() !== ''

                const amt = Number(m.gateway_amount || m.bank_amount || 0)
                let prioBadge = { label: 'LOW', icon: '🟢', bg: '#D1FAE5', text: '#059669' }
                if (amt >= 500000) prioBadge = { label: 'CRITICAL', icon: '🚨', bg: '#FEE2E2', text: '#991B1B' }
                else if (amt >= 50000) prioBadge = { label: 'HIGH', icon: '🔴', bg: '#FFEDD5', text: '#C2410C' }
                else if (amt >= 1000) prioBadge = { label: 'MEDIUM', icon: '🟡', bg: '#FEF3C7', text: '#D97706' }

                return (
                  <tr
                    key={m.id}
                    onClick={() => onRowClick(m)}
                    className="border-b border-[#E8EEF5] cursor-pointer hover:bg-[#E6F0FF]/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-1 w-fit" style={{ background: prioBadge.bg, color: prioBadge.text }}>
                        <span>{prioBadge.icon}</span> {prioBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-[#0065FF]">
                      {(m.gateway_txn_ref || '—').slice(0, 16)}
                    </td>
                    <td className="px-4 py-3">
                      {hasUtr ? (
                        <span className="font-mono text-gray-700 font-semibold">
                          {m.gateway_utr.slice(0, 18)}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-400 font-mono">
                          N/A
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold" style={{ background: badge.bg, color: badge.text }}>
                        <BadgeIcon size={12} />
                        {m.match_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-extrabold text-[#0B192C]">
                      ₹{Number(m.gateway_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 font-extrabold text-gray-600">
                      ₹{Number(m.bank_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-medium">
                      {m.gateway_date ? new Date(m.gateway_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-extrabold w-8" style={{ color: colors.text }}>{confPct}%</span>
                        <div className="w-14 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${confPct}%`, background: colors.bar }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-1 rounded hover:bg-gray-100 text-[#0065FF]">
                        <Eye size={16} />
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
  )
}
