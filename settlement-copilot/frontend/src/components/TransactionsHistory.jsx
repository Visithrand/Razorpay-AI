import { Filter, Download, CreditCard, Smartphone, CheckCircle2, XCircle, Clock } from 'lucide-react'

const MOCK_TXNS = [
  { id: 'pay_Nj8Qtty5Y2Jr8',  amount: 2450.00, method: 'upi',  status: 'captured', date: 'Jan 24, 2:45 PM', cust: 'raj.kumar@example.com' },
  { id: 'pay_Nj3Xgf9Q5rDoQ',  amount: 12999.0, method: 'card', status: 'refunded', date: 'Jan 24, 1:12 PM', cust: 'sneha.patel@gmail.com' },
  { id: 'pay_Nj1LryE89FxX9',  amount: 450.50,  method: 'upi',  status: 'failed',   date: 'Jan 24, 11:30 AM', cust: 'amit.singh@yahoo.com' },
  { id: 'pay_Ni9HfqcooTnj2',  amount: 8900.00, method: 'netbanking', status: 'captured', date: 'Jan 23, 4:20 PM', cust: 'corporate@techsolutions.in' },
  { id: 'pay_Ni7SrcbplJd84',  amount: 150.00,  method: 'upi',  status: 'captured', date: 'Jan 23, 2:15 PM', cust: 'priya.sharma@example.com' },
  { id: 'pay_Ni4P0tvhhpBmy',  amount: 6799.00, method: 'card', status: 'captured', date: 'Jan 23, 9:05 AM', cust: 'vikram.reddy@gmail.com' },
  { id: 'pay_Nh8M291azHzkn',  amount: 120.00,  method: 'upi',  status: 'captured', date: 'Jan 22, 6:30 PM', cust: 'neha.gupta@example.com' },
  { id: 'pay_Nh5Wvfgyw6Zbn',  amount: 5400.00, method: 'card', status: 'captured', date: 'Jan 22, 3:10 PM', cust: 'rohit.verma@yahoo.com' },
]

const STATUS_CFG = {
  captured: { icon: CheckCircle2, color: 'text-[#2eb88a]', bg: 'bg-[#e8f7f1]' },
  refunded: { icon: Clock,        color: 'text-[#e9a820]', bg: 'bg-[#fef7e6]' },
  failed:   { icon: XCircle,      color: 'text-[#e04d4d]', bg: 'bg-[#fdf0f0]' },
}

const METHOD_CFG = {
  upi:        { icon: Smartphone, label: 'UPI' },
  card:       { icon: CreditCard, label: 'Card' },
  netbanking: { icon: Clock,      label: 'Netbanking' },
}

export default function TransactionsHistory() {
  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1f36]">Transactions</h1>
          <p className="text-sm text-[#697386] mt-1">View and manage your recent payments.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-[#e3e8ef] text-[#1a1f36] rounded-lg text-sm font-semibold shadow-sm hover:bg-[#f5f7fa] transition-colors flex items-center gap-2">
            <Filter size={16} className="text-[#697386]" /> Filter
          </button>
          <button className="px-4 py-2 bg-white border border-[#e3e8ef] text-[#1a1f36] rounded-lg text-sm font-semibold shadow-sm hover:bg-[#f5f7fa] transition-colors flex items-center gap-2">
            <Download size={16} className="text-[#697386]" /> Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e3e8ef] shadow-sm overflow-hidden flex flex-col">
        {/* Table header bar */}
        <div className="px-5 py-3 border-b border-[#e3e8ef] bg-[#fafbfc] flex items-center gap-4 text-sm text-[#697386]">
          <button className="font-semibold text-[#3d8ef8] border-b-2 border-[#3d8ef8] pb-3 -mb-3">All</button>
          <button className="hover:text-[#1a1f36] pb-3 -mb-3">Captured</button>
          <button className="hover:text-[#1a1f36] pb-3 -mb-3">Failed</button>
          <button className="hover:text-[#1a1f36] pb-3 -mb-3">Refunded</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-[#e3e8ef] bg-[#f5f7fa]">
                {['Payment ID', 'Amount', 'Status', 'Method', 'Customer', 'Created At'].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-[#697386] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_TXNS.map((txn, i) => {
                const status = STATUS_CFG[txn.status]
                const StatusIcon = status.icon
                const method = METHOD_CFG[txn.method]
                const MethodIcon = method.icon

                return (
                  <tr key={txn.id} className={`border-b border-[#f0f3f8] hover:bg-[#f8f9ff] cursor-pointer transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'}`}>
                    <td className="px-5 py-4">
                      <span className="font-mono font-medium text-[#3d8ef8]">{txn.id}</span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#1a1f36]">
                      ₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
                        <StatusIcon size={12} />
                        <span className="capitalize">{txn.status}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-[#697386]">
                        <div className="w-6 h-6 rounded bg-[#f5f7fa] border border-[#e3e8ef] flex items-center justify-center">
                          <MethodIcon size={12} />
                        </div>
                        <span>{method.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[#697386] truncate max-w-[200px]">
                      {txn.cust}
                    </td>
                    <td className="px-5 py-4 text-[#a3acb9] text-xs">
                      {txn.date}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination mock */}
        <div className="px-5 py-4 border-t border-[#e3e8ef] flex items-center justify-between text-sm text-[#697386]">
          <span>Showing 1 to 8 of 1,248 entries</span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 rounded border border-[#e3e8ef] hover:bg-[#f5f7fa]">Previous</button>
            <button className="px-3 py-1 rounded bg-[#3d8ef8] text-white">1</button>
            <button className="px-3 py-1 rounded border border-[#e3e8ef] hover:bg-[#f5f7fa]">2</button>
            <button className="px-3 py-1 rounded border border-[#e3e8ef] hover:bg-[#f5f7fa]">3</button>
            <button className="px-3 py-1 rounded border border-[#e3e8ef] hover:bg-[#f5f7fa]">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}
