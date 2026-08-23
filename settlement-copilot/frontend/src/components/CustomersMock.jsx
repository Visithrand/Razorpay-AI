import { Download, Filter, UserPlus, Mail, Phone } from 'lucide-react'

const MOCK_CUSTOMERS = [
  { id: 'cust_OkL1', name: 'Raj Kumar', email: 'raj.kumar@example.com', phone: '+91 9876543210', spent: '₹14,500', created: 'Jan 12, 2024', status: 'Active' },
  { id: 'cust_OkL2', name: 'Sneha Patel', email: 'sneha.patel@gmail.com', phone: '+91 9876543211', spent: '₹2,300', created: 'Jan 15, 2024', status: 'Active' },
  { id: 'cust_OkL3', name: 'Amit Singh', email: 'amit.singh@yahoo.com', phone: '+91 9876543212', spent: '₹45,000', created: 'Dec 02, 2023', status: 'Inactive' },
  { id: 'cust_OkL4', name: 'Tech Solutions', email: 'billing@techsolutions.in', phone: '+91 9876543213', spent: '₹1,24,000', created: 'Nov 18, 2023', status: 'Active' },
]

export default function CustomersMock() {
  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1f36]">Customers</h1>
          <p className="text-sm text-[#697386] mt-1">Manage your customer directory and view their purchase history.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-[#e3e8ef] text-[#1a1f36] rounded-lg text-sm font-semibold shadow-sm hover:bg-[#f5f7fa] transition-colors flex items-center gap-2">
            <Filter size={16} /> Filter
          </button>
          <button className="px-4 py-2 bg-white border border-[#e3e8ef] text-[#1a1f36] rounded-lg text-sm font-semibold shadow-sm hover:bg-[#f5f7fa] transition-colors flex items-center gap-2">
            <Download size={16} /> Export
          </button>
          <button className="px-4 py-2 bg-[#3d8ef8] hover:bg-[#2b6cdb] text-white rounded-lg text-sm font-semibold shadow-[0_2px_8px_rgba(61,142,248,0.3)] transition-colors flex items-center gap-2">
            <UserPlus size={16} /> Add Customer
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e3e8ef] shadow-sm overflow-hidden min-h-[500px]">
        <div className="px-5 py-4 border-b border-[#e3e8ef] bg-[#fafbfc]">
          <h3 className="text-sm font-semibold text-[#1a1f36]">All Customers</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-[#e3e8ef] bg-[#f5f7fa]">
                {['Customer', 'Contact Info', 'Total Spent', 'Created At', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-[#697386] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_CUSTOMERS.map((c, i) => (
                <tr key={c.id} className={`border-b border-[#f0f3f8] hover:bg-[#f8f9ff] cursor-pointer transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'}`}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[#3d8ef8]">{c.name}</p>
                    <p className="text-[10px] font-mono text-[#a3acb9] mt-0.5">{c.id}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[#697386] flex items-center gap-1.5 text-xs"><Mail size={12}/> {c.email}</p>
                    <p className="text-[#697386] flex items-center gap-1.5 text-xs mt-1"><Phone size={12}/> {c.phone}</p>
                  </td>
                  <td className="px-5 py-4 font-bold text-[#1a1f36]">{c.spent}</td>
                  <td className="px-5 py-4 text-[#697386] text-xs">{c.created}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      c.status === 'Active' ? 'bg-[#e8f7f1] text-[#2eb88a]' : 'bg-[#f5f7fa] text-[#697386]'
                    }`}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
