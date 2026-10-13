import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api.js';
import { AnalyticsOverview } from '../types/index.js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  RefreshCw,
  Users,
  Clock,
  Info,
  ShieldAlert,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [byType, setByType] = useState<{ type: string; count: number; affectedPeople: number }[]>([]);
  const [bySeverity, setBySeverity] = useState<{ severity: string; count: number }[]>([]);
  const [byRegion, setByRegion] = useState<{ region: string; count: number; affectedPeople: number }[]>([]);
  const [trends, setTrends] = useState<{ date: string; total: number; critical: number; resolved: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [overviewRes, typeRes, sevRes, regRes, trendRes] = await Promise.all([
        apiFetch<{ data: AnalyticsOverview }>('/analytics/overview'),
        apiFetch<{ data: any[] }>('/analytics/by-type'),
        apiFetch<{ data: any[] }>('/analytics/by-severity'),
        apiFetch<{ data: any[] }>('/analytics/by-region'),
        apiFetch<{ data: any[] }>('/analytics/trends'),
      ]);

      if (overviewRes.data) setOverview(overviewRes.data);
      if (typeRes.data) setByType(typeRes.data);
      if (sevRes.data) setBySeverity(sevRes.data);
      if (regRes.data) setByRegion(regRes.data);
      if (trendRes.data) setTrends(trendRes.data);
    } catch (err) {
      console.warn('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Palette colors for charts
  const SEVERITY_COLORS: Record<string, string> = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#eab308',
    LOW: '#3b82f6',
  };

  const TYPE_COLORS = [
    '#3b82f6',
    '#f97316',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#10b981',
    '#06b6d4',
    '#64748b',
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-red-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Disaster Analytics & Operational Telemetry
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated metrics calculated strictly from PostgreSQL / SQLite persistent database records.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Analytical disclaimer notice */}
      <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <span>
          <strong>Telemetry Disclaimer:</strong> Operational analytics are compiled directly from reported citizen submissions and seed records. They reflect reported incidents and do not necessarily capture all unreported emergencies in disaster zones with total communication blackout.
        </span>
      </div>

      {/* Latency & Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Total Citizens Affected</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {overview ? overview.totalPeopleAffected : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Summed across all tickets</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Avg Offline-to-Server Sync</div>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">
            {overview?.avgSyncLatencySec !== null ? `${overview?.avgSyncLatencySec}s` : 'Insufficient Data'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Client timestamp &rarr; server receipt</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Avg Acknowledge-to-Resolution</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {overview?.avgResolutionHours !== null ? `${overview?.avgResolutionHours} hrs` : 'Insufficient Data'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Active response duration</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Active Incidents Under Response</div>
          <div className="text-2xl font-extrabold text-purple-600 mt-1">
            {overview ? overview.activeIncidents : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Out of {overview?.totalIncidents || 0} total tickets</div>
        </div>
      </div>

      {/* Charts Grid Row 1: Disaster Category Breakdown & Severity Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Disaster Type Bar Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-700" />
              Incidents by Disaster Category
            </h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byType} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="type" angle={-25} textAnchor="end" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution Donut/Pie Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-slate-700" />
              Incidents by Severity Breakdown
            </h2>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bySeverity}
                  dataKey="count"
                  nameKey="severity"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  label={({ severity, count }) => `${severity}: ${count}`}
                >
                  {bySeverity.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={SEVERITY_COLORS[entry.severity] || '#64748b'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Grid Row 2: Regional Distribution & Timeline Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-700" />
              Incidents by Pune Region
            </h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byRegion} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="region" angle={-25} textAnchor="end" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Timeline Trend Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-700" />
              Incident Timeline Trend
            </h2>
          </div>
          <div className="h-64">
            {trends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Insufficient temporal timeline data.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="total" name="Total Incidents" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="critical" name="Critical" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
