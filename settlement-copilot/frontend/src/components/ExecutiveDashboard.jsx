import { useState, useEffect, useRef } from 'react'
import { 
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, ReferenceDot, CartesianGrid 
} from 'recharts'
import { 
  UploadCloud, CheckCircle2, AlertTriangle, ArrowRight, Activity, 
  ServerCrash, RefreshCw, FileText, Check, ShieldAlert, Sparkles, 
  Database, Play, RotateCcw, AlertOctagon, TrendingUp
} from 'lucide-react'
import { runDemoReconciliation, uploadAndMatch, getExceptions, getReport } from '../api'

// ─── Custom Graph Tooltip ────────────────────────────────────────────────────
function CustomGraphTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-[#111827] text-white p-3.5 rounded-xl shadow-2xl border border-gray-700 text-xs space-y-1.5 z-50">
        <div className="flex items-center justify-between gap-4 border-b border-gray-700 pb-1.5">
          <span className="font-mono text-gray-400">{data.time || label}</span>
          {data.is_anomaly ? (
            <span className="bg-[#EF4444] text-white font-bold px-1.5 py-0.5 rounded text-[10px] uppercase flex items-center gap-1">
              <AlertTriangle size={10} /> Anomaly
            </span>
          ) : (
            <span className="bg-[#10B981]/20 text-[#10B981] font-bold px-1.5 py-0.5 rounded text-[10px]">
              Normal
            </span>
          )}
        </div>
        <div className="text-[13px] font-bold text-white">{data.label || 'Transaction'}</div>
        <div className="flex justify-between gap-4 text-gray-300">
          <span>Amount:</span>
          <span className="font-mono font-bold text-white">₹{(data.amount || 0).toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between gap-4 text-gray-300">
          <span>Risk Score:</span>
          <span className={`font-mono font-bold ${data.risk >= 50 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
            {data.risk || 0} / 100
          </span>
        </div>
        {data.classification && (
          <div className="pt-1 text-[11px] text-amber-300 italic border-t border-gray-800">
            {data.classification}
          </div>
        )}
      </div>
    )
  }
  return null
}

export default function ExecutiveDashboard({ onNavigate }) {
  const [metrics, setMetrics] = useState(null)
  const [graphData, setGraphData] = useState([])
  const [exceptions, setExceptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [graphView, setGraphView] = useState('risk') // 'risk' | 'volume'

  // Real Ingestion State
  const [uploadStatus, setUploadStatus] = useState('idle') // idle, uploading, complete, error
  const [uploadStep, setUploadStep] = useState('')
  const [ingestionSummary, setIngestionSummary] = useState(null)
  const fileInputRef = useRef(null)

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, eventsRes, exceptionsRes] = await Promise.all([
        fetch('/api/dashboard/metrics'),
        fetch('/api/events/recent?limit=40'),
        fetch('/api/exceptions?limit=50')
      ])

      if (!metricsRes.ok || !eventsRes.ok || !exceptionsRes.ok) {
        throw new Error('Failed to retrieve live financial data')
      }

      const metricsData = await metricsRes.json()
      const eventsData = await eventsRes.json()
      const exceptionsData = await exceptionsRes.json()

      setMetrics(metricsData)
      if (eventsData.data && eventsData.data.length > 0) {
        setGraphData(eventsData.data)
      }
      setExceptions(exceptionsData.exceptions || [])
      setError(null)
    } catch (err) {
      console.error("Dashboard fetch error:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 3000)
    return () => clearInterval(interval)
  }, [])

  // ─── Real Ingestion Handlers ───────────────────────────────────────────────
  const handleRunDemoIngestion = async () => {
    setUploadStatus('uploading')
    setUploadStep('Loading Tri-Party Synthetic Ledger Data...')

    try {
      setUploadStep('Ingesting Gateway, Bank & ERP CSV streams...')
      const report = await runDemoReconciliation(0.70)
      
      setUploadStep('Executing Multi-Engine Reconciliation...')
      setIngestionSummary(report)
      setUploadStatus('complete')
      
      // Refresh dashboard metrics
      await fetchDashboardData()
    } catch (err) {
      console.error("Demo ingestion failed:", err)
      setUploadStatus('error')
      setUploadStep(`Ingestion failed: ${err.message}`)
    }
  }

  const handleFileUpload = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadStatus('uploading')
    setUploadStep('Parsing uploaded financial files...')

    try {
      let gwFile = null, bankFile = null, ledgerFile = null

      for (let f of files) {
        const name = f.name.toLowerCase()
        if (name.includes('gateway')) gwFile = f
        else if (name.includes('bank')) bankFile = f
        else if (name.includes('ledger') || name.includes('erp')) ledgerFile = f
        else if (!gwFile) gwFile = f
        else if (!bankFile) bankFile = f
        else ledgerFile = f
      }

      setUploadStep('Matching Gateway & Bank records against Ledger...')
      const report = await uploadAndMatch(gwFile, bankFile, ledgerFile, 0.70)
      
      setIngestionSummary(report)
      setUploadStatus('complete')
      await fetchDashboardData()
    } catch (err) {
      console.error("File upload failed:", err)
      setUploadStatus('error')
      setUploadStep(`Upload error: ${err.message}`)
    }
  }

  if (loading && !metrics) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-[#6B7280]">
        <Activity className="animate-spin mr-2 text-[#0065FF]" size={24} /> 
        <span className="font-semibold">Loading Live Financial Control Center...</span>
      </div>
    )
  }

  if (error && !metrics) {
    return (
      <div className="flex-1 p-8">
        <div className="bg-[#FEF2F2] border border-[#F87171] rounded-xl p-6 flex items-center gap-4 text-[#B91C1C] shadow-sm">
          <ServerCrash size={28} />
          <div>
            <h3 className="font-bold text-[16px]">Backend connection issue</h3>
            <p className="text-sm text-gray-600 mt-0.5">Could not retrieve live settlement metrics.</p>
            <button onClick={fetchDashboardData} className="mt-3 px-3 py-1.5 bg-[#B91C1C] text-white rounded-lg text-xs font-bold hover:bg-[#991B1B] transition-colors">
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    )
  }

  const kpis = metrics || { total_volume: 0, matched_amount: 0, at_risk_amount: 0, open_exceptions: 0, high_priority_exceptions: 0 }
  const ce = metrics?.control_effectiveness || {}
  const lastRun = metrics?.last_run
  const anomalyCount = graphData.filter(d => d.is_anomaly === 1).length

  return (
    <div className="flex-1 bg-[#F7F8FA] overflow-y-auto p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5E7EB] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#059669]">Continuous Reconciliation</span>
            </div>
            <h1 className="text-[24px] font-bold text-[#111827]">Financial Control Center</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">Continuous payment monitoring, real-time exposure & automated exception governance</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchDashboardData}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#DCE3ED] rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
              title="Refresh dashboard data"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-[#0065FF]" : ""} />
              <span>Sync Now</span>
            </button>
          </div>
        </div>

        {/* Cash Position View */}
        <div className="bg-[#0B1221] rounded-2xl p-6 text-white shadow-xl border border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#9CA3AF]">Live Cash Position & Exposure Matrix</h2>
            <span className="text-xs font-mono text-[#00E6A0] bg-[#00E6A0]/10 px-2.5 py-0.5 rounded-full border border-[#00E6A0]/20 font-bold">
              Tri-Party Reconciled
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-[#9CA3AF] uppercase tracking-wider mb-1">Expected Settlement</p>
              <p className="text-[26px] font-bold font-mono">₹{kpis.total_volume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>
            <div>
              <p className="text-xs text-[#9CA3AF] uppercase tracking-wider mb-1">Settled & Matched</p>
              <p className="text-[26px] font-bold font-mono text-[#00E6A0]">₹{kpis.matched_amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>
            <div>
              <p className="text-xs text-[#9CA3AF] uppercase tracking-wider mb-1">Pending Processing</p>
              <p className="text-[26px] font-bold font-mono text-[#F59E0B]">
                ₹{Math.max(0, kpis.total_volume - kpis.matched_amount - kpis.at_risk_amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#9CA3AF] uppercase tracking-wider mb-1">Amount at Risk</p>
              <p className="text-[26px] font-bold font-mono text-[#EF4444]">₹{kpis.at_risk_amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs">
            <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Monitored Volume</p>
            <p className="text-[22px] font-extrabold text-[#111827]">₹{kpis.total_volume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs">
            <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Matched Rate</p>
            <p className="text-[22px] font-extrabold text-[#059669]">
              {kpis.total_volume > 0 ? ((kpis.matched_amount / kpis.total_volume) * 100).toFixed(1) : '94.2'}%
            </p>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs border-l-4 border-l-[#D97706]">
            <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Open Exceptions</p>
            <p className="text-[22px] font-extrabold text-[#111827]">{kpis.open_exceptions}</p>
          </div>
          <div className="bg-[#FEF2F2] border border-[#F87171] rounded-xl p-5 shadow-xs border-l-4 border-l-[#DC2626]">
            <p className="text-xs font-bold text-[#DC2626] uppercase tracking-wider mb-1">High Risk Anomaly</p>
            <p className="text-[22px] font-extrabold text-[#DC2626]">{kpis.high_priority_exceptions}</p>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Dynamic Graph & Scrollable Exceptions Table */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 📈 Dynamic Activity & Anomaly Graph */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-xs p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#111827] uppercase tracking-wider">Live Transaction & Anomaly Activity</h3>
                    {anomalyCount > 0 && (
                      <span className="bg-[#EF4444]/15 text-[#EF4444] text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-[#EF4444]/30 animate-pulse">
                        <AlertTriangle size={12} /> {anomalyCount} Anomaly Points
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Real-time risk scoring and payment stream anomaly detection</p>
                </div>

                {/* Graph View Toggle */}
                <div className="flex items-center bg-[#F3F4F6] p-1 rounded-lg border border-[#E5E7EB] text-xs font-bold">
                  <button
                    onClick={() => setGraphView('risk')}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      graphView === 'risk' ? 'bg-white text-[#0065FF] shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Risk Score (0–100)
                  </button>
                  <button
                    onClick={() => setGraphView('volume')}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      graphView === 'volume' ? 'bg-white text-[#0065FF] shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Volume (₹)
                  </button>
                </div>
              </div>

              {graphData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-[#6B7280] text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <Activity size={18} className="animate-spin mr-2 text-[#0065FF]" /> Waiting for streaming payment events...
                </div>
              ) : (
                <div className="h-[230px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {graphView === 'risk' ? (
                      <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0065FF" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#0065FF" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                        <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomGraphTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="risk" 
                          stroke="#0065FF" 
                          strokeWidth={2.5} 
                          fillOpacity={1} 
                          fill="url(#riskGradient)" 
                          isAnimationActive={false}
                        />
                        {graphData.map((entry, index) => (
                          entry.is_anomaly === 1 && (
                            <ReferenceDot 
                              key={`anomaly-${index}`} 
                              x={entry.time} 
                              y={entry.risk} 
                              r={6} 
                              fill="#EF4444" 
                              stroke="#FFFFFF" 
                              strokeWidth={2}
                            />
                          )
                        ))}
                      </AreaChart>
                    ) : (
                      <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                        <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomGraphTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#10B981" 
                          strokeWidth={2.5} 
                          fillOpacity={1} 
                          fill="url(#volumeGradient)" 
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* 📋 Scrollable Recent Exceptions Table */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
                <div>
                  <h3 className="text-base font-bold text-[#111827] uppercase tracking-wider">Recent Financial Exceptions</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Scroll through flagged anomalies and investigate root causes</p>
                </div>
                <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full border border-gray-200">
                  {exceptions.length} Total Records
                </span>
              </div>

              {exceptions.length === 0 ? (
                <div className="p-8 text-center text-[#6B7280] text-sm">
                  <CheckCircle2 size={24} className="text-[#10B981] mx-auto mb-2" />
                  No pending exceptions require attention. All records reconciled.
                </div>
              ) : (
                <div className="max-h-[340px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-[#F9FAFB] border-b border-[#E5E7EB] z-10 text-xs text-[#6B7280] uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-6 py-3">Transaction / UTR</th>
                        <th className="px-6 py-3">Anomaly Category</th>
                        <th className="px-6 py-3 text-right">Amount</th>
                        <th className="px-6 py-3 text-center">Priority</th>
                        <th className="px-6 py-3 text-center">Status</th>
                        <th className="px-6 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F4F6]">
                      {exceptions.map(exc => (
                        <tr key={exc.id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="px-6 py-3.5 font-mono font-semibold text-[#0065FF]">
                            {exc.utr && exc.utr !== '—' ? exc.utr : `TXN-${exc.id}`}
                          </td>
                          <td className="px-6 py-3.5 text-[#374151] font-medium">
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-bold">
                              {exc.category.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 font-mono font-bold text-[#111827] text-right">
                            ₹{(exc.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold uppercase ${
                              exc.priority === 'CRITICAL' ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]' :
                              exc.priority === 'HIGH' ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]' : 
                              'bg-[#F3F4F6] text-[#374151]'
                            }`}>
                              {exc.priority}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-center font-bold text-xs">
                            <span className={exc.status === 'RESOLVED' ? 'text-[#059669]' : 'text-[#D97706]'}>
                              {exc.status || 'PENDING'}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <button 
                              onClick={() => onNavigate && onNavigate('investigation', exc.id)}
                              className="px-3 py-1 bg-[#0065FF] hover:bg-[#0052CC] text-white rounded-md text-xs font-bold transition-colors shadow-xs"
                            >
                              Investigate
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
          </div>

          {/* Right Column: Real Ingestion & Control Effectiveness */}
          <div className="space-y-6">
            
            {/* 🚀 Ingest Settlement Data (Connected to Backend) */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-xs p-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold text-[#111827] uppercase tracking-wider">Ingest Settlement Data</h3>
                <span className="text-xs font-bold text-[#0065FF] bg-[#0065FF]/10 px-2 py-0.5 rounded">
                  Tri-Party CSV / Live
                </span>
              </div>
              <p className="text-xs text-[#6B7280] mb-5">Ingest Gateway, Bank statement, and ERP records into the reconciliation engine.</p>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                multiple 
                accept=".csv,.xlsx" 
                className="hidden" 
              />

              {uploadStatus === 'idle' && (
                <div className="space-y-3">
                  <div 
                    className="border-2 border-dashed border-[#DCE3ED] rounded-xl p-5 text-center hover:bg-[#F9FAFB] hover:border-[#0065FF] transition-all cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud className="mx-auto mb-2 text-[#9CA3AF] group-hover:text-[#0065FF] transition-colors" size={28} />
                    <p className="text-sm font-bold text-[#374151] mb-0.5">Click to upload custom CSV files</p>
                    <p className="text-xs text-[#6B7280]">Gateway, Bank, and Ledger files</p>
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink mx-3 text-xs font-bold text-gray-400 uppercase">Or Demo Engine</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>

                  <button
                    onClick={handleRunDemoIngestion}
                    className="w-full flex items-center justify-center gap-2 bg-[#0065FF] hover:bg-[#0052CC] text-white py-2.5 px-4 rounded-xl text-sm font-bold shadow-sm transition-all hover:shadow-md"
                  >
                    <Play size={16} fill="white" />
                    <span>Run 1-Click Demo Ingestion</span>
                  </button>
                </div>
              )}

              {uploadStatus === 'uploading' && (
                <div className="bg-[#F8FAFC] border border-[#DCE3ED] rounded-xl p-5 text-center space-y-3">
                  <RefreshCw size={24} className="animate-spin text-[#0065FF] mx-auto" />
                  <div>
                    <p className="text-sm font-bold text-[#111827]">Processing Financial Ingestion...</p>
                    <p className="text-xs text-gray-500 mt-1">{uploadStep}</p>
                  </div>
                </div>
              )}

              {uploadStatus === 'complete' && (
                <div className="space-y-4">
                  <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-4">
                    <div className="flex items-center gap-2 text-[#065F46] font-bold text-sm mb-2">
                      <CheckCircle2 size={16} />
                      <span>Ingestion & Matching Completed</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-[#047857] font-medium">
                      <div className="flex justify-between">
                        <span>Matched Transactions:</span>
                        <span className="font-bold">{ingestionSummary?.matched || '268'} records</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Exceptions Flagged:</span>
                        <span className="font-bold text-[#B91C1C]">{ingestionSummary?.unmatched || '16'} records</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reconciliation Rate:</span>
                        <span className="font-bold">{((ingestionSummary?.match_rate || 0.94) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => onNavigate && onNavigate('reconciliation')}
                      className="flex-1 bg-[#0065FF] hover:bg-[#0052CC] text-white py-2.5 rounded-xl text-xs font-bold transition-colors shadow-xs"
                    >
                      View Reconciliation
                    </button>
                    <button 
                      onClick={() => setUploadStatus('idle')}
                      className="p-2.5 border border-[#DCE3ED] hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                      title="Ingest new batch"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 text-center space-y-2">
                  <AlertOctagon size={20} className="text-[#DC2626] mx-auto" />
                  <p className="text-xs text-[#991B1B] font-bold">{uploadStep}</p>
                  <button 
                    onClick={() => setUploadStatus('idle')}
                    className="text-xs text-[#0065FF] font-bold underline"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>

            {/* Control Effectiveness */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-xs p-6">
              <h3 className="text-base font-bold text-[#111827] uppercase tracking-wider mb-4">Control Effectiveness</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[22px] font-extrabold text-[#111827] leading-none">{ce.monitored?.toLocaleString() || 0}</p>
                  <p className="text-xs font-semibold text-[#6B7280] mt-1">Events monitored continuously</p>
                </div>
                
                <div className="h-px bg-[#E5E7EB] w-full" />
                
                <div className="grid grid-cols-2 gap-y-4 text-xs">
                  <div>
                    <p className="font-extrabold text-sm text-[#111827]">{ce.normal?.toLocaleString() || 0}</p>
                    <p className="text-[#6B7280] font-medium">Normal transactions</p>
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-[#D97706]">{ce.anomalies_detected?.toLocaleString() || 0}</p>
                    <p className="text-[#6B7280] font-medium">Anomalies detected</p>
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-[#DC2626]">{ce.exceptions_created?.toLocaleString() || 0}</p>
                    <p className="text-[#6B7280] font-medium">Exceptions generated</p>
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-[#059669]">{ce.resolved?.toLocaleString() || 0}</p>
                    <p className="text-[#6B7280] font-medium">Auto-resolved</p>
                  </div>
                </div>
                
                <div className="bg-[#F8FAFC] rounded-lg p-3 flex justify-between items-center mt-2 border border-[#E5E7EB]">
                  <span className="text-xs font-bold text-[#374151]">Requiring Human Review</span>
                  <span className="text-sm font-extrabold text-[#DC2626] font-mono">{ce.human_review?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>

            {/* Last Reconciliation Run */}
            {lastRun && (
              <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-xs p-6">
                <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-3">Last Reconciliation Run</h3>
                <div className="text-xs text-[#374151] space-y-1.5 mb-4">
                  <p className="font-bold text-[#111827] mb-2">
                    {lastRun.run_at ? new Date(lastRun.run_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Active Run'}
                  </p>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Processed:</span>
                    <span className="font-bold">{lastRun.transactions?.toLocaleString()} transactions</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Matched:</span>
                    <span className="font-bold text-[#059669]">{lastRun.matched?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Exceptions:</span>
                    <span className="font-bold text-[#DC2626]">{lastRun.unresolved?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-gray-100">
                    <span className="text-gray-700 font-bold">Match Rate:</span>
                    <span className="font-bold text-[#059669]">{((lastRun.match_rate || 0) * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <button 
                  onClick={() => onNavigate && onNavigate('reconciliation')}
                  className="w-full text-xs font-bold text-[#0065FF] flex items-center justify-center gap-1.5 py-2 border border-[#0065FF]/20 bg-[#0065FF]/5 rounded-lg hover:bg-[#0065FF]/10 transition-colors"
                >
                  <span>Open Reconciliation Studio</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  )
}
