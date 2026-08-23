import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, Sparkles, X, ChevronDown } from 'lucide-react'
import { askQuestion } from '../api'

export default function ChatPanel({ runId }) {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState([{ role: 'bot', text: 'Hi! Ask me anything about this reconciliation run.' }])
  const [inp, setInp] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, open])

  const send = async (e) => {
    e.preventDefault()
    if (!inp.trim() || loading) return
    const q = inp
    setInp('')
    setMsgs(p => [...p, { role: 'user', text: q }, { role: 'bot', text: '...' }])
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
        arr[arr.length - 1].text = `Error: ${err.message}`
        return arr
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#3d8ef8] hover:bg-[#2b6cdb] rounded-full shadow-[0_4px_16px_rgba(61,142,248,0.4)] flex items-center justify-center text-white transition-transform hover:scale-105 z-50 group"
      >
        <MessageSquare size={24} />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#e04d4d]"></span>
        </span>
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-24 right-6 w-[400px] h-[550px] bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-[#e3e8ef] flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#1a1f36] p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-[#3d8ef8] to-[#2b6cdb] flex items-center justify-center shadow-sm">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">Copilot AI</h3>
                <p className="text-[10px] text-[#8a94b2] uppercase tracking-widest font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2eb88a] animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center text-[#8a94b2] hover:text-white hover:bg-[#2d3456] rounded-lg transition-colors">
                <ChevronDown size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#f8f9ff] custom-scrollbar">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-[#e8f0fe] border border-[#3d8ef8]/20 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                    <Sparkles size={12} className="text-[#3d8ef8]" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-sm shadow-sm ${
                    m.role === 'user'
                      ? 'bg-[#3d8ef8] text-white rounded-tr-sm'
                      : 'bg-white text-[#1a1f36] border border-[#e3e8ef] rounded-tl-sm whitespace-pre-wrap'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <form onSubmit={send} className="p-4 bg-white border-t border-[#e3e8ef]">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inp}
                onChange={e => setInp(e.target.value)}
                placeholder="Ask about refunds, missing txns..."
                className="w-full bg-[#f5f7fa] border border-[#e3e8ef] rounded-full pl-4 pr-12 py-2.5 text-sm outline-none focus:border-[#3d8ef8] focus:ring-1 focus:ring-[#3d8ef8]/20 transition-all placeholder:text-[#a3acb9]"
              />
              <button
                type="submit"
                disabled={!inp.trim() || loading}
                className="absolute right-1.5 w-8 h-8 bg-[#3d8ef8] text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:bg-[#a3acb9] hover:bg-[#2b6cdb] transition-colors"
              >
                <Send size={14} className={loading ? 'animate-pulse' : ''} />
              </button>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto custom-scrollbar pb-1">
              {['Show largest mismatches', 'Why did batch matching fail?'].map(txt => (
                <button
                  key={txt}
                  type="button"
                  onClick={() => setInp(txt)}
                  className="whitespace-nowrap px-3 py-1 rounded-full border border-[#e3e8ef] text-[10px] font-semibold text-[#697386] hover:bg-[#f5f7fa] hover:text-[#1a1f36] transition-colors"
                >
                  {txt}
                </button>
              ))}
            </div>
          </form>
        </div>
      )}
    </>
  )
}
