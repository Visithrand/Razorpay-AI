import { useState } from 'react'
import { ArrowRight, CheckCircle2, Shield, Sparkles, Lock, User, Mail, KeyRound } from 'lucide-react'
import { login, register } from '../api'

export default function AdminLogin({ onLoginSuccess }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  
  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all required fields.')
      return
    }
    
    if (mode === 'register' && !name.trim()) {
      setError('Please provide your full name.')
      return
    }
    
    setLoading(true)

    try {
      let user = null
      if (mode === 'register') {
        user = await register(name.trim(), email.trim(), password)
      } else {
        user = await login(email.trim(), password)
      }
      onLoginSuccess(user)
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white font-sans overflow-hidden relative">
      {/* Left Pane — Razorpay Branding */}
      <div className="lg:w-1/2 bg-gradient-to-br from-[#E6F0FF] via-[#EAF2FF] to-[#D5E5FF] p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Top Logo */}
        <div className="relative z-10">
          <div className="h-10 flex items-center gap-3">
            <div className="h-9 rounded bg-white p-1 shadow-sm border border-[#DCE3ED]">
              <img src="https://razorpay.com/assets/razorpay-glyph.svg" alt="Razorpay Design 3 Logo" className="h-full object-contain" />
            </div>
            <span className="text-[#05103E] font-extrabold text-2xl tracking-tight">Razorpay</span>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="my-auto py-12 relative z-10 max-w-lg">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-extrabold bg-[#0065FF]/10 text-[#0065FF] mb-6 border border-[#0065FF]/20">
            <Sparkles size={14} /> Settlement Copilot Admin Portal
          </span>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-[#0B192C] leading-tight mb-6">
            Join 8 Million Businesses that Trust Razorpay to Supercharge their Business
          </h1>

          <div className="space-y-4">
            {[
              '100+ Payment Methods Supported',
              'Easy API & Settlement Integration',
              'Powerful AI Reconciliation & Analytics Dashboard'
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-3 text-[15px] font-bold text-[#0B192C]">
                <div className="w-6 h-6 rounded-full bg-[#10B981]/20 text-[#10B981] flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={16} />
                </div>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="relative z-10 text-[15px] text-[#718096] font-medium flex items-center gap-2">
          <Shield size={16} className="text-[#0065FF]" />
          Bank-grade 256-bit SSL Encrypted Merchant Authentication
        </div>

        {/* Background shapes */}
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-[#0065FF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-[#00C2FF]/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Right Pane — Auth Form */}
      <div className="lg:w-1/2 p-8 lg:p-16 flex items-center justify-center bg-white relative">
        <div className="w-full max-w-md">
          {/* Card Logo Icon */}
          <div className="w-12 h-12 rounded-xl bg-[#E6F0FF] border border-[#DCE3ED] flex items-center justify-center p-2 mb-6 shadow-sm">
            <img src="https://razorpay.com/assets/razorpay-glyph.svg" alt="Razorpay" className="w-full h-full object-contain" />
          </div>

          <p className="text-base font-bold text-[#718096] mb-1">Welcome to Razorpay Admin Portal</p>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-[#0B192C] mb-8">
            {mode === 'login' ? 'Log in to your account' : 'Create your account'}
          </h2>

          {/* Mode Switcher */}
          <div className="flex bg-[#EFF3F8] p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                mode === 'login' ? 'bg-white text-[#0B192C] shadow-sm' : 'text-[#718096] hover:text-[#0B192C]'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                mode === 'register' ? 'bg-white text-[#0B192C] shadow-sm' : 'text-[#718096] hover:text-[#0B192C]'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-[#FEE2E2] border border-[#EF4444]/30 text-[#EF4444] text-[15px] font-semibold flex items-center gap-2">
              <Lock size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div>
                <label className="block text-[15px] font-bold text-[#4A5568] uppercase tracking-wider mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full pl-11 pr-4 py-3 bg-[#EFF3F8]/50 border border-[#DCE3ED] rounded-xl text-[15px] font-semibold text-[#0B192C] outline-none focus:border-[#0065FF] focus:bg-white transition-all placeholder:text-gray-400 placeholder:font-normal"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[15px] font-bold text-[#4A5568] uppercase tracking-wider mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-11 pr-4 py-3 bg-[#EFF3F8]/50 border border-[#DCE3ED] rounded-xl text-[15px] font-semibold text-[#0B192C] outline-none focus:border-[#0065FF] focus:bg-white transition-all placeholder:text-gray-400 placeholder:font-normal"
                />
              </div>
            </div>

            <div>
              <label className="block text-[15px] font-bold text-[#4A5568] uppercase tracking-wider mb-2">
                Password *
              </label>
              <div className="relative">
                <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-[#EFF3F8]/50 border border-[#DCE3ED] rounded-xl text-[15px] font-semibold text-[#0B192C] outline-none focus:border-[#0065FF] focus:bg-white transition-all placeholder:text-gray-400 placeholder:font-normal"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#0065FF] hover:bg-[#0052CC] text-white font-bold text-[15px] rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (mode === 'login' ? 'Authenticating...' : 'Registering...') : (mode === 'login' ? 'Log In' : 'Create Account')}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-[#E8EEF5] text-center text-sm text-[#718096]">
            By continuing, you agree to Razorpay's <a href="https://razorpay.com/terms/" target="_blank" rel="noreferrer" className="text-[#0065FF] underline font-semibold">terms of use</a> & <a href="https://razorpay.com/privacy/" target="_blank" rel="noreferrer" className="text-[#0065FF] underline font-semibold">privacy policy</a>.
          </div>
        </div>
      </div>
    </div>
  )
}
