import { Router } from 'express';
import { syncIncidents } from '../controllers/syncController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, syncIncidents);

export default router;
