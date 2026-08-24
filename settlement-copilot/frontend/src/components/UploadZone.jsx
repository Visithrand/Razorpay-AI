import { UploadCloud, CheckCircle2, FileText, AlertTriangle, Play, Sparkles } from 'lucide-react'
import { useState } from 'react'

export default function UploadZone({ onResults, onRunDemo, loading }) {
  const [files, setFiles] = useState({ gateway: null, bank: null, ledger: null })
  
  const handleFileChange = (type) => (e) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(p => ({ ...p, [type]: e.target.files[0] }))
    }
  }

  const allPresent = files.gateway && files.bank

  const handleStartReconciliation = () => {
    if (allPresent) {
      onResults(files.gateway, files.bank, files.ledger, 0.7)
    } else {
      onRunDemo()
    }
  }

  return (
    <div className="bg-white border border-[#DCE3ED] rounded-xl p-7 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#E6F0FF] shadow-sm">
            <FileText size={24} className="text-[#0065FF]" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#0B192C]">Data Ingestion Engine</h2>
            <p className="text-[14px] text-[#4A5568] mt-0.5">Upload your transaction files or run the instant AI reconciliation demo.</p>
          </div>
        </div>

        {/* 1-Click Demo Trigger */}
        <button
          onClick={onRunDemo}
          disabled={loading}
          className="px-5 py-2.5 bg-gradient-to-r from-[#0065FF] to-[#00C2FF] hover:from-[#0052CC] hover:to-[#00B0E6] text-white font-bold text-sm rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
        >
          <Sparkles size={16} className="text-[#00E6A0]" />
          {loading ? 'Running AI Engine...' : '⚡ Run 1-Click AI Demo'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { id: 'gateway', label: 'Payment Gateway Report', required: true, accept: '.csv', desc: 'Standard Razorpay format' },
          { id: 'bank',    label: 'Bank Account Statement', required: true, accept: '.csv,.xlsx', desc: 'Official bank export' },
          { id: 'ledger',  label: 'Internal ERP Ledger',    required: false, accept: '.csv', desc: 'Optional for 3-way match' },
        ].map((block) => (
          <div key={block.id} className="flex flex-col border border-[#DCE3ED] rounded-xl p-5 bg-[#EFF3F8]/40 hover:bg-white hover:border-[#0065FF] transition-all duration-200 relative">
            {block.required && (
              <span className="absolute top-4 right-4 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FEE2E2] text-[#EF4444]">
                Required
              </span>
            )}
            <h3 className="text-[15px] font-extrabold text-[#0B192C] mb-1">{block.label}</h3>
            <p className="text-[13px] text-[#718096] mb-4">{block.desc}</p>
            
            <div 
              className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#DCE3ED] rounded-xl p-5 bg-white cursor-pointer min-h-[150px] hover:border-[#0065FF] transition-colors"
              style={{ borderColor: files[block.id] ? '#10B981' : undefined }}
              onClick={() => document.getElementById(`upload-${block.id}`).click()}
            >
              {files[block.id] ? (
                <div className="flex flex-col items-center">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center mb-2.5 bg-[#D1FAE5] text-[#10B981]">
                    <CheckCircle2 size={22} />
                  </div>
                  <p className="font-extrabold text-[13px] text-[#0B192C] text-center break-all line-clamp-2">{files[block.id].name}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center mb-2 bg-[#EFF3F8] text-[#718096]">
                    <UploadCloud size={22} />
                  </div>
                  <p className="font-extrabold text-[13px] text-[#0065FF]">Click to select file</p>
                  <p className="text-[11px] text-[#718096] mt-1 font-mono">{block.accept}</p>
                </div>
              )}
              <input
                id={`upload-${block.id}`}
                type="file"
                className="hidden"
                accept={block.accept}
                onChange={handleFileChange(block.id)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-7 pt-5 border-t border-[#E8EEF5] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-[13px] font-bold">
          <AlertTriangle size={18} className={allPresent ? 'text-[#10B981]' : 'text-[#0065FF]'} />
          <span className="text-[#0B192C]">
            {allPresent ? 'Custom files attached and ready.' : 'Click button to run 3-pass reconciliation engine on demo or uploaded data.'}
          </span>
        </div>
        
        <button
          disabled={loading}
          onClick={handleStartReconciliation}
          className="btn-primary px-7 py-3 text-[14px] disabled:opacity-50 shadow-md"
        >
          {loading ? 'Running 3-Pass Matcher...' : 'Initialize Reconciliation Engine'}
        </button>
      </div>
    </div>
  )
}
