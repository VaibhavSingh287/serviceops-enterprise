# ServiceOps Enterprise

ServiceOps Enterprise is a web application for field service operations, multi-step technical inspections, supervisor approval workflows, and centralized inventory tracking with audit logging.

---

## In-Memory Storage & Persistence Notice

> **Important**: This application currently uses an **in-memory server-side state engine** (`server/db.ts`).
> - **Job cards** reset to seed data when the server restarts.
> - **Inventory levels and stock movements** reset when the server restarts.
> - **Audit history and revision logs** reset when the server restarts.
> - **User accounts and credentials** are re-initialized from seed definitions upon process restart.
> - An administrative endpoint (`POST /api/system/reset`) is available to re-seed the system state on demand.
>
> The project does not currently integrate an external database (such as PostgreSQL, MySQL, Cloud SQL, or Redis).

---

## Business Problem

Industrial equipment maintenance and field service operations often encounter workflow inefficiencies and compliance gaps:

- **Disconnected Job Sheets**: Field inspections frequently rely on paper forms or unstructured notes, leading to incomplete diagnostic records, delayed billing, and lost equipment history.
- **Lack of Approval Controls**: Without enforceable lifecycle gates, unverified or deficient service reports risk premature closure without supervisory review.
- **Cross-Team Access Risks**: Service managers need direct oversight of their assigned technical teams without unauthorized visibility into other service teams.
- **Uncontrolled Inventory Consumption**: Parts used during on-site repairs are often recorded inconsistently, creating inventory discrepancies, untracked stock adjustments, and unexpected stockouts.
- **Absence of Audit Traceability**: Industrial maintenance requires a verifiable trail of every inspection finding, manager decision, revision request, and inventory movement.

ServiceOps Enterprise addresses these challenges with structured digital job cards, multi-tier supervisory workflows, centralized inventory tracking with mandatory adjustment reasons, and server-side audit logging.

---

## Core Features

- **Guided Digital Job Card Workflow**: Multi-step editor covering customer information, equipment metadata, diagnostic inspection checkpoints, replacement parts, work performed documentation, photo attachments, customer sign-off with digital signature capture, and printable job summary sheets.
- **Technical Inspection Checklists**: Pre-configured diagnostic checkpoints across Safety, Mechanical, Electrical, Operational, and Environmental categories with status tagging (`Completed`, `Issue Found`, `Not Applicable`, `Pending`) and severity classification (`Minor`, `Moderate`, `Critical`).
- **Supervisory Approval & Revision Management**: Managers can review submitted cards, request revisions with specific affected sections and instructions, approve work orders, or reject cards with required justification codes.
- **Centralized Inventory Tracking**: Centralized inventory tracking with stock adjustments, negative-stock safeguards, mandatory business reasons, and audit history.
- **Audit Logging & Revision History**: Comprehensive audit records capturing actors, timestamps, state transitions, managerial feedback, and inventory movements.
- **Optional AI-Assisted Diagnostics (with Deterministic Fallback)**: Server-side AI assistance for drafting work summaries, auditing job cards for diagnostic inconsistencies, and recommending replacement parts from the inventory catalog. When an API key is not configured, deterministic rule-based algorithms handle all requests.

---

## Role-Based Access Control (RBAC) & Team Boundaries

The system enforces server-side authorization across four organizational roles:

| Role | Operational Scope | Default Permissions |
| :--- | :--- | :--- |
| **Field Engineer** | Assigned Work Orders & On-Site Servicing | Create and edit assigned job cards; complete inspection checklists; record parts used; capture customer signatures; submit job cards for review; address and resubmit revision requests. Access is restricted to assigned cards. |
| **Manager** | Team Supervision & Work Order Governance | Review submitted and resubmitted job cards for assigned direct reports; approve work orders; request revisions with affected sections and feedback; reject non-compliant cards with mandatory justification codes. Access is restricted to the manager's assigned team. |
| **Operations** | Inventory Control & Parts Oversight | View job cards for pricing verification; manage parts catalog master data; perform stock level adjustments with mandatory audit reasons; view inventory movement history. |
| **Admin** | System Administration & Governance | System-wide visibility across all teams and cards; manage user accounts and active statuses; assign engineers to managers; reset user passwords; view system audit logs; trigger database re-seeding. |

### Team Hierarchy & Boundary Enforcement

- Field Engineers are assigned to a specific Service Manager (e.g., Team North under `MGR-001`, Team South under `MGR-002`).
- Access rules are enforced server-side:
  - Field Engineers attempting to view or edit another engineer's job card receive `HTTP 403 Forbidden`.
  - Managers attempting to review, approve, request revisions on, or reject a job card from another team receive `HTTP 403 Forbidden`.
  - Scoped list endpoints (`/api/jobcards`, `/api/users`) filter data at the database level according to the authenticated user's role and team assignment.

*Refer to [DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md) for pre-seeded user accounts and team hierarchy.*

---

## Job Card Lifecycle & Workflow

Job cards transition through an enforced state machine:

```
        [Draft] <───────────────> [In Progress]
           │                             │
           └──────────────┬──────────────┘
                          │ (Submit)
                          ▼
                   [Pending Review] ──────────────────────┐
                    │            ▲                        │
       (Request     │            │ (Resubmit)             │ (Reject)
        Changes)    ▼            │                        ▼
     [Changes Requested] ──► [Resubmitted]           [Rejected] (Terminal)
                                 │
                                 │ (Approve)
                                 ▼
                             [Approved]
```

### Supported Lifecycle States

1. **Draft**: Initial state upon job card creation. Field Engineers enter customer details, equipment metadata, diagnostic checklists, and parts.
2. **In Progress**: Active servicing phase. Field Engineers can toggle cards between `Draft` and `In Progress`.
3. **Pending Review**: Field Engineer submits the completed job card. The server validates that:
   - Customer and equipment records are selected
   - Work performed narrative contains at least 15 characters
   - All diagnostic checklist checkpoints are inspected (zero `Pending` items)
   - Customer sign-off is confirmed with a signee name and signature
4. **Changes Requested**: Manager requests revisions during review. The manager must provide at least one affected section (e.g., Checklist, Parts, Work Summary) and specific feedback notes.
5. **Resubmitted**: Field Engineer addresses the requested changes and resubmits the card. The card returns to the manager's review queue with updated revision tracking.
6. **Approved**: Manager authorizes the job card from `Pending Review` or `Resubmitted`. The card is locked against further engineer edits.
7. **Rejected**: Terminal state. Manager rejects the card from `Pending Review` or `Resubmitted` with a required justification category code and explanation. The card is permanently locked.

*Note on `Completed`*: The `Completed` status exists in the system type definitions and as an archived status in seed data (e.g., `JC-2026-0042`), and can be assigned by Administrators. However, standard operational workflows conclude with supervisory authorization at `Approved` (or termination at `Rejected`).

### Lifecycle Enforcement & Edit-Locking Rules

- **Edit Permissions**: Field Engineers can only modify their own job cards when in `Draft`, `In Progress`, or `Changes Requested` status.
- **Review Queue Locking**: Cards in `Pending Review` or `Resubmitted` status are locked against engineer modifications (`HTTP 403 Forbidden`) while awaiting supervisory decision.
- **Finalized Status Locking**: Cards in `Approved`, `Rejected`, or `Completed` status cannot be modified by engineers or managers (`HTTP 403 Forbidden`).
- **Supervisory Constraints**: Approvals, revision requests, and rejections are only accepted on cards currently in `Pending Review` or `Resubmitted` status.
- **Audit Logging**: Every state transition records an entry with actor ID, role, timestamp, previous state, new state, and associated feedback or justification.

---

## AI-Assisted Functionality

The application includes optional AI assistance using the `@google/genai` TypeScript SDK with the `gemini-3.8-flash` model. All AI calls are executed server-side to protect credentials:

1. **Service Summary Generation (`POST /api/ai/service-summary`)**: Synthesizes customer-reported symptoms, checklist faults, replacement parts, and technician notes into a structured work performed narrative and maintenance recommendations.
   - *Deterministic Fallback*: When `GEMINI_API_KEY` is unset or omitted, formats reported symptoms, identified issues, and installed parts into a standardized technical summary without external API calls.
2. **Job Card Quality Audit (`POST /api/ai/check-jobcard`)**: Evaluates job cards for missing required data, symptom-to-repair diagnostic discrepancies (e.g., thermal overheating reported without cooling system checks), and catalog pricing variances.
   - *Deterministic Fallback*: Evaluates mandatory field completeness, flags inventory pricing variances against master catalog prices, and runs keyword-based diagnostic consistency checks.
3. **Inventory Part Suggestions (`POST /api/ai/suggest-parts`)**: Suggests applicable spare parts from available inventory based on equipment type and reported symptoms.
   - *Deterministic Fallback*: Keyword and category matching algorithm filtering inventory items by equipment category and diagnostic terms (e.g., filters, seals, gaskets, sensors).

When no `GEMINI_API_KEY` is provided, all AI endpoints automatically use deterministic fallback handlers, ensuring full application functionality offline or without API keys.

---

## Security & Authentication

- **Password Hashing**: User passwords are stored using salted `bcryptjs` password hashes with 10 salt rounds.
- **Session Management**: Authenticated sessions use 24-hour in-memory session tokens generated via `crypto.randomBytes(32).toString('hex')`. Tokens are transmitted via `Authorization: Bearer <token>` headers or `serviceops_session` HttpOnly cookies.
- **Server-Side Authorization**: Every API route validates user session validity, role permissions, and team ownership before processing reads or mutations.
- **Audit Logging**: Critical system events (logins, failed authentication attempts, job card updates, state transitions, stock adjustments, role modifications) are written to an internal audit ledger.

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
  - TypeScript execution with `tsx` (development) and bundling with `esbuild` (production CommonJS)
  - `bcryptjs` (password hashing)
  - `@google/genai` (diagnostic assistance)
- **Data Persistence**:
  - In-memory state engine (`server/db.ts`) with seed data, foreign-key relationships, stock ledger, and audit history.

---

## Local Setup & Configuration

### Prerequisites

- **Node.js**: Version 20.0.0 or higher
- **Package Manager**: npm (bundled with Node.js)

### Installation

1. Clone the repository and navigate to the project directory:
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
   Consult [DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md) for demonstration account IDs (`ENG-001`, `MGR-001`, `OPS-001`, `ADM-001`) and the default password configuration.

---

## Environment Variables

Configure the following variables in `.env`:

| Variable | Required | Description | Default |
| :--- | :--- | :--- | :--- |
| `DEV_SEED_PASSWORD` | Optional | Password applied to seeded demo accounts during local development. | `ServiceOps@2026!` |
| `GEMINI_API_KEY` | Optional | API key for Gemini features. If omitted, deterministic fallbacks handle all requests. | *None (Fallback active)* |
| `APP_URL` | Optional | Base URL where the application is hosted. | `http://localhost:3000` |

---

## Testing & Production Build

### Code Verification & Linting

Run TypeScript static type checking:
```bash
npm run lint
```

### Automated Verification Tests

Run the test suite verifying lifecycle transitions, role boundaries, checklist workflows, and validation rules:
```bash
npm test
```

The test runner executes `test/sprint1.test.ts`, verifying:
- Job card lifecycle transitions and invalid transition guards
- Edit locking on `Pending Review`, `Approved`, and `Rejected` cards
- Mandatory requirements for revision requests (affected sections and feedback notes)
- Mandatory requirements for rejections (justification code and explanation)
- Resubmission routing to the manager review queue
- Audit trail recording for all transitions and actors
- Team boundary isolation for managers (cross-team `HTTP 403 Forbidden`)
- Engineer isolation (cross-engineer `HTTP 403 Forbidden`)
- Technical inspection checklist data flow, completion counters, and submission validation

### Production Build & Run

1. Compile client assets and bundle the server:
   ```bash
   npm run build
   ```
   This generates static Vite assets in `dist/` and compiles the backend server to `dist/server.cjs`.

2. Start the production server:
   ```bash
   npm start
   ```

---

## Project Structure

```
├── server/
│   └── db.ts                   # In-memory database, RBAC enforcement, lifecycle state machine, audit logs
├── server.ts                   # Express server, authentication middleware, API routes, Vite middleware
├── src/
│   ├── components/
│   │   ├── common/             # Shared status badges and UI indicators
│   │   ├── document/           # Printable job card summary and customer sign-off modal
│   │   ├── editor/             # Multi-step JobCardEditor for Field Engineers
│   │   ├── manager/            # Manager review workspace for approvals, revisions, and rejections
│   │   ├── views/              # Role-specific dashboard views (Engineer, Manager, Operations, Admin)
│   │   ├── Header.tsx          # Application header and user session controls
│   │   └── Sidebar.tsx         # Role-scoped primary navigation
│   ├── context/
│   │   └── AppContext.tsx      # Client application state, authentication context, and API dispatchers
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

## Known Limitations & Future Improvements

- **In-Memory Storage**: Application state is currently maintained in-memory on the server. Data resets when the server process restarts. Integrating an external database (such as PostgreSQL) would provide persistent storage across restarts.
- **Distributed Sessions**: Sessions are currently stored in server memory. Introducing a distributed session store (e.g., Redis) or stateless tokens would support horizontal scaling across multiple instances.
- **Offline Synchronization**: Field engineers operating in low-connectivity areas would benefit from local IndexedDB caching and background synchronization via a Service Worker.
- **PDF Generation**: The application currently provides browser-based printable HTML job sheets; direct server-side PDF generation would enhance export consistency.
