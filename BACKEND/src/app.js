// app.js – Express app factory (no server.listen here)
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import healthRoutes from './routes/healthRoutes.js';
import machineRoutes from './routes/machineRoutes.js';
import predictionRoutes from './routes/predictionRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import simulatorRoutes from './routes/simulatorRoutes.js';

import { ENV } from './config/env.js';

const app = express();

// ── CORS ────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, mobile apps)
    if (!origin) return callback(null, true);
    // Allow any localhost port for hackathon dev flexibility
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    // Allow the explicitly configured client URL
    if (origin === ENV.CLIENT_URL) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── Body parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ── Request logging ──────────────────────────────────────────
app.use(morgan('dev'));

// ── Rate limiting ────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please slow down.' },
});
app.use('/api/', limiter);

// ── Routes ────────────────────────────────────────────────────
app.use('/api', healthRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/simulator', simulatorRoutes);

// ── 404 fallback ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Global error handler ─────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[APP ERROR]', err.message);
  const status = err.status || 500;
  res.status(status).json({ success: false, error: err.message || 'Internal server error' });
});

export default app;
