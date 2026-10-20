export {};

declare global {
  namespace Express {
    interface Request {
      /** Payload validado pelos middlewares de validação (zod). */
      valid: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }
  }
}
