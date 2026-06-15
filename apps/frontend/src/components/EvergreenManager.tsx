"use client";

import React, { useState } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface EvergreenManagerProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
}

interface Bucket {
  id: string;
  name: string;
  count: number;
  frequency: string;
  color: string;
  channels: string[];
}

interface QueuePost {
  id: string;
  text: string;
  category: string;
  priority: "High" | "Medium" | "Low";
  isEvergreen: boolean;
  lastShared: string;
  shareCount: number;
}

export default function EvergreenManager({ onNotify }: EvergreenManagerProps) {
  const [globalRecycling, setGlobalRecycling] = useState(true);
  const [recycleFrequency, setRecycleFrequency] = useState(48); // in hours
  const [exclusionPeriod, setExclusionPeriod] = useState(14); // in days
  
  // Category Buckets
  const [buckets, setBuckets] = useState<Bucket[]>([
    { id: "b-1", name: "Product Features", count: 12, frequency: "Every 48h", color: "bg-blue-500", channels: ["linkedin", "twitter"] },
    { id: "b-2", name: "Tech Tips & Snippets", count: 24, frequency: "Every 24h", color: "bg-purple-500", channels: ["linkedin", "twitter"] },
    { id: "b-3", name: "Client Testimonials", count: 8, frequency: "Every 72h", color: "bg-emerald-500", channels: ["linkedin", "facebook"] },
    { id: "b-4", name: "Engineering Blogs", count: 15, frequency: "Weekly", color: "bg-amber-500", channels: ["linkedin", "twitter"] }
  ]);

  // Queue List
  const [queuePosts, setQueuePosts] = useState<QueuePost[]>([
    { id: "q-1", text: "🚀 Decoupling Postgres relational models from high-volume telemetry is critical. By streaming through Kafka to ClickHouse, we aggregations finish in <500ms.", category: "Product Features", priority: "High", isEvergreen: true, lastShared: "4 days ago", shareCount: 3 },
    { id: "q-2", text: "💡 Quick Tip: PostgreSQL Row-Level Security (RLS) policies can significantly slow down analytical aggregations. Shift telemetry to a columnar DB instead!", category: "Tech Tips & Snippets", priority: "Medium", isEvergreen: true, lastShared: "8 days ago", shareCount: 5 },
    { id: "q-3", text: "🌟 'Implementing Fluxora's temporal workflows was a game changer for our agency. We went from manual ban-fearing posts to unified automated distribution.'", category: "Client Testimonials", priority: "Low", isEvergreen: true, lastShared: "12 days ago", shareCount: 2 },
    { id: "q-4", text: "🔧 Setting up KafkaJS client sandboxes? Use local JSON file sandboxes for offline test runs. Smooth development without local brokers!", category: "Tech Tips & Snippets", priority: "Medium", isEvergreen: false, lastShared: "Never", shareCount: 0 }
  ]);

  // New bucket form state
  const [showAddBucket, setShowAddBucket] = useState(false);
  const [newBucketName, setNewBucketName] = useState("");
  const [newBucketFreq, setNewBucketFreq] = useState("Every 48h");
  const [newBucketColor, setNewBucketColor] = useState("bg-purple-500");

  const handleToggleEvergreen = (id: string) => {
    setQueuePosts(prev => prev.map(post => {
      if (post.id !== id) return post;
      const nextVal = !post.isEvergreen;
      onNotify(`Evergreen: Toggled post evergreen state to ${nextVal ? "ON" : "OFF"}`, "INFO");
      return { ...post, isEvergreen: nextVal };
    }));
  };

  const handleAddBucket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketName.trim()) return;

    const newBucket: Bucket = {
      id: `b-${Date.now()}`,
      name: newBucketName,
      count: 0,
      frequency: newBucketFreq,
      color: newBucketColor,
      channels: ["linkedin"]
    };

    setBuckets([...buckets, newBucket]);
    setNewBucketName("");
    setShowAddBucket(false);
    onNotify(`Evergreen: Created new content bucket: "${newBucket.name}"`, "AUDIT");
  };

  const handleRotateQueue = () => {
    onNotify("Evergreen: Executing priority queue rotation algorithm...", "INFO");
    
    // Simulate updating the 'lastShared' and increasing 'shareCount' of the highest priority post
    setTimeout(() => {
      setQueuePosts(prev => {
        const sorted = [...prev];
        // Find first eligible high priority evergreen post
        const idx = sorted.findIndex(p => p.isEvergreen && p.priority === "High");
        if (idx !== -1) {
          const updated = { ...sorted[idx] };
          updated.lastShared = "Just now";
          updated.shareCount += 1;
          sorted[idx] = updated;
          onNotify(`Evergreen: Rotated queue, re-shared: "${updated.text.substring(0, 30)}..."`, "AUDIT");
        } else {
          onNotify("Evergreen: No eligible High-priority posts available for rotation", "WARN");
        }
        return sorted;
      });
    }, 800);
  };

  return (
    <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/[0.08] pb-4 gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Icons.RefreshCw className="w-5 h-5 text-[#8B5CF6]" />
            Post Recycling & Evergreen Queue Management
          </h3>
          <p className="text-xs text-[#A1A1AA] mt-1">Recycle high-performing content automatically by buckets, priority, and anti-duplicate guards.</p>
        </div>
        
        {/* Global Toggle switch */}
        <div className="flex items-center gap-3 bg-[#0B0B0F]/60 border border-white/[0.06] px-4 py-2 rounded-xl">
          <span className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wider">Recycling Queue</span>
          <button
            onClick={() => {
              setGlobalRecycling(!globalRecycling);
              onNotify(`Evergreen: Global recycling queue ${!globalRecycling ? "ENABLED" : "PAUSED"}`, !globalRecycling ? "INFO" : "WARN");
            }}
            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
              globalRecycling ? "bg-emerald-500" : "bg-zinc-700"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                globalRecycling ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Buckets & Posts Queue */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Category Buckets */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Category-Based Content Buckets</h4>
              <button
                onClick={() => setShowAddBucket(!showAddBucket)}
                className="text-[10px] text-[#8B5CF6] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Icons.Plus className="w-3.5 h-3.5" />
                <span>Create Bucket</span>
              </button>
            </div>

            {/* Create form modal-like dropdown */}
            <AnimatePresence>
              {showAddBucket && (
                <motion.form
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  onSubmit={handleAddBucket}
                  className="bg-[#0B0B0F]/40 border border-white/[0.04] p-4 rounded-xl space-y-3 overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[8px] uppercase text-[#A1A1AA] block mb-1 font-bold">Bucket Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Memes, Launch, Tips"
                        value={newBucketName}
                        onChange={e => setNewBucketName(e.target.value)}
                        className="w-full bg-[#121218] border border-white/[0.08] text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[8px] uppercase text-[#A1A1AA] block mb-1 font-bold">Share Freq</label>
                      <select
                        value={newBucketFreq}
                        onChange={e => setNewBucketFreq(e.target.value)}
                        className="w-full bg-[#121218] border border-white/[0.08] text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
                      >
                        <option value="Every 24h">Every 24 Hours</option>
                        <option value="Every 48h">Every 48 Hours</option>
                        <option value="Every 72h">Every 72 Hours</option>
                        <option value="Weekly">Weekly Rotation</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[8px] uppercase text-[#A1A1AA] block mb-1 font-bold">Tag Color</label>
                      <select
                        value={newBucketColor}
                        onChange={e => setNewBucketColor(e.target.value)}
                        className="w-full bg-[#121218] border border-white/[0.08] text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
                      >
                        <option value="bg-purple-500">Purple Accent</option>
                        <option value="bg-blue-500">Blue Accent</option>
                        <option value="bg-emerald-500">Green Accent</option>
                        <option value="bg-amber-500">Yellow Accent</option>
                        <option value="bg-rose-500">Red Accent</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddBucket(false)}
                      className="px-3 py-1 bg-white/[0.02] hover:bg-white/[0.04] text-[10px] text-[#A1A1AA] rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-[#7C3AED] hover:bg-[#8B5CF6] text-[10px] text-white rounded-lg transition"
                    >
                      Save Bucket
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Grid display */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {buckets.map(b => (
                <div
                  key={b.id}
                  className="bg-[#121218] border border-white/[0.08] hover:border-[#8B5CF6]/30 rounded-2xl p-4 shadow-md space-y-3 group transition"
                >
                  <div className="flex justify-between items-start">
                    <span className={`w-2 h-2 rounded-full ${b.color}`}></span>
                    <span className="text-[9px] bg-white/[0.04] text-[#A1A1AA] px-2 py-0.5 rounded border border-white/[0.05] font-mono">
                      {b.frequency}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-[#8B5CF6] transition">{b.name}</h4>
                    <p className="text-[9px] text-[#A1A1AA] mt-0.5">{b.count} Active Posts</p>
                  </div>
                  <div className="flex gap-1.5 border-t border-white/[0.04] pt-2">
                    {b.channels.map(ch => (
                      <span key={ch} className="text-[8px] font-mono text-[#A1A1AA] bg-[#0B0B0F]/50 px-1.5 py-0.2 rounded border border-white/[0.04] capitalize">
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Posts Queue List */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Evergreen Post Queue Settings</h4>
            
            <div className="bg-[#121218] border border-white/[0.08] rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-[9px] text-[#A1A1AA] uppercase font-bold tracking-wider font-mono bg-[#0B0B0F]/30">
                      <th className="p-3">Recycled Text</th>
                      <th className="p-3">Bucket</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Last Shared</th>
                      <th className="p-3">Recycled</th>
                      <th className="p-3 text-right">Evergreen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-[11px] text-white">
                    {queuePosts.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.01] transition">
                        <td className="p-3 max-w-[200px] truncate">{p.text}</td>
                        <td className="p-3 text-purple-400 font-bold">{p.category}</td>
                        <td className="p-3">
                          <span className={`inline-block text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            p.priority === "High"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : p.priority === "Medium"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}>
                            {p.priority}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[10px] text-[#A1A1AA]">{p.lastShared}</td>
                        <td className="p-3 font-mono text-[10px] text-[#A1A1AA]">{p.shareCount}x</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleToggleEvergreen(p.id)}
                            className={`px-2 py-0.5 rounded text-[8px] font-bold border transition cursor-pointer ${
                              p.isEvergreen
                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                                : "bg-zinc-800 border-zinc-700 text-[#A1A1AA]"
                            }`}
                          >
                            {p.isEvergreen ? "Evergreen" : "One-off"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Frequency Dials, Exclusion Filter & Visual Rotation Map */}
        <div className="space-y-6">
          
          {/* Recycling Dials & Limits */}
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Queue Recycling Dials</h3>
            
            <div className="space-y-4 pt-1">
              {/* Frequency Dial slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#A1A1AA]">Recycling Interval</span>
                  <span className="text-white font-bold font-mono bg-[#0B0B0F] px-2 py-0.5 rounded border border-white/[0.06]">
                    Every {recycleFrequency} Hours
                  </span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="168"
                  step="6"
                  value={recycleFrequency}
                  onChange={e => setRecycleFrequency(parseInt(e.target.value))}
                  className="w-full h-1 bg-[#0B0B0F] rounded-lg appearance-none cursor-pointer accent-[#8B5CF6]"
                />
                <p className="text-[8px] text-[#A1A1AA]/60">Adjust how frequently the queue rotater publishes next post.</p>
              </div>

              {/* Exclusion Period Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#A1A1AA]">History Exclusion Filter</span>
                  <span className="text-white font-bold font-mono bg-[#0B0B0F] px-2 py-0.5 rounded border border-white/[0.06]">
                    {exclusionPeriod} Days Lockout
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="60"
                  step="1"
                  value={exclusionPeriod}
                  onChange={e => setExclusionPeriod(parseInt(e.target.value))}
                  className="w-full h-1 bg-[#0B0B0F] rounded-lg appearance-none cursor-pointer accent-[#8B5CF6]"
                />
                <p className="text-[8px] text-[#A1A1AA]/60">Prevent immediate duplicates by locking out posts shared in this window.</p>
              </div>
            </div>
          </div>

          {/* Visual Rotation Queue Map */}
          <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Queue Priority Map</h3>
              <p className="text-[10px] text-[#A1A1AA] mb-4">Visual rotation path showing how priority levels resolve.</p>
              
              {/* Visual Map (SVG representation) */}
              <div className="h-44 bg-[#0B0B0F] border border-white/[0.05] rounded-xl flex items-center justify-center p-3 relative overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 240 140">
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#8B5CF6" />
                    </marker>
                  </defs>
                  
                  {/* High Priority node */}
                  <rect x="10" y="10" width="80" height="28" rx="6" fill="#EF4444" fillOpacity="0.1" stroke="#EF4444" strokeWidth="1" />
                  <text x="50" y="27" fill="#EF4444" fontSize="10" fontWeight="bold" textAnchor="middle">High (50%)</text>
                  
                  {/* Med Priority node */}
                  <rect x="10" y="55" width="80" height="28" rx="6" fill="#F59E0B" fillOpacity="0.1" stroke="#F59E0B" strokeWidth="1" />
                  <text x="50" y="72" fill="#F59E0B" fontSize="10" fontWeight="bold" textAnchor="middle">Medium (35%)</text>

                  {/* Low Priority node */}
                  <rect x="10" y="100" width="80" height="28" rx="6" fill="#3B82F6" fillOpacity="0.1" stroke="#3B82F6" strokeWidth="1" />
                  <text x="50" y="117" fill="#3B82F6" fontSize="10" fontWeight="bold" textAnchor="middle">Low (15%)</text>

                  {/* Flow lines */}
                  <path d="M 90 24 Q 130 24 135 55" fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeDasharray="3" markerEnd="url(#arrow)" />
                  <path d="M 90 69 H 135" fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeDasharray="3" markerEnd="url(#arrow)" />
                  <path d="M 90 114 Q 130 114 135 85" fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeDasharray="3" markerEnd="url(#arrow)" />

                  {/* Output Node: Evergreen Queue Router */}
                  <rect x="145" y="45" width="85" height="48" rx="8" fill="#8B5CF6" fillOpacity="0.15" stroke="#8B5CF6" strokeWidth="1.5" />
                  <text x="187" y="68" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">Queue Router</text>
                  <text x="187" y="81" fill="#8B5CF6" fontSize="8" fontWeight="bold" textAnchor="middle">Next: High-1</text>
                </svg>
                
                <div className="absolute top-2 right-2 text-[7px] text-[#A1A1AA] font-mono tracking-wider bg-black/40 px-1 py-0.2 rounded border border-white/[0.04]">
                  ACTIVE PATH
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.04] mt-2">
              <button
                onClick={handleRotateQueue}
                className="w-full bg-[#0B0B0F] hover:bg-white/[0.02] border border-white/[0.08] hover:border-[#8B5CF6]/40 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Icons.Play className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>Simulate Queue Rotation</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
