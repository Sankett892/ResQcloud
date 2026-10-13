import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { AuthenticatedRequest, IncidentStatus, SeverityLevel } from '../types/index.js';
import { emitToRescueTeam } from '../sockets/socketHandler.js';

export const createIncidentSchema = z.object({
  clientIncidentId: z.string().min(1, 'Client Incident ID is required'),
  disasterType: z.enum([
    'FLOOD',
    'EARTHQUAKE',
    'FIRE',
    'LANDSLIDE',
    'MEDICAL_EMERGENCY',
    'BUILDING_COLLAPSE',
    'SEVERE_WEATHER',
    'OTHER',
  ]),
  title: z.string().min(3, 'Title must be at least 3 characters').max(120),
  description: z.string().min(5, 'Description must be at least 5 characters').max(2000),
  affectedPeople: z.number().int().min(1).default(1),
  medicalAssistanceRequired: z.boolean().default(false),
  peopleTrapped: z.boolean().default(false),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  locationDescription: z.string().min(2, 'Location description is required').max(300),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  region: z.string().default('Pune City'),
  createdAt: z.string().optional(), // ISO string from client if created offline
});

export const updateStatusSchema = z.object({
  status: z.enum(['PENDING_REVIEW', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED']),
  note: z.string().max(500).optional(),
});

export const updatePrioritySchema = z.object({
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  note: z.string().max(500).optional(),
});

export const updateAssignmentSchema = z.object({
  assignedOperatorId: z.string().nullable(),
  note: z.string().max(500).optional(),
});

export const addNoteSchema = z.object({
  note: z.string().min(1, 'Note cannot be empty').max(1000),
});

// Helper for allowed state transitions
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING_REVIEW: ['ACKNOWLEDGED', 'CANCELLED'],
  ACKNOWLEDGED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['RESOLVED', 'CANCELLED'],
  RESOLVED: ['IN_PROGRESS'], // Only if reopened
  CANCELLED: ['PENDING_REVIEW'],
};

export const createIncident = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const data = createIncidentSchema.parse(req.body);

    // Idempotency check: see if clientIncidentId already exists
    const existing = await prisma.incident.findUnique({
      where: { clientIncidentId: data.clientIncidentId },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        assignedOperator: { select: { id: true, name: true, email: true } },
      },
    });

    if (existing) {
      // Return existing without duplicate insertion
      res.status(200).json({
        success: true,
        message: 'Incident already registered (idempotent duplicate request recognized).',
        incident: existing,
        isDuplicate: true,
      });
      return;
    }

    const clientCreatedAt = data.createdAt ? new Date(data.createdAt) : new Date();

    const incident = await prisma.incident.create({
      data: {
        clientIncidentId: data.clientIncidentId,
        reporterId: userId,
        disasterType: data.disasterType,
        title: data.title,
        description: data.description,
        affectedPeople: data.affectedPeople,
        medicalAssistanceRequired: data.medicalAssistanceRequired,
        peopleTrapped: data.peopleTrapped,
        severity: data.severity,
        locationDescription: data.locationDescription,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        region: data.region,
        status: 'PENDING_REVIEW',
        createdAt: clientCreatedAt,
        serverReceivedAt: new Date(),
      },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
      },
    });

    // Record initial status history
    await prisma.incidentStatusHistory.create({
      data: {
        incidentId: incident.id,
        previousStatus: null,
        newStatus: 'PENDING_REVIEW',
        changedById: userId,
        note: 'Emergency incident submitted by citizen.',
        createdAt: incident.createdAt,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'INCIDENT_CREATED',
        entityType: 'Incident',
        entityId: incident.id,
        metadata: JSON.stringify({
          clientIncidentId: incident.clientIncidentId,
          severity: incident.severity,
          disasterType: incident.disasterType,
        }),
      },
    });

    // Broadcast new incident to rescue teams
    emitToRescueTeam('incident:new', incident);

    res.status(201).json({
      success: true,
      message: 'Emergency report received and logged into emergency dispatch queue.',
      incident,
      isDuplicate: false,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message, details: error.errors });
      return;
    }
    console.error('[Create Incident Error]', error);
    res.status(500).json({ success: false, error: 'Failed to create emergency incident.' });
  }
};

export const getIncidents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const {
      disasterType,
      severity,
      status,
      region,
      search,
      mine,
      page = '1',
      limit = '50',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // Citizens by default see their own incidents unless rescue operator
    if (user.role === 'CITIZEN' || mine === 'true') {
      where.reporterId = user.id;
    }

    if (disasterType && disasterType !== 'ALL') {
      where.disasterType = disasterType;
    }

    if (severity && severity !== 'ALL') {
      where.severity = severity;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (region && region !== 'ALL') {
      where.region = region;
    }

    if (search && search.trim() !== '') {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { locationDescription: { contains: search } },
        { clientIncidentId: { contains: search } },
      ];
    }

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: { select: { id: true, name: true, email: true } },
          assignedOperator: { select: { id: true, name: true, email: true } },
          _count: { select: { notes: true, statusHistory: true } },
        },
      }),
      prisma.incident.count({ where }),
    ]);

    res.json({
      success: true,
      incidents,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('[Get Incidents Error]', error);
    res.status(500).json({ success: false, error: 'Failed to fetch emergency incidents.' });
  }
};

export const getIncidentById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const incident = await prisma.incident.findFirst({
      where: {
        OR: [{ id }, { clientIncidentId: id }],
      },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        assignedOperator: { select: { id: true, name: true, email: true } },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: { select: { id: true, name: true, role: true } },
          },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, name: true, role: true } },
          },
        },
      },
    });

    if (!incident) {
      res.status(404).json({ success: false, error: 'Incident not found.' });
      return;
    }

    // Citizens can only view their own incidents
    if (user.role === 'CITIZEN' && incident.reporterId !== user.id) {
      res.status(403).json({ success: false, error: 'Access denied to this incident.' });
      return;
    }

    res.json({
      success: true,
      incident,
    });
  } catch (error) {
    console.error('[Get Incident By ID Error]', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve incident details.' });
  }
};

export const updateIncidentStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { status, note } = updateStatusSchema.parse(req.body);

    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) {
      res.status(404).json({ success: false, error: 'Incident not found.' });
      return;
    }

    const currentStatus = incident.status;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];

    // Admins can bypass transition lock, operators must follow workflow
    if (user.role !== 'ADMIN' && currentStatus !== status && !allowed.includes(status)) {
      res.status(400).json({
        success: false,
        error: `Invalid status transition from ${currentStatus} to ${status}. Permitted transitions: ${allowed.join(', ') || 'None'}`,
      });
      return;
    }

    const resolvedAt = status === 'RESOLVED' ? new Date() : (status === 'IN_PROGRESS' ? null : incident.resolvedAt);

    const updatedIncident = await prisma.incident.update({
      where: { id },
      data: {
        status,
        resolvedAt,
        updatedAt: new Date(),
      },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        assignedOperator: { select: { id: true, name: true, email: true } },
      },
    });

    // Record status history
    await prisma.incidentStatusHistory.create({
      data: {
        incidentId: id,
        previousStatus: currentStatus,
        newStatus: status,
        changedById: user.id,
        note: note || `Status changed from ${currentStatus} to ${status}`,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'STATUS_UPDATE',
        entityType: 'Incident',
        entityId: id,
        metadata: JSON.stringify({ from: currentStatus, to: status, note }),
      },
    });

    // Emit live update
    emitToRescueTeam('incident:status_changed', {
      incidentId: id,
      previousStatus: currentStatus,
      newStatus: status,
      updatedIncident,
      changedBy: { id: user.id, name: user.name, role: user.role },
      note,
    });

    res.json({
      success: true,
      message: `Incident status updated to ${status}.`,
      incident: updatedIncident,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    console.error('[Update Status Error]', error);
    res.status(500).json({ success: false, error: 'Failed to update incident status.' });
  }
};

export const updateIncidentPriority = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { severity, note } = updatePrioritySchema.parse(req.body);

    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) {
      res.status(404).json({ success: false, error: 'Incident not found.' });
      return;
    }

    const previousSeverity = incident.severity;

    const updatedIncident = await prisma.incident.update({
      where: { id },
      data: {
        severity,
        updatedAt: new Date(),
      },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        assignedOperator: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'PRIORITY_UPDATE',
        entityType: 'Incident',
        entityId: id,
        metadata: JSON.stringify({ from: previousSeverity, to: severity, note }),
      },
    });

    emitToRescueTeam('incident:priority_changed', {
      incidentId: id,
      previousSeverity,
      newSeverity: severity,
      updatedIncident,
      changedBy: { id: user.id, name: user.name },
    });

    res.json({
      success: true,
      message: `Incident priority changed from ${previousSeverity} to ${severity}.`,
      incident: updatedIncident,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    console.error('[Update Priority Error]', error);
    res.status(500).json({ success: false, error: 'Failed to update priority.' });
  }
};

export const updateIncidentAssignment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { assignedOperatorId, note } = updateAssignmentSchema.parse(req.body);

    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) {
      res.status(404).json({ success: false, error: 'Incident not found.' });
      return;
    }

    if (assignedOperatorId) {
      const operator = await prisma.user.findFirst({
        where: { id: assignedOperatorId, role: { in: ['RESCUE_OPERATOR', 'ADMIN'] } },
      });
      if (!operator) {
        res.status(400).json({ success: false, error: 'Invalid rescue operator ID selected.' });
        return;
      }
    }

    const updatedIncident = await prisma.incident.update({
      where: { id },
      data: {
        assignedOperatorId,
        updatedAt: new Date(),
      },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        assignedOperator: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'OPERATOR_ASSIGNMENT',
        entityType: 'Incident',
        entityId: id,
        metadata: JSON.stringify({ assignedOperatorId, note }),
      },
    });

    emitToRescueTeam('incident:assignment_changed', {
      incidentId: id,
      assignedOperatorId,
      updatedIncident,
    });

    res.json({
      success: true,
      message: assignedOperatorId ? 'Incident assigned to rescue operator.' : 'Assignment cleared.',
      incident: updatedIncident,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    console.error('[Update Assignment Error]', error);
    res.status(500).json({ success: false, error: 'Failed to update assignment.' });
  }
};

export const addIncidentNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { note } = addNoteSchema.parse(req.body);

    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) {
      res.status(404).json({ success: false, error: 'Incident not found.' });
      return;
    }

    const newNote = await prisma.incidentNote.create({
      data: {
        incidentId: id,
        authorId: user.id,
        note,
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    emitToRescueTeam('incident:note_added', {
      incidentId: id,
      note: newNote,
    });

    res.status(201).json({
      success: true,
      message: 'Internal incident note added.',
      note: newNote,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    console.error('[Add Note Error]', error);
    res.status(500).json({ success: false, error: 'Failed to add incident note.' });
  }
};

export const getIncidentHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const incident = await prisma.incident.findUnique({
      where: { id },
      select: { id: true, reporterId: true },
    });

    if (!incident) {
      res.status(404).json({ success: false, error: 'Incident not found.' });
      return;
    }

    if (user.role === 'CITIZEN' && incident.reporterId !== user.id) {
      res.status(403).json({ success: false, error: 'Access denied.' });
      return;
    }

    const history = await prisma.incidentStatusHistory.findMany({
      where: { incidentId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        changedBy: { select: { id: true, name: true, role: true } },
      },
    });

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error('[Get History Error]', error);
    res.status(500).json({ success: false, error: 'Failed to fetch incident history.' });
  }
};
