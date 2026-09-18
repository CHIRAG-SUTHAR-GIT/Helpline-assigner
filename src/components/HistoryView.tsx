import React, { useState } from 'react';
import {
  History as HistoryIcon,
  Download,
  Filter,
  Search,
  Calendar,
  Layers,
  FileSpreadsheet,
  CheckCircle,
  Share2,
} from 'lucide-react';
import { ComplaintRecord, ShiftConfig, RoleType } from '../types';

interface HistoryViewProps {
  complaints: ComplaintRecord[];
  shiftHistory: ShiftConfig[];
  userRole: RoleType;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  complaints,
  shiftHistory,
  userRole,
}) => {
  const [activeTab, setActiveTab] = useState<'ALL_CASES' | 'SHIFT_HISTORY'>('ALL_CASES');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [shiftFilter, setShiftFilter] = useState('ALL');
  const [helplineFilter, setHelplineFilter] = useState<number | 'ALL'>('ALL');
  const [classificationFilter, setClassificationFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [whatsappFilter, setWhatsappFilter] = useState('ALL');

  // Unique dates from records
  const uniqueDates = Array.from(
    new Set(complaints.map(c => c.shiftDate || c.complaintReportedDateTime.split(' ')[0]))
  );

  const filtered = complaints.filter(c => {
    const matchesSearch =
      c.acknowledgementNumber.includes(searchQuery) ||
      c.victimName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.incidentMemo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.mobileNumber.includes(searchQuery);

    if (!matchesSearch) return false;

    const recordDate = c.shiftDate || c.complaintReportedDateTime.split(' ')[0];
    if (dateFilter !== 'ALL' && recordDate !== dateFilter) return false;
    if (shiftFilter !== 'ALL' && c.shiftType !== shiftFilter) return false;
    if (helplineFilter !== 'ALL' && c.assignedHelpline !== helplineFilter) return false;
    if (classificationFilter !== 'ALL' && c.classification !== classificationFilter) return false;
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (whatsappFilter !== 'ALL' && c.whatsappStatus !== whatsappFilter) return false;

    return true;
  });

  const exportFilteredCSV = () => {
    if (filtered.length === 0) {
      alert('No records to export.');
      return;
    }

    const headers = [
      'Internal ID',
      'Acknowledgement Number',
      'Reported Date/Time',
      'Victim Name',
      'Mobile Number',
      'Incident Memo',
      'Classification',
      'Detected Amounts',
      'Status',
      'Assigned Helpline',
      'Assignment Sequence',
      'Shift Date',
      'Shift Type',
      'WhatsApp Status'
    ];

    const rows = filtered.map(c => [
      `"${c.id}"`,
      `"\t${c.acknowledgementNumber}"`,
      `"${c.complaintReportedDateTime}"`,
      `"${c.victimName.replace(/"/g, '""')}"`,
      `"${c.mobileNumber}"`,
      `"${c.incidentMemo.replace(/"/g, '""')}"`,
      `"${c.classification}"`,
      `"${c.detectedAmounts?.join('; ') || ''}"`,
      `"${c.status}"`,
      `"${c.assignedHelpline ? 'Helpline ' + c.assignedHelpline : ''}"`,
      `"${c.assignmentSequence || ''}"`,
      `"${c.shiftDate || ''}"`,
      `"${c.shiftType || ''}"`,
      `"${c.whatsappStatus}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Cyber_Police_Historical_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="history-view" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-slate-700 font-bold tracking-wider uppercase bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
            SPECIFICATION § 30, 31, 42 • PERMANENT HISTORICAL ARCHIVE
          </span>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-2">
            <HistoryIcon className="w-5 h-5 text-slate-700" />
            Historical Complaint & Shift Archive
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Searchable historical repository with multi-field filtering. Complete 14-digit acknowledgement numbers are strictly retained in all storage and exports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportFilteredCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-mono font-bold flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>EXPORT ARCHIVE (CSV)</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('ALL_CASES')}
          className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition cursor-pointer ${
            activeTab === 'ALL_CASES'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          All Complaint History ({complaints.length})
        </button>
        <button
          onClick={() => setActiveTab('SHIFT_HISTORY')}
          className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition cursor-pointer ${
            activeTab === 'SHIFT_HISTORY'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          Immutable Shift Attendance History ({shiftHistory.length})
        </button>
      </div>

      {activeTab === 'ALL_CASES' ? (
        <div className="space-y-4">
          {/* Multi-Filter Bar */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 font-mono text-xs shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="sm:col-span-2 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Ack #, Victim, Mobile, Incident..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-transparent text-slate-900 focus:outline-none w-full placeholder-slate-400"
                />
              </div>

              {/* Date */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Date:</span>
                <select
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-900 w-full focus:outline-none"
                >
                  <option value="ALL">All Dates</option>
                  {uniqueDates.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Shift */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Shift:</span>
                <select
                  value={shiftFilter}
                  onChange={e => setShiftFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-900 w-full focus:outline-none"
                >
                  <option value="ALL">All Shifts</option>
                  <option value="MORNING">Morning (08:00–14:00)</option>
                  <option value="EVENING">Evening (14:00–20:00)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
              {/* Helpline */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Helpline:</span>
                <select
                  value={helplineFilter}
                  onChange={e => setHelplineFilter(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value, 10))}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-900 w-full focus:outline-none"
                >
                  <option value="ALL">All Helplines</option>
                  {Array.from({ length: 16 }, (_, i) => i + 1).map(h => (
                    <option key={h} value={h}>Helpline {h}</option>
                  ))}
                </select>
              </div>

              {/* Classification */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Class:</span>
                <select
                  value={classificationFilter}
                  onChange={e => setClassificationFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-900 w-full focus:outline-none"
                >
                  <option value="ALL">All Classes</option>
                  <option value="FINANCIAL">Financial</option>
                  <option value="SOCIAL_MEDIA">Social Media</option>
                  <option value="REVIEW_REQUIRED">Review Required</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Status */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-900 w-full focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="NEW">New</option>
                  <option value="IGNORED_SOCIAL_MEDIA">Ignored (SM)</option>
                  <option value="REVIEW_REQUIRED">Review Required</option>
                </select>
              </div>

              {/* WhatsApp */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">WhatsApp:</span>
                <select
                  value={whatsappFilter}
                  onChange={e => setWhatsappFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-900 w-full focus:outline-none"
                >
                  <option value="ALL">All WhatsApp</option>
                  <option value="SENT_TO_WHATSAPP">Sent</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
                  <tr>
                    <th className="p-3">Ack Number</th>
                    <th className="p-3">Reported Time</th>
                    <th className="p-3">Victim / Mobile</th>
                    <th className="p-3">Incident Memo</th>
                    <th className="p-3">Classification</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Assigned To</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No records match the active filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filtered.map(call => (
                      <tr key={call.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                          {call.acknowledgementNumber}
                        </td>
                        <td className="p-3 text-slate-600 whitespace-nowrap">
                          {call.complaintReportedDateTime}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="text-slate-900 font-sans font-semibold">{call.victimName}</div>
                          <div className="text-slate-500 text-[10px]">{call.mobileNumber}</div>
                        </td>
                        <td className="p-3 font-sans text-slate-700 max-w-xs">
                          <p className="line-clamp-2">{call.incidentMemo}</p>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              call.classification === 'FINANCIAL'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                : call.classification === 'SOCIAL_MEDIA'
                                ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {call.classification}
                          </span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {call.detectedAmounts?.[0] ? (
                            <span className="text-emerald-700 font-bold">
                              ₹{call.detectedAmounts[0].toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {call.assignedHelpline ? (
                            <span className="px-2 py-0.5 bg-slate-900 text-white rounded font-bold">
                              Helpline {call.assignedHelpline}
                            </span>
                          ) : (
                            <span className="text-slate-400">None</span>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap text-slate-500 text-[11px] font-semibold">
                          {call.status}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* SECTION 31: Immutable Shift Attendance History */
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase font-mono">
              Preserved Shift Roster Configurations (Section 31)
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-1">
              "For every shift, preserve the exact list of present Helplines. This historical record must never change because a later shift has a different configuration."
            </p>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {shiftHistory.map((s, idx) => (
              <div
                key={s.id || idx}
                className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-slate-900">
                    {s.date} — {s.type}
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    Started at {s.startedAt} by {s.startedBy}
                  </span>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="text-slate-500 mb-1 font-medium">
                    Present Helplines ({s.presentHelplines.length} Active):
                  </div>
                  <div className="text-slate-900 font-bold tracking-wide">
                    Present: {s.presentHelplines.join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
