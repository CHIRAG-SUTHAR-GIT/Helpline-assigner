import React, { useState } from 'react';
import {
  Monitor,
  RefreshCw,
  PlusCircle,
  FileText,
  AlertCircle,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  Play,
} from 'lucide-react';
import { PortalRawRow, INITIAL_SIMULATED_PORTAL_DATA } from '../services/portalScanner';
import { PortalScanLog, RoleType } from '../types';

interface ScanMonitorViewProps {
  scanLogs: PortalScanLog[];
  portalRows: PortalRawRow[];
  onAddCustomComplaint: (row: PortalRawRow) => void;
  onRefreshPortal: () => void;
  onScanNow: () => void;
  isScanning: boolean;
  userRole: RoleType;
}

export const ScanMonitorView: React.FC<ScanMonitorViewProps> = ({
  scanLogs,
  portalRows,
  onAddCustomComplaint,
  onRefreshPortal,
  onScanNow,
  isScanning,
  userRole,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showAddModal, setShowAddModal] = useState(false);

  // New complaint simulation form
  const [newAck, setNewAck] = useState(`31109260${Math.floor(100000 + Math.random() * 900000)}`);
  const [newVictim, setNewVictim] = useState('Vivek Singhania');
  const [newTime, setNewTime] = useState('18/09/2026 13:42:10');
  const [newMobile, setNewMobile] = useState('9820011882');
  const [newMemo, setNewMemo] = useState('UPI FRAUD transaction 15,000/- debited via fake bank APK');

  const totalPages = Math.max(...portalRows.map(r => r.pageNumber), 1);
  const pageItems = portalRows.filter(r => r.pageNumber === currentPage);

  const handleCreateTestComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    const row: PortalRawRow = {
      col0_ignoredCheckbox: 'check',
      acknowledgementNumber: newAck,
      victimName: newVictim,
      reportedDateTime: newTime,
      incidentMemo: newMemo,
      mobileNumber: newMobile,
      col6_ignoredActions: 'VIEW',
      pageNumber: currentPage,
    };

    onAddCustomComplaint(row);
    setShowAddModal(false);
    // regenerate random ack for next time
    setNewAck(`31109260${Math.floor(100000 + Math.random() * 900000)}`);
  };

  return (
    <div id="scan-monitor-view" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-slate-700 font-bold tracking-wider uppercase bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
            SPECIFICATION § 1, 4, 14, 35 • PORTAL INTERFACE & CRAWLER AUDIT
          </span>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-2">
            <Monitor className="w-5 h-5 text-slate-700" />
            Cyber Police Portal Simulator & Scan Engine
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Replicates the connected National Cyber Police Portal. Demonstrates explicit portal Refresh clicking, multi-page crawling, and extraction of the 5 mandatory columns while ignoring column 1 and column 7.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-portal-sim-refresh"
            onClick={onRefreshPortal}
            disabled={isScanning}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Click the Portal's own Refresh button (Section 4)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>PORTAL REFRESH</span>
          </button>

          <button
            id="btn-sim-add-complaint"
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg font-mono text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-700" />
            <span>INJECT PORTAL RECORD</span>
          </button>
        </div>
      </div>

      {/* Cyber Police Portal Simulated Interface Card */}
      <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {/* Portal simulated browser header */}
        <div className="bg-slate-100 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <span className="text-xs font-mono text-slate-600 bg-white px-2.5 py-0.5 rounded border border-slate-200">
              https://cyberpolice.gov.in/portal/officer/complaints-table
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-500">Total Available Pages:</span>
            <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-900 font-bold border border-slate-300">
              {totalPages} Pages ({portalRows.length} Records)
            </span>
          </div>
        </div>

        {/* Portal Table Toolbar */}
        <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 font-mono flex items-center gap-2">
            <span>OFFICIAL COMPLAINTS REPOSITORY</span>
            <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 font-bold">
              LIVE SESSION VERIFIED
            </span>
          </span>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 bg-white border border-slate-200 text-slate-700 rounded-md disabled:opacity-40 cursor-pointer flex items-center shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-slate-600 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 bg-white border border-slate-200 text-slate-700 rounded-md disabled:opacity-40 cursor-pointer flex items-center shadow-2xs"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Portal Raw Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-3 text-slate-400 bg-slate-50" title="Ignored First Column (Section 1)">
                  [IGNORED 1st COL]
                </th>
                <th className="p-3 text-slate-900 font-bold">1. Acknowledgement No.</th>
                <th className="p-3 text-slate-900 font-bold">2. Complainant / Victim Name</th>
                <th className="p-3 text-slate-900 font-bold">3. Reported Date/Time</th>
                <th className="p-3 text-slate-900 font-bold">4. Additional Information (Memo)</th>
                <th className="p-3 text-slate-900 font-bold">5. Mobile Number</th>
                <th className="p-3 text-slate-400 bg-slate-50" title="Ignored Last Column (Section 1)">
                  [IGNORED LAST COL]
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {pageItems.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-3 text-slate-400 bg-slate-50/50 text-center">
                    <input type="checkbox" disabled className="opacity-40" />
                  </td>
                  <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                    {row.acknowledgementNumber}
                  </td>
                  <td className="p-3 text-slate-900 font-sans font-semibold whitespace-nowrap">
                    {row.victimName}
                  </td>
                  <td className="p-3 text-slate-600 whitespace-nowrap">
                    {row.reportedDateTime}
                  </td>
                  <td className="p-3 text-slate-700 max-w-sm font-sans">
                    <p className="line-clamp-2">{row.incidentMemo}</p>
                  </td>
                  <td className="p-3 text-slate-600 whitespace-nowrap">
                    {row.mobileNumber}
                  </td>
                  <td className="p-3 text-slate-400 bg-slate-50/50 text-center">
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200">
                      Action
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 35: Portal Scan Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <span className="text-xs font-mono text-slate-700 font-bold uppercase tracking-wider bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
              SPECIFICATION § 35 • SCAN AUDIT LOG
            </span>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mt-2">
              <FileText className="w-4 h-4 text-slate-700" />
              Historical Scan Records & Crawl Performance
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-medium">
              <tr>
                <th className="p-3">Scan #</th>
                <th className="p-3">Started</th>
                <th className="p-3">Completed</th>
                <th className="p-3">Portal Refresh</th>
                <th className="p-3">Pages Scanned</th>
                <th className="p-3">Records Found</th>
                <th className="p-3">New Records</th>
                <th className="p-3">Financial</th>
                <th className="p-3">Social Media</th>
                <th className="p-3">Review Req.</th>
                <th className="p-3">Errors</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {scanLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">#{log.scanNumber}</td>
                  <td className="p-3 text-slate-600">{log.startedAt.split(' ')[1] || log.startedAt}</td>
                  <td className="p-3 text-slate-600">{log.completedAt?.split(' ')[1] || log.completedAt || '—'}</td>
                  <td className="p-3">
                    <span className="text-emerald-700 font-bold">{log.portalRefreshStatus}</span>
                  </td>
                  <td className="p-3 text-slate-900">{log.pagesScanned} / {log.totalPages}</td>
                  <td className="p-3 text-slate-700">{log.recordsFound}</td>
                  <td className="p-3 font-bold text-slate-900">{log.newRecords}</td>
                  <td className="p-3 font-bold text-emerald-700">{log.financialCount}</td>
                  <td className="p-3 text-slate-500">{log.socialMediaCount}</td>
                  <td className="p-3 text-amber-700 font-bold">{log.reviewCount}</td>
                  <td className="p-3 text-slate-400">{log.errorCount}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : 'bg-red-50 text-red-800 border border-red-300'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Inject Custom Complaint to Test Classification Live */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4 font-mono text-xs text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                Inject Custom Complaint into Portal Table
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateTestComplaint} className="space-y-3">
              <div>
                <label className="block text-slate-600 uppercase mb-1 font-semibold">Acknowledgement Number (14 Digits):</label>
                <input
                  type="text"
                  value={newAck}
                  onChange={e => setNewAck(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 uppercase mb-1 font-semibold">Victim Name:</label>
                  <input
                    type="text"
                    value={newVictim}
                    onChange={e => setNewVictim(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-sans"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 uppercase mb-1 font-semibold">Mobile Number:</label>
                  <input
                    type="text"
                    value={newMobile}
                    onChange={e => setNewMobile(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 uppercase mb-1 font-semibold">Reported Date/Time (Asia/Kolkata):</label>
                <input
                  type="text"
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                  placeholder="DD/MM/YYYY HH:MM:SS"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 uppercase mb-1 font-semibold">
                  Additional Information Memo (Incident Text):
                </label>
                <textarea
                  rows={3}
                  value={newMemo}
                  onChange={e => setNewMemo(e.target.value)}
                  placeholder="Enter incident memo e.g. WITHOUT OTP FRAUD 10,000/- or WHATSAPP HACK..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-sans"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 cursor-pointer font-medium"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  INJECT & PREPARE FOR SCAN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
