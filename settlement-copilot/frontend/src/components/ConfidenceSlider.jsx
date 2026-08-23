import { Settings2, Loader2, Sparkles, Target, AlertTriangle, ShieldCheck } from 'lucide-react'

export default function ConfidenceSlider({ value, onChange, matchCount, exceptionCount, isLoading }) {
  return (
    <div className="bg-white border border-[#e3e8ef] rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-[#1a1f36] flex items-center gap-2">
            <Settings2 size={20} className="text-[#3d8ef8]" />
            Confidence Strictness
          </h3>
          <p className="text-sm text-[#697386] mt-1">
            Adjust the AI tolerance for fuzzy matching. Lower values capture more matches (higher recall).
          </p>
        </div>
        <div className="flex items-center gap-8 text-right bg-[#fafbfc] px-5 py-3 rounded-xl border border-[#f0f3f8]">
          <div className="border-r border-[#e3e8ef] pr-8">
            <p className="text-[10px] text-[#697386] uppercase tracking-widest font-bold mb-1">Strictness</p>
            <p className="text-2xl font-bold text-[#3d8ef8]">{(value * 100).toFixed(0)}%</p>
          </div>
          <div className="border-r border-[#e3e8ef] pr-8 pl-4">
            <p className="text-[10px] text-[#697386] uppercase tracking-widest font-bold mb-1">Matches</p>
            <p className="text-2xl font-bold text-[#2eb88a] flex items-center gap-2">
              {isLoading ? <Loader2 size={20} className="animate-spin text-[#2eb88a]/50" /> : matchCount}
            </p>
          </div>
          <div className="pl-4">
            <p className="text-[10px] text-[#697386] uppercase tracking-widest font-bold mb-1">Exceptions</p>
            <p className="text-2xl font-bold text-[#e04d4d] flex items-center gap-2">
              {isLoading ? <Loader2 size={20} className="animate-spin text-[#e04d4d]/50" /> : exceptionCount}
            </p>
          </div>
        </div>
      </div>

      <div className="relative pt-2 pb-4">
        <input
          type="range" min="0" max="1" step="0.01" value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-3 rounded-full appearance-none cursor-pointer shadow-inner"
          style={{ background: `linear-gradient(to right, #3d8ef8 ${value * 100}%, #e3e8ef ${value * 100}%)` }}
        />
        <div className="absolute top-7 left-[50%] w-0.5 h-3 bg-[#c8d0dc] -translate-x-1/2" />
        <div className="absolute top-7 left-[70%] w-0.5 h-3 bg-[#c8d0dc] -translate-x-1/2" />
        <div className="absolute top-7 left-[90%] w-0.5 h-3 bg-[#c8d0dc] -translate-x-1/2" />
      </div>

      <div className="flex justify-between text-xs font-semibold text-[#a3acb9]">
        <span className="flex items-center gap-1.5"><Sparkles size={14} /> High Recall (Loose)</span>
        <span className="flex items-center gap-1.5 text-[#697386]">Balanced</span>
        <span className="flex items-center gap-1.5"><Target size={14} /> High Precision (Strict)</span>
      </div>

      {/* Visual hint pills */}
      <div className="flex gap-3 mt-5 flex-wrap pt-5 border-t border-[#f0f3f8]">
        <span className="text-xs font-bold text-[#697386] uppercase tracking-wider self-center mr-2">Presets:</span>
        {[
          { label: '0%',  hint: 'Match all', icon: Sparkles, color: 'bg-[#fdf0f0] text-[#e04d4d] border-[#e04d4d]/20 hover:bg-[#e04d4d] hover:text-white' },
          { label: '50%', hint: 'Balanced',  icon: Target, color: 'bg-[#fef7e6] text-[#e9a820] border-[#e9a820]/20 hover:bg-[#e9a820] hover:text-white' },
          { label: '70%', hint: 'Recommended', icon: ShieldCheck, color: 'bg-[#e8f0fe] text-[#3d8ef8] border-[#3d8ef8]/20 bg-[#3d8ef8] text-white shadow-md' },
          { label: '90%', hint: 'Strict',    icon: AlertTriangle, color: 'bg-[#e8f7f1] text-[#2eb88a] border-[#2eb88a]/20 hover:bg-[#2eb88a] hover:text-white' },
        ].map((p) => {
          const Icon = p.icon
          const isActive = value === parseFloat(p.label) / 100
          
          return (
            <button
              key={p.label}
              onClick={() => onChange(parseFloat(p.label) / 100)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                isActive ? p.color : 'bg-white border-[#e3e8ef] text-[#697386] hover:border-[#1a1f36]'
              }`}
            >
              <Icon size={14} /> {p.label} — {p.hint}
            </button>
          )
        })}
      </div>
    </div>
  )
}
