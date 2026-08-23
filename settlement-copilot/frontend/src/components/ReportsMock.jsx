import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Download, Calendar, Filter } from 'lucide-react'

const chartData = [
  { name: 'Jan', vol: 4000, refunds: 240 },
  { name: 'Feb', vol: 3000, refunds: 139 },
  { name: 'Mar', vol: 5000, refunds: 980 },
  { name: 'Apr', vol: 7280, refunds: 390 },
  { name: 'May', vol: 6890, refunds: 480 },
  { name: 'Jun', vol: 8390, refunds: 380 },
  { name: 'Jul', vol: 11490, refunds: 430 },
]

export default function ReportsMock() {
  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1f36]">Reports & Analytics</h1>
          <p className="text-sm text-[#697386] mt-1">Deep dive into your payment volume, conversion rates, and refunds.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-[#e3e8ef] text-[#1a1f36] rounded-lg text-sm font-semibold shadow-sm hover:bg-[#f5f7fa] transition-colors flex items-center gap-2">
            <Calendar size={16} /> Last 6 Months
          </button>
          <button className="px-4 py-2 bg-[#3d8ef8] hover:bg-[#2b6cdb] text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2">
            <Download size={16} /> Download Report
          </button>
        </div>
      </div>

      {/* Main Chart area */}
      <div className="bg-white rounded-xl border border-[#e3e8ef] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-semibold text-[#1a1f36]">Monthly Volume Breakdown</h3>
            <p className="text-sm text-[#697386]">Gross volume and refunds by month</p>
          </div>
          <div className="flex gap-4 items-center text-sm">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#3d8ef8]" /> Gross Volume</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#e04d4d]" /> Refunds</div>
          </div>
        </div>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f3f8" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8a94b2', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#8a94b2', fontSize: 12}} tickFormatter={(v) => `₹${v/1000}k`} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e3e8ef', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                itemStyle={{ color: '#1a1f36', fontWeight: 600 }}
                cursor={{ fill: '#f5f7fa' }}
                formatter={(value) => [`₹${value.toLocaleString()}`, undefined]}
              />
              <Bar dataKey="vol" fill="#3d8ef8" radius={[4, 4, 0, 0]} maxBarSize={50} />
              <Bar dataKey="refunds" fill="#e04d4d" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
