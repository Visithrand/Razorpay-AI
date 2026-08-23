import { useState, useEffect } from 'react'
import UploadZone from './UploadZone'
import MatchDashboard from './MatchDashboard'
import ConfidenceSlider from './ConfidenceSlider'
import ExceptionTable from './ExceptionTable'
import MatchTable from './MatchTable'
import ChatPanel from './ChatPanel'
import TransactionModal from './TransactionModal'
import { uploadAndMatch, getMatches, getExceptions } from '../api'

export default function ReconciliationApp({ runId, setRunId, report, setReport }) {
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState([])
  const [exceptions, setExceptions] = useState([])
  const [threshold, setThreshold] = useState(0.70)
  const [selectedMatch, setSelectedMatch] = useState(null)

  const handleUpload = async (gw, bank, ledger, thresh) => {
    setLoading(true)
    setThreshold(thresh)
    try {
      const data = await uploadAndMatch(gw, bank, ledger, thresh)
      setRunId(data.run_id)
      setReport(data.report)
      await loadData(data.run_id, thresh)
    } catch (err) {
      alert("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadData = async (rid, thresh) => {
    setLoading(true)
    try {
      const m = await getMatches(rid, thresh)
      const e = await getExceptions(rid)
      setMatches(m)
      setExceptions(e)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (runId) loadData(runId, threshold)
  }, [threshold])

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1f36]">Reconciliation Copilot</h1>
          <p className="text-sm text-[#697386] mt-1">Upload files to automatically reconcile transactions.</p>
        </div>
      </div>

      <UploadZone onResults={handleUpload} loading={loading} />

      {runId && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <MatchDashboard report={report} />
          
          <ConfidenceSlider 
            value={threshold} 
            onChange={setThreshold} 
            matchCount={matches.length}
            exceptionCount={exceptions.length}
            isLoading={loading}
          />
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden flex flex-col h-[600px]">
              <div className="px-5 py-4 border-b border-[#e3e8ef] bg-[#fafbfc]">
                <h3 className="text-sm font-semibold text-[#1a1f36]">Matched Transactions</h3>
              </div>
              <div className="flex-1 overflow-auto custom-scrollbar">
                <MatchTable matches={matches} onRowClick={setSelectedMatch} />
              </div>
            </div>

            <div className="bg-white border border-[#e3e8ef] rounded-xl shadow-sm overflow-hidden flex flex-col h-[600px]">
              <div className="px-5 py-4 border-b border-[#e3e8ef] bg-[#fafbfc]">
                <h3 className="text-sm font-semibold text-[#1a1f36]">Exceptions</h3>
              </div>
              <div className="flex-1 overflow-auto custom-scrollbar">
                <ExceptionTable exceptions={exceptions} />
              </div>
            </div>
          </div>

          <ChatPanel runId={runId} />
        </div>
      )}

      {selectedMatch && (
        <TransactionModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
      )}
    </div>
  )
}
