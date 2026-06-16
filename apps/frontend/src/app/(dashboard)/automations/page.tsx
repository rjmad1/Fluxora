"use client";

import React from "react";
import { useAppContext } from "@/context/AppContext";
import AutomationBuilder from "@/components/AutomationBuilder";
import ThirdPartyConnectors from "@/components/ThirdPartyConnectors";
import TelegramAutomation from "@/components/TelegramAutomation";
import EvergreenManager from "@/components/EvergreenManager";

export default function AutomationsPage() {
  const { automationsSubTab, setAutomationsSubTab, setActivityLogs } = useAppContext();

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
          <h2 className="text-3xl font-bold tracking-tight text-white">Automations Hub</h2>
          <p className="text-xs text-[#A1A1AA] mt-1">Design visual workflow triggers, hook up 3rd party nodes, or configure Telegram bots.</p>
        </div>

        {/* Sub-tab selection */}
        <div className="bg-[#0B0B0F] border border-white/[0.08] p-1.5 rounded-xl flex gap-1.5">
          {(["builder", "thirdparty", "telegram", "evergreen"] as const).map((sub) => (
            <button
              key={sub}
              onClick={() => setAutomationsSubTab(sub)}
              className={`px-4.5 py-2 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                automationsSubTab === sub ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-white"
              }`}
            >
              {sub === "builder" ? "Visual Workflow Map" : sub === "thirdparty" ? "Third-Party Connectors" : sub === "telegram" ? "Telegram Automation" : "Evergreen Queue"}
            </button>
          ))}
        </div>
      </div>

      {automationsSubTab === "builder" && (
        <AutomationBuilder onNotify={handleNotify} />
      )}
      {automationsSubTab === "thirdparty" && (
        <ThirdPartyConnectors onNotify={handleNotify} />
      )}
      {automationsSubTab === "telegram" && (
        <TelegramAutomation onNotify={handleNotify} />
      )}
      {automationsSubTab === "evergreen" && (
        <EvergreenManager onNotify={handleNotify} />
      )}
    </div>
  );
}
