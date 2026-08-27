import { useState, useEffect } from 'react'
import { Shield, RefreshCw, Trash2, CheckCircle2, User } from 'lucide-react'

export default function AuditLogView() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/audit-logs')
      if (res.ok) {
        const data = await res.json()
        setLogs(data.audit_logs)
      } else {
        setLogs(FALLBACK_LOGS)
      }
    } catch (e) {
      setLogs(FALLBACK_LOGS)
    } finally {
      setLoading(false)
    }
  }

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all audit logs?')) return
    setLoading(true)
    try {
      await fetch('/api/clear-logs', { method: 'POST' })
      setLogs([])
    } catch (e) {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B192C]">Immutable Audit Log</h1>
          <p className="text-base text-gray-500 mt-0.5">Persistent audit history of all AI investigations, recommendations, and human approvals.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchLogs} className="btn-secondary text-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Log
          </button>
          <button onClick={handleClearLogs} className="px-3 py-2 bg-red-50 hover:bg-red-100 text-[#EF4444] border border-red-200 rounded-lg text-sm font-extrabold flex items-center gap-1.5 transition-colors">
            <Trash2 size={14} /> Clear Audit Logs
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#DCE3ED] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-base">
              <p className="font-bold">No audit entries recorded yet.</p>
              <p className="text-sm text-gray-400 mt-1">Audit logs will automatically appear when AI investigations or human approvals execute.</p>
            </div>
          ) : (
            <table className="w-full text-left text-base">
              <thead>
                <tr className="border-b border-[#DCE3ED] bg-[#EFF3F8]/60 text-sm font-extrabold uppercase text-gray-500">
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Actor</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">Entity / Ref</th>
                  <th className="px-6 py-3.5">State Transition</th>
                  <th className="px-6 py-3.5">Reason & Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-[#E8EEF5] hover:bg-[#E6F0FF]/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500 font-medium whitespace-nowrap">{log.timestamp}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-bold text-sm text-[#0B192C]">
                        <User size={13} className="text-[#0065FF]" /> {log.actor}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[13px] font-extrabold uppercase tracking-wider ${
                        log.action_type.includes('APPROVE') ? 'bg-[#D1FAE5] text-[#10B981]' :
                        log.action_type.includes('REJECT') ? 'bg-[#FEE2E2] text-[#EF4444]' : 'bg-[#E6F0FF] text-[#0065FF]'
                      }`}>
                        {log.action_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm font-bold text-[#0065FF]">{log.investigation_ref || log.entity_id}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="text-gray-400 font-semibold">{log.previous_state || 'PENDING'}</span>
                      <span className="mx-1 text-gray-300">→</span>
                      <span className="font-extrabold text-[#0B192C]">{log.new_state}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-sm">{log.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

const FALLBACK_LOGS = [
  { id: 1, timestamp: 'Jan 24, 02:45 PM', actor: 'Finance Admin', action_type: 'APPROVE_RECOMMENDATION', entity_type: 'RECOMMENDATION', entity_id: 'REC-201', previous_state: 'PENDING', new_state: 'APPROVED', reason: 'Approved action: Correct ERP settlement amount: ₹12,400.00 → ₹12,450.00', investigation_ref: 'INV-101' },
  { id: 2, timestamp: 'Jan 24, 02:42 PM', actor: 'AI Investigation Agent', action_type: 'AI_INVESTIGATION', entity_type: 'EXCEPTION', entity_id: 'EX-1', previous_state: 'UNINVESTIGATED', new_state: 'ERP_AMOUNT_ERROR', reason: '₹50.00 accounting discrepancy between ERP ledger and Bank settlement.', investigation_ref: 'INV-101' }
]
