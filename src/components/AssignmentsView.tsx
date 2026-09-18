import React, { useState } from 'react';
import {
  Download,
  Filter,
  Search,
  UserCheck,
  RefreshCcw,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Share2,
  Calendar,
  Phone,
  User,
} from 'lucide-react';
import { ComplaintRecord, ShiftConfig, RoleType } from '../types';

interface AssignmentsViewProps {
  complaints: ComplaintRecord[];
  currentShift: ShiftConfig;
  onReassignCall: (complaintId: string, newHelpline: number, reason: string) => void;
  userRole: RoleType;
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
  complaints,
  currentShift,
  onReassignCall,
  userRole,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [helplineFilter, setHelplineFilter] = useState<number | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [reassignModalTarget, setReassignModalTarget] = useState<ComplaintRecord | null>(null);
  const [newHelplineTarget, setNewHelplineTarget] = useState<number>(1);
  const [reassignReason, setReassignReason] = useState('Operator requested reassignment');

  const assignedComplaints = complaints.filter(c => c.status === 'ASSIGNED');

  const filtered = assignedComplaints.filter(c => {
    const matchesSearch =
      c.acknowledgementNumber.includes(searchQuery) ||
      c.victimName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.incidentMemo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.mobileNumber.includes(searchQuery);

    if (!matchesSearch) return false;
    if (helplineFilter !== 'ALL' && c.assignedHelpline !== helplineFilter) return false;
    if (statusFilter !== 'ALL' && c.whatsappStatus !== statusFilter) return false;
    return true;
  });

  // Export to CSV / Excel (Section 42: Exports complete acknowledgement numbers)
  const exportToCSV = () => {
    if (filtered.length === 0) {
      alert('No records available to export.');
      return;
    }

    const headers = [
      'Internal ID',
      'Acknowledgement Number (Complete)',
      'Ack Last 4',
      'Reported Date/Time',
      'Complainant / Victim Name',
      'Mobile Number',
      'Assigned Helpline',
      'Assignment Sequence',
      'Assignment Timestamp',
      'Shift Date',
      'Shift Type',
      'Classification',
      'Detected Amount (INR)',
      'WhatsApp Status',
      'Incident Memo',
      'Manual Reassigned?',
      'Reassignment Reason'
    ];

    const rows = filtered.map(c => [
      `"${c.id}"`,
      `"\t${c.acknowledgementNumber}"`, // tab escape prevents Excel from truncating large 14-digit numbers
      `"${c.acknowledgementNumber.slice(-4)}"`,
      `"${c.complaintReportedDateTime}"`,
      `"${c.victimName.replace(/"/g, '""')}"`,
      `"${c.mobileNumber}"`,
      `"Helpline ${c.assignedHelpline}"`,
      `"${c.assignmentSequence || ''}"`,
      `"${c.assignedAt || ''}"`,
      `"${c.shiftDate || ''}"`,
      `"${c.shiftType || ''}"`,
      `"${c.classification}"`,
      `"${c.detectedAmounts?.[0] || 0}"`,
      `"${c.whatsappStatus}"`,
      `"${c.incidentMemo.replace(/"/g, '""')}"`,
      `"${c.manualReassigned ? 'YES' : 'NO'}"`,
      `"${c.manualReassignedReason || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Cyber_Police_Assignments_${currentShift.date.replace(/\//g, '-')}_${currentShift.type}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenReassign = (record: ComplaintRecord) => {
    setReassignModalTarget(record);
    // Suggest first other available Helpline
    const otherH = currentShift.presentHelplines.find(h => h !== record.assignedHelpline) || 1;
    setNewHelplineTarget(otherH);
    setReassignReason('Operator requested reassignment');
  };

  const handleConfirmReassignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignModalTarget) return;
    if (!reassignReason.trim()) {
      alert('A valid reason is required for audited reassignment.');
      return;
    }

    onReassignCall(reassignModalTarget.id, newHelplineTarget, reassignReason);
    setReassignModalTarget(null);
  };

  const canReassign = userRole === 'Admin' || userRole === 'Operator';

  return (
    <div id="assignments-view" className="space-y-6">
      {/* Top Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-slate-700 font-bold tracking-wider uppercase bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
            SPECIFICATION § 21, 23, 42 • OFFICIAL ASSIGNMENT RECORDS
          </span>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-2">
            <UserCheck className="w-5 h-5 text-slate-700" />
            Helpline Assignments & Case Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete records of all round-robin assigned financial calls. Every reassignment is strictly audited. Full 14-digit acknowledgement numbers preserved.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-export-assignments-csv"
            onClick={exportToCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-2xs cursor-pointer"
            title="Export full filtered table to CSV / Excel spreadsheet"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>EXPORT CSV (EXCEL)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            id="input-search-assignments"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search Ack #, Victim, Mobile, Memo..."
            className="bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-full font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          {/* Helpline Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Helpline:</span>
            <select
              id="select-filter-helpline"
              value={helplineFilter}
              onChange={e => setHelplineFilter(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value, 10))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none"
            >
              <option value="ALL">All Helplines (1–16)</option>
              {Array.from({ length: 16 }, (_, i) => i + 1).map(h => (
                <option key={h} value={h}>Helpline {h}</option>
              ))}
            </select>
          </div>

          {/* WhatsApp Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">WhatsApp:</span>
            <select
              id="select-filter-whatsapp"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Image Send</option>
              <option value="SENT_TO_WHATSAPP">Sent to WhatsApp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase font-mono border-b border-slate-200 font-medium">
              <tr>
                <th className="p-3.5">Seq</th>
                <th className="p-3.5">Acknowledgement Number</th>
                <th className="p-3.5">Assigned Helpline</th>
                <th className="p-3.5">Amount (INR)</th>
                <th className="p-3.5">Complainant / Mobile</th>
                <th className="p-3.5">Reported Time</th>
                <th className="p-3.5">Incident Memo</th>
                <th className="p-3.5">WhatsApp</th>
                <th className="p-3.5 text-right">Reassign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-sans">
                    No assignment records match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map(call => {
                  const amount = call.detectedAmounts?.[0];
                  return (
                    <tr
                      key={call.id}
                      className="hover:bg-slate-50 transition group"
                    >
                      {/* Seq # */}
                      <td className="p-3.5 text-slate-400 font-bold">
                        #{call.assignmentSequence || '—'}
                      </td>

                      {/* Complete Ack No */}
                      <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{call.acknowledgementNumber}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          Last 4: <strong className="text-slate-800">{call.acknowledgementNumber.slice(-4)}</strong>
                          {call.manualReassigned && (
                            <span className="ml-1 text-amber-700 font-semibold">(Reassigned)</span>
                          )}
                        </div>
                      </td>

                      {/* Assigned Helpline */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 font-bold text-white text-xs shadow-2xs">
                          <User className="w-3.5 h-3.5 text-slate-300" />
                          Helpline {call.assignedHelpline}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="p-3.5 whitespace-nowrap">
                        {amount !== undefined ? (
                          <span className="text-xs font-bold text-emerald-800 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-300">
                            ₹{amount.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-slate-400">Financial</span>
                        )}
                      </td>

                      {/* Victim / Mobile */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="text-slate-900 font-sans font-semibold">{call.victimName}</div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{call.mobileNumber}</span>
                        </div>
                      </td>

                      {/* Reported Time */}
                      <td className="p-3.5 text-slate-600 whitespace-nowrap">
                        <div>{call.complaintReportedDateTime}</div>
                        <div className="text-[10px] text-slate-400">
                          Assigned: {call.assignedAt || 'Auto'}
                        </div>
                      </td>

                      {/* Incident Memo */}
                      <td className="p-3.5 font-sans text-slate-700 max-w-xs">
                        <p className="line-clamp-2 text-xs" title={call.incidentMemo}>
                          {call.incidentMemo}
                        </p>
                      </td>

                      {/* WhatsApp Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        {call.whatsappStatus === 'SENT_TO_WHATSAPP' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <CheckCircle className="w-3 h-3" />
                            SENT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                            <Share2 className="w-3 h-3" />
                            PENDING
                          </span>
                        )}
                      </td>

                      {/* Reassign Button */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          id={`btn-reassign-${call.id}`}
                          onClick={() => handleOpenReassign(call)}
                          disabled={!canReassign}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs border border-slate-300 transition cursor-pointer disabled:opacity-40 shadow-2xs font-medium"
                          title="Manually reassign to another Helpline (Section 23)"
                        >
                          Reassign
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 23: Manual Reassignment Modal */}
      {reassignModalTarget && (
        <div
          id="modal-reassignment-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div
            id="modal-reassignment-card"
            className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 text-slate-900 font-mono text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-2">
                <RefreshCcw className="w-4 h-4 text-amber-600" />
                Manual Reassignment (Section 23)
              </h3>
              <button
                onClick={() => setReassignModalTarget(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmReassignment} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <div className="text-slate-600">
                  Acknowledgement:{' '}
                  <strong className="text-slate-900">
                    {reassignModalTarget.acknowledgementNumber}
                  </strong>
                </div>
                <div className="text-slate-600">
                  Current Assigned:{' '}
                  <strong className="text-slate-900">
                    Helpline {reassignModalTarget.assignedHelpline}
                  </strong>
                </div>
                <div className="text-slate-600">
                  Complainant:{' '}
                  <strong className="text-slate-900">{reassignModalTarget.victimName}</strong>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 uppercase font-semibold mb-1">
                  Change to Helpline:
                </label>
                <select
                  id="select-reassign-target"
                  value={newHelplineTarget}
                  onChange={e => setNewHelplineTarget(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none"
                  required
                >
                  {currentShift.presentHelplines.map(h => (
                    <option key={h} value={h}>
                      Helpline {h} {h === reassignModalTarget.assignedHelpline ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 uppercase font-semibold mb-1">
                  Reason for Reassignment (Audit Requirement):
                </label>
                <input
                  id="input-reassign-reason"
                  type="text"
                  value={reassignReason}
                  onChange={e => setReassignReason(e.target.value)}
                  placeholder="e.g. Operator requested reassignment / complex case"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-sans text-xs focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReassignModalTarget(null)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 cursor-pointer font-medium"
                >
                  CANCEL
                </button>
                <button
                  id="btn-confirm-reassignment"
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>CONFIRM REASSIGNMENT</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
