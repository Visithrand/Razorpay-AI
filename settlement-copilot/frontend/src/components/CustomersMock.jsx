import { useState, useMemo } from 'react'
import { Download, UserPlus, Mail, Phone, Search, X } from 'lucide-react'
import { exportToCSV } from '../api'

const INITIAL_CUSTOMERS = [
  { id: 'cust_OkL1', name: 'Raj Kumar', email: 'raj.kumar@example.com', phone: '+91 9876543210', spent: '₹14,500', created: 'Jan 12, 2024', status: 'Active' },
  { id: 'cust_OkL2', name: 'Sneha Patel', email: 'sneha.patel@gmail.com', phone: '+91 9876543211', spent: '₹2,300', created: 'Jan 15, 2024', status: 'Active' },
  { id: 'cust_OkL3', name: 'Amit Singh', email: 'amit.singh@yahoo.com', phone: '+91 9876543212', spent: '₹45,000', created: 'Dec 02, 2023', status: 'Inactive' },
  { id: 'cust_OkL4', name: 'Tech Solutions', email: 'billing@techsolutions.in', phone: '+91 9876543213', spent: '₹1,24,000', created: 'Nov 18, 2023', status: 'Active' },
]

export default function CustomersMock() {
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCust, setNewCust] = useState({ name: '', email: '', phone: '' })

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (activeTab !== 'all' && c.status.toLowerCase() !== activeTab.toLowerCase()) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = c.name.toLowerCase().includes(q)
        const matchEmail = c.email.toLowerCase().includes(q)
        const matchPhone = c.phone.toLowerCase().includes(q)
        const matchId = c.id.toLowerCase().includes(q)
        if (!matchName && !matchEmail && !matchPhone && !matchId) return false
      }
      return true
    })
  }, [customers, activeTab, searchQuery])

  const handleAddCustomer = (e) => {
    e.preventDefault()
    if (!newCust.name || !newCust.email) return
    const id = `cust_OkL${customers.length + 1}`
    const created = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    const added = { id, ...newCust, spent: '₹0', created, status: 'Active' }
    setCustomers([added, ...customers])
    setNewCust({ name: '', email: '', phone: '' })
    setShowAddModal(false)
  }

  const handleExport = () => {
    exportToCSV('Razorpay_Customers_Export', filteredCustomers)
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B192C]">Customers</h1>
          <p className="text-[14px] text-[#4A5568] mt-0.5">Manage your customer directory and purchase history.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="btn-secondary">
            <Download size={15} /> Export CSV
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <UserPlus size={15} /> Add Customer
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#DCE3ED] overflow-hidden shadow-sm min-h-[500px]">
        {/* Header Filter Tabs & Search */}
        <div className="px-6 py-3 border-b border-[#DCE3ED] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#EFF3F8]/30">
          <div className="flex items-center gap-6 text-[14px] font-bold text-[#4A5568]">
            {[
              { id: 'all', label: `All (${customers.length})` },
              { id: 'active', label: `Active (${customers.filter(c => c.status === 'Active').length})` },
              { id: 'inactive', label: `Inactive (${customers.filter(c => c.status === 'Inactive').length})` },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`py-2 border-b-2 transition-all ${
                  activeTab === t.id ? 'border-[#0065FF] text-[#0065FF]' : 'border-transparent hover:text-[#0B192C]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#DCE3ED] rounded-lg w-72 focus-within:ring-1 focus-within:ring-[#0065FF]">
            <Search size={14} className="text-[#718096]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search name, email, phone..."
              className="bg-transparent border-none outline-none text-[13px] w-full text-[#0B192C]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-[#718096]">
              <p className="text-[15px] font-bold">No customers match your search</p>
            </div>
          ) : (
            <table className="w-full text-[14px] text-left">
              <thead>
                <tr className="border-b border-[#DCE3ED] bg-[#EFF3F8]/60">
                  {['Customer', 'Contact Info', 'Total Spent', 'Created At', 'Status'].map(h => (
                    <th key={h} className="px-6 py-3.5 text-[11px] font-extrabold uppercase tracking-wider text-[#718096]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="border-b border-[#E8EEF5] hover:bg-[#E6F0FF]/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-extrabold text-[14px] text-[#0065FF]">{c.name}</p>
                      <p className="text-[11px] font-mono mt-0.5 text-[#718096]">{c.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="flex items-center gap-1.5 text-[12px] text-[#4A5568]"><Mail size={12}/> {c.email}</p>
                      <p className="flex items-center gap-1.5 text-[12px] text-[#4A5568] mt-1"><Phone size={12}/> {c.phone}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#0B192C]">{c.spent}</td>
                    <td className="px-6 py-4 text-[12px] text-[#718096]">{c.created}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider"
                        style={{ 
                          background: c.status === 'Active' ? '#D1FAE5' : '#EFF3F8', 
                          color: c.status === 'Active' ? '#10B981' : '#718096' 
                        }}
                      >{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-overlay-fadein">
          <form onSubmit={handleAddCustomer} className="bg-white border border-[#DCE3ED] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-overlay-slideup">
            <div className="px-6 py-4 border-b border-[#DCE3ED] flex items-center justify-between bg-[#05103E] text-white">
              <h3 className="font-extrabold text-[16px]">Add New Customer</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4 text-[14px]">
              <div>
                <label className="block text-[12px] font-bold text-[#718096] uppercase mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={newCust.name}
                  onChange={e => setNewCust({ ...newCust, name: e.target.value })}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-3.5 py-2 border border-[#DCE3ED] rounded-lg outline-none focus:border-[#0065FF]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#718096] uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newCust.email}
                  onChange={e => setNewCust({ ...newCust, email: e.target.value })}
                  placeholder="e.g. billing@acme.com"
                  className="w-full px-3.5 py-2 border border-[#DCE3ED] rounded-lg outline-none focus:border-[#0065FF]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#718096] uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newCust.phone}
                  onChange={e => setNewCust({ ...newCust, phone: e.target.value })}
                  placeholder="e.g. +91 9876543210"
                  className="w-full px-3.5 py-2 border border-[#DCE3ED] rounded-lg outline-none focus:border-[#0065FF]"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#DCE3ED] bg-gray-50 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Save Customer</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
