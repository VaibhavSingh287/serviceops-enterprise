import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { JobCard } from '../../types';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Sparkles,
  Clock,
  ShieldCheck,
  Building2,
  Cpu,
  DollarSign,
  Camera,
  History,
  Check,
  Send,
  Printer,
  ChevronRight,
  FileSignature,
} from 'lucide-react';

export const ManagerJobCardReview: React.FC<{ jobCardId: string }> = ({ jobCardId }) => {
  const {
    jobCards,
    approveJobCard,
    requestChanges,
    rejectJobCard,
    setActiveJobCardId,
    setDocumentJobCard,
    currentUser,
  } = useApp();

  const card = jobCards.find((jc) => jc.id === jobCardId);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Modal states
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');

  const [changesModalOpen, setChangesModalOpen] = useState(false);
  const [changesSections, setChangesSections] = useState<string[]>(['Inspection']);
  const [changesComments, setChangesComments] = useState('');

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('Incorrect Diagnostic Data');
  const [rejectComments, setRejectComments] = useState('');

  // Formal Approval Panel Verification State
  const [verifiedTechnical, setVerifiedTechnical] = useState(false);
  const [verifiedCustomerSignature, setVerifiedCustomerSignature] = useState(false);
  const [verifiedPartsUsage, setVerifiedPartsUsage] = useState(false);
  const [managerNotes, setManagerNotes] = useState('');

  // Auto-check customer signature verification if customer sign-off is confirmed
  useEffect(() => {
    if (card?.customerSignOff?.isConfirmed) {
      setVerifiedCustomerSignature(true);
    }
  }, [card?.id, card?.customerSignOff?.isConfirmed]);

  if (!card) {
    return (
      <div className="p-8 text-center text-slate-500">
        Job Card not found or removed.
      </div>
    );
  }

  const handleApproveConfirm = async () => {
    const notes = approveNotes.trim() || managerNotes.trim() || 'Manager verified and authorized sign-off.';
    const success = await approveJobCard(card.id, notes);
    setApproveModalOpen(false);
    if (success) {
      setActiveJobCardId(null);
    }
  };

  const handleChangesConfirm = async () => {
    if (!changesComments.trim()) return;
    const success = await requestChanges(card.id, changesSections, changesComments.trim());
    setChangesModalOpen(false);
    if (success) {
      setActiveJobCardId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectComments.trim()) return;
    const success = await rejectJobCard(card.id, rejectReason, rejectComments.trim());
    setRejectModalOpen(false);
    if (success) {
      setActiveJobCardId(null);
    }
  };

  const issuesFound = card.checklist.filter((c) => c.status === 'Issue Found');

  return (
    <div className="min-h-full pb-16 bg-slate-50/60">
      {/* Sticky Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveJobCardId(null)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-blue-600">{card.id}</span>
                <StatusBadge status={card.status} size="sm" />
                <PriorityBadge priority={card.priority} />
                <span className="text-xs text-slate-500 font-medium">
                  • Submitted by {card.assignedEngineerName}
                </span>
              </div>
              <div className="text-xs text-slate-600 font-medium">
                {card.customerName} — {card.equipmentName} ({card.model})
              </div>
            </div>
          </div>

          {/* Review Decision Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDocumentJobCard(card)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Document</span>
            </button>

            {card.status === 'Pending Review' || card.status === 'Submitted' ? (
              <>
                <button
                  onClick={() => {
                    setRejectComments(managerNotes);
                    setRejectModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>

                <button
                  onClick={() => {
                    setChangesComments(managerNotes);
                    setChangesModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Request Changes</span>
                </button>

                <button
                  onClick={() => {
                    setApproveNotes(managerNotes);
                    setApproveModalOpen(true);
                  }}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve Job Card</span>
                </button>
              </>
            ) : (
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {card.status}
              </span>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-slate-100 bg-slate-50/70 overflow-x-auto">
          <div className="max-w-7xl mx-auto px-6 flex items-center gap-6 min-w-[600px]">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'inspection', label: `Inspection (${issuesFound.length} Issues)` },
              { id: 'parts', label: `Parts & Labour (₹${card.pricing.total.toLocaleString()})` },
              { id: 'evidence', label: `Evidence (${card.attachments.length} Photos)` },
              { id: 'ai-review', label: 'AI Review & Audits' },
              { id: 'audit', label: 'Audit Trail' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto p-6 mt-4 space-y-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Formal Approval Decision Panel (for Managers & Admins) */}
            {(currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN') && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Supervisory Approval & Sign-Off Panel
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Formal review, technical verification, and authorization decision.
                    </p>
                  </div>
                  <span className="text-xs font-mono bg-slate-50 border border-slate-200 px-2.5 py-1 rounded font-semibold text-slate-700">
                    Reviewer: {currentUser.name} ({currentUser.role})
                  </span>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">Current Status:</span>
                    <div className="mt-1">
                      <StatusBadge status={card.status} size="sm" />
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Assigned Engineer:</span>
                    <div className="mt-1 font-bold text-slate-900">{card.assignedEngineerName}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Service Value / Total Cost:</span>
                    <div className="mt-1 font-mono font-bold text-base text-blue-700">
                      ₹{card.pricing.total.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Verification Checkboxes */}
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Required Sign-off Verifications:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-md cursor-pointer hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={verifiedTechnical}
                        onChange={(e) => setVerifiedTechnical(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-0 cursor-pointer"
                      />
                      <span className="font-medium text-slate-800">Verified technical completion</span>
                    </label>
                    <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-md cursor-pointer hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={verifiedCustomerSignature}
                        onChange={(e) => setVerifiedCustomerSignature(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-0 cursor-pointer"
                      />
                      <span className="font-medium text-slate-800">Verified customer signature</span>
                    </label>
                    <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-md cursor-pointer hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={verifiedPartsUsage}
                        onChange={(e) => setVerifiedPartsUsage(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-0 cursor-pointer"
                      />
                      <span className="font-medium text-slate-800">Verified parts usage</span>
                    </label>
                  </div>
                </div>

                {/* Manager Notes / Instructions */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-slate-700">Manager Notes / Instructions</label>
                  <textarea
                    rows={2}
                    value={managerNotes}
                    onChange={(e) => setManagerNotes(e.target.value)}
                    placeholder="Enter supervisory notes, instructions for billing, or revision requests..."
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-md outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                {/* Formal Action Buttons */}
                {card.status === 'Pending Review' || card.status === 'Submitted' ? (
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setRejectComments(managerNotes);
                        setRejectModalOpen(true);
                      }}
                      className="px-3.5 py-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>Reject Job Card</span>
                    </button>
                    <button
                      onClick={() => {
                        setChangesComments(managerNotes);
                        setChangesModalOpen(true);
                      }}
                      className="px-3.5 py-2 bg-white hover:bg-amber-50 border border-amber-300 text-amber-800 rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Request Changes</span>
                    </button>
                    <button
                      onClick={() => {
                        setApproveNotes(managerNotes);
                        setApproveModalOpen(true);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Job Card</span>
                    </button>
                  </div>
                ) : card.status === 'Approved' || card.status === 'Completed' ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-between font-medium">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>This Job Card has been signed off and approved by {card.approvedBy || 'Manager'}. Record is finalized and locked.</span>
                    </div>
                    <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">APPROVED</span>
                  </div>
                ) : card.status === 'Rejected' ? (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-center justify-between font-medium">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Job Card rejected (terminal state). Reason: "{card.rejectionReason || 'Supervisory rejection'}". Closed to resubmission.</span>
                    </div>
                    <span className="font-mono text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">REJECTED</span>
                  </div>
                ) : card.status === 'Changes Requested' ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between font-medium">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Changes requested from engineer ({card.assignedEngineerName}). Feedback: "{card.managerNotes}". Awaiting engineer resubmission.</span>
                    </div>
                    <span className="font-mono text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">PENDING REVISION</span>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-center justify-between font-medium">
                    <span>Card is in {card.status} status. Only cards in "Pending Review" can be approved or rejected.</span>
                    <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">{card.status.toUpperCase()}</span>
                  </div>
                )}
              </div>
            )}

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-medium text-slate-500">Service Category</span>
                <div className="text-sm font-bold text-slate-900 mt-1">{card.serviceType}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Priority: {card.priority}</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-medium text-slate-500">Operating Hours</span>
                <div className="text-sm font-bold text-slate-900 mt-1 font-mono">
                  {card.operatingHours.toLocaleString()} hrs
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Asset: {card.equipmentName}</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-medium text-slate-500">Total Billed</span>
                <div className="text-base font-extrabold text-blue-700 mt-1 font-mono">
                  ₹{card.pricing.total.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Includes 18% GST</div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-medium text-slate-500">Inspection Status</span>
                <div className="text-sm font-bold text-slate-900 mt-1">
                  {issuesFound.length > 0 ? (
                    <span className="text-amber-700">{issuesFound.length} Issues Flagged</span>
                  ) : (
                    <span className="text-emerald-700">All Checks Passed</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {card.checklist.length} checkpoints inspected
                </div>
              </div>
            </div>

            {/* Scope & Narrative */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Reported Symptom & Problem Scope
                </h3>
                <p className="text-sm text-slate-800 mt-1 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {card.problemReported || 'Standard scheduled service.'}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Field Engineer Technical Narrative
                </h3>
                <p className="text-sm text-slate-900 mt-1 leading-relaxed bg-blue-50/30 p-3 rounded-lg border border-blue-100">
                  {card.workPerformed || 'Awaiting final writeup.'}
                </p>
              </div>

              {card.recommendations && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Engineer Recommendations for Client
                  </h3>
                  <p className="text-xs text-slate-700 mt-1 bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                    {card.recommendations}
                  </p>
                </div>
              )}
            </div>

            {/* Customer & Location */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-slate-600" />
                  <h3 className="text-sm font-bold text-slate-900">Customer & Site</h3>
                </div>
                <div className="text-xs space-y-1.5 text-slate-700">
                  <div><strong>Company:</strong> {card.customerName}</div>
                  <div><strong>Site / Floor:</strong> {card.siteLocation}</div>
                  <div><strong>Contact:</strong> {card.contactPerson} ({card.contactPhone})</div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Cpu className="w-4 h-4 text-slate-600" />
                  <h3 className="text-sm font-bold text-slate-900">Machinery Specifications</h3>
                </div>
                <div className="text-xs space-y-1.5 text-slate-700">
                  <div><strong>Asset:</strong> {card.equipmentName}</div>
                  <div><strong>Model:</strong> {card.model}</div>
                  <div><strong>Serial #:</strong> <span className="font-mono">{card.serialNumber}</span></div>
                  <div><strong>Operating Hours:</strong> {card.operatingHours} hrs</div>
                </div>
              </div>
            </div>

            {/* Customer On-Site Acceptance & Electronic Signature */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileSignature className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Customer On-Site Acceptance</h3>
                </div>
                {card.customerSignOff?.isConfirmed ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirmed & Signed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Pending Sign-Off
                  </span>
                )}
              </div>

              {card.customerSignOff?.isConfirmed ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Representative</div>
                    <div className="font-bold text-slate-900 text-sm">{card.customerSignOff.signedByName}</div>
                    <div>{card.customerSignOff.signedByDesignation || 'Authorized Representative'}</div>
                    {card.customerSignOff.contactPhone && (
                      <div className="text-slate-500">Phone: {card.customerSignOff.contactPhone}</div>
                    )}
                    <div className="text-[11px] text-slate-400 pt-1 font-mono">
                      Timestamp: {new Date(card.customerSignOff.signedAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Customer Feedback</div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg italic text-slate-700">
                      "{card.customerSignOff.remarks || 'Work verified satisfactorily on site.'}"
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Electronic Signature Stamp</div>
                    <div className="font-serif text-lg italic text-blue-900 border-b-2 border-blue-900 px-6 py-1 select-none">
                      {card.customerSignOff.signedByName}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-2 font-mono">Verified Digital Sign-Off</div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Customer sign-off has not yet been recorded.</span>
                    <p className="mt-0.5 text-amber-800">
                      Standard enterprise SOP requires verified customer acceptance before supervisory sign-off.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Revision History Audit Trail */}
            {card.revisionHistory && card.revisionHistory.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <History className="w-4 h-4 text-orange-600" />
                  <h3 className="text-sm font-bold text-slate-900">Revision Audit Log ({card.revisionHistory.length} Cycles)</h3>
                </div>

                <div className="space-y-3">
                  {card.revisionHistory.map((rev) => (
                    <div key={rev.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">Revision requested by {rev.requestedByName}</span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {new Date(rev.requestedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {rev.sections.map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px] font-bold">
                            {s}
                          </span>
                        ))}
                      </div>
                      <p className="text-slate-700 bg-white p-2.5 rounded border border-slate-200">
                        {rev.comments}
                      </p>
                      {rev.resubmittedAt && (
                        <div className="text-emerald-700 text-[11px] font-medium pt-1">
                          ✓ Resubmitted on {new Date(rev.resubmittedAt).toLocaleString()}: "{rev.resubmittedNotes || 'Addressed revisions'}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* INSPECTION TAB */}
        {activeTab === 'inspection' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Checklist Diagnostic Matrix
            </h3>

            <div className="space-y-3">
              {card.checklist.map((item) => {
                const isIssue = item.status === 'Issue Found';
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border ${
                      isIssue ? 'bg-red-50/40 border-red-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {item.code}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{item.label}</div>
                          <div className="text-[11px] text-slate-500">Category: {item.category}</div>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-md shrink-0 ${
                          item.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'Issue Found'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {isIssue && item.issue && (
                      <div className="mt-3 pt-3 border-t border-red-200 bg-white p-3 rounded-lg text-xs space-y-1">
                        <div className="text-red-900 font-bold">
                          Fault Identified: {item.issue.description}
                        </div>
                        <div className="text-slate-600">
                          <strong>Severity: </strong> {item.issue.severity}
                        </div>
                        <div className="text-slate-600">
                          <strong>Recommendation: </strong> {item.issue.recommendation}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PARTS & LABOUR TAB */}
        {activeTab === 'parts' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Consumed Materials & Commercial Costs
            </h3>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">Part #</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Master Ref Price</th>
                    <th className="p-3 text-right">Applied Unit Price</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {card.parts.map((p) => {
                    const variance = p.standardPrice
                      ? Math.round(((p.unitPrice - p.standardPrice) / p.standardPrice) * 100)
                      : 0;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-900">{p.partNumber}</td>
                        <td className="p-3 text-slate-700">{p.description}</td>
                        <td className="p-3 text-center font-bold">{p.quantity}</td>
                        <td className="p-3 text-right font-mono text-slate-500">₹{p.standardPrice || p.unitPrice}</td>
                        <td className="p-3 text-right font-mono">
                          ₹{p.unitPrice}
                          {variance !== 0 && (
                            <span className="ml-1 text-[10px] font-bold text-purple-700">
                              ({variance > 0 ? '+' : ''}{variance}%)
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          ₹{p.total.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="max-w-xs ml-auto space-y-2 text-xs border-t border-slate-200 pt-4">
              <div className="flex justify-between text-slate-600">
                <span>Parts Subtotal:</span>
                <span className="font-mono font-semibold">₹{card.pricing.parts.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Labour ({card.pricing.labourHours} hrs @ ₹{card.pricing.labourRate}):</span>
                <span className="font-mono font-semibold">₹{card.pricing.labour.toLocaleString()}</span>
              </div>
              {card.pricing.serviceCharges > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Service Surcharges:</span>
                  <span className="font-mono font-semibold">₹{card.pricing.serviceCharges.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>GST (18%):</span>
                <span className="font-mono font-semibold">₹{card.pricing.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-blue-900 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="font-mono">₹{card.pricing.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* EVIDENCE TAB */}
        {activeTab === 'evidence' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Photographic Proof & Inspection Evidence
            </h3>

            {card.attachments.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-300 rounded-lg text-xs text-slate-500">
                No attachments uploaded for this Job Card.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {card.attachments.map((att) => (
                  <div key={att.id} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                    <div className="h-44 bg-slate-100 overflow-hidden relative">
                      <img src={att.dataUrl} alt={att.name} className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold rounded">
                        {att.category}
                      </span>
                    </div>
                    <div className="p-2.5">
                      <div className="text-xs font-semibold text-slate-900 truncate">{att.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex justify-between">
                        <span>{att.uploadedAt}</span>
                        <span>{att.sizeKb} KB</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI REVIEW TAB */}
        {activeTab === 'ai-review' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Automated Quality & Diagnostic Consistency Audit
              </h3>
            </div>

            {card.aiReview ? (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <div className="text-xs font-bold text-indigo-900 mb-1">Executive Summary</div>
                  <p className="text-xs text-indigo-800 leading-relaxed">
                    {card.aiReview.executiveSummary}
                  </p>
                </div>

                {card.aiReview.pricingVariances?.length > 0 && (
                  <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100">
                    <div className="text-xs font-bold text-purple-900 mb-2">
                      Pricing Variances Detected
                    </div>
                    {card.aiReview.pricingVariances.map((pv: any, i: number) => (
                      <div key={i} className="text-xs text-purple-800 bg-white p-2.5 rounded border border-purple-200 mb-1.5">
                        {pv.message}
                      </div>
                    ))}
                  </div>
                )}

                {card.aiReview.inconsistencies?.length > 0 ? (
                  <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-100">
                    <div className="text-xs font-bold text-amber-900 mb-2">
                      Potential Diagnostic Inconsistencies
                    </div>
                    {card.aiReview.inconsistencies.map((inc: any, i: number) => (
                      <div key={i} className="text-xs text-amber-800 bg-white p-2.5 rounded border border-amber-200 mb-1.5">
                        <strong>Notice: </strong> {inc.recommendation}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>No diagnostic discrepancies found between reported problem and work narrative.</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                AI evaluation will run on submission or can be triggered inside the editor.
              </p>
            )}
          </div>
        )}

        {/* AUDIT TRAIL TAB */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Immutable Service Audit History
            </h3>

            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {card.auditTrail.map((ev) => (
                <div key={ev.id} className="relative text-xs">
                  <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center absolute -left-6 top-0 ring-4 ring-white">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{ev.action}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{ev.timestamp}</span>
                  </div>
                  <div className="text-slate-600 mt-0.5">{ev.details}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    User: {ev.userName} ({ev.userRole})
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* APPROVE MODAL */}
      {approveModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Approve Job Card</h3>
              <p className="text-xs text-slate-600 mt-1">
                Provide supervisory sign-off for <strong>{card.id}</strong> ({card.customerName}).
              </p>
            </div>

            {card.customerSignOff?.isConfirmed ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Customer sign-off confirmed by <strong>{card.customerSignOff.signedByName}</strong>.</span>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Customer sign-off not recorded. Manager approval will override customer sign-off.</span>
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700">Manager Sign-Off Remarks</label>
              <textarea
                rows={3}
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                placeholder="e.g. All replacement components, checklist logs and load parameters verified. Approved for billing..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setApproveModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveConfirm}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST CHANGES MODAL */}
      {changesModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Request Changes from Engineer</h3>
              <p className="text-xs text-slate-600 mt-1">
                Return <strong>{card.id}</strong> to <strong>{card.assignedEngineerName}</strong> with specific feedback.
              </p>
            </div>

            {/* Checkbox multi-select for sections */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700">Affected Section(s) *</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['Service Details', 'Inspection', 'Parts & Materials', 'Work Performed', 'Attachments', 'Pricing'].map(
                  (sec) => (
                    <label
                      key={sec}
                      className="flex items-center gap-2 p-2 bg-slate-50 border rounded hover:bg-slate-100 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={changesSections.includes(sec)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setChangesSections([...changesSections, sec]);
                          } else {
                            setChangesSections(changesSections.filter((s) => s !== sec));
                          }
                        }}
                      />
                      <span>{sec}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700">Specific Feedback & Instructions *</label>
              <textarea
                rows={3}
                value={changesComments}
                onChange={(e) => setChangesComments(e.target.value)}
                placeholder="Specify what requires correction (e.g. upload after-service photo showing new gasket, record pressure log)..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setChangesModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleChangesConfirm}
                disabled={!changesComments.trim()}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs"
              >
                Send Revision Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Reject Job Card</h3>
              <p className="text-xs text-slate-600 mt-1">
                Permanently reject Job Card <strong>{card.id}</strong>.
              </p>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700">Rejection Reason *</label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
              >
                <option value="Incorrect Diagnostic Data">Incorrect Diagnostic Data</option>
                <option value="Duplicate Job Card">Duplicate Job Card</option>
                <option value="Invalid Service Record">Invalid Service Record</option>
                <option value="Commercial Contract Issue">Commercial Contract Issue</option>
                <option value="Customer Dispute">Customer Dispute</option>
              </select>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700">Manager Justification *</label>
              <textarea
                rows={3}
                value={rejectComments}
                onChange={(e) => setRejectComments(e.target.value)}
                placeholder="Explain why this job card is being cancelled/rejected..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-rose-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectComments.trim()}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs"
              >
                Reject Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
