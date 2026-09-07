# ServiceOps Enterprise - Seed Credentials & Test Directory

> **CONFIDENTIAL - INTERNAL OPERATIONS / TEST AUTOMATION ONLY**  
> Do not expose these credentials in the public client application UI.  
> Passwords are encrypted with salted bcrypt hashing on the server.

All demonstration accounts are seeded in the server database with role-based access control (RBAC) and organizational hierarchy.

---

## 1. Field Service Engineers

| Role | Name | Enterprise User ID | System ID Alias | Seed Password | Assigned Manager |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Field Engineer** | Eng 1 | `ENG-001` | `usr-eng-1` | `Eng1#FieldOps2026` | Manager 1 |
| **Field Engineer** | Eng 2 | `ENG-002` | `usr-eng-2` | `Eng2#Pneumatic2026` | Manager 1 |
| **Field Engineer** | Eng 3 | `ENG-003` | `usr-eng-3` | `Eng3#Electrical2026` | Manager 1 |
| **Field Engineer** | Eng 4 | `ENG-004` | `usr-eng-4` | `Eng4#HVACService2026` | Manager 2 |
| **Field Engineer** | Eng 5 | `ENG-005` | `usr-eng-5` | `Eng5#Controls2026` | Manager 2 |
| **Field Engineer** | Eng 6 | `ENG-006` | `usr-eng-6` | `Eng6#Maintenance2026` | Manager 2 |

*Access Scope:* Field Engineers can only view and manage their own assigned Job Cards, checklists, evidence photos, and draft submissions.

---

## 2. Service Operations Managers

| Role | Name | Enterprise User ID | System ID Alias | Seed Password | Team Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Manager** | Manager 1 | `MGR-001` | `usr-mgr-1` | `Mgr1#Supervisory2026` | Eng 1, Eng 2, Eng 3 |
| **Manager** | Manager 2 | `MGR-002` | `usr-mgr-2` | `Mgr2#RegionalLead2026` | Eng 4, Eng 5, Eng 6 |
| **Manager** | Manager 3 | `MGR-003` | `usr-mgr-3` | `Mgr3#QualityAudit2026` | *Unassigned (Empty Team)* |
| **Manager** | Manager 4 | `MGR-004` | `usr-mgr-4` | `Mgr4#DirectorOps2026` | *Unassigned (Empty Team)* |

*Access Scope:* Managers can review, approve, reject, or request revisions on Job Cards for engineers in their direct reporting line. Managers 3 and 4 have empty teams (0 engineers) for testing unassigned supervisory states.

---

## 3. Commercial & Inventory Operations

| Role | Name | Enterprise User ID | System ID Alias | Seed Password | Operational Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Operations** | Ops 1 | `OPS-001` | `usr-ops-1` | `Ops1#Commercial2026` | Parts Inventory, Stock Adjustments, Commercial Pricing |

*Access Scope:* Operations oversees inventory catalogs, stock levels, stock movement history, audit tracking of parts adjustments, and commercial review of job card pricing.

---

## 4. Enterprise System Administration

| Role | Name | Enterprise User ID | System ID Alias | Seed Password | Administrative Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin** | Admin 1 | `ADM-001` | `usr-admin-1` | `Admin1#EnterpriseSec2026` | User Management, Team Hierarchy, RBAC, System Audit Logs |

*Access Scope:* Administrators govern users, account activations, manager assignments, credential changes, and system configuration.
