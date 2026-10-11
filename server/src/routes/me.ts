import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

export const meRouter = Router();
meRouter.get('/me/ping', requireAuth, (req, res) => {
  res.json({ data: { userId: req.user?.id } });
});

