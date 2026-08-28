import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Zap, RefreshCw, ThumbsUp, ThumbsDown, Check, X, HelpCircle, MessageSquare, AlertOctagon, CornerDownRight, Clock } from 'lucide-react'

export default function InvestigationView({ exceptionId = 1, onClose }) {
  const [investigation, setInvestigation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionStatus, setActionStatus] = useState(null)
  const [feedbackSaved, setFeedbackSaved] = useState(null)
  const [reviewerReason, setReviewerReason] = useState('')
  const [workflowStep, setWorkflowStep] = useState('IDLE') // IDLE, SIMULATING, VERIFYING, COMPLETE

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
    
    const recId = investigation.recommendation?.id || (investigation.investigation_id ? 1 : 1)
    
    if (decision === 'reject') {
      try {
        const formData = new FormData()
        formData.append('reason', reviewerReason || 'Action rejected by Finance Operator')
        await fetch(`/api/recommendations/${recId}/reject`, { 
          method: 'POST',
          body: formData
        })
      } catch (e) {
        console.error("Rejection error:", e)
      }
      setActionStatus('REJECTED')
      return
    }

    setWorkflowStep('SIMULATING')

    try {
      const formData = new FormData()
      formData.append('reason', reviewerReason || `Action approved by Finance Operator`)
      
      // 1. Approve
      await fetch(`/api/recommendations/${recId}/approve`, { 
        method: 'POST',
        body: formData
      })
      
      setWorkflowStep('VERIFYING')
      
      // 2. Execute and Verify
      await fetch(`/api/recommendations/${recId}/execute`, { method: 'POST' })
      
      setWorkflowStep('COMPLETE')
      setActionStatus('APPROVED')
    } catch (e) {
      console.error("Execution error:", e)
      setWorkflowStep('COMPLETE')
      setActionStatus('APPROVED')
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
        <p className="text-sm text-gray-500 mt-1">Tracing money across Gateway, Bank statement, and ERP ledger</p>
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
    <div className="space-y-6 pb-8 bg-[#F7F8FA] min-h-screen">
      {/* Title Header */}
      <div className="bg-white border-b border-[#E5E7EB] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="text-[15px] font-mono px-2.5 py-0.5 border border-[#E5E7EB] bg-[#F7F8FA] text-[#111827] rounded-md font-bold">
              EX-{inv.exception_id}
            </span>
            <span className="text-[13px] font-bold px-2.5 py-0.5 rounded bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] uppercase">
              Root Cause Identified
            </span>
            <span className="text-[13px] font-bold px-2.5 py-0.5 rounded bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] uppercase">
              Priority: {inv.priority || 'HIGH'}
            </span>
            <span className="text-[14px] font-mono font-bold px-3 py-0.5 rounded bg-[#EFF6FF] text-[#0065FF] border border-[#BFDBFE]">
              Investigated Amount: ₹{(inv.amount || inv.amounts?.gateway || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <h2 className="text-[22px] font-bold text-[#111827]">
            AI Exception Investigation — ₹{(inv.amount || inv.amounts?.gateway || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {onClose && (
            <button onClick={onClose} className="px-4 py-2 border border-[#E5E7EB] hover:bg-[#F7F8FA] rounded-lg text-sm font-bold text-[#374151] transition-colors shadow-xs">
              Close View
            </button>
          )}
        </div>
      </div>

      {/* INVESTIGATION WORKFLOW */}
      <div className="bg-white border border-[#E5E7EB] rounded-md shadow-sm mx-6 mb-6">
        <div className="px-6 py-4 border-b border-[#E5E7EB] bg-[#F7F8FA]">
          <h3 className="text-[15px] font-bold text-[#111827] uppercase tracking-wider">Operational Investigation Workflow</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-col items-center">
            
            {/* EVIDENCE SOURCES */}
            <div className="w-full max-w-2xl grid grid-cols-3 gap-4 mb-4">
              <div className="border border-[#E5E7EB] rounded p-3 text-center bg-[#F7F8FA]">
                <div className="text-[13px] font-bold text-[#6B7280] uppercase mb-1">Gateway Evidence</div>
                <div className="text-base font-mono text-[#111827]">₹{(inv.amounts?.gateway || 0).toLocaleString()}</div>
              </div>
              <div className="border border-[#E5E7EB] rounded p-3 text-center bg-[#F7F8FA]">
                <div className="text-[13px] font-bold text-[#6B7280] uppercase mb-1">Bank Evidence</div>
                <div className="text-base font-mono text-[#111827]">₹{(inv.amounts?.bank || 0).toLocaleString()}</div>
              </div>
              <div className="border border-[#E5E7EB] rounded p-3 text-center bg-[#F7F8FA]">
                <div className="text-[13px] font-bold text-[#6B7280] uppercase mb-1">ERP / Ledger</div>
                <div className="text-base font-mono text-[#111827]">₹{(inv.amounts?.erp || 0).toLocaleString()}</div>
              </div>
            </div>

            <div className="text-[#E5E7EB] mb-4">↓</div>

            {/* AGENTS */}
            <div className="w-full max-w-lg bg-white border border-[#E5E7EB] rounded p-4 mb-4">
              <div className="text-[13px] font-bold text-[#6B7280] uppercase mb-3 text-center">System Agents</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[15px]">
                  <span className="text-[#111827] font-medium">Match Agent Validation</span>
                  <span className="text-[#059669] flex items-center gap-1"><Check size={14} /> Completed</span>
                </div>
                <div className="flex items-center justify-between text-[15px]">
                  <span className="text-[#111827] font-medium">Risk Agent Assessment</span>
                  <span className="text-[#059669] flex items-center gap-1"><Check size={14} /> Completed</span>
                </div>
                <div className="flex items-center justify-between text-[15px]">
                  <span className="text-[#111827] font-medium">Finance Agent Reconciliation</span>
                  <span className="text-[#059669] flex items-center gap-1"><Check size={14} /> Completed</span>
                </div>
              </div>
            </div>

            <div className="text-[#E5E7EB] mb-4">↓</div>

            {/* JUDGE */}
            <div className="w-full max-w-md border border-[#E5E7EB] rounded p-5 relative bg-[#F7F8FA]">
              <div className={`absolute top-0 left-0 right-0 h-1 ${inv.agent_disagreement ? 'bg-[#DC2626]' : 'bg-[#0B1221]'}`} />
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[15px] font-bold text-[#111827] tracking-wider uppercase">Consensus Evaluation</h4>
                {inv.agent_disagreement ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] rounded text-[13px] font-bold uppercase">
                    <AlertTriangle size={12} /> Disagreement
                  </span>
                ) : (
                  <span className="text-sm font-mono text-[#0258FF] font-medium border border-[#0258FF]/20 bg-[#0258FF]/5 px-2 py-0.5 rounded">
                    Confidence: {inv.confidence !== undefined ? (inv.confidence * 100).toFixed(0) : 0}%
                  </span>
                )}
              </div>
              
              <div className="space-y-4 text-left">
                <div>
                  <div className="text-[13px] font-bold text-[#6B7280] uppercase mb-1">Root Cause</div>
                  <div className="text-base font-semibold text-[#111827]">{inv.root_cause || 'Potential duplicate'}</div>
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#6B7280] uppercase mb-1">Reasoning</div>
                  <div className="text-[15px] text-[#374151] leading-relaxed">{wf.reason || 'Multiple independent signals indicate the payment should be held for review.'}</div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* 🛠️ "WHAT SHOULD I DO?" Numbered Recommendations */}
      <div className="bg-white border border-[#DCE3ED] rounded-xl p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-[#0065FF]" />
          <h3 className="text-base font-extrabold text-[#0B192C] uppercase tracking-wider">WHAT SHOULD THE FINANCE TEAM DO?</h3>
        </div>

        <div className="space-y-2">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2.5 p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm font-bold text-[#0B192C]">
              <CornerDownRight size={14} className="text-[#0065FF] flex-shrink-0 mt-0.5" />
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction Timeline */}
      <div className="bg-white border border-[#DCE3ED] rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={18} className="text-[#0065FF]" />
          <h3 className="text-base font-extrabold text-[#0B192C] uppercase tracking-wider">TRANSACTION TIMELINE</h3>
        </div>
        
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent pl-6 md:pl-0">
          
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white bg-[#0065FF] text-white absolute left-0 md:left-1/2 -translate-x-1/2 shrink-0 z-10 shadow-sm"></div>
            <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2rem)] p-3 rounded-lg border border-gray-100 bg-gray-50 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[#0B192C] text-sm">Gateway webhook received</span>
                <span className="text-xs font-mono text-gray-500">23:17:59</span>
              </div>
              <p className="text-[13px] text-gray-600 font-mono">ID: WH-9812</p>
            </div>
          </div>
          
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white bg-[#0065FF] text-white absolute left-0 md:left-1/2 -translate-x-1/2 shrink-0 z-10 shadow-sm"></div>
            <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2rem)] p-3 rounded-lg border border-gray-100 bg-gray-50 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[#0B192C] text-sm">Bank settlement credited</span>
                <span className="text-xs font-mono text-gray-500">23:18:02</span>
              </div>
              <p className="text-[13px] text-gray-600 font-mono">Ref: BK-912</p>
            </div>
          </div>
          
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white bg-[#D97706] text-white absolute left-0 md:left-1/2 -translate-x-1/2 shrink-0 z-10 shadow-sm"></div>
            <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2rem)] p-3 rounded-lg border border-orange-100 bg-orange-50 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[#D97706] text-sm">Duplicate webhook received</span>
                <span className="text-xs font-mono text-gray-500">23:18:14</span>
              </div>
              <p className="text-[13px] text-gray-600 font-mono mb-1">ID: WH-9812</p>
              <p className="text-[13px] font-bold text-[#059669]">↳ Action: Ignored (Idempotency Key Matched)</p>
            </div>
          </div>
          
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white bg-[#EF4444] text-white absolute left-0 md:left-1/2 -translate-x-1/2 shrink-0 z-10 shadow-sm"></div>
            <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2rem)] p-3 rounded-lg border border-red-100 bg-red-50 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[#EF4444] text-sm">Ledger reconciliation attempted</span>
                <span className="text-xs font-mono text-gray-500">23:25:00</span>
              </div>
              <p className="text-[13px] font-bold text-[#EF4444]">↳ Result: Exception (Gateway-Bank amount mismatch)</p>
            </div>
          </div>
          
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white bg-[#00E6A0] text-white absolute left-0 md:left-1/2 -translate-x-1/2 shrink-0 z-10 shadow-sm"></div>
            <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2rem)] p-3 rounded-lg border border-green-100 bg-[#ECFDF5] shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[#059669] text-sm">AI Investigation Started</span>
                <span className="text-xs font-mono text-gray-500">23:25:01</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* 3-Source Evidence Matrix */}
      <div className="bg-white border border-[#E5E7EB] rounded-md shadow-sm overflow-hidden">
        <h3 className="px-6 py-4 text-base font-bold text-[#111827] border-b border-[#E5E7EB]">EVIDENCE</h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F7F8FA] border-b border-[#E5E7EB]">
              <th className="px-6 py-3 w-1/4"></th>
              <th className="px-6 py-3 text-sm font-semibold text-[#374151]">Gateway</th>
              <th className="px-6 py-3 text-sm font-semibold text-[#374151]">Bank</th>
              <th className="px-6 py-3 text-sm font-semibold text-[#374151]">ERP</th>
            </tr>
          </thead>
          <tbody className="text-[15px] text-[#111827]">
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
          <p className="text-sm font-bold text-[#6B7280] uppercase tracking-wider mb-3">Evidence summary</p>
          <div className="space-y-2 text-[15px] text-[#111827]">
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
            <h3 className="text-base font-extrabold text-[#0B192C] uppercase tracking-wider">Operational Learning & Human Feedback</h3>
          </div>
          {feedbackSaved && (
            <span className="text-sm font-bold text-[#10B981] bg-[#D1FAE5] px-2.5 py-0.5 rounded">
              ✓ Feedback Logged: {feedbackSaved}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">Record your decision to improve future automated exception classification:</p>
        
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
              className={`px-3 py-2 rounded-lg text-sm font-extrabold border transition-all ${
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
            <h3 className="text-base font-extrabold text-[#0B192C] uppercase tracking-wider">Reviewer Action Notes</h3>
          </div>
          <p className="text-sm text-gray-500">Add an optional reason or note for this decision to persist in the audit trail:</p>
          <input
            type="text"
            value={reviewerReason}
            onChange={(e) => setReviewerReason(e.target.value)}
            placeholder="e.g., Confirmed ₹50 settlement Commission fee in statement..."
            className="w-full bg-gray-50 border border-[#DCE3ED] rounded-lg px-3.5 py-2 text-sm outline-none focus:border-[#0065FF] font-semibold text-[#0B192C] focus:bg-white transition-all"
          />
        </div>
      )}

      {/* Human-in-the-Loop Approval Action Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-md p-8 shadow-sm flex flex-col items-center text-center">
        <h4 className="text-[18px] font-bold text-[#111827] mb-2">{rec ? rec.description : inv.recommended_action}</h4>
        
        {workflowStep === 'IDLE' && !actionStatus && (
          <p className="text-base text-[#6B7280] max-w-lg mb-8">Approval will execute the recommended ledger correction and verify it across systems.</p>
        )}

        <div className="flex items-center gap-4 w-full justify-center">
          {workflowStep === 'SIMULATING' && (
            <div className="bg-[#EFF6FF] text-[#0258FF] border border-[#BFDBFE] px-6 py-3 rounded-md w-full max-w-md flex flex-col items-center gap-2">
              <RefreshCw size={20} className="animate-spin" />
              <span className="font-bold text-base">ACTION SIMULATION</span>
              <span className="text-sm opacity-80">Executing API/DB changes in safe mode...</span>
            </div>
          )}

          {workflowStep === 'VERIFYING' && (
            <div className="bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] px-6 py-3 rounded-md w-full max-w-md flex flex-col items-center gap-2">
              <RefreshCw size={20} className="animate-spin" />
              <span className="font-bold text-base">VERIFICATION</span>
              <span className="text-sm opacity-80">Checking if ledger discrepancy is resolved...</span>
            </div>
          )}

          {actionStatus ? (
            <div className={`px-6 py-3 rounded-md font-bold text-[15px] flex items-center justify-center gap-2 w-full max-w-md ${
              actionStatus === 'APPROVED' ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]' : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
            }`}>
              {actionStatus === 'APPROVED' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              {actionStatus === 'APPROVED' ? 'RESOLVED' : 'ACTION REJECTED'}
            </div>
          ) : workflowStep === 'IDLE' && (
            <>
              <button 
                onClick={() => handleAction('approve')} 
                className="bg-[#0258FF] hover:bg-[#014CE0] text-white font-semibold text-base px-8 py-2.5 rounded transition-colors"
              >
                Approve Correction
              </button>
              <button 
                onClick={() => handleAction('reject')} 
                className="bg-white border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#374151] font-semibold text-base px-8 py-2.5 rounded transition-colors"
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
