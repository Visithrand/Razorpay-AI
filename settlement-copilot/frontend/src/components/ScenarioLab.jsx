import { useState } from 'react'
import { Play, Activity, CheckCircle, XCircle, Beaker } from 'lucide-react'

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

  return (
    <div className="flex h-full bg-[#EFF3F8]">
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-[24px] font-semibold text-[#111827] flex items-center gap-3">
              <Beaker className="text-[#0258FF]" size={28} />
              Scenario Lab
            </h1>
            <p className="text-[14px] text-[#6B7280] mt-1">
              Generate synthetic events with controlled anomaly rates to evaluate detection precision and recall.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Configuration Card */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-6">
              <h2 className="text-[16px] font-bold text-[#111827] mb-6">Configuration</h2>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[13px] font-semibold text-[#374151]">Total Records</label>
                    <span className="text-[13px] font-bold text-[#0258FF]">{config.records.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" min="100" max="5000" step="100" 
                    value={config.records}
                    onChange={(e) => setConfig({...config, records: parseInt(e.target.value)})}
                    className="w-full accent-[#0258FF]"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[13px] font-semibold text-[#374151]">Duplicate Payments Rate</label>
                    <span className="text-[13px] font-bold text-[#0258FF]">{(config.duplicate_rate * 100).toFixed(1)}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="0.2" step="0.01" 
                    value={config.duplicate_rate}
                    onChange={(e) => setConfig({...config, duplicate_rate: parseFloat(e.target.value)})}
                    className="w-full accent-[#0258FF]"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[13px] font-semibold text-[#374151]">Missing Ledger Rate</label>
                    <span className="text-[13px] font-bold text-[#0258FF]">{(config.missing_ledger_rate * 100).toFixed(1)}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="0.2" step="0.01" 
                    value={config.missing_ledger_rate}
                    onChange={(e) => setConfig({...config, missing_ledger_rate: parseFloat(e.target.value)})}
                    className="w-full accent-[#0258FF]"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-[13px] font-semibold text-[#374151]">High-Value Anomalies Rate</label>
                    <span className="text-[13px] font-bold text-[#0258FF]">{(config.high_value_rate * 100).toFixed(1)}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="0.2" step="0.01" 
                    value={config.high_value_rate}
                    onChange={(e) => setConfig({...config, high_value_rate: parseFloat(e.target.value)})}
                    className="w-full accent-[#0258FF]"
                  />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
                <button 
                  onClick={handleRun}
                  disabled={loading}
                  className="w-full bg-[#0258FF] hover:bg-[#014CE0] text-white py-3 rounded-lg text-[14px] font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <><Activity size={18} className="animate-spin" /> Generating & Simulating...</>
                  ) : (
                    <><Play size={18} /> RUN SCENARIO</>
                  )}
                </button>
              </div>
            </div>

            {/* Results Card */}
            <div className="bg-[#0B1221] rounded-xl shadow-xl border border-white/10 p-6 text-white flex flex-col">
              <h2 className="text-[16px] font-bold mb-6 flex items-center gap-2">
                <Activity size={18} className="text-[#00E6A0]" />
                Test Results
              </h2>

              {results ? (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    <div>
                      <p className="text-[12px] text-white/50 uppercase font-bold tracking-wider mb-1">Records Processed</p>
                      <p className="text-[28px] font-semibold">{results.records_processed.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-white/50 uppercase font-bold tracking-wider mb-1">Actual Anomalies</p>
                      <p className="text-[28px] font-semibold text-[#F59E0B]">{results.actual_anomalies}</p>
                    </div>
                    
                    <div>
                      <p className="text-[12px] text-white/50 uppercase font-bold tracking-wider mb-1">Detected Anomalies</p>
                      <p className="text-[28px] font-semibold text-[#00E6A0]">{results.detected_anomalies}</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-white/50 uppercase font-bold tracking-wider mb-1">Processing Time</p>
                      <p className="text-[28px] font-semibold">{results.processing_time}s</p>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 mt-8 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[14px] font-semibold text-white/80">Detection Precision</span>
                      <span className="text-[18px] font-bold text-[#00E6A0]">{results.precision}%</span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[14px] font-semibold text-white/80">Detection Recall</span>
                      <span className="text-[18px] font-bold text-[#00E6A0]">{results.recall}%</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px] border-t border-white/10 pt-3 text-white/60">
                      <span className="flex items-center gap-1"><XCircle size={14} className="text-[#EF4444]"/> False Positives: {results.false_positives}</span>
                      <span className="flex items-center gap-1"><XCircle size={14} className="text-[#F59E0B]"/> False Negatives: {results.false_negatives}</span>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between items-center text-[12px] font-mono text-white/40">
                    <span>THROUGHPUT: {results.throughput}/sec</span>
                    <span>GROUND TRUTH: VERIFIED</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-white/30 text-[14px]">
                  <Beaker size={48} className="mb-4 opacity-50" />
                  <p>Run a scenario to generate evaluation metrics.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
