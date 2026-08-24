import { useState, useEffect } from 'react'
import UploadZone from './UploadZone'
import MatchDashboard from './MatchDashboard'
import ConfidenceSlider from './ConfidenceSlider'
import ExceptionTable from './ExceptionTable'
import MatchTable from './MatchTable'
import ChatPanel from './ChatPanel'
import TransactionModal from './TransactionModal'
import { uploadAndMatch, runDemoReconciliation, getMatches, getExceptions, rematch } from '../api'

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

  const handleRunDemo = async () => {
    setLoading(true)
    try {
      const data = await runDemoReconciliation(threshold)
      setRunId(data.run_id)
      setReport(data)
      await loadData(data.run_id, threshold)
    } catch (err) {
      alert("Demo run error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleThresholdChange = async (newThresh) => {
    setThreshold(newThresh)
    if (!runId) return
    setLoading(true)
    try {
      const res = await rematch(runId, newThresh)
      setReport(res)
      await loadData(runId, newThresh)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadData = async (rid, thresh) => {
    setLoading(true)
    try {
      const m = await getMatches(rid, thresh)
      const e = await getExceptions(rid)
      setMatches(m.matches || [])
      setExceptions(e.exceptions || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (runId) loadData(runId, threshold)
  }, [runId])

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B192C]">Reconciliation Copilot</h1>
          <p className="text-[14px] text-[#4A5568] mt-0.5">AI-powered 3-way matching engine for gateway, bank, and ledger records.</p>
        </div>
      </div>

      <UploadZone onResults={handleUpload} onRunDemo={handleRunDemo} loading={loading} />

      {runId && (
        <div className="space-y-6">
          <MatchDashboard report={report} />
          
          <ConfidenceSlider 
            value={threshold} 
            onChange={handleThresholdChange} 
            matchCount={matches.length}
            exceptionCount={exceptions.length}
            isLoading={loading}
          />
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white border border-[#DCE3ED] rounded-xl overflow-hidden flex flex-col h-[600px] shadow-sm">
              <div className="px-6 py-4 border-b border-[#DCE3ED] bg-[#EFF3F8]/60 flex items-center justify-between">
                <h3 className="text-[15px] font-extrabold text-[#0B192C]">Matched Transactions</h3>
                <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-[#D1FAE5] text-[#10B981]">{matches.length} matches</span>
              </div>
              <div className="flex-1 overflow-auto custom-scrollbar">
                <MatchTable matches={matches} onRowClick={setSelectedMatch} />
              </div>
            </div>

            <div className="bg-white border border-[#DCE3ED] rounded-xl overflow-hidden flex flex-col h-[600px] shadow-sm">
              <div className="px-6 py-4 border-b border-[#DCE3ED] bg-[#EFF3F8]/60 flex items-center justify-between">
                <h3 className="text-[15px] font-extrabold text-[#0B192C]">Exceptions & Anomalies</h3>
                <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-[#FEE2E2] text-[#EF4444]">{exceptions.length} exceptions</span>
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
