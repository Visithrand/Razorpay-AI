import { useState, useMemo, useEffect } from 'react'
import { Download, Filter, TrendingUp, AlertCircle, CheckCircle2, IndianRupee, Search, X } from 'lucide-react'
import { exportToCSV, getSettlements } from '../api'

export default function SettlementsMock() {
  const [settlements, setSettlements] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSetl, setSelectedSetl] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const data = await getSettlements()
      if (data && data.settlements) {
        setSettlements(data.settlements)
      }
    } catch (err) {
      console.error("Failed to fetch settlements", err)
    }
  }

  const filteredSetls = useMemo(() => {
    return settlements.filter(s => {
      if (activeTab !== 'all' && s.status !== activeTab) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchId = s.id.toLowerCase().includes(q)
        const matchUtr = s.utr.toLowerCase().includes(q)
        if (!matchId && !matchUtr) return false
      }
      return true
    })
  }, [activeTab, searchQuery])

  const handleExport = () => {
    exportToCSV('Razorpay_Settlements_Export', filteredSetls)
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B192C]">Settlements</h1>
          <p className="text-base text-[#4A5568] mt-0.5">View the funds transferred to your bank account.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="btn-primary">
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-[#DCE3ED] p-6 shadow-sm">
          <div className="flex items-center gap-2.5 text-base font-semibold text-[#4A5568] mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#D1FAE5] text-[#10B981]">
              <CheckCircle2 size={18} />
            </div>
            Next Settlement
          </div>
          <p className="text-3xl font-bold text-[#0B192C]">₹154,000.00</p>
          <p className="text-sm text-[#718096] mt-1">Expected today by 6:00 PM</p>
        </div>
        <div className="bg-white rounded-xl border border-[#DCE3ED] p-6 shadow-sm">
          <div className="flex items-center gap-2.5 text-base font-semibold text-[#4A5568] mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#EDE9FE] text-[#8B5CF6]">
              <TrendingUp size={18} />
            </div>
            Total Settled (Jan)
          </div>
          <p className="text-3xl font-bold text-[#0B192C]">₹4.2M</p>
          <p className="text-sm text-[#718096] mt-1">Across 12 batches</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#DCE3ED] overflow-hidden shadow-sm">
        {/* Header Tabs + Search */}
        <div className="px-6 py-3 border-b border-[#DCE3ED] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#EFF3F8]/30">
          <div className="flex items-center gap-6 text-base font-semibold text-[#4A5568]">
            {[
              { id: 'all', label: `All (${settlements.length})` },
              { id: 'processed', label: `Processed (${settlements.filter(s => s.status === 'processed').length})` },
              { id: 'pending', label: `Pending (${settlements.filter(s => s.status === 'pending').length})` },
              { id: 'failed', label: `Failed (${settlements.filter(s => s.status === 'failed').length})` },
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

          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#DCE3ED] rounded-lg w-64 focus-within:ring-1 focus-within:ring-[#0065FF]">
            <Search size={14} className="text-[#718096]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search ID, Bank UTR..."
              className="bg-transparent border-none outline-none text-[15px] w-full text-[#0B192C]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filteredSetls.length === 0 ? (
            <div className="p-12 text-center text-[#718096]">
              <p className="text-[15px] font-bold">No settlements match your filter</p>
            </div>
          ) : (
            <table className="w-full text-base text-left">
              <thead>
                <tr className="border-b border-[#DCE3ED] bg-[#EFF3F8]/60">
                  {['Settlement ID', 'Bank UTR', 'Amount', 'Fees & Taxes', 'Txn Count', 'Date', 'Status'].map(h => (
                    <th key={h} className="px-6 py-3.5 text-[13px] font-bold uppercase tracking-wider text-[#718096]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSetls.map((s) => (
                  <tr 
                    key={s.id} 
                    onClick={() => setSelectedSetl(s)}
                    className="border-b border-[#E8EEF5] hover:bg-[#E6F0FF]/30 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-mono font-medium text-[15px] text-[#0065FF]">{s.id}</td>
                    <td className="px-6 py-4">
                      {s.utr === '—' ? (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border font-mono bg-[#EFF3F8] text-[#718096] border-[#DCE3ED]">N/A</span>
                      ) : (
                        <span className="font-mono text-[15px] font-normal text-[#4A5568]">{s.utr}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#0B192C] flex items-center gap-1">
                      <IndianRupee size={14} className="text-[#718096]" />
                      {s.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-[15px] font-semibold text-[#EF4444]">
                      -₹{s.fees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-[15px] text-[#4A5568]">{s.count}</td>
                    <td className="px-6 py-4 text-sm text-[#718096]">{s.date}</td>
                    <td className="px-6 py-4">
                      {s.status === 'processed' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-semibold bg-[#D1FAE5] text-[#10B981]"><CheckCircle2 size={13}/> Processed</span>}
                      {s.status === 'pending' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-semibold bg-[#FEF3C7] text-[#F59E0B]"><TrendingUp size={13}/> Pending</span>}
                      {s.status === 'failed' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-semibold bg-[#FEE2E2] text-[#EF4444]"><AlertCircle size={13}/> Failed</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal detail */}
      {selectedSetl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-overlay-fadein">
          <div className="bg-white border border-[#DCE3ED] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-overlay-slideup">
            <div className="px-6 py-4 border-b border-[#DCE3ED] flex items-center justify-between bg-[#05103E] text-white">
              <h3 className="font-bold text-[16px]">Settlement Details</h3>
              <button onClick={() => setSelectedSetl(null)} className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4 text-base">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 font-semibold">Settlement ID</span>
                <span className="font-mono font-bold text-[#0065FF]">{selectedSetl.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 font-semibold">Bank UTR</span>
                <span className="font-mono font-medium">{selectedSetl.utr}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 font-semibold">Net Amount</span>
                <span className="font-bold text-[#10B981] text-lg">₹{selectedSetl.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 font-semibold">Fees & Taxes</span>
                <span className="font-semibold text-[#EF4444]">-₹{selectedSetl.fees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 font-semibold">Destination Bank</span>
                <span className="font-semibold">{selectedSetl.bank}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500 font-semibold">Transaction Count</span>
                <span className="font-semibold">{selectedSetl.count} transactions</span>
              </div>
              {selectedSetl.type === 'exception' && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-semibold">Exception Details</span>
                  <span className="font-semibold text-right max-w-[250px]">{selectedSetl.description}</span>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-[#DCE3ED] bg-gray-50 flex justify-end">
              <button onClick={() => setSelectedSetl(null)} className="btn-primary">Close Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
