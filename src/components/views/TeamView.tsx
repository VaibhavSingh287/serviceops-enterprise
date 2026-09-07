import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Shield,
  Phone,
  Mail,
  CheckCircle2,
  UserCheck,
  UserX,
  FileText,
  Filter,
} from 'lucide-react';

export const TeamView: React.FC = () => {
  const { users, jobCards, currentUser, openJobCard } = useApp();
  const [selectedManagerFilter, setSelectedManagerFilter] = useState<string>('ALL');

  const isManager = currentUser?.role === 'MANAGER';
  const isAdmin = currentUser?.role === 'ADMIN';

  // For Managers: strictly scope to their assigned engineers (u.managerId === currentUser.id)
  // For Admins: allow viewing all or filtering by specific manager
  const teamEngineers = users.filter((u) => {
    if (u.role !== 'FIELD_ENGINEER') return false;

    if (isManager) {
      return u.managerId === currentUser.id;
    }

    if (isAdmin && selectedManagerFilter !== 'ALL') {
      return u.managerId === selectedManagerFilter;
    }

    return true;
  });

  const allManagers = users.filter((u) => u.role === 'MANAGER');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {isManager ? 'My Supervisory Engineering Team' : 'Field Engineering Team Roster'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isManager
              ? `Assigned engineers reporting directly to ${currentUser.name} (${currentUser.enterpriseId || currentUser.id}).`
              : 'Complete organizational hierarchy and engineer supervisory assignments.'}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filter Team:</span>
            <select
              value={selectedManagerFilter}
              onChange={(e) => setSelectedManagerFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-semibold cursor-pointer"
            >
              <option value="ALL">All Engineering Teams</option>
              {allManagers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}'s Team ({m.enterpriseId})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Engineers Grid or Empty State */}
      {teamEngineers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            No Field Engineers Assigned to Your Supervisory Team
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
            Your managerial profile currently has no registered field engineers assigned. Engineering team rosters and supervisory allocations are configured by the Enterprise System Administrator.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-mono">
            <span>Supervisor: {currentUser.name} ({currentUser.enterpriseId || currentUser.id})</span>
            <span>•</span>
            <span className="text-slate-400">0 Direct Reports</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teamEngineers.map((u) => {
            const assignedCards = jobCards.filter((jc) => jc.assignedEngineerId === u.id || jc.assignedEngineerName === u.name);
            const inProgressJobs = assignedCards.filter(
              (jc) => jc.status === 'In Progress' || jc.status === 'Draft'
            );
            const pendingReviewJobs = assignedCards.filter(
              (jc) => jc.status === 'Pending Review' || jc.status === 'Submitted'
            );
            const completedJobs = assignedCards.filter(
              (jc) => jc.status === 'Approved' || jc.status === 'Completed'
            );

            // Find manager
            const manager = u.managerId ? users.find((m) => m.id === u.managerId) : null;

            return (
              <div
                key={u.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-colors"
              >
                <div className="space-y-4">
                  {/* Avatar & Identifiers */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl ${u.avatarColor} text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0`}
                    >
                      {u.name.replace(' ', '')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {u.name}
                        </h3>
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                          {u.enterpriseId || u.id}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">{u.designation}</div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-mono text-[11px]">{u.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-[11px]">{u.phone}</span>
                    </div>
                    {manager && (
                      <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-200/60 text-[11px] text-slate-500">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>Supervisory Manager: <strong className="text-slate-800">{manager.name}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Workload Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="font-mono font-bold text-blue-700 text-sm">
                        {inProgressJobs.length}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">In Progress</div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="font-mono font-bold text-amber-700 text-sm">
                        {pendingReviewJobs.length}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">In Review</div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="font-mono font-bold text-emerald-700 text-sm">
                        {completedJobs.length}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">Completed</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-slate-400">Total: {assignedCards.length} Job Cards</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Active Engineer</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
