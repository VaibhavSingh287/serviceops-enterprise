# ServiceOps Enterprise

ServiceOps Enterprise is a digital service operations platform designed for industrial field service management, multi-step technical inspections, supervisor approval governance, and inventory tracking with full audit traceability.

---

## Business Problem

Industrial equipment maintenance and field service operations often struggle with manual, fragmented processes:

- **Paper-Based & Disconnected Job Sheets**: Field inspections frequently rely on paper forms or static spreadsheets, causing delays, illegible handwriting, incomplete inspection steps, and lost service records.
- **Lack of Governance & Approval Controls**: Without enforceable lifecycle gates, incomplete or non-compliant service reports bypass supervisory review, risking customer disputes and safety liabilities.
- **Siloed Team Visibility**: Service managers require strict oversight of their direct reports without exposing cross-team data or customer accounts.
- **Untracked Inventory Consumption**: Parts used during field repairs are often manually recorded, causing inventory discrepancies, unauthorized adjustments, and stockouts.
- **Absence of Audit Traceability**: Regulated industrial environments require an immutable record of every inspection finding, manager decision, revision request, and stock movement.

ServiceOps Enterprise addresses these challenges by providing a unified, role-governed platform with structured digital job cards, multi-tier supervisory workflows, real-time inventory adjustments with mandatory justifications, and end-to-end operational audit logging.

---

## Core Features

- **Guided Digital Job Card Workflow**: Multi-step editor covering customer info, equipment metadata, diagnostic checklists, replacement parts, work performed documentation, photo attachments, customer sign-off with digital signature capture, and printable job sheet generation.
- **Standardized Technical Inspection Checklists**: Pre-configured diagnostic checkpoints across Safety, Mechanical, Electrical, Operational, and Environmental categories with status tagging (`Completed`, `Issue Found`, `Not Applicable`, `Pending`) and severity classification (`Minor`, `Moderate`, `Critical`).
- **Supervisory Approval & Revision Management**: Managers can review submitted cards, request revisions with specific affected sections and instructions, approve completed jobs, or reject cards with required justification codes.
- **Inventory & Spare Parts Management**: Real-time SKU tracking, unit cost and price tracking, reorder alert thresholds, bin locations, and stock adjustments with mandatory business reasons and negative-stock safeguards.
- **Audit Logging & Revision History**: Comprehensive audit records capturing actors, timestamps, state transitions, managerial feedback, and inventory movements.
- **AI-Assisted Diagnostics (with Deterministic Fallback)**: Server-side AI assistance for drafting work summaries, auditing job cards for diagnostic inconsistencies, and recommending replacement parts from the inventory catalog. When an API key is not configured, deterministic rule-based algorithms ensure full offline availability.

---

## Role-Based Access Control (RBAC) & Team Boundaries

The system enforces strict multi-role authorization across four organizational tiers:

| Role | Operational Scope | Default Permissions |
| :--- | :--- | :--- |
| **Field Engineer** | Assigned Work Orders & On-Site Servicing | Create and edit assigned job cards; complete inspection checklists; record parts used; capture customer signatures; submit job cards for review; address and resubmit revision requests. Access is strictly scoped to assigned cards. |
| **Manager** | Team Supervision & Work Order Governance | Review submitted and resubmitted job cards for assigned direct reports; approve work orders; request revisions with affected sections and feedback; reject non-compliant cards with mandatory justification codes. Access is strictly bounded to the manager's assigned team. |
| **Operations** | Inventory Control & Commercial Oversight | View all job cards for pricing verification; manage parts catalog master data; perform stock level adjustments with mandatory audit reasons; view inventory movement history. |
| **Admin** | System Administration & Governance | Global visibility across all teams and cards; manage user accounts and active statuses; assign engineers to managers; reset user credentials; view system-wide audit logs; execute database resets. |

### Team Hierarchy & Boundary Enforcement

- Field Engineers are assigned to a specific Service Manager (e.g., Team North under `MGR-001`, Team South under `MGR-002`).
- Access rules are enforced server-side:
  - Engineers attempting to view or edit another engineer's job card receive `HTTP 403 Forbidden`.
  - Managers attempting to review, approve, request revisions on, or reject a job card from another team receive `HTTP 403 Forbidden`.
  - Scoped list endpoints (`/api/jobcards`, `/api/users`) filter data at the database level to match the user's role and team assignment.

*Refer to [DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md) for pre-seeded user accounts and organizational reporting structure.*

---

## Job Card Lifecycle & Workflow

Job cards transition through an enforced state machine:

```
 [Draft] ───► [In Progress] ───► [Pending Review] ───► [Approved] ───► [Completed]
    ▲                                │         ▲
    │                                ▼         │
    └────── [Changes Requested] ◄────┘         │
                   │                           │
                   └──────────► [Resubmitted] ─┘
                                     │
                                     ▼
                                [Rejected] (Terminal)
```

### Lifecycle States

1. **Draft**: Initial state upon job card creation. Field Engineers populate customer details, equipment metadata, diagnostic checklists, and parts.
2. **In Progress**: Active work phase as inspections and repairs proceed.
3. **Pending Review**: Field Engineer submits the completed job card. The system validates:
   - Customer and equipment records are populated
   - Work performed narrative contains at least 15 characters
   - All diagnostic checklist checkpoints are inspected (zero `Pending` items)
   - Customer sign-off is confirmed with a signee name and signature
4. **Changes Requested**: Manager identifies deficiencies during supervisory review. The manager must specify at least one affected section (e.g., Checklist, Parts, Work Summary) and detailed feedback notes.
5. **Resubmitted**: Field Engineer addresses the requested changes and resubmits the same job card. The card returns to the manager's review queue with updated revision history.
6. **Approved**: Manager authorizes the job card from `Pending Review` or `Resubmitted`. The card is locked against further engineer edits.
7. **Rejected**: Terminal state. Manager rejects the card with a required justification category code and explanation. The card is permanently locked.
8. **Completed**: Final operational closure after all field and supervisory requirements have been met.

### Lifecycle Enforcement Rules

- **Edit Protection**: Only cards in `Draft`, `In Progress`, or `Changes Requested` can be modified by engineers. Any PUT request on cards in `Pending Review`, `Approved`, `Rejected`, or `Completed` is rejected with `HTTP 403 Forbidden`.
- **Review Queue Integrity**: Approvals, revision requests, and rejections are only permitted on cards currently in `Pending Review` or `Resubmitted`.
- **Revision History**: Every submission, revision request, resubmission, approval, and rejection records an audit log entry with actor ID, role, timestamp, previous state, new state, and relevant feedback or justification.

---

## AI-Assisted Functionality

The platform provides optional AI-assisted features powered by the `@google/genai` SDK (`gemini-3.8-flash`), proxied exclusively through server-side endpoints to protect credentials:

1. **Service Summary Generation (`POST /api/ai/service-summary`)**: Synthesizes customer-reported symptoms, checklist faults, replacement parts, and technician notes into a structured narrative and actionable recommendations.
   - *Fallback*: Rule-based synthesis that formats reported symptoms, identified issues, and installed parts into a standardized technical summary without external API calls.
2. **Quality & Completeness Audit (`POST /api/ai/check-jobcard`)**: Evaluates job cards for missing mandatory data, symptom-to-repair inconsistencies (e.g., thermal overheating reported without cooling system checks), and catalog pricing variances.
   - *Fallback*: Deterministic heuristic checks analyzing required field completeness, symptom-to-work keyword consistency, checklist-to-parts correlation, and item-by-item price variance calculations.
3. **Inventory Part Suggestions (`POST /api/ai/suggest-parts`)**: Suggests relevant parts from available inventory based on equipment type and reported failure modes.
   - *Fallback*: Category and keyword-matching algorithm filtering inventory items based on equipment category and diagnostic keywords (e.g., filters, seals, sensors).

---

## Technology Stack

- **Frontend**:
  - React 19 (`react`, `react-dom`)
  - TypeScript 5.8
  - Tailwind CSS v4 (`@tailwindcss/vite`)
  - Vite 6
  - Motion (`motion`)
  - Lucide React (`lucide-react`)
- **Backend**:
  - Node.js 20+ runtime
  - Express 4 (`express`)
  - TypeScript compilation with `tsx` (development) and `esbuild` (production CJS bundle)
  - `bcryptjs` (password hashing with 10 salt rounds)
  - `@google/genai` (diagnostic assistance)
- **Data Persistence & Storage**:
  - In-memory relational state engine (`server/db.ts`) with pre-seeded datasets, foreign-key relationships, transactional stock ledger, and audit history.
  - Reset capability (`POST /api/system/reset`) for administrative re-initialization.

---

## Local Setup & Configuration

### Prerequisites

- **Node.js**: Version 20.0.0 or higher
- **Package Manager**: npm (bundled with Node.js)

### Installation

1. Clone the repository and navigate to the project root:
   ```bash
   git clone <repository-url>
   cd serviceops-enterprise
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

5. Sign in:
   Consult [DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md) for demonstration account IDs (`ENG-001`, `MGR-001`, `OPS-001`, `ADM-001`). Enter the password configured in `DEV_SEED_PASSWORD` (or default if left unset).

---

## Environment Variables

Configure the following variables in `.env`:

| Variable | Required | Description | Default |
| :--- | :--- | :--- | :--- |
| `DEV_SEED_PASSWORD` | Optional | Initial password applied to all seeded demo accounts during local development. | `ServiceOps@2026!` |
| `GEMINI_API_KEY` | Optional | API key for Gemini diagnostic features. If omitted, deterministic fallbacks handle all requests. | *None (Fallback active)* |
| `APP_URL` | Optional | Base URL where the application is hosted. | `http://localhost:3000` |

---

## Testing & Production Build

### Code Verification & Linting

Run TypeScript static type-checking:
```bash
npm run lint
```

### Automated Verification Tests

Run the test suite verifying lifecycle transitions, role boundaries, checklist workflows, and validation rules:
```bash
npm test
```

The test runner executes `test/sprint1.test.ts` covering:
- Job card lifecycle transitions and illegal transition guards
- Edit locking on `Pending Review`, `Approved`, and `Rejected` cards
- Mandatory fields for revision requests (affected sections + feedback notes)
- Mandatory fields for rejections (justification code + explanation)
- Resubmission routing to the manager review queue
- Audit trail recording for all transitions and actors
- Team boundary isolation for managers (cross-team `403 Forbidden`)
- Engineer isolation (cross-engineer `403 Forbidden`)
- Technical inspection checklist data flow, counter tracking, and submission validation

### Production Build & Run

1. Compile client assets and bundle the server:
   ```bash
   npm run build
   ```
   This generates the static Vite build in `dist/` and the server bundle in `dist/server.cjs`.

2. Start the production server:
   ```bash
   npm start
   ```

---

## Project Structure

```
├── server/
│   └── db.ts                   # In-memory database, RBAC checks, lifecycle state machine, audit logs
├── server.ts                   # Express server, authentication middleware, API routes, Vite middleware
├── src/
│   ├── components/
│   │   ├── common/             # Shared badges, status indicators, UI controls
│   │   ├── document/           # Printable job card summary and customer sign-off modal
│   │   ├── editor/             # Guided multi-step JobCardEditor for Field Engineers
│   │   ├── manager/            # Manager review workspace with approval, revision, and rejection actions
│   │   ├── views/              # Role-specific dashboards (Engineer, Manager, Operations, Admin, Inventory)
│   │   ├── Header.tsx          # Application header and user session controls
│   │   └── Sidebar.tsx         # Role-scoped primary navigation
│   ├── context/
│   │   └── AppContext.tsx      # Client application state, auth context, and API dispatchers
│   ├── data/
│   │   └── mockData.ts         # Initial seed dataset (users, equipment, customers, inventory, checklists)
│   ├── types.ts                # TypeScript definitions for entities, roles, and lifecycle states
│   ├── App.tsx                 # Root application component and view routing
│   ├── main.tsx                # React entry point
│   └── index.css               # Global Tailwind CSS styles
├── test/
│   └── sprint1.test.ts         # End-to-end API test suite for RBAC and workflow verification
├── DEMO_ACCOUNTS.md            # Directory of demonstration user accounts and team hierarchy
├── package.json                # Project dependencies, build scripts, and metadata
└── README.md                   # Project documentation
```

---

## Limitations & Future Improvements

- **In-Memory Storage**: The current implementation stores state in-memory on the server. Data resets on server restart unless re-seeded. Production deployment would transition to a persistent database (e.g., PostgreSQL or Cloud SQL).
- **Session Persistence**: Sessions are stored in-memory using secure session tokens. Integrating distributed session storage (e.g., Redis) or encrypted JWTs would support horizontal scaling.
- **Offline Sync**: While the frontend handles responsive user inputs and deterministic AI fallbacks, an offline-first Service Worker with local IndexedDB queueing would enable field technicians to operate in remote areas without active network connectivity.
- **PDF Export**: The document modal currently renders formatted HTML print views; direct server-side binary PDF generation via Puppeteer or PDFKit would enhance export capabilities.
- **Push Notifications**: Real-time notifications for manager revision requests and approval updates could be added via WebSockets or Server-Sent Events (SSE).
