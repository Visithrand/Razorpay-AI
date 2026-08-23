import { UploadCloud, CheckCircle2, FileText, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

export default function UploadZone({ onUpload }) {
  const [files, setFiles] = useState({ gateway: null, bank: null, ledger: null })
  
  const handleFileChange = (type) => (e) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(p => ({ ...p, [type]: e.target.files[0] }))
    }
  }

  const allPresent = files.gateway && files.bank

  return (
    <div className="glass-panel p-8 animate-in fade-in duration-500 mb-8 relative overflow-hidden group">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-[#2b6aff]/5 to-[#00e676]/5 blur-3xl pointer-events-none rounded-full" />
      
      <div className="flex items-center gap-4 mb-8 relative z-10">
        <div className="w-12 h-12 bg-gradient-to-br from-[#2b6aff] to-[#0047ff] rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(43,106,255,0.4)]">
          <FileText size={22} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Data Ingestion Engine</h2>
          <p className="text-[#94a3b8] mt-1">Upload your transaction files to ignite the reconciliation process.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {[
          { id: 'gateway', label: 'Payment Gateway Report', required: true, accept: '.csv', desc: 'Standard Razorpay format' },
          { id: 'bank',    label: 'Bank Account Statement', required: true, accept: '.csv,.xlsx', desc: 'Official bank export' },
          { id: 'ledger',  label: 'Internal ERP Ledger',    required: false, accept: '.csv', desc: 'Optional for 3-way match' },
        ].map((block) => (
          <div key={block.id} className="flex flex-col border border-white/10 rounded-2xl bg-white/[0.02] p-5 hover:border-[#2b6aff]/50 transition-all duration-300 relative group/card shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] hover:shadow-[0_0_25px_rgba(43,106,255,0.15)] hover:-translate-y-1">
            {block.required && (
              <span className="absolute top-4 right-4 text-[9px] font-bold uppercase tracking-widest text-[#ff4757] bg-[#ff4757]/10 border border-[#ff4757]/20 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(255,71,87,0.2)]">
                Required
              </span>
            )}
            <h3 className="text-sm font-bold text-white mb-1.5">{block.label}</h3>
            <p className="text-xs text-[#64748b] mb-5">{block.desc}</p>
            
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 bg-black/20 rounded-xl p-5 transition-all duration-300 group-hover/card:border-[#2b6aff]/50 group-hover/card:bg-[#2b6aff]/5 cursor-pointer min-h-[160px]"
                 onClick={() => document.getElementById(`upload-${block.id}`).click()}>
              {files[block.id] ? (
                <div className="flex flex-col items-center animate-in zoom-in duration-300">
                  <div className="w-12 h-12 bg-[#00e676]/10 border border-[#00e676]/30 rounded-full flex items-center justify-center text-[#00e676] mb-3 shadow-[0_0_20px_rgba(0,230,118,0.3)]">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="text-white font-semibold text-sm text-center break-all line-clamp-2">{files[block.id].name}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-[#64748b] mb-4 group-hover/card:text-[#2b6aff] group-hover/card:scale-110 group-hover/card:shadow-[0_0_15px_rgba(43,106,255,0.5)] transition-all duration-300">
                    <UploadCloud size={24} />
                  </div>
                  <p className="text-[#94a3b8] font-medium text-sm group-hover/card:text-white transition-colors">Click to select</p>
                  <p className="text-xs text-[#475569] mt-2 font-mono">Accepts {block.accept}</p>
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

      <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-5 relative z-10">
        <div className="flex items-center gap-3 text-sm">
          <AlertTriangle size={20} className={allPresent ? 'text-[#00e676]' : 'text-[#f59e0b]'} />
          <span className={allPresent ? 'text-white font-medium' : 'text-[#94a3b8]'}>
            {allPresent ? 'All required systems are locked in and ready.' : 'Awaiting mandatory data inputs to commence.'}
          </span>
        </div>
        
        <button
          disabled={!allPresent}
          onClick={() => onUpload(files.gateway, files.bank, files.ledger, 0.7)}
          className={`btn-primary px-10 py-3 text-base ${!allPresent && 'opacity-50 grayscale cursor-not-allowed hover:scale-100'}`}
        >
          Initialize Reconciliation Engine
        </button>
      </div>
    </div>
  )
}
