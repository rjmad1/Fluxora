"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Types matching current schema
export interface Variant {
  platform: string;
  overrideContent: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "AUDIT" | "WARN";
  msg: string;
}

export interface MetricBreakdown {
  views: number;
  clicks: number;
  shares: number;
}

export interface AnalyticsData {
  views: number;
  clicks: number;
  shares: number;
  byPlatform: Record<string, MetricBreakdown>;
}

export interface Workspace {
  id: string;
  name: string;
  tenant: string;
  region: string;
}

export interface ConnectedAccount {
  provider: string;
  name: string;
  avatar: string;
  status: string;
  lastRefreshed: string;
}

export interface ActiveWorkflow {
  id: string;
  type: string;
  target: string;
  scheduled: string;
  status: string;
}

export interface CalendarItem {
  id: string;
  channel: string;
  title: string;
  time: string;
  day: string;
}

export interface MediaItem {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  views: number;
  url: string;
}

export interface ChatMessage {
  sender: "user" | "ai";
  text: string;
}

interface AppContextType {
  activeWorkspace: string;
  setActiveWorkspace: (ws: string) => void;
  selectedChannels: string[];
  setSelectedChannels: (channels: string[]) => void;
  personalHubSection: string;
  setPersonalHubSection: (section: string) => void;
  studioSubTab: "composer" | "designer" | "transformer" | "team" | "platform";
  setStudioSubTab: (tab: "composer" | "designer" | "transformer" | "team" | "platform") => void;
  integrationsSubTab: "marketplace" | "developer";
  setIntegrationsSubTab: (tab: "marketplace" | "developer") => void;
  agentSubTab: "assistant" | "cli";
  setAgentSubTab: (tab: "assistant" | "cli") => void;
  automationsSubTab: "builder" | "thirdparty" | "telegram" | "evergreen";
  setAutomationsSubTab: (tab: "builder" | "thirdparty" | "telegram" | "evergreen") => void;
  settingsSidebarSubTab: "general" | "notifications" | "selfhosted" | "identity";
  setSettingsSidebarSubTab: (tab: "general" | "notifications" | "selfhosted" | "identity") => void;
  maintenanceEnabled: boolean;
  setMaintenanceEnabled: (enabled: boolean) => void;
  topPostsFilter: string;
  setTopPostsFilter: (filter: string) => void;
  isExportingPdf: boolean;
  setIsExportingPdf: (exporting: boolean) => void;
  
  workspaces: Workspace[];
  connectedAccounts: ConnectedAccount[];
  fetchConnectedAccounts: () => Promise<void>;
  activeWorkflows: ActiveWorkflow[];
  setActiveWorkflows: React.Dispatch<React.SetStateAction<ActiveWorkflow[]>>;
  activityLogs: LogEntry[];
  setActivityLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  clearLogs: () => void;
  
  // Metrics
  metrics: AnalyticsData | null;
  loadingMetrics: boolean;
  fetchMetrics: () => Promise<void>;
  
  // Telemetry Simulator
  simPlatform: string;
  setSimPlatform: (platform: string) => void;
  simEventType: string;
  setSimEventType: (eventType: string) => void;
  simulating: boolean;
  simulateEvent: () => Promise<void>;
  
  // Composer Drawer State
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  composerContent: string;
  setComposerContent: (content: string) => void;
  scheduledAt: string;
  setScheduledAt: (time: string) => void;
  staggerMinutes: number;
  setStaggerMinutes: (mins: number) => void;
  linkedinOverride: string;
  setLinkedinOverride: (content: string) => void;
  twitterOverride: string;
  setTwitterOverride: (content: string) => void;
  facebookOverride: string;
  setFacebookOverride: (content: string) => void;
  composerSubmitting: boolean;
  composerStatus: { msg: string; type: "success" | "error" | "" };
  setComposerStatus: (status: { msg: string; type: "success" | "error" | "" }) => void;
  showComposerOverrides: boolean;
  setShowComposerOverrides: (show: boolean) => void;
  handleScheduleSubmit: (e: React.FormEvent) => Promise<void>;
  
  // Calendar & Media
  calendarItems: CalendarItem[];
  setCalendarItems: React.Dispatch<React.SetStateAction<CalendarItem[]>>;
  mediaItems: MediaItem[];
  setMediaItems: React.Dispatch<React.SetStateAction<MediaItem[]>>;
  
  // AI Chat
  aiChatQuery: string;
  setAiChatQuery: (query: string) => void;
  aiChatHistory: ChatMessage[];
  setAiChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  brandVoice: string;
  setBrandVoice: (voice: string) => void;
  promptLibrary: Array<{ title: string; text: string }>;
  handleAiChatSubmit: (e: React.FormEvent) => void;
  handleChipAction: (actionType: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  
  const [activeWorkspace, setActiveWorkspace] = useState("Workspace A (Brand Operations)");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["linkedin", "twitter"]);
  const [personalHubSection, setPersonalHubSection] = useState("overview");
  const [studioSubTab, setStudioSubTab] = useState<"composer" | "designer" | "transformer" | "team" | "platform">("composer");
  const [integrationsSubTab, setIntegrationsSubTab] = useState<"marketplace" | "developer">("marketplace");
  const [agentSubTab, setAgentSubTab] = useState<"assistant" | "cli">("assistant");
  const [automationsSubTab, setAutomationsSubTab] = useState<"builder" | "thirdparty" | "telegram" | "evergreen">("builder");
  const [settingsSidebarSubTab, setSettingsSidebarSubTab] = useState<"general" | "notifications" | "selfhosted" | "identity">("general");
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [topPostsFilter, setTopPostsFilter] = useState("All");
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Workspaces list
  const workspaces: Workspace[] = [
    { id: "ws-1", name: "Workspace A (Brand Operations)", tenant: "Enterprise Agency Tier", region: "US-East" },
    { id: "ws-2", name: "Workspace B (Global Marketing)", tenant: "Enterprise Agency Tier", region: "EU-West" },
  ];

  // Connected Accounts state and fetcher
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([
    { provider: "LinkedIn", name: "Fluxora Enterprise", avatar: "FL", status: "Active", lastRefreshed: "2 mins ago" },
    { provider: "Twitter / X", name: "@FluxoraApp", avatar: "FX", status: "Active", lastRefreshed: "12 mins ago" },
    { provider: "Facebook", name: "Fluxora Social", avatar: "FS", status: "Active", lastRefreshed: "1 hour ago" },
  ]);

  const fetchConnectedAccounts = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/v1/accounts", {
        headers: {
          "X-Tenant-ID": "Fluxora-Tenant-098",
          "X-Workspace-ID": "ws-1",
        },
      });
      if (response.ok) {
        const data = await response.json();
        const mapped = data.map((acc: any) => ({
          provider: acc.provider === 'linkedin' ? 'LinkedIn' : acc.provider === 'twitter' ? 'Twitter / X' : acc.provider === 'facebook' ? 'Facebook' : acc.provider,
          name: acc.name,
          avatar: acc.avatarUrl || acc.name.substring(0, 2).toUpperCase(),
          status: acc.status === 'ACTIVE' ? 'Active' : acc.status,
          lastRefreshed: "Just now",
        }));
        setConnectedAccounts(mapped);
      } else {
        throw new Error("Backend response error");
      }
    } catch (err) {
      console.warn("Failed to fetch connected accounts, using mock defaults:", err);
      setConnectedAccounts([
        { provider: "LinkedIn", name: "Fluxora Enterprise", avatar: "FL", status: "Active", lastRefreshed: "2 mins ago" },
        { provider: "Twitter / X", name: "@FluxoraApp", avatar: "FX", status: "Active", lastRefreshed: "12 mins ago" },
        { provider: "Facebook", name: "Fluxora Social", avatar: "FS", status: "Active", lastRefreshed: "1 hour ago" },
      ]);
    }
  };

  useEffect(() => {
    fetchConnectedAccounts();
  }, []);

  // Active workflows mock
  const [activeWorkflows, setActiveWorkflows] = useState<ActiveWorkflow[]>([
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

  const clearLogs = () => setActivityLogs([]);

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
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([
    { id: "cal-1", channel: "linkedin", title: "Announcing Enterprise Scaling", time: "09:00", day: "Mon" },
    { id: "cal-2", channel: "twitter", title: "ClickHouse Ingestion Benchmark results", time: "11:30", day: "Tue" },
    { id: "cal-3", channel: "facebook", title: "Global Marketing Strategy Update", time: "15:00", day: "Thu" },
    { id: "cal-4", channel: "linkedin", title: "Automations Deep Dive Article", time: "10:00", day: "Fri" },
  ]);

  // Media Library states
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([
    { id: "m-1", name: "campaign_banner.png", type: "Image", size: "2.4 MB", date: "2026-06-14", views: 4200, url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80" },
    { id: "m-2", name: "intro_explainer.mp4", type: "Video", size: "45.1 MB", date: "2026-06-13", views: 12800, url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80" },
    { id: "m-3", name: "infographic_v2.png", type: "Image", size: "1.8 MB", date: "2026-06-15", views: 980, url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80" },
    { id: "m-4", name: "team_photo.jpg", type: "Image", size: "3.2 MB", date: "2026-06-10", views: 150, url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80" },
  ]);

  // AI Workspace states
  const [aiChatQuery, setAiChatQuery] = useState("");
  const [aiChatHistory, setAiChatHistory] = useState<ChatMessage[]>([
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
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppContext.Provider
      value={{
        activeWorkspace,
        setActiveWorkspace,
        selectedChannels,
        setSelectedChannels,
        personalHubSection,
        setPersonalHubSection,
        studioSubTab,
        setStudioSubTab,
        integrationsSubTab,
        setIntegrationsSubTab,
        agentSubTab,
        setAgentSubTab,
        automationsSubTab,
        setAutomationsSubTab,
        settingsSidebarSubTab,
        setSettingsSidebarSubTab,
        maintenanceEnabled,
        setMaintenanceEnabled,
        topPostsFilter,
        setTopPostsFilter,
        isExportingPdf,
        setIsExportingPdf,
        
        workspaces,
        connectedAccounts,
        fetchConnectedAccounts,
        activeWorkflows,
        setActiveWorkflows,
        activityLogs,
        setActivityLogs,
        clearLogs,
        
        metrics,
        loadingMetrics,
        fetchMetrics,
        
        simPlatform,
        setSimPlatform,
        simEventType,
        setSimEventType,
        simulating,
        simulateEvent,
        
        drawerOpen,
        setDrawerOpen,
        composerContent,
        setComposerContent,
        scheduledAt,
        setScheduledAt,
        staggerMinutes,
        setStaggerMinutes,
        linkedinOverride,
        setLinkedinOverride,
        twitterOverride,
        setTwitterOverride,
        facebookOverride,
        setFacebookOverride,
        composerSubmitting,
        composerStatus,
        setComposerStatus,
        showComposerOverrides,
        setShowComposerOverrides,
        handleScheduleSubmit,
        
        calendarItems,
        setCalendarItems,
        mediaItems,
        setMediaItems,
        
        aiChatQuery,
        setAiChatQuery,
        aiChatHistory,
        setAiChatHistory,
        brandVoice,
        setBrandVoice,
        promptLibrary,
        handleAiChatSubmit,
        handleChipAction,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
