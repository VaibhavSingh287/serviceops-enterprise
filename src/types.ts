export type UserRole = 'FIELD_ENGINEER' | 'MANAGER' | 'OPERATIONS' | 'ADMIN';

export interface User {
  id: string;
  enterpriseId?: string; // e.g., "ENG-001", "MGR-001", "OPS-001", "ADM-001"
  name: string; // e.g., "Eng 1", "Manager 1", "Ops 1", "Admin 1"
  role: UserRole;
  designation: string;
  email: string;
  phone: string;
  avatarColor: string;
  managerId?: string; // Foreign key relationship to Manager ID (e.g. usr-mgr-1, usr-mgr-2)
  isActive?: boolean;
}

export type JobCardStatus =
  | 'Draft'
  | 'In Progress'
  | 'Submitted'
  | 'Pending Review'
  | 'Changes Requested'
  | 'Pricing Review'
  | 'Approved'
  | 'Completed'
  | 'Rejected';

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type ServiceType =
  | 'Preventive Maintenance'
  | 'Breakdown Repair'
  | 'Emergency Service'
  | 'Inspection & Audit'
  | 'Calibration & Testing';

export type ChecklistItemStatus = 'Completed' | 'Issue Found' | 'Not Applicable' | 'Pending';

export interface ChecklistIssue {
  description: string;
  severity: 'Minor' | 'Moderate' | 'Critical';
  recommendation?: string;
  notes?: string;
  evidenceThumbnail?: string;
}

export interface ChecklistItem {
  id: string;
  code: string;
  label: string;
  category: 'Safety' | 'Mechanical' | 'Electrical' | 'Operational' | 'Environmental';
  status: ChecklistItemStatus;
  issue?: ChecklistIssue;
}

export interface PartItem {
  id: string;
  partNumber: string;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  total: number;
  standardPrice: number; // reference master price to calculate variance
  inStock: number;
}

export type JobCardPart = PartItem;

export interface AttachmentItem {
  id: string;
  category: 'Before Service' | 'After Service' | 'Equipment Plate' | 'Damaged Part' | 'Other';
  name: string;
  dataUrl: string;
  uploadedAt: string;
  sizeKb: number;
  type: string;
}

export interface PricingBreakdown {
  parts: number;
  labourHours: number;
  labourRate: number;
  labour: number;
  serviceCharges: number;
  discount: number;
  taxRate: number; // e.g. 0.18 (18%)
  tax: number;
  total: number;
  isApprovedPricing?: boolean;
}

export interface CustomerSignOff {
  signeeName?: string;
  signedByName?: string;
  signeeDesignation?: string;
  signedByDesignation?: string;
  signeePhone?: string;
  contactPhone?: string;
  signatureDate?: string;
  signedAt?: string;
  signatureDataUrl?: string; // canvas or digital signature stamp
  remarks?: string;
  isConfirmed: boolean;
}

export interface RevisionRequest {
  id: string;
  requestedAt: string;
  managerId?: string;
  managerName?: string;
  requestedByName?: string;
  notes?: string;
  comments?: string;
  sections: string[];
  status?: 'Pending' | 'Addressed';
  addressedAt?: string;
  resubmittedAt?: string;
  resubmittedNotes?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  statusChange?: {
    from: JobCardStatus;
    to: JobCardStatus;
  };
}

export interface AIReviewResult {
  completenessCheck: {
    isComplete: boolean;
    missingRequired: string[];
    warnings: string[];
  };
  inconsistencies: Array<{
    title: string;
    reportedIssue: string;
    workPerformed: string;
    recommendation: string;
    severity: 'warning' | 'info' | 'high';
  }>;
  pricingVariances: Array<{
    partNumber: string;
    partName: string;
    standardPrice: number;
    appliedPrice: number;
    differencePct: number;
    flag: 'normal' | 'attention' | 'critical';
    message: string;
  }>;
  executiveSummary: string;
  lastCheckedAt?: string;
}

export interface JobCard {
  id: string; // e.g., "JC-2026-0148"
  customerId: string;
  customerName: string;
  siteLocation: string;
  contactPerson: string;
  contactPhone: string;
  equipmentId: string;
  equipmentName: string;
  equipmentType: string;
  model: string;
  serialNumber: string;
  operatingHours?: number;
  
  serviceType: ServiceType;
  serviceDate: string;
  scheduledTime?: string;
  priority: PriorityLevel;
  problemReported: string;
  engineerNotes?: string;

  assignedEngineerId: string;
  assignedEngineerName: string; // "Eng 1", "Eng 2", etc.
  managerId: string; // Foreign key relationship to assigned Manager (usr-mgr-1, usr-mgr-2, etc.)
  
  status: JobCardStatus;
  currentStep: number; // 1 to 7
  completedSteps: number[]; // e.g. [1, 2, 3]

  checklist: ChecklistItem[];
  parts: PartItem[];
  
  workPerformed: string;
  recommendations?: string;
  additionalNotes?: string;
  
  attachments: AttachmentItem[];
  pricing: PricingBreakdown;
  
  // Customer Authorization
  customerSignOff?: CustomerSignOff;

  // Review & Approval data
  managerNotes?: string;
  changesRequestedSections?: string[];
  revisionHistory?: RevisionRequest[];
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  
  aiReview?: AIReviewResult;
  auditTrail: AuditEvent[];
  
  createdAt: string;
  updatedAt: string;
  lastSavedAt: string;
  submittedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  industry: string;
  contactPerson: string;
  contactRole: string;
  email: string;
  phone: string;
  address: string;
  sites: Array<{
    id: string;
    name: string;
    location: string;
    accessProtocol?: string;
  }>;
}

export interface Equipment {
  id: string;
  customerId: string;
  customerName: string;
  siteId: string;
  siteName: string;
  name: string;
  equipmentType: string;
  model: string;
  serialNumber: string;
  installedDate: string;
  lastServiceDate: string;
  operatingHours: number;
  status: 'Operational' | 'Requires Service' | 'Critical Fault' | 'Under Maintenance';
}

export interface InventoryItem {
  id: string;
  partNumber: string;
  description: string;
  category: string;
  unit: string;
  unitPrice: number;
  standardCost?: number;
  availableQty: number;
  reorderLevel: number;
  binLocation: string;
  isActive?: boolean;
}

export interface StockMovement {
  id: string;
  partId: string;
  partNumber: string;
  partDescription: string;
  previousQty: number;
  newQty: number;
  difference: number;
  reason: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  timestamp: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventType: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  targetId?: string;
  details: string;
  ipAddress?: string;
}

