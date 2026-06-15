"use client";

import React, { useState, useEffect, useRef } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Network {
  id: string;
  name: string;
  category: "social" | "professional" | "messaging" | "blog";
  charLimit: number;
  icon: string;
}

const NETWORKS: Network[] = [
  { id: "linkedin_org", name: "LinkedIn Page", category: "professional", charLimit: 3000, icon: "LinkedIn" },
  { id: "linkedin_pers", name: "LinkedIn Personal", category: "professional", charLimit: 3000, icon: "LinkedIn" },
  { id: "twitter", name: "Twitter / X", category: "social", charLimit: 280, icon: "Twitter" },
  { id: "facebook_page", name: "Facebook Page", category: "social", charLimit: 5000, icon: "Facebook" },
  { id: "facebook_group", name: "Facebook Group", category: "social", charLimit: 5000, icon: "Facebook" },
  { id: "instagram", name: "Instagram Feed", category: "social", charLimit: 2200, icon: "Instagram" },
  { id: "instagram_story", name: "Instagram Story", category: "social", charLimit: 0, icon: "Instagram" },
  { id: "threads", name: "Threads", category: "social", charLimit: 500, icon: "Activity" },
  { id: "tiktok", name: "TikTok", category: "social", charLimit: 2200, icon: "Video" },
  { id: "youtube", name: "YouTube Shorts", category: "social", charLimit: 500, icon: "Youtube" },
  { id: "pinterest", name: "Pinterest Pin", category: "social", charLimit: 500, icon: "Pin" },
  { id: "mastodon", name: "Mastodon", category: "social", charLimit: 500, icon: "Globe" },
  { id: "bluesky", name: "Bluesky", category: "social", charLimit: 300, icon: "Cloud" },
  { id: "reddit", name: "Reddit", category: "social", charLimit: 10000, icon: "MessageSquare" },
  { id: "medium", name: "Medium Article", category: "blog", charLimit: 20000, icon: "FileText" },
  { id: "devto", name: "Dev.to Post", category: "blog", charLimit: 15000, icon: "Code" },
  { id: "telegram_chan", name: "Telegram Channel", category: "messaging", charLimit: 4096, icon: "Send" },
  { id: "telegram_group", name: "Telegram Group", category: "messaging", charLimit: 4096, icon: "Send" },
  { id: "discord", name: "Discord Server", category: "messaging", charLimit: 2000, icon: "Hash" },
  { id: "slack", name: "Slack Workflow", category: "messaging", charLimit: 3000, icon: "Briefcase" },
  { id: "whatsapp", name: "WhatsApp Channel", category: "messaging", charLimit: 1024, icon: "Phone" },
  { id: "google_business", name: "Google Business", category: "professional", charLimit: 1500, icon: "MapPin" },
  { id: "tumblr", name: "Tumblr Blog", category: "social", charLimit: 5000, icon: "Square" },
  { id: "reddit_r_tech", name: "Reddit r/technology", category: "social", charLimit: 8000, icon: "Cpu" },
  { id: "weibo", name: "Weibo", category: "social", charLimit: 2000, icon: "MessageCircle" },
  { id: "vk", name: "VKontakte", category: "social", charLimit: 4000, icon: "Share2" },
  { id: "okru", name: "Odnoklassniki", category: "social", charLimit: 3000, icon: "User" },
  { id: "line", name: "Line VoOM", category: "messaging", charLimit: 1000, icon: "Smile" },
  { id: "plurk", name: "Plurk Timeline", category: "social", charLimit: 360, icon: "Navigation" },
  { id: "truth_social", name: "Truth Social", category: "social", charLimit: 500, icon: "Shield" },
  { id: "gettr", name: "Gettr", category: "social", charLimit: 777, icon: "Tv" }
];

const SUGGESTION_TAGS = ["#telemetry", "#clickhouse", "#fluxora", "#scaling", "#react", "#nextjs", "#devops", "#database"];
const SUGGESTION_MENTIONS = ["@FluxoraApp", "@GoogleDeepMind", "@OpenAI", "@Vercel", "@TechCrunch", "@Wired"];

interface OmniComposerProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
}

export default function OmniComposer({ onNotify }: OmniComposerProps) {
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>(["linkedin_org", "twitter"]);
  const [content, setContent] = useState("Excited to launch our new automated distribution campaign via Fluxora! 🚀 #socialmedia #enterprise");
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(9, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  
  // Custom Overrides per network
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [showOverrides, setShowOverrides] = useState(false);

  // Autocomplete Suggestions
  const [searchWord, setSearchWord] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionType, setSuggestionType] = useState<"tag" | "mention">("tag");
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Media attachment list
  const [attachments, setAttachments] = useState<{ id: string; name: string; url: string; size: string }[]>([]);

  // Textarea input and auto-completion logic
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setContent(val);
    setCursorPosition(pos);

    // Extract current word being typed
    const textBeforeCursor = val.slice(0, pos);
    const lastWord = textBeforeCursor.split(/\s/).pop() || "";

    if (lastWord.startsWith("#")) {
      setSearchWord(lastWord.slice(1));
      setSuggestionType("tag");
      setShowSuggestions(true);
    } else if (lastWord.startsWith("@")) {
      setSearchWord(lastWord.slice(1));
      setSuggestionType("mention");
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (word: string) => {
    if (!textareaRef.current) return;
    const pos = cursorPosition;
    const textBeforeCursor = content.slice(0, pos);
    const textAfterCursor = content.slice(pos);

    const words = textBeforeCursor.split(/\s/);
    words.pop(); // Remove the typed stub e.g. '#tele'
    const newTextBefore = [...words, word].join(" ") + " ";
    
    setContent(newTextBefore + textAfterCursor);
    setShowSuggestions(false);
    
    // Reset focus
    setTimeout(() => {
      textareaRef.current?.focus();
      const newPos = newTextBefore.length;
      textareaRef.current?.setSelectionRange(newPos, newPos);
    }, 50);
  };

  // Group selection shortcuts
  const selectGroup = (group: "all" | "none" | "social" | "messaging" | "blog" | "professional") => {
    if (group === "all") {
      setSelectedNetworks(NETWORKS.map(n => n.id));
    } else if (group === "none") {
      setSelectedNetworks([]);
    } else {
      const filtered = NETWORKS.filter(n => n.category === group).map(n => n.id);
      setSelectedNetworks(filtered);
    }
  };

  // Formatting adaptors
  const adaptContent = (format: "hashtags" | "uppercase" | "x-thread" | "clean") => {
    if (format === "hashtags") {
      setContent(prev => prev + " #telemetry #data #fluxora");
      onNotify("Appended trending hashtags to post", "INFO");
    } else if (format === "uppercase") {
      setContent(prev => prev.toUpperCase());
      onNotify("Converted draft content to uppercase", "INFO");
    } else if (format === "clean") {
      setContent(prev => prev.replace(/#\w+/g, "").trim());
      onNotify("Stripped all hashtags for a clean format", "INFO");
    } else if (format === "x-thread") {
      // Create twitter overrides as a threaded structure
      const parts = content.match(/.{1,260}/g) || [];
      if (parts.length > 1) {
        const first = parts[0] + " (1/2) 🧵";
        const second = parts[1] + " (2/2)";
        setOverrides(prev => ({
          ...prev,
          twitter: `${first}\n\n${second}`
        }));
        setShowOverrides(true);
        onNotify("Automatically adapted content into an X thread", "INFO");
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const url = URL.createObjectURL(file);
    setAttachments(prev => [
      ...prev,
      {
        id: `att-${Date.now()}`,
        name: file.name,
        url,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
      }
    ]);
    onNotify(`Attached asset "${file.name}" to composer`, "INFO");
  };

  return (
    <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex justify-between items-start border-b border-white/[0.08] pb-4">
        <div>
          <h3 className="text-lg font-bold text-white">Omnichannel Publisher</h3>
          <p className="text-xs text-[#A1A1AA] mt-1">Stagger and distribute updates to 30+ networks simultaneously.</p>
        </div>
        <span className="text-[10px] bg-[#7C3AED]/10 text-[#8B5CF6] border border-[#7C3AED]/20 px-3 py-1 rounded-full font-mono font-semibold">
          {selectedNetworks.length} selected networks
        </span>
      </div>

      {/* Target Networks Selection Grid */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <label className="text-[10px] uppercase text-[#A1A1AA] font-bold tracking-wider">Target Networks (30+ Channels)</label>
          <div className="flex gap-2">
            {["all", "none", "social", "professional", "messaging", "blog"].map(gp => (
              <button
                key={gp}
                type="button"
                onClick={() => selectGroup(gp as any)}
                className="text-[9px] font-semibold bg-[#0B0B0F] hover:bg-[#181821] border border-white/[0.06] text-[#A1A1AA] hover:text-white px-2.5 py-1 rounded-lg transition capitalize cursor-pointer"
              >
                {gp}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1.5 bg-[#0B0B0F]/40 border border-white/[0.04] rounded-xl">
          {NETWORKS.map(net => {
            const isChecked = selectedNetworks.includes(net.id);
            return (
              <label
                key={net.id}
                className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition ${
                  isChecked
                    ? "bg-[#7C3AED]/10 border-[#7C3AED]/40 text-white"
                    : "bg-[#0B0B0F]/60 border-white/[0.04] text-[#A1A1AA] hover:text-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    setSelectedNetworks(prev =>
                      isChecked ? prev.filter(id => id !== net.id) : [...prev, net.id]
                    );
                  }}
                  className="rounded border-white/[0.08] text-[#7C3AED] focus:ring-[#7C3AED] h-3 w-3 cursor-pointer"
                />
                <span className="truncate">{net.name}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-1.5 relative">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase text-[#A1A1AA] font-bold tracking-wider">Core Message</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => adaptContent("hashtags")}
                  className="text-[9px] text-[#8B5CF6] hover:underline cursor-pointer"
                >
                  + Tag Bundle
                </button>
                <button
                  type="button"
                  onClick={() => adaptContent("clean")}
                  className="text-[9px] text-[#8B5CF6] hover:underline cursor-pointer"
                >
                  Clean Copy
                </button>
                <button
                  type="button"
                  onClick={() => adaptContent("x-thread")}
                  className="text-[9px] text-[#8B5CF6] hover:underline cursor-pointer"
                >
                  Split Thread
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleTextareaChange}
                placeholder="Type core update copy here... Type @ or # for smart autocomplete suggestions."
                className="w-full h-44 bg-[#0B0B0F] border border-white/[0.08] rounded-xl p-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#7C3AED] resize-none"
              />

              {/* Suggestions Dropdown Popover */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute z-50 bottom-12 left-4 w-52 bg-[#181821] border border-white/[0.12] rounded-xl shadow-2xl p-1.5 max-h-40 overflow-y-auto space-y-1"
                  >
                    <div className="text-[8px] uppercase tracking-wider text-[#A1A1AA] font-bold px-2 py-0.5">
                      Suggestions Matching "{searchWord}"
                    </div>
                    {suggestionType === "tag"
                      ? SUGGESTION_TAGS.filter(tag => tag.includes(searchWord)).map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleSelectSuggestion(tag)}
                            className="w-full text-left px-2 py-1 text-xs text-white hover:bg-[#7C3AED] rounded transition cursor-pointer"
                          >
                            {tag}
                          </button>
                        ))
                      : SUGGESTION_MENTIONS.filter(men => men.toLowerCase().includes(searchWord.toLowerCase())).map(men => (
                          <button
                            key={men}
                            type="button"
                            onClick={() => handleSelectSuggestion(men)}
                            className="w-full text-left px-2 py-1 text-xs text-white hover:bg-[#7C3AED] rounded transition cursor-pointer"
                          >
                            {men}
                          </button>
                        ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <span className="absolute bottom-3 right-3 text-[9px] text-[#A1A1AA]/60 font-mono">
                {content.length} characters
              </span>
            </div>
          </div>

          {/* Media attachments */}
          <div className="bg-[#0B0B0F]/40 border border-white/[0.04] p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase text-[#A1A1AA] font-bold tracking-wider">Attachments (Images/Videos)</span>
              <label className="text-[10px] font-semibold text-[#8B5CF6] hover:text-[#7C3AED] cursor-pointer flex items-center gap-1">
                <Icons.Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
                <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*,video/*" />
              </label>
            </div>

            {attachments.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {attachments.map(att => (
                  <div key={att.id} className="relative group border border-white/[0.08] bg-[#0B0B0F] p-2 rounded-xl overflow-hidden text-center">
                    <img src={att.url} alt={att.name} className="h-16 w-full object-cover rounded-lg mb-1" />
                    <h5 className="text-[9px] text-white truncate px-1">{att.name}</h5>
                    <button
                      type="button"
                      onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}
                      className="absolute top-1 right-1 bg-red-600/90 text-white rounded-full p-1 text-[8px] opacity-0 group-hover:opacity-100 transition"
                    >
                      <Icons.Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-[11px] text-[#A1A1AA] italic">
                No files uploaded. Use Canva designer or upload assets below.
              </div>
            )}
          </div>

          {/* Dynamic Platform Overrides */}
          <div>
            <button
              type="button"
              onClick={() => setShowOverrides(!showOverrides)}
              className="text-xs font-semibold text-[#8B5CF6] hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <span>{showOverrides ? "Hide Custom Text Overrides" : "Customize Platform Overrides"}</span>
              <Icons.ChevronDown className={`w-3.5 h-3.5 transition-transform ${showOverrides ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showOverrides && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 space-y-3 bg-[#0B0B0F]/60 border border-white/[0.04] p-3 rounded-xl overflow-hidden"
                >
                  {selectedNetworks.slice(0, 3).map(netId => {
                    const net = NETWORKS.find(n => n.id === netId);
                    if (!net) return null;
                    return (
                      <div key={net.id}>
                        <label className="block text-[9px] uppercase text-[#A1A1AA] tracking-wider mb-1 font-bold">
                          {net.name} Custom override
                        </label>
                        <textarea
                          value={overrides[net.id] || ""}
                          onChange={e => setOverrides({ ...overrides, [net.id]: e.target.value })}
                          placeholder={`Specify unique copy for ${net.name}...`}
                          className="w-full h-16 bg-[#121218] border border-white/[0.08] rounded-lg p-2 text-xs text-white focus:outline-none resize-none"
                        />
                      </div>
                    );
                  })}
                  {selectedNetworks.length > 3 && (
                    <p className="text-[9px] text-[#A1A1AA] italic">Overrides limited to first 3 active selections.</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Live Network Adapters & Limits */}
        <div className="space-y-4">
          <div className="bg-[#0B0B0F]/60 border border-white/[0.08] p-4 rounded-xl space-y-3">
            <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Adaptations & Character Limits</h4>
            
            <div className="space-y-2.5">
              {selectedNetworks.map(netId => {
                const net = NETWORKS.find(n => n.id === netId);
                if (!net) return null;
                const specificContent = overrides[net.id] || content;
                const length = specificContent.length;
                const isOver = net.charLimit > 0 && length > net.charLimit;

                return (
                  <div key={net.id} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-white">{net.name}</span>
                      <span className={`font-mono text-[10px] ${isOver ? "text-red-400 font-bold" : "text-[#A1A1AA]"}`}>
                        {length} / {net.charLimit === 0 ? "∞" : net.charLimit}
                      </span>
                    </div>
                    {net.charLimit > 0 && (
                      <div className="w-full bg-[#121218] rounded-full h-1 overflow-hidden">
                        <div
                          className={`h-full ${isOver ? "bg-red-500 animate-pulse" : "bg-[#7C3AED]"}`}
                          style={{ width: `${Math.min((length / net.charLimit) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
              {selectedNetworks.length === 0 && (
                <div className="text-center text-[10px] text-[#A1A1AA] italic py-3">Select network checkboxes to see limits</div>
              )}
            </div>
          </div>

          <div className="bg-[#0B0B0F]/60 border border-white/[0.08] p-4 rounded-xl space-y-3">
            <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Publish Options</h4>
            <div>
              <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider mb-1.5">Scheduled Launch Time</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                className="bg-[#121218] border border-white/[0.08] text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none w-full cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                onNotify(`Scheduled post to ${selectedNetworks.length} platforms via Temporal workflows`, "AUDIT");
                alert(`Content dispatched to queue for: ${selectedNetworks.join(", ")}`);
              }}
              className="w-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:brightness-110 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition cursor-pointer"
            >
              🚀 Distribute Omnichannel Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
