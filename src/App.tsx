import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { FieldEngineerDashboard } from './components/views/FieldEngineerDashboard';
import { ManagerDashboard } from './components/views/ManagerDashboard';
import { OperationsDashboard } from './components/views/OperationsDashboard';
import { JobCardListView } from './components/views/JobCardListView';
import { JobCardEditor } from './components/editor/JobCardEditor';
import { ManagerJobCardReview } from './components/manager/ManagerJobCardReview';
import { PricingOperationsView } from './components/views/PricingOperationsView';
import { InventoryManagementView } from './components/views/InventoryManagementView';
import { CustomersView } from './components/views/CustomersView';
import { EquipmentView } from './components/views/EquipmentView';
import { ReportsView } from './components/views/ReportsView';
import { TeamView } from './components/views/TeamView';
import { AdministrationView } from './components/views/AdministrationView';
import { AuditActivityView } from './components/views/AuditActivityView';
import { ProfileView } from './components/views/ProfileView';
import { LoginView } from './components/views/LoginView';
import { JobCardDocumentModal } from './components/document/JobCardDocumentModal';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    currentUser,
    isLoadingAuth,
    activeTab,
    activeJobCardId,
    jobCards,
    toast,
  } = useApp();

  if (isLoadingAuth) {
    return (
      <div className="h-screen w-screen bg-white flex items-center justify-center text-slate-700 text-xs">
        <div className="flex items-center gap-2.5 p-4 rounded-lg border border-slate-200 bg-slate-50 shadow-xs">
          <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <span className="font-medium text-slate-700">Verifying enterprise security session...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView />;
  }

  // Find active card if open
  const activeCard = activeJobCardId
    ? jobCards.find((jc) => jc.id === activeJobCardId)
    : null;

  // Decide what to render when a Job Card is open
  const renderJobCardDetail = () => {
    if (!activeCard) return null;

    // If user is a Manager or Operations reviewing, render Manager Review workspace
    if (
      currentUser.role === 'MANAGER' ||
      currentUser.role === 'OPERATIONS' ||
      activeCard.status === 'Pending Review' ||
      activeCard.status === 'Submitted' ||
      activeCard.status === 'Approved' ||
      activeCard.status === 'Completed'
    ) {
      return <ManagerJobCardReview jobCardId={activeCard.id} />;
    }

    // Default to guided Field Engineer editor
    return <JobCardEditor jobCardId={activeCard.id} />;
  };

  // Decide what to render in main view area
  const renderMainContent = () => {
    if (activeJobCardId) {
      return renderJobCardDetail();
    }

    switch (activeTab) {
      case 'home':
        if (currentUser.role === 'FIELD_ENGINEER') return <FieldEngineerDashboard />;
        if (currentUser.role === 'MANAGER') return <ManagerDashboard />;
        if (currentUser.role === 'OPERATIONS') return <OperationsDashboard />;
        return <AdministrationView initialTab="dashboard" />;

      case 'my-jobcards':
        return (
          <JobCardListView
            title="My Assigned Job Cards"
            description="Digital service records assigned to your field engineering account."
          />
        );

      case 'drafts':
        return (
          <JobCardListView
            initialStatus="Draft"
            title="My Incomplete Drafts"
            description="Work-in-progress Job Cards awaiting diagnostics, parts, or customer sign-off."
          />
        );

      case 'submitted':
        return (
          <JobCardListView
            initialStatus="Submitted"
            title="My Submitted Job Cards"
            description="Job Cards submitted to your supervisory manager for operational signoff."
          />
        );

      case 'jobcards':
        return <JobCardListView />;

      case 'approvals':
        return (
          <JobCardListView
            approvalsOnly={true}
            title="Supervisory Approval Queue"
            description="Pending field service submissions awaiting your management signoff or revision requests."
          />
        );

      case 'pending':
        return (
          <JobCardListView
            initialStatus="Pending Review"
            title="Pending Reviews"
            description="Job Cards under managerial review and quality verification."
          />
        );

      case 'team':
        if (currentUser.role === 'ADMIN') {
          return <AdministrationView initialTab="team" />;
        }
        return <TeamView />;

      case 'customers':
        return <CustomersView />;

      case 'equipment':
        return <EquipmentView />;

      case 'inventory':
      case 'parts':
        return <InventoryManagementView />;

      case 'pricing':
        return <PricingOperationsView />;

      case 'reports':
        return <ReportsView />;

      case 'activity':
        return <AuditActivityView />;

      case 'profile':
        return <ProfileView />;

      case 'users':
        return <AdministrationView initialTab="users" />;

      case 'roles':
        return <AdministrationView initialTab="roles" />;

      case 'system':
        return <AdministrationView initialTab="system" />;

      case 'audit':
        return <AdministrationView initialTab="audit" />;

      case 'data':
        return <AdministrationView initialTab="data" />;

      case 'health':
        return <AdministrationView initialTab="health" />;

      case 'administration':
        return <AdministrationView initialTab="dashboard" />;

      default:
        if (currentUser.role === 'FIELD_ENGINEER') return <FieldEngineerDashboard />;
        if (currentUser.role === 'MANAGER') return <ManagerDashboard />;
        if (currentUser.role === 'OPERATIONS') return <OperationsDashboard />;
        return <AdministrationView initialTab="dashboard" />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F1F5F9] font-sans text-slate-800">
      {/* Role-Based Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-[#F1F5F9]">
          {renderMainContent()}
        </main>
      </div>

      {/* Printable Job Card Official Document Modal */}
      <JobCardDocumentModal />

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold text-white ${
              toast.type === 'success'
                ? 'bg-emerald-600'
                : toast.type === 'warning'
                ? 'bg-orange-600'
                : toast.type === 'error'
                ? 'bg-rose-600'
                : 'bg-slate-900'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4" />}
            {toast.type === 'info' && <Info className="w-4 h-4" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
