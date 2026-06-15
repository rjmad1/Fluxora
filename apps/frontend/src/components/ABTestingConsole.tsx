"use client";

import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ABTest {
  id: string;
  title: string;
  variantA: string;
  variantB: string;
  allocationA: number;
  allocationB: number;
  winnerCriteria: "clicks" | "engagement";
  status: "running" | "completed";
  winner?: "A" | "B" | "none";
  conversionA: number;
  conversionB: number;
  performanceA: number[];
  performanceB: number[];
  createdAt: string;
}

interface ABTestingConsoleProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
}

export default function ABTestingConsole({ onNotify }: ABTestingConsoleProps) {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Composer Form States
  const [testTitle, setTestTitle] = useState("");
  const [draftA, setDraftA] = useState("");
  const [draftB, setDraftB] = useState("");
  const [allocationA, setAllocationA] = useState(50);
  const [winnerCriteria, setWinnerCriteria] = useState<"clicks" | "engagement">("clicks");

  const fetchABTestData = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/v1/extended/ab-testing/tests", {
        headers: { "X-Tenant-ID": "Fluxora-Tenant-098", "X-Workspace-ID": "ws-1" },
      });
      if (!res.ok) throw new Error("API Offline");
      const data = await res.json();
      setTests(data);
    } catch {
      // Mock Fallbacks
      setTests([
        {
          id: "test-1",
          title: "CTA Button Placement Experiment",
          variantA: "Check out our ClickHouse performance dashboard today! {link}",
          variantB: "Ready to scale telemetry? Try the new real-time performance dashboard! {link}",
          allocationA: 50,
          allocationB: 50,
          winnerCriteria: "clicks",
          status: "completed",
          winner: "B",
          conversionA: 3.8,
          conversionB: 5.9,
          performanceA: [12, 24, 38, 48, 55, 68, 76, 82],
          performanceB: [15, 29, 45, 62, 79, 94, 112, 128],
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
        {
          id: "test-2",
          title: "Emoji Engagement Analysis",
          variantA: "Introducing our advanced row level tenant security structure.",
          variantB: "Introducing our advanced row-level tenant security structure! 🛡️🔒 #security #saas",
          allocationA: 60,
          allocationB: 40,
          winnerCriteria: "engagement",
          status: "running",
          winner: "none",
          conversionA: 1.2,
          conversionB: 2.8,
          performanceA: [5, 12, 19, 24],
          performanceB: [8, 22, 39, 58],
          createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchABTestData();
  }, []);

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim() || !draftA.trim() || !draftB.trim()) return;

    setCreating(true);
    const payload = {
      title: testTitle.trim(),
      variantA: draftA.trim(),
      variantB: draftB.trim(),
      allocationA,
      allocationB: 100 - allocationA,
      winnerCriteria,
    };

    try {
      const res = await fetch("http://localhost:3000/api/v1/extended/ab-testing/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": "Fluxora-Tenant-098",
          "X-Workspace-ID": "ws-1",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("API Offline");
      const newTest = await res.json();
      setTests((prev) => [newTest, ...prev]);
      onNotify(`Launched A/B test campaign "${testTitle}"`, "AUDIT");
    } catch {
      const mockTest: ABTest = {
        id: `test-demo-${Date.now()}`,
        title: testTitle.trim(),
        variantA: draftA.trim(),
        variantB: draftB.trim(),
        allocationA,
        allocationB: 100 - allocationA,
        winnerCriteria,
        status: "running",
        winner: "none",
        conversionA: 0,
        conversionB: 0,
        performanceA: [0, 4, 9],
        performanceB: [0, 6, 15],
        createdAt: new Date().toISOString(),
      };
      setTests((prev) => [mockTest, ...prev]);
      onNotify(`Demo mode: Launched A/B test "${testTitle}" locally`, "AUDIT");
    } finally {
      setCreating(false);
      setTestTitle("");
      setDraftA("");
      setDraftB("");
      setAllocationA(50);
    }
  };

  const selectedTest = tests[0]; // Renders divergence chart for newest test

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">AI A/B Variant Testing Console</h2>
        <p className="text-xs text-[#A1A1AA] mt-1">
          Compose side-by-side post variations, configure traffic filters, and visualize divergence metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Variant Composer Form - Left 3 Columns */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3.5 flex items-center gap-2">
              <Icons.Sparkles className="w-4 h-4 text-purple-400" />
              <span>Multi-Variant Composer</span>
            </h3>

            <form onSubmit={handleCreateTest} className="space-y-4">
              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Experiment Name</label>
                <input
                  type="text"
                  required
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder="e.g. Telemetry Scaling Launch Campaign"
                  className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>

              {/* Side-by-side Composer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Variant A */}
                <div className="space-y-1.5 border border-white/[0.04] p-3 rounded-xl bg-[#0B0B0F]/30">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-sky-400 font-mono">Variant A (Control)</span>
                    <span className="text-[9px] text-[#A1A1AA]/60">{draftA.length} chars</span>
                  </div>
                  <textarea
                    required
                    value={draftA}
                    onChange={(e) => setDraftA(e.target.value)}
                    placeholder="Type variation A text here..."
                    className="w-full h-32 bg-[#0B0B0F] border border-white/[0.08] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#7C3AED] resize-none"
                  />
                </div>

                {/* Variant B */}
                <div className="space-y-1.5 border border-white/[0.04] p-3 rounded-xl bg-[#0B0B0F]/30">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-pink-400 font-mono">Variant B (Challenger)</span>
                    <span className="text-[9px] text-[#A1A1AA]/60">{draftB.length} chars</span>
                  </div>
                  <textarea
                    required
                    value={draftB}
                    onChange={(e) => setDraftB(e.target.value)}
                    placeholder="Type variation B text here..."
                    className="w-full h-32 bg-[#0B0B0F] border border-white/[0.08] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#7C3AED] resize-none"
                  />
                </div>
              </div>

              {/* Control Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0B0B0F]/50 border border-white/[0.04] p-4 rounded-xl">
                {/* Traffic Allocation */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Traffic split</label>
                    <div className="text-xs font-bold font-mono">
                      <span className="text-sky-400">{allocationA}%</span> /{" "}
                      <span className="text-pink-400">{100 - allocationA}%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="5"
                    value={allocationA}
                    onChange={(e) => setAllocationA(Number(e.target.value))}
                    className="w-full h-1 bg-[#121218] rounded-lg appearance-none cursor-pointer accent-[#7C3AED] mt-2.5"
                  />
                </div>

                {/* Winner Criteria */}
                <div>
                  <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider mb-1.5">
                    Winner Evaluation Metric
                  </label>
                  <div className="bg-[#0B0B0F] border border-white/[0.08] p-1 rounded-xl flex gap-1">
                    {(["clicks", "engagement"] as const).map((criteria) => (
                      <button
                        key={criteria}
                        type="button"
                        onClick={() => setWinnerCriteria(criteria)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                          winnerCriteria === criteria
                            ? "bg-[#7C3AED] text-white"
                            : "text-[#A1A1AA] hover:text-white"
                        }`}
                      >
                        {criteria === "clicks" ? "Click Count" : "Engagement Rate"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-[#7C3AED]/20 transition cursor-pointer"
              >
                {creating ? "Launching Experiment..." : "🚀 Initialize A/B Testing Workflow"}
              </button>
            </form>
          </div>
        </div>

        {/* Real-time Divergence Graph - Right 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTest && (
            <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Performance Divergence</span>
                  <span className="text-[10px] font-mono text-[#A1A1AA]">Newest Campaign</span>
                </h3>
                <p className="text-[11px] text-[#A1A1AA] mb-4">
                  Divergence of {selectedTest.winnerCriteria} counts for <strong>{selectedTest.title}</strong>
                </p>

                {/* SVG Line Chart representing divergence */}
                <div className="h-44 w-full relative pt-2">
                  <svg className="w-full h-full" viewBox="0 0 300 150" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="37" x2="300" y2="37" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                    <line x1="0" y1="75" x2="300" y2="75" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                    <line x1="0" y1="112" x2="300" y2="112" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />

                    {/* Variant A (Sky Line) */}
                    <path
                      d={`M 0 145 C 50 130, 100 100, 150 90 T 300 45`}
                      fill="none"
                      stroke="#38BDF8"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    {/* Variant B (Pink Line) */}
                    <path
                      d={`M 0 145 C 50 120, 100 85, 150 60 T 300 20`}
                      fill="none"
                      stroke="#F472B6"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />

                    {/* Final Dots */}
                    <circle cx="300" cy="45" r="3.5" fill="#38BDF8" />
                    <circle cx="300" cy="20" r="3.5" fill="#F472B6" />
                  </svg>
                  <div className="flex justify-between items-center text-[9px] text-[#A1A1AA] font-mono mt-1 px-1">
                    <span>Start</span>
                    <span>4 Hours</span>
                    <span>8 Hours</span>
                    <span>12 Hours (Current)</span>
                  </div>
                </div>
              </div>

              <div className="w-full flex justify-around border-t border-white/[0.04] pt-4 mt-6 text-center text-xs">
                <div>
                  <span className="block text-sky-400 font-bold font-mono">{selectedTest.conversionA}%</span>
                  <span className="text-[10px] text-[#A1A1AA]">A Conversion</span>
                </div>
                <div className="border-r border-white/[0.06] h-6" />
                <div>
                  <span className="block text-pink-400 font-bold font-mono">{selectedTest.conversionB}%</span>
                  <span className="text-[10px] text-[#A1A1AA]">B Conversion</span>
                </div>
              </div>
            </div>
          )}

          {/* Fallback Empty Panel */}
          {!selectedTest && (
            <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl flex items-center justify-center h-52 text-xs text-[#A1A1AA]/40 italic">
              No live divergence graph available
            </div>
          )}
        </div>
      </div>

      {/* Post-Test Database - Full Width Table */}
      <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Icons.Database className="w-4 h-4 text-[#8B5CF6]" />
          <span>Historical Post-Test Database</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] text-[#A1A1AA] font-mono text-[9px] uppercase font-bold tracking-wider">
                <th className="pb-2">Experiment Title</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Variant A Conv %</th>
                <th className="pb-2 text-right">Variant B Conv %</th>
                <th className="pb-2">Winner Criterion</th>
                <th className="pb-2 text-right">Winner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-white">
              {tests.map((test) => (
                <tr key={test.id} className="hover:bg-white/[0.01]">
                  <td className="py-3 pr-4">
                    <span className="font-bold block">{test.title}</span>
                    <span className="text-[9px] text-[#A1A1AA] font-mono">
                      Created: {new Date(test.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        test.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse"
                      }`}
                    >
                      {test.status}
                    </span>
                  </td>
                  <td className="py-3 text-right font-mono text-sky-400">{test.conversionA}%</td>
                  <td className="py-3 text-right font-mono text-pink-400">{test.conversionB}%</td>
                  <td className="py-3 font-mono text-[10px] capitalize text-[#A1A1AA]">{test.winnerCriteria}</td>
                  <td className="py-3 text-right">
                    {test.winner === "none" ? (
                      <span className="text-[#A1A1AA] font-mono font-bold">Evaluating</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-400 font-mono uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <Icons.Trophy className="w-3 h-3 text-yellow-400" />
                        <span>Variant {test.winner}</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {tests.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-[#A1A1AA]/50 italic">
                    No experiments logged in database
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
