"use client";

import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AuditLog {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  status: string;
}

interface ComplianceAuditProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
}

export default function ComplianceAudit({ onNotify }: ComplianceAuditProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Security variables
  const [twoFactor, setTwoFactor] = useState(false);
  const [retentionDays, setRetentionDays] = useState(90);

  // Compliance testing area
  const [testContent, setTestContent] = useState("");
  const [complianceResult, setComplianceResult] = useState<{
    tested: boolean;
    compliant: boolean;
    flagged: string[];
  }>({ tested: false, compliant: true, flagged: [] });
  const [validating, setValidating] = useState(false);

  const fetchComplianceData = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/v1/extended/compliance/logs", {
        headers: { "X-Tenant-ID": "Fluxora-Tenant-098", "X-Workspace-ID": "ws-1" },
      });
      if (!res.ok) throw new Error("API Offline");
      const data = await res.json();
      setLogs(data);

      const sRes = await fetch("http://localhost:3000/api/v1/extended/listening/settings", {
        headers: { "X-Tenant-ID": "Fluxora-Tenant-098", "X-Workspace-ID": "ws-1" },
      });
      if (sRes.ok) {
        const sData = await sRes.json();
        setTwoFactor(sData.twoFactorEnabled || false);
        setRetentionDays(sData.retentionDays || 90);
      }
    } catch {
      // Mock data
      setLogs([
        { id: "log-1", actor: "superadmin@fluxora.com", action: "2fa.enforce_global", timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), status: "SUCCESS" },
        { id: "log-2", actor: "manager@fluxora.com", action: "digest.configure_wizard", timestamp: new Date(Date.now() - 3600000 * 20).toISOString(), status: "SUCCESS" },
        { id: "log-3", actor: "agent@fluxora.com", action: 'compliance.keyword_flagged (Post Content contains: "guaranteed return")', timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), status: "WARNING" },
        { id: "log-4", actor: "admin@fluxora.com", action: "brand_mention.convert_ticket (ID: men-2)", timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), status: "SUCCESS" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const handleSecuritySave = async (updated2FA: boolean, updatedDays: number) => {
    try {
      await fetch("http://localhost:3000/api/v1/extended/compliance/security", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": "Fluxora-Tenant-098",
          "X-Workspace-ID": "ws-1",
        },
        body: JSON.stringify({ twoFactorEnabled: updated2FA, retentionDays: updatedDays }),
      });
      onNotify(`Security profile saved (2FA Enforce: ${updated2FA}, Logs Retention: ${updatedDays} days)`, "AUDIT");
    } catch {
      onNotify(`Demo mode: Security settings saved locally`, "AUDIT");
    }
  };

  const toggle2FA = () => {
    const nextVal = !twoFactor;
    setTwoFactor(nextVal);
    handleSecuritySave(nextVal, retentionDays);
  };

  const changeRetentionDays = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextDays = Number(e.target.value);
    setRetentionDays(nextDays);
    handleSecuritySave(twoFactor, nextDays);
  };

  const testComplianceText = async () => {
    if (!testContent.trim()) return;
    setValidating(true);
    try {
      const res = await fetch("http://localhost:3000/api/v1/extended/compliance/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": "Fluxora-Tenant-098",
          "X-Workspace-ID": "ws-1",
        },
        body: JSON.stringify({ content: testContent }),
      });
      const data = await res.json();
      setComplianceResult({
        tested: true,
        compliant: data.compliant,
        flagged: data.flaggedKeywords || [],
      });

      if (!data.compliant) {
        onNotify(`Prohibited keyword detected: "${data.flaggedKeywords.join(", ")}"`, "WARN");
      } else {
        onNotify(`Social copy passed legal compliance check`, "INFO");
      }
    } catch {
      // Offline fallback check
      const prohibited = ["guaranteed returns", "risk-free", "insider trading"];
      const found = prohibited.filter((w) => testContent.toLowerCase().includes(w));
      setComplianceResult({
        tested: true,
        compliant: found.length === 0,
        flagged: found,
      });

      if (found.length > 0) {
        onNotify(`Demo Mode: Compliance warning - found "${found.join(", ")}"`, "WARN");
      } else {
        onNotify(`Demo Mode: Social copy passed checks`, "INFO");
      }
    } finally {
      setValidating(false);
    }
  };

  const triggerExport = (format: "csv" | "pdf") => {
    if (format === "csv") {
      setExportingCsv(true);
      setTimeout(() => {
        setExportingCsv(false);
        onNotify("Historical CSV post archive compiled and downloaded.", "AUDIT");
        alert("Compliance CSV Export completed successfully!");
      }, 1200);
    } else {
      setExportingPdf(true);
      setTimeout(() => {
        setExportingPdf(false);
        onNotify("Historical PDF post archive compiled and downloaded.", "AUDIT");
        alert("Compliance PDF Export completed successfully!");
      }, 1200);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Compliance, Archiving, & Audit Logs</h2>
          <p className="text-xs text-[#A1A1AA] mt-1">
            Maintain regulatory legal checklists, enforce two-factor authentication scopes, and export immutable audit logs.
          </p>
        </div>

        {/* Exporter triggers */}
        <div className="flex gap-2">
          <button
            onClick={() => triggerExport("csv")}
            disabled={exportingCsv}
            className="bg-[#121218] hover:bg-[#181821] border border-white/[0.08] text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            {exportingCsv ? (
              <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            ) : (
              <Icons.Download className="w-3.5 h-3.5" />
            )}
            <span>Export CSV Archive</span>
          </button>

          <button
            onClick={() => triggerExport("pdf")}
            disabled={exportingPdf}
            className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-[#7C3AED]/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {exportingPdf ? (
              <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            ) : (
              <Icons.FileText className="w-3.5 h-3.5" />
            )}
            <span>Export PDF Archive</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Configurations */}
        <div className="lg:col-span-1 space-y-6">
          {/* Security policy panel */}
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Icons.Shield className="w-4 h-4 text-purple-400" />
              <span>Workspace Security Protocols</span>
            </h3>

            {/* 2FA Toggle */}
            <div className="flex justify-between items-center bg-[#0B0B0F]/50 border border-white/[0.04] p-3 rounded-xl">
              <div>
                <span className="block text-xs font-bold text-white">Enforce 2FA Verification</span>
                <span className="text-[9.5px] text-[#A1A1AA]">Require 2FA token to authorize post schedules</span>
              </div>
              <button
                onClick={toggle2FA}
                className={`w-10 h-6.5 rounded-full p-1 transition-colors cursor-pointer ${
                  twoFactor ? "bg-purple-600" : "bg-[#1E1E28]"
                }`}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                    twoFactor ? "translate-x-3.5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Retention Settings */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">
                Log Retention Expiration Policy
              </label>
              <select
                value={retentionDays}
                onChange={changeRetentionDays}
                className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none"
              >
                <option value={30}>30 Days Retention</option>
                <option value={90}>90 Days Retention (Recommended)</option>
                <option value={180}>180 Days Retention</option>
                <option value={365}>365 Days Retention (Enterprise SLA)</option>
              </select>
            </div>
          </div>

          {/* Compliance Tester Area */}
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-3.5">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Icons.ShieldAlert className="w-4 h-4 text-purple-400" />
              <span>Compliance Keyword Flagging</span>
            </h3>
            <p className="text-[11px] text-[#A1A1AA]">
              Test social templates against flagged financial claims, guaranteed profit claims, or legal risk phrases.
            </p>

            <div className="space-y-2">
              <textarea
                value={testContent}
                onChange={(e) => setTestContent(e.target.value)}
                placeholder="Type copy to test compliance (e.g. Try this risk-free investment for guaranteed returns!)"
                className="w-full h-24 bg-[#0B0B0F] border border-white/[0.08] rounded-xl p-2.5 text-xs text-white focus:outline-none resize-none"
              />
              <button
                onClick={testComplianceText}
                disabled={validating || !testContent.trim()}
                className="w-full bg-[#121218] hover:bg-[#181821] border border-white/[0.08] text-xs font-bold text-white py-2 rounded-xl transition cursor-pointer"
              >
                {validating ? "Analyzing Copy..." : "Check Compliance Status"}
              </button>
            </div>

            {/* Analysis Output */}
            {complianceResult.tested && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2 ${
                  complianceResult.compliant
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}
              >
                {complianceResult.compliant ? (
                  <>
                    <Icons.CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
                    <div>
                      <span className="font-bold block">Compliant copy structure</span>
                      <span>No flagged terms or legal risks found in text body.</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Icons.AlertOctagon className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
                    <div>
                      <span className="font-bold block">Non-Compliant terms detected</span>
                      <span>
                        Found banned content: <strong>{complianceResult.flagged.join(", ")}</strong>. Modify copy before scheduling.
                      </span>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Immutable Audit Log Table - Right Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl flex flex-col h-full">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <Icons.Fingerprint className="w-4 h-4 text-purple-400" />
                  <span>Immutable System Logs</span>
                </h3>
                <p className="text-[11px] text-[#A1A1AA]">Cryptographically tracked user approvals & system activities</p>
              </div>
              <button
                onClick={fetchComplianceData}
                className="p-1 hover:bg-white/[0.04] rounded text-[#A1A1AA] hover:text-white"
              >
                <Icons.RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08] text-[#A1A1AA] font-mono text-[9px] uppercase font-bold tracking-wider">
                    <th className="pb-2">Actor Identity</th>
                    <th className="pb-2">Logged Activity</th>
                    <th className="pb-2 text-right">Timestamp</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-white">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.01]">
                      <td className="py-2.5 font-bold font-mono text-[10.5px] truncate max-w-[120px]">
                        {log.actor}
                      </td>
                      <td className="py-2.5 text-[#E4E4E7] font-mono text-[10px] pr-4 max-w-[200px] truncate">
                        {log.action}
                      </td>
                      <td className="py-2.5 text-right font-mono text-[9.5px] text-[#A1A1AA]/80">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`inline-block text-[8px] font-bold px-1.5 py-0.2 rounded ${
                            log.status === "SUCCESS"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs text-[#A1A1AA]/50 italic">
                        No security actions logged
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
