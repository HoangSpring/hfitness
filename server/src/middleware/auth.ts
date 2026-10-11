import type { RequestHandler } from 'express';
import type { User } from '@supabase/supabase-js';
import { createUserSupabaseClient } from '../lib/supabase.js';
import { AppError } from '../lib/errors.js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      supabase?: ReturnType<typeof createUserSupabaseClient>;
    }
  }
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.header('authorization');
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required.');

    const supabase = createUserSupabaseClient(token);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required.');
    }

    req.user = data.user;
    req.supabase = supabase;
    next();
  } catch (error) {
    next(error);
  }
};

