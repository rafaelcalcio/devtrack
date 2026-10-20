import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../lib/errors.js';
import { formatZodError } from '../lib/validation.js';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: {
      message: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
    },
  });
};

function isSqliteConstraintError(error: unknown): error is { code: string; message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string' &&
    (error as { code: string }).code.startsWith('SQLITE_CONSTRAINT')
  );
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      error: {
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }),
      },
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        message: 'Dados inválidos.',
        details: { fields: formatZodError(error) },
      },
    });
    return;
  }

  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ error: { message: 'Corpo da requisição inválido (JSON malformado).' } });
    return;
  }

  if (isSqliteConstraintError(error)) {
    res.status(409).json({ error: { message: 'Operação viola uma restrição de integridade.' } });
    return;
  }

  console.error('[devtrack-api] Erro não tratado:', error);

  res.status(500).json({
    error: {
      message: 'Erro interno do servidor.',
    },
  });
};
