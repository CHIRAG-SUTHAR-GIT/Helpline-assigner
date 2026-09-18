import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  FileCheck,
  AlertTriangle,
  Terminal,
} from 'lucide-react';
import { runAllSection41Tests, TestSuiteResult, Section41TestReport, TestAssertion } from '../services/testRunner';

export const Section41TestSuiteView: React.FC = () => {
  const [report, setReport] = useState<Section41TestReport | null>(() => runAllSection41Tests());
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestSuiteResult | null>(null);

  const handleRunTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const results = runAllSection41Tests();
      setReport(results);
      setIsRunning(false);
    }, 400);
  };

  return (
    <div id="section41-test-suite-view" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-slate-700 font-bold tracking-wider uppercase bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
            SPECIFICATION § 41 • MANDATORY SYSTEM VERIFICATION SUITE
          </span>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            Section 41 — 17 Mandatory Pre-Deployment Test Suites
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Validates algorithmic compliance for all 17 mandatory verification suites: extraction, classification, mobile number discrimination, shift cutoffs, skip rules, idempotency, and session integrity.
          </p>
        </div>

        <button
          id="btn-run-all-tests"
          onClick={handleRunTests}
          disabled={isRunning}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-mono font-bold text-xs rounded-lg shadow-sm flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
        >
          {isRunning ? (
            <RotateCcw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
          <span>{isRunning ? 'RUNNING TEST HARNESS...' : 'EXECUTE ALL 17 TESTS'}</span>
        </button>
      </div>

      {/* Metrics Banner */}
      {report && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
            <span className="text-[11px] text-slate-500 uppercase font-semibold">Total Test Suites</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{report.totalTests}</div>
          </div>
          <div className="bg-white border border-emerald-200 p-4 rounded-xl shadow-xs">
            <span className="text-[11px] text-emerald-700 uppercase font-semibold">Passed</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{report.passed}</div>
          </div>
          <div className="bg-white border border-red-200 p-4 rounded-xl shadow-xs">
            <span className="text-[11px] text-red-700 uppercase font-semibold">Failed</span>
            <div className="text-2xl font-black text-red-700 mt-1">{report.failed}</div>
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
            <span className="text-[11px] text-slate-500 uppercase font-semibold">Execution Time</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{report.totalExecutionTimeMs.toFixed(1)} ms</div>
          </div>
        </div>
      )}

      {/* Overall Status Banner */}
      {report && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between font-mono text-xs shadow-xs ${
            report.allPassed
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {report.allPassed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span className="font-bold text-sm">
              {report.allPassed
                ? 'ALL 17 MANDATORY TEST SUITES PASSED — SYSTEM PRODUCTION READY'
                : 'VERIFICATION COMPROMISED — ONE OR MORE TESTS FAILED'}
            </span>
          </div>
          <span className="text-[11px] opacity-80">Last run: {report.executedAt}</span>
        </div>
      )}

      {/* Test Suites List */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.suites.map((suite: TestSuiteResult) => (
            <div
              key={suite.suiteId}
              id={`test-card-suite-${suite.suiteId}`}
              className={`bg-white border rounded-xl p-4 shadow-xs space-y-3 font-mono text-xs transition ${
                suite.passed
                  ? 'border-slate-200 hover:border-slate-300'
                  : 'border-red-300 bg-red-50/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-[11px]">
                    {suite.suiteId}
                  </span>
                  <span className="font-bold text-slate-900 text-xs">{suite.name}</span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    suite.passed
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      : 'bg-red-50 text-red-800 border border-red-300'
                  }`}
                >
                  {suite.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>

              <p className="text-slate-600 font-sans text-xs">{suite.description}</p>

              {/* Sub-assertions list */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                {suite.assertions.map((a: TestAssertion, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-[11px]">
                    {a.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div className="text-slate-700">
                      <span className="font-semibold text-slate-900">{a.assertion}: </span>
                      <span className="text-slate-500">{a.details}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
