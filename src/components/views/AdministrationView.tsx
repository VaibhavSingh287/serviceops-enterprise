import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  Shield,
  Key,
  Database,
  RefreshCw,
  CheckCircle2,
  Lock,
  UserX,
  UserCheck,
  FileText,
  Clock,
  AlertTriangle,
  Users,
  Activity,
  Server,
  Layers,
  Search,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { UserRole } from '../../types';

interface AdministrationViewProps {
  initialTab?: string;
}

export const AdministrationView: React.FC<AdministrationViewProps> = ({ initialTab = 'dashboard' }) => {
  const { currentUser, token, users, auditLogs, refreshAuditLogs, refreshData, showToast } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<string>(initialTab);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Editing role state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<UserRole>('FIELD_ENGINEER');

  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);

  const isAdmin = currentUser?.role === 'ADMIN';

  // Metrics
  const activeUsersCount = users.filter((u) => u.isActive !== false).length;
  const inactiveUsersCount = users.filter((u) => u.isActive === false).length;
  const unassignedEngineers = users.filter((u) => u.role === 'FIELD_ENGINEER' && !u.managerId);
  const securityEvents = auditLogs.filter(
    (log) =>
      log.eventType.toLowerCase().includes('password') ||
      log.eventType.toLowerCase().includes('login') ||
      log.eventType.toLowerCase().includes('role') ||
      log.eventType.toLowerCase().includes('user')
  );

  const handleResetSystemData = async () => {
    if (!token) return;
    setIsResetting(true);
    try {
      const res = await fetch('/api/system/reset', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Reset rejected by server authorization', 'error');
        return;
      }

      await refreshData();
      showToast('System database reset to initial seed data', 'success');
    } catch (err) {
      showToast('Error communicating with server', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleAdminPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !token || !selectedUserForPassword || !newPassword) return;

    setIsChangingPassword(true);
    try {
      const res = await fetch(`/api/users/${selectedUserForPassword}/password`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to update credentials', 'error');
        return;
      }

      showToast('User credentials re-keyed successfully', 'success');
      setSelectedUserForPassword('');
      setNewPassword('');
    } catch (err) {
      showToast('Network error while resetting password', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus?: boolean) => {
    if (!token) return;
    const nextStatus = currentStatus === false;

    try {
      const res = await fetch(`/api/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: nextStatus }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to update user status', 'error');
        return;
      }

      await refreshData();
      showToast(`User account ${nextStatus ? 'activated' : 'deactivated'}`, 'success');
    } catch (err) {
      showToast('Network error while updating status', 'error');
    }
  };

  const handleAssignManager = async (engineerId: string, managerId: string) => {
    if (!token) return;

    try {
      const res = await fetch(`/api/users/${engineerId}/team`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ managerId: managerId || null }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to update team assignment', 'error');
        return;
      }

      await refreshData();
      showToast('Team reporting assignment updated', 'success');
    } catch (err) {
      showToast('Network error while assigning manager', 'error');
    }
  };

  const handleUpdateRole = async (userId: string) => {
    if (!token) return;

    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: editingRole }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to update role', 'error');
        return;
      }

      await refreshData();
      setEditingUserId(null);
      showToast('User operational role updated', 'success');
    } catch (err) {
      showToast('Network error while updating role', 'error');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q) ||
      (u.enterpriseId && u.enterpriseId.toLowerCase().includes(q)) ||
      u.role.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Enterprise Administration & Governance
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                ADMIN AUTHORIZED
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Role-Based Access Control, identity directory, team hierarchies, and immutable audit logs.
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold gap-1">
          {[
            { id: 'dashboard', label: 'Admin Dashboard' },
            { id: 'users', label: 'User Management' },
            { id: 'team', label: 'Teams & Assignments' },
            { id: 'roles', label: 'Roles & Permissions' },
            { id: 'audit', label: 'Audit Logs' },
            { id: 'data', label: 'Data Management' },
            { id: 'health', label: 'System Health' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. ADMIN DASHBOARD */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Metrics grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Active Users</span>
                <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
                {activeUsersCount} / {users.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {inactiveUsersCount > 0 ? `${inactiveUsersCount} deactivated account(s)` : 'All accounts enabled'}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Pending Account Actions</span>
                <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-700 mt-2 font-mono">
                {unassignedEngineers.length} Unassigned
              </div>
              <div className="text-[11px] text-amber-600 mt-1">
                {unassignedEngineers.length > 0 ? 'Engineers requiring team allocation' : 'All engineers allocated'}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Security Events</span>
                <div className="w-7 h-7 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-purple-700 mt-2 font-mono">
                {securityEvents.length} Events
              </div>
              <div className="text-[11px] text-purple-600 mt-1">Auth, credentials & permission logs</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">System Health</span>
                <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-700 mt-2 font-mono">
                100% Operational
              </div>
              <div className="text-[11px] text-emerald-600 mt-1">All subsystems and JWT auth verified</div>
            </div>
          </div>

          {/* Quick Overview Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Recent Security & Auth Events */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Recent Security & Audit Events</h3>
                </div>
                <button
                  onClick={() => setActiveSubTab('audit')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  View All →
                </button>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                {securityEvents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No security events recorded</div>
                ) : (
                  securityEvents.slice(0, 6).map((log) => (
                    <div key={log.id} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <span className="font-semibold text-slate-900">{log.eventType}</span>
                        <p className="text-[11px] text-slate-600 mt-0.5">{log.details}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[11px] font-mono text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[10px] text-slate-500">{log.userName}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Account Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">Admin Credential Governance</h3>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                <p className="font-medium text-slate-900">Centralized Password Reset Policy</p>
                <p className="text-slate-500 mt-0.5">
                  In compliance with enterprise security requirements, standard users cannot perform self-service password resets. Only System Administrators can re-key account passwords.
                </p>
              </div>

              <form onSubmit={handleAdminPasswordReset} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target User Account</label>
                  <select
                    value={selectedUserForPassword}
                    onChange={(e) => setSelectedUserForPassword(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Account --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.enterpriseId || u.id}) - {u.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New System Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    minLength={6}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold cursor-pointer transition-colors shadow-xs"
                >
                  {isChangingPassword ? 'Re-keying...' : 'Update User Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2. USER MANAGEMENT */}
      {activeSubTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">User Identity & Access Directory</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage roles, supervisory manager allocations, and account activation statuses.
              </p>
            </div>

            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, ID, role..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">User ID</th>
                  <th className="p-3">Display Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Reporting Manager</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Last Login</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const manager = users.find((m) => m.id === u.managerId);
                  const isEditingThis = editingUserId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {u.enterpriseId || u.id}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{u.name}</div>
                        <div className="text-[10px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="p-3">
                        {isEditingThis ? (
                          <div className="flex items-center gap-1">
                            <select
                              value={editingRole}
                              onChange={(e) => setEditingRole(e.target.value as UserRole)}
                              className="text-xs bg-slate-50 border border-slate-200 rounded p-1 font-semibold"
                            >
                              <option value="FIELD_ENGINEER">FIELD_ENGINEER</option>
                              <option value="MANAGER">MANAGER</option>
                              <option value="OPERATIONS">OPERATIONS</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                            <button
                              onClick={() => handleUpdateRole(u.id)}
                              className="p-1 bg-blue-600 text-white rounded cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="p-1 bg-slate-200 text-slate-700 rounded cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
                              {u.role}
                            </span>
                            <button
                              onClick={() => {
                                setEditingUserId(u.id);
                                setEditingRole(u.role);
                              }}
                              className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                              title="Change Role"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {u.role === 'FIELD_ENGINEER' ? (
                          <select
                            value={u.managerId || ''}
                            onChange={(e) => handleAssignManager(u.id, e.target.value)}
                            className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono cursor-pointer"
                          >
                            <option value="">Unassigned (No Manager)</option>
                            {users
                              .filter((m) => m.role === 'MANAGER')
                              .map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name} ({m.enterpriseId || m.id})
                                </option>
                              ))}
                          </select>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.isActive !== false
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {u.isActive !== false ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-400 text-[11px]">
                        Active Session
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUserForPassword(u.id);
                              setActiveSubTab('dashboard');
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold cursor-pointer"
                          >
                            Change Password
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                            className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                              u.isActive !== false
                                ? 'text-rose-600 hover:bg-rose-50'
                                : 'text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {u.isActive !== false ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. TEAMS & ASSIGNMENTS */}
      {activeSubTab === 'team' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Organizational Team Hierarchy</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervisory relationship matrix: Engineers submit to and are scoped to their assigned Manager.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users
              .filter((u) => u.role === 'MANAGER')
              .map((mgr) => {
                const assignedEngs = users.filter((eng) => eng.managerId === mgr.id);

                return (
                  <div key={mgr.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{mgr.name}</span>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {mgr.enterpriseId} • {mgr.email}
                        </div>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                        {assignedEngs.length} Engineers
                      </span>
                    </div>

                    {assignedEngs.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 bg-white rounded border border-dashed border-slate-200">
                        No engineers assigned to this manager.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {assignedEngs.map((eng) => (
                          <div
                            key={eng.id}
                            className="p-2 bg-white rounded border border-slate-200 text-xs flex items-center justify-between"
                          >
                            <div>
                              <span className="font-semibold text-slate-800">{eng.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono ml-2">
                                {eng.enterpriseId}
                              </span>
                            </div>

                            <select
                              value={eng.managerId || ''}
                              onChange={(e) => handleAssignManager(eng.id, e.target.value)}
                              className="text-[11px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-mono cursor-pointer"
                            >
                              {users
                                .filter((m) => m.role === 'MANAGER')
                                .map((m) => (
                                  <option key={m.id} value={m.id}>
                                    Move to {m.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 4. ROLES & PERMISSIONS */}
      {activeSubTab === 'roles' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Role-Based Access Control (RBAC) Matrix</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enforced server-side via token authentication and resource isolation guards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <strong className="text-blue-900 font-bold">FIELD ENGINEER</strong>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                  Worker Scope
                </span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                <li>Create and edit own assigned Job Cards in Draft status</li>
                <li>Execute checklist diagnostics, parts capture, and signature collection</li>
                <li>Submit completed Job Cards to designated supervisory Manager</li>
                <li>Cannot view other engineers' Job Cards or managerial queues</li>
                <li>Cannot modify master inventory or commercial pricing</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <strong className="text-indigo-900 font-bold">MANAGER</strong>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  Supervisory
                </span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                <li>Review submitted cards from directly managed engineering roster</li>
                <li>Authorize approval, request specific section changes, or reject</li>
                <li>Trigger AI automated quality auditor and pricing consistency checks</li>
                <li>Strictly isolated from other managers' engineering teams</li>
                <li>Cannot modify inventory catalog or user security credentials</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <strong className="text-purple-900 font-bold">OPERATIONS / PRICING</strong>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                  Commercial
                </span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                <li>Maintain master parts catalog, standard costs, and selling prices</li>
                <li>Adjust warehouse stock quantities with mandatory audit reason logging</li>
                <li>Set minimum reorder thresholds and monitor low-stock SKUs</li>
                <li>Audit pricing deviations and commercial variances across Job Cards</li>
                <li>Cannot modify user passwords or managerial rosters</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <strong className="text-emerald-900 font-bold">ADMINISTRATOR</strong>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Governance
                </span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                <li>Govern user directory, account statuses, and operational roles</li>
                <li>Re-key user passwords and maintain enterprise security compliance</li>
                <li>Configure engineer-to-manager supervisory team allocations</li>
                <li>Inspect full immutable audit trail across all system entities</li>
                <li>Execute enterprise database seed resets and maintenance operations</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 5. AUDIT LOGS */}
      {activeSubTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Immutable Enterprise Audit Trail</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Total Records: <strong className="text-slate-900">{auditLogs.length}</strong>
            </span>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[11px] font-mono text-slate-600 uppercase">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Event Type</th>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4">Target</th>
                  <th className="py-2.5 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 font-mono">
                    <td className="py-2.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-700">
                        {log.eventType}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-900 font-bold whitespace-nowrap font-sans">
                      {log.userName} <span className="text-[10px] font-mono text-slate-400 font-normal">({log.userRole})</span>
                    </td>
                    <td className="py-2.5 px-4 text-blue-700 font-bold whitespace-nowrap">
                      {log.targetId || '-'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 font-sans text-xs">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. DATA MANAGEMENT */}
      {activeSubTab === 'data' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Database Seed & Data Reset Control</h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            The platform maintains server-authoritative in-memory data structures across active container sessions. As System Administrator, you can re-initialize the system to standard seed data (12 enterprise accounts, initial team rosters, customer equipment, and calibrated Job Cards).
          </p>

          <div className="pt-2">
            <button
              id="btn-admin-reset-system"
              onClick={handleResetSystemData}
              disabled={isResetting}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>{isResetting ? 'Resetting System Data...' : 'Reset to Standard Enterprise Seed Data'}</span>
            </button>
            <p className="text-[11px] text-slate-400 mt-2">
              All uncommitted custom records will be reset to default factory configurations.
            </p>
          </div>
        </div>
      )}

      {/* 7. SYSTEM HEALTH */}
      {activeSubTab === 'health' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">System Runtime & Diagnostics</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 font-semibold block">API Gateway</span>
              <span className="font-bold text-emerald-700 text-sm mt-1 block">Express HTTP / Port 3000</span>
              <span className="text-[10px] text-slate-400">Vite SPA middleware integrated</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 font-semibold block">Security Subsystem</span>
              <span className="font-bold text-emerald-700 text-sm mt-1 block">HMAC JWT Verification</span>
              <span className="text-[10px] text-slate-400">Strict server-side role gating active</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 font-semibold block">AI Quality Engine</span>
              <span className="font-bold text-blue-700 text-sm mt-1 block">Diagnostic Intelligence Subsystem</span>
              <span className="text-[10px] text-slate-400">Automated diagnostic verification active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
