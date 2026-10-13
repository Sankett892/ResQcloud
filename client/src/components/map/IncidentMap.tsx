import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Incident, DisasterType, SeverityLevel, IncidentStatus } from '../../types/index.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { SeverityBadge } from '../common/SeverityBadge.js';
import { DisasterIcon } from '../common/DisasterIcon.js';
import {
  MapPin,
  Filter,
  Maximize2,
  AlertTriangle,
  Info,
  Layers,
  Compass,
} from 'lucide-react';

interface IncidentMapProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
}

export const IncidentMap: React.FC<IncidentMapProps> = ({ incidents, onSelectIncident }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Filters
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [tileError, setTileError] = useState(false);

  // Pune default center
  const PUNE_CENTER: [number, number] = [18.5204, 73.8567];

  const filteredIncidents = incidents.filter((inc) => {
    if (selectedType !== 'ALL' && inc.disasterType !== selectedType) return false;
    if (selectedSeverity !== 'ALL' && inc.severity !== selectedSeverity) return false;
    if (selectedStatus !== 'ALL' && inc.status !== selectedStatus) return false;
    return true;
  });

  const validCoordinateIncidents = filteredIncidents.filter(
    (inc) => typeof inc.latitude === 'number' && typeof inc.longitude === 'number'
  );

  const missingCoordinateIncidents = filteredIncidents.filter(
    (inc) => typeof inc.latitude !== 'number' || typeof inc.longitude !== 'number'
  );

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: PUNE_CENTER,
        zoom: 12,
        zoomControl: true,
      });

      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | ResQCloud Tactical GIS',
        maxZoom: 18,
      });

      tileLayer.on('tileerror', () => {
        setTileError(true);
      });

      tileLayer.addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when incidents or filters change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const bounds: [number, number][] = [];

    validCoordinateIncidents.forEach((inc) => {
      const lat = inc.latitude!;
      const lng = inc.longitude!;
      bounds.push([lat, lng]);

      let colorBg = 'bg-blue-600';
      let ringColor = 'border-white';
      let beaconClass = '';

      if (inc.severity === 'CRITICAL') {
        colorBg = 'bg-red-600';
        beaconClass = 'beacon-critical ring-2 ring-red-400';
      } else if (inc.severity === 'HIGH') {
        colorBg = 'bg-orange-500';
        beaconClass = 'ring-2 ring-orange-300';
      } else if (inc.severity === 'MEDIUM') {
        colorBg = 'bg-amber-500';
      }

      const iconHtml = `
        <div class="relative flex items-center justify-center w-8 h-8 rounded-full ${colorBg} text-white shadow-lg border-2 ${ringColor} ${beaconClass} cursor-pointer transition hover:scale-110">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-disaster-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 text-slate-800 text-xs font-sans max-w-xs';
      popupContent.innerHTML = `
        <div class="font-bold text-sm text-slate-900 mb-1 leading-snug">${inc.title}</div>
        <div class="text-[11px] text-slate-500 mb-2">${inc.locationDescription} (${inc.region})</div>
        <div class="flex items-center gap-2 mb-2">
          <span class="px-2 py-0.5 rounded font-bold text-[10px] ${
            inc.severity === 'CRITICAL' ? 'bg-red-600 text-white' : inc.severity === 'HIGH' ? 'bg-orange-500 text-white' : 'bg-amber-400 text-black'
          }">${inc.severity}</span>
          <span class="px-2 py-0.5 rounded text-[10px] bg-slate-100 font-semibold text-slate-700">${inc.status}</span>
        </div>
        <div class="text-[11px] text-slate-600 mb-3"><strong>Affected:</strong> ${inc.affectedPeople} people</div>
        <button id="view-incident-${inc.id}" class="w-full py-1.5 px-3 rounded bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition">
          View Tactical Details
        </button>
      `;

      popupContent.querySelector(`#view-incident-${inc.id}`)?.addEventListener('click', () => {
        onSelectIncident(inc);
      });

      marker.bindPopup(popupContent);
      markersLayerRef.current?.addLayer(marker);
    });
  }, [validCoordinateIncidents]);

  const fitBounds = () => {
    if (!mapInstanceRef.current || validCoordinateIncidents.length === 0) return;
    const coords: [number, number][] = validCoordinateIncidents.map((i) => [i.latitude!, i.longitude!]);
    const bounds = L.latLngBounds(coords);
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      {/* Top Map Controls and Filters Bar */}
      <div className="bg-slate-900 text-white p-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Compass className="w-5 h-5 text-red-500" />
            <span className="font-bold text-sm tracking-wide">
              GIS Tactical Incident Map
            </span>
          </div>

          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <span>DEMO DATA: PUNE METROPOLITAN REGION</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Disaster Type filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="ALL">All Types ({incidents.length})</option>
            <option value="FLOOD">Flood</option>
            <option value="EARTHQUAKE">Earthquake</option>
            <option value="FIRE">Fire</option>
            <option value="LANDSLIDE">Landslide</option>
            <option value="MEDICAL_EMERGENCY">Medical</option>
            <option value="BUILDING_COLLAPSE">Building Collapse</option>
            <option value="SEVERE_WEATHER">Severe Weather</option>
            <option value="OTHER">Other</option>
          </select>

          {/* Severity filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Fit Bounds Button */}
          <button
            onClick={fitBounds}
            title="Fit Map to All Markers"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium transition border border-slate-700"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fit All</span>
          </button>
        </div>
      </div>

      {/* Tile loading warning fallback */}
      {tileError && (
        <div className="bg-amber-100 border-b border-amber-300 text-amber-900 px-4 py-2 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            OpenStreetMap tiles are temporarily slow or offline. Incident markers and coordinates remain active on canvas.
          </span>
        </div>
      )}

      {/* Main Map Viewport & Legend Container */}
      <div className="relative flex-1 min-h-[480px]">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 z-20 bg-slate-900/90 backdrop-blur-sm text-white p-3 rounded-lg border border-slate-700 shadow-xl text-xs space-y-1.5">
          <div className="font-bold text-slate-200 text-[11px] uppercase tracking-wider mb-1">
            Severity Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 beacon-critical" />
            <span>Critical Emergency</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <span>High Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span>Medium Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Low Priority</span>
          </div>
          <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400">
            {validCoordinateIncidents.length} plotted / {filteredIncidents.length} total
          </div>
        </div>

        {/* Drawer for incidents without GPS coordinates */}
        {missingCoordinateIncidents.length > 0 && (
          <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-sm text-slate-900 p-3 rounded-lg border border-slate-300 shadow-xl text-xs max-w-xs max-h-56 overflow-y-auto">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Without GPS ({missingCoordinateIncidents.length})</span>
            </div>
            <div className="space-y-1.5">
              {missingCoordinateIncidents.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => onSelectIncident(inc)}
                  className="p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition text-[11px]"
                >
                  <div className="font-semibold line-clamp-1">{inc.title}</div>
                  <div className="text-slate-500 line-clamp-1">{inc.locationDescription}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
