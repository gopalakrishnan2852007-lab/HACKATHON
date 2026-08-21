# ============================================================
# AIoT Machine Health Monitoring – Backend README
# ============================================================

# AIoT Machine Health Monitoring & Analytics Platform — Backend

## Overview

A production-ready Node.js/Express backend powering the AIoT Machine Health Monitoring platform.

**Architecture:**
```
Sensor Simulator → Ingestion → Validation → Supabase PostgreSQL
→ Anomaly Detection → Failure Probability → AI Reasoning (Gemini)
→ Alert Engine → Maintenance Records → Supabase Realtime → Frontend
```

**Key principle:** All numerical analysis (anomaly scores, failure probability) is **deterministic**. Gemini is only used for natural-language explanations and recommendations — so the system remains fully functional even if the AI API is unavailable.

---

## Prerequisites

- Node.js >= 18
- A [Supabase](https://supabase.com) project (free tier is fine)
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

---

## Quick Start

### 1. Install dependencies

```bash
cd BACKEND
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in:

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL (Settings → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Service role** key (never expose to frontend) |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `PORT` | Express port (default: 5000) |
| `CLIENT_URL` | Frontend origin for CORS (e.g. `http://localhost:5173`) |
| `SIMULATOR_INTERVAL_MS` | Sensor tick rate in ms (default: 3000) |
| `ANOMALY_DURATION_MS` | How long injected anomalies last (default: 60000) |

### 3. Set up Supabase database

1. Open your [Supabase Dashboard](https://app.supabase.com) → **SQL Editor**
2. Paste and run `supabase/schema.sql` — creates all tables and indexes
3. Paste and run `supabase/seed.sql` — inserts 8 machines and sample data

### 4. Enable Supabase Realtime

In Supabase Dashboard:
1. Go to **Database → Replication**
2. Find the `supabase_realtime` publication
3. Toggle **ON** for these tables:
   - `machines`
   - `sensor_readings`
   - `predictions`
   - `alerts`
   - `maintenance`

### 5. Run the backend

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

Server starts at `http://localhost:5000`. The sensor simulator begins immediately.

---

## API Endpoints

All responses follow:
```json
{ "success": true, "data": {} }
{ "success": false, "error": "..." }
```

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server + Supabase health check |
| GET | `/api/machines` | List all 8 machines |
| GET | `/api/machines/:id` | Single machine detail |
| GET | `/api/machines/:id/history?hours=24` | Sensor history |
| GET | `/api/alerts` | List alerts (filter: `?status=active&severity=critical`) |
| PATCH | `/api/alerts/:id` | Update alert status |
| GET | `/api/maintenance` | List maintenance records |
| PATCH | `/api/maintenance/:id` | Update maintenance status |
| GET | `/api/analytics/:machineId?hours=24` | Historical analytics for Recharts |
| POST | `/api/predictions/analyze` | Ingest sensor reading + run full pipeline |
| POST | `/api/simulator/predict` | One-shot prediction (no DB storage) |
| POST | `/api/simulator/inject-anomaly/:machineId` | Inject critical failure demo |
| GET | `/api/simulator/status` | Current anomaly states |

---

## Demo: Critical Failure Injection (M-07)

This is the hackathon live-demo sequence:

```bash
# 1. Confirm M-07 is healthy
curl http://localhost:5000/api/machines/a1b2c3d4-0007-0007-0007-000000000007

# 2. Inject anomaly (60 second deterioration)
curl -X POST http://localhost:5000/api/simulator/inject-anomaly/a1b2c3d4-0007-0007-0007-000000000007 \
  -H "Content-Type: application/json" \
  -d '{"durationMs": 60000}'

# 3. Watch alerts appear
curl http://localhost:5000/api/alerts

# 4. Watch maintenance records
curl http://localhost:5000/api/maintenance
```

The frontend will receive all updates via **Supabase Realtime** without any polling or refresh.

---

## Supabase Realtime Events

The frontend subscribes to these channels:

| Table | Events | Frontend use |
|---|---|---|
| `machines` | UPDATE | Live health score, status badge |
| `sensor_readings` | INSERT | Real-time sensor charts |
| `predictions` | INSERT | Anomaly score, failure probability |
| `alerts` | INSERT, UPDATE | Alert panel, notification badge |
| `maintenance` | INSERT, UPDATE | Maintenance queue |

Frontend example (JavaScript):
```js
supabase
  .channel('machines-channel')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'machines' }, payload => {
    // update dashboard
  })
  .subscribe()
```

---

## Architecture Notes

### Anomaly Detection (100% deterministic)
- Absolute threshold check (raw value limits)
- Baseline deviation ratio (per-machine normal values)
- Rate-of-change spike detection (between consecutive ticks)
- Multi-sensor combination penalty

### Failure Probability Calculation
- Weighted combination of per-sensor deviations
- Trend detection (simultaneous temperature + vibration rise)
- Output: 0–1 probability with risk level label

### Health Score Formula
```
healthScore = 100 − (failureProbability × 70 + anomalyScore × 30)
```
- 90–100: Healthy
- 70–89: Warning
- 40–69: High Risk
- 0–39: Critical

### Gemini AI Reasoning
- Only called when `failureProbability >= 0.40`
- Returns: possibleCause, explanation, recommendation, confidence, priority
- Has 15-second timeout with deterministic fallback
- **System never breaks if Gemini is unavailable**

### Alert Cooldown
- 5-minute cooldown per machine per risk level
- New critical state always creates a fresh alert
- Prevents alert flooding during continuous simulation

---

## Machine IDs (for API calls)

| Machine | UUID |
|---|---|
| CNC Mill M-01 | `a1b2c3d4-0001-0001-0001-000000000001` |
| Hydraulic Press M-02 | `a1b2c3d4-0002-0002-0002-000000000002` |
| Conveyor Belt M-03 | `a1b2c3d4-0003-0003-0003-000000000003` |
| Air Compressor M-04 | `a1b2c3d4-0004-0004-0004-000000000004` |
| Pump Station M-05 | `a1b2c3d4-0005-0005-0005-000000000005` |
| Lathe Machine M-06 | `a1b2c3d4-0006-0006-0006-000000000006` |
| **Industrial Fan M-07** | `a1b2c3d4-0007-0007-0007-000000000007` |
| Injection Molder M-08 | `a1b2c3d4-0008-0008-0008-000000000008` |
