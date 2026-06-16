"use client";

import React from "react";
import { useAppContext } from "@/context/AppContext";
import BrandWorkspaceManager from "@/components/BrandWorkspaceManager";

export default function WorkspacePage() {
  const { activeWorkspace, setActiveWorkspace, setActivityLogs } = useAppContext();

  const handleNotify = (msg: string, level: "INFO" | "AUDIT" | "WARN") => {
    const timestamp = new Date().toLocaleTimeString();
    setActivityLogs((prev) => [
      ...prev,
      { id: Date.now().toString(), timestamp, level, msg },
    ]);
  };

  return (
    <BrandWorkspaceManager
      onNotify={handleNotify}
      activeWorkspaceName={activeWorkspace}
      onWorkspaceChange={setActiveWorkspace}
    />
  );
}
