"use client";

import React from "react";
import { AppProvider, useAppContext } from "@/context/AppContext";
import AppShell from "@/components/AppShell";
import { usePathname, useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ChannelSelector from "@/components/ChannelSelector";
import FeedbackWidget from "@/components/FeedbackWidget";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Extract activeTab from pathname
  // e.g. pathname = "/dashboard" -> activeTab = "dashboard"
  // pathname = "/" -> activeTab = "dashboard" (redirected or default)
  const segments = pathname.split("/").filter(Boolean);
  const activeTab = segments[0] || "dashboard";

  const {
    workspaces,
    activeWorkspace,
    setActiveWorkspace,
    connectedAccounts,
    activityLogs,
    clearLogs,
    maintenanceEnabled,
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
    showComposerOverrides,
    setShowComposerOverrides,
    handleScheduleSubmit,
    selectedChannels,
    setSelectedChannels,
  } = useAppContext();

  const handleTabChange = (tabId: string) => {
    router.push(`/${tabId}`);
  };

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={handleTabChange}
      workspaces={workspaces}
      activeWorkspace={activeWorkspace}
      onWorkspaceChange={setActiveWorkspace}
      connectedAccounts={connectedAccounts}
      activityLogs={activityLogs}
      onClearLogs={clearLogs}
      maintenanceEnabled={maintenanceEnabled}
    >
      {/* Page Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          {children}
        </motion.div>
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
              className="relative w-full max-w-xl h-full bg-[#121218] border-l border-white/[0.08] shadow-2xl flex flex-col overflow-hidden text-white"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
                <div>
                  <h3 className="text-md font-bold text-white">Compose Omnichannel Campaign</h3>
                  <p className="text-[11px] text-[#A1A1AA] mt-0.5">Stagger launch times across secure workspace channels.</p>
                </div>
                <button
                  type="button"
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

                {/* Message Content */}
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
      <FeedbackWidget />
    </AppShell>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AppProvider>
  );
}
