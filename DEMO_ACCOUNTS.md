# Demonstration Accounts Directory

This document details the demonstration user accounts and organizational reporting hierarchy seeded in **ServiceOps Enterprise** for evaluation, testing, and multi-role access control verification.

> **Security Note:** In compliance with enterprise security hygiene, this public repository contains no authentication credentials, plain-text passwords, or password hashes. For local development authentication setup, refer to `README.md` under **Local Development Setup**.

---

## 1. Field Service Engineers

| Enterprise User ID | System ID | Name | Role | Designation | Assigned Manager | Purpose & Scope |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ENG-001` | `usr-eng-1` | Eng 1 | Field Engineer | Senior Field Service Engineer | `MGR-001` | Manages assigned field interventions, checklists, and equipment inspection drafts. |
| `ENG-002` | `usr-eng-2` | Eng 2 | Field Engineer | Pneumatics & Mechanical Specialist | `MGR-001` | Execution of mechanical and compressor service work orders. |
| `ENG-003` | `usr-eng-3` | Eng 3 | Field Engineer | Electrical Systems Engineer | `MGR-001` | Electrical diagnostics, control panel inspections, and safety checks. |
| `ENG-004` | `usr-eng-4` | Eng 4 | Field Engineer | HVAC & Refrigeration Technician | `MGR-002` | HVAC chiller servicing, temperature log checks, and refrigerant recovery. |
| `ENG-005` | `usr-eng-5` | Eng 5 | Field Engineer | Automation & Controls Engineer | `MGR-002` | PLC logic diagnostics, sensor calibrations, and telemetry troubleshooting. |
| `ENG-006` | `usr-eng-6` | Eng 6 | Field Engineer | Preventive Maintenance Technician | `MGR-002` | Routine scheduled preventive maintenance and lubrication service orders. |

---

## 2. Service Operations Managers

| Enterprise User ID | System ID | Name | Role | Managed Team | Purpose & Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `MGR-001` | `usr-mgr-1` | Manager 1 | Service Manager | `ENG-001`, `ENG-002`, `ENG-003` | Supervisory governance, review, approval, and revision requests for Team North engineers. |
| `MGR-002` | `usr-mgr-2` | Manager 2 | Service Manager | `ENG-004`, `ENG-005`, `ENG-006` | Supervisory review and work order sign-offs for Team South engineers. |
| `MGR-003` | `usr-mgr-3` | Manager 3 | Service Manager | *Unassigned (0 Engineers)* | Quality audit and governance manager for unassigned supervisory evaluations. |
| `MGR-004` | `usr-mgr-4` | Manager 4 | Service Manager | *Unassigned (0 Engineers)* | Operations director account for supervisory governance testing. |

---

## 3. Commercial & Inventory Operations

| Enterprise User ID | System ID | Name | Role | Operational Focus | Purpose & Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `OPS-001` | `usr-ops-1` | Ops 1 | Operations | Warehouse & Pricing Controls | Governs parts inventory catalog, stock level adjustments with mandatory audit trails, and commercial job card pricing reviews. |

---

## 4. Enterprise System Administration

| Enterprise User ID | System ID | Name | Role | Administrative Scope | Purpose & Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ADM-001` | `usr-admin-1` | Admin 1 | System Administrator | Enterprise Governance & Audit | User account provisioning, organizational reporting hierarchy reassignment, role-based security enforcement, and system audit log inspection. |

---

## Organizational Reporting Structure

```
ADM-001 (System Administrator)
  ├── OPS-001 (Commercial & Inventory Operations)
  ├── MGR-001 (Service Manager — Team North)
  │     ├── ENG-001 (Senior Field Service Engineer)
  │     ├── ENG-002 (Pneumatics Specialist)
  │     └── ENG-003 (Electrical Systems Engineer)
  ├── MGR-002 (Service Manager — Team South)
  │     ├── ENG-004 (HVAC Technician)
  │     ├── ENG-005 (Automation Engineer)
  │     └── ENG-006 (PM Technician)
  ├── MGR-003 (Service Manager — Quality Audit)
  └── MGR-004 (Service Manager — Operations Directorate)
```
