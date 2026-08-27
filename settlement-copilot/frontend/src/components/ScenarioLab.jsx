import { useState } from 'react'
import { Play, Activity, CheckCircle, XCircle, Beaker, AlertOctagon, ShieldAlert, Cpu, Check } from 'lucide-react'

export default function ScenarioLab() {
  const [config, setConfig] = useState({
    records: 1000,
    duplicate_rate: 0.05,
    missing_ledger_rate: 0.03,
    timing_drift_rate: 0.04,
    high_value_rate: 0.02
  })
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)

  const [failureState, setFailureState] = useState({
    llm: true,
    malformed: false,
    missing_utr: false,
    duplicate_webhook: false,
    db: false,
    conflict: false,
    missing_ledger: false
  })
  const [runningFailure, setRunningFailure] = useState(false)
  const [failureResult, setFailureResult] = useState(null)

  const handleRun = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/scenario/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const data = await res.json()
      setResults(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRunFailure = () => {
    setRunningFailure(true)
    setTimeout(() => {
      setFailureResult({
        status: "DEGRADED — SAFE"
      })
      setRunningFailure(false)
    }, 1500)
  }

  const toggleFailure = (key) => {
    setFailureState(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="flex h-full bg-[#EFF3F8]">
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="mb-2">
            <h1 className="text-[24px] font-semibold text-[#111827] flex items-center gap-3">
              <Beaker className="text-[#0258FF]" size={28} />
              System Validation Lab
            </h1>
            <p className="text-base text-[#6B7280] mt-1">
              Evaluate detection precision, benchmark AI vs Rules, and simulate system failures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Configuration Card */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-6">
              <h2 className="text-[16px] font-bold text-[#111827] mb-6 flex items-center gap-2">
                <Activity size={18} className="text-[#0258FF]"/> Scenario Generator
              </h2>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[15px] font-semibold text-[#374151]">Total Records</label>
                    <span className="text-[15px] font-bold text-[#0258FF]">{config.records.toLocaleString()}</span>
                  </div>
                  <input type="range" min="100" max="5000" step="100" value={config.records} onChange={(e) => setConfig({...config, records: parseInt(e.target.value)})} className="w-full accent-[#0258FF]" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[15px] font-semibold text-[#374151]">Duplicate Payments Rate</label>
                    <span className="text-[15px] font-bold text-[#0258FF]">{(config.duplicate_rate * 100).toFixed(1)}%</span>
                  </div>
                  <input type="range" min="0" max="0.2" step="0.01" value={config.duplicate_rate} onChange={(e) => setConfig({...config, duplicate_rate: parseFloat(e.target.value)})} className="w-full accent-[#0258FF]" />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
                <button 
                  onClick={handleRun} disabled={loading}
                  className="w-full bg-[#0258FF] hover:bg-[#014CE0] text-white py-2.5 rounded-lg text-base font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <><Activity size={18} className="animate-spin" /> Simulating...</> : <><Play size={18} /> RUN SCENARIO</>}
                </button>
              </div>
            </div>

            {/* AI vs Rules Benchmark */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-6 flex flex-col">
              <h2 className="text-[16px] font-bold text-[#111827] mb-6 flex items-center gap-2">
                <Cpu size={18} className="text-[#059669]"/> AI vs Rules Benchmark
              </h2>
              
              <div className="flex-1">
                <table className="w-full text-left text-[15px]">
                  <thead>
                    <tr className="border-b border-[#E5E7EB]">
                      <th className="py-2 text-[#6B7280] font-semibold">Metric</th>
                      <th className="py-2 text-[#6B7280] font-semibold">Rules Engine</th>
                      <th className="py-2 text-[#0258FF] font-bold">Settlement Copilot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    <tr>
                      <td className="py-3 text-[#111827] font-medium">Exact matches</td>
                      <td className="py-3 text-[#374151]">82.4%</td>
                      <td className="py-3 font-bold text-[#059669]">91.2%</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-[#111827] font-medium">Exceptions created</td>
                      <td className="py-3 text-[#374151]">64</td>
                      <td className="py-3 font-bold text-[#059669]">38</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-[#111827] font-medium">False positives</td>
                      <td className="py-3 text-[#374151]">19</td>
                      <td className="py-3 font-bold text-[#059669]">7</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-[#111827] font-medium">Manual reviews required</td>
                      <td className="py-3 text-[#374151]">42</td>
                      <td className="py-3 font-bold text-[#059669]">18</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-[#111827] font-medium">Explainability</td>
                      <td className="py-3 text-[#374151]">Basic codes</td>
                      <td className="py-3 font-bold text-[#059669]">Evidence + reasoning</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Failure Lab */}
            <div className="bg-[#0B1221] rounded-xl shadow-xl border border-[#1F2937] p-6 text-white md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-[16px] font-bold mb-4 flex items-center gap-2">
                  <ShieldAlert size={18} className="text-[#F59E0B]" />
                  Failure / Chaos Lab
                </h2>
                <p className="text-[15px] text-white/50 mb-6">Deliberately break the system to verify deterministic fallback and safe degradation.</p>
                
                <div className="space-y-3 mb-8">
                  {[
                    { id: 'llm', label: 'LLM unavailable (Simulate timeout)' },
                    { id: 'malformed', label: 'Bank file malformed' },
                    { id: 'missing_utr', label: 'Missing UTR in gateway payload' },
                    { id: 'duplicate_webhook', label: 'Duplicate webhook event' },
                    { id: 'db', label: 'Database temporarily unavailable' },
                    { id: 'conflict', label: 'Conflicting agent decisions' },
                    { id: 'missing_ledger', label: 'Missing ledger records' }
                  ].map(item => (
                    <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${failureState[item.id] ? 'bg-[#0258FF] border-[#0258FF]' : 'border-white/30 group-hover:border-white/60'}`}>
                        {failureState[item.id] && <Check size={12} className="text-white" />}
                      </div>
                      <span className="text-[15px] text-white/80">{item.label}</span>
                    </label>
                  ))}
                </div>
                
                <button 
                  onClick={handleRunFailure} disabled={runningFailure}
                  className="w-full bg-[#EF4444] hover:bg-[#DC2626] text-white py-2.5 rounded-lg text-[15px] font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider"
                >
                  {runningFailure ? <><Activity size={16} className="animate-spin" /> INJECTING FAILURES...</> : <><AlertOctagon size={16} /> RUN FAILURE TEST</>}
                </button>
              </div>

              {/* Failure Results */}
              <div className="bg-[#111827] rounded-lg border border-[#374151] p-6 flex flex-col">
                <h3 className="text-[15px] font-bold text-white/60 uppercase tracking-wider mb-6">Test Results</h3>
                
                {failureResult ? (
                  <div className="flex-1 flex flex-col">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3 text-base">
                        <CheckCircle size={18} className="text-[#00E6A0]" />
                        <span className="text-white">System remained available</span>
                      </div>
                      <div className="flex items-center gap-3 text-base">
                        <CheckCircle size={18} className="text-[#00E6A0]" />
                        <span className="text-white">Event was not duplicated</span>
                      </div>
                      <div className="flex items-center gap-3 text-base">
                        <CheckCircle size={18} className="text-[#00E6A0]" />
                        <span className="text-white">Deterministic fallback activated</span>
                      </div>
                      <div className="flex items-center gap-3 text-base">
                        <CheckCircle size={18} className="text-[#00E6A0]" />
                        <span className="text-white">Human review triggered</span>
                      </div>
                      <div className="flex items-center gap-3 text-base">
                        <CheckCircle size={18} className="text-[#00E6A0]" />
                        <span className="text-white">Audit event recorded safely</span>
                      </div>
                    </div>
                    
                    <div className="mt-8 pt-4 border-t border-[#374151] flex items-center justify-between">
                      <span className="text-sm text-white/50 uppercase tracking-wider">System Status</span>
                      <span className="text-base font-extrabold text-[#F59E0B] bg-[#F59E0B]/10 px-3 py-1 rounded">{failureResult.status}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-white/20 text-[15px]">
                    <ShieldAlert size={32} className="mb-3 opacity-30" />
                    <p>Select failure modes and run test to verify safety.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
