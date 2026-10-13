import { Router } from 'express';
import {
  getOverview,
  getByType,
  getBySeverity,
  getByRegion,
  getTrends,
} from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/overview', authenticate, getOverview);
router.get('/by-type', authenticate, getByType);
router.get('/by-severity', authenticate, getBySeverity);
router.get('/by-region', authenticate, getByRegion);
router.get('/trends', authenticate, getTrends);

export default router;
