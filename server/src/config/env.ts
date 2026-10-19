import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT ?? 4000),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  JWT_SECRET: process.env.JWT_SECRET ?? 'ridex-dev-secret',
  CLIENT_URL: process.env.CLIENT_URL ?? 'http://localhost:3000',
};
