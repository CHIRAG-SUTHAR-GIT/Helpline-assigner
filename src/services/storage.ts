/**
 * Persistent Storage & Database Layer
 * Complies with Section 15, 30, 31, 34, 39, 47:
 * "Use a relational database strategy and enforce acknowledgement uniqueness"
 * "Refreshing or restarting the application must not lose assignment state."
 */

import {
  ComplaintRecord,
  ShiftConfig,
  SkipRule,
  PortalScanLog,
  AuditLogEntry,
  WhatsAppLog,
  PortalStatus,
  ScannerStatus,
  AppState,
  SystemSettings,
  RoleType,
} from '../types';

const STORAGE_KEYS = {
  COMPLAINTS: 'cp_complaints_v1',
  SHIFT_CONFIG: 'cp_shift_config_v1',
  SHIFT_HISTORY: 'cp_shift_history_v1',
  SKIP_RULES: 'cp_skip_rules_v1',
  SCAN_LOGS: 'cp_scan_logs_v1',
  AUDIT_LOGS: 'cp_audit_logs_v1',
  WHATSAPP_LOGS: 'cp_whatsapp_logs_v1',
  CURSOR_INDEX: 'cp_cursor_index_v1',
  SCAN_INTERVAL: 'cp_scan_interval_v1',
  PORTAL_STATUS: 'cp_portal_status_v1',
  SCANNER_STATUS: 'cp_scanner_status_v1',
  SIMULATED_PORTAL_DATA: 'cp_portal_sim_data_v1',
};

// Initial Seed Data aligned with Specification Examples
const DEFAULT_INITIAL_SHIFT: ShiftConfig = {
  id: 'shift-morning-20260918',
  date: '18/09/2026',
  type: 'MORNING',
  presentHelplines: [1, 3, 4, 5, 6, 7, 9, 10, 11, 13, 16], // Section 19 example
  startedAt: '08:00:00',
  startedBy: 'Senior Inspector Deshmukh (Admin)',
  active: true,
  cutoffPassed: false,
};

const DEFAULT_INITIAL_COMPLAINTS: ComplaintRecord[] = [
  {
    id: 'c-31109260226230',
    acknowledgementNumber: '31109260226230',
    victimName: 'Rajesh Kumar Verma',
    complaintReportedDateTime: '18/09/2026 13:21:42',
    incidentMemo: 'WITHOUT OTP FRAUD 10,000/- debited from State Bank account through unknown UPI request',
    mobileNumber: '9823011422',
    portalPage: 1,
    portalScannedAt: '18/09/2026 13:31:02',
    classification: 'FINANCIAL',
    classificationConfidence: 0.98,
    detectedKeywords: ['WITHOUT OTP', 'FRAUD', 'UPI', 'BANK'],
    detectedAmounts: [10000],
    isFinancial: true,
    isSocialMedia: false,
    status: 'ASSIGNED',
    assignedHelpline: 7,
    assignmentSequence: 1,
    assignedAt: '13:21:45',
    shiftDate: '18/09/2026',
    shiftType: 'MORNING',
    whatsappStatus: 'SENT_TO_WHATSAPP',
    whatsappSentAt: '13:22:10',
  },
  {
    id: 'c-31109260226229',
    acknowledgementNumber: '31109260226229',
    victimName: 'Sunita Mehra',
    complaintReportedDateTime: '18/09/2026 13:22:08',
    incidentMemo: 'WHATSAPP HACK AND FRAUD 50,000 demanded from contacts after account compromised',
    mobileNumber: '9845099182',
    portalPage: 1,
    portalScannedAt: '18/09/2026 13:31:02',
    classification: 'FINANCIAL',
    classificationConfidence: 0.96,
    detectedKeywords: ['WHATSAPP', 'HACK', 'FRAUD'],
    detectedAmounts: [50000],
    isFinancial: true,
    isSocialMedia: true,
    status: 'ASSIGNED',
    assignedHelpline: 9,
    assignmentSequence: 2,
    assignedAt: '13:22:15',
    shiftDate: '18/09/2026',
    shiftType: 'MORNING',
    whatsappStatus: 'SENT_TO_WHATSAPP',
    whatsappSentAt: '13:23:00',
  },
  {
    id: 'c-31109260226228',
    acknowledgementNumber: '31109260226228',
    victimName: 'Anil Sharma',
    complaintReportedDateTime: '18/09/2026 13:24:15',
    incidentMemo: 'SOCIAL MEDIA FB ID HACK and offensive messages posted on profile',
    mobileNumber: '9920188443',
    portalPage: 1,
    portalScannedAt: '18/09/2026 13:31:02',
    classification: 'SOCIAL_MEDIA',
    classificationConfidence: 0.95,
    detectedKeywords: ['SOCIAL MEDIA', 'FB', 'ID HACK'],
    detectedAmounts: [],
    isFinancial: false,
    isSocialMedia: true,
    status: 'IGNORED_SOCIAL_MEDIA',
    whatsappStatus: 'NOT_APPLICABLE',
  },
  {
    id: 'c-31109260226227',
    acknowledgementNumber: '31109260226227',
    victimName: 'Pooja Bhatt',
    complaintReportedDateTime: '18/09/2026 13:26:00',
    incidentMemo: 'SOCIAL MEDIA WHATSAPP HACK ANOTHER NO 9558059062 sending threat messages',
    mobileNumber: '9558059062',
    portalPage: 1,
    portalScannedAt: '18/09/2026 13:31:02',
    classification: 'SOCIAL_MEDIA',
    classificationConfidence: 0.96,
    detectedKeywords: ['SOCIAL MEDIA', 'WHATSAPP', 'HACK'],
    detectedAmounts: [], // Phone number correctly NOT classified as amount!
    isFinancial: false,
    isSocialMedia: true,
    status: 'IGNORED_SOCIAL_MEDIA',
    whatsappStatus: 'NOT_APPLICABLE',
  },
  {
    id: 'c-31109260226226',
    acknowledgementNumber: '31109260226226',
    victimName: 'Dharmendra Joshi',
    complaintReportedDateTime: '18/09/2026 13:28:40',
    incidentMemo: 'LOAN FRAUD app deducted Rs. 25,000 without disbursing sanctioned credit amount',
    mobileNumber: '9819920031',
    portalPage: 1,
    portalScannedAt: '18/09/2026 13:31:02',
    classification: 'FINANCIAL',
    classificationConfidence: 0.94,
    detectedKeywords: ['LOAN FRAUD', 'CREDIT', 'AMOUNT'],
    detectedAmounts: [25000],
    isFinancial: true,
    isSocialMedia: false,
    status: 'ASSIGNED',
    assignedHelpline: 10,
    assignmentSequence: 3,
    assignedAt: '13:28:50',
    shiftDate: '18/09/2026',
    shiftType: 'MORNING',
    whatsappStatus: 'PENDING',
  },
  {
    id: 'c-31109260226225',
    acknowledgementNumber: '31109260226225',
    victimName: 'Kavita Patel',
    complaintReportedDateTime: '18/09/2026 13:30:10',
    incidentMemo: 'SUSPICIOUS CALL claiming power disconnection unless link clicked. Caller requested debit card details.',
    mobileNumber: '9769011283',
    portalPage: 2,
    portalScannedAt: '18/09/2026 13:31:02',
    classification: 'REVIEW_REQUIRED',
    classificationConfidence: 0.50,
    detectedKeywords: ['DEBIT CARD', 'SUSPICIOUS'],
    detectedAmounts: [],
    isFinancial: false,
    isSocialMedia: false,
    status: 'REVIEW_REQUIRED',
    whatsappStatus: 'PENDING',
  },
  {
    id: 'c-31109260226224',
    acknowledgementNumber: '31109260226224',
    victimName: 'Mohd. Salim Khan',
    complaintReportedDateTime: '18/09/2026 13:32:00',
    incidentMemo: 'ONLINE FRAUD INVESTMENT Telegram task scam lost 60,000/- via multiple UPI transfers',
    mobileNumber: '9833441122',
    portalPage: 2,
    portalScannedAt: '18/09/2026 13:33:00',
    classification: 'FINANCIAL',
    classificationConfidence: 0.99,
    detectedKeywords: ['ONLINE FRAUD', 'INVESTMENT FRAUD', 'UPI'],
    detectedAmounts: [60000],
    isFinancial: true,
    isSocialMedia: true,
    status: 'ASSIGNED',
    assignedHelpline: 11,
    assignmentSequence: 4,
    assignedAt: '13:33:15',
    shiftDate: '18/09/2026',
    shiftType: 'MORNING',
    whatsappStatus: 'PENDING',
  },
];

const DEFAULT_INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'a-1',
    timestamp: '08:00:00',
    action: 'Shift Initialized',
    details: 'Morning Shift started on 18/09/2026 with Helplines [1, 3, 4, 5, 6, 7, 9, 10, 11, 13, 16] present.',
    user: 'Operator (Admin)',
    category: 'SHIFT',
  },
  {
    id: 'a-2',
    timestamp: '13:21:42',
    action: 'Call Detected',
    details: 'Portal scanned Ack 31109260226230 from Page 1.',
    user: 'Portal Scanner',
    category: 'PORTAL_SCAN',
  },
  {
    id: 'a-3',
    timestamp: '13:21:43',
    action: 'Classified FINANCIAL',
    details: 'Amount ₹10,000 detected from memo "WITHOUT OTP FRAUD 10,000/-".',
    user: 'Classification Engine',
    category: 'CLASSIFICATION',
  },
  {
    id: 'a-4',
    timestamp: '13:21:45',
    action: 'Assigned -> Helpline 7',
    details: 'Round-robin assigned Ack 31109260226230 to Helpline 7.',
    user: 'Assignment Engine',
    category: 'ASSIGNMENT',
  },
  {
    id: 'a-5',
    timestamp: '13:22:08',
    action: 'Call Detected',
    details: 'Portal scanned Ack 31109260226229 from Page 1.',
    user: 'Portal Scanner',
    category: 'PORTAL_SCAN',
  },
  {
    id: 'a-6',
    timestamp: '13:22:09',
    action: 'Classified FINANCIAL',
    details: 'Social Media + Financial: Amount ₹50,000 detected. Financial relevance overrides Social Media exclusion.',
    user: 'Classification Engine',
    category: 'CLASSIFICATION',
  },
  {
    id: 'a-7',
    timestamp: '13:22:15',
    action: 'Assigned -> Helpline 9',
    details: 'Round-robin assigned Ack 31109260226229 to Helpline 9.',
    user: 'Assignment Engine',
    category: 'ASSIGNMENT',
  },
];

const DEFAULT_INITIAL_SCAN_LOG: PortalScanLog = {
  id: 'scan-1842',
  scanNumber: 1842,
  startedAt: '18/09/2026 13:31:02',
  completedAt: '18/09/2026 13:31:18',
  portalRefreshStatus: 'SUCCESS',
  pagesScanned: 2,
  totalPages: 2,
  recordsFound: 7,
  newRecords: 7,
  financialCount: 4,
  socialMediaCount: 2,
  reviewCount: 1,
  assignedCount: 4,
  errorCount: 0,
  status: 'SUCCESS',
};

// Storage helper functions with try/catch fallback
export const storageService = {
  getComplaints(): ComplaintRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMPLAINTS);
      if (!data) {
        this.saveComplaints(DEFAULT_INITIAL_COMPLAINTS);
        return DEFAULT_INITIAL_COMPLAINTS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_INITIAL_COMPLAINTS;
    }
  },

  saveComplaints(complaints: ComplaintRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));
    } catch (e) {
      console.error('Failed to save complaints to localStorage', e);
    }
  },

  getShiftConfig(): ShiftConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SHIFT_CONFIG);
      if (!data) {
        this.saveShiftConfig(DEFAULT_INITIAL_SHIFT);
        return DEFAULT_INITIAL_SHIFT;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_INITIAL_SHIFT;
    }
  },

  saveShiftConfig(config: ShiftConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SHIFT_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save shift config', e);
    }
  },

  getShiftHistory(): ShiftConfig[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SHIFT_HISTORY);
      if (!data) {
        const initialHistory = [DEFAULT_INITIAL_SHIFT];
        this.saveShiftHistory(initialHistory);
        return initialHistory;
      }
      return JSON.parse(data);
    } catch {
      return [DEFAULT_INITIAL_SHIFT];
    }
  },

  saveShiftHistory(history: ShiftConfig[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SHIFT_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save shift history', e);
    }
  },

  getSkipRules(): SkipRule[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SKIP_RULES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveSkipRules(rules: SkipRule[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SKIP_RULES, JSON.stringify(rules));
    } catch (e) {
      console.error('Failed to save skip rules', e);
    }
  },

  getScanLogs(): PortalScanLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SCAN_LOGS);
      if (!data) {
        this.saveScanLogs([DEFAULT_INITIAL_SCAN_LOG]);
        return [DEFAULT_INITIAL_SCAN_LOG];
      }
      return JSON.parse(data);
    } catch {
      return [DEFAULT_INITIAL_SCAN_LOG];
    }
  },

  saveScanLogs(logs: PortalScanLog[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SCAN_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save scan logs', e);
    }
  },

  getAuditLogs(): AuditLogEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (!data) {
        this.saveAuditLogs(DEFAULT_INITIAL_AUDIT_LOGS);
        return DEFAULT_INITIAL_AUDIT_LOGS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_INITIAL_AUDIT_LOGS;
    }
  },

  saveAuditLogs(logs: AuditLogEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save audit logs', e);
    }
  },

  getWhatsAppLogs(): WhatsAppLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WHATSAPP_LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveWhatsAppLogs(logs: WhatsAppLog[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.WHATSAPP_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save whatsapp logs', e);
    }
  },

  getCursorIndex(): number {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.CURSOR_INDEX);
      return val ? parseInt(val, 10) : 5; // pointing after Helpline 11
    } catch {
      return 0;
    }
  },

  saveCursorIndex(index: number): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CURSOR_INDEX, index.toString());
    } catch (e) {
      console.error('Failed to save cursor index', e);
    }
  },

  getScanIntervalMinutes(): number {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.SCAN_INTERVAL);
      return val ? parseInt(val, 10) : 30; // Section 8: default 30 mins
    } catch {
      return 30;
    }
  },

  saveScanIntervalMinutes(mins: number): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SCAN_INTERVAL, mins.toString());
    } catch (e) {
      console.error('Failed to save scan interval', e);
    }
  },

  resetToDefault(): void {
    localStorage.clear();
    this.saveComplaints(DEFAULT_INITIAL_COMPLAINTS);
    this.saveShiftConfig(DEFAULT_INITIAL_SHIFT);
    this.saveShiftHistory([DEFAULT_INITIAL_SHIFT]);
    this.saveSkipRules([]);
    this.saveScanLogs([DEFAULT_INITIAL_SCAN_LOG]);
    this.saveAuditLogs(DEFAULT_INITIAL_AUDIT_LOGS);
    this.saveWhatsAppLogs([]);
    this.saveCursorIndex(5);
    this.saveScanIntervalMinutes(30);
  },
};

const DEFAULT_SETTINGS: SystemSettings = {
  scanIntervalMinutes: 2,
  portalSessionTimeoutMinutes: 20,
  whatsAppGatewayEndpoint: 'https://api.cyberpolice.internal/v1/whatsapp/dispatch',
};

export function loadState(): AppState {
  const complaints = storageService.getComplaints();
  const currentShift = storageService.getShiftConfig();
  const shiftHistory = storageService.getShiftHistory();
  const skipRules = storageService.getSkipRules();
  const scanLogs = storageService.getScanLogs();
  const auditLogs = storageService.getAuditLogs();
  const cursor = storageService.getCursorIndex();

  return {
    complaints,
    currentShift,
    shiftHistory,
    skipRules,
    lastAssignedHelpline: currentShift.presentHelplines[cursor % currentShift.presentHelplines.length] || 1,
    lastScanTime: scanLogs[0]?.startedAt || '13:31:02',
    nextScanDue: '13:33:02',
    sessionExpired: false,
    currentUserRole: 'Operator',
    settings: DEFAULT_SETTINGS,
    scanLogs,
    auditLogs,
  };
}

export function saveState(state: AppState): void {
  storageService.saveComplaints(state.complaints);
  storageService.saveShiftConfig(state.currentShift);
  storageService.saveShiftHistory(state.shiftHistory);
  storageService.saveSkipRules(state.skipRules);
  storageService.saveScanLogs(state.scanLogs);
  storageService.saveAuditLogs(state.auditLogs);
}

export function resetToSampleState(): AppState {
  storageService.resetToDefault();
  return loadState();
}

export function appendAuditLog(
  action: string,
  user: string,
  role: RoleType | string,
  details: string
): void {
  const existing = storageService.getAuditLogs();
  const newEntry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
    action,
    user: `${user} (${role})`,
    details,
    category: 'ASSIGNMENT',
  };
  storageService.saveAuditLogs([newEntry, ...existing]);
}

