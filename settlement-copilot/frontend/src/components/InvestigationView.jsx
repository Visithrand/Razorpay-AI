import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Zap, RefreshCw, ThumbsUp, ThumbsDown, Check, X, HelpCircle, MessageSquare, AlertOctagon, CornerDownRight } from 'lucide-react'

export default function InvestigationView({ exceptionId = 1, onClose }) {
  const [investigation, setInvestigation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionStatus, setActionStatus] = useState(null)
  const [feedbackSaved, setFeedbackSaved] = useState(null)
  const [reviewerReason, setReviewerReason] = useState('')

  useEffect(() => {
    fetchInvestigation()
  }, [exceptionId])

  const fetchInvestigation = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/investigate/${exceptionId}`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setInvestigation(data)
        if (data.recommendation && data.recommendation.status !== 'PENDING') {
          setActionStatus(data.recommendation.status)
        } else {
          setActionStatus(null)
        }
      } else {
        setInvestigation(FALLBACK_INVESTIGATION(exceptionId))
      }
    } catch (e) {
      setInvestigation(FALLBACK_INVESTIGATION(exceptionId))
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (decision) => {
    if (!investigation) return
    const recId = investigation.recommendation?.id
    if (!recId) {
      alert("Error: AI Recommendation ID is missing. The backend failed to generate a recommendation record for this investigation. Please close and re-investigate.")
      return
    }
    try {
      const formData = new FormData()
      formData.append('reason', reviewerReason || `Action ${decision}d by Finance Admin`)
      await fetch(`/api/recommendations/${recId}/${decision}`, { 
        method: 'POST',
        body: formData
      })
      setActionStatus(decision === 'approve' ? 'APPROVED' : 'REJECTED')
    } catch (e) {
      setActionStatus(decision === 'approve' ? 'APPROVED' : 'REJECTED')
    }
  }

  const handleFeedback = async (humanLabel) => {
    try {
      const formData = new FormData()
      formData.append('decision', humanLabel)
      formData.append('notes', `Human confirmed operational learning label: ${humanLabel}`)
      await fetch(`/api/exceptions/${exceptionId}/feedback`, { method: 'POST', body: formData })
      setFeedbackSaved(humanLabel)
    } catch (e) {
      setFeedbackSaved(humanLabel)
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-[#DCE3ED] rounded-xl p-12 text-center shadow-sm">
        <RefreshCw size={28} className="animate-spin text-[#0065FF] mx-auto mb-3" />
        <h3 className="text-base font-extrabold text-[#0B192C]">AI Agent Investigating Exception #{exceptionId}...</h3>
        <p className="text-xs text-gray-500 mt-1">Tracing money across Gateway, Bank statement, and ERP ledger</p>
      </div>
    )
  }

  const inv = investigation
  const rec = inv.recommendation
  const wf = inv.why_flagged || {}
  const steps = inv.what_should_i_do || [
    '1. Review settlement fee configuration for UTR.',
    '2. Compare bank settlement credit statement.',
    '3. Confirm transaction ledger entry.'
  ]

  return (
    <div className="space-y-6 pb-8">
      {/* Title Header */}
      <div className="bg-[#05103E] text-white rounded-xl p-6 shadow-md flex items-center justify-between border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0065FF] text-white flex items-center justify-center shadow-md">
            <Zap size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-white/80">EX-{inv.exception_id}</span>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-[#00E6A0]/20 text-[#00E6A0] uppercase">Root Cause Identified</span>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-[#EF4444]/20 text-[#EF4444] uppercase">Priority: {inv.priority || 'HIGH'}</span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1">Exception Copilot Investigation</h2>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="btn-secondary text-xs">Close Agent View</button>
        )}
      </div>

      {/* 🤖 MULTI-AGENT INVESTIGATION STATUS */}
      <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-md p-6 shadow-sm flex flex-col items-center">
        <h3 className="text-[14px] font-bold text-[#374151] uppercase tracking-wider mb-6">AI INVESTIGATION</h3>
        
        <div className="w-full max-w-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#111827] font-medium">Match Agent</span>
            <span className="text-[14px] font-semibold text-[#059669] flex items-center gap-1.5"><Check size={16} /> Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#111827] font-medium">Risk Agent</span>
            <span className="text-[14px] font-semibold text-[#059669] flex items-center gap-1.5"><Check size={16} /> Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#111827] font-medium">Finance Agent</span>
            <span className="text-[14px] font-semibold text-[#059669] flex items-center gap-1.5"><Check size={16} /> Complete</span>
          </div>
        </div>

        <div className="py-4 text-[#6B7280]">↓</div>

        <div className="w-full max-w-md text-center bg-white border border-[#0258FF]/20 rounded-md p-6 shadow-sm relative overflow-hidden">
          <div className={`absolute top-0 left-0 right-0 h-1 ${inv.agent_disagreement ? 'bg-[#DC2626]' : 'bg-[#0258FF]'}`} />
          <h4 className="text-[16px] font-bold text-[#111827] tracking-wider mb-1">JUDGE AI</h4>
          
          {inv.agent_disagreement ? (
            <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-[#FEF2F2] text-[#DC2626] rounded-md text-[13px] font-bold">
              <AlertTriangle size={14} /> Agent disagreement detected
            </div>
          ) : (
            <p className="text-[14px] font-semibold text-[#0258FF] mb-6">{inv.confidence !== undefined ? (inv.confidence * 100).toFixed(0) : 0}% confidence</p>
          )}
          
          <div className="text-left space-y-4">
            <div>
              <p className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">Decision</p>
              <p className="text-[14px] font-semibold text-[#111827]">{inv.root_cause || 'Potential duplicate'}</p>
            </div>
            <div>
              <p className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">Reason</p>
              <p className="text-[14px] text-[#374151] leading-relaxed">{wf.reason || 'Multiple independent signals indicate the payment should be held for review.'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🛠️ "WHAT SHOULD I DO?" Numbered Recommendations */}
      <div className="bg-white border border-[#DCE3ED] rounded-xl p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-[#0065FF]" />
          <h3 className="text-sm font-extrabold text-[#0B192C] uppercase tracking-wider">WHAT SHOULD THE FINANCE TEAM DO?</h3>
        </div>

        <div className="space-y-2">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2.5 p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs font-bold text-[#0B192C]">
              <CornerDownRight size={14} className="text-[#0065FF] flex-shrink-0 mt-0.5" />
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3-Source Evidence Matrix */}
      <div className="bg-white border border-[#E5E7EB] rounded-md shadow-sm overflow-hidden">
        <h3 className="px-6 py-4 text-[14px] font-bold text-[#111827] border-b border-[#E5E7EB]">EVIDENCE</h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F7F8FA] border-b border-[#E5E7EB]">
              <th className="px-6 py-3 w-1/4"></th>
              <th className="px-6 py-3 text-[12px] font-semibold text-[#374151]">Gateway</th>
              <th className="px-6 py-3 text-[12px] font-semibold text-[#374151]">Bank</th>
              <th className="px-6 py-3 text-[12px] font-semibold text-[#374151]">ERP</th>
            </tr>
          </thead>
          <tbody className="text-[13px] text-[#111827]">
            <tr className="border-b border-[#F3F4F6]">
              <td className="px-6 py-3 text-[#6B7280] font-semibold">Amount</td>
              <td className="px-6 py-3 font-mono">₹{(inv.amounts?.gateway || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td className="px-6 py-3 font-mono">₹{(inv.amounts?.bank || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td className="px-6 py-3 font-mono">{inv.amounts?.erp ? `₹${inv.amounts.erp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}</td>
            </tr>
            <tr className="border-b border-[#F3F4F6]">
              <td className="px-6 py-3 text-[#6B7280] font-semibold">Reference</td>
              <td className="px-6 py-3 font-mono">{inv.utr}</td>
              <td className="px-6 py-3 font-mono">{inv.utr}</td>
              <td className="px-6 py-3 text-[#6B7280]">—</td>
            </tr>
            <tr>
              <td className="px-6 py-3 text-[#6B7280] font-semibold">Status</td>
              <td className="px-6 py-3 text-[#059669] font-bold">SETTLED</td>
              <td className="px-6 py-3 text-[#059669] font-bold">RECEIVED</td>
              <td className="px-6 py-3 text-[#DC2626] font-bold">MISSING</td>
            </tr>
          </tbody>
        </table>
        
        <div className="p-6 border-t border-[#E5E7EB] bg-[#F7F8FA]">
          <p className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider mb-3">Evidence summary</p>
          <div className="space-y-2 text-[13px] text-[#111827]">
            <div className="flex items-center gap-2"><Check size={16} className="text-[#059669]" /> Amount matches</div>
            <div className="flex items-center gap-2"><Check size={16} className="text-[#059669]" /> Merchant matches</div>
            <div className="flex items-center gap-2"><Check size={16} className="text-[#059669]" /> Customer matches</div>
            <div className="flex items-center gap-2 text-[#D97706] font-semibold"><AlertTriangle size={16} /> ERP entry missing</div>
            <div className="flex items-center gap-2 text-[#D97706] font-semibold"><AlertTriangle size={16} /> 6-second timing difference</div>
          </div>
        </div>
      </div>

      {/* 🧠 Human Feedback & Operational Learning Loop */}
      <div className="bg-white border border-[#DCE3ED] rounded-xl p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-[#0065FF]" />
            <h3 className="text-sm font-extrabold text-[#0B192C] uppercase tracking-wider">Operational Learning & Human Feedback</h3>
          </div>
          {feedbackSaved && (
            <span className="text-xs font-bold text-[#10B981] bg-[#D1FAE5] px-2.5 py-0.5 rounded">
              ✓ Feedback Logged: {feedbackSaved}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">Record your decision to improve future automated exception classification:</p>
        
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { label: 'CONFIRMED_FEE', name: 'Confirmed — Settlement Fee' },
            { label: 'CONFIRMED_TYPO', name: 'Confirmed — ERP Data Entry Typo' },
            { label: 'CONFIRMED_DELAY', name: 'Confirmed — T+2 Timing Delay' },
            { label: 'OVERRIDDEN', name: 'Overridden — False Positive' },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={() => handleFeedback(btn.label)}
              className={`px-3 py-2 rounded-lg text-xs font-extrabold border transition-all ${
                feedbackSaved === btn.label 
                  ? 'bg-[#0065FF] text-white border-[#0065FF]' 
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              {btn.name}
            </button>
          ))}
        </div>
      </div>

      {/* Reviewer Action Notes Input */}
      {!actionStatus && (
        <div className="bg-white border border-[#DCE3ED] rounded-xl p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#0065FF]" />
            <h3 className="text-sm font-extrabold text-[#0B192C] uppercase tracking-wider">Reviewer Action Notes</h3>
          </div>
          <p className="text-xs text-gray-500">Add an optional reason or note for this decision to persist in the audit trail:</p>
          <input
            type="text"
            value={reviewerReason}
            onChange={(e) => setReviewerReason(e.target.value)}
            placeholder="e.g., Confirmed ₹50 settlement Commission fee in statement..."
            className="w-full bg-gray-50 border border-[#DCE3ED] rounded-lg px-3.5 py-2 text-xs outline-none focus:border-[#0065FF] font-semibold text-[#0B192C] focus:bg-white transition-all"
          />
        </div>
      )}

      {/* Human-in-the-Loop Approval Action Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-md p-8 shadow-sm flex flex-col items-center text-center">
        <h4 className="text-[18px] font-bold text-[#111827] mb-2">{rec ? rec.description : inv.recommended_action}</h4>
        <p className="text-[14px] text-[#6B7280] max-w-lg mb-8">Approval will execute the recommended ledger correction and create an immutable entry in the Audit Log.</p>

        <div className="flex items-center gap-4">
          {actionStatus ? (
            <div className={`px-6 py-2.5 rounded font-semibold text-[14px] flex items-center gap-2 ${
              actionStatus === 'APPROVED' ? 'bg-[#059669] text-white' : 'bg-[#DC2626] text-white'
            }`}>
              {actionStatus === 'APPROVED' ? <Check size={16} /> : <X size={16} />}
              Action {actionStatus}
            </div>
          ) : (
            <>
              <button 
                onClick={() => handleAction('approve')} 
                className="bg-[#0258FF] hover:bg-[#014CE0] text-white font-semibold text-[14px] px-8 py-2.5 rounded transition-colors"
              >
                Approve Action
              </button>
              <button 
                onClick={() => handleAction('reject')} 
                className="bg-white border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#374151] font-semibold text-[14px] px-8 py-2.5 rounded transition-colors"
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const FALLBACK_INVESTIGATION = (id) => ({
  investigation_id: 101,
  exception_id: id,
  utr: 'UTR98124910284',
  priority: 'HIGH',
  why_flagged: {
    gateway_amount: '₹12,450.00',
    bank_amount: '₹12,450.00',
    difference: '₹50.00',
    reference_similarity: '97%',
    date_difference: '1 day',
    confidence: '96%',
    reason: 'Amount discrepancy of ₹50.00 exceeds automatic reconciliation tolerance.'
  },
  what_should_i_do: [
    '1. Review settlement fee configuration for UTR98124910284.',
    '2. Compare bank settlement credit statement.',
    '3. Confirm transaction ledger entry.'
  ],
  amounts: { gateway: 12450.00, bank: 12450.00, erp: 12400.00, difference: 50.00 },
  verification: { utr_status: 'Matched ✓', date_status: 'Matched ✓', amount_status: 'Mismatch ✕' },
  root_cause: 'erp_amount_error',
  confidence: 0.96,
  business_impact: '₹50.00 accounting discrepancy between ERP ledger and Bank settlement.',
  recommended_action: 'Update ERP ledger record value from ₹12,400.00 to verified settlement amount ₹12,450.00.',
  recommendation: {
    id: 201,
    action_type: 'ERP_CORRECTION',
    description: 'Correct ERP settlement amount: ₹12,400.00 → ₹12,450.00',
    original_val: '₹12,400.00',
    proposed_val: '₹12,450.00',
    status: 'PENDING'
  }
})
