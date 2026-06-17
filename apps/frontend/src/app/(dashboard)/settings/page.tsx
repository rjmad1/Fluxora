"use client";

import React from "react";
import { useAppContext } from "@/context/AppContext";
import NotificationConfig from "@/components/NotificationConfig";
import SelfHostedConfig from "@/components/SelfHostedConfig";
import IdentityGraphVisualizer from "@/components/IdentityGraphVisualizer";

export default function SettingsPage() {
  const {
    settingsSidebarSubTab,
    setSettingsSidebarSubTab,
    maintenanceEnabled,
    setMaintenanceEnabled,
    setActivityLogs,
  } = useAppContext();

  const handleNotify = (msg: string, level: "INFO" | "AUDIT" | "WARN") => {
    const timestamp = new Date().toLocaleTimeString();
    setActivityLogs((prev) => [
      ...prev,
      { id: Date.now().toString(), timestamp, level, msg },
    ]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Settings Hub</h2>
        <p className="text-xs text-[#A1A1AA] mt-1">Configure global notification pathways, secure API keys, and developer webhook payloads.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-xl relative">
        {/* Settings Sidebar */}
        <div className="space-y-1 md:border-r border-white/[0.08] pr-4">
          {["Workspace", "Team", "Notifications", "Security", "API Keys", "Billing", "Developer", "Self-Hosted Deployment", "Identity Resolution"].map((sect) => {
            const isSelfHosted = sect === "Self-Hosted Deployment";
            const isNotifications = sect === "Notifications";
            const isIdentity = sect === "Identity Resolution";
            const targetSubTab = isSelfHosted ? "selfhosted" : isNotifications ? "notifications" : isIdentity ? "identity" : "general";
            const isActive = settingsSidebarSubTab === targetSubTab;
            return (
              <button
                key={sect}
                onClick={() => setSettingsSidebarSubTab(targetSubTab)}
                className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-white/[0.02] transition cursor-pointer ${
                  isActive
                    ? "text-white bg-white/[0.04]"
                    : "text-[#A1A1AA]"
                }`}
              >
                {sect}
              </button>
            );
          })}
        </div>

        {/* Form Content */}
        <div className="md:col-span-3 space-y-6">
          {settingsSidebarSubTab === "general" && (
            <>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">API Configurations</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase text-[#A1A1AA] tracking-wider block mb-1.5 font-bold">Secure Access Token Key</label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        readOnly
                        value="fluxora_live_2b86556e9c991e6ad65f6f"
                        className="flex-1 bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none"
                      />
                      <button
                        onClick={() => alert("Token Copied!")}
                        className="bg-[#121218] hover:bg-[#181821] border border-white/[0.08] text-xs font-bold text-white px-4 rounded-xl transition cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Webhook Subscriptions</h3>
                <div className="p-4 bg-[#0B0B0F]/50 border border-white/[0.04] rounded-xl text-xs text-[#A1A1AA] leading-relaxed">
                  ⚙ Currently listening for post actions on topic <strong>fluxora.audit.log</strong>. Webhook endpoints route notifications to client sandboxes immediately.
                </div>
              </div>

              {/* Sticky save bar simulator */}
              <div className="bg-[#121218] border-t border-white/[0.08] pt-4 flex justify-end gap-3">
                <button className="px-4 py-2 bg-[#0B0B0F] hover:bg-[#181821] border border-white/[0.08] rounded-xl text-xs font-semibold text-white transition cursor-pointer">Reset</button>
                <button
                  onClick={() => alert("Configuration settings saved successfully!")}
                  className="px-5 py-2 bg-[#7C3AED] hover:bg-[#8B5CF6] rounded-xl text-xs font-bold text-white shadow-lg shadow-[#7C3AED]/20 transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </>
          )}
          {settingsSidebarSubTab === "notifications" && (
            <NotificationConfig
              onNotify={handleNotify}
              maintenanceEnabled={maintenanceEnabled}
              onToggleMaintenance={setMaintenanceEnabled}
            />
          )}
          {settingsSidebarSubTab === "selfhosted" && (
            <SelfHostedConfig onNotify={handleNotify} />
          )}
          {settingsSidebarSubTab === "identity" && (
            <IdentityGraphVisualizer onNotify={handleNotify} />
          )}
        </div>
      </div>
    </div>
  );
}
