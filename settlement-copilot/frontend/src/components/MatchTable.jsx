import { Eye, Info, CheckCircle2, Zap, Layers } from 'lucide-react'

const CONF_COLOR = (conf) => {
  if (conf >= 0.90) return { text: 'text-[#00e676]', bg: 'bg-[#00e676]/10', bar: 'bg-gradient-to-r from-[#00b85c] to-[#00e676]' }
  if (conf >= 0.75) return { text: 'text-[#2b6aff]', bg: 'bg-[#2b6aff]/10', bar: 'bg-gradient-to-r from-[#2b6aff] to-[#0047ff]' }
  if (conf >= 0.60) return { text: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/10', bar: 'bg-gradient-to-r from-[#f59e0b] to-[#d97706]' }
  return { text: 'text-[#ff4757]', bg: 'bg-[#ff4757]/10', bar: 'bg-gradient-to-r from-[#ff4757] to-[#ff6b81]' }
}

const TYPE_BADGE = {
  exact: { bg: 'bg-[#00e676]/10 border-[#00e676]/30 shadow-[inset_0_0_10px_rgba(0,230,118,0.2)]', text: 'text-[#00e676]', icon: CheckCircle2 },
  fuzzy: { bg: 'bg-[#2b6aff]/10 border-[#2b6aff]/30 shadow-[inset_0_0_10px_rgba(43,106,255,0.2)]', text: 'text-[#2b6aff]', icon: Zap },
  batch: { bg: 'bg-[#c084fc]/10 border-[#c084fc]/30 shadow-[inset_0_0_10px_rgba(192,132,252,0.2)]', text: 'text-[#c084fc]', icon: Layers },
}

export default function MatchTable({ matches, onRowClick }) {
  return (
    <div className="overflow-x-auto custom-scrollbar">
      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center glass-panel">
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-5 text-[#64748b]">
            <Info size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 tracking-wide">No matches discovered</h3>
          <p className="text-sm text-[#94a3b8]">Adjust the confidence threshold to widen the search parameter.</p>
        </div>
      ) : (
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-black/20 backdrop-blur-md">
              {['Transaction ID', 'Gateway UTR', 'Match Type', 'Gateway Amt', 'Bank Amt', 'Date', 'Confidence Score', 'Action'].map(h => (
                <th key={h} className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matches.map((m, i) => {
              const colors = CONF_COLOR(m.confidence || 0)
              const confPct = ((m.confidence || 0) * 100).toFixed(0)
              const badge = TYPE_BADGE[m.match_type] || { bg: 'bg-white/5 border-white/10', text: 'text-[#64748b]', icon: Info }
              const BadgeIcon = badge.icon
              
              const hasUtr = m.gateway_utr && m.gateway_utr !== 'nan' && m.gateway_utr.trim() !== ''

              return (
                <tr
                  key={m.id}
                  onClick={() => onRowClick(m)}
                  className={`border-b border-white/5 cursor-pointer hover:bg-white/10 transition-colors duration-300 ${i % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'}`}
                >
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-semibold text-[#2b6aff] hover:text-white hover:drop-shadow-[0_0_8px_rgba(43,106,255,0.8)] transition-all">
                      {(m.gateway_txn_ref || '—').slice(0, 16)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {hasUtr ? (
                      <span className="font-mono text-sm text-[#94a3b8] group-hover:text-white transition-colors" title={m.gateway_utr}>
                        {m.gateway_utr.slice(0, 20)}
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest bg-white/5 text-[#64748b] border border-white/10">
                        N/A
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text}`}>
                      <BadgeIcon size={14} className={badge.text} />
                      {m.match_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-white tracking-wide">
                    ₹{Number(m.gateway_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 font-semibold text-[#94a3b8]">
                    ₹{Number(m.bank_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-[#64748b] text-xs font-medium">
                    {m.gateway_date ? new Date(m.gateway_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-bold ${colors.text} w-8`}>{confPct}%</span>
                      <div className="w-20 h-1.5 rounded-full bg-white/5 overflow-hidden border border-white/10 p-[0.5px]">
                        <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${confPct}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 text-[#64748b] hover:text-[#00e676] hover:bg-[#00e676]/10 hover:shadow-[0_0_15px_rgba(0,230,118,0.2)] rounded-lg transition-all duration-300">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
