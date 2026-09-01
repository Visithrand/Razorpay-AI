import { useState, useEffect, useRef } from 'react'
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, ShieldCheck, Zap, X, Check } from 'lucide-react'

export default function LiveMonitor({ onNavigate }) {
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isSimulating, setIsSimulating] = useState(true)
  
  // Track sequence for predictable simulation logic
  const sequenceRef = useRef(0)
  
  useEffect(() => {
    // Initial fetch of recent events
    fetch('/api/events/stream?limit=15')
      .then(res => res.json())
      .then(data => {
        if (data.events) {
          setEvents(data.events.reverse())
        }
      })
      .catch(err => console.error("Failed to fetch stream", err))
      
    const interval = setInterval(() => {
      if (!isSimulating) return
      simulateEvent()
    }, 3000)
    
    return () => clearInterval(interval)
  }, [isSimulating])

  const simulateEvent = async (forceType = null) => {
    sequenceRef.current += 1
    const seq = sequenceRef.current
    
    let txnId = `TXN-${Math.floor(10000 + Math.random() * 90000)}`
    let amount = Math.floor(Math.random() * 9000) + 1000
    let merchantId = `M-${Math.floor(10 + Math.random() * 90)}`
    let customerRef = `C-${Math.floor(100 + Math.random() * 900)}`
    
    // Create deliberate anomalies based on sequence or manual trigger
    if (forceType === 'amount' || seq % 10 === 0) {
      // Amount anomaly
      amount = 250000
    } else if (forceType === 'duplicate' || seq % 12 === 0) {
      // Financial Duplicate anomaly (Different txn_id, same financial signals)
      if (events.length > 0) {
        const last = events[0] // events are reversed, so index 0 is the most recent
        merchantId = last.merchant_id
        customerRef = last.customer_reference
        amount = last.amount
      }
    } else if (forceType === 'retry' || seq % 15 === 0) {
      // Webhook Retry (Idempotency check: Exact same txn_id)
      if (events.length > 0) {
        const last = events[0]
        txnId = last.transaction_id
        merchantId = last.merchant_id
        customerRef = last.customer_reference
        amount = last.amount
      }
    }
    
    const payload = {
      transaction_id: txnId,
      merchant_id: merchantId,
      customer_reference: customerRef,
      amount: amount,
      currency: "INR",
      timestamp: new Date().toISOString(),
      payment_status: "SUCCESS"
    }

    try {
      const res = await fetch('/api/events/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      
      if (data.status === 'success') {
        const newEvent = {
          id: data.event_id,
          transaction_id: data.transaction_id,
          amount: payload.amount,
          timestamp: payload.timestamp,
          merchant_id: payload.merchant_id,
          customer_reference: payload.customer_reference,
          risk_score: data.risk_score,
          risk_level: data.risk_level,
          classification: data.classification,
          signals: data.signals,
          exception_id: data.exception_id,
          related_transaction_id: data.related_transaction_id,
          related_timestamp: data.related_timestamp
        }
        setEvents(prev => [newEvent, ...prev].slice(0, 30)) // Add to top, keep 30
      } else if (data.status === 'ignored') {
        // Idempotency ignore (Webhook retry)
        const ignoredEvent = {
          id: `ignore-${Date.now()}`,
          transaction_id: data.transaction_id,
          amount: payload.amount,
          timestamp: payload.timestamp,
          merchant_id: payload.merchant_id,
          customer_reference: payload.customer_reference,
          risk_score: 0,
          risk_level: 'IGNORED',
          classification: 'Webhook Retry',
          signals: [{name: 'Idempotency key matched', score: 0}],
          exception_id: null
        }
        setEvents(prev => [ignoredEvent, ...prev].slice(0, 30))
      }
    } catch (err) {
      console.error("Simulation failed:", err)
    }
  }

  const handleInvestigate = (exceptionId) => {
    onNavigate('investigation', exceptionId)
  }

  return (
    <div className="flex h-full bg-[#EFF3F8]">
      {/* Left Column: Stream */}
      <div className={`flex-1 p-6 flex flex-col transition-all duration-300 ${selectedEvent ? 'mr-96' : ''}`}>
        <div className="flex justify-between items-end mb-6 border-b border-[#E5E7EB] pb-4">
          <div>
            <h1 className="text-[24px] font-semibold text-[#111827] flex items-center gap-3">
              Live Payment Monitor 
              <span className="flex items-center gap-1.5 text-[13px] font-bold px-2 py-0.5 rounded bg-[#DC2626] text-white uppercase tracking-wider animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE
              </span>
            </h1>
            <p className="text-base text-[#6B7280] mt-1">Monitoring payment events stream in real-time.</p>
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-white border border-[#E5E7EB] rounded-md shadow-sm flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#F7F8FA] border-b border-[#E5E7EB] z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-3 text-sm font-semibold text-[#374151] uppercase w-[12%]">Time</th>
                  <th className="px-6 py-3 text-sm font-semibold text-[#374151] uppercase w-[22%]">Transaction</th>
                  <th className="px-6 py-3 text-sm font-semibold text-[#374151] uppercase w-[22%]">Merchant</th>
                  <th className="px-6 py-3 text-sm font-semibold text-[#374151] uppercase w-[12%] text-right">Amount</th>
                  <th className="px-6 py-3 text-sm font-semibold text-[#374151] uppercase w-[10%] text-center">Risk</th>
                  <th className="px-6 py-3 text-sm font-semibold text-[#374151] uppercase w-[12%]">Status</th>
                  <th className="px-6 py-3 text-sm font-semibold text-[#374151] uppercase w-[10%] text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt) => {
                  const isHighRisk = evt.risk_level === 'HIGH'
                  const isIgnored = evt.risk_level === 'IGNORED'
                  const isSelected = selectedEvent?.id === evt.id
                  return (
                    <tr 
                      key={evt.id}
                      className={`
                        border-b border-[#F3F4F6] transition-colors
                        ${isSelected ? 'bg-[#EFF6FF]' : 'hover:bg-[#F7F8FA]'}
                      `}
                    >
                    <td className="px-6 py-3 text-[15px] text-[#6B7280] w-[12%] whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-6 py-3 text-[15px] text-[#111827] w-[22%]">
                      <span className="font-mono font-medium">{evt.transaction_id}</span>
                    </td>
                    <td className="px-6 py-3 text-[15px] text-[#111827] w-[22%] truncate max-w-[200px]">
                      <span className="truncate">{evt.merchant_id}</span>
                    </td>
                    <td className="px-6 py-3 text-[15px] text-[#111827] font-semibold w-[12%] text-right">
                      ₹{evt.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-[15px] font-semibold w-[10%] text-center">
                      <span className={isHighRisk ? 'text-[#DC2626]' : 'text-[#374151]'}>{evt.risk_score}</span>
                    </td>
                    <td className="px-6 py-3 w-[12%]">
                      {isIgnored ? (
                        <span className="text-[15px] font-semibold text-[#059669] flex items-center gap-1.5">
                          <CheckCircle2 size={14} /> Retry
                        </span>
                      ) : isHighRisk ? (
                        <span className="text-[15px] font-semibold text-[#D97706] flex items-center gap-1.5">
                          <AlertTriangle size={14} /> ⚠ Review
                        </span>
                      ) : (
                        <span className="text-[15px] text-[#6B7280]">Normal</span>
                      )}
                    </td>
                    <td className="px-6 py-3 w-[10%] text-center">
                      {isHighRisk || isIgnored ? (
                        <button 
                          onClick={() => setSelectedEvent(evt)}
                          className={`text-sm font-semibold hover:underline ${isIgnored ? 'text-[#059669]' : 'text-[#0258FF]'}`}
                        >
                          View
                        </button>
                      ) : (
                        <span className="text-sm text-[#E5E7EB]">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {events.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-[#6B7280] text-[15px]">Waiting for payment events...</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Right Column: Evidence Pane */}
      {selectedEvent && (
        <div className="w-[400px] bg-white border-l border-[#E5E7EB] shadow-2xl fixed right-0 top-0 bottom-0 overflow-y-auto animate-in slide-in-from-right z-30">
          <div className="p-6">
            <div className="flex justify-between items-center mb-8 border-b border-[#E5E7EB] pb-4">
              <h2 className="text-[18px] font-semibold text-[#111827]">
                {selectedEvent.classification || 'Potential Duplicate'}
              </h2>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="p-1 hover:bg-[#F3F4F6] rounded text-[#6B7280] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-8">
              {/* Risk Score */}
              <div>
                <p className="text-[15px] font-semibold text-[#374151] uppercase mb-2">Risk Score</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-[32px] font-semibold text-[#111827]">{selectedEvent.risk_score}</span>
                  <span className="text-[16px] text-[#6B7280]">/ 100</span>
                </div>
              </div>

              {/* Signals */}
              {selectedEvent.signals && selectedEvent.signals.length > 0 && (
                <div>
                  <p className="text-[15px] font-semibold text-[#374151] uppercase mb-3">Signals</p>
                  <div className="space-y-2">
                    {selectedEvent.signals.map((sig, i) => (
                      <div key={i} className="flex items-center gap-2 text-base text-[#111827]">
                        <Check size={16} className="text-[#059669]" />
                        {sig.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Transaction */}
              {selectedEvent.related_transaction_id && (
                <div>
                  <p className="text-[15px] font-semibold text-[#374151] uppercase mb-2">Related Transaction</p>
                  <div className="text-base font-mono text-[#111827]">
                    {selectedEvent.related_transaction_id}
                  </div>
                </div>
              )}

              {/* Action */}
              {selectedEvent.exception_id ? (
                <div className="pt-8">
                  <button 
                    onClick={() => handleInvestigate(selectedEvent.exception_id)}
                    className="w-full bg-[#0258FF] hover:bg-[#014CE0] text-white py-2.5 rounded text-base font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    Investigate with AI
                  </button>
                </div>
              ) : selectedEvent.risk_level === 'IGNORED' ? (
                <div className="pt-8">
                  <div className="w-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] py-3 px-4 rounded text-[15px] font-medium flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} /> No financial exception created
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
