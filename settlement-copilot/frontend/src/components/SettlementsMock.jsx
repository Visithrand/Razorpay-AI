import { Download, Filter, TrendingUp, AlertCircle, CheckCircle2, IndianRupee } from 'lucide-react'

const MOCK_SETTLEMENTS = [
  { id: 'setl_OkL8Nj23nJ1x', utr: 'SBIN0001234567', amount: 1245000.50, status: 'processed', date: 'Jan 24, 2024', fees: 2450.00, count: 1450 },
  { id: 'setl_OjK2Mn99xK4p', utr: 'HDFC0009876543', amount: 845000.00,  status: 'processed', date: 'Jan 23, 2024', fees: 1845.50, count: 980 },
  { id: 'setl_Oi9HbC88vM2a', utr: '—',              amount: 154000.00,  status: 'pending',   date: 'Jan 23, 2024', fees: 450.00,  count: 210 },
  { id: 'setl_Oh8VnX77zL1w', utr: 'ICIC0005554443', amount: 2145000.75, status: 'processed', date: 'Jan 22, 2024', fees: 4210.25, count: 2450 },
  { id: 'setl_Og7ZmA66bY9q', utr: 'UTIB0001112223', amount: 45000.00,   status: 'failed',    date: 'Jan 21, 2024', fees: 120.00,  count: 45 },
]

export default function SettlementsMock() {
  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1f36]">Settlements</h1>
          <p className="text-sm text-[#697386] mt-1">View the funds transferred to your bank account.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-[#e3e8ef] text-[#1a1f36] rounded-lg text-sm font-semibold shadow-sm hover:bg-[#f5f7fa] transition-colors flex items-center gap-2">
            <Filter size={16} /> Filter
          </button>
          <button className="px-4 py-2 bg-[#3d8ef8] hover:bg-[#2b6cdb] text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-[#e3e8ef] p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#697386] mb-2">
            <div className="w-8 h-8 rounded-full bg-[#e8f7f1] text-[#2eb88a] flex items-center justify-center"><CheckCircle2 size={16} /></div>
            Next Settlement
          </div>
          <p className="text-3xl font-bold text-[#1a1f36]">₹154,000.00</p>
          <p className="text-xs text-[#a3acb9] mt-1">Expected today by 6:00 PM</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e3e8ef] p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#697386] mb-2">
            <div className="w-8 h-8 rounded-full bg-[#f3f0ff] text-[#7c3aed] flex items-center justify-center"><TrendingUp size={16} /></div>
            Total Settled (Jan)
          </div>
          <p className="text-3xl font-bold text-[#1a1f36]">₹4.2M</p>
          <p className="text-xs text-[#a3acb9] mt-1">Across 12 batches</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e3e8ef] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e3e8ef] bg-[#fafbfc]">
          <h3 className="text-sm font-semibold text-[#1a1f36]">Recent Settlements</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-[#e3e8ef] bg-[#f5f7fa]">
                {['Settlement ID', 'Bank UTR', 'Amount', 'Fees & Taxes', 'Txn Count', 'Date', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-[#697386] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_SETTLEMENTS.map((s, i) => (
                <tr key={s.id} className={`border-b border-[#f0f3f8] hover:bg-[#f8f9ff] transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'}`}>
                  <td className="px-5 py-4 font-mono font-medium text-[#3d8ef8]">{s.id}</td>
                  <td className="px-5 py-4">
                    {s.utr === '—' ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#f5f7fa] text-[#a3acb9] border border-[#e3e8ef]">N/A</span>
                    ) : (
                      <span className="font-mono text-[#697386]">{s.utr}</span>
                    )}
                  </td>
                  <td className="px-5 py-4 font-bold text-[#1a1f36] flex items-center gap-1">
                    <IndianRupee size={14} className="text-[#a3acb9]" />
                    {s.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-4 text-[#e04d4d] font-medium text-xs">
                    -₹{s.fees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-4 text-[#697386]">{s.count}</td>
                  <td className="px-5 py-4 text-[#697386] text-xs">{s.date}</td>
                  <td className="px-5 py-4">
                    {s.status === 'processed' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#e8f7f1] text-[#2eb88a]"><CheckCircle2 size={12}/> Processed</span>}
                    {s.status === 'pending' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fef7e6] text-[#e9a820]"><TrendingUp size={12}/> Pending</span>}
                    {s.status === 'failed' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fdf0f0] text-[#e04d4d]"><AlertCircle size={12}/> Failed</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
