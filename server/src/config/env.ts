import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT ?? 4000),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  JWT_SECRET: process.env.JWT_SECRET ?? 'ridex-dev-secret',
  CLIENT_URL: process.env.CLIENT_URL ?? 'http://localhost:3000',
  USD_INR_RATE: Number(process.env.USD_INR_RATE ?? 83),
  NOMINATIM_BASE_URL: process.env.NOMINATIM_BASE_URL ?? 'https://nominatim.openstreetmap.org',
  NOMINATIM_USER_AGENT: process.env.NOMINATIM_USER_AGENT ?? 'RideX/1.0 (maps contact: support@ridex.example)',
  NOMINATIM_COUNTRYCODES: process.env.NOMINATIM_COUNTRYCODES,
  OSRM_BASE_URL: process.env.OSRM_BASE_URL ?? 'https://router.project-osrm.org',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? '',
};
