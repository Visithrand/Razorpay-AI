import { 
  LayoutDashboard, Activity, ArrowLeftRight, Play, AlertCircle, 
  ShieldCheck, MessageSquare, FileText, ChevronLeft, ChevronRight, Beaker
} from 'lucide-react'

const NAV_SECTIONS = [
  {
    title: 'OVERVIEW',
    items: [
      { id: 'overview', label: 'Executive Dashboard', icon: LayoutDashboard, badge: null },
    ]
  },
  {
    title: 'MONITORING',
    items: [
      { id: 'live-monitor', label: 'Live Monitor', icon: Activity, badge: 'LIVE' },
      { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight, badge: null },
    ]
  },
  {
    title: 'RECONCILIATION',
    items: [
      { id: 'reconciliation', label: 'Run Reconciliation', icon: Play, badge: null },
      { id: 'exceptions', label: 'Exceptions', icon: AlertCircle, badge: null },
    ]
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { id: 'investigation', label: 'AI Investigations', icon: ShieldCheck, badge: null },
      { id: 'ai-assistant', label: 'Finance Copilot', icon: MessageSquare, badge: null },
      { id: 'scenario-lab', label: 'Scenario Lab', icon: Beaker, badge: null },
    ]
  },
  {
    title: 'GOVERNANCE',
    items: [
      { id: 'audit-log', label: 'Audit Trail', icon: FileText, badge: null },
    ]
  }
]

export default function Sidebar({ activePage, onNavigate, collapsed, onToggle }) {
  return (
    <aside 
      className={`bg-[var(--rz-bg-sidebar)] text-white flex flex-col flex-shrink-0 sidebar-transition relative border-r border-white/5 shadow-xl group z-30 ${
        collapsed ? 'w-16' : 'w-[250px]'
      }`}
    >
      {/* Floating Hover Toggle */}
      <button 
        onClick={onToggle}
        className="absolute -right-3.5 top-6 w-7 h-7 bg-white border border-[#DCE3ED] rounded-full flex items-center justify-center text-gray-500 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-50 hover:bg-gray-50 hover:text-gray-800"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-white/10 shrink-0 bg-white/5">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded flex items-center justify-center p-1 bg-white">
              <img src="/razorpay-logo.jpg" alt="Razorpay" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-extrabold tracking-wide text-white leading-tight">Settlement Copilot</span>
              <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">AI Finance Controller</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 mx-auto rounded flex items-center justify-center p-1 bg-white">
            <img src="/razorpay-logo.jpg" alt="Razorpay" className="w-full h-full object-contain" />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto dark-scrollbar py-4 px-3 flex flex-col gap-6">
        {NAV_SECTIONS.map((section, idx) => (
          <div key={idx}>
            {!collapsed && (
              <h3 className="px-3 mb-2 text-[10px] font-bold text-white/40 tracking-[1px] uppercase">
                {section.title}
              </h3>
            )}
            <nav className="flex flex-col gap-0.5">
              {section.items.map(item => {
                const Icon = item.icon
                const isActive = activePage === item.id || (activePage === 'home' && item.id === 'overview')
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group relative
                      ${isActive 
                        ? 'bg-[var(--rz-bg-sidebar-active)] text-white shadow-sm font-semibold' 
                        : 'text-white/60 hover:text-white hover:bg-[var(--rz-bg-sidebar-hover)] font-medium'
                      }
                      ${collapsed ? 'justify-center' : 'justify-start'}
                    `}
                  >
                    <Icon size={18} className={isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'} />
                    
                    {!collapsed && (
                      <span className="text-[13px] tracking-wide flex-1 text-left">{item.label}</span>
                    )}

                    {!collapsed && item.badge && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide ${
                        item.badge === 'LIVE' ? 'bg-[#EF4444] text-white animate-pulse' : 'bg-white/20 text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}

                    {collapsed && (
                      <div className="sidebar-tooltip">
                        {item.label}
                      </div>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        ))}
      </div>
      
    </aside>
  )
}
