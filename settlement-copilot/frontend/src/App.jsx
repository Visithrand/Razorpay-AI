import { useState, useEffect } from 'react'
import { getMe, logout } from './api'
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
import LiveMonitor from './components/LiveMonitor'
import AuditLogView from './components/AuditLogView'
import ExceptionTable from './components/ExceptionTable'
import ChatPanel from './components/ChatPanel'
import GenericListView from './components/GenericListView'
import OnboardingOverlay from './components/OnboardingOverlay'
import HelpFAB from './components/HelpFAB'
import AdminLogin from './components/AdminLogin'
import ScenarioLab from './components/ScenarioLab'
import ErrorBoundary from './components/ErrorBoundary'
import { FileText, Link as LinkIcon, Layout, Share2, Repeat } from 'lucide-react'

const USER_SESSION_KEY = 'razorpay_authenticated_user_v1'
const ONBOARDING_KEY = 'razorpay_onboarding_done_v2'

function App() {
  const [user, setUser] = useState(null)
  const [activePage, setActivePage] = useState('overview')
  const [activeExceptionId, setActiveExceptionId] = useState(1)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Shared state for reconciliation runs
  const [runId, setRunId] = useState(null)
  const [report, setReport] = useState(null)

  const [authLoading, setAuthLoading] = useState(true)

  // Check backend session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const userData = await getMe()
        setUser(userData)
      } catch (e) {
        setUser(null)
      } finally {
        setAuthLoading(false)
      }
    }
    fetchSession()
  }, [])

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    // Check onboarding logic
    const done = localStorage.getItem(ONBOARDING_KEY)
    if (!done) {
      setShowOnboarding(true)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch(e) {
      console.error('Logout failed:', e)
    }
    setUser(null)
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

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-[#0065FF] font-bold text-lg animate-pulse">Loading Secure Session...</div></div>
  }

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
          onNavigate={(page, param) => {
            setActivePage(page)
            if (param) setActiveExceptionId(param)
          }}
          user={user}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {(activePage === 'overview' || activePage === 'home') && (
            <ExecutiveDashboard onNavigate={setActivePage} />
          )}
          {activePage === 'live-monitor' && (
            <LiveMonitor onNavigate={(page, param) => {
              setActivePage(page)
              if (param) setActiveExceptionId(param)
            }} />
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
          {activePage === 'investigation' && (
            <ErrorBoundary>
              <InvestigationView exceptionId={activeExceptionId} />
            </ErrorBoundary>
          )}
          {activePage === 'scenario-lab' && <ScenarioLab />}
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
