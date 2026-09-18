import React, { useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Phone,
  Calendar,
  IndianRupee,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { ComplaintRecord, ClassificationType } from '../types';

interface LiveCallsViewProps {
  complaints: ComplaintRecord[];
  onOpenReview: (complaint: ComplaintRecord) => void;
}

export const LiveCallsView: React.FC<LiveCallsViewProps> = ({
  complaints,
  onOpenReview,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | ClassificationType>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<ComplaintRecord | null>(null);

  const filtered = complaints.filter(c => {
    const matchesSearch =
      c.acknowledgementNumber.includes(searchQuery) ||
      c.victimName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.incidentMemo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.mobileNumber.includes(searchQuery);

    if (!matchesSearch) return false;
    if (filterType === 'ALL') return true;
    return c.classification === filterType;
  });

  return (
    <div id="live-calls-view" className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-slate-700 font-bold tracking-wider uppercase bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
            SPECIFICATION § 1, 9, 13 • PORTAL FIELD EXTRACTION & CLASSIFICATION
          </span>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-2">
            <Layers className="w-5 h-5 text-slate-700" />
            Live Portal Complaints & Extraction Stream
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Processed exclusively from the 5 mandatory portal columns. Priority rule: Financial indicators override Social Media exclusion.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 shadow-2xs">
            Total Extracted: <strong className="text-slate-900">{complaints.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-3.5 rounded-xl shadow-xs">
        {/* Search */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            id="input-search-calls"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search Ack #, Victim, Memo, Mobile..."
            className="bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-full font-mono"
          />
        </div>

        {/* Classification Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition ${
              filterType === 'ALL'
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            ALL ({complaints.length})
          </button>
          <button
            onClick={() => setFilterType('FINANCIAL')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition ${
              filterType === 'FINANCIAL'
                ? 'bg-emerald-700 text-white font-bold shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            FINANCIAL ({complaints.filter(c => c.classification === 'FINANCIAL').length})
          </button>
          <button
            onClick={() => setFilterType('SOCIAL_MEDIA')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition ${
              filterType === 'SOCIAL_MEDIA'
                ? 'bg-slate-800 text-white font-bold shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            SOCIAL MEDIA ({complaints.filter(c => c.classification === 'SOCIAL_MEDIA').length})
          </button>
          <button
            onClick={() => setFilterType('REVIEW_REQUIRED')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition ${
              filterType === 'REVIEW_REQUIRED'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            REVIEW QUEUE ({complaints.filter(c => c.classification === 'REVIEW_REQUIRED').length})
          </button>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase font-mono border-b border-slate-200 font-medium">
              <tr>
                <th className="p-3.5">Acknowledgement No.</th>
                <th className="p-3.5">Reported Date/Time</th>
                <th className="p-3.5">Complainant / Mobile</th>
                <th className="p-3.5">Additional Incident Memo</th>
                <th className="p-3.5">Classification</th>
                <th className="p-3.5">Detected Amount</th>
                <th className="p-3.5">Assignment State</th>
                <th className="p-3.5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-sans">
                    No complaints matched your search or filters.
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
                      {/* Ack No */}
                      <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                        <div>{call.acknowledgementNumber}</div>
                        <span className="text-[10px] text-slate-500 font-normal">
                          Page {call.portalPage} • Last 4: {call.acknowledgementNumber.slice(-4)}
                        </span>
                      </td>

                      {/* Reported Time */}
                      <td className="p-3.5 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{call.complaintReportedDateTime}</span>
                        </div>
                      </td>

                      {/* Complainant & Mobile */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="text-slate-900 font-sans font-semibold">{call.victimName}</div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{call.mobileNumber || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Incident Memo */}
                      <td className="p-3.5 font-sans text-slate-700 max-w-xs sm:max-w-md">
                        <p className="line-clamp-2 text-xs leading-relaxed" title={call.incidentMemo}>
                          {call.incidentMemo}
                        </p>
                        {call.detectedKeywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {call.detectedKeywords.slice(0, 3).map((kw, i) => (
                              <span
                                key={i}
                                className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Classification Badge */}
                      <td className="p-3.5 whitespace-nowrap">
                        {call.classification === 'FINANCIAL' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            FINANCIAL
                          </span>
                        ) : call.classification === 'SOCIAL_MEDIA' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                            <XCircle className="w-3 h-3 text-slate-500" />
                            SOCIAL MEDIA
                          </span>
                        ) : call.classification === 'REVIEW_REQUIRED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                            <HelpCircle className="w-3 h-3 text-amber-600" />
                            REVIEW REQ.
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-600 border border-slate-200">
                            OTHER
                          </span>
                        )}
                      </td>

                      {/* Detected Amount */}
                      <td className="p-3.5 whitespace-nowrap">
                        {amount !== undefined ? (
                          <span className="text-xs font-bold text-emerald-800 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-300">
                            ₹{amount.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Assignment State */}
                      <td className="p-3.5 whitespace-nowrap">
                        {call.status === 'ASSIGNED' ? (
                          <span className="text-xs font-bold text-white px-2 py-1 bg-slate-900 rounded shadow-2xs">
                            Helpline {call.assignedHelpline}
                          </span>
                        ) : call.status === 'REVIEW_REQUIRED' ? (
                          <button
                            onClick={() => onOpenReview(call)}
                            className="text-[11px] font-bold text-amber-700 underline hover:text-amber-800 cursor-pointer"
                          >
                            Needs Review →
                          </button>
                        ) : call.status === 'IGNORED_SOCIAL_MEDIA' ? (
                          <span className="text-xs text-slate-400">Ignored (Pure SM)</span>
                        ) : (
                          <span className="text-xs text-slate-500">Queued for engine</span>
                        )}
                      </td>

                      {/* Inspect button */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedRecord(call)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded transition cursor-pointer"
                          title="View Full Extraction Breakdown"
                        >
                          <Eye className="w-4 h-4" />
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

      {/* Record Inspector Modal */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4 text-slate-900 font-mono text-xs"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                Complaint Extraction Analysis
              </h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-slate-500">Acknowledgement Number:</span>
                <p className="text-sm font-bold text-slate-900">
                  {selectedRecord.acknowledgementNumber}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">Reported Time:</span>
                  <p className="text-slate-900 font-semibold">{selectedRecord.complaintReportedDateTime}</p>
                </div>
                <div>
                  <span className="text-slate-500">Complainant / Victim:</span>
                  <p className="text-slate-900 font-semibold">{selectedRecord.victimName}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-500">Original Incident Memo:</span>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 mt-1 font-sans">
                  {selectedRecord.incidentMemo}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">Classification:</span>
                  <p className="text-slate-900 font-bold">{selectedRecord.classification}</p>
                </div>
                <div>
                  <span className="text-slate-500">Confidence Score:</span>
                  <p className="text-emerald-700 font-bold">
                    {Math.round(selectedRecord.classificationConfidence * 100)}%
                  </p>
                </div>
              </div>

              <div>
                <span className="text-slate-500">Detected Monetary Amounts:</span>
                <p className="text-emerald-700 font-bold">
                  {selectedRecord.detectedAmounts.length > 0
                    ? selectedRecord.detectedAmounts.map(a => `₹${a.toLocaleString('en-IN')}`).join(', ')
                    : 'None (0 INR)'}
                </p>
              </div>

              <div>
                <span className="text-slate-500">Detected Keywords:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedRecord.detectedKeywords.map((kw, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 border border-slate-200">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="text-slate-500">Assignment:</span>
                <span className="font-bold text-slate-900">
                  {selectedRecord.assignedHelpline
                    ? `Helpline ${selectedRecord.assignedHelpline}`
                    : 'Not Assigned'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
