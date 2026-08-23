import { X, CheckCircle2, Zap, Layers, AlertCircle, FileText, IndianRupee, HelpCircle } from 'lucide-react'

const TYPE_BADGE = {
  exact: { bg: 'bg-[#e8f7f1]', text: 'text-[#2eb88a]', icon: CheckCircle2, label: 'Exact Match' },
  fuzzy: { bg: 'bg-[#e8f0fe]', text: 'text-[#3d8ef8]', icon: Zap, label: 'Fuzzy Match' },
  batch: { bg: 'bg-[#f3f0ff]', text: 'text-[#7c3aed]', icon: Layers, label: 'Batch Match' },
}

export default function TransactionModal({ match, onClose }) {
  if (!match) return null

  const badge = TYPE_BADGE[match.match_type] || { bg: 'bg-[#f5f7fa]', text: 'text-[#697386]', icon: HelpCircle, label: match.match_type }
  const BadgeIcon = badge.icon
  const confPct = ((match.confidence || 0) * 100).toFixed(0)

  return (
    <div className="fixed inset-0 bg-[#1a1f36]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#e3e8ef] flex items-center justify-between bg-[#fafbfc]">
          <div>
            <h2 className="text-xl font-bold text-[#1a1f36]">Match Details</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
                <BadgeIcon size={14} /> {badge.label}
              </span>
              <span className="text-xs font-semibold text-[#697386] bg-white border border-[#e3e8ef] px-2.5 py-1 rounded-full">
                Confidence: {confPct}%
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[#a3acb9] hover:text-[#1a1f36] hover:bg-[#e3e8ef] rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {match.reason && (
            <div className="bg-[#f8f9ff] border border-[#3d8ef8]/20 rounded-xl p-4 flex gap-3">
              <AlertCircle size={18} className="text-[#3d8ef8] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-[#1a1f36] mb-1">AI Match Reasoning</h4>
                <p className="text-sm text-[#697386] leading-relaxed">{match.reason}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            {/* Gateway Column */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#3d8ef8] uppercase tracking-wider flex items-center gap-2 border-b border-[#e3e8ef] pb-2">
                <FileText size={14} /> Gateway Record
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-[#8a94b2] uppercase font-bold tracking-wider mb-0.5">Transaction ID</p>
                  <p className="text-sm font-mono font-medium text-[#1a1f36] bg-[#f5f7fa] px-2 py-1 rounded inline-block border border-[#e3e8ef]">
                    {match.gateway_txn_ref || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#8a94b2] uppercase font-bold tracking-wider mb-0.5">Gateway UTR</p>
                  <p className="text-sm font-mono text-[#697386]">{match.gateway_utr && match.gateway_utr !== 'nan' ? match.gateway_utr : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#8a94b2] uppercase font-bold tracking-wider mb-0.5">Amount</p>
                  <p className="text-lg font-bold text-[#1a1f36] flex items-center gap-1">
                    <IndianRupee size={16} className="text-[#a3acb9]" />
                    {Number(match.gateway_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#8a94b2] uppercase font-bold tracking-wider mb-0.5">Date</p>
                  <p className="text-sm text-[#1a1f36]">
                    {match.gateway_date ? new Date(match.gateway_date).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bank Column */}
            <div className="space-y-4 border-l border-[#e3e8ef] pl-6">
              <h3 className="text-xs font-bold text-[#2eb88a] uppercase tracking-wider flex items-center gap-2 border-b border-[#e3e8ef] pb-2">
                <FileText size={14} /> Bank Record
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-[#8a94b2] uppercase font-bold tracking-wider mb-0.5">Bank Reference</p>
                  <p className="text-sm font-mono font-medium text-[#1a1f36] bg-[#f5f7fa] px-2 py-1 rounded inline-block border border-[#e3e8ef]">
                    {match.bank_utr && match.bank_utr !== 'nan' ? match.bank_utr : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#8a94b2] uppercase font-bold tracking-wider mb-0.5">Settlement UTR</p>
                  <p className="text-sm font-mono text-[#697386]">{match.bank_utr && match.bank_utr !== 'nan' ? match.bank_utr : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#8a94b2] uppercase font-bold tracking-wider mb-0.5">Amount</p>
                  <p className="text-lg font-bold text-[#1a1f36] flex items-center gap-1">
                    <IndianRupee size={16} className="text-[#a3acb9]" />
                    {Number(match.bank_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#f5f7fa] border-t border-[#e3e8ef] flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-[#697386] bg-white border border-[#e3e8ef] rounded-lg hover:bg-[#fafbfc] transition-colors">
            Close
          </button>
          <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-white bg-[#3d8ef8] rounded-lg hover:bg-[#2b6cdb] shadow-[0_2px_8px_rgba(61,142,248,0.3)] transition-colors">
            Approve Match
          </button>
        </div>
      </div>
    </div>
  )
}
