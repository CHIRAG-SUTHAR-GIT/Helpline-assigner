import React, { useState } from 'react';
import {
  UserMinus,
  Plus,
  Trash2,
  Clock,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  User,
} from 'lucide-react';
import { SkipRule, ShiftConfig, RoleType } from '../types';

interface SkipManagementViewProps {
  skipRules: SkipRule[];
  currentShift: ShiftConfig;
  onAddSkipRule: (rule: SkipRule) => void;
  onRemoveSkipRule: (ruleId: string) => void;
  userRole: RoleType;
}

export const SkipManagementView: React.FC<SkipManagementViewProps> = ({
  skipRules,
  currentShift,
  onAddSkipRule,
  onRemoveSkipRule,
  userRole,
}) => {
  const [selectedHelpline, setSelectedHelpline] = useState<number>(4);
  const [skipType, setSkipType] = useState<'SKIP_N' | 'SKIP_SHIFT'>('SKIP_N');
  const [skipCount, setSkipCount] = useState<number>(2);
  const [reason, setReason] = useState('Officer on call / tea break');
  const [operatorName, setOperatorName] = useState('Senior Inspector (Operator)');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRule: SkipRule = {
      id: `skip-${Date.now()}`,
      helpline: selectedHelpline,
      type: skipType,
      initialCount: skipType === 'SKIP_SHIFT' ? 999 : skipCount,
      remainingCount: skipType === 'SKIP_SHIFT' ? 999 : skipCount,
      reason,
      createdAt: new Date().toLocaleTimeString('en-IN', { hour12: false }),
      createdBy: operatorName,
      active: true,
    };

    onAddSkipRule(newRule);
    setReason('');
  };

  const activeRules = skipRules.filter(r => r.active);
  const canEdit = userRole === 'Admin' || userRole === 'Operator';

  return (
    <div id="skip-management-view" className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-slate-700 font-bold tracking-wider uppercase bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
            SPECIFICATION § 20 • ACTIVE HELPLINE BYPASS RULES
          </span>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-2">
            <UserMinus className="w-5 h-5 text-slate-700" />
            Helpline Skip Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure temporary call skips or whole-shift exemptions. When a Helpline is skipped, the assignment engine automatically advances to the next eligible Helpline without discarding the call.
          </p>
        </div>

        <div className="text-xs font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 shadow-2xs">
          Active Skip Rules: <strong className="text-amber-700">{activeRules.length}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Skip Rule Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase mb-4 pb-2 border-b border-slate-200 flex items-center gap-2 font-mono">
            <Plus className="w-4 h-4 text-slate-700" />
            Add New Skip Rule
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            {/* Helpline Target */}
            <div>
              <label className="block text-slate-600 uppercase font-semibold mb-1">
                Target Helpline:
              </label>
              <select
                id="select-skip-helpline"
                value={selectedHelpline}
                onChange={e => setSelectedHelpline(parseInt(e.target.value, 10))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-sans focus:outline-none"
                disabled={!canEdit}
              >
                {Array.from({ length: 16 }, (_, i) => i + 1).map(h => {
                  const isPresent = currentShift.presentHelplines.includes(h);
                  return (
                    <option key={h} value={h}>
                      Helpline {h} {isPresent ? '(Present in Shift)' : '(Absent)'}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Skip Type Selector */}
            <div>
              <label className="block text-slate-600 uppercase font-semibold mb-1">
                Skip Rule Type:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="btn-skip-type-n"
                  onClick={() => setSkipType('SKIP_N')}
                  className={`p-2.5 rounded-lg border font-bold transition cursor-pointer text-center ${
                    skipType === 'SKIP_N'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  Skip Next N Calls
                </button>
                <button
                  type="button"
                  id="btn-skip-type-shift"
                  onClick={() => setSkipType('SKIP_SHIFT')}
                  className={`p-2.5 rounded-lg border font-bold transition cursor-pointer text-center ${
                    skipType === 'SKIP_SHIFT'
                      ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  Skip Entire Shift
                </button>
              </div>
            </div>

            {/* If Skip N calls: Input count */}
            {skipType === 'SKIP_N' && (
              <div>
                <label className="block text-slate-600 uppercase font-semibold mb-1">
                  Number of Calls to Skip:
                </label>
                <input
                  id="input-skip-count"
                  type="number"
                  min={1}
                  max={20}
                  value={skipCount}
                  onChange={e => setSkipCount(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-bold"
                  required
                />
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-slate-600 uppercase font-semibold mb-1">
                Reason / Note:
              </label>
              <input
                id="input-skip-reason"
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. Break, assigned to investigation, etc."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-sans"
              />
            </div>

            {/* Operator */}
            <div>
              <label className="block text-slate-600 uppercase font-semibold mb-1">
                Configured By:
              </label>
              <input
                id="input-skip-operator"
                type="text"
                value={operatorName}
                onChange={e => setOperatorName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-sans"
                required
              />
            </div>

            <button
              id="btn-save-skip-rule"
              type="submit"
              disabled={!canEdit}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              SAVE SKIP RULE
            </button>
          </form>
        </div>

        {/* Active Skip Rules Table (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase font-mono flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Active Skip Rules Queue
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Auto-decrements as turns are skipped
            </span>
          </div>

          {activeRules.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-mono text-xs">
              No active skip rules. All present Helplines are receiving calls in standard round-robin order.
            </div>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              {activeRules.map(rule => (
                <div
                  key={rule.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3 hover:border-slate-300 transition shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center font-bold text-amber-900 text-sm">
                      H{rule.helpline}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          Helpline {rule.helpline}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rule.type === 'SKIP_SHIFT'
                              ? 'bg-red-50 text-red-800 border border-red-300'
                              : 'bg-amber-50 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {rule.type === 'SKIP_SHIFT' ? 'ENTIRE SHIFT' : `NEXT ${rule.remainingCount} CALLS`}
                        </span>
                      </div>
                      <p className="text-slate-600 font-sans text-xs mt-0.5">
                        {rule.reason || 'No reason provided'}
                      </p>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Created at {rule.createdAt} by {rule.createdBy}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {rule.type === 'SKIP_N' && (
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Remaining</span>
                        <span className="text-base font-black text-amber-700">
                          {rule.remainingCount}
                        </span>
                      </div>
                    )}

                    <button
                      id={`btn-delete-skip-${rule.id}`}
                      onClick={() => onRemoveSkipRule(rule.id)}
                      disabled={!canEdit}
                      className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition cursor-pointer disabled:opacity-30"
                      title="Deactivate and remove skip rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
