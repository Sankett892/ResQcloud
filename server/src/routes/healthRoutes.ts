import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    // Check DB connectivity
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: 'CONNECTED',
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      database: 'DISCONNECTED',
      error: error.message,
    });
  }
});

export default router;
