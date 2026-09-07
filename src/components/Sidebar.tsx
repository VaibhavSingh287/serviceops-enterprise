import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Home,
  FileText,
  CheckSquare,
  Users,
  BarChart3,
  Building2,
  Cpu,
  Package,
  DollarSign,
  Settings,
  PlusCircle,
  Clock,
  Send,
  User,
  Shield,
  Layers,
  Sliders,
  Server,
  Database,
  Key,
  Activity,
  AlertTriangle,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    setActiveJobCardId,
    createNewJobCard,
    jobCards,
    inventory,
    users,
  } = useApp();

  // Badges
  const pendingApprovalsCount = jobCards.filter(
    (jc) => jc.status === 'Pending Review' || jc.status === 'Submitted'
  ).length;

  const myDraftsCount = jobCards.filter(
    (jc) =>
      jc.assignedEngineerName === currentUser.name &&
      (jc.status === 'Draft' || jc.status === 'Changes Requested')
  ).length;

  const lowStockCount = inventory.filter(
    (item) => item.availableQty <= item.reorderLevel
  ).length;

  const unassignedCount = users.filter(
    (u) => u.role === 'FIELD_ENGINEER' && !u.managerId
  ).length;

  interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: number;
    action?: () => void;
  }

  // Strictly define navigation items per user role according to specification
  const getNavItems = (): NavItem[] => {
    switch (currentUser.role) {
      case 'FIELD_ENGINEER':
        return [
          { id: 'home', label: 'Home', icon: Home },
          { id: 'my-jobcards', label: 'My Job Cards', icon: FileText },
          {
            id: 'create-jobcard',
            label: 'Create Job Card',
            icon: PlusCircle,
            action: () => createNewJobCard(),
          },
          {
            id: 'drafts',
            label: 'Drafts',
            icon: Clock,
            badge: myDraftsCount > 0 ? myDraftsCount : undefined,
          },
          { id: 'submitted', label: 'Submitted', icon: Send },
          { id: 'customers', label: 'Customers', icon: Building2 },
          { id: 'equipment', label: 'Equipment', icon: Cpu },
          { id: 'activity', label: 'My Activity', icon: Activity },
          { id: 'profile', label: 'Profile', icon: User },
        ];

      case 'MANAGER':
        return [
          { id: 'home', label: 'Dashboard', icon: Home },
          {
            id: 'approvals',
            label: 'Approval Queue',
            icon: CheckSquare,
            badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
          },
          { id: 'team', label: 'My Team', icon: Users },
          { id: 'jobcards', label: 'Team Job Cards', icon: FileText },
          {
            id: 'pending',
            label: 'Pending Reviews',
            icon: Clock,
            badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
          },
          { id: 'reports', label: 'Reports', icon: BarChart3 },
          { id: 'customers', label: 'Customers', icon: Building2 },
          { id: 'equipment', label: 'Equipment', icon: Cpu },
          { id: 'activity', label: 'Audit / Activity', icon: Activity },
          { id: 'profile', label: 'Profile', icon: User },
        ];

      case 'OPERATIONS':
        return [
          { id: 'home', label: 'Operations Dashboard', icon: Home },
          { id: 'jobcards', label: 'Job Cards', icon: FileText },
          {
            id: 'inventory',
            label: 'Inventory',
            icon: Package,
            badge: lowStockCount > 0 ? lowStockCount : undefined,
          },
          { id: 'pricing', label: 'Pricing', icon: DollarSign },
          { id: 'parts', label: 'Parts', icon: Layers },
          { id: 'customers', label: 'Customers', icon: Building2 },
          { id: 'equipment', label: 'Equipment', icon: Cpu },
          { id: 'reports', label: 'Reports', icon: BarChart3 },
          { id: 'activity', label: 'Audit / Activity', icon: Activity },
          { id: 'profile', label: 'Profile', icon: User },
        ];

      case 'ADMIN':
        return [
          { id: 'home', label: 'Admin Dashboard', icon: Home },
          { id: 'users', label: 'User Management', icon: Users },
          {
            id: 'team',
            label: 'Teams & Assignments',
            icon: Shield,
            badge: unassignedCount > 0 ? unassignedCount : undefined,
          },
          { id: 'roles', label: 'Roles & Permissions', icon: Key },
          { id: 'system', label: 'System Configuration', icon: Settings },
          { id: 'audit', label: 'Audit Logs', icon: FileText },
          { id: 'data', label: 'Data Management', icon: Database },
          { id: 'health', label: 'System Health', icon: Server },
          { id: 'profile', label: 'Profile', icon: User },
        ];

      default:
        return [{ id: 'home', label: 'Home', icon: Home }];
    }
  };

  const navItems = getNavItems();

  const handleNavClick = (item: NavItem) => {
    if (item.action) {
      item.action();
      return;
    }
    setActiveJobCardId(null);
    setActiveTab(item.id);
  };

  return (
    <aside
      id="app-sidebar"
      className="w-60 bg-white text-slate-700 flex flex-col shrink-0 border-r border-slate-200 select-none"
    >
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-2.5 border-b border-slate-200">
        <div className="w-7 h-7 bg-slate-900 rounded flex items-center justify-center text-white font-bold text-xs tracking-wider shrink-0">
          OPS
        </div>
        <div className="min-w-0">
          <h1 className="text-slate-900 font-bold tracking-tight text-xs uppercase leading-tight truncate">
            ServiceOps Enterprise
          </h1>
          <div className="text-[10px] text-slate-400 font-medium">Field Service Operations</div>
        </div>
      </div>

      {/* Primary Action Button for Field Engineers */}
      {currentUser.role === 'FIELD_ENGINEER' && (
        <div className="p-3">
          <button
            id="btn-sidebar-create-jobcard"
            onClick={() => createNewJobCard()}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Job Card</span>
          </button>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 px-2 py-2 text-xs font-medium space-y-0.5 overflow-y-auto">
        <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {currentUser.role.replace('_', ' ')} MENU
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => handleNavClick(item)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer text-left ${
                isActive
                  ? 'bg-slate-100 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold font-mono ${
                    isActive
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Authenticated User Status Footer */}
      <div
        onClick={() => {
          setActiveJobCardId(null);
          setActiveTab('profile');
        }}
        className="p-3 border-t border-slate-200 mt-auto bg-slate-50/70 hover:bg-slate-100/80 transition-colors cursor-pointer"
        title="View Enterprise Profile"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0">
            {currentUser.name.replace(/\s+/g, '').substring(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-slate-900 text-xs font-semibold truncate leading-tight">
              {currentUser.name}
            </span>
            <span className="text-slate-500 text-[10px] font-mono leading-tight uppercase">
              {currentUser.enterpriseId || currentUser.id} • {currentUser.role.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
