import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import ExecutiveDashboard from './components/ExecutiveDashboard'
import ReconciliationApp from './components/ReconciliationApp'
import HomeDashboard from './components/HomeDashboard'
import TransactionsHistory from './components/TransactionsHistory'
import SettlementsMock from './components/SettlementsMock'
import CustomersMock from './components/CustomersMock'
import SettingsMock from './components/SettingsMock'
import ReportsMock from './components/ReportsMock'
import InvestigationView from './components/InvestigationView'
import AuditLogView from './components/AuditLogView'
import ExceptionTable from './components/ExceptionTable'
import ChatPanel from './components/ChatPanel'
import GenericListView from './components/GenericListView'
import OnboardingOverlay from './components/OnboardingOverlay'
import HelpFAB from './components/HelpFAB'
import AdminLogin from './components/AdminLogin'
import { FileText, Link as LinkIcon, Layout, Share2, Repeat } from 'lucide-react'

const USER_SESSION_KEY = 'razorpay_authenticated_user_v1'
const ONBOARDING_KEY = 'razorpay_onboarding_done_v2'

function App() {
  const [user, setUser] = useState(null)
  const [activePage, setActivePage] = useState('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Shared state for reconciliation runs
  const [runId, setRunId] = useState(null)
  const [report, setReport] = useState(null)

  // Check saved login session
  useEffect(() => {
    const savedUser = localStorage.getItem(USER_SESSION_KEY)
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (e) {
        localStorage.removeItem(USER_SESSION_KEY)
      }
    }
  }, [])

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(userData))
    const done = localStorage.getItem(ONBOARDING_KEY)
    if (!done) {
      setShowOnboarding(true)
    }
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem(USER_SESSION_KEY)
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    localStorage.setItem(ONBOARDING_KEY, 'true')
  }

  const handleRestartTour = () => {
    localStorage.removeItem(ONBOARDING_KEY)
    setShowOnboarding(true)
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev)
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!user) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="flex h-screen bg-[#EFF3F8] font-sans overflow-hidden">
      <Sidebar 
        activePage={activePage} 
        onNavigate={setActivePage} 
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        user={user}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar 
          activePage={activePage} 
          runId={runId} 
          report={report} 
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          onNavigate={setActivePage}
          user={user}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {(activePage === 'overview' || activePage === 'home') && (
            <ExecutiveDashboard onNavigate={setActivePage} />
          )}
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
          {activePage === 'exceptions' && <ExceptionTable />}
          {activePage === 'investigation' && <InvestigationView exceptionId={1} />}
          {activePage === 'ai-assistant' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="bg-[#05103E] text-white p-6 rounded-xl shadow-sm border border-white/10">
                <h2 className="text-xl font-extrabold text-white">Where is my money? — AI Financial Investigation Assistant</h2>
                <p className="text-xs text-white/70 mt-1 font-medium">Trace settlement discrepancies across Gateway, Bank statement, and Ledger using verified database queries.</p>
              </div>
              <ChatPanel runId={runId} embedded={true} />
            </div>
          )}
          {activePage === 'audit-log' && <AuditLogView />}
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

      {showOnboarding && (
        <OnboardingOverlay onComplete={handleOnboardingComplete} />
      )}

      <HelpFAB onRestartTour={handleRestartTour} />
    </div>
  )
}

export default App
