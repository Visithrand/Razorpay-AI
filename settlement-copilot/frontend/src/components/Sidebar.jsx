import { 
  Home, ArrowLeftRight, Zap, TrendingUp, FileText, 
  Link as LinkIcon, Layout, Share2, Repeat, Users, BarChart2, Settings 
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'home',            label: 'Home',           icon: Home,           badge: null },
  { id: 'transactions',    label: 'Transactions',   icon: ArrowLeftRight, badge: null },
  { id: 'reconciliation',  label: 'Reconciliation', icon: Zap,            badge: 'NEW' },
  { id: 'settlements',     label: 'Settlements',    icon: TrendingUp,     badge: null },
  { id: 'invoices',        label: 'Invoices',       icon: FileText,       badge: null },
  { id: 'payment-links',   label: 'Payment Links',  icon: LinkIcon,       badge: null },
  { id: 'payment-pages',   label: 'Payment Pages',  icon: Layout,         badge: null },
  { id: 'route',           label: 'Route',          icon: Share2,         badge: null },
  { id: 'subscriptions',   label: 'Subscriptions',  icon: Repeat,         badge: null },
  { id: 'customers',       label: 'Customers',      icon: Users,          badge: null },
  { id: 'reports',         label: 'Reports',        icon: BarChart2,      badge: null },
  { id: 'settings',        label: 'Settings',       icon: Settings,       badge: null },
]

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="w-[260px] flex-shrink-0 bg-[#00041a]/80 backdrop-blur-xl flex flex-col h-full border-r border-white/5 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
      {/* Razorpay Logo Area */}
      <div className="px-6 py-6 border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#2b6aff]/10 to-transparent pointer-events-none" />
        <div className="flex items-center gap-3 relative">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2b6aff] to-[#0047ff] flex items-center justify-center shadow-[0_0_15px_rgba(43,106,255,0.4)]">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Razorpay<span className="text-[#00e676]">.</span></span>
        </div>
        <div className="mt-4 flex items-center gap-2 relative">
          <div className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse shadow-[0_0_10px_rgba(0,230,118,0.8)]" />
          <span className="text-[11px] text-[#00e676] uppercase tracking-widest font-bold">Live System</span>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-300 group relative ${
                isActive
                  ? 'bg-gradient-to-r from-[#2b6aff]/20 to-transparent border border-[#2b6aff]/30 shadow-[inset_0_0_20px_rgba(43,106,255,0.15)]'
                  : 'border border-transparent hover:bg-white/5 hover:border-white/10'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#00e676] rounded-r-full shadow-[0_0_10px_rgba(0,230,118,0.5)]" />
              )}
              
              <Icon 
                size={18} 
                className={isActive ? 'text-[#00e676] drop-shadow-[0_0_8px_rgba(0,230,118,0.5)]' : 'text-[#64748b] group-hover:text-white transition-colors'} 
              />
              <span className={`text-sm flex-1 ${isActive ? 'text-white font-bold tracking-wide' : 'text-[#94a3b8] font-medium group-hover:text-white transition-colors'}`}>
                {item.label}
              </span>
              {item.badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-[#00e676] text-[#02042b]' : 'bg-[#2b6aff]/20 text-[#2b6aff] border border-[#2b6aff]/30 group-hover:bg-[#2b6aff] group-hover:text-white transition-all'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Profile Section */}
      <div className="px-5 py-5 border-t border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2b6aff] to-[#0047ff] p-[2px] shadow-[0_0_15px_rgba(43,106,255,0.3)]">
            <div className="w-full h-full bg-[#02042b] rounded-[10px] flex items-center justify-center text-white text-sm font-bold">
              SC
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">Settlement Copilot</p>
            <p className="text-[#64748b] text-xs truncate font-medium">Creative Demo</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
