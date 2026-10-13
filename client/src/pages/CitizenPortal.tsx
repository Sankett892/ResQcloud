import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useOffline } from '../context/OfflineContext.js';
import { apiFetch } from '../services/api.js';
import { DisasterType, SeverityLevel, Incident, OfflineIncidentReport } from '../types/index.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { SeverityBadge } from '../components/common/SeverityBadge.js';
import { DisasterIcon } from '../components/common/DisasterIcon.js';
import { IncidentDetailModal } from '../components/rescue/IncidentDetailModal.js';
import {
  ShieldAlert,
  MapPin,
  Compass,
  AlertTriangle,
  Users,
  HeartPulse,
  Flame,
  CheckCircle,
  Clock,
  RefreshCw,
  Info,
  Send,
  Eye,
  History,
} from 'lucide-react';

export const CitizenPortal: React.FC = () => {
  const { user } = useAuth();
  const { isOnline, pendingCount, createOfflineEmergency, offlineReports, syncNow } = useOffline();
  const [searchParams] = useSearchParams();

  // Citizen-specific server incidents
  const [serverIncidents, setServerIncidents] = useState<Incident[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Form Fields
  const initialCategory = (searchParams.get('type') as DisasterType) || 'FLOOD';
  const [disasterType, setDisasterType] = useState<DisasterType>(initialCategory);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [affectedPeople, setAffectedPeople] = useState<number>(1);
  const [medicalAssistanceRequired, setMedicalAssistanceRequired] = useState(false);
  const [peopleTrapped, setPeopleTrapped] = useState(false);
  const [severity, setSeverity] = useState<SeverityLevel>('HIGH');
  const [locationDescription, setLocationDescription] = useState('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [region, setRegion] = useState('Pune City');

  // Location detection states
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsSuccess, setGpsSuccess] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<{
    status: 'ONLINE_RECEIVED' | 'OFFLINE_QUEUED';
    clientIncidentId: string;
    message: string;
  } | null>(null);

  const fetchCitizenIncidents = async () => {
    if (!user) return;
    setLoadingIncidents(true);
    try {
      const res = await apiFetch<{ incidents: Incident[] }>('/incidents?mine=true');
      if (res.incidents) {
        setServerIncidents(res.incidents);
      }
    } catch {
      // If offline or error, continue with empty or cached
    } finally {
      setLoadingIncidents(false);
    }
  };

  useEffect(() => {
    fetchCitizenIncidents();
  }, [user]);

  // Request GPS
  const handleDetectLocation = () => {
    setGpsError(null);
    setGpsSuccess(false);

    if (!navigator.geolocation) {
      setGpsError('Browser Geolocation API is not supported on this device.');
      return;
    }

    setDetectingGps(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setDetectingGps(false);
        setGpsSuccess(true);
      },
      (error) => {
        setDetectingGps(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError('Geolocation permission denied by user. You can enter location manually.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError('GPS position unavailable. Please describe your location below.');
            break;
          case error.TIMEOUT:
            setGpsError('GPS request timed out. Please enter description manually.');
            break;
          default:
            setGpsError('Failed to acquire GPS coordinates.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  // Submit SOS
  const handleSubmitSOS = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitResult(null);

    // Form validation
    if (!title.trim() || title.trim().length < 3) {
      setSubmitError('Please enter a descriptive emergency title (at least 3 characters).');
      return;
    }

    if (!description.trim() || description.trim().length < 5) {
      setSubmitError('Please provide situation details in the description.');
      return;
    }

    if (!locationDescription.trim()) {
      setSubmitError('Location description is mandatory so rescue teams know where to deploy.');
      return;
    }

    const parsedLat = latitude.trim() !== '' ? parseFloat(latitude) : null;
    const parsedLng = longitude.trim() !== '' ? parseFloat(longitude) : null;

    if (parsedLat !== null && (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90)) {
      setSubmitError('Latitude must be a valid number between -90 and 90.');
      return;
    }

    if (parsedLng !== null && (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180)) {
      setSubmitError('Longitude must be a valid number between -180 and 180.');
      return;
    }

    setSubmitting(true);
    const clientIncidentId = `resq-${crypto.randomUUID()}`;
    const nowIso = new Date().toISOString();

    const reportPayload = {
      clientIncidentId,
      disasterType,
      title: title.trim(),
      description: description.trim(),
      affectedPeople: Number(affectedPeople) || 1,
      medicalAssistanceRequired,
      peopleTrapped,
      severity,
      locationDescription: locationDescription.trim(),
      latitude: parsedLat,
      longitude: parsedLng,
      region,
      createdAt: nowIso,
    };

    // If online, try server direct submission
    if (isOnline) {
      try {
        const response = await apiFetch('/incidents', {
          method: 'POST',
          body: JSON.stringify(reportPayload),
        });

        if (response && response.incident) {
          setSubmitResult({
            status: 'ONLINE_RECEIVED',
            clientIncidentId,
            message: 'Your emergency report has reached the centralized dispatch queue and rescue teams are alerted.',
          });
          resetForm();
          fetchCitizenIncidents();
          return;
        }
      } catch (err: any) {
        console.warn('Direct server post failed, storing in IndexedDB buffer:', err);
        // Fall through to offline store
      }
    }

    // Offline or server unreachable: buffer into IndexedDB
    try {
      await createOfflineEmergency({
        reporterId: user?.id,
        disasterType,
        title: title.trim(),
        description: description.trim(),
        affectedPeople: Number(affectedPeople) || 1,
        medicalAssistanceRequired,
        peopleTrapped,
        severity,
        locationDescription: locationDescription.trim(),
        latitude: parsedLat,
        longitude: parsedLng,
        region,
      });

      setSubmitResult({
        status: 'OFFLINE_QUEUED',
        clientIncidentId,
        message: 'Network unreachable. Report is safely preserved in local IndexedDB. It will automatically transmit to rescue teams when connection is restored.',
      });
      resetForm();
    } catch (offlineErr: any) {
      setSubmitError(`Failed to save report locally: ${offlineErr.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAffectedPeople(1);
    setMedicalAssistanceRequired(false);
    setPeopleTrapped(false);
    setSeverity('HIGH');
    setLocationDescription('');
    setLatitude('');
    setLongitude('');
    setGpsSuccess(false);
    setSubmitting(false);
  };

  // Combine server and local reports for citizen view
  const pendingLocalReports = offlineReports.filter(
    (r) => r.syncStatus === 'LOCAL_PENDING' || r.syncStatus === 'SYNC_FAILED'
  );

  const totalReportsCount = serverIncidents.length + pendingLocalReports.length;
  const activeReportsCount = serverIncidents.filter(
    (i) => i.status !== 'RESOLVED' && i.status !== 'CANCELLED'
  ).length + pendingLocalReports.length;
  const resolvedReportsCount = serverIncidents.filter((i) => i.status === 'RESOLVED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title & Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-widest">
            <ShieldAlert className="w-4 h-4" />
            <span>Citizen SOS Dispatch Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Emergency Reporting & Incident Tracker
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Submit critical incidents during floods, fires, landslides, or medical emergencies. Reports are preserved locally during connectivity drops and verified once synchronized.
          </p>
        </div>

        {/* User identification */}
        <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">
            {user ? user.name[0] : 'C'}
          </div>
          <div>
            <div className="font-bold text-slate-900">{user ? user.name : 'Anonymous Reporter'}</div>
            <div className="text-[11px] text-slate-500 font-mono">{user ? user.email : 'Unregistered Session'}</div>
          </div>
        </div>
      </div>

      {/* Citizen Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Total My Reports</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalReportsCount}</div>
        </div>

        <div className={`p-4 rounded-xl border shadow-sm ${pendingLocalReports.length > 0 ? 'bg-amber-50 border-amber-200 text-amber-950' : 'bg-white border-slate-200'}`}>
          <div className="text-xs font-semibold opacity-80">Awaiting Sync (Offline)</div>
          <div className="text-2xl font-extrabold mt-1">{pendingLocalReports.length}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Active Incidents</div>
          <div className="text-2xl font-extrabold text-red-600 mt-1">{activeReportsCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Resolved Incidents</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{resolvedReportsCount}</div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {submitResult && (
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm flex items-start gap-3 animate-fadeIn ${
            submitResult.status === 'ONLINE_RECEIVED'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}
        >
          {submitResult.status === 'ONLINE_RECEIVED' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="font-bold text-sm">
              {submitResult.status === 'ONLINE_RECEIVED'
                ? 'Server Confirmed: Emergency Ticket Active'
                : 'Offline Buffer: Emergency Report Saved Locally'}
            </div>
            <div>{submitResult.message}</div>
            <div className="font-mono text-xs opacity-75">
              Incident Tracking ID: {submitResult.clientIncidentId}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Form on Left, Citizen Incident History on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* SOS Emergency Creation Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-red-100 text-red-600">
                <Flame className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Create Emergency SOS Report</h2>
                <div className="text-xs text-slate-500">All fields validated. Resilient to network dropouts.</div>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-600 text-white shadow-sm shadow-red-200">
              SOS ACTIVE
            </span>
          </div>

          {submitError && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitSOS} className="space-y-5">
            {/* Disaster Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Disaster Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'FLOOD', label: 'Flood' },
                  { id: 'EARTHQUAKE', label: 'Earthquake' },
                  { id: 'FIRE', label: 'Fire' },
                  { id: 'LANDSLIDE', label: 'Landslide' },
                  { id: 'MEDICAL_EMERGENCY', label: 'Medical' },
                  { id: 'BUILDING_COLLAPSE', label: 'Collapse' },
                  { id: 'SEVERE_WEATHER', label: 'Weather' },
                  { id: 'OTHER', label: 'Other' },
                ].map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setDisasterType(cat.id as DisasterType)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                      disasterType === cat.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <DisasterIcon type={cat.id} className="w-4 h-4" />
                    <span className="truncate">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Emergency Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Emergency Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Flash flood trapped 5 people inside basement"
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900"
                required
              />
            </div>

            {/* Situation Details */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Situation Description & Details *
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe injuries, trapped individuals, water level, structural risks..."
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900"
                required
              />
            </div>

            {/* Affected People & Priority Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Estimated People Affected
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={affectedPeople}
                    onChange={(e) => setAffectedPeople(parseInt(e.target.value) || 1)}
                    className="w-full text-sm pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Estimated Severity Level
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-slate-900"
                >
                  <option value="CRITICAL">CRITICAL (Immediate Threat to Life)</option>
                  <option value="HIGH">HIGH (Severe Danger)</option>
                  <option value="MEDIUM">MEDIUM (Moderate Distress)</option>
                  <option value="LOW">LOW (Non-Life Threatening)</option>
                </select>
              </div>
            </div>

            {/* Critical Rescue Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                  medicalAssistanceRequired
                    ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={medicalAssistanceRequired}
                  onChange={(e) => setMedicalAssistanceRequired(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <div className="text-xs">
                  <div className="font-bold flex items-center gap-1">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                    <span>Medical Assistance Required</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Dispatches ambulance or triage medics</div>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                  peopleTrapped
                    ? 'bg-red-50 border-red-300 text-red-950 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={peopleTrapped}
                  onChange={(e) => setPeopleTrapped(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <div className="text-xs">
                  <div className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    <span>People Trapped Under Debris/Water</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Alerts heavy equipment & rescue divers</div>
                </div>
              </label>
            </div>

            {/* Location Section */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-red-500" />
                  Incident Location
                </span>

                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detectingGps}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm disabled:opacity-50"
                >
                  <Compass className={`w-3.5 h-3.5 ${detectingGps ? 'animate-spin' : ''}`} />
                  <span>{detectingGps ? 'Detecting GPS...' : 'Detect My Location'}</span>
                </button>
              </div>

              {gpsError && (
                <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                  {gpsError}
                </div>
              )}

              {gpsSuccess && (
                <div className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>GPS Coordinates detected from device hardware!</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] text-slate-600 font-semibold mb-1">
                  Location Description (Street, Landmark, Floor, Crossroad) *
                </label>
                <input
                  type="text"
                  value={locationDescription}
                  onChange={(e) => setLocationDescription(e.target.value)}
                  placeholder="e.g. Near Ganpati Temple, Flat 204, Deccan Gymkhana"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Latitude (Optional)</label>
                  <input
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="18.5204"
                    className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Longitude (Optional)</label>
                  <input
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="73.8567"
                    className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Region (Pune Area)</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                  >
                    <option value="Pune City">Pune City</option>
                    <option value="Hadapsar">Hadapsar</option>
                    <option value="Kharadi">Kharadi</option>
                    <option value="Pimpri-Chinchwad">Pimpri-Chinchwad</option>
                    <option value="Hinjawadi">Hinjawadi</option>
                    <option value="Sinhagad Road">Sinhagad Road</option>
                    <option value="Kothrud">Kothrud</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SOS Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl text-base font-extrabold text-white bg-red-600 hover:bg-red-500 active:scale-[0.99] transition shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className={`w-5 h-5 ${submitting ? 'animate-pulse' : ''}`} />
              <span>{submitting ? 'TRANSMITTING SOS DISPATCH...' : 'TRANSMIT EMERGENCY SOS'}</span>
            </button>
            <div className="text-center text-[11px] text-slate-500">
              {isOnline ? 'Online mode: Transmitting directly to cloud server.' : 'Offline mode: Report will be queued locally in IndexedDB.'}
            </div>
          </form>
        </div>

        {/* Citizen Incident History Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900">My Emergency Reports</h2>
              </div>
              <button
                onClick={fetchCitizenIncidents}
                className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingIncidents ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Offline reports in local queue */}
            {pendingLocalReports.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Locally Queued Reports ({pendingLocalReports.length})</span>
                  <button
                    onClick={() => syncNow()}
                    className="text-xs text-blue-600 hover:underline font-bold"
                  >
                    Sync Now
                  </button>
                </div>
                {pendingLocalReports.map((offlineItem) => (
                  <div
                    key={offlineItem.clientIncidentId}
                    className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <DisasterIcon type={offlineItem.disasterType} className="w-4 h-4" />
                        <span className="font-bold text-slate-900 truncate max-w-[180px]">
                          {offlineItem.title}
                        </span>
                      </div>
                      <StatusBadge status={offlineItem.syncStatus} size="sm" />
                    </div>
                    <div className="text-slate-600 line-clamp-1">{offlineItem.locationDescription}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Queued: {new Date(offlineItem.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Server Incidents List */}
            <div className="space-y-3 pt-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Confirmed Server Incidents ({serverIncidents.length})
              </div>

              {serverIncidents.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                  You have not submitted any confirmed incidents yet.
                </div>
              ) : (
                serverIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <DisasterIcon type={inc.disasterType} className="w-4 h-4" />
                        <span className="font-bold text-slate-900 line-clamp-1">{inc.title}</span>
                      </div>
                      <SeverityBadge severity={inc.severity} size="sm" />
                    </div>

                    <div className="text-slate-600 line-clamp-2">{inc.description}</div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 text-slate-500">
                      <StatusBadge status={inc.status} size="sm" />
                      <button
                        onClick={() => setSelectedIncident(inc)}
                        className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Status History</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Incident Detail / Status History Modal */}
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onIncidentUpdated={(updated) => {
            setSelectedIncident(updated);
            fetchCitizenIncidents();
          }}
        />
      )}
    </div>
  );
};
