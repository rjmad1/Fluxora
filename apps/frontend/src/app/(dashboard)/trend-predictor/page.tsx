"use client";

import React, { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import TrendPredictor from "@/components/TrendPredictor";
import TopicDiscoveryWorkspace from "@/components/TopicDiscoveryWorkspace";
import ContentCalendarGenerator from "@/components/ContentCalendarGenerator";

export default function TrendPredictorPage() {
  const { setActivityLogs, setComposerContent, setDrawerOpen } = useAppContext();
  const [activeSubTab, setActiveSubTab] = useState<"forecasting" | "discovery" | "calendar">("forecasting");

  const handleNotify = (msg: string, level: "INFO" | "AUDIT" | "WARN") => {
    const timestamp = new Date().toLocaleTimeString();
    setActivityLogs((prev) => [
      ...prev,
      { id: Date.now().toString(), timestamp, level, msg },
    ]);
  };

  const handleSelectAngle = (angleText: string) => {
    setComposerContent(angleText);
    setDrawerOpen(true);
  };

  const handlePublishLater = (content: string) => {
    setComposerContent(content);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 bg-[#121218] border border-white/[0.08] p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveSubTab("forecasting")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
            activeSubTab === "forecasting"
              ? "bg-[#7C3AED] text-white"
              : "text-[#A1A1AA] hover:text-white"
          }`}
        >
          Forecasting & Virality
        </button>
        <button
          onClick={() => setActiveSubTab("discovery")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
            activeSubTab === "discovery"
              ? "bg-[#7C3AED] text-white"
              : "text-[#A1A1AA] hover:text-white"
          }`}
        >
          Topic Discovery Engine
        </button>
        <button
          onClick={() => setActiveSubTab("calendar")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
            activeSubTab === "calendar"
              ? "bg-[#7C3AED] text-white"
              : "text-[#A1A1AA] hover:text-white"
          }`}
        >
          30-Day Content Calendar
        </button>
      </div>

      {/* Render sub-view */}
      {activeSubTab === "forecasting" && (
        <TrendPredictor onNotify={handleNotify} />
      )}
      {activeSubTab === "discovery" && (
        <TopicDiscoveryWorkspace onNotify={handleNotify} onSelectAngle={handleSelectAngle} />
      )}
      {activeSubTab === "calendar" && (
        <ContentCalendarGenerator
          onNotify={handleNotify}
          onSelectAngle={handleSelectAngle}
          onPublishLater={handlePublishLater}
        />
      )}
    </div>
  );
}
