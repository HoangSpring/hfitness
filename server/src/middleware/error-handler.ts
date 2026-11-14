import type { ErrorRequestHandler } from 'express';
import { AppError } from '../lib/errors.js';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error?.type === 'entity.too.large') {
    res.status(413).json({
      error: { code: 'IMAGE_TOO_LARGE', message: 'The image is too large.' },
    });
    return;
  }
  if (error?.type === 'entity.parse.failed') {
    res.status(400).json({
      error: { code: 'AI_INVALID_REQUEST', message: 'The request body must be valid JSON.' },
    });
    return;
  }
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: { code: error.code, message: error.message },
    });
    return;
  }

  res.status(500).json({
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred.' },
  });
};
