import React, { useState } from 'react';
import { Incident, IncidentStatus, SeverityLevel } from '../../types/index.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { SeverityBadge } from '../common/SeverityBadge.js';
import { DisasterIcon } from '../common/DisasterIcon.js';
import { apiFetch } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  X,
  MapPin,
  Clock,
  User,
  Users,
  AlertTriangle,
  Flame,
  CheckCircle,
  RefreshCw,
  Send,
  MessageSquare,
  Shield,
  FileText,
} from 'lucide-react';

interface IncidentDetailModalProps {
  incident: Incident;
  onClose: () => void;
  onIncidentUpdated: (updated: Incident) => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
  onIncidentUpdated,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'notes'>('details');
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Note form state
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Status transition note state
  const [transitionNote, setTransitionNote] = useState('');

  const isOperatorOrAdmin = user?.role === 'RESCUE_OPERATOR' || user?.role === 'ADMIN';

  const handleStatusChange = async (newStatus: IncidentStatus) => {
    setActionError(null);
    setActionSuccess(null);
    setLoadingAction(true);

    try {
      const res = await apiFetch(`/incidents/${incident.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          note: transitionNote.trim() || undefined,
        }),
      });

      if (res.incident) {
        onIncidentUpdated(res.incident);
        setActionSuccess(`Status transitioned to ${newStatus}.`);
        setTransitionNote('');
      }
    } catch (err: any) {
      setActionError(err.message || 'Status transition failed.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handlePriorityChange = async (newSeverity: SeverityLevel) => {
    setActionError(null);
    setActionSuccess(null);
    setLoadingAction(true);

    try {
      const res = await apiFetch(`/incidents/${incident.id}/priority`, {
        method: 'PATCH',
        body: JSON.stringify({ severity: newSeverity }),
      });

      if (res.incident) {
        onIncidentUpdated(res.incident);
        setActionSuccess(`Severity updated to ${newSeverity}.`);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to update priority.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSubmittingNote(true);
    setActionError(null);

    try {
      const res = await apiFetch(`/incidents/${incident.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note: newNote.trim() }),
      });

      if (res.note) {
        const updatedNotes = [res.note, ...(incident.notes || [])];
        onIncidentUpdated({ ...incident, notes: updatedNotes });
        setNewNote('');
        setActionSuccess('Response note logged into operational timeline.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to add response note.');
    } finally {
      setSubmittingNote(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
              <DisasterIcon type={incident.disasterType} className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">
                  {incident.clientIncidentId}
                </span>
                <SeverityBadge severity={incident.severity} size="sm" />
                <StatusBadge status={incident.status} size="sm" />
              </div>
              <h2 className="text-base font-bold text-white mt-0.5 line-clamp-1">
                {incident.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action notifications */}
        {actionError && (
          <div className="bg-rose-50 border-b border-rose-200 text-rose-800 text-xs px-6 py-2.5 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
        {actionSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs px-6 py-2.5 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'details'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Incident Overview
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Status Transition Log</span>
            {incident.statusHistory && incident.statusHistory.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
                {incident.statusHistory.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'notes'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Response Notes</span>
            {incident.notes && incident.notes.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
                {incident.notes.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Emergency Situation Description
                </h3>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                  {incident.description}
                </div>
              </div>

              {/* Critical Indicators Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="text-[11px] text-slate-500 font-medium">People Affected</div>
                  <div className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-600" />
                    {incident.affectedPeople}
                  </div>
                </div>

                <div className={`p-3 rounded-lg border ${incident.peopleTrapped ? 'bg-red-50 border-red-200 text-red-900' : 'bg-white border-slate-200'}`}>
                  <div className="text-[11px] font-medium opacity-80">People Trapped</div>
                  <div className="text-sm font-bold mt-1">
                    {incident.peopleTrapped ? '⚠️ YES - Trapped' : 'None Reported'}
                  </div>
                </div>

                <div className={`p-3 rounded-lg border ${incident.medicalAssistanceRequired ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-white border-slate-200'}`}>
                  <div className="text-[11px] font-medium opacity-80">Medical Needed</div>
                  <div className="text-sm font-bold mt-1">
                    {incident.medicalAssistanceRequired ? '🚑 YES - Urgent' : 'No Priority'}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="text-[11px] text-slate-500 font-medium">Region</div>
                  <div className="text-sm font-bold text-slate-900 mt-1 truncate">
                    {incident.region}
                  </div>
                </div>
              </div>

              {/* Location details */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span>Reported Location: {incident.locationDescription}</span>
                </div>
                <div className="text-xs text-slate-600 font-mono">
                  {incident.latitude && incident.longitude ? (
                    <span>Coordinates: {incident.latitude.toFixed(6)}, {incident.longitude.toFixed(6)}</span>
                  ) : (
                    <span className="text-amber-700">No GPS coordinates recorded (Text location description provided).</span>
                  )}
                </div>
              </div>

              {/* Timing Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-400 font-medium">Client Created:</div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {new Date(incident.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-400 font-medium">Server Acknowledged:</div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {new Date(incident.serverReceivedAt).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-400 font-medium">Reporter Contact:</div>
                  <div className="font-semibold text-slate-800 mt-0.5 truncate">
                    {incident.reporter ? `${incident.reporter.name} (${incident.reporter.email})` : 'Anonymous Citizen'}
                  </div>
                </div>
              </div>

              {/* Operator Action Panel (Only if authorized) */}
              {isOperatorOrAdmin && (
                <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-red-400" />
                      Rescue Coordinator Controls
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Validated State Engine
                    </span>
                  </div>

                  {/* Transition note input */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Action Note (Recorded in permanent audit log):
                    </label>
                    <input
                      type="text"
                      value={transitionNote}
                      onChange={(e) => setTransitionNote(e.target.value)}
                      placeholder="e.g. Dispatched Unit Alpha with swift water rescue team..."
                      className="w-full text-xs px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>

                  {/* Allowed status buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {incident.status === 'PENDING_REVIEW' && (
                      <button
                        onClick={() => handleStatusChange('ACKNOWLEDGED')}
                        disabled={loadingAction}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-50"
                      >
                        Acknowledge Report
                      </button>
                    )}

                    {(incident.status === 'ACKNOWLEDGED' || incident.status === 'PENDING_REVIEW') && (
                      <button
                        onClick={() => handleStatusChange('IN_PROGRESS')}
                        disabled={loadingAction}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition disabled:opacity-50"
                      >
                        Deploy Rescue (In Progress)
                      </button>
                    )}

                    {incident.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleStatusChange('RESOLVED')}
                        disabled={loadingAction}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50"
                      >
                        Mark Incident Resolved
                      </button>
                    )}

                    {incident.status !== 'CANCELLED' && incident.status !== 'RESOLVED' && (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to cancel this emergency incident?')) {
                            handleStatusChange('CANCELLED');
                          }
                        }}
                        disabled={loadingAction}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition disabled:opacity-50"
                      >
                        Cancel Incident
                      </button>
                    )}
                  </div>

                  {/* Priority selector */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <span className="text-xs text-slate-400">Update Severity:</span>
                    {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as SeverityLevel[]).map((sev) => (
                      <button
                        key={sev}
                        onClick={() => handlePriorityChange(sev)}
                        disabled={loadingAction || incident.severity === sev}
                        className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                          incident.severity === sev
                            ? 'bg-slate-700 text-white cursor-default'
                            : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Audit Timeline & State History
              </h3>

              {(!incident.statusHistory || incident.statusHistory.length === 0) ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No status transition records recorded.
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                  {incident.statusHistory.map((item, idx) => (
                    <div key={item.id || idx} className="relative pl-6">
                      <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-red-600 border-2 border-white shadow-sm" />
                      <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between gap-2">
                          <StatusBadge status={item.newStatus} size="sm" />
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(item.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {item.note && (
                          <p className="text-xs text-slate-700 mt-2 italic bg-white p-2 rounded border border-slate-100">
                            "{item.note}"
                          </p>
                        )}
                        <div className="text-[11px] text-slate-500 mt-2">
                          Changed by: <span className="font-semibold text-slate-700">{item.changedBy?.name || 'System / Citizen'}</span> ({item.changedBy?.role || 'CITIZEN'})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              {isOperatorOrAdmin && (
                <form onSubmit={handleAddNote} className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Add Internal Tactical Note:
                  </label>
                  <textarea
                    rows={2}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Log team dispatch, equipment allocation, or field radio update..."
                    className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-800"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingNote || !newNote.trim()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {submittingNote ? 'Submitting...' : 'Save Note'}
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3 pt-2">
                {(!incident.notes || incident.notes.length === 0) ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No response notes recorded for this incident yet.
                  </div>
                ) : (
                  incident.notes.map((note) => (
                    <div key={note.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">
                          {note.author?.name || 'Operator'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(note.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                        {note.note}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition"
          >
            Close View
          </button>
        </div>
      </div>
    </div>
  );
};
