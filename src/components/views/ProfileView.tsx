import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Shield,
  Mail,
  Phone,
  Building2,
  Lock,
  Clock,
  LogOut,
  UserCheck,
  CheckCircle2,
  Briefcase,
  Key,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { currentUser, logout, users } = useApp();

  if (!currentUser) return null;

  const reportingManager = currentUser.managerId
    ? users.find((u) => u.id === currentUser.managerId)
    : null;

  const teamMembers = users.filter((u) => u.managerId === currentUser.id);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-xl ${currentUser.avatarColor} text-white font-bold flex items-center justify-center text-xl shadow-xs shrink-0`}
          >
            {currentUser.name.replace(' ', '')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {currentUser.name}
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono uppercase bg-slate-100 text-slate-700 border border-slate-200">
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentUser.designation} • ServiceOps Field Operations
            </p>
          </div>
        </div>

        <button
          id="btn-profile-logout"
          onClick={() => logout()}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Account & Enterprise Identifiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Enterprise Credentials & Identity</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Enterprise ID</span>
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                {currentUser.enterpriseId || currentUser.id.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">System Internal ID</span>
              <span className="font-mono text-slate-600 text-[11px]">{currentUser.id}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Operational Role</span>
              <span className="font-semibold text-slate-800">{currentUser.role}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Official Email</span>
              <span className="text-slate-800 font-mono text-[11px]">{currentUser.email}</span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500">Work Phone</span>
              <span className="text-slate-800 font-mono text-[11px]">{currentUser.phone}</span>
            </div>
          </div>
        </div>

        {/* Supervisory & Team Hierarchy */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Briefcase className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Organizational Scope & Hierarchy</h3>
          </div>

          {currentUser.role === 'FIELD_ENGINEER' && (
            <div className="space-y-3 text-xs">
              <p className="text-slate-500">
                You are assigned to field machinery maintenance and service ticket execution.
              </p>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[11px] font-semibold uppercase">Supervisory Reviewer</div>
                {reportingManager ? (
                  <div className="mt-1 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-900">{reportingManager.name}</span>
                    <span className="text-slate-400 font-mono text-[11px]">({reportingManager.enterpriseId})</span>
                  </div>
                ) : (
                  <div className="text-slate-500 mt-1">Pending supervisory manager assignment</div>
                )}
              </div>
            </div>
          )}

          {currentUser.role === 'MANAGER' && (
            <div className="space-y-3 text-xs">
              <p className="text-slate-500">
                You oversee Job Card authorization, checklist review, and engineering quality assurance.
              </p>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-slate-500 text-[11px] font-semibold uppercase">Managed Engineering Roster</div>
                {teamMembers.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {teamMembers.map((eng) => (
                      <div key={eng.id} className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-800">{eng.name}</span>
                        <span className="font-mono text-slate-500">{eng.enterpriseId}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 mt-1">
                    No engineers assigned to your supervision. System Administrator configures team rosters.
                  </div>
                )}
              </div>
            </div>
          )}

          {currentUser.role === 'OPERATIONS' && (
            <div className="space-y-3 text-xs">
              <p className="text-slate-500">
                You have commercial pricing and inventory warehouse control authority across all industrial equipment.
              </p>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Master Parts Pricing Control</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Stock Quantity Adjustments & Ledger</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Gross Margin & Labour Rate Governance</span>
                </div>
              </div>
            </div>
          )}

          {currentUser.role === 'ADMIN' && (
            <div className="space-y-3 text-xs">
              <p className="text-slate-500">
                Enterprise governance authority over user accounts, role definitions, team assignments, and security audit trail.
              </p>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 text-blue-700 font-semibold">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Full Role-Based Access Control</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-700 font-semibold">
                  <Key className="w-3.5 h-3.5" />
                  <span>Credential Management & Re-keying</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Enterprise Seed Reset Authority</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Security & Password Governance Notice */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-900">Security Governance & Password Policy</h3>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-2">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
            <div>
              <strong className="text-slate-900">Centralized Enterprise Security Policy</strong>
              <p className="text-slate-500 mt-0.5">
                Individual accounts cannot perform self-service password resets. Credentials, password resets, and account activations are strictly governed by the System Administrator in compliance with enterprise access security guidelines.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
