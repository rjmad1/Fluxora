"use client";

import React, { useState } from "react";
import * as Icons from "lucide-react";
import { motion } from "framer-motion";

interface PersonalHubDashboardProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
}

export default function PersonalHubDashboard({ onNotify }: PersonalHubDashboardProps) {
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [cvText, setCvText] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("overview");

  // Health Metrics
  const healthMetrics = [
    { title: "Brand Consistency", score: 92, status: "Excellent", color: "text-[#22C55E]" },
    { title: "Authority Score", score: 78, status: "High", color: "text-[#8B5CF6]" },
    { title: "Reach Index", score: 85, status: "Growing", color: "text-[#3B82F6]" },
    { title: "Influence Factor", score: 71, status: "Strong", color: "text-pink-500" },
    { title: "Engagement Rate", score: 8.4, status: "Above Average", color: "text-[#F59E0B]" },
  ];

  // Recommendations
  const recommendations = [
    { id: 1, type: "Campaign", title: "Scale Up: Agentic AI series", reason: "Leverages Core Expertise and matches trending industry searches." },
    { id: 2, type: "Format", title: "LinkedIn Carousel: Temporal Workflows vs BullMQ", reason: "Visual formats have 4.2x higher click-through-rates with your core audience." },
    { id: 3, type: "Topic Opportunity", title: "How postgres RLS protects enterprise SaaS data", reason: "Aligns with your Career OS skill mapping." },
  ];

  const handleIngestion = async (type: "linkedin" | "resume" | "website") => {
    setIngesting(true);
    let url = "";
    let body = {};
    if (type === "linkedin") {
      url = "http://localhost:3000/api/personal-hub/ingest/linkedin";
      body = { url: linkedinUrl };
    } else if (type === "website") {
      url = "http://localhost:3000/api/personal-hub/ingest/website";
      body = { url: websiteUrl };
    } else {
      url = "http://localhost:3000/api/personal-hub/ingest/resume";
      body = { resumeText: cvText };
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": "Fluxora-Tenant-098",
          "X-Workspace-ID": "ws-1",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Ingestion API offline");
      const data = await res.json();
      onNotify(`Personal Hub: ${data.message || "Ingestion complete!"}`, "AUDIT");
    } catch {
      // Offline fallback
      setTimeout(() => {
        onNotify(`Demo Mode: Asynchronously parsed ${type} data and enriched your Personal Knowledge Graph.`, "AUDIT");
      }, 1000);
    } finally {
      setTimeout(() => {
        setIngesting(false);
        setLinkedinUrl("");
        setWebsiteUrl("");
        setCvText("");
      }, 1200);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/[0.08] pb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Icons.Brain className="w-8 h-8 text-[#8B5CF6]" />
            Personal Hub Command Center
          </h2>
          <p className="text-xs text-[#A1A1AA] mt-1">Configure your personal digital twin, map your career trajectory, and enrich your knowledge base.</p>
        </div>

        {/* Local sub-tabs selector */}
        <div className="flex bg-[#121218] border border-white/[0.08] rounded-xl p-1 gap-1">
          {["overview", "ingestion", "recommendations"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                activeSubTab === tab ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === "overview" && (
        <>
          {/* Brand Health score cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {healthMetrics.map((m) => (
              <div
                key={m.title}
                className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121218]/40 p-5 shadow-xl hover:border-white/[0.12] transition duration-200"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-[#8B5CF6]/5 blur-2xl rounded-full"></div>
                <h4 className="text-[10px] uppercase text-[#A1A1AA] tracking-wider font-semibold">{m.title}</h4>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className={`text-4xl font-extrabold tracking-tight ${m.color}`}>
                    {m.score}
                    {m.title === "Engagement Rate" ? "%" : ""}
                  </span>
                </div>
                <p className="text-[10px] text-[#A1A1AA] mt-2 font-mono">{m.status}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Profile Summary preview */}
            <div className="lg:col-span-2 bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Icons.UserCheck className="w-4.5 h-4.5 text-[#8B5CF6]" />
                <span>Identity Alignment Blueprint</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p className="text-[#A1A1AA] font-semibold">Brand Pillars</p>
                  <p className="text-white font-medium">✨ Technical Architectures, Scalability, Devops Governance</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[#A1A1AA] font-semibold">Tone profile</p>
                  <p className="text-white font-medium">🗣️ Direct, Technical, Authoritative but approachable</p>
                </div>
                <div className="space-y-1 mt-2">
                  <p className="text-[#A1A1AA] font-semibold">Publishing Goal</p>
                  <p className="text-white font-medium">📈 Grow authority from creator to tech advisor</p>
                </div>
                <div className="space-y-1 mt-2">
                  <p className="text-[#A1A1AA] font-semibold">Target Seniority</p>
                  <p className="text-white font-medium">👥 Principal Engineers, CTOs, Tech Directors</p>
                </div>
              </div>

              {/* Progress Bar of Personal Knowledge Graph */}
              <div className="pt-4 border-t border-white/[0.04] space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-[#A1A1AA]">
                  <span>Knowledge Graph Completeness</span>
                  <span>78%</span>
                </div>
                <div className="w-full bg-[#0B0B0F] h-2 rounded-full overflow-hidden border border-white/[0.08]">
                  <div className="bg-gradient-to-r from-[#7C3AED] to-pink-500 h-full w-[78%]"></div>
                </div>
              </div>
            </div>

            {/* AI Insights Card */}
            <div className="bg-gradient-to-br from-[#121218] to-[#7C3AED]/5 border border-[#7C3AED]/20 rounded-2xl p-5 shadow-xl space-y-3.5">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Icons.Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                <span>Twin Tuning Insights</span>
              </h3>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                💡 We analyzed your recent LinkedIn publications. Your twin's formality index has been adjusted from <strong>0.5 to 0.6</strong> to better fit executive audience segments.
              </p>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                🚀 Recommending posting a thread about ClickHouse performance. Search queries for ClickHouse ingestion are up <strong>24%</strong> this week.
              </p>
            </div>
          </div>
        </>
      )}

      {activeSubTab === "ingestion" && (
        <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-white/[0.04] pb-4">
            <h3 className="text-lg font-bold text-white">Progressive Knowledge Graph Ingestion</h3>
            <p className="text-xs text-[#A1A1AA] mt-1">Import external materials to dynamically parse expertise, skills, interests, and enrich your brand profile.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* LinkedIn profile */}
            <div className="bg-[#0B0B0F]/50 border border-white/[0.04] hover:border-white/[0.08] p-5 rounded-2xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Icons.Share2 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">Import LinkedIn Profile</h4>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">Parse experience history, headline, current role, and skills list.</p>
                <input
                  type="text"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full bg-[#121218] border border-white/[0.08] text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                disabled={ingesting || !linkedinUrl}
                onClick={() => handleIngestion("linkedin")}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
              >
                {ingesting ? "Processing..." : "Import Profile"}
              </button>
            </div>

            {/* Resume Upload */}
            <div className="bg-[#0B0B0F]/50 border border-white/[0.04] hover:border-white/[0.08] p-5 rounded-2xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/30 flex items-center justify-center text-[#8B5CF6]">
                  <Icons.FileText className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">Ingest Resume / CV</h4>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">Extract core technical certifications, previous milestones, and competencies.</p>
                <textarea
                  placeholder="Paste CV summary or career details..."
                  rows={2}
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  className="w-full bg-[#121218] border border-white/[0.08] text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>
              <button
                disabled={ingesting || !cvText}
                onClick={() => handleIngestion("resume")}
                className="mt-4 w-full bg-[#7C3AED] hover:bg-[#8B5CF6] disabled:opacity-50 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
              >
                {ingesting ? "Analyzing CV..." : "Submit CV Details"}
              </button>
            </div>

            {/* Personal Website */}
            <div className="bg-[#0B0B0F]/50 border border-white/[0.04] hover:border-white/[0.08] p-5 rounded-2xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                  <Icons.Globe className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">Ingest Website / Blog</h4>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">Crawl personal portfolio or published articles to capture writing styles.</p>
                <input
                  type="text"
                  placeholder="https://mywebsite.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full bg-[#121218] border border-white/[0.08] text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
              </div>
              <button
                disabled={ingesting || !websiteUrl}
                onClick={() => handleIngestion("website")}
                className="mt-4 w-full bg-pink-500 hover:bg-pink-400 disabled:opacity-50 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
              >
                {ingesting ? "Crawling Page..." : "Analyze Website"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "recommendations" && (
        <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="border-b border-white/[0.04] pb-4">
            <h3 className="text-lg font-bold text-white">AI Personalization Recommendations</h3>
            <p className="text-xs text-[#A1A1AA] mt-1">Suggested content and campaign strategies aligned with your brand guidelines and goals.</p>
          </div>

          <div className="space-y-3.5">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="flex items-start gap-4 p-4 bg-[#0B0B0F]/45 border border-white/[0.04] rounded-2xl hover:border-[#8B5CF6]/35 hover:bg-[#0B0B0F]/80 transition duration-150"
              >
                <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6] flex-shrink-0">
                  {rec.type === "Campaign" && <Icons.Send className="w-4 h-4" />}
                  {rec.type === "Format" && <Icons.Layout className="w-4 h-4" />}
                  {rec.type === "Topic Opportunity" && <Icons.TrendingUp className="w-4 h-4" />}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-[#8B5CF6] bg-[#8B5CF6]/10 px-2 py-0.5 rounded-full">{rec.type}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">{rec.title}</h4>
                  <p className="text-xs text-[#A1A1AA]">{rec.reason}</p>
                </div>

                <button
                  onClick={() => onNotify(`Created action plan for recommended ${rec.type}`, "INFO")}
                  className="bg-white/[0.02] hover:bg-[#8B5CF6] text-white hover:text-white border border-white/[0.08] hover:border-transparent text-xs font-semibold px-3 py-1.5 rounded-lg transition duration-150 cursor-pointer"
                >
                  Apply
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
