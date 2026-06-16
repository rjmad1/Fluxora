"use client";

import React from "react";
import { useAppContext } from "@/context/AppContext";
import AIContentAssistant from "@/components/AIContentAssistant";
import AgentCLIAndMCP from "@/components/AgentCLIAndMCP";

export default function AgentPage() {
  const {
    agentSubTab,
    setAgentSubTab,
    setActivityLogs,
    setComposerContent,
    setDrawerOpen,
  } = useAppContext();

  const handleNotify = (msg: string, level: "INFO" | "AUDIT" | "WARN") => {
    const timestamp = new Date().toLocaleTimeString();
    setActivityLogs((prev) => [
      ...prev,
      { id: Date.now().toString(), timestamp, level, msg },
    ]);
  };

  const handleSendToComposer = (text: string) => {
    setComposerContent(text);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#121218] border border-white/[0.08] p-5 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">AI Agent Studio</h2>
          <p className="text-xs text-[#A1A1AA] mt-1">Generate, refine, and adapt social copy with brand voice and autonomous CLI models.</p>
        </div>

        {/* Sub-tab selection */}
        <div className="bg-[#0B0B0F] border border-white/[0.08] p-1.5 rounded-xl flex gap-1.5">
          {(["assistant", "cli"] as const).map((sub) => (
            <button
              key={sub}
              onClick={() => setAgentSubTab(sub)}
              className={`px-4.5 py-2 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                agentSubTab === sub ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-white"
              }`}
            >
              {sub === "assistant" ? "AI Copy Assistant" : "Agent CLI & MCP Server"}
            </button>
          ))}
        </div>
      </div>

      {agentSubTab === "assistant" ? (
        <AIContentAssistant
          onNotify={handleNotify}
          onSendToComposer={handleSendToComposer}
        />
      ) : (
        <AgentCLIAndMCP onNotify={handleNotify} />
      )}
    </div>
  );
}
