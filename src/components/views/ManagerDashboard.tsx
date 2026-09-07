import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import {
  CheckSquare,
  AlertCircle,
  Clock,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  Filter,
  Users,
  XCircle,
  FileText,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const ManagerDashboard: React.FC = () => {
  const { currentUser, jobCards, users, openJobCard, setActiveTab } = useApp();

  const [tableSearch, setTableSearch] = useState('');

  // Managed engineers
  const managedEngineers = users.filter((u) => u.managerId === currentUser.id);

  // Scoped Job Cards for this manager
  const pendingApprovals = jobCards.filter(
    (jc) => jc.status === 'Pending Review' || jc.status === 'Submitted'
  );
  const changesRequested = jobCards.filter((jc) => jc.status === 'Changes Requested');
  const submittedToday = jobCards.filter(
    (jc) => jc.status === 'Submitted' || jc.status === 'Pending Review'
  );
  const approvedCards = jobCards.filter(
    (jc) => jc.status === 'Approved' || jc.status === 'Completed'
  );
  const rejectedCards = jobCards.filter((jc) => jc.status === 'Rejected');
  const totalTeamJobCards = jobCards.length;

  const filteredQueue = pendingApprovals.filter((jc) => {
    if (!tableSearch.trim()) return true;
    const q = tableSearch.toLowerCase();
    return (
      jc.id.toLowerCase().includes(q) ||
      jc.customerName.toLowerCase().includes(q) ||
      jc.equipmentName.toLowerCase().includes(q) ||
      jc.assignedEngineerName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Service Manager Supervisory Operations
            </h2>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {currentUser.enterpriseId || currentUser.id}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervising {managedEngineers.length} field engineers • Quality assurance, approvals & field SLA tracking
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('approvals')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Open Approval Queue ({pendingApprovals.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team Roster ({managedEngineers.length})</span>
          </button>
        </div>
      </div>

      {/* Specified Focal Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Pending Approvals */}
        <div
          onClick={() => setActiveTab('approvals')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-amber-400 transition-colors"
        >
          <span className="text-[11px] font-semibold text-slate-500 block">Pending Approvals</span>
          <div className="text-2xl font-black text-amber-700 mt-1 font-mono">
            {pendingApprovals.length}
          </div>
          <div className="text-[10px] text-amber-600 mt-0.5">Awaiting signoff</div>
        </div>

        {/* Changes Requested */}
        <div
          onClick={() => setActiveTab('jobcards')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-orange-400 transition-colors"
        >
          <span className="text-[11px] font-semibold text-slate-500 block">Changes Requested</span>
          <div className="text-2xl font-black text-orange-700 mt-1 font-mono">
            {changesRequested.length}
          </div>
          <div className="text-[10px] text-orange-600 mt-0.5">Returned to eng</div>
        </div>

        {/* Submitted Today */}
        <div
          onClick={() => setActiveTab('approvals')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-blue-400 transition-colors"
        >
          <span className="text-[11px] font-semibold text-slate-500 block">Submitted Today</span>
          <div className="text-2xl font-black text-blue-700 mt-1 font-mono">
            {submittedToday.length}
          </div>
          <div className="text-[10px] text-blue-600 mt-0.5">Ready for review</div>
        </div>

        {/* Approved Today */}
        <div
          onClick={() => setActiveTab('reports')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-emerald-400 transition-colors"
        >
          <span className="text-[11px] font-semibold text-slate-500 block">Approved</span>
          <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
            {approvedCards.length}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Verified & billed</div>
        </div>

        {/* Rejected */}
        <div
          onClick={() => setActiveTab('jobcards')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-rose-400 transition-colors"
        >
          <span className="text-[11px] font-semibold text-slate-500 block">Rejected</span>
          <div className="text-2xl font-black text-rose-700 mt-1 font-mono">
            {rejectedCards.length}
          </div>
          <div className="text-[10px] text-rose-600 mt-0.5">Declined cards</div>
        </div>

        {/* Total Team Job Cards */}
        <div
          onClick={() => setActiveTab('jobcards')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-slate-400 transition-colors"
        >
          <span className="text-[11px] font-semibold text-slate-500 block">Total Team Cards</span>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            {totalTeamJobCards}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">In managed scope</div>
        </div>
      </div>

      {/* 2-Column Split: Pending Approval Queue & Team Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Pending Approvals Table */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Pending Manager Approval Queue ({filteredQueue.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review work performed, AI consistency findings, parts installed, and authorize sign-off.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('approvals')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 shrink-0"
            >
              Full Queue →
            </button>
          </div>

          {filteredQueue.length === 0 ? (
            <div className="p-12 text-center text-slate-400 my-auto">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
              <p className="text-xs font-semibold text-slate-700">Approval queue is completely cleared</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                All submitted Job Cards from your managed engineers have been reviewed.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredQueue.map((jc) => (
                <div
                  key={jc.id}
                  onClick={() => openJobCard(jc.id)}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{jc.id}</span>
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {jc.customerName}
                      </span>
                      <PriorityBadge priority={jc.priority} />
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      Engineer: <strong className="text-slate-700">{jc.assignedEngineerName}</strong> • {jc.equipmentName}
                    </p>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Total: ₹{jc.pricing?.total?.toLocaleString()} • Parts: {jc.parts?.length || 0} items
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openJobCard(jc.id);
                      }}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Review</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team Workload Summary */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Team Workload Distribution</h3>
            </div>
            <button
              onClick={() => setActiveTab('team')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Manage Team →
            </button>
          </div>

          {managedEngineers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p className="text-xs font-semibold text-slate-600">No engineers assigned</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Field engineers are allocated to your supervisory roster by the Administrator.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {managedEngineers.map((eng) => {
                const engCards = jobCards.filter(
                  (jc) => jc.assignedEngineerId === eng.id || jc.assignedEngineerName === eng.name
                );
                const activeCount = engCards.filter(
                  (jc) => jc.status === 'In Progress' || jc.status === 'Draft' || jc.status === 'Changes Requested'
                ).length;
                const reviewCount = engCards.filter(
                  (jc) => jc.status === 'Pending Review' || jc.status === 'Submitted'
                ).length;

                return (
                  <div key={eng.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-xs text-slate-900">{eng.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono ml-2">{eng.enterpriseId}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        {engCards.length} Total Cards
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-white p-1.5 rounded border border-slate-200/60 text-center">
                        <span className="text-slate-400 block text-[10px]">Active In Field</span>
                        <span className="font-mono font-bold text-blue-700">{activeCount}</span>
                      </div>
                      <div className="bg-white p-1.5 rounded border border-slate-200/60 text-center">
                        <span className="text-slate-400 block text-[10px]">In Your Review</span>
                        <span className="font-mono font-bold text-amber-700">{reviewCount}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
