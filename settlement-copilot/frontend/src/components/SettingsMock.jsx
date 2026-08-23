import { useState } from 'react'
import { User, Key, Bell, Shield, Smartphone, Globe, CreditCard, Settings } from 'lucide-react'

export default function SettingsMock() {
  const [activeTab, setActiveTab] = useState('api')

  const TABS = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'webhook', label: 'Webhooks',   icon: Globe },
    { id: 'team',    label: 'Team',       icon: Shield },
    { id: 'billing', label: 'Billing',    icon: CreditCard },
    { id: 'notifs',  label: 'Alerts',     icon: Bell },
  ]

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1f36]">Settings</h1>
        <p className="text-sm text-[#697386] mt-1">Manage your account preferences, API keys, and team members.</p>
      </div>

      <div className="bg-white rounded-xl border border-[#e3e8ef] shadow-sm flex flex-col md:flex-row min-h-[600px] overflow-hidden">
        {/* Sidebar */}
        <div className="w-full md:w-64 border-r border-[#e3e8ef] bg-[#fafbfc] flex-shrink-0 p-4">
          <nav className="space-y-1">
            {TABS.map(t => {
              const Icon = t.icon
              const active = activeTab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active ? 'bg-[#e8f0fe] text-[#3d8ef8]' : 'text-[#697386] hover:bg-[#f0f3f8] hover:text-[#1a1f36]'
                  }`}
                >
                  <Icon size={16} className={active ? 'text-[#3d8ef8]' : 'text-[#a3acb9]'} />
                  {t.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content area */}
        <div className="flex-1 p-8">
          {activeTab === 'api' ? (
            <div className="max-w-2xl animate-in fade-in">
              <h2 className="text-lg font-bold text-[#1a1f36] mb-1">API Keys</h2>
              <p className="text-sm text-[#697386] mb-8">Use these keys to authenticate API requests from your backend server.</p>
              
              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden mb-6">
                <div className="px-5 py-4 border-b border-[#e3e8ef] bg-[#fafbfc] flex justify-between items-center">
                  <h3 className="font-semibold text-[#1a1f36] text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2eb88a]" /> Live Keys
                  </h3>
                  <button className="text-xs text-[#e04d4d] font-semibold hover:underline">Roll Key</button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[#697386] uppercase tracking-wider mb-1.5 block">Key ID</label>
                    <div className="flex items-center gap-3">
                      <code className="bg-[#f5f7fa] border border-[#e3e8ef] px-3 py-2 rounded text-sm text-[#1a1f36] flex-1">rzp_live_8NxP9QvL0mXp2z</code>
                      <button className="px-3 py-2 bg-white border border-[#e3e8ef] rounded hover:bg-[#f5f7fa] text-[#697386] text-sm font-medium">Copy</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#697386] uppercase tracking-wider mb-1.5 block">Key Secret</label>
                    <div className="flex items-center gap-3">
                      <code className="bg-[#f5f7fa] border border-[#e3e8ef] px-3 py-2 rounded text-sm text-[#a3acb9] flex-1">••••••••••••••••••••••••</code>
                      <button className="px-3 py-2 bg-white border border-[#e3e8ef] rounded hover:bg-[#f5f7fa] text-[#697386] text-sm font-medium">Reveal</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#e3e8ef] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#e3e8ef] bg-[#fafbfc] flex justify-between items-center">
                  <h3 className="font-semibold text-[#1a1f36] text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#e9a820]" /> Test Keys
                  </h3>
                  <button className="text-xs text-[#3d8ef8] font-semibold hover:underline">Regenerate</button>
                </div>
                <div className="p-5">
                  <p className="text-sm text-[#697386]">Test keys allow you to test your integration without moving real money. Safe for development.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-12">
              <div className="w-16 h-16 bg-[#f5f7fa] rounded-full flex items-center justify-center mb-5 text-[#a3acb9]">
                <Settings size={32} />
              </div>
              <h3 className="text-lg font-bold text-[#1a1f36] mb-2">{TABS.find(t => t.id === activeTab)?.label} Settings</h3>
              <p className="text-sm text-[#697386] max-w-sm mx-auto">This settings panel is currently available via the main Razorpay Dashboard.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
