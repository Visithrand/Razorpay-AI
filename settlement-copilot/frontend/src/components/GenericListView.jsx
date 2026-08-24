import { useState, useMemo } from 'react'
import { Search, Plus, Filter, Box, X, Download } from 'lucide-react'
import { exportToCSV } from '../api'

const INITIAL_ITEMS = {
  Invoices: [
    { 'Invoice ID': 'inv_102948', 'Customer': 'Acme Corp', 'Amount': '₹12,500.00', 'Status': 'Paid', 'Due Date': 'Jan 30, 2024' },
    { 'Invoice ID': 'inv_102949', 'Customer': 'Rajesh Sharma', 'Amount': '₹4,999.00', 'Status': 'Pending', 'Due Date': 'Feb 05, 2024' },
  ],
  'Payment Links': [
    { 'Link ID': 'plink_819284', 'Amount': '₹2,499.00', 'Status': 'Active', 'Created At': 'Jan 22, 2024' },
    { 'Link ID': 'plink_819285', 'Amount': '₹15,000.00', 'Status': 'Expired', 'Created At': 'Jan 10, 2024' },
  ],
  'Payment Pages': [
    { 'Page Title': 'Annual Tech Conference Pass', 'URL': 'https://rzp.io/l/conf2024', 'Total Collected': '₹4,50,000', 'Status': 'Published' },
  ],
  'Route (Splits)': [
    { 'Rule Name': 'Vendor Commission Split', 'Account': 'acc_vendor9182', 'Percentage': '15%', 'Status': 'Active' },
  ],
  Subscriptions: [
    { 'Plan Name': 'SaaS Pro Monthly', 'Billing Cycle': 'Monthly', 'Amount': '₹999.00', 'Active Subs': '142' },
  ],
}

export default function GenericListView({ title, subtitle, itemName, columns, emptyStateIcon: Icon = Box }) {
  const [items, setItems] = useState(INITIAL_ITEMS[title] || [])
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({})

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items
    const q = searchQuery.toLowerCase().trim()
    return items.filter(item => 
      Object.values(item).some(val => String(val).toLowerCase().includes(q))
    )
  }, [items, searchQuery])

  const handleCreate = (e) => {
    e.preventDefault()
    setItems([formData, ...items])
    setFormData({})
    setShowCreateModal(false)
  }

  const handleExport = () => {
    exportToCSV(`Razorpay_${title.replace(/\s+/g, '_')}_Export`, filteredItems)
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold capitalize text-[#0B192C]">{title}</h1>
          <p className="text-[14px] text-[#4A5568] mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {items.length > 0 && (
            <button onClick={handleExport} className="btn-secondary">
              <Download size={15} /> Export CSV
            </button>
          )}
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <Plus size={15} /> Create {itemName}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#DCE3ED] flex flex-col min-h-[500px] shadow-sm overflow-hidden">
        {/* Search Header */}
        <div className="px-6 py-3 border-b border-[#DCE3ED] flex items-center justify-between bg-[#EFF3F8]/30">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#DCE3ED] rounded-lg focus-within:ring-1 focus-within:ring-[#0065FF] w-80">
            <Search size={14} className="text-[#718096]" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
              className="bg-transparent border-none outline-none text-[13px] w-full text-[#0B192C]"
            />
          </div>
          <span className="text-[13px] font-bold text-[#718096]">{filteredItems.length} records</span>
        </div>

        {filteredItems && filteredItems.length > 0 ? (
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-[14px] text-left">
              <thead>
                <tr className="border-b border-[#DCE3ED] bg-[#EFF3F8]/60">
                  {columns.map(h => (
                    <th key={h} className="px-6 py-3.5 text-[11px] font-extrabold uppercase tracking-wider text-[#718096]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((row, i) => (
                  <tr key={i} className="border-b border-[#E8EEF5] hover:bg-[#E6F0FF]/30 transition-colors">
                    {columns.map((col, j) => {
                      const val = row[col] || row[Object.keys(row)[j]] || '—'
                      const isId = String(val).startsWith('inv_') || String(val).startsWith('plink_') || String(val).startsWith('acc_')
                      return (
                        <td key={j} className={`px-6 py-4 ${isId ? 'font-mono font-bold text-[#0065FF]' : 'text-[#0B192C] font-semibold'}`}>
                          {val}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-[#EFF3F8] text-[#718096]">
              <Icon size={28} />
            </div>
            <h3 className="text-[17px] font-extrabold text-[#0B192C] mb-1">No {title.toLowerCase()} found</h3>
            <p className="text-[14px] text-[#718096] max-w-sm mx-auto mb-6">
              Create your first {itemName.toLowerCase()} using the button below.
            </p>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              <Plus size={15} /> Create {itemName}
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-overlay-fadein">
          <form onSubmit={handleCreate} className="bg-white border border-[#DCE3ED] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-overlay-slideup">
            <div className="px-6 py-4 border-b border-[#DCE3ED] flex items-center justify-between bg-[#05103E] text-white">
              <h3 className="font-extrabold text-[16px]">Create New {itemName}</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4 text-[14px]">
              {columns.map(col => (
                <div key={col}>
                  <label className="block text-[12px] font-bold text-[#718096] uppercase mb-1">{col} *</label>
                  <input
                    type="text"
                    required
                    value={formData[col] || ''}
                    onChange={e => setFormData({ ...formData, [col]: e.target.value })}
                    placeholder={`Enter ${col.toLowerCase()}...`}
                    className="w-full px-3.5 py-2 border border-[#DCE3ED] rounded-lg outline-none focus:border-[#0065FF]"
                  />
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-[#DCE3ED] bg-gray-50 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Create Item</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
