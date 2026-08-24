import { Download, Printer, CheckCircle, XCircle } from 'lucide-react'

export default function MatchDashboard({ report }) {
  if (!report) return null

  const matchRate = report.match_rate * 100
  const isHealthy = matchRate >= 90

  const stats = [
    { label: 'Gateway Total', val: `₹${(report.total_gateway_amount || 0).toLocaleString('en-IN')}`, color: 'var(--rz-text-primary)', bg: 'var(--rz-bg-page)' },
    { label: 'Bank Total', val: `₹${(report.total_bank_amount || 0).toLocaleString('en-IN')}`, color: 'var(--rz-text-primary)', bg: 'var(--rz-bg-page)' },
    { label: 'Exact Matches', val: report.exact_matches || 0, color: 'var(--rz-green)', bg: 'var(--rz-green-light)' },
    { label: 'Exceptions', val: report.unmatched_gateway || 0, color: 'var(--rz-red)', bg: 'var(--rz-red-light)' },
  ]

  return (
    <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm" style={{ borderColor: 'var(--rz-border)' }}>
      <div className="flex items-center justify-between border-b pb-4 mb-5" style={{ borderColor: 'var(--rz-border)' }}>
        <div>
          <h2 className="text-[16px] font-extrabold" style={{ color: 'var(--rz-text-primary)' }}>Reconciliation Summary</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{
                background: isHealthy ? 'var(--rz-green-light)' : 'var(--rz-red-light)',
                color: isHealthy ? 'var(--rz-green)' : 'var(--rz-red)'
              }}
            >
              {isHealthy ? <CheckCircle size={12}/> : <XCircle size={12}/>}
              {isHealthy ? 'Healthy State' : 'Needs Attention'}
            </span>
            <span className="text-[11px]" style={{ color: 'var(--rz-text-muted)' }}>Generated just now</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-[12px]">
            <Printer size={13} /> Print
          </button>
          <button className="btn-primary text-[12px]">
            <Download size={13} /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="rounded-lg border p-4" style={{ borderColor: 'var(--rz-border)', background: s.bg }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--rz-text-muted)' }}>{s.label}</p>
            <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.val}</p>
          </div>
        ))}
      </div>
      
      {/* Progress */}
      <div className="mt-6 flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500" 
            style={{ 
              width: `${matchRate}%`,
              background: isHealthy ? 'var(--rz-green)' : 'var(--rz-red)'
            }} 
          />
        </div>
        <span className="text-[12px] font-extrabold" style={{ color: isHealthy ? 'var(--rz-green)' : 'var(--rz-red)' }}>
          {matchRate.toFixed(1)}% Matched
        </span>
      </div>
    </div>
  )
}
