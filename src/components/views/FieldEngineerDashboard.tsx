import React from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import {
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  PlusCircle,
  Clock,
  Send,
  FileEdit,
  FileCheck,
  ChevronRight,
  Wrench,
} from 'lucide-react';

export const FieldEngineerDashboard: React.FC = () => {
  const { currentUser, jobCards, openJobCard, createNewJobCard, setActiveTab } = useApp();

  // Filter jobs for current field engineer
  const myJobCards = jobCards.filter(
    (jc) => jc.assignedEngineerName === currentUser.name || currentUser.role === 'ADMIN'
  );

  const drafts = myJobCards.filter((jc) => jc.status === 'Draft');
  const changesRequested = myJobCards.filter((jc) => jc.status === 'Changes Requested');
  const awaitingSubmission = myJobCards.filter(
    (jc) => jc.status === 'In Progress' || jc.status === 'Draft' || jc.status === 'Changes Requested'
  );
  const submitted = myJobCards.filter(
    (jc) => jc.status === 'Pending Review' || jc.status === 'Submitted'
  );
  const recentlyCompleted = myJobCards.filter(
    (jc) => jc.status === 'Approved' || jc.status === 'Completed'
  );

  const activeDraft = drafts[0] || changesRequested[0] || awaitingSubmission[0];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Field Engineer Service Queue
            </h2>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {currentUser.enterpriseId || currentUser.id}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Signed in as <strong className="text-slate-800">{currentUser.name}</strong> • Authorized Machinery Maintenance Scope
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-engineer-new-jobcard"
            onClick={() => createNewJobCard()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Job Card</span>
          </button>
        </div>
      </div>

      {/* Changes Requested Banner (Needs Immediate Attention) */}
      {changesRequested.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h3 className="text-xs font-bold text-amber-900">
                Action Required: {changesRequested.length} Job Card(s) Returned with Manager Notes
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Your Service Manager has requested revisions before final sign-off.
              </p>

              <div className="mt-3 space-y-2">
                {changesRequested.map((jc) => (
                  <div
                    key={jc.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-amber-200"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{jc.id}</span>
                        <span className="text-xs font-semibold text-slate-800">{jc.customerName}</span>
                        <span className="text-xs text-slate-500">({jc.equipmentName})</span>
                      </div>
                      <div className="text-xs text-amber-800 mt-0.5">
                        <strong className="font-semibold">Review note:</strong> "{jc.managerNotes || 'Please update details'}"
                      </div>
                    </div>
                    <button
                      onClick={() => openJobCard(jc.id)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                    >
                      <span>Open & Revise</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Focus KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* My Open Job Cards */}
        <div
          onClick={() => setActiveTab('my-jobcards')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-blue-400 transition-colors"
        >
          <span className="text-xs font-semibold text-slate-500 block">Open Job Cards</span>
          <div className="text-2xl font-black text-slate-900 mt-1.5 font-mono">
            {myJobCards.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Total in your scope</div>
        </div>

        {/* Drafts */}
        <div
          onClick={() => setActiveTab('drafts')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-blue-400 transition-colors"
        >
          <span className="text-xs font-semibold text-slate-500 block">Drafts</span>
          <div className="text-2xl font-black text-blue-700 mt-1.5 font-mono">
            {drafts.length}
          </div>
          <div className="text-[11px] text-blue-600 mt-0.5">Incomplete drafts</div>
        </div>

        {/* Awaiting Submission */}
        <div
          onClick={() => setActiveTab('my-jobcards')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-indigo-400 transition-colors"
        >
          <span className="text-xs font-semibold text-slate-500 block">Awaiting Submission</span>
          <div className="text-2xl font-black text-indigo-700 mt-1.5 font-mono">
            {awaitingSubmission.length}
          </div>
          <div className="text-[11px] text-indigo-600 mt-0.5">Active field tasks</div>
        </div>

        {/* Changes Requested */}
        <div
          onClick={() => setActiveTab('my-jobcards')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-amber-400 transition-colors"
        >
          <span className="text-xs font-semibold text-slate-500 block">Changes Requested</span>
          <div className="text-2xl font-black text-amber-700 mt-1.5 font-mono">
            {changesRequested.length}
          </div>
          <div className="text-[11px] text-amber-600 mt-0.5">Returned by manager</div>
        </div>

        {/* Recently Completed */}
        <div
          onClick={() => setActiveTab('my-jobcards')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-emerald-400 transition-colors"
        >
          <span className="text-xs font-semibold text-slate-500 block">Recently Completed</span>
          <div className="text-2xl font-black text-emerald-700 mt-1.5 font-mono">
            {recentlyCompleted.length}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Approved & archived</div>
        </div>
      </div>

      {/* Quick Action Buttons Row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
          Quick Actions:
        </span>
        <button
          onClick={() => createNewJobCard()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-blue-200/60"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Create Job Card</span>
        </button>

        {activeDraft && (
          <button
            onClick={() => openJobCard(activeDraft.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
          >
            <FileEdit className="w-3.5 h-3.5 text-blue-600" />
            <span>Continue Draft ({activeDraft.id})</span>
          </button>
        )}

        {changesRequested.length > 0 && (
          <button
            onClick={() => openJobCard(changesRequested[0].id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-amber-200"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>View Changes Requested ({changesRequested.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('submitted')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
        >
          <Send className="w-3.5 h-3.5 text-emerald-600" />
          <span>View Submitted Job Cards ({submitted.length})</span>
        </button>
      </div>

      {/* Operational Work Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              My Active Operational Work Queue
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Current active, pending, and drafted Job Cards ordered by priority
            </p>
          </div>
          <button
            onClick={() => setActiveTab('my-jobcards')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            View Complete Registry →
          </button>
        </div>

        {myJobCards.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Wrench className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-700">No Job Cards in queue</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click "Create Job Card" to begin service documentation.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {myJobCards.slice(0, 5).map((jc) => (
              <div
                key={jc.id}
                onClick={() => openJobCard(jc.id)}
                className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-mono font-bold text-xs text-slate-700 shrink-0">
                    {jc.id.slice(-4)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{jc.id}</span>
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {jc.customerName}
                      </span>
                      <PriorityBadge priority={jc.priority} />
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {jc.equipmentName} • {jc.problemReported}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <StatusBadge status={jc.status} />
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
