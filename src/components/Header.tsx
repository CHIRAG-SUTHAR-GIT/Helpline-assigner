import React, { useEffect, useState } from 'react';
import {
  Shield,
  Clock,
  Radio,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  LayoutDashboard,
  Users,
  Layers,
  UserCheck2,
  UserMinus,
  Smartphone,
  HelpCircle,
  Monitor,
  History,
  FileCheck2,
  Settings,
} from 'lucide-react';
import { ShiftConfig, RoleType } from '../types';
import { getKolkataTime } from '../services/shiftEngine';

export type ActiveTabType =
  | 'DASHBOARD'
  | 'START_SHIFT'
  | 'LIVE_CALLS'
  | 'ASSIGNMENTS'
  | 'SKIP_MANAGEMENT'
  | 'WHATSAPP_IMAGE'
  | 'REVIEW_QUEUE'
  | 'PORTAL_SCANNER'
  | 'HISTORY'
  | 'TEST_SUITE'
  | 'SETTINGS';

export interface HeaderProps {
  activeTab: ActiveTabType;
  onTabChange: (tab: ActiveTabType) => void;
  currentShift: ShiftConfig;
  isScanning: boolean;
  lastScanTime: string;
  nextScanCountdown: number;
  sessionExpired: boolean;
  userRole: RoleType;
  onScanNow: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  currentShift,
  isScanning,
  lastScanTime,
  nextScanCountdown,
  sessionExpired,
  userRole,
  onScanNow,
}) => {
  const [kolkataClock, setKolkataClock] = useState(getKolkataTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setKolkataClock(getKolkataTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const navItems: { id: ActiveTabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'START_SHIFT', label: 'Start Shift', icon: Users },
    { id: 'LIVE_CALLS', label: 'Live Extraction', icon: Layers },
    { id: 'ASSIGNMENTS', label: 'Assignments', icon: UserCheck2 },
    { id: 'SKIP_MANAGEMENT', label: 'Skip Rules', icon: UserMinus },
    { id: 'WHATSAPP_IMAGE', label: 'WhatsApp Graphic', icon: Smartphone },
    { id: 'REVIEW_QUEUE', label: 'Review Queue', icon: HelpCircle },
    { id: 'PORTAL_SCANNER', label: 'Portal Scanner', icon: Monitor },
    { id: 'HISTORY', label: 'History Archive', icon: History },
    { id: 'TEST_SUITE', label: 'Section 41 Tests', icon: FileCheck2 },
    { id: 'SETTINGS', label: 'Settings & Audit', icon: Settings },
  ];

  return (
    <header id="app-header" className="bg-white text-slate-900 border-b border-slate-200 shadow-xs sticky top-0 z-40">
      {/* Top Session Alert Banner if Expired */}
      {sessionExpired && (
        <div
          id="banner-session-expired"
          className="bg-red-600 text-white text-xs font-mono font-bold py-2 px-4 flex items-center justify-between animate-pulse"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              PORTAL SESSION EXPIRED — Automated scanning halted to prevent silent failure. Operator re-login required.
            </span>
          </div>
          <span className="text-[11px] uppercase bg-black/20 px-2 py-0.5 rounded">
            Manual Recovery Required
          </span>
        </div>
      )}

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Police Identity & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm ring-2 ring-slate-200">
            <Shield className="w-5 h-5 text-slate-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest uppercase text-slate-700 font-bold bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
                CRIME INVESTIGATION DEPT • STATE POLICE
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Cyber Police Call Assignment & Tracking
            </h1>
          </div>
        </div>

        {/* Center: Live Clock & Shift */}
        <div className="flex items-center gap-3 text-xs font-mono">
          {/* Asia/Kolkata Clock */}
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 text-slate-700 shadow-2xs">
            <Clock className="w-4 h-4 text-slate-600" />
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-medium">Asia/Kolkata (IST)</span>
              <span className="font-bold text-slate-900 text-xs">{kolkataClock.timeStr}</span>
            </div>
          </div>

          {/* Current Active Shift */}
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 text-slate-700 shadow-2xs">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-medium">
                {currentShift.type} SHIFT ({currentShift.date})
              </span>
              <span className="font-bold text-emerald-700 text-xs">
                {currentShift.presentHelplines.length} Helplines Active
              </span>
            </div>
          </div>

          {/* Next Scan Countdown */}
          <div className="hidden md:flex bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg items-center gap-2 text-slate-700 shadow-2xs">
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isScanning ? 'animate-spin' : ''}`} />
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-medium">Next Scan In</span>
              <span className="font-bold text-slate-900 text-xs">
                {isScanning ? 'Scanning...' : formatCountdown(nextScanCountdown)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Scan Now & Role */}
        <div className="flex items-center gap-3">
          <button
            id="btn-header-scan-now"
            onClick={onScanNow}
            disabled={isScanning || sessionExpired}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-mono text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>SCAN NOW</span>
          </button>

          <div className="bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-mono text-slate-700 flex items-center gap-1.5 shadow-2xs">
            <UserCheck className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-500 font-medium">Role:</span>
            <span className="font-bold text-slate-900">{userRole}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="bg-slate-50/90 border-t border-slate-200 px-4 sm:px-6 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center gap-1 py-1 text-xs font-mono">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id.toLowerCase()}`}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md font-semibold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
