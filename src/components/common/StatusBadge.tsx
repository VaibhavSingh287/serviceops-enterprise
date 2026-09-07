import React from 'react';
import { JobCardStatus, PriorityLevel } from '../../types';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileEdit,
  RotateCcw,
  DollarSign,
  CheckCheck,
} from 'lucide-react';

interface StatusBadgeProps {
  status: JobCardStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  switch (status) {
    case 'Draft':
      return (
        <span
          id={`status-badge-${status.toLowerCase()}`}
          className={`inline-flex items-center gap-1.5 rounded-md bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses[size]}`}
        >
          <FileEdit className="w-3.5 h-3.5 text-slate-500" />
          Draft
        </span>
      );
    case 'In Progress':
      return (
        <span
          id={`status-badge-in-progress`}
          className={`inline-flex items-center gap-1.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses[size]}`}
        >
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          In Progress
        </span>
      );
    case 'Submitted':
    case 'Pending Review':
      return (
        <span
          id={`status-badge-pending-review`}
          className={`inline-flex items-center gap-1.5 rounded-md bg-amber-50 text-amber-800 border border-amber-300 ${sizeClasses[size]}`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Pending Review
        </span>
      );
    case 'Changes Requested':
      return (
        <span
          id={`status-badge-changes-requested`}
          className={`inline-flex items-center gap-1.5 rounded-md bg-orange-50 text-orange-800 border border-orange-300 ${sizeClasses[size]}`}
        >
          <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
          Changes Requested
        </span>
      );
    case 'Pricing Review':
      return (
        <span
          id={`status-badge-pricing-review`}
          className={`inline-flex items-center gap-1.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses[size]}`}
        >
          <DollarSign className="w-3.5 h-3.5 text-purple-600" />
          Pricing Review
        </span>
      );
    case 'Approved':
      return (
        <span
          id={`status-badge-approved`}
          className={`inline-flex items-center gap-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-300 ${sizeClasses[size]}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Approved
        </span>
      );
    case 'Completed':
      return (
        <span
          id={`status-badge-completed`}
          className={`inline-flex items-center gap-1.5 rounded-md bg-teal-50 text-teal-800 border border-teal-300 ${sizeClasses[size]}`}
        >
          <CheckCheck className="w-3.5 h-3.5 text-teal-600" />
          Completed
        </span>
      );
    case 'Rejected':
      return (
        <span
          id={`status-badge-rejected`}
          className={`inline-flex items-center gap-1.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses[size]}`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Rejected
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-gray-100 text-gray-700 ${sizeClasses[size]}`}>
          {status}
        </span>
      );
  }
};

export const PriorityBadge: React.FC<{ priority: PriorityLevel }> = ({ priority }) => {
  switch (priority) {
    case 'Critical':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
          Critical
        </span>
      );
    case 'High':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          High
        </span>
      );
    case 'Medium':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Medium
        </span>
      );
    case 'Low':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Low
        </span>
      );
    default:
      return <span>{priority}</span>;
  }
};
