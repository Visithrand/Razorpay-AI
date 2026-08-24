import { useState } from 'react'
import { 
  ArrowRight, Upload, BarChart2, Users, Shield, 
  ChevronRight, ChevronLeft, Zap, X
} from 'lucide-react'

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Razorpay',
    subtitle: 'Settlement Copilot',
    description: 'Your AI-powered payment reconciliation platform. Automatically match gateway settlements against bank statements with intelligent confidence scoring.',
    features: [
      { icon: Zap, label: 'AI-Powered Matching', desc: 'Smart algorithms auto-reconcile your transactions' },
      { icon: Shield, label: 'Secure & Reliable', desc: 'Bank-grade security for all your financial data' },
      { icon: BarChart2, label: 'Real-time Analytics', desc: 'Live dashboards and detailed reporting' },
    ]
  },
  {
    id: 'navigation',
    title: 'Your Dashboard',
    subtitle: 'Navigate with Ease',
    description: 'The sidebar gives you one-click access to everything. Here are the key sections:',
    sections: [
      { emoji: '🏠', label: 'Home', desc: 'Overview dashboard with KPIs and quick actions' },
      { emoji: '💳', label: 'Transactions', desc: 'View all payments — captured, failed, and refunded' },
      { emoji: '⚡', label: 'Reconciliation', desc: 'Upload files and let AI match your transactions' },
      { emoji: '📊', label: 'Settlements', desc: 'Track bank transfers and settlement statuses' },
      { emoji: '📈', label: 'Reports', desc: 'Deep dive into payment volume and analytics' },
    ]
  },
  {
    id: 'quickstart',
    title: 'Reconcile in Minutes',
    subtitle: 'Get Started in 3 Steps',
    description: 'Our AI copilot makes reconciliation effortless:',
    steps: [
      { num: '1', label: 'Upload Your Files', desc: 'Drag & drop your gateway CSV, bank statement, and ledger file into the Reconciliation page.' },
      { num: '2', label: 'AI Matches Automatically', desc: 'Our engine matches transactions across all three sources using fuzzy matching and confidence scoring.' },
      { num: '3', label: 'Review & Export', desc: 'Review matched pairs, handle exceptions, and export your reconciliation report.' },
    ]
  },
  {
    id: 'support',
    title: 'Need Help?',
    subtitle: 'We\'re Here for You',
    description: 'Multiple ways to get help anytime:',
    resources: [
      { emoji: '❓', label: 'Help Button', desc: 'Click the floating "?" button (bottom-right) for quick guides.' },
      { emoji: '💬', label: 'AI Chat', desc: 'Ask questions about your data on the Reconciliation page.' },
      { emoji: '📖', label: 'Documentation', desc: 'Comprehensive guides in the Settings page.' },
      { emoji: '🔔', label: 'Notifications', desc: 'Real-time alerts for settlements, failures, and more.' },
    ]
  },
]

export default function OnboardingOverlay({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0)
  const step = STEPS[currentStep]
  const isLast = currentStep === STEPS.length - 1

  const goNext = () => {
    if (isLast) { onComplete(); return }
    setCurrentStep(prev => prev + 1)
  }

  const goPrev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-overlay-fadein">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative w-full max-w-xl mx-4 animate-overlay-slideup">
        {/* Skip */}
        <button 
          onClick={onComplete}
          className="absolute -top-10 right-0 text-[12px] text-white/60 hover:text-white flex items-center gap-1 transition-colors font-semibold"
        >
          Skip Tour <X size={13} />
        </button>

        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Blue accent bar */}
          <div className="h-1" style={{ background: 'var(--rz-blue)' }} />

          <div className="p-7" key={currentStep}>
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-5">
              <span className="text-[10px] font-extrabold tracking-[2px] uppercase" style={{ color: 'var(--rz-blue)' }}>
                Step {currentStep + 1} of {STEPS.length}
              </span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <div className="animate-slide-content">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded border flex items-center justify-center p-0.5 shadow-sm bg-white" style={{ borderColor: 'var(--rz-border)' }}>
                  <img src="/razorpay-logo.jpg" alt="Razorpay" className="w-full h-full object-contain" />
                </div>
                <h2 className="text-2xl font-extrabold" style={{ color: 'var(--rz-text-primary)' }}>{step.title}</h2>
              </div>
              <p className="text-[15px] font-bold mb-2" style={{ color: 'var(--rz-blue)' }}>{step.subtitle}</p>
              <p className="text-[13px] leading-relaxed mb-6" style={{ color: 'var(--rz-text-secondary)' }}>{step.description}</p>

              {/* Welcome features */}
              {step.id === 'welcome' && (
                <div className="grid grid-cols-3 gap-3">
                  {step.features.map((f, i) => {
                    const Icon = f.icon
                    return (
                      <div key={f.label} className="p-4 rounded-lg border stagger-item" style={{ borderColor: 'var(--rz-border)', animationDelay: `${i * 0.08}s` }}>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: 'var(--rz-blue-light)' }}>
                          <Icon size={18} style={{ color: 'var(--rz-blue)' }} />
                        </div>
                        <h4 className="text-[12px] font-bold mb-1" style={{ color: 'var(--rz-text-primary)' }}>{f.label}</h4>
                        <p className="text-[10px] leading-relaxed" style={{ color: 'var(--rz-text-muted)' }}>{f.desc}</p>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Navigation sections */}
              {step.id === 'navigation' && (
                <div className="space-y-2">
                  {step.sections.map((s, i) => (
                    <div key={s.label} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors stagger-item" style={{ borderColor: 'var(--rz-border)', animationDelay: `${i * 0.06}s` }}>
                      <span className="text-xl">{s.emoji}</span>
                      <div className="flex-1">
                        <h4 className="text-[12px] font-bold" style={{ color: 'var(--rz-text-primary)' }}>{s.label}</h4>
                        <p className="text-[10px]" style={{ color: 'var(--rz-text-muted)' }}>{s.desc}</p>
                      </div>
                      <ChevronRight size={13} className="text-gray-300" />
                    </div>
                  ))}
                </div>
              )}

              {/* Quick start steps */}
              {step.id === 'quickstart' && (
                <div className="space-y-4">
                  {step.steps.map((s, i) => (
                    <div key={s.num} className="flex items-start gap-4 stagger-item" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0" style={{ background: 'var(--rz-blue)' }}>
                        {s.num}
                      </div>
                      <div className="pt-0.5">
                        <h4 className="text-[13px] font-bold mb-0.5" style={{ color: 'var(--rz-text-primary)' }}>{s.label}</h4>
                        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--rz-text-muted)' }}>{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Support resources */}
              {step.id === 'support' && (
                <div className="grid grid-cols-2 gap-3">
                  {step.resources.map((r, i) => (
                    <div key={r.label} className="p-3 rounded-lg border stagger-item" style={{ borderColor: 'var(--rz-border)', animationDelay: `${i * 0.06}s` }}>
                      <span className="text-lg">{r.emoji}</span>
                      <h4 className="text-[12px] font-bold mt-1.5 mb-0.5" style={{ color: 'var(--rz-text-primary)' }}>{r.label}</h4>
                      <p className="text-[10px] leading-relaxed" style={{ color: 'var(--rz-text-muted)' }}>{r.desc}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-7 pb-6 flex items-center justify-between">
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === currentStep ? 'w-6 h-2' : 'w-2 h-2'
                  }`}
                  style={{ background: i === currentStep ? 'var(--rz-blue)' : i < currentStep ? 'var(--rz-blue)' : '#E0E0E0', opacity: i <= currentStep ? 1 : 0.5 }}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button onClick={goPrev} className="px-4 py-2 text-[13px] font-semibold rounded-md border hover:bg-gray-50 transition-colors flex items-center gap-1.5" style={{ color: 'var(--rz-text-secondary)', borderColor: 'var(--rz-border)' }}>
                  <ChevronLeft size={14} /> Back
                </button>
              )}
              <button onClick={goNext} className="px-5 py-2 text-[13px] font-bold rounded-md text-white transition-colors flex items-center gap-1.5 hover:opacity-90" style={{ background: 'var(--rz-blue)' }}>
                {isLast ? 'Get Started' : 'Next'}
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
