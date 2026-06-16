"use client";

import React from "react";
import { useAppContext } from "@/context/AppContext";
import * as Icons from "lucide-react";

export default function AnalyticsPage() {
  const {
    metrics,
    isExportingPdf,
    setIsExportingPdf,
    setActivityLogs,
    topPostsFilter,
    setTopPostsFilter,
  } = useAppContext();

  const handleNotify = (msg: string, level: "INFO" | "AUDIT" | "WARN") => {
    const timestamp = new Date().toLocaleTimeString();
    setActivityLogs((prev) => [
      ...prev,
      { id: Date.now().toString(), timestamp, level, msg },
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#121218] border border-white/[0.08] p-5 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Executive Analytics</h2>
          <p className="text-xs text-[#A1A1AA] mt-1">Ingestion rates, click attribution CTR calculations, and top-performing post telemetry summaries.</p>
        </div>

        {/* PDF Exporter Button */}
        <button
          onClick={() => {
            setIsExportingPdf(true);
            const timestamp = new Date().toLocaleTimeString();
            setActivityLogs((prev) => [
              ...prev,
              { id: Date.now().toString(), timestamp, level: "AUDIT", msg: "Generated executive analytics PDF report" },
            ]);
            setTimeout(() => {
              setIsExportingPdf(false);
              alert("Executive Analytics PDF Report compiled and downloaded successfully!");
            }, 1500);
          }}
          disabled={isExportingPdf}
          className="bg-[#7C3AED] hover:bg-[#8B5CF6] disabled:opacity-50 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-[#7C3AED]/20 transition-all cursor-pointer"
        >
          {isExportingPdf ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
              <span>Compiling Report...</span>
            </>
          ) : (
            <>
              <Icons.Download className="w-4 h-4" />
              <span>Export PDF Report</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Custom Premium SVG Area Chart (Impressions over Time) */}
        <div className="lg:col-span-2 bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Weekly Impressions Trend</h3>
              <p className="text-[10px] text-[#A1A1AA]">Visualized from ClickHouse event persistence logs</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-[#A1A1AA]">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#7C3AED]"></span>Views</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>Clicks</span>
            </div>
          </div>

          <div className="h-56 w-full relative pt-4">
            {/* SVG Area Chart */}
            <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Grid Lines */}
              <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

              {/* Views Area & Line */}
              <path
                d="M 0 170 Q 75 140 150 110 T 300 80 T 450 60 L 500 55 L 500 200 L 0 200 Z"
                fill="url(#viewsGrad)"
              />
              <path
                d="M 0 170 Q 75 140 150 110 T 300 80 T 450 60 L 500 55"
                fill="none"
                stroke="#7C3AED"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              
              {/* Interactive Dots on Chart */}
              <circle cx="150" cy="110" r="4" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="1.5" />
              <circle cx="300" cy="80" r="4" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="1.5" />
              <circle cx="450" cy="60" r="4" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="1.5" />
            </svg>

            {/* X-axis labels */}
            <div className="flex justify-between items-center text-[9px] text-[#A1A1AA] font-mono mt-2 px-1">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>

        {/* Radial Engagement Indicator */}
        <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl flex flex-col justify-between items-center text-center">
          <div className="w-full text-left">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Net Engagement Rate</h3>
            <p className="text-[10px] text-[#A1A1AA]">Average conversion rate across workspaces</p>
          </div>

          <div className="relative w-36 h-36 flex items-center justify-center my-4">
            {/* Radial Gauge SVG */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="6" fill="transparent" />
              <circle cx="50" cy="50" r="40" stroke="url(#accentGrad)" strokeWidth="6" fill="transparent"
                strokeDasharray="251.2" strokeDashoffset="100.4" strokeLinecap="round" />
              <defs>
                <linearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#7C3AED" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-white font-mono">5.94%</span>
              <span className="text-[9px] text-[#22C55E] font-bold">Excellent</span>
            </div>
          </div>

          <div className="w-full flex justify-around border-t border-white/[0.04] pt-3 text-[10px] text-[#A1A1AA]">
            <div>
              <span className="block text-white font-bold font-mono">142.8K</span>
              <span>Impressions</span>
            </div>
            <div className="border-r border-white/[0.06] h-6" />
            <div>
              <span className="block text-white font-bold font-mono">8,491</span>
              <span>Clicks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Platform comparison and Top Performing Post details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attributions breakdown */}
        <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4 lg:col-span-1">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Cross-Platform Comparison</h3>
          
          <div className="space-y-4">
            {Object.entries(metrics?.byPlatform || {
              linkedin: { views: 82400, clicks: 4900, shares: 720 },
              twitter: { views: 51200, clicks: 3100, shares: 410 },
              facebook: { views: 9200, clicks: 491, shares: 110 },
            }).map(([platform, platData]) => {
              const totalViews = metrics?.views || 142800;
              const percentage = totalViews > 0 ? ((platData.views / totalViews) * 100).toFixed(0) : "0";
              
              return (
                <div key={platform} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="capitalize font-bold text-white">{platform}</span>
                    <span className="text-[#A1A1AA] font-mono text-[10px]">{platData.views.toLocaleString()} ({percentage}%)</span>
                  </div>
                  {/* Horizontal Comparison Bar */}
                  <div className="w-full bg-[#0B0B0F] rounded-full h-2 overflow-hidden border border-white/[0.04]">
                    <div
                      className={`h-full ${
                        platform === "linkedin" ? "bg-blue-500" : platform === "twitter" ? "bg-sky-400" : "bg-indigo-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-[#A1A1AA] font-mono">
                    <span>CTR: {platData.views > 0 ? ((platData.clicks / platData.views) * 100).toFixed(2) : "0"}%</span>
                    <span>Shares: {platData.shares}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Performing Content Table */}
        <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Top Performing Content</h3>
            
            {/* Platform Filter */}
            <select
              value={topPostsFilter}
              onChange={e => setTopPostsFilter(e.target.value)}
              className="bg-[#0B0B0F] border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-white cursor-pointer focus:outline-none"
            >
              <option value="All">All Channels</option>
              <option value="Linkedin">LinkedIn</option>
              <option value="Twitter">Twitter / X</option>
              <option value="Facebook">Facebook</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] text-[9px] text-[#A1A1AA] uppercase font-bold tracking-wider font-mono">
                  <th className="pb-2">Post Content</th>
                  <th className="pb-2">Channel</th>
                  <th className="pb-2 text-right">Views</th>
                  <th className="pb-2 text-right">Clicks</th>
                  <th className="pb-2 text-right">Engagement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-[11px] text-white">
                {[
                  { text: "Achieving <1.5s telemetry sync across Clickhouse persistence...", channel: "linkedin", views: 82400, clicks: 4900, ctr: "5.94%" },
                  { text: "Securing data boundaries in Postgres using Row-Level Security policies...", channel: "twitter", views: 51200, clicks: 3100, ctr: "6.05%" },
                  { text: "Fluxora command center launch campaign goes live across workspaces...", channel: "facebook", views: 9200, clicks: 491, ctr: "5.33%" }
                ]
                  .filter(post => topPostsFilter === "All" || post.channel.toLowerCase() === topPostsFilter.toLowerCase())
                  .map((post, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition">
                      <td className="py-2.5 pr-4 truncate max-w-[180px]">{post.text}</td>
                      <td className="py-2.5 capitalize font-bold font-mono text-[10px] text-[#8B5CF6]">{post.channel}</td>
                      <td className="py-2.5 text-right font-mono">{post.views.toLocaleString()}</td>
                      <td className="py-2.5 text-right font-mono">{post.clicks.toLocaleString()}</td>
                      <td className="py-2.5 text-right text-emerald-400 font-bold font-mono">{post.ctr}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
