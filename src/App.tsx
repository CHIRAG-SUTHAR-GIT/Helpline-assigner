import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AppState,
  ComplaintRecord,
  ShiftConfig,
  SkipRule,
  RoleType,
  SystemSettings,
  PortalScanLog,
  AuditLogEntry,
} from './types';
import {
  loadState,
  saveState,
  resetToSampleState,
  appendAuditLog,
} from './services/storage';
import {
  PortalRawRow,
  INITIAL_SIMULATED_PORTAL_DATA,
  scanPortalMultiPage,
} from './services/portalScanner';
import { classifyComplaint } from './services/classificationEngine';
import {
  assignEligibleComplaints,
  manualReassignCall,
} from './services/assignmentEngine';
import {
  getKolkataTime,
  isComplaintInShiftBoundary,
} from './services/shiftEngine';

// Components
import { Header, ActiveTabType } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { StartShiftView } from './components/StartShiftView';
import { LiveCallsView } from './components/LiveCallsView';
import { AssignmentsView } from './components/AssignmentsView';
import { SkipManagementView } from './components/SkipManagementView';
import { AssignmentImageView } from './components/AssignmentImageView';
import { ReviewRequiredView } from './components/ReviewRequiredView';
import { ScanMonitorView } from './components/ScanMonitorView';
import { HistoryView } from './components/HistoryView';
import { Section41TestSuiteView } from './components/Section41TestSuiteView';
import { SettingsView } from './components/SettingsView';
import { SessionExpiredModal } from './components/SessionExpiredModal';

export default function App() {
  // App state from persistent storage
  const [appState, setAppState] = useState<AppState>(() => loadState());
  const [activeTab, setActiveTab] = useState<ActiveTabType>('DASHBOARD');
  const [isScanning, setIsScanning] = useState(false);
  const [countdown, setCountdown] = useState<number>(() => appState.settings.scanIntervalMinutes * 60);

  // Portal rows backing the portal simulation
  const [portalRows, setPortalRows] = useState<PortalRawRow[]>(() => INITIAL_SIMULATED_PORTAL_DATA);

  // Keep state saved whenever appState changes
  useEffect(() => {
    saveState(appState);
  }, [appState]);

  // Keep countdown in sync with scanIntervalMinutes when settings change
  useEffect(() => {
    setCountdown(appState.settings.scanIntervalMinutes * 60);
  }, [appState.settings.scanIntervalMinutes]);

  // Core scan execution handler
  const executeScan = useCallback(async () => {
    if (appState.sessionExpired) {
      console.warn('Scanning paused due to expired portal session.');
      return;
    }

    setIsScanning(true);
    const scanStartTime = getKolkataTime().fullStr;

    try {
      // 1. Simulate multi-page portal scan with native Refresh control
      const scanResult = await scanPortalMultiPage(portalRows);

      // Check if portal session expired
      if (scanResult.sessionExpired) {
        setAppState(prev => ({
          ...prev,
          sessionExpired: true,
        }));
        setIsScanning(false);
        return;
      }

      // 2. Process extracted rows through Classification Engine
      const existingAckMap = new Map<string, ComplaintRecord>();
      appState.complaints.forEach(c => existingAckMap.set(c.acknowledgementNumber, c));

      const newRecordsFound: ComplaintRecord[] = [];
      let financialCount = 0;
      let socialMediaCount = 0;
      let reviewCount = 0;

      scanResult.extractedComplaints.forEach(raw => {
        // Idempotency: skip if ack number already exists
        if (existingAckMap.has(raw.acknowledgementNumber)) {
          return;
        }

        const classification = classifyComplaint(raw.incidentMemo, raw.mobileNumber);

        if (classification.classification === 'FINANCIAL') {
          financialCount++;
        } else if (classification.classification === 'SOCIAL_MEDIA') {
          socialMediaCount++;
        } else if (classification.classification === 'REVIEW_REQUIRED') {
          reviewCount++;
        }

        // Determine status
        let initialStatus: ComplaintRecord['status'] = 'NEW';
        if (classification.classification === 'FINANCIAL') {
          initialStatus = 'FINANCIAL';
        } else if (classification.classification === 'SOCIAL_MEDIA') {
          initialStatus = 'IGNORED_SOCIAL_MEDIA';
        } else if (classification.classification === 'REVIEW_REQUIRED') {
          initialStatus = 'REVIEW_REQUIRED';
        } else {
          initialStatus = 'IGNORED_OTHER';
        }

        const record: ComplaintRecord = {
          id: `call-${raw.acknowledgementNumber}-${Date.now()}`,
          acknowledgementNumber: raw.acknowledgementNumber,
          victimName: raw.victimName,
          complaintReportedDateTime: raw.complaintReportedDateTime,
          incidentMemo: raw.incidentMemo,
          mobileNumber: raw.mobileNumber,
          classification: classification.classification,
          detectedAmounts: classification.detectedAmounts,
          detectedKeywords: classification.detectedKeywords,
          classificationConfidence: classification.confidenceScore,
          isFinancial: classification.classification === 'FINANCIAL',
          isSocialMedia: classification.classification === 'SOCIAL_MEDIA',
          portalPage: raw.portalPage,
          portalScannedAt: scanStartTime,
          status: initialStatus,
          whatsappStatus: 'PENDING',
        };

        newRecordsFound.push(record);
      });

      // 3. Combine with existing complaints
      let allComplaints = [...appState.complaints, ...newRecordsFound];

      // 4. Pass newly classified financial complaints to Round-Robin Assignment Engine
      const assignmentResult = assignEligibleComplaints(
        allComplaints,
        appState.currentShift,
        appState.skipRules,
        appState.lastAssignedHelpline
      );

      // 5. Build Scan Log entry (Section 35)
      const newScanLog: PortalScanLog = {
        id: `scan-${Date.now()}`,
        scanNumber: appState.scanLogs.length + 1,
        startedAt: scanStartTime,
        completedAt: getKolkataTime().fullStr,
        portalRefreshStatus: 'SUCCESS',
        pagesScanned: scanResult.pagesScanned,
        totalPages: scanResult.totalPages,
        recordsFound: scanResult.extractedComplaints.length,
        newRecords: newRecordsFound.length,
        financialCount,
        socialMediaCount,
        reviewCount,
        assignedCount: assignmentResult.assignedRecords.length,
        errorCount: 0,
        status: 'SUCCESS',
      };

      // 6. Update State
      setAppState(prev => ({
        ...prev,
        complaints: assignmentResult.updatedComplaints,
        skipRules: assignmentResult.updatedSkipRules,
        lastAssignedHelpline: assignmentResult.nextLastAssignedHelpline,
        scanLogs: [newScanLog, ...prev.scanLogs],
        lastScanTime: getKolkataTime().timeStr,
        nextScanDue: new Date(Date.now() + prev.settings.scanIntervalMinutes * 60000).toLocaleTimeString('en-IN', { hour12: false }),
      }));

      // Append audit log if new assignments happened
      if (assignmentResult.assignedRecords.length > 0) {
        appendAuditLog(
          'AUTOMATIC_ROUND_ROBIN_ASSIGNMENT',
          'Automated Engine',
          'System',
          `Assigned ${assignmentResult.assignedRecords.length} financial complaints across present Helplines.`
        );
      }
    } catch (err: any) {
      console.error('Scan execution error:', err);
    } finally {
      setIsScanning(false);
      setCountdown(appState.settings.scanIntervalMinutes * 60);
    }
  }, [appState, portalRows]);

  // Automated Periodic Scan Interval (Section 3: 1, 2, 3, or 5 mins)
  useEffect(() => {
    if (appState.sessionExpired) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          executeScan();
          return appState.settings.scanIntervalMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [appState.sessionExpired, appState.settings.scanIntervalMinutes, executeScan]);

  // Operator Action: Start Shift (Section 18 & 31)
  const handleSaveShift = (newConfig: ShiftConfig) => {
    setAppState(prev => {
      const updatedHistory = [newConfig, ...prev.shiftHistory.filter(s => s.id !== newConfig.id)];
      return {
        ...prev,
        currentShift: newConfig,
        shiftHistory: updatedHistory,
      };
    });

    appendAuditLog(
      'START_SHIFT',
      newConfig.startedBy,
      appState.currentUserRole,
      `Configured ${newConfig.type} shift for ${newConfig.date} with ${newConfig.presentHelplines.length} present Helplines: [${newConfig.presentHelplines.join(', ')}].`
    );
  };

  // Operator Action: Manual Reassignment (Section 23)
  const handleReassignCall = (complaintId: string, newHelpline: number, reason: string) => {
    const updated = manualReassignCall(
      appState.complaints,
      complaintId,
      newHelpline,
      reason,
      'Officer (Operator)',
      appState.currentUserRole
    );

    setAppState(prev => ({
      ...prev,
      complaints: updated,
    }));
  };

  // Skip Management: Add Rule (Section 20)
  const handleAddSkipRule = (rule: SkipRule) => {
    setAppState(prev => ({
      ...prev,
      skipRules: [...prev.skipRules, rule],
    }));

    appendAuditLog(
      'CREATE_SKIP_RULE',
      rule.createdBy,
      appState.currentUserRole,
      `Created skip rule for Helpline ${rule.helpline}: ${rule.type === 'SKIP_SHIFT' ? 'Skip entire shift' : `Skip next ${rule.initialCount} calls`} (Reason: ${rule.reason}).`
    );
  };

  // Skip Management: Remove Rule
  const handleRemoveSkipRule = (ruleId: string) => {
    setAppState(prev => ({
      ...prev,
      skipRules: prev.skipRules.map(r => (r.id === ruleId ? { ...r, active: false } : r)),
    }));

    appendAuditLog(
      'DEACTIVATE_SKIP_RULE',
      'Operator',
      appState.currentUserRole,
      `Deactivated skip rule ID: ${ruleId}.`
    );
  };

  // Review Queue Actions (Section 12)
  const handleMarkFinancial = (complaintId: string, notes?: string) => {
    setAppState(prev => {
      const target = prev.complaints.find(c => c.id === complaintId);
      if (!target) return prev;

      const updatedComplaint: ComplaintRecord = {
        ...target,
        classification: 'FINANCIAL',
        status: 'FINANCIAL',
      };

      const updatedList = prev.complaints.map(c => (c.id === complaintId ? updatedComplaint : c));

      // Re-run assignment immediately for this newly financial complaint
      const assignmentResult = assignEligibleComplaints(
        updatedList,
        prev.currentShift,
        prev.skipRules,
        prev.lastAssignedHelpline
      );

      appendAuditLog(
        'REVIEW_MARK_FINANCIAL',
        'Officer (Reviewer)',
        prev.currentUserRole,
        `Complaint ${target.acknowledgementNumber} manually classified as FINANCIAL. Notes: ${notes || 'Confirmed loss'}.`
      );

      return {
        ...prev,
        complaints: assignmentResult.updatedComplaints,
        skipRules: assignmentResult.updatedSkipRules,
        lastAssignedHelpline: assignmentResult.nextLastAssignedHelpline,
      };
    });
  };

  const handleMarkNonFinancial = (complaintId: string, notes?: string) => {
    setAppState(prev => {
      const target = prev.complaints.find(c => c.id === complaintId);
      if (!target) return prev;

      const updatedList: ComplaintRecord[] = prev.complaints.map(c =>
        c.id === complaintId
          ? { ...c, classification: 'OTHER', status: 'IGNORED_OTHER' }
          : c
      );

      appendAuditLog(
        'REVIEW_MARK_NON_FINANCIAL',
        'Officer (Reviewer)',
        prev.currentUserRole,
        `Complaint ${target.acknowledgementNumber} adjudicated NON-FINANCIAL. Notes: ${notes || 'No financial loss identified'}.`
      );

      return {
        ...prev,
        complaints: updatedList,
      };
    });
  };

  // WhatsApp Mark Sent (Section 28 & 29)
  const handleMarkWhatsAppSent = (complaintIds: string[]) => {
    const timestamp = getKolkataTime().fullStr;
    setAppState(prev => ({
      ...prev,
      complaints: prev.complaints.map(c =>
        complaintIds.includes(c.id)
          ? { ...c, whatsappStatus: 'SENT_TO_WHATSAPP', whatsappTimestamp: timestamp }
          : c
      ),
    }));

    appendAuditLog(
      'DISPATCH_WHATSAPP_IMAGE',
      'Officer (Operator)',
      appState.currentUserRole,
      `Dispatched WhatsApp assignment image for ${complaintIds.length} complaints.`
    );
  };

  // Settings update
  const handleUpdateSettings = (newSettings: Partial<SystemSettings>) => {
    setAppState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));

    appendAuditLog(
      'UPDATE_SYSTEM_SETTINGS',
      'Admin',
      appState.currentUserRole,
      `Updated system settings: ${JSON.stringify(newSettings)}`
    );
  };

  // Role Change (Section 39)
  const handleRoleChange = (newRole: RoleType) => {
    setAppState(prev => ({
      ...prev,
      currentUserRole: newRole,
    }));

    appendAuditLog(
      'USER_ROLE_SWITCH',
      newRole,
      newRole,
      `Switched session role to ${newRole}.`
    );
  };

  // Portal session recovery after manual re-login (Section 7 & 32)
  const handleRecoverSession = () => {
    setAppState(prev => ({
      ...prev,
      sessionExpired: false,
    }));

    appendAuditLog(
      'SESSION_RECOVERED',
      'Operator',
      appState.currentUserRole,
      'Operator manually re-authenticated portal session and resumed automated scanning.'
    );

    // Run a scan immediately upon recovery
    setTimeout(() => {
      executeScan();
    }, 500);
  };

  // Add custom simulated portal row (for manual test injection)
  const handleAddCustomComplaintToPortal = (row: PortalRawRow) => {
    setPortalRows(prev => [row, ...prev]);
    appendAuditLog(
      'INJECT_PORTAL_RECORD',
      'Test Suite / Operator',
      appState.currentUserRole,
      `Injected custom test record ${row.acknowledgementNumber} into portal repository.`
    );
  };

  // Reset to default benchmark sample data
  const handleResetSampleData = () => {
    if (confirm('Restore standard benchmark complaints and shifts?')) {
      const reset = resetToSampleState();
      setAppState(reset);
      setPortalRows(INITIAL_SIMULATED_PORTAL_DATA);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Persistent System Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentShift={appState.currentShift}
        isScanning={isScanning}
        lastScanTime={appState.lastScanTime}
        nextScanCountdown={countdown}
        sessionExpired={appState.sessionExpired}
        userRole={appState.currentUserRole}
        onScanNow={executeScan}
      />

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'DASHBOARD' && (
          <DashboardView
            complaints={appState.complaints}
            currentShift={appState.currentShift}
            skipRules={appState.skipRules}
            lastAssignedHelpline={appState.lastAssignedHelpline}
            isScanning={isScanning}
            onScanNow={executeScan}
            onOpenTab={setActiveTab}
            userRole={appState.currentUserRole}
          />
        )}

        {activeTab === 'START_SHIFT' && (
          <StartShiftView
            currentShift={appState.currentShift}
            shiftHistory={appState.shiftHistory}
            onSaveShift={handleSaveShift}
            userRole={appState.currentUserRole}
          />
        )}

        {activeTab === 'LIVE_CALLS' && (
          <LiveCallsView
            complaints={appState.complaints}
            onOpenReview={complaint => {
              setActiveTab('REVIEW_QUEUE');
            }}
          />
        )}

        {activeTab === 'ASSIGNMENTS' && (
          <AssignmentsView
            complaints={appState.complaints}
            currentShift={appState.currentShift}
            onReassignCall={handleReassignCall}
            userRole={appState.currentUserRole}
          />
        )}

        {activeTab === 'SKIP_MANAGEMENT' && (
          <SkipManagementView
            skipRules={appState.skipRules}
            currentShift={appState.currentShift}
            onAddSkipRule={handleAddSkipRule}
            onRemoveSkipRule={handleRemoveSkipRule}
            userRole={appState.currentUserRole}
          />
        )}

        {activeTab === 'WHATSAPP_IMAGE' && (
          <AssignmentImageView
            complaints={appState.complaints}
            currentShift={appState.currentShift}
            skipRules={appState.skipRules}
            onMarkWhatsAppSent={handleMarkWhatsAppSent}
            userRole={appState.currentUserRole}
          />
        )}

        {activeTab === 'REVIEW_QUEUE' && (
          <ReviewRequiredView
            complaints={appState.complaints}
            onMarkFinancial={handleMarkFinancial}
            onMarkNonFinancial={handleMarkNonFinancial}
            userRole={appState.currentUserRole}
          />
        )}

        {activeTab === 'PORTAL_SCANNER' && (
          <ScanMonitorView
            scanLogs={appState.scanLogs}
            portalRows={portalRows}
            onAddCustomComplaint={handleAddCustomComplaintToPortal}
            onRefreshPortal={executeScan}
            onScanNow={executeScan}
            isScanning={isScanning}
            userRole={appState.currentUserRole}
          />
        )}

        {activeTab === 'HISTORY' && (
          <HistoryView
            complaints={appState.complaints}
            shiftHistory={appState.shiftHistory}
            userRole={appState.currentUserRole}
          />
        )}

        {activeTab === 'TEST_SUITE' && <Section41TestSuiteView />}

        {activeTab === 'SETTINGS' && (
          <SettingsView
            settings={appState.settings}
            auditLogs={appState.auditLogs}
            userRole={appState.currentUserRole}
            onUpdateSettings={handleUpdateSettings}
            onRoleChange={handleRoleChange}
            onTriggerSessionExpired={() => setAppState(prev => ({ ...prev, sessionExpired: true }))}
            onResetSampleData={handleResetSampleData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 text-slate-500 py-4 px-6 text-center text-xs font-mono shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold text-slate-700">
            Cyber Police Call Assignment & Tracking System • Operational Build 2026.09
          </span>
          <span className="text-slate-500">
            Strict Specification Conformance: Sections 1–43 • 17 Pre-Deployment Test Suites
          </span>
        </div>
      </footer>

      {/* Session Expired Recovery Modal (Section 7 & 32) */}
      <SessionExpiredModal
        isOpen={appState.sessionExpired}
        onRecoverSession={handleRecoverSession}
      />
    </div>
  );
}
