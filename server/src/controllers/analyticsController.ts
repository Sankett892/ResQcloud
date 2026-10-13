import { Response } from 'express';
import prisma from '../utils/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';

export const getOverview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [
      totalIncidents,
      criticalIncidents,
      pendingReviewIncidents,
      resolvedIncidents,
      inProgressIncidents,
      acknowledgedIncidents,
      allIncidents,
    ] = await Promise.all([
      prisma.incident.count(),
      prisma.incident.count({ where: { severity: 'CRITICAL', status: { notIn: ['RESOLVED', 'CANCELLED'] } } }),
      prisma.incident.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.incident.count({ where: { status: 'RESOLVED' } }),
      prisma.incident.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.incident.count({ where: { status: 'ACKNOWLEDGED' } }),
      prisma.incident.findMany({
        select: {
          affectedPeople: true,
          createdAt: true,
          serverReceivedAt: true,
          resolvedAt: true,
          status: true,
        },
      }),
    ]);

    const activeIncidents = pendingReviewIncidents + acknowledgedIncidents + inProgressIncidents;
    const totalPeopleAffected = allIncidents.reduce((sum, inc) => sum + (inc.affectedPeople || 0), 0);

    // Calculate Average Creation to Server Receipt latency (in seconds)
    let totalSyncLatencySec = 0;
    let syncCount = 0;
    for (const inc of allIncidents) {
      if (inc.createdAt && inc.serverReceivedAt) {
        const diffSec = (inc.serverReceivedAt.getTime() - inc.createdAt.getTime()) / 1000;
        if (diffSec >= 0) {
          totalSyncLatencySec += diffSec;
          syncCount++;
        }
      }
    }
    const avgSyncLatencySec = syncCount > 0 ? Math.round(totalSyncLatencySec / syncCount) : null;

    // Calculate Average Resolution Time (in hours) for resolved incidents
    const resolvedWithTimes = allIncidents.filter((i) => i.status === 'RESOLVED' && i.resolvedAt && i.createdAt);
    let avgResolutionHours: number | null = null;
    if (resolvedWithTimes.length > 0) {
      const totalHours = resolvedWithTimes.reduce((acc, curr) => {
        return acc + (curr.resolvedAt!.getTime() - curr.createdAt.getTime()) / (1000 * 3600);
      }, 0);
      avgResolutionHours = parseFloat((totalHours / resolvedWithTimes.length).toFixed(1));
    }

    res.json({
      success: true,
      data: {
        totalIncidents,
        activeIncidents,
        criticalIncidents,
        pendingReviewIncidents,
        acknowledgedIncidents,
        inProgressIncidents,
        resolvedIncidents,
        totalPeopleAffected,
        avgSyncLatencySec,
        avgResolutionHours,
        lastRefreshedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Analytics Overview Error]', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve analytics overview.' });
  }
};

export const getByType = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const raw = await prisma.incident.groupBy({
      by: ['disasterType'],
      _count: { id: true },
      _sum: { affectedPeople: true },
    });

    const data = raw.map((item) => ({
      type: item.disasterType,
      count: item._count.id,
      affectedPeople: item._sum.affectedPeople || 0,
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('[Analytics By Type Error]', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve disaster type analytics.' });
  }
};

export const getBySeverity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const raw = await prisma.incident.groupBy({
      by: ['severity'],
      _count: { id: true },
    });

    const data = raw.map((item) => ({
      severity: item.severity,
      count: item._count.id,
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('[Analytics By Severity Error]', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve severity analytics.' });
  }
};

export const getByRegion = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const raw = await prisma.incident.groupBy({
      by: ['region'],
      _count: { id: true },
      _sum: { affectedPeople: true },
    });

    const data = raw.map((item) => ({
      region: item.region,
      count: item._count.id,
      affectedPeople: item._sum.affectedPeople || 0,
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('[Analytics By Region Error]', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve regional analytics.' });
  }
};

export const getTrends = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const incidents = await prisma.incident.findMany({
      select: {
        createdAt: true,
        severity: true,
        status: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date (YYYY-MM-DD)
    const trendsMap: Record<string, { date: string; total: number; critical: number; resolved: number }> = {};

    for (const inc of incidents) {
      const dateKey = inc.createdAt.toISOString().split('T')[0];
      if (!trendsMap[dateKey]) {
        trendsMap[dateKey] = {
          date: dateKey,
          total: 0,
          critical: 0,
          resolved: 0,
        };
      }
      trendsMap[dateKey].total += 1;
      if (inc.severity === 'CRITICAL') trendsMap[dateKey].critical += 1;
      if (inc.status === 'RESOLVED') trendsMap[dateKey].resolved += 1;
    }

    const data = Object.values(trendsMap).sort((a, b) => a.date.localeCompare(b.date));

    res.json({ success: true, data });
  } catch (error) {
    console.error('[Analytics Trends Error]', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve trend analytics.' });
  }
};
