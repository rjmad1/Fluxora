"use client";

import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PostVariant {
  id: string;
  platform: string;
  overrideContent: string | null;
  assetUrls: string[];
}

interface PostItem {
  id: string;
  content: string;
  scheduledAt: string;
  status: "Draft" | "Scheduled" | "Published" | "Archived";
  variants: PostVariant[];
}

interface PublishingWorkspaceProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
}

export default function PublishingWorkspace({ onNotify }: PublishingWorkspaceProps) {
  const [activeStatus, setActiveStatus] = useState<"Draft" | "Scheduled" | "Published" | "Archived">("Scheduled");
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Pluggable channel filters
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["linkedin", "twitter", "whatsapp", "blog"]);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/v1/calendar", {
        headers: {
          "X-Tenant-ID": "Fluxora-Tenant-098",
          "X-Workspace-ID": "ws-1",
        },
      });
      if (!response.ok) throw new Error("API Offline");
      const data = await response.json();
      
      // Standardize status format from API
      const mapped = data.map((p: any) => ({
        id: p.id,
        content: p.content,
        scheduledAt: p.scheduledAt,
        status: p.status as any, // "Draft", "Scheduled", "Published", "Archived"
        variants: p.variants || [],
      }));
      setPosts(mapped);
    } catch (err) {
      console.warn("Publishing Queue API offline. Using fallback mock state:", err);
      setPosts([
        {
          id: "post-mock-1",
          content: "🚀 Decoupling telemetry event ingestion rates from relational Postgres transactional nodes using Kafka brokers to ClickHouse databases.",
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          status: "Scheduled",
          variants: [
            { id: "v-1", platform: "linkedin", overrideContent: "LinkedIn Focus: Decoupling telemetry ingestion rates to ClickHouse.", assetUrls: [] },
            { id: "v-2", platform: "twitter", overrideContent: "Postgres RLS + ClickHouse OLAP telemetry decoupled streams. #tech", assetUrls: [] }
          ]
        },
        {
          id: "post-mock-2",
          content: "💬 Connecting brand marketing campaigns directly to balance sheet margins using data-driven scenario simulations.",
          scheduledAt: new Date(Date.now() - 86400000).toISOString(),
          status: "Published",
          variants: [
            { id: "v-3", platform: "linkedin", overrideContent: null, assetUrls: [] }
          ]
        },
        {
          id: "post-mock-3",
          content: "Draft outline: Establishing organizational memory layers in AI multi-agent orchestration frameworks.",
          scheduledAt: new Date(Date.now() + 172800000).toISOString(),
          status: "Draft",
          variants: []
        },
        {
          id: "post-mock-4",
          content: "Archived Campaign Copy: Multi-tenant database RLS strategies benchmark results.",
          scheduledAt: new Date(Date.now() - 604800000).toISOString(),
          status: "Archived",
          variants: [
            { id: "v-4", platform: "facebook", overrideContent: null, assetUrls: [] }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: "Draft" | "Scheduled" | "Published" | "Archived") => {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/calendar/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": "Fluxora-Tenant-098",
          "X-Workspace-ID": "ws-1",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });
      if (response.ok) {
        onNotify(`Post marked as ${newStatus}`, "INFO");
        fetchQueue();
      } else {
        throw new Error("Update status failed");
      }
    } catch {
      // Local fallback edit
      setPosts(posts.map(p => p.id === id ? { ...p, status: newStatus } : p));
      onNotify(`Post status updated to ${newStatus} in local session.`, "INFO");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete/archive this post?")) return;
    try {
      const response = await fetch(`http://localhost:3000/api/v1/calendar/${id}`, {
        method: "DELETE",
        headers: {
          "X-Tenant-ID": "Fluxora-Tenant-098",
          "X-Workspace-ID": "ws-1",
        },
      });
      if (response.ok) {
        onNotify("Post deleted from queue.", "WARN");
        fetchQueue();
      } else {
        throw new Error("Delete failed");
      }
    } catch {
      setPosts(posts.filter(p => p.id !== id));
      onNotify("Post removed in local session.", "WARN");
    }
  };

  // Channel toggle helper
  const toggleChannel = (channel: string) => {
    if (selectedChannels.includes(channel)) {
      setSelectedChannels(selectedChannels.filter(c => c !== channel));
    } else {
      setSelectedChannels([...selectedChannels, channel]);
    }
  };

  // Filters logic
  const filteredPosts = posts.filter(post => {
    if (post.status !== activeStatus) return false;
    
    // If post has no variants (like a general draft), display it
    if (post.variants.length === 0) return true;
    
    // Otherwise, check if any of the post variants match selected channels
    return post.variants.some(v => selectedChannels.includes(v.platform.toLowerCase()));
  });

  return (
    <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header & sync */}
      <div className="flex justify-between items-center border-b border-white/[0.04] pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Icons.Layers className="w-5 h-5 text-[#8B5CF6]" />
            Publishing Workspace Queue
          </h3>
          <p className="text-xs text-[#A1A1AA] mt-0.5">Filter scheduled workflows, manage post statuses, and verify channels.</p>
        </div>
        <button
          onClick={fetchQueue}
          disabled={loading}
          className="bg-[#121218] hover:bg-white/[0.02] border border-white/[0.08] text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
        >
          <Icons.RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Sync queue</span>
        </button>
      </div>

      {/* Channel adapters selection toggles (pluggable channels) */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase text-[#A1A1AA] tracking-wider font-bold block">Active Publishing Channels</label>
        <div className="flex flex-wrap gap-2">
          {[
            { id: "linkedin", label: "LinkedIn", icon: "Linkedin" },
            { id: "twitter", label: "Twitter / X", icon: "Twitter" },
            { id: "whatsapp", label: "WhatsApp", icon: "MessageSquareCode" },
            { id: "blog", label: "Blog Feed", icon: "Globe" }
          ].map((ch) => {
            const isActive = selectedChannels.includes(ch.id);
            return (
              <button
                key={ch.id}
                onClick={() => toggleChannel(ch.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#7C3AED]/10 border-[#7C3AED]/40 text-[#8B5CF6]"
                    : "bg-[#0B0B0F]/40 border-white/[0.04] text-[#A1A1AA] hover:text-white"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#8B5CF6] opacity-80" />
                {ch.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status category sub tabs */}
      <div className="flex bg-[#0B0B0F] border border-white/[0.08] p-1.5 rounded-xl w-fit gap-1">
        {(["Draft", "Scheduled", "Published", "Archived"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setActiveStatus(status)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeStatus === status ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-white"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Queue items list */}
      <div className="space-y-4 min-h-[250px]">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="p-4 bg-[#0B0B0F]/45 border border-white/[0.04] rounded-2xl hover:border-white/[0.08] transition flex flex-col md:flex-row justify-between md:items-center gap-4"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-xs text-white leading-relaxed whitespace-pre-wrap">{post.content}</p>
              
              <div className="flex flex-wrap gap-2.5 items-center">
                <span className="text-[9px] text-[#A1A1AA] font-mono">
                  {activeStatus === "Scheduled" ? "Scheduled for:" : activeStatus === "Published" ? "Published at:" : "Updated:"} {new Date(post.scheduledAt).toLocaleString()}
                </span>
                
                {/* Active channel badges on this post */}
                {post.variants.map((v) => (
                  <span key={v.id} className="text-[8px] font-bold px-2 py-0.5 bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/20 rounded-full capitalize">
                    {v.platform}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 items-center flex-shrink-0">
              {activeStatus === "Draft" && (
                <button
                  onClick={() => handleUpdateStatus(post.id, "Scheduled")}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  Schedule
                </button>
              )}
              {activeStatus === "Scheduled" && (
                <button
                  onClick={() => handleUpdateStatus(post.id, "Published")}
                  className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  Publish Now
                </button>
              )}
              {activeStatus !== "Archived" ? (
                <button
                  onClick={() => handleUpdateStatus(post.id, "Archived")}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  Archive
                </button>
              ) : (
                <button
                  onClick={() => handleUpdateStatus(post.id, "Draft")}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  Restore to Draft
                </button>
              )}

              <button
                onClick={() => handleDelete(post.id)}
                className="p-1.5 hover:bg-rose-500/10 text-[#A1A1AA] hover:text-rose-400 border border-white/[0.08] hover:border-transparent rounded-lg cursor-pointer transition"
                title="Delete permanently"
              >
                <Icons.Trash2 className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        ))}

        {filteredPosts.length === 0 && (
          <div className="text-center py-12 text-xs text-[#A1A1AA]/50 italic">
            No posts found in category: {activeStatus} for selected channels.
          </div>
        )}
      </div>
    </div>
  );
}
