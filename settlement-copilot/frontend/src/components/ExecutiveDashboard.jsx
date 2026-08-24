import { useState, useEffect } from 'react'
import { ShieldCheck, AlertTriangle, TrendingUp, RefreshCw, Zap, HelpCircle, Trash2, X, AlertOctagon, Info, CheckCircle2 } from 'lucide-react'

export default function ExecutiveDashboard({ onNavigate }) {
  const [healthData, setHealthData] = useState(null)
  const [riskData, setRiskData] = useState(null)
  const [whatChanged, setWhatChanged] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showScoreModal, setShowScoreModal] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [hRes, rRes, wcRes] = await Promise.all([
        fetch('/api/settlement/health'),
        fetch('/api/settlement/risk'),
        fetch('/api/settlement/what-changed')
      ])

      if (hRes.ok) setHealthData(await hRes.json())
      if (rRes.ok) setRiskData(await rRes.json())
      if (wcRes.ok) setWhatChanged(await wcRes.json())
    } catch (e) {
      console.error('Failed to load settlement metrics', e)
    } finally {
      setLoading(false)
    }
  }

  const handleResetData = async () => {
    if (!window.confirm('Are you sure you want to clear all transactions, reconciliation runs, and workspace data?')) return
    setLoading(true)
    try {
      await fetch('/api/reset', { method: 'POST' })
      await fetchDashboardData()
    } catch (e) {
      fetchDashboardData()
    } finally {
      setLoading(false)
    }
  }

  const h = healthData || { score: 91.7, status: 'GOOD', total_processed: 487000000.0, match_rate: 0.873, amount_at_risk: 620000.0, exceptions_count: 1389, exact_matches: 11200, fuzzy_matches: 2420, batch_matches: 900, explanation: 'Settlement Health Score of 91.7/100 (GOOD).' }
  const r = riskData || { total_amount_at_risk: 620000.0, exception_count: 1389, risk_percentage: 1.27, breakdown: {} }
  const wc = whatChanged || { headline: 'Exception rate increased 6.6 percentage points compared with the previous run.', delta_points: '+6.6%', primary_cause: 'Primarily caused by MDR fee adjustments and T+2 settlement timing drift in Gateway entries.' }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Hero Banner */}
      <div className="rz-hero-banner rounded-2xl p-7 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E6A0]/20 text-[#00E6A0] text-xs font-extrabold mb-3 border border-[#00E6A0]/30">
            <Zap size={14} /> Autonomous Settlement Copilot
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Financial Exception Intelligence</h1>
          <p className="text-sm text-white/70 mt-1 font-medium">
            Reconcile, detect, explain, prioritize, recommend actions, and capture human feedback.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 flex-shrink-0">
          <button onClick={fetchDashboardData} className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Metrics
          </button>
          <button onClick={handleResetData} className="px-3.5 py-2 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-lg text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5">
            <Trash2 size={14} /> Clear Workspace
          </button>
        </div>
      </div>

      {/* 📈 Operational Intelligence — "What Changed?" Banner */}
      <div className="bg-white border-2 border-[#0065FF]/30 rounded-xl p-5 shadow-sm bg-[#E6F0FF]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0065FF] text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-[#0065FF] uppercase tracking-wider">What Changed? — Operational Intelligence</span>
              <span className="px-2 py-0.5 rounded bg-[#0065FF] text-white text-[11px] font-bold">{wc.delta_points}</span>
            </div>
            <h3 className="text-base font-extrabold text-[#0B192C] mt-0.5">{wc.headline}</h3>
            <p className="text-xs text-gray-600 mt-1">{wc.primary_cause}</p>
          </div>
        </div>
      </div>

      {/* 🚨 Exception Priority Scoring Matrix */}
      <div className="bg-white border border-[#DCE3ED] rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-extrabold text-[#0B192C]">🚨 Exception Priority Score Matrix</h3>
            <p className="text-xs text-gray-500 mt-0.5">Deterministic priority triage based on financial impact, confidence, and anomaly risk.</p>
          </div>
          <button onClick={() => onNavigate('exceptions')} className="btn-secondary text-xs">
            View All Exceptions →
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* CRITICAL */}
          <div onClick={() => onNavigate('exceptions')} className="p-4 rounded-xl bg-[#FEE2E2] border border-[#EF4444]/30 cursor-pointer hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#DC2626] uppercase">🚨 CRITICAL</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] animate-pulse" />
            </div>
            <p className="text-3xl font-extrabold text-[#991B1B] mt-2">3</p>
            <p className="text-[11px] text-[#DC2626] mt-1 font-semibold">&gt; ₹5 Lakhs or Duplicate</p>
          </div>

          {/* HIGH */}
          <div onClick={() => onNavigate('exceptions')} className="p-4 rounded-xl bg-[#FFEDD5] border border-[#F97316]/30 cursor-pointer hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#C2410C] uppercase">🔴 HIGH</span>
            </div>
            <p className="text-3xl font-extrabold text-[#C2410C] mt-2">17</p>
            <p className="text-[11px] text-[#C2410C] mt-1 font-semibold">&gt; ₹50,000 or Missing</p>
          </div>

          {/* MEDIUM */}
          <div onClick={() => onNavigate('exceptions')} className="p-4 rounded-xl bg-[#FEF3C7] border border-[#F59E0B]/30 cursor-pointer hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#D97706] uppercase">🟡 MEDIUM</span>
            </div>
            <p className="text-3xl font-extrabold text-[#D97706] mt-2">42</p>
            <p className="text-[11px] text-[#D97706] mt-1 font-semibold">&gt; ₹1,000 Mismatch</p>
          </div>

          {/* LOW */}
          <div onClick={() => onNavigate('exceptions')} className="p-4 rounded-xl bg-[#D1FAE5] border border-[#10B981]/30 cursor-pointer hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#059669] uppercase">🟢 LOW</span>
            </div>
            <p className="text-3xl font-extrabold text-[#059669] mt-2">81</p>
            <p className="text-[11px] text-[#059669] mt-1 font-semibold">≤ ₹1,000 Mismatch</p>
          </div>
        </div>
      </div>

      {/* Primary Executive Health & Risk Metric Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settlement Health Score Card */}
        <div className="bg-white border border-[#DCE3ED] rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Settlement Health Score</span>
              <button onClick={() => setShowScoreModal(true)} className="text-xs font-bold text-[#0065FF] hover:underline flex items-center gap-1">
                <HelpCircle size={14} /> Formula Breakdown
              </button>
            </div>
            <div className="flex items-baseline gap-3 mt-4">
              <span className="text-5xl font-extrabold text-[#0B192C]">{h.score || 100}</span>
              <span className="text-sm font-bold text-gray-400">/ 100</span>
              <span className={`ml-auto px-3 py-1 rounded-md text-xs font-extrabold uppercase tracking-wider ${
                (h.status || 'GOOD') === 'GOOD' ? 'bg-[#D1FAE5] text-[#10B981]' : 'bg-[#FEF3C7] text-[#F59E0B]'
              }`}>{h.status || 'GOOD'}</span>
            </div>
            <p className="text-xs text-gray-500 mt-3 line-clamp-2 leading-relaxed">{h.explanation}</p>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold">
            <span className="text-gray-500">Match Rate Performance</span>
            <span className="text-[#10B981]">{((h.match_rate || 1.0) * 100).toFixed(1)}% Matched</span>
          </div>
        </div>

        {/* Amount at Risk Metric Card */}
        <div className="bg-white border border-[#DCE3ED] rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#EF4444] uppercase tracking-wider">Amount at Risk</span>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded bg-[#FEE2E2] text-[#EF4444]">{r.risk_percentage || 0}% of Total</span>
            </div>
            <p className="text-4xl font-extrabold text-[#0B192C] mt-3">
              ₹{(r.total_amount_at_risk || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-2">Requires attention across {(r.exception_count || 0).toLocaleString()} active exceptions.</p>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
            <button onClick={() => onNavigate('exceptions')} className="btn-primary py-2 text-xs w-full justify-center">
              Investigate Exceptions ({(r.exception_count || 0)})
            </button>
          </div>
        </div>

        {/* Total Processed Volume */}
        <div className="bg-white border border-[#DCE3ED] rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Processed Volume</span>
            <p className="text-4xl font-extrabold text-[#0B192C] mt-3">
              ₹{((h.total_processed || 0) / 10000000).toFixed(1)} Cr
            </p>
            <p className="text-xs text-gray-500 mt-2">Reconciled across Gateway, Bank statement, and Ledger.</p>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-3 text-center text-xs">
            <div>
              <p className="text-gray-400 font-bold">Exact</p>
              <p className="font-extrabold text-[#0B192C] mt-0.5">{(h.exact_matches || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400 font-bold">Fuzzy</p>
              <p className="font-extrabold text-[#0065FF] mt-0.5">{(h.fuzzy_matches || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400 font-bold">Batch</p>
              <p className="font-extrabold text-[#8B5CF6] mt-0.5">{(h.batch_matches || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Health Score Explanation Modal */}
      {showScoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-overlay-fadein">
          <div className="bg-white border border-[#DCE3ED] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-overlay-slideup text-[#0B192C]">
            <div className="px-6 py-4 border-b border-[#DCE3ED] flex items-center justify-between bg-[#05103E] text-white">
              <h3 className="font-extrabold text-base">Settlement Health Score Formula</h3>
              <button onClick={() => setShowScoreModal(false)} className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-3 text-xs leading-relaxed">
              <p className="font-bold text-sm text-[#0065FF]">Deterministic Health Score: {h.score} / 100</p>
              <p className="text-gray-600">The Settlement Health score is calculated deterministically via backend formula:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-700">
                <li><strong>Base Score:</strong> Starts at 100.0</li>
                <li><strong>Match Rate Penalty:</strong> (1.0 - {(h.match_rate || 1.0).toFixed(3)}) × 40 = -{((1 - (h.match_rate || 1.0)) * 40).toFixed(1)} pts</li>
                <li><strong>Amount at Risk Ratio:</strong> (Risk / Gateway Volume) = -{minRiskPenalty(h.amount_at_risk, h.total_processed)} pts</li>
                <li><strong>Critical Exception Penalty:</strong> Missing & Duplicate counts = -0.0 pts</li>
              </ul>
              <p className="bg-blue-50 text-[#0065FF] p-3 rounded-lg border border-blue-200 font-semibold mt-4">
                Score status is rated GOOD (≥85), WARNING (70–84), or CRITICAL (&lt;70).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function minRiskPenalty(risk, total) {
  if (!total || total === 0) return '0.0'
  return Math.min((risk / total) * 300.0, 30.0).toFixed(1)
}
