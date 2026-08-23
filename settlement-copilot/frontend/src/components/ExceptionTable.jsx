import { useState } from 'react'
import { AlertCircle, Clock, Layers, HelpCircle, Copy, Calculator, PartyPopper } from 'lucide-react'

const CATEGORY_CONFIG = {
  fee_adjusted: { label: 'Fee Adjusted',  color: '#f59e0b', bg: '#f59e0b/10', icon: Calculator },
  timing_drift: { label: 'Timing Drift',  color: '#2b6aff', bg: '#2b6aff/10', icon: Clock },
  batch:        { label: 'Batch Match',   color: '#c084fc', bg: '#c084fc/10', icon: Layers },
  missing:      { label: 'Missing',       color: '#ff4757', bg: '#ff4757/10', icon: HelpCircle },
  duplicate:    { label: 'Duplicate',     color: '#0ea5e9', bg: '#0ea5e9/10', icon: Copy },
  amount_typo:  { label: 'Amount Typo',   color: '#ff6b81', bg: '#ff6b81/10', icon: AlertCircle },
}

export default function ExceptionTable({ exceptions }) {
  const [catFilter, setCatFilter] = useState('all')

  const filtered = (exceptions || []).filter(
    (e) => catFilter === 'all' || e.category === catFilter
  )

  return (
    <div className="flex flex-col h-full glass-panel">
      {/* Filter bar */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 flex-wrap bg-black/20 backdrop-blur-md rounded-t-2xl">
        <button
          onClick={() => setCatFilter('all')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
            catFilter === 'all' 
              ? 'bg-gradient-to-r from-[#2b6aff] to-[#0047ff] text-white shadow-[0_0_15px_rgba(43,106,255,0.4)]' 
              : 'bg-white/5 border border-white/10 text-[#94a3b8] hover:bg-white/10 hover:text-white'
          }`}
        >
          All Exceptions ({exceptions?.length ?? 0})
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
          const count = (exceptions || []).filter((e) => e.category === key).length
          if (count === 0) return null
          const Icon = cfg.icon
          
          const isActive = catFilter === key
          const activeStyle = isActive 
            ? { background: cfg.bg.replace('/10', '/30'), color: cfg.color, borderColor: cfg.color, boxShadow: `0 0 15px ${cfg.color}40` }
            : { background: 'rgba(255,255,255,0.05)', color: '#94a3b8', borderColor: 'rgba(255,255,255,0.1)' }

          return (
            <button
              key={key}
              onClick={() => setCatFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-300 border hover:-translate-y-0.5`}
              style={activeStyle}
            >
              <Icon size={14} className={isActive ? '' : 'text-[#64748b]'} />
              {cfg.label} <span className="opacity-75">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-[#00e676]/10 border border-[#00e676]/30 rounded-full flex items-center justify-center mb-5 text-[#00e676] shadow-[0_0_20px_rgba(0,230,118,0.2)]">
              <PartyPopper size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-wide">No anomalies detected</h3>
            <p className="text-sm text-[#94a3b8]">All records align perfectly based on your current parameters.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left border-collapse">
            <thead className="sticky top-0 bg-black/40 backdrop-blur-xl z-10">
              <tr>
                {['Data Source', 'Exception Type', 'Reference UTR', 'Amount', 'Date', 'System Note'].map(h => (
                  <th key={h} className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-widest border-b border-white/10">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => {
                const cfg = CATEGORY_CONFIG[e.category] || { label: e.category, color: '#94a3b8', bg: 'rgba(255,255,255,0.1)', icon: AlertCircle }
                const Icon = cfg.icon
                
                const hasUtr = e.utr && e.utr !== 'nan' && e.utr.trim() !== ''
                const hasDesc = e.description && e.description !== 'nan' && e.description.trim() !== ''

                return (
                  <tr
                    key={e.id}
                    className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'} hover:bg-white/10 transition-colors duration-300`}
                  >
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest bg-white/5 text-[#94a3b8] border border-white/10">
                        {e.source}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-xs font-bold w-fit px-3 py-1 rounded-full border shadow-sm"
                        style={{ background: cfg.bg.replace('/10', '/15'), color: cfg.color, borderColor: `${cfg.color}50` }}>
                        <Icon size={14} /> {cfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {hasUtr ? (
                        <span className="font-mono text-sm font-semibold text-white truncate block max-w-[180px] hover:text-[#2b6aff] transition-colors" title={e.utr}>
                          {e.utr}
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest bg-white/5 text-[#64748b] border border-white/10">
                          N/A
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold tracking-wide" style={{ color: cfg.color }}>
                      ₹{Number(e.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-[#94a3b8] text-xs font-medium">
                      {e.date ? new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-6 py-4 text-xs text-[#e2e8f0] max-w-[250px] truncate" title={e.description}>
                      {hasDesc ? e.description : <span className="text-[#64748b] italic">No description</span>}
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
