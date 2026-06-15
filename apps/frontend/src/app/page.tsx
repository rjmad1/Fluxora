"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import DashboardCard from "@/components/DashboardCard";
import AIInsightCard from "@/components/AIInsightCard";
import EmptyState from "@/components/EmptyState";
import ChannelSelector from "@/components/ChannelSelector";
import PersonalHubDashboard from "@/components/PersonalHubDashboard";
import DigitalTwinConfig from "@/components/DigitalTwinConfig";
import CareerOSComponent from "@/components/CareerOSComponent";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Types matching current schema
interface Variant {
  platform: string;
  overrideContent: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "AUDIT" | "WARN";
  msg: string;
}

interface MetricBreakdown {
  views: number;
  clicks: number;
  shares: number;
}

interface AnalyticsData {
  views: number;
  clicks: number;
  shares: number;
  byPlatform: Record<string, MetricBreakdown>;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeWorkspace, setActiveWorkspace] = useState("Workspace A (Brand Operations)");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["linkedin", "twitter"]);
  const [personalHubSection, setPersonalHubSection] = useState("overview");

  // Workspaces list
  const workspaces = [
    { id: "ws-1", name: "Workspace A (Brand Operations)", tenant: "Enterprise Agency Tier", region: "US-East" },
    { id: "ws-2", name: "Workspace B (Global Marketing)", tenant: "Enterprise Agency Tier", region: "EU-West" },
  ];

  // Connected Accounts
  const connectedAccounts = [
    { provider: "LinkedIn", name: "Fluxora Enterprise", avatar: "FL", status: "Active", lastRefreshed: "2 mins ago" },
    { provider: "Twitter / X", name: "@FluxoraApp", avatar: "FX", status: "Active", lastRefreshed: "12 mins ago" },
    { provider: "Facebook", name: "Fluxora Social", avatar: "FS", status: "Active", lastRefreshed: "1 hour ago" },
  ];

  // Active workflows mock
  const [activeWorkflows, setActiveWorkflows] = useState([
    { id: "WF-1092", type: "PostPublishingWorkflow", target: "LinkedIn, Twitter", scheduled: "2026-06-17 10:00 AM", status: "Scheduled" },
    { id: "WF-1093", type: "TokenLifecycleWorkflow", target: "Twitter / X Refresh", scheduled: "2026-06-16 11:45 PM", status: "Running" },
    { id: "WF-1094", type: "ApprovalLoopWorkflow", target: "Facebook Variant", scheduled: "Pending review", status: "Pending" },
  ]);

  // Logs stream
  const [activityLogs, setActivityLogs] = useState<LogEntry[]>([
    { id: "1", timestamp: "16:54:12", level: "INFO", msg: "tenant.created (ID: tenant-098)" },
    { id: "2", timestamp: "16:55:05", level: "INFO", msg: "workspace.created (ID: ws-1)" },
    { id: "3", timestamp: "16:56:44", level: "INFO", msg: "token.refreshed (Platform: Twitter)" },
    { id: "4", timestamp: "16:58:10", level: "AUDIT", msg: "token.write_vault (Account: LinkedIn)" },
  ]);

  // ClickHouse telemetry metrics
  const [metrics, setMetrics] = useState<AnalyticsData | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Composer drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [composerContent, setComposerContent] = useState("Excited to launch our new automated distribution campaign via Fluxora! 🚀 #socialmedia #enterprise");
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(9, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [staggerMinutes, setStaggerMinutes] = useState(15);
  const [linkedinOverride, setLinkedinOverride] = useState("");
  const [twitterOverride, setTwitterOverride] = useState("");
  const [facebookOverride, setFacebookOverride] = useState("");
  const [composerSubmitting, setComposerSubmitting] = useState(false);
  const [composerStatus, setComposerStatus] = useState<{ msg: string; type: "success" | "error" | "" }>({ msg: "", type: "" });
  const [showComposerOverrides, setShowComposerOverrides] = useState(false);

  // Calendar states
  const [calendarItems, setCalendarItems] = useState([
    { id: "cal-1", channel: "linkedin", title: "Announcing Enterprise Scaling", time: "09:00", day: "Mon" },
    { id: "cal-2", channel: "twitter", title: "ClickHouse Ingestion Benchmark results", time: "11:30", day: "Tue" },
    { id: "cal-3", channel: "facebook", title: "Global Marketing Strategy Update", time: "15:00", day: "Thu" },
    { id: "cal-4", channel: "linkedin", title: "Automations Deep Dive Article", time: "10:00", day: "Fri" },
  ]);

  // Media Library states
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaFilter, setMediaFilter] = useState("All");
  const [mediaItems, setMediaItems] = useState([
    { id: "m-1", name: "campaign_banner.png", type: "Image", size: "2.4 MB", date: "2026-06-14", views: 4200, url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80" },
    { id: "m-2", name: "intro_explainer.mp4", type: "Video", size: "45.1 MB", date: "2026-06-13", views: 12800, url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80" },
    { id: "m-3", name: "infographic_v2.png", type: "Image", size: "1.8 MB", date: "2026-06-15", views: 980, url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80" },
    { id: "m-4", name: "team_photo.jpg", type: "Image", size: "3.2 MB", date: "2026-06-10", views: 150, url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80" },
  ]);

  // AI Workspace states
  const [aiChatQuery, setAiChatQuery] = useState("");
  const [aiChatHistory, setAiChatHistory] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "Hello! I am your Fluxora Social Intelligence Agent. How can I help you construct campaigns or generate new content today?" },
  ]);
  const [brandVoice, setBrandVoice] = useState("Professional, Authoritative, Tech-Savvy");
  const [promptLibrary] = useState([
    { title: "Announce Feature Launch", text: "Create an announcement for a new telemetry pipeline emphasizing 1.5s real-time sync with ClickHouse." },
    { title: "Engagement Thread", text: "Draft a 5-part LinkedIn thread about multi-tenant Postgres RLS implementation." },
    { title: "Customer Success Story", text: "Write a short case study post celebrating a client reaching 10M impressions." },
  ]);

  // ClickHouse simulation states
  const [simPlatform, setSimPlatform] = useState("linkedin");
  const [simEventType, setSimEventType] = useState("post.click");
  const [simulating, setSimulating] = useState(false);

  // Fetch telemetry metrics
  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const response = await fetch("http://localhost:3000/api/v1/analytics/performance?platforms=linkedin,twitter,facebook", {
        headers: {
          "X-Tenant-ID": "Fluxora-Tenant-098",
          "X-Workspace-ID": "ws-1",
        },
      });
      if (!response.ok) throw new Error("API failed");
      const data = await response.json();
      setMetrics(data);
    } catch {
      // Mock metrics fallback for demo mode
      setMetrics({
        views: 142800 + Math.floor(Math.random() * 500),
        clicks: 8491 + Math.floor(Math.random() * 50),
        shares: 1240 + Math.floor(Math.random() * 10),
        byPlatform: {
          linkedin: { views: 82400 + Math.floor(Math.random() * 200), clicks: 4900 + Math.floor(Math.random() * 10), shares: 720 },
          twitter: { views: 51200 + Math.floor(Math.random() * 150), clicks: 3100 + Math.floor(Math.random() * 10), shares: 410 },
          facebook: { views: 9200 + Math.floor(Math.random() * 50), clicks: 491 + Math.floor(Math.random() * 5), shares: 110 },
        },
      });
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Simulate telemetry event
  const simulateEvent = async () => {
    setSimulating(true);
    // Log intent in the audit log
    const timestamp = new Date().toLocaleTimeString();
    setActivityLogs((prev) => [
      ...prev,
      { id: Date.now().toString(), timestamp, level: "INFO", msg: `Simulator: emitting ${simEventType} for ${simPlatform}` },
    ]);

    try {
      const res = await fetch("http://localhost:3000/api/v1/analytics/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": "Fluxora-Tenant-098",
          "X-Workspace-ID": "ws-1",
        },
        body: JSON.stringify({
          platform: simPlatform,
          eventType: simEventType,
        }),
      });
      if (!res.ok) throw new Error("Simulation failed");
      setTimeout(fetchMetrics, 1200);
    } catch (err) {
      console.warn("Simulation api offline, simulating locally:", err);
      // Local metrics adjustment
      setTimeout(() => {
        setMetrics((prev) => {
          if (!prev) return null;
          const updatedPlatform = { ...prev.byPlatform[simPlatform] };
          if (simEventType === "post.impression") {
            updatedPlatform.views += 1500;
            return {
              ...prev,
              views: prev.views + 1500,
              byPlatform: { ...prev.byPlatform, [simPlatform]: updatedPlatform },
            };
          } else if (simEventType === "post.click") {
            updatedPlatform.clicks += 85;
            return {
              ...prev,
              clicks: prev.clicks + 85,
              byPlatform: { ...prev.byPlatform, [simPlatform]: updatedPlatform },
            };
          } else {
            updatedPlatform.shares += 12;
            return {
              ...prev,
              shares: prev.shares + 12,
              byPlatform: { ...prev.byPlatform, [simPlatform]: updatedPlatform },
            };
          }
        });
      }, 500);
    } finally {
      setSimulating(false);
    }
  };

  // Composer scheduling handler
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setComposerSubmitting(true);
    setComposerStatus({ msg: "", type: "" });

    const variants: Variant[] = [];
    if (linkedinOverride) variants.push({ platform: "linkedin", overrideContent: linkedinOverride });
    if (twitterOverride) variants.push({ platform: "twitter", overrideContent: twitterOverride });
    if (facebookOverride) variants.push({ platform: "facebook", overrideContent: facebookOverride });

    const newLogId = Date.now().toString();
    const timestamp = new Date().toLocaleTimeString();

    try {
      const response = await fetch("http://localhost:3000/api/v1/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": "Fluxora-Tenant-098",
          "X-Workspace-ID": "ws-1",
        },
        body: JSON.stringify({
          content: composerContent,
          scheduledAt: new Date(scheduledAt).toISOString(),
          variants,
        }),
      });

      if (!response.ok) throw new Error("Scheduling API failed");
      const data = await response.json();

      setComposerStatus({
        msg: `Success! Scheduled post (ID: ${data.id}) via Temporal workflows.`,
        type: "success",
      });

      // Add to calendar and workflows
      const dateObj = new Date(scheduledAt);
      const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
      const timeStr = dateObj.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });

      setCalendarItems((prev) => [
        ...prev,
        { id: `cal-${data.id || Date.now()}`, channel: selectedChannels[0] || "linkedin", title: composerContent.substring(0, 36) + "...", time: timeStr, day: dayName },
      ]);

      setActiveWorkflows((prev) => [
        ...prev,
        { id: `WF-${Math.floor(1000 + Math.random() * 9000)}`, type: "PostPublishingWorkflow", target: selectedChannels.join(", "), scheduled: scheduledAt, status: "Scheduled" },
      ]);

      setActivityLogs((prev) => [
        ...prev,
        { id: newLogId, timestamp, level: "AUDIT", msg: `post.scheduled (Platforms: ${selectedChannels.join(", ")})` },
      ]);

    } catch (err) {
      console.warn("Scheduler API offline, invoking client fallback simulation:", err);
      // Demo Fallback
      setComposerStatus({
        msg: `Demo Mode: Temporal workflow PostPublishingWorkflow successfully triggered! Anti-ban stagger is set to ${staggerMinutes}m.`,
        type: "success",
      });

      const dateObj = new Date(scheduledAt);
      const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
      const timeStr = dateObj.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });

      setCalendarItems((prev) => [
        ...prev,
        { id: `cal-demo-${Date.now()}`, channel: selectedChannels[0] || "linkedin", title: composerContent.substring(0, 36) + "...", time: timeStr, day: dayName },
      ]);

      setActiveWorkflows((prev) => [
        ...prev,
        { id: `WF-${Math.floor(1000 + Math.random() * 9000)}`, type: "PostPublishingWorkflow", target: selectedChannels.join(", "), scheduled: scheduledAt, status: "Scheduled" },
      ]);

      setActivityLogs((prev) => [
        ...prev,
        { id: newLogId, timestamp, level: "AUDIT", msg: `post.scheduled_demo (Platforms: ${selectedChannels.join(", ")})` },
      ]);
    } finally {
      setComposerSubmitting(false);
      setTimeout(() => {
        setDrawerOpen(false);
      }, 1500);
    }
  };

  // AI Chat generation query
  const handleAiChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiChatQuery.trim()) return;

    const userMsg = aiChatQuery;
    setAiChatHistory((prev) => [...prev, { sender: "user", text: userMsg }]);
    setAiChatQuery("");

    setTimeout(() => {
      let reply = "I've processed your instructions. I recommend scheduling this variant targeting mid-week engagement.";
      if (userMsg.toLowerCase().includes("post") || userMsg.toLowerCase().includes("generate")) {
        reply = `Here is a custom draft for your channels:
"🚀 Transforming enterprise telemetry doesn't happen overnight. By routing post-engagement telemetry streams through Kafka to ClickHouse, we verified RLS boundary containment under high volume. Check out the full audit log!"

Click the 'Generate Post' chip or open the scheduling drawer to publish!`;
      }
      setAiChatHistory((prev) => [...prev, { sender: "ai", text: reply }]);
    }, 1000);
  };

  const handleChipAction = (actionType: string) => {
    let prefilledText = "";
    if (actionType === "post") {
      prefilledText = "🚀 Achieving <1.5s real-time analytics sync across multi-tenant workspaces is now live! Powered by Kafka and ClickHouse. #telemetry #data #scaling";
    } else if (actionType === "thread") {
      prefilledText = "1/5 Securing data boundaries in a multi-tenant environment is critical. Let's break down Row-Level Security in Postgres 16...\n\n2/5 Standard schemas require separate DBs. Instead, we use RLS policies triggered by active session identifiers...";
    } else if (actionType === "campaign") {
      prefilledText = "Announcing our Summer Distribution Campaign. Streamlining all omni-channel publishing schedules with unified temporal workflows.";
    }

    if (prefilledText) {
      setComposerContent(prefilledText);
      setDrawerOpen(true);
    }
  };

  useEffect(() => {
    // Defer the initial fetch to avoid synchronous setState inside the effect body
    const timer = setTimeout(() => {
      fetchMetrics();
    }, 0);
    const interval = setInterval(fetchMetrics, 10000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  // Media Library filter helper
  const filteredMedia = mediaItems.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(mediaSearch.toLowerCase());
    const matchesFilter = mediaFilter === "All" || m.type === mediaFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      workspaces={workspaces}
      activeWorkspace={activeWorkspace}
      onWorkspaceChange={setActiveWorkspace}
      connectedAccounts={connectedAccounts}
      activityLogs={activityLogs}
      onClearLogs={() => setActivityLogs([])}
    >
      <AnimatePresence mode="wait">
        {activeTab === "dashboard" && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
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
          </motion.div>
        )}

        {activeTab === "personal-hub" && (
          <motion.div
            key="personal-hub"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Personal Hub Sub Navigation */}
            <div className="flex gap-2 bg-[#121218] border border-white/[0.08] p-1.5 rounded-2xl w-fit">
              <button
                onClick={() => setPersonalHubSection("overview")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  personalHubSection === "overview"
                    ? "bg-[#7C3AED] text-white"
                    : "text-[#A1A1AA] hover:text-white"
                }`}
              >
                Personal Brand Dashboard
              </button>
              <button
                onClick={() => setPersonalHubSection("twin")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  personalHubSection === "twin"
                    ? "bg-[#7C3AED] text-white"
                    : "text-[#A1A1AA] hover:text-white"
                }`}
              >
                Digital Twin Control
              </button>
              <button
                onClick={() => setPersonalHubSection("career")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  personalHubSection === "career"
                    ? "bg-[#7C3AED] text-white"
                    : "text-[#A1A1AA] hover:text-white"
                }`}
              >
                Career OS Map
              </button>
            </div>

            {/* Sub-tab views */}
            {personalHubSection === "overview" && (
              <PersonalHubDashboard
                onNotify={(msg, level) => {
                  const timestamp = new Date().toLocaleTimeString();
                  setActivityLogs((prev) => [
                    ...prev,
                    { id: Date.now().toString(), timestamp, level, msg },
                  ]);
                }}
              />
            )}

            {personalHubSection === "twin" && (
              <DigitalTwinConfig
                onNotify={(msg, level) => {
                  const timestamp = new Date().toLocaleTimeString();
                  setActivityLogs((prev) => [
                    ...prev,
                    { id: Date.now().toString(), timestamp, level, msg },
                  ]);
                }}
              />
            )}

            {personalHubSection === "career" && (
              <CareerOSComponent
                onNotify={(msg, level) => {
                  const timestamp = new Date().toLocaleTimeString();
                  setActivityLogs((prev) => [
                    ...prev,
                    { id: Date.now().toString(), timestamp, level, msg },
                  ]);
                }}
              />
            )}
          </motion.div>
        )}

        {/* Weekly Calendar Planner View */}
        {activeTab === "calendar" && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Omni Calendar</h2>
                <p className="text-xs text-[#A1A1AA] mt-1">Drag and drop posts to reschedule, manage multiple platforms in a weekly layout.</p>
              </div>
              <button
                onClick={() => setDrawerOpen(true)}
                className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Icons.Plus className="w-4.5 h-4.5" />
                <span>Add Slot</span>
              </button>
            </div>

            {/* Calendar Layout */}
            <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl">
              <div className="grid grid-cols-7 gap-3 text-center border-b border-white/[0.08] pb-4 mb-4">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <div key={day} className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-3 min-h-[420px]">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                  const dayItems = calendarItems.filter((i) => i.day === day);
                  return (
                    <div
                      key={day}
                      onClick={() => {
                        const targetDate = new Date();
                        const daysOffset = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(day);
                        targetDate.setDate(targetDate.getDate() + (daysOffset - targetDate.getDay() + 1));
                        targetDate.setHours(9, 0, 0, 0);
                        setScheduledAt(targetDate.toISOString().slice(0, 16));
                        setDrawerOpen(true);
                      }}
                      className="bg-[#0B0B0F]/40 border border-white/[0.04] hover:border-[#7C3AED]/30 rounded-xl p-2.5 space-y-2 cursor-pointer transition-colors min-h-[120px]"
                    >
                      {dayItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Quick detail view / delete trigger
                            if (confirm(`Remove this scheduled item: "${item.title}"?`)) {
                              setCalendarItems(calendarItems.filter((c) => c.id !== item.id));
                            }
                          }}
                          className={`p-2 rounded-lg border text-left cursor-grab active:cursor-grabbing transition-all ${
                            item.channel === "linkedin"
                              ? "bg-blue-900/10 border-blue-800/20 text-blue-400"
                              : item.channel === "twitter"
                              ? "bg-sky-900/10 border-sky-850/20 text-sky-400"
                              : "bg-indigo-900/10 border-indigo-850/20 text-indigo-400"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[8px] font-mono mb-1 uppercase font-semibold">
                            <span>{item.channel}</span>
                            <span>{item.time}</span>
                          </div>
                          <p className="text-[10px] leading-tight font-medium truncate">{item.title}</p>
                        </div>
                      ))}
                      {dayItems.length === 0 && (
                        <div className="h-full flex items-center justify-center text-[10px] text-white/10 select-none">
                          + Empty
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* AI Workspace (AI Agent Studio) View */}
        {activeTab === "agent" && (
          <motion.div
            key="agent"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">AI Workspace</h2>
              <p className="text-xs text-[#A1A1AA] mt-1">Brand Voice alignment, smart templates prompt library, and context-aware post/thread generations.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Brand voice configuration */}
              <div className="space-y-6">
                <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <Icons.Sliders className="w-4 h-4 text-[#8B5CF6]" />
                    <span>Brand Voice Profile</span>
                  </h3>
                  
                  <div>
                    <label className="text-[10px] uppercase text-[#A1A1AA] tracking-wider block mb-1.5 font-bold">Global Tone</label>
                    <input
                      type="text"
                      value={brandVoice}
                      onChange={(e) => setBrandVoice(e.target.value)}
                      className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-[#A1A1AA] tracking-wider block mb-1.5 font-bold">Target Demographics</label>
                    <input
                      type="text"
                      defaultValue="Frontend Architects, SaaS Founders, Devops"
                      className="w-full bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                    />
                  </div>
                </div>

                {/* Prompt Library */}
                <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-3.5">
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <Icons.BookOpen className="w-4 h-4 text-[#8B5CF6]" />
                    <span>Prompt Library</span>
                  </h3>
                  
                  <div className="space-y-2">
                    {promptLibrary.map((item) => (
                      <button
                        key={item.title}
                        onClick={() => setAiChatQuery(item.text)}
                        className="w-full text-left p-2.5 bg-[#0B0B0F]/50 hover:bg-[#0B0B0F] border border-white/[0.04] rounded-xl text-[11px] text-[#A1A1AA] hover:text-white transition duration-150 cursor-pointer"
                      >
                        <h4 className="font-semibold text-white mb-0.5">{item.title}</h4>
                        <p className="truncate text-[10px]">{item.text}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat Interface */}
              <div className="lg:col-span-2 bg-[#121218] border border-white/[0.08] rounded-2xl flex flex-col h-[520px] shadow-xl overflow-hidden relative">
                {/* Chat Feed */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {aiChatHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
                        msg.sender === "user" ? "bg-[#7C3AED] text-white" : "bg-[#181821] border border-white/[0.08] text-[#8B5CF6]"
                      }`}>
                        {msg.sender === "user" ? "U" : "AI"}
                      </div>
                      
                      <div className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                        msg.sender === "user"
                          ? "bg-[#7C3AED]/10 border border-[#7C3AED]/20 text-white"
                          : "bg-[#0B0B0F]/60 border border-white/[0.04] text-[#A1A1AA]"
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chips and Input area */}
                <div className="p-4 border-t border-white/[0.08] bg-[#0B0B0F]/60 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleChipAction("post")}
                      className="px-3 py-1.5 bg-[#121218] hover:bg-[#181821] border border-white/[0.06] hover:border-[#7C3AED]/40 rounded-full text-[10px] font-semibold text-[#8B5CF6] hover:text-white transition cursor-pointer"
                    >
                      💡 Generate Post
                    </button>
                    <button
                      onClick={() => handleChipAction("thread")}
                      className="px-3 py-1.5 bg-[#121218] hover:bg-[#181821] border border-white/[0.06] hover:border-[#7C3AED]/40 rounded-full text-[10px] font-semibold text-[#8B5CF6] hover:text-white transition cursor-pointer"
                    >
                      🧵 Generate Thread
                    </button>
                    <button
                      onClick={() => handleChipAction("campaign")}
                      className="px-3 py-1.5 bg-[#121218] hover:bg-[#181821] border border-white/[0.06] hover:border-[#7C3AED]/40 rounded-full text-[10px] font-semibold text-[#8B5CF6] hover:text-white transition cursor-pointer"
                    >
                      📢 Generate Campaign
                    </button>
                  </div>

                  <form onSubmit={handleAiChatSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={aiChatQuery}
                      onChange={(e) => setAiChatQuery(e.target.value)}
                      placeholder="Ask AI Agent to draft, edit, or stagger your campaign schedules..."
                      className="flex-1 bg-[#121218] border border-white/[0.08] text-white text-xs rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                    />
                    <button
                      type="submit"
                      className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white px-4 py-3 rounded-xl flex items-center justify-center transition cursor-pointer"
                    >
                      <Icons.Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Content Studio View */}
        {activeTab === "studio" && (
          <motion.div
            key="studio"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Content Studio</h2>
                <p className="text-xs text-[#A1A1AA] mt-1">Manage draft campaigns, active templates, and review pending approval pipelines.</p>
              </div>
              <button
                onClick={() => setDrawerOpen(true)}
                className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Icons.Plus className="w-4.5 h-4.5" />
                <span>New Campaign</span>
              </button>
            </div>

            {/* Tabs for Studio */}
            <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex gap-3 border-b border-white/[0.08] pb-3">
                {["Drafts", "Scheduled", "Published", "Campaigns", "Templates"].map((subTab) => (
                  <button
                    key={subTab}
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg hover:bg-white/[0.04] text-[#A1A1AA] hover:text-white transition cursor-pointer"
                  >
                    {subTab}
                  </button>
                ))}
              </div>

              {/* Lists Draft items */}
              <div className="space-y-3 pt-2">
                <div className="p-4 bg-[#0B0B0F]/50 border border-white/[0.04] rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Next-gen Ingestion Announcement Variant</h4>
                    <p className="text-[10px] text-[#A1A1AA] mt-1">Targeting LinkedIn override. Created 2 hours ago.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setComposerContent("Next-gen ingestion benchmarks are scaling! <1.5s lag persistence verified.");
                        setDrawerOpen(true);
                      }}
                      className="text-[10px] bg-[#121218] border border-white/[0.06] text-white hover:border-[#7C3AED] px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => alert("Campaign launched into approval loop!")}
                      className="text-[10px] bg-[#7C3AED] text-white px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer"
                    >
                      Request Approval
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-[#0B0B0F]/50 border border-white/[0.04] rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Postgres RLS Policy Architecture breakdown</h4>
                    <p className="text-[10px] text-[#A1A1AA] mt-1">Targeting Twitter/X Thread. Created 1 day ago.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setComposerContent("1/3 RLS in Postgres is amazing...");
                        setDrawerOpen(true);
                      }}
                      className="text-[10px] bg-[#121218] border border-white/[0.06] text-white hover:border-[#7C3AED] px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => alert("Campaign launched into approval loop!")}
                      className="text-[10px] bg-[#7C3AED] text-white px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer"
                    >
                      Request Approval
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Media Library View */}
        {activeTab === "media" && (
          <motion.div
            key="media"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Media Library</h2>
                <p className="text-xs text-[#A1A1AA] mt-1">Store visual assets, infographics, and promotional video clips in isolated workspace folders.</p>
              </div>
              
              <label className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer">
                <Icons.Upload className="w-4 h-4" />
                <span>Upload Media</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={() => {
                    setMediaItems((prev) => [
                      ...prev,
                      { id: `m-${Date.now()}`, name: "uploaded_graphic.png", type: "Image", size: "1.2 MB", date: "2026-06-15", views: 0, url: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&q=80" },
                    ]);
                  }}
                />
              </label>
            </div>

            {/* Controls */}
            <div className="flex gap-4">
              <div className="flex-1 bg-[#121218] border border-white/[0.08] rounded-xl px-3.5 py-2 flex items-center gap-2">
                <Icons.Search className="w-4.5 h-4.5 text-[#A1A1AA]" />
                <input
                  type="text"
                  placeholder="Search assets by tag or name..."
                  value={mediaSearch}
                  onChange={(e) => setMediaSearch(e.target.value)}
                  className="w-full bg-transparent text-white text-xs focus:outline-none"
                />
              </div>

              <select
                value={mediaFilter}
                onChange={(e) => setMediaFilter(e.target.value)}
                className="bg-[#121218] border border-white/[0.08] text-white text-xs rounded-xl px-4 py-2 focus:outline-none cursor-pointer"
              >
                <option value="All">All Types</option>
                <option value="Image">Images</option>
                <option value="Video">Videos</option>
              </select>
            </div>

            {/* Masonry Grid */}
            {filteredMedia.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredMedia.map((m) => (
                  <div
                    key={m.id}
                    className="bg-[#121218] border border-white/[0.08] hover:border-[#7C3AED]/30 rounded-2xl overflow-hidden shadow-xl group transition duration-200"
                  >
                    <div className="h-40 bg-[#0B0B0F] relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.url}
                        alt={m.name}
                        className="w-full h-full object-cover group-hover:scale-102 transition duration-200"
                      />
                      <span className="absolute top-2.5 left-2.5 text-[9px] bg-[#0B0B0F]/80 backdrop-blur-sm text-[#A1A1AA] border border-white/[0.08] px-2 py-0.5 rounded-full font-semibold">
                        {m.type}
                      </span>
                    </div>

                    <div className="p-4 space-y-2">
                      <h4 className="text-xs font-bold text-white truncate">{m.name}</h4>
                      <div className="flex justify-between items-center text-[10px] text-[#A1A1AA] font-mono">
                        <span>{m.size}</span>
                        <span>{m.date}</span>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2.5 border-t border-white/[0.04] text-[9px] font-mono text-[#A1A1AA]/60">
                        <span>Views: {m.views.toLocaleString()}</span>
                        <button
                          onClick={() => setMediaItems(mediaItems.filter((i) => i.id !== m.id))}
                          className="text-[#EF4444] hover:text-[#ef4444]/80 transition cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No media assets found"
                description="Upload campaign promotional images or explainer videos to reuse across social streams."
                icon="Image"
                action={{
                  label: "Upload Media File",
                  onClick: () => {
                    setMediaItems((prev) => [
                      ...prev,
                      { id: `m-${Date.now()}`, name: "welcome_poster.png", type: "Image", size: "1.5 MB", date: "2026-06-15", views: 0, url: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400&q=80" },
                    ]);
                  },
                }}
              />
            )}
          </motion.div>
        )}

        {/* Executive Analytics View */}
        {activeTab === "analytics" && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">Executive Analytics</h2>
              <p className="text-xs text-[#A1A1AA] mt-1">Ingestion rates, click attribution CTR calculations, and top-performing post telemetry summaries.</p>
            </div>

            {/* Custom Premium SVG Area Chart (Impressions over Time) */}
            <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
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

              <div className="h-64 w-full relative pt-4">
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

            {/* Attributions breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(metrics?.byPlatform || {
                linkedin: { views: 82400, clicks: 4900, shares: 720 },
                twitter: { views: 51200, clicks: 3100, shares: 410 },
                facebook: { views: 9200, clicks: 491, shares: 110 },
              }).map(([platform, platData]) => {
                const totalViews = metrics?.views || 142800;
                const percentage = totalViews > 0 ? ((platData.views / totalViews) * 100).toFixed(0) : "0";
                
                return (
                  <div key={platform} className="bg-[#121218] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white capitalize">{platform} Breakdown</span>
                      <span className="text-[10px] font-mono text-[#8B5CF6] font-semibold">{percentage}%</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] text-[#A1A1AA]">
                        <span>Views</span>
                        <span className="text-white font-mono">{platData.views.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-[#A1A1AA]">
                        <span>Clicks</span>
                        <span className="text-white font-mono">{platData.clicks.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-[#A1A1AA]">
                        <span>Shares</span>
                        <span className="text-white font-mono">{platData.shares.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-[#A1A1AA] pt-2 border-t border-white/[0.04]">
                        <span>Click-Through Rate</span>
                        <span className="text-[#22C55E] font-bold font-mono">
                          {platData.views > 0 ? ((platData.clicks / platData.views) * 100).toFixed(2) : "0.00"}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Integrations Marketplace View */}
        {activeTab === "integrations" && (
          <motion.div
            key="integrations"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">Integrations</h2>
              <p className="text-xs text-[#A1A1AA] mt-1">Connect API channels, CMS feeds, notification services, and local sandbox database fallbacks.</p>
            </div>

            {/* Category selection */}
            <div className="flex gap-2.5">
              {["All", "Social", "AI", "Video", "CMS", "Automation"].map((cat) => (
                <button
                  key={cat}
                  className="px-3.5 py-1.5 bg-[#121218] hover:bg-[#181821] border border-white/[0.06] rounded-xl text-xs font-semibold text-[#A1A1AA] hover:text-white transition cursor-pointer"
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Marketplace Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-[#121218] border border-white/[0.08] hover:border-[#7C3AED]/35 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition duration-200">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-900/20 border border-blue-900/30 flex items-center justify-center text-blue-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                        <rect x="2" y="9" width="4" height="12" />
                        <circle cx="4" cy="4" r="2" />
                      </svg>
                    </div>
                    <span className="text-[9px] bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 px-2 py-0.5 rounded-full font-semibold">Connected</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">LinkedIn Publisher</h4>
                    <p className="text-xs text-[#A1A1AA] mt-1">Auto-publish updates, articles, and media attachments to LinkedIn corporate pages.</p>
                  </div>
                </div>
                <div className="flex gap-2.5 mt-6 pt-4 border-t border-white/[0.04]">
                  <button className="flex-1 bg-[#0B0B0F] hover:bg-[#181821] border border-white/[0.08] text-xs font-semibold text-white py-2 rounded-xl transition cursor-pointer">Settings</button>
                  <button className="text-[11px] text-[#EF4444] font-semibold hover:underline px-2 cursor-pointer">Disconnect</button>
                </div>
              </div>

              <div className="bg-[#121218] border border-white/[0.08] hover:border-[#7C3AED]/35 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition duration-200">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-purple-900/20 border border-purple-900/30 flex items-center justify-center">
                      <Icons.Sparkles className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="text-[9px] bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 px-2 py-0.5 rounded-full font-semibold">Active</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">OpenAI Intelligence</h4>
                    <p className="text-xs text-[#A1A1AA] mt-1">Provide AI prompts processing, brand-voice adjustments, and visual post ideas generator.</p>
                  </div>
                </div>
                <div className="flex gap-2.5 mt-6 pt-4 border-t border-white/[0.04]">
                  <button className="flex-1 bg-[#0B0B0F] hover:bg-[#181821] border border-white/[0.08] text-xs font-semibold text-white py-2 rounded-xl transition cursor-pointer">Settings</button>
                  <button className="text-[11px] text-[#EF4444] font-semibold hover:underline px-2 cursor-pointer">Disconnect</button>
                </div>
              </div>

              <div className="bg-[#121218] border border-white/[0.08] hover:border-[#7C3AED]/35 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition duration-200">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                      <Icons.Cpu className="w-5 h-5 text-white/60" />
                    </div>
                    <span className="text-[9px] bg-white/[0.06] text-[#A1A1AA] border border-white/[0.08] px-2 py-0.5 rounded-full font-semibold">Not Configured</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Make.com / Integromat</h4>
                    <p className="text-xs text-[#A1A1AA] mt-1">Synchronize campaign workflows with hundreds of 3rd party applications automatically.</p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-white/[0.04]">
                  <button className="w-full bg-[#7C3AED] hover:bg-[#8B5CF6] text-xs font-bold text-white py-2 rounded-xl transition cursor-pointer">Connect Integration</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Workspace details inside app shell */}
        {activeTab === "workspace" && (
          <motion.div
            key="workspace"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">Workspace Configuration</h2>
              <p className="text-xs text-[#A1A1AA] mt-1">Manage active tenant environments, postgres RLS validation, and data residency regions.</p>
            </div>

            <div className="p-6 bg-[#121218] border border-white/[0.08] rounded-2xl shadow-xl space-y-4">
              <h3 className="text-md font-bold text-white">Active Tenant Workspace Context</h3>
              <p className="text-xs text-[#A1A1AA]">Select `Manage Workspaces` inside the headers quick switch rail to provision separate Postgres boundary containers.</p>
              
              <div className="grid grid-cols-2 gap-4 max-w-lg font-mono text-xs pt-2">
                <div className="p-3 bg-[#0B0B0F]/50 border border-white/[0.04] rounded-lg">
                  <span className="text-[#A1A1AA] block mb-1">Active Name</span>
                  <span className="text-white font-bold">{activeWorkspace}</span>
                </div>
                <div className="p-3 bg-[#0B0B0F]/50 border border-white/[0.04] rounded-lg">
                  <span className="text-[#A1A1AA] block mb-1">Tenant ID</span>
                  <span className="text-[#8B5CF6] font-bold">Fluxora-Tenant-098</span>
                </div>
              </div>
              
              <div className="pt-4">
                <Link
                  href="/workspaces"
                  className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer inline-block"
                >
                  Go to Workspace Sandbox Manager →
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Settings Hub View */}
        {activeTab === "settings" && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">Settings Hub</h2>
              <p className="text-xs text-[#A1A1AA] mt-1">Configure global notification pathways, secure API keys, and developer webhook payloads.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-xl relative">
              {/* Settings Sidebar */}
              <div className="space-y-1 md:border-r border-white/[0.08] pr-4">
                {["Workspace", "Team", "Notifications", "Security", "API Keys", "Billing", "Developer"].map((sect) => (
                  <button
                    key={sect}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-[#A1A1AA] hover:text-white rounded-lg hover:bg-white/[0.02] transition cursor-pointer"
                  >
                    {sect}
                  </button>
                ))}
              </div>

              {/* Form Content */}
              <div className="md:col-span-3 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">API Configurations</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase text-[#A1A1AA] tracking-wider block mb-1.5 font-bold">Secure Access Token Key</label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          readOnly
                          value="fluxora_live_2b86556e9c991e6ad65f6f"
                          className="flex-1 bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none"
                        />
                        <button
                          onClick={() => alert("Token Copied!")}
                          className="bg-[#121218] hover:bg-[#181821] border border-white/[0.08] text-xs font-bold text-white px-4 rounded-xl transition cursor-pointer"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Webhook Subscriptions</h3>
                  <div className="p-4 bg-[#0B0B0F]/50 border border-white/[0.04] rounded-xl text-xs text-[#A1A1AA] leading-relaxed">
                    ⚙ Currently listening for post actions on topic <strong>fluxora.audit.log</strong>. Webhook endpoints route notifications to client sandboxes immediately.
                  </div>
                </div>

                {/* Sticky save bar simulator */}
                <div className="bg-[#121218] border-t border-white/[0.08] pt-4 flex justify-end gap-3">
                  <button className="px-4 py-2 bg-[#0B0B0F] hover:bg-[#181821] border border-white/[0.08] rounded-xl text-xs font-semibold text-white transition cursor-pointer">Reset</button>
                  <button
                    onClick={() => alert("Configuration settings saved successfully!")}
                    className="px-5 py-2 bg-[#7C3AED] hover:bg-[#8B5CF6] rounded-xl text-xs font-bold text-white shadow-lg shadow-[#7C3AED]/20 transition cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-out Create Content Drawer (Non-Modal sliding panel) */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-[#0B0B0F]/60 backdrop-blur-sm"
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-xl h-full bg-[#121218] border-l border-white/[0.08] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
                <div>
                  <h3 className="text-md font-bold text-white">Compose Omnichannel Campaign</h3>
                  <p className="text-[11px] text-[#A1A1AA] mt-0.5">Stagger launch times across secure workspace channels.</p>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 hover:bg-white/[0.04] rounded-lg text-[#A1A1AA] hover:text-white transition cursor-pointer"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Scroll Area */}
              <form onSubmit={handleScheduleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Channels selector */}
                <ChannelSelector
                  selectedChannels={selectedChannels}
                  onChange={(chans) => setSelectedChannels(chans)}
                />

                {/* Content Input */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Message Content</label>
                  <div className="relative">
                    <textarea
                      value={composerContent}
                      onChange={(e) => setComposerContent(e.target.value)}
                      placeholder="Type your social marketing copy here..."
                      className="w-full h-32 bg-[#0B0B0F] border border-white/[0.08] rounded-xl p-3.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#7C3AED] resize-none"
                      required
                    />
                    <span className="absolute bottom-3 right-3 text-[9px] text-[#A1A1AA]/60 font-mono">
                      {composerContent.length} chars
                    </span>
                  </div>
                </div>

                {/* Overrides trigger */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowComposerOverrides(!showComposerOverrides)}
                    className="text-xs font-semibold text-[#8B5CF6] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showComposerOverrides ? "Hide Custom Text Overrides" : "Show Platform Custom Text Overrides"}</span>
                    <Icons.ChevronDown className={`w-3.5 h-3.5 transition-transform ${showComposerOverrides ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {showComposerOverrides && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-3 space-y-3 bg-[#0B0B0F]/60 border border-white/[0.04] p-3 rounded-xl overflow-hidden"
                      >
                        {selectedChannels.includes("linkedin") && (
                          <div>
                            <label className="block text-[9px] uppercase text-[#A1A1AA] tracking-wider mb-1 font-bold">LinkedIn Custom override</label>
                            <textarea
                              value={linkedinOverride}
                              onChange={(e) => setLinkedinOverride(e.target.value)}
                              placeholder="Type custom text for LinkedIn feed..."
                              className="w-full h-16 bg-[#121218] border border-white/[0.08] rounded-lg p-2 text-xs text-white focus:outline-none resize-none"
                            />
                          </div>
                        )}
                        {selectedChannels.includes("twitter") && (
                          <div>
                            <label className="block text-[9px] uppercase text-[#A1A1AA] tracking-wider mb-1 font-bold">Twitter / X Custom override</label>
                            <textarea
                              value={twitterOverride}
                              onChange={(e) => setTwitterOverride(e.target.value)}
                              placeholder="Type custom text for Twitter/X post..."
                              className="w-full h-16 bg-[#121218] border border-white/[0.08] rounded-lg p-2 text-xs text-white focus:outline-none resize-none"
                            />
                          </div>
                        )}
                        {selectedChannels.includes("facebook") && (
                          <div>
                            <label className="block text-[9px] uppercase text-[#A1A1AA] tracking-wider mb-1 font-bold">Facebook Custom override</label>
                            <textarea
                              value={facebookOverride}
                              onChange={(e) => setFacebookOverride(e.target.value)}
                              placeholder="Type custom text for Facebook status..."
                              className="w-full h-16 bg-[#121218] border border-white/[0.08] rounded-lg p-2 text-xs text-white focus:outline-none resize-none"
                            />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Scheduling Parameters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0B0B0F]/40 border border-white/[0.04] p-4 rounded-xl">
                  <div>
                    <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider mb-1.5">Launch Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="bg-[#121218] border border-white/[0.08] text-white text-xs rounded-lg px-3 py-2 focus:outline-none w-full cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Stagger interval</label>
                      <span className="text-[11px] font-bold text-[#8B5CF6] font-mono">{staggerMinutes}m</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="60"
                      step="5"
                      value={staggerMinutes}
                      onChange={(e) => setStaggerMinutes(Number(e.target.value))}
                      className="w-full h-1 bg-[#121218] rounded-lg appearance-none cursor-pointer accent-[#7C3AED] mt-2.5"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-4 space-y-3">
                  <button
                    type="submit"
                    disabled={composerSubmitting}
                    className="w-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-[#7C3AED]/20 transition cursor-pointer"
                  >
                    {composerSubmitting ? "Triggering workflows..." : "Schedule Omnichannel Launch"}
                  </button>

                  {composerStatus.msg && (
                    <div className={`p-3 border rounded-xl text-xs font-mono leading-relaxed ${
                      composerStatus.type === "success"
                        ? "bg-[#22C55E]/10 border-[#22C55E]/20 text-[#22C55E]"
                        : "bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]"
                    }`}>
                      {composerStatus.msg}
                    </div>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
