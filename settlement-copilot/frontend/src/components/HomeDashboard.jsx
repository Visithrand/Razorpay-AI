import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, ArrowUpRight, ArrowDownRight, IndianRupee, ShieldCheck, Activity } from 'lucide-react'

const chartData = [
  { name: '1 Jan', vol: 4000, refunds: 240 },
  { name: '2 Jan', vol: 3000, refunds: 139 },
  { name: '3 Jan', vol: 5000, refunds: 980 },
  { name: '4 Jan', vol: 7280, refunds: 390 },
  { name: '5 Jan', vol: 6890, refunds: 480 },
  { name: '6 Jan', vol: 8390, refunds: 380 },
  { name: '7 Jan', vol: 11490, refunds: 430 },
]

function StatCard({ title, value, trend, trendValue, icon: Icon, colorClass }) {
  const isPositive = trend === 'up'
  return (
    <div className="bg-white rounded-xl border border-[#e3e8ef] p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon size={64} className={colorClass} />
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass.replace('text-', 'bg-').replace('500', '50')} ${colorClass}`}>
          <Icon size={20} />
        </div>
        <h3 className="text-sm font-medium text-[#697386]">{title}</h3>
      </div>
      <div className="flex items-baseline gap-3">
        <h2 className="text-3xl font-bold text-[#1a1f36]">{value}</h2>
        <span className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${
          isPositive ? 'bg-[#e8f7f1] text-[#2eb88a]' : 'bg-[#fdf0f0] text-[#e04d4d]'
        }`}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trendValue}%
        </span>
      </div>
    </div>
  )
}

export default function HomeDashboard() {
  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1f36]">Good morning, Merchant!</h1>
          <p className="text-sm text-[#697386] mt-1">Here is what's happening with your payments today.</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="px-4 py-2 bg-white border border-[#e3e8ef] rounded-lg text-sm text-[#1a1f36] outline-none hover:border-[#3d8ef8] transition-colors shadow-sm">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>This Month</option>
          </select>
          <button className="px-5 py-2 bg-[#3d8ef8] hover:bg-[#2b6cdb] text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2">
            <IndianRupee size={16} /> Withdraw Funds
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Gross Volume" value="₹12.4M" trend="up" trendValue="14.2" icon={TrendingUp} colorClass="text-[#3d8ef8]" />
        <StatCard title="Net Settlement" value="₹11.8M" trend="up" trendValue="12.5" icon={ShieldCheck} colorClass="text-[#2eb88a]" />
        <StatCard title="Refunds" value="₹142.5K" trend="down" trendValue="2.4" icon={Activity} colorClass="text-[#e04d4d]" />
      </div>

      {/* Main Chart area */}
      <div className="bg-white rounded-xl border border-[#e3e8ef] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-semibold text-[#1a1f36]">Payment Volume</h3>
            <p className="text-sm text-[#697386]">Gross volume vs Refunds over the last 7 days</p>
          </div>
          <div className="flex gap-4 items-center text-sm">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#3d8ef8]" /> Gross</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#e04d4d]" /> Refunds</div>
          </div>
        </div>
        
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3d8ef8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3d8ef8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRef" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e04d4d" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#e04d4d" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f3f8" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8a94b2', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#8a94b2', fontSize: 12}} tickFormatter={(v) => `₹${v/1000}k`} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e3e8ef', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                itemStyle={{ color: '#1a1f36', fontWeight: 600 }}
                formatter={(value) => [`₹${value.toLocaleString()}`, undefined]}
              />
              <Area type="monotone" dataKey="vol" stroke="#3d8ef8" strokeWidth={3} fillOpacity={1} fill="url(#colorVol)" activeDot={{r: 6, strokeWidth: 0}} />
              <Area type="monotone" dataKey="refunds" stroke="#e04d4d" strokeWidth={3} fillOpacity={1} fill="url(#colorRef)" activeDot={{r: 6, strokeWidth: 0}} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
