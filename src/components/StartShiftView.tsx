import React, { useState } from 'react';
import {
  Calendar,
  CheckSquare,
  Clock,
  History,
  Play,
  Square,
  Users,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { ShiftConfig, ShiftType, RoleType } from '../types';
import { getKolkataTime } from '../services/shiftEngine';

interface StartShiftViewProps {
  currentShift: ShiftConfig;
  shiftHistory: ShiftConfig[];
  onSaveShift: (newConfig: ShiftConfig) => void;
  userRole: RoleType;
}

export const StartShiftView: React.FC<StartShiftViewProps> = ({
  currentShift,
  shiftHistory,
  onSaveShift,
  userRole,
}) => {
  const kolkataNow = getKolkataTime();
  const [selectedDate, setSelectedDate] = useState<string>(currentShift.date || kolkataNow.dateStr);
  const [selectedType, setSelectedType] = useState<ShiftType>(currentShift.type || 'MORNING');
  const [selectedHelplines, setSelectedHelplines] = useState<number[]>(
    currentShift.presentHelplines.length > 0 ? currentShift.presentHelplines : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
  );
  const [operatorName, setOperatorName] = useState('Officer In-Charge (Operator)');
  const [successMessage, setSuccessMessage] = useState('');

  const toggleHelpline = (num: number) => {
    setSelectedHelplines(prev =>
      prev.includes(num) ? prev.filter(x => x !== num) : [...prev, num].sort((a, b) => a - b)
    );
  };

  const selectAll = () => {
    setSelectedHelplines(Array.from({ length: 16 }, (_, i) => i + 1));
  };

  const clearAll = () => {
    setSelectedHelplines([]);
  };

  const handleStartShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedHelplines.length === 0) {
      alert('You must select at least one present Helpline to begin the shift.');
      return;
    }

    const newShift: ShiftConfig = {
      id: `shift-${selectedType.toLowerCase()}-${Date.now()}`,
      date: selectedDate,
      type: selectedType,
      presentHelplines: selectedHelplines,
      startedAt: getKolkataTime().timeStr,
      startedBy: operatorName,
      active: true,
      cutoffPassed: false,
    };

    onSaveShift(newShift);
    setSuccessMessage(`Shift successfully started for ${selectedType} (${selectedDate}) with ${selectedHelplines.length} Helplines active.`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const canEdit = userRole === 'Admin' || userRole === 'Operator';

  return (
    <div id="start-shift-view" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-slate-700 font-bold tracking-wider uppercase bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
              SPECIFICATION § 18 • ROSTER CONFIGURATION
            </span>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-2">
              <Users className="w-5 h-5 text-slate-700" />
              Start Shift & Helpline Attendance
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select present Helplines (1–16). Absent Helplines will never be assigned calls. Shift configurations are permanently frozen once started.
            </p>
          </div>

          <div className="text-xs font-mono bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 shadow-2xs">
            <div>Current Active Shift: <span className="font-bold text-emerald-700">{currentShift.type} ({currentShift.date})</span></div>
            <div>Present Helplines: <span className="text-slate-900 font-bold">{currentShift.presentHelplines.join(', ')}</span></div>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Shift Setup Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <form onSubmit={handleStartShift} className="space-y-6">
            {/* Shift Controls Header */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-200 font-mono text-xs">
              <div>
                <label className="block text-slate-600 uppercase font-semibold mb-1">
                  Shift Date (DD/MM/YYYY)
                </label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input
                    id="input-shift-date"
                    type="text"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="bg-transparent focus:outline-none w-full"
                    placeholder="DD/MM/YYYY"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 uppercase font-semibold mb-1">
                  Shift Type
                </label>
                <select
                  id="select-shift-type"
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value as ShiftType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none"
                >
                  <option value="MORNING">Morning Shift (08:00–14:00)</option>
                  <option value="EVENING">Evening Shift (14:00–20:00)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 uppercase font-semibold mb-1">
                  Authorized Operator
                </label>
                <input
                  id="input-operator-name"
                  type="text"
                  value={operatorName}
                  onChange={e => setOperatorName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none font-sans"
                  required
                />
              </div>
            </div>

            {/* Helpline Selection Grid */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 uppercase">
                    Present Helplines:
                  </span>
                  <span className="text-xs font-mono text-slate-700 font-bold bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
                    {selectedHelplines.length} of 16 Selected
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    id="btn-shift-select-all"
                    onClick={selectAll}
                    disabled={!canEdit}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 cursor-pointer font-medium shadow-2xs"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    id="btn-shift-clear-all"
                    onClick={clearAll}
                    disabled={!canEdit}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 cursor-pointer font-medium shadow-2xs"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* 16 Helpline Checkbox Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: 16 }, (_, i) => i + 1).map(num => {
                  const isChecked = selectedHelplines.includes(num);
                  return (
                    <label
                      key={num}
                      id={`checkbox-helpline-${num}`}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer select-none transition shadow-2xs ${
                        isChecked
                          ? 'bg-slate-100 border-slate-900 text-slate-900'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleHelpline(num)}
                        disabled={!canEdit}
                        className="sr-only"
                      />
                      <div className="shrink-0">
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-slate-900" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="font-mono">
                        <span className="text-xs block text-slate-500 font-normal">Helpline</span>
                        <span className="text-sm font-bold">{num}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Shift Boundary Policy Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 font-mono space-y-1">
              <div className="font-bold text-amber-900 flex items-center gap-1.5 font-sans">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                Shift Assignment Cutoff Policy (Section 16 & 17):
              </div>
              <p>
                • {selectedType === 'MORNING' ? 'Morning Shift: 08:00 to 14:00. Cutoff is 13:45:00. Complaints reported at or after 13:45:00 are not eligible for morning assignment.' : 'Evening Shift: 14:00 to 20:00. Cutoff is 19:45:00. Complaints reported at or after 19:45:00 are not eligible for evening assignment.'}
              </p>
              <p>
                • Absent Helplines will be strictly skipped by the round-robin engine.
              </p>
            </div>

            {/* Action Button */}
            <button
              id="btn-execute-start-shift"
              type="submit"
              disabled={!canEdit || selectedHelplines.length === 0}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg text-sm tracking-wider uppercase shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>START {selectedType} SHIFT</span>
            </button>
          </form>
        </div>

        {/* SECTION 31: Shift History Log Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <History className="w-5 h-5 text-slate-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                Shift Attendance History
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Preserves exact historical records (Section 31)
              </p>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {shiftHistory.map((sh, idx) => (
              <div
                key={sh.id || idx}
                className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 shadow-2xs"
              >
                <div className="flex items-center justify-between text-slate-900 font-bold">
                  <span>{sh.date} — {sh.type}</span>
                  <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded font-bold">
                    {sh.active ? 'ACTIVE' : 'ARCHIVED'}
                  </span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  Started at {sh.startedAt} by {sh.startedBy}
                </div>
                <div className="text-slate-700 text-[11px] bg-white p-1.5 rounded border border-slate-200">
                  <span className="text-slate-500">Present: </span>
                  <span className="font-bold text-slate-900">{sh.presentHelplines.join(', ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
