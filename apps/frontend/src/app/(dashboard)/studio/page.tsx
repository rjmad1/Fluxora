"use client";

import React from "react";
import { useAppContext } from "@/context/AppContext";
import Composer from "@/components/Composer";
import CanvasDesigner from "@/components/CanvasDesigner";
import TeamHub from "@/components/TeamHub";
import PlatformToggleConsole from "@/components/PlatformToggleConsole";
import MediaTransformer from "@/components/MediaTransformer";

export default function StudioPage() {
  const { studioSubTab, setStudioSubTab, setActivityLogs } = useAppContext();

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
          <h2 className="text-3xl font-bold tracking-tight text-white">Content Studio</h2>
          <p className="text-xs text-[#A1A1AA] mt-1">Design graphics, compose copy, and manage team workflows in one central location.</p>
        </div>

        {/* Sub-tab selection */}
        <div className="bg-[#0B0B0F] border border-white/[0.08] p-1.5 rounded-xl flex gap-1.5">
          {(["composer", "designer", "transformer", "team", "platform"] as const).map((sub) => (
            <button
              key={sub}
              onClick={() => setStudioSubTab(sub)}
              className={`px-4.5 py-2 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                studioSubTab === sub ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-white"
              }`}
            >
              {sub === "composer" ? "Composer" : sub === "designer" ? "Graphic Designer" : sub === "transformer" ? "Media Studio" : sub === "team" ? "Team & Tasks" : "Platform Console"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {studioSubTab === "composer" && (
          <Composer />
        )}
        {studioSubTab === "designer" && (
          <CanvasDesigner onNotify={handleNotify} />
        )}
        {studioSubTab === "team" && (
          <TeamHub onNotify={handleNotify} />
        )}
        {studioSubTab === "platform" && (
          <PlatformToggleConsole onNotify={handleNotify} />
        )}
        {studioSubTab === "transformer" && (
          <MediaTransformer onNotify={handleNotify} />
        )}
      </div>
    </div>
  );
}
