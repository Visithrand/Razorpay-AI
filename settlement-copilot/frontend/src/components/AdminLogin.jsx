import { useState } from 'react'
import { ArrowRight, CheckCircle2, Shield, Sparkles, Lock, RefreshCw, KeyRound } from 'lucide-react'
import { sendOtp, verifyOtp } from '../api'

export default function AdminLogin({ onLoginSuccess }) {
  const [identifier, setIdentifier] = useState('')
  const [otp, setOtp] = useState('')
  const [simulatedOtp, setSimulatedOtp] = useState('')
  const [step, setStep] = useState('identifier') // 'identifier' | 'otp'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault()
    const cleanId = identifier.trim()
    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(cleanId)) {
      setError('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await sendOtp(cleanId)
      if (res && res.otp) {
        setSimulatedOtp(res.otp)
      }
      setStep('otp')
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault()
    const cleanOtp = otp.trim()
    if (!cleanOtp) {
      setError('Please enter the 6-digit OTP code.')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await verifyOtp(identifier.trim(), cleanOtp)
      onLoginSuccess(res.user)
    } catch (err) {
      setError(err.message || 'Invalid verification code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoSignIn = async () => {
    const demoPhone = '9876543210'
    setIdentifier(demoPhone)
    setLoading(true)
    try {
      const res = await sendOtp(demoPhone)
      const verifyRes = await verifyOtp(demoPhone, '123456')
      onLoginSuccess(verifyRes.user)
    } catch (err) {
      onLoginSuccess({
        id: 1,
        identifier: '9876543210',
        name: 'Visithran M',
        role: 'Merchant Admin',
        mid: 'mid_rzp_demo9812'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      onLoginSuccess({
        id: 2,
        identifier: 'reviewer.google@gmail.com',
        name: 'Finance Controller',
        role: 'Merchant Admin',
        mid: 'mid_rzp_google99'
      })
    } catch (err) {
      setError('Google Sign-In failed.')
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
              <img src="/razorpay-logo.jpg" alt="Razorpay Design 3 Logo" className="h-full object-contain" />
            </div>
            <span className="text-[#05103E] font-extrabold text-2xl tracking-tight">Razorpay</span>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="my-auto py-12 relative z-10 max-w-lg">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#0065FF]/10 text-[#0065FF] mb-6 border border-[#0065FF]/20">
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
        <div className="relative z-10 text-[13px] text-[#718096] font-medium flex items-center gap-2">
          <Shield size={16} className="text-[#0065FF]" />
          Bank-grade 256-bit SSL Encrypted Merchant Authentication
        </div>

        {/* Background shapes */}
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-[#0065FF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-[#00C2FF]/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Right Pane — Auth Form */}
      <div className="lg:w-1/2 p-8 lg:p-16 flex items-center justify-center bg-white relative">
        {/* Ribbon */}
        <div className="absolute top-0 right-0 overflow-hidden w-40 h-40 pointer-events-none">
          <div className="bg-gradient-to-r from-[#0065FF] to-[#00C2FF] text-white font-extrabold text-[11px] uppercase tracking-wider py-1.5 px-10 transform rotate-45 translate-x-10 translate-y-6 shadow-md text-center">
            0%* Platform Fees
          </div>
        </div>

        <div className="w-full max-w-md">
          {/* Card Logo Icon */}
          <div className="w-12 h-12 rounded-xl bg-[#E6F0FF] border border-[#DCE3ED] flex items-center justify-center p-2 mb-6 shadow-sm">
            <img src="/razorpay-logo.jpg" alt="Razorpay" className="w-full h-full object-contain" />
          </div>

          <p className="text-[14px] font-bold text-[#718096] mb-1">Welcome to Razorpay Admin Portal</p>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-[#0B192C] mb-8">
            {step === 'identifier' ? 'Get started with your mobile number' : 'Enter 6-digit OTP code'}
          </h2>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-[#FEE2E2] border border-[#EF4444]/30 text-[#EF4444] text-[13px] font-semibold flex items-center gap-2">
              <Lock size={16} /> {error}
            </div>
          )}

          {step === 'identifier' ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-[13px] font-bold text-[#4A5568] uppercase tracking-wider mb-2">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full px-4 py-3 bg-[#EFF3F8]/50 border border-[#DCE3ED] rounded-xl text-[15px] font-semibold text-[#0B192C] outline-none focus:border-[#0065FF] focus:bg-white transition-all placeholder:text-gray-400 placeholder:font-normal"
                />
                <p className="text-[12px] text-[#718096] mt-2">
                  Please enter a 10-digit mobile number (e.g. <code className="font-mono text-[#0065FF]">9876543210</code>).
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#0065FF] hover:bg-[#0052CC] text-white font-bold text-[15px] rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : 'Send Verification OTP'}
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 bg-white hover:bg-gray-50 border border-[#DCE3ED] text-[#4A5568] font-bold text-[14px] rounded-xl transition-all flex items-center justify-center gap-2.5 shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Continue with Google
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-[#DCE3ED]"></div>
                <span className="flex-shrink mx-4 text-[12px] font-bold text-gray-400 uppercase">or</span>
                <div className="flex-grow border-t border-[#DCE3ED]"></div>
              </div>

              <button
                type="button"
                onClick={handleDemoSignIn}
                disabled={loading}
                className="w-full py-3.5 bg-[#EFF3F8] hover:bg-[#E6F0FF] border border-[#DCE3ED] text-[#0B192C] font-extrabold text-[14px] rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Sparkles size={18} className="text-[#0065FF]" />
                ⚡ Instant Demo Admin Sign In (1-Click)
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="p-4 rounded-xl bg-[#D1FAE5] border border-[#10B981]/30 text-[#10B981] text-[13px] font-bold flex items-start gap-2.5">
                <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[#0B192C] font-extrabold text-[14px]">OTP sent successfully</p>
                  <p className="text-[12px] text-[#718096] font-normal mt-0.5">
                    Verification code has been sent to your registered mobile number <span className="font-bold text-[#0065FF]">{identifier}</span>. Please enter the code below to proceed.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#4A5568] uppercase tracking-wider mb-2">
                  Enter 6-Digit OTP *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="w-full px-4 py-3 bg-[#EFF3F8]/50 border border-[#DCE3ED] rounded-xl text-center tracking-[12px] font-mono text-2xl font-bold text-[#0B192C] outline-none focus:border-[#0065FF] focus:bg-white transition-all placeholder:text-gray-400 placeholder:font-normal placeholder:tracking-normal"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#0065FF] hover:bg-[#0052CC] text-white font-bold text-[15px] rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Verifying OTP...' : 'Verify OTP & Register Admin Entry'}
                <ArrowRight size={18} />
              </button>

              <div className="flex items-center justify-between pt-2 text-[13px]">
                <button
                  type="button"
                  onClick={() => setStep('identifier')}
                  className="text-gray-500 font-semibold hover:underline"
                >
                  Edit Mobile Number
                </button>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-[#0065FF] font-bold hover:underline flex items-center gap-1"
                >
                  <RefreshCw size={13} /> Resend OTP
                </button>
              </div>
            </form>
          )}

          <div className="mt-10 pt-6 border-t border-[#E8EEF5] text-center text-[12px] text-[#718096]">
            By continuing, you agree to Razorpay's <a href="https://razorpay.com/terms/" target="_blank" rel="noreferrer" className="text-[#0065FF] underline font-semibold">terms of use</a> & <a href="https://razorpay.com/privacy/" target="_blank" rel="noreferrer" className="text-[#0065FF] underline font-semibold">privacy policy</a>.
          </div>
        </div>
      </div>
    </div>
  )
}
