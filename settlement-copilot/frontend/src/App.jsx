import { useState } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import ReconciliationApp from './components/ReconciliationApp'
import HomeDashboard from './components/HomeDashboard'
import TransactionsHistory from './components/TransactionsHistory'
import SettlementsMock from './components/SettlementsMock'
import CustomersMock from './components/CustomersMock'
import SettingsMock from './components/SettingsMock'
import ReportsMock from './components/ReportsMock'
import GenericListView from './components/GenericListView'
import { FileText, Link as LinkIcon, Layout, Share2, Repeat } from 'lucide-react'

function App() {
  const [activePage, setActivePage] = useState('reconciliation')

  // Shared state for the demo to show match rates on TopBar when running
  const [runId, setRunId] = useState(null)
  const [report, setReport] = useState(null)

  return (
    <div className="flex h-screen bg-[#f5f7fa] font-sans overflow-hidden">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar activePage={activePage} runId={runId} report={report} />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {activePage === 'home' && <HomeDashboard />}
          {activePage === 'transactions' && <TransactionsHistory />}
          {activePage === 'reconciliation' && (
            <ReconciliationApp 
              runId={runId} 
              setRunId={setRunId} 
              report={report} 
              setReport={setReport} 
            />
          )}
          {activePage === 'settlements' && <SettlementsMock />}
          {activePage === 'customers' && <CustomersMock />}
          {activePage === 'settings' && <SettingsMock />}
          {activePage === 'reports' && <ReportsMock />}

          {activePage === 'invoices' && (
            <GenericListView title="Invoices" subtitle="Manage and track your issued invoices." itemName="Invoice" emptyStateIcon={FileText} columns={['Invoice ID', 'Customer', 'Amount', 'Status', 'Due Date']} />
          )}
          {activePage === 'payment-links' && (
            <GenericListView title="Payment Links" subtitle="Create shareable links to collect payments instantly." itemName="Payment Link" emptyStateIcon={LinkIcon} columns={['Link ID', 'Amount', 'Status', 'Created At']} />
          )}
          {activePage === 'payment-pages' && (
            <GenericListView title="Payment Pages" subtitle="Build custom checkout pages without writing code." itemName="Payment Page" emptyStateIcon={Layout} columns={['Page Title', 'URL', 'Total Collected', 'Status']} />
          )}
          {activePage === 'route' && (
            <GenericListView title="Route (Splits)" subtitle="Automatically split payments with vendors and partners." itemName="Split Rule" emptyStateIcon={Share2} columns={['Rule Name', 'Account', 'Percentage', 'Status']} />
          )}
          {activePage === 'subscriptions' && (
            <GenericListView title="Subscriptions" subtitle="Manage recurring billing and subscription plans." itemName="Plan" emptyStateIcon={Repeat} columns={['Plan Name', 'Billing Cycle', 'Amount', 'Active Subs']} />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
