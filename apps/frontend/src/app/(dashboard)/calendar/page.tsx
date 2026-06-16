"use client";

import React from "react";
import { useAppContext } from "@/context/AppContext";
import VisualCalendar from "@/components/VisualCalendar";

export default function CalendarPage() {
  const { setActivityLogs } = useAppContext();

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
        <h2 className="text-3xl font-bold tracking-tight text-white">Visual Content Calendar</h2>
        <p className="text-xs text-[#A1A1AA] mt-1">Plan, edit, and organize scheduled posts across all active workspaces.</p>
      </div>
      <VisualCalendar onNotify={handleNotify} />
    </div>
  );
}
