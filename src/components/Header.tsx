import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  Search,
  ChevronDown,
  LogOut,
  Mail,
  Phone,
  UserCheck,
  Shield,
  Menu,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentUser,
    logout,
    users,
    activeTab,
    setActiveTab,
    activeJobCardId,
    setActiveJobCardId,
    jobCards,
    openJobCard,
    notifications,
    markNotificationRead,
    toggleMobileNav,
  } = useApp();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setNotifMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered search results
  const searchResults = searchQuery.trim()
    ? jobCards.filter(
        (jc) =>
          jc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          jc.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          jc.equipmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          jc.problemReported.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const currentJobCard = activeJobCardId
    ? jobCards.find((jc) => jc.id === activeJobCardId)
    : null;

  // Reporting manager or managed team
  const reportingManager = currentUser.managerId
    ? users.find((u) => u.id === currentUser.managerId)
    : null;

  const managedTeam = currentUser.role === 'MANAGER'
    ? users.filter((u) => u.managerId === currentUser.id)
    : [];

  const getPageTitle = () => {
    switch (activeTab) {
      case 'home':
        if (currentUser.role === 'FIELD_ENGINEER') return 'Field Engineer Dashboard';
        if (currentUser.role === 'MANAGER') return 'Manager Approval Dashboard';
        if (currentUser.role === 'OPERATIONS') return 'Commercial Operations';
        return 'System Administration';
      case 'my-jobcards':
        return 'My Assigned Job Cards';
      case 'jobcards':
        return 'Job Cards Directory';
      case 'approvals':
        return 'Pending Approvals';
      case 'pricing':
        return 'Commercial Pricing';
      case 'inventory':
        return 'Warehouse Inventory';
      case 'customers':
        return 'Customer Accounts';
      case 'equipment':
        return 'Equipment Registry';
      case 'team':
        return 'Team & Personnel';
      case 'reports':
        return 'Operational Reports';
      case 'administration':
        return 'System Administration';
      default:
        return 'Service Operations';
    }
  };

  return (
    <header
      id="app-header"
      className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between z-30 shrink-0 select-none gap-2 sm:gap-4"
    >
      {/* Left: View title or Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Nav Hamburger Toggle */}
        <button
          onClick={toggleMobileNav}
          className="p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-md lg:hidden cursor-pointer shrink-0"
          aria-label="Open Navigation Menu"
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {currentJobCard ? (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 sm:gap-2 text-xs font-medium min-w-0 truncate">
            <button
              onClick={() => setActiveJobCardId(null)}
              className="text-slate-500 hover:text-slate-900 cursor-pointer transition-colors shrink-0"
            >
              Job Cards
            </button>
            <span className="text-slate-300 shrink-0">/</span>
            <span className="font-mono font-semibold text-blue-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 shrink-0">
              {currentJobCard.id}
            </span>
            <span className="text-slate-400 hidden sm:inline truncate">
              — {currentJobCard.customerName}
            </span>
          </nav>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate">
              {getPageTitle()}
            </h2>
            <span className="text-[10px] font-mono font-semibold px-1.5 sm:px-2 py-0.5 rounded uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 shrink-0 hidden md:inline-block">
              {currentUser.role.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>

      {/* Middle: Universal Search Bar & System Status */}
      <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 shrink-0">
        {/* System Online Status (subtle green dot) */}
        <div className="hidden xl:flex items-center gap-2 text-xs font-medium text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>System Online</span>
        </div>

        {/* Universal Search Bar */}
        <div className="relative w-28 xs:w-44 sm:w-56 md:w-64">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="input-global-search"
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              className="w-full pl-7 sm:pl-8 pr-2 sm:pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-slate-900 placeholder-slate-400 transition-colors"
            />
          </div>

          {/* Search Results Dropdown */}
          {searchOpen && searchQuery && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-md shadow-lg border border-slate-200 py-1.5 z-50 max-h-80 overflow-y-auto w-64 sm:w-auto -right-16 sm:right-0">
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Results ({searchResults.length})
              </div>
              {searchResults.length === 0 ? (
                <div className="px-3 py-3 text-xs text-slate-500 text-center">
                  No matching Job Cards found.
                </div>
              ) : (
                searchResults.map((jc) => (
                  <button
                    key={jc.id}
                    onClick={() => {
                      openJobCard(jc.id);
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-start justify-between gap-2 border-b border-slate-50 last:border-0 cursor-pointer"
                  >
                    <div>
                      <div className="font-mono font-bold text-xs text-blue-700">{jc.id}</div>
                      <div className="text-xs text-slate-800 font-medium">{jc.customerName}</div>
                      <div className="text-[11px] text-slate-500">{jc.equipmentName}</div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      {jc.status}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Notifications Icon */}
        <div className="relative" ref={notifDropdownRef}>
          <button
            onClick={() => setNotifMenuOpen(!notifMenuOpen)}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 relative cursor-pointer transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></span>
            )}
          </button>

          {notifMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-md shadow-lg border border-slate-200 p-2 z-50">
              <div className="px-2 py-1.5 font-semibold text-xs text-slate-800 border-b border-slate-100">
                System Notifications
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className="p-2.5 text-left hover:bg-slate-50 cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-slate-900">{n.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{n.message}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{n.timestamp}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={userDropdownRef}>
          <button
            id="btn-header-user-menu"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 pr-2 sm:pr-2.5 py-1.5 rounded-md hover:bg-slate-50 border border-slate-200 cursor-pointer transition-colors"
          >
            <div className="w-7 h-7 rounded bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser.name.replace(/\s+/g, '').substring(0, 2).toUpperCase()}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-semibold text-slate-900 leading-tight">{currentUser.name}</div>
              <div className="text-[10px] text-slate-500 leading-tight">
                {currentUser.role.replace('_', ' ')}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg border border-slate-200 p-3 z-50">
              {/* Authenticated Profile Details */}
              <div className="pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                    {currentUser.name.replace(/\s+/g, '').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{currentUser.designation}</div>
                    <div className="text-[10px] font-mono text-slate-400">{currentUser.id}</div>
                  </div>
                </div>

                <div className="mt-2.5 p-2 bg-slate-50 rounded border border-slate-100 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate text-[11px]">{currentUser.email}</span>
                  </div>

                  {/* Reporting Manager (if Engineer) */}
                  {currentUser.role === 'FIELD_ENGINEER' && (
                    <div className="pt-1 border-t border-slate-200/60 text-[11px] text-slate-600 flex items-center justify-between">
                      <span className="text-slate-400">Reporting Manager:</span>
                      <strong className="text-slate-800 font-medium">
                        {reportingManager ? reportingManager.name : (currentUser.managerId || 'Assigned Manager')}
                      </strong>
                    </div>
                  )}

                  {/* Managed Team (if Manager) */}
                  {currentUser.role === 'MANAGER' && (
                    <div className="pt-1 border-t border-slate-200/60 text-[11px] text-slate-600">
                      <span className="text-slate-400">Managed Team:</span>
                      <div className="font-medium text-slate-800 mt-0.5">
                        {managedTeam.length > 0
                          ? managedTeam.map((m) => m.name).join(', ')
                          : 'Team Engineers'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Security Status */}
              <div className="py-2 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Session Status</span>
                <span className="font-mono text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  AUTHENTICATED
                </span>
              </div>

              {/* Sign Out Action */}
              <button
                id="btn-header-signout"
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
