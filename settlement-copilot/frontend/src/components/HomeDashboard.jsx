import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { 
  TrendingUp, ArrowUpRight, ArrowDownRight, IndianRupee, ShieldCheck, Activity,
  Upload, BarChart2, Users, FileText, ArrowRight, CheckCircle2, Circle,
  Zap, Clock, CreditCard, AlertCircle, ChevronRight, Search
} from 'lucide-react'

const chartData = []

const QUICK_ACTIONS = [
  { 
    icon: Upload, label: 'Upload Files', 
    desc: 'Start reconciliation by uploading your gateway, bank, and ledger files',
    bgColor: '#E6F0FF', iconColor: '#0065FF', page: 'reconciliation'
  },
  { 
    icon: TrendingUp, label: 'View Settlements', 
    desc: 'Track your bank transfers and settlement batch statuses',
    bgColor: '#D1FAE5', iconColor: '#10B981', page: 'settlements'
  },
  { 
    icon: BarChart2, label: 'Generate Report', 
    desc: 'Deep dive analytics on your payment volume and trends',
    bgColor: '#EDE9FE', iconColor: '#8B5CF6', page: 'reports'
  },
  { 
    icon: Users, label: 'Manage Customers', 
    desc: 'Browse your customer directory and purchase history',
    bgColor: '#FEF3C7', iconColor: '#F59E0B', page: 'customers'
  },
]

const RECENT_ACTIVITY = []

const GETTING_STARTED = [
  { id: 'api', label: 'Set up API keys', desc: 'Configure your live and test API credentials', done: true },
  { id: 'bank', label: 'Connect bank account', desc: 'Link your bank account to receive settlements', done: true },
  { id: 'upload', label: 'Upload your first files', desc: 'Try the AI reconciliation engine with a sample batch', done: false },
  { id: 'review', label: 'Review matched transactions', desc: 'Verify AI confidence scores and approve matches', done: false },
]

function StatCard({ title, value, trend, trendValue, icon: Icon, bgColor, iconColor }) {
  const isPositive = trend === 'up'
  return (
    <div className="bg-white rounded-xl border border-[#DCE3ED] p-6 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-3.5 mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm" style={{ background: bgColor }}>
          <Icon size={22} style={{ color: iconColor }} />
        </div>
        <h3 className="text-base font-bold text-[#4A5568]">{title}</h3>
      </div>
      <div className="flex items-baseline gap-3">
        <h2 className="text-3xl font-extrabold text-[#0B192C] tracking-tight">{value}</h2>
        <span className="flex items-center text-sm font-extrabold px-2.5 py-1 rounded-md" 
          style={{ 
            background: isPositive ? '#D1FAE5' : '#FEE2E2', 
            color: isPositive ? '#10B981' : '#EF4444' 
          }}
        >
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trendValue}%
        </span>
      </div>
    </div>
  )
}

export default function HomeDashboard({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('payments')
  const [checklist, setChecklist] = useState(
    GETTING_STARTED.reduce((acc, item) => ({ ...acc, [item.id]: item.done }), {})
  )

  const completedCount = Object.values(checklist).filter(Boolean).length
  const totalCount = GETTING_STARTED.length
  const progress = (completedCount / totalCount) * 100

  const toggleCheck = (id) => {
    setChecklist(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Banner — Exact style from user reference picture */}
      <div className="rz-hero-banner rounded-2xl p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-sm font-bold text-[#00E6A0] uppercase tracking-widest mb-2">
            <Zap size={14} /> Razorpay Settlement Copilot
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
            Good morning, Visithran!
          </h1>
          <p className="text-white/80 text-[15px] leading-relaxed mb-6">
            Welcome to your merchant reconciliation workspace. Reconcile transactions, manage payouts, and track settlement health in real-time.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => onNavigate && onNavigate('reconciliation')}
              className="btn-primary"
            >
              <Upload size={18} /> Launch Reconciliation Engine
            </button>
            <button 
              onClick={() => onNavigate && onNavigate('settlements')}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-base rounded-md transition-all shadow-sm"
            >
              View Settlements
            </button>
          </div>
        </div>
      </div>

      {/* Tabs navigation bar — Exact style from user reference picture */}
      <div className="bg-white rounded-xl border border-[#DCE3ED] px-6 flex items-center justify-between shadow-sm overflow-x-auto">
        <div className="flex items-center gap-8 text-[15px] font-bold">
          {[
            { id: 'payments', label: 'Payments' },
            { id: 'reconciliation', label: 'Reconciliation' },
            { id: 'settlements', label: 'Settlements' },
            { id: 'analytics', label: 'Analytics & Reports' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id)
                if (t.id !== 'payments') onNavigate && onNavigate(t.id)
              }}
              className={`py-4 transition-colors relative whitespace-nowrap ${
                activeTab === t.id ? 'rz-active-tab' : 'text-[#4A5568] hover:text-[#0B192C]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-3 py-2">
          <select className="px-3.5 py-1.5 bg-[#EFF3F8] border border-[#DCE3ED] rounded-lg text-[15px] font-bold text-[#0B192C] outline-none hover:border-[#0065FF] transition-colors">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>This Month</option>
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard title="Gross Volume" value="₹0" trend="up" trendValue="0" icon={TrendingUp} bgColor="#E6F0FF" iconColor="#0065FF" />
        <StatCard title="Net Settlement" value="₹0" trend="up" trendValue="0" icon={ShieldCheck} bgColor="#D1FAE5" iconColor="#10B981" />
        <StatCard title="Refunds" value="₹0" trend="down" trendValue="0" icon={Activity} bgColor="#FEE2E2" iconColor="#EF4444" />
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-extrabold text-[#0B192C]">Quick Actions</h3>
          <span className="text-sm font-semibold text-[#718096]">Jump to any section</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((action, i) => {
            const Icon = action.icon
            return (
              <button
                key={action.label}
                onClick={() => onNavigate && onNavigate(action.page)}
                className="bg-white rounded-xl border border-[#DCE3ED] p-5 hover:shadow-md hover:border-[#0065FF] transition-all duration-200 text-left group"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform"
                  style={{ background: action.bgColor }}
                >
                  <Icon size={22} style={{ color: action.iconColor }} />
                </div>
                <h4 className="text-[15px] font-bold text-[#0B192C] mb-1 flex items-center gap-1.5">
                  {action.label}
                  <ArrowRight size={14} className="text-[#718096] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h4>
                <p className="text-[15px] text-[#4A5568] leading-relaxed">{action.desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Chart + Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-[#DCE3ED] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-extrabold text-[#0B192C]">Payment Volume Overview</h3>
              <p className="text-[15px] text-[#4A5568] mt-0.5">Gross payment volume vs Refunds over the last 7 days</p>
            </div>
            <div className="flex gap-5 items-center text-[15px] font-bold text-[#4A5568]">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#0065FF]" /> Gross</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#EF4444]" /> Refunds</div>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0065FF" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#0065FF" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRef" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EEF5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#718096', fontSize: 12, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#718096', fontSize: 12, fontWeight: 600}} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '10px', border: '1px solid #DCE3ED', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', fontSize: 13, fontWeight: 700 }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, undefined]}
                />
                <Area type="monotone" dataKey="vol" stroke="#0065FF" strokeWidth={3} fillOpacity={1} fill="url(#colorVol)" activeDot={{r: 6, strokeWidth: 0, fill: '#0065FF'}} />
                <Area type="monotone" dataKey="refunds" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorRef)" activeDot={{r: 6, strokeWidth: 0, fill: '#EF4444'}} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Getting Started */}
          <div className="bg-white rounded-xl border border-[#DCE3ED] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-[15px] font-extrabold text-[#0B192C] flex items-center gap-2">
                  <Zap size={16} className="text-[#0065FF]" />
                  Getting Started
                </h3>
                <p className="text-sm text-[#718096] mt-0.5">{completedCount}/{totalCount} completed</p>
              </div>
              <span className="text-base font-extrabold text-[#0065FF]">{Math.round(progress)}%</span>
            </div>

            <div className="w-full h-2 bg-[#EFF3F8] rounded-full mb-4 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500 bg-[#0065FF]" style={{ width: `${progress}%` }} />
            </div>

            <div className="space-y-2">
              {GETTING_STARTED.map((item) => {
                const isDone = checklist[item.id]
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                      isDone ? 'bg-[#D1FAE5]/40' : 'hover:bg-[#EFF3F8]'
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {isDone ? (
                        <CheckCircle2 size={18} className="text-[#10B981]" />
                      ) : (
                        <Circle size={18} className="text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[15px] font-bold ${isDone ? 'line-through text-[#10B981]' : 'text-[#0B192C]'}`}>
                        {item.label}
                      </p>
                      <p className="text-[13px] text-[#718096] mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-[#DCE3ED] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-extrabold text-[#0B192C] flex items-center gap-2">
                <Clock size={16} className="text-[#718096]" />
                Recent Activity
              </h3>
              <button className="text-sm font-bold text-[#0065FF] hover:underline flex items-center gap-1">
                View All <ChevronRight size={12} />
              </button>
            </div>

            <div className="space-y-3">
              {RECENT_ACTIVITY.length === 0 ? (
                <div className="text-sm text-gray-500 py-4 text-center">No recent activity for this run.</div>
              ) : RECENT_ACTIVITY.map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.bg }}>
                      <Icon size={14} style={{ color: item.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-[#0B192C] leading-snug">{item.text}</p>
                      <p className="text-[13px] text-[#718096] mt-0.5">{item.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
