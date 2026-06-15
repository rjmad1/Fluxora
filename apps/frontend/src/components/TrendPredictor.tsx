"use client";

import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TrendingTopic {
  id: string;
  niche: string;
  topic: string;
  volume: number;
  trendRate: number;
  historicalEngagement: number;
}

interface TrendPredictorProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
}

export default function TrendPredictor({ onNotify }: TrendPredictorProps) {
  const [trends, setTrends] = useState<TrendingTopic[]>([]);
  const [selectedNiche, setSelectedNiche] = useState<string>("All");
  const [draftContent, setDraftContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [predictLoading, setPredictLoading] = useState(false);
  const [prediction, setPrediction] = useState<{
    score: number;
    shifts: string[];
    adjustments: string[];
  } | null>(null);

  // Heatmap selected time info state
  const [selectedTime, setSelectedTime] = useState<{ day: string; time: string; activeUsers: number } | null>(null);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/v1/extended/listening/trends", {
        headers: { "X-Tenant-ID": "Fluxora-Tenant-098", "X-Workspace-ID": "ws-1" },
      });
      if (!res.ok) throw new Error("API Offline");
      const data = await res.json();
      setTrends(data);
    } catch {
      // Fallback
      setTrends([
        { id: "trend-1", niche: "Technology", topic: "ClickHouse Query Optimizations", volume: 45200, trendRate: 24, historicalEngagement: 4.2 },
        { id: "trend-2", niche: "Technology", topic: "Kafka Real-time Streams", volume: 32800, trendRate: 18, historicalEngagement: 3.9 },
        { id: "trend-3", niche: "Finance", topic: "SaaS Churn Reduction", volume: 14500, trendRate: 8, historicalEngagement: 2.8 },
        { id: "trend-4", niche: "Lifestyle", topic: "Remote Work Fatigue Hacks", volume: 88100, trendRate: -5, historicalEngagement: 5.1 },
        { id: "trend-5", niche: "Global Business", topic: "European Data Privacy", volume: 22000, trendRate: 35, historicalEngagement: 3.2 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftContent.trim()) return;
    setPredictLoading(true);

    try {
      const res = await fetch("http://localhost:3000/api/v1/extended/listening/trends/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": "Fluxora-Tenant-098",
          "X-Workspace-ID": "ws-1",
        },
        body: JSON.stringify({ content: draftContent }),
      });
      if (!res.ok) throw new Error("Offline");
      const data = await res.json();
      setPrediction(data);
      onNotify(`Predicted virality score for draft: ${data.score}%`, "INFO");
    } catch {
      // Offline heuristic
      let score = 55;
      const shifts = [
        "Short-form vertical video aspect ratio optimization preference (+15%)",
        "Text formatting readability shifts (+10%)",
        "Direct link embedding priority changes (-5%)"
      ];
      const adjustments = [];

      if (draftContent.length > 200) {
        score -= 10;
        adjustments.push("Truncate content to under 200 characters to prevent visual cutoff on mobile feeds.");
      } else {
        score += 10;
      }
      if (draftContent.includes("#")) {
        score += 5;
      } else {
        adjustments.push("Add at least 2 relevant hashtag keywords to boost platform indexing discoverability.");
      }
      if (draftContent.includes("🚀") || draftContent.includes("⚡")) {
        score += 10;
      } else {
        adjustments.push("Inject high-energy action emojis to increase CTR and reader engagement.");
      }

      score = Math.min(Math.max(score, 12), 98);
      setPrediction({ score, shifts, adjustments });
      onNotify(`Demo Mode: Predicted virality score: ${score}%`, "INFO");
    } finally {
      setPredictLoading(false);
    }
  };

  const niches = ["All", ...Array.from(new Set(trends.map((t) => t.niche)))];
  const filteredTrends = selectedNiche === "All" ? trends : trends.filter((t) => t.niche === selectedNiche);

  // Heatmap variables
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = ["09:00", "11:00", "13:00", "15:00", "17:00", "19:00", "21:00"];

  // Heatmap cell values generator (consistent mock spikes)
  const getCellActivity = (day: string, hour: string) => {
    let base = 20;
    if (day === "Tue" || day === "Thu") base += 40; // Midweek peaks
    if (hour === "09:00" || hour === "11:00" || hour === "15:00") base += 30; // Work hour peaks
    return Math.min(base, 95);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <Icons.LineChart className="w-8 h-8 text-[#8B5CF6]" />
          <span>Smart Trend Forecasting & Virality Predictor</span>
        </h2>
        <p className="text-xs text-[#A1A1AA] mt-1">
          Stay ahead of platform algorithm adjustments, check draft concept virality ratios, and optimize posting calendars.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Side: Trending Topics (5/12) */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <Icons.Flame className="w-4.5 h-4.5 text-orange-500 animate-pulse" />
                  <span>Trending Topics Dashboard</span>
                </h3>
                <p className="text-[10px] text-[#A1A1AA]">Real-time niche keywords rising across channels</p>
              </div>
              <button
                onClick={fetchTrends}
                className="p-1 hover:bg-white/[0.04] border border-white/[0.08] rounded text-[#A1A1AA] hover:text-white"
              >
                <Icons.RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Niche filters */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {niches.map((niche) => (
                <button
                  key={niche}
                  onClick={() => setSelectedNiche(niche)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold transition ${
                    selectedNiche === niche
                      ? "bg-[#7C3AED] text-white"
                      : "bg-[#0B0B0F]/80 text-[#A1A1AA] hover:text-white border border-white/[0.04]"
                  }`}
                >
                  {niche}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredTrends.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 bg-[#0B0B0F]/50 border border-white/[0.04] hover:border-white/[0.08] rounded-xl flex items-center justify-between transition"
                >
                  <div>
                    <span className="text-[9px] bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 px-2 py-0.5 rounded-full font-bold">
                      {t.niche}
                    </span>
                    <h4 className="text-xs font-bold text-white mt-1.5">{t.topic}</h4>
                    <span className="text-[9px] text-[#A1A1AA] font-mono mt-1 block">
                      Search Volume: {t.volume.toLocaleString()} searches
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                        t.trendRate > 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {t.trendRate > 0 ? (
                        <Icons.TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <Icons.TrendingDown className="w-3.5 h-3.5" />
                      )}
                      {t.trendRate > 0 ? `+${t.trendRate}%` : `${t.trendRate}%`}
                    </span>
                    <span className="block text-[8px] text-[#A1A1AA] mt-1">
                      Baseline CTR: {t.historicalEngagement}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Virality Predictor & Heatmap (7/12) */}
        <div className="xl:col-span-7 space-y-6">
          {/* Virality Predictor */}
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Icons.Cpu className="w-4.5 h-4.5 text-[#8B5CF6]" />
              <span>Smart Virality Predictor</span>
            </h3>
            <p className="text-[11px] text-[#A1A1AA] mb-4">
              Write or paste your draft post below to calculate virality probabilities and retrieve localized algorithm suggestions.
            </p>

            <form onSubmit={handlePredict} className="space-y-4">
              <textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                placeholder="Compose your draft content here (e.g. Excited to share our Clickhouse database scaling framework! 🚀 {link} #databases #scale)"
                className="w-full h-24 bg-[#0B0B0F] border border-white/[0.08] rounded-xl p-3.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#7C3AED] resize-none"
              />
              <button
                type="submit"
                disabled={predictLoading || !draftContent.trim()}
                className="bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg transition"
              >
                {predictLoading ? "Analyzing Shifts..." : "🔮 Predict Virality Probability"}
              </button>
            </form>

            <AnimatePresence>
              {prediction && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 pt-6 border-t border-white/[0.04] grid grid-cols-1 md:grid-cols-12 gap-6"
                >
                  {/* Score circle */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center text-center">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="6" fill="transparent" />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke={prediction.score > 70 ? "#10B981" : prediction.score > 40 ? "#8B5CF6" : "#EF4444"}
                          strokeWidth="6"
                          fill="transparent"
                          strokeDasharray="251.2"
                          strokeDashoffset={251.2 - (251.2 * prediction.score) / 100}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-extrabold text-white font-mono">{prediction.score}%</span>
                        <span className="text-[8px] text-[#A1A1AA]/80 uppercase font-bold tracking-wider">Score</span>
                      </div>
                    </div>
                    
                    {/* Baseline indicator */}
                    <div className="mt-3 bg-[#0B0B0F] border border-white/[0.04] px-3 py-1.5 rounded-lg text-[9px] text-[#A1A1AA]">
                      Historical Baseline: <span className="text-white font-bold font-mono">3.5%</span>
                      <span className={`block mt-0.5 font-bold ${prediction.score > 60 ? "text-emerald-400" : "text-rose-400"}`}>
                        {prediction.score > 60 ? "🏆 Exceeds Average" : "⚠️ Below Average"}
                      </span>
                    </div>
                  </div>

                  {/* Shifts & Alerts */}
                  <div className="md:col-span-8 space-y-4">
                    {/* Algorithm Shifts */}
                    <div>
                      <h4 className="text-[10px] font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Icons.Shuffle className="w-3.5 h-3.5 text-[#8B5CF6]" />
                        <span>Localized Algorithm Shifts</span>
                      </h4>
                      <ul className="space-y-1">
                        {prediction.shifts.map((s, idx) => (
                          <li key={idx} className="text-[10px] text-[#A1A1AA] flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-[#8B5CF6]" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Adjustment alerts */}
                    {prediction.adjustments.length > 0 && (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3.5 space-y-2">
                        <h4 className="text-[10px] font-bold text-yellow-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Icons.AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                          <span>Adjustment Recommendations</span>
                        </h4>
                        <div className="space-y-1.5">
                          {prediction.adjustments.map((a, idx) => (
                            <p key={idx} className="text-[9.5px] text-yellow-200/90 leading-relaxed pl-1.5 border-l border-yellow-500/30">
                              {a}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Heatmap Section */}
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Icons.CalendarDays className="w-4.5 h-4.5 text-[#8B5CF6]" />
              <span>Optimal Publishing Heatmap</span>
            </h3>
            <p className="text-[11px] text-[#A1A1AA] mb-4">
              Visualizes active audience spikes calculated across local zones. Click any cell to inspect expected active user values.
            </p>

            <div className="flex gap-4 items-start">
              {/* Heatmap grid */}
              <div className="flex-1 overflow-x-auto">
                <div className="grid grid-cols-8 gap-1 min-w-[320px]">
                  {/* Empty cell corner */}
                  <div />
                  {/* Hour labels header */}
                  {hours.map((h) => (
                    <div key={h} className="text-[9px] font-mono text-[#A1A1AA] text-center">{h}</div>
                  ))}

                  {/* Day rows */}
                  {days.map((day) => (
                    <React.Fragment key={day}>
                      <div className="text-[10px] font-bold text-[#A1A1AA] flex items-center">{day}</div>
                      {hours.map((hour) => {
                        const activity = getCellActivity(day, hour);
                        // Determine purple gradient color intensity
                        let bgStyle = "bg-[#7C3AED]/10 border-purple-500/10";
                        if (activity > 80) bgStyle = "bg-[#7C3AED] border-[#7C3AED]";
                        else if (activity > 60) bgStyle = "bg-[#7C3AED]/70 border-purple-400/50";
                        else if (activity > 45) bgStyle = "bg-[#7C3AED]/40 border-purple-500/30";
                        else if (activity > 25) bgStyle = "bg-[#7C3AED]/20 border-purple-500/20";

                        const isSelected = selectedTime?.day === day && selectedTime?.time === hour;

                        return (
                          <button
                            key={hour}
                            type="button"
                            onClick={() => setSelectedTime({ day, time: hour, activeUsers: activity * 1500 })}
                            className={`h-7 rounded border transition-all cursor-pointer ${bgStyle} ${
                              isSelected ? "ring-2 ring-white scale-105" : "hover:brightness-125"
                            }`}
                            title={`${day} at ${hour}: ~${(activity * 1500).toLocaleString()} active users`}
                          />
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-end gap-1.5 mt-3 text-[9px] text-[#A1A1AA]">
                  <span>Low activity</span>
                  <span className="w-2.5 h-2.5 rounded bg-[#7C3AED]/10" />
                  <span className="w-2.5 h-2.5 rounded bg-[#7C3AED]/40" />
                  <span className="w-2.5 h-2.5 rounded bg-[#7C3AED]/70" />
                  <span className="w-2.5 h-2.5 rounded bg-[#7C3AED]" />
                  <span>High spikes</span>
                </div>
              </div>

              {/* Selected Cell Inspector Panel */}
              <div className="w-48 bg-[#0B0B0F]/50 border border-white/[0.04] p-4.5 rounded-xl text-center space-y-2">
                <Icons.Clock className="w-6 h-6 text-[#8B5CF6] mx-auto" />
                {selectedTime ? (
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider font-bold">Spike Analysis</span>
                    <h4 className="text-xs font-bold text-white">{selectedTime.day} at {selectedTime.time}</h4>
                    <p className="text-[14px] font-extrabold text-emerald-400 font-mono">
                      {selectedTime.activeUsers.toLocaleString()}
                    </p>
                    <span className="text-[8px] text-[#A1A1AA] block leading-relaxed">
                      Expected active target audience count. Optimal window to dispatch high-value posts.
                    </span>
                  </div>
                ) : (
                  <p className="text-[10px] text-[#A1A1AA]/60 italic py-6 leading-relaxed">
                    Click any slot to inspect optimal posting metrics.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
