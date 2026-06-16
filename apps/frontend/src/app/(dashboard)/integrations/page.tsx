"use client";

import React from "react";
import { useAppContext } from "@/context/AppContext";
import DeveloperPortal from "@/components/DeveloperPortal";
import * as Icons from "lucide-react";

export default function IntegrationsPage() {
  const { integrationsSubTab, setIntegrationsSubTab, setActivityLogs } = useAppContext();

  const handleNotify = (msg: string, level: "INFO" | "AUDIT" | "WARN") => {
    const timestamp = new Date().toLocaleTimeString();
    setActivityLogs((prev) => [
      ...prev,
      { id: Date.now().toString(), timestamp, level, msg },
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#121218] border border-white/[0.08] p-5 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Integrations & API</h2>
          <p className="text-xs text-[#A1A1AA] mt-1">Connect API channels, provision webhooks, and manage developer OAuth credentials.</p>
        </div>

        {/* Sub tabs selector */}
        <div className="bg-[#0B0B0F] border border-white/[0.08] p-1.5 rounded-xl flex gap-1.5">
          {(["marketplace", "developer"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setIntegrationsSubTab(tab)}
              className={`px-4.5 py-2 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                integrationsSubTab === tab ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-white"
              }`}
            >
              {tab === "marketplace" ? "App Marketplace" : "Developer Portal"}
            </button>
          ))}
        </div>
      </div>

      {integrationsSubTab === "marketplace" ? (
        <div className="space-y-6">
          {/* Category selection */}
          <div className="flex gap-2.5">
            {["All", "Social", "AI", "Video", "CMS", "Automation"].map((cat) => (
              <button
                key={cat}
                className="px-3.5 py-1.5 bg-[#121218] hover:bg-[#181821] border border-white/[0.06] rounded-xl text-xs font-semibold text-[#A1A1AA] hover:text-white transition cursor-pointer"
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Marketplace Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#121218] border border-white/[0.08] hover:border-[#7C3AED]/35 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition duration-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-900/20 border border-blue-900/30 flex items-center justify-center text-blue-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                      <rect x="2" y="9" width="4" height="12" />
                      <circle cx="4" cy="4" r="2" />
                    </svg>
                  </div>
                  <span className="text-[9px] bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 px-2 py-0.5 rounded-full font-semibold">Connected</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">LinkedIn Publisher</h4>
                  <p className="text-xs text-[#A1A1AA] mt-1">Auto-publish updates, articles, and media attachments to LinkedIn corporate pages.</p>
                </div>
              </div>
              <div className="flex gap-2.5 mt-6 pt-4 border-t border-white/[0.04]">
                <button className="flex-1 bg-[#0B0B0F] hover:bg-[#181821] border border-white/[0.08] text-xs font-semibold text-white py-2 rounded-xl transition cursor-pointer">Settings</button>
                <button className="text-[11px] text-[#EF4444] font-semibold hover:underline px-2 cursor-pointer">Disconnect</button>
              </div>
            </div>

            <div className="bg-[#121218] border border-white/[0.08] hover:border-[#7C3AED]/35 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition duration-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-900/20 border border-purple-900/30 flex items-center justify-center">
                    <Icons.Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-[9px] bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 px-2 py-0.5 rounded-full font-semibold">Active</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">OpenAI Intelligence</h4>
                  <p className="text-xs text-[#A1A1AA] mt-1">Provide AI prompts processing, brand-voice adjustments, and visual post ideas generator.</p>
                </div>
              </div>
              <div className="flex gap-2.5 mt-6 pt-4 border-t border-white/[0.04]">
                <button className="flex-1 bg-[#0B0B0F] hover:bg-[#181821] border border-white/[0.08] text-xs font-semibold text-white py-2 rounded-xl transition cursor-pointer">Settings</button>
                <button className="text-[11px] text-[#EF4444] font-semibold hover:underline px-2 cursor-pointer">Disconnect</button>
              </div>
            </div>

            <div className="bg-[#121218] border border-white/[0.08] hover:border-[#7C3AED]/35 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition duration-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                    <Icons.Cpu className="w-5 h-5 text-white/60" />
                  </div>
                  <span className="text-[9px] bg-white/[0.06] text-[#A1A1AA] border border-white/[0.08] px-2 py-0.5 rounded-full font-semibold">Not Configured</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Make.com / Integromat</h4>
                  <p className="text-xs text-[#A1A1AA] mt-1">Synchronize campaign workflows with hundreds of 3rd party applications automatically.</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.04]">
                <button className="w-full bg-[#7C3AED] hover:bg-[#8B5CF6] text-xs font-bold text-white py-2 rounded-xl transition cursor-pointer">Connect Integration</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <DeveloperPortal onNotify={handleNotify} />
      )}
    </div>
  );
}
