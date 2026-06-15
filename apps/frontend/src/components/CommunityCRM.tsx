"use client";

import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Reply {
  id: string;
  sender: string;
  body: string;
  timestamp: string;
}

interface InboxMessage {
  id: string;
  platform: string;
  type: "comment" | "dm" | "review";
  sender: string;
  body: string;
  sentiment: "positive" | "negative" | "neutral";
  assignedTo?: string;
  timestamp: string;
  replies: Reply[];
}

interface CommunityCRMProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
}

const QUICK_REPLIES = [
  { label: "Generic Thank You", text: "Thank you for reaching out! We appreciate your feedback and are thrilled to hear you are enjoying the platform. Let us know if you need anything else! 🚀" },
  { label: "Technical Support Route", text: "Thanks for reporting this. We have routed this issue to our SRE infrastructure team to inspect our sandbox databases and RLS sync logs. We will update you shortly." },
  { label: "Feature Request Acknowledged", text: "Great question! This feature request is on our active engineering roadmap. Stay tuned for our upcoming release cycle updates." },
];

const TEAM_MEMBERS = ["Elena Rostova", "Sarah Jenkins", "Alex Mercer", "Dave K.", "Unassigned"];

export default function CommunityCRM({ onNotify }: CommunityCRMProps) {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [platformFilter, setPlatformFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  
  // Reply and assign states
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/v1/extended/inbox/messages", {
        headers: { "X-Tenant-ID": "Fluxora-Tenant-098", "X-Workspace-ID": "ws-1" },
      });
      if (!res.ok) throw new Error("Offline");
      const data = await res.json();
      setMessages(data);
      if (data.length > 0 && !selectedMessage) {
        setSelectedMessage(data[0]);
      }
    } catch {
      // Fallback
      const fallback = [
        {
          id: "msg-1",
          platform: "linkedin",
          type: "comment" as const,
          sender: "David Chen",
          body: "How does the Kafka fallback behavior handle partitioned queue offline events? Is there a local disk spooling queue?",
          sentiment: "neutral" as const,
          assignedTo: "Elena Rostova",
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          replies: [
            { id: "r-1", sender: "Elena Rostova", body: "We spool event batches locally to JSON log buffers before retrying the ClickHouse ingest stream!", timestamp: new Date(Date.now() - 3600000 * 1).toISOString() }
          ]
        },
        {
          id: "msg-2",
          platform: "twitter",
          type: "dm" as const,
          sender: "@tech_growth_hub",
          body: "Just checked out the scaling simulator, absolutely incredible performance dashboards! The transition animations are gorgeous.",
          sentiment: "positive" as const,
          assignedTo: "Sarah Jenkins",
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
          replies: []
        },
        {
          id: "msg-3",
          platform: "facebook",
          type: "review" as const,
          sender: "Security Auditor Team",
          body: "Found potential token refresh warning errors in the audit trail during maintenance mode. Is RLS fully separating workspace connections?",
          sentiment: "negative" as const,
          assignedTo: "Alex Mercer",
          timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
          replies: []
        }
      ];
      setMessages(fallback);
      if (!selectedMessage) {
        setSelectedMessage(fallback[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || !replyText.trim()) return;
    setSendingReply(true);

    try {
      const res = await fetch("http://localhost:3000/api/v1/extended/inbox/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": "Fluxora-Tenant-098",
          "X-Workspace-ID": "ws-1",
        },
        body: JSON.stringify({ messageId: selectedMessage.id, replyText }),
      });
      if (!res.ok) throw new Error("Offline");
      const updatedMsg = await res.json();
      
      setMessages((prev) => prev.map((m) => (m.id === selectedMessage.id ? updatedMsg : m)));
      setSelectedMessage(updatedMsg);
      setReplyText("");
      onNotify("Reply submitted and synchronized.", "AUDIT");
    } catch {
      // Offline implementation
      const newReply = {
        id: `r-${Date.now()}`,
        sender: "Command Center Admin",
        body: replyText,
        timestamp: new Date().toISOString(),
      };
      const updatedMsg = {
        ...selectedMessage,
        replies: [...selectedMessage.replies, newReply]
      };
      setMessages((prev) => prev.map((m) => (m.id === selectedMessage.id ? updatedMsg : m)));
      setSelectedMessage(updatedMsg);
      setReplyText("");
      onNotify("Demo Mode: Reply spooled locally", "AUDIT");
    } finally {
      setSendingReply(false);
    }
  };

  const handleAssignMember = async (member: string) => {
    if (!selectedMessage) return;
    const assignment = member === "Unassigned" ? undefined : member;

    try {
      const res = await fetch("http://localhost:3000/api/v1/extended/inbox/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": "Fluxora-Tenant-098",
          "X-Workspace-ID": "ws-1",
        },
        body: JSON.stringify({ messageId: selectedMessage.id, assignedTo: assignment || "" }),
      });
      if (!res.ok) throw new Error("Offline");
      const updatedMsg = await res.json();

      setMessages((prev) => prev.map((m) => (m.id === selectedMessage.id ? updatedMsg : m)));
      setSelectedMessage(updatedMsg);
      onNotify(`Assigned conversation to ${member}`, "INFO");
    } catch {
      const updatedMsg = { ...selectedMessage, assignedTo: assignment };
      setMessages((prev) => prev.map((m) => (m.id === selectedMessage.id ? updatedMsg : m)));
      setSelectedMessage(updatedMsg);
      onNotify(`Demo Mode: Assigned locally to ${member}`, "INFO");
    }
  };

  const filteredMessages = messages.filter((m) => {
    const matchesPlatform = platformFilter === "All" || m.platform.toLowerCase() === platformFilter.toLowerCase();
    const matchesType = typeFilter === "All" || m.type.toLowerCase() === typeFilter.toLowerCase();
    return matchesPlatform && matchesType;
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "linkedin":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-500">
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
            <rect x="2" y="9" width="4" height="12" />
            <circle cx="4" cy="4" r="2" />
          </svg>
        );
      case "twitter":
      case "x":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-sky-400">
            <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-indigo-500">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
          </svg>
        );
    }
  };

  const getSentimentColors = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "negative":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      default:
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <Icons.Inbox className="w-8 h-8 text-[#8B5CF6]" />
          <span>Interactive Community Engagement CRM</span>
        </h2>
        <p className="text-xs text-[#A1A1AA] mt-1">
          Review cross-platform comments, direct messages, and reviews with automatic sentiment flags and response routing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px] items-stretch">
        
        {/* Left Inbox List Column (5/12) */}
        <div className="lg:col-span-5 bg-[#121218] border border-white/[0.08] rounded-2xl flex flex-col overflow-hidden shadow-xl">
          {/* Filters Bar */}
          <div className="p-4 border-b border-white/[0.08] space-y-3 bg-[#0B0B0F]/40">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase text-white font-bold tracking-wider">Cross-Platform Inbox</span>
              <button
                onClick={fetchInbox}
                className="p-1 hover:bg-white/[0.04] border border-white/[0.08] rounded text-[#A1A1AA] hover:text-white"
              >
                <Icons.RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
            
            <div className="flex gap-2">
              {/* Platform Selector */}
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer flex-1"
              >
                <option value="All">All Platforms</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Twitter">Twitter / X</option>
                <option value="Facebook">Facebook</option>
              </select>

              {/* Type Selector */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer flex-1"
              >
                <option value="All">All Types</option>
                <option value="comment">Comments</option>
                <option value="dm">DMs</option>
                <option value="review">Reviews</option>
              </select>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04] p-3 space-y-2">
            {filteredMessages.map((msg) => {
              const isSelected = selectedMessage?.id === msg.id;
              return (
                <button
                  key={msg.id}
                  onClick={() => {
                    setSelectedMessage(msg);
                    setReplyText("");
                  }}
                  className={`w-full text-left p-3.5 rounded-xl transition flex flex-col gap-2 border ${
                    isSelected
                      ? "bg-[#7C3AED]/15 border-[#7C3AED]/40 shadow-inner"
                      : "bg-[#0B0B0F]/30 border-transparent hover:border-white/[0.06] hover:bg-white/[0.01]"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#121218] border border-white/[0.08] p-1 rounded-md">
                        {getPlatformIcon(msg.platform)}
                      </span>
                      <span className="text-xs font-bold text-white truncate max-w-[120px]">{msg.sender}</span>
                      <span className="text-[9px] uppercase bg-white/[0.04] text-[#A1A1AA] px-1.5 py-0.2 rounded font-semibold font-mono">
                        {msg.type}
                      </span>
                    </div>
                    <span className="text-[9px] text-[#A1A1AA]/60 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#A1A1AA] line-clamp-2 leading-relaxed">
                    {msg.body}
                  </p>

                  <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-white/[0.02] w-full">
                    {/* Sentiment */}
                    <span className={`text-[8.5px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide flex items-center gap-1 ${getSentimentColors(msg.sentiment)}`}>
                      <span className={`w-1 h-1 rounded-full ${
                        msg.sentiment === "positive" ? "bg-emerald-400" : msg.sentiment === "negative" ? "bg-rose-400" : "bg-blue-400"
                      }`} />
                      {msg.sentiment}
                    </span>

                    {/* Owner Tag */}
                    {msg.assignedTo && (
                      <span className="text-[9px] text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md font-mono">
                        👤 {msg.assignedTo}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {filteredMessages.length === 0 && (
              <div className="text-center py-12 text-xs text-[#A1A1AA]/50 italic">
                No inbox threads match filters.
              </div>
            )}
          </div>
        </div>

        {/* Right Detail Pane Column (7/12) */}
        <div className="lg:col-span-7 bg-[#121218] border border-white/[0.08] rounded-2xl flex flex-col overflow-hidden shadow-xl">
          {selectedMessage ? (
            <div className="flex flex-col h-full">
              {/* Header info */}
              <div className="p-4 border-b border-white/[0.08] bg-[#0B0B0F]/40 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="bg-[#121218] border border-white/[0.08] p-1.5 rounded-lg">
                    {getPlatformIcon(selectedMessage.platform)}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      {selectedMessage.sender}
                      <span className={`text-[8.5px] px-2 py-0.2 rounded-full font-bold uppercase ${getSentimentColors(selectedMessage.sentiment)}`}>
                        {selectedMessage.sentiment}
                      </span>
                    </h4>
                    <span className="text-[9px] text-[#A1A1AA]/60">Platform: {selectedMessage.platform} | Channel: {selectedMessage.type}</span>
                  </div>
                </div>

                {/* Team Assignment Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#A1A1AA] font-bold">Assignee:</span>
                  <select
                    value={selectedMessage.assignedTo || "Unassigned"}
                    onChange={(e) => handleAssignMember(e.target.value)}
                    className="bg-[#0B0B0F] border border-white/[0.08] text-white text-[11px] rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                  >
                    {TEAM_MEMBERS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chat Timeline (Scrollable area) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0B0B0F]/10">
                {/* Incoming Post */}
                <div className="flex gap-3 items-start max-w-[85%]">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center font-bold text-xs text-[#A1A1AA] flex-shrink-0">
                    {selectedMessage.sender[0]}
                  </div>
                  <div className="bg-[#121218] border border-white/[0.06] p-3 rounded-2xl rounded-tl-none shadow-md">
                    <p className="text-xs text-white leading-relaxed">{selectedMessage.body}</p>
                    <span className="text-[8px] text-[#A1A1AA]/50 font-mono mt-1.5 block">
                      {new Date(selectedMessage.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Replies Thread */}
                {selectedMessage.replies.map((reply) => {
                  const isAdmin = reply.sender === "Command Center Admin";
                  return (
                    <div
                      key={reply.id}
                      className={`flex gap-3 items-start max-w-[85%] ${isAdmin ? "ml-auto flex-row-reverse" : ""}`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        isAdmin ? "bg-purple-600/30 border border-purple-500/20 text-[#8B5CF6]" : "bg-white/[0.04] border border-white/[0.08] text-[#A1A1AA]"
                      }`}>
                        {isAdmin ? "A" : reply.sender[0]}
                      </div>
                      <div className={`p-3 rounded-2xl shadow-md ${
                        isAdmin
                          ? "bg-[#7C3AED]/20 border border-[#7C3AED]/30 rounded-tr-none text-right"
                          : "bg-[#121218] border border-white/[0.06] rounded-tl-none text-left"
                      }`}>
                        <span className="text-[8.5px] text-[#8B5CF6] font-bold block mb-0.5">{reply.sender}</span>
                        <p className="text-xs text-white leading-relaxed">{reply.body}</p>
                        <span className="text-[8px] text-[#A1A1AA]/50 font-mono mt-1.5 block">
                          {new Date(reply.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CRM Reply Form Panel */}
              <div className="p-4 border-t border-white/[0.08] bg-[#0B0B0F]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase text-[#A1A1AA] font-bold tracking-wider">Quick Response Templates</span>
                  {/* Template Picker */}
                  <div className="flex gap-2">
                    {QUICK_REPLIES.map((r, idx) => (
                      <button
                        key={idx}
                        onClick={() => setReplyText((prev) => (prev ? prev + "\n" + r.text : r.text))}
                        className="bg-[#0B0B0F] border border-white/[0.08] hover:border-[#8B5CF6]/40 hover:text-white text-[9px] text-[#A1A1AA] px-2 py-1 rounded-md transition font-semibold"
                      >
                        + {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSendReply} className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type direct response here, or append quick template tags..."
                    className="flex-1 bg-[#0B0B0F] border border-white/[0.08] text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="bg-[#7C3AED] hover:bg-[#8B5CF6] disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
                  >
                    <Icons.Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#0B0B0F]/10">
              <Icons.MessagesSquare className="w-12 h-12 text-[#A1A1AA]/30 mb-2" />
              <h4 className="text-xs font-bold text-[#A1A1AA]">No thread selected</h4>
              <p className="text-[9px] text-[#A1A1AA]/60 mt-1">Select an inbox message on the left to start responding.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
