import { Request } from 'express';

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

export interface AuthUserPayload {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}
