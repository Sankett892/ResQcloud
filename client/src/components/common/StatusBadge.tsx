import React from 'react';
import { IncidentStatus, LocalSyncStatus } from '../../types/index.js';
import { Clock, CheckCircle2, AlertCircle, RefreshCw, XCircle, ArrowUpRight } from 'lucide-react';

interface StatusBadgeProps {
  status: IncidentStatus | LocalSyncStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const isSm = size === 'sm';
  const padding = isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  switch (status) {
    case 'PENDING_REVIEW':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${padding}`}>
          <Clock className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Pending Review
        </span>
      );
    case 'ACKNOWLEDGED':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${padding}`}>
          <CheckCircle2 className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Acknowledged
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200 ${padding}`}>
          <RefreshCw className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} animate-spin`} style={{ animationDuration: '4s' }} />
          In Progress
        </span>
      );
    case 'RESOLVED':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${padding}`}>
          <CheckCircle2 className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Resolved
        </span>
      );
    case 'CANCELLED':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-300 ${padding}`}>
          <XCircle className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Cancelled
        </span>
      );
    case 'LOCAL_PENDING':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-300 ${padding}`}>
          <Clock className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Stored Locally (Pending Sync)
        </span>
      );
    case 'SYNC_IN_PROGRESS':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 ${padding}`}>
          <RefreshCw className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} animate-spin`} />
          Syncing to Server
        </span>
      );
    case 'SERVER_RECEIVED':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${padding}`}>
          <ArrowUpRight className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Received by Server
        </span>
      );
    case 'SYNC_FAILED':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${padding}`}>
          <AlertCircle className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Sync Failed (Will Retry)
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-600 ${padding}`}>
          {status}
        </span>
      );
  }
};
