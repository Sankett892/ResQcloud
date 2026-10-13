import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api.js';
import { useOffline } from '../context/OfflineContext.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Settings,
  Server,
  Database,
  Wifi,
  RefreshCw,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Radio,
  Shield,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { isOnline, pendingCount, syncNow, offlineReports, refreshOfflineData } = useOffline();

  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const checkApiHealth = async () => {
    setCheckingHealth(true);
    try {
      const res = await apiFetch('/health');
      setHealthStatus(res);
    } catch (err: any) {
      setHealthStatus({ status: 'DOWN', error: err.message });
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkApiHealth();
  }, []);

  const handleManualSync = async () => {
    setSyncStatusMsg('Running batch synchronization...');
    try {
      await syncNow();
      setSyncStatusMsg('Synchronization complete!');
      setTimeout(() => setSyncStatusMsg(null), 4000);
    } catch (e: any) {
      setSyncStatusMsg(`Sync error: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-700" />
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            System Diagnostics & Node Settings
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Inspect backend database connectivity, IndexedDB offline buffers, and runtime configuration.
        </p>
      </div>

      {/* Backend Health Diagnostics */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Centralized Dispatch Server Health
            </h2>
          </div>
          <button
            onClick={checkApiHealth}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingHealth ? 'animate-spin' : ''}`} />
            <span>Re-Probe API</span>
          </button>
        </div>

        {healthStatus && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-400 font-sans">API STATUS</div>
              <div className={`font-bold mt-1 ${healthStatus.status === 'UP' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {healthStatus.status}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-400 font-sans">DATABASE</div>
              <div className="font-bold text-emerald-600 mt-1">
                {healthStatus.database || 'CONNECTED'}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-400 font-sans">SERVER UPTIME</div>
              <div className="font-bold text-slate-800 mt-1">
                {healthStatus.uptimeSeconds ? `${healthStatus.uptimeSeconds}s` : 'Active'}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-400 font-sans">ENVIRONMENT</div>
              <div className="font-bold text-purple-600 mt-1">
                {healthStatus.environment || 'development'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* IndexedDB Offline Storage Inspector */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Browser IndexedDB Offline Queue
            </h2>
          </div>
          <button
            onClick={handleManualSync}
            disabled={!isOnline || pendingCount === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Force Sync ({pendingCount})</span>
          </button>
        </div>

        {syncStatusMsg && (
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-900 text-xs border border-blue-200">
            {syncStatusMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-slate-500">Total IndexedDB Reports:</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{offlineReports.length}</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-slate-500">Unsynchronized Pending:</div>
            <div className="text-xl font-bold text-amber-600 mt-1">{pendingCount}</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-slate-500">Local Browser Connectivity:</div>
            <div className={`text-xl font-bold mt-1 ${isOnline ? 'text-emerald-600' : 'text-amber-600'}`}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>
          </div>
        </div>
      </div>

      {/* Active User Session Details */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-slate-700" />
          Active Session Identity
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-slate-500">Authenticated Name</div>
            <div className="font-bold text-slate-900 mt-1">{user?.name || 'Guest'}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-slate-500">Email Address</div>
            <div className="font-mono text-slate-900 mt-1">{user?.email || 'N/A'}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-slate-500">Assigned Role</div>
            <div className="font-bold text-purple-700 mt-1">{user?.role || 'ANONYMOUS'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
