"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease" | "neutral";
    label?: string;
  };
  sparklineData?: number[];
  icon?: React.ReactNode;
}

export default function DashboardCard({ title, value, change, sparklineData, icon }: DashboardCardProps) {
  // Render a mini SVG sparkline if data exists
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    const width = 80;
    const height = 24;
    const padding = 2;
    const maxVal = Math.max(...sparklineData);
    const minVal = Math.min(...sparklineData);
    const range = maxVal - minVal || 1;

    const points = sparklineData
      .map((val, index) => {
        const x = (index / (sparklineData.length - 1)) * (width - padding * 2) + padding;
        const y = height - ((val - minVal) / range) * (height - padding * 2) - padding;
        return `${x},${y}`;
      })
      .join(" ");

    const strokeColor = change?.type === "decrease" ? "#EF4444" : "#22C55E";

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className="bg-[#121218] border border-white/[0.08] hover:border-white/[0.12] rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all duration-200 hover:translate-y-[-1px]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[#A1A1AA] tracking-wider uppercase">{title}</span>
        {icon && <div className="text-[#A1A1AA]/60">{icon}</div>}
      </div>

      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
        {renderSparkline()}
      </div>

      {change && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/[0.04]">
          <span
            className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              change.type === "increase"
                ? "bg-[#22C55E]/10 text-[#22C55E]"
                : change.type === "decrease"
                ? "bg-[#EF4444]/10 text-[#EF4444]"
                : "bg-white/[0.06] text-[#A1A1AA]"
            }`}
          >
            {change.type === "increase" && <ArrowUpRight className="w-3 h-3 mr-0.5" />}
            {change.type === "decrease" && <ArrowDownRight className="w-3 h-3 mr-0.5" />}
            {change.type === "neutral" && <Minus className="w-3 h-3 mr-0.5" />}
            {Math.abs(change.value)}%
          </span>
          <span className="text-[11px] text-[#A1A1AA]">{change.label || "vs last period"}</span>
        </div>
      )}
    </div>
  );
}
