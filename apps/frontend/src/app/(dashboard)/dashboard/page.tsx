"use client";

import React from "react";
import { useAppContext } from "@/context/AppContext";
import DashboardCard from "@/components/DashboardCard";
import AIInsightCard from "@/components/AIInsightCard";
import * as Icons from "lucide-react";

export default function DashboardPage() {
  const {
    activeWorkflows,
    metrics,
    setDrawerOpen,
    handleChipAction,
    simPlatform,
    setSimPlatform,
    simEventType,
    setSimEventType,
    simulating,
    simulateEvent,
  } = useAppContext();

  return (
    <div className="space-y-6">
      {/* Page Title & Context Details */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Executive Command</h2>
          <p className="text-xs text-[#A1A1AA] mt-1">Workspace analytics summary, workflow performance, and AI-assisted campaigns.</p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-[#7C3AED]/20 transition-all cursor-pointer"
        >
          <Icons.Plus className="w-4 h-4" />
          <span>Create Post</span>
        </button>
      </div>

      {/* Dashboard widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Scheduled Tasks"
          value={activeWorkflows.filter((w) => w.status === "Scheduled").length}
          change={{ value: 8.4, type: "increase", label: "vs yesterday" }}
          sparklineData={[3, 4, 3, 5, 4, 6, 8]}
          icon={<Icons.Clock className="w-4 h-4" />}
        />
        <DashboardCard
          title="Published Today"
          value="14"
          change={{ value: 12.5, type: "increase", label: "vs last week" }}
          sparklineData={[10, 12, 9, 15, 11, 14, 14]}
          icon={<Icons.CheckCircle2 className="w-4 h-4" />}
        />
        <DashboardCard
          title="Telemetry Views"
          value={metrics ? (metrics.views / 1000).toFixed(1) + "K" : "142.8K"}
          change={{ value: 12.4, type: "increase", label: "vs last week" }}
          sparklineData={[120, 125, 128, 131, 135, 140, 142]}
          icon={<Icons.TrendingUp className="w-4 h-4" />}
        />
        <DashboardCard
          title="Net Engagement"
          value={metrics ? metrics.clicks.toLocaleString() : "8,491"}
          change={{ value: 4.8, type: "increase", label: "vs yesterday" }}
          sparklineData={[7900, 8100, 8000, 8300, 8200, 8400, 8491]}
          icon={<Icons.Activity className="w-4 h-4" />}
        />
      </div>

      {/* AI Insights & Telemetry Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AIInsightCard
            insights={[
              "Your LinkedIn engagement is up 12% following technical breakdowns.",
              "Best posting window: 9:00 AM – 11:00 AM on Tuesdays and Thursdays.",
              "Adding visual graphic banners boosts click-through rates by up to 25%."
            ]}
            ctaLabel="Compose Post using suggestions"
            onCtaClick={() => handleChipAction("post")}
          />

          {/* Scheduled workflows list */}
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Recent Temporal Schedules</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-pulse"></span>
            </h3>
            
            <div className="space-y-3">
              {activeWorkflows.map((wf) => (
                <div
                  key={wf.id}
                  className="flex items-center justify-between p-3.5 bg-[#0B0B0F]/50 border border-white/[0.04] hover:border-white/[0.08] rounded-xl transition"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-[#8B5CF6] font-semibold">{wf.id}</span>
                      <span className="text-[10px] text-[#A1A1AA]">• {wf.type}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white truncate">{wf.target}</h4>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      wf.status === "Scheduled"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : wf.status === "Running"
                        ? "bg-[#7C3AED]/10 text-[#8B5CF6] border border-[#7C3AED]/20 animate-pulse"
                        : "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20"
                    }`}>
                      {wf.status}
                    </span>
                    <p className="text-[9px] text-[#A1A1AA] font-mono mt-1">{wf.scheduled}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ClickHouse Telemetry Ingestion Simulator */}
        <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-1">Telemetry Simulator</h3>
            <p className="text-[11px] text-[#A1A1AA] mb-4">Ingest synthetic metrics directly into ClickHouse to verify pipelines.</p>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase text-[#A1A1AA] tracking-wider block mb-1.5 font-bold">Platform</label>
                <select
                  value={simPlatform}
                  onChange={(e) => setSimPlatform(e.target.value)}
                  className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED] cursor-pointer"
                >
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">Twitter / X</option>
                  <option value="facebook">Facebook</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase text-[#A1A1AA] tracking-wider block mb-1.5 font-bold">Event Type</label>
                <select
                  value={simEventType}
                  onChange={(e) => setSimEventType(e.target.value)}
                  className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED] cursor-pointer"
                >
                  <option value="post.impression">View (Impression)</option>
                  <option value="post.click">Click</option>
                  <option value="post.share">Share</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/[0.04] mt-6">
            <button
              onClick={simulateEvent}
              disabled={simulating}
              className="w-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-[#7C3AED]/15 transition cursor-pointer"
            >
              {simulating ? "Publishing Event..." : "⚡ Simulate Telemetry Event"}
            </button>
            <p className="text-[10px] text-[#A1A1AA]/60 font-mono text-center mt-2.5">Streaming via Kafka queue → ClickHouse DB</p>
          </div>
        </div>
      </div>
    </div>
  );
}
