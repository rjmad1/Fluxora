"use client";

import React, { useState } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ResearchWorkspace from "./ResearchWorkspace";

interface DayPlan {
  dayNumber: number;
  topics: Array<{
    id: string;
    title: string;
    priorityScore: number;
    trendScore: number;
    authorityScore: number;
    engagementPrediction: number;
    readiness: "Ready" | "Needs Enrichment";
    status: "Pending" | "Accepted" | "Rejected";
  }>;
}

interface ContentCalendarGeneratorProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
  onSelectAngle: (angleText: string) => void;
  onPublishLater: (content: string) => void;
}

export default function ContentCalendarGenerator({ onNotify, onSelectAngle, onPublishLater }: ContentCalendarGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [currentDayFilter, setCurrentDayFilter] = useState(1);
  const [researchedTopic, setResearchedTopic] = useState<string | null>(null);

  // Generate initial calendar state: 30 days * 3 topics = 90 topics
  const [calendarDays, setCalendarDays] = useState<DayPlan[]>(() => {
    const arr: DayPlan[] = [];
    const seedTopics = [
      "ClickHouse columnar compression ratios compared to standard Postgres indexing structures.",
      "Row Level Security policies architecture: avoiding leaking client sessions in global configurations.",
      "Thompson Sampling multi-armed bandit Beta calculations for routing dynamic copy variants.",
      "Temporal.io stateful workflows: coordinating background job retry parameters across network boundaries.",
      "Developing key-value cache strategies using Redis clusters under high volume.",
      "Kafka consumer groups synchronization offsets tracking on partition clusters.",
    ];

    for (let d = 1; d <= 30; d++) {
      const dayTopics = [];
      for (let t = 1; t <= 3; t++) {
        const randSeedIdx = (d * t) % seedTopics.length;
        const baseName = seedTopics[randSeedIdx];
        const numId = `${d}-${t}`;
        const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
        dayTopics.push({
          id: `cal-t-${numId}`,
          title: `Day ${d} Topic ${t}: ${baseName.split(" ")[0]} ${baseName.split(" ")[1]} Niche Analysis`,
          priorityScore: rand(70, 98),
          trendScore: rand(65, 96),
          authorityScore: rand(60, 95),
          engagementPrediction: rand(70, 96),
          readiness: (d + t) % 3 === 0 ? "Needs Enrichment" : "Ready" as any,
          status: "Pending" as any
        });
      }
      arr.push({ dayNumber: d, topics: dayTopics });
    }
    return arr;
  });

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      onNotify("Regenerated 30-Day Content Calendar containing 90 niche-aligned candidate topics.", "AUDIT");
    }, 1500);
  };

  const handleStatusChange = (dayNum: number, id: string, nextStatus: "Accepted" | "Rejected") => {
    setCalendarDays(
      calendarDays.map((d) => {
        if (d.dayNumber === dayNum) {
          return {
            ...d,
            topics: d.topics.map((t) => {
              if (t.id === id) {
                onNotify(`Topic marked as ${nextStatus}: "${t.title}"`, "INFO");
                return { ...t, status: nextStatus };
              }
              return t;
            })
          };
        }
        return d;
      })
    );
  };

  const activeDay = calendarDays.find((d) => d.dayNumber === currentDayFilter) || calendarDays[0];

  const getScoreColor = (score: number) => {
    if (score >= 88) return "text-emerald-400";
    if (score >= 75) return "text-[#8B5CF6]";
    return "text-amber-400";
  };

  return (
    <div className="space-y-6">
      {/* Configuration controller banner */}
      <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-md font-bold text-white flex items-center gap-2">
            <Icons.CalendarRange className="w-5 h-5 text-[#8B5CF6]" />
            30-Day Content Planner Generator (90 Topics)
          </h3>
          <p className="text-xs text-[#A1A1AA] mt-1">
            Generate 3 topics per day over 30 days aligned with your mapped authority nodes.
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-[#7C3AED] hover:bg-[#8B5CF6] disabled:opacity-50 text-white text-xs font-semibold px-4.5 py-2 rounded-xl shadow-lg shadow-[#7C3AED]/20 transition flex items-center gap-1.5 cursor-pointer"
        >
          {generating ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
              <span>Regenerating Plan...</span>
            </>
          ) : (
            <>
              <Icons.Sparkles className="w-4 h-4" />
              <span>Regenerate 30-Day Plan</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left selector: Day list selector (3/12 cols) */}
        <div className="lg:col-span-3 bg-[#121218] border border-white/[0.08] rounded-2xl p-4 shadow-xl flex flex-col h-[520px]">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Calendar Days</h4>
          
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {calendarDays.map((d) => {
              const accepted = d.topics.filter((t) => t.status === "Accepted").length;
              const rejected = d.topics.filter((t) => t.status === "Rejected").length;
              const isSelected = d.dayNumber === currentDayFilter;

              return (
                <button
                  key={d.dayNumber}
                  type="button"
                  onClick={() => setCurrentDayFilter(d.dayNumber)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition flex justify-between items-center cursor-pointer ${
                    isSelected
                      ? "bg-[#7C3AED]/15 border-[#7C3AED]/40 text-white font-bold"
                      : "bg-[#0B0B0F]/40 border-white/[0.04] text-[#A1A1AA] hover:text-white hover:border-white/[0.08]"
                  }`}
                >
                  <span>Day {d.dayNumber}</span>
                  <div className="flex gap-1 items-center font-mono text-[9px]">
                    <span className="text-emerald-400">✓{accepted}</span>
                    <span className="text-rose-400">✗{rejected}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right side: Day topics candidate list (9/12 cols) */}
        <div className="lg:col-span-9 space-y-4">
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl min-h-[520px] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-white/[0.04] pb-3 flex justify-between items-center">
                <h4 className="text-sm font-bold text-white">Day {currentDayFilter} Candidates</h4>
                <span className="text-[10px] text-zinc-500 font-mono">Select narrative angles to schedule</span>
              </div>

              <div className="space-y-4">
                {activeDay.topics.map((t) => (
                  <div
                    key={t.id}
                    className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between md:items-center gap-4 transition ${
                      t.status === "Accepted"
                        ? "bg-emerald-950/15 border-emerald-500/25"
                        : t.status === "Rejected"
                        ? "bg-rose-950/15 border-rose-500/25 opacity-60"
                        : "bg-[#0B0B0F]/45 border-white/[0.04] hover:border-white/[0.08]"
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                          t.readiness === "Ready" ? "bg-emerald-500/10 text-emerald-400" : "bg-[#8B5CF6]/15 text-[#8B5CF6] animate-pulse"
                        }`}>
                          {t.readiness}
                        </span>
                        <h5 className="text-xs font-bold text-white leading-snug">{t.title}</h5>
                      </div>

                      {/* Topic weights score meters */}
                      <div className="flex flex-wrap gap-4 text-[10px] text-[#A1A1AA] font-mono">
                        <span>Priority: <strong className={getScoreColor(t.priorityScore)}>{t.priorityScore}</strong></span>
                        <span>Trend: <strong className={getScoreColor(t.trendScore)}>{t.trendScore}</strong></span>
                        <span>Authority: <strong className={getScoreColor(t.authorityScore)}>{t.authorityScore}</strong></span>
                        <span>Engagement: <strong className={getScoreColor(t.engagementPrediction)}>{t.engagementPrediction}</strong></span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 items-center flex-shrink-0">
                      {t.status === "Pending" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(activeDay.dayNumber, t.id, "Accepted")}
                            className="bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 p-1.5 rounded-xl cursor-pointer"
                            title="Accept Topic"
                          >
                            <Icons.Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(activeDay.dayNumber, t.id, "Rejected")}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 p-1.5 rounded-xl cursor-pointer"
                            title="Reject Topic"
                          >
                            <Icons.X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setCalendarDays(
                              calendarDays.map((d) => {
                                if (d.dayNumber === activeDay.dayNumber) {
                                  return {
                                    ...d,
                                    topics: d.topics.map((x) => (x.id === t.id ? { ...x, status: "Pending" } : x))
                                  };
                                }
                                return d;
                              })
                            );
                          }}
                          className="text-[10px] text-[#8B5CF6] hover:underline"
                        >
                          Undo Decision
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setResearchedTopic(t.title)}
                        className="bg-[#121218]/80 hover:bg-white/[0.02] border border-white/[0.08] text-xs font-semibold px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1"
                      >
                        <Icons.SearchCode className="w-3.5 h-3.5" />
                        <span>Research</span>
                      </button>

                      {t.status === "Accepted" && (
                        <button
                          type="button"
                          onClick={() => {
                            onPublishLater(`Topic: ${t.title}\nPre-Attributed Score: Priority=${t.priorityScore}, Trend=${t.trendScore}`);
                            onNotify("Redirecting topic metadata to Omnichannel Composer...", "INFO");
                          }}
                          className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          Publish Later
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[9px] text-[#A1A1AA]/50 font-mono text-center pt-6 border-t border-white/[0.04]">
              Drag and drop scheduling is supported in visual queue layouts. Click 'Publish Later' to trigger composing workflows.
            </div>
          </div>
        </div>

      </div>

      {/* Deep Research Slide-out overlay */}
      {researchedTopic && (
        <ResearchWorkspace
          topicName={researchedTopic}
          onClose={() => setResearchedTopic(null)}
          onSelectAngle={(angleText) => {
            onSelectAngle(angleText);
            setResearchedTopic(null);
          }}
        />
      )}
    </div>
  );
}
