# ResQCloud — Cloud-Based Disaster Management & Resilient Emergency Communication Platform

> **Academic Review Demonstration Prototype**  
> Developed for college project review. Designed to demonstrate **offline-first emergency SOS reporting, idempotent synchronization, real-time tactical dispatch, GIS incident mapping, and conceptual multi-hop DTN relay simulation**.

---

## 1. Project Overview

During catastrophic natural disasters (floods, landslides, severe earthquakes, cyclones, and fires), primary terrestrial cellular towers and fiber backbones suffer power failures and routing collapse. Traditional web-based emergency reporting systems drop data when connection is lost during submission.

**ResQCloud** bridges this critical gap through a two-tier resilience architecture:
1. **Genuine Client-Side Offline Persistence**: When network connectivity fails or becomes intermittent, emergency reports are saved into browser-native **IndexedDB** with client-generated UUIDs.
2. **Idempotent Retry Synchronization**: As soon as any connection returns, a bounded exponential backoff engine flushes pending reports to the centralized API without creating duplicate records.
3. **Tactical Rescue Coordination**: Connected rescue teams triage, prioritize, assign, and update emergency status in real-time via Socket.IO and Leaflet GIS mapping.
4. **Delay-Tolerant Multi-Hop Relay Simulator**: An interactive simulation demonstrating how future BLE/Wi-Fi Direct peer-to-peer ad-hoc forwarding transports messages to internet gateways.

---

## 2. Features Implemented

### Citizen SOS Portal (`/citizen`)
- **Emergency Submission**: Full input validation for Disaster Category, Title, Situation Description, Affected People count, Severity, Location, and Trapped / Medical Assistance flags.
- **Hardware GPS Geolocation**: User-initiated browser Geolocation API with graceful fallback to manual location descriptions and coordinates. No fabricated coordinates.
- **Offline Resilience**: Offline status banner when disconnected. All unsent reports are preserved in IndexedDB under `LOCAL_PENDING` status.
- **Idempotent Auto-Sync**: Background listener synchronizes reports upon `window.online` events or manual "Sync Now" button.
- **Incident History**: Citizens can view past tickets and inspect chronological status history.

### Tactical Rescue Command Dashboard (`/rescue/dashboard`)
- **Real-Time KPIs**: Dynamic counts for Total Incidents, Active Incidents, Critical Incidents, Awaiting Review, and Resolved Incidents (computed directly from database).
- **Dispatch Queue**: Recent emergency table with severity indicators, people trapped warnings, and rapid triage triggers.
- **Live Dispatch Stream**: Dual Socket.IO engine with automated REST polling fallback if WebSocket connection drops.

### Live Incident Management Table (`/rescue/incidents`)
- **Multi-Filter & Search**: Instant filtering by disaster type, severity level, status, and Pune region, with full text search.
- **Validated State Machine**: Strict permitted state transitions (`PENDING_REVIEW` &rarr; `ACKNOWLEDGED` &rarr; `IN_PROGRESS` &rarr; `RESOLVED` / `CANCELLED`).
- **Audit Logging**: Every status transition, priority update, operator assignment, and note is permanently recorded in the database audit log.
- **Detail Modal**: Multi-tab modal displaying incident overview, status transition log, and tactical internal response notes.

### Interactive Disaster GIS Map (`/rescue/map`)
- **Leaflet & OpenStreetMap**: Full-page interactive map plotted across the Pune Metropolitan Region.
- **Severity-Coded Markers**: Critical (Red with pulsating radar beacon), High (Orange), Medium (Yellow), Low (Blue).
- **Incident Popups**: Interactive details popup with direct "View Tactical Details" button.
- **Missing GPS Drawer**: Gracefully lists incidents lacking coordinate data in a separate drawer without inventing fake markers.
- **Demonstration Banner**: Clearly marked `DEMO DATA: PUNE METROPOLITAN REGION`.

### Offline Multi-Hop Relay Simulator (`/rescue/relay-simulator`)
- **Store-and-Forward Topology**: Visually models: Source Citizen Device &rarr; Relay Node A (Volunteer Phone) &rarr; Relay Node B (Rescue Vehicle) &rarr; SATCOM Gateway &rarr; Cloud API.
- **Fault Injection Controls**: Toggle direct cellular link, intermediary nodes, and satellite gateway reachability.
- **Packet Telemetry**: Step-by-step forwarding animation with synthetic latency, hop counter, and event log.
- **Non-Invasive**: Entirely simulated; does not pollute production incident database.

### Emergency Telemetry & Analytics (`/rescue/analytics`)
- **Recharts Data Visualizations**:
  - Incidents by Disaster Category (Bar Chart).
  - Incidents by Severity Distribution (Donut Chart).
  - Incidents by Pune Region (Regional Distribution Bar Chart).
  - Daily Incident Timeline Trends (Line Chart).
- **Computed Operational Metrics**: Total affected citizens, average report-to-server sync latency, and average triage-to-resolution duration.

---

## 3. Technology Stack & Architecture

```
ResQcloud/
├── client/                     # Frontend (React 18, Vite, TypeScript, Tailwind CSS)
│   ├── src/
│   │   ├── components/         # Common, Map, Rescue UI components
│   │   ├── context/            # AuthContext & OfflineContext
│   │   ├── offline/            # IndexedDB idb store & syncManager
│   │   ├── pages/              # Landing, Citizen, Rescue, Analytics, Map, Simulator
│   │   ├── services/           # API fetch client & Socket.IO
│   │   └── types/              # Unified TypeScript definitions
├── server/                     # Backend API (Node.js, Express, TypeScript, Prisma)
│   ├── src/
│   │   ├── controllers/        # Auth, Incident, Sync, Analytics, Health
│   │   ├── middleware/         # Auth (JWT cookies), RBAC, RateLimit, Zod
│   │   ├── routes/             # REST endpoints
│   │   ├── sockets/            # Socket.IO room broadcaster
│   │   └── tests/              # Automated backend test suite
│   ├── prisma/
│   │   ├── schema.prisma       # Active SQLite / Dev schema
│   │   ├── schema.postgresql.prisma # Production PostgreSQL schema
│   │   └── seed.ts             # Deterministic Pune demonstration seed
├── docker-compose.yml          # Optional containerized PostgreSQL 16
├── .env.example                # Configuration template
└── README.md                   # Full documentation
```

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Leaflet, Recharts, Socket.IO Client, `idb` (IndexedDB).
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, Socket.IO, `bcryptjs`, `jsonwebtoken`, `zod`, `cookie-parser`, `express-rate-limit`.
- **Database**: Relational SQLite for zero-friction out-of-the-box local review, with PostgreSQL schema & Docker Compose configuration provided for production deployments.

---

## 4. Getting Started & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended).
- **npm**: v9.0.0 or higher.
- *(Optional)* Docker & Docker Compose if running PostgreSQL container.

### Step 1: Install Dependencies
From the project root:
```bash
# Install root orchestration tools
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
cd ..
```

### Step 2: Database Setup & Seeding
The project is pre-configured with a persistent SQLite database (`dev.db`) for immediate evaluation.
To generate Prisma clients and seed the database with fictional Pune disaster incidents:

```bash
# Generate Prisma Client & Push Schema
npm run db:generate
npm run db:push

# Seed Demonstration Dataset (Safe to run multiple times)
npm run db:seed
```

### Step 3: Run the Application
You can run both client and server concurrently from the root directory:
```bash
npm run dev
```

Or run them in separate terminal tabs:
```bash
# Terminal 1: Backend Server (Port 5000)
npm run dev:server

# Terminal 2: Frontend Client (Port 5173)
npm run dev:client
```

Open your browser at: **`http://localhost:5173`**

---

## 5. Demonstration Review Credentials

For evaluator convenience, **1-Click Autofill Buttons** are integrated on the `/login` page:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Rescue Operator** | `operator@resqcloud.org` | `Operator@123` | Rescue Dashboard, Map, Incident Management, Analytics |
| **Rescue Officer 2**| `ananya@resqcloud.org` | `Operator@123` | Field Operations, Incident Triage |
| **Disaster Admin**   | `admin@resqcloud.org` | `Admin@123` | Full Administrative Command & Override |
| **Citizen Reporter** | `citizen@resqcloud.org` | `Citizen@123` | Citizen SOS Dispatch & Personal Incident History |
| **Citizen Reporter 2**| `priya@resqcloud.org` | `Citizen@123` | Citizen SOS Dispatch |

---

## 6. Verification & Automated Testing

An automated backend test suite is included in `server/src/tests/runTests.ts` covering all 10 required operational verification points:
1. Citizen Registration.
2. Login and Logout.
3. Unauthorized Access Rejection (401).
4. Valid Incident Creation & Status Initialization (`PENDING_REVIEW`).
5. Incident Ownership Restrictions.
6. Rescue Operator Status Updates (`ACKNOWLEDGED`).
7. Invalid Status Transition Rejection (400) & Unauthorized Citizen Updates (403).
8. Duplicate Synchronization Handling (Idempotency verification).
9. Chronological Status History Creation.
10. Validation of Malformed Requests (Zod 400).

To execute the test suite:
```bash
npm run test:server
# Result: 24 PASSED, 0 FAILED
```

---

## 7. API Specification Overview

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public (Rate Limited) | Register a new Citizen account |
| `POST` | `/api/auth/login` | Public (Rate Limited) | Authenticate user, set HTTP-only cookie & return JWT |
| `POST` | `/api/auth/logout` | Authenticated | Clear authentication cookie |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile |
| `GET` | `/api/health` | Public | System uptime & database connection status |
| `POST` | `/api/incidents` | Authenticated | Create emergency report (idempotent via `clientIncidentId`) |
| `GET` | `/api/incidents` | Authenticated | List incidents (filtered by type, severity, status, region) |
| `GET` | `/api/incidents/:id` | Authenticated | Retrieve single incident details, history & notes |
| `PATCH`| `/api/incidents/:id/status` | Rescue Operator / Admin | Transition incident status with audit log |
| `PATCH`| `/api/incidents/:id/priority` | Rescue Operator / Admin | Update incident severity level |
| `PATCH`| `/api/incidents/:id/assignment`| Rescue Operator / Admin | Assign operator to incident |
| `POST` | `/api/incidents/:id/notes` | Rescue Operator / Admin | Add internal tactical response note |
| `GET` | `/api/incidents/:id/history` | Authenticated | Retrieve status transition history timeline |
| `POST` | `/api/incidents/sync` | Authenticated | Batch idempotent synchronization of offline reports |
| `GET` | `/api/analytics/overview` | Authenticated | Overall incident counts and latency metrics |
| `GET` | `/api/analytics/by-type` | Authenticated | Grouped counts by disaster category |
| `GET` | `/api/analytics/by-severity` | Authenticated | Grouped counts by severity level |
| `GET` | `/api/analytics/by-region` | Authenticated | Grouped counts by Pune region |
| `GET` | `/api/analytics/trends` | Authenticated | Daily incident timeline trends |

---

## 8. Offline Resilience & Synchronization Mechanics

```
Citizen Form
    │
    ├─► [Network Available?]
    │        ├── YES ──► POST /api/incidents ──► Database Receipt ──► Socket.IO Broadcast
    │        │
    │        └── NO (or 5xx / timeout)
    │                 │
    │                 ▼
    │          IndexedDB Store ("resqcloud_offline_store_v1")
    │          State: LOCAL_PENDING
    │                 │
    │                 ▼
    │          [Browser returns Online / Manual "Sync Now"]
    │                 │
    │                 ▼
    │          SyncManager Batch Engine
    │          POST /api/incidents/sync
    │                 │
    │                 ├── Duplicate Detected (Idempotent UUID) ──► Mark SERVER_RECEIVED
    │                 └── New Ticket Inserted ─────────────────► Mark SERVER_RECEIVED
```

1. **Client-Generated UUID**: Each incident is assigned `resq-${crypto.randomUUID()}` at creation time.
2. **Preserved Timestamp**: The local creation timestamp is retained even if synchronization occurs hours later.
3. **Idempotency Guarantee**: If a network packet is transmitted multiple times due to retries, the backend detects the existing `clientIncidentId` and confirms receipt without duplicate insertion.
4. **Bounded Exponential Backoff**: Failed requests retry on an exponential delay curve capped at 30 seconds to prevent network thrashing.

---

## 9. Relay Simulator Limitations & Disclaimers

- **Simulation Mode**: The Relay Simulator (`/rescue/relay-simulator`) is a **visual model** of multi-hop Delay-Tolerant Networking (DTN). It does **not** inject simulated packets into the real database or create fake WebSocket emergencies.
- **Physical Hardware Requirement**: In real-world deployments, peer-to-peer forwarding between disconnected smartphones requires native Android/iOS background services utilizing Bluetooth Low Energy (BLE) or Wi-Fi Direct. Standard web browser security sandboxes do not permit low-level ad-hoc radio broadcasting.

---

## 10. PostgreSQL Production Deployment (Optional)

To run the platform using PostgreSQL instead of SQLite:
1. Start the PostgreSQL container:
   ```bash
   docker compose up -d
   ```
2. In `server/.env`, update the `DATABASE_URL`:
   ```env
   DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/resqcloud?schema=public"
   ```
3. Copy the PostgreSQL Prisma schema:
   ```bash
   cp server/prisma/schema.postgresql.prisma server/prisma/schema.prisma
   npm run db:push
   npm run db:seed
   ```

---

## 11. Security & Privacy Safeguards

- **HTTP-Only Cookies**: Authentication JWTs are stored in `httpOnly`, `sameSite: 'lax'` cookies to prevent XSS exfiltration.
- **Role-Based Access Control**: Sensitive triage operations (`/status`, `/priority`, `/assignment`) strictly verify `RESCUE_OPERATOR` or `ADMIN` roles. Citizens are forbidden from altering rescue team state.
- **Audit Trails**: All status transitions, operator reassignments, and logins create append-only audit log entries.
- **Rate Limiting**: Authentication endpoints are rate-limited to 30 requests per 15 minutes per IP.
- **Password Security**: Passwords hashed with `bcryptjs` (salt rounds: 10).
- **Academic Notice**: Prominent disclaimers remind users that this prototype is an educational demonstration and not an official 911/112 emergency service.

---

## 12. Faculty Review Demonstration Guide

To demonstrate the platform to review panel members:
1. **Landing Page (`/`)**: Show the hero section, the explanation of the disaster communication challenge, supported categories, and architecture overview.
2. **Citizen SOS Submission (`/citizen`)**:
   - Fill out an emergency report (e.g., Flood in Deccan Gymkhana).
   - Click "Detect My Location" to show real browser Geolocation API interaction.
   - Click "TRANSMIT EMERGENCY SOS" to demonstrate instant server receipt.
3. **Offline Mode Demonstration**:
   - Open Chrome DevTools &rarr; Network tab &rarr; Toggle "Offline".
   - Notice the top banner changes immediately to **"OFFLINE MODE ACTIVE"**.
   - Submit another report (e.g., Fire in Hinjawadi).
   - Observe that the report is preserved in the local queue with status `Stored Locally (Pending Sync)`.
   - Toggle Network back to "Online" and click "Sync Now".
   - Watch the report synchronize cleanly with the backend without duplicates.
4. **Rescue Command Desk (`/rescue/dashboard`)**:
   - Click "Rescue Operator" 1-click login on `/login`.
   - Inspect the live KPI metric cards (Total, Active, Critical, Awaiting Review, Resolved).
   - Click "Review" on any incident to open the **Validated State Engine Modal**.
   - Acknowledge the incident and transition it to "In Progress" with a tactical note.
   - Inspect the "Status Transition Log" tab to verify permanent audit tracking.
5. **Interactive GIS Map (`/rescue/map`)**:
   - Filter by severity (Critical / High) and disaster category.
   - Click incident markers across Pune to inspect live popups.
6. **Multi-Hop Relay Simulator (`/rescue/relay-simulator`)**:
   - Press "Start Simulation" to demonstrate step-by-step store-and-forward packet transmission.
   - Toggle "Relay Node A" or "Gateway" to show simulated network severance and buffering.
7. **Emergency Analytics (`/rescue/analytics`)**:
   - Review Recharts distribution graphs generated from database records.
