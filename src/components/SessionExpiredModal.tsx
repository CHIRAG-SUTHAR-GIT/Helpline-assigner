import React, { useState } from 'react';
import {
  AlertTriangle,
  Lock,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export interface SessionExpiredModalProps {
  isOpen: boolean;
  onRecoverSession?: () => void;
  onClose?: () => void;
  onResume?: () => void;
  lastSuccessfulScan?: string;
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  isOpen,
  onRecoverSession,
  onClose,
  onResume,
  lastSuccessfulScan = '18/09/2026 13:31:02',
}) => {
  const [step, setStep] = useState<'LOGIN' | 'RESUME_CONFIRMATION'>('LOGIN');
  const [operatorId, setOperatorId] = useState('POLICE_OP_4021');
  const [password, setPassword] = useState('••••••••••••');
  const [otp, setOtp] = useState('782914');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !otp) {
      setErrorMsg('Password and 6-digit OTP are required.');
      return;
    }
    setErrorMsg('');
    setIsVerifying(true);

    // Simulate real portal manual authentication verification
    setTimeout(() => {
      setIsVerifying(false);
      setStep('RESUME_CONFIRMATION');
    }, 1200);
  };

  const handleExecuteResume = () => {
    if (onRecoverSession) onRecoverSession();
    if (onResume) onResume();
    if (onClose) onClose();
    setStep('LOGIN');
  };

  return (
    <div
      id="modal-session-expired-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div
        id="modal-session-expired-card"
        className="bg-white border border-red-200 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden text-slate-900 animate-in fade-in zoom-in duration-200"
      >
        {/* Header */}
        <div className="bg-red-50 border-b border-red-200 p-4 flex items-center gap-3">
          <div className="p-2 bg-red-600 rounded-lg text-white shadow-xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-wide text-red-950 uppercase flex items-center gap-2">
              PORTAL SESSION EXPIRED
            </h2>
            <p className="text-xs text-red-700 font-mono font-medium">
              STATUS: AUTOMATION PAUSED • MANUAL LOGIN REQUIRED
            </p>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {step === 'LOGIN' ? (
            <div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-900 leading-relaxed mb-4">
                <p className="font-semibold mb-1 flex items-center gap-1.5 text-red-800">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  Mandatory Security Protocol (Section 5):
                </p>
                The Cyber Police Portal session has ended or timed out. Automation is halted. Per security mandates, password and OTP authentication cannot be bypassed or automated. An authorized operator must manually authenticate.
              </div>

              <div className="text-xs text-slate-500 font-mono mb-3">
                Last Successful Scan: <span className="text-slate-900 font-bold">{lastSuccessfulScan || '14:30:18'}</span>
              </div>

              <form onSubmit={handleManualLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Operator ID / Badge Number
                  </label>
                  <input
                    id="input-operator-id"
                    type="text"
                    value={operatorId}
                    onChange={e => setOperatorId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-800 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1 flex items-center justify-between">
                    <span>Portal Password</span>
                    <span className="text-[10px] text-slate-400 font-normal">Stored locally never logged</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="input-portal-password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter portal password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-800 font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1 flex items-center justify-between">
                    <span>Gov Portal OTP (One-Time Password)</span>
                    <span className="text-[10px] text-slate-500 font-normal">Sent to Police Mobile</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="input-portal-otp"
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      placeholder="6-digit OTP"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 tracking-widest font-mono focus:outline-none focus:border-slate-800"
                      required
                    />
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-600 font-semibold">{errorMsg}</p>
                )}

                <button
                  id="btn-verify-portal-login"
                  type="submit"
                  disabled={isVerifying}
                  className="w-full bg-red-600 hover:bg-red-700 active:scale-98 text-white font-bold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>VERIFYING PORTAL COMPLAINT TABLE...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>VERIFY & AUTHENTICATE PORTAL</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* Step 2: Resume Protection Screen (Section 36) */
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-900 text-xs">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800 mb-1">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Portal Login Detected & Session Restored
                </div>
                <p>
                  Authentication successful. The complaint table is verified as accessible.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs font-mono">
                <p className="text-slate-600 font-sans font-semibold uppercase tracking-wider mb-2">
                  System Recovery Sequence (Section 6 & 36):
                </p>
                <div className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Refresh portal with native control</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Scan all available pages (Full Rescan)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Detect calls missed during logged-out period</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Check database duplicates by Acknowledgement #</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Apply current shift boundary & round-robin rules</span>
                </div>
              </div>

              <button
                id="btn-confirm-resume"
                onClick={handleExecuteResume}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg shadow-sm flex items-center justify-center gap-2 text-sm tracking-wide transition-all cursor-pointer"
              >
                <span>RESUME AUTOMATION & FULL RESCAN</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
