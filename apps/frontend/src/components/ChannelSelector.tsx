"use client";

import React from "react";

interface Channel {
  id: "linkedin" | "twitter" | "facebook";
  name: string;
  avatar: string;
  icon: React.ReactNode;
  connected: boolean;
}

interface ChannelSelectorProps {
  selectedChannels: string[];
  onChange: (channels: string[]) => void;
}

export default function ChannelSelector({ selectedChannels, onChange }: ChannelSelectorProps) {
  const channels: Channel[] = [
    {
      id: "linkedin",
      name: "LinkedIn",
      avatar: "Fluxora Enterprise",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      ),
      connected: true,
    },
    {
      id: "twitter",
      name: "Twitter / X",
      avatar: "@FluxoraApp",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
        </svg>
      ),
      connected: true,
    },
    {
      id: "facebook",
      name: "Facebook",
      avatar: "Fluxora Social",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      ),
      connected: true,
    },
  ];

  const handleToggle = (channelId: string) => {
    if (selectedChannels.includes(channelId)) {
      onChange(selectedChannels.filter((c) => c !== channelId));
    } else {
      onChange([...selectedChannels, channelId]);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Publish Channels</label>
      <div className="grid grid-cols-3 gap-2.5">
        {channels.map((chan) => {
          const isSelected = selectedChannels.includes(chan.id);
          return (
            <button
              key={chan.id}
              type="button"
              onClick={() => handleToggle(chan.id)}
              className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-[#7C3AED]/10 border-[#7C3AED]/60 text-white shadow-lg shadow-[#7C3AED]/5"
                  : "bg-[#121218] border-white/[0.08] hover:border-white/[0.12] text-[#A1A1AA]"
              }`}
            >
              {/* Top Row: Icon & Dot */}
              <div className="flex items-center justify-between w-full mb-2.5">
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-lg ${
                    isSelected ? "bg-[#7C3AED] text-white" : "bg-white/[0.04] text-[#A1A1AA]"
                  } transition-colors`}
                >
                  {chan.icon}
                </div>
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-[#7C3AED]" : "bg-white/[0.2]"}`}></span>
              </div>

              {/* Channel metadata */}
              <span className="text-xs font-semibold block truncate w-full text-white">{chan.name}</span>
              <span className="text-[10px] text-[#A1A1AA] truncate w-full block mt-0.5">{chan.avatar}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
