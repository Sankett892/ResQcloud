import React from 'react';
import { useOffline } from '../../context/OfflineContext.js';
import { WifiOff, Wifi, RefreshCw, AlertTriangle } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const { isOnline, isSyncing, pendingCount, syncNow } = useOffline();

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div
      className={`border-b transition-colors px-4 py-2.5 text-sm ${
        !isOnline
          ? 'bg-amber-500 text-slate-950 border-amber-600'
          : 'bg-blue-600 text-white border-blue-700'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {!isOnline ? (
            <span className="p-1 rounded bg-amber-600/30">
              <WifiOff className="w-5 h-5 text-slate-950 animate-pulse" />
            </span>
          ) : (
            <span className="p-1 rounded bg-blue-700">
              <Wifi className="w-5 h-5 text-white" />
            </span>
          )}

          <div>
            <span className="font-bold">
              {!isOnline ? 'OFFLINE MODE ACTIVE:' : 'REPORTS AWAITING SYNCHRONIZATION:'}
            </span>{' '}
            {!isOnline
              ? 'Network disconnected. Emergency reports are being queued in local IndexedDB.'
              : `${pendingCount} emergency report(s) queued locally in your browser.`}
            <span className="hidden md:inline ml-1 text-xs opacity-90">
              (Locally stored reports do NOT reach rescue teams until synchronized).
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-white/20">
              {pendingCount} Pending
            </span>
          )}
          {isOnline && (
            <button
              onClick={() => syncNow()}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded bg-white text-blue-900 hover:bg-blue-50 active:scale-95 transition shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Synchronizing...' : 'Sync Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
