"use client";

import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationConfigProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
  maintenanceEnabled: boolean;
  onToggleMaintenance: (enabled: boolean) => void;
}

interface ActivityAlert {
  id: string;
  type: "success" | "failure" | "warning";
  title: string;
  msg: string;
  time: string;
  retryable?: boolean;
}

export default function NotificationConfig({
  onNotify,
  maintenanceEnabled,
  onToggleMaintenance
}: NotificationConfigProps) {
  const [sandboxEmails, setSandboxEmails] = useState<Array<{ filename: string; createdAt: string; to: string; subject: string }>>([]);
  const [selectedEmailContent, setSelectedEmailContent] = useState<string | null>(null);
  const [loadingEmails, setLoadingEmails] = useState(false);

  const fetchSandboxEmails = async () => {
    setLoadingEmails(true);
    try {
      const res = await fetch("http://localhost:3000/api/v1/notifications/mail-sandbox", {
        headers: {
          "X-Tenant-ID": "Fluxora-Tenant-098",
          "X-Workspace-ID": "ws-1",
        },
      });
      if (!res.ok) throw new Error("API Offline");
      const data = await res.json();
      setSandboxEmails(data);
    } catch (err) {
      console.warn("Mail sandbox API offline, using empty mock list:", err);
      setSandboxEmails([]);
    } finally {
      setLoadingEmails(false);
    }
  };

  const fetchEmailContent = async (filename: string) => {
    try {
      const res = await fetch(`http://localhost:3000/api/v1/notifications/mail-sandbox/${filename}`, {
        headers: {
          "X-Tenant-ID": "Fluxora-Tenant-098",
          "X-Workspace-ID": "ws-1",
        },
      });
      if (!res.ok) throw new Error("API Offline");
      const data = await res.json();
      setSelectedEmailContent(data.content);
    } catch (err) {
      console.warn("Could not retrieve email content:", err);
    }
  };

  useEffect(() => {
    fetchSandboxEmails();
  }, []);

  // Activity Alerts
  const [alerts, setAlerts] = useState<ActivityAlert[]>([
    { id: "a-1", type: "success", title: "LinkedIn Publishing", msg: "Weekly technical update was successfully posted via Temporal workflows.", time: "10 mins ago" },
    { id: "a-2", type: "failure", title: "X / Twitter API Error", msg: "Authorization failed. Access token expired or invalid signature scope.", time: "1 hour ago", retryable: true },
    { id: "a-3", type: "warning", title: "OAuth Lifecycle Warning", msg: "Facebook access tokens expire in less than 24 hours. Re-auth required.", time: "4 hours ago" }
  ]);

  // Toggle Matrix state
  const [matrix, setMatrix] = useState({
    success: { email: true, push: false, app: true },
    failure: { email: true, push: true, app: true },
    token: { email: true, push: false, app: true },
    system: { email: false, push: true, app: true }
  });

  // Weekly Delivery Settings
  const [reportDay, setReportDay] = useState("Monday");
  const [reportHour, setReportHour] = useState("09:00");
  const [reportEmail, setReportEmail] = useState("admin@agencytier.com");
  const [reportFormat, setReportFormat] = useState("PDF");

  const [retryingId, setRetryingId] = useState<string | null>(null);

  const handleRetryPublish = (alertId: string) => {
    setRetryingId(alertId);
    onNotify("Notifications: Retrying failed publishing execution...", "INFO");

    setTimeout(() => {
      // Simulate success
      setAlerts(prev => prev.map(a => {
        if (a.id !== alertId) return a;
        return {
          ...a,
          type: "success",
          title: "X / Twitter Publishing (Retried)",
          msg: "Post published successfully on second attempt.",
          retryable: false
        };
      }));
      setRetryingId(null);
      onNotify("Notifications: Failed post publish retried successfully!", "AUDIT");
    }, 1500);
  };

  const handleMatrixToggle = (scope: keyof typeof matrix, channel: "email" | "push" | "app") => {
    setMatrix(prev => {
      const nextVal = !prev[scope][channel];
      onNotify(`Notifications: Updated notification toggle matrix for [${scope}.${channel}] to ${nextVal ? "ON" : "OFF"}`, "INFO");
      return {
        ...prev,
        [scope]: {
          ...prev[scope],
          [channel]: nextVal
        }
      };
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Real-time Activity Center */}
      <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Real-Time Activity Center</h3>
            <p className="text-[10px] text-[#A1A1AA]">Telemetry publish success, failure, and security warning flags.</p>
          </div>
          <button
            onClick={() => {
              setAlerts([]);
              onNotify("Notifications: Cleared alerts dashboard", "INFO");
            }}
            className="text-[9px] text-[#A1A1AA] hover:text-white underline cursor-pointer"
          >
            Clear Notifications
          </button>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {alerts.map(a => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition ${
                  a.type === "success"
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : a.type === "failure"
                    ? "bg-red-500/5 border-red-500/20"
                    : "bg-amber-500/5 border-amber-500/20"
                }`}
              >
                <div className="flex gap-3 min-w-0">
                  <div className="mt-0.5 flex-shrink-0">
                    {a.type === "success" && <Icons.CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />}
                    {a.type === "failure" && <Icons.AlertCircle className="w-4.5 h-4.5 text-red-400" />}
                    {a.type === "warning" && <Icons.AlertTriangle className="w-4.5 h-4.5 text-amber-400" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{a.title}</span>
                      <span className="text-[8px] text-[#A1A1AA] font-mono">• {a.time}</span>
                    </h4>
                    <p className="text-[11px] text-[#A1A1AA] mt-1 leading-relaxed">{a.msg}</p>
                  </div>
                </div>

                {/* Failed Post retry action */}
                {a.retryable && (
                  <button
                    onClick={() => handleRetryPublish(a.id)}
                    disabled={retryingId === a.id}
                    className="flex-shrink-0 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-[9px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition shadow-md shadow-red-500/10 cursor-pointer"
                  >
                    {retryingId === a.id ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                        <span>Retrying...</span>
                      </>
                    ) : (
                      <>
                        <Icons.RefreshCw className="w-3 h-3" />
                        <span>One-Click Retry Publish</span>
                      </>
                    )}
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {alerts.length === 0 && (
            <div className="text-center py-6 text-[10px] text-[#A1A1AA]/50 italic">
              All clear! No success, warning, or failure alerts.
            </div>
          )}
        </div>
      </div>

      {/* In-app Notification Toggle Matrix */}
      <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">In-App Notification Channel Matrix</h3>
          <p className="text-[10px] text-[#A1A1AA]">Map event notification alerts to Email, Device Push, or Dashboard In-App flags.</p>
        </div>

        <div className="overflow-x-auto border border-white/[0.06] rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] text-[9px] text-[#A1A1AA] uppercase font-bold tracking-wider font-mono bg-[#0B0B0F]/40">
                <th className="p-3">Event Categories</th>
                <th className="p-3 text-center">Email</th>
                <th className="p-3 text-center">Push Notifications</th>
                <th className="p-3 text-center">In-App Alerts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs text-white">
              {[
                { key: "success", label: "Publishing Success Logs" },
                { key: "failure", label: "Publishing Failures & Errors" },
                { key: "token", label: "OAuth Expiry Warnings" },
                { key: "system", label: "Developer webhook payloads & Status" }
              ].map(row => (
                <tr key={row.key} className="hover:bg-white/[0.01]">
                  <td className="p-3 font-semibold text-white">{row.label}</td>
                  {(["email", "push", "app"] as const).map(ch => {
                    const isChecked = matrix[row.key as keyof typeof matrix][ch];
                    return (
                      <td key={ch} className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleMatrixToggle(row.key as keyof typeof matrix, ch)}
                          className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer inline-block ${
                            isChecked ? "bg-[#8B5CF6]" : "bg-zinc-700"
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                              isChecked ? "translate-x-3.5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weekly Automated Summary Settings & Server maintenance overlays */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Reports Delivery */}
        <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Weekly Summary Delivery Reports</h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-[8px] uppercase text-[#A1A1AA] font-bold block mb-1">Email Recipient</label>
              <input
                type="email"
                value={reportEmail}
                onChange={e => setReportEmail(e.target.value)}
                className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-lg px-3 py-2 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-[8px] uppercase text-[#A1A1AA] font-bold block mb-1">Scheduled Day & Time</label>
                <div className="flex gap-1">
                  <select
                    value={reportDay}
                    onChange={e => setReportDay(e.target.value)}
                    className="flex-1 bg-[#0B0B0F] border border-white/[0.08] text-white text-[10px] rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer"
                  >
                    <option value="Monday">Monday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Friday">Friday</option>
                  </select>
                  <input
                    type="time"
                    value={reportHour}
                    onChange={e => setReportHour(e.target.value)}
                    className="bg-[#0B0B0F] border border-white/[0.08] text-white text-[10px] rounded-lg px-2 py-1 focus:outline-none cursor-pointer w-20"
                  />
                </div>
              </div>
              <div>
                <label className="text-[8px] uppercase text-[#A1A1AA] font-bold block mb-1">Format</label>
                <select
                  value={reportFormat}
                  onChange={e => setReportFormat(e.target.value)}
                  className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-[10px] rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer"
                >
                  <option value="PDF">PDF Report</option>
                  <option value="EXCEL">Excel Sheet</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={() => {
                onNotify(`Notifications: Scheduled weekly summary to ${reportEmail} on ${reportDay}s`, "INFO");
                alert("Weekly summary schedule configuration saved!");
              }}
              className="w-full bg-[#0B0B0F] hover:bg-white/[0.02] border border-white/[0.08] text-white font-bold text-[10px] py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Icons.Save className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Save Delivery Settings</span>
            </button>
          </div>
        </div>

        {/* Server status & System banner overlays */}
        <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">System Status Banners Control</h3>
            <p className="text-[10px] text-[#A1A1AA] mb-4">Toggle live status flags at the top of the command center interface.</p>
            
            <div className="space-y-3 bg-[#0B0B0F]/45 border border-white/[0.05] p-4 rounded-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-[11px] font-bold text-white">Global Maintenance Banner</h4>
                  <p className="text-[8px] text-[#A1A1AA]/60">Alert users about upcoming database migrations.</p>
                </div>
                
                {/* Toggle switch */}
                <button
                  onClick={() => {
                    const nextState = !maintenanceEnabled;
                    onToggleMaintenance(nextState);
                    onNotify(`Notifications: Maintenance banner ${nextState ? "ACTIVATED" : "DEACTIVATED"}`, "INFO");
                  }}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                    maintenanceEnabled ? "bg-[#8B5CF6]" : "bg-zinc-700"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                      maintenanceEnabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-white/[0.04]">
                <div>
                  <h4 className="text-[11px] font-bold text-white">Live Ingestion Rate</h4>
                  <p className="text-[8px] text-[#A1A1AA]/60 font-mono">Clickhouse telemetry: 142.8 ops/sec</p>
                </div>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
            </div>
          </div>

          <div className="text-[8px] text-[#A1A1AA]/40 font-mono text-center">
            System status: Operational. Kafka queues synchronized.
          </div>
        </div>
      </div>

      {/* Local Email Sandbox Simulator Logs */}
      <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Local Email Simulator (Sandbox)</h3>
            <p className="text-[10px] text-[#A1A1AA]">Intercepted outbound notification emails in development mode.</p>
          </div>
          <button
            onClick={fetchSandboxEmails}
            disabled={loadingEmails}
            className="text-[9px] text-[#A1A1AA] hover:text-white underline cursor-pointer"
          >
            Refresh Sandbox
          </button>
        </div>

        <div className="overflow-x-auto border border-white/[0.06] rounded-xl bg-[#0B0B0F]/30">
          <table className="w-full text-left border-collapse text-xs text-white">
            <thead>
              <tr className="border-b border-white/[0.08] text-[9px] text-[#A1A1AA] uppercase font-bold tracking-wider font-mono bg-[#0B0B0F]/50">
                <th className="p-3">To Recipient</th>
                <th className="p-3">Subject Line</th>
                <th className="p-3">Sent Timestamp</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {sandboxEmails.map((email) => (
                <tr key={email.filename} className="hover:bg-white/[0.01]">
                  <td className="p-3 font-semibold text-white font-mono">{email.to}</td>
                  <td className="p-3 text-[#A1A1AA]">{email.subject}</td>
                  <td className="p-3 text-[#A1A1AA] font-mono">{new Date(email.createdAt).toLocaleTimeString()}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => fetchEmailContent(email.filename)}
                      className="bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 text-[#8B5CF6] border border-[#7C3AED]/20 text-[9px] font-bold px-2.5 py-1 rounded transition cursor-pointer"
                    >
                      Inspect Email
                    </button>
                  </td>
                </tr>
              ))}
              {sandboxEmails.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-[#A1A1AA]/50 italic text-[10px]">
                    No captured emails in the sandbox directory. Try submitting a post for approval.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Email content inspector iframe preview */}
        {selectedEmailContent && (
          <div className="p-4 bg-[#0B0B0F]/60 border border-white/[0.08] rounded-xl space-y-2 mt-4 relative">
            <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
              <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider font-bold">Email HTML Ingestion Sandbox Inspector</span>
              <button
                onClick={() => setSelectedEmailContent(null)}
                className="text-[#A1A1AA] hover:text-white text-xs cursor-pointer"
              >
                Close Preview
              </button>
            </div>
            <div className="bg-white rounded-lg p-4 overflow-auto max-h-[300px]">
              <div dangerouslySetInnerHTML={{ __html: selectedEmailContent }} className="text-black" />
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
