"use client";

import React, { useState } from "react";
import * as Icons from "lucide-react";
import { motion } from "framer-motion";

interface ContentAngle {
  name: string;
  type: "Educational" | "Strategic" | "Leadership" | "Case Study" | "Contrarian" | "Future Vision" | "Implementation Guide";
  description: string;
  authority: number;
  virality: number;
  educational: number;
  discussion: number;
  audienceMatch: number;
}

interface ResearchOutput {
  topic: string;
  executiveSummary: string;
  whyItMatters: string;
  industryImpact: string;
  techBreakdown: string;
  useCases: string[];
  marketTrends: string[];
  challenges: string[];
  futureOutlook: string;
  contrarianPerspectives: string;
  references: string[];
  discussionStarters: string[];
  angles: ContentAngle[];
}

interface ResearchWorkspaceProps {
  topicName: string;
  onClose: () => void;
  onSelectAngle: (angleText: string) => void;
}

export default function ResearchWorkspace({ topicName, onClose, onSelectAngle }: ResearchWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "technology" | "market" | "angles" | "discussion">("summary");

  // Simulated AI Research output matching the strict spec structure
  const researchData: ResearchOutput = {
    topic: topicName,
    executiveSummary: `This deep dive examines the scaling mechanisms of modern high-throughput architectures when handling transactional structures under microsecond constraints. Specifically, it reviews the convergence of log-structured stream brokers (Apache Kafka) with columnar analytical databases (ClickHouse) to solve real-time post-engagement metrics reporting.`,
    whyItMatters: `Standard transactional databases (PostgreSQL/MySQL) fail under analytical ingestion volumes exceeding 10k events/sec. Decoupling the ingestion loop guarantees database durability, reduces read contention, and provides executives with live, sub-second engagement insight panels.`,
    industryImpact: `Affects SaaS providers, marketing analytics engines, and enterprise platforms needing real-time dashboards without raising database resource footprints or cloud costs.`,
    techBreakdown: `Events are published asynchronously to partitioned Kafka queues. A background batching consumer processes event arrays in chunks of 5,000 or every 500ms, writing them via bulk TCP/HTTP endpoints directly into ClickHouse's MergeTree engine. PostgreSQL maintains the tenant and schema boundaries using RLS security.`,
    useCases: [
      "Real-time impressions and click-through analytics on SaaS platforms.",
      "Fraud checking and rate-limit checking on high-velocity user event flows.",
      "Live leaderboards for employee advocacy campaigns containing millions of logs."
    ],
    marketTrends: [
      "Increasing shift towards clickstream analytical warehouse solutions.",
      "Adoption of zero-copy telemetry streams over standard REST endpoints.",
      "Growing requirement for localized data residency compliance."
    ],
    challenges: [
      "Event duplication and strict message ordering in Kafka partition clusters.",
      "ClickHouse column indexing alignment for quick query aggregates.",
      "Client-side connection sandboxing fallback in offline zones."
    ],
    futureOutlook: "6-24 Month Forecast: Transition towards serverless analytical queries and hybrid transactional-analytical (HTAP) engines.",
    contrarianPerspectives: "While columnar databases excel at aggregation, they are poor at single-row mutations. Platforms that over-engineer analytics storage early face higher operational overhead and deployment complexity compared to structured Postgres indexing.",
    references: [
      "ClickHouse Ingestion Benchmarks, Vol 14 (2025)",
      "Confluent Kafka Partitioning Best Practices (2026)",
      "Designing Data-Intensive Applications, Kleppmann"
    ],
    discussionStarters: [
      "Are you still running analytical aggregations directly on your Postgres transactional replica?",
      "Why real-time dashboard accuracy is often an expensive, over-engineered illusion.",
      "Columnar analytical engines vs. standard SQL indexes: where is the performance tipping point?"
    ],
    angles: [
      {
        name: "Teach the Concept",
        type: "Educational",
        description: "A step-by-step breakdown of how Apache Kafka coordinates with ClickHouse's MergeTree tables.",
        authority: 94,
        virality: 72,
        educational: 98,
        discussion: 64,
        audienceMatch: 90
      },
      {
        name: "Business Implications",
        type: "Strategic",
        description: "How shifting to columnar databases cuts infrastructure costs by up to 60%.",
        authority: 88,
        virality: 80,
        educational: 82,
        discussion: 75,
        audienceMatch: 86
      },
      {
        name: "Management Perspective",
        type: "Leadership",
        description: "Guiding your engineering team away from premature HTAP database optimization.",
        authority: 90,
        virality: 85,
        educational: 78,
        discussion: 92,
        audienceMatch: 94
      },
      {
        name: "Practical Example",
        type: "Case Study",
        description: "How we scaled Fluxora's event ingestion rates to 1,000+ posts per day with <1.5s latency.",
        authority: 95,
        virality: 88,
        educational: 90,
        discussion: 86,
        audienceMatch: 92
      },
      {
        name: "Challenge Assumptions",
        type: "Contrarian",
        description: "Why most startups don't need ClickHouse and should stick to simple Postgres indexes.",
        authority: 92,
        virality: 94,
        educational: 85,
        discussion: 98,
        audienceMatch: 88
      },
      {
        name: "Emerging Possibilities",
        type: "Future Vision",
        description: "The 24-month horizon: Zero-ETL real-time analytical loops.",
        authority: 86,
        virality: 82,
        educational: 84,
        discussion: 78,
        audienceMatch: 82
      },
      {
        name: "Practical Execution",
        type: "Implementation Guide",
        description: "A complete NestJS control setup for batch processing Kafka streams to ClickHouse REST APIs.",
        authority: 96,
        virality: 65,
        educational: 99,
        discussion: 58,
        audienceMatch: 85
      }
    ]
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-400";
    if (score >= 75) return "text-[#8B5CF6]";
    return "text-amber-400";
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-[#0B0B0F]/70 backdrop-blur-md" />

      {/* Sliding Work Area */}
      <div className="relative w-full max-w-4xl h-full bg-[#121218] border-l border-white/[0.08] shadow-2xl flex flex-col overflow-hidden text-white">
        
        {/* Header */}
        <div className="p-6 border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#8B5CF6] uppercase tracking-wider">
              <Icons.SearchCode className="w-4 h-4" />
              <span>AI Deep Research Workspace</span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1">Research Output: {topicName}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/[0.04] rounded-lg text-[#A1A1AA] hover:text-white transition cursor-pointer"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Subtabs */}
        <div className="flex bg-[#0B0B0F] border-b border-white/[0.08] px-6 py-2 gap-1.5">
          {[
            { id: "summary", label: "Executive Summary", icon: "FileText" },
            { id: "technology", label: "Tech Breakdown", icon: "Code" },
            { id: "market", label: "Market Adoption", icon: "BarChart3" },
            { id: "angles", label: "Content Angles", icon: "Compass" },
            { id: "discussion", label: "Discussion Triggers", icon: "MessageSquareCode" }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                  isActive ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-white hover:bg-white/[0.02]"
                }`}
              >
                {isActive ? tab.label : tab.label.split(" ")[0]}
              </button>
            );
          })}
        </div>

        {/* Main research read area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "summary" && (
            <div className="space-y-6">
              <div className="bg-[#0B0B0F]/40 border border-white/[0.04] p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Executive Abstract</h4>
                <p className="text-sm text-[#A1A1AA] leading-relaxed">{researchData.executiveSummary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0B0B0F]/40 border border-white/[0.04] p-5 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Why It Matters</h4>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">{researchData.whyItMatters}</p>
                </div>
                <div className="bg-[#0B0B0F]/40 border border-white/[0.04] p-5 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Industry Impact</h4>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">{researchData.industryImpact}</p>
                </div>
              </div>

              <div className="bg-yellow-500/5 border border-yellow-500/15 p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Icons.AlertOctagon className="w-4.5 h-4.5" />
                  Contrarian Viewpoint
                </h4>
                <p className="text-xs text-yellow-100/80 leading-relaxed">{researchData.contrarianPerspectives}</p>
              </div>

              <div className="bg-[#0B0B0F]/20 border border-white/[0.04] p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">References & Citations</h4>
                <ul className="space-y-1.5">
                  {researchData.references.map((r, i) => (
                    <li key={i} className="text-xs text-[#A1A1AA] flex items-center gap-2">
                      <Icons.Link className="w-3.5 h-3.5 text-[#8B5CF6]" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === "technology" && (
            <div className="space-y-6">
              <div className="bg-[#0B0B0F]/45 border border-white/[0.04] p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Technical Breakdown</h4>
                <p className="text-sm text-[#A1A1AA] leading-relaxed font-mono whitespace-pre-wrap">{researchData.techBreakdown}</p>
              </div>

              <div className="bg-[#0B0B0F]/40 border border-white/[0.04] p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Real-world Use Cases</h4>
                <div className="space-y-3">
                  {researchData.useCases.map((uc, i) => (
                    <div key={i} className="flex gap-3 items-start text-xs leading-relaxed text-[#A1A1AA]">
                      <span className="w-5 h-5 rounded bg-[#8B5CF6]/15 border border-[#8B5CF6]/20 text-[#8B5CF6] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <span>{uc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "market" && (
            <div className="space-y-6">
              <div className="bg-[#0B0B0F]/40 border border-white/[0.04] p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Current Market Trends</h4>
                <ul className="space-y-2 text-xs text-[#A1A1AA]">
                  {researchData.marketTrends.map((t, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Icons.TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#0B0B0F]/40 border border-white/[0.04] p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Adoption Challenges & Risks</h4>
                <ul className="space-y-2 text-xs text-[#A1A1AA]">
                  {researchData.challenges.map((c, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Icons.AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#7C3AED]/5 border border-[#7C3AED]/20 p-5 rounded-2xl">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Future Outlook</h4>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">{researchData.futureOutlook}</p>
              </div>
            </div>
          )}

          {activeTab === "angles" && (
            <div className="space-y-4">
              <div className="border-b border-white/[0.04] pb-3">
                <h4 className="text-sm font-bold text-white">Generated Content Narrative Angles</h4>
                <p className="text-xs text-[#A1A1AA] mt-0.5">Select a pre-calculated narrative angle to generate corresponding copy in the Content Studio.</p>
              </div>

              <div className="space-y-3">
                {researchData.angles.map((ang) => (
                  <div
                    key={ang.name}
                    className="p-4 bg-[#0B0B0F]/55 border border-white/[0.04] rounded-2xl hover:border-[#8B5CF6]/30 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6]">
                          {ang.type}
                        </span>
                        <span className="text-xs font-bold text-white">{ang.name}</span>
                      </div>
                      <p className="text-xs text-[#A1A1AA]">{ang.description}</p>
                    </div>

                    {/* Angle Scores */}
                    <div className="flex gap-4 items-center">
                      <div className="grid grid-cols-5 gap-2 text-center">
                        {[
                          { label: "AUTH", val: ang.authority },
                          { label: "VIRAL", val: ang.virality },
                          { label: "EDU", val: ang.educational },
                          { label: "DISC", val: ang.discussion },
                          { label: "MATCH", val: ang.audienceMatch }
                        ].map((s) => (
                          <div key={s.label} className="bg-[#121218] border border-white/[0.06] p-1.5 rounded-lg text-[8px]">
                            <span className="text-[#A1A1AA] block">{s.label}</span>
                            <span className={`font-mono font-bold ${getScoreColor(s.val)}`}>{s.val}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          onSelectAngle(`Topic: ${topicName}\nAngle: ${ang.name} (${ang.type})\nOverview: ${ang.description}`);
                        }}
                        className="bg-white text-black hover:bg-zinc-200 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition flex-shrink-0"
                      >
                        Write
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "discussion" && (
            <div className="space-y-6">
              <div className="bg-[#0B0B0F]/45 border border-white/[0.04] p-5 rounded-2xl space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Discussion Starters</h4>
                  <p className="text-[10px] text-[#A1A1AA] mt-0.5">Use these prompts to spark online conversation and target user commentary.</p>
                </div>
                <div className="space-y-2">
                  {researchData.discussionStarters.map((s, i) => (
                    <div key={i} className="p-3 bg-[#121218]/40 border border-white/[0.03] rounded-xl text-xs text-[#A1A1AA] flex items-center gap-2">
                      <Icons.MessageSquareQuote className="w-4 h-4 text-[#8B5CF6] flex-shrink-0" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
