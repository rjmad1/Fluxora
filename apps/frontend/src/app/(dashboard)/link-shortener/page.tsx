"use client";

import React from "react";
import { useAppContext } from "@/context/AppContext";
import LinkShortener from "@/components/LinkShortener";

export default function LinkShortenerPage() {
  const { setActivityLogs } = useAppContext();

  const handleNotify = (msg: string, level: "INFO" | "AUDIT" | "WARN") => {
    const timestamp = new Date().toLocaleTimeString();
    setActivityLogs((prev) => [
      ...prev,
      { id: Date.now().toString(), timestamp, level, msg },
    ]);
  };

  return <LinkShortener onNotify={handleNotify} />;
}
