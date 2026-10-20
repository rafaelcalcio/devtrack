import 'dotenv/config';

const DEFAULT_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

function parseOrigins(value: string | undefined): string[] {
  if (!value || value.trim() === '' || value.trim() === '*') {
    return DEFAULT_ORIGINS;
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function parsePort(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3333;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parsePort(process.env.PORT),
  databasePath: process.env.DATABASE_PATH ?? 'data/devtrack.db',
  corsOrigins: parseOrigins(process.env.CORS_ORIGIN),
  seedDemoData: process.env.SEED_DEMO_DATA === 'true',
} as const;

export type Env = typeof env;
