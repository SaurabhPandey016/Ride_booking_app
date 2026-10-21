import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV ?? 'development';
const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:3000';
const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? '';
const jwtSecret = process.env.JWT_SECRET ?? 'ridex-dev-secret';
const nominatimUserAgent =
  process.env.NOMINATIM_USER_AGENT ??
  'RideX/1.0 (maps contact: support@ridex.example)';

if (nodeEnv === 'production') {
  const requiredValues = {
    CLIENT_URL: clientUrl,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    NOMINATIM_USER_AGENT: process.env.NOMINATIM_USER_AGENT,
    STRIPE_SECRET_KEY: stripeSecretKey,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  };
  const missingValues = Object.entries(requiredValues)
    .filter(([, value]) => !value?.trim())
    .map(([name]) => name);

  let validClientOrigin = false;
  try {
    const parsedClientUrl = new URL(clientUrl);
    validClientOrigin =
      parsedClientUrl.protocol === 'https:' &&
      parsedClientUrl.origin === clientUrl;
  } catch {
    validClientOrigin = false;
  }

  if (jwtSecret.length < 32) {
    missingValues.push('JWT_SECRET (must contain at least 32 characters)');
  }
  if (!validClientOrigin) {
    missingValues.push('CLIENT_URL (must be an HTTPS origin without a path)');
  }
  if (!nominatimUserAgent.includes('@')) {
    missingValues.push('NOMINATIM_USER_AGENT (include a real contact email)');
  }
  if (!stripeSecretKey.startsWith('sk_test_')) {
    missingValues.push('STRIPE_SECRET_KEY (RideX currently supports Stripe test mode)');
  }
  if (missingValues.length > 0) {
    throw new Error(
      `Invalid production environment configuration: ${[...new Set(missingValues)].join(', ')}`,
    );
  }
}

export const env = {
  PORT: Number(process.env.PORT ?? 4000),
  NODE_ENV: nodeEnv,
  JWT_SECRET: jwtSecret,
  CLIENT_URL: clientUrl,
  USD_INR_RATE: Number(process.env.USD_INR_RATE ?? 83),
  NOMINATIM_BASE_URL: process.env.NOMINATIM_BASE_URL ?? 'https://nominatim.openstreetmap.org',
  NOMINATIM_USER_AGENT: nominatimUserAgent,
  NOMINATIM_COUNTRYCODES: process.env.NOMINATIM_COUNTRYCODES,
  OSRM_BASE_URL: process.env.OSRM_BASE_URL ?? 'https://router.project-osrm.org',
  STRIPE_SECRET_KEY: stripeSecretKey,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? '',
};
