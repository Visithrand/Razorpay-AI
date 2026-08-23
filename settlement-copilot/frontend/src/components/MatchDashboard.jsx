import { Download, Share2, Printer, CheckCircle, XCircle } from 'lucide-react'

export default function MatchDashboard({ report }) {
  if (!report) return null

  const matchRate = report.match_rate * 100
  const isHealthy = matchRate >= 90

  const stats = [
    { label: 'Gateway Total', val: `₹${(report.total_gateway_amount || 0).toLocaleString('en-IN')}`, color: 'text-white', bg: 'bg-white/5' },
    { label: 'Bank Total', val: `₹${(report.total_bank_amount || 0).toLocaleString('en-IN')}`, color: 'text-white', bg: 'bg-white/5' },
    { label: 'Exact Matches', val: report.exact_matches || 0, color: 'text-[#00e676]', bg: 'bg-[#00e676]/10', border: 'border-[#00e676]/30', shadow: 'shadow-[inset_0_0_15px_rgba(0,230,118,0.1)]' },
    { label: 'Exceptions', val: report.unmatched_gateway || 0, color: 'text-[#ff4757]', bg: 'bg-[#ff4757]/10', border: 'border-[#ff4757]/30', shadow: 'shadow-[inset_0_0_15px_rgba(255,71,87,0.15)]' },
  ]

  return (
    <div className="glass-panel p-6 mb-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#2b6aff]/10 blur-3xl rounded-full pointer-events-none group-hover:bg-[#2b6aff]/20 transition-colors duration-700" />
      
      <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6 relative z-10">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Reconciliation Summary</h2>
          <div className="flex items-center gap-3 mt-1.5">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
              isHealthy ? 'bg-[#00e676]/20 text-[#00e676] border border-[#00e676]/30' : 'bg-[#ff4757]/20 text-[#ff4757] border border-[#ff4757]/30'
            }`}>
              {isHealthy ? <CheckCircle size={12}/> : <XCircle size={12}/>}
              {isHealthy ? 'Healthy State' : 'Needs Attention'}
            </span>
            <span className="text-xs text-[#94a3b8] font-medium">Generated just now</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="btn-secondary px-3 py-1.5 text-xs">
            <Printer size={14} /> Print
          </button>
          <button className="btn-primary px-3 py-1.5 text-xs">
            <Download size={14} /> Download PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 relative z-10">
        {stats.map((s, i) => (
          <div key={i} className={`rounded-xl border ${s.border || 'border-white/10'} p-5 ${s.bg} ${s.shadow || ''} backdrop-blur-sm transition-transform hover:-translate-y-1 duration-300`}>
            <p className="text-xs font-semibold text-[#94a3b8] mb-1.5 tracking-wide uppercase">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>
      
      {/* Match Rate Progress Bar */}
      <div className="mt-8 flex items-center gap-4 relative z-10">
        <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10 p-[1px]">
          <div 
            className={`h-full rounded-full transition-all duration-1000 relative overflow-hidden ${isHealthy ? 'bg-gradient-to-r from-[#00b85c] to-[#00e676]' : 'bg-gradient-to-r from-[#ff4757] to-[#ff6b81]'}`} 
            style={{ width: `${matchRate}%` }}
          >
            <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-[shimmer_2s_infinite]" />
          </div>
        </div>
        <span className={`text-sm font-bold ${isHealthy ? 'text-[#00e676]' : 'text-[#ff4757]'}`}>
          {matchRate.toFixed(1)}% Matched
        </span>
      </div>
    </div>
  )
}
