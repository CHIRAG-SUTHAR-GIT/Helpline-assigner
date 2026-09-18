import React, { useState } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  Clock,
  ShieldCheck,
  Calendar,
  Phone,
  ArrowRight,
} from 'lucide-react';
import { ComplaintRecord, RoleType } from '../types';

interface ReviewRequiredViewProps {
  complaints: ComplaintRecord[];
  onMarkFinancial: (complaintId: string, notes?: string) => void;
  onMarkNonFinancial: (complaintId: string, notes?: string) => void;
  userRole: RoleType;
}

export const ReviewRequiredView: React.FC<ReviewRequiredViewProps> = ({
  complaints,
  onMarkFinancial,
  onMarkNonFinancial,
  userRole,
}) => {
  const reviewComplaints = complaints.filter(
    c => c.classification === 'REVIEW_REQUIRED' || c.status === 'REVIEW_REQUIRED'
  );

  const [decisionNotes, setDecisionNotes] = useState<{ [id: string]: string }>({});

  const handleNotesChange = (id: string, text: string) => {
    setDecisionNotes(prev => ({ ...prev, [id]: text }));
  };

  const canDecide = userRole === 'Admin' || userRole === 'Operator';

  return (
    <div id="review-required-view" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-slate-700 font-bold tracking-wider uppercase bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
            SPECIFICATION § 12 • CONSERVATIVE CLASSIFICATION & HUMAN AUDIT
          </span>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-2">
            <HelpCircle className="w-5 h-5 text-amber-600" />
            Review Required Queue
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Because non-financial calls must never be mistakenly assigned, ambiguous complaints require human operator adjudication. Decisions are permanently logged in the audit trail.
          </p>
        </div>

        <div className="text-xs font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 shadow-2xs">
          Pending Review: <strong className="text-amber-700">{reviewComplaints.length}</strong>
        </div>
      </div>

      {reviewComplaints.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Review Queue Clear</h3>
          <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
            All detected complaints have been categorized with high confidence. New ambiguous complaints from the portal will populate here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviewComplaints.map(record => (
            <div
              key={record.id}
              className="bg-white border-2 border-amber-300 rounded-xl p-5 shadow-sm space-y-4 font-mono text-xs flex flex-col justify-between text-slate-800"
            >
              <div className="space-y-3">
                {/* Header with Ack # and Status */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">REVIEW_REQUIRED</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                      Page {record.portalPage}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    Confidence: {Math.round(record.classificationConfidence * 100)}%
                  </span>
                </div>

                {/* Primary Fields */}
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Acknowledgement:</span>
                    <strong className="text-slate-900 text-xs">{record.acknowledgementNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Complaint Time:</span>
                    <strong className="text-slate-900 text-xs">{record.complaintReportedDateTime}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Victim Name:</span>
                    <strong className="text-slate-900 font-sans text-xs">{record.victimName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Mobile Number:</span>
                    <strong className="text-slate-900 text-xs">{record.mobileNumber || 'N/A'}</strong>
                  </div>
                </div>

                {/* Memo */}
                <div>
                  <span className="text-slate-500 block text-[11px] mb-1">Original Memo:</span>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-sans leading-relaxed text-xs">
                    {record.incidentMemo}
                  </div>
                </div>

                {/* Detected Keywords and Amounts */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Detected Keywords:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {record.detectedKeywords.length > 0 ? (
                        record.detectedKeywords.map((kw, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] border border-slate-200">
                            {kw}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[10px]">None identified</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Detected Amount:</span>
                    <span className="font-bold text-emerald-800 mt-1 block">
                      {record.detectedAmounts.length > 0
                        ? record.detectedAmounts.map(a => `₹${a.toLocaleString('en-IN')}`).join(', ')
                        : '0 INR (None)'}
                    </span>
                  </div>
                </div>

                {/* Operator Note */}
                <div>
                  <input
                    type="text"
                    placeholder="Adjudication note (optional)..."
                    value={decisionNotes[record.id] || ''}
                    onChange={e => handleNotesChange(record.id, e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons: [ MARK FINANCIAL ] & [ MARK NON-FINANCIAL ] */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                <button
                  id={`btn-mark-financial-${record.id}`}
                  onClick={() => onMarkFinancial(record.id, decisionNotes[record.id])}
                  disabled={!canDecide}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2 px-3 rounded-lg shadow-2xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>MARK FINANCIAL</span>
                </button>

                <button
                  id={`btn-mark-non-financial-${record.id}`}
                  onClick={() => onMarkNonFinancial(record.id, decisionNotes[record.id])}
                  disabled={!canDecide}
                  className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold py-2 px-3 rounded-lg border border-slate-300 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <XCircle className="w-4 h-4 text-slate-500" />
                  <span>NON-FINANCIAL</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
