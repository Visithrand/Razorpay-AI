import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, Sparkles, X, ChevronDown, Bot, User, RefreshCw, Zap } from 'lucide-react'
import { askQuestion } from '../api'

const QUICK_SUGGESTIONS = [
  'Where is my ₹25 lakh settlement?',
  'Show all unmatched transactions above ₹10,000',
  'Why was this transaction not matched?',
  'Summarize today\'s settlement health report'
]

export default function ChatPanel({ runId, embedded = false }) {
  const [open, setOpen] = useState(embedded ? true : false)
  const [msgs, setMsgs] = useState([
    { 
      role: 'bot', 
      text: 'Hello! I am your AI Financial Assistant. I can trace settlements, explain exceptions, and run NL2SQL database queries across Gateway, Bank statement, and Ledger entries.' 
    }
  ])
  const [inp, setInp] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    if (embedded) setOpen(true)
  }, [embedded])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, open])

  const send = async (queryText) => {
    const q = queryText || inp
    if (!q.trim() || loading) return
    setInp('')
    setMsgs(p => [...p, { role: 'user', text: q }, { role: 'bot', text: 'Thinking...' }])
    setLoading(true)

    try {
      let full = ''
      await askQuestion(q, runId, (chunk) => {
        full += chunk
        setMsgs(p => {
          const arr = [...p]
          arr[arr.length - 1].text = full
          return arr
        })
      })
    } catch (err) {
      setMsgs(p => {
        const arr = [...p]
        arr[arr.length - 1].text = `❌ Error: ${err.message}`
        return arr
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    send()
  }

  // Full-page Embedded View for Navigation Page
  if (embedded) {
    return (
      <div className="bg-white border border-[#DCE3ED] rounded-xl shadow-sm flex flex-col h-[700px] max-w-5xl mx-auto mt-4 overflow-hidden">
        {/* Header */}
        <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#10A37F] text-white flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="font-bold text-[16px] text-[#111827]">Finance Copilot</h3>
              <p className="text-sm text-[#6B7280]">Powered by AI</p>
            </div>
          </div>
        </div>

        {/* Message History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white custom-scrollbar">
          {msgs.map((m, i) => (
            <div key={i} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-4 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  m.role === 'user' ? 'bg-[#F3F4F6] text-[#374151]' : 'bg-[#10A37F] text-white'
                }`}>
                  {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div
                  className={`px-5 py-3.5 text-[15px] leading-relaxed rounded-2xl ${
                    m.role === 'user'
                      ? 'bg-[#F3F4F6] text-[#111827]'
                      : 'bg-transparent text-[#374151] whitespace-pre-wrap'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {msgs.length <= 1 && (
          <div className="px-6 py-4 flex flex-wrap gap-2 justify-center">
            {QUICK_SUGGESTIONS.map((txt) => (
              <button
                key={txt}
                onClick={() => send(txt)}
                disabled={loading}
                className="px-4 py-2 rounded-xl border border-[#E5E7EB] bg-white text-[15px] font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors shadow-sm disabled:opacity-50"
              >
                {txt}
              </button>
            ))}
          </div>
        )}

        {/* Chat Input */}
        <div className="p-4 bg-white border-t border-[#E5E7EB]">
          <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
            <div className="relative flex items-center bg-white border border-[#DCE3ED] rounded-2xl shadow-sm focus-within:ring-1 focus-within:ring-[#10A37F] focus-within:border-[#10A37F] transition-all overflow-hidden">
              <input
                type="text"
                value={inp}
                onChange={e => setInp(e.target.value)}
                placeholder="Message Finance Copilot..."
                className="w-full bg-transparent px-4 py-4 text-[15px] text-[#111827] outline-none placeholder:text-[#9CA3AF]"
              />
              <button
                type="submit"
                disabled={!inp.trim() || loading}
                className={`absolute right-2 w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${
                  !inp.trim() || loading ? 'bg-[#F3F4F6] text-[#D1D5DB]' : 'bg-[#10A37F] text-white hover:bg-[#0E906F]'
                }`}
              >
                {loading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} className="ml-0.5" />}
              </button>
            </div>
            <p className="text-center text-[13px] text-[#9CA3AF] mt-2">Finance Copilot can make mistakes. Verify important financial data.</p>
          </form>
        </div>
      </div>
    )
  }

  // Floating Drawer View
  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#0065FF] hover:bg-[#0052CC] rounded-full shadow-2xl flex items-center justify-center text-white transition-all hover:scale-105 z-50 group border border-white/20"
      >
        <MessageSquare size={22} />
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#00E6A0]"></span>
        </span>
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 w-[420px] h-[550px] bg-white rounded-2xl shadow-2xl border border-[#DCE3ED] flex flex-col z-50 overflow-hidden animate-overlay-slideup">
          <div className="bg-[#05103E] p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0065FF] flex items-center justify-center shadow-sm">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Copilot AI Assistant</h3>
                <p className="text-xs text-[#00E6A0] uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E6A0] animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <ChevronDown size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#EFF3F8]/50 custom-scrollbar text-sm">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'bot' && (
                  <div className="w-6 h-6 rounded-lg bg-[#0065FF] text-white flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <Bot size={12} />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-xl p-3 shadow-2xs whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-[#0065FF] text-white font-bold rounded-tr-xs'
                      : 'bg-white text-[#0B192C] border border-[#DCE3ED] rounded-tl-xs font-medium'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-[#DCE3ED]">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inp}
                onChange={e => setInp(e.target.value)}
                placeholder="Ask about settlements..."
                className="w-full bg-gray-50 border border-[#DCE3ED] rounded-lg pl-3 pr-10 py-2 text-sm outline-none focus:border-[#0065FF] font-medium"
              />
              <button
                type="submit"
                disabled={!inp.trim() || loading}
                className="absolute right-1 w-7 h-7 bg-[#0065FF] text-white rounded-md flex items-center justify-center disabled:opacity-40"
              >
                <Send size={12} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
