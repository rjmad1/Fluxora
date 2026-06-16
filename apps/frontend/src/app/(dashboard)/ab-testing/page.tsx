"use client";

import React from "react";
import { useAppContext } from "@/context/AppContext";
import ABTestingConsole from "@/components/ABTestingConsole";

export default function AbTestingPage() {
  const { setActivityLogs } = useAppContext();

  const handleNotify = (msg: string, level: "INFO" | "AUDIT" | "WARN") => {
    const timestamp = new Date().toLocaleTimeString();
    setActivityLogs((prev) => [
      ...prev,
      { id: Date.now().toString(), timestamp, level, msg },
    ]);
  };

  return <ABTestingConsole onNotify={handleNotify} />;
}
