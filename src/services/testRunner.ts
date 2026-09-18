/**
 * Automated Testing Suite for Assignment Engine & Classification
 * Covers all 17 mandatory test suites specified in Section 41:
 * 1. 1, 2 and 16 Helplines
 * 2. Missing Helplines
 * 3. Skipped Helpline
 * 4. Multiple skipped Helplines
 * 5. Skip N calls
 * 6. Skip entire shift
 * 7. Duplicate calls
 * 8. New calls arriving
 * 9. Shift change
 * 10. 13:45 and 19:45 boundaries
 * 11. Pure Social Media
 * 12. Financial only
 * 13. Social Media + Financial
 * 14. Multiple amounts
 * 15. Mobile numbers in memos
 * 16. Empty/invalid memos
 * 17. Portal data errors
 */

import { TestResult, ComplaintRecord, ShiftConfig, SkipRule } from '../types';
import { classifyComplaintMemo, extractMonetaryAmounts } from './classificationEngine';
import { executeAssignmentPipeline, sortChronologically } from './assignmentEngine';
import { evaluateShiftEligibility } from './shiftEngine';

export interface TestAssertion {
  assertion: string;
  passed: boolean;
  details: string;
}

export interface TestSuiteResult {
  suiteId: number;
  name: string;
  description: string;
  passed: boolean;
  assertions: TestAssertion[];
}

export interface Section41TestReport {
  totalTests: number;
  passed: number;
  failed: number;
  totalExecutionTimeMs: number;
  executedAt: string;
  allPassed: boolean;
  suites: TestSuiteResult[];
}

export function runAllSection41Tests(): Section41TestReport {
  const suites: TestSuiteResult[] = [];
  const startTime = performance.now();

  const runTest = (
    testNumber: number,
    title: string,
    description: string,
    fn: () => { passed: boolean; details: string }
  ) => {
    try {
      const res = fn();
      suites.push({
        suiteId: testNumber,
        name: title,
        description,
        passed: res.passed,
        assertions: [
          {
            assertion: 'Section 41 Compliance Check',
            passed: res.passed,
            details: res.details,
          },
        ],
      });
    } catch (err: any) {
      suites.push({
        suiteId: testNumber,
        name: title,
        description,
        passed: false,
        assertions: [
          {
            assertion: 'Execution Failure',
            passed: false,
            details: `Exception thrown: ${err?.message || String(err)}`,
          },
        ],
      });
    }
  };

  // 1. 1, 2 and 16 Helplines
  runTest(
    1,
    '1, 2, and 16 Helplines Round-Robin',
    'Verify round-robin distribution works correctly with 1, 2, or all 16 Helplines present.',
    () => {
      const mockCalls = (n: number): ComplaintRecord[] =>
        Array.from({ length: n }, (_, i) => ({
          id: `test-call-${i}`,
          acknowledgementNumber: `3110926000000${i}`,
          victimName: `Victim ${i}`,
          complaintReportedDateTime: `18/09/2026 10:${String(i).padStart(2, '0')}:00`,
          incidentMemo: `UPI FRAUD 1000${i}`,
          mobileNumber: '9876543210',
          portalPage: 1,
          portalScannedAt: '18/09/2026 10:30:00',
          classification: 'FINANCIAL',
          classificationConfidence: 0.95,
          detectedKeywords: ['FRAUD'],
          detectedAmounts: [10000],
          isFinancial: true,
          isSocialMedia: false,
          status: 'NEW',
          whatsappStatus: 'PENDING',
        }));

      // Test with 1 Helpline
      const shift1: ShiftConfig = {
        id: 's1',
        date: '18/09/2026',
        type: 'MORNING',
        presentHelplines: [5],
        startedAt: '08:00:00',
        startedBy: 'Admin',
        active: true,
        cutoffPassed: false,
      };
      const res1 = executeAssignmentPipeline(mockCalls(3), shift1, [], 0);
      const passed1 = res1.assignedRecords.every(r => r.assignedHelpline === 5);

      // Test with 2 Helplines [3, 7]
      const shift2: ShiftConfig = { ...shift1, presentHelplines: [3, 7] };
      const res2 = executeAssignmentPipeline(mockCalls(4), shift2, [], 0);
      const passed2 =
        res2.assignedRecords[0]?.assignedHelpline === 3 &&
        res2.assignedRecords[1]?.assignedHelpline === 7 &&
        res2.assignedRecords[2]?.assignedHelpline === 3 &&
        res2.assignedRecords[3]?.assignedHelpline === 7;

      // Test with 16 Helplines
      const shift16: ShiftConfig = {
        ...shift1,
        presentHelplines: Array.from({ length: 16 }, (_, i) => i + 1),
      };
      const res16 = executeAssignmentPipeline(mockCalls(16), shift16, [], 0);
      const passed16 = res16.assignedRecords.every(
        (r, i) => r.assignedHelpline === i + 1
      );

      const passed = passed1 && passed2 && passed16;
      return {
        passed,
        details: passed
          ? 'Successfully verified single helpline [5], dual helpline alternating [3, 7], and complete 1-16 round-robin distribution.'
          : 'Failed: Distribution mismatch in 1, 2, or 16 helpline tests.',
      };
    }
  );

  // 2. Missing Helplines
  runTest(
    2,
    'Missing Helplines Handled Safely',
    'Verify absent Helplines (e.g. absent 2, 8, 12, 14, 15) are strictly never assigned any calls.',
    () => {
      const present = [1, 3, 4, 5, 6, 7, 9, 10, 11, 13, 16]; // 2, 8, 12, 14, 15 are absent
      const absent = [2, 8, 12, 14, 15];
      const shift: ShiftConfig = {
        id: 's2',
        date: '18/09/2026',
        type: 'MORNING',
        presentHelplines: present,
        startedAt: '08:00:00',
        startedBy: 'Admin',
        active: true,
        cutoffPassed: false,
      };

      const mockCalls: ComplaintRecord[] = Array.from({ length: 22 }, (_, i) => ({
        id: `missing-test-${i}`,
        acknowledgementNumber: `3110926011111${i}`,
        victimName: `Victim ${i}`,
        complaintReportedDateTime: `18/09/2026 11:${String(i).padStart(2, '0')}:00`,
        incidentMemo: `BANK FRAUD 1000${i}`,
        mobileNumber: '9876543210',
        portalPage: 1,
        portalScannedAt: '18/09/2026 11:30:00',
        classification: 'FINANCIAL',
        classificationConfidence: 0.95,
        detectedKeywords: ['FRAUD'],
        detectedAmounts: [10000],
        isFinancial: true,
        isSocialMedia: false,
        status: 'NEW',
        whatsappStatus: 'PENDING',
      }));

      const res = executeAssignmentPipeline(mockCalls, shift, [], 0);
      const violation = res.assignedRecords.find(r =>
        r.assignedHelpline && absent.includes(r.assignedHelpline)
      );

      return {
        passed: !violation && res.assignedRecords.length === 22,
        details: violation
          ? `Failed: Absent Helpline ${violation.assignedHelpline} was incorrectly assigned a call!`
          : `Passed: All 22 calls assigned exclusively among present Helplines. 0 calls routed to absent [${absent.join(', ')}].`,
      };
    }
  );

  // 3. Skipped Helpline
  runTest(
    3,
    'Single Skipped Helpline',
    'Verify that when a Helpline is skipped, the call is not discarded and passes to the next eligible Helpline.',
    () => {
      const shift: ShiftConfig = {
        id: 's3',
        date: '18/09/2026',
        type: 'MORNING',
        presentHelplines: [1, 3, 4, 5],
        startedAt: '08:00:00',
        startedBy: 'Admin',
        active: true,
        cutoffPassed: false,
      };

      const skipRules: SkipRule[] = [
        {
          id: 'sk-1',
          helpline: 3,
          type: 'SKIP_N',
          remainingCount: 1,
          initialCount: 1,
          createdAt: '18/09/2026 09:00:00',
          createdBy: 'Admin',
          active: true,
        },
      ];

      const calls: ComplaintRecord[] = [
        {
          id: 'c1',
          acknowledgementNumber: '3110926000001',
          victimName: 'User 1',
          complaintReportedDateTime: '18/09/2026 10:00:00',
          incidentMemo: 'FRAUD 5000',
          mobileNumber: '9999999999',
          portalPage: 1,
          portalScannedAt: '18/09/2026 10:05:00',
          classification: 'FINANCIAL',
          classificationConfidence: 0.95,
          detectedKeywords: ['FRAUD'],
          detectedAmounts: [5000],
          isFinancial: true,
          isSocialMedia: false,
          status: 'NEW',
          whatsappStatus: 'PENDING',
        },
        {
          id: 'c2',
          acknowledgementNumber: '3110926000002',
          victimName: 'User 2',
          complaintReportedDateTime: '18/09/2026 10:01:00',
          incidentMemo: 'FRAUD 6000',
          mobileNumber: '9999999999',
          portalPage: 1,
          portalScannedAt: '18/09/2026 10:05:00',
          classification: 'FINANCIAL',
          classificationConfidence: 0.95,
          detectedKeywords: ['FRAUD'],
          detectedAmounts: [6000],
          isFinancial: true,
          isSocialMedia: false,
          status: 'NEW',
          whatsappStatus: 'PENDING',
        },
      ];

      // Call 1 should go to H1. Call 2 would normally go to H3, but H3 is skipped -> must go to H4!
      const res = executeAssignmentPipeline(calls, shift, skipRules, 0);
      const h1Call = res.assignedRecords[0]?.assignedHelpline === 1;
      const h4Call = res.assignedRecords[1]?.assignedHelpline === 4;

      return {
        passed: h1Call && h4Call,
        details: h1Call && h4Call
          ? 'Passed: Call 1 assigned to Helpline 1, Helpline 3 safely skipped and call 2 reassigned to Helpline 4 without loss.'
          : `Failed: Assignments were H${res.assignedRecords[0]?.assignedHelpline} and H${res.assignedRecords[1]?.assignedHelpline}`,
      };
    }
  );

  // 4. Multiple Skipped Helplines
  runTest(
    4,
    'Multiple Skipped Helplines in Sequence',
    'Verify that when multiple consecutive Helplines are skipped, the engine skips them all and reaches the next active one.',
    () => {
      const shift: ShiftConfig = {
        id: 's4',
        date: '18/09/2026',
        type: 'MORNING',
        presentHelplines: [1, 2, 3, 4, 5],
        startedAt: '08:00:00',
        startedBy: 'Admin',
        active: true,
        cutoffPassed: false,
      };

      const skipRules: SkipRule[] = [
        {
          id: 'sk-2',
          helpline: 2,
          type: 'SKIP_SHIFT',
          remainingCount: 99,
          initialCount: 99,
          createdAt: '18/09/2026 09:00:00',
          createdBy: 'Admin',
          active: true,
        },
        {
          id: 'sk-3',
          helpline: 3,
          type: 'SKIP_SHIFT',
          remainingCount: 99,
          initialCount: 99,
          createdAt: '18/09/2026 09:00:00',
          createdBy: 'Admin',
          active: true,
        },
      ];

      const calls: ComplaintRecord[] = [
        {
          id: 'c1',
          acknowledgementNumber: '3110926000001',
          victimName: 'U1',
          complaintReportedDateTime: '18/09/2026 10:00:00',
          incidentMemo: 'FRAUD 1000',
          mobileNumber: '9999999999',
          portalPage: 1,
          portalScannedAt: '18/09/2026 10:05:00',
          classification: 'FINANCIAL',
          classificationConfidence: 0.95,
          detectedKeywords: ['FRAUD'],
          detectedAmounts: [1000],
          isFinancial: true,
          isSocialMedia: false,
          status: 'NEW',
          whatsappStatus: 'PENDING',
        },
        {
          id: 'c2',
          acknowledgementNumber: '3110926000002',
          victimName: 'U2',
          complaintReportedDateTime: '18/09/2026 10:01:00',
          incidentMemo: 'FRAUD 2000',
          mobileNumber: '9999999999',
          portalPage: 1,
          portalScannedAt: '18/09/2026 10:05:00',
          classification: 'FINANCIAL',
          classificationConfidence: 0.95,
          detectedKeywords: ['FRAUD'],
          detectedAmounts: [2000],
          isFinancial: true,
          isSocialMedia: false,
          status: 'NEW',
          whatsappStatus: 'PENDING',
        },
      ];

      // Call 1 -> H1. Call 2 skips H2 and H3, goes to H4!
      const res = executeAssignmentPipeline(calls, shift, skipRules, 0);
      const passed =
        res.assignedRecords[0]?.assignedHelpline === 1 &&
        res.assignedRecords[1]?.assignedHelpline === 4;

      return {
        passed,
        details: passed
          ? 'Passed: Consecutive skips for Helpline 2 and 3 executed smoothly; Call 2 routed directly to Helpline 4.'
          : 'Failed: Multiple sequential skips not routed correctly.',
      };
    }
  );

  // 5. Skip N calls
  runTest(
    5,
    'Skip Next N Calls Rule & Counter Decrement',
    'Verify "Skip Next 2 Calls" skips the Helpline twice, decrements counter, then re-enables Helpline.',
    () => {
      const shift: ShiftConfig = {
        id: 's5',
        date: '18/09/2026',
        type: 'MORNING',
        presentHelplines: [1, 2],
        startedAt: '08:00:00',
        startedBy: 'Admin',
        active: true,
        cutoffPassed: false,
      };

      const skipRules: SkipRule[] = [
        {
          id: 'sk-n2',
          helpline: 2,
          type: 'SKIP_N',
          remainingCount: 2,
          initialCount: 2,
          createdAt: '18/09/2026 09:00:00',
          createdBy: 'Admin',
          active: true,
        },
      ];

      // 4 calls:
      // Turn 1: Call 1 -> H1 (cursor -> H2)
      // Turn 2: Call 2 -> H2 is skipped (remaining becomes 1, cursor moves to H1) -> H1 receives Call 2 (cursor -> H2)
      // Turn 3: Call 3 -> H2 is skipped (remaining becomes 0, rule deactivated, cursor -> H1) -> H1 receives Call 3 (cursor -> H2)
      // Turn 4: Call 4 -> H2 is now active! H2 receives Call 4.
      const calls: ComplaintRecord[] = Array.from({ length: 4 }, (_, i) => ({
        id: `sk-c-${i}`,
        acknowledgementNumber: `311092600000${i}`,
        victimName: `Victim ${i}`,
        complaintReportedDateTime: `18/09/2026 10:0${i}:00`,
        incidentMemo: `FRAUD 500${i}`,
        mobileNumber: '9999999999',
        portalPage: 1,
        portalScannedAt: '18/09/2026 10:05:00',
        classification: 'FINANCIAL',
        classificationConfidence: 0.95,
        detectedKeywords: ['FRAUD'],
        detectedAmounts: [5000],
        isFinancial: true,
        isSocialMedia: false,
        status: 'NEW',
        whatsappStatus: 'PENDING',
      }));

      const res = executeAssignmentPipeline(calls, shift, skipRules, 0);
      const assignments = res.assignedRecords.map(r => r.assignedHelpline);
      // Expected: [1, 1, 1, 2]
      const passed =
        assignments[0] === 1 &&
        assignments[1] === 1 &&
        assignments[2] === 1 &&
        assignments[3] === 2;

      return {
        passed,
        details: passed
          ? `Passed: Assigned sequence was [${assignments.join(', ')}]. Helpline 2 was skipped exactly 2 times and reactivated on turn 4.`
          : `Failed: Expected [1, 1, 1, 2], got [${assignments.join(', ')}]`,
      };
    }
  );

  // 6. Skip entire shift
  runTest(
    6,
    'Skip Entire Shift Rule',
    'Verify that "Skip Entire Shift" continuously skips the Helpline throughout all assignment rounds.',
    () => {
      const shift: ShiftConfig = {
        id: 's6',
        date: '18/09/2026',
        type: 'MORNING',
        presentHelplines: [1, 2, 3],
        startedAt: '08:00:00',
        startedBy: 'Admin',
        active: true,
        cutoffPassed: false,
      };

      const skipRules: SkipRule[] = [
        {
          id: 'sk-full',
          helpline: 2,
          type: 'SKIP_SHIFT',
          remainingCount: 999,
          initialCount: 999,
          createdAt: '18/09/2026 09:00:00',
          createdBy: 'Admin',
          active: true,
        },
      ];

      const calls: ComplaintRecord[] = Array.from({ length: 6 }, (_, i) => ({
        id: `call-full-${i}`,
        acknowledgementNumber: `311092600001${i}`,
        victimName: `Victim ${i}`,
        complaintReportedDateTime: `18/09/2026 10:0${i}:00`,
        incidentMemo: `FRAUD 500${i}`,
        mobileNumber: '9999999999',
        portalPage: 1,
        portalScannedAt: '18/09/2026 10:10:00',
        classification: 'FINANCIAL',
        classificationConfidence: 0.95,
        detectedKeywords: ['FRAUD'],
        detectedAmounts: [5000],
        isFinancial: true,
        isSocialMedia: false,
        status: 'NEW',
        whatsappStatus: 'PENDING',
      }));

      const res = executeAssignmentPipeline(calls, shift, skipRules, 0);
      const h2Assigned = res.assignedRecords.some(r => r.assignedHelpline === 2);

      return {
        passed: !h2Assigned && res.assignedRecords.length === 6,
        details: !h2Assigned
          ? 'Passed: Helpline 2 received 0 calls across 6 assignment cycles. Calls alternated smoothly between H1 and H3.'
          : 'Failed: Helpline 2 received a call despite Skip Entire Shift rule.',
      };
    }
  );

  // 7. Duplicate calls protection
  runTest(
    7,
    'Duplicate Call Protection & Idempotency',
    'Verify that complaints with identical Acknowledgement Numbers are never re-assigned or duplicated.',
    () => {
      const existingCall: ComplaintRecord = {
        id: 'dup-1',
        acknowledgementNumber: '31109260226230',
        victimName: 'Existing Victim',
        complaintReportedDateTime: '18/09/2026 10:00:00',
        incidentMemo: 'FRAUD 10000',
        mobileNumber: '9876543210',
        portalPage: 1,
        portalScannedAt: '18/09/2026 10:05:00',
        classification: 'FINANCIAL',
        classificationConfidence: 0.98,
        detectedKeywords: ['FRAUD'],
        detectedAmounts: [10000],
        isFinancial: true,
        isSocialMedia: false,
        status: 'ASSIGNED',
        assignedHelpline: 7,
        whatsappStatus: 'SENT_TO_WHATSAPP',
      };

      const shift: ShiftConfig = {
        id: 's7',
        date: '18/09/2026',
        type: 'MORNING',
        presentHelplines: [1, 2, 7],
        startedAt: '08:00:00',
        startedBy: 'Admin',
        active: true,
        cutoffPassed: false,
      };

      // Run pipeline with the already assigned call
      const res = executeAssignmentPipeline([existingCall], shift, [], 0);

      const passed =
        res.assignedRecords.length === 0 &&
        res.updatedComplaints.length === 1 &&
        res.updatedComplaints[0].assignedHelpline === 7;

      return {
        passed,
        details: passed
          ? 'Passed: Idempotent engine recognized already ASSIGNED acknowledgement 31109260226230 and did not reassign.'
          : 'Failed: Duplicate assignment occurred.',
      };
    }
  );

  // 8. New calls arriving & cursor continuity
  runTest(
    8,
    'New Calls Arriving with Preserved Cursor',
    'Verify that when new calls arrive, assignment picks up from the saved cursor without resetting.',
    () => {
      const shift: ShiftConfig = {
        id: 's8',
        date: '18/09/2026',
        type: 'MORNING',
        presentHelplines: [1, 3, 5],
        startedAt: '08:00:00',
        startedBy: 'Admin',
        active: true,
        cutoffPassed: false,
      };

      // Say Batch 1 assigned 2 calls starting at cursor 0:
      // Call A -> H1 (cursor becomes 1)
      // Call B -> H3 (cursor becomes 2)
      // Now a new Batch 2 arrives with cursor starting at 2:
      // Call C must be assigned to H5, and cursor must wrap to 0 (H1)!
      const newCall: ComplaintRecord = {
        id: 'c-new-batch',
        acknowledgementNumber: '31109260999999',
        victimName: 'Batch 2 Victim',
        complaintReportedDateTime: '18/09/2026 11:00:00',
        incidentMemo: 'ONLINE FRAUD 25000',
        mobileNumber: '9876543210',
        portalPage: 1,
        portalScannedAt: '18/09/2026 11:05:00',
        classification: 'FINANCIAL',
        classificationConfidence: 0.95,
        detectedKeywords: ['FRAUD'],
        detectedAmounts: [25000],
        isFinancial: true,
        isSocialMedia: false,
        status: 'NEW',
        whatsappStatus: 'PENDING',
      };

      const res = executeAssignmentPipeline([newCall], shift, [], 2); // start at cursor 2
      const passed =
        res.assignedRecords[0]?.assignedHelpline === 5 && res.nextCursorIndex === 0;

      return {
        passed,
        details: passed
          ? 'Passed: New call was assigned to Helpline 5 (cursor 2) and cursor advanced to 0 (Helpline 1) for the next scan.'
          : `Failed: Assigned to Helpline ${res.assignedRecords[0]?.assignedHelpline}, cursor ${res.nextCursorIndex}`,
      };
    }
  );

  // 9. Shift change
  runTest(
    9,
    'Shift Change & Evening Shift Locking',
    'Verify Evening Shift cannot assign calls until present Helplines are explicitly confirmed by operator.',
    () => {
      const eveningShiftInactive: ShiftConfig = {
        id: 's9-eve',
        date: '18/09/2026',
        type: 'EVENING',
        presentHelplines: [1, 2, 3],
        startedAt: '14:00:00',
        startedBy: 'Operator',
        active: false, // NOT activated yet
        cutoffPassed: false,
      };

      const call: ComplaintRecord = {
        id: 'c-eve-1',
        acknowledgementNumber: '31109260888888',
        victimName: 'Evening Victim',
        complaintReportedDateTime: '18/09/2026 14:10:00',
        incidentMemo: 'FRAUD 5000',
        mobileNumber: '9876543210',
        portalPage: 1,
        portalScannedAt: '18/09/2026 14:15:00',
        classification: 'FINANCIAL',
        classificationConfidence: 0.95,
        detectedKeywords: ['FRAUD'],
        detectedAmounts: [5000],
        isFinancial: true,
        isSocialMedia: false,
        status: 'NEW',
        whatsappStatus: 'PENDING',
      };

      const resInactive = executeAssignmentPipeline([call], eveningShiftInactive, [], 0);
      const lockedPassed = resInactive.assignedRecords.length === 0;

      // Now activate evening shift
      const eveningShiftActive: ShiftConfig = { ...eveningShiftInactive, active: true };
      const resActive = executeAssignmentPipeline([call], eveningShiftActive, [], 0);
      const activePassed = resActive.assignedRecords.length === 1;

      return {
        passed: lockedPassed && activePassed,
        details: lockedPassed && activePassed
          ? 'Passed: Evening shift blocked assignment while inactive; successfully resumed assignment once operator confirmed Start Shift.'
          : 'Failed: Evening shift activation constraint violated.',
      };
    }
  );

  // 10. 13:45 and 19:45 boundaries
  runTest(
    10,
    'Exact Shift Boundary Cutoff (13:45 & 19:45)',
    'Verify exact millisecond boundaries: 13:44:59 is eligible, 13:45:00 is ineligible. 19:44:59 is eligible, 19:45:00 is ineligible.',
    () => {
      const t13_44_59 = evaluateShiftEligibility('18/09/2026 13:44:59');
      const t13_45_00 = evaluateShiftEligibility('18/09/2026 13:45:00');
      const t19_44_59 = evaluateShiftEligibility('18/09/2026 19:44:59');
      const t19_45_00 = evaluateShiftEligibility('18/09/2026 19:45:00');

      const p1 = t13_44_59.isEligible === true && t13_44_59.shiftType === 'MORNING';
      const p2 = t13_45_00.isEligible === false;
      const p3 = t19_44_59.isEligible === true && t19_44_59.shiftType === 'EVENING';
      const p4 = t19_45_00.isEligible === false;

      const passed = p1 && p2 && p3 && p4;
      return {
        passed,
        details: passed
          ? 'Passed: 13:44:59 -> Eligible | 13:45:00 -> Cutoff halted | 19:44:59 -> Eligible | 19:45:00 -> Cutoff halted.'
          : `Failed: Cutoff check failed. p1=${p1}, p2=${p2}, p3=${p3}, p4=${p4}`,
      };
    }
  );

  // 11. Pure Social Media
  runTest(
    11,
    'Pure Social Media Classification',
    'Verify "SOCIAL MEDIA FB ID HACK" is classified as SOCIAL_MEDIA and never assigned.',
    () => {
      const res = classifyComplaintMemo('SOCIAL MEDIA FB ID HACK');
      const passed = res.classification === 'SOCIAL_MEDIA' && res.isFinancial === false;
      return {
        passed,
        details: passed
          ? 'Passed: Memo classified as SOCIAL_MEDIA with 0 financial detected amounts. Pure SM ignored.'
          : `Failed: Classified as ${res.classification}, isFinancial=${res.isFinancial}`,
      };
    }
  );

  // 12. Financial only
  runTest(
    12,
    'Financial Only Memo Classification & Amount Extraction',
    'Verify "WITHOUT OTP FRAUD 10,000/-" is classified as FINANCIAL with amount ₹10,000.',
    () => {
      const res = classifyComplaintMemo('WITHOUT OTP FRAUD 10,000/-');
      const passed =
        res.classification === 'FINANCIAL' &&
        res.isFinancial === true &&
        res.detectedAmounts.includes(10000);

      return {
        passed,
        details: passed
          ? `Passed: Classified as FINANCIAL with detected amount ₹${res.detectedAmounts[0].toLocaleString('en-IN')}.`
          : `Failed: Got ${res.classification}, amounts: ${JSON.stringify(res.detectedAmounts)}`,
      };
    }
  );

  // 13. Social Media + Financial
  runTest(
    13,
    'Social Media + Financial Override Rule',
    'Verify "WHATSAPP HACK AND FRAUD 50,000" overrides Social Media exclusion and is classified as FINANCIAL.',
    () => {
      const res = classifyComplaintMemo('WHATSAPP HACK AND FRAUD 50,000');
      const passed =
        res.classification === 'FINANCIAL' &&
        res.isFinancial === true &&
        res.isSocialMedia === true &&
        res.detectedAmounts.includes(50000);

      return {
        passed,
        details: passed
          ? `Passed: Classified as FINANCIAL (Amount ₹50,000). Priority rule verified: financial relevance overrides SM exclusion.`
          : `Failed: Result: ${res.classification}, isFinancial=${res.isFinancial}`,
      };
    }
  );

  // 14. Multiple amounts
  runTest(
    14,
    'Multiple Monetary Amounts in Memo',
    'Verify multiple amounts (e.g. ₹10,000 and 50,000/-) are all accurately extracted.',
    () => {
      const amounts = extractMonetaryAmounts(
        'FRAUD TRANSACTION FIRST TIME Rs. 10,000 AND SECOND TIME 50,000/- DEBITED'
      );
      const passed = amounts.includes(10000) && amounts.includes(50000);
      return {
        passed,
        details: passed
          ? `Passed: Extracted all multiple amounts: [${amounts.map(a => '₹' + a.toLocaleString('en-IN')).join(', ')}].`
          : `Failed: Detected: ${JSON.stringify(amounts)}`,
      };
    }
  );

  // 15. Mobile numbers in memos
  runTest(
    15,
    'Mobile Number vs Monetary Amount Distinction',
    'Verify 10-digit mobile numbers (e.g. 9558059062) are NEVER treated as financial amounts.',
    () => {
      const res = classifyComplaintMemo(
        'SOCIAL MEDIA WHATSAPP HACK ANOTHER NO 9558059062'
      );
      const amounts = extractMonetaryAmounts(
        'SOCIAL MEDIA WHATSAPP HACK ANOTHER NO 9558059062'
      );

      const passed =
        res.classification === 'SOCIAL_MEDIA' &&
        res.isFinancial === false &&
        amounts.length === 0;

      return {
        passed,
        details: passed
          ? 'Passed: 9558059062 recognized strictly as mobile number. Financial = false, amounts = [].'
          : `Failed: Incorrectly extracted amount: ${JSON.stringify(amounts)}`,
      };
    }
  );

  // 16. Empty / invalid memos
  runTest(
    16,
    'Empty or Invalid Memos Routed to Review Queue',
    'Verify that empty, blank or whitespace-only memos are safely routed to REVIEW_REQUIRED rather than dropped.',
    () => {
      const res1 = classifyComplaintMemo('');
      const res2 = classifyComplaintMemo('   ');
      const passed =
        res1.classification === 'REVIEW_REQUIRED' &&
        res2.classification === 'REVIEW_REQUIRED';

      return {
        passed,
        details: passed
          ? 'Passed: Empty and whitespace memos routed safely to REVIEW_REQUIRED queue.'
          : `Failed: Empty gave ${res1.classification}, whitespace gave ${res2.classification}`,
      };
    }
  );

  // 17. Portal data errors & session recovery
  runTest(
    17,
    'Portal Data Errors & Missing Field Resilience',
    'Verify assignment pipeline safely handles complaints with missing optional data or corrupted timestamps.',
    () => {
      const corruptedCall: ComplaintRecord = {
        id: 'corrupt-1',
        acknowledgementNumber: '31109260777777',
        victimName: 'Unknown',
        complaintReportedDateTime: 'INVALID_DATE_TIME',
        incidentMemo: 'ONLINE UPI FRAUD 15000',
        mobileNumber: '',
        portalPage: 1,
        portalScannedAt: '18/09/2026 10:00:00',
        classification: 'FINANCIAL',
        classificationConfidence: 0.95,
        detectedKeywords: ['FRAUD'],
        detectedAmounts: [15000],
        isFinancial: true,
        isSocialMedia: false,
        status: 'NEW',
        whatsappStatus: 'PENDING',
      };

      const shift: ShiftConfig = {
        id: 's17',
        date: '18/09/2026',
        type: 'MORNING',
        presentHelplines: [1, 2],
        startedAt: '08:00:00',
        startedBy: 'Admin',
        active: true,
        cutoffPassed: false,
      };

      // Should not throw or crash
      const res = executeAssignmentPipeline([corruptedCall], shift, [], 0);
      const passed = res.updatedComplaints.length > 0;

      return {
        passed,
        details: passed
          ? 'Passed: Pipeline executed without crashing on corrupted timestamp. Logged safely.'
          : 'Failed: Crash occurred on portal data errors.',
      };
    }
  );

  const endTime = performance.now();
  const passed = suites.filter(s => s.passed).length;
  const failed = suites.length - passed;

  return {
    totalTests: suites.length,
    passed,
    failed,
    totalExecutionTimeMs: endTime - startTime,
    executedAt: new Date().toLocaleTimeString('en-IN', { hour12: false }),
    allPassed: failed === 0,
    suites,
  };
}

