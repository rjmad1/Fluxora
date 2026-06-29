"use client";

import React from "react";
import { useAppContext } from "@/context/AppContext";
import SocialListening from "@/components/SocialListening";

export default function ListeningPage() {
  const { setActivityLogs } = useAppContext();

  const handleNotify = (msg: string, level: "INFO" | "AUDIT" | "WARN" | "ERROR") => {
    const timestamp = new Date().toLocaleTimeString();
    setActivityLogs((prev) => [
      ...prev,
      { id: Date.now().toString(), timestamp, level, msg },
    ]);
  };

  return <SocialListening onNotify={handleNotify} />;
}
