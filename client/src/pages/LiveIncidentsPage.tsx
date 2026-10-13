import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { Incident } from '../types/index.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { SeverityBadge } from '../components/common/SeverityBadge.js';
import { DisasterIcon } from '../components/common/DisasterIcon.js';
import { IncidentDetailModal } from '../components/rescue/IncidentDetailModal.js';
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

export const LiveIncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterRegion, setFilterRegion] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        disasterType: filterType,
        severity: filterSeverity,
        status: filterStatus,
        region: filterRegion,
        search,
      });

      const res = await apiFetch<{
        incidents: Incident[];
        pagination: { total: number; totalPages: number };
      }>(`/incidents?${params.toString()}`);

      if (res.incidents) {
        setIncidents(res.incidents);
        setTotalPages(res.pagination.totalPages || 1);
        setTotalCount(res.pagination.total || 0);
      }
    } catch (err) {
      console.warn('Failed to fetch incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [page, filterType, filterSeverity, filterStatus, filterRegion]);

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.on('incident:new', () => {
        fetchIncidents();
      });
      socket.on('incident:status_changed', () => {
        fetchIncidents();
      });
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchIncidents();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Live Incident Management Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprehensive triage, assignment, priority escalation, and audit logging.
          </p>
        </div>

        <button
          onClick={fetchIncidents}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue ({totalCount})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, location, description, or ticket ID..."
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-900"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              className="px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700"
            >
              <option value="ALL">All Categories</option>
              <option value="FLOOD">Flood</option>
              <option value="EARTHQUAKE">Earthquake</option>
              <option value="FIRE">Fire</option>
              <option value="LANDSLIDE">Landslide</option>
              <option value="MEDICAL_EMERGENCY">Medical</option>
              <option value="BUILDING_COLLAPSE">Collapse</option>
              <option value="SEVERE_WEATHER">Weather</option>
              <option value="OTHER">Other</option>
            </select>

            <select
              value={filterSeverity}
              onChange={(e) => { setFilterSeverity(e.target.value); setPage(1); }}
              className="px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={filterRegion}
              onChange={(e) => { setFilterRegion(e.target.value); setPage(1); }}
              className="px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700"
            >
              <option value="ALL">All Regions</option>
              <option value="Pune City">Pune City</option>
              <option value="Hadapsar">Hadapsar</option>
              <option value="Kharadi">Kharadi</option>
              <option value="Pimpri-Chinchwad">Pimpri-Chinchwad</option>
              <option value="Hinjawadi">Hinjawadi</option>
              <option value="Sinhagad Road">Sinhagad Road</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </form>

      {/* Incidents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Incident ID</th>
                <th className="py-3 px-4">Disaster</th>
                <th className="py-3 px-4">Title & Details</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-center">Affected</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Reported Time</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    No emergency incidents match current filter criteria.
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {inc.clientIncidentId}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <DisasterIcon type={inc.disasterType} className="w-4 h-4" />
                        <span>{inc.disasterType}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 line-clamp-1">{inc.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{inc.description}</div>
                    </td>
                    <td className="py-3 px-4 max-w-[180px]">
                      <div className="truncate text-slate-700 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                        <span>{inc.locationDescription}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{inc.region}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      <div className="inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>{inc.affectedPeople}</span>
                      </div>
                      {inc.peopleTrapped && (
                        <span className="block text-[10px] text-red-600 font-extrabold">Trapped</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <SeverityBadge severity={inc.severity} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={inc.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] font-mono whitespace-nowrap">
                      {new Date(inc.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedIncident(inc)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing Page <span className="font-bold">{page}</span> of{' '}
            <span className="font-bold">{totalPages}</span> ({totalCount} total tickets)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onIncidentUpdated={(updated) => {
            setSelectedIncident(updated);
            fetchIncidents();
          }}
        />
      )}
    </div>
  );
};
