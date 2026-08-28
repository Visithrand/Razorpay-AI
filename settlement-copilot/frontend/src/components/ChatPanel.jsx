import { useState, useRef, useEffect } from 'react'
import { 
  MessageSquare, Send, Sparkles, X, ChevronDown, Bot, User, 
  RefreshCw, Zap, Copy, Check, Trash2, ArrowUp, Database, 
  HelpCircle, ShieldCheck, Terminal, FileSpreadsheet
} from 'lucide-react'
import { askQuestion } from '../api'

const QUICK_PROMPT_CARDS = [
  {
    icon: Database,
    title: 'Trace Settlement UTR',
    desc: 'Locate ₹25 Lakh missing settlement & bank credit status',
    query: 'Where is my ₹25 lakh settlement for UTR SBIN0001234567?'
  },
  {
    icon: FileSpreadsheet,
    title: 'High-Value Exceptions',
    desc: 'List all unmatched transactions with amounts > ₹10,000',
    query: 'Show all unmatched transactions above ₹10,000 across Gateway and Bank.'
  },
  {
    icon: Zap,
    title: 'Root Cause Breakdown',
    desc: 'Investigate fee deductions and timing drift anomalies',
    query: 'Why was transaction TXN-98124 flagged for amount mismatch?'
  },
  {
    icon: ShieldCheck,
    title: 'Settlement Health Summary',
    desc: 'Generate reconciliation rate & exception breakdown',
    query: 'Summarize today\'s settlement health report and match rate.'
  }
]

// ─── Custom Zero-Dependency Markdown & SQL Formatter ─────────────────────────
function FormattedMessage({ text }) {
  const [copiedIndex, setCopiedIndex] = useState(null)

  const copyToClipboard = (code, index) => {
    navigator.clipboard.writeText(code)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Split content by code blocks
  const parts = text.split(/(```[\s\S]*?```)/g)

  return (
    <div className="space-y-3 leading-relaxed text-[15px]">
      {parts.map((part, idx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n')
          const language = lines[0].match(/^[a-zA-Z0-9_-]+$/) ? lines[0] : 'sql'
          const codeContent = language === lines[0] ? lines.slice(1).join('\n') : lines.join('\n')

          return (
            <div key={idx} className="my-3 rounded-xl overflow-hidden border border-[#3E3E3E] bg-[#181818] shadow-md font-mono text-sm">
              <div className="flex items-center justify-between px-4 py-2 bg-[#262626] border-b border-[#3E3E3E] text-xs text-gray-300 font-semibold">
                <span className="flex items-center gap-1.5 uppercase text-gray-400">
                  <Terminal size={13} className="text-[#10A37F]" />
                  {language} Query
                </span>
                <button
                  onClick={() => copyToClipboard(codeContent, idx)}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check size={13} className="text-[#10A37F]" />
                      <span className="text-[#10A37F]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-[#00E6A0] custom-scrollbar bg-[#111111] leading-normal text-[13.5px]">
                <code>{codeContent}</code>
              </pre>
            </div>
          )
        }

        // Parse regular lines: headers, bullets, bold text, tables
        const lines = part.split('\n')
        return (
          <div key={idx} className="space-y-1.5">
            {lines.map((line, lIdx) => {
              if (!line.trim()) return <div key={lIdx} className="h-1.5" />

              // Markdown Headers ### or ##
              if (line.startsWith('### ')) {
                return <h4 key={lIdx} className="font-bold text-white text-[16px] pt-2">{line.replace('### ', '')}</h4>
              }
              if (line.startsWith('## ')) {
                return <h3 key={lIdx} className="font-extrabold text-white text-[17px] pt-3">{line.replace('## ', '')}</h3>
              }

              // Bullet points
              if (line.trim().startsWith('- ') || line.trim().startsWith('* ') || line.trim().startsWith('• ')) {
                const bulletText = line.trim().replace(/^[-*•]\s+/, '')
                return (
                  <div key={lIdx} className="flex items-start gap-2 ml-1 text-gray-200">
                    <span className="text-[#10A37F] mt-1 text-lg leading-none">•</span>
                    <span>{renderInlineStyles(bulletText)}</span>
                  </div>
                )
              }

              // Numbered list
              const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/)
              if (numMatch) {
                return (
                  <div key={lIdx} className="flex items-start gap-2.5 ml-1 text-gray-200">
                    <span className="text-[#10A37F] font-bold text-xs mt-1 bg-[#10A37F]/15 px-1.5 py-0.5 rounded border border-[#10A37F]/30">{numMatch[1]}</span>
                    <span>{renderInlineStyles(numMatch[2])}</span>
                  </div>
                )
              }

              // Standard line
              return <p key={lIdx} className="text-gray-200">{renderInlineStyles(line)}</p>
            })}
          </div>
        )
      })}
    </div>
  )
}

function renderInlineStyles(text) {
  // Replace bold **text**
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g)
  return parts.map((seg, i) => {
    if (seg.startsWith('**') && seg.endsWith('**')) {
      return <strong key={i} className="font-bold text-white">{seg.slice(2, -2)}</strong>
    }
    if (seg.startsWith('`') && seg.endsWith('`')) {
      return <code key={i} className="px-1.5 py-0.5 rounded bg-[#333333] text-[#00E6A0] font-mono text-xs border border-[#444444]">{seg.slice(1, -1)}</code>
    }
    return seg
  })
}

export default function ChatPanel({ runId, embedded = false }) {
  const [open, setOpen] = useState(embedded ? true : false)
  const [msgs, setMsgs] = useState([
    { 
      role: 'bot', 
      text: 'Hello! I am your **AI Finance Controller**. I am grounded in your live Gateway, Bank Statement, and ERP Ledger records.\n\nAsk me any natural language question to trace settlements, generate database queries, or explain anomaly root causes.' 
    }
  ])
  const [inp, setInp] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState(null)
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
    setMsgs(p => [...p, { role: 'user', text: q }, { role: 'bot', text: '' }])
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
        arr[arr.length - 1].text = `❌ **Error querying financial database:** ${err.message}`
        return arr
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyMessage = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopiedMessageId(idx)
    setTimeout(() => setCopiedMessageId(null), 2000)
  }

  const handleClearChat = () => {
    setMsgs([
      { 
        role: 'bot', 
        text: 'Conversation reset. How can I assist with your financial investigations and reconciliation today?' 
      }
    ])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    send()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  // ─── Full-page ChatGPT Embedded View ───────────────────────────────────────
  if (embedded) {
    return (
      <div className="bg-[#212121] text-gray-100 border border-[#333333] rounded-2xl shadow-2xl flex flex-col h-[780px] max-w-5xl mx-auto overflow-hidden font-sans transition-all">
        {/* ChatGPT Header */}
        <div className="bg-[#181818] px-6 py-3.5 flex items-center justify-between border-b border-[#2E2E2E] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#10A37F] text-white flex items-center justify-center shadow-sm">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[15px] text-white">Finance Copilot</h3>
                <span className="text-[11px] font-mono uppercase bg-[#10A37F]/20 text-[#10A37F] px-2 py-0.5 rounded-full font-bold border border-[#10A37F]/30">
                  Llama 3.3 70B • NL2SQL
                </span>
              </div>
              <p className="text-xs text-gray-400">Database-Grounded Financial Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2A2A2A] hover:bg-[#333333] text-gray-300 hover:text-white border border-[#3A3A3A] transition-all"
              title="Reset conversation"
            >
              <Trash2 size={13} />
              <span>New Chat</span>
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 bg-[#212121] custom-scrollbar">
          {msgs.map((m, i) => (
            <div key={i} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3.5 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-[#0065FF] text-white' 
                    : 'bg-[#10A37F] text-white'
                }`}>
                  {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>

                {/* Bubble */}
                <div className="flex flex-col group">
                  <div
                    className={`px-5 py-4 rounded-2xl shadow-sm ${
                      m.role === 'user'
                        ? 'bg-[#2F2F2F] text-white border border-[#3E3E3E]'
                        : 'bg-[#262626] text-gray-100 border border-[#353535] rounded-tl-sm'
                    }`}
                  >
                    {m.role === 'bot' && !m.text && loading && (
                      <div className="flex items-center gap-2 text-gray-400 py-1 font-medium text-sm">
                        <RefreshCw size={15} className="animate-spin text-[#10A37F]" />
                        <span>Querying financial ledger & analyzing database records...</span>
                      </div>
                    )}
                    {m.text && <FormattedMessage text={m.text} />}
                  </div>

                  {/* Actions under Assistant Message */}
                  {m.role === 'bot' && m.text && (
                    <div className="flex items-center gap-2 mt-1.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopyMessage(m.text, i)}
                        className="text-xs text-gray-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-[#2A2A2A] hover:bg-[#333333] transition-colors"
                      >
                        {copiedMessageId === i ? <Check size={12} className="text-[#10A37F]" /> : <Copy size={12} />}
                        <span>{copiedMessageId === i ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Prompt Starter Cards (Show when fresh) */}
        {msgs.length <= 1 && (
          <div className="px-6 py-4 bg-[#1C1C1C] border-t border-[#2E2E2E]">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 text-center">Suggested Financial Queries</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-w-3xl mx-auto">
              {QUICK_PROMPT_CARDS.map((card, idx) => {
                const Icon = card.icon
                return (
                  <button
                    key={idx}
                    onClick={() => send(card.query)}
                    disabled={loading}
                    className="flex items-start gap-3 p-3 text-left rounded-xl bg-[#262626] hover:bg-[#2F2F2F] border border-[#383838] hover:border-[#4A4A4A] transition-all group disabled:opacity-50 shadow-sm"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#10A37F]/15 border border-[#10A37F]/30 text-[#10A37F] flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <Icon size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-[#00E6A0] transition-colors">{card.title}</p>
                      <p className="text-xs text-gray-400 line-clamp-1">{card.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ChatGPT Input Box */}
        <div className="p-4 md:p-6 bg-[#181818] border-t border-[#2E2E2E] flex-shrink-0">
          <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
            <div className="relative flex items-center bg-[#262626] border border-[#3D3D3D] focus-within:border-[#10A37F] focus-within:ring-1 focus-within:ring-[#10A37F] rounded-2xl shadow-inner transition-all px-4 py-2">
              <textarea
                rows={1}
                value={inp}
                onChange={e => setInp(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Finance Copilot anything (e.g. 'Where is my ₹25 Lakh settlement?')..."
                className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-gray-500 resize-none py-1.5 max-h-32"
              />
              <button
                type="submit"
                disabled={!inp.trim() || loading}
                className={`ml-2 w-9 h-9 flex items-center justify-center rounded-xl transition-all flex-shrink-0 shadow-md ${
                  !inp.trim() || loading 
                    ? 'bg-[#333333] text-gray-500 cursor-not-allowed' 
                    : 'bg-[#10A37F] hover:bg-[#0E906F] text-white hover:scale-105'
                }`}
              >
                {loading ? <RefreshCw size={16} className="animate-spin" /> : <ArrowUp size={18} strokeWidth={2.5} />}
              </button>
            </div>
            <p className="text-center text-[12px] text-gray-500 mt-2.5">
              Settlement Copilot queries live Gateway, Bank, and Ledger databases. Verify important financial actions.
            </p>
          </form>
        </div>
      </div>
    )
  }

  // ─── Floating Drawer Mode ──────────────────────────────────────────────────
  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#10A37F] hover:bg-[#0E906F] rounded-full shadow-2xl flex items-center justify-center text-white transition-all hover:scale-105 z-50 group border border-white/20"
        title="Open AI Finance Copilot"
      >
        <MessageSquare size={22} />
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#00E6A0]"></span>
        </span>
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 w-[450px] h-[620px] bg-[#212121] text-gray-100 rounded-2xl shadow-2xl border border-[#3E3E3E] flex flex-col z-50 overflow-hidden animate-overlay-slideup font-sans">
          {/* Header */}
          <div className="bg-[#181818] p-4 flex items-center justify-between border-b border-[#2E2E2E]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#10A37F] flex items-center justify-center shadow-sm text-white">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Finance Copilot</h3>
                <p className="text-[11px] text-[#00E6A0] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E6A0] animate-pulse"></span>
                  Grounded in Live Ledger
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleClearChat} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#2A2A2A]" title="Clear chat">
                <Trash2 size={15} />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#2A2A2A]" title="Close">
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#212121] custom-scrollbar text-sm">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'bot' && (
                  <div className="w-6 h-6 rounded-md bg-[#10A37F] text-white flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <Bot size={13} />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl p-3.5 shadow-sm ${
                    m.role === 'user'
                      ? 'bg-[#2F2F2F] text-white border border-[#3E3E3E] rounded-tr-xs font-medium'
                      : 'bg-[#262626] text-gray-100 border border-[#333333] rounded-tl-xs'
                  }`}
                >
                  {m.role === 'bot' && !m.text && loading && (
                    <div className="flex items-center gap-2 text-gray-400 text-xs py-1">
                      <RefreshCw size={13} className="animate-spin text-[#10A37F]" />
                      <span>Thinking & generating SQL...</span>
                    </div>
                  )}
                  {m.text && <FormattedMessage text={m.text} />}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 bg-[#181818] border-t border-[#2E2E2E]">
            <div className="relative flex items-center bg-[#262626] border border-[#3D3D3D] focus-within:border-[#10A37F] rounded-xl px-3 py-1.5 shadow-inner">
              <input
                type="text"
                value={inp}
                onChange={e => setInp(e.target.value)}
                placeholder="Ask about settlements, missing UTRs..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-500 py-1"
              />
              <button
                type="submit"
                disabled={!inp.trim() || loading}
                className={`ml-1 w-7 h-7 flex items-center justify-center rounded-lg ${
                  !inp.trim() || loading 
                    ? 'bg-[#333333] text-gray-500' 
                    : 'bg-[#10A37F] hover:bg-[#0E906F] text-white'
                }`}
              >
                {loading ? <RefreshCw size={13} className="animate-spin" /> : <ArrowUp size={14} />}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
