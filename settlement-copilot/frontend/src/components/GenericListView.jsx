import { Search, Plus, Filter, Box } from 'lucide-react'

export default function GenericListView({ title, subtitle, itemName, columns, mockData, emptyStateIcon: Icon = Box }) {
  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1f36] capitalize">{title}</h1>
          <p className="text-sm text-[#697386] mt-1">{subtitle}</p>
        </div>
        <button className="px-4 py-2 bg-[#3d8ef8] text-white rounded-lg text-sm font-semibold shadow-[0_2px_8px_rgba(61,142,248,0.3)] hover:bg-[#2b6cdb] transition-colors flex items-center gap-2">
          <Plus size={16} /> Create {itemName}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#e3e8ef] shadow-sm flex flex-col min-h-[500px]">
        {/* Header tools */}
        <div className="px-5 py-4 border-b border-[#e3e8ef] flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f5f7fa] border border-[#e3e8ef] rounded-md focus-within:border-[#3d8ef8] focus-within:ring-1 focus-within:ring-[#3d8ef8]/20 transition-all w-72">
            <Search size={14} className="text-[#a3acb9]" />
            <input 
              type="text" 
              placeholder={`Search ${title.toLowerCase()}...`}
              className="bg-transparent border-none outline-none text-sm w-full text-[#1a1f36] placeholder:text-[#a3acb9]"
            />
          </div>
          <button className="px-3 py-1.5 bg-white border border-[#e3e8ef] text-[#697386] rounded-md text-sm font-medium hover:bg-[#f5f7fa] transition-colors flex items-center gap-2">
            <Filter size={14} /> Filter
          </button>
        </div>

        {mockData && mockData.length > 0 ? (
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-[#e3e8ef] bg-[#f5f7fa]">
                  {columns.map(h => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold text-[#697386] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockData.map((row, i) => (
                  <tr key={i} className={`border-b border-[#f0f3f8] hover:bg-[#f8f9ff] transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'}`}>
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-5 py-4 text-[#1a1f36]">
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-16 h-16 bg-[#f5f7fa] rounded-full flex items-center justify-center mb-5 text-[#a3acb9]">
              <Icon size={32} />
            </div>
            <h3 className="text-lg font-bold text-[#1a1f36] mb-2">No {title.toLowerCase()} yet</h3>
            <p className="text-sm text-[#697386] max-w-sm mx-auto mb-6">
              You haven't created any {title.toLowerCase()} yet. Get started by creating your first one now.
            </p>
            <button className="px-5 py-2.5 bg-white border border-[#e3e8ef] text-[#1a1f36] rounded-lg text-sm font-semibold shadow-sm hover:border-[#a3acb9] transition-colors">
              Read the documentation
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
