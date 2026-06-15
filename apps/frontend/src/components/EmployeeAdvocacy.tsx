"use client";

import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PostTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  author: string;
  expiresAt: string;
  sharedCount: number;
}

interface LeaderboardEntry {
  id: string;
  employeeName: string;
  department: string;
  postsShared: number;
  reach: number;
  points: number;
}

interface EmployeeAdvocacyProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
}

export default function EmployeeAdvocacy({ onNotify }: EmployeeAdvocacyProps) {
  const [templates, setTemplates] = useState<PostTemplate[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);

  // Email Digest Wizard States
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [digestEnabled, setDigestEnabled] = useState(true);
  const [digestFreq, setDigestFreq] = useState("weekly");
  const [digestDay, setDigestDay] = useState("Friday");
  const [digestTime, setDigestTime] = useState("09:00");

  const fetchAdvocacyData = async () => {
    setLoading(true);
    try {
      const tRes = await fetch("http://localhost:3000/api/v1/extended/advocacy/templates", {
        headers: { "X-Tenant-ID": "Fluxora-Tenant-098", "X-Workspace-ID": "ws-1" },
      });
      if (!tRes.ok) throw new Error("API Offline");
      const tData = await tRes.json();
      setTemplates(tData);

      const lRes = await fetch("http://localhost:3000/api/v1/extended/advocacy/leaderboard", {
        headers: { "X-Tenant-ID": "Fluxora-Tenant-098", "X-Workspace-ID": "ws-1" },
      });
      if (lRes.ok) {
        const lData = await lRes.json();
        setLeaderboard(lData);
      }
    } catch {
      // Mocks
      setTemplates([
        {
          id: "tpl-1",
          title: "Enterprise Scalability Launch",
          content: "Thrilled to unveil our high-throughput telemetry stream powered by Kafka and ClickHouse! Real-time aggregates in under 500ms ⚡ #BigData #Scale",
          category: "Product Launch",
          author: "Admin Team",
          expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
          sharedCount: 42,
        },
        {
          id: "tpl-2",
          title: "Hiring Notice: Senior SRE",
          content: "We are expanding! Looking for an expert in NestJS, Postgres RLS boundaries, and Temporal workflows. Apply today! #Hiring #SRE #TechJobs",
          category: "Recruiting",
          author: "HR Dept",
          expiresAt: new Date(Date.now() + 86400000 * 15).toISOString(),
          sharedCount: 18,
        },
        {
          id: "tpl-3",
          title: "System Maintenance Alert",
          content: "Fluxora systems will undergo scheduled telemetry database replication audits on June 18th at 03:00 UTC. Fallback log servers are active.",
          category: "Corporate Notice",
          author: "Security Lead",
          expiresAt: new Date(Date.now() + 86400000 * 3).toISOString(),
          sharedCount: 5,
        },
      ]);
      setLeaderboard([
        { id: "lead-1", employeeName: "Sarah Jenkins", department: "Sales & Growth", postsShared: 28, reach: 45000, points: 1420 },
        { id: "lead-2", employeeName: "Alex Mercer", department: "Engineering", postsShared: 22, reach: 38200, points: 1150 },
        { id: "lead-3", employeeName: "Elena Rostova", department: "Product", postsShared: 19, reach: 21000, points: 950 },
        { id: "lead-4", employeeName: "Dave K.", department: "Marketing", postsShared: 14, reach: 18400, points: 720 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvocacyData();
  }, []);

  const handleShare = async (templateId: string) => {
    setSharingId(templateId);
    try {
      const res = await fetch("http://localhost:3000/api/v1/extended/advocacy/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": "Fluxora-Tenant-098",
          "X-Workspace-ID": "ws-1",
        },
        body: JSON.stringify({ templateId }),
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates((prev) =>
          prev.map((t) => (t.id === templateId ? { ...t, sharedCount: data.sharedCount } : t))
        );
      }
      onNotify(`Shared template to personal social profiles`, "AUDIT");
    } catch {
      setTemplates((prev) =>
        prev.map((t) => (t.id === templateId ? { ...t, sharedCount: t.sharedCount + 1 } : t))
      );
      onNotify(`Demo mode: Shared template to personal profiles locally`, "AUDIT");
    } finally {
      setSharingId(null);
    }
  };

  const handleWizardSubmit = async () => {
    const config = {
      enabled: digestEnabled,
      frequency: digestFreq,
      day: digestDay,
      time: digestTime,
    };
    try {
      await fetch("http://localhost:3000/api/v1/extended/advocacy/digest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": "Fluxora-Tenant-098",
          "X-Workspace-ID": "ws-1",
        },
        body: JSON.stringify(config),
      });
      onNotify(`Email digest configured successfully (${digestFreq} digest)`, "AUDIT");
    } catch {
      onNotify(`Demo mode: Email digest configured locally (${digestFreq} digest)`, "AUDIT");
    }
    setWizardOpen(false);
    setWizardStep(1);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Employee Advocacy Center</h2>
          <p className="text-xs text-[#A1A1AA] mt-1">
            Empower employees to share verified updates, view reach leaderboards, and coordinate internal newsletters.
          </p>
        </div>

        <button
          onClick={() => setWizardOpen(true)}
          className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-[#7C3AED]/20 transition-all cursor-pointer"
        >
          <Icons.Mail className="w-4 h-4" />
          <span>Digest Configuration</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates Repository - Left & Middle Column */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Icons.FileText className="w-4 h-4 text-[#8B5CF6]" />
              <span>Pre-Approved Templates Repository</span>
            </h3>

            <div className="space-y-4">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="bg-[#0B0B0F]/50 border border-white/[0.04] hover:border-white/[0.08] rounded-xl p-4.5 transition flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#8B5CF6] uppercase font-mono bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                          {tpl.category}
                        </span>
                        <span className="text-[9px] text-[#A1A1AA] font-mono">By {tpl.author}</span>
                      </div>
                      <span className="text-[9px] text-rose-400 font-mono flex items-center gap-1">
                        <Icons.CalendarX className="w-3 h-3" />
                        <span>Expires: {new Date(tpl.expiresAt).toLocaleDateString()}</span>
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white">{tpl.title}</h4>
                    <p className="text-xs text-[#E4E4E7] leading-relaxed bg-[#0B0B0F] border border-white/[0.03] p-3 rounded-lg font-mono">
                      {tpl.content}
                    </p>
                  </div>

                  <div className="flex justify-between items-center border-t border-white/[0.04] pt-3">
                    <span className="text-[10px] text-[#A1A1AA] font-mono">
                      Shared <strong>{tpl.sharedCount}</strong> times by employees
                    </span>

                    <button
                      onClick={() => handleShare(tpl.id)}
                      disabled={sharingId === tpl.id}
                      className="bg-purple-900/40 hover:bg-[#7C3AED] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-purple-500/20 hover:border-[#7C3AED] transition cursor-pointer"
                    >
                      {sharingId === tpl.id ? (
                        <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                      ) : (
                        <Icons.Share2 className="w-3.5 h-3.5" />
                      )}
                      <span>Share to Profiles</span>
                    </button>
                  </div>
                </div>
              ))}
              {templates.length === 0 && (
                <div className="text-center py-12 text-xs text-[#A1A1AA]/50 italic">
                  No pre-approved templates active or unexpired
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Leaderboard - Right Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl flex flex-col h-full">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Icons.Trophy className="w-4 h-4 text-yellow-400" />
              <span>Advocacy Leaderboard</span>
            </h3>
            <p className="text-[11px] text-[#A1A1AA] mb-4">
              Gamified ranking of staff members based on template distribution, audience reach, and click multipliers.
            </p>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.id}
                  className="p-3 bg-[#0B0B0F]/50 border border-white/[0.04] hover:border-white/[0.08] rounded-xl flex items-center justify-between gap-3 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold font-mono text-[#A1A1AA] w-4">
                      #{index + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{entry.employeeName}</h4>
                      <p className="text-[9px] text-[#A1A1AA] truncate">{entry.department}</p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold text-purple-400 font-mono">
                      {entry.points} pts
                    </span>
                    <p className="text-[9px] text-[#A1A1AA] font-mono">
                      {entry.postsShared} shares • {(entry.reach / 1000).toFixed(1)}K reach
                    </p>
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <div className="text-center py-12 text-xs text-[#A1A1AA]/50 italic">
                  No leaderboard records loaded
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Email Digest Wizard Dialog */}
      <AnimatePresence>
        {wizardOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setWizardOpen(false)}
              className="absolute inset-0 bg-[#0B0B0F]/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-white/[0.08] mb-4">
                <div>
                  <h3 className="text-md font-bold text-white">Email Digest Configuration Wizard</h3>
                  <p className="text-[11px] text-[#A1A1AA]">Set up internal employee newsletter digests</p>
                </div>
                <button
                  onClick={() => setWizardOpen(false)}
                  className="p-1 hover:bg-white/[0.04] rounded-lg text-[#A1A1AA] hover:text-white transition cursor-pointer"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              {/* Step 1: Status & Freq */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-[#0B0B0F] border border-white/[0.08] p-3 rounded-xl">
                    <div>
                      <span className="block text-xs font-bold text-white">Enable Automated Newsletter</span>
                      <span className="text-[10px] text-[#A1A1AA]">Distribute weekly templates to staff emails</span>
                    </div>
                    <button
                      onClick={() => setDigestEnabled(!digestEnabled)}
                      className={`w-10 h-6.5 rounded-full p-1 transition-colors cursor-pointer ${
                        digestEnabled ? "bg-purple-600" : "bg-[#1E1E28]"
                      }`}
                    >
                      <div
                        className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                          digestEnabled ? "translate-x-3.5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Frequency</label>
                    <select
                      value={digestFreq}
                      onChange={(e) => setDigestFreq(e.target.value)}
                      className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none"
                    >
                      <option value="daily">Daily digests</option>
                      <option value="weekly">Weekly digests (Recommended)</option>
                      <option value="monthly">Monthly digests</option>
                    </select>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={() => setWizardStep(2)}
                      className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      <span>Next Step</span>
                      <Icons.ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Day & Time */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Target Day</label>
                      <select
                        value={digestDay}
                        onChange={(e) => setDigestDay(e.target.value)}
                        className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none"
                      >
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Send Time (Local)</label>
                      <input
                        type="time"
                        value={digestTime}
                        onChange={(e) => setDigestTime(e.target.value)}
                        className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-xl px-3 py-2 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      onClick={() => setWizardStep(1)}
                      className="bg-[#121218] hover:bg-[#181821] border border-white/[0.08] text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      <Icons.ChevronLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                    <button
                      onClick={handleWizardSubmit}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      <Icons.Check className="w-4 h-4" />
                      <span>Complete Wizard</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
