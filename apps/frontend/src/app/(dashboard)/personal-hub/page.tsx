"use client";

import React from "react";
import { useAppContext } from "@/context/AppContext";
import PersonalHubDashboard from "@/components/PersonalHubDashboard";
import DigitalTwinConfig from "@/components/DigitalTwinConfig";
import CareerOSComponent from "@/components/CareerOSComponent";
import AuthorityMapping from "@/components/AuthorityMapping";

export default function PersonalHubPage() {
  const { personalHubSection, setPersonalHubSection, setActivityLogs } = useAppContext();

  const handleNotify = (msg: string, level: "INFO" | "AUDIT" | "WARN") => {
    const timestamp = new Date().toLocaleTimeString();
    setActivityLogs((prev) => [
      ...prev,
      { id: Date.now().toString(), timestamp, level, msg },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Personal Hub Sub Navigation */}
      <div className="flex flex-wrap gap-2 bg-[#121218] border border-white/[0.08] p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setPersonalHubSection("overview")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
            personalHubSection === "overview"
              ? "bg-[#7C3AED] text-white"
              : "text-[#A1A1AA] hover:text-white"
          }`}
        >
          Personal Brand Dashboard
        </button>
        <button
          onClick={() => setPersonalHubSection("authority")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
            personalHubSection === "authority"
              ? "bg-[#7C3AED] text-white"
              : "text-[#A1A1AA] hover:text-white"
          }`}
        >
          Authority Mapping Graph
        </button>
        <button
          onClick={() => setPersonalHubSection("twin")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
            personalHubSection === "twin"
              ? "bg-[#7C3AED] text-white"
              : "text-[#A1A1AA] hover:text-white"
          }`}
        >
          Digital Twin Control
        </button>
        <button
          onClick={() => setPersonalHubSection("career")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
            personalHubSection === "career"
              ? "bg-[#7C3AED] text-white"
              : "text-[#A1A1AA] hover:text-white"
          }`}
        >
          Career OS Map
        </button>
      </div>

      {/* Sub-tab views */}
      {personalHubSection === "overview" && (
        <PersonalHubDashboard onNotify={handleNotify} />
      )}

      {personalHubSection === "authority" && (
        <AuthorityMapping onNotify={handleNotify} />
      )}

      {personalHubSection === "twin" && (
        <DigitalTwinConfig onNotify={handleNotify} />
      )}

      {personalHubSection === "career" && (
        <CareerOSComponent onNotify={handleNotify} />
      )}
    </div>
  );
}
