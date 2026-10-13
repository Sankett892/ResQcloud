import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api.js';
import { Incident } from '../types/index.js';
import { IncidentMap } from '../components/map/IncidentMap.js';
import { IncidentDetailModal } from '../components/rescue/IncidentDetailModal.js';
import { RefreshCw, MapPin, AlertTriangle, Compass } from 'lucide-react';

export const DisasterMapPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ incidents: Incident[] }>('/incidents?limit=100');
      if (res.incidents) {
        setIncidents(res.incidents);
      }
    } catch (err) {
      console.warn('Failed to fetch map incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  return (
    <div className="space-y-4 h-[calc(100vh-6.5rem)] flex flex-col">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Interactive Disaster GIS Map
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-800 border border-amber-500/30">
              DEMO DATA: PUNE
            </span>
          </div>
          <p className="text-xs text-slate-500">
            OpenStreetMap live spatial view of reported incidents across Pune Metropolitan Region.
          </p>
        </div>

        <button
          onClick={fetchIncidents}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Pins ({incidents.length})</span>
        </button>
      </div>

      {/* Main Map Component filling rest of viewport */}
      <div className="flex-1 min-h-[500px]">
        <IncidentMap
          incidents={incidents}
          onSelectIncident={(inc) => setSelectedIncident(inc)}
        />
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
