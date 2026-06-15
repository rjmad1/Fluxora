"use client";

import React from "react";
import * as Icons from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: keyof typeof Icons;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ title, description, icon = "Inbox", action }: EmptyStateProps) {
  const IconComponent = (Icons[icon] as React.ComponentType<{ className?: string; strokeWidth?: number }>) || Icons.Inbox;

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-white/[0.08] bg-[#121218] shadow-xl max-w-md mx-auto my-6 transition-all duration-200 hover:border-white/[0.12]">
      {/* Decorative Outer Circle with Gradient */}
      <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/[0.08] shadow-inner mb-6">
        <div className="absolute inset-0 bg-[#7C3AED]/10 blur-xl rounded-full opacity-60"></div>
        <IconComponent className="w-8 h-8 text-[#7C3AED]" strokeWidth={1.5} />
      </div>

      <h3 className="text-lg font-semibold text-white tracking-tight mb-2">{title}</h3>
      <p className="text-sm text-[#A1A1AA] leading-relaxed mb-6 max-w-[280px]">
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center justify-center text-xs font-semibold px-4 py-2.5 rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-all duration-200 shadow-lg shadow-[#7C3AED]/20 active:scale-[0.98] cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
