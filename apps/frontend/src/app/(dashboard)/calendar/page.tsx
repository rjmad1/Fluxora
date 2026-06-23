"use client";

import React, { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import VisualCalendar from "@/components/VisualCalendar";
import PublishingWorkspace from "@/components/PublishingWorkspace";

export default function CalendarPage() {
  const { setActivityLogs } = useAppContext();
  const [activeSubTab, setActiveSubTab] = useState<"calendar" | "queue">("calendar");

  const handleNotify = (msg: string, level: "INFO" | "AUDIT" | "WARN") => {
    const timestamp = new Date().toLocaleTimeString();
    setActivityLogs((prev) => [
      ...prev,
      { id: Date.now().toString(), timestamp, level, msg },
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Visual Content Calendar</h2>
          <p className="text-xs text-[#A1A1AA] mt-1">Plan, edit, and organize scheduled posts across all active workspaces.</p>
        </div>

        {/* Tab Selector */}
        <div className="bg-[#121218] border border-white/[0.08] p-1 rounded-xl flex gap-1">
          <button
            onClick={() => setActiveSubTab("calendar")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeSubTab === "calendar" ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-white"
            }`}
          >
            Visual Calendar
          </button>
          <button
            onClick={() => setActiveSubTab("queue")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeSubTab === "queue" ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-white"
            }`}
          >
            Publishing Queue
          </button>
        </div>
      </div>

      {activeSubTab === "calendar" ? (
        <VisualCalendar onNotify={handleNotify} />
      ) : (
        <PublishingWorkspace onNotify={handleNotify} />
      )}
    </div>
  );
}
