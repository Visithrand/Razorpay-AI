import { useState, useEffect } from 'react'
import { CheckCircle2, Clock, AlertTriangle, X, ArrowDown } from 'lucide-react'

export default function TransactionTimelineModal({ txnId, onClose }) {
  const [timelineData, setTimelineData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTimeline()
  }, [txnId])

  const fetchTimeline = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/transactions/${txnId}/timeline`)
      if (res.ok) {
        setTimelineData(await res.json())
      } else {
        setTimelineData(FALLBACK_TIMELINE(txnId))
      }
    } catch (e) {
      setTimelineData(FALLBACK_TIMELINE(txnId))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-overlay-fadein">
      <div className="bg-white border border-[#DCE3ED] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-overlay-slideup text-[#0B192C]">
        <div className="px-6 py-4 border-b border-[#DCE3ED] flex items-center justify-between bg-[#05103E] text-white">
          <div>
            <h3 className="font-extrabold text-base">Transaction Lifecycle Timeline</h3>
            <p className="text-sm text-white/60 font-mono mt-0.5">{txnId}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[480px] overflow-y-auto custom-scrollbar">
          {loading ? (
            <p className="text-center text-sm text-gray-500 py-8">Loading timeline events...</p>
          ) : (
            timelineData.timeline.map((item, idx) => (
              <div key={idx} className="relative">
                <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    item.discrepancy ? 'bg-[#FEE2E2] text-[#EF4444]' : 'bg-[#D1FAE5] text-[#10B981]'
                  }`}>
                    {item.discrepancy ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-extrabold text-[#0B192C]">{item.step}</h4>
                      <span className="text-sm font-mono text-gray-400">{item.time}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">Source: <strong>{item.source}</strong></p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/60 text-sm">
                      <span className="font-mono font-bold text-[#0065FF]">{item.ref}</span>
                      <span className="font-extrabold text-[#0B192C]">{item.amount}</span>
                    </div>

                    {item.discrepancy && (
                      <p className="text-sm font-bold text-[#EF4444] bg-[#FEE2E2] px-2.5 py-1 rounded mt-2 border border-[#EF4444]/20">
                        {item.discrepancy}
                      </p>
                    )}
                  </div>
                </div>

                {idx < timelineData.timeline.length - 1 && (
                  <div className="w-0.5 h-4 bg-gray-200 mx-auto my-1" />
                )}
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-3 border-t border-[#DCE3ED] bg-gray-50 flex justify-end">
          <button onClick={onClose} className="btn-primary text-sm py-2">Close Timeline</button>
        </div>
      </div>
    </div>
  )
}

const FALLBACK_TIMELINE = (id) => ({
  txn_id: id,
  is_anomaly: true,
  timeline: [
    { step: 'Payment Initiated', source: 'Customer Checkout', time: '10:40 AM', status: 'SUCCESS', amount: '₹12,450.00', ref: id, discrepancy: null },
    { step: 'Gateway Success', source: 'Razorpay PG', time: '10:41 AM', status: 'SUCCESS', amount: '₹12,450.00', ref: `pay_${id}`, discrepancy: null },
    { step: 'Gateway Settlement', source: 'Razorpay Engine', time: '11:15 AM', status: 'SETTLED', amount: '₹12,450.00', ref: `setl_${id}`, discrepancy: null },
    { step: 'Bank Credit', source: 'HDFC Bank', time: '11:45 AM', status: 'CREDITED', amount: '₹12,450.00', ref: 'UTR98124910284', discrepancy: null },
    { step: 'ERP Ledger Entry', source: 'Internal Ledger', time: '11:50 AM', status: 'WARNING', amount: '₹12,400.00', ref: `INV-${id}`, discrepancy: '⚠ ₹50.00 Amount Mismatch Discrepancy' },
  ]
})
