import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { emitToRescueTeam } from '../sockets/socketHandler.js';

const syncReportItemSchema = z.object({
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
  title: z.string().min(3).max(120),
  description: z.string().min(5).max(2000),
  affectedPeople: z.number().int().min(1).default(1),
  medicalAssistanceRequired: z.boolean().default(false),
  peopleTrapped: z.boolean().default(false),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  locationDescription: z.string().min(2).max(300),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  region: z.string().default('Pune City'),
  createdAt: z.string(), // Preserved client offline creation timestamp
});

const syncPayloadSchema = z.object({
  reports: z.array(syncReportItemSchema).min(1, 'At least one report required for synchronization'),
});

export const syncIncidents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { reports } = syncPayloadSchema.parse(req.body);

    const syncResults: Array<{
      clientIncidentId: string;
      serverId?: string;
      syncStatus: 'SERVER_RECEIVED' | 'SYNC_FAILED';
      isDuplicate: boolean;
      serverReceivedAt?: string;
      error?: string;
    }> = [];

    const newIncidentsForBroadcast: any[] = [];

    for (const report of reports) {
      try {
        // Idempotency check: see if clientIncidentId is already in database
        const existing = await prisma.incident.findUnique({
          where: { clientIncidentId: report.clientIncidentId },
        });

        if (existing) {
          syncResults.push({
            clientIncidentId: report.clientIncidentId,
            serverId: existing.id,
            syncStatus: 'SERVER_RECEIVED',
            isDuplicate: true,
            serverReceivedAt: existing.serverReceivedAt.toISOString(),
          });
          continue;
        }

        const clientCreatedAt = new Date(report.createdAt);
        const serverReceivedAt = new Date();

        const created = await prisma.incident.create({
          data: {
            clientIncidentId: report.clientIncidentId,
            reporterId: userId,
            disasterType: report.disasterType,
            title: report.title,
            description: report.description,
            affectedPeople: report.affectedPeople,
            medicalAssistanceRequired: report.medicalAssistanceRequired,
            peopleTrapped: report.peopleTrapped,
            severity: report.severity,
            locationDescription: report.locationDescription,
            latitude: report.latitude ?? null,
            longitude: report.longitude ?? null,
            region: report.region,
            status: 'PENDING_REVIEW',
            createdAt: isNaN(clientCreatedAt.getTime()) ? new Date() : clientCreatedAt,
            serverReceivedAt,
          },
          include: {
            reporter: { select: { id: true, name: true, email: true } },
          },
        });

        // Record initial status history
        await prisma.incidentStatusHistory.create({
          data: {
            incidentId: created.id,
            previousStatus: null,
            newStatus: 'PENDING_REVIEW',
            changedById: userId,
            note: 'Incident synchronized from citizen offline store.',
            createdAt: created.createdAt,
          },
        });

        // Record audit log
        await prisma.auditLog.create({
          data: {
            actorId: userId,
            action: 'OFFLINE_INCIDENT_SYNC',
            entityType: 'Incident',
            entityId: created.id,
            metadata: JSON.stringify({
              clientIncidentId: report.clientIncidentId,
              clientCreatedAt: report.createdAt,
              serverReceivedAt: serverReceivedAt.toISOString(),
            }),
          },
        });

        newIncidentsForBroadcast.push(created);

        syncResults.push({
          clientIncidentId: report.clientIncidentId,
          serverId: created.id,
          syncStatus: 'SERVER_RECEIVED',
          isDuplicate: false,
          serverReceivedAt: serverReceivedAt.toISOString(),
        });
      } catch (itemError: any) {
        console.error(`[Sync Item Error: ${report.clientIncidentId}]`, itemError);
        syncResults.push({
          clientIncidentId: report.clientIncidentId,
          syncStatus: 'SYNC_FAILED',
          isDuplicate: false,
          error: itemError.message || 'Failed to persist synchronized report',
        });
      }
    }

    // Broadcast newly created offline reports to rescue operators in real-time
    for (const inc of newIncidentsForBroadcast) {
      emitToRescueTeam('incident:new', inc);
    }

    const successfulCount = syncResults.filter((r) => r.syncStatus === 'SERVER_RECEIVED').length;

    res.json({
      success: true,
      message: `Synchronization completed. ${successfulCount}/${reports.length} reports acknowledged by server.`,
      results: syncResults,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message, details: error.errors });
      return;
    }
    console.error('[Sync Controller Error]', error);
    res.status(500).json({ success: false, error: 'Synchronization batch failed.' });
  }
};
