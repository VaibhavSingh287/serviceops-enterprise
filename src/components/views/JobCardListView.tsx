import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import {
  Search,
  PlusCircle,
  FileText,
  Printer,
  ChevronRight,
} from 'lucide-react';

interface JobCardListViewProps {
  approvalsOnly?: boolean;
  initialStatus?: string;
  title?: string;
  description?: string;
}

export const JobCardListView: React.FC<JobCardListViewProps> = ({
  approvalsOnly = false,
  initialStatus,
  title,
  description,
}) => {
  const {
    jobCards,
    openJobCard,
    createNewJobCard,
    currentUser,
    setDocumentJobCard,
    customers,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(
    initialStatus || (approvalsOnly ? 'Pending Review' : 'ALL')
  );
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [customerFilter, setCustomerFilter] = useState<string>('ALL');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('ALL');

  const filteredCards = jobCards.filter((jc) => {
    if (approvalsOnly) {
      if (jc.status !== 'Pending Review' && jc.status !== 'Submitted') return false;
    } else if (statusFilter !== 'ALL' && jc.status !== statusFilter) {
      return false;
    }

    if (priorityFilter !== 'ALL' && jc.priority !== priorityFilter) return false;
    if (customerFilter !== 'ALL' && jc.customerId !== customerFilter) return false;
    if (serviceTypeFilter !== 'ALL' && jc.serviceType !== serviceTypeFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matches =
        jc.id.toLowerCase().includes(q) ||
        jc.customerName.toLowerCase().includes(q) ||
        jc.equipmentName.toLowerCase().includes(q) ||
        jc.assignedEngineerName.toLowerCase().includes(q) ||
        jc.problemReported.toLowerCase().includes(q);
      if (!matches) return false;
    }

    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {title || (approvalsOnly ? 'Pending Manager Approvals' : 'Job Cards Register')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {description || (approvalsOnly
              ? 'Review pending field engineer submissions and provide managerial authorization.'
              : 'Complete operational registry of all digital service records across plants.')}
          </p>
        </div>

        {(currentUser.role === 'FIELD_ENGINEER' || currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN') && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => createNewJobCard()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Job Card</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Job ID, customer, equipment, or engineer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-slate-800"
            />
          </div>

          {/* Quick Selects */}
          <div className="flex items-center gap-2 flex-wrap">
            {!approvalsOnly && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs p-1.5 bg-white border border-slate-200 rounded-md font-medium text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Changes Requested">Changes Requested</option>
                <option value="Approved">Approved</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
              </select>
            )}

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs p-1.5 bg-white border border-slate-200 rounded-md font-medium text-slate-700"
            >
              <option value="ALL">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="text-xs p-1.5 bg-white border border-slate-200 rounded-md font-medium text-slate-700"
            >
              <option value="ALL">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={serviceTypeFilter}
              onChange={(e) => setServiceTypeFilter(e.target.value)}
              className="text-xs p-1.5 bg-white border border-slate-200 rounded-md font-medium text-slate-700"
            >
              <option value="ALL">All Service Types</option>
              <option value="Breakdown Repair">Breakdown Repair</option>
              <option value="Preventive Maintenance">Preventive Maintenance</option>
              <option value="Emergency Service">Emergency Service</option>
              <option value="Calibration & Testing">Calibration & Testing</option>
              <option value="Inspection & Audit">Inspection & Audit</option>
            </select>
          </div>
        </div>

        {/* Count Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Showing {filteredCards.length} of {jobCards.length} Job Cards</span>
          {(search || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || customerFilter !== 'ALL' || serviceTypeFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
                setPriorityFilter('ALL');
                setCustomerFilter('ALL');
                setServiceTypeFilter('ALL');
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {filteredCards.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">No Job Cards Found</h4>
            <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search query or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-4">Job ID</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Equipment</th>
                  <th className="py-2.5 px-4">Engineer</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4 text-center">Priority</th>
                  <th className="py-2.5 px-4 text-right">Total (₹)</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCards.map((jc) => (
                  <tr
                    key={jc.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => openJobCard(jc.id)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      {jc.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{jc.customerName}</div>
                      <div className="text-[11px] text-slate-400">{jc.siteLocation}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{jc.equipmentName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{jc.model}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {jc.assignedEngineerName}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                      {jc.serviceDate}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <PriorityBadge priority={jc.priority} />
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      ₹{jc.pricing.total.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={jc.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDocumentJobCard(jc)}
                          title="Print Document"
                          className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openJobCard(jc.id)}
                          className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-blue-700 rounded text-xs font-medium cursor-pointer transition-colors"
                        >
                          {jc.status === 'Approved' ? 'View' : 'Open'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
