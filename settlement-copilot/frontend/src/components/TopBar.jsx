import { Bell, Search } from 'lucide-react'

export default function TopBar({ activePage, runId, report }) {
  const matchRate = report ? (report.match_rate * 100).toFixed(1) : null

  const pageTitles = {
    'home': 'Dashboard',
    'transactions': 'Transactions',
    'reconciliation': 'Reconciliation',
    'settlements': 'Settlements',
    'customers': 'Customers',
    'reports': 'Reports',
    'settings': 'Settings',
  }

  return (
    <header className="h-16 bg-[#02042b]/60 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0 z-10 sticky top-0 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      {/* Left: breadcrumb & Search */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[#64748b]">Razorpay</span>
          <span className="text-[#334155]">/</span>
          <span className="text-white font-bold">{pageTitles[activePage] || 'Dashboard'}</span>
        </div>
        
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/10 rounded-lg focus-within:border-[#2b6aff] focus-within:bg-white/[0.05] focus-within:ring-1 focus-within:ring-[#2b6aff]/50 transition-all w-96 shadow-inner">
          <Search size={14} className="text-[#64748b]" />
          <input 
            type="text" 
            placeholder="Search payments, refunds, or settings..." 
            className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-[#64748b]"
          />
          <div className="flex items-center gap-1 text-[10px] text-[#94a3b8] font-bold bg-white/5 border border-white/10 px-1.5 py-0.5 rounded shadow-sm">
            <span>⌘</span><span>K</span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-5">
        {matchRate && activePage === 'reconciliation' && (
          <div className="flex items-center gap-2 px-4 py-1.5 bg-[#00e676]/10 text-[#00e676] rounded-full text-xs font-bold border border-[#00e676]/20 shadow-[0_0_15px_rgba(0,230,118,0.2)]">
            <div className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
            Match Rate: {matchRate}%
          </div>
        )}
        <button className="relative p-2.5 text-[#94a3b8] hover:text-white hover:bg-white/10 rounded-full transition-all duration-300">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#2b6aff] border border-[#02042b] rounded-full shadow-[0_0_8px_rgba(43,106,255,0.8)]" />
        </button>
      </div>
    </header>
  )
}
