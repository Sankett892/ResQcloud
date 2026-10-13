import { Router } from 'express';
import {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
  updateIncidentPriority,
  updateIncidentAssignment,
  addIncidentNote,
  getIncidentHistory,
} from '../controllers/incidentController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Protected for all authenticated users (Citizen, Operator, Admin)
router.post('/', authenticate, createIncident);
router.get('/', authenticate, getIncidents);
router.get('/:id', authenticate, getIncidentById);
router.get('/:id/history', authenticate, getIncidentHistory);

// Operator & Admin exclusive actions
router.patch('/:id/status', authenticate, requireRole('RESCUE_OPERATOR', 'ADMIN'), updateIncidentStatus);
router.patch('/:id/priority', authenticate, requireRole('RESCUE_OPERATOR', 'ADMIN'), updateIncidentPriority);
router.patch('/:id/assignment', authenticate, requireRole('RESCUE_OPERATOR', 'ADMIN'), updateIncidentAssignment);
router.post('/:id/notes', authenticate, requireRole('RESCUE_OPERATOR', 'ADMIN'), addIncidentNote);

export default router;
