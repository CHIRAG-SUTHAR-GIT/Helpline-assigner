/**
 * Round-Robin Assignment Engine with Skip Management & Idempotency
 * Compliant with Sections 15, 16, 17, 19, 20, 21, 22, 34, 47, 48
 */

import {
  ComplaintRecord,
  ShiftConfig,
  SkipRule,
  AuditLogEntry,
  ShiftType,
} from '../types';
import { parseReportedDateTime, evaluateShiftEligibility } from './shiftEngine';

export interface AssignmentExecutionResult {
  assignedRecords: ComplaintRecord[];
  updatedComplaints: ComplaintRecord[];
  updatedSkipRules: SkipRule[];
  nextCursorIndex: number;
  auditEntries: AuditLogEntry[];
  skippedEvents: { helpline: number; reason: string; ack: string }[];
}

/**
 * Sorts complaint records in strictly chronological order by Complaint Reported Date/Time
 */
export function sortChronologically(records: ComplaintRecord[]): ComplaintRecord[] {
  return [...records].sort((a, b) => {
    const timeA = parseReportedDateTime(a.complaintReportedDateTime).totalSeconds;
    const timeB = parseReportedDateTime(b.complaintReportedDateTime).totalSeconds;
    if (timeA !== timeB) {
      return timeA - timeB;
    }
    // Secondary tie-breaker by acknowledgement number
    return a.acknowledgementNumber.localeCompare(b.acknowledgementNumber);
  });
}

/**
 * Runs the assignment engine on unassigned financial complaints
 */
export function executeAssignmentPipeline(
  complaints: ComplaintRecord[],
  shiftConfig: ShiftConfig,
  skipRules: SkipRule[],
  currentCursorIndex: number,
  currentUser: string = 'Operator'
): AssignmentExecutionResult {
  const auditEntries: AuditLogEntry[] = [];
  const assignedRecords: ComplaintRecord[] = [];
  const skippedEvents: { helpline: number; reason: string; ack: string }[] = [];

  // Deep clone skip rules so we can mutate and track them
  const activeSkipRules: SkipRule[] = skipRules.map(r => ({ ...r }));

  // Verification 1: Are there present Helplines?
  const presentHelplines = (shiftConfig.presentHelplines || []).slice().sort((a, b) => a - b);
  if (presentHelplines.length === 0) {
    return {
      assignedRecords: [],
      updatedComplaints: complaints,
      updatedSkipRules: activeSkipRules,
      nextCursorIndex: currentCursorIndex,
      auditEntries: [
        {
          id: `audit-${Date.now()}-no-helplines`,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
          action: 'Assignment Halted',
          details: 'No Helplines marked present for the current shift. Cannot distribute calls.',
          user: currentUser,
          category: 'ASSIGNMENT',
        },
      ],
      skippedEvents: [],
    };
  }

  // Verification 2: Section 16 & 47 rule: Evening shift assignment cannot start until present Helplines are selected and shift is marked active!
  if (shiftConfig.type === 'EVENING' && !shiftConfig.active) {
    return {
      assignedRecords: [],
      updatedComplaints: complaints,
      updatedSkipRules: activeSkipRules,
      nextCursorIndex: currentCursorIndex,
      auditEntries: [
        {
          id: `audit-${Date.now()}-evening-inactive`,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
          action: 'Evening Assignment Locked',
          details: 'Evening shift has not been started. Operator must select present Helplines and click Start Shift.',
          user: currentUser,
          category: 'SHIFT',
        },
      ],
      skippedEvents: [],
    };
  }

  // Find unassigned complaints that are classified as FINANCIAL or approved in review
  // and NOT already assigned or ignored.
  const eligibleComplaints = complaints.filter(
    c => c.classification === 'FINANCIAL' && c.status !== 'ASSIGNED' && c.status !== 'SKIPPED'
  );

  // Chronological ordering (Section 19)
  const sortedEligible = sortChronologically(eligibleComplaints);

  let cursor = currentCursorIndex % presentHelplines.length;
  if (cursor < 0) cursor = 0;

  // Track modified complaints map for O(1) update
  const updatedComplaintsMap = new Map<string, ComplaintRecord>();
  complaints.forEach(c => updatedComplaintsMap.set(c.id, { ...c }));

  let assignmentSequenceCounter = complaints.filter(c => c.status === 'ASSIGNED').length;

  for (const complaint of sortedEligible) {
    // Check shift boundary eligibility based on Complaint Reported Date/Time (Section 16, 17)
    const eligibility = evaluateShiftEligibility(complaint.complaintReportedDateTime);

    if (!eligibility.isEligible) {
      // Not eligible due to boundary (e.g. at or past 13:45 / 19:45 cutoff)
      auditEntries.push({
        id: `audit-${Date.now()}-${complaint.id}-boundary`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
        action: 'Call Ineligible for Assignment',
        details: `Ack ${complaint.acknowledgementNumber} (${complaint.complaintReportedDateTime}): ${eligibility.reason}`,
        user: 'System',
        category: 'ASSIGNMENT',
      });
      continue;
    }

    // Attempt round-robin allocation among present Helplines with Skip rule handling
    let allocated = false;
    let attempts = 0;
    const maxAttempts = presentHelplines.length * 2; // Prevent infinite loop if all skipped

    while (!allocated && attempts < maxAttempts) {
      attempts++;
      const candidateHelpline = presentHelplines[cursor];

      // Check if candidate Helpline has an active skip rule
      const skipRuleIndex = activeSkipRules.findIndex(
        r => r.helpline === candidateHelpline && r.active
      );

      if (skipRuleIndex !== -1) {
        const rule = activeSkipRules[skipRuleIndex];
        // Helpline is skipped!
        skippedEvents.push({
          helpline: candidateHelpline,
          reason: rule.type === 'SKIP_SHIFT' ? 'Skip entire shift active' : `Skip next (${rule.remainingCount} remaining)`,
          ack: complaint.acknowledgementNumber,
        });

        auditEntries.push({
          id: `audit-${Date.now()}-skip-${candidateHelpline}`,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
          action: 'Helpline Skipped',
          details: `Helpline ${candidateHelpline} skipped for Ack ${complaint.acknowledgementNumber}. Reason: ${
            rule.type === 'SKIP_SHIFT' ? 'Skip Entire Shift' : `Skip count decrement (${rule.remainingCount} -> ${rule.remainingCount - 1})`
          }`,
          user: currentUser,
          category: 'SKIP',
        });

        if (rule.type === 'SKIP_N') {
          rule.remainingCount -= 1;
          if (rule.remainingCount <= 0) {
            rule.active = false;
            rule.remainingCount = 0;
          }
        }

        // Section 20 rule: "When Helpline 4 reaches its turn and is skipped,
        // the assignment engine moves to the next eligible Helpline.
        // The call is not discarded; the assignment continues to another Helpline."
        cursor = (cursor + 1) % presentHelplines.length;
        continue;
      }

      // Candidate is eligible and not skipped! Assign call!
      assignmentSequenceCounter++;
      const nowTime = new Date().toLocaleTimeString('en-IN', { hour12: false });
      const updatedComplaint: ComplaintRecord = {
        ...complaint,
        status: 'ASSIGNED',
        assignedHelpline: candidateHelpline,
        assignmentSequence: assignmentSequenceCounter,
        assignedAt: nowTime,
        shiftDate: shiftConfig.date,
        shiftType: shiftConfig.type,
        whatsappStatus: 'PENDING', // Section 29: WhatsApp independence
      };

      updatedComplaintsMap.set(complaint.id, updatedComplaint);
      assignedRecords.push(updatedComplaint);

      auditEntries.push({
        id: `audit-${Date.now()}-assigned-${complaint.id}`,
        timestamp: nowTime,
        action: 'Call Assigned',
        details: `Ack ${complaint.acknowledgementNumber} (${complaint.detectedAmounts.length > 0 ? '₹' + complaint.detectedAmounts[0].toLocaleString('en-IN') : 'Financial'}) -> Helpline ${candidateHelpline}`,
        user: 'Assignment Engine',
        category: 'ASSIGNMENT',
      });

      // Advance cursor to next Helpline for subsequent calls
      cursor = (cursor + 1) % presentHelplines.length;
      allocated = true;
    }

    if (!allocated) {
      auditEntries.push({
        id: `audit-${Date.now()}-all-skipped-${complaint.id}`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
        action: 'Assignment Postponed',
        details: `Could not assign Ack ${complaint.acknowledgementNumber} because all available Helplines are currently skipped.`,
        user: 'Assignment Engine',
        category: 'ASSIGNMENT',
      });
    }
  }

  return {
    assignedRecords,
    updatedComplaints: Array.from(updatedComplaintsMap.values()),
    updatedSkipRules: activeSkipRules,
    nextCursorIndex: cursor,
    auditEntries,
    skippedEvents,
  };
}

export function assignEligibleComplaints(
  complaints: ComplaintRecord[],
  shiftConfig: ShiftConfig,
  skipRules: SkipRule[],
  lastAssignedHelpline: number
): {
  assignedRecords: ComplaintRecord[];
  updatedComplaints: ComplaintRecord[];
  updatedSkipRules: SkipRule[];
  nextLastAssignedHelpline: number;
} {
  const present = (shiftConfig.presentHelplines || []).slice().sort((a, b) => a - b);
  const idx = present.indexOf(lastAssignedHelpline);
  const currentCursor = idx !== -1 ? (idx + 1) % Math.max(present.length, 1) : 0;

  const result = executeAssignmentPipeline(complaints, shiftConfig, skipRules, currentCursor);
  const nextHelpline = present[result.nextCursorIndex] || lastAssignedHelpline;

  return {
    assignedRecords: result.assignedRecords,
    updatedComplaints: result.updatedComplaints,
    updatedSkipRules: result.updatedSkipRules,
    nextLastAssignedHelpline: nextHelpline,
  };
}

export function manualReassignCall(
  complaints: ComplaintRecord[],
  complaintId: string,
  newHelpline: number,
  reason: string,
  userName: string,
  userRole: string
): ComplaintRecord[] {
  const timestamp = new Date().toLocaleTimeString('en-IN', { hour12: false });
  return complaints.map(c => {
    if (c.id === complaintId) {
      return {
        ...c,
        assignedHelpline: newHelpline,
        manualReassigned: true,
        manualReassignedReason: reason,
        reassignedFrom: c.assignedHelpline,
        reassignedAt: timestamp,
        reassignedBy: `${userName} (${userRole})`,
      };
    }
    return c;
  });
}

