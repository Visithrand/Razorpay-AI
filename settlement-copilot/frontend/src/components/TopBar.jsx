import { useState, useEffect, useMemo } from 'react'
import { Bell, Search, Menu, PanelLeftClose, User, LogOut, ChevronDown, ExternalLink, ArrowRight, X, Trash2 } from 'lucide-react'

const SEARCH_INDEX = [
  { type: 'Payment', title: 'pay_Nj8Qtty5Y2Jr8 (₹2,450.00 - Captured)', page: 'transactions' },
  { type: 'Payment', title: 'pay_Nj3Xgf9Q5rDoQ (₹12,999.00 - Refunded)', page: 'transactions' },
  { type: 'Payment', title: 'pay_Nj1LryE89FxX9 (₹450.50 - Failed)', page: 'transactions' },
  { type: 'Settlement', title: 'setl_OkL8Nj23nJ1x - UTR SBIN0001234567 (₹12,45,000.50)', page: 'settlements' },
  { type: 'Settlement', title: 'setl_OjK2Mn99xK4p - UTR HDFC0009876543 (₹8,45,000.00)', page: 'settlements' },
  { type: 'Customer', title: 'Raj Kumar (raj.kumar@example.com)', page: 'customers' },
  { type: 'Customer', title: 'Tech Solutions (billing@techsolutions.in)', page: 'customers' },
  { type: 'Feature', title: 'AI Reconciliation Copilot Upload Engine', page: 'reconciliation' },
  { id: 'settings', type: 'Setting', title: 'API Keys & Live Credentials', page: 'settings' },
]

export default function TopBar({ activePage, runId, report, sidebarCollapsed, onToggleSidebar, onNavigate, user, onLogout }) {
  const matchRate = report ? (report.match_rate * 100).toFixed(1) : null
  const [showProfile, setShowProfile] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchModal, setShowSearchModal] = useState(false)

  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() 
    : 'VM'

  const pageTitles = {
    'home': 'Home',
    'transactions': 'Transactions',
    'reconciliation': 'Reconciliation Copilot',
    'settlements': 'Settlements',
    'customers': 'Customers',
    'reports': 'Reports & Analytics',
    'settings': 'Settings',
    'invoices': 'Invoices',
    'payment-links': 'Payment Links',
    'payment-pages': 'Payment Pages',
    'route': 'Route (Splits)',
    'subscriptions': 'Subscriptions',
  }

  const handleGlobalReset = async () => {
    if (!window.confirm('Are you sure you want to clear all workspace data, reports, and logs?')) return
    try {
      await fetch('/api/reset', { method: 'POST' })
      window.location.reload()
    } catch (e) {
      window.location.reload()
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearchModal(true)
      }
      if (e.key === 'Escape') {
        setShowSearchModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const filteredSearch = useMemo(() => {
    if (!searchQuery.trim()) return SEARCH_INDEX
    const q = searchQuery.toLowerCase().trim()
    return SEARCH_INDEX.filter(item => 
      item.title.toLowerCase().includes(q) || item.type.toLowerCase().includes(q)
    )
  }, [searchQuery])

  return (
    <header className="bg-[#05103E] text-white border-b border-white/10 flex items-center justify-between px-5 md:px-7 h-16 flex-shrink-0 z-20 sticky top-0 shadow-md">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg transition-colors duration-150 hover:bg-white/10 text-white/80 hover:text-white"
          title={sidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
        >
          {sidebarCollapsed ? <Menu size={20} /> : <PanelLeftClose size={20} />}
        </button>

        {sidebarCollapsed && (
          <div className="w-8 h-8 rounded bg-white flex items-center justify-center p-1 shadow-sm overflow-hidden">
            <img src="/razorpay-logo.jpg" alt="Razorpay" className="w-full h-full object-contain" />
          </div>
        )}

        <div className="hidden sm:flex items-center gap-2 text-[14px]">
          <span className="text-white/40 font-semibold">Razorpay</span>
          <span className="text-white/30">/</span>
          <span className="font-extrabold text-white text-[15px]">
            {pageTitles[activePage] || 'Home'}
          </span>
        </div>
      </div>

      {/* Center Search Bar */}
      <div 
        onClick={() => setShowSearchModal(true)}
        className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/15 rounded-lg w-96 cursor-pointer hover:bg-white/15 transition-all duration-200"
      >
        <Search size={16} className="text-white/60" />
        <span className="text-[14px] text-white/50 flex-1">Search transactions, settlements, docs...</span>
        <div className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-white/15 text-white/80">
          <span>⌘</span><span>K</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {matchRate && activePage === 'reconciliation' && (
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12px] font-extrabold bg-[#00E6A0]/20 text-[#00E6A0] border border-[#00E6A0]/30">
            <div className="w-2 h-2 rounded-full bg-[#00E6A0] animate-pulse" />
            {matchRate}% Matched
          </div>
        )}

        <a 
          href="https://razorpay.com/docs/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-bold rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
        >
          <ExternalLink size={14} />
          Docs
        </a>

        <button className="relative p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors">
          <Bell size={19} />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#EF4444] border-2 border-[#05103E]" />
        </button>

        <div className="w-px h-6 bg-white/15" />

        {/* Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-extrabold bg-[#0065FF] shadow-sm">
              {initials}
            </div>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-[13px] font-bold leading-none text-white">{user?.name || 'Merchant Admin'}</span>
              <span className="text-[11px] leading-none mt-1 text-white/50">{user?.role || 'Admin'}</span>
            </div>
            <ChevronDown size={14} className={`hidden md:block transition-transform duration-200 text-white/60 ${showProfile ? 'rotate-180' : ''}`} />
          </button>

          {showProfile && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
              <div className="absolute right-0 top-12 w-60 bg-white border border-[#DCE3ED] rounded-xl shadow-2xl z-50 overflow-hidden text-[#0B192C] animate-overlay-slideup">
                <div className="px-5 py-4 border-b border-[#E8EEF5]">
                  <p className="text-[14px] font-bold">{user?.name || 'Merchant Admin'}</p>
                  <p className="text-[12px] text-gray-500 mt-0.5 truncate">{user?.identifier || 'admin@gmail.com'}</p>
                  <p className="text-[10px] font-mono text-[#0065FF] font-bold mt-1">MID: {user?.mid || 'mid_rzp_live'}</p>
                </div>
                <div className="py-1">
                  <button 
                    onClick={handleGlobalReset}
                    className="w-full flex items-center gap-3 px-5 py-2.5 text-[14px] hover:bg-red-50 font-extrabold transition-colors text-[#EF4444]"
                  >
                    <Trash2 size={16} /> Clear All Workspace Data
                  </button>
                </div>
                <div className="py-1 border-t border-[#E8EEF5]">
                  <button 
                    onClick={() => {
                      setShowProfile(false)
                      if (onLogout) onLogout()
                    }}
                    className="w-full flex items-center gap-3 px-5 py-2.5 text-[14px] hover:bg-gray-50 font-bold transition-colors text-gray-700"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Global Command Palette Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-overlay-fadein">
          <div className="bg-white border border-[#DCE3ED] rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-overlay-slideup text-[#0B192C]">
            <div className="px-5 py-3.5 border-b border-[#DCE3ED] flex items-center gap-3 bg-[#EFF3F8]/50">
              <Search size={18} className="text-[#0065FF]" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search payments, UTRs, customers, features..."
                className="bg-transparent border-none outline-none text-[15px] w-full text-[#0B192C] font-semibold"
              />
              <button onClick={() => setShowSearchModal(false)} className="p-1 rounded hover:bg-gray-200 text-gray-500">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-2 divide-y divide-gray-100">
              {filteredSearch.length === 0 ? (
                <p className="p-8 text-center text-gray-500 text-[14px]">No matching records found.</p>
              ) : (
                filteredSearch.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (onNavigate) onNavigate(item.page)
                      setShowSearchModal(false)
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#E6F0FF]/50 text-left transition-colors group"
                  >
                    <div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-gray-100 text-[#0065FF] mr-2">
                        {item.type}
                      </span>
                      <span className="text-[14px] font-semibold text-[#0B192C]">{item.title}</span>
                    </div>
                    <ArrowRight size={15} className="text-gray-400 group-hover:text-[#0065FF] group-hover:translate-x-1 transition-all" />
                  </button>
                ))
              )}
            </div>

            <div className="px-5 py-2.5 bg-gray-50 border-t border-[#DCE3ED] text-[12px] text-gray-500 flex justify-between font-medium">
              <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded font-mono text-[10px]">ESC</kbd> to exit</span>
              <span>1-click jump to section</span>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
