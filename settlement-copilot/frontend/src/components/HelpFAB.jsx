import { useState } from 'react'
import { 
  HelpCircle, X, Zap, BarChart2, RotateCcw, ChevronRight,
  Home, ArrowLeftRight, TrendingUp, Users, Settings, Keyboard
} from 'lucide-react'

const QUICK_STEPS = [
  { num: 1, label: 'Go to Reconciliation', desc: 'Click "Reconciliation" in the sidebar' },
  { num: 2, label: 'Upload your files', desc: 'Drag & drop gateway CSV, bank statement, and ledger' },
  { num: 3, label: 'Review AI matches', desc: 'Adjust confidence threshold and review results' },
  { num: 4, label: 'Export results', desc: 'Download your reconciliation report as CSV' },
]

const SHORTCUTS = [
  { keys: ['⌘', 'K'], label: 'Search anything' },
  { keys: ['⌘', 'B'], label: 'Toggle sidebar' },
  { keys: ['Esc'], label: 'Close modal' },
]

const FEATURES = [
  { icon: Home, label: 'Home', desc: 'KPIs, charts, and quick actions' },
  { icon: ArrowLeftRight, label: 'Transactions', desc: 'All payments and status tracking' },
  { icon: Zap, label: 'Reconciliation', desc: 'AI-powered matching engine' },
  { icon: TrendingUp, label: 'Settlements', desc: 'Bank transfer tracking' },
  { icon: BarChart2, label: 'Reports', desc: 'Volume analytics and trends' },
  { icon: Users, label: 'Customers', desc: 'Customer directory and history' },
  { icon: Settings, label: 'Settings', desc: 'API keys, webhooks, and team' },
]

export default function HelpFAB({ onRestartTour }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('quickstart')

  const TABS = [
    { id: 'quickstart', label: 'Quick Start', icon: Zap },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
    { id: 'features', label: 'Features', icon: BarChart2 },
  ]

  return (
    <>
      {/* FAB — Placed on the bottom-left to prevent overlap with Copilot drawer */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-5 left-5 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg border ${
          isOpen 
            ? 'bg-white border-gray-200 hover:bg-gray-50' 
            : 'text-white border-transparent fab-pulse hover:scale-105'
        }`}
        style={!isOpen ? { background: 'var(--rz-blue)' } : {}}
        title="Help & Quick Start"
      >
        {isOpen ? (
          <X size={18} style={{ color: 'var(--rz-text-secondary)' }} />
        ) : (
          <HelpCircle size={20} className="text-white" />
        )}
      </button>

      {/* Drawer */}
      {isOpen && (
        <div className="fixed bottom-20 left-5 z-50 w-[340px] max-h-[65vh] help-drawer-enter">
          <div className="bg-white border rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[65vh]" style={{ borderColor: 'var(--rz-border)' }}>
            {/* Header */}
            <div className="px-5 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--rz-border-light)' }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded border flex items-center justify-center p-0.5 shadow-sm overflow-hidden bg-white" style={{ borderColor: 'var(--rz-border)' }}>
                  <img src="/razorpay-logo.jpg" alt="Razorpay" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold" style={{ color: 'var(--rz-text-primary)' }}>Help Center</h3>
                  <p className="text-xs" style={{ color: 'var(--rz-text-muted)' }}>Everything you need to get started</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b px-5 flex-shrink-0" style={{ borderColor: 'var(--rz-border-light)' }}>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2.5 text-[13px] font-bold transition-colors duration-150 border-b-2 -mb-px ${
                    activeTab === tab.id ? 'border-[#528FF0]' : 'border-transparent'
                  }`}
                  style={{ color: activeTab === tab.id ? 'var(--rz-blue)' : 'var(--rz-text-muted)' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
              {activeTab === 'quickstart' && (
                <div className="space-y-3">
                  <p className="text-[13px] mb-3" style={{ color: 'var(--rz-text-muted)' }}>Follow these steps to reconcile your first batch:</p>
                  {QUICK_STEPS.map((step, i) => (
                    <div key={step.num} className="flex items-start gap-3 stagger-item" style={{ animationDelay: `${i * 0.06}s` }}>
                      <div className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0" style={{ background: 'var(--rz-blue)' }}>
                        {step.num}
                      </div>
                      <div className="pt-0.5">
                        <h4 className="text-sm font-bold" style={{ color: 'var(--rz-text-primary)' }}>{step.label}</h4>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--rz-text-muted)' }}>{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'shortcuts' && (
                <div className="space-y-2">
                  <p className="text-[13px] mb-3" style={{ color: 'var(--rz-text-muted)' }}>Keyboard shortcuts:</p>
                  {SHORTCUTS.map((sc, i) => (
                    <div key={sc.label} className="flex items-center justify-between py-2 px-3 rounded-lg border stagger-item" style={{ borderColor: 'var(--rz-border)', animationDelay: `${i * 0.05}s` }}>
                      <span className="text-sm font-semibold" style={{ color: 'var(--rz-text-secondary)' }}>{sc.label}</span>
                      <div className="flex items-center gap-1">
                        {sc.keys.map(k => (
                          <kbd key={k} className="px-1.5 py-0.5 bg-gray-50 border border-gray-200 rounded text-xs font-bold min-w-[22px] text-center" style={{ color: 'var(--rz-text-muted)' }}>
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'features' && (
                <div className="space-y-1.5">
                  <p className="text-[13px] mb-3" style={{ color: 'var(--rz-text-muted)' }}>What each section does:</p>
                  {FEATURES.map((f, i) => {
                    const Icon = f.icon
                    return (
                      <div key={f.label} className="flex items-center gap-2.5 py-2 px-3 rounded-lg border hover:bg-gray-50 transition-colors stagger-item" style={{ borderColor: 'var(--rz-border)', animationDelay: `${i * 0.04}s` }}>
                        <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'var(--rz-blue-light)' }}>
                          <Icon size={13} style={{ color: 'var(--rz-blue)' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[13px] font-bold" style={{ color: 'var(--rz-text-primary)' }}>{f.label}</h4>
                          <p className="text-[9px]" style={{ color: 'var(--rz-text-muted)' }}>{f.desc}</p>
                        </div>
                        <ChevronRight size={11} className="text-gray-300 flex-shrink-0" />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t flex-shrink-0" style={{ borderColor: 'var(--rz-border-light)' }}>
              <button
                onClick={() => { onRestartTour(); setIsOpen(false) }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 border rounded-md text-sm font-semibold hover:bg-gray-50 transition-colors"
                style={{ borderColor: 'var(--rz-border)', color: 'var(--rz-text-secondary)' }}
              >
                <RotateCcw size={13} />
                Restart Tour
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
