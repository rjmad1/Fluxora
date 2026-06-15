"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from "lucide-react";

interface NavigationItem {
  id: string;
  name: string;
  icon: keyof typeof Icons;
  label?: string;
}

interface AppShellProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  workspaces: Array<{ id: string; name: string; region: string }>;
  activeWorkspace: string;
  onWorkspaceChange: (wsName: string) => void;
  connectedAccounts: Array<{ provider: string; name: string; avatar: string; status: string; lastRefreshed: string }>;
  activityLogs: Array<{ id: string; timestamp: string; level: string; msg: string }>;
  onClearLogs?: () => void;
  maintenanceEnabled?: boolean;
}

export default function AppShell({
  children,
  activeTab,
  onTabChange,
  workspaces,
  activeWorkspace,
  onWorkspaceChange,
  connectedAccounts,
  activityLogs,
  onClearLogs,
  maintenanceEnabled = false,
}: AppShellProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Resize handler for responsive behaviors
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setIsTablet(w >= 768 && w < 1440);
      
      if (w < 768) {
        setSidebarExpanded(false);
        setRightPanelOpen(false);
      } else if (w < 1440) {
        setSidebarExpanded(false);
        setRightPanelOpen(false);
      } else {
        setSidebarExpanded(true);
        setRightPanelOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navItems: NavigationItem[] = [
    { id: "dashboard", name: "Dashboard", icon: "LayoutDashboard" },
    { id: "personal-hub", name: "Personal Hub", icon: "Brain" },
    { id: "calendar", name: "Calendar", icon: "Calendar" },
    { id: "agent", name: "AI Agent", icon: "Sparkles" },
    { id: "studio", name: "Content Studio", icon: "FileEdit" },
    { id: "ab-testing", name: "A/B Testing", icon: "Split" },
    { id: "listening", name: "Social Listening", icon: "Volume2" },
    { id: "trend-predictor", name: "Trend & Virality", icon: "Flame" },
    { id: "community-crm", name: "Community Inbox", icon: "MessagesSquare" },
    { id: "advocacy", name: "Employee Advocacy", icon: "Users" },
    { id: "link-shortener", name: "Link Shortener", icon: "Link" },
    { id: "ugc-video", name: "UGC Video", icon: "Video" },
    { id: "media", name: "Media Library", icon: "Image" },
    { id: "analytics", name: "Analytics", icon: "TrendingUp" },
    { id: "automations", name: "Automations", icon: "Cpu" },
    { id: "compliance", name: "Compliance & Logs", icon: "ShieldAlert" },
    { id: "integrations", name: "Integrations", icon: "Grid" },
    { id: "workspace", name: "Workspace", icon: "Layers" },
    { id: "settings", name: "Settings", icon: "Settings" },
  ];

  const bottomItems: NavigationItem[] = [
    { id: "help", name: "Help", icon: "HelpCircle" },
    { id: "billing", name: "Billing", icon: "CreditCard" },
    { id: "profile", name: "Profile", icon: "User" },
  ];

  const renderIcon = (name: keyof typeof Icons, className = "w-5 h-5") => {
    const IconComponent = Icons[name] as React.ComponentType<{ className?: string }>;
    return IconComponent ? <IconComponent className={className} /> : null;
  };

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-[#FFFFFF] font-sans flex flex-col overflow-hidden">
      {/* Global Server Maintenance Banner */}
      {maintenanceEnabled && (
        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/35 to-amber-500/20 border-b border-yellow-500/30 px-6 py-2 flex items-center justify-center gap-2 text-xs font-bold text-yellow-200 text-center animate-pulse z-50">
          <Icons.AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <span>⚠️ Server Status Alert: Scheduled maintenance in progress. Databases are in read-only sandbox replication mode.</span>
        </div>
      )}
      {/* Top Header */}
      <header className="h-16 border-b border-white/[0.08] bg-[#121218]/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Logo container with brand styling */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#8B5CF6] to-pink-500 flex items-center justify-center shadow-lg shadow-[#7C3AED]/20">
            <span className="font-extrabold text-lg text-white tracking-wider">F</span>
          </div>
          <div>
            <h1 className="text-md font-bold tracking-tight text-white flex items-center gap-2">
              Fluxora
              <span className="text-[9px] bg-[#7C3AED]/20 text-[#8B5CF6] px-1.5 py-0.5 rounded-full font-semibold border border-[#7C3AED]/30">Command Center</span>
            </h1>
            <p className="text-[9px] text-[#A1A1AA] font-mono tracking-widest uppercase">Social Media Blast</p>
          </div>
        </div>

        {/* Workspace Context Switcher & Collapsible Right Panel Control */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#A1A1AA] font-medium hidden sm:inline">Workspace Context:</span>
            <select
              className="bg-[#121218] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#7C3AED] text-white cursor-pointer"
              value={activeWorkspace}
              onChange={(e) => onWorkspaceChange(e.target.value)}
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.name}>
                  {ws.name}
                </option>
              ))}
            </select>
          </div>
          
          {!isMobile && (
            <button
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className="p-1.5 hover:bg-white/[0.04] border border-white/[0.08] rounded-lg text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
              title="Toggle right context panel"
            >
              {renderIcon("ChevronLeft", `w-4.5 h-4.5 transition-transform duration-200 ${rightPanelOpen ? "rotate-180" : ""}`)}
            </button>
          )}
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* Left Side Navigation (Desktop/Tablet) */}
        {!isMobile && (
          <motion.nav
            animate={{ width: sidebarExpanded ? 240 : 72 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex-shrink-0 border-r border-white/[0.08] bg-[#0B0B0F] flex flex-col justify-between p-4 overflow-y-auto overflow-x-hidden relative group"
          >
            {/* Top Navigation Items */}
            <div className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold tracking-wide transition-all duration-150 relative cursor-pointer group ${
                      isActive
                        ? "text-white bg-[#121218] shadow-inner shadow-[#7C3AED]/5"
                        : "text-[#A1A1AA] hover:text-white hover:bg-white/[0.02]"
                    }`}
                  >
                    {/* Left Indicator bar */}
                    {isActive && (
                      <motion.div
                        layoutId="active-indicator"
                        className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[#7C3AED] rounded-r-md shadow-lg shadow-[#7C3AED]/50"
                      />
                    )}
                    
                    {/* Icon with glow active state */}
                    <div className={`${isActive ? "text-[#8B5CF6] drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]" : "text-[#A1A1AA]/60 group-hover:text-white"} transition-colors`}>
                      {renderIcon(item.icon)}
                    </div>

                    {sidebarExpanded && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="truncate"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom Rails & Collapse Toggle */}
            <div className="space-y-4 pt-4 border-t border-white/[0.08]">
              <div className="space-y-1.5">
                {bottomItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      activeTab === item.id
                        ? "text-white bg-[#121218]"
                        : "text-[#A1A1AA] hover:text-white hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="text-[#A1A1AA]/60">{renderIcon(item.icon)}</div>
                    {sidebarExpanded && <span>{item.name}</span>}
                  </button>
                ))}
              </div>

              {/* Sidebar Expand Toggle */}
              <button
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[#A1A1AA] hover:text-white hover:bg-white/[0.02] text-xs font-semibold transition-colors cursor-pointer"
              >
                <div>
                  {renderIcon(sidebarExpanded ? "ChevronLeft" : "ChevronRight")}
                </div>
                {sidebarExpanded && <span>Collapse</span>}
              </button>
            </div>
          </motion.nav>
        )}

        {/* Main Work Area */}
        <main className="flex-1 overflow-y-auto px-6 py-6 max-w-[1600px] mx-auto w-full space-y-6">
          {children}
        </main>

        {/* Right Context Panel (Desktop / Collapsible) */}
        {!isMobile && (
          <AnimatePresence>
            {rightPanelOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 340, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="flex-shrink-0 border-l border-white/[0.08] bg-[#0B0B0F] flex flex-col overflow-y-auto p-5 space-y-5"
              >
                {/* Connected Accounts Quick widget */}
                <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Target Channels</span>
                    <span className="text-[9px] bg-[#7C3AED]/20 text-[#8B5CF6] border border-[#7C3AED]/30 px-2 py-0.5 rounded-full font-mono font-semibold">Vault Secure</span>
                  </div>
                  
                  <div className="space-y-2.5">
                    {connectedAccounts.map((account) => (
                      <div
                        key={account.provider}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0B0F]/50 border border-white/[0.04] hover:border-white/[0.08] transition-all duration-150"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-[#121218] border border-white/[0.08] flex items-center justify-center font-bold text-[#A1A1AA] text-xs flex-shrink-0">
                            {account.avatar}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-[11px] font-semibold text-white truncate">{account.provider}</h4>
                            <p className="text-[9px] text-[#A1A1AA] truncate">{account.name}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="inline-block text-[8px] text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-1.5 py-0.2 rounded-md font-semibold">
                            Active
                          </span>
                          <p className="text-[8px] text-[#A1A1AA]/60 mt-0.5 font-mono">{account.lastRefreshed}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Suggestions / Recommendations Panel */}
                <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-4 shadow-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Icons.Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">AI Suggestions</span>
                  </div>
                  <div className="p-3 bg-[#0B0B0F]/60 border border-white/[0.04] rounded-xl text-[11px] text-[#A1A1AA] leading-relaxed">
                    💡 Your LinkedIn engagement is up <strong>12%</strong>. The best posting window for your tech audience is <strong>9:00 AM – 11:00 AM</strong>.
                  </div>
                  <div className="p-3 bg-[#0B0B0F]/60 border border-white/[0.04] rounded-xl text-[11px] text-[#A1A1AA] leading-relaxed">
                    📝 Consider adding <strong>#marketingtech</strong> to increase reach on X/Twitter by ~18%.
                  </div>
                </div>

                {/* Audit Logs */}
                <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-4 shadow-xl flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Audit logs</span>
                    {onClearLogs && (
                      <button
                        onClick={onClearLogs}
                        className="text-[9px] text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="flex-1 bg-[#0B0B0F]/50 border border-white/[0.04] rounded-xl p-3 font-mono text-[9px] text-[#A1A1AA] overflow-y-auto space-y-2 max-h-[200px] xl:max-h-[300px]">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="leading-relaxed">
                        <span className="text-[#A1A1AA]/40">[{log.timestamp}]</span>{" "}
                        <span className={log.level === "AUDIT" ? "text-[#8B5CF6]" : "text-[#7C3AED]"}>
                          {log.level}
                        </span>{" "}
                        {log.msg}
                      </div>
                    ))}
                    {activityLogs.length === 0 && (
                      <div className="text-[#A1A1AA]/40 italic text-center py-4">No log records yet...</div>
                    )}
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Bottom Navigation Rail (Mobile Only) */}
      {isMobile && (
        <nav className="h-16 border-t border-white/[0.08] bg-[#0B0B0F] flex items-center justify-around px-4 sticky bottom-0 z-40">
          {navItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all cursor-pointer ${
                activeTab === item.id ? "text-[#8B5CF6]" : "text-[#A1A1AA]"
              }`}
            >
              {renderIcon(item.icon, "w-5 h-5")}
              <span className="text-[9px] font-medium mt-1">{item.name.split(" ")[0]}</span>
            </button>
          ))}
          {/* Settings Tab on mobile */}
          <button
            onClick={() => onTabChange("settings")}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all cursor-pointer ${
              activeTab === "settings" ? "text-[#8B5CF6]" : "text-[#A1A1AA]"
            }`}
          >
            {renderIcon("Settings", "w-5 h-5")}
            <span className="text-[9px] font-medium mt-1">Settings</span>
          </button>
        </nav>
      )}
    </div>
  );
}
