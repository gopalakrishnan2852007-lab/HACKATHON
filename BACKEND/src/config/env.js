// config/env.js – centralised env validation at startup
import dotenv from 'dotenv';
dotenv.config();

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GEMINI_API_KEY'];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`[ENV] FATAL: missing required environment variable: ${key}`);
    process.exit(1);
  }
}

export const ENV = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  SIMULATOR_INTERVAL_MS: parseInt(process.env.SIMULATOR_INTERVAL_MS || '3000', 10),
  ANOMALY_DURATION_MS: parseInt(process.env.ANOMALY_DURATION_MS || '60000', 10),
};
