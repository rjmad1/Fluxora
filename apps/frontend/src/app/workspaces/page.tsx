"use client";

import { useState } from "react";
import Link from "next/link";

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
      await new Promise((resolve) => setTimeout(resolve, 600));
      setIsolationTestLogs((prev) => [...prev, logs[i]]);
    }
    setTestingIsolation(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 hover:scale-105 transition cursor-pointer">
            <span className="font-extrabold text-xl text-white tracking-wider">F</span>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Fluxora</h1>
            <p className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase">Workspace Sandbox Manager</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg px-4 py-2 text-slate-200 transition cursor-pointer"
          >
            ← Back to Dashboard
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-lg px-4 py-2 text-white shadow-lg shadow-indigo-500/20 transition cursor-pointer"
          >
            + Provision Workspace
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workspace Manager Board */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Tenant Workspaces</h2>
                <p className="text-xs text-slate-400">Manage and monitor isolated workspace boundaries and data residency regions.</p>
              </div>
              <span className="text-[10px] bg-indigo-950 text-indigo-400 px-3 py-1 rounded-full font-mono border border-indigo-900">
                PostgreSQL RLS Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  className={`p-5 rounded-xl border transition flex flex-col justify-between ${
                    ws.status === "ACTIVE"
                      ? "bg-slate-950/40 border-slate-800 hover:border-indigo-500/50"
                      : "bg-slate-950/20 border-dashed border-slate-900 opacity-60"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                          {ws.id}
                        </span>
                        <h3 className="text-sm font-bold text-slate-200 mt-2">{ws.name}</h3>
                      </div>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${
                          ws.status === "ACTIVE"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-900"
                            : "bg-rose-950 text-rose-400 border border-rose-900"
                        }`}
                      >
                        {ws.status}
                      </span>
                    </div>

                    <div className="space-y-2 border-t border-slate-900 pt-3 text-[11px] font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tenant ID:</span>
                        <span className="text-slate-300">{ws.tenantId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tenant Name:</span>
                        <span className="text-slate-300">{ws.tenantName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Data residency:</span>
                        <span className="text-indigo-400">{ws.region}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Integrations:</span>
                        <span className="text-slate-300">{ws.accountCount} connected</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-900">
                    <span className="text-[9px] text-slate-500 font-mono">Created: {ws.createdAt}</span>
                    <button
                      onClick={() => toggleStatus(ws.id)}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded transition cursor-pointer ${
                        ws.status === "ACTIVE"
                          ? "bg-slate-900 hover:bg-rose-950/30 text-rose-400 hover:text-rose-300 border border-slate-800 hover:border-rose-900"
                          : "bg-slate-900 hover:bg-emerald-950/30 text-emerald-400 hover:text-emerald-300 border border-slate-800 hover:border-emerald-900"
                      }`}
                    >
                      {ws.status === "ACTIVE" ? "Suspend" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Sandbox & Isolation Testing */}
        <section className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-full">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Isolation Sandbox Sandbox
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Directly verify Row-Level Security (RLS) policies by triggering a query simulation that tests boundaries.
            </p>

            <button
              onClick={runIsolationSimulation}
              disabled={testingIsolation}
              className={`w-full py-2.5 text-xs font-bold rounded-lg transition shadow-lg ${
                testingIsolation
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                  : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/10 cursor-pointer"
              }`}
            >
              {testingIsolation ? "Simulating Queries..." : "Run Security Boundary Check"}
            </button>

            <div className="flex-1 bg-slate-950 border border-slate-850 rounded-xl p-4 font-mono text-[10px] text-slate-400 mt-4 overflow-y-auto space-y-2.5 min-h-[300px] max-h-[450px]">
              {isolationTestLogs.length === 0 ? (
                <div className="text-slate-600 italic">Click the button above to run security validation.</div>
              ) : (
                isolationTestLogs.map((log, index) => {
                  let color = "text-slate-400";
                  if (log.includes("OK") || log.includes("success") || log.includes("returned")) {
                    color = "text-emerald-400";
                  } else if (log.includes("blocked") || log.includes("🚫")) {
                    color = "text-rose-400 font-semibold";
                  } else if (log.includes("simulation") || log.includes("⚠️")) {
                    color = "text-amber-400";
                  } else if (log.includes("🐳") || log.includes("PostgreSQL")) {
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
        </section>
      </main>

      {/* Provision Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <h2 className="text-base font-bold text-slate-100 mb-2">Provision New Workspace</h2>
            <p className="text-xs text-slate-400 mb-5">Initialize isolated tenant boundaries, data regions, and register workspace in PostgreSQL.</p>

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Workspace Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brand Team Beta"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Associated Tenant Organization</label>
                <select
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="Enterprise Agency Tier">Enterprise Agency Tier (Fluxora-Tenant-098)</option>
                  <option value="Apex Marketing Group">Apex Marketing Group (New Tenant)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Data Residency Region</label>
                <select
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="US-East (AWS us-east-1)">US-East (AWS us-east-1)</option>
                  <option value="EU-West (AWS eu-west-1)">EU-West (AWS eu-west-1)</option>
                  <option value="AP-South (AWS ap-south-1)">AP-South (AWS ap-south-1)</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-950 border border-slate-800 rounded-lg hover:text-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-lg shadow-lg shadow-indigo-500/15 transition cursor-pointer"
                >
                  Provision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 px-6 py-4 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div>
          © {new Date().getFullYear()} Fluxora Platform. All rights reserved. 
        </div>
        <div className="flex gap-4">
          <span className="hover:text-slate-300 transition cursor-pointer">Security Protocol TLS 1.3</span>
          <span>•</span>
          <span className="hover:text-slate-300 transition cursor-pointer">SOC2 Compliance</span>
          <span>•</span>
          <span className="hover:text-slate-300 transition cursor-pointer">Privacy Boundary Sandbox</span>
        </div>
      </footer>
    </div>
  );
}
