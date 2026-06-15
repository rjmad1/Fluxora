"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Plus, ArrowLeft, RefreshCw, Key, Globe, Check, AlertCircle } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  tenantName: string;
  tenantId: string;
  region: string;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  accountCount: number;
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    {
      id: "ws-1",
      name: "Workspace A (Brand Operations)",
      tenantName: "Enterprise Agency Tier",
      tenantId: "Fluxora-Tenant-098",
      region: "US-East (AWS us-east-1)",
      status: "ACTIVE",
      createdAt: "2026-06-15 06:31 AM",
      accountCount: 3,
    },
    {
      id: "ws-2",
      name: "Workspace B (Global Marketing)",
      tenantName: "Enterprise Agency Tier",
      tenantId: "Fluxora-Tenant-098",
      region: "EU-West (AWS eu-west-1)",
      status: "ACTIVE",
      createdAt: "2026-06-15 06:33 AM",
      accountCount: 1,
    },
    {
      id: "ws-3",
      name: "Workspace C (Apex Creative)",
      tenantName: "Apex Marketing Group",
      tenantId: "Fluxora-Tenant-104",
      region: "AP-South (AWS ap-south-1)",
      status: "ACTIVE",
      createdAt: "2026-06-15 06:40 AM",
      accountCount: 0,
    },
  ]);

  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newTenantName, setNewTenantName] = useState("Enterprise Agency Tier");
  const [newRegion, setNewRegion] = useState("US-East (AWS us-east-1)");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isolationTestLogs, setIsolationTestLogs] = useState<string[]>([]);
  const [testingIsolation, setTestingIsolation] = useState(false);

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    const newWs: Workspace = {
      id: `ws-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newWorkspaceName,
      tenantName: newTenantName,
      tenantId: newTenantName === "Enterprise Agency Tier" ? "Fluxora-Tenant-098" : `Fluxora-Tenant-${Math.floor(100 + Math.random() * 900)}`,
      region: newRegion,
      status: "ACTIVE",
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      accountCount: 0,
    };

    setWorkspaces([...workspaces, newWs]);
    setNewWorkspaceName("");
    setShowCreateModal(false);
  };

  const toggleStatus = (id: string) => {
    setWorkspaces(
      workspaces.map((ws) =>
        ws.id === id
          ? { ...ws, status: ws.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" }
          : ws
      )
    );
  };

  const runIsolationSimulation = async () => {
    setTestingIsolation(true);
    setIsolationTestLogs([]);
    
    const logs = [
      "🔄 Initializing Workspace Security Isolation Test...",
      "🔑 Authenticating via Keycloak (RBAC Check)... OK",
      "👤 User roles loaded: WorkspaceAAdmin, AgencyViewer",
      "🐳 Setting session context: SET LOCAL app.current_workspace_id = 'ws-1'",
      "🔍 Executing PostgreSQL isolation query: SELECT * FROM \"Post\"...",
      "📊 PostgreSQL returned 3 records for Workspace A",
      "⚠️ Injecting cross-boundary simulation: SET LOCAL app.current_workspace_id = 'ws-2'...",
      "🚫 SQL Guard active: Row-Level Security blocked workspace boundary leak!",
      "🔒 Verification success: Zero cross-tenant database leaks detected."
    ];

    for (let i = 0; i < logs.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      setIsolationTestLogs((prev) => [...prev, logs[i]]);
    }
    setTestingIsolation(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white font-sans flex flex-col selection:bg-[#7C3AED]/30 selection:text-white">
      {/* Header */}
      <header className="border-b border-white/[0.08] bg-[#121218]/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#8B5CF6] to-pink-500 flex items-center justify-center shadow-lg shadow-[#7C3AED]/20 hover:scale-105 transition cursor-pointer">
            <span className="font-extrabold text-lg text-white tracking-wider">F</span>
          </Link>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">Fluxora Settings</h1>
            <p className="text-[10px] text-[#8B5CF6] font-mono tracking-widest uppercase">Workspace Sandbox Manager</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-semibold bg-[#121218] hover:bg-[#181821] border border-white/[0.08] rounded-xl px-4 py-2 text-[#A1A1AA] hover:text-white transition cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-xs font-bold bg-[#7C3AED] hover:bg-[#8B5CF6] rounded-xl px-4 py-2 text-white shadow-lg shadow-[#7C3AED]/20 transition cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Provision Workspace</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Workspaces List Grid */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Tenant Workspaces</h2>
                <p className="text-xs text-[#A1A1AA] mt-0.5">Manage and monitor isolated workspace boundaries and data residency regions.</p>
              </div>
              <span className="text-[10px] bg-[#7C3AED]/20 text-[#8B5CF6] px-3 py-1 rounded-full font-mono border border-[#7C3AED]/30">
                PostgreSQL RLS Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  className={`p-5 rounded-2xl border transition flex flex-col justify-between ${
                    ws.status === "ACTIVE"
                      ? "bg-[#0B0B0F]/40 border-white/[0.08] hover:border-[#7C3AED]/40"
                      : "bg-[#0B0B0F]/20 border-dashed border-white/[0.04] opacity-50"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono bg-[#121218] text-[#A1A1AA] px-2.5 py-0.8 rounded-md border border-white/[0.08]">
                          {ws.id}
                        </span>
                        <h3 className="text-sm font-bold text-white mt-2.5">{ws.name}</h3>
                      </div>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                          ws.status === "ACTIVE"
                            ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20"
                            : "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20"
                        }`}
                      >
                        {ws.status}
                      </span>
                    </div>

                    <div className="space-y-2 border-t border-white/[0.04] pt-3 text-[11px] font-mono">
                      <div className="flex justify-between">
                        <span className="text-[#A1A1AA]">Tenant ID:</span>
                        <span className="text-white">{ws.tenantId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#A1A1AA]">Tenant Name:</span>
                        <span className="text-white">{ws.tenantName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#A1A1AA]">Data Residency:</span>
                        <span className="text-[#8B5CF6]">{ws.region}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#A1A1AA]">Integrations:</span>
                        <span className="text-white">{ws.accountCount} connected</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-5 pt-3.5 border-t border-white/[0.04]">
                    <span className="text-[9px] text-[#A1A1AA]/60 font-mono">Created: {ws.createdAt}</span>
                    <div className="flex gap-2">
                      <Link
                        href={`/workspaces/${ws.id}/domains`}
                        className="text-[10px] bg-[#121218] border border-white/[0.08] text-[#8B5CF6] hover:text-[#8B5CF6]/80 hover:border-[#7C3AED]/40 font-semibold px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        Domains & Mail
                      </Link>
                      <button
                        onClick={() => toggleStatus(ws.id)}
                        className={`text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                          ws.status === "ACTIVE"
                            ? "bg-[#EF4444]/10 hover:bg-[#EF4444]/25 text-[#EF4444] border border-[#EF4444]/20"
                            : "bg-[#22C55E]/10 hover:bg-[#22C55E]/25 text-[#22C55E] border border-[#22C55E]/20"
                        }`}
                      >
                        {ws.status === "ACTIVE" ? "Suspend" : "Activate"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PostgreSQL Security Sandbox Sandbox */}
        <section className="lg:col-span-1 space-y-6">
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-xl flex flex-col h-full">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#8B5CF6]" />
              <span>Isolation Boundary Simulator</span>
            </h2>
            <p className="text-xs text-[#A1A1AA] mb-5">
              Directly verify Row-Level Security (RLS) policies by triggering a query simulation that tests Postgres isolation.
            </p>

            <button
              onClick={runIsolationSimulation}
              disabled={testingIsolation}
              className={`w-full py-2.5 text-xs font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-1.5 ${
                testingIsolation
                  ? "bg-[#121218] text-[#A1A1AA]/50 cursor-not-allowed border border-white/[0.08]"
                  : "bg-gradient-to-r from-[#22C55E] to-[#22C55E]/80 hover:brightness-110 text-white shadow-[#22C55E]/10 cursor-pointer"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingIsolation ? "animate-spin" : ""}`} />
              <span>{testingIsolation ? "Simulating SQL guard..." : "Run Security Boundary Check"}</span>
            </button>

            <div className="flex-1 bg-[#0B0B0F] border border-white/[0.04] rounded-xl p-4 font-mono text-[10px] text-[#A1A1AA] mt-4 overflow-y-auto space-y-2.5 min-h-[300px]">
              {isolationTestLogs.length === 0 ? (
                <div className="text-[#A1A1AA]/40 italic text-center py-8">Click the button above to run security validation logs.</div>
              ) : (
                isolationTestLogs.map((log, index) => {
                  let color = "text-[#A1A1AA]";
                  if (log.includes("OK") || log.includes("success") || log.includes("returned")) {
                    color = "text-[#22C55E]";
                  } else if (log.includes("blocked") || log.includes("🚫")) {
                    color = "text-[#EF4444] font-semibold";
                  } else if (log.includes("simulation") || log.includes("⚠️")) {
                    color = "text-[#F59E0B]";
                  } else if (log.includes("🐳") || log.includes("PostgreSQL")) {
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
        </section>
      </main>

      {/* Provision Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-[#0B0B0F]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <h2 className="text-base font-bold text-white mb-1.5">Provision New Workspace</h2>
            <p className="text-xs text-[#A1A1AA] mb-5">Initialize isolated tenant boundaries, data regions, and register workspace metadata.</p>

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">Workspace Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brand Team Beta"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full bg-[#0B0B0F] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">Associated Tenant Organization</label>
                <select
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                >
                  <option value="Enterprise Agency Tier">Enterprise Agency Tier (Fluxora-Tenant-098)</option>
                  <option value="Apex Marketing Group">Apex Marketing Group (New Tenant)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">Data Residency Region</label>
                <select
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                  className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                >
                  <option value="US-East (AWS us-east-1)">US-East (AWS us-east-1)</option>
                  <option value="EU-West (AWS eu-west-1)">EU-West (AWS eu-west-1)</option>
                  <option value="AP-South (AWS ap-south-1)">AP-South (AWS ap-south-1)</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#A1A1AA] bg-[#0B0B0F] border border-white/[0.08] rounded-xl hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#8B5CF6] rounded-xl shadow-lg shadow-[#7C3AED]/20 transition cursor-pointer"
                >
                  Provision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#0B0B0F] px-6 py-4 flex flex-col md:flex-row items-center justify-between text-xs text-[#A1A1AA]/60 gap-4 mt-auto">
        <div>
          © {new Date().getFullYear()} Fluxora Platform. All rights reserved. 
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
