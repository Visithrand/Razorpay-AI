import { useState } from 'react'
import { Save, Key, Webhook, Users, ShieldCheck, CheckCircle2, Cpu } from 'lucide-react'

export default function SettingsMock() {
  const [apiKey, setApiKey] = useState('rzp_live_9a8b7c6d5e4f3g2h1')
  const [webhookUrl, setWebhookUrl] = useState('https://api.yourdomain.com/webhooks/razorpay')
  const [saved, setSaved] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B192C]">Settings & Governance</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage API credentials, webhooks, and AI safety controls.</p>
      </div>

      {/* AI Judgment Disclosure Table */}
      <div className="bg-white border border-[#DCE3ED] rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0065FF]/10 text-[#0065FF] flex items-center justify-center">
            <Cpu size={20} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#0B192C]">AI Judgment Disclosure Matrix</h3>
            <p className="text-xs text-gray-500 mt-0.5">Explicit breakdown of deterministic algorithms vs AI language reasoning.</p>
          </div>
        </div>

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DCE3ED] bg-[#EFF3F8]/60 uppercase font-extrabold text-gray-500">
                <th className="px-4 py-3">Operation</th>
                <th className="px-4 py-3 text-center">AI Used?</th>
                <th className="px-4 py-3">Implementation Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { op: 'Amount comparison', ai: false, reason: 'Deterministic float comparison (safety)' },
                { op: 'Currency validation', ai: false, reason: 'Deterministic regex & numeric parsing' },
                { op: 'Date tolerance', ai: false, reason: 'Business rule (T+0 to T+2 date drift window)' },
                { op: 'Exact matching', ai: false, reason: 'Deterministic UTR & amount hashing' },
                { op: 'Candidate generation', ai: false, reason: 'Algorithmic database query indexing' },
                { op: 'Fuzzy matching', ai: false, reason: 'Similarity algorithm (Levenshtein & SequenceMatcher)' },
                { op: 'Confidence scoring', ai: false, reason: 'Reproducible weighted score formula' },
                { op: 'Final financial decision', ai: false, reason: 'Human-in-the-Loop safety enforcement' },
                { op: 'Exception explanation', ai: true, reason: 'Language reasoning over evidence context' },
                { op: 'Ambiguous-case analysis', ai: true, reason: 'Contextual root-cause reasoning' },
                { op: 'Human investigation summary', ai: true, reason: 'Productivity & financial synthesis' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/60">
                  <td className="px-4 py-2.5 font-bold text-[#0B192C]">{row.op}</td>
                  <td className="px-4 py-2.5 text-center font-extrabold">
                    {row.ai ? (
                      <span className="px-2 py-0.5 rounded bg-[#D1FAE5] text-[#10B981]">✅ YES</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-500">❌ NO</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 font-medium">{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* API Keys & Webhooks */}
      <form onSubmit={handleSave} className="bg-white border border-[#DCE3ED] rounded-xl p-6 shadow-sm space-y-6">
        <h3 className="text-base font-extrabold text-[#0B192C]">API Credentials</h3>

        <div>
          <label className="block text-xs font-extrabold text-gray-500 uppercase mb-2">Live API Key</label>
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-[#DCE3ED] rounded-lg font-mono text-sm font-bold text-[#0B192C] outline-none focus:border-[#0065FF]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-extrabold text-gray-500 uppercase mb-2">Webhook Endpoint URL</label>
          <input
            type="text"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-[#DCE3ED] rounded-lg font-mono text-sm font-bold text-[#0B192C] outline-none focus:border-[#0065FF]"
          />
        </div>

        <div className="pt-2 flex items-center justify-between">
          <button type="submit" className="btn-primary">
            <Save size={15} /> Save Configuration
          </button>
          {saved && (
            <span className="text-xs font-bold text-[#10B981] flex items-center gap-1">
              <CheckCircle2 size={16} /> Saved successfully!
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
