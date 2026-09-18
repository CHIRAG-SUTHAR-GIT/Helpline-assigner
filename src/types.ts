/**
 * Types & Enums for Cyber Police Call Assignment & Tracking System
 * Compliant with Master Development Prompt / Technical Specification
 */

export type HelplineId = number; // 1 to 16

export type ShiftType = 'MORNING' | 'EVENING';

export type RoleType = 'Admin' | 'Operator' | 'Viewer';

export type ClassificationType = 'FINANCIAL' | 'SOCIAL_MEDIA' | 'REVIEW_REQUIRED' | 'OTHER';

export type AssignmentStatus =
  | 'NEW'
  | 'FINANCIAL'
  | 'ASSIGNED'
  | 'SKIPPED'
  | 'IGNORED_SOCIAL_MEDIA'
  | 'IGNORED_OTHER'
  | 'REVIEW_REQUIRED'
  | 'PENDING'
  | 'SENT_TO_WHATSAPP'
  | 'ERROR';

export type PortalStatus =
  | 'CONNECTED'
  | 'SCANNING'
  | 'REFRESHING'
  | 'PROCESSING'
  | 'SESSION_EXPIRED'
  | 'WAITING_FOR_MANUAL_LOGIN'
  | 'VERIFYING_LOGIN'
  | 'RECOVERING'
  | 'ERROR'
  | 'PAUSED';

export type ScannerStatus = 'RUNNING' | 'PAUSED' | 'IDLE' | 'ERROR';

export type WhatsAppStatus = 'PENDING' | 'SENT_TO_WHATSAPP' | 'NOT_APPLICABLE' | 'FAILED';

export interface ComplaintRecord {
  id: string; // internal UUID
  acknowledgementNumber: string; // unique 14-digit identifier (e.g. 31109260226230)
  victimName: string;
  complaintReportedDateTime: string; // Asia/Kolkata date time string (e.g. 18/09/2026 13:21:42)
  incidentMemo: string; // "Additional Information About the Incident"
  mobileNumber: string; // Complainant / Victim contact
  
  // Portal metadata
  portalPage: number;
  portalScannedAt: string;

  // Classification results
  classification: ClassificationType;
  classificationConfidence: number; // 0 to 1
  detectedKeywords: string[];
  detectedAmounts: number[];
  isFinancial: boolean;
  isSocialMedia: boolean;

  // Assignment details
  status: AssignmentStatus;
  assignedHelpline?: number; // 1..16
  assignmentSequence?: number;
  assignedAt?: string;
  shiftDate?: string; // DD/MM/YYYY
  shiftType?: ShiftType;
  
  // Skip information if skipped
  skipped?: boolean;
  skipReason?: string;

  // WhatsApp dispatch tracking
  whatsappStatus: WhatsAppStatus;
  whatsappSentAt?: string;
  whatsappRecipient?: string;

  // Manual Reassignment audit
  manualReassigned?: boolean;
  manualReassignedReason?: string;
  reassignedFrom?: number;
  reassignedAt?: string;
  reassignedBy?: string;
}

export interface ShiftConfig {
  id: string;
  date: string; // DD/MM/YYYY
  type: ShiftType;
  presentHelplines: number[]; // e.g. [1, 3, 4, 5, 6, 7, 9, 10, 11, 13, 16]
  startedAt: string;
  startedBy: string;
  active: boolean;
  cutoffPassed: boolean;
}

export interface SkipRule {
  id: string;
  helpline: number; // 1..16
  type: 'SKIP_N' | 'SKIP_SHIFT';
  remainingCount: number;
  initialCount: number;
  reason?: string;
  createdAt: string;
  createdBy: string;
  active: boolean;
}

export interface PortalScanLog {
  id: string;
  scanNumber: number;
  startedAt: string;
  completedAt?: string;
  portalRefreshStatus: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  pagesScanned: number;
  totalPages: number;
  recordsFound: number;
  newRecords: number;
  financialCount: number;
  socialMediaCount: number;
  reviewCount: number;
  assignedCount: number;
  errorCount: number;
  status: 'SUCCESS' | 'SESSION_EXPIRED' | 'ERROR';
  errorMessage?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
  role?: string;
  category?:
    | 'PORTAL_SCAN'
    | 'CLASSIFICATION'
    | 'ASSIGNMENT'
    | 'SKIP'
    | 'REASSIGNMENT'
    | 'IMAGE_GEN'
    | 'WHATSAPP'
    | 'SESSION'
    | 'SHIFT'
    | 'REVIEW';
}

export interface WhatsAppLog {
  id: string;
  timestamp: string;
  shiftDate: string;
  shiftType: ShiftType;
  assignedCount: number;
  recipientGroup: string;
  status: 'SENT' | 'FAILED' | 'QUEUED';
  imageUri?: string;
  details?: string;
}

export interface SystemSettings {
  scanIntervalMinutes: number; // 1, 2, 3, or 5
  portalSessionTimeoutMinutes: number;
  whatsAppGatewayEndpoint: string;
}

export interface AppState {
  complaints: ComplaintRecord[];
  currentShift: ShiftConfig;
  shiftHistory: ShiftConfig[];
  skipRules: SkipRule[];
  lastAssignedHelpline: number;
  lastScanTime: string;
  nextScanDue: string;
  sessionExpired: boolean;
  currentUserRole: RoleType;
  settings: SystemSettings;
  scanLogs: PortalScanLog[];
  auditLogs: AuditLogEntry[];
}

export interface TestResult {
  id: string;
  testNumber: number;
  title: string;
  description: string;
  passed: boolean;
  details: string;
  durationMs: number;
}
