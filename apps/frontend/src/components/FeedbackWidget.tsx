"use client";

import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface FeedbackPayload {
  type: "BUG" | "FEATURE";
  title: string;
  description: string;
  url: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  metadata: {
    userAgent: string;
    screenResolution: string;
    consoleLogs: string[];
    networkLog: string[];
    timestamp: string;
  };
  screenshot: string | null;
}

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"BUG" | "FEATURE">("BUG");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [consoleBuffer, setConsoleBuffer] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Hook console.error to capture error logs for metadata
  useEffect(() => {
    const handleConsoleError = (msg: string) => {
      setConsoleBuffer((prev) => [...prev.slice(-19), `[ERROR] ${msg}`]);
    };

    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const msg = args.map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x))).join(" ");
      handleConsoleError(msg);
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    // Capture standard browser metadata
    const payload: FeedbackPayload = {
      type: feedbackType,
      title: title || `${feedbackType} report on ${window.location.pathname}`,
      description,
      url: window.location.href,
      priority,
      metadata: {
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        consoleLogs: consoleBuffer,
        networkLog: [
          `GET ${window.location.pathname} - Completed`,
          `API Fetch init at ${new Date().toISOString()}`
        ],
        timestamp: new Date().toISOString(),
      },
      screenshot: null, // Zero-dependency placeholder
    };

    try {
      const res = await fetch("http://localhost:3000/api/v1/feedback/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-id": "workspace-default-dev" // Default local workspace context
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSubmitStatus({ type: "success", msg: "Feedback submitted successfully! Auto-triage queued." });
        setTitle("");
        setDescription("");
        setTimeout(() => setIsOpen(false), 2000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setSubmitStatus({ type: "error", msg: errorData.message || "Failed to submit feedback." });
      }
    } catch (err: any) {
      setSubmitStatus({ type: "error", msg: `API Connection error: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white p-3.5 rounded-full shadow-lg shadow-[#7C3AED]/30 cursor-pointer border border-white/10 hover:brightness-110 transition"
        title="Submit Feedback / Report Bug"
      >
        <Icons.MessageSquarePlus className="w-5 h-5" />
        <span className="text-xs font-semibold pr-1">DevFlow Widget</span>
      </motion.button>

      {/* Widget Dialog */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-80 bg-[#121218]/90 border border-white/[0.08] backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden p-5 text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Icons.Bug className="w-4 h-4 text-[#8B5CF6]" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">Submit DevFlow Intake</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-0.5 hover:bg-white/[0.04] rounded text-[#A1A1AA] hover:text-white transition cursor-pointer"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>

            {/* Type selector Tabs */}
            <div className="flex bg-[#0B0B0F] p-0.5 rounded-lg border border-white/[0.04] mb-4">
              <button
                type="button"
                onClick={() => setFeedbackType("BUG")}
                className={`flex-1 text-center py-1.5 text-[11px] font-semibold rounded-md transition cursor-pointer ${
                  feedbackType === "BUG" ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-white"
                }`}
              >
                Report Bug
              </button>
              <button
                type="button"
                onClick={() => setFeedbackType("FEATURE")}
                className={`flex-1 text-center py-1.5 text-[11px] font-semibold rounded-md transition cursor-pointer ${
                  feedbackType === "FEATURE" ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-white"
                }`}
              >
                Request Feature
              </button>
            </div>

            {/* Ingestion form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[9px] uppercase font-bold text-[#A1A1AA] tracking-wider">Summary Title</label>
                <input
                  type="text"
                  required
                  placeholder="Short summary of issue..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#0B0B0F] border border-white/[0.08] rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] uppercase font-bold text-[#A1A1AA] tracking-wider">Description Details</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide context, details, or reproduction steps..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#0B0B0F] border border-white/[0.08] rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#7C3AED] resize-none"
                />
              </div>

              {feedbackType === "BUG" && (
                <div className="space-y-1">
                  <label className="block text-[9px] uppercase font-bold text-[#A1A1AA] tracking-wider">Priority Severity</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-[#0B0B0F] border border-white/[0.08] rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#7C3AED] cursor-pointer"
                  >
                    <option value="LOW">Low (Cosmetic/Typo)</option>
                    <option value="MEDIUM">Medium (Minor bug)</option>
                    <option value="HIGH">High (Major feature block)</option>
                    <option value="CRITICAL">Critical (Crash/Data leakage)</option>
                  </select>
                </div>
              )}

              {/* Console logs count preview */}
              <div className="flex justify-between text-[9px] text-[#A1A1AA] bg-[#0B0B0F]/50 p-2 rounded-lg border border-white/[0.02]">
                <span>Logged errors captured:</span>
                <span className="font-mono text-[#EF4444] font-semibold">{consoleBuffer.length} errors</span>
              </div>

              {submitStatus && (
                <div className={`p-2.5 rounded-lg border text-[11px] font-mono leading-relaxed ${
                  submitStatus.type === "success"
                    ? "bg-[#22C55E]/10 border-[#22C55E]/20 text-[#22C55E]"
                    : "bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]"
                }`}>
                  {submitStatus.msg}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer flex justify-center items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting to DevFlow...</span>
                  </>
                ) : (
                  <>
                    <Icons.Send className="w-3.5 h-3.5" />
                    <span>Submit Report</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
