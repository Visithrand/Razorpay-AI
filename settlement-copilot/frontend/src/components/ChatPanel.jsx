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
      <div className="bg-white border border-[#DCE3ED] rounded-xl shadow-sm flex flex-col h-[650px] overflow-hidden">
        {/* Header */}
        <div className="bg-[#05103E] px-6 py-4 flex items-center justify-between text-white border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0065FF] text-white flex items-center justify-center shadow-md">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Settlement Copilot AI Assistant</h3>
              <p className="text-xs text-white/60 font-medium">Schema-grounded NL2SQL Financial Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-[#00E6A0]/20 text-[#00E6A0] text-xs font-extrabold flex items-center gap-1.5 border border-[#00E6A0]/30">
              <span className="w-2 h-2 rounded-full bg-[#00E6A0] animate-pulse" /> Live Engine
            </span>
          </div>
        </div>

        {/* Message History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#EFF3F8]/40 custom-scrollbar">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'bot' && (
                <div className="w-8 h-8 rounded-xl bg-[#0065FF] text-white flex items-center justify-center mr-3 mt-1 flex-shrink-0 shadow-sm">
                  <Bot size={16} />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-xl p-4 text-sm leading-relaxed shadow-sm ${
                  m.role === 'user'
                    ? 'bg-[#0065FF] text-white font-semibold rounded-tr-none'
                    : 'bg-white text-[#0B192C] border border-[#DCE3ED] rounded-tl-none font-medium whitespace-pre-wrap'
                }`}
              >
                {m.text}
              </div>
              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-[#05103E] text-white flex items-center justify-center ml-3 mt-1 flex-shrink-0 shadow-sm">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-6 py-2 bg-gray-50 border-t border-[#E8EEF5] flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
            <Zap size={12} className="text-[#0065FF]" /> Suggested Questions:
          </span>
          {QUICK_SUGGESTIONS.map((txt) => (
            <button
              key={txt}
              onClick={() => send(txt)}
              disabled={loading}
              className="px-3 py-1 rounded-full border border-[#DCE3ED] bg-white text-xs font-semibold text-[#0065FF] hover:bg-[#E6F0FF] transition-colors whitespace-nowrap flex-shrink-0 shadow-2xs disabled:opacity-50"
            >
              {txt}
            </button>
          ))}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-[#DCE3ED]">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inp}
              onChange={e => setInp(e.target.value)}
              placeholder="Ask 'Where is my 25 lakh settlement?' or search unmatched exceptions..."
              className="w-full bg-[#EFF3F8]/60 border border-[#DCE3ED] rounded-xl px-4 py-3 text-sm text-[#0B192C] outline-none focus:border-[#0065FF] focus:bg-white font-medium transition-all placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={!inp.trim() || loading}
              className="absolute right-2 btn-primary py-2 px-4 text-xs shadow-md disabled:opacity-40"
            >
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              Send
            </button>
          </div>
        </form>
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
                <h3 className="font-bold text-sm text-white">Copilot AI Assistant</h3>
                <p className="text-[10px] text-[#00E6A0] uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E6A0] animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <ChevronDown size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#EFF3F8]/50 custom-scrollbar text-xs">
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
                className="w-full bg-gray-50 border border-[#DCE3ED] rounded-lg pl-3 pr-10 py-2 text-xs outline-none focus:border-[#0065FF] font-medium"
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
