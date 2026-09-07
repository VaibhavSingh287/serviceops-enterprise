import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  Search,
  Filter,
  Shield,
  FileText,
  Package,
  DollarSign,
  UserCheck,
  RefreshCw,
} from 'lucide-react';

interface AuditActivityViewProps {
  title?: string;
  description?: string;
}

export const AuditActivityView: React.FC<AuditActivityViewProps> = ({
  title,
  description,
}) => {
  const { auditLogs, currentUser, refreshAuditLogs } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const defaultTitle =
    currentUser?.role === 'FIELD_ENGINEER'
      ? 'My Operational Activity Log'
      : currentUser?.role === 'MANAGER'
      ? 'Team Audit & Activity Trail'
      : currentUser?.role === 'OPERATIONS'
      ? 'Commercial & Inventory Audit Trail'
      : 'Enterprise System Audit Logs';

  const defaultDescription =
    currentUser?.role === 'FIELD_ENGINEER'
      ? 'Immutable record of your submitted, drafted, and updated Job Cards.'
      : currentUser?.role === 'MANAGER'
      ? 'Supervisory activity trail across all managed engineers and approved Job Cards.'
      : currentUser?.role === 'OPERATIONS'
      ? 'Audit log of stock movements, parts creation, and commercial pricing updates.'
      : 'Complete enterprise immutable audit trail across all system entities.';

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAuditLogs();
    setIsRefreshing(false);
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (filterType !== 'ALL') {
      if (filterType === 'JOBCARD' && !log.eventType.toLowerCase().includes('job card')) return false;
      if (filterType === 'STOCK' && !log.eventType.toLowerCase().includes('stock') && !log.eventType.toLowerCase().includes('inventory')) return false;
      if (filterType === 'PRICING' && !log.eventType.toLowerCase().includes('pricing')) return false;
      if (filterType === 'USER' && !log.eventType.toLowerCase().includes('user') && !log.eventType.toLowerCase().includes('password') && !log.eventType.toLowerCase().includes('team')) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const matches =
        log.eventType.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        (log.targetId && log.targetId.toLowerCase().includes(q));
      if (!matches) return false;
    }

    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {title || defaultTitle}
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              {filteredLogs.length} events
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {description || defaultDescription}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search events, user, details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <span className="text-slate-400 text-xs font-semibold mr-1 shrink-0">Filter:</span>
          {(['ALL', 'JOBCARD', 'STOCK', 'PRICING', 'USER'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                filterType === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t === 'ALL' ? 'All Events' : t === 'JOBCARD' ? 'Job Cards' : t === 'STOCK' ? 'Inventory / Stock' : t === 'PRICING' ? 'Commercial' : 'Users & Teams'}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Shield className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-600">No activity events found</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Events will be logged automatically as actions are taken in your operational scope.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3 w-44">Timestamp</th>
                  <th className="p-3 w-36">Initiator</th>
                  <th className="p-3 w-40">Event Type</th>
                  <th className="p-3 w-32">Target</th>
                  <th className="p-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const dateStr = new Date(log.timestamp).toLocaleString([], {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{log.userName}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {log.userRole}
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
                          {log.eventType}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {log.targetId ? (
                          <span className="font-mono text-slate-700 font-bold text-[11px]">
                            {log.targetId}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-700 leading-relaxed">
                        {log.details}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
