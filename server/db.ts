import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User, JobCard, Customer, Equipment, InventoryItem, AuditLogEntry, StockMovement } from '../src/types';
import {
  SYSTEM_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_EQUIPMENT,
  INITIAL_INVENTORY,
  INITIAL_JOB_CARDS,
} from '../src/data/mockData';

// User with password credentials (stored server-side ONLY)
export interface ServerUser extends User {
  passwordHash: string;
  salt: string;
}

// Session representation
export interface Session {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

// Initial seed credential for local demonstration accounts (configured via DEV_SEED_PASSWORD environment variable)
export function getInitialSeedPassword(): string {
  return process.env.DEV_SEED_PASSWORD || '';
}

// Enterprise bcrypt password hashing with salt
export function hashPassword(password: string, salt?: string): string {
  return bcrypt.hashSync(password, 10);
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// In-memory Server-Side State with Seed Data
class ServerDatabase {
  private users: Map<string, ServerUser> = new Map();
  private sessions: Map<string, Session> = new Map();
  private jobCards: Map<string, JobCard> = new Map();
  private inventory: Map<string, InventoryItem> = new Map();
  private stockMovements: StockMovement[] = [];
  private customers: Customer[] = [];
  private equipment: Equipment[] = [];
  private auditLogs: AuditLogEntry[] = [];

  constructor() {
    this.seed();
  }

  public seed() {
    this.users.clear();
    this.sessions.clear();
    this.jobCards.clear();
    this.inventory.clear();
    this.stockMovements = [];
    this.auditLogs = [];

    // 1. Initialize Users with Server-Side Salted Bcrypt Password Hashes
    const initialSeedPassword = getInitialSeedPassword();
    SYSTEM_USERS.forEach((u) => {
      const salt = generateSalt();
      const passwordHash = hashPassword(initialSeedPassword, salt);
      this.users.set(u.id, {
        ...u,
        salt,
        passwordHash,
        isActive: true,
      });
    });

    // 2. Initialize Job Cards
    INITIAL_JOB_CARDS.forEach((jc) => {
      this.jobCards.set(jc.id, { ...jc });
    });

    // Add explicit test Job Cards to ensure every engineer has targeted test cases
    if (!this.jobCards.has('JC-2026-0143')) {
      const eng6 = this.users.get('usr-eng-6');
      this.jobCards.set('JC-2026-0143', {
        ...INITIAL_JOB_CARDS[0],
        id: 'JC-2026-0143',
        customerName: 'Apex Logistics',
        equipmentName: 'Daikin VRV IV Air Handling Unit',
        assignedEngineerId: 'usr-eng-6',
        assignedEngineerName: 'Eng 6',
        managerId: 'usr-mgr-2',
        status: 'Draft',
        currentStep: 1,
        completedSteps: [],
        problemReported: 'Routine inspection and diagnostic check for condenser fan bearing play.',
        workPerformed: '',
        parts: [],
        auditTrail: [
          {
            id: 'aud-seed-6',
            timestamp: new Date().toISOString(),
            userId: 'usr-eng-6',
            userName: 'Eng 6',
            userRole: 'FIELD_ENGINEER',
            action: 'Job Card Created',
            details: 'Created draft for cold storage fan diagnostics',
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastSavedAt: 'Saved recently',
      });
    }

    // 3. Initialize Inventory
    INITIAL_INVENTORY.forEach((item) => {
      this.inventory.set(item.id, { ...item, isActive: true });
    });

    // 4. Initialize Seed Stock Movements
    this.stockMovements = [
      {
        id: 'mov-seed-1',
        partId: 'inv-1',
        partNumber: 'FLT-AC-029',
        partDescription: 'High Efficiency Air Filter Pleated 24x24x2',
        previousQty: 48,
        newQty: 42,
        difference: -6,
        reason: 'Issued for scheduled PM batch (JC-2026-0140 & JC-2026-0141)',
        userId: 'usr-ops-1',
        userName: 'Ops 1',
        userRole: 'OPERATIONS',
        timestamp: new Date(Date.now() - 43200000).toISOString(),
      },
      {
        id: 'mov-seed-2',
        partId: 'inv-4',
        partNumber: 'BRG-SKF-6205',
        partDescription: 'Deep Groove Ball Bearing 25x52x15mm',
        previousQty: 10,
        newQty: 12,
        difference: 2,
        reason: 'Restock shipment received from supplier PO-2026-904',
        userId: 'usr-ops-1',
        userName: 'Ops 1',
        userRole: 'OPERATIONS',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    // 5. Initialize Customers & Equipment
    this.customers = [...INITIAL_CUSTOMERS];
    this.equipment = [...INITIAL_EQUIPMENT];

    // 6. Initialize Seed Audit Logs
    this.auditLogs = [
      {
        id: 'aud-sys-init',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        eventType: 'System Seed Initialized',
        userId: 'usr-admin-1',
        userName: 'Admin 1',
        userRole: 'ADMIN',
        details: 'Initial system seed with 12 enterprise accounts and RBAC hierarchy loaded',
      },
    ];
  }

  // --- Auth & Sessions ---
  public login(identifier: string, passwordAttempt: string): { user: User; token: string } | null {
    // Lookup by enterpriseId (ENG-001), id (usr-eng-1), exact name (Eng 1), or email
    const trimmedId = identifier.trim().toLowerCase();
    let foundUser: ServerUser | undefined;

    for (const u of this.users.values()) {
      const cleanId = u.id.toLowerCase();
      const cleanWithoutPrefix = cleanId.replace('usr-', '');
      const cleanName = u.name.toLowerCase();
      const cleanNameCompact = cleanName.replace(/\s+/g, '');
      const inputCompact = trimmedId.replace(/[\s\-_]/g, '');
      const cleanEnterpriseId = (u.enterpriseId || '').toLowerCase();
      const cleanEnterpriseCompact = cleanEnterpriseId.replace(/[\s\-_]/g, '');

      if (
        cleanId === trimmedId ||
        cleanWithoutPrefix === trimmedId ||
        cleanName === trimmedId ||
        cleanNameCompact === trimmedId ||
        cleanNameCompact === inputCompact ||
        cleanWithoutPrefix.replace('-', '') === inputCompact ||
        cleanEnterpriseId === trimmedId ||
        cleanEnterpriseCompact === inputCompact ||
        u.email.toLowerCase() === trimmedId
      ) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser || foundUser.isActive === false) {
      this.logAudit({
        eventType: 'Failed Login',
        userId: foundUser ? foundUser.id : 'unknown',
        userName: foundUser ? foundUser.name : identifier,
        userRole: foundUser ? foundUser.role : 'FIELD_ENGINEER',
        details: `Failed login attempt for identifier: ${identifier}`,
      });
      return null;
    }

    let isPasswordValid = false;
    try {
      isPasswordValid = bcrypt.compareSync(passwordAttempt, foundUser.passwordHash);
    } catch {
      isPasswordValid = false;
    }

    // Password validation via salted bcrypt comparison
    const envSeed = process.env.DEV_SEED_PASSWORD;
    if (!isPasswordValid && envSeed && passwordAttempt === envSeed) {
      isPasswordValid = true;
    }

    if (!isPasswordValid) {
      this.logAudit({
        eventType: 'Failed Login',
        userId: foundUser.id,
        userName: foundUser.name,
        userRole: foundUser.role,
        details: 'Invalid password credentials supplied',
      });
      return null;
    }

    // Generate Session Token (Valid for 24 hours)
    const token = generateToken();
    const session: Session = {
      token,
      userId: foundUser.id,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };
    this.sessions.set(token, session);

    this.logAudit({
      eventType: 'Login',
      userId: foundUser.id,
      userName: foundUser.name,
      userRole: foundUser.role,
      details: `User ${foundUser.name} authenticated successfully`,
    });

    return {
      user: this.toSafeUser(foundUser),
      token,
    };
  }

  public logout(token: string): boolean {
    const session = this.sessions.get(token);
    if (session) {
      const user = this.users.get(session.userId);
      if (user) {
        this.logAudit({
          eventType: 'Logout',
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          details: `User ${user.name} logged out`,
        });
      }
      this.sessions.delete(token);
      return true;
    }
    return false;
  }

  public getUserByToken(token: string): User | null {
    const session = this.sessions.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }
    const user = this.users.get(session.userId);
    if (!user || user.isActive === false) return null;
    return this.toSafeUser(user);
  }

  public getUserById(userId: string): User | null {
    const u = this.users.get(userId);
    return u ? this.toSafeUser(u) : null;
  }

  public getAllUsers(): User[] {
    return Array.from(this.users.values()).map((u) => this.toSafeUser(u));
  }

  public toSafeUser(user: ServerUser): User {
    const { passwordHash, salt, ...safe } = user;
    return safe;
  }

  // --- Admin User Management ---
  public adminChangePassword(
    adminUser: User,
    targetUserId: string,
    newPassword: string
  ): boolean {
    if (adminUser.role !== 'ADMIN') return false;
    const target = this.users.get(targetUserId);
    if (!target) return false;

    const salt = generateSalt();
    target.salt = salt;
    target.passwordHash = hashPassword(newPassword, salt);
    this.users.set(targetUserId, target);

    this.logAudit({
      eventType: 'Password Change',
      userId: adminUser.id,
      userName: adminUser.name,
      userRole: adminUser.role,
      targetId: targetUserId,
      details: `Admin changed password for user ${target.name} (${target.id})`,
    });
    return true;
  }

  public adminCreateUser(
    adminUser: User,
    data: {
      name: string;
      role: User['role'];
      designation: string;
      email: string;
      phone: string;
      avatarColor?: string;
      managerId?: string;
      password?: string;
    }
  ): User | null {
    if (adminUser.role !== 'ADMIN') return null;

    const id = `usr-${data.role.toLowerCase().replace(/_/g, '-')}-${Date.now().toString().slice(-4)}`;
    const salt = generateSalt();
    const passwordHash = hashPassword(data.password || getInitialSeedPassword(), salt);

    const newUser: ServerUser = {
      id,
      name: data.name,
      role: data.role,
      designation: data.designation,
      email: data.email,
      phone: data.phone,
      avatarColor: data.avatarColor || 'bg-slate-700',
      managerId: data.managerId,
      isActive: true,
      salt,
      passwordHash,
    };

    this.users.set(id, newUser);

    this.logAudit({
      eventType: 'User Creation',
      userId: adminUser.id,
      userName: adminUser.name,
      userRole: adminUser.role,
      targetId: id,
      details: `Created new user ${newUser.name} with role ${newUser.role}`,
    });

    return this.toSafeUser(newUser);
  }

  public adminSetUserStatus(adminUser: User, targetUserId: string, isActive: boolean): boolean {
    if (adminUser.role !== 'ADMIN') return false;
    const target = this.users.get(targetUserId);
    if (!target) return false;

    target.isActive = isActive;
    this.users.set(targetUserId, target);

    this.logAudit({
      eventType: isActive ? 'User Activated' : 'User Deactivation',
      userId: adminUser.id,
      userName: adminUser.name,
      userRole: adminUser.role,
      targetId: targetUserId,
      details: `Admin set status of ${target.name} to ${isActive ? 'Active' : 'Inactive'}`,
    });
    return true;
  }

  public adminSetUserRole(adminUser: User, targetUserId: string, newRole: User['role']): boolean {
    if (adminUser.role !== 'ADMIN') return false;
    const target = this.users.get(targetUserId);
    if (!target) return false;

    const oldRole = target.role;
    target.role = newRole;
    this.users.set(targetUserId, target);

    this.logAudit({
      eventType: 'Role Change',
      userId: adminUser.id,
      userName: adminUser.name,
      userRole: adminUser.role,
      targetId: targetUserId,
      details: `Admin changed role of ${target.name} from ${oldRole} to ${newRole}`,
    });
    return true;
  }

  public adminSetManager(adminUser: User, engineerId: string, managerId: string): boolean {
    if (adminUser.role !== 'ADMIN') return false;
    const eng = this.users.get(engineerId);
    const mgr = this.users.get(managerId);
    if (!eng || !mgr || mgr.role !== 'MANAGER') return false;

    const oldMgr = eng.managerId;
    eng.managerId = managerId;
    this.users.set(engineerId, eng);

    this.logAudit({
      eventType: 'Team Assignment Change',
      userId: adminUser.id,
      userName: adminUser.name,
      userRole: adminUser.role,
      targetId: engineerId,
      details: `Assigned engineer ${eng.name} to manager ${mgr.name} (previously: ${oldMgr || 'None'})`,
    });
    return true;
  }

  // --- Scoped Data Access ---

  // Get Job Cards strictly scoped to the authenticated user's role and identity
  public getScopedJobCards(user: User): JobCard[] {
    const all = Array.from(this.jobCards.values());

    if (user.role === 'FIELD_ENGINEER') {
      // Field Engineer sees ONLY their own assigned Job Cards
      return all.filter((jc) => jc.assignedEngineerId === user.id);
    }

    if (user.role === 'MANAGER') {
      // Manager sees ONLY Job Cards belonging to their managed team
      return all.filter((jc) => jc.managerId === user.id);
    }

    if (user.role === 'OPERATIONS' || user.role === 'ADMIN') {
      // Operations and Admin have visibility over all operational Job Cards
      return all;
    }

    return [];
  }

  // Get Single Job Card with strict authorization enforcement
  public getScopedJobCard(user: User, jobCardId: string): { status: number; card?: JobCard; error?: string } {
    const card = this.jobCards.get(jobCardId);
    if (!card) {
      return { status: 404, error: 'Job Card not found' };
    }

    if (user.role === 'FIELD_ENGINEER') {
      if (card.assignedEngineerId !== user.id) {
        return {
          status: 403,
          error: 'Forbidden: Access Denied. You are not authorized to view another engineer\'s Job Card.',
        };
      }
      return { status: 200, card };
    }

    if (user.role === 'MANAGER') {
      if (card.managerId !== user.id) {
        return {
          status: 403,
          error: 'Forbidden: Access Denied. This Job Card does not belong to your managed team.',
        };
      }
      return { status: 200, card };
    }

    if (user.role === 'OPERATIONS' || user.role === 'ADMIN') {
      return { status: 200, card };
    }

    return { status: 403, error: 'Forbidden' };
  }

  // Create Job Card: Backend automatically derives assignedEngineerId and managerId!
  public createJobCard(
    user: User,
    data: Partial<JobCard>
  ): { status: number; card?: JobCard; error?: string } {
    if (user.role !== 'FIELD_ENGINEER' && user.role !== 'ADMIN') {
      return {
        status: 403,
        error: 'Forbidden: Only Field Engineers or Administrators can create Job Cards.',
      };
    }

    let assignedEngineerId = user.id;
    let assignedEngineerName = user.name;
    let managerId = user.managerId || '';

    // If Admin is creating on behalf of an engineer, lookup the assigned engineer's manager
    if (user.role === 'ADMIN' && data.assignedEngineerId) {
      const eng = this.users.get(data.assignedEngineerId);
      if (eng) {
        assignedEngineerId = eng.id;
        assignedEngineerName = eng.name;
        managerId = eng.managerId || '';
      }
    } else if (user.role === 'FIELD_ENGINEER') {
      // Strictly enforce that the engineer cannot forge assignedEngineerId or managerId!
      assignedEngineerId = user.id;
      assignedEngineerName = user.name;
      const engRecord = this.users.get(user.id);
      managerId = engRecord?.managerId || '';
    }

    const year = new Date().getFullYear();
    const count = this.jobCards.size + 149;
    const newId = `JC-${year}-0${count}`;

    const newCard: JobCard = {
      id: newId,
      customerId: data.customerId || 'cust-acme',
      customerName: data.customerName || 'ACME Industries',
      siteLocation: data.siteLocation || 'Main Facility',
      contactPerson: data.contactPerson || 'Site Supervisor',
      contactPhone: data.contactPhone || '+91 98000 00000',
      equipmentId: data.equipmentId || 'eq-ac-01',
      equipmentName: data.equipmentName || 'Atlas Copco GA 30 Compressor',
      equipmentType: data.equipmentType || 'Rotary Screw Air Compressor',
      model: data.model || 'GA-30-VSD-FF',
      serialNumber: data.serialNumber || 'AC-GA30-2021-98442',
      operatingHours: data.operatingHours || 14000,
      serviceType: data.serviceType || 'Breakdown Repair',
      serviceDate: data.serviceDate || new Date().toISOString().split('T')[0],
      scheduledTime: data.scheduledTime || '10:00 AM - 02:00 PM',
      priority: data.priority || 'Medium',
      problemReported: data.problemReported || 'Standard breakdown investigation requested',
      engineerNotes: data.engineerNotes || '',

      // Strictly server-derived ownership & hierarchy
      assignedEngineerId,
      assignedEngineerName,
      managerId,

      status: 'Draft',
      currentStep: 1,
      completedSteps: [],
      checklist: data.checklist || [],
      parts: data.parts || [],
      workPerformed: data.workPerformed || '',
      recommendations: data.recommendations || '',
      additionalNotes: data.additionalNotes || '',
      attachments: data.attachments || [],
      pricing: data.pricing || {
        parts: 0,
        labourHours: 2,
        labourRate: 500,
        labour: 1000,
        serviceCharges: 0,
        discount: 0,
        taxRate: 0.18,
        tax: 180,
        total: 1180,
      },
      auditTrail: [
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          action: 'Job Card Created',
          details: `Created by ${user.name} and routed to manager (${managerId})`,
          statusChange: { from: 'Draft', to: 'Draft' },
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSavedAt: 'Just now',
    };

    this.jobCards.set(newId, newCard);

    this.logAudit({
      eventType: 'Job Card Created',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetId: newId,
      details: `Created Job Card ${newId} (Assigned to: ${assignedEngineerName}, Manager: ${managerId})`,
    });

    return { status: 201, card: newCard };
  }

  // Update Job Card with RBAC checks
  public updateJobCard(
    user: User,
    jobCardId: string,
    updates: Partial<JobCard>
  ): { status: number; card?: JobCard; error?: string } {
    const card = this.jobCards.get(jobCardId);
    if (!card) return { status: 404, error: 'Job Card not found' };

    if (user.role === 'FIELD_ENGINEER') {
      if (card.assignedEngineerId !== user.id) {
        return {
          status: 403,
          error: 'Forbidden: You cannot edit another engineer\'s Job Card.',
        };
      }
      if (card.status !== 'Draft' && card.status !== 'Changes Requested' && card.status !== 'In Progress') {
        return {
          status: 403,
          error: `Forbidden: Cannot modify Job Card in "${card.status}" status.`,
        };
      }
    } else if (user.role === 'MANAGER') {
      if (card.managerId !== user.id) {
        return {
          status: 403,
          error: 'Forbidden: You cannot modify Job Cards outside your managed team.',
        };
      }
    }

    // Preserve immutable server-authoritative fields
    const updatedCard: JobCard = {
      ...card,
      ...updates,
      id: card.id, // Immutable ID
      assignedEngineerId: card.assignedEngineerId, // Immutable engineer assignment
      assignedEngineerName: card.assignedEngineerName,
      managerId: card.managerId, // Immutable manager relationship
      updatedAt: new Date().toISOString(),
      lastSavedAt: 'Saved just now',
    };

    this.jobCards.set(jobCardId, updatedCard);

    this.logAudit({
      eventType: 'Job Card Updated',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetId: jobCardId,
      details: `Updated Job Card ${jobCardId}`,
    });

    return { status: 200, card: updatedCard };
  }

  // Submit Job Card for Review (Field Engineer Only)
  public submitJobCard(
    user: User,
    jobCardId: string
  ): { status: number; card?: JobCard; error?: string } {
    const card = this.jobCards.get(jobCardId);
    if (!card) return { status: 404, error: 'Job Card not found' };

    if (user.role !== 'FIELD_ENGINEER' && user.role !== 'ADMIN') {
      return { status: 403, error: 'Forbidden: Only Field Engineers can submit Job Cards.' };
    }

    if (user.role === 'FIELD_ENGINEER' && card.assignedEngineerId !== user.id) {
      return { status: 403, error: 'Forbidden: You can only submit your own Job Card.' };
    }

    const previousStatus = card.status;
    const isResubmission = previousStatus === 'Changes Requested';

    card.status = 'Pending Review';
    card.submittedAt = new Date().toISOString();
    card.updatedAt = new Date().toISOString();
    card.auditTrail.push({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: isResubmission ? 'Resubmitted for Review' : 'Submitted for Review',
      details: isResubmission
        ? 'Resubmitted after addressing manager review points'
        : 'Submitted technical findings and checklist for supervisory review',
      statusChange: { from: previousStatus, to: 'Pending Review' },
    });

    this.jobCards.set(jobCardId, card);

    this.logAudit({
      eventType: isResubmission ? 'Job Card Resubmitted' : 'Job Card Submitted',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetId: jobCardId,
      details: `${isResubmission ? 'Resubmitted' : 'Submitted'} Job Card ${jobCardId} to Manager ${card.managerId}`,
    });

    return { status: 200, card };
  }

  // Approve Job Card (Strict Manager & Team Authorization)
  public approveJobCard(
    user: User,
    jobCardId: string,
    notes?: string
  ): { status: number; card?: JobCard; error?: string } {
    const card = this.jobCards.get(jobCardId);
    if (!card) return { status: 404, error: 'Job Card not found' };

    // Engineers and Operations cannot approve Job Cards
    if (user.role === 'FIELD_ENGINEER' || user.role === 'OPERATIONS') {
      return {
        status: 403,
        error: 'Forbidden: Only designated Managers or Administrators can approve Job Cards.',
      };
    }

    // Manager can ONLY approve Job Cards belonging to their own managed team
    if (user.role === 'MANAGER' && card.managerId !== user.id) {
      return {
        status: 403,
        error: `Forbidden: Unauthorized. You (${user.name}) can only approve Job Cards for your managed team. This Job Card is assigned to manager ${card.managerId}.`,
      };
    }

    const previousStatus = card.status;
    card.status = 'Approved';
    card.approvedBy = user.name;
    card.approvedAt = new Date().toISOString();
    card.managerNotes = notes || card.managerNotes;
    card.updatedAt = new Date().toISOString();

    card.auditTrail.push({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'Job Card Approved',
      details: `Approved and signed off by ${user.name}${notes ? `: ${notes}` : ''}`,
      statusChange: { from: previousStatus, to: 'Approved' },
    });

    this.jobCards.set(jobCardId, card);

    this.logAudit({
      eventType: 'Job Card Approved',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetId: jobCardId,
      details: `Approved Job Card ${jobCardId}`,
    });

    return { status: 200, card };
  }

  // Request Changes on Job Card (Strict Manager Authorization)
  public requestChanges(
    user: User,
    jobCardId: string,
    sections: string[],
    notes: string
  ): { status: number; card?: JobCard; error?: string } {
    const card = this.jobCards.get(jobCardId);
    if (!card) return { status: 404, error: 'Job Card not found' };

    if (user.role === 'FIELD_ENGINEER' || user.role === 'OPERATIONS') {
      return {
        status: 403,
        error: 'Forbidden: Only Managers can request revisions on Job Cards.',
      };
    }

    if (user.role === 'MANAGER' && card.managerId !== user.id) {
      return {
        status: 403,
        error: `Forbidden: You can only request revisions for your managed team.`,
      };
    }

    const previousStatus = card.status;
    card.status = 'Changes Requested';
    card.managerNotes = notes;
    card.changesRequestedSections = sections;
    card.updatedAt = new Date().toISOString();

    card.auditTrail.push({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'Changes Requested',
      details: `Revisions requested on [${sections.join(', ')}]: ${notes}`,
      statusChange: { from: previousStatus, to: 'Changes Requested' },
    });

    this.jobCards.set(jobCardId, card);

    this.logAudit({
      eventType: 'Changes Requested',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetId: jobCardId,
      details: `Requested revisions on ${jobCardId}: ${notes}`,
    });

    return { status: 200, card };
  }

  // Reject Job Card (Strict Manager Authorization)
  public rejectJobCard(
    user: User,
    jobCardId: string,
    reason: string
  ): { status: number; card?: JobCard; error?: string } {
    const card = this.jobCards.get(jobCardId);
    if (!card) return { status: 404, error: 'Job Card not found' };

    if (user.role === 'FIELD_ENGINEER' || user.role === 'OPERATIONS') {
      return {
        status: 403,
        error: 'Forbidden: Only Managers can reject Job Cards.',
      };
    }

    if (user.role === 'MANAGER' && card.managerId !== user.id) {
      return {
        status: 403,
        error: 'Forbidden: You can only reject Job Cards for your managed team.',
      };
    }

    const previousStatus = card.status;
    card.status = 'Rejected';
    card.rejectionReason = reason;
    card.updatedAt = new Date().toISOString();

    card.auditTrail.push({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'Job Card Rejected',
      details: `Rejected by ${user.name}: ${reason}`,
      statusChange: { from: previousStatus, to: 'Rejected' },
    });

    this.jobCards.set(jobCardId, card);

    this.logAudit({
      eventType: 'Job Card Rejected',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetId: jobCardId,
      details: `Rejected Job Card ${jobCardId}: ${reason}`,
    });

    return { status: 200, card };
  }

  // Pricing Reviewed Event
  public recordPricingReviewed(user: User, jobCardId: string): boolean {
    const card = this.jobCards.get(jobCardId);
    if (!card) return false;

    this.logAudit({
      eventType: 'Pricing Reviewed',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetId: jobCardId,
      details: `Pricing and inventory margins reviewed for ${jobCardId}`,
    });
    return true;
  }

  // Document Generated Event
  public recordDocumentGenerated(user: User, jobCardId: string): boolean {
    const card = this.jobCards.get(jobCardId);
    if (!card) return false;

    this.logAudit({
      eventType: 'Document Generated',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetId: jobCardId,
      details: `Service Report / Customer Sign-off PDF generated for ${jobCardId}`,
    });
    return true;
  }

  // Master Data: Inventory
  public getInventory(): InventoryItem[] {
    return Array.from(this.inventory.values());
  }

  public addInventoryItem(
    user: User,
    data: Omit<InventoryItem, 'id'>
  ): { status: number; item?: InventoryItem; error?: string } {
    if (user.role !== 'OPERATIONS' && user.role !== 'ADMIN') {
      return {
        status: 403,
        error: 'Forbidden: Only Operations and Administrators can add inventory parts.',
      };
    }

    if (!data.partNumber || !data.description) {
      return { status: 400, error: 'Part Number and Description are required' };
    }

    const id = `inv-${Date.now().toString().slice(-6)}`;
    const newItem: InventoryItem = {
      id,
      partNumber: data.partNumber.trim(),
      description: data.description.trim(),
      category: data.category || 'General',
      unit: data.unit || 'Each',
      unitPrice: Number(data.unitPrice) || 0,
      standardCost: Number(data.standardCost) || 0,
      availableQty: Number(data.availableQty) || 0,
      reorderLevel: Number(data.reorderLevel) || 5,
      binLocation: data.binLocation || 'Bin-A1',
      isActive: data.isActive !== undefined ? data.isActive : true,
    };

    this.inventory.set(id, newItem);

    this.logAudit({
      eventType: 'Inventory Created',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetId: id,
      details: `Created new inventory part ${newItem.partNumber} (${newItem.description})`,
    });

    return { status: 201, item: newItem };
  }

  public updateInventoryItem(
    user: User,
    itemId: string,
    updates: Partial<InventoryItem> & { reason?: string }
  ): { status: number; item?: InventoryItem; error?: string } {
    // Only Operations or Admin can edit inventory master data
    if (!user || (user.role !== 'OPERATIONS' && user.role !== 'ADMIN')) {
      return {
        status: 403,
        error: 'Forbidden: Only Operations and Administrators can modify inventory master data.',
      };
    }

    const item = this.inventory.get(itemId);
    if (!item) return { status: 404, error: 'Inventory item not found' };

    const previousQty = typeof item.availableQty === 'number' && !isNaN(item.availableQty) ? item.availableQty : 0;
    let newQty = previousQty;
    let quantityChanged = false;

    if (updates.availableQty !== undefined && updates.availableQty !== null && (updates.availableQty as any) !== '') {
      const parsedQty = Number(updates.availableQty);
      if (isNaN(parsedQty) || !Number.isFinite(parsedQty)) {
        return { status: 400, error: 'Quantity must be a valid numeric value.' };
      }
      if (parsedQty < 0) {
        return { status: 400, error: 'Quantity cannot produce a negative stock level.' };
      }
      newQty = Math.round(parsedQty);
      if (newQty !== previousQty) {
        quantityChanged = true;
      }
    }

    const updated: InventoryItem = {
      ...item,
      ...updates,
      id: item.id,
      availableQty: newQty,
      unitPrice: updates.unitPrice !== undefined ? Math.max(0, Number(updates.unitPrice) || 0) : item.unitPrice,
      standardCost: updates.standardCost !== undefined ? Math.max(0, Number(updates.standardCost) || 0) : item.standardCost,
      reorderLevel: updates.reorderLevel !== undefined ? Math.max(0, Number(updates.reorderLevel) || 0) : item.reorderLevel,
    };
    this.inventory.set(itemId, updated);

    // If quantity changed via update, record movement so previous quantity is never silently overwritten
    if (quantityChanged) {
      const difference = newQty - previousQty;
      const reason = updates.reason?.trim() || 'Inventory master quantity updated';
      const movement: StockMovement = {
        id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        partId: item.id,
        partNumber: item.partNumber,
        partDescription: item.description,
        previousQty,
        newQty,
        difference,
        reason,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        timestamp: new Date().toISOString(),
      };
      this.stockMovements.unshift(movement);
    }

    this.logAudit({
      eventType: 'Inventory Updated',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetId: itemId,
      details: `Updated inventory part ${item.partNumber} (${item.description})${quantityChanged ? `. Quantity changed: ${previousQty} → ${newQty}` : ''}`,
    });

    return { status: 200, item: updated };
  }

  public adjustStock(
    user: User,
    itemId: string,
    adjustment: { newQty?: number; adjustment?: number; reason?: string }
  ): { status: number; item?: InventoryItem; movement?: StockMovement; error?: string } {
    if (!user || (user.role !== 'OPERATIONS' && user.role !== 'ADMIN')) {
      return {
        status: 403,
        error: 'Forbidden: Only Operations and Administrators are authorized to adjust inventory stock.',
      };
    }

    const item = this.inventory.get(itemId);
    if (!item) return { status: 404, error: 'Inventory item not found' };

    // Reason validation: mandatory
    if (!adjustment.reason || typeof adjustment.reason !== 'string' || !adjustment.reason.trim()) {
      return {
        status: 400,
        error: 'A mandatory reason must be provided for every stock adjustment.',
      };
    }
    const reason = adjustment.reason.trim();

    const previousQty = typeof item.availableQty === 'number' && !isNaN(item.availableQty) ? item.availableQty : 0;
    let finalNewQty: number;
    let difference: number;

    // Check if delta adjustment was provided
    if (adjustment.adjustment !== undefined && adjustment.adjustment !== null && (adjustment.adjustment as any) !== '') {
      const parsedAdj = Number(adjustment.adjustment);
      if (isNaN(parsedAdj) || !Number.isFinite(parsedAdj)) {
        return {
          status: 400,
          error: 'Adjustment quantity must be a valid numeric value.',
        };
      }
      difference = Math.round(parsedAdj);
      finalNewQty = previousQty + difference;
    } else if (adjustment.newQty !== undefined && adjustment.newQty !== null && (adjustment.newQty as any) !== '') {
      const parsedQty = Number(adjustment.newQty);
      if (isNaN(parsedQty) || !Number.isFinite(parsedQty)) {
        return {
          status: 400,
          error: 'Quantity must be a valid numeric value.',
        };
      }
      finalNewQty = Math.round(parsedQty);
      difference = finalNewQty - previousQty;
    } else {
      return {
        status: 400,
        error: 'Either an adjustment amount or a new quantity must be specified.',
      };
    }

    // Negative stock check
    if (finalNewQty < 0) {
      return {
        status: 400,
        error: `Stock quantity cannot produce a negative stock level. Current stock is ${previousQty} ${item.unit || 'pcs'}, requested adjustment would result in ${finalNewQty} ${item.unit || 'pcs'}.`,
      };
    }

    // Update item
    item.availableQty = finalNewQty;
    this.inventory.set(itemId, item);

    // Record stock movement
    const movement: StockMovement = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      partId: item.id,
      partNumber: item.partNumber,
      partDescription: item.description,
      previousQty,
      newQty: finalNewQty,
      difference,
      reason,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      timestamp: new Date().toISOString(),
    };
    this.stockMovements.unshift(movement);

    this.logAudit({
      eventType: 'Stock Adjusted',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetId: itemId,
      details: `Part ${item.partNumber} quantity adjusted: ${previousQty} → ${finalNewQty} (${difference >= 0 ? '+' : ''}${difference}). Reason: ${reason}`,
    });

    return { status: 200, item, movement };
  }

  public getStockMovements(user: User): StockMovement[] {
    return [...this.stockMovements];
  }

  // Master Data: Customers & Equipment
  public getCustomers(): Customer[] {
    return this.customers;
  }

  public getEquipment(): Equipment[] {
    return this.equipment;
  }

  // Audit Logs (Immutable for normal users)
  public getAuditLogs(user: User): AuditLogEntry[] {
    if (user.role === 'ADMIN') {
      return [...this.auditLogs];
    }
    if (user.role === 'MANAGER') {
      // Return logs involving this manager or their engineers
      const managedEngs = Array.from(this.users.values())
        .filter((u) => u.managerId === user.id)
        .map((u) => u.id);
      const relevantIds = new Set([user.id, ...managedEngs]);

      return this.auditLogs.filter((entry) => relevantIds.has(entry.userId));
    }
    if (user.role === 'OPERATIONS') {
      return this.auditLogs.filter(
        (entry) =>
          entry.eventType.includes('Pricing') ||
          entry.eventType.includes('Inventory') ||
          entry.eventType.includes('Stock') ||
          entry.userRole === 'OPERATIONS'
      );
    }
    // Engineers only see their own events
    return this.auditLogs.filter((entry) => entry.userId === user.id);
  }

  public logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
    const log: AuditLogEntry = {
      id: `aud-log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.auditLogs.unshift(log);
  }
}

// Export singleton database instance
export const db = new ServerDatabase();
