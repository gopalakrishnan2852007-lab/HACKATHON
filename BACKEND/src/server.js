// server.js – entry point; starts HTTP server and sensor simulator
import './config/env.js';          // validate env first
import app from './app.js';
import { ENV } from './config/env.js';
import { startSimulator } from './simulator/sensorSimulator.js';

const PORT = ENV.PORT;

const server = app.listen(PORT, () => {
  console.log(`\n✅  AIoT Backend running on http://localhost:${PORT}`);
  console.log(`   Supabase URL : ${ENV.SUPABASE_URL}`);
  console.log(`   Client URL   : ${ENV.CLIENT_URL}\n`);

  // Start the continuous sensor simulator
  startSimulator();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM received – shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('[SERVER] SIGINT received – shutting down gracefully');
  server.close(() => process.exit(0));
});

export default server;
