import React from 'react';
import { useApp } from '../../context/AppContext';
import { JobCard } from '../../types';
import {
  Printer,
  X,
  CheckSquare,
  Wrench,
  ShieldCheck,
  Building2,
  Cpu,
  Calendar,
  DollarSign,
  Download,
} from 'lucide-react';

export const JobCardDocumentModal: React.FC = () => {
  const { documentJobCard, setDocumentJobCard } = useApp();

  if (!documentJobCard) return null;

  const jc = documentJobCard;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-8 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Controls Bar (hidden during print) */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Wrench className="w-4 h-4 text-blue-400" />
            <span>Digital Job Card Document Preview — {jc.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={() => setDocumentJobCard(null)}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div id="printable-jobcard-document" className="p-8 overflow-y-auto space-y-6 text-slate-900 bg-white">
          {/* Header Block */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl">
                OPS
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">
                  OPSFLOW SERVICE OPERATIONS
                </h1>
                <p className="text-xs text-slate-500">
                  Industrial Machinery Field Service & Compliance Record
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Official Job Card
              </div>
              <div className="font-mono text-xl font-black text-blue-800">{jc.id}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Date: {jc.serviceDate}</div>
            </div>
          </div>

          {/* Customer & Asset Summary Grid */}
          <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Customer & Facility
              </div>
              <div className="font-bold text-sm text-slate-900">{jc.customerName}</div>
              <div className="text-slate-600 mt-0.5">{jc.siteLocation}</div>
              <div className="text-slate-600 mt-1">
                <strong>Contact:</strong> {jc.contactPerson} ({jc.contactPhone})
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Equipment Specification
              </div>
              <div className="font-bold text-sm text-slate-900">{jc.equipmentName}</div>
              <div className="text-slate-600 mt-0.5">
                Model: <strong>{jc.model}</strong> | Type: {jc.equipmentType}
              </div>
              <div className="text-slate-600 font-mono mt-1">
                Serial No: <strong>{jc.serialNumber}</strong> | Hours: {jc.operatingHours} hrs
              </div>
            </div>
          </div>

          {/* Scope & Service Details */}
          <div className="grid grid-cols-3 gap-4 text-xs border border-slate-200 rounded-lg p-3">
            <div>
              <span className="text-slate-500">Service Category:</span>
              <div className="font-bold text-slate-900">{jc.serviceType}</div>
            </div>
            <div>
              <span className="text-slate-500">Priority Level:</span>
              <div className="font-bold text-slate-900">{jc.priority}</div>
            </div>
            <div>
              <span className="text-slate-500">Assigned Field Engineer:</span>
              <div className="font-bold text-slate-900">{jc.assignedEngineerName}</div>
            </div>
          </div>

          {/* Problem & Narrative */}
          <div className="space-y-3 text-xs">
            <div>
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Reported Symptom / Scope of Work:
              </span>
              <div className="mt-1 p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-800">
                {jc.problemReported || 'Standard routine service'}
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Technical Work Performed:
              </span>
              <div className="mt-1 p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-800 leading-relaxed">
                {jc.workPerformed || 'Service completed.'}
              </div>
            </div>

            {jc.recommendations && (
              <div>
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Technical Recommendations:
                </span>
                <div className="mt-1 p-2.5 bg-amber-50/60 rounded border border-amber-200 text-amber-900">
                  {jc.recommendations}
                </div>
              </div>
            )}
          </div>

          {/* Checklist Audit Matrix */}
          <div className="space-y-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Inspection Checklist Audit Matrix:
            </span>
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold text-[11px]">
                  <tr>
                    <th className="p-2">Code</th>
                    <th className="p-2">Checkpoint</th>
                    <th className="p-2">Category</th>
                    <th className="p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jc.checklist.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2 font-mono font-bold">{item.code}</td>
                      <td className="p-2">{item.label}</td>
                      <td className="p-2 text-slate-500">{item.category}</td>
                      <td className="p-2 text-center font-bold">
                        {item.status === 'Completed' && <span className="text-emerald-700">✓ PASSED</span>}
                        {item.status === 'Issue Found' && <span className="text-red-700">⚠ ISSUE FLAGGED</span>}
                        {item.status === 'Not Applicable' && <span className="text-slate-400">N/A</span>}
                        {item.status === 'Pending' && <span className="text-slate-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Parts & Materials Consumed */}
          <div className="space-y-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Bill of Materials & Replacement Parts:
            </span>
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold text-[11px]">
                  <tr>
                    <th className="p-2">Part Number</th>
                    <th className="p-2">Description</th>
                    <th className="p-2 text-center">Quantity</th>
                    <th className="p-2 text-right">Unit Price</th>
                    <th className="p-2 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jc.parts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-3 text-center text-slate-400">
                        No replacement parts billed.
                      </td>
                    </tr>
                  ) : (
                    jc.parts.map((p) => (
                      <tr key={p.id}>
                        <td className="p-2 font-mono font-bold text-slate-900">{p.partNumber}</td>
                        <td className="p-2">{p.description}</td>
                        <td className="p-2 text-center font-bold">{p.quantity}</td>
                        <td className="p-2 text-right font-mono">₹{p.unitPrice}</td>
                        <td className="p-2 text-right font-mono font-bold">₹{p.total.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1 text-xs border-t border-slate-200 pt-2">
              <div className="flex justify-between text-slate-600">
                <span>Parts Total:</span>
                <span className="font-mono">₹{jc.pricing.parts.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Labour Charges ({jc.pricing.labourHours} hrs):</span>
                <span className="font-mono">₹{jc.pricing.labour.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax GST (18%):</span>
                <span className="font-mono">₹{jc.pricing.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-blue-950 pt-2 border-t border-slate-300">
                <span>Total Amount:</span>
                <span className="font-mono">₹{jc.pricing.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Sign-off Boxes */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-slate-900 text-xs">
            <div className="border border-slate-300 rounded-lg p-4 space-y-4">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Field Engineer Sign-Off
              </div>
              <div className="h-12 border-b border-dashed border-slate-300 flex items-end">
                <span className="font-serif italic text-sm text-slate-700">{jc.assignedEngineerName}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Certified Engineer</span>
                <span>Date: {jc.serviceDate}</span>
              </div>
            </div>

            <div className="border border-slate-300 rounded-lg p-4 space-y-4">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Authorizing Operations Manager
              </div>
              <div className="h-12 border-b border-dashed border-slate-300 flex items-end">
                <span className="font-serif italic text-sm text-slate-700">
                  {jc.approvedBy || 'Manager 1 (Operations)'}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Status: {jc.status}</span>
                <span>Date: {jc.approvedAt || jc.serviceDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
