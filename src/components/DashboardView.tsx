import React from 'react';
import {
  Activity,
  AlertOctagon,
  CheckCircle,
  Clock,
  Database,
  FileCheck,
  HelpCircle,
  Play,
  RefreshCw,
  Share2,
  ShieldCheck,
  TrendingUp,
  User,
  Users,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import {
  ComplaintRecord,
  ShiftConfig,
  SkipRule,
  PortalScanLog,
  PortalStatus,
  ScannerStatus,
  RoleType,
} from '../types';

export interface DashboardViewProps {
  complaints: ComplaintRecord[];
  currentShift: ShiftConfig;
  shiftConfig?: ShiftConfig;
  skipRules?: SkipRule[];
  lastAssignedHelpline?: number;
  isScanning?: boolean;
  onScanNow: () => void;
  onOpenTab?: (tab: any) => void;
  onNavigateToTab?: (tab: string) => void;
  userRole: RoleType;
  portalStatus?: PortalStatus;
  scannerStatus?: ScannerStatus;
  latestScanLog?: PortalScanLog | null;
  scanIntervalMinutes?: number;
  nextScanCountdown?: number;
  onRefreshPortal?: () => void;
  onTriggerSessionExpiry?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  portalStatus = 'CONNECTED',
  scannerStatus = 'RUNNING',
  shiftConfig,
  currentShift,
  complaints,
  latestScanLog = null,
  scanIntervalMinutes = 2,
  nextScanCountdown = 120,
  onScanNow,
  onRefreshPortal = () => {},
  onNavigateToTab,
  onOpenTab,
  onTriggerSessionExpiry = () => {},
  userRole,
}) => {
  const activeShift = shiftConfig || currentShift;
  const navigate = (tab: string) => {
    if (onOpenTab) onOpenTab(tab);
    if (onNavigateToTab) onNavigateToTab(tab);
  };

  // Statistics
  const totalCount = complaints.length;
  const financialCount = complaints.filter(c => c.classification === 'FINANCIAL').length;
  const assignedCount = complaints.filter(c => c.status === 'ASSIGNED').length;
  const reviewCount = complaints.filter(c => c.classification === 'REVIEW_REQUIRED').length;
  const socialMediaCount = complaints.filter(c => c.classification === 'SOCIAL_MEDIA').length;
  const pendingWhatsAppCount = complaints.filter(c => c.status === 'ASSIGNED' && c.whatsappStatus === 'PENDING').length;

  // Live feed: Assigned records sorted descending by assignment sequence or time
  const assignedFeed = complaints
    .filter(c => c.status === 'ASSIGNED' && c.assignedHelpline)
    .sort((a, b) => (b.assignmentSequence || 0) - (a.assignmentSequence || 0))
    .slice(0, 10);

  const formatCountdown = (totalSec: number) => {
    if (totalSec <= 0) return '00:00';
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isSessionExpired = portalStatus === 'SESSION_EXPIRED' || portalStatus === 'WAITING_FOR_MANUAL_LOGIN';

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* SECTION 24: Core Status Terminal Card (Matching Section 24 Spec Specification) */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <span className="text-xs font-mono text-slate-700 font-bold tracking-wider uppercase bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
              SPECIFICATION § 24 • REAL-TIME SYSTEM MONITOR
            </span>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-2">
              <Activity className="w-5 h-5 text-slate-800" />
              Operational State & Scanner Dashboard
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-dash-refresh-portal"
              onClick={onRefreshPortal}
              disabled={isSessionExpired}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Click Portal's native refresh button explicitly (Section 4)"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              PORTAL REFRESH
            </button>

            <button
              id="btn-dash-scan-now"
              onClick={onScanNow}
              disabled={isSessionExpired}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              SCAN NOW
            </button>

            {userRole === 'Admin' && (
              <button
                id="btn-test-session-expiry"
                onClick={onTriggerSessionExpiry}
                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-mono rounded-lg border border-red-200 transition cursor-pointer"
                title="Simulate portal logout to test session recovery protocol"
              >
                TEST LOGOUT
              </button>
            )}
          </div>
        </div>

        {/* Section 24 Status Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 pt-4 font-mono text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-slate-500 uppercase text-[11px] mb-1 font-medium">PORTAL</div>
            <div className="flex items-center gap-1.5 font-bold">
              <span
                className={`w-2 h-2 rounded-full ${
                  isSessionExpired ? 'bg-red-500 animate-ping' : 'bg-emerald-500'
                }`}
              />
              <span className={isSessionExpired ? 'text-red-600' : 'text-emerald-700'}>
                {portalStatus}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-slate-500 uppercase text-[11px] mb-1 font-medium">SCANNER</div>
            <div className="flex items-center gap-1.5 font-bold">
              <span
                className={`w-2 h-2 rounded-full ${
                  scannerStatus === 'RUNNING' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span className={scannerStatus === 'RUNNING' ? 'text-emerald-700' : 'text-amber-700'}>
                {scannerStatus}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-slate-500 uppercase text-[11px] mb-1 font-medium">CURRENT SHIFT</div>
            <div className="font-bold text-slate-900 flex items-center gap-1">
              <span>{activeShift.type}</span>
              <span className="text-[10px] text-slate-500 font-normal">
                ({activeShift.type === 'MORNING' ? '08-14h' : '14-20h'})
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-slate-500 uppercase text-[11px] mb-1 font-medium">ASSIGNMENT</div>
            <div className="flex items-center gap-1.5 font-bold">
              <span
                className={`w-2 h-2 rounded-full ${
                  activeShift.active && !isSessionExpired ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span className={activeShift.active && !isSessionExpired ? 'text-emerald-700' : 'text-amber-700'}>
                {isSessionExpired ? 'PAUSED' : activeShift.active ? 'ACTIVE' : 'LOCKED'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-slate-500 uppercase text-[11px] mb-1 font-medium">LAST REFRESH</div>
            <div className="font-bold text-slate-900">
              {latestScanLog?.startedAt?.split(' ')[1] || '13:31:02'}
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-slate-500 uppercase text-[11px] mb-1 font-medium">LAST SCAN</div>
            <div className="font-bold text-slate-900">
              {latestScanLog?.completedAt?.split(' ')[1] || '13:31:18'}
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-slate-500 uppercase text-[11px] mb-1 font-medium">NEXT SCAN IN</div>
            <div className="font-bold text-slate-900 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-600" />
              <span>{formatCountdown(nextScanCountdown)}</span>
            </div>
          </div>
        </div>

        {/* Boundary and Shift Cutoff Warning */}
        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-700 gap-2 font-mono shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
              CUTOFF POLICY:
            </span>
            <span className="text-slate-800">
              {activeShift.type === 'MORNING'
                ? 'Morning cutoff 13:45:00 (13:44:59 eligible, 13:45:00 halted)'
                : 'Evening cutoff 19:45:00 (19:44:59 eligible, 19:45:00 halted)'}
            </span>
          </div>
          <div className="flex items-center gap-3 font-medium">
            <span className="text-slate-600">Scan Interval: {scanIntervalMinutes}m</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">Pages Scanned: {latestScanLog?.pagesScanned || 2}</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div
          onClick={() => navigate('LIVE_CALLS')}
          className="bg-white border border-slate-200 hover:border-slate-400 p-4 rounded-xl cursor-pointer transition shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Total Detected</span>
            <Database className="w-4 h-4 text-slate-700 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">From portal table</p>
        </div>

        <div
          onClick={() => navigate('LIVE_CALLS')}
          className="bg-white border border-slate-200 hover:border-emerald-400 p-4 rounded-xl cursor-pointer transition shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Financial Calls</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{financialCount}</div>
          <p className="text-[11px] text-emerald-700/80 mt-1 font-medium">Eligible for assignment</p>
        </div>

        <div
          onClick={() => navigate('ASSIGNMENTS')}
          className="bg-white border border-slate-200 hover:border-slate-400 p-4 rounded-xl cursor-pointer transition shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Assigned</span>
            <FileCheck className="w-4 h-4 text-slate-700 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-900">{assignedCount}</div>
          <p className="text-[11px] text-slate-600 mt-1">Across Helplines 1–16</p>
        </div>

        <div
          onClick={() => navigate('REVIEW_QUEUE')}
          className={`bg-white border p-4 rounded-xl cursor-pointer transition shadow-xs group ${
            reviewCount > 0
              ? 'border-amber-400 bg-amber-50/50'
              : 'border-slate-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Review Queue</span>
            <HelpCircle className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-amber-700">{reviewCount}</div>
          <p className="text-[11px] text-amber-700/80 mt-1 font-medium">Ambiguous complaints</p>
        </div>

        <div
          onClick={() => navigate('LIVE_CALLS')}
          className="bg-white border border-slate-200 hover:border-slate-400 p-4 rounded-xl cursor-pointer transition shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Social Media</span>
            <AlertOctagon className="w-4 h-4 text-slate-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-700">{socialMediaCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Pure SM (Ignored)</p>
        </div>

        <div
          onClick={() => navigate('WHATSAPP_IMAGE')}
          className="bg-white border border-slate-200 hover:border-emerald-400 p-4 rounded-xl cursor-pointer transition shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">WhatsApp Queued</span>
            <Share2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{pendingWhatsAppCount}</div>
          <p className="text-[11px] text-emerald-700/80 mt-1 font-medium">Ready for dispatch</p>
        </div>
      </div>

      {/* Two Column Layout: Section 25 Live Assignment Feed + Shift Roster Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SECTION 25: Live Assignment Feed (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
            <div>
              <span className="text-xs font-mono text-emerald-700 font-bold tracking-wider uppercase bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                SPECIFICATION § 25 • STREAM
              </span>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mt-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Live Assignment Feed
              </h3>
            </div>
            <button
              onClick={() => navigate('ASSIGNMENTS')}
              className="text-xs font-bold text-slate-800 hover:text-slate-600 flex items-center gap-1 cursor-pointer bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300"
            >
              <span>View All Assignments</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {assignedFeed.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm font-mono bg-slate-50 rounded-lg border border-dashed border-slate-200">
              No assignments recorded yet. Scan portal to detect and assign financial calls.
            </div>
          ) : (
            <div className="space-y-2.5 font-mono">
              {assignedFeed.map(call => {
                const amount = call.detectedAmounts?.[0];
                return (
                  <div
                    key={call.id}
                    className="p-3.5 bg-slate-50 border border-slate-200/90 hover:border-slate-300 rounded-lg flex flex-wrap items-center justify-between gap-3 transition shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">
                          {call.assignedAt || call.complaintReportedDateTime.split(' ')[1]}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          Ack: {call.acknowledgementNumber}
                        </span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                          Last 4: {call.acknowledgementNumber.slice(-4)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-sans line-clamp-1 max-w-md">
                        {call.incidentMemo}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      {amount !== undefined && (
                        <div className="text-right">
                          <span className="text-xs font-black text-emerald-800 px-2 py-1 bg-emerald-100 border border-emerald-300 rounded">
                            ₹{amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}

                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-white px-2.5 py-1 bg-slate-900 rounded shadow-xs">
                          <User className="w-3 h-3 text-slate-300" />
                          → Helpline {call.assignedHelpline}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Present Helplines & Shift Overview */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <span className="text-xs font-mono text-slate-700 font-bold uppercase tracking-wider bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
                SHIFT ROSTER
              </span>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mt-2">
                <Users className="w-4 h-4 text-slate-700" />
                Present Helplines (1–16)
              </h3>
            </div>
            <button
              onClick={() => navigate('START_SHIFT')}
              className="text-xs text-slate-700 hover:text-slate-900 font-semibold cursor-pointer bg-slate-100 px-2.5 py-1 rounded border border-slate-300"
            >
              Modify Roster
            </button>
          </div>

          <div className="text-xs text-slate-600">
            <span>Date: </span>
            <span className="text-slate-900 font-bold">{activeShift.date}</span>
            <span className="mx-2">•</span>
            <span>Shift: </span>
            <span className="text-slate-900 font-bold">{activeShift.type}</span>
          </div>

          {/* Grid of Helpline 1-16 badges */}
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 16 }, (_, i) => i + 1).map(hNum => {
              const isPresent = activeShift.presentHelplines.includes(hNum);
              return (
                <div
                  key={hNum}
                  className={`p-2 rounded-lg text-center font-mono text-xs border transition ${
                    isPresent
                      ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="text-[10px] font-sans opacity-80">Helpline</div>
                  <div className="text-sm font-bold">{hNum}</div>
                  <div className="text-[9px] mt-0.5 font-semibold">
                    {isPresent ? 'PRESENT' : 'ABSENT'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-xs text-slate-600 border-t border-slate-200 space-y-1 font-mono">
            <p className="flex justify-between">
              <span>Present Count:</span>
              <span className="font-bold text-slate-900">{activeShift.presentHelplines.length} / 16</span>
            </p>
            <p className="flex justify-between">
              <span>Shift Initialized By:</span>
              <span className="text-slate-800 font-medium truncate max-w-[150px]">{activeShift.startedBy}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
