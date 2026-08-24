import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Download, Calendar } from 'lucide-react'

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
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold" style={{ color: 'var(--rz-text-primary)' }}>Reports & Analytics</h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--rz-text-secondary)' }}>Deep dive into your payment volume, conversion rates, and refunds.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary"><Calendar size={14} /> Last 6 Months</button>
          <button className="btn-primary"><Download size={14} /> Download Report</button>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-5" style={{ borderColor: 'var(--rz-border)' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[15px] font-bold" style={{ color: 'var(--rz-text-primary)' }}>Monthly Volume Breakdown</h3>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--rz-text-muted)' }}>Gross volume and refunds by month</p>
          </div>
          <div className="flex gap-4 items-center text-[12px] font-semibold" style={{ color: 'var(--rz-text-secondary)' }}>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded" style={{ background: 'var(--rz-blue)' }} /> Gross Volume</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded" style={{ background: 'var(--rz-red)' }} /> Refunds</div>
          </div>
        </div>
        
        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F3F7" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8A94A6', fontSize: 11, fontWeight: 600}} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#8A94A6', fontSize: 11, fontWeight: 600}} tickFormatter={(v) => `₹${v/1000}k`} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E9F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12, fontWeight: 600 }}
                cursor={{ fill: '#F7F8FA' }}
                formatter={(value) => [`₹${value.toLocaleString()}`, undefined]}
              />
              <Bar dataKey="vol" fill="#528FF0" radius={[4, 4, 0, 0]} maxBarSize={45} />
              <Bar dataKey="refunds" fill="#E05050" radius={[4, 4, 0, 0]} maxBarSize={45} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
