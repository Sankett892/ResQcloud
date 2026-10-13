import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api.js';
import { Incident } from '../types/index.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { SeverityBadge } from '../components/common/SeverityBadge.js';
import { DisasterIcon } from '../components/common/DisasterIcon.js';
import { IncidentDetailModal } from '../components/rescue/IncidentDetailModal.js';
import {
  History,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
} from 'lucide-react';

export const IncidentHistoryPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RESOLVED' | 'CANCELLED'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ incidents: Incident[] }>('/incidents?limit=50');
      if (res.incidents) {
        setIncidents(res.incidents);
      }
    } catch (err) {
      console.warn('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filtered = incidents.filter((i) => {
    if (statusFilter === 'RESOLVED' && i.status !== 'RESOLVED') return false;
    if (statusFilter === 'CANCELLED' && i.status !== 'CANCELLED') return false;
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      return (
        i.title.toLowerCase().includes(q) ||
        i.clientIncidentId.toLowerCase().includes(q) ||
        i.locationDescription.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-700" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Operational Incident History & Audit
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Archival record of closed, resolved, and historical emergency triage operations.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh History</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search incident history by title, ID, or location..."
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-2 rounded-lg font-bold transition ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Historical
          </button>
          <button
            onClick={() => setStatusFilter('RESOLVED')}
            className={`px-3 py-2 rounded-lg font-bold transition ${
              statusFilter === 'RESOLVED'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Resolved Only
          </button>
          <button
            onClick={() => setStatusFilter('CANCELLED')}
            className={`px-3 py-2 rounded-lg font-bold transition ${
              statusFilter === 'CANCELLED'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cancelled Only
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            No historical records found matching filter.
          </div>
        ) : (
          filtered.map((inc) => (
            <div
              key={inc.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 shrink-0">
                  <DisasterIcon type={inc.disasterType} className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-slate-500">
                      {inc.clientIncidentId}
                    </span>
                    <SeverityBadge severity={inc.severity} size="sm" />
                    <StatusBadge status={inc.status} size="sm" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mt-1">{inc.title}</h3>
                  <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {inc.locationDescription} &bull; {inc.region}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1">
                    Created: {new Date(inc.createdAt).toLocaleString()} | Server Receipt:{' '}
                    {new Date(inc.serverReceivedAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => setSelectedIncident(inc)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Audit Log</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onIncidentUpdated={(updated) => {
            setSelectedIncident(updated);
            fetchHistory();
          }}
        />
      )}
    </div>
  );
};
