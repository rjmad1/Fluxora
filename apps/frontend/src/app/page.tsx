"use client";

import { useState } from "react";
import Link from "next/link";
import Composer from "@/components/Composer";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

export default function Home() {
  const [activeWorkspace, setActiveWorkspace] = useState("Workspace A (Brand Operations)");

  const workspaces = [
    { id: "ws-1", name: "Workspace A (Brand Operations)", tenant: "Enterprise Agency Tier", region: "US-East" },
    { id: "ws-2", name: "Workspace B (Global Marketing)", tenant: "Enterprise Agency Tier", region: "EU-West" },
  ];

  const connectedAccounts = [
    { provider: "LinkedIn", name: "Fluxora Enterprise", avatar: "FL", status: "Active (Vault Vaulted)", lastRefreshed: "2 mins ago" },
    { provider: "Twitter / X", name: "@FluxoraApp", avatar: "FX", status: "Active (Vault Vaulted)", lastRefreshed: "12 mins ago" },
    { provider: "Facebook", name: "Fluxora Social", avatar: "FS", status: "Active (Vault Vaulted)", lastRefreshed: "1 hour ago" },
  ];

  const activeWorkflows = [
    { id: "WF-1092", type: "PostPublishingWorkflow", target: "LinkedIn, Twitter", scheduled: "2026-06-16 10:00 AM", status: "Scheduled" },
    { id: "WF-1093", type: "TokenLifecycleWorkflow", target: "Twitter / X Refresh", scheduled: "2026-06-15 11:45 PM", status: "Running" },
    { id: "WF-1094", type: "ApprovalLoopWorkflow", target: "Facebook Variant", scheduled: "Pending client review", status: "Pending" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-extrabold text-xl text-white tracking-wider">F</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Fluxora</h1>
            <p className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase">Social Media Blast</p>
          </div>
        </div>

        {/* Workspace Quick Switcher & Admin tools */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-medium">Workspace Context:</label>
            <select 
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200 cursor-pointer"
              value={activeWorkspace}
              onChange={(e) => setActiveWorkspace(e.target.value)}
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.name}>{ws.name} ({ws.region})</option>
              ))}
            </select>
          </div>
          <Link
            href="/workspaces"
            className="text-xs font-bold bg-indigo-650 hover:bg-indigo-600 border border-indigo-600 rounded-lg px-3.5 py-1.5 text-white transition cursor-pointer"
          >
            Manage Workspaces
          </Link>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Sidebar: Connected Accounts & RLS Isolation Info */}
        <section className="xl:col-span-1 flex flex-col gap-6">
          {/* Identity & Tenancy Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Secure Tenant Context
            </h2>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Tenant Identity</span>
                <span className="text-indigo-400 font-semibold">Fluxora-Tenant-098</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">RLS Enforcement</span>
                <span className="text-emerald-400 font-semibold">Enabled (Postgres 16)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Token Vaulting</span>
                <span className="text-emerald-400 font-semibold">HashiCorp Vault KV</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Telemetry Stream</span>
                <span className="text-purple-400 font-semibold">Kafka Connected</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-indigo-950/40 border border-indigo-900/40 rounded-xl text-[11px] text-indigo-300">
              ⚡ Multi-tenant Row-Level Security (RLS) ensures that all operations in <strong className="text-indigo-200">{activeWorkspace}</strong> are strictly isolated at the SQL query layer.
            </div>
          </div>

          {/* Vault-secured integrations */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Connected Accounts</h2>
              <span className="text-[10px] bg-slate-800 text-indigo-400 px-2 py-0.5 rounded-full font-mono border border-slate-700">Vault Store</span>
            </div>
            <div className="space-y-4">
              {connectedAccounts.map((account) => (
                <div key={account.provider} className="flex items-start justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-sm">
                      {account.avatar}
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-slate-200">{account.provider}</h3>
                      <p className="text-[10px] text-slate-400">{account.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-[9px] text-emerald-400 bg-emerald-950/50 border border-emerald-900/50 px-2 py-0.5 rounded-full font-semibold">
                      {account.status}
                    </span>
                    <p className="text-[9px] text-slate-500 mt-1 font-mono">Sync: {account.lastRefreshed}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick ClickHouse Analytics Summary */}
          <AnalyticsDashboard />
        </section>

        {/* Center Section: Unified Omnichannel Composer */}
        <section className="xl:col-span-2">
          <Composer />
        </section>

        {/* Right Section: Active Temporal Workflows & Logs */}
        <section className="xl:col-span-1 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Temporal Workflows</span>
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
            </h2>
            <div className="space-y-3">
              {activeWorkflows.map((wf) => (
                <div key={wf.id} className="p-3 bg-slate-950 border border-slate-850 rounded-xl hover:border-slate-800 transition">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-mono text-indigo-400 font-semibold">{wf.id}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      wf.status === "Scheduled" 
                        ? "bg-blue-950/40 text-blue-400 border border-blue-900/40"
                        : wf.status === "Running"
                        ? "bg-indigo-950/40 text-indigo-400 border border-indigo-900/40 animate-pulse"
                        : "bg-amber-950/40 text-amber-400 border border-amber-900/40"
                    }`}>
                      {wf.status}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-200 mt-1">{wf.type}</h3>
                  <p className="text-[10px] text-slate-400 mt-1">{wf.target}</p>
                  <p className="text-[9px] text-slate-500 mt-1.5 font-mono">{wf.scheduled}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex-1 flex flex-col">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Transactional Audit Stream</h2>
            <div className="flex-1 bg-slate-950 border border-slate-850 rounded-xl p-3 font-mono text-[9px] text-slate-400 overflow-y-auto space-y-2 max-h-[220px]">
              <div>
                <span className="text-slate-600">[2026-06-15 06:30:12]</span> <span className="text-indigo-400">INFO</span> tenant.created (ID: tenant-098)
              </div>
              <div>
                <span className="text-slate-600">[2026-06-15 06:31:05]</span> <span className="text-indigo-400">INFO</span> workspace.created (ID: ws-1)
              </div>
              <div>
                <span className="text-slate-600">[2026-06-15 06:32:44]</span> <span className="text-indigo-400">INFO</span> token.refreshed (Platform: Twitter)
              </div>
              <div>
                <span className="text-slate-600">[2026-06-15 06:34:10]</span> <span className="text-purple-400">AUDIT</span> token.write_vault (Account: LinkedIn)
              </div>
              <div className="text-slate-500">
                &gt; Listening on topic: fluxora.audit.log...
              </div>
            </div>
          </div>
        </section>
      </main>

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
