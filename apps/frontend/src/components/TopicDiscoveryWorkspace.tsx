"use client";

import React, { useState } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ResearchWorkspace from "./ResearchWorkspace";

interface CandidateTopic {
  id: string;
  name: string;
  description: string;
  trendScore: number;
  authorityScore: number;
  audienceFitScore: number;
  difficultyScore: number;
  expectedEngagementScore: number;
  confidenceScore: number;
  compositeScore: number;
  favorite: boolean;
}

interface TopicDiscoveryWorkspaceProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
  onSelectAngle: (angleText: string) => void;
}

export default function TopicDiscoveryWorkspace({ onNotify, onSelectAngle }: TopicDiscoveryWorkspaceProps) {
  // Input fields
  const [keyword, setKeyword] = useState("");
  const [industry, setIndustry] = useState("AI & Emerging Tech");
  const [discovering, setDiscovering] = useState(false);
  
  // Research overlay state
  const [researchedTopic, setResearchedTopic] = useState<string | null>(null);

  // Initial candidate topics
  const [topics, setTopics] = useState<CandidateTopic[]>([
    {
      id: "topic-1",
      name: "Scaling Columnar Analytics with ClickHouse",
      description: "How decoupled event-driven streaming to ClickHouse database pipelines ensures analytics performance under heavy workloads.",
      trendScore: 92,
      authorityScore: 95,
      audienceFitScore: 88,
      difficultyScore: 78,
      expectedEngagementScore: 90,
      confidenceScore: 87,
      compositeScore: 90,
      favorite: true
    },
    {
      id: "topic-2",
      name: "Designing Secure Tenant Isolation in Postgres",
      description: "Implementing PostgreSQL Row-Level Security (RLS) to enforce workspace isolation filters in multi-tenant SaaS environments.",
      trendScore: 84,
      authorityScore: 89,
      audienceFitScore: 91,
      difficultyScore: 68,
      expectedEngagementScore: 82,
      confidenceScore: 94,
      compositeScore: 86,
      favorite: false
    },
    {
      id: "topic-3",
      name: " Thompson Sampling for Dynamic Creative Routing",
      description: "Using multi-armed bandit Beta distribution models to dynamically route users to top performing copywriting assets.",
      trendScore: 78,
      authorityScore: 82,
      audienceFitScore: 85,
      difficultyScore: 84,
      expectedEngagementScore: 76,
      confidenceScore: 80,
      compositeScore: 81,
      favorite: false
    },
    {
      id: "topic-4",
      name: "Premature HTAP Optimization Pitfalls",
      description: "A contrarian exploration of why early-stage tech startups should stick to Postgres indexes rather than deploying ClickHouse.",
      trendScore: 86,
      authorityScore: 90,
      audienceFitScore: 94,
      difficultyScore: 72,
      expectedEngagementScore: 95,
      confidenceScore: 91,
      compositeScore: 91,
      favorite: false
    }
  ]);

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    // Check duplicate
    if (topics.some((t) => t.name.toLowerCase() === keyword.trim().toLowerCase())) {
      onNotify("Topic already exists in candidates.", "WARN");
      return;
    }

    setDiscovering(true);
    setTimeout(() => {
      const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
      const trend = rand(65, 98);
      const auth = rand(60, 96);
      const aud = rand(70, 95);
      const diff = rand(50, 90);
      const eng = rand(60, 95);
      const conf = rand(75, 98);
      const comp = Math.round((trend * 0.3) + (auth * 0.3) + (aud * 0.2) + (eng * 0.2));

      const newTopic: CandidateTopic = {
        id: `topic-${Date.now()}`,
        name: keyword.trim(),
        description: `Autonomous search brief covering emerging patterns in ${keyword.trim()} under ${industry} vertical.`,
        trendScore: trend,
        authorityScore: auth,
        audienceFitScore: aud,
        difficultyScore: diff,
        expectedEngagementScore: eng,
        confidenceScore: conf,
        compositeScore: comp,
        favorite: false
      };

      setTopics([newTopic, ...topics]);
      setKeyword("");
      setDiscovering(false);
      onNotify(`Discovered and analyzed topic: "${newTopic.name}"`, "INFO");
    }, 1000);
  };

  const handleExclude = (id: string) => {
    const topic = topics.find((t) => t.id === id);
    setTopics(topics.filter((t) => t.id !== id));
    onNotify(`Excluded topic: "${topic?.name}"`, "WARN");
  };

  const handleFavoriteToggle = (id: string) => {
    setTopics(
      topics.map((t) => {
        if (t.id === id) {
          const nextFav = !t.favorite;
          onNotify(nextFav ? `Added "${t.name}" to favorites.` : `Removed "${t.name}" from favorites.`, "INFO");
          return { ...t, favorite: nextFav };
        }
        return t;
      })
    );
  };

  const handleReplace = (id: string) => {
    const topic = topics.find((t) => t.id === id);
    if (!topic) return;

    onNotify(`Regenerating details for topic: "${topic.name}"...`, "INFO");
    setDiscovering(true);
    setTimeout(() => {
      const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
      setTopics(
        topics.map((t) => {
          if (t.id === id) {
            return {
              ...t,
              trendScore: rand(65, 98),
              authorityScore: rand(60, 96),
              audienceFitScore: rand(70, 95),
              difficultyScore: rand(50, 90),
              expectedEngagementScore: rand(60, 95),
              compositeScore: rand(70, 95)
            };
          }
          return t;
        })
      );
      setDiscovering(false);
      onNotify(`Regenerated data details for: "${topic.name}"`, "AUDIT");
    }, 800);
  };

  const getScoreColor = (score: number) => {
    if (score >= 88) return "text-emerald-400";
    if (score >= 75) return "text-[#8B5CF6]";
    return "text-amber-400";
  };

  return (
    <div className="space-y-6">
      {/* Search Input Banner */}
      <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white">Niche Topic Discovery</h3>
          <p className="text-xs text-[#A1A1AA] mt-1">Enter target technologies or themes to calculate authority mapping weights and discover emerging context cards.</p>
        </div>

        <form onSubmit={handleManualAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <input
              type="text"
              required
              placeholder="Enter keywords or topic theme (e.g. Row Level Security)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
            />
          </div>
          <div className="md:col-span-1">
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full h-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-xl px-3 cursor-pointer focus:outline-none"
            >
              <option value="AI & Emerging Tech">AI & Emerging Tech</option>
              <option value="Product Management">Product Management</option>
              <option value="Data Infrastructure">Data Infrastructure</option>
              <option value="Engineering & Devops">Engineering & Devops</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={discovering || !keyword.trim()}
            className="md:col-span-1 bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            {discovering ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                <span>Searching Trends...</span>
              </>
            ) : (
              <>
                <Icons.Sparkles className="w-4 h-4" />
                <span>Discover Candidates</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Candidates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {topics.map((t) => (
          <div
            key={t.id}
            className="bg-[#121218] border border-white/[0.08] hover:border-white/[0.12] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 transition"
          >
            {/* Header: Title and Fav */}
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1 pr-3">
                <h4 className="text-sm font-bold text-white leading-tight truncate">{t.name}</h4>
                <p className="text-xs text-[#A1A1AA] mt-1 line-clamp-2">{t.description}</p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleFavoriteToggle(t.id)}
                  className={`p-1 hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer ${
                    t.favorite ? "text-amber-400 animate-pulse" : "text-zinc-600 hover:text-amber-400"
                  }`}
                >
                  <Icons.Star className="w-4 h-4 fill-current" />
                </button>
                <button
                  type="button"
                  onClick={() => handleExclude(t.id)}
                  className="p-1 hover:bg-rose-500/10 text-zinc-600 hover:text-rose-400 rounded-lg transition cursor-pointer"
                  title="Exclude Topic"
                >
                  <Icons.Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-3 gap-2 bg-[#0B0B0F]/40 border border-white/[0.04] p-3 rounded-xl">
              {[
                { label: "Composite", val: t.compositeScore },
                { label: "Trend", val: t.trendScore },
                { label: "Authority", val: t.authorityScore },
                { label: "Audience Fit", val: t.audienceFitScore },
                { label: "Difficulty", val: t.difficultyScore },
                { label: "Engagement", val: t.expectedEngagementScore }
              ].map((m) => (
                <div key={m.label} className="text-center">
                  <span className="text-[8px] uppercase font-semibold text-zinc-500 block">{m.label}</span>
                  <span className={`font-mono text-xs font-bold ${getScoreColor(m.val)}`}>{m.val}</span>
                </div>
              ))}
            </div>

            {/* Actions Panel */}
            <div className="flex justify-between items-center pt-2 border-t border-white/[0.04]">
              <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                <Icons.CheckCircle2 className="w-3.5 h-3.5 text-[#8B5CF6]" />
                Confidence: {t.confidenceScore}%
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleReplace(t.id)}
                  className="bg-[#121218]/80 hover:bg-white/[0.02] border border-white/[0.08] text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  Re-evaluate
                </button>
                <button
                  type="button"
                  onClick={() => setResearchedTopic(t.name)}
                  className="bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 border border-[#7C3AED]/30 text-[#8B5CF6] text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1"
                >
                  <Icons.SearchCode className="w-3.5 h-3.5" />
                  <span>Research</span>
                </button>
              </div>
            </div>
          </div>
        ))}
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
