export type UserRole = 'CITIZEN' | 'RESCUE_OPERATOR' | 'ADMIN';

export type DisasterType =
  | 'FLOOD'
  | 'EARTHQUAKE'
  | 'FIRE'
  | 'LANDSLIDE'
  | 'MEDICAL_EMERGENCY'
  | 'BUILDING_COLLAPSE'
  | 'SEVERE_WEATHER'
  | 'OTHER';

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type IncidentStatus =
  | 'PENDING_REVIEW'
  | 'ACKNOWLEDGED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CANCELLED';

export type LocalSyncStatus =
  | 'DRAFT'
  | 'LOCAL_PENDING'
  | 'SYNC_IN_PROGRESS'
  | 'SERVER_RECEIVED'
  | 'SYNC_FAILED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface IncidentStatusHistory {
  id: string;
  incidentId: string;
  previousStatus?: string | null;
  newStatus: IncidentStatus;
  changedById?: string | null;
  changedBy?: {
    id: string;
    name: string;
    role: UserRole;
  };
  note?: string | null;
  createdAt: string;
}

export interface IncidentNote {
  id: string;
  incidentId: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    role: UserRole;
  };
  note: string;
  createdAt: string;
}

export interface Incident {
  id: string;
  clientIncidentId: string;
  reporterId: string;
  disasterType: DisasterType;
  title: string;
  description: string;
  affectedPeople: number;
  medicalAssistanceRequired: boolean;
  peopleTrapped: boolean;
  severity: SeverityLevel;
  locationDescription: string;
  latitude?: number | null;
  longitude?: number | null;
  region: string;
  status: IncidentStatus;
  assignedOperatorId?: string | null;
  assignedOperator?: {
    id: string;
    name: string;
    email: string;
  } | null;
  reporter?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  serverReceivedAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  statusHistory?: IncidentStatusHistory[];
  notes?: IncidentNote[];
  _count?: {
    notes: number;
    statusHistory: number;
  };
}

export interface OfflineIncidentReport {
  clientIncidentId: string;
  reporterId?: string;
  disasterType: DisasterType;
  title: string;
  description: string;
  affectedPeople: number;
  medicalAssistanceRequired: boolean;
  peopleTrapped: boolean;
  severity: SeverityLevel;
  locationDescription: string;
  latitude?: number | null;
  longitude?: number | null;
  region: string;
  createdAt: string;
  syncStatus: LocalSyncStatus;
  serverId?: string;
  lastAttemptAt?: string;
  retryCount: number;
  error?: string;
}

export interface AnalyticsOverview {
  totalIncidents: number;
  activeIncidents: number;
  criticalIncidents: number;
  pendingReviewIncidents: number;
  acknowledgedIncidents: number;
  inProgressIncidents: number;
  resolvedIncidents: number;
  totalPeopleAffected: number;
  avgSyncLatencySec: number | null;
  avgResolutionHours: number | null;
  lastRefreshedAt: string;
}
