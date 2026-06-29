"use client";

import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BrandMention {
  id: string;
  content: string;
  platform: string;
  sentiment: "positive" | "negative" | "neutral";
  source: string;
  timestamp: string;
  ticketCreated: boolean;
  ticketId?: string;
}

interface Competitor {
  id: string;
  name: string;
  handle: string;
  followers: number;
  engagementRate: number;
  shareOfVoice: number;
}

interface CompetitorPost {
  id: string;
  competitorId: string;
  content: string;
  engagementType: "likes" | "shares" | "comments";
  engagementCount: number;
  timestamp: string;
}

interface CompetitorMix {
  competitorId: string;
  video: number;
  image: number;
  text: number;
}

interface CompetitorFrequency {
  competitorId: string;
  frequency: string;
  pattern: string;
}

interface SocialListeningProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN" | "ERROR") => void;
}

export default function SocialListening({ onNotify }: SocialListeningProps) {
  const [subTab, setSubTab] = useState<"mentions" | "competitors">("mentions");
  const [mentions, setMentions] = useState<BrandMention[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [competitorPosts, setCompetitorPosts] = useState<CompetitorPost[]>([]);
  const [competitorMixes, setCompetitorMixes] = useState<CompetitorMix[]>([]);
  const [competitorFrequencies, setCompetitorFrequencies] = useState<CompetitorFrequency[]>([]);

  // Filters and setup states
  const [trackedKeywords, setTrackedKeywords] = useState<string[]>(["Fluxora", "telemetry", "ClickHouse"]);
  const [newKeyword, setNewKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  // Competitor setup wizard states
  const [wizardName, setWizardName] = useState("");
  const [wizardHandle, setWizardHandle] = useState("");
  const [wizardFollowers, setWizardFollowers] = useState("");
  const [wizardEngagement, setWizardEngagement] = useState("");
  const [wizardSov, setWizardSov] = useState("");
  const [settingUp, setSettingUp] = useState(false);

  // Gallery Filter state
  const [galleryEngagementFilter, setGalleryEngagementFilter] = useState<"all" | "likes" | "shares" | "comments">("all");

  const fetchListeningData = async () => {
    setLoading(true);
    try {
      // Mentions
      const mRes = await fetch("http://localhost:3000/api/v1/extended/listening/mentions", {
        headers: { "X-Tenant-ID": "Fluxora-Tenant-098", "X-Workspace-ID": "ws-1" },
      });
      if (!mRes.ok) throw new Error("API Offline");
      const mData = await mRes.json();
      setMentions(mData);

      // Settings
      const sRes = await fetch("http://localhost:3000/api/v1/extended/listening/settings", {
        headers: { "X-Tenant-ID": "Fluxora-Tenant-098", "X-Workspace-ID": "ws-1" },
      });
      if (sRes.ok) {
        const sData = await sRes.json();
        setTrackedKeywords(sData.trackedKeywords || []);
      }

      // Competitors list
      const cRes = await fetch("http://localhost:3000/api/v1/extended/listening/competitors", {
        headers: { "X-Tenant-ID": "Fluxora-Tenant-098", "X-Workspace-ID": "ws-1" },
      });
      if (cRes.ok) {
        const cData = await cRes.json();
        setCompetitors(cData);
      }

      // Competitor Details
      const dRes = await fetch("http://localhost:3000/api/v1/extended/listening/competitor/details", {
        headers: { "X-Tenant-ID": "Fluxora-Tenant-098", "X-Workspace-ID": "ws-1" },
      });
      if (dRes.ok) {
        const dData = await dRes.json();
        setCompetitorPosts(dData.posts || []);
        setCompetitorMixes(dData.mixes || []);
        setCompetitorFrequencies(dData.frequencies || []);
      }
    } catch (err) {
      console.error("Failed to fetch listening data:", err);
      onNotify("Failed to fetch social listening data from API", "ERROR");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListeningData();
  }, []);

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    const word = newKeyword.trim();
    setTrackedKeywords((prev) => [...prev, word]);
    setNewKeyword("");

    try {
      const res = await fetch("http://localhost:3000/api/v1/extended/listening/keyword", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Tenant-ID": "Fluxora-Tenant-098", "X-Workspace-ID": "ws-1" },
        body: JSON.stringify({ keyword: word }),
      });
      if (res.ok) {
        onNotify(`Added tracked keyword: "${word}"`, "INFO");
      } else {
        onNotify("Failed to add keyword on server", "ERROR");
      }
    } catch (err) {
      console.error(err);
      onNotify("Failed to add keyword due to network error", "ERROR");
    }
  };

  const handleRemoveKeyword = async (word: string) => {
    setTrackedKeywords((prev) => prev.filter((k) => k !== word));
    try {
      await fetch(`http://localhost:3000/api/v1/extended/listening/keyword?keyword=${encodeURIComponent(word)}`, {
        method: "DELETE",
        headers: { "X-Tenant-ID": "Fluxora-Tenant-098", "X-Workspace-ID": "ws-1" },
      });
      onNotify(`Removed tracked keyword: "${word}"`, "INFO");
    } catch {
      onNotify(`Demo mode: Removed keyword "${word}" locally`, "INFO");
    }
  };

  const convertToTicket = async (mentionId: string) => {
    setConvertingId(mentionId);
    try {
      const res = await fetch("http://localhost:3000/api/v1/extended/listening/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Tenant-ID": "Fluxora-Tenant-098", "X-Workspace-ID": "ws-1" },
        body: JSON.stringify({ mentionId }),
      });
      const data = await res.json();
      setMentions((prev) =>
        prev.map((m) => (m.id === mentionId ? { ...m, ticketCreated: true, ticketId: data.ticketId } : m))
      );
      onNotify(`Converted brand mention to support ticket ${data.ticketId}`, "AUDIT");
    } catch (err) {
      console.error(err);
      onNotify("Failed to convert brand mention to ticket", "ERROR");
    } finally {
      setConvertingId(null);
    }
  };

  const handleCompetitorSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wizardHandle.trim() || !wizardName.trim()) return;
    setSettingUp(true);

    const newCompData = {
      name: wizardName.trim(),
      handle: wizardHandle.trim(),
      followers: parseInt(wizardFollowers) || undefined,
      engagementRate: parseFloat(wizardEngagement) || undefined,
      shareOfVoice: parseInt(wizardSov) || undefined,
    };

    try {
      const res = await fetch("http://localhost:3000/api/v1/extended/listening/competitor/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Tenant-ID": "Fluxora-Tenant-098", "X-Workspace-ID": "ws-1" },
        body: JSON.stringify(newCompData),
      });
      if (res.ok) {
        const newComp = await res.json();
        setCompetitors((prev) => [...prev, newComp]);
        onNotify(`Competitor profile linked: ${newComp.handle}`, "AUDIT");
        
        // Reset wizard fields
        setWizardName("");
        setWizardHandle("");
        setWizardFollowers("");
        setWizardEngagement("");
        setWizardSov("");
        
        // Refresh mixes & posts
        fetchListeningData();
      } else {
        onNotify("Failed to setup competitor", "ERROR");
      }
    } catch (err) {
      console.error(err);
      onNotify("Failed to setup competitor due to network error", "ERROR");
    } finally {
      setSettingUp(false);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return <Icons.Smile className="w-4 h-4 text-emerald-400" />;
      case "negative": return <Icons.Frown className="w-4 h-4 text-rose-400" />;
      default: return <Icons.Meh className="w-4 h-4 text-amber-400" />;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "twitter":
      case "x":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-sky-400">
            <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
          </svg>
        );
      case "linkedin":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-blue-500">
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
            <rect x="2" y="9" width="4" height="12" />
            <circle cx="4" cy="4" r="2" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-indigo-500">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
          </svg>
        );
    }
  };

  const getCompetitorName = (id: string) => {
    return competitors.find((c) => c.id === id)?.name || "Competitor";
  };

  const getCompetitorHandle = (id: string) => {
    return competitors.find((c) => c.id === id)?.handle || "@competitor";
  };

  const filteredPosts = competitorPosts.filter((p) => {
    if (galleryEngagementFilter === "all") return true;
    return p.engagementType === galleryEngagementFilter;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Icons.Volume2 className="w-8 h-8 text-[#8B5CF6]" />
            <span>Social Listening & Competitor Intel</span>
          </h2>
          <p className="text-xs text-[#A1A1AA] mt-1">
            Track brand conversations, analyze sentiment indexes, and benchmark competitor performance metrics.
          </p>
        </div>

        {/* Sub-tab selection */}
        <div className="bg-[#121218] border border-white/8 p-1.5 rounded-xl flex gap-1.5 shadow-xl">
          <button
            onClick={() => setSubTab("mentions")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === "mentions" ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-white"
            }`}
          >
            <Icons.MessagesSquare className="w-3.5 h-3.5" />
            <span>Brand Mentions</span>
          </button>
          <button
            onClick={() => setSubTab("competitors")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === "competitors" ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-white"
            }`}
          >
            <Icons.LineChart className="w-3.5 h-3.5" />
            <span>Competitor Benchmarking</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {subTab === "mentions" ? (
          <motion.div
            key="mentions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left Column - Keyword Config */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-[#121218] border border-white/8 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Icons.Sliders className="w-4 h-4 text-[#8B5CF6]" />
                  <span>Keyword & Hashtag Tracking</span>
                </h3>
                <p className="text-[11px] text-[#A1A1AA] mb-4">
                  Specify brand terms, keywords, and hashtags. Any matching social streams are parsed into the monitor.
                </p>

                <form onSubmit={handleAddKeyword} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="e.g. #customerlove"
                    className="flex-1 bg-[#0B0B0F] border border-white/8 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />
                  <button
                    type="submit"
                    className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
                  >
                    Track
                  </button>
                </form>

                <div className="flex flex-wrap gap-2">
                  {trackedKeywords.map((word) => (
                    <span
                      key={word}
                      className="bg-[#0B0B0F] border border-white/8 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5"
                    >
                      <span>{word}</span>
                      <button
                        onClick={() => handleRemoveKeyword(word)}
                        className="text-[#A1A1AA] hover:text-rose-400 transition cursor-pointer"
                      >
                        <Icons.X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {trackedKeywords.length === 0 && (
                    <span className="text-xs text-[#A1A1AA]/50 italic">No keywords configured</span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Mentions Stream */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#121218] border border-white/8 rounded-2xl p-5 shadow-xl flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#E5E7EB] animate-pulse"></span>
                      <span>Direct Mentions Feed</span>
                    </h3>
                    <p className="text-[11px] text-[#A1A1AA]">Real-time listening stream from target channels</p>
                  </div>
                  <button
                    onClick={fetchListeningData}
                    className="p-1.5 hover:bg-white/4 border border-white/8 rounded-lg text-[#A1A1AA] hover:text-white transition cursor-pointer"
                    title="Refresh feed"
                  >
                    <Icons.RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  </button>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
                  {mentions.map((mention) => (
                    <div
                      key={mention.id}
                      className="p-4 bg-[#0B0B0F]/50 border border-white/4 hover:border-white/8 rounded-xl flex flex-col md:flex-row justify-between gap-4 transition animate-fadeIn"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#121218] border border-white/8 p-1 rounded-md">
                            {getPlatformIcon(mention.platform)}
                          </span>
                          <span className="text-xs font-bold text-white font-mono">{mention.source}</span>
                          <span className="text-[9px] text-[#A1A1AA]/60 font-mono">
                            {new Date(mention.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-white leading-relaxed">{mention.content}</p>
                      </div>

                      <div className="flex md:flex-col items-start md:items-end justify-between md:justify-center gap-3 border-t md:border-t-0 border-white/4 pt-2 md:pt-0">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          mention.sentiment === "positive"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : mention.sentiment === "negative"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}>
                          {getSentimentIcon(mention.sentiment)}
                          <span>{mention.sentiment}</span>
                        </span>

                        {mention.ticketCreated ? (
                          <span className="inline-flex items-center gap-1 text-[9px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md font-mono font-bold">
                            <Icons.Ticket className="w-3.5 h-3.5" />
                            <span>{mention.ticketId}</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => convertToTicket(mention.id)}
                            disabled={convertingId === mention.id}
                            className="bg-[#121218] hover:bg-[#181821] border border-white/8 text-[9.5px] font-bold text-white px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                          >
                            <Icons.PlusSquare className="w-3.5 h-3.5 text-purple-400" />
                            <span>Create Ticket</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {mentions.length === 0 && (
                    <div className="text-center py-12 text-xs text-[#A1A1AA]/50 italic">
                      No mentions detected matching keywords
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="competitors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Top Row: Wizard Setup & Share of Voice */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Wizard Setup (5/12) */}
              <div className="lg:col-span-5 bg-[#121218] border border-white/8 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Icons.UserPlus className="w-4.5 h-4.5 text-[#8B5CF6]" />
                  <span>Competitor Setup Wizard</span>
                </h3>
                <p className="text-[11px] text-[#A1A1AA] mb-4">
                  Link an industry competitor profile handle below to parse metrics and aggregate posting frequency timelines.
                </p>

                <form onSubmit={handleCompetitorSetup} className="space-y-3">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-[#A1A1AA] block mb-1">Company / Brand Name</label>
                    <input
                      type="text"
                      value={wizardName}
                      onChange={(e) => setWizardName(e.target.value)}
                      placeholder="e.g. Hootsuite Inc"
                      className="w-full bg-[#0B0B0F] border border-white/8 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-[#A1A1AA] block mb-1">Social Handle</label>
                    <input
                      type="text"
                      value={wizardHandle}
                      onChange={(e) => setWizardHandle(e.target.value)}
                      placeholder="e.g. @hootsuite"
                      className="w-full bg-[#0B0B0F] border border-white/8 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-[#A1A1AA] block mb-1">Followers</label>
                      <input
                        type="number"
                        value={wizardFollowers}
                        onChange={(e) => setWizardFollowers(e.target.value)}
                        placeholder="250000"
                        className="w-full bg-[#0B0B0F] border border-white/8 text-white text-xs rounded-xl px-3 py-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-[#A1A1AA] block mb-1">Eng. Rate (%)</label>
                      <input
                        type="text"
                        value={wizardEngagement}
                        onChange={(e) => setWizardEngagement(e.target.value)}
                        placeholder="2.4"
                        className="w-full bg-[#0B0B0F] border border-white/8 text-white text-xs rounded-xl px-3 py-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-[#A1A1AA] block mb-1">SOV % Share</label>
                      <input
                        type="number"
                        value={wizardSov}
                        onChange={(e) => setWizardSov(e.target.value)}
                        placeholder="35"
                        className="w-full bg-[#0B0B0F] border border-white/8 text-white text-xs rounded-xl px-3 py-2 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={settingUp || !wizardName || !wizardHandle}
                    className="w-full bg-[#7C3AED] hover:bg-[#8B5CF6] disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl transition mt-2 cursor-pointer"
                  >
                    {settingUp ? "Connecting Handle..." : "🔗 Link Competitor Profile"}
                  </button>
                </form>
              </div>

              {/* Share of Voice Visual & Timeline (7/12) */}
              <div className="lg:col-span-7 bg-[#121218] border border-white/8 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Icons.BarChart3 className="w-4.5 h-4.5 text-[#8B5CF6]" />
                    <span>Share of Voice & Competitor Posting Frequencies</span>
                  </h3>
                  <p className="text-[11px] text-[#A1A1AA] mb-4">
                    Comparative brand mention volumes and post-dispatch time scheduling patterns across linked handles.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* SOV Bar charts */}
                    <div className="space-y-3">
                      <span className="text-[9px] uppercase font-bold text-[#A1A1AA] block tracking-wide">Share of Voice Index</span>
                      <div className="space-y-2.5">
                        {competitors.map((c) => (
                          <div key={c.id} className="space-y-1">
                            <div className="flex justify-between text-[10px]">
                              <span className="font-bold text-white">{c.name}</span>
                              <span className="font-mono text-[#A1A1AA]">{c.shareOfVoice}%</span>
                            </div>
                            <div className="w-full bg-[#0B0B0F] h-2 rounded-full overflow-hidden border border-white/4">
                              <div className="h-full bg-linear-to-r from-[#7C3AED] to-[#8B5CF6]" style={{ width: `${c.shareOfVoice}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Frequency timeline patterns */}
                    <div className="space-y-3">
                      <span className="text-[9px] uppercase font-bold text-[#A1A1AA] block tracking-wide">Scheduling Interval Patterns</span>
                      <div className="space-y-2.5">
                        {competitorFrequencies.map((f, idx) => (
                          <div key={idx} className="p-2.5 bg-[#0B0B0F]/50 border border-white/4 rounded-xl flex items-center justify-between text-[10px]">
                            <div>
                              <span className="font-bold text-white">{getCompetitorName(f.competitorId)}</span>
                              <p className="text-[9px] text-[#A1A1AA] mt-0.5">Frequency: {f.frequency}</p>
                            </div>
                            <span className="text-[9px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md text-right">
                              {f.pattern}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/4 pt-3.5 mt-4 text-[9px] text-[#A1A1AA] italic">
                  💡 BufferStream Inc represents the primary threat inside Tech niche. Hootsync has 42% global social share.
                </div>
              </div>
            </div>

            {/* Bottom Row: Post Gallery (Likes/shares/comments filters) & Strategy Mix (pie chart) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Strategy Mix Pie Chart (4/12) */}
              <div className="lg:col-span-4 bg-[#121218] border border-white/8 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Icons.PieChart className="w-4.5 h-4.5 text-[#8B5CF6]" />
                    <span>Media Strategy Content Mix</span>
                  </h3>
                  <p className="text-[11px] text-[#A1A1AA] mb-4">
                    Media format weight breakdown (Video, Images, Text posts) utilized by competitors.
                  </p>

                  <div className="flex flex-col items-center justify-center space-y-4 py-4">
                    {/* SVG Pie Chart Mock */}
                    <div className="relative w-36 h-36">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
                        {/* Video - 40% (stroke-dasharray: 40 100) */}
                        <circle cx="16" cy="16" r="14" fill="transparent" stroke="#8B5CF6" strokeWidth="4" strokeDasharray="40 100" strokeDashoffset="0" />
                        {/* Image - 45% (stroke-dasharray: 45 100, dashoffset: -40) */}
                        <circle cx="16" cy="16" r="14" fill="transparent" stroke="#EC4899" strokeWidth="4" strokeDasharray="45 100" strokeDashoffset="-40" />
                        {/* Text - 15% (stroke-dasharray: 15 100, dashoffset: -85) */}
                        <circle cx="16" cy="16" r="14" fill="transparent" stroke="#3B82F6" strokeWidth="4" strokeDasharray="15 100" strokeDashoffset="-85" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xs font-bold text-white font-mono">Aggregated</span>
                        <span className="text-[9px] text-[#A1A1AA]">Competitor Mix</span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex justify-around w-full text-[10px] text-white">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />Video (40%)</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#EC4899]" />Images (45%)</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />Text (15%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gallery Posts filterable (8/12) */}
              <div className="lg:col-span-8 bg-[#121218] border border-white/8 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/8 pb-3 gap-2.5 mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                        <Icons.LayoutGrid className="w-4.5 h-4.5 text-[#8B5CF6]" />
                        <span>Competitor Post Galleries</span>
                      </h3>
                      <p className="text-[11px] text-[#A1A1AA]">Top performing competitor posts pulled from linked feeds</p>
                    </div>

                    {/* Gallery Filters */}
                    <div className="flex bg-[#0B0B0F] border border-white/8 p-1 rounded-xl">
                      {["all", "likes", "shares", "comments"].map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setGalleryEngagementFilter(filter as any)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold capitalize transition cursor-pointer ${
                            galleryEngagementFilter === filter ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-white"
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                    {filteredPosts.map((post) => (
                      <div key={post.id} className="p-3.5 bg-[#0B0B0F]/40 border border-white/4 rounded-xl flex flex-col justify-between space-y-3 hover:border-white/8 transition">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-white">{getCompetitorName(post.competitorId)}</span>
                            <span className="text-[#A1A1AA]/60 font-mono">{getCompetitorHandle(post.competitorId)}</span>
                          </div>
                          <p className="text-[11px] text-white leading-relaxed italic">
                            "{post.content}"
                          </p>
                        </div>

                        <div className="flex justify-between items-center text-[9px] pt-2 border-t border-white/2">
                          <span className="text-[#A1A1AA]/60 font-mono">
                            {new Date(post.timestamp).toLocaleDateString()}
                          </span>

                          <span className="inline-flex items-center gap-1 font-bold text-purple-400 font-mono">
                            {post.engagementType === "likes" && <Icons.ThumbsUp className="w-3 h-3" />}
                            {post.engagementType === "shares" && <Icons.Share2 className="w-3 h-3" />}
                            {post.engagementType === "comments" && <Icons.MessageCircle className="w-3 h-3" />}
                            <span>{post.engagementCount.toLocaleString()} {post.engagementType}</span>
                          </span>
                        </div>
                      </div>
                    ))}

                    {filteredPosts.length === 0 && (
                      <div className="col-span-2 text-center py-12 text-xs text-[#A1A1AA]/50 italic">
                        No posts found matching the filter engagement type.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
