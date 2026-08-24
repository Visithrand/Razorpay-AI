import { 
  Home, ArrowLeftRight, Zap, TrendingUp, FileText, 
  Users, BarChart2, Settings, ShieldCheck, MessageSquare,
  ChevronLeft, ChevronRight, AlertCircle
} from 'lucide-react'

const NAV_SECTIONS = [
  {
    title: null,
    items: [
      { id: 'overview', label: 'Overview', icon: Home, badge: null },
    ]
  },
  {
    title: 'SETTLEMENT INTELLIGENCE',
    items: [
      { id: 'settlements',    label: 'Settlements',    icon: TrendingUp,     badge: null },
      { id: 'transactions',   label: 'Transactions',   icon: ArrowLeftRight, badge: null },
      { id: 'reconciliation', label: 'Reconciliation', icon: Zap,            badge: 'LIVE' },
      { id: 'exceptions',     label: 'Exceptions',     icon: AlertCircle,    badge: null },
    ]
  },
  {
    title: 'AUTONOMOUS AGENTS',
    items: [
      { id: 'investigation', label: 'AI Investigation', icon: Zap,            badge: 'AI' },
      { id: 'ai-assistant',  label: 'AI Assistant',     icon: MessageSquare,  badge: 'NL2SQL' },
      { id: 'audit-log',     label: 'Audit Log',        icon: ShieldCheck,    badge: null },
    ]
  },
  {
    title: 'ACCOUNT & REPORTS',
    items: [
      { id: 'customers', label: 'Customers', icon: Users,    badge: null },
      { id: 'reports',   label: 'Reports',   icon: BarChart2, badge: null },
      { id: 'settings',  label: 'Settings',  icon: Settings,  badge: null },
    ]
  },
]

export default function Sidebar({ activePage, onNavigate, collapsed, onToggle, user }) {
  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() 
    : 'VM'

  return (
    <>
      {!collapsed && (
        <div className="mobile-backdrop md:hidden" onClick={onToggle} />
      )}

      <aside 
        className={`sidebar-transition flex-shrink-0 flex flex-col h-full z-40 
          fixed md:relative md:translate-x-0
          ${collapsed ? 'w-[72px] -translate-x-full md:translate-x-0' : 'w-[250px] translate-x-0'}
        `}
        style={{ backgroundColor: '#040D38' }}
      >
        {/* Logo Area */}
        <div className={`flex items-center flex-shrink-0 border-b border-white/10 ${collapsed ? 'px-3 py-4 justify-center' : 'px-6 py-4'}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center p-1 shadow-md overflow-hidden flex-shrink-0">
              <img 
                src="/razorpay-logo.jpg" 
                alt="Razorpay Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            {!collapsed && (
              <span className="text-white font-extrabold text-xl tracking-tight">
                Razorpay
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto custom-scrollbar dark-scrollbar py-4 ${collapsed ? 'px-2' : 'px-3'}`}>
          {NAV_SECTIONS.map((section, si) => (
            <div key={si} className={si > 0 ? 'mt-6' : ''}>
              {section.title && !collapsed && (
                <div className="px-3 mb-2">
                  <span className="text-[11px] font-bold tracking-[1.8px] text-white/40 uppercase">
                    {section.title}
                  </span>
                </div>
              )}
              {section.title && collapsed && <div className="border-t border-white/10 mx-2 mb-3" />}

              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = activePage === item.id || (activePage === 'home' && item.id === 'overview')
                  const Icon = item.icon
                  return (
                    <div key={item.id} className="relative group">
                      <button
                        onClick={() => onNavigate(item.id)}
                        className={`w-full flex items-center gap-3 rounded-lg text-left transition-all duration-150 relative
                          ${collapsed ? 'px-0 py-2.5 justify-center' : 'px-3.5 py-2.5'}
                          ${isActive
                            ? 'bg-[#0065FF] text-white shadow-md font-bold'
                            : 'text-white/70 hover:bg-white/10 hover:text-white font-semibold'
                          }`}
                      >
                        <Icon size={19} className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-white/70'}`} />
                        
                        {!collapsed && (
                          <>
                            <span className="text-[14px] flex-1">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#00E6A0] text-[#040D38] uppercase tracking-wider">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </button>

                      {collapsed && (
                        <div className="sidebar-tooltip">
                          {item.label}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse Toggle */}
        <div className="border-t border-white/10 px-3 py-3 flex-shrink-0">
          <button 
            onClick={onToggle}
            className={`w-full flex items-center gap-3 rounded-lg py-2.5 text-white/50 hover:text-white hover:bg-white/10 transition-all duration-150
              ${collapsed ? 'justify-center px-0' : 'px-3.5'}
            `}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && <span className="text-[13px] font-bold">Collapse Sidebar</span>}
          </button>
        </div>

        {/* Merchant Account */}
        <div className={`border-t border-white/10 flex-shrink-0 ${collapsed ? 'px-2 py-3.5' : 'px-4 py-3.5'}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} cursor-pointer rounded-lg p-2 hover:bg-white/10 transition-all`}>
            <div className={`rounded-full bg-[#0065FF] flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0 ${collapsed ? 'w-9 h-9' : 'w-9 h-9'}`}>
              {initials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-[13px] font-bold truncate">{user?.name || 'Merchant Admin'}</p>
                <p className="text-white/40 text-[11px] font-medium truncate">MID: {user?.mid || 'mid_rzp_live'}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
