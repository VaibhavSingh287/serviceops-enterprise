# ServiceOps Enterprise

**ServiceOps Enterprise** is a mission-critical digital service operations platform engineered for industrial field service management, equipment inspection workflows, tiered commercial pricing controls, role-based approval governance, and AI-assisted diagnostic decision support.

---

## Key Capabilities

- **Field Service Operations & Digital Job Cards**: End-to-end management of field service interventions, inspection checklists, visual photo capture with fault tagging, customer acceptance signatures, and PDF-ready job sheet summaries.
- **Tiered Approval & Supervisory Governance**: Strict role-based workflow enforcement. Job cards advance through defined operational states: *Draft*, *Ready for Review*, *Approved*, *Rejected*, *Pending Revision*, *Commercial Review*, and *Billed*. Managers only govern engineers within their organizational reporting hierarchy.
- **Inventory & Spare Parts Management**: Real-time SKU tracking, reorder alert thresholds, bin location tracking, and an immutable stock ledger that logs every inventory movement, net delta, authorized user, and mandatory business justification.
- **Commercial Controls & Dynamic Rate Cards**: Standard hourly labor rates, overtime multipliers, emergency callout surcharges, diagnostic fees, and travel costs with automated line-item calculation and margin protection.
- **Diagnostic Decision Intelligence**: Integrated diagnostic summarization and corrective maintenance recommendations powered by advanced AI models, with zero-downtime deterministic fallback.
- **Enterprise Security & Audit Ledger**: Salted bcrypt password hashing, cryptographically signed HMAC JWT sessions, and comprehensive audit trail recording all security, operational, and commercial events.

---

## Role-Based Access Control (RBAC)

The system enforces strict multi-role governance across four corporate operational tiers:

| Role | Operational Scope | Default Capabilities |
| :--- | :--- | :--- |
| **Field Engineer** | Assigned Job Cards & Site Inspections | Create and update assigned job cards, complete checklists, log parts, attach evidence photos, capture customer sign-offs. |
| **Manager** | Supervisory Approval & Team Governance | Review submitted job cards, approve or reject work orders, request revisions, oversee assigned team members. |
| **Operations** | Inventory & Commercial Review | Manage warehouse inventory, execute stock adjustments with mandatory audit reasons, perform commercial pricing checks. |
| **Admin** | System Administration & Audit | Manage user accounts, organizational reporting hierarchies, access permissions, and enterprise audit logs. |

*Demonstration accounts and organizational reporting hierarchy are documented in [DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md).*

---

## Organizational Hierarchy & Governance

The platform implements hierarchical team governance:
- Field Engineers report to designated Service Managers.
- Service Managers can view and govern work orders exclusively for engineers within their direct reporting line.
- Commercial & Inventory Operations manage parts catalogs, unit economics, and stock adjustments.
- System Administrators govern account credentials, team assignments, system health, and immutable audit logs.

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Motion, Lucide Icons
- **Backend**: Express HTTP Server, TypeScript (`tsx` in dev, `esbuild` bundled CJS for production)
- **Intelligence**: `@google/genai` diagnostic decision support with deterministic fallback
- **Security**: Salted bcrypt password encryption, server-authoritative session token authorization
- **Build & Tooling**: Vite 6, Tailwind CSS v4, ESBuild

---

## Local Development Setup

### Prerequisites

- Node.js 20+
- npm or bun

### Installation & Configuration

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure local environment variables:
   ```bash
   cp .env.example .env
   ```
   *Note: In `.env`, configure `DEV_SEED_PASSWORD` to set your demonstration account password, and optionally `GEMINI_API_KEY` for AI diagnostic assistance.*

3. Launch the development server:
   ```bash
   npm run dev
   ```
   The application runs on `http://localhost:3000`.

4. Authenticate:
   Open `http://localhost:3000` and sign in with any account from [DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md) (e.g., `ENG-001`, `MGR-001`, `OPS-001`, or `ADM-001`) using the password configured in `DEV_SEED_PASSWORD`.

### Production Build

Build the production client assets and server bundle:
```bash
npm run build
```

Start the production server:
```bash
npm start
```
