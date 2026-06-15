"use client";

import React, { useState } from "react";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DraftCampaign {
  id: string;
  title: string;
  assignee: string;
  status: "Draft" | "Pending Review" | "Approved" | "Scheduled";
  platforms: string[];
}

interface TeamMember {
  name: string;
  role: "Admin" | "Manager" | "Creator";
  email: string;
  status: string;
}

interface CommentEntry {
  author: string;
  time: string;
  text: string;
}

interface TeamHubProps {
  onNotify: (msg: string, level: "INFO" | "AUDIT" | "WARN") => void;
}

export default function TeamHub({ onNotify }: TeamHubProps) {
  const [activeTab, setActiveTab] = useState<"tasks" | "roles" | "history">("tasks");
  const [drafts, setDrafts] = useState<DraftCampaign[]>([
    { id: "dr-1", title: "Announcing ClickHouse Ingestion Sync", assignee: "David Lee (Creator)", status: "Pending Review", platforms: ["linkedin", "twitter"] },
    { id: "dr-2", title: "Enterprise Scaling Telemetry Infographics", assignee: "Anna Koval (Manager)", status: "Draft", platforms: ["instagram"] },
    { id: "dr-3", title: "Why Decoupled Observability Saves DB Load", assignee: "Sarah Jenkins (Admin)", status: "Approved", platforms: ["medium", "linkedin"] }
  ]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { name: "Sarah Jenkins", role: "Admin", email: "sarah.j@fluxora.io", status: "Active" },
    { name: "Anna Koval", role: "Manager", email: "anna.k@fluxora.io", status: "Active" },
    { name: "David Lee", role: "Creator", email: "david.l@fluxora.io", status: "Out of office" }
  ]);

  // Comments state for drafts
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>("dr-1");
  const [comments, setComments] = useState<Record<string, CommentEntry[]>>({
    "dr-1": [
      { author: "Anna Koval", time: "10:15 AM", text: "David, did you double-check the ClickHouse sync latency benchmarks?" },
      { author: "David Lee", time: "11:22 AM", text: "Yes, verified at 1.48s average lag under high bulk loads!" }
    ],
    "dr-2": [
      { author: "Sarah Jenkins", time: "09:00 AM", text: "Let's check with the branding guidelines for this Instagram banner." }
    ]
  });
  const [newCommentText, setNewCommentText] = useState("");

  // Role permissions
  const [rolePermissions, setRolePermissions] = useState({
    Admin: { publish: true, edit: true, delete: true, config: true },
    Manager: { publish: true, edit: true, delete: false, config: false },
    Creator: { publish: false, edit: true, delete: false, config: false }
  });

  // Logs stream
  const [activities, setActivities] = useState([
    { timestamp: "18:02:15", author: "Anna Koval", action: "Requested review for 'Announcing ClickHouse Ingestion Sync'" },
    { timestamp: "17:55:04", author: "Sarah Jenkins", action: "Approved draft 'Why Decoupled Observability Saves DB Load'" },
    { timestamp: "16:40:12", author: "David Lee", action: "Edited layers in 'Enterprise Scaling Telemetry Infographics'" }
  ]);

  const handleStatusChange = (id: string, nextStatus: DraftCampaign["status"]) => {
    setDrafts(prev => prev.map(d => {
      if (d.id === id) {
        onNotify(`Campaign approval status changed to "${nextStatus}" for "${d.title}"`, "AUDIT");
        // Log activity
        setActivities(acts => [
          { timestamp: new Date().toLocaleTimeString(), author: "Sarah Jenkins (Admin)", action: `Changed status of '${d.title}' to ${nextStatus}` },
          ...acts
        ]);
        return { ...d, status: nextStatus };
      }
      return d;
    }));
  };

  const handleAssigneeChange = (id: string, name: string) => {
    setDrafts(prev => prev.map(d => {
      if (d.id === id) {
        onNotify(`Reassigned "${d.title}" to ${name}`, "INFO");
        return { ...d, assignee: name };
      }
      return d;
    }));
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDraftId || !newCommentText.trim()) return;

    const entry: CommentEntry = {
      author: "Sarah Jenkins (Admin)",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: newCommentText
    };

    setComments(prev => ({
      ...prev,
      [selectedDraftId]: [...(prev[selectedDraftId] || []), entry]
    }));

    setNewCommentText("");
    onNotify("Added comment to draft discussion", "INFO");
  };

  const selectedDraft = drafts.find(d => d.id === selectedDraftId);
  const activeComments = selectedDraftId ? comments[selectedDraftId] || [] : [];

  return (
    <div className="bg-[#121218] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex justify-between items-center border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-pink-500 flex items-center justify-center">
            <Icons.Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Team Hub</h3>
            <p className="text-xs text-[#A1A1AA] mt-0.5">Manage assignments, roles permissions, and post approval flows.</p>
          </div>
        </div>

        {/* Subsection Switcher */}
        <div className="bg-[#0B0B0F] border border-white/[0.08] p-1 rounded-xl flex gap-1">
          {["tasks", "roles", "history"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                activeTab === tab ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-white"
              }`}
            >
              {tab === "tasks" ? "Approval Pipeline" : tab === "roles" ? "Role Profiles" : "Team Activity"}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "tasks" && (
          <motion.div
            key="tasks"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Drafts Pipelines */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Campaign Drafts & Status Control</h4>
              <div className="space-y-3">
                {drafts.map(draft => (
                  <div
                    key={draft.id}
                    onClick={() => setSelectedDraftId(draft.id)}
                    className={`p-4 bg-[#0B0B0F]/50 border rounded-xl cursor-pointer transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      selectedDraftId === draft.id ? "border-[#7C3AED]" : "border-white/[0.04] hover:border-white/[0.08]"
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                          draft.status === "Approved"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : draft.status === "Pending Review"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                            : "bg-[#7C3AED]/10 text-[#8B5CF6] border border-[#7C3AED]/20"
                        }`}>
                          {draft.status}
                        </span>
                        <div className="flex gap-1.5">
                          {draft.platforms.map(p => (
                            <span key={p} className="text-[9px] text-[#A1A1AA] capitalize font-semibold">{p}</span>
                          ))}
                        </div>
                      </div>
                      <h4 className="text-xs font-bold text-white truncate">{draft.title}</h4>
                    </div>

                    {/* Interaction Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={draft.assignee}
                        onChange={e => handleAssigneeChange(draft.id, e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="bg-[#121218] border border-white/[0.08] text-white text-[10px] rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none"
                      >
                        {teamMembers.map(m => (
                          <option key={m.name} value={`${m.name} (${m.role})`}>
                            {m.name.split(" ")[0]}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-1">
                        {draft.status === "Draft" && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleStatusChange(draft.id, "Pending Review");
                            }}
                            className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-[9px] font-bold px-2 py-1 rounded-lg transition cursor-pointer"
                          >
                            Submit Review
                          </button>
                        )}
                        {draft.status === "Pending Review" && (
                          <>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleStatusChange(draft.id, "Approved");
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-bold px-2 py-1 rounded-lg transition cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleStatusChange(draft.id, "Draft");
                              }}
                              className="bg-red-650 hover:bg-red-550 text-white text-[9px] font-bold px-2 py-1 rounded-lg transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comment Sidebar */}
            <div className="bg-[#0B0B0F]/60 border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between h-[340px]">
              <div>
                <h4 className="text-[10px] font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Icons.MessageSquare className="w-4 h-4 text-[#8B5CF6]" />
                  <span>Discussion: {selectedDraft ? selectedDraft.title.slice(0, 20) + "..." : "Select draft"}</span>
                </h4>
                
                <div className="space-y-2.5 overflow-y-auto max-h-[200px] pr-1.5">
                  {activeComments.map((comment, index) => (
                    <div key={index} className="text-xs space-y-0.5 p-2 bg-[#121218]/80 border border-white/[0.03] rounded-lg">
                      <div className="flex justify-between items-center text-[9px] text-[#A1A1AA] font-mono">
                        <span className="font-bold text-[#8B5CF6]">{comment.author.split(" ")[0]}</span>
                        <span>{comment.time}</span>
                      </div>
                      <p className="text-white leading-relaxed">{comment.text}</p>
                    </div>
                  ))}
                  {activeComments.length === 0 && (
                    <p className="text-center text-[10px] text-[#A1A1AA] italic py-6">No internal remarks posted yet.</p>
                  )}
                </div>
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2 border-t border-white/[0.04] pt-3 mt-3">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={e => setNewCommentText(e.target.value)}
                  placeholder="Post comments to creator..."
                  className="flex-1 bg-[#121218] border border-white/[0.08] text-xs text-white rounded-lg px-3 py-2 focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white px-3 py-2 rounded-lg transition flex items-center justify-center cursor-pointer"
                >
                  <Icons.Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {activeTab === "roles" && (
          <motion.div
            key="roles"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(rolePermissions).map(([roleName, perms]) => (
                <div key={roleName} className="bg-[#0B0B0F]/50 border border-white/[0.06] rounded-xl p-5 space-y-4">
                  <div className="border-b border-white/[0.04] pb-3 flex justify-between items-center">
                    <h4 className="text-xs font-bold text-white uppercase">{roleName} Profile</h4>
                    <span className="text-[9px] text-[#8B5CF6] font-mono">Permission Switch</span>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(perms).map(([permName, isAllowed]) => (
                      <label key={permName} className="flex items-center justify-between text-xs cursor-pointer select-none">
                        <span className="capitalize text-[#A1A1AA]">{permName.replace("config", "Admin Settings").replace("publish", "Direct Publish").replace("edit", "Edit Drafts").replace("delete", "Delete Drafts")}</span>
                        <input
                          type="checkbox"
                          checked={isAllowed}
                          onChange={() => {
                            setRolePermissions(prev => ({
                              ...prev,
                              [roleName]: {
                                ...(prev[roleName as keyof typeof rolePermissions] as any),
                                [permName]: !isAllowed
                              }
                            }));
                            onNotify(`Modified permissions profile for role: ${roleName}`, "WARN");
                          }}
                          className="rounded text-[#7C3AED] focus:ring-[#7C3AED] h-3.5 w-3.5 bg-slate-900 border-white/[0.08]"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-4"
          >
            <h4 className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Shared Activity Feed & Edit Logs</h4>
            <div className="bg-[#0B0B0F]/50 border border-white/[0.04] rounded-xl p-4 space-y-3.5 max-h-[300px] overflow-y-auto">
              {activities.map((act, index) => (
                <div key={index} className="flex gap-3 text-xs leading-relaxed">
                  <span className="text-[#A1A1AA]/50 font-mono">[{act.timestamp}]</span>
                  <div>
                    <strong className="text-white">{act.author}</strong>
                    <span className="text-[#A1A1AA] ml-1.5">{act.action}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
