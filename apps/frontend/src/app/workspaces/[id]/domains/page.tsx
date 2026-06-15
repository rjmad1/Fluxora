/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";


export default function WorkspaceDomainsPage() {
  const params = useParams();
  const workspaceId = params?.id as string;

  const [workspaceName, setWorkspaceName] = useState("Workspace A (Brand Operations)");
  const [customDomain, setCustomDomain] = useState("portal.awesomeagency.com");
  const [clientEmail, setClientEmail] = useState("client@example.com");
  const [notifyOnDecision, setNotifyOnDecision] = useState(true);

  const [savingDomain, setSavingDomain] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Simulation state
  const [simulating, setSimulating] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);

  useEffect(() => {
    if (workspaceId === "ws-2") {
      setWorkspaceName("Workspace B (Global Marketing)");
      setCustomDomain("");
      setClientEmail("");
    } else if (workspaceId === "ws-3") {
      setWorkspaceName("Workspace C (Apex Creative)");
      setCustomDomain("reviews.apexcreative.net");
      setClientEmail("reviews@apexcreative.com");
    }
  }, [workspaceId]);

  const handleSaveDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDomain(true);
    setMessage(null);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSavingDomain(false);
    setMessage({
      text: `Custom domain "${customDomain || "(none)"}" saved successfully for workspace ${workspaceId}!`,
      type: "success",
    });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setMessage(null);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSavingSettings(false);
    setMessage({
      text: "Workspace notification configurations updated successfully!",
      type: "success",
    });
  };

  const runSimulation = async () => {
    setSimulating(true);
    setSimulationLogs([]);

    const logs = [
      `🔄 Starting approval loop simulation for ${workspaceName}...`,
      `📄 Creating draft post variant... DONE`,
      `🔒 Post status updated to "PendingApproval"`,
      `📧 Resolving client email settings for workspace "${workspaceId}"...`,
      `📬 Found recipient client: "${clientEmail || "no-recipient-configured@fluxora.com"}"`,
      `🚀 Triggering NotificationsService.sendEmail()...`,
      `📂 Local Mail Sandbox active: Mock email file written to:`,
      `   └─ logs/mail-sandbox/mail-${Date.now()}-${(clientEmail || "anonymous").replace(/[^a-zA-Z0-9]/g, '_')}.html`,
      `✔ Client notification delivered successfully.`,
      `⏱ Waiting for client decision (simulating approval link click)...`,
      `📥 Decision received from portal: APPROVED`,
      `⚙ Updating post status to "Scheduled" and queuing BullMQ publishing task...`,
      `📧 Triggering creator decision alert to creator@example.com...`,
      `📂 Mock creator email file written to:`,
      `   └─ logs/mail-sandbox/mail-creator-${Date.now()}-creator_example_com.html`,
      `🎉 Approval loop completed with zero errors!`
    ];

    for (let i = 0; i < logs.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSimulationLogs((prev) => [...prev, logs[i]]);
    }
    setSimulating(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg hover:scale-105 transition">
            <span className="font-extrabold text-xl text-white tracking-wider">F</span>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Fluxora Settings</h1>
            <p className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase">{workspaceName}</p>
          </div>
        </div>

        <Link
          href="/workspaces"
          className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg px-4 py-2 text-slate-200 transition cursor-pointer"
        >
          ← Back to Workspaces
        </Link>
      </header>

      {/* Main content grid */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Custom Domain Settings Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-100">Custom Domain Configuration</h2>
              <p className="text-xs text-slate-400 mt-1">Configure custom hostnames to white-label client approval portals.</p>
            </div>

            <form onSubmit={handleSaveDomain} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Custom Domain Hostname</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. portal.myagency.com"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-850 focus:border-indigo-500/50 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                  <button
                    type="submit"
                    disabled={savingDomain}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-xs font-bold text-white px-4 py-2 rounded-lg transition"
                  >
                    {savingDomain ? "Saving..." : "Save"}
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">DNS configurations must target the Kong gateway IP / ingress host.</span>
              </div>
            </form>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2.5">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dynamic Routing Info</h3>
              <div className="font-mono text-[10px] text-slate-400 space-y-1">
                <p>Status: <span className={customDomain ? "text-emerald-400" : "text-amber-400"}>{customDomain ? "● Resolved" : "○ Not Configured"}</span></p>
                <p>Test resolution command:</p>
                <pre className="bg-slate-900 p-2 rounded text-slate-300 border border-slate-850 overflow-x-auto">
                  curl -H &quot;Host: {customDomain || "my-custom-domain.com"}&quot; http://localhost:8000/api/v1/posts
                </pre>
              </div>
            </div>
          </div>

          {/* Email Notification Settings Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-100">Client Approval Notifications</h2>
              <p className="text-xs text-slate-400 mt-1">Configure client recipient emails and alerts options for approval workflows.</p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Client Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. client@brand.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500/50 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="notify"
                  checked={notifyOnDecision}
                  onChange={(e) => setNotifyOnDecision(e.target.checked)}
                  className="rounded border-slate-850 text-indigo-600 focus:ring-indigo-500 focus:ring-opacity-25"
                />
                <label htmlFor="notify" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Notify post creator automatically on client decision
                </label>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-slate-800 disabled:to-slate-800 text-xs font-bold text-white py-2.5 rounded-lg transition"
              >
                {savingSettings ? "Updating Settings..." : "Save Notification Config"}
              </button>
            </form>
          </div>
        </div>

        {/* Dynamic Sandbox Mail Simulator */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-full space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-100">Mail Sandbox Simulator</h2>
              <p className="text-xs text-slate-400 mt-1">Simulate post approval loops to inspect mock email triggers and sandbox outputs.</p>
            </div>

            <button
              onClick={runSimulation}
              disabled={simulating}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-850 disabled:to-slate-850 text-xs font-bold text-white py-2.5 rounded-lg transition"
            >
              {simulating ? "Simulating Workflow..." : "Trigger Approval Loop Simulation"}
            </button>

            {message && (
              <div className={`p-3 rounded-lg text-xs border ${
                message.type === "success" 
                  ? "bg-emerald-950/40 border-emerald-900/50 text-emerald-400" 
                  : "bg-rose-950/40 border-rose-900/50 text-rose-400"
              }`}>
                {message.text}
              </div>
            )}

            <div className="flex-1 bg-slate-950 border border-slate-850 rounded-xl p-4 font-mono text-[10px] text-slate-400 overflow-y-auto space-y-2.5 min-h-[340px] max-h-[500px]">
              {simulationLogs.length === 0 ? (
                <div className="text-slate-600 italic">Trigger the simulation above to inspect workflow telemetry logs.</div>
              ) : (
                simulationLogs.map((log, index) => {
                  let color = "text-slate-400";
                  if (log.includes("APPROVED") || log.includes("success") || log.includes("delivered") || log.includes("✔") || log.includes("🎉")) {
                    color = "text-emerald-400";
                  } else if (log.includes("logs/mail-sandbox")) {
                    color = "text-amber-400 font-semibold";
                  } else if (log.includes("PendingApproval") || log.includes("Scheduled")) {
                    color = "text-indigo-400";
                  }
                  return (
                    <div key={index} className={color}>
                      {log}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 px-6 py-4 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div>
          © {new Date().getFullYear()} Fluxora Platform Settings.
        </div>
        <div className="flex gap-4">
          <span className="hover:text-slate-300 transition cursor-pointer">Security Protocol TLS 1.3</span>
          <span>•</span>
          <span className="hover:text-slate-300 transition cursor-pointer">SOC2 Compliance</span>
        </div>
      </footer>
    </div>
  );
}
