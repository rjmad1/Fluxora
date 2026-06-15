/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Globe, Mail, Bell, Play, Terminal, CheckCircle2, ChevronRight } from "lucide-react";

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
    await new Promise((resolve) => setTimeout(resolve, 600));
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
    await new Promise((resolve) => setTimeout(resolve, 600));
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
      await new Promise((resolve) => setTimeout(resolve, 300));
      setSimulationLogs((prev) => [...prev, logs[i]]);
    }
    setSimulating(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white font-sans flex flex-col selection:bg-[#7C3AED]/35 selection:text-white">
      {/* Header */}
      <header className="border-b border-white/[0.08] bg-[#121218]/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#8B5CF6] to-pink-500 flex items-center justify-center shadow-lg shadow-[#7C3AED]/20">
            <span className="font-extrabold text-lg text-white tracking-wider">F</span>
          </Link>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">Fluxora Settings</h1>
            <p className="text-[10px] text-[#8B5CF6] font-mono tracking-widest uppercase">{workspaceName}</p>
          </div>
        </div>

        <Link
          href="/workspaces"
          className="text-xs font-semibold bg-[#121218] hover:bg-[#181821] border border-white/[0.08] rounded-xl px-4 py-2 text-[#A1A1AA] hover:text-white transition cursor-pointer flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workspaces</span>
        </Link>
      </header>

      {/* Main content grid */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Custom Domain Settings Card */}
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#7C3AED]/15 border border-[#7C3AED]/20 flex items-center justify-center flex-shrink-0">
                <Globe className="w-4.5 h-4.5 text-[#8B5CF6]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Custom Domain Configuration</h2>
                <p className="text-xs text-[#A1A1AA] mt-0.5">Configure custom hostnames to white-label client approval portals.</p>
              </div>
            </div>

            <form onSubmit={handleSaveDomain} className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Custom Domain Hostname</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. portal.myagency.com"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    className="flex-1 bg-[#0B0B0F] border border-white/[0.08] focus:border-[#7C3AED]/40 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={savingDomain}
                    className="bg-[#7C3AED] hover:bg-[#8B5CF6] disabled:opacity-50 text-xs font-bold text-white px-5 rounded-xl transition cursor-pointer"
                  >
                    {savingDomain ? "Saving..." : "Save"}
                  </button>
                </div>
                <span className="text-[10px] text-[#A1A1AA]/60 block mt-1">DNS configurations must target the Kong gateway ingress host.</span>
              </div>
            </form>

            <div className="bg-[#0B0B0F] p-4 rounded-xl border border-white/[0.04] space-y-2.5">
              <h3 className="text-[9px] font-bold text-[#A1A1AA] uppercase tracking-wider font-mono">Dynamic Routing Info</h3>
              <div className="font-mono text-[10px] text-[#A1A1AA] space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span>Status:</span>
                  <span className={`flex items-center gap-1 font-semibold ${customDomain ? "text-[#22C55E]" : "text-[#F59E0B]"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${customDomain ? "bg-[#22C55E]" : "bg-[#F59E0B]"}`}></span>
                    {customDomain ? "Resolved" : "Not Configured"}
                  </span>
                </div>
                <p className="text-[#A1A1AA]/60">Verification curl:</p>
                <pre className="bg-[#121218] p-2.5 rounded-lg text-white border border-white/[0.08] overflow-x-auto text-[9px] leading-relaxed">
                  curl -H &quot;Host: {customDomain || "my-custom-domain.com"}&quot; http://localhost:8000/api/v1/posts
                </pre>
              </div>
            </div>
          </div>

          {/* Email Notification Settings Card */}
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#7C3AED]/15 border border-[#7C3AED]/20 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4.5 h-4.5 text-[#8B5CF6]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Client Approval Notifications</h2>
                <p className="text-xs text-[#A1A1AA] mt-0.5">Configure client recipient emails and alerts options for approval loops.</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Client Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. client@brand.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full bg-[#0B0B0F] border border-white/[0.08] focus:border-[#7C3AED]/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2.5 py-1">
                <input
                  type="checkbox"
                  id="notify"
                  checked={notifyOnDecision}
                  onChange={(e) => setNotifyOnDecision(e.target.checked)}
                  className="rounded border-white/[0.08] bg-[#0B0B0F] text-[#7C3AED] focus:ring-[#7C3AED] focus:ring-opacity-25 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="notify" className="text-xs text-[#A1A1AA] font-medium cursor-pointer">
                  Notify post creator automatically on client decision
                </label>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:brightness-110 disabled:opacity-50 text-xs font-bold text-white py-2.5 rounded-xl transition cursor-pointer shadow-lg shadow-[#7C3AED]/15"
              >
                {savingSettings ? "Updating Settings..." : "Save Notification Config"}
              </button>
            </form>
          </div>
        </div>

        {/* Dynamic Sandbox Mail Simulator */}
        <div className="space-y-6">
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-xl flex flex-col h-full space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#22C55E]/15 border border-[#22C55E]/20 flex items-center justify-center flex-shrink-0">
                <Terminal className="w-4.5 h-4.5 text-[#22C55E]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Mail Sandbox Simulator</h2>
                <p className="text-xs text-[#A1A1AA] mt-0.5">Simulate post approval loops to inspect mock email triggers and sandbox outputs.</p>
              </div>
            </div>

            <button
              onClick={runSimulation}
              disabled={simulating}
              className="w-full bg-gradient-to-r from-[#22C55E] to-[#22C55E]/80 hover:brightness-110 disabled:opacity-50 text-xs font-bold text-white py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{simulating ? "Simulating Loop..." : "Trigger Approval Loop Simulation"}</span>
            </button>

            {message && (
              <div className={`p-3 rounded-xl text-xs border flex items-center gap-2 ${
                message.type === "success" 
                  ? "bg-[#22C55E]/10 border-[#22C55E]/20 text-[#22C55E]" 
                  : "bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]"
              }`}>
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{message.text}</span>
              </div>
            )}

            <div className="flex-1 bg-[#0B0B0F] border border-white/[0.04] rounded-xl p-4 font-mono text-[10px] text-[#A1A1AA] overflow-y-auto space-y-2.5 min-h-[300px]">
              {simulationLogs.length === 0 ? (
                <div className="text-[#A1A1AA]/40 italic text-center py-12">Trigger the simulation above to inspect workflow telemetry logs.</div>
              ) : (
                simulationLogs.map((log, index) => {
                  let color = "text-[#A1A1AA]";
                  if (log.includes("APPROVED") || log.includes("success") || log.includes("delivered") || log.includes("✔") || log.includes("🎉")) {
                    color = "text-[#22C55E]";
                  } else if (log.includes("logs/mail-sandbox")) {
                    color = "text-[#F59E0B] font-semibold";
                  } else if (log.includes("PendingApproval") || log.includes("Scheduled")) {
                    color = "text-[#8B5CF6]";
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
      <footer className="mt-auto border-t border-white/[0.08] bg-[#0B0B0F] px-6 py-4 flex flex-col md:flex-row items-center justify-between text-xs text-[#A1A1AA]/60 gap-4">
        <div>
          © {new Date().getFullYear()} Fluxora Platform Settings.
        </div>
        <div className="flex gap-4">
          <span className="hover:text-white transition cursor-pointer">Security Protocol TLS 1.3</span>
          <span>•</span>
          <span className="hover:text-white transition cursor-pointer">SOC2 Compliance</span>
        </div>
      </footer>
    </div>
  );
}
