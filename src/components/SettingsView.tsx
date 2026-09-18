import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Clock,
  UserCheck,
  AlertOctagon,
  Database,
  FileText,
  Save,
  CheckCircle,
  RotateCcw,
} from 'lucide-react';
import { SystemSettings, RoleType, AuditLogEntry } from '../types';

interface SettingsViewProps {
  settings: SystemSettings;
  auditLogs: AuditLogEntry[];
  userRole: RoleType;
  onUpdateSettings: (newSettings: Partial<SystemSettings>) => void;
  onRoleChange: (newRole: RoleType) => void;
  onTriggerSessionExpired: () => void;
  onResetSampleData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  auditLogs,
  userRole,
  onUpdateSettings,
  onRoleChange,
  onTriggerSessionExpired,
  onResetSampleData,
}) => {
  const [scanInterval, setScanInterval] = useState<number>(settings.scanIntervalMinutes);
  const [sessionTimeout, setSessionTimeout] = useState<number>(settings.portalSessionTimeoutMinutes);
  const [whatsAppGateway, setWhatsAppGateway] = useState<string>(settings.whatsAppGatewayEndpoint);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      scanIntervalMinutes: scanInterval,
      portalSessionTimeoutMinutes: sessionTimeout,
      whatsAppGatewayEndpoint: whatsAppGateway,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div id="settings-view" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-slate-700 font-bold tracking-wider uppercase bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
            SPECIFICATION § 3, 37, 39 • SYSTEM ADMINISTRATION & AUDIT
          </span>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-2">
            <Settings className="w-5 h-5 text-slate-700" />
            System Configuration & Audit Log
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure portal scan frequencies, operational roles (Admin, Operator, Viewer), session timeouts, and inspect the tamper-evident audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-500 font-medium">Current Active Role:</span>
          <span className="bg-slate-100 border border-slate-300 text-slate-800 font-bold px-3 py-1 rounded-lg shadow-2xs">
            {userRole.toUpperCase()}
          </span>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Configuration saved successfully. System crawler timing updated.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form settings (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Settings Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase font-mono pb-2 border-b border-slate-200 flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-slate-700" />
              Scanning Engine & Interval (Section 3)
            </h3>

            <form onSubmit={handleSave} className="space-y-4 font-mono text-xs">
              {/* Scan Interval Setting */}
              <div>
                <label className="block text-slate-600 uppercase font-semibold mb-1">
                  Portal Periodic Scan Interval (Minutes):
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 5].map(interval => (
                    <button
                      key={interval}
                      type="button"
                      onClick={() => setScanInterval(interval)}
                      className={`p-2.5 rounded-lg border font-bold transition cursor-pointer text-center ${
                        scanInterval === interval
                          ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {interval} Minute{interval > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block font-sans">
                  Periodic timer automatically triggers portal refresh and scan every {scanInterval} min.
                </span>
              </div>

              {/* Portal Session Timeout */}
              <div>
                <label className="block text-slate-600 uppercase font-semibold mb-1">
                  Simulated Portal Session Expiry Threshold (Minutes):
                </label>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={sessionTimeout}
                  onChange={e => setSessionTimeout(parseInt(e.target.value, 10) || 20)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none"
                />
              </div>

              {/* WhatsApp Endpoint */}
              <div>
                <label className="block text-slate-600 uppercase font-semibold mb-1">
                  WhatsApp Integration Webhook / Gateway Endpoint:
                </label>
                <input
                  type="text"
                  value={whatsAppGateway}
                  onChange={e => setWhatsAppGateway(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>SAVE CONFIGURATION</span>
              </button>
            </form>
          </div>

          {/* Role Switching & RBAC (Section 39) */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase font-mono pb-2 border-b border-slate-200 flex items-center gap-2 mb-3">
              <UserCheck className="w-4 h-4 text-slate-700" />
              Role-Based Access Control (Section 39)
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-mono">
              Switch role to test access boundaries. Non-destructive operations (Section 43) apply across all roles.
            </p>

            <div className="grid grid-cols-3 gap-3 font-mono text-xs">
              <button
                onClick={() => onRoleChange('Admin')}
                className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                  userRole === 'Admin'
                    ? 'bg-slate-100 border-slate-900 text-slate-900 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-slate-900 mb-1">Admin</div>
                <div className="text-[11px] text-slate-500 font-sans">Full system access, skip rules, and shift controls.</div>
              </button>

              <button
                onClick={() => onRoleChange('Operator')}
                className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                  userRole === 'Operator'
                    ? 'bg-slate-100 border-slate-900 text-slate-900 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-slate-900 mb-1">Operator</div>
                <div className="text-[11px] text-slate-500 font-sans">Shift start, manual reassignments, and review queue.</div>
              </button>

              <button
                onClick={() => onRoleChange('Viewer')}
                className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                  userRole === 'Viewer'
                    ? 'bg-slate-100 border-slate-900 text-slate-900 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-slate-900 mb-1">Viewer</div>
                <div className="text-[11px] text-slate-500 font-sans">Read-only dashboard, exports, and history logs.</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Emergency & Simulation Controls (Section 32, 43) */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase font-mono pb-2 border-b border-slate-200 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-amber-600" />
              Recovery & Simulation Testing
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <p className="text-slate-500 font-sans">
                Simulate critical operational conditions specified in the technical requirements:
              </p>

              {/* Trigger Session Expired Modal */}
              <button
                id="btn-trigger-session-expired-sim"
                onClick={onTriggerSessionExpired}
                className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 font-bold p-3 rounded-lg transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer text-left"
              >
                <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />
                <span>TRIGGER PORTAL SESSION EXPIRED</span>
              </button>
              <p className="text-[11px] text-slate-500 font-sans">
                Tests Section 7 & 32: Pauses scanning immediately, prevents silent failures, and prompts operator to re-authenticate.
              </p>

              {/* Reset to defaults */}
              <button
                onClick={onResetSampleData}
                className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-semibold p-2.5 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer mt-4 shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                <span>RESTORE STANDARD BENCHMARK DATA</span>
              </button>
            </div>
          </div>

          {/* Section 43: Non-Destructive Protection Notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm space-y-2 text-xs font-mono text-slate-600">
            <div className="font-bold text-slate-900 uppercase flex items-center gap-1.5 font-sans">
              <Shield className="w-4 h-4 text-emerald-700" />
              Section 43 — Non-Destructive Operations
            </div>
            <p>
              "Normal operators must not permanently delete assignment history. Provide archive instead of hard delete. Maintain audit logs of all user actions."
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 37: Audit Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900 uppercase font-mono">
              Tamper-Evident System Audit Trail (Section 37)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {auditLogs.length} Events Logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-medium">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Action Type</th>
                <th className="p-3">Actor / User</th>
                <th className="p-3">Role</th>
                <th className="p-3">Details / Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-3 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                  <td className="p-3 font-bold text-slate-900 whitespace-nowrap">{log.action}</td>
                  <td className="p-3 text-slate-900 whitespace-nowrap font-medium">{log.user}</td>
                  <td className="p-3 text-slate-600 whitespace-nowrap">{log.role}</td>
                  <td className="p-3 text-slate-700 font-sans max-w-md">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
