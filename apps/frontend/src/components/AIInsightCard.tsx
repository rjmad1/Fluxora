"use client";

import React from "react";
import { Sparkles, ArrowRight } from "lucide-react";

interface AIInsightCardProps {
  insights: string[];
  ctaLabel?: string;
  onCtaClick?: () => void;
}

export default function AIInsightCard({ insights, ctaLabel = "Apply suggestion", onCtaClick }: AIInsightCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#7C3AED]/20 bg-gradient-to-br from-[#121218] via-[#121218] to-[#7C3AED]/5 p-5 shadow-2xl">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#7C3AED]/10 blur-3xl rounded-full pointer-events-none"></div>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#7C3AED]/15 border border-[#7C3AED]/30">
          <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
        </div>
        <span className="text-xs font-semibold text-white tracking-wide uppercase">AI Insights</span>
      </div>

      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <p key={idx} className="text-xs leading-relaxed text-[#A1A1AA]">
            {insight}
          </p>
        ))}
      </div>

      {onCtaClick && (
        <button
          onClick={onCtaClick}
          className="group mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#8B5CF6] hover:text-white transition-colors duration-200 cursor-pointer"
        >
          <span>{ctaLabel}</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      )}
    </div>
  );
}
