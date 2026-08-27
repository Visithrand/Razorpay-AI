import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts'
import { UploadCloud, CheckCircle2, AlertTriangle, ArrowRight, Activity, ServerCrash } from 'lucide-react'

export default function ExecutiveDashboard({ onNavigate }) {
  const [metrics, setMetrics] = useState(null)
  const [graphData, setGraphData] = useState([])
  const [exceptions, setExceptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Ingestion State
  const [uploadStatus, setUploadStatus] = useState('idle') // idle, uploading, processing, complete, error
  const [uploadProgress, setUploadProgress] = useState([])

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, eventsRes, exceptionsRes] = await Promise.all([
        fetch('/api/dashboard/metrics'),
        fetch('/api/events/recent?limit=30'),
        fetch('/api/exceptions?limit=5')
      ])

      if (!metricsRes.ok || !eventsRes.ok || !exceptionsRes.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const metricsData = await metricsRes.json()
      const eventsData = await eventsRes.json()
      const exceptionsData = await exceptionsRes.json()

      setMetrics(metricsData)
      setGraphData(eventsData.data)
      setExceptions(exceptionsData.exceptions || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    // Poll for live graph updates every 3 seconds
    const interval = setInterval(fetchDashboardData, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleSimulateUpload = () => {
    setUploadStatus('processing')
    setUploadProgress(['Validating Gateway file'])
    
    setTimeout(() => setUploadProgress(p => [...p, 'Validating Bank file']), 800)
    setTimeout(() => setUploadProgress(p => [...p, 'Validating Ledger file']), 1600)
    setTimeout(() => setUploadProgress(p => [...p, 'Normalizing transactions']), 2400)
    setTimeout(() => setUploadProgress(p => [...p, 'Building reconciliation index']), 3200)
    setTimeout(() => {
      setUploadProgress(p => [...p, 'Ready for reconciliation'])
      setUploadStatus('complete')
    }, 4000)
  }

  if (loading && !metrics) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-[#6B7280]">
        <Activity className="animate-spin mr-2" size={20} /> Loading Executive Dashboard...
      </div>
    )
  }

  if (error && !metrics) {
    return (
      <div className="flex-1 p-8">
        <div className="bg-[#FEF2F2] border border-[#F87171] rounded-md p-6 flex items-center gap-4 text-[#B91C1C]">
          <ServerCrash size={24} />
          <div>
            <h3 className="font-bold text-[16px]">Backend unavailable</h3>
            <p className="text-base">Unable to retrieve settlement data.</p>
            <button onClick={fetchDashboardData} className="mt-3 text-base font-bold underline">Retry connection</button>
          </div>
        </div>
      </div>
    )
  }

  const kpis = metrics || { total_volume: 0, matched_amount: 0, at_risk_amount: 0, open_exceptions: 0, high_priority_exceptions: 0 }
  const ce = metrics?.control_effectiveness || {}
  const lastRun = metrics?.last_run

  return (
    <div className="flex-1 bg-[#F7F8FA] overflow-y-auto p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5E7EB] pb-4">
          <div>
            <h1 className="text-[24px] font-semibold text-[#111827]">Financial Control Center</h1>
            <p className="text-base text-[#6B7280]">Continuous payment monitoring and financial exposure</p>
          </div>
          <div className="flex gap-8 text-[15px] text-[#374151]">
            <div>
              <p className="font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Monitoring</p>
              <p className="font-bold text-[#059669] flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" /> LIVE</p>
            </div>
          </div>
        </div>

        {/* Phase 12: Cash Position View */}
        <div className="bg-[#0B1221] rounded-xl p-6 text-white shadow-md">
          <h2 className="text-base font-bold uppercase tracking-wider text-[#9CA3AF] mb-4">Live Cash Position (Estimate)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-[#6B7280] uppercase tracking-wider mb-1">Expected Settlement</p>
              <p className="text-[28px] font-bold">₹{kpis.total_volume.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B7280] uppercase tracking-wider mb-1">Received (Matched)</p>
              <p className="text-[28px] font-bold text-[#059669]">₹{kpis.matched_amount.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B7280] uppercase tracking-wider mb-1">Pending Processing</p>
              <p className="text-[28px] font-bold text-[#F59E0B]">₹{(kpis.total_volume - kpis.matched_amount - kpis.at_risk_amount).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B7280] uppercase tracking-wider mb-1">Amount at Risk</p>
              <p className="text-[28px] font-bold text-[#EF4444]">₹{kpis.at_risk_amount.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        {/* KPI Row (Phase 11: Financial Exposure) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E5E7EB] rounded-md p-5 shadow-sm">
            <p className="text-[15px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Total Volume</p>
            <p className="text-[24px] font-bold text-[#111827]">₹{kpis.total_volume.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-md p-5 shadow-sm">
            <p className="text-[15px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Matched Amount</p>
            <p className="text-[24px] font-bold text-[#059669]">₹{kpis.matched_amount.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-md p-5 shadow-sm border-l-4 border-l-[#D97706]">
            <p className="text-[15px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Open Exceptions</p>
            <p className="text-[24px] font-bold text-[#111827]">{kpis.open_exceptions}</p>
          </div>
          <div className="bg-[#FEF2F2] border border-[#F87171] rounded-md p-5 shadow-sm border-l-4 border-l-[#DC2626]">
            <p className="text-[15px] font-semibold text-[#DC2626] uppercase tracking-wider mb-1">High Priority</p>
            <p className="text-[24px] font-bold text-[#DC2626]">{kpis.high_priority_exceptions}</p>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Graph & Exceptions */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Transaction & Risk Activity Graph */}
            <div className="bg-white border border-[#E5E7EB] rounded-md shadow-sm p-6">
              <h3 className="text-base font-bold text-[#111827] mb-4 uppercase tracking-wider">Transaction & Risk Activity</h3>
              {graphData.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-[#6B7280] text-[15px]">
                  No recent payment events
                </div>
              ) : (
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={graphData}>
                      <XAxis dataKey="time" hide />
                      <YAxis domain={[0, 100]} tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111827', color: '#fff', fontSize: '12px', border: 'none', borderRadius: '4px' }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ display: 'none' }}
                      />
                      <Line type="monotone" dataKey="risk" stroke="#0258FF" strokeWidth={2} dot={false} isAnimationActive={false} />
                      {graphData.map((entry, index) => (
                        entry.is_anomaly === 1 && (
                          <ReferenceDot key={`anomaly-${index}`} x={entry.time} y={entry.risk} r={4} fill="#DC2626" stroke="none" />
                        )
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Recent Exceptions Table */}
            <div className="bg-white border border-[#E5E7EB] rounded-md shadow-sm overflow-hidden">
              <h3 className="px-6 py-4 text-base font-bold text-[#111827] border-b border-[#E5E7EB] uppercase tracking-wider">Recent Exceptions</h3>
              {exceptions.length === 0 ? (
                <div className="p-6 text-center text-[#6B7280] text-[15px]">No pending exceptions require attention.</div>
              ) : (
                <table className="w-full text-left text-[15px]">
                  <thead>
                    <tr className="bg-[#F7F8FA] border-b border-[#E5E7EB] text-[#6B7280]">
                      <th className="px-6 py-3 font-semibold">Transaction</th>
                      <th className="px-6 py-3 font-semibold">Category</th>
                      <th className="px-6 py-3 font-semibold">Amount</th>
                      <th className="px-6 py-3 font-semibold">Risk</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exceptions.map(exc => (
                      <tr key={exc.id} className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB]">
                        <td className="px-6 py-3 font-mono text-[#0258FF]">{exc.utr !== '—' ? exc.utr : `TXN-${exc.id}`}</td>
                        <td className="px-6 py-3 text-[#374151]">{exc.category.replace(/_/g, ' ')}</td>
                        <td className="px-6 py-3 font-mono text-[#111827]">₹{exc.amount?.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-0.5 rounded text-[13px] font-bold ${
                            exc.priority === 'CRITICAL' ? 'bg-[#FEF2F2] text-[#DC2626]' :
                            exc.priority === 'HIGH' ? 'bg-[#FFFBEB] text-[#D97706]' : 'bg-[#F3F4F6] text-[#374151]'
                          }`}>
                            {exc.priority}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-[#D97706] font-semibold">{exc.status}</td>
                        <td className="px-6 py-3">
                          <button onClick={() => onNavigate('investigation', exc.id)} className="text-[#0258FF] font-semibold hover:underline">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
          </div>

          {/* Right Column: Ingestion & Control Effectiveness */}
          <div className="space-y-6">
            
            {/* Ingest Settlement Data */}
            <div className="bg-white border border-[#E5E7EB] rounded-md shadow-sm p-6">
              <h3 className="text-base font-bold text-[#111827] uppercase tracking-wider mb-1">Ingest Settlement Data</h3>
              <p className="text-sm text-[#6B7280] mb-5">Upload Gateway, Bank and ERP records to begin reconciliation.</p>
              
              {uploadStatus === 'idle' && (
                <div 
                  className="border-2 border-dashed border-[#DCE3ED] rounded-md p-6 text-center hover:bg-[#F9FAFB] hover:border-[#0258FF] transition-colors cursor-pointer"
                  onClick={handleSimulateUpload}
                >
                  <UploadCloud className="mx-auto mb-2 text-[#9CA3AF]" size={24} />
                  <p className="text-[15px] font-semibold text-[#374151] mb-1">Drop CSV / XLSX files here</p>
                  <p className="text-sm text-[#6B7280] mb-4">or click to select files</p>
                  <div className="flex justify-center gap-3 text-[13px] font-semibold text-[#6B7280] uppercase tracking-wider">
                    <span>Gateway</span> • <span>Bank</span> • <span>ERP</span>
                  </div>
                </div>
              )}

              {uploadStatus === 'processing' && (
                <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-md p-4">
                  <p className="text-[15px] font-bold text-[#111827] mb-3">Processing financial records...</p>
                  <div className="space-y-2 text-sm text-[#374151]">
                    {uploadProgress.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {idx === uploadProgress.length - 1 ? (
                          <span className="w-4 h-4 rounded-full border-2 border-[#0258FF] border-t-transparent animate-spin" />
                        ) : (
                          <CheckCircle2 size={16} className="text-[#059669]" />
                        )}
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadStatus === 'complete' && (
                <div className="space-y-4">
                  <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-md p-4">
                    <p className="text-[13px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">Ingestion Status</p>
                    <div className="space-y-2 text-[15px] font-medium text-[#111827]">
                      <div className="flex justify-between items-center">
                        <span>Gateway</span>
                        <span className="flex items-center gap-1.5 text-[#059669]"><CheckCircle2 size={14} /> 294 records</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Bank</span>
                        <span className="flex items-center gap-1.5 text-[#059669]"><CheckCircle2 size={14} /> 284 records</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>ERP / Ledger</span>
                        <span className="flex items-center gap-1.5 text-[#059669]"><CheckCircle2 size={14} /> 284 records</span>
                      </div>
                    </div>
                  </div>

                  {/* Data Quality Warning */}
                  <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-md p-4">
                    <div className="flex items-center gap-2 text-[#D97706] mb-2">
                      <AlertTriangle size={16} />
                      <p className="text-[15px] font-bold">Data Quality Issues</p>
                    </div>
                    <p className="text-sm text-[#92400E] mb-2">Gateway.csv: 5 records require attention</p>
                    <ul className="text-[13px] text-[#B45309] list-disc list-inside">
                      <li>3 missing UTR</li>
                      <li>2 invalid timestamps</li>
                    </ul>
                    <button className="mt-2 text-[13px] font-bold text-[#D97706] underline">View Issues</button>
                  </div>

                  <button className="w-full bg-[#0258FF] text-white py-2.5 rounded text-[15px] font-semibold hover:bg-[#014CE0] transition-colors">
                    Run Reconciliation
                  </button>
                </div>
              )}
            </div>

            {/* Control Effectiveness */}
            <div className="bg-white border border-[#E5E7EB] rounded-md shadow-sm p-6">
              <h3 className="text-base font-bold text-[#111827] uppercase tracking-wider mb-4">Control Effectiveness</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[20px] font-bold text-[#111827] leading-none">{ce.monitored?.toLocaleString() || 0}</p>
                  <p className="text-sm font-medium text-[#6B7280]">Events monitored</p>
                </div>
                
                <div className="h-px bg-[#E5E7EB] w-full" />
                
                <div className="grid grid-cols-2 gap-y-4 text-[15px]">
                  <div>
                    <p className="font-bold text-[#111827]">{ce.normal?.toLocaleString() || 0}</p>
                    <p className="text-[#6B7280]">Normal</p>
                  </div>
                  <div>
                    <p className="font-bold text-[#D97706]">{ce.anomalies_detected?.toLocaleString() || 0}</p>
                    <p className="text-[#6B7280]">Anomalies detected</p>
                  </div>
                  <div>
                    <p className="font-bold text-[#DC2626]">{ce.exceptions_created?.toLocaleString() || 0}</p>
                    <p className="text-[#6B7280]">Exceptions created</p>
                  </div>
                  <div>
                    <p className="font-bold text-[#059669]">{ce.resolved?.toLocaleString() || 0}</p>
                    <p className="text-[#6B7280]">Resolved automatically</p>
                  </div>
                </div>
                
                <div className="bg-[#F3F4F6] rounded-md p-3 flex justify-between items-center mt-2 border border-[#E5E7EB]">
                  <span className="text-[15px] font-bold text-[#374151]">Human review</span>
                  <span className="text-[16px] font-bold text-[#111827]">{ce.human_review?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>

            {/* Last Reconciliation Run */}
            {lastRun && (
              <div className="bg-white border border-[#E5E7EB] rounded-md shadow-sm p-6">
                <h3 className="text-sm font-bold text-[#6B7280] uppercase tracking-wider mb-4">Last Reconciliation</h3>
                <div className="text-[15px] text-[#374151] space-y-1 mb-4">
                  <p className="font-semibold text-[#111827] mb-2">{new Date(lastRun.run_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  <p>{lastRun.transactions?.toLocaleString()} transactions</p>
                  <p>{lastRun.matched?.toLocaleString()} matched</p>
                  <p>{lastRun.unresolved?.toLocaleString()} unresolved</p>
                  <p className="font-semibold text-[#059669]">{(lastRun.match_rate * 100).toFixed(1)}% match rate</p>
                </div>
                <button className="text-[15px] font-semibold text-[#0258FF] flex items-center gap-1 hover:underline">
                  View Run <ArrowRight size={14} />
                </button>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  )
}
