import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { Incident, AnalyticsOverview, DisasterType, SeverityLevel, IncidentStatus } from '../types/index.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { SeverityBadge } from '../components/common/SeverityBadge.js';
import { DisasterIcon } from '../components/common/DisasterIcon.js';
import { IncidentDetailModal } from '../components/rescue/IncidentDetailModal.js';
import {
  ShieldAlert,
  Flame,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Radio,
  Search,
  Filter,
  RefreshCw,
  Eye,
  MapPin,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';

export const RescueDashboard: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterRegion, setFilterRegion] = useState('ALL');

  // Socket connection status
  const [socketConnected, setSocketConnected] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [overviewRes, incidentsRes] = await Promise.all([
        apiFetch<{ data: AnalyticsOverview }>('/analytics/overview'),
        apiFetch<{ incidents: Incident[] }>('/incidents?limit=25'),
      ]);

      if (overviewRes.data) {
        setOverview(overviewRes.data);
      }
      if (incidentsRes.incidents) {
        setIncidents(incidentsRes.incidents);
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const socket = getSocket();
    if (socket) {
      setSocketConnected(socket.connected);

      socket.on('connect', () => setSocketConnected(true));
      socket.on('disconnect', () => setSocketConnected(false));

      socket.on('incident:new', (newIncident: Incident) => {
        console.log('[Live] New incident received via Socket.IO:', newIncident.id);
        setIncidents((prev) => [newIncident, ...prev.filter((i) => i.id !== newIncident.id)]);
        fetchDashboardData(); // Refresh overview counts
      });

      socket.on('incident:status_changed', ({ updatedIncident }: any) => {
        if (updatedIncident) {
          setIncidents((prev) =>
            prev.map((i) => (i.id === updatedIncident.id ? updatedIncident : i))
          );
          fetchDashboardData();
        }
      });

      socket.on('incident:priority_changed', ({ updatedIncident }: any) => {
        if (updatedIncident) {
          setIncidents((prev) =>
            prev.map((i) => (i.id === updatedIncident.id ? updatedIncident : i))
          );
        }
      });
    }

    // Polling fallback every 15s in case WebSockets are interrupted
    const pollInterval = setInterval(() => {
      fetchDashboardData();
    }, 15000);

    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  const filteredIncidents = incidents.filter((inc) => {
    if (filterType !== 'ALL' && inc.disasterType !== filterType) return false;
    if (filterSeverity !== 'ALL' && inc.severity !== filterSeverity) return false;
    if (filterStatus !== 'ALL' && inc.status !== filterStatus) return false;
    if (filterRegion !== 'ALL' && inc.region !== filterRegion) return false;
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      return (
        inc.title.toLowerCase().includes(q) ||
        inc.description.toLowerCase().includes(q) ||
        inc.locationDescription.toLowerCase().includes(q) ||
        inc.clientIncidentId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Tactical Incident Command Overview
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-800 border border-amber-500/30">
              DEMO DATA: PUNE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time emergency telemetry, status distribution, and rapid dispatch queue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Dispatch stream status badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              socketConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'
              }`}
            />
            <span>{socketConnected ? 'Socket.IO Stream Active' : 'REST Polling Fallback'}</span>
          </div>

          <button
            onClick={fetchDashboardData}
            title="Refresh database records"
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 5 Core KPI Metric Cards from Backend Database */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Incidents */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Total Reported</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {overview ? overview.totalIncidents : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Database tickets logged</div>
        </div>

        {/* Active Incidents */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Active Incidents</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600 mt-2">
            {overview ? overview.activeIncidents : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Under rescue response</div>
        </div>

        {/* Critical Incidents */}
        <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-red-900">
            <span>Critical Incidents</span>
            <Flame className="w-4 h-4 text-red-600 animate-pulse" />
          </div>
          <div className="text-2xl font-extrabold text-red-600 mt-2">
            {overview ? overview.criticalIncidents : '—'}
          </div>
          <div className="text-[11px] text-red-700 font-medium mt-1">Immediate life threat</div>
        </div>

        {/* Pending Review */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-amber-900">
            <span>Awaiting Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700 mt-2">
            {overview ? overview.pendingReviewIncidents : '—'}
          </div>
          <div className="text-[11px] text-amber-800 font-medium mt-1">New citizen submissions</div>
        </div>

        {/* Resolved Incidents */}
        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
            <span>Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2">
            {overview ? overview.resolvedIncidents : '—'}
          </div>
          <div className="text-[11px] text-emerald-800 font-medium mt-1">Rescue completed</div>
        </div>
      </div>

      {/* Operational Latency & People Affected Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Citizens Affected</div>
            <div className="text-xl font-bold text-slate-900">
              {overview ? overview.totalPeopleAffected : 0} Individuals
            </div>
            <div className="text-[11px] text-slate-400">Summed from reported emergency reports</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Avg Report-to-Server Sync Latency</div>
            <div className="text-xl font-bold text-slate-900">
              {overview?.avgSyncLatencySec !== null ? `${overview?.avgSyncLatencySec}s` : 'Insufficient Data'}
            </div>
            <div className="text-[11px] text-slate-400">Time between device capture and server receipt</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Avg Triage-to-Resolution Time</div>
            <div className="text-xl font-bold text-slate-900">
              {overview?.avgResolutionHours !== null ? `${overview?.avgResolutionHours} hrs` : 'Insufficient Data'}
            </div>
            <div className="text-[11px] text-slate-400">From acknowledgment to incident close</div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search query */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, description, location, or incident ID..."
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-900"
            />
          </div>

          {/* Quick Filter Selects */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
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
              onChange={(e) => setFilterSeverity(e.target.value)}
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
              onChange={(e) => setFilterStatus(e.target.value)}
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
              onChange={(e) => setFilterRegion(e.target.value)}
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
          </div>
        </div>
      </div>

      {/* Live Incidents Dispatch Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent Emergency Incidents Queue ({filteredIncidents.length})
            </h2>
          </div>
          <Link
            to="/rescue/incidents"
            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <span>View Full Live Table</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Incident ID</th>
                <th className="py-3 px-4">Disaster</th>
                <th className="py-3 px-4">Title & Location</th>
                <th className="py-3 px-4 text-center">Affected</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Reported</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No emergency incidents match current query or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredIncidents.slice(0, 15).map((inc) => (
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
                      <div className="font-bold text-slate-900 truncate">{inc.title}</div>
                      <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{inc.locationDescription} ({inc.region})</span>
                      </div>
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
                      {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedIncident(inc)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] transition shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onIncidentUpdated={(updated) => {
            setSelectedIncident(updated);
            setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
};
