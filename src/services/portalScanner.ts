/**
 * Cyber Police Portal Scanner Engine & Session Monitor
 * Implements Sections 1, 4, 5, 6, 7, 8, 14, 35, 36
 */

import {
  ComplaintRecord,
  PortalStatus,
  ScannerStatus,
  PortalScanLog,
  AuditLogEntry,
} from '../types';
import { classifyComplaintMemo } from './classificationEngine';
import { storageService } from './storage';

export interface PortalRawRow {
  col0_ignoredCheckbox: string;
  acknowledgementNumber: string;
  victimName: string;
  reportedDateTime: string;
  incidentMemo: string;
  mobileNumber: string;
  col6_ignoredActions: string;
  pageNumber: number;
}

// Simulated Portal Database with realistic live pages
export const INITIAL_SIMULATED_PORTAL_DATA: PortalRawRow[] = [
  // Page 1
  {
    col0_ignoredCheckbox: 'check',
    acknowledgementNumber: '31109260226230',
    victimName: 'Rajesh Kumar Verma',
    reportedDateTime: '18/09/2026 13:21:42',
    incidentMemo: 'WITHOUT OTP FRAUD 10,000/- debited from State Bank account through unknown UPI request',
    mobileNumber: '9823011422',
    col6_ignoredActions: 'VIEW_DETAILS',
    pageNumber: 1,
  },
  {
    col0_ignoredCheckbox: 'check',
    acknowledgementNumber: '31109260226229',
    victimName: 'Sunita Mehra',
    reportedDateTime: '18/09/2026 13:22:08',
    incidentMemo: 'WHATSAPP HACK AND FRAUD 50,000 demanded from contacts after account compromised',
    mobileNumber: '9845099182',
    col6_ignoredActions: 'VIEW_DETAILS',
    pageNumber: 1,
  },
  {
    col0_ignoredCheckbox: 'check',
    acknowledgementNumber: '31109260226228',
    victimName: 'Anil Sharma',
    reportedDateTime: '18/09/2026 13:24:15',
    incidentMemo: 'SOCIAL MEDIA FB ID HACK and offensive messages posted on profile',
    mobileNumber: '9920188443',
    col6_ignoredActions: 'VIEW_DETAILS',
    pageNumber: 1,
  },
  {
    col0_ignoredCheckbox: 'check',
    acknowledgementNumber: '31109260226227',
    victimName: 'Pooja Bhatt',
    reportedDateTime: '18/09/2026 13:26:00',
    incidentMemo: 'SOCIAL MEDIA WHATSAPP HACK ANOTHER NO 9558059062 sending threat messages',
    mobileNumber: '9558059062',
    col6_ignoredActions: 'VIEW_DETAILS',
    pageNumber: 1,
  },
  {
    col0_ignoredCheckbox: 'check',
    acknowledgementNumber: '31109260226226',
    victimName: 'Dharmendra Joshi',
    reportedDateTime: '18/09/2026 13:28:40',
    incidentMemo: 'LOAN FRAUD app deducted Rs. 25,000 without disbursing sanctioned credit amount',
    mobileNumber: '9819920031',
    col6_ignoredActions: 'VIEW_DETAILS',
    pageNumber: 1,
  },
  // Page 2
  {
    col0_ignoredCheckbox: 'check',
    acknowledgementNumber: '31109260226225',
    victimName: 'Kavita Patel',
    reportedDateTime: '18/09/2026 13:30:10',
    incidentMemo: 'SUSPICIOUS CALL claiming power disconnection unless link clicked. Caller requested debit card details.',
    mobileNumber: '9769011283',
    col6_ignoredActions: 'VIEW_DETAILS',
    pageNumber: 2,
  },
  {
    col0_ignoredCheckbox: 'check',
    acknowledgementNumber: '31109260226224',
    victimName: 'Mohd. Salim Khan',
    reportedDateTime: '18/09/2026 13:32:00',
    incidentMemo: 'ONLINE FRAUD INVESTMENT Telegram task scam lost 60,000/- via multiple UPI transfers',
    mobileNumber: '9833441122',
    col6_ignoredActions: 'VIEW_DETAILS',
    pageNumber: 2,
  },
  {
    col0_ignoredCheckbox: 'check',
    acknowledgementNumber: '31109260226223',
    victimName: 'Geeta Nair',
    reportedDateTime: '18/09/2026 13:35:12',
    incidentMemo: 'CARD FRAUD international unauthorized transaction of INR 32,500 on credit card without OTP',
    mobileNumber: '9870023411',
    col6_ignoredActions: 'VIEW_DETAILS',
    pageNumber: 2,
  },
  {
    col0_ignoredCheckbox: 'check',
    acknowledgementNumber: '31109260226222',
    victimName: 'Vikramaditya Rao',
    reportedDateTime: '18/09/2026 13:38:05',
    incidentMemo: 'INSTAGRAM ID HACK profile cloned and sending follower requests to friends',
    mobileNumber: '9866112233',
    col6_ignoredActions: 'VIEW_DETAILS',
    pageNumber: 2,
  },
  // Page 3
  {
    col0_ignoredCheckbox: 'check',
    acknowledgementNumber: '31109260226221',
    victimName: 'Dr. Anand Swaminathan',
    reportedDateTime: '18/09/2026 13:40:50',
    incidentMemo: 'NET BANKING FRAUD RTGS transfer of 1,50,000/- executed by remote access app AnyDesk',
    mobileNumber: '9820055441',
    col6_ignoredActions: 'VIEW_DETAILS',
    pageNumber: 3,
  },
  {
    col0_ignoredCheckbox: 'check',
    acknowledgementNumber: '31109260226220',
    victimName: 'Sanjay Deshmukh',
    reportedDateTime: '18/09/2026 13:44:50',
    incidentMemo: 'PAYMENT FRAUD QR code scam in OLX selling ₹ 18,500 debited from PhonePe account',
    mobileNumber: '9821033221',
    col6_ignoredActions: 'VIEW_DETAILS',
    pageNumber: 3,
  },
  {
    col0_ignoredCheckbox: 'check',
    acknowledgementNumber: '31109260226219',
    victimName: 'Ritu Chawla',
    reportedDateTime: '18/09/2026 13:45:00', // EXACT BOUNDARY: 13:45:00 -> INELIGIBLE for morning shift!
    incidentMemo: 'ATM DEBIT CARD SKIMMING 12,000 withdrawn from ICICI ATM',
    mobileNumber: '9811099881',
    col6_ignoredActions: 'VIEW_DETAILS',
    pageNumber: 3,
  },
];

export interface PortalScanResult {
  scanLog: PortalScanLog;
  newComplaints: ComplaintRecord[];
  auditEntries: AuditLogEntry[];
}

/**
 * Scans the Cyber Police Portal following Sections 4, 14, 15:
 * 1. Check portal session
 * 2. Click portal Refresh button
 * 3. Discover total pages
 * 4. Scan all pages
 * 5. Extract only required 5 fields (ignore 1st and last)
 * 6. Deduplicate by Acknowledgement Number
 * 7. Classify complaints
 */
export function scanPortalData(
  existingComplaints: ComplaintRecord[],
  portalRows: PortalRawRow[],
  currentScanNumber: number
): PortalScanResult {
  const startedAt = new Date().toLocaleString('en-IN', { hour12: false });
  const auditEntries: AuditLogEntry[] = [];
  const existingAckSet = new Set(existingComplaints.map(c => c.acknowledgementNumber));

  // Determine total pages
  const totalPages = Math.max(...portalRows.map(r => r.pageNumber), 1);

  auditEntries.push({
    id: `audit-scan-start-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
    action: 'Portal Refresh Clicked',
    details: `Portal refresh button clicked. Reloading table across ${totalPages} pages.`,
    user: 'Portal Scanner',
    category: 'PORTAL_SCAN',
  });

  let financialCount = 0;
  let socialMediaCount = 0;
  let reviewCount = 0;
  const newComplaints: ComplaintRecord[] = [];

  for (const row of portalRows) {
    // Check if already in database (duplicate protection Section 15)
    if (existingAckSet.has(row.acknowledgementNumber)) {
      continue;
    }

    // Extract 5 fields, ignore col0 and col6
    const memo = row.incidentMemo;
    const classificationRes = classifyComplaintMemo(memo);

    if (classificationRes.classification === 'FINANCIAL') {
      financialCount++;
    } else if (classificationRes.classification === 'SOCIAL_MEDIA') {
      socialMediaCount++;
    } else if (classificationRes.classification === 'REVIEW_REQUIRED') {
      reviewCount++;
    }

    const newRecord: ComplaintRecord = {
      id: `c-${row.acknowledgementNumber}`,
      acknowledgementNumber: row.acknowledgementNumber,
      victimName: row.victimName,
      complaintReportedDateTime: row.reportedDateTime,
      incidentMemo: row.incidentMemo,
      mobileNumber: row.mobileNumber,
      portalPage: row.pageNumber,
      portalScannedAt: startedAt,
      classification: classificationRes.classification,
      classificationConfidence: classificationRes.confidence,
      detectedKeywords: classificationRes.detectedKeywords,
      detectedAmounts: classificationRes.detectedAmounts,
      isFinancial: classificationRes.isFinancial,
      isSocialMedia: classificationRes.isSocialMedia,
      status:
        classificationRes.classification === 'FINANCIAL'
          ? 'NEW'
          : classificationRes.classification === 'SOCIAL_MEDIA'
          ? 'IGNORED_SOCIAL_MEDIA'
          : classificationRes.classification === 'REVIEW_REQUIRED'
          ? 'REVIEW_REQUIRED'
          : 'IGNORED_OTHER',
      whatsappStatus: classificationRes.classification === 'FINANCIAL' ? 'PENDING' : 'NOT_APPLICABLE',
    };

    newComplaints.push(newRecord);
    existingAckSet.add(row.acknowledgementNumber);

    auditEntries.push({
      id: `audit-scan-extract-${row.acknowledgementNumber}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
      action: 'Call Detected & Classified',
      details: `Ack ${row.acknowledgementNumber} [${row.reportedDateTime}] - Classified: ${classificationRes.classification}${
        classificationRes.detectedAmounts.length > 0
          ? ` (₹${classificationRes.detectedAmounts[0].toLocaleString('en-IN')})`
          : ''
      }`,
      user: 'Classification Engine',
      category: 'CLASSIFICATION',
    });
  }

  const completedAt = new Date().toLocaleString('en-IN', { hour12: false });

  const scanLog: PortalScanLog = {
    id: `scan-${currentScanNumber}`,
    scanNumber: currentScanNumber,
    startedAt,
    completedAt,
    portalRefreshStatus: 'SUCCESS',
    pagesScanned: totalPages,
    totalPages,
    recordsFound: portalRows.length,
    newRecords: newComplaints.length,
    financialCount,
    socialMediaCount,
    reviewCount,
    assignedCount: 0, // Assigned subsequently by assignment pipeline
    errorCount: 0,
    status: 'SUCCESS',
  };

  auditEntries.push({
    id: `audit-scan-finish-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
    action: 'Scan Completed',
    details: `Scan #${currentScanNumber} finished. Scanned ${totalPages} pages, found ${newComplaints.length} new records (${financialCount} Financial, ${socialMediaCount} Social Media, ${reviewCount} Review Required).`,
    user: 'Portal Scanner',
    category: 'PORTAL_SCAN',
  });

  return {
    scanLog,
    newComplaints,
    auditEntries,
  };
}

export async function scanPortalMultiPage(portalRows: PortalRawRow[]): Promise<{
  sessionExpired: boolean;
  pagesScanned: number;
  totalPages: number;
  extractedComplaints: {
    acknowledgementNumber: string;
    victimName: string;
    complaintReportedDateTime: string;
    incidentMemo: string;
    mobileNumber: string;
    portalPage: number;
  }[];
}> {
  const totalPages = Math.max(...portalRows.map(r => r.pageNumber), 1);
  return {
    sessionExpired: false,
    pagesScanned: totalPages,
    totalPages,
    extractedComplaints: portalRows.map(r => ({
      acknowledgementNumber: r.acknowledgementNumber,
      victimName: r.victimName,
      complaintReportedDateTime: r.reportedDateTime,
      incidentMemo: r.incidentMemo,
      mobileNumber: r.mobileNumber,
      portalPage: r.pageNumber,
    })),
  };
}

