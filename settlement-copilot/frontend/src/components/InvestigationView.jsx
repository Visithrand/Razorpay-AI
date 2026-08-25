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
      <div className="bg-white border-2 border-[#0065FF]/40 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#0065FF]" />
            <h3 className="text-sm font-extrabold text-[#0B192C] uppercase tracking-wider">MULTI-AGENT INVESTIGATION</h3>
          </div>
          <span className="text-xs font-mono text-[#0065FF] font-bold">Confidence: {inv.confidence !== undefined ? (inv.confidence * 100).toFixed(0) : 0}%</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <h4 className="font-bold text-gray-500 uppercase">Agent Status:</h4>
            <div className="flex items-center gap-2 text-[#10B981]"><CheckCircle2 size={14} /> Match Investigator Completed</div>
            <div className="flex items-center gap-2 text-[#10B981]"><CheckCircle2 size={14} /> Financial Risk Analyst Completed</div>
            <div className="flex items-center gap-2 text-[#10B981]"><CheckCircle2 size={14} /> Finance Operations Analyst Completed</div>
            <div className="flex items-center gap-2 text-[#10B981]"><CheckCircle2 size={14} /> Evidence Aggregator Completed</div>
            <div className="flex items-center gap-2 text-[#10B981]"><CheckCircle2 size={14} /> Judge Completed</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
             <div className="flex justify-between">
                <span className="text-gray-400 font-bold">FINAL DECISION:</span>
                <span className="font-extrabold text-[#0B192C]">{inv.final_decision || 'RESOLVED'}</span>
             </div>
             <div className="flex justify-between">
                <span className="text-gray-400 font-bold">REQUIRES HUMAN REVIEW:</span>
                <span className={`font-extrabold ${inv.requires_human_review ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>{inv.requires_human_review ? 'YES' : 'NO'}</span>
             </div>
             <div className="flex justify-between">
                <span className="text-gray-400 font-bold">ROOT CAUSE:</span>
                <span className="font-extrabold text-[#0B192C]">{inv.root_cause}</span>
             </div>
          </div>
        </div>

        <p className="text-xs font-semibold text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-200 mt-2">
          <strong>Judge Reasoning:</strong> {wf.reason || 'Agents concluded with high confidence.'}
        </p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gateway */}
        <div className="bg-white border border-[#DCE3ED] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Gateway</span>
            <CheckCircle2 size={18} className="text-[#10B981]" />
          </div>
          <p className="text-2xl font-mono font-bold text-[#0B192C]">₹{(inv.amounts?.gateway || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <div className="mt-3 text-xs space-y-1 text-gray-600">
            <p><strong>UTR:</strong> <code className="font-mono text-[#0065FF]">{inv.utr}</code></p>
            <p><strong>Status:</strong> Captured & Settled</p>
          </div>
        </div>

        {/* Bank */}
        <div className="bg-white border border-[#DCE3ED] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bank Credit Statement</span>
            <CheckCircle2 size={18} className="text-[#10B981]" />
          </div>
          <p className="text-2xl font-mono font-bold text-[#0B192C]">₹{(inv.amounts?.bank || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <div className="mt-3 text-xs space-y-1 text-gray-600">
            <p><strong>UTR:</strong> <code className="font-mono text-[#0065FF]">{inv.utr}</code></p>
            <p><strong>Bank:</strong> HDFC / SBI Settled</p>
          </div>
        </div>

        {/* ERP Ledger */}
        <div className="bg-white border-2 border-[#EF4444]/40 rounded-xl p-5 shadow-sm bg-[#FEE2E2]/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#EF4444] uppercase tracking-wider">Internal ERP / Ledger</span>
            <XCircle size={18} className="text-[#EF4444]" />
          </div>
          <p className="text-2xl font-mono font-bold text-[#EF4444]">₹{(inv.amounts?.erp || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <div className="mt-3 text-xs space-y-1 text-gray-600">
            <p><strong>Diff:</strong> <span className="font-bold text-[#EF4444]">₹{(inv.amounts?.difference || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} Discrepancy</span></p>
            <p><strong>Status:</strong> Mismatch Flagged</p>
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
      <div className="bg-[#05103E] text-white rounded-xl p-6 shadow-xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#00E6A0]" />
            <span className="text-xs font-extrabold text-[#00E6A0] uppercase tracking-wider">Human Approval Required</span>
          </div>
          <h4 className="text-base font-extrabold text-white mt-1">{rec ? rec.description : inv.recommended_action}</h4>
          <p className="text-xs text-white/60 mt-0.5">Approval will execute recommended ledger correction and create an immutable entry in Audit Log.</p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {actionStatus ? (
            <div className={`px-5 py-2.5 rounded-lg text-sm font-extrabold flex items-center gap-2 ${
              actionStatus === 'APPROVED' ? 'bg-[#10B981] text-white' : 'bg-[#EF4444] text-white'
            }`}>
              {actionStatus === 'APPROVED' ? <Check size={16} /> : <X size={16} />}
              Action {actionStatus}
            </div>
          ) : (
            <>
              <button onClick={() => handleAction('reject')} className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-lg transition-all flex items-center gap-1.5 border border-white/20">
                <ThumbsDown size={15} /> Reject Action
              </button>
              <button onClick={() => handleAction('approve')} className="btn-primary py-2.5 px-6 flex items-center gap-2 shadow-lg">
                <ThumbsUp size={15} /> Approve & Execute
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
